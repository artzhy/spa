module spa {
    export class Application {
        private _activePage: Page;
        private _activeLayout: Layout;
        private _cachedRoutes: ICachedRoute[] = [];
        private _cachedLayouts: ICachedLayout[] = [];
        private _errorElement: HTMLDivElement;
        private _errorHandlers: { (error?: Exception): IRoutePage }[] = [];
        private _firstPage = true;
        private _layoutHandlers: { (pageNameOrClass?: any): IRouteLayout }[] = [];
        private _onroutechanged = new Notification<IRouteChangedEventArgs>();
        private _pageHandlers: { pattern: string[]; handler: (params?: any) => IRoutePage }[] = [];
        private _started = false;

        constructor() {
            this.onBodyClick = this.onBodyClick.bind(this);
            this.onPopState = this.onPopState.bind(this);

            document.body.addEventListener("click", this.onBodyClick);

            window.onerror = (errorMsg, url, lineNumber) => {
                alert("{0} (строка {1}, {2}).".format(errorMsg, lineNumber, url));
            };
        }

        // #region События

        public get onroutechanged() {
            return this._onroutechanged;
        }

        // #endregion

        // #region Маршрутизация

        public mapPage(pattern: string, handler: (params?: any) => IRoutePage) {
            this._pageHandlers.push({
                pattern: pattern.split("/").filter(x => !isNullOrWhiteSpace(x)).map(x => x.trim()),
                handler: handler
            });
        }

        public mapLayout(handler: (pageNameOrClass: any) => IRouteLayout) {
            this._layoutHandlers.push(handler);
        }

        public mapError(handler: (error?: Exception) => IRoutePage) {
            this._errorHandlers.push(handler);
        }

        public mapRegisteredPages() {
            pages.items.forEach((config) => {
                var pattern = config.route;

                if (pattern == null) {
                    pattern = config.name;
                }

                this.mapPage(pattern,(params) => {
                    return {
                        page: config.name,
                        params: params
                    };
                });
            });
        }

        public mapAttributeRoutes() {
            var pageClasses = getAttributeClasses(RouteAttribute);

            pageClasses.forEach((pageClass) => {
                var attribute = <RouteAttribute>getClassAttributes(pageClass).filter(x => x instanceof RouteAttribute)[0];

                this.mapPage(attribute.url, (params) => {
                    return {
                        page: pageClass,
                        params: params
                    };
                });
            });
        }

        // #endregion

        // #region Обработка событий

        private onBodyClick(ev) {
            if (ev.target && ev.target.tagName && ev.target.tagName == "A") {
                var a = <HTMLAnchorElement>ev.target;

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

                if (href == "#") {
                    return;
                }

                this.navigateUrl(href);

                ev.preventDefault();
                ev.stopPropagation();

                return false;
            }
        }

        private onPopState() {
            this.onRouteChanged();
        }

        // #endregion

        // #region Навигация

        /** Запуск приложения. */
        public start() {
            if (this._started) {
                return;
            }

            window.addEventListener("popstate", this.onPopState);

            this._started = true;
            this.onRouteChanged();
        }

        /** Остановка приложения. */
        public stop() {
            if (this._started) {
                window.removeEventListener("popstate", this.onPopState);
                this._started = false;
            }
        }

        /** Переход на страницу.
            @param pageNameOrClass Название зарегистрированной страницы, класс модели представления зарегистрированной страницы или класс-потомок Page. 
            @param params Параметры конструктора.
        */
        public navigate(pageNameOrClass: any, params?: any) {
            var pattern: string;

            if (typeof pageNameOrClass == "string") {
                var config = pages.find(pageNameOrClass);

                if (config != null) {
                    pattern = isNullOrWhiteSpace(config.route) ? config.name : config.route;
                }

                if (isNullOrWhiteSpace(pageNameOrClass)) {
                    pattern = pageNameOrClass;
                }
            }
            else {
                var routeAttribute = <RouteAttribute>getClassAttributes(pageNameOrClass).filter(x => x instanceof RouteAttribute)[0];

                if (routeAttribute == null) {
                    for (var i = 0; i < pages.items.length; i++) {
                        if (pages.items[i].viewModel == pageNameOrClass) {
                            pattern = isNullOrWhiteSpace(pages.items[i].route) ? pages.items[i].name : pages.items[i].route;
                            break;
                        }
                    }
                }
                else {
                    pattern = routeAttribute.url;
                }

                if (isNullOrWhiteSpace(pattern)) {
                    pattern = getFunctionName(pageNameOrClass);
                }
            }

            this.navigateUrl(this.makeUrl(pattern, params));
        }

        /** Переход на указанный адрес.
            @param url Адрес страницы. 
        */
        public navigateUrl(url: string) {
            if (isNullOrWhiteSpace(url)) {
                url = "/";
            }

            if (this._activePage != null) {
                this._activePage.hiding((cancel) => {
                    if (!cancel) {
                        this.openUrl(url);
                    }
                });

            } else {
                this.openUrl(url);
            }
        }

        /** Переход на предыдущую страницу. */
        public back() {
            history.back();
        }

        /** Переход на следующую страницу. */
        public forward() {
            history.forward();
        }

        /** Переход на домашнюю страницу. */
        public home() {
            this.navigateUrl("/");
        }

        private onRouteChanged() {
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

            var cachedPage = this._cachedRoutes.filter(x => x.routeId == id)[0];

            if (cachedPage != null) {
                if (cachedPage.error == null) {
                    this.showPage(cachedPage.page, cachedPage.layout);
                }
                else {
                    this.showStandardError(cachedPage.error);
                }

                return;
            }

            this.resolveRoute(route, (resolvedRoute) => {
                this._cachedRoutes.push({
                    error: resolvedRoute.error,
                    layout: resolvedRoute.layout,
                    page: resolvedRoute.page,
                    pattern: route == null ? null : route.pattern,
                    routeId: id
                });

                if (history.state == id) {
                    if (resolvedRoute.error == null) {
                        this.showPage(resolvedRoute.page, resolvedRoute.layout);
                    }
                    else {
                        this.showStandardError(resolvedRoute.error);
                    }
                }
            });
        }

        private openUrl(url: string) {
            while (this._cachedRoutes.length > 10) {
                var cachedPage = this._cachedRoutes.shift();
                cachedPage.page.dispose();
            }

            history.pushState(newGuid(), document.title, url);

            this.onRouteChanged();
        }

        private findRoute(pathname: string, search: string): IRoute {
            var pathparts = pathname.split("/").filter(x => !isNullOrWhiteSpace(x)).map(x => x.trim());

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
        }

        // #endregion

        // #region Создание страницы

        private resolveRoute(route: IRoute, resolve: (result: IResolvedRoute) => any): void {
            if (route == null) {
                this.resolveWithErrorPage(new NotFoundException("Страница не найдена."), resolve);
            }
            else {
                this.resolveWithPage(route.page, route.params, route.layout, resolve);
            }
        }

        private resolveWithPage(pageNameOrClass: any, params: any, layoutNameOrClass: any, resolve: (result: IResolvedRoute) => any): void {
            this.createPage(pageNameOrClass, params, (page, pageError) => {
                if (pageError != null) {
                    this.resolveWithErrorPage(pageError, resolve);
                    return;
                }

                if (layoutNameOrClass != null) {
                    this.createLayout(layoutNameOrClass,(layout, layoutError) => {
                        if (layoutError != null) {
                            this.resolveWithErrorPage(layoutError, resolve);
                            return;
                        }

                        resolve({ layout: layout, page: page });
                    });

                    return;
                }

                resolve({ page: page });
            });
        }

        private resolveWithErrorPage(error: Exception, resolve: (result: IResolvedRoute) => any) {
            for (var i = 0; i < this._errorHandlers.length; i++) {
                var route = this._errorHandlers[i](error);

                if (route != null) {
                    this.createPage(route.page, route.params, (page, pageError) => {
                        if (pageError == null) {
                            resolve({ page: page });
                        }
                        else {
                            this.resolveWithDefaultErrorPage(pageError, resolve);
                        }
                    });
                }
            }

            this.resolveWithDefaultErrorPage(error, resolve);
        }

        private resolveWithDefaultErrorPage(error: Exception, resolve: (result: IResolvedRoute) => any) {
            var pageName: string;

            if (error instanceof UnauthorizedException || (error instanceof HttpException && error.statusCode == 401)) {
                pageName = "Forbidden";
            }
            else {
                if (error instanceof ForbiddenException || (error instanceof HttpException && error.statusCode == 403)) {
                    pageName = "Forbidden";
                } else {
                    if (error instanceof NotFoundException || (error instanceof HttpException && error.statusCode == 404)) {
                        pageName = "NotFound";
                    } else {
                        if (error instanceof InternalServerErrorPage || (error instanceof HttpException && error.statusCode == 500)) {
                            pageName = "InternalServerError";
                        }
                        else {
                            pageName = "UnknownError";
                        }
                    }
                }
            }

            this.createPage(pageName, { error: error },(errorPage, errorPageError) => {
                if (errorPageError == null) {
                    resolve({ page: errorPage });
                }
                else {
                    resolve({ error: errorPageError });
                }
            });
        }

        private createLayout(nameOrClass: any, callback: (layout: Layout, error?: Exception) => any) {
            var cachedLayout = this._cachedLayouts.filter(x => x.nameOrClass == nameOrClass)[0];

            if (cachedLayout != null) {
                callback(cachedLayout.layout);
                return;
            }

            var layout: Layout;
            var layoutConfig: ILayoutConfig;
            var layoutError: Exception;

            if (typeof nameOrClass == "string") {
                var layoutConfig = layouts.find(nameOrClass);

                if (layoutConfig == null) {
                    callback(null, new NotFoundException("Макет '{0}' не найден.".format(nameOrClass)));
                    return;
                }
            } else {
                layoutConfig = layouts.items.filter(x => x.viewModel == nameOrClass)[0];
            }

            try {
                if (layoutConfig != null) {
                    layout = new Layout(layoutConfig);
                } else {
                    layout = new nameOrClass();
                }
            }
            catch (constructorError) {
                var layoutName = layoutConfig != null ? layoutConfig.name : getFunctionName(nameOrClass);

                if (constructorError == null) {
                    layoutError = new Exception("Произошла ошибка при создании макета '{0}'.".format(layoutName));
                }
                else {
                    layoutError = constructorError instanceof Exception ? constructorError : new Exception(constructorError.toString());
                }
            }

            if (layoutError != null) {
                callback(null, layoutError);
                return;
            }

            layout.onready.subscribe((loadError) => {
                if (loadError != null) {
                    layout.dispose();

                    callback(null, loadError);
                    return;
                }

                this._cachedLayouts.push({
                    layout: layout,
                    nameOrClass: nameOrClass
                });

                callback(layout);
            });
        }

        private createPage(nameOrClass: any, params: any, callback: (page: Page, error?: Exception) => any) {
            var pageConfig: IPageConfig;

            if (typeof nameOrClass == "string") {
                var pageConfig = pages.find(nameOrClass);

                if (pageConfig == null) {
                    callback(null, new NotFoundException("Страница '{0}' не найдена.".format(nameOrClass)));
                    return;
                }
            } else {
                pageConfig = pages.items.filter(x => x.viewModel == nameOrClass)[0];
            }

            var page: Page;
            var pageError: Exception;

            try {
                if (pageConfig != null) {
                    page = new Page(pageConfig, params);
                } else {
                    page = new nameOrClass(params);
                }
            }
            catch (constructorError) {
                var pageName = pageConfig != null ? pageConfig.name : getFunctionName(nameOrClass);

                if (constructorError == null) {
                    pageError = new Exception("Произошла ошибка при создании страницы '{0}'.".format(pageName));
                }
                else {
                    pageError = constructorError instanceof Exception ? constructorError : new Exception(constructorError.toString());
                }
            }

            if (pageError != null) {
                callback(null, pageError);
                return;
            }

            page.onready.subscribe((readyError) => {
                if (readyError != null) {
                    page.dispose();

                    callback(null, readyError);
                    return;
                }

                callback(page);
            });
        }

        // #endregion

        // #region Отображение и скрытие страниц

        private showPage(page: Page, layout?: Layout) {
            if (this._firstPage) {
                this._firstPage = false;
                document.body.innerHTML = "";
            }

            if (this._errorElement != null) {
                GC.disposeElement(this._errorElement);
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

            this._activePage.onparamschanged.subscribe(() => {
                this.onPageParamsChanged(page);
            });

            this._activePage.ontitlechanged.subscribe(() => {
                this.onPageTitleChanged(page);
            });
        }

        private showStandardError(error: Exception) {
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
        }

        private hideActivePage() {
            this._activePage.hide();

            if (this._activeLayout == null) {
                document.body.removeChild(this._activePage.template);
            }
            else {
                this._activeLayout.removePage(this._activePage);
            }

            this._activePage = null;
        }

        private hideActiveLayout() {
            this._activeLayout.hide();

            document.body.removeChild(this._activeLayout.template);

            this._activeLayout = null;
        }

        private onPageParamsChanged(page: Page) {
            var cachedPage = this._cachedRoutes.filter(x => x.page == page)[0];

            if (cachedPage != null) {
                if (cachedPage.routeId == history.state) {
                    history.pushState(history.state, document.title, this.makeUrl(cachedPage.pattern, page.params));
                }
            }
        }

        private onPageTitleChanged(page: Page) {
            var cachedPage = this._cachedRoutes.filter(x => x.page == page)[0];

            if (cachedPage != null) {
                if (cachedPage.routeId == history.state) {
                    document.title = page.title;
                }
            }
        }

        // #endregion

        // #region Работа с URL

        private matchRoute(pathname: string[], pattern: string[]): boolean {
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
        }

        private extractRouteParams(pathname: string[], search: string, pattern: string[]): any {
            var params: any;

            if (search != null) {
                if (search.startsWith("?")) {
                    search = search.substr(1);
                }

                if (search.length > 0) {
                    params = JsonSerializer.deserializeQueryString(search);
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
        }

        private makeUrl(pattern: string, params: any): string {
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
                    url += "?" + JsonSerializer.serializeToQueryString(search);
                }
            }

            return url;
        }

        // #endregion
    }

    export interface IRoutePage {
        /** Название зарегистрированной страницы, класс модели представления зарегистрированной страницы или класс-потомок Page. */
        page: any;

        /** Параметры конструктора страницы. */
        params?: any;
    }

    export interface IRouteLayout {
        /** Название зарегистрированного макета, класс модели представления зарегистрированного макета или класс-потомок Layout. */
        layout: any;
    }

    export interface IRouteChangedEventArgs {
        /** Название зарегистрированной страницы или класс-потомок Page. */
        page: any;

        /** Параметры конструктора страницы. */
        params?: any;

        /** Название зарегистрированного макета или класс-потомок Layout. */
        layout?: any;

        /** Адрес страницы. */
        url: string;
    }

    interface IRoute {
        pattern: string;
        page: any;
        params?: any;
        layout?: any;
    }

    interface IResolvedRoute {
        page?: Page;
        layout?: Layout;
        error?: Exception;
    }

    interface ICachedRoute extends IResolvedRoute {
        routeId: string;
        pattern: string;
    }

    interface ICachedLayout {
        layout: Layout;
        nameOrClass: any;
    }
}