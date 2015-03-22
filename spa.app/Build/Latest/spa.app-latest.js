ko.bindingHandlers["validation"] = {
    init: function (element, valueAccessor, allBindings, viewModel, bindingContext) {
        if (viewModel.validationErrors == null) {
            throw new spa.Exception("Property 'validationErrors' not found.");
        }
        var boundProperties = ko.unwrap(valueAccessor());
        if (boundProperties == null || boundProperties.length == 0) {
            return;
        }
        element.toggleClass("validation-errors", true);
        updateErrors(viewModel.validationErrors());
        function updateErrors(errors) {
            var visibleErrors = errors == null ? [] : errors.filter(function (error) { return boundProperties.contains(error.propertyName); }).map(function (error) { return error.errorText; });
            var currentErrorList = [];
            element.toggleClass("no-errors", visibleErrors.length == 0);
            for (var i = 0; i < element.children.length; i++) {
                var li = element.children[i];
                if (visibleErrors.contains(li.innerHTML)) {
                    if (li.classList.contains("hidden")) {
                        li.classList.remove("hidden");
                    }
                }
                else {
                    if (!li.classList.contains("hidden")) {
                        li.classList.add("hidden");
                    }
                }
                currentErrorList.push(li.innerHTML);
            }
            for (var i = 0; i < visibleErrors.length; i++) {
                if (currentErrorList.contains(visibleErrors[i])) {
                    continue;
                }
                var li = document.createElement("li");
                li.innerHTML = visibleErrors[i];
                li.classList.add("hidden");
                element.appendChild(li);
                showElement(li);
            }
        }
        function showElement(li) {
            setTimeout(function () {
                li.classList.remove("hidden");
            }, 100);
        }
        var subscription = viewModel.validationErrors.subscribe(function (errors) {
            updateErrors(errors);
        });
        ko.utils.domNodeDisposal.addDisposeCallback(element, function () {
            subscription.dispose();
        });
    }
};
var __extends = this.__extends || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
var spa;
(function (spa) {
    var DialogViewModel = (function () {
        function DialogViewModel(params, ready) {
            this.size = ko.observable();
            this.title = ko.observable();
        }
        DialogViewModel.prototype.close = function (result) {
        };
        DialogViewModel.prototype.show = function (closeCallback) {
        };
        DialogViewModel.prototype.dispose = function () {
        };
        return DialogViewModel;
    })();
    spa.DialogViewModel = DialogViewModel;
    var InputNumberDialog = (function (_super) {
        __extends(InputNumberDialog, _super);
        function InputNumberDialog() {
            _super.apply(this, arguments);
            this.value = ko.observable();
        }
        InputNumberDialog.prototype.okClick = function () {
            this.close(this.value());
        };
        InputNumberDialog.prototype.cancelClick = function () {
            this.close();
        };
        return InputNumberDialog;
    })(DialogViewModel);
    spa.InputNumberDialog = InputNumberDialog;
})(spa || (spa = {}));
var spa;
(function (spa) {
    var Application = (function () {
        function Application() {
            this._cachedRoutes = [];
            this._cachedLayouts = [];
            this._errorHandlers = [];
            this._firstPage = true;
            this._layoutHandlers = [];
            this._onroutechanged = new spa.Notification();
            this._pageHandlers = [];
            this._started = false;
            this.onBodyClick = this.onBodyClick.bind(this);
            this.onPopState = this.onPopState.bind(this);
            document.body.addEventListener("click", this.onBodyClick);
            window.onerror = function (errorMsg, url, lineNumber) {
                alert("{0} (строка {1}, {2}).".format(errorMsg, lineNumber, url));
            };
        }
        Object.defineProperty(Application.prototype, "onroutechanged", {
            // #region События
            get: function () {
                return this._onroutechanged;
            },
            enumerable: true,
            configurable: true
        });
        // #endregion
        // #region Маршрутизация
        Application.prototype.mapPage = function (pattern, handler) {
            this._pageHandlers.push({
                pattern: pattern.split("/").filter(function (x) { return !isNullOrWhiteSpace(x); }).map(function (x) { return x.trim(); }),
                handler: handler
            });
        };
        Application.prototype.mapLayout = function (handler) {
            this._layoutHandlers.push(handler);
        };
        Application.prototype.mapError = function (handler) {
            this._errorHandlers.push(handler);
        };
        Application.prototype.mapRegisteredPages = function () {
            var _this = this;
            spa.pages.items.forEach(function (config) {
                var pattern = config.route;
                if (pattern == null) {
                    pattern = config.name;
                }
                _this.mapPage(pattern, function (params) {
                    return {
                        page: config.name,
                        params: params
                    };
                });
            });
        };
        Application.prototype.mapAttributeRoutes = function () {
            var _this = this;
            var pageClasses = spa.getAttributeClasses(spa.RouteAttribute);
            pageClasses.forEach(function (pageClass) {
                var attribute = spa.getClassAttributes(pageClass).filter(function (x) { return x instanceof spa.RouteAttribute; })[0];
                _this.mapPage(attribute.url, function (params) {
                    return {
                        page: pageClass,
                        params: params
                    };
                });
            });
        };
        // #endregion
        // #region Обработка событий
        Application.prototype.onBodyClick = function (ev) {
            if (ev.target && ev.target.tagName && ev.target.tagName == "A") {
                var a = ev.target;
                if (a.target == "_blank") {
                    return;
                }
                var href = a.getAttribute("href");
                if (href == null || href.length == 0) {
                    return;
                }
                if (href.startsWith("http://")) {
                    return;
                }
                if (href.startsWith("mailto:")) {
                    return;
                }
                if (href == "#") {
                    return;
                }
                this.navigateUrl(href);
                ev.preventDefault();
                ev.stopPropagation();
                return false;
            }
        };
        Application.prototype.onPopState = function () {
            this.onRouteChanged();
        };
        // #endregion
        // #region Навигация
        /** Запуск приложения. */
        Application.prototype.start = function () {
            if (this._started) {
                return;
            }
            window.addEventListener("popstate", this.onPopState);
            this._started = true;
            this.onRouteChanged();
        };
        /** Остановка приложения. */
        Application.prototype.stop = function () {
            if (this._started) {
                window.removeEventListener("popstate", this.onPopState);
                this._started = false;
            }
        };
        /** Переход на страницу.
            @param pageNameOrClass Название зарегистрированной страницы, класс модели представления зарегистрированной страницы или класс-потомок Page.
            @param params Параметры конструктора.
        */
        Application.prototype.navigate = function (pageNameOrClass, params) {
            var pattern;
            if (typeof pageNameOrClass == "string") {
                var config = spa.pages.find(pageNameOrClass);
                if (config != null) {
                    pattern = isNullOrWhiteSpace(config.route) ? config.name : config.route;
                }
                if (isNullOrWhiteSpace(pageNameOrClass)) {
                    pattern = pageNameOrClass;
                }
            }
            else {
                var routeAttribute = spa.getClassAttributes(pageNameOrClass).filter(function (x) { return x instanceof spa.RouteAttribute; })[0];
                if (routeAttribute == null) {
                    for (var i = 0; i < spa.pages.items.length; i++) {
                        if (spa.pages.items[i].viewModel == pageNameOrClass) {
                            pattern = isNullOrWhiteSpace(spa.pages.items[i].route) ? spa.pages.items[i].name : spa.pages.items[i].route;
                            break;
                        }
                    }
                }
                else {
                    pattern = routeAttribute.url;
                }
                if (isNullOrWhiteSpace(pattern)) {
                    pattern = spa.getFunctionName(pageNameOrClass);
                }
            }
            this.navigateUrl(this.makeUrl(pattern, params));
        };
        /** Переход на указанный адрес.
            @param url Адрес страницы.
        */
        Application.prototype.navigateUrl = function (url) {
            var _this = this;
            if (isNullOrWhiteSpace(url)) {
                url = "/";
            }
            if (this._activePage != null) {
                this._activePage.hiding(function (cancel) {
                    if (!cancel) {
                        _this.openUrl(url);
                    }
                });
            }
            else {
                this.openUrl(url);
            }
        };
        /** Переход на предыдущую страницу. */
        Application.prototype.back = function () {
            history.back();
        };
        /** Переход на следующую страницу. */
        Application.prototype.forward = function () {
            history.forward();
        };
        /** Переход на домашнюю страницу. */
        Application.prototype.home = function () {
            this.navigateUrl("/");
        };
        Application.prototype.onRouteChanged = function () {
            var _this = this;
            var visited = history.state != null;
            if (history.state == null) {
                history.replaceState(newGuid(), document.title);
            }
            var id = history.state;
            var route = this.findRoute(location.pathname, location.search);
            if (!visited) {
                this.onroutechanged.notify({
                    layout: route == null ? null : route.layout,
                    page: route == null ? null : route.page,
                    params: route == null ? null : route.params,
                    url: location.pathname + location.search
                });
            }
            var cachedPage = this._cachedRoutes.filter(function (x) { return x.routeId == id; })[0];
            if (cachedPage != null) {
                if (cachedPage.error == null) {
                    this.showPage(cachedPage.page, cachedPage.layout);
                }
                else {
                    this.showStandardError(cachedPage.error);
                }
                return;
            }
            this.resolveRoute(route, function (resolvedRoute) {
                _this._cachedRoutes.push({
                    error: resolvedRoute.error,
                    layout: resolvedRoute.layout,
                    page: resolvedRoute.page,
                    pattern: route == null ? null : route.pattern,
                    routeId: id
                });
                if (history.state == id) {
                    if (resolvedRoute.error == null) {
                        _this.showPage(resolvedRoute.page, resolvedRoute.layout);
                    }
                    else {
                        _this.showStandardError(resolvedRoute.error);
                    }
                }
            });
        };
        Application.prototype.openUrl = function (url) {
            while (this._cachedRoutes.length > 10) {
                var cachedPage = this._cachedRoutes.shift();
                cachedPage.page.dispose();
            }
            if (!url.startsWith("/")) {
                url = "/" + url;
            }
            history.pushState(newGuid(), document.title, url);
            this.onRouteChanged();
        };
        Application.prototype.findRoute = function (pathname, search) {
            var pathparts = pathname.split("/").filter(function (x) { return !isNullOrWhiteSpace(x); }).map(function (x) { return x.trim(); });
            for (var i = 0; i < this._pageHandlers.length; i++) {
                var pageHandler = this._pageHandlers[i];
                if (this.matchRoute(pathparts, pageHandler.pattern)) {
                    var params = this.extractRouteParams(pathparts, search, pageHandler.pattern);
                    var page = pageHandler.handler(params);
                    if (page != null) {
                        for (var j = 0; j < this._layoutHandlers.length; j++) {
                            var layout = this._layoutHandlers[j](page.page);
                            if (layout != null) {
                                return {
                                    layout: layout.layout,
                                    page: page.page,
                                    params: page.params,
                                    pattern: pageHandler.pattern.join("/")
                                };
                            }
                        }
                        return {
                            page: page.page,
                            params: page.params,
                            pattern: pageHandler.pattern.join("/")
                        };
                    }
                }
            }
            return null;
        };
        // #endregion
        // #region Создание страницы
        Application.prototype.resolveRoute = function (route, resolve) {
            if (route == null) {
                this.resolveWithErrorPage(new spa.NotFoundException("Страница не найдена."), resolve);
            }
            else {
                this.resolveWithPage(route.page, route.params, route.layout, resolve);
            }
        };
        Application.prototype.resolveWithPage = function (pageNameOrClass, params, layoutNameOrClass, resolve) {
            var _this = this;
            this.createPage(pageNameOrClass, params, function (page, pageError) {
                if (pageError != null) {
                    _this.resolveWithErrorPage(pageError, resolve);
                    return;
                }
                if (layoutNameOrClass != null) {
                    _this.createLayout(layoutNameOrClass, function (layout, layoutError) {
                        if (layoutError != null) {
                            _this.resolveWithErrorPage(layoutError, resolve);
                            return;
                        }
                        resolve({ layout: layout, page: page });
                    });
                    return;
                }
                resolve({ page: page });
            });
        };
        Application.prototype.resolveWithErrorPage = function (error, resolve) {
            var _this = this;
            for (var i = 0; i < this._errorHandlers.length; i++) {
                var route = this._errorHandlers[i](error);
                if (route != null) {
                    this.createPage(route.page, route.params, function (page, pageError) {
                        if (pageError == null) {
                            resolve({ page: page });
                        }
                        else {
                            _this.resolveWithDefaultErrorPage(pageError, resolve);
                        }
                    });
                }
            }
            this.resolveWithDefaultErrorPage(error, resolve);
        };
        Application.prototype.resolveWithDefaultErrorPage = function (error, resolve) {
            var pageName;
            if (error instanceof spa.UnauthorizedException || (error instanceof spa.HttpException && error.statusCode == 401)) {
                pageName = "Forbidden";
            }
            else {
                if (error instanceof spa.ForbiddenException || (error instanceof spa.HttpException && error.statusCode == 403)) {
                    pageName = "Forbidden";
                }
                else {
                    if (error instanceof spa.NotFoundException || (error instanceof spa.HttpException && error.statusCode == 404)) {
                        pageName = "NotFound";
                    }
                    else {
                        if (error instanceof spa.InternalServerErrorPage || (error instanceof spa.HttpException && error.statusCode == 500)) {
                            pageName = "InternalServerError";
                        }
                        else {
                            pageName = "UnknownError";
                        }
                    }
                }
            }
            this.createPage(pageName, { error: error }, function (errorPage, errorPageError) {
                if (errorPageError == null) {
                    resolve({ page: errorPage });
                }
                else {
                    resolve({ error: errorPageError });
                }
            });
        };
        Application.prototype.createLayout = function (nameOrClass, callback) {
            var _this = this;
            var cachedLayout = this._cachedLayouts.filter(function (x) { return x.nameOrClass == nameOrClass; })[0];
            if (cachedLayout != null) {
                callback(cachedLayout.layout);
                return;
            }
            var layout;
            var layoutConfig;
            var layoutError;
            if (typeof nameOrClass == "string") {
                var layoutConfig = spa.layouts.find(nameOrClass);
                if (layoutConfig == null) {
                    callback(null, new spa.NotFoundException("Макет '{0}' не найден.".format(nameOrClass)));
                    return;
                }
            }
            else {
                layoutConfig = spa.layouts.items.filter(function (x) { return x.viewModel == nameOrClass; })[0];
            }
            try {
                if (layoutConfig != null) {
                    layout = new spa.Layout(layoutConfig);
                }
                else {
                    layout = new nameOrClass();
                }
            }
            catch (constructorError) {
                var layoutName = layoutConfig != null ? layoutConfig.name : spa.getFunctionName(nameOrClass);
                if (constructorError == null) {
                    layoutError = new spa.Exception("Произошла ошибка при создании макета '{0}'.".format(layoutName));
                }
                else {
                    layoutError = constructorError instanceof spa.Exception ? constructorError : new spa.Exception(constructorError.toString());
                }
            }
            if (layoutError != null) {
                callback(null, layoutError);
                return;
            }
            layout.onready.subscribe(function (loadError) {
                if (loadError != null) {
                    layout.dispose();
                    callback(null, loadError);
                    return;
                }
                _this._cachedLayouts.push({
                    layout: layout,
                    nameOrClass: nameOrClass
                });
                callback(layout);
            });
        };
        Application.prototype.createPage = function (nameOrClass, params, callback) {
            var pageConfig;
            if (typeof nameOrClass == "string") {
                var pageConfig = spa.pages.find(nameOrClass);
                if (pageConfig == null) {
                    callback(null, new spa.NotFoundException("Страница '{0}' не найдена.".format(nameOrClass)));
                    return;
                }
            }
            else {
                pageConfig = spa.pages.items.filter(function (x) { return x.viewModel == nameOrClass; })[0];
            }
            var page;
            var pageError;
            try {
                if (pageConfig != null) {
                    page = new spa.Page(pageConfig, params);
                }
                else {
                    page = new nameOrClass(params);
                }
            }
            catch (constructorError) {
                var pageName = pageConfig != null ? pageConfig.name : spa.getFunctionName(nameOrClass);
                if (constructorError == null) {
                    pageError = new spa.Exception("Произошла ошибка при создании страницы '{0}'.".format(pageName));
                }
                else {
                    pageError = constructorError instanceof spa.Exception ? constructorError : new spa.Exception(constructorError.toString());
                }
            }
            if (pageError != null) {
                callback(null, pageError);
                return;
            }
            page.onready.subscribe(function (readyError) {
                if (readyError != null) {
                    page.dispose();
                    callback(null, readyError);
                    return;
                }
                callback(page);
            });
        };
        // #endregion
        // #region Отображение и скрытие страниц
        Application.prototype.showPage = function (page, layout) {
            var _this = this;
            if (this._firstPage) {
                this._firstPage = false;
                document.body.innerHTML = "";
            }
            if (this._errorElement != null) {
                spa.GC.disposeElement(this._errorElement);
                this._errorElement = null;
            }
            if (this._activePage != null) {
                this.hideActivePage();
            }
            if (this._activeLayout != null && this._activeLayout != layout) {
                this.hideActiveLayout();
            }
            this._activeLayout = layout;
            if (this._activeLayout != null) {
                document.body.appendChild(this._activeLayout.template);
                this._activeLayout.show();
            }
            this._activePage = page;
            if (this._activeLayout == null) {
                document.body.appendChild(this._activePage.template);
            }
            else {
                this._activeLayout.addPage(this._activePage);
            }
            this._activePage.show();
            document.title = page.title;
            this._activePage.onparamschanged.subscribe(function () {
                _this.onPageParamsChanged(page);
            });
            this._activePage.ontitlechanged.subscribe(function () {
                _this.onPageTitleChanged(page);
            });
        };
        Application.prototype.showStandardError = function (error) {
            if (this._firstPage) {
                this._firstPage = false;
                document.body.innerHTML = "";
            }
            if (this._activePage != null) {
                this.hideActivePage();
            }
            if (this._activeLayout != null) {
                this.hideActiveLayout();
            }
            if (this._errorElement == null) {
                this._errorElement = document.createElement("div");
                this._errorElement.id = "#appError";
            }
            this._errorElement.innerHTML = error.toString();
            document.body.appendChild(this._errorElement);
            document.title = "Ошибка";
        };
        Application.prototype.hideActivePage = function () {
            this._activePage.hide();
            if (this._activeLayout == null) {
                document.body.removeChild(this._activePage.template);
            }
            else {
                this._activeLayout.removePage(this._activePage);
            }
            this._activePage = null;
        };
        Application.prototype.hideActiveLayout = function () {
            this._activeLayout.hide();
            document.body.removeChild(this._activeLayout.template);
            this._activeLayout = null;
        };
        Application.prototype.onPageParamsChanged = function (page) {
            var cachedPage = this._cachedRoutes.filter(function (x) { return x.page == page; })[0];
            if (cachedPage != null) {
                if (cachedPage.routeId == history.state) {
                    history.pushState(history.state, document.title, this.makeUrl(cachedPage.pattern, page.params));
                }
            }
        };
        Application.prototype.onPageTitleChanged = function (page) {
            var cachedPage = this._cachedRoutes.filter(function (x) { return x.page == page; })[0];
            if (cachedPage != null) {
                if (cachedPage.routeId == history.state) {
                    document.title = page.title;
                }
            }
        };
        // #endregion
        // #region Работа с URL
        Application.prototype.matchRoute = function (pathname, pattern) {
            if (pathname.length != pattern.length) {
                return false;
            }
            if (pathname.length == 0) {
                return true;
            }
            for (var i = 0; i < pathname.length; i++) {
                if (pattern[i].startsWith("{") && pattern[i].endsWith("}")) {
                    continue;
                }
                if (pattern[i].toLowerCase() != pathname[i].toLowerCase()) {
                    return false;
                }
            }
            return true;
        };
        Application.prototype.extractRouteParams = function (pathname, search, pattern) {
            var params;
            if (search != null) {
                if (search.startsWith("?")) {
                    search = search.substr(1);
                }
                if (search.length > 0) {
                    params = spa.JsonSerializer.deserializeQueryString(search);
                }
            }
            if (params == null) {
                params = {};
            }
            for (var i = 0; i < pathname.length; i++) {
                if (pattern[i].startsWith("{") && pattern[i].endsWith("}")) {
                    params[pattern[i].substr(1, pattern[i].length - 2)] = pathname[i];
                }
            }
            return params;
        };
        Application.prototype.makeUrl = function (pattern, params) {
            var url = pattern;
            if (params != null) {
                var search = {};
                var hasSearch = false;
                for (var paramName in params) {
                    var index = url.toLowerCase().indexOf(paramName.toLowerCase());
                    if (index == -1) {
                        search[paramName] = params[paramName];
                        hasSearch = true;
                    }
                    else {
                        url = url.replace(new RegExp("{" + paramName + "}", "ig"), params[paramName]);
                    }
                }
                if (hasSearch) {
                    url += "?" + spa.JsonSerializer.serializeToQueryString(search);
                }
            }
            return url;
        };
        return Application;
    })();
    spa.Application = Application;
})(spa || (spa = {}));
var spa;
(function (spa) {
    var View = (function () {
        function View(template) {
            var _this = this;
            this._disposed = false;
            this._onready = new spa.Notification();
            this._template = document.createElement("div");
            this._template.style.display = "none";
            this._templateParam = template;
            setTimeout(function () {
                _this.load(function (error) {
                    _this._loadResult = error == null ? null : error;
                    _this._onready.notifyOnce(error);
                });
            }, 0);
        }
        View.prototype.load = function (loaded) {
            var _this = this;
            if (this._templateParam == null || this._templateParam.length == 0) {
                loaded(null);
            }
            else {
                if (this._templateParam.length >= 5) {
                    if (this._templateParam.substr(this._templateParam.length - 5, 5).toLowerCase() == ".html") {
                        var key = this._templateParam.toLowerCase();
                        if (key in View.loadedTemplates) {
                            this._template.innerHTML = View.loadedTemplates[key];
                            loaded();
                        }
                        else {
                            spa.Http.getAsync(this._templateParam).then(function (template) {
                                View.loadedTemplates[key] = template;
                                _this._template.innerHTML = template;
                                loaded();
                            }, function (error) {
                                loaded(error);
                            });
                        }
                    }
                    else {
                        this._template.innerHTML = this._templateParam;
                        loaded();
                    }
                }
                else {
                    this._template.innerHTML = this._templateParam;
                    loaded();
                }
            }
        };
        Object.defineProperty(View.prototype, "disposed", {
            get: function () {
                return this._disposed;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(View.prototype, "onready", {
            get: function () {
                return this._onready;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(View.prototype, "template", {
            get: function () {
                return this._template;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(View.prototype, "visible", {
            get: function () {
                return this._template.style.display != "none";
            },
            enumerable: true,
            configurable: true
        });
        View.prototype.hide = function () {
            this._template.style.display = "none";
        };
        View.prototype.show = function () {
            this._template.style.display = "";
        };
        View.prototype.dispose = function () {
            if (this._disposed) {
                return;
            }
            this._onready.dispose();
            spa.GC.disposeElement(this._template);
            this._template = null;
            this._disposed = true;
        };
        View.loadedTemplates = {};
        return View;
    })();
    spa.View = View;
})(spa || (spa = {}));
/// <reference path="view.ts" />
var spa;
(function (spa) {
    var Dialog = (function (_super) {
        __extends(Dialog, _super);
        function Dialog(templateOrConfig, params) {
            _super.call(this, templateOrConfig instanceof Object ? templateOrConfig.template || templateOrConfig.templateUrl : templateOrConfig);
            this._size = { height: 480, width: 640 };
            this._subscriptions = [];
            if (templateOrConfig instanceof Object) {
                this._config = templateOrConfig;
            }
            this._params = params;
        }
        Object.defineProperty(Dialog.prototype, "name", {
            get: function () {
                if (this._config == null) {
                    var self = this;
                    if (self.__proto__) {
                        if (self.__proto__.constructor) {
                            return spa.getFunctionName(self.__proto__.constructor);
                        }
                    }
                    return "";
                }
                else {
                    return this._config.name;
                }
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Dialog.prototype, "location", {
            get: function () {
                return this._location;
            },
            set: function (value) {
                this._location = value;
                this.onLocationChanged();
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Dialog.prototype, "size", {
            get: function () {
                return this._size;
            },
            set: function (value) {
                this._size = value;
                this.onSizeChanged();
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Dialog.prototype, "title", {
            get: function () {
                return this._title;
            },
            set: function (value) {
                this._title = value;
                this.onTitleChanged();
            },
            enumerable: true,
            configurable: true
        });
        Dialog.prototype.show = function (closeCallback) {
            this.internalShow(false, closeCallback);
        };
        Dialog.prototype.showModal = function (closeCallback) {
            this.internalShow(true, closeCallback);
        };
        Dialog.prototype.close = function (result) {
            var _this = this;
            this.template.classList.add("dialog-hidden");
            setTimeout(function () {
                document.body.removeChild(_this.template);
                _super.prototype.hide.call(_this);
                if (_this._closeCallback != null) {
                    _this._closeCallback(result);
                    _this._closeCallback = null;
                }
            }, 200);
            var dialog = visibleDialogs.filter(function (x) { return x.dialog == _this; })[0];
            if (dialog != null) {
                visibleDialogs.remove(dialog);
            }
            if (overlayElement != null) {
                var hasModalDialogs = visibleDialogs.some(function (x) { return x.modal; });
                if (hasModalDialogs) {
                    overlayElement.style.zIndex = (visibleDialogs.filter(function (x) { return x.modal; }).max(function (x) { return x.zIndex; }) - 1).toString();
                }
                else {
                    overlayElement.classList.add("dialog-overlay-hidden");
                    setTimeout(function () {
                        document.body.removeChild(overlayElement);
                    }, 200);
                }
            }
        };
        Dialog.disposeAll = function () {
            while (visibleDialogs.length > 0) {
                var visibleDialog = visibleDialogs.pop();
                visibleDialog.dialog.dispose();
            }
            if (overlayElement != null && overlayElement.parentElement != null) {
                if (overlayElement.parentElement != null) {
                    document.body.removeChild(overlayElement);
                }
            }
        };
        Dialog.prototype.load = function (callback) {
            var _this = this;
            _super.prototype.load.call(this, function (viewError) {
                if (viewError != null) {
                    callback(viewError);
                    return;
                }
                _this._dialogHeaderElement = document.createElement("div");
                _this._dialogHeaderElement.classList.add("dialog-header");
                _this._dialogBodyElement = document.createElement("div");
                _this._dialogBodyElement.classList.add("dialog-body");
                while (_this.template.firstChild) {
                    _this._dialogBodyElement.appendChild(_this.template.firstChild);
                }
                _this.template.classList.add("dialog");
                _this.template.classList.add("dialog-hidden");
                _this.template.appendChild(_this._dialogHeaderElement);
                _this.template.appendChild(_this._dialogBodyElement);
                _this.resolveViewModel(_this._params, function (viewModel, viewModelError) {
                    if (viewModelError != null) {
                        callback(viewModelError);
                        return;
                    }
                    if (_this._config != null) {
                        if (_this._config.size != null) {
                            _this.size = _this._config.size;
                        }
                        if (_this._config.title != null) {
                            _this.title = _this._config.title;
                        }
                    }
                    if (viewModel != null) {
                        _this._viewModel = viewModel;
                        if (_this._viewModel.dialogSize != null) {
                            _this.size = ko.unwrap(_this._viewModel.dialogSize);
                            if (ko.isSubscribable(_this._viewModel.dialogSize)) {
                                _this._subscriptions.push(_this._viewModel.dialogSize.subscribe(function (size) {
                                    _this._size = size;
                                }));
                            }
                        }
                        if (_this._viewModel.dialogTitle != null) {
                            _this.title = ko.unwrap(_this._viewModel.dialogTitle);
                            if (ko.isSubscribable(_this._viewModel.dialogTitle)) {
                                _this._subscriptions.push(_this._viewModel.dialogTitle.subscribe(function (title) {
                                    _this._title = title;
                                }));
                            }
                        }
                        _this._viewModel.close = function (result) {
                            _this.close(result);
                        };
                    }
                    var bindingModel = _this._config == null ? _this : _this._viewModel;
                    if (bindingModel != null) {
                        var bindingError = null;
                        try {
                            ko.applyBindings(bindingModel, _this.template);
                        }
                        catch (e) {
                            var errorText = "Произошла ошибка на этапе привязки модели представления (view model) к шаблону страницы '{0}'. ".format(_this.name);
                            bindingError = e == null ? new spa.Exception(errorText) : e instanceof spa.Exception ? e : new spa.Exception(errorText + e.toString());
                        }
                        if (bindingError != null) {
                            callback(bindingError);
                            return;
                        }
                    }
                    _this.onLocationChanged();
                    _this.onSizeChanged();
                    _this.onTitleChanged();
                    callback();
                });
            });
        };
        Dialog.prototype.resolveViewModel = function (params, callback) {
            if (this._config.viewModel == null) {
                callback(null);
            }
            else {
                var async = spa.getFunctionParameterNames(this._config.viewModel).length > 1;
                if (async) {
                    this.resolveViewModelAsync(this._config.viewModel, params, callback);
                }
                else {
                    var viewModel;
                    var viewModelError;
                    try {
                        viewModel = new this._config.viewModel(params);
                    }
                    catch (constructorError) {
                        viewModelError = constructorError;
                    }
                    if (viewModel != null) {
                        callback(viewModel);
                    }
                    else {
                        this.resolveViewModelError(viewModelError, callback);
                    }
                }
            }
        };
        Dialog.prototype.resolveViewModelAsync = function (viewModelClass, params, callback) {
            var _this = this;
            try {
                var asyncViewModel = new viewModelClass(params, function (viewModelError) {
                    setTimeout(function () {
                        if (viewModelError == null) {
                            callback(asyncViewModel);
                        }
                        else {
                            _this.resolveViewModelError(viewModelError, callback);
                        }
                    }, 0);
                });
            }
            catch (ex) {
                this.resolveViewModelError(ex, callback);
            }
        };
        Dialog.prototype.resolveViewModelError = function (error, callback) {
            var errorText = "Произошла ошибка при создании модели представления (view model) диалогового окна '{0}'.".format(this.name);
            if (error == null) {
                error = new spa.Exception(errorText);
            }
            else {
                error = error instanceof spa.Exception ? error : new spa.Exception(errorText + error.toString());
            }
            callback(null, error);
        };
        Dialog.prototype.onLocationChanged = function () {
            var dialogHeight = this.getAbsoluteSize(this.size.height, window.innerHeight);
            var dialogWidth = this.getAbsoluteSize(this.size.width, window.innerWidth);
            this.template.style.left = (window.innerWidth / 2 - dialogWidth / 2).toString() + "px";
            this.template.style.top = (window.innerHeight / 2 - dialogHeight / 2).toString() + "px";
        };
        Dialog.prototype.onSizeChanged = function () {
            this.template.style.height = typeof this.size.height == "number" ? this.size.height + "px" : this.size.height.toString();
            this.template.style.width = typeof this.size.width == "number" ? this.size.width + "px" : this.size.width.toString();
        };
        Dialog.prototype.onTitleChanged = function () {
            this._dialogHeaderElement.innerHTML = this.title;
        };
        Dialog.prototype.getAbsoluteSize = function (size, containerSize) {
            if (typeof size == "number") {
                return size;
            }
            else {
                var s = size.toString();
                if (s.contains("%")) {
                    return parseInt(s) * containerSize / 100;
                }
                else {
                    return parseInt(s);
                }
            }
        };
        Dialog.prototype.internalShow = function (modal, closeCallback) {
            var _this = this;
            _super.prototype.show.call(this);
            var zIndex = 1000;
            visibleDialogs.forEach(function (dialog) {
                zIndex += Math.max(zIndex, dialog.zIndex + 2);
            });
            var dialog = {
                dialog: this,
                modal: modal,
                zIndex: zIndex
            };
            visibleDialogs.push(dialog);
            this.template.style.zIndex = zIndex.toString();
            if (modal) {
                if (overlayElement == null) {
                    overlayElement = document.createElement("div");
                    overlayElement.classList.add("dialog-overlay");
                    overlayElement.classList.add("dialog-overlay-hidden");
                }
                overlayElement.style.zIndex = (zIndex - 1).toString();
                if (overlayElement.parentElement == null) {
                    document.body.appendChild(overlayElement);
                }
                if (overlayElement.classList.contains("dialog-overlay-hidden")) {
                    setTimeout(function () {
                        overlayElement.classList.remove("dialog-overlay-hidden");
                    }, 10);
                }
            }
            this._closeCallback = closeCallback;
            if (this.template.parentElement == null) {
                document.body.appendChild(this.template);
            }
            setTimeout(function () {
                _this.template.classList.remove("dialog-hidden");
            }, 10);
        };
        Dialog.prototype.dispose = function () {
            if (this.disposed) {
                return;
            }
            if (this._config == null || this._config.viewModel != null) {
                ko.cleanNode(this.template);
            }
            if (this._viewModel != null && this._viewModel.dispose != null) {
                this._viewModel.dispose();
            }
            this._subscriptions.forEach(function (subscription) {
                subscription.dispose();
            });
            this._closeCallback = null;
            this._config = null;
            this._dialogBodyElement = null;
            this._dialogHeaderElement = null;
            this._params = null;
            this._subscriptions.length = 0;
            this._viewModel = null;
            _super.prototype.dispose.call(this);
        };
        return Dialog;
    })(spa.View);
    spa.Dialog = Dialog;
    var overlayElement = null;
    var visibleDialogs = [];
    function showDialog(nameOrClass, params, close) {
        var config;
        if (typeof nameOrClass == "string") {
            var config = spa.dialogs.find(nameOrClass);
            if (config == null) {
                throw new spa.Exception("Диалоговое окно '{0}' не найдено.".format(nameOrClass));
            }
        }
        else {
            config = spa.dialogs.items.filter(function (x) { return x.viewModel == nameOrClass; })[0];
            if (config == null) {
                var dialogFromClass = new nameOrClass(params);
                dialogFromClass.onready.subscribe(function (error) {
                    if (error != null) {
                        throw error;
                    }
                    dialogFromClass.showModal(function (result) {
                        if (close != null) {
                            close(result);
                        }
                        dialogFromClass.dispose();
                    });
                });
            }
            else {
                var dialog = new Dialog(config, params);
                dialog.onready.subscribe(function (error) {
                    if (error != null) {
                        throw error;
                    }
                    dialog.showModal(function (result) {
                        if (close != null) {
                            close(result);
                        }
                        dialog.dispose();
                    });
                });
            }
        }
    }
    spa.showDialog = showDialog;
})(spa || (spa = {}));
var spa;
(function (spa) {
    var DialogConfigurations = (function () {
        function DialogConfigurations() {
            this._items = [];
            this._itemByName = {};
        }
        Object.defineProperty(DialogConfigurations.prototype, "items", {
            get: function () {
                return this._items;
            },
            enumerable: true,
            configurable: true
        });
        DialogConfigurations.prototype.find = function (name) {
            if (isNullOrWhiteSpace(name)) {
                throw new spa.ArgumentNullException("name");
            }
            return this._itemByName[name.toLowerCase()];
        };
        DialogConfigurations.prototype.register = function (config) {
            if (config == null) {
                throw new spa.ArgumentNullException("config");
            }
            if (isNullOrWhiteSpace(config.name)) {
                throw new spa.ArgumentException("Не задано название диалогового окна.");
            }
            if (isNullOrWhiteSpace(config.template) && isNullOrWhiteSpace(config.templateUrl)) {
                throw new spa.ArgumentException("Не задан шаблон диалогового окна {0}.".format(config.name));
            }
            if (this._itemByName[config.name.toLowerCase()] != null) {
                throw new spa.Exception("Шаблон диалогового окна {0} уже зарегистрирован.".format(config.name));
            }
            this._items.push(config);
            this._itemByName[config.name.toLowerCase()] = config;
        };
        DialogConfigurations.prototype.remove = function (name) {
            if (name == null) {
                throw new spa.ArgumentNullException("name");
            }
            var config = this._itemByName[name.toLowerCase()];
            if (config != null) {
                this._items.remove(config);
                delete this._items[name.toLowerCase()];
            }
            return config != null;
        };
        return DialogConfigurations;
    })();
    spa.DialogConfigurations = DialogConfigurations;
})(spa || (spa = {}));
var spa;
(function (spa) {
    var LayoutConfigurations = (function () {
        function LayoutConfigurations() {
            this._items = [];
            this._itemByName = {};
        }
        Object.defineProperty(LayoutConfigurations.prototype, "items", {
            get: function () {
                return this._items;
            },
            enumerable: true,
            configurable: true
        });
        LayoutConfigurations.prototype.find = function (name) {
            if (isNullOrWhiteSpace(name)) {
                throw new spa.ArgumentNullException("name");
            }
            return this._itemByName[name.toLowerCase()];
        };
        LayoutConfigurations.prototype.register = function (config) {
            if (config == null) {
                throw new spa.ArgumentNullException("config");
            }
            if (isNullOrWhiteSpace(config.name)) {
                throw new spa.ArgumentException("Не задано название макета.");
            }
            if (isNullOrWhiteSpace(config.template) && isNullOrWhiteSpace(config.templateUrl)) {
                throw new spa.ArgumentException("Не задан шаблон макета {0}.".format(config.name));
            }
            if (isNullOrWhiteSpace(config.containerClass)) {
                throw new spa.ArgumentException("Не задан класс контейнера макета {0}.".format(config.name));
            }
            if (this._items[config.name.toLowerCase()] != null) {
                throw new spa.Exception("Макет {0} уже зарегистрирован.".format(config.name));
            }
            this._items.push(config);
            this._itemByName[config.name.toLowerCase()] = config;
        };
        LayoutConfigurations.prototype.remove = function (name) {
            if (name == null) {
                throw new spa.ArgumentNullException("name");
            }
            var config = this._itemByName[name.toLowerCase()];
            if (config != null) {
                this._items.remove(config);
                delete this._items[name.toLowerCase()];
            }
            return config != null;
        };
        return LayoutConfigurations;
    })();
    spa.LayoutConfigurations = LayoutConfigurations;
})(spa || (spa = {}));
var spa;
(function (spa) {
    var PageConfigurations = (function () {
        function PageConfigurations() {
            this._items = [];
            this._itemByName = {};
        }
        Object.defineProperty(PageConfigurations.prototype, "items", {
            get: function () {
                return this._items;
            },
            enumerable: true,
            configurable: true
        });
        PageConfigurations.prototype.find = function (name) {
            if (isNullOrWhiteSpace(name)) {
                throw new spa.ArgumentNullException("name");
            }
            return this._itemByName[name.toLowerCase()];
        };
        PageConfigurations.prototype.register = function (config) {
            if (config == null) {
                throw new spa.ArgumentNullException("config");
            }
            if (isNullOrWhiteSpace(config.name)) {
                throw new spa.ArgumentException("Не задано название страницы.");
            }
            if (isNullOrWhiteSpace(config.template) && isNullOrWhiteSpace(config.templateUrl)) {
                throw new spa.ArgumentException("Не задан шаблон страницы {0}.".format(config.name));
            }
            if (this._itemByName[config.name.toLowerCase()] != null) {
                throw new spa.Exception("Страница {0} уже зарегистрирована.".format(config.name));
            }
            this._items.push(config);
            this._itemByName[config.name.toLowerCase()] = config;
        };
        PageConfigurations.prototype.remove = function (name) {
            if (name == null) {
                throw new spa.ArgumentNullException("name");
            }
            var config = this._itemByName[name.toLowerCase()];
            if (config != null) {
                this._items.remove(config);
                delete this._items[name.toLowerCase()];
            }
            return config != null;
        };
        return PageConfigurations;
    })();
    spa.PageConfigurations = PageConfigurations;
})(spa || (spa = {}));
/// <reference path="DialogConfigurations.ts" />
/// <reference path="LayoutConfigurations.ts" />
/// <reference path="PageConfigurations.ts" />
var spa;
(function (spa) {
    spa.dialogs = new spa.DialogConfigurations();
    spa.layouts = new spa.LayoutConfigurations();
    spa.pages = new spa.PageConfigurations();
})(spa || (spa = {}));
/// <reference path="view.ts" />
var spa;
(function (spa) {
    var Layout = (function (_super) {
        __extends(Layout, _super);
        function Layout(templateOrConfig, containerClassName) {
            _super.call(this, templateOrConfig instanceof Object ? templateOrConfig.template || templateOrConfig.templateUrl : templateOrConfig);
            this._pages = [];
            if (templateOrConfig instanceof Object) {
                this._config = templateOrConfig;
                this._containerClassName = this._config.containerClass;
            }
            else {
                this._containerClassName = containerClassName;
            }
        }
        Layout.prototype.load = function (callback) {
            var _this = this;
            _super.prototype.load.call(this, function (viewError) {
                if (viewError != null) {
                    callback(viewError);
                    return;
                }
                if (isNullOrWhiteSpace(_this._containerClassName)) {
                    var errorText;
                    if (_this._config == null) {
                        callback(new spa.Exception("В конфигурации макета '{0}' не указан класс элемента-контейнера страниц.".format(_this.name)));
                    }
                    else {
                        callback(new spa.Exception("Параметр containerClassName конструктора макета '{0}' содержит пустое значение.".format(_this.name)));
                    }
                    return;
                }
                var containerNodes = _this.template.getElementsByClassName(_this._containerClassName);
                var containerError = "Шаблон макета '{0}' {1} элемента-контейнера страниц класса '{2}'.";
                if (containerNodes.length == 0) {
                    callback(new spa.Exception(containerError.format(_this.name, "не содержит", _this._containerClassName)));
                    return;
                }
                else {
                    if (containerNodes.length > 1) {
                        callback(new spa.Exception(containerError.format(_this.name, "содержит более одного", _this._containerClassName)));
                        return;
                    }
                    else {
                        _this._containerElement = containerNodes[0];
                    }
                }
                _this.resolveViewModel(function (viewModel, viewModelError) {
                    if (viewModelError != null) {
                        callback(viewModelError);
                        return;
                    }
                    if (viewModel != null) {
                        _this._viewModel = viewModel;
                    }
                    var bindingModel = _this._config == null ? _this : viewModel;
                    if (bindingModel != null) {
                        var bindingError = null;
                        try {
                            ko.applyBindings(bindingModel, _this.template);
                        }
                        catch (e) {
                            var errorText = "Произошла ошибка на этапе привязки модели представления (view model) к шаблону макета '{0}'. ".format(_this.name);
                            bindingError = e == null ? new spa.Exception(errorText) : e instanceof spa.Exception ? e : new spa.Exception(errorText + e.toString());
                        }
                        if (bindingError != null) {
                            callback(bindingError);
                            return;
                        }
                    }
                    callback();
                });
            });
        };
        Layout.prototype.resolveViewModel = function (callback) {
            if (this._config.viewModel == null) {
                callback(null);
                return;
            }
            var async = spa.getFunctionParameterNames(this._config.viewModel).length > 0;
            if (async) {
                this.resolveViewModelAsync(this._config.viewModel, callback);
            }
            else {
                var viewModel;
                var viewModelError;
                try {
                    viewModel = new this._config.viewModel();
                }
                catch (constructorError) {
                    viewModelError = constructorError;
                }
                if (viewModel != null) {
                    callback(viewModel);
                }
                else {
                    this.resolveViewModelError(viewModelError, callback);
                }
            }
        };
        Layout.prototype.resolveViewModelAsync = function (viewModelClass, callback) {
            var _this = this;
            try {
                var asyncViewModel = new viewModelClass(function (viewModelError) {
                    setTimeout(function () {
                        if (viewModelError == null) {
                            callback(asyncViewModel);
                        }
                        else {
                            _this.resolveViewModelError(viewModelError, callback);
                        }
                    }, 0);
                });
            }
            catch (ex) {
                this.resolveViewModelError(ex, callback);
            }
        };
        Layout.prototype.resolveViewModelError = function (error, callback) {
            var errorText = "Произошла ошибка при создании модели представления (view model) макета '{0}'.".format(this.name);
            if (error == null) {
                error = new spa.Exception(errorText);
            }
            else {
                error = error instanceof spa.Exception ? error : new spa.Exception(errorText + error.toString());
            }
            callback(null, error);
        };
        Object.defineProperty(Layout.prototype, "name", {
            get: function () {
                if (this._config == null) {
                    var self = this;
                    if (self.__proto__) {
                        if (self.__proto__.constructor) {
                            return spa.getFunctionName(self.__proto__.constructor);
                        }
                    }
                    return "";
                }
                else {
                    return this._config.name;
                }
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Layout.prototype, "pages", {
            get: function () {
                return this._pages;
            },
            enumerable: true,
            configurable: true
        });
        Layout.prototype.addPage = function (page) {
            this._pages.push(page);
            this._containerElement.appendChild(page.template);
            if (this._viewModel != null && this._viewModel.onPageChanged != null) {
                this._viewModel.onPageChanged(page.name, page.params);
            }
        };
        Layout.prototype.removePage = function (page) {
            this._pages.remove(page);
            this._containerElement.removeChild(page.template);
        };
        Layout.prototype.dispose = function () {
            if (this.disposed) {
                return;
            }
            if (this._config == null || this._config.viewModel != null) {
                ko.cleanNode(this.template);
            }
            this._pages.forEach(function (page) {
                page.dispose();
            });
            if (this._viewModel != null && this._viewModel.dispose != null) {
                this._viewModel.dispose();
            }
            this._config = null;
            this._containerElement = null;
            this._pages.length = 0;
            this._viewModel = null;
            _super.prototype.dispose.call(this);
        };
        return Layout;
    })(spa.View);
    spa.Layout = Layout;
})(spa || (spa = {}));
/// <reference path="view.ts" />
var spa;
(function (spa) {
    var Page = (function (_super) {
        __extends(Page, _super);
        function Page(templateOrConfig, params) {
            _super.call(this, templateOrConfig instanceof Object ? templateOrConfig.template || templateOrConfig.templateUrl : templateOrConfig);
            this._onparamschanged = new spa.Notification();
            this._ontitlechanged = new spa.Notification();
            this._subscriptions = [];
            if (templateOrConfig instanceof Object) {
                this._config = templateOrConfig;
            }
            this._params = params;
        }
        Object.defineProperty(Page.prototype, "onparamschanged", {
            get: function () {
                return this._onparamschanged;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Page.prototype, "ontitlechanged", {
            get: function () {
                return this._ontitlechanged;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Page.prototype, "name", {
            get: function () {
                if (this._config == null) {
                    var self = this;
                    if (self.__proto__) {
                        if (self.__proto__.constructor) {
                            return spa.getFunctionName(self.__proto__.constructor);
                        }
                    }
                    return "";
                }
                else {
                    return this._config.name;
                }
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Page.prototype, "params", {
            get: function () {
                return this._params;
            },
            set: function (value) {
                if (this._params != value) {
                    this._params = value;
                    this.onparamschanged.notify(value);
                }
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Page.prototype, "title", {
            get: function () {
                return this._title;
            },
            set: function (value) {
                if (this._title != value) {
                    this._title = value;
                    this.ontitlechanged.notify(value);
                }
            },
            enumerable: true,
            configurable: true
        });
        Page.prototype.show = function () {
            _super.prototype.show.call(this);
            if (this._viewModel != null && this._viewModel.onPageShown != null) {
                this._viewModel.onPageShown();
            }
        };
        Page.prototype.hiding = function (callback) {
            if (this._viewModel != null && this._viewModel.onPageHiding != null) {
                this._viewModel.onPageHiding(callback);
            }
            callback(false);
        };
        Page.prototype.hide = function () {
            _super.prototype.hide.call(this);
            if (this._viewModel != null && this._viewModel.onPageShown != null) {
                this._viewModel.onPageHide();
            }
        };
        Page.prototype.load = function (callback) {
            var _this = this;
            _super.prototype.load.call(this, function (viewError) {
                if (viewError != null) {
                    callback(viewError);
                    return;
                }
                _this.resolveViewModel(_this._params, function (viewModel, viewModelError) {
                    if (viewModelError != null) {
                        callback(viewModelError);
                        return;
                    }
                    if (_this._config != null) {
                        if (_this._config.title != null) {
                            _this.title = _this._config.title;
                        }
                    }
                    if (viewModel != null) {
                        _this._viewModel = viewModel;
                        if (_this._viewModel.pageParams != null && ko.isObservable(_this._viewModel.pageParams)) {
                            _this._subscriptions.push(_this._viewModel.pageParams.subscribe(function (params) {
                                _this.params = params;
                            }));
                        }
                        if (_this._viewModel.pageTitle != null && ko.isObservable(_this._viewModel.pageTitle)) {
                            _this._subscriptions.push(_this._viewModel.pageTitle.subscribe(function (title) {
                                _this.title = title;
                            }));
                        }
                    }
                    var bindingModel = _this._config == null ? _this : _this._viewModel;
                    if (bindingModel != null) {
                        var bindingError = null;
                        try {
                            ko.applyBindings(bindingModel, _this.template);
                        }
                        catch (e) {
                            var errorText = "Произошла ошибка на этапе привязки модели представления (view model) к шаблону страницы '{0}'. ".format(_this.name);
                            bindingError = e == null ? new spa.Exception(errorText) : e instanceof spa.Exception ? e : new spa.Exception(errorText + e.toString());
                        }
                        if (bindingError != null) {
                            callback(bindingError);
                            return;
                        }
                    }
                    callback();
                });
            });
        };
        Page.prototype.resolveViewModel = function (params, callback) {
            if (this._config == null) {
                callback(this);
            }
            else {
                if (this._config.viewModel == null) {
                    callback(null);
                }
                else {
                    var async = spa.getFunctionParameterNames(this._config.viewModel).length > 1;
                    if (async) {
                        this.resolveViewModelAsync(this._config.viewModel, params, callback);
                    }
                    else {
                        var viewModel;
                        var viewModelError;
                        try {
                            viewModel = new this._config.viewModel(params);
                        }
                        catch (constructorError) {
                            viewModelError = constructorError;
                        }
                        if (viewModel != null) {
                            callback(viewModel);
                        }
                        else {
                            this.resolveViewModelError(viewModelError, callback);
                        }
                    }
                }
            }
        };
        Page.prototype.resolveViewModelAsync = function (viewModelClass, params, callback) {
            var _this = this;
            try {
                var asyncViewModel = new viewModelClass(params, function (viewModelError) {
                    setTimeout(function () {
                        if (viewModelError == null) {
                            callback(asyncViewModel);
                        }
                        else {
                            _this.resolveViewModelError(viewModelError, callback);
                        }
                    }, 0);
                });
            }
            catch (ex) {
                this.resolveViewModelError(ex, callback);
            }
        };
        Page.prototype.resolveViewModelError = function (error, callback) {
            var errorText = "Произошла ошибка при создании модели представления (view model) страницы '{0}'.".format(this.name);
            if (error == null) {
                error = new spa.Exception(errorText);
            }
            else {
                error = error instanceof spa.Exception ? error : new spa.Exception(errorText + error.toString());
            }
            callback(null, error);
        };
        Page.prototype.dispose = function () {
            if (this.disposed) {
                return;
            }
            if (this._config == null || this._config.viewModel != null) {
                ko.cleanNode(this.template);
            }
            if (this._viewModel != null && this._viewModel.dispose != null) {
                this._viewModel.dispose();
            }
            this._subscriptions.forEach(function (subscription) {
                subscription.dispose();
            });
            this._config = null;
            this._onparamschanged.dispose();
            this._ontitlechanged.dispose();
            this._subscriptions.length = 0;
            this._title = null;
            this._viewModel = null;
            _super.prototype.dispose.call(this);
        };
        return Page;
    })(spa.View);
    spa.Page = Page;
})(spa || (spa = {}));
var spa;
(function (spa) {
    var RouteAttribute = (function (_super) {
        __extends(RouteAttribute, _super);
        function RouteAttribute(url) {
            _super.call(this);
            this.url = url;
        }
        return RouteAttribute;
    })(spa.Attribute);
    spa.RouteAttribute = RouteAttribute;
})(spa || (spa = {}));
var spa;
(function (spa) {
    var ValidationAttribute = (function (_super) {
        __extends(ValidationAttribute, _super);
        function ValidationAttribute(errorMessage) {
            _super.call(this);
            this._errorMessage = errorMessage;
        }
        Object.defineProperty(ValidationAttribute.prototype, "errorMessage", {
            get: function () {
                if (isNullOrWhiteSpace(this._errorMessage)) {
                    return this.getDefaultErrorMessage();
                }
                return this._errorMessage;
            },
            set: function (value) {
                this._errorMessage = value;
            },
            enumerable: true,
            configurable: true
        });
        ValidationAttribute.prototype.isValid = function (value, viewModel, propertyName) {
            return true;
        };
        ValidationAttribute.prototype.getDefaultErrorMessage = function () {
            return "Поле содержит недопустимое значение.";
        };
        return ValidationAttribute;
    })(spa.Attribute);
    spa.ValidationAttribute = ValidationAttribute;
})(spa || (spa = {}));
/// <reference path="validationattribute.ts" />
var spa;
(function (spa) {
    var MaxLengthAttribute = (function (_super) {
        __extends(MaxLengthAttribute, _super);
        function MaxLengthAttribute(maxLength, errorMessage) {
            this.maxLength = maxLength;
            _super.call(this, errorMessage);
        }
        MaxLengthAttribute.prototype.isValid = function (value, viewModel, propertyName) {
            return value == null || this.maxLength == null || value.toString().length <= this.maxLength;
        };
        MaxLengthAttribute.prototype.getDefaultErrorMessage = function () {
            return "Длина строки не должна превышать {0}.".format(this.maxLength);
        };
        return MaxLengthAttribute;
    })(spa.ValidationAttribute);
    spa.MaxLengthAttribute = MaxLengthAttribute;
})(spa || (spa = {}));
/// <reference path="validationattribute.ts" />
var spa;
(function (spa) {
    var RangeAttribute = (function (_super) {
        __extends(RangeAttribute, _super);
        function RangeAttribute(minimum, maximum, errorMessage) {
            this.maximum = maximum;
            this.minimum = minimum;
            if (errorMessage == null) {
                errorMessage = "Длина строки выходит за допустимые пределы.".format(minimum, maximum);
            }
            _super.call(this, errorMessage);
        }
        RangeAttribute.prototype.isValid = function (value, viewModel, propertyName) {
            return value >= this.minimum && value <= this.maximum;
        };
        return RangeAttribute;
    })(spa.ValidationAttribute);
    spa.RangeAttribute = RangeAttribute;
})(spa || (spa = {}));
var spa;
(function (spa) {
    var ViewModel = (function () {
        function ViewModel() {
            var _this = this;
            this.valid = ko.pureComputed(function () {
                return _this.validationErrors() != null || _this.validationErrors().length == 0;
            });
            this.validationErrors = ko.pureComputed(function () {
                return _this.getValidationErrors();
            });
        }
        ViewModel.prototype.getValidationErrors = function () {
            var _this = this;
            var viewModelClass = this.constructor;
            var viewModelErrors = [];
            for (var memberName in this) {
                var memberAttributes = spa.getClassMemberAttributes(viewModelClass, memberName).filter(function (x) { return x instanceof spa.ValidationAttribute; });
                if (memberAttributes.length > 0) {
                    var value = ko.unwrap(this[memberName]);
                    memberAttributes.forEach(function (attribute) {
                        if (!attribute.isValid(value, _this, memberName)) {
                            viewModelErrors.push({ errorText: attribute.errorMessage, propertyName: memberName });
                        }
                    });
                }
            }
            return viewModelErrors;
        };
        return ViewModel;
    })();
    spa.ViewModel = ViewModel;
    function addValidationAttribute(viewModelType, memberName, attributeType, attributeProperties) {
        var attribute = new attributeType();
        if (attributeProperties != null) {
            Object.getOwnPropertyNames(attributeProperties).forEach(function (propertyName) {
                attribute[propertyName] = attributeProperties[propertyName];
                //if (propertyName in attribute) {
                //} else {
                //    throw new Exception("Не удалось создать атрибут валидации {0} модели представления {1}. Свойство {2} не найдено.".format(
                //        getFunctionName(viewModelType),
                //        getFunctionName(attributeType),
                //        propertyName));
                //}
            });
        }
        spa.addClassMemberAttribute(viewModelType, memberName, attribute);
    }
    spa.addValidationAttribute = addValidationAttribute;
})(spa || (spa = {}));
var spa;
(function (spa) {
    var InputStringDialog = (function () {
        function InputStringDialog() {
            this.text = ko.observable("");
            this.okClick = this.okClick.bind(this);
        }
        InputStringDialog.prototype.close = function (result) {
        };
        InputStringDialog.prototype.okClick = function () {
            this.close(this.text());
        };
        InputStringDialog.dialogName = "InputString";
        return InputStringDialog;
    })();
    spa.InputStringDialog = InputStringDialog;
    spa.dialogs.register({
        name: InputStringDialog.dialogName,
        template: "<input data-bind='textInput: text' /><button data-bind='click: okClick'>ОК</button>",
        title: "Ввод строки",
        viewModel: InputStringDialog,
        size: {
            height: 300,
            width: 400
        }
    });
})(spa || (spa = {}));
var spa;
(function (spa) {
    var OpenFileDialog = (function () {
        function OpenFileDialog() {
        }
        OpenFileDialog.createFileInput = function (multiple, accept) {
            var fileInput = document.createElement('input');
            fileInput.setAttribute('type', 'file');
            fileInput.style.left = "-200px";
            fileInput.style.top = "-200px";
            fileInput.style.width = "0";
            fileInput.style.height = "0";
            fileInput.style.overflow = "hidden";
            fileInput.style.position = "absolute";
            if (accept) {
                fileInput.setAttribute("accept", accept);
            }
            if (multiple) {
                fileInput.setAttribute('multiple', 'multiple');
            }
            document.body.appendChild(fileInput);
            return fileInput;
        };
        OpenFileDialog.show = function (handler, multiple, accept) {
            if (multiple === void 0) { multiple = false; }
            if (accept === void 0) { accept = ""; }
            var fileInput = OpenFileDialog.createFileInput(multiple, accept);
            fileInput.onchange = function () {
                if (handler) {
                    if (fileInput.files && fileInput.files.length > 0) {
                        var files = [];
                        for (var i = 0; i < fileInput.files.length; i++) {
                            files.push(fileInput.files[i]);
                        }
                        handler(files);
                    }
                }
                document.body.removeChild(fileInput);
            };
            fileInput.click();
        };
        return OpenFileDialog;
    })();
    spa.OpenFileDialog = OpenFileDialog;
})(spa || (spa = {}));
var spa;
(function (spa) {
    var ForbiddenPage = (function () {
        function ForbiddenPage(params) {
            this.errorMessage = ko.observable();
            if (params == null || params.error == null) {
                this.errorMessage("Ресурс не найден.");
            }
            else {
                this.errorMessage(params.error.toString());
            }
        }
        ForbiddenPage.pageName = "Forbidden";
        return ForbiddenPage;
    })();
    spa.ForbiddenPage = ForbiddenPage;
    spa.pages.register({
        name: ForbiddenPage.pageName,
        template: '<div data-bind="text: errorMessage"></div>',
        title: "Доступ запрещен",
        viewModel: ForbiddenPage
    });
})(spa || (spa = {}));
var spa;
(function (spa) {
    var InternalServerErrorPage = (function () {
        function InternalServerErrorPage(params) {
            this.errorMessage = ko.observable();
            if (params == null || params.error == null) {
                this.errorMessage("Ресурс не найден.");
            }
            else {
                this.errorMessage(params.error.toString());
            }
        }
        InternalServerErrorPage.pageName = "InternalServerError";
        return InternalServerErrorPage;
    })();
    spa.InternalServerErrorPage = InternalServerErrorPage;
    spa.pages.register({
        name: InternalServerErrorPage.pageName,
        template: '<div data-bind="text: errorMessage"></div>',
        title: "Ошибка приложения",
        viewModel: InternalServerErrorPage
    });
})(spa || (spa = {}));
var spa;
(function (spa) {
    var NotFoundPage = (function () {
        function NotFoundPage(params) {
            this.errorMessage = ko.observable();
            if (params == null || params.error == null) {
                this.errorMessage("Ресурс не найден.");
            }
            else {
                this.errorMessage(params.error.toString());
            }
        }
        NotFoundPage.pageName = "NotFound";
        return NotFoundPage;
    })();
    spa.NotFoundPage = NotFoundPage;
    spa.pages.register({
        name: NotFoundPage.pageName,
        template: '<div data-bind="text: errorMessage"></div>',
        title: "Ресурс не найден",
        viewModel: NotFoundPage
    });
})(spa || (spa = {}));
var spa;
(function (spa) {
    var UnknownError = (function () {
        function UnknownError(params) {
            this.errorMessage = ko.observable();
            if (params == null || params.error == null) {
                this.errorMessage("Произошла ошибка при выполнении программы.");
            }
            else {
                this.errorMessage(params.error.toString());
            }
        }
        UnknownError.pageName = "UnknownError";
        return UnknownError;
    })();
    spa.UnknownError = UnknownError;
    spa.pages.register({
        name: UnknownError.pageName,
        template: '<div data-bind="text: errorMessage"></div>',
        title: "Ошибка",
        viewModel: UnknownError
    });
})(spa || (spa = {}));
/// <reference path="validationattribute.ts" />
var spa;
(function (spa) {
    var RequiredAttribute = (function (_super) {
        __extends(RequiredAttribute, _super);
        function RequiredAttribute(errorMessage) {
            if (errorMessage == null) {
                errorMessage = "Требуется значение.";
            }
            _super.call(this, errorMessage);
        }
        RequiredAttribute.prototype.isValid = function (value, viewModel, propertyName) {
            return value != null;
        };
        return RequiredAttribute;
    })(spa.ValidationAttribute);
    spa.RequiredAttribute = RequiredAttribute;
})(spa || (spa = {}));
//# sourceMappingURL=spa.app-latest.js.map