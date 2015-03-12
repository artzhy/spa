ko.bindingHandlers["autofocus"] = {
    "update": function (element, valueAccessor) {
        var value = ko.utils.unwrapObservable(valueAccessor());
        if (value) {
            if (!element.hasAttribute("autofocus")) {
                element.setAttribute("autofocus", "");
                setTimeout(function () {
                    element.focus();
                }, 1);
            }
        }
        else {
            if (element.hasAttribute("autofocus")) {
                element.removeAttribute("autofocus");
            }
        }
    }
};
ko.bindingHandlers["focused"] = {
    init: function (element, valueAccessor, allBindings, viewModel, bindingContext) {
        var subscription;
        var value = valueAccessor();
        if (ko.isObservable(value)) {
            subscription = value.subscribe(function (newValue) {
                updateFocus();
            });
        }
        updateFocus();
        function updateFocus() {
            var focused = ko.unwrap(valueAccessor());
            if (focused) {
                if (element.tabIndex != -1 && !isElementFocused()) {
                    element.focus();
                }
            }
            else {
                if (isElementFocused()) {
                    document.activeElement.blur();
                }
            }
        }
        function updateValue() {
            var focused = isElementFocused();
            var value = valueAccessor();
            if (ko.isObservable(value)) {
                if (ko.isWriteableObservable(value)) {
                    if (value() != focused) {
                        value(focused);
                    }
                }
            }
            else {
                if (value != focused) {
                    value = focused;
                }
            }
        }
        function isChildOf(child, parent) {
            var element = child.parentNode;
            while (element != null && element != document.body) {
                if (element == parent) {
                    return true;
                }
                element = element.parentNode;
            }
            return false;
        }
        function isElementFocused() {
            return document.activeElement != null && (document.activeElement == element || isChildOf(document.activeElement, element));
        }
        function focusChanged(event) {
            updateValue();
        }
        function windowBlur() {
            if (viewModel.focused() != false) {
                viewModel.focused(false);
            }
        }
        element.addEventListener('blur', focusChanged, true);
        element.addEventListener('focus', focusChanged, true);
        window.addEventListener("blur", windowBlur);
        ko.utils.domNodeDisposal.addDisposeCallback(element, function () {
            if (subscription != null) {
                subscription.dispose();
            }
            element.removeEventListener("blur", focusChanged, true);
            element.removeEventListener("focus", focusChanged, true);
            window.removeEventListener("blur", windowBlur);
        });
    }
};
ko.bindingHandlers["pert"] = {
    init: function (element, valueAccessor, allBindings, viewModel, bindingContext) {
        var value = valueAccessor();
        var pert = new spa.controls.PertDiagram(element);
        pert.refresh();
        value(pert);
        ko.utils.domNodeDisposal.addDisposeCallback(element, function () {
            pert.dispose();
        });
    }
};
ko.bindingHandlers["readOnly"] = {
    update: function (element, valueAccessor) {
        var value = ko.utils.unwrapObservable(valueAccessor());
        if (value) {
            element.setAttribute("readOnly", true);
        }
        else {
            element.removeAttribute("readOnly");
        }
    }
};
ko.bindingHandlers["scrollTop"] = {
    init: function (element, valueAccessor, allBindings, viewModel, bindingContext) {
        //function onScroll(ev: Event) {
        //    var value = valueAccessor();
        //    if (ko.isWriteableObservable(value)) {
        //        value(element.scrollTop);
        //    } else {
        //        value = element.scrollTop;
        //    }
        //}
        //element.addEventListener("scroll", onScroll);
        //ko.utils.domNodeDisposal.addDisposeCallback(element, function () {
        //    element.removeEventListener("scroll", onScroll);
        //});
    },
    update: function (element, valueAccessor, allBindings, viewModel, bindingContext) {
        element.scrollTop = ko.unwrap(valueAccessor());
    }
};
/*
    Добавляет класс 'selected' строке таблицы по индексу. Индекс передается в valueAccessor.
*/
ko.bindingHandlers["selectedRowIndex"] = {
    update: function (element, valueAccessor, allBindings, viewModel, bindingContext) {
        var rowIndex = ko.unwrap(valueAccessor());
        if (element.tBodies.length > 0) {
            var tableBody = element.tBodies[0];
            var rows = tableBody.getElementsByTagName("TR");
            for (var i = 0; i < rows.length; i++) {
                var row = rows[i];
                if (row.classList.contains("grid-row-selected")) {
                    if (rowIndex != i) {
                        row.classList.remove("grid-row-selected");
                    }
                }
                else {
                    if (rowIndex == i) {
                        row.classList.add("grid-row-selected");
                    }
                }
            }
        }
    }
};
ko.bindingHandlers["stopBinding"] = {
    init: function () {
        return { controlsDescendantBindings: true };
    }
};
var spa;
(function (spa) {
    var controls;
    (function (controls) {
        var Component = (function () {
            function Component(params) {
                this._propertySubscriptions = [];
            }
            Component.prototype.createObservableProperty = function (propertyName, value, sourceProperty) {
                var _this = this;
                if (sourceProperty == null) {
                    this[propertyName] = ko.observable(value);
                }
                else {
                    if (ko.isObservable(sourceProperty)) {
                        if (ko.isComputed(sourceProperty)) {
                            this[propertyName] = ko.observable(ko.unwrap(sourceProperty));
                            this._propertySubscriptions.push(sourceProperty.subscribe(function (newValue) {
                                if (!_this.compare(_this[propertyName](), newValue)) {
                                    _this[propertyName](newValue);
                                }
                            }));
                        }
                        else {
                            this[propertyName] = sourceProperty;
                        }
                    }
                    else {
                        this[propertyName] = ko.observable(sourceProperty);
                    }
                }
            };
            Component.prototype.createObservableArrayProperty = function (propertyName, value, sourceProperty) {
                var _this = this;
                if (sourceProperty == null) {
                    this[propertyName] = ko.observableArray(value);
                }
                else {
                    if (ko.isObservable(sourceProperty)) {
                        if (ko.isComputed(sourceProperty)) {
                            this[propertyName] = ko.observableArray(ko.unwrap(sourceProperty));
                            this._propertySubscriptions.push(sourceProperty.subscribe(function (newValue) {
                                _this[propertyName](newValue);
                            }));
                        }
                        else {
                            this[propertyName] = sourceProperty;
                        }
                    }
                    else {
                        this[propertyName] = ko.observableArray(sourceProperty);
                    }
                }
            };
            Component.prototype.compare = function (value1, value2) {
                if (value1 === undefined || value2 === undefined) {
                    return value1 === undefined && value2 === undefined;
                }
                if (value1 === null || value2 === null) {
                    return value1 === null && value2 === null;
                }
                if (typeof value1 == "number" || typeof value2 == "number") {
                    return (value1 == value2) || (isNaN(value1) && isNaN(value2));
                }
                if (value1 instanceof Date || value2 instanceof Date) {
                    return value1.toString() == value2.toString();
                }
                return value1 === value2;
            };
            Component.prototype.subscribe = function (property, handler) {
                this._propertySubscriptions.push(property.subscribe(handler));
            };
            Component.prototype.subscribeArrayChange = function (property, added, removed) {
                this._propertySubscriptions.push(property.subscribe(function (changes) {
                    changes.forEach(function (change) {
                        if (change.status == "added") {
                            if (added != null) {
                                added(change.value);
                            }
                        }
                        else {
                            if (change.status == "deleted") {
                                if (removed != null) {
                                    removed(change.value);
                                }
                            }
                        }
                    });
                }, null, "arrayChange"));
            };
            Component.prototype.ensureParametersValid = function (validParameters, params, componentName) {
                if (params != null) {
                    Object.getOwnPropertyNames(params).forEach(function (propertyName) {
                        if (validParameters.indexOf(propertyName) == -1 && propertyName != "$raw") {
                            if (componentName === undefined) {
                                throw "Invalid parameter name: " + propertyName;
                            }
                            else {
                                throw "Invalid parameter name: " + propertyName + " (component name: " + componentName + ")";
                            }
                        }
                    });
                }
                Object;
            };
            Component.prototype.dispose = function () {
                this._propertySubscriptions.forEach(function (subscription) {
                    subscription.dispose();
                });
                this._propertySubscriptions.length = 0;
            };
            return Component;
        })();
        controls.Component = Component;
    })(controls = spa.controls || (spa.controls = {}));
})(spa || (spa = {}));
/// <reference path="../component.ts" />
var __extends = this.__extends || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
var spa;
(function (spa) {
    var controls;
    (function (controls) {
        var Autocomplete = (function (_super) {
            __extends(Autocomplete, _super);
            function Autocomplete(params) {
                _super.call(this, params);
                this.activeItem = ko.observable(null);
                this.focused = ko.observable(false);
                this.popupFocused = ko.observable(false);
                this.searchTimer = null;
                this.suggestions = ko.observableArray();
                this.suspendEvents = 0;
                this.visited = false;
                this.ensureParametersValid(["autofocus", "buffer", "enabled", "items", "placeholder", "text", "textMember", "value"], params, Autocomplete.componentName);
                if (params == null) {
                    params = {};
                }
                this.createObservableProperty("autofocus", null, params.autofocus);
                this.createObservableProperty("buffer", 200, params.buffer);
                this.createObservableProperty("enabled", true, params.enabled);
                this.createObservableProperty("items", null, params.items);
                this.createObservableProperty("placeholder", null, params.placeholder);
                this.createObservableProperty("text", null, params.text);
                this.createObservableProperty("textMember", null, params.textMember);
                this.createObservableProperty("value", null, params.value);
                this.bindMethods();
                if (this.value() != null) {
                    this.text(this.getItemText(this.value()));
                }
                this.subscribe(this.focused, this.onFocusedChanged);
                this.subscribe(this.items, this.onItemsChanged);
                this.subscribe(this.text, this.onTextChanged);
                this.subscribe(this.textMember, this.onTextMemberChanged);
                this.subscribe(this.value, this.onValueChanged);
                this.createComputedProperties();
            }
            Autocomplete.prototype.bindMethods = function () {
                this.onFocusedChanged = this.onFocusedChanged.bind(this);
                this.onKeyDown = this.onKeyDown.bind(this);
                this.onItemClick = this.onItemClick.bind(this);
                this.onItemMouseOver = this.onItemMouseOver.bind(this);
                this.onItemsChanged = this.onItemsChanged.bind(this);
                this.onTextChanged = this.onTextChanged.bind(this);
                this.onTextMemberChanged = this.onTextMemberChanged.bind(this);
                this.onValueChanged = this.onValueChanged.bind(this);
            };
            Autocomplete.prototype.createComputedProperties = function () {
                var _this = this;
                this.placeholderText = ko.computed(function () {
                    if (_this.value() == null) {
                        return _this.placeholder();
                    }
                    return "";
                });
                this.autocompleteFocused = ko.computed(function () {
                    return _this.focused() || _this.popupFocused();
                }).extend({ rateLimit: 1 });
                this.popupVisible = ko.computed(function () {
                    //  console.log("input: " + this.focused() + ", popup: " + this.popupFocused());
                    // return true;
                    return _this.enabled() && _this.autocompleteFocused() && _this.value() == null && _this.suggestions() != null && _this.suggestions().length > 0;
                });
            };
            Autocomplete.prototype.onFocusedChanged = function (focused) {
                if (this.visited == false) {
                    this.updateItems(false);
                    this.visited = true;
                }
            };
            Autocomplete.prototype.onKeyDown = function (data, ev) {
                if (ev.keyCode == 13) {
                    this.value(this.activeItem());
                }
                else {
                    if (ev.keyCode == 38 || ev.keyCode == 40) {
                        this.activeItem(this.getAdjacentItem(this.activeItem(), ev.keyCode == 38));
                        return false;
                    }
                }
                return true;
            };
            Autocomplete.prototype.onItemClick = function (item, ev) {
                this.focused(true);
                this.value(item);
            };
            Autocomplete.prototype.onItemMouseDown = function (item, ev) {
                return false;
            };
            Autocomplete.prototype.onItemMouseOver = function (item, ev) {
                this.activeItem(item);
            };
            Autocomplete.prototype.onItemsChanged = function (func) {
                var value = this.value();
                if (value == null) {
                    this.updateItems(true);
                }
            };
            Autocomplete.prototype.onPopupMouseDown = function () {
            };
            Autocomplete.prototype.onTextChanged = function (text) {
                if (this.suspendEvents > 0) {
                    return;
                }
                this.updateItems(true);
            };
            Autocomplete.prototype.onTextMemberChanged = function (textMember) {
                if (this.suspendEvents > 0) {
                    return;
                }
                var value = this.value();
                if (value != null) {
                    var text = this.getItemText(value);
                    if (text != this.text()) {
                        this.text(text);
                    }
                }
                else {
                    this.updateItems(true);
                }
            };
            Autocomplete.prototype.onValueChanged = function (value) {
                if (this.suspendEvents > 0) {
                    return;
                }
                if (value != null) {
                    var text = this.getItemText(value);
                    if (text != this.text()) {
                        this.suspendEvents++;
                        this.text(text);
                        this.suspendEvents--;
                    }
                }
            };
            Autocomplete.prototype.updateItems = function (buffered) {
                var _this = this;
                var timeout = buffered ? this.buffer() : 0;
                if (this.searchTimer != null) {
                    clearTimeout(this.searchTimer);
                }
                this.searchTimer = setTimeout(function () {
                    _this.searchTimer = null;
                    var text = _this.text();
                    _this.queryItems(text, function (items) {
                        if (text == _this.text()) {
                            _this.suggestions(items);
                            if (items != null && items.length == 1 && _this.getItemText(items[0]).toUpperCase() == (text + "").toUpperCase()) {
                                if (_this.value() != items[0]) {
                                    _this.value(items[0]);
                                }
                            }
                            else {
                                var value = _this.value();
                                if (value != null && _this.getItemText(value).toUpperCase() != (text + "").toUpperCase()) {
                                    _this.value(null);
                                }
                            }
                        }
                    });
                }, timeout);
            };
            Autocomplete.prototype.getItemText = function (item) {
                if (item == null) {
                    return null;
                }
                var textMember = this.textMember();
                if (textMember != null) {
                    var text = typeof textMember == "function" ? textMember(item) : ko.unwrap(item[textMember]);
                    if (text != null) {
                        text = text.toString();
                    }
                    else {
                        text = "";
                    }
                    return text;
                }
                else {
                    return item.toString();
                }
            };
            Autocomplete.prototype.queryItems = function (text, done) {
                var _this = this;
                var items = this.items();
                if (items == null) {
                    done(null);
                    return;
                }
                if (typeof items == "string") {
                    this.queryUrl(items, text, done);
                    return;
                }
                if (typeof items == "function") {
                    items(text, function (response) {
                        done(response);
                    });
                    return;
                }
                if (items instanceof Array) {
                    if (text == null || text.trim().length == 0) {
                        done(items.slice(0, Math.max(9, items.length - 1)));
                        return;
                    }
                    var result = [];
                    var searchWords = text.toLowerCase().split(" ").filter(function (x) { return x.trim().length > 0; });
                    items.forEach(function (item) {
                        var itemText = _this.getItemText(item).toLowerCase();
                        if (searchWords.every(function (x) { return itemText.indexOf(x) != -1; })) {
                            result.push(item);
                        }
                        if (result.length == 10) {
                            return;
                        }
                    });
                    done(result);
                    return;
                }
                throw "Invalid autocomplete.items value: " + items;
            };
            Autocomplete.prototype.queryUrl = function (url, text, done) {
                var _this = this;
                url += (url.indexOf("?") == -1 ? "&" : "?") + "searchText=" + text;
                var request = new XMLHttpRequest();
                // Fires when the request aborted.
                request.onabort = function () {
                    console.error("Autocomplete request aborted: " + url);
                };
                // Fires when the request fails.
                request.onerror = function (ev) {
                    console.error("Autocomplete request error: " + url + ". " + ev.message + ". " + request.status);
                };
                // Fires when the request is successfully completed.
                request.onload = function () {
                    if (request.status >= 200 && request.status <= 204) {
                        try {
                            done(_this.parseAjaxResponse(request.response));
                        }
                        catch (e) {
                            done(request.response);
                        }
                    }
                    else {
                        var errorMessage = request.statusText;
                        try {
                            var response = JSON.parse(request.response);
                            if ("message" in response) {
                                errorMessage = response["message"];
                            }
                        }
                        catch (e) {
                        }
                        throw "Autocomplete request error: " + url + ". " + errorMessage + ". " + request.status;
                    }
                };
                // Fires when an author-specified period of time has elapsed.
                request.ontimeout = function () {
                    console.error("Autocomplete request timeout: " + url);
                };
                request.open("GET", url, true);
                request.send();
            };
            Autocomplete.prototype.parseAjaxResponse = function (response) {
                return JSON.parse(response, function (key, value) {
                    if (typeof value == "string") {
                        // detecting ISO date 2014-06-21T00:36:04.472Z; 2014-07-16T00:00:00 2013-12-31T20:00:00Z;
                        if (value[10] == "T") {
                            try {
                                var date = new Date(value);
                                if (isNaN(date.getTime())) {
                                    return value;
                                }
                                else {
                                    return date;
                                }
                            }
                            catch (error) {
                                return value;
                            }
                        }
                    }
                    ;
                    return value;
                });
            };
            Autocomplete.prototype.getAdjacentItem = function (currentItem, previous) {
                var items = this.suggestions();
                if (items == null || items.length == 0) {
                    return null;
                }
                var index = (currentItem == null ? -1 : items.indexOf(currentItem)) + (previous ? -1 : 1);
                if (index < 0) {
                    index = items.length - 1;
                }
                if (index > items.length - 1) {
                    index = 0;
                }
                return items[index];
            };
            Autocomplete.prototype.dispose = function () {
                _super.prototype.dispose.call(this);
                this.placeholderText.dispose();
                this.popupVisible.dispose();
            };
            Autocomplete.componentName = "autocomplete";
            return Autocomplete;
        })(controls.Component);
        ko.components.register("autocomplete", {
            viewModel: Autocomplete,
            template: "<input class=\"input\" type=\"text\" data-bind=\"     attr: { placeholder: placeholderText },     autofocus: autofocus,     css: { focus: autocompleteFocused },     enable: enabled,     event: { keydown: onKeyDown },     hasFocus: focused,     value: text,     valueUpdate: 'input'\" /> <div class=\"popup\" tabindex=\"-1\" data-bind=\"     event: { mousedown: onPopupMouseDown },     foreach: suggestions,     hasFocus: popupFocused,     visible: popupVisible\">     <!-- ko if: $componentTemplateNodes != null && $componentTemplateNodes.length > 0 -->     <div class=\"popup-item\" data-bind=\"         click: $parent.onItemClick,         css: { active: $parent.activeItem() == $data },         event: { mouseover: $parent.onItemMouseOver, mousedown: $parent.onItemMouseDown },         template: { nodes: $componentTemplateNodes }\">     </div>     <!-- /ko -->     <!-- ko if: $componentTemplateNodes == null || $componentTemplateNodes.length > 0 -->     <div class=\"popup-item\" data-bind=\"         click: $parent.onItemClick,         css: { active: $parent.activeItem() == $data },         event: { mouseover: $parent.onItemMouseOver, mousedown: $parent.onItemMouseDown },         html: $parent.getItemText($data)\">     </div>     <!-- /ko --> </div>"
        });
    })(controls = spa.controls || (spa.controls = {}));
})(spa || (spa = {}));
/// <reference path="../component.ts" />
var spa;
(function (spa) {
    var controls;
    (function (controls) {
        var Calendar = (function (_super) {
            __extends(Calendar, _super);
            function Calendar(params) {
                _super.call(this, params);
                this.date = ko.observable(new Date());
                this.level = ko.observable(2);
                this.ensureParametersValid(["value"], params, Calendar.componentName);
                if (params == null) {
                    params = {};
                }
                this.bindHandlers();
                this.createObservableProperty("value", null, params.value);
                this.createComputedProperties();
                this.onValueChanged(this.value());
                this.subscribe(this.value, this.onValueChanged);
            }
            Calendar.prototype.bindHandlers = function () {
                this.back = this.back.bind(this);
                this.cellClick = this.cellClick.bind(this);
                this.forward = this.forward.bind(this);
                this.up = this.up.bind(this);
                this.onValueChanged = this.onValueChanged.bind(this);
            };
            Calendar.prototype.onValueChanged = function (value) {
                this.date(value == null ? new Date() : value);
            };
            Calendar.prototype.back = function () {
                switch (this.level()) {
                    case 0:
                        this.date(this.addYears(this.date(), -10));
                        break;
                    case 1:
                        this.date(this.addYears(this.date(), -1));
                        break;
                    case 2:
                        this.date(this.addMonths(this.date(), -1));
                        break;
                    default: break;
                }
            };
            Calendar.prototype.up = function () {
                if (this.level() > 0) {
                    this.level(this.level() - 1);
                }
            };
            Calendar.prototype.forward = function () {
                switch (this.level()) {
                    case 0:
                        this.date(this.addYears(this.date(), 10));
                        break;
                    case 1:
                        this.date(this.addYears(this.date(), 1));
                        break;
                    case 2:
                        this.date(this.addMonths(this.date(), 1));
                        break;
                    default: break;
                }
            };
            Calendar.prototype.cellClick = function (cell) {
                switch (this.level()) {
                    case 0:
                        this.date(cell.value);
                        this.level(1);
                        break;
                    case 1:
                        this.date(cell.value);
                        this.level(2);
                        break;
                    case 2:
                        this.date(cell.value);
                        if (!this.isSameDate(this.value(), cell.value)) {
                            this.value(cell.value);
                        }
                        break;
                    default:
                        break;
                }
            };
            // #region Computed properties
            Calendar.prototype.createComputedProperties = function () {
                var _this = this;
                this.cells = ko.computed(function () {
                    return _this.getCells();
                }).extend({ rateLimit: 1 });
                this.headerCells = ko.computed(function () {
                    return _this.getHeaderCells();
                });
                this.headerVisible = ko.computed(function () {
                    return _this.getHeaderVisible();
                });
                this.period = ko.computed(function () {
                    return _this.getPeriod();
                });
            };
            Calendar.prototype.getCells = function () {
                var _this = this;
                var cells = [];
                var now = new Date();
                // years;
                if (this.level() == 0) {
                    var decadeStart = Math.floor(this.date().getUTCFullYear() / 10) * 10;
                    for (var i = decadeStart - 1; i < decadeStart + 11; i++) {
                        var value = new Date(Date.UTC(i, 0, 1));
                        cells.push({
                            grayed: i == decadeStart - 1 || i == decadeStart + 11 - 1,
                            selected: this.isSameYear(value, this.value()),
                            text: i.toString(),
                            today: this.isSameYear(value, now),
                            value: value
                        });
                    }
                }
                // months;
                if (this.level() == 1) {
                    for (var i = 0; i <= 11; i++) {
                        var value = new Date(Date.UTC(this.date().getUTCFullYear(), i, 1));
                        cells.push({
                            grayed: false,
                            selected: this.isSameMonth(value, this.value()),
                            text: this.getMonthText(i).substr(0, 3).toLowerCase(),
                            today: this.isSameMonth(value, now),
                            value: value
                        });
                    }
                }
                // days;
                if (this.level() == 2) {
                    var firstDayOfMonth = new Date(Date.UTC(this.date().getUTCFullYear(), this.date().getUTCMonth(), 1));
                    var dow = firstDayOfMonth.getUTCDay();
                    var firstMonday = dow == 0 ? this.addDays(firstDayOfMonth, -6) : this.addDays(firstDayOfMonth, 1 - dow);
                    for (var i = 0; i < 42; i++) {
                        var value = this.addDays(firstMonday, i);
                        cells.push({
                            grayed: this.isSameMonth(firstDayOfMonth, value) == false,
                            selected: this.isSameDate(value, this.value()),
                            text: value.getUTCDate().toString(),
                            today: this.isSameDate(value, now),
                            value: value
                        });
                    }
                }
                cells.forEach(function (cell) {
                    var className = [];
                    switch (_this.level()) {
                        case 0:
                            className.push("year");
                            break;
                        case 1:
                            className.push("month");
                            break;
                        case 2:
                            className.push("day");
                            break;
                        default: break;
                    }
                    if (cell.grayed) {
                        className.push("grayed");
                    }
                    if (cell.selected) {
                        className.push("selected");
                    }
                    if (cell.today) {
                        className.push("today");
                    }
                    cell.className = className.join(" ");
                });
                return cells;
            };
            Calendar.prototype.getHeaderCells = function () {
                return ["пн", "вт", "ср", "чт", "пт", "сб", "вс"];
            };
            Calendar.prototype.getHeaderVisible = function () {
                return this.level() == 2;
            };
            Calendar.prototype.getPeriod = function () {
                switch (this.level()) {
                    case 0:
                        var decadeStart = Math.floor(this.date().getUTCFullYear() / 10) * 10;
                        return decadeStart.toString() + "-" + (decadeStart + 9).toString();
                    case 1:
                        return this.date().getUTCFullYear().toString();
                    case 2:
                        return this.getMonthText(this.date().getUTCMonth()) + " " + this.date().getUTCFullYear().toString();
                    default:
                        return "";
                }
            };
            // #endregion
            // #region Helpers
            Calendar.prototype.getMonthText = function (month) {
                switch (month) {
                    case 0: return "Январь";
                    case 1: return "Февраль";
                    case 2: return "Март";
                    case 3: return "Апрель";
                    case 4: return "Май";
                    case 5: return "Июнь";
                    case 6: return "Июль";
                    case 7: return "Август";
                    case 8: return "Сентябрь";
                    case 9: return "Октябрь";
                    case 10: return "Ноябрь";
                    case 11: return "Декабрь";
                }
            };
            Calendar.prototype.addDays = function (date, days) {
                return new Date(date.getTime() + 1000 * 60 * 60 * 24 * days);
            };
            Calendar.prototype.addMonths = function (date, months) {
                var year = date.getUTCFullYear();
                var month = date.getUTCMonth();
                while (months != 0) {
                    month += months > 0 ? 1 : -1;
                    if (month == -1) {
                        month = 11;
                        year--;
                    }
                    if (month == 12) {
                        month = 0;
                        year++;
                    }
                    months += months > 0 ? -1 : 1;
                }
                return new Date(Date.UTC(year, month, date.getUTCDate(), date.getUTCHours(), date.getUTCMinutes(), date.getUTCSeconds(), date.getUTCMilliseconds()));
            };
            Calendar.prototype.addYears = function (date, years) {
                return new Date(Date.UTC(date.getUTCFullYear() + years, date.getUTCMonth(), date.getUTCDate(), date.getUTCHours(), date.getUTCMinutes(), date.getUTCSeconds(), date.getUTCMilliseconds()));
            };
            Calendar.prototype.isSameDate = function (date1, date2) {
                if (date1 != null && date2 != null) {
                    return date1.toDateString() == date2.toDateString();
                }
                else {
                    return date1 == null && date2 == null;
                }
            };
            Calendar.prototype.isSameMonth = function (date1, date2) {
                if (date1 != null && date2 != null) {
                    return date1.getUTCFullYear() == date2.getUTCFullYear() && date1.getUTCMonth() == date2.getUTCMonth();
                }
                return false;
            };
            Calendar.prototype.isSameYear = function (date1, date2) {
                if (date1 != null && date2 != null) {
                    return date1.getUTCFullYear() == date2.getUTCFullYear();
                }
                return false;
            };
            Calendar.prototype.isSameDecade = function (date1, date2) {
                if (date1 != null && date2 != null) {
                    var decadeStart = Math.floor(date1.getUTCFullYear() / 10) * 10;
                    if (date2.getUTCFullYear() >= decadeStart && date2.getUTCFullYear() < decadeStart + 10) {
                        return true;
                    }
                }
                return false;
            };
            // #endregion
            Calendar.prototype.dispose = function () {
                this.cells.dispose();
                this.headerCells.dispose();
                this.headerVisible.dispose();
                this.period.dispose();
            };
            Calendar.componentName = "calendar";
            return Calendar;
        })(controls.Component);
        controls.Calendar = Calendar;
        ko.components.register(Calendar.componentName, {
            viewModel: Calendar,
            template: "<div class=\"buttons\">     <button class=\"button back\" data-bind=\"click: back\"></button>     <button class=\"button up\" data-bind=\"click: up, text: period\"></button>     <button class=\"button forward\" data-bind=\"click: forward\"></button> </div> <ul class=\"header\" data-bind=\"foreach: headerCells, visible: headerVisible\">     <li class=\"dow\" data-bind=\"text: $data\"></li> </ul> <ul class=\"dates\" data-bind=\"foreach: cells, css: { 'header-visible': headerVisible }\">     <li data-bind=\"click: $parent.cellClick, css: className, text: text\"></li> </ul>"
        });
    })(controls = spa.controls || (spa.controls = {}));
})(spa || (spa = {}));
var spa;
(function (spa) {
    var controls;
    (function (controls) {
        var CheckBox = (function (_super) {
            __extends(CheckBox, _super);
            function CheckBox(params) {
                _super.call(this, params);
                this.disableSubscriptions = false;
                this.hasFocus = ko.observable();
                this.hasMouse = ko.observable();
                this.ensureParametersValid(["align", "autofocus", "checked", "enabled", "text", "value", "valueChecked", "valueUnchecked"], params, CheckBox.componentName);
                if (params == null) {
                    params = {};
                }
                this.bindMethods();
                this.createObservableProperty("align", "left", params.align);
                this.createObservableProperty("autofocus", false, params.autofocus);
                this.createObservableProperty("checked", false, params.checked);
                this.createObservableProperty("enabled", true, params.enabled);
                this.createObservableProperty("text", null, params.text);
                this.createObservableProperty("value", false, params.value);
                this.createObservableProperty("valueChecked", true, params.valueChecked);
                this.createObservableProperty("valueUnchecked", false, params.valueUnchecked);
                if (params.checked !== undefined) {
                    this.onPropertyChanged("checked");
                }
                else {
                    if (params.value !== undefined) {
                        this.onPropertyChanged("value");
                    }
                }
                this.subscribe(this.checked, this.onCheckedChanged);
                this.subscribe(this.value, this.onValueChanged);
                this.subscribe(this.valueChecked, this.onValueCheckedChanged);
                this.subscribe(this.valueUnchecked, this.onValueUncheckedChanged);
                this.createComputed();
            }
            CheckBox.prototype.onMouseEnter = function () {
                this.hasMouse(true);
            };
            CheckBox.prototype.onMouseLeave = function () {
                this.hasMouse(false);
            };
            CheckBox.prototype.bindMethods = function () {
                this.onCheckedChanged = this.onCheckedChanged.bind(this);
                this.onClick = this.onClick.bind(this);
                this.onKeyPress = this.onKeyPress.bind(this);
                this.onMouseEnter = this.onMouseEnter.bind(this);
                this.onMouseLeave = this.onMouseLeave.bind(this);
                this.onValueChanged = this.onValueChanged.bind(this);
                this.onValueCheckedChanged = this.onValueCheckedChanged.bind(this);
                this.onValueUncheckedChanged = this.onValueUncheckedChanged.bind(this);
            };
            CheckBox.prototype.onClick = function () {
                if (this.enabled()) {
                    this.checked(!this.checked());
                    if (!this.hasFocus()) {
                        this.hasFocus(true);
                    }
                }
            };
            CheckBox.prototype.onLabelMouseDown = function () {
                if (this.enabled()) {
                    return false;
                }
                return true;
            };
            CheckBox.prototype.onKeyPress = function (data, ev) {
                if (this.enabled() && ev.keyCode == 32) {
                    this.checked(!this.checked());
                    return false;
                }
                return true;
            };
            CheckBox.prototype.createComputed = function () {
                var _this = this;
                this.hasText = ko.computed(function () {
                    return _this.text() != null && _this.text().trim().length > 0;
                });
                this.state = ko.computed(function () {
                    var state = [];
                    if (_this.enabled()) {
                        if (_this.hasFocus()) {
                            state.push("focused");
                        }
                        else {
                            if (_this.hasMouse()) {
                                state.push("hovered");
                            }
                        }
                    }
                    else {
                        state.push("disabled");
                    }
                    if (_this.checked()) {
                        state.push("checked");
                    }
                    return state.join(" ");
                });
            };
            CheckBox.prototype.onCheckedChanged = function (checked) {
                this.onPropertyChanged("checked");
            };
            CheckBox.prototype.onValueChanged = function (value) {
                this.onPropertyChanged("value");
            };
            CheckBox.prototype.onValueCheckedChanged = function (valueChecked) {
                this.onPropertyChanged("valueChecked");
            };
            CheckBox.prototype.onValueUncheckedChanged = function (valueUnchecked) {
                this.onPropertyChanged("valueUnchecked");
            };
            CheckBox.prototype.onPropertyChanged = function (propertyName) {
                if (this.disableSubscriptions) {
                    return;
                }
                this.disableSubscriptions = true;
                if (propertyName == "checked") {
                    var value = this.value();
                    if (value instanceof Array) {
                        var index = value.indexOf(this.valueChecked());
                        if (this.checked()) {
                            if (index == -1) {
                                value.push(this.valueChecked());
                                this.value(value);
                            }
                        }
                        else {
                            if (index != -1) {
                                value.splice(index, 1);
                                this.value(value);
                            }
                        }
                    }
                    else {
                        var newValue = this.checked() ? this.valueChecked() : this.valueUnchecked();
                        if (!this.compare(value, newValue)) {
                            this.value(newValue);
                        }
                    }
                }
                if (propertyName == "value" || propertyName == "valueChecked" || propertyName == "valueUnchecked") {
                    var value = this.value();
                    if (value instanceof Array) {
                        var newChecked = value.indexOf(this.valueChecked()) != -1;
                        if (this.checked() != newChecked) {
                            this.checked(newChecked);
                        }
                    }
                    else {
                        var newChecked = this.compare(value, this.valueChecked());
                        if (this.checked() != newChecked) {
                            this.checked(newChecked);
                        }
                    }
                }
                this.disableSubscriptions = false;
            };
            CheckBox.prototype.dispose = function () {
                this.hasText.dispose();
                this.state.dispose();
            };
            CheckBox.componentName = "check-box";
            return CheckBox;
        })(controls.Component);
        controls.CheckBox = CheckBox;
        ko.components.register(CheckBox.componentName, {
            viewModel: CheckBox,
            template: "<table>     <tr>         <!-- ko if: align() == 'left' -->         <td class=\"button-cell\">             <div class=\"button\" data-bind=\"autofocus: autofocus, attr: { tabIndex: enabled() ? 0 : -1 }, hasFocus: hasFocus, click: onClick, css: 'button ' + state(), event: { keypress: onKeyPress, mouseover: onMouseEnter, mouseout: onMouseLeave }\"></div>         </td>         <!-- /ko -->         <!-- ko if: hasText -->         <td class=\"text-cell\" data-bind=\"style: { 'text-align': align }\">             <div class=\"text\" data-bind=\"click: onClick, html: text, css: 'text ' + state(), event: { mousedown: onLabelMouseDown, mouseover: onMouseEnter, mouseout: onMouseLeave }\"></div>         </td>         <!-- /ko -->         <!-- ko if: align() == 'right' -->         <td class=\"button-cell\">             <div class=\"button\" data-bind=\"autofocus: autofocus, attr: { tabIndex: enabled() ? 0 : -1 }, hasFocus: hasFocus, click: onClick, css: 'button ' + state(), event: { keypress: onKeyPress, mouseover: onMouseEnter, mouseout: onMouseLeave }\"></div>         </td>         <!-- /ko -->     </tr> </table>"
        });
    })(controls = spa.controls || (spa.controls = {}));
})(spa || (spa = {}));
var spa;
(function (spa) {
    var controls;
    (function (controls) {
        var ComboBox = (function (_super) {
            __extends(ComboBox, _super);
            function ComboBox(params) {
                _super.call(this, params);
                this.activeItem = ko.observable(null);
                this.emptyItem = {};
                this.hasMouse = ko.observable(false);
                this.inputHasFocus = ko.observable(false);
                this.popupHasFocus = ko.observable(false);
                this.popupVisible = ko.observable(false);
                this.selectedItem = ko.observable();
                this.ensureParametersValid(["autofocus", "emptyText", "enabled", "items", "placeholder", "text", "textMember", "value", "valueMember"], params, ComboBox.componentName);
                if (params == null) {
                    params = {};
                }
                this.bindMethods();
                this.createObservableProperty("autofocus", null, params.autofocus);
                this.createObservableProperty("emptyText", undefined, params.emptyText);
                this.createObservableProperty("enabled", true, params.enabled);
                this.createObservableArrayProperty("items", null, params.items);
                this.createObservableProperty("placeholder", null, params.placeholder);
                this.createObservableProperty("text", null, params.text);
                this.createObservableProperty("textMember", null, params.textMember);
                this.createObservableProperty("value", null, params.value);
                this.createObservableProperty("valueMember", null, params.valueMember);
                this.selectedItem(this.emptyItem);
                if (this.value() != null) {
                    this.onValueChanged(this.value());
                }
                else {
                    if (this.text() != null) {
                        this.onTextChanged(this.text());
                    }
                }
                this.createComputedProperties();
                this.subscribe(this.hasFocus, this.onHasFocusChanged);
                this.subscribe(this.items, this.onItemsChanged);
                this.subscribe(this.selectedItem, this.onSelectedItemChanged);
                this.subscribe(this.text, this.onTextChanged);
                this.subscribe(this.textMember, this.onTextMemberChanged);
                this.subscribe(this.value, this.onValueChanged);
                this.subscribe(this.valueMember, this.onValueMemberChanged);
            }
            ComboBox.prototype.bindMethods = function () {
                this.getItemText = this.getItemText.bind(this);
                this.getItemValue = this.getItemValue.bind(this);
                this.onEmptyItemClick = this.onEmptyItemClick.bind(this);
                this.onHasFocusChanged = this.onHasFocusChanged.bind(this);
                this.onInputClick = this.onInputClick.bind(this);
                this.onItemClick = this.onItemClick.bind(this);
                this.onItemHovered = this.onItemHovered.bind(this);
                this.onItemsChanged = this.onItemsChanged.bind(this);
                this.onKeyDown = this.onKeyDown.bind(this);
                this.onSelectedItemChanged = this.onSelectedItemChanged.bind(this);
                this.onTextChanged = this.onTextChanged.bind(this);
                this.onTextMemberChanged = this.onTextMemberChanged.bind(this);
                this.onValueChanged = this.onValueChanged.bind(this);
                this.onValueMemberChanged = this.onValueMemberChanged.bind(this);
            };
            ComboBox.prototype.createComputedProperties = function () {
                var _this = this;
                this.emptyItemText = ko.computed(function () {
                    var emptyText = _this.emptyText();
                    if (emptyText == null || emptyText.toString().trim().length == 0) {
                        return "&nbsp;";
                    }
                    else {
                        return emptyText;
                    }
                });
                this.inputText = ko.computed(function () {
                    var selectedItem = _this.selectedItem();
                    if (selectedItem != _this.emptyItem) {
                        return _this.getItemText(selectedItem);
                    }
                    else {
                        var placeholder = _this.placeholder();
                        if (placeholder != null) {
                            return placeholder;
                        }
                        else {
                            return "";
                        }
                    }
                });
                this.hasFocus = ko.computed(function () {
                    return _this.inputHasFocus() || _this.popupHasFocus();
                }).extend({ rateLimit: 1 });
                this.state = ko.computed(function () {
                    if (_this.enabled() == false) {
                        return "disabled";
                    }
                    else {
                        if (_this.hasFocus()) {
                            return "focus";
                        }
                        else {
                            if (_this.hasMouse()) {
                                return "hover";
                            }
                        }
                    }
                    return "";
                });
            };
            ComboBox.prototype.onHasFocusChanged = function (focused) {
                if (!focused) {
                    this.popupVisible(false);
                }
            };
            ComboBox.prototype.onItemsChanged = function (items) {
                var selectedItem = this.selectedItem();
                if (selectedItem != this.emptyItem && items.indexOf(selectedItem) == -1) {
                    this.selectedItem(null);
                }
            };
            ComboBox.prototype.onMouseEnter = function () {
                this.hasMouse(true);
            };
            ComboBox.prototype.onMouseLeave = function () {
                this.hasMouse(false);
            };
            ComboBox.prototype.onSelectedItemChanged = function (selectedItem) {
                var items = this.items();
                if (selectedItem == this.emptyItem) {
                    this.value(null);
                    this.text(null);
                }
                else {
                    this.value(this.getItemValue(selectedItem));
                    this.text(this.getItemText(selectedItem));
                }
            };
            ComboBox.prototype.onTextChanged = function (text) {
                var _this = this;
                var selectedItem = this.emptyItem;
                var items = this.items();
                if (items != null && items.length > 0) {
                    var searchResult = items.filter(function (x) { return _this.getItemText(x) == text; });
                    if (searchResult.length > 0) {
                        selectedItem = searchResult[0];
                    }
                }
                if (this.selectedItem() != selectedItem) {
                    this.selectedItem(selectedItem);
                }
                else {
                    if (selectedItem == this.emptyItem && text != null && text.length > 0) {
                        setTimeout(function () {
                            _this.text(null);
                        }, 0);
                    }
                }
            };
            ComboBox.prototype.onTextMemberChanged = function (text) {
                var selectedItem = this.selectedItem();
                if (selectedItem != this.emptyItem) {
                    var text = this.getItemText(selectedItem);
                    if (text != this.text()) {
                        this.text(text);
                    }
                }
            };
            ComboBox.prototype.onValueChanged = function (value) {
                var _this = this;
                var selectedItem = this.emptyItem;
                var items = this.items();
                if (items != null && items.length > 0) {
                    var searchResult = items.filter(function (x) { return _this.getItemValue(x) == value; });
                    if (searchResult.length > 0) {
                        selectedItem = searchResult[0];
                    }
                }
                if (this.selectedItem() != selectedItem) {
                    this.selectedItem(selectedItem);
                }
                else {
                    if (selectedItem == this.emptyItem && value != null) {
                        setTimeout(function () {
                            _this.value(null);
                        }, 0);
                    }
                }
            };
            ComboBox.prototype.onValueMemberChanged = function (valueMember) {
                var selectedItem = this.selectedItem();
                if (selectedItem != this.emptyItem) {
                    var value = this.getItemValue(selectedItem);
                    if (value != this.value()) {
                        this.value(value);
                    }
                }
            };
            ComboBox.prototype.onInputClick = function () {
                if (this.enabled()) {
                    this.activeItem(this.selectedItem());
                    this.popupVisible(!this.popupVisible());
                    if (!this.inputHasFocus()) {
                        this.inputHasFocus(true);
                    }
                }
            };
            ComboBox.prototype.onKeyDown = function (data, ev) {
                if (!this.enabled()) {
                    return true;
                }
                if (ev.keyCode == 13) {
                    if (this.popupVisible()) {
                        this.selectedItem(this.activeItem());
                        this.popupVisible(false);
                    }
                }
                else {
                    if (ev.keyCode == 38 || ev.keyCode == 40) {
                        if (this.popupVisible()) {
                            this.activeItem(this.getAdjacentItem(this.activeItem(), ev.keyCode == 38));
                        }
                        else {
                            if (ev.altKey) {
                                this.activeItem(this.selectedItem());
                                this.popupVisible(true);
                            }
                            else {
                                this.selectedItem(this.getAdjacentItem(this.selectedItem(), ev.keyCode == 38));
                            }
                        }
                        if (this.popupVisible()) {
                            var popup = ev.target.parentElement.querySelector(".popup");
                            var activeItem = ev.target.parentElement.querySelector(".active");
                            this.scrollToElement(popup, activeItem);
                        }
                        return false;
                    }
                    else {
                        if (ev.keyCode == 46) {
                            if (this.selectedItem() != this.emptyItem) {
                                this.selectedItem(this.emptyItem);
                                this.popupVisible(false);
                            }
                        }
                    }
                }
                return true;
            };
            ComboBox.prototype.scrollToElement = function (container, element) {
                var containerScrollTop = container.scrollTop;
                var elementTop = element.offsetTop;
                if (elementTop < containerScrollTop) {
                    container.scrollTop = elementTop - 1;
                }
                else {
                    var containerHeight = container.clientHeight;
                    var elementHeight = element.offsetHeight;
                    if (containerScrollTop + containerHeight < elementTop + elementHeight) {
                        container.scrollTop = elementTop + elementHeight - containerHeight + 1;
                    }
                }
            };
            ComboBox.prototype.onEmptyItemClick = function () {
                this.inputHasFocus(true);
                this.selectedItem(this.emptyItem);
                this.popupVisible(false);
            };
            ComboBox.prototype.onEmptyItemHovered = function () {
                this.activeItem(this.emptyItem);
            };
            ComboBox.prototype.onItemHovered = function (item) {
                this.activeItem(item);
            };
            ComboBox.prototype.onItemClick = function (item) {
                if (this.enabled()) {
                    this.inputHasFocus(true);
                    if (this.selectedItem() != item) {
                        this.selectedItem(item);
                    }
                    this.popupVisible(false);
                    return false;
                }
            };
            ComboBox.prototype.getItemText = function (item) {
                if (item == this.emptyItem) {
                    return "";
                }
                var textMember = this.textMember();
                if (textMember != null) {
                    var text = typeof textMember == "function" ? textMember(item) : ko.unwrap(item[textMember]);
                    if (text != null) {
                        text = text.toString();
                    }
                    else {
                        text = "";
                    }
                    return text;
                }
                else {
                    return item.toString();
                }
            };
            ComboBox.prototype.getItemValue = function (item) {
                if (item == this.emptyItem) {
                    return null;
                }
                var valueMember = ko.unwrap(this.valueMember);
                if (valueMember != null) {
                    return typeof valueMember == "function" ? valueMember(item) : ko.unwrap(item[valueMember]);
                }
                else {
                    return item;
                }
            };
            ComboBox.prototype.getAdjacentItem = function (currentItem, previous) {
                var list = [];
                if (this.emptyText() !== undefined) {
                    list.push(this.emptyItem);
                }
                var items = this.items();
                if (items != null) {
                    list = list.concat(items);
                }
                var index = list.indexOf(currentItem) + (previous ? -1 : 1);
                if (index < 0) {
                    index = list.length - 1;
                }
                if (index > list.length - 1) {
                    index = 0;
                }
                return list[index];
            };
            ComboBox.prototype.dispose = function () {
                this.emptyItemText.dispose();
                this.hasFocus.dispose();
                this.inputText.dispose();
                this.state.dispose();
            };
            ComboBox.componentName = "combo-box";
            return ComboBox;
        })(controls.Component);
        ko.components.register(ComboBox.componentName, {
            viewModel: ComboBox,
            template: "<div class=\"input\" tabindex=\"0\" data-bind=\"     autofocus: autofocus,     click: onInputClick,     css: state,     event: { keydown: onKeyDown, mouseover: onMouseEnter, mouseout: onMouseLeave },     hasFocus: inputHasFocus\">     <div class=\"input-text\" data-bind=\"             css: { 'empty' : selectedItem() == emptyItem },             event: { mousedown: function() {                  return false;             }},             text: inputText\">     </div>     <button class=\"input-button\" tabindex=\"-1\" data-bind=\"             event: { mousedown: function() {                 return false;             }},             enable: enabled\"></button> </div> <div class=\"popup\" tabindex=\"-1\" data-bind=\"     hasFocus: popupHasFocus,     visible: popupVisible\">     <ul>         <li class=\"popup-item\" data-bind=\"             click: onEmptyItemClick,             css: { 'active': activeItem() == emptyItem },             event: { mouseover: onEmptyItemHovered },             visible: emptyText() !== undefined\">             <p class=\"item-text empty\" data-bind=\"html: emptyItemText\"></p>         </li>          <!-- ko if: $componentTemplateNodes != null && $componentTemplateNodes.length > 0 -->         <!-- ko foreach: items -->         <li class=\"popup-item\" data-bind=\"                 click: $parent.onItemClick,                 css: { 'active': $parent.activeItem() == $data },                 event: { mouseover: $parent.onItemHovered },                 template: { nodes: $componentTemplateNodes }\">         </li>         <!-- /ko -->         <!-- /ko -->          <!-- ko foreach: items -->         <!-- ko if: $componentTemplateNodes == null || $componentTemplateNodes.length > 0 -->         <li class=\"popup-item\" data-bind=\"                 click: $parent.onItemClick,                 css: { 'active': $parent.activeItem() == $data },                 event: { mouseover: $parent.onItemHovered },                 html: $parent.getItemText($data)\">         </li>         <!-- /ko -->         <!-- /ko -->     </ul> </div>"
        });
    })(controls = spa.controls || (spa.controls = {}));
})(spa || (spa = {}));
/// <reference path="../component.ts" />
var spa;
(function (spa) {
    var controls;
    (function (controls) {
        var DateEdit = (function (_super) {
            __extends(DateEdit, _super);
            function DateEdit(params) {
                _super.call(this, params);
                this.focused = ko.observable(false);
                this.popupToggle = ko.observable(false);
                this.ensureParametersValid(["autofocus", "enabled", "text", "value"], params, DateEdit.componentName);
                if (params == null) {
                    params = {};
                }
                this.bindMethods();
                this.createObservableProperty("autofocus", false, params.autofocus);
                this.createObservableProperty("enabled", true, params.enabled);
                this.createObservableProperty("text", null, params.text);
                this.createObservableProperty("value", null, params.value);
                if (params.value !== undefined) {
                    this.onValueChanged(this.value());
                }
                else {
                    if (params.text !== undefined) {
                        this.onTextChanged(this.text());
                    }
                }
                this.createComputedProperties();
                this.subscribe(this.enabled, this.onEnabledChanged);
                this.subscribe(this.focused, this.onFocusedChanged);
                this.subscribe(this.text, this.onTextChanged);
                this.subscribe(this.value, this.onValueChanged);
            }
            DateEdit.prototype.bindMethods = function () {
                this.onButtonClick = this.onButtonClick.bind(this);
                this.onButtonMouseDown = this.onButtonMouseDown.bind(this);
                this.onEnabledChanged = this.onEnabledChanged.bind(this);
                this.onFocusedChanged = this.onFocusedChanged.bind(this);
                this.onKeyDown = this.onKeyDown.bind(this);
                this.onPopupMouseDown = this.onPopupMouseDown.bind(this);
                this.onTextChanged = this.onTextChanged.bind(this);
                this.onValueChanged = this.onValueChanged.bind(this);
            };
            // #region Computed properties
            DateEdit.prototype.createComputedProperties = function () {
                var _this = this;
                this.popupVisible = ko.computed(function () {
                    return _this.getPopupVisible();
                });
            };
            DateEdit.prototype.getPopupVisible = function () {
                return this.enabled() && this.focused() && this.popupToggle();
            };
            // #endregion
            // #region Subscriptions
            DateEdit.prototype.onEnabledChanged = function (enabled) {
                this.popupToggle(false);
            };
            DateEdit.prototype.onFocusedChanged = function (focused) {
                this.popupToggle(false);
                if (this.value() == null) {
                    this.text("");
                }
            };
            DateEdit.prototype.onTextChanged = function (text) {
                var newValue = this.parse(text);
                if (!this.isSameDate(newValue, this.value())) {
                    this.value(newValue);
                }
                this.popupToggle(false);
            };
            DateEdit.prototype.onValueChanged = function (value) {
                var currentValue = this.parse(this.text());
                if (!this.isSameDate(currentValue, value)) {
                    var text = this.format(value);
                    if (this.text() != text) {
                        this.text(text);
                    }
                    this.popupToggle(false);
                }
            };
            // #endregion
            // #region Handlers
            DateEdit.prototype.onButtonClick = function () {
                if (this.enabled()) {
                    this.popupToggle(!this.popupToggle());
                }
            };
            DateEdit.prototype.onButtonMouseDown = function () {
                if (!this.focused()) {
                    this.focused(true);
                }
            };
            DateEdit.prototype.onPopupMouseDown = function () {
            };
            DateEdit.prototype.onKeyDown = function (data, ev) {
                return true;
            };
            // #endregion
            // #region Helpers
            DateEdit.prototype.format = function (date) {
                if (date == null || isNaN(date.getTime())) {
                    return "";
                }
                var day = date.getDate();
                var month = date.getMonth() + 1;
                var year = date.getFullYear();
                return "dd.mm.yyyy".replace("dd", day > 9 ? day.toString() : "0" + day.toString()).replace("mm", month > 9 ? month.toString() : "0" + month.toString()).replace("yyyy", year.toString());
            };
            DateEdit.prototype.daysInMonth = function (year, month) {
                var nextMonth = null;
                if (month == 11) {
                    nextMonth = new Date(year + 1, 0, 1);
                }
                else {
                    nextMonth = new Date(year, month + 1, 1);
                }
                nextMonth.setDate(0);
                return nextMonth.getDate();
            };
            DateEdit.prototype.isSameDate = function (date1, date2) {
                if (date1 == null || date2 == null) {
                    return date1 == null && date2 == null;
                }
                else {
                    return date1.toDateString() == date2.toDateString();
                }
            };
            DateEdit.prototype.isValidDate = function (date) {
                if (Object.prototype.toString.call(date) !== "[object Date]") {
                    return false;
                }
                return !isNaN(date.getTime());
            };
            DateEdit.prototype.parse = function (text) {
                if (text == null || text.trim().length != 10) {
                    return null;
                }
                var month = parseInt(text.substr(3, 2)) - 1;
                if (month < 0 || month > 11) {
                    return null;
                }
                var day = parseInt(text.substr(0, 2));
                var year = parseInt(text.substr(6, 4));
                if (day < 1 || day > 31 || day > this.daysInMonth(year, month)) {
                    return null;
                }
                try {
                    var date = new Date(year, month, day);
                    if (this.isValidDate(date)) {
                        return date;
                    }
                }
                catch (ex) {
                }
                return null;
            };
            // #endregion
            DateEdit.prototype.dispose = function () {
                this.popupVisible.dispose();
                _super.prototype.dispose.call(this);
            };
            DateEdit.componentName = "date-edit";
            return DateEdit;
        })(controls.Component);
        controls.DateEdit = DateEdit;
        ko.components.register(DateEdit.componentName, {
            viewModel: DateEdit,
            template: "<input class=\"input\" type=\"text\" data-bind=\"     autofocus: autofocus,     enable: enabled,     event: { keydown: onKeyDown },     hasFocus: focused,     value: text,     valueUpdate: 'input'\" /> <button class=\"input-button\" data-bind=\"     click: onButtonClick,     enable: enabled,     event: { mousedown: onButtonMouseDown },     css: { disabled: !enabled() }\"></button> <div class=\"popup\" data-bind=\"     event: { mousedown: onPopupMouseDown },     visible: popupVisible\">     <calendar params=\"value: value\"></calendar> </div>"
        });
    })(controls = spa.controls || (spa.controls = {}));
})(spa || (spa = {}));
var spa;
(function (spa) {
    var controls;
    (function (controls) {
        var GridView = (function (_super) {
            __extends(GridView, _super);
            function GridView(params, template) {
                var _this = this;
                _super.call(this, params);
                this._columns = {};
                this._filteredRows = null;
                this._templateCells = {};
                // параметры модели представления;
                this.columns = ko.observableArray();
                this.footerText = ko.observable();
                this.html = ko.observable();
                this.page = ko.observable(1);
                this.pageCount = ko.observable(1);
                this.rows = ko.observableArray();
                this.scrollTop = ko.observable();
                this.selectedIndex = ko.observable();
                this.templateVisible = ko.observable(false);
                if (params == null || params.columns == null) {
                    throw new spa.Exception("Требуется обязательный параметр 'columns' для компонента grid.");
                }
                if (params == null || params.data == null) {
                    throw new spa.Exception("Требуется обязательный параметр 'data' для компонента grid.");
                }
                this.bindHandlers();
                this.setupCallback(params);
                // columns;
                ko.unwrap(params.columns).forEach(function (column) {
                    _this._columns[column.name] = column;
                });
                // data;
                var data = ko.unwrap(params.data);
                if (data instanceof Array) {
                    this._data = new spa.LocalDataSource(data);
                }
                else {
                    this._data = data;
                }
                this._data.onchanged.subscribe(this.onDataSourceChanged);
                // pageSize;
                if (params.pageSize != null) {
                    var pageSize = ko.unwrap(params.pageSize);
                    if (pageSize != null && pageSize > 0) {
                        this._pageSize = pageSize;
                    }
                }
                // textFilter;
                if (params.textFilter != null) {
                    this._textFilter = ko.unwrap(params.textFilter);
                }
                // sort;
                if (params.sort != null) {
                    this._sort = ko.unwrap(params.sort);
                }
                // viewmodel columns;
                var columns = ko.unwrap(params.columns).map(function (x) {
                    var sort = _this._sort == null ? [] : _this._sort.filter(function (y) { return y.columnName == x.name; });
                    return {
                        className: ko.observable(x.headerClassName),
                        headerHtml: ko.observable(x.headerText),
                        hint: ko.observable(x.hint || x.headerText),
                        name: x.name,
                        sortable: ko.observable(x.sortable),
                        sort: ko.observable(sort.length > 0),
                        sortAscending: ko.observable(sort.length > 0 && sort[0].ascending),
                        width: ko.observable(typeof x.width == "number" ? x.width.toString() + "px" : x.width)
                    };
                });
                this.columns(columns);
                // viewmodel footerText;
                if (params.footerText != null) {
                    this.footerText(ko.unwrap(params.footerText));
                }
                // viewmodel template;
                if (template != null) {
                    for (var i = 0; i < template.childNodes.length; i++) {
                        if (template.childNodes[i].nodeType == 1) {
                            var tableCell = template.childNodes[i];
                            if (tableCell.hasAttribute("columnName")) {
                                this._templateCells[tableCell.getAttribute("columnName")] = tableCell;
                            }
                            else {
                                throw new spa.Exception("Требуется атрибут columnName в шаблоне компонента grid.");
                            }
                        }
                    }
                    while (template.firstChild) {
                        template.removeChild(template.firstChild);
                    }
                    for (var columnName in this._columns) {
                        if (columnName in this._templateCells) {
                            if (this._columns[columnName].className != null) {
                                this._templateCells[columnName].classList.add(this._columns[columnName].className);
                            }
                        }
                        else {
                            var cellTemplate = document.createElement("td");
                            cellTemplate.setAttribute("data-bind", "text: $data");
                            this._templateCells[columnName] = cellTemplate;
                        }
                        template.appendChild(this._templateCells[columnName]);
                    }
                    this.template = [template];
                }
                // viewmodel data;
                this.getPageCount(function (pageCount) {
                    // page;
                    _this.page(1);
                    // pageCount;
                    _this.pageCount(pageCount);
                    _this.getPageRows(1, function (rows) {
                        // rows;
                        _this.rows(rows);
                        if (params.selectedRow != null) {
                            var index = rows.indexOf(ko.unwrap(params.selectedRow));
                            if (index == -1) {
                                _this.callbackSelectedRow(null);
                            }
                            else {
                                // selectedIndex;
                                _this.selectedIndex(index);
                            }
                        }
                        if (_this.template == null) {
                            // html;
                            _this.html(_this.getHtml(rows));
                        }
                        else {
                            // useTemplate;
                            _this.templateVisible(true);
                        }
                        _this.createSubscriptions(params);
                    });
                });
            }
            GridView.prototype.setupCallback = function (params) {
                if (params.selectedRow != null) {
                    if (ko.isWriteableObservable(params.selectedRow)) {
                        this.paramSelectedRow = params.selectedRow;
                    }
                }
                if (params.sort != null) {
                    if (ko.isWriteableObservable(params.sort)) {
                        this.paramSort = params.sort;
                    }
                }
            };
            GridView.prototype.createSubscriptions = function (params) {
                if (params.columns != null && ko.isObservable(params.columns)) {
                    this.subscribe(params.columns, this.onColumnsChanged);
                }
                if (params.data != null && ko.isObservable(params.data)) {
                    this.subscribe(params.data, this.onDataChanged);
                }
                if (params.footerText != null && ko.isObservable(params.footerText)) {
                    this.subscribe(params.footerText, this.onFooterTextChanged);
                }
                if (params.pageSize != null && ko.isObservable(params.pageSize)) {
                    this.subscribe(params.pageSize, this.onPageSizeChanged);
                }
                if (params.selectedRow != null && ko.isObservable(params.selectedRow)) {
                    this.subscribe(params.selectedRow, this.onSelectedRowChanged);
                }
                if (params.sort != null && ko.isObservable(params.sort)) {
                    this.subscribe(params.sort, this.onSortChanged);
                }
                if (params.textFilter != null && ko.isObservable(params.textFilter)) {
                    this.subscribe(params.textFilter, this.onTextFilterChanged);
                }
            };
            GridView.prototype.bindHandlers = function () {
                this.onDataSourceChanged = this.onDataSourceChanged.bind(this);
                this.onColumnsChanged = this.onColumnsChanged.bind(this);
                this.onDataChanged = this.onDataChanged.bind(this);
                this.onFooterTextChanged = this.onFooterTextChanged.bind(this);
                this.onPageSizeChanged = this.onPageSizeChanged.bind(this);
                this.onSelectedRowChanged = this.onSelectedRowChanged.bind(this);
                this.onSortChanged = this.onSortChanged.bind(this);
                this.onTextFilterChanged = this.onTextFilterChanged.bind(this);
                this.tableHeaderClick = this.tableHeaderClick.bind(this);
                this.tableCellClick = this.tableCellClick.bind(this);
                this.tableKeyDown = this.tableKeyDown.bind(this);
                this.previousPageClick = this.previousPageClick.bind(this);
                this.nextPageClick = this.nextPageClick.bind(this);
            };
            // #region DataSource events, row retrieval and filtering.
            GridView.prototype.onDataSourceChanged = function () {
                var _this = this;
                this._filteredRows = null;
                if (!this.compareSortOrder(this._sort, this._data.sort)) {
                    this._sort = this._data.sort;
                    var viewColumns = this.columns();
                    if (viewColumns != null && viewColumns.length > 0) {
                        viewColumns.forEach(function (viewColumn) {
                            var sort = _this._sort.filter(function (x) { return x.columnName == viewColumn.name; })[0];
                            viewColumn.sort(sort != null);
                            viewColumn.sortAscending(sort != null && sort.ascending);
                        });
                    }
                    this.callbackSort(this._sort);
                }
                this.getPageCount(function (pageCount) {
                    _this.pageCount(pageCount);
                    if (_this.page() > pageCount) {
                        _this.page(pageCount);
                    }
                    _this.getPageRows(_this.page(), function (rows) {
                        _this.rows(rows);
                        if (_this.selectedIndex() != null && rows.indexOf(_this.selectedIndex()) == -1) {
                            _this.selectedIndex(-1);
                            _this.callbackSelectedRow(null);
                        }
                        if (_this.template == null) {
                            _this.html(_this.getHtml(rows));
                        }
                        _this.scrollTop(0);
                    });
                });
            };
            GridView.prototype.getPageRows = function (page, callback) {
                var _this = this;
                if (this._data == null) {
                    callback([]);
                }
                else {
                    if (this._pageSize == null) {
                        this.getFilteredRowCount(function (count) {
                            _this.getFilteredRows(0, count, callback);
                        });
                    }
                    else {
                        this.getFilteredRows((page - 1) * this._pageSize, this._pageSize, callback);
                    }
                }
            };
            GridView.prototype.getPageCount = function (callback) {
                var _this = this;
                if (this._data == null) {
                    callback(1);
                }
                else {
                    if (this._pageSize == null) {
                        callback(1);
                    }
                    else {
                        this.getFilteredRowCount(function (count) {
                            if (count == 0) {
                                callback(1);
                            }
                            else {
                                callback(Math.ceil(count / _this._pageSize));
                            }
                        });
                    }
                }
            };
            GridView.prototype.getFilteredRows = function (skip, take, callback) {
                var _this = this;
                if (this._data == null) {
                    callback([]);
                }
                else {
                    if (this._textFilter == null || this._textFilter.trim().length == 0) {
                        this._data.getRows(skip, take, callback);
                    }
                    else {
                        if (this._filteredRows != null) {
                            callback(this._filteredRows.slice(skip, skip + take));
                        }
                        else {
                            this._data.getRowCount(function (count) {
                                _this._data.getRows(0, count, function (rows) {
                                    _this._filteredRows = _this.filterRows(rows);
                                    callback(_this._filteredRows.slice(skip, skip + take));
                                });
                            });
                        }
                    }
                }
            };
            GridView.prototype.getFilteredRowCount = function (callback) {
                var _this = this;
                if (this._data == null) {
                    callback(0);
                }
                else {
                    if (this._textFilter == null || this._textFilter.trim().length == 0) {
                        this._data.getRowCount(callback);
                    }
                    else {
                        if (this._filteredRows != null) {
                            callback(this._filteredRows.length);
                        }
                        else {
                            this._data.getRowCount(function (count) {
                                _this._data.getRows(0, count, function (rows) {
                                    _this._filteredRows = _this.filterRows(rows);
                                    callback(_this._filteredRows.length);
                                });
                            });
                        }
                    }
                }
            };
            GridView.prototype.filterRows = function (rows) {
                if (this._textFilter == null || this._textFilter.trim().length == 0) {
                    return rows;
                }
                var columns = [];
                for (var columnName in this._columns) {
                    columns.push(this._columns[columnName]);
                }
                if (this._columns == null) {
                    return rows;
                }
                var words = this._textFilter.toLowerCase().split(" ").filter(function (x) { return x != null && x.trim().length > 0; });
                var filteredRows = [];
                rows.forEach(function (row) {
                    columns.forEach(function (column) {
                        var text = column.customFilterText != null ? column.customFilterText(row) : row[column.name];
                        if (text != null) {
                            if (typeof text != "string") {
                                text = text.toString();
                            }
                            text = text.toLowerCase();
                            if (words.every(function (x) { return text.contains(x); })) {
                                filteredRows.push(row);
                            }
                        }
                    });
                });
                return filteredRows;
            };
            GridView.prototype.compareSortOrder = function (sort1, sort2) {
                if (sort1 == null && sort2 == null) {
                    return true;
                }
                if (sort1 == null || sort2 == null) {
                    return false;
                }
                for (var i = 0; i < sort1.length; i++) {
                    if (sort1[i].ascending != sort2[i].ascending) {
                        return false;
                    }
                    if (sort1[i].columnName != sort2[i].columnName) {
                        return false;
                    }
                }
                return true;
            };
            // #endregion
            // #region Parameter change event handlers.
            GridView.prototype.onColumnsChanged = function (columns) {
                var _this = this;
                var unwrappedColumns = ko.unwrap(columns);
                this._columns = {};
                if (unwrappedColumns != null) {
                    unwrappedColumns.forEach(function (column) {
                        _this._columns[column.name] = column;
                    });
                }
                if (this.template != null) {
                    var row = this.template[0];
                    while (row.firstChild) {
                        row.removeChild(row.firstChild);
                    }
                    unwrappedColumns.forEach(function (column) {
                        var templateCell = _this._templateCells[column.name];
                        if (column.className != null && templateCell.classList.contains(column.className)) {
                            templateCell.classList.add(column.className);
                        }
                        row.appendChild(templateCell);
                    });
                }
                var tableColumns = unwrappedColumns.map(function (x) {
                    var sort = _this._sort.filter(function (y) { return y.columnName == x.name; });
                    return {
                        className: ko.observable(x.headerClassName),
                        headerHtml: ko.observable(x.headerText),
                        hint: ko.observable(x.hint || x.headerText),
                        name: x.name,
                        sortable: ko.observable(x.sortable),
                        sort: ko.observable(sort.length > 0),
                        sortAscending: ko.observable(sort.length > 0 && sort[0].ascending),
                        width: ko.observable(typeof x.width == "number" ? x.width.toString() + "px" : x.width)
                    };
                });
                if (this.template == null) {
                    this.html("");
                    this.columns(tableColumns);
                    this.html(this.getHtml(this.rows()));
                }
                else {
                    this.templateVisible(false);
                    this.templateVisible(true);
                }
            };
            GridView.prototype.onDataChanged = function (data) {
                if (this._data != null) {
                    this._data.onchanged.unsubscribe(this.onDataSourceChanged);
                }
                var unwrapperData = ko.unwrap(data);
                if (data instanceof Array) {
                    this._data = new spa.LocalDataSource(unwrapperData);
                }
                else {
                    this._data = unwrapperData;
                }
                if (this._data != null) {
                    this._data.onchanged.subscribe(this.onDataSourceChanged);
                }
                this.onDataSourceChanged();
            };
            GridView.prototype.onFooterTextChanged = function (footerText) {
                this.footerText(ko.unwrap(footerText));
            };
            GridView.prototype.onPageSizeChanged = function (pageSize) {
                var value = ko.unwrap(pageSize);
                if (value != null && value < 1) {
                    value = null;
                }
                if (this._pageSize != value) {
                    this._pageSize = value;
                    this.onDataSourceChanged();
                }
            };
            GridView.prototype.onSelectedRowChanged = function (selectedRow) {
                var unwrappedRow = ko.unwrap(selectedRow);
                var index = unwrappedRow == null ? -1 : this.rows().indexOf(unwrappedRow);
                if (index == -1 && unwrappedRow != null) {
                    this.callbackSelectedRow(null);
                }
                this.selectedIndex(index);
            };
            GridView.prototype.onSortChanged = function (sort) {
                var unwrappedSort = ko.unwrap(sort);
                if (!this.compareSortOrder(this._sort, unwrappedSort)) {
                    this._data.sort = unwrappedSort;
                }
            };
            GridView.prototype.onTextFilterChanged = function (textFilter) {
                var unwrappedTextFilter = ko.unwrap(textFilter);
                if (this._textFilter == unwrappedTextFilter) {
                    return;
                }
                this._filteredRows = null;
                this._textFilter = unwrappedTextFilter;
                this.onDataSourceChanged();
            };
            // #endregion
            // #region Parameter callback.
            GridView.prototype.callbackSelectedRow = function (selectedRow) {
                var _this = this;
                if (this.paramSelectedRow != null) {
                    setTimeout(function () {
                        _this.paramSelectedRow(selectedRow);
                    }, 0);
                }
            };
            GridView.prototype.callbackSort = function (sort) {
                var _this = this;
                if (this.paramSort != null) {
                    setTimeout(function () {
                        _this.paramSort(sort);
                    }, 0);
                }
            };
            // #endregion
            // #region View events and update.
            GridView.prototype.tableHeaderClick = function (column, e) {
                var columnName = null;
                if (e.target.nodeType == 1 && e.target.tagName == "TH") {
                    columnName = e.target.getAttribute("columnName");
                }
                else {
                    var parentNode = e.target.parentNode;
                    while (parentNode != null) {
                        if (parentNode.nodeType == 1 && parentNode.tagName == "TH") {
                            columnName = e.target.getAttribute("columnName");
                            break;
                        }
                        parentNode = parentNode.parentNode;
                    }
                }
                if (columnName != null) {
                    var column = this._columns[columnName];
                    if (column.sortable == true) {
                        if (this._sort == null) {
                            this._sort = [];
                        }
                        var columnSort = this._sort.filter(function (x) { return x.columnName == columnName; })[0];
                        if (columnSort == null) {
                            columnSort = { ascending: true, columnName: columnName };
                        }
                        else {
                            columnSort.ascending = !columnSort.ascending;
                        }
                        if (e.ctrlKey) {
                            this._sort = this._sort.slice();
                            if (this._sort.indexOf(columnSort) == -1) {
                                this._sort.push(columnSort);
                            }
                        }
                        else {
                            this._sort = [columnSort];
                        }
                        this._data.sort = this._sort;
                        this.callbackSort(this._sort);
                    }
                }
                e.stopPropagation();
            };
            GridView.prototype.tableCellClick = function (row, e) {
                var rowElement = null;
                if (e.target.nodeType == 1 && e.target.tagName == "TR") {
                    rowElement = e.target;
                }
                else {
                    var parentNode = e.target.parentNode;
                    while (parentNode != null) {
                        if (parentNode.nodeType == 1 && parentNode.tagName == "TR") {
                            rowElement = parentNode;
                            break;
                        }
                        parentNode = parentNode.parentNode;
                    }
                }
                if (rowElement != null) {
                    var index = 0;
                    var rowIndex = -1;
                    var rows = rowElement.parentElement.childNodes;
                    for (var i = 0; i < rows.length; i++) {
                        if (rows[i].nodeType == 1 && rows[i].tagName == "TR") {
                            if (rows[i] == rowElement) {
                                rowIndex = index;
                                break;
                            }
                            index++;
                        }
                    }
                    this.selectedIndex(rowIndex);
                    this.callbackSelectedRow(rowIndex == -1 ? null : this.rows()[rowIndex]);
                }
                return true;
                // e.stopPropagation();
            };
            GridView.prototype.tableKeyDown = function (vm, e) {
                if (e.keyCode == 38 || e.keyCode == 40) {
                    var rows = this.rows();
                    if (rows.length == 0) {
                        return;
                    }
                    var rowIndex = this.selectedIndex();
                    if (rowIndex == -1) {
                        rowIndex = 0;
                    }
                    else {
                        if (e.keyCode == 38) {
                            if (rowIndex > 0) {
                                rowIndex--;
                            }
                        }
                        else {
                            if (rowIndex < rows.length - 1) {
                                rowIndex++;
                            }
                        }
                    }
                    if (rowIndex != this.selectedIndex()) {
                        this.selectedIndex(rowIndex);
                        this.callbackSelectedRow(rowIndex == -1 ? null : this.rows()[rowIndex]);
                    }
                }
                e.stopPropagation();
            };
            GridView.prototype.previousPageClick = function () {
                if (this.page() > 1) {
                    this.setPage(this.page() - 1);
                }
            };
            GridView.prototype.nextPageClick = function () {
                if (this.page() < this.pageCount()) {
                    this.setPage(this.page() + 1);
                }
            };
            GridView.prototype.setPage = function (page) {
                var _this = this;
                this.page(page);
                this.getPageRows(page, function (rows) {
                    _this.rows(rows);
                    if (_this.template == null) {
                        _this.html(_this.getHtml(rows));
                    }
                    if (_this.selectedIndex() != -1) {
                        _this.selectedIndex(-1);
                        _this.callbackSelectedRow(null);
                    }
                    _this.scrollTop(1);
                    _this.scrollTop(0);
                });
            };
            GridView.prototype.getHtml = function (rows) {
                var _this = this;
                var columns = [];
                var filtered = this._textFilter != null && this._textFilter.trim().length > 0;
                var html = "";
                var words = filtered ? this._textFilter.trim().split(" ").filter(function (x) { return x.trim().length > 0; }) : [];
                for (var columnName in this._columns) {
                    columns.push(this._columns[columnName]);
                }
                rows.forEach(function (row, rowIndex) {
                    html += "<tr>";
                    columns.forEach(function (column) {
                        var innerHtml = null;
                        if (column.customDisplayText != null) {
                            innerHtml = column.customDisplayText(row);
                        }
                        else {
                            var value = row[column.name];
                            if (column.displayFormat != null) {
                                innerHtml = column.displayFormat.format(value);
                            }
                            else {
                                if (value == null) {
                                    innerHtml = "";
                                }
                                else {
                                    innerHtml = typeof value == "string" ? value : value.toString();
                                }
                            }
                        }
                        if (filtered) {
                            innerHtml = _this.highlightText(innerHtml, words, "grid-highlight");
                        }
                        var classList = [];
                        if (column.className != null) {
                            classList.push(column.className);
                        }
                        html += "<td" + (classList.length == 0 ? "" : classList.join(" ")) + ">" + innerHtml + "</td>";
                    });
                    html += "</tr>";
                });
                return html;
            };
            GridView.prototype.highlightText = function (html, words, className) {
                if (html == null || html.trim().length == 0) {
                    return html;
                }
                var tag = false;
                var quote = null;
                var sentences = [];
                var start = -1;
                for (var i = 0; i < html.length; i++) {
                    if (tag) {
                        if (html[i] == "'") {
                            quote == null ? "'" : null;
                            continue;
                        }
                        if (html[i] == '"') {
                            quote == null ? '"' : null;
                            continue;
                        }
                        if (html[i] == ">" && quote == null) {
                            tag = false;
                            continue;
                        }
                    }
                    else {
                        if (html[i] == "<") {
                            tag = true;
                            if (start != -1) {
                                sentences.push({ start: start, length: i - start });
                                start = -1;
                            }
                        }
                    }
                }
                if (start != -1) {
                    sentences.push({ start: start, length: html.length - start });
                }
                sentences.reverse();
                var result = html;
                // заменяем слова на <span class='@className'></span>
                sentences.forEach(function (sentence) {
                    var s = html.substr(sentence.start, sentence.length);
                    words.forEach(function (word) {
                        var wordIndex = s.toLowerCase().indexOf(word.toLowerCase());
                        if (wordIndex != -1) {
                            s = s.substr(0, wordIndex) + '<span class="' + className + '">' + s.substr(wordIndex, word.length) + "</span>" + s.substr(wordIndex + word.length);
                        }
                    });
                    result = result.substr(0, sentence.start) + s + result.substr(sentence.start, sentence.start + sentence.length);
                });
                return html;
            };
            // #endregion
            GridView.prototype.dispose = function () {
                this._columns = null;
                if (this._data != null) {
                    this._data.onchanged.unsubscribe(this.onDataSourceChanged);
                }
                this._data = null;
                this._filteredRows = null;
                this._templateCells = null;
                this.paramSelectedRow = null;
                this.paramSort = null;
                this.template = null;
                _super.prototype.dispose.call(this);
            };
            GridView.componentName = "grid-view";
            return GridView;
        })(controls.Component);
        controls.GridView = GridView;
        ko.components.register(GridView.componentName, {
            viewModel: {
                createViewModel: function (params, componentInfo) {
                    var row = componentInfo.templateNodes == null ? null : findRow(componentInfo.templateNodes);
                    return new spa.controls.GridView(params, row);
                }
            },
            template: "<div class=\"grid-data\">     <div class=\"grid-header\">         <table>             <thead data-bind=\"click: tableHeaderClick\">                 <tr data-bind=\"foreach: columns\">                     <th data-bind=\"                         attr: {                             columnName: name,                             title: hint                         },                         css: {                             'grid-column-sortable': sortable,                             'grid-column-sortable-asc': sort() && sortAscending(),                             'grid-column-sortable-desc': sort() && !sortAscending()                         },                         click: $component.tableHeaderClick,                         html: headerHtml,                         style: {                             width: $data.width                         }\"></th>                 </tr>             </thead>         </table>     </div>     <div class=\"grid-body\" data-bind=\"scrollTop: scrollTop\">         <table data-bind=\"selectedRowIndex: selectedIndex\">             <colgroup data-bind=\"foreach: columns\">                 <col data-bind=\"                     attr: {                         width: $data.width                     }\" />             </colgroup>             <!-- ko if: $data.template != null -->             <!-- ko with: $parent -->             <tbody data-bind=\"click: $component.tableCellClick, template: { nodes: $component.template, foreach: $component.rows, if: $component.templateVisible }\"></tbody>             <!-- /ko -->             <!-- /ko -->             <!-- ko if: $data.template == null -->             <tbody data-bind=\"click: tableCellClick, html: html\">                 <tr>                     <td></td>                 </tr>             </tbody>             <!-- /ko -->         </table>     </div> </div> <div class=\"grid-footer\">     <table>         <tfoot>             <tr>                 <td data-bind=\"text: footerText\"></td>                 <td>                     <button data-bind=\"click: $component.previousPageClick\"></button>                     <span data-bind=\"text: page() + ' / ' + pageCount()\"></span>                     <button data-bind=\"click: $component.nextPageClick\"></button>                 </td>             </tr>         </tfoot>     </table> </div>"
        });
        function findRow(nodes) {
            if (nodes != null && nodes.length > 0) {
                for (var i = 0; i < nodes.length; i++) {
                    if (nodes[i].nodeType == 1 && nodes[i].tagName == "TR") {
                        return nodes[i];
                    }
                    var childResult = findRow(nodes[i].childNodes);
                    if (childResult != null) {
                        return childResult;
                    }
                }
            }
            return null;
        }
    })(controls = spa.controls || (spa.controls = {}));
})(spa || (spa = {}));
var spa;
(function (spa) {
    var controls;
    (function (controls) {
        var ListBox = (function (_super) {
            __extends(ListBox, _super);
            function ListBox(params) {
                _super.call(this, params);
                this.activeItem = ko.observable(null);
                this.emptyItem = {};
                this.hasMouse = ko.observable(false);
                this.inputHasFocus = ko.observable(false);
                this.popupHasFocus = ko.observable(false);
                this.popupVisible = ko.observable(false);
                this.selectedItem = ko.observable();
                this.ensureParametersValid(["autofocus", "emptyText", "enabled", "items", "placeholder", "template", "text", "textMember", "value", "valueMember"], params, ListBox.componentName);
                if (params == null) {
                    params = {};
                }
                this.bindMethods();
                this.createObservableProperty("autofocus", null, params.autofocus);
                this.createObservableProperty("emptyText", undefined, params.emptyText);
                this.createObservableProperty("enabled", true, params.enabled);
                this.createObservableArrayProperty("items", null, params.items);
                this.createObservableProperty("placeholder", null, params.placeholder);
                this.createObservableProperty("template", "combo-box-template", params.template);
                this.createObservableProperty("text", null, params.text);
                this.createObservableProperty("textMember", null, params.textMember);
                this.createObservableProperty("value", null, params.value);
                this.createObservableProperty("valueMember", null, params.valueMember);
                this.selectedItem(this.emptyItem);
                if (this.value() != null) {
                    this.onValueChanged(this.value());
                }
                else {
                    if (this.text() != null) {
                        this.onTextChanged(this.text());
                    }
                }
                this.createComputedProperties();
                this.subscribe(this.hasFocus, this.onHasFocusChanged);
                this.subscribe(this.items, this.onItemsChanged);
                this.subscribe(this.selectedItem, this.onSelectedItemChanged);
                this.subscribe(this.text, this.onTextChanged);
                this.subscribe(this.textMember, this.onTextMemberChanged);
                this.subscribe(this.value, this.onValueChanged);
                this.subscribe(this.valueMember, this.onValueMemberChanged);
            }
            ListBox.prototype.bindMethods = function () {
                this.getItemText = this.getItemText.bind(this);
                this.getItemValue = this.getItemValue.bind(this);
                this.onEmptyItemClick = this.onEmptyItemClick.bind(this);
                this.onHasFocusChanged = this.onHasFocusChanged.bind(this);
                this.onInputClick = this.onInputClick.bind(this);
                this.onItemClick = this.onItemClick.bind(this);
                this.onItemHovered = this.onItemHovered.bind(this);
                this.onItemsChanged = this.onItemsChanged.bind(this);
                this.onKeyDown = this.onKeyDown.bind(this);
                this.onSelectedItemChanged = this.onSelectedItemChanged.bind(this);
                this.onTextChanged = this.onTextChanged.bind(this);
                this.onTextMemberChanged = this.onTextMemberChanged.bind(this);
                this.onValueChanged = this.onValueChanged.bind(this);
                this.onValueMemberChanged = this.onValueMemberChanged.bind(this);
            };
            ListBox.prototype.createComputedProperties = function () {
                var _this = this;
                this.emptyItemText = ko.computed(function () {
                    var emptyText = _this.emptyText();
                    if (emptyText == null || emptyText.toString().trim().length == 0) {
                        return "&nbsp;";
                    }
                    else {
                        return emptyText;
                    }
                });
                this.inputText = ko.computed(function () {
                    var selectedItem = _this.selectedItem();
                    if (selectedItem != _this.emptyItem) {
                        return _this.getItemText(selectedItem);
                    }
                    else {
                        var placeholder = _this.placeholder();
                        if (placeholder != null) {
                            return placeholder;
                        }
                        else {
                            return "";
                        }
                    }
                });
                this.hasFocus = ko.computed(function () {
                    return _this.inputHasFocus() || _this.popupHasFocus();
                }).extend({ rateLimit: 1 });
                this.state = ko.computed(function () {
                    if (_this.enabled() == false) {
                        return "disabled";
                    }
                    else {
                        if (_this.hasFocus()) {
                            return "focus";
                        }
                        else {
                            if (_this.hasMouse()) {
                                return "hover";
                            }
                        }
                    }
                    return "";
                });
            };
            ListBox.prototype.onHasFocusChanged = function (focused) {
                if (!focused) {
                    this.popupVisible(false);
                }
            };
            ListBox.prototype.onItemsChanged = function (items) {
                var selectedItem = this.selectedItem();
                if (selectedItem != this.emptyItem && items.indexOf(selectedItem) == -1) {
                    this.selectedItem(null);
                }
            };
            ListBox.prototype.onMouseEnter = function () {
                this.hasMouse(true);
            };
            ListBox.prototype.onMouseLeave = function () {
                this.hasMouse(false);
            };
            ListBox.prototype.onSelectedItemChanged = function (selectedItem) {
                var items = this.items();
                if (selectedItem == this.emptyItem) {
                    this.value(null);
                    this.text(null);
                }
                else {
                    this.value(this.getItemValue(selectedItem));
                    this.text(this.getItemText(selectedItem));
                }
            };
            ListBox.prototype.onTextChanged = function (text) {
                var _this = this;
                var selectedItem = this.emptyItem;
                var items = this.items();
                if (items != null && items.length > 0) {
                    var searchResult = items.filter(function (x) { return _this.getItemText(x) == text; });
                    if (searchResult.length > 0) {
                        selectedItem = searchResult[0];
                    }
                }
                if (this.selectedItem() != selectedItem) {
                    this.selectedItem(selectedItem);
                }
                else {
                    if (selectedItem == this.emptyItem && text != null && text.length > 0) {
                        setTimeout(function () {
                            _this.text(null);
                        }, 0);
                    }
                }
            };
            ListBox.prototype.onTextMemberChanged = function (text) {
                var selectedItem = this.selectedItem();
                if (selectedItem != this.emptyItem) {
                    var text = this.getItemText(selectedItem);
                    if (text != this.text()) {
                        this.text(text);
                    }
                }
            };
            ListBox.prototype.onValueChanged = function (value) {
                var _this = this;
                var selectedItem = this.emptyItem;
                var items = this.items();
                if (items != null && items.length > 0) {
                    var searchResult = items.filter(function (x) { return _this.getItemValue(x) == value; });
                    if (searchResult.length > 0) {
                        selectedItem = searchResult[0];
                    }
                }
                if (this.selectedItem() != selectedItem) {
                    this.selectedItem(selectedItem);
                }
                else {
                    if (selectedItem == this.emptyItem && value != null) {
                        setTimeout(function () {
                            _this.value(null);
                        }, 0);
                    }
                }
            };
            ListBox.prototype.onValueMemberChanged = function (valueMember) {
                var selectedItem = this.selectedItem();
                if (selectedItem != this.emptyItem) {
                    var value = this.getItemValue(selectedItem);
                    if (value != this.value()) {
                        this.value(value);
                    }
                }
            };
            ListBox.prototype.onInputClick = function () {
                if (this.enabled()) {
                    this.activeItem(this.selectedItem());
                    this.popupVisible(!this.popupVisible());
                    if (!this.inputHasFocus()) {
                        this.inputHasFocus(true);
                    }
                }
            };
            ListBox.prototype.onKeyDown = function (data, ev) {
                if (!this.enabled()) {
                    return true;
                }
                if (ev.keyCode == 13) {
                    if (this.popupVisible()) {
                        this.selectedItem(this.activeItem());
                        this.popupVisible(false);
                    }
                }
                else {
                    if (ev.keyCode == 38 || ev.keyCode == 40) {
                        if (this.popupVisible()) {
                            this.activeItem(this.getAdjacentItem(this.activeItem(), ev.keyCode == 38));
                        }
                        else {
                            if (ev.altKey) {
                                this.activeItem(this.selectedItem());
                                this.popupVisible(true);
                            }
                            else {
                                this.selectedItem(this.getAdjacentItem(this.selectedItem(), ev.keyCode == 38));
                            }
                        }
                        return false;
                    }
                    else {
                        if (ev.keyCode == 46) {
                            if (this.selectedItem() != this.emptyItem) {
                                this.selectedItem(this.emptyItem);
                                this.popupVisible(false);
                            }
                        }
                    }
                }
                return true;
            };
            ListBox.prototype.onEmptyItemClick = function () {
                this.inputHasFocus(true);
                this.selectedItem(this.emptyItem);
                this.popupVisible(false);
            };
            ListBox.prototype.onEmptyItemHovered = function () {
                this.activeItem(this.emptyItem);
            };
            ListBox.prototype.onItemHovered = function (item) {
                this.activeItem(item);
            };
            ListBox.prototype.onItemClick = function (item) {
                if (this.enabled()) {
                    this.inputHasFocus(true);
                    this.selectedItem(item);
                    this.popupVisible(false);
                    return false;
                }
            };
            ListBox.prototype.getItemText = function (item) {
                if (item == this.emptyItem) {
                    return "";
                }
                var textMember = this.textMember();
                if (textMember != null) {
                    var text = typeof textMember == "function" ? textMember(item) : ko.unwrap(item[textMember]);
                    if (text != null) {
                        text = text.toString();
                    }
                    else {
                        text = "";
                    }
                    return text;
                }
                else {
                    return item.toString();
                }
            };
            ListBox.prototype.getItemValue = function (item) {
                if (item == this.emptyItem) {
                    return null;
                }
                var valueMember = ko.unwrap(this.valueMember);
                if (valueMember != null) {
                    return typeof valueMember == "function" ? valueMember(item) : ko.unwrap(item[valueMember]);
                }
                else {
                    return item;
                }
            };
            ListBox.prototype.getAdjacentItem = function (currentItem, previous) {
                var list = [];
                if (this.emptyText() !== undefined) {
                    list.push(this.emptyItem);
                }
                var items = this.items();
                if (items != null) {
                    list = list.concat(items);
                }
                var index = (currentItem == null ? -1 : items.indexOf(currentItem)) + (previous ? -1 : 1);
                if (index < 0) {
                    index = items.length - 1;
                }
                if (index > items.length - 1) {
                    index = 0;
                }
                return items[index];
            };
            ListBox.prototype.dispose = function () {
                this.emptyItemText.dispose();
                this.hasFocus.dispose();
                this.inputText.dispose();
                this.state.dispose();
            };
            ListBox.componentName = "list-box";
            return ListBox;
        })(controls.Component);
        ko.components.register(ListBox.componentName, {
            viewModel: ListBox,
            template: "<ul data-bind=\"foreach: items\">     <li></li> </ul>"
        });
    })(controls = spa.controls || (spa.controls = {}));
})(spa || (spa = {}));
var spa;
(function (spa) {
    var controls;
    (function (controls) {
        var MemoEdit = (function (_super) {
            __extends(MemoEdit, _super);
            function MemoEdit(params) {
                _super.call(this, params);
                this.ensureParametersValid(["autofocus", "enabled", "maxLength", "placeholder", "readOnly", "text"], params, MemoEdit.componentName);
                if (params == null) {
                    params = {};
                }
                this.createObservableProperty("autofocus", false, params.autofocus);
                this.createObservableProperty("enabled", true, params.enabled);
                this.createObservableProperty("maxLength", null, params.maxLength);
                this.createObservableProperty("placeholder", null, params.placeholder);
                this.createObservableProperty("readOnly", false, params.readOnly);
                this.createObservableProperty("text", null, params.text);
            }
            MemoEdit.componentName = "memo-edit";
            return MemoEdit;
        })(controls.Component);
        controls.MemoEdit = MemoEdit;
        ko.components.register(MemoEdit.componentName, {
            viewModel: MemoEdit,
            template: "<textarea class=\"input\" data-bind=\"     attr: { maxlength: maxLength, placeholder: placeholder },     autofocus: autofocus,     enable: enabled,     readOnly: readOnly,     value: text,     valueUpdate: 'input'\"></textarea>"
        });
    })(controls = spa.controls || (spa.controls = {}));
})(spa || (spa = {}));
var spa;
(function (spa) {
    var controls;
    (function (controls) {
        var NumericEdit = (function (_super) {
            __extends(NumericEdit, _super);
            function NumericEdit(params) {
                _super.call(this, params);
                this.hasFocus = ko.observable(false);
                this.text = ko.observable();
                this.ensureParametersValid(["autofocus", "decimals", "enabled", "increment", "max", "min", "placeholder", "readOnly", "units", "value"], params, NumericEdit.componentName);
                if (params == null) {
                    params = {};
                }
                this.createObservableProperty("autofocus", false, params.autofocus);
                this.createObservableProperty("decimals", 0, params.decimals);
                this.createObservableProperty("enabled", true, params.enabled);
                this.createObservableProperty("increment", 1, params.increment);
                this.createObservableProperty("max", null, params.max);
                this.createObservableProperty("min", null, params.min);
                this.createObservableProperty("placeholder", null, params.placeholder);
                this.createObservableProperty("readOnly", false, params.readOnly);
                this.createObservableProperty("units", null, params.units);
                this.createObservableProperty("value", null, params.value);
                this.bindMethods();
                if (params.value !== undefined) {
                    this.onValueChanged(this.value());
                }
                this.subscribe(this.decimals, this.onDecimalsChanged);
                this.subscribe(this.hasFocus, this.onFocusChanged);
                this.subscribe(this.max, this.onMaxChanged);
                this.subscribe(this.min, this.onMinChanged);
                this.subscribe(this.text, this.onTextChanged);
                this.subscribe(this.units, this.onUnitsChanged);
                this.subscribe(this.value, this.onValueChanged);
            }
            NumericEdit.prototype.bindMethods = function () {
                this.onButtonMouseDown = this.onButtonMouseDown.bind(this);
                this.onDecimalsChanged = this.onDecimalsChanged.bind(this);
                this.onFocusChanged = this.onFocusChanged.bind(this);
                this.onMinChanged = this.onMinChanged.bind(this);
                this.onMaxChanged = this.onMaxChanged.bind(this);
                this.onTextChanged = this.onTextChanged.bind(this);
                this.onUnitsChanged = this.onUnitsChanged.bind(this);
                this.onValueChanged = this.onValueChanged.bind(this);
            };
            NumericEdit.prototype.onButtonMouseDown = function (ev) {
                return false;
            };
            NumericEdit.prototype.onDecimalsChanged = function (decimals) {
                var value = this.value();
                if (value != null && !isNaN(value)) {
                    value = this.truncate(value);
                }
                if (!this.compare(this.value(), value)) {
                    this.value(value);
                }
            };
            NumericEdit.prototype.onFocusChanged = function (focused) {
                var text = "";
                var value = this.value();
                if (value != null && !isNaN(value)) {
                    if (focused) {
                        text = value.toString().replace(".", ",");
                    }
                    else {
                        text = this.format(value);
                    }
                }
                if (this.text() != text) {
                    this.text(text);
                }
            };
            NumericEdit.prototype.onMinChanged = function (min) {
                var value = this.value();
                if (value != null && !isNaN(value) && min != null && value < min) {
                    this.value(min);
                }
            };
            NumericEdit.prototype.onMaxChanged = function (max) {
                var value = this.value();
                if (value != null && !isNaN(value) && max != null && value > max) {
                    this.value(max);
                }
            };
            NumericEdit.prototype.onTextChanged = function (text) {
                var _this = this;
                if (this.hasFocus() == false) {
                    return;
                }
                var value = this.parse(text);
                if (isNaN(value)) {
                    setTimeout(function () {
                        var value = _this.value();
                        if (value == null || isNaN(value)) {
                            _this.text("");
                        }
                        else {
                            _this.text(value.toString().replace(".", ","));
                        }
                    }, 0);
                }
                else {
                    if (!this.compare(this.value(), value)) {
                        this.value(value);
                    }
                }
            };
            NumericEdit.prototype.onUnitsChanged = function (units) {
                if (!this.hasFocus()) {
                    var text = this.format(this.value());
                    if (this.text() != text) {
                        this.text(text);
                    }
                }
            };
            NumericEdit.prototype.onValueChanged = function (value) {
                var _this = this;
                if (value != null && !isNaN(value)) {
                    var truncatedValue = this.truncate(value);
                    if (!this.compare(truncatedValue, value)) {
                        setTimeout(function () {
                            _this.value(truncatedValue);
                        }, 0);
                        return;
                    }
                }
                if (this.hasFocus()) {
                    var currentValue = this.parse(this.text());
                    if (!this.compare(currentValue, value)) {
                        this.text(value.toString().replace(".", ","));
                    }
                }
                else {
                    var text = "";
                    if (value != null && !isNaN(value)) {
                        text = this.format(value);
                    }
                    if (this.text() != text) {
                        this.text(text);
                    }
                }
            };
            NumericEdit.prototype.decrease = function () {
                if (this.enabled()) {
                    this.addIncrement(false);
                    this.hasFocus(true);
                }
            };
            NumericEdit.prototype.increase = function () {
                if (this.enabled()) {
                    this.addIncrement(true);
                    this.hasFocus(true);
                }
            };
            NumericEdit.prototype.addIncrement = function (up) {
                var value = this.value();
                if (value == null || isNaN(value)) {
                    value = 0;
                }
                var decimals = 0;
                if (value.toString().indexOf(".") != -1) {
                    decimals = value.toString().split(".")[1].length;
                }
                value += up ? this.increment() : -this.increment();
                // 15.01 + 1 = 16.009999999999999999;
                if (decimals >= 0) {
                    value = parseFloat(value.toFixed(decimals));
                }
                value = this.truncate(value);
                if (!this.compare(this.value(), value)) {
                    this.value(value);
                }
            };
            NumericEdit.prototype.format = function (value) {
                if (value == null || isNaN(value)) {
                    return "";
                }
                var text = value.toLocaleString("ru-RU");
                var units = this.units();
                if (units != null && units.length > 0) {
                    text += " " + units;
                }
                return text;
            };
            NumericEdit.prototype.parse = function (text) {
                if (text == null || text.trim().length == 0) {
                    return null;
                }
                text = text.replace(",", ".");
                var decimals = this.decimals();
                if (decimals != null && decimals >= 0) {
                    if (decimals == 0 && text.indexOf(".") != -1) {
                        return NaN;
                    }
                    else {
                        if (text.indexOf(".") != -1 && text.split(".")[1].length > decimals) {
                            return NaN;
                        }
                    }
                }
                var value = (new Number(text));
                if (isNaN(value)) {
                    return NaN;
                }
                value = parseFloat(text);
                if (isNaN(value)) {
                    return NaN;
                }
                var truncatedValue = this.truncate(value);
                if (value != truncatedValue) {
                    return NaN;
                }
                return value;
            };
            NumericEdit.prototype.truncate = function (value) {
                var decimals = this.decimals();
                if (decimals != null && !isNaN(decimals) && decimals >= 0) {
                    value = parseFloat(value.toFixed(decimals));
                }
                var max = this.max();
                if (max != null && !isNaN(max) && value > max) {
                    value = max;
                }
                var min = this.min();
                if (min != null && !isNaN(min) && value < min) {
                    value = min;
                }
                return value;
            };
            NumericEdit.componentName = "numeric-edit";
            return NumericEdit;
        })(controls.Component);
        controls.NumericEdit = NumericEdit;
        ko.components.register(NumericEdit.componentName, {
            viewModel: NumericEdit,
            template: "<input class=\"ne-input\" type=\"text\" maxlength=\"16\" data-bind=\"         attr: { placeholder: placeholder },         autofocus: autofocus,         enable: enabled,         hasFocus: hasFocus,         readOnly: readOnly,         value: text,         valueUpdate: 'input'\" /> <div class=\"ne-buttons\">     <button class=\"ne-button ne-increase\" tabindex=\"-1\" data-bind=\"             enable: enabled,             click: increase,             event: { mousedown: onButtonMouseDown }\"></button>     <button class=\"ne-button ne-decrease\" tabindex=\"-1\" data-bind=\"             enable: enabled,             click: decrease,             event: { mousedown: onButtonMouseDown }\"></button> </div>"
        });
    })(controls = spa.controls || (spa.controls = {}));
})(spa || (spa = {}));
var spa;
(function (spa) {
    var controls;
    (function (controls) {
        var PertViewModel = (function (_super) {
            __extends(PertViewModel, _super);
            function PertViewModel(params) {
                _super.call(this, params);
                this.viewModel = ko.observable(null);
                if (params == null) {
                    params = {};
                }
                this.createObservableProperty("viewModel", this.viewModel, params.viewModel);
            }
            return PertViewModel;
        })(controls.Component);
        controls.PertViewModel = PertViewModel;
    })(controls = spa.controls || (spa.controls = {}));
})(spa || (spa = {}));
ko.components.register("c:pert", {
    viewModel: spa.controls.PertViewModel,
    template: "<canvas class=\"pert\" data-bind=\"pert: viewModel\" tabindex=\"-1\"></canvas>"
});
var spa;
(function (spa) {
    var controls;
    (function (controls) {
        var PertElement = (function () {
            function PertElement() {
                this._bounds = [0, 0, 0, 0];
                this._boundsUpdated = false;
                this._creating = false;
                this._hovered = null;
                this._canvasUpdated = false;
                this._outlineUpdated = false;
                this._selected = false;
                this._subscriptions = [];
            }
            Object.defineProperty(PertElement.prototype, "canvas", {
                get: function () {
                    if (this._canvas == null) {
                        this._canvas = document.createElement("canvas");
                    }
                    return this._canvas;
                },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(PertElement.prototype, "outline", {
                get: function () {
                    if (this._outline == null) {
                        this._outline = document.createElement("canvas");
                    }
                    return this._outline;
                },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(PertElement.prototype, "bounds", {
                get: function () {
                    if (this._boundsUpdated == false) {
                        this._bounds = this.onLayout(this.canvas.getContext("2d"));
                        this._boundsUpdated = true;
                    }
                    return this._bounds;
                },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(PertElement.prototype, "creating", {
                get: function () {
                    return this._creating;
                },
                set: function (creating) {
                    if (this._creating != creating) {
                        this._creating = creating;
                        this.onPropertyChanged("creating");
                    }
                },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(PertElement.prototype, "hovered", {
                get: function () {
                    return this._hovered;
                },
                set: function (hovered) {
                    if (this._hovered != hovered) {
                        this._hovered = hovered;
                        this.onPropertyChanged("hovered");
                    }
                },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(PertElement.prototype, "selected", {
                get: function () {
                    return this._selected;
                },
                set: function (selected) {
                    if (this._selected != selected) {
                        this._selected = selected;
                        this.onPropertyChanged("selected");
                    }
                },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(PertElement.prototype, "style", {
                get: function () {
                    return null;
                },
                enumerable: true,
                configurable: true
            });
            PertElement.prototype.subscribe = function (handler) {
                this._subscriptions.push(handler);
            };
            PertElement.prototype.unsubscribe = function (handler) {
                this._subscriptions.splice(this._subscriptions.indexOf(handler), 1);
            };
            PertElement.prototype.testBounds = function (rect) {
                return controls.Geometry.rectangleIntersectsRectangle(this.bounds, rect);
            };
            PertElement.prototype.testPath = function (rect) {
                if (this._boundsUpdated == false) {
                    this._bounds = this.onLayout(this.canvas.getContext("2d"));
                    this._boundsUpdated = true;
                }
                return false;
            };
            PertElement.prototype.testPoint = function (point) {
                if (this._boundsUpdated == false) {
                    this._bounds = this.onLayout(this.canvas.getContext("2d"));
                    this._boundsUpdated = true;
                }
                return null;
            };
            PertElement.prototype.draw = function (ctx) {
                if (this._canvasUpdated == false) {
                    this.canvas.height = this.bounds[3];
                    this.canvas.width = this.bounds[2];
                    var canvasCtx = this._canvas.getContext("2d");
                    canvasCtx.clearRect(0, 0, this.canvas.width, this.canvas.height);
                    canvasCtx.save();
                    canvasCtx.translate(-this.bounds[0], -this.bounds[1]);
                    if (this.creating) {
                        canvasCtx.globalAlpha = 0.2;
                    }
                    this.onPaint(canvasCtx);
                    if (this.creating) {
                        canvasCtx.globalAlpha = 1;
                    }
                    canvasCtx.restore();
                    this._canvasUpdated = true;
                }
                ctx.drawImage(this.canvas, this.bounds[0], this.bounds[1]);
            };
            PertElement.prototype.drawOutline = function (ctx) {
                if (this._outlineUpdated == false) {
                    this.outline.height = this.bounds[3];
                    this.outline.width = this.bounds[2];
                    var outlineCtx = this._outline.getContext("2d");
                    outlineCtx.clearRect(0, 0, this.outline.width, this.outline.height);
                    outlineCtx.save();
                    outlineCtx.translate(-this.bounds[0], -this.bounds[1]);
                    this.onPaintOutline(outlineCtx);
                    outlineCtx.restore();
                    this._outlineUpdated = true;
                }
                ctx.drawImage(this.outline, this.bounds[0], this.bounds[1]);
            };
            PertElement.prototype.onPropertyChanged = function (propertyName) {
                if (propertyName == "creating" || propertyName == "hovered" || propertyName == "selected") {
                    this.update();
                }
                for (var i = 0; i < this._subscriptions.length; i++) {
                    this._subscriptions[i](this, propertyName);
                }
            };
            PertElement.prototype.onStyleChanged = function (propertyName) {
                if (propertyName == "outlineColor") {
                    this.updateOutline();
                }
                if (propertyName == "outlineWidth") {
                    this.update();
                }
                for (var i = 0; i < this._subscriptions.length; i++) {
                    this._subscriptions[i](this, propertyName);
                }
            };
            PertElement.prototype.onLayout = function (ctx) {
                return [];
            };
            PertElement.prototype.onPaint = function (ctx) {
            };
            PertElement.prototype.onPaintOutline = function (ctx) {
            };
            PertElement.prototype.update = function () {
                this._boundsUpdated = false;
                this._canvasUpdated = false;
                this._outlineUpdated = false;
            };
            PertElement.prototype.updateBounds = function () {
                this._boundsUpdated = false;
            };
            PertElement.prototype.updateCanvas = function () {
                this._canvasUpdated = false;
            };
            PertElement.prototype.updateOutline = function () {
                this._outlineUpdated = false;
            };
            return PertElement;
        })();
        controls.PertElement = PertElement;
        var ElementStyle = (function () {
            function ElementStyle(element) {
                this._outlineColor = "#ffc526";
                this._outlineWidth = 4;
                this._element = element;
            }
            Object.defineProperty(ElementStyle.prototype, "outlineColor", {
                get: function () {
                    return this._outlineColor;
                },
                set: function (outlineColor) {
                    if (this._outlineColor != outlineColor) {
                        this._outlineColor = outlineColor;
                        this.onPropertyChanged("outlineColor");
                    }
                },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(ElementStyle.prototype, "outlineWidth", {
                get: function () {
                    return this._outlineWidth;
                },
                set: function (outlineWidth) {
                    if (this._outlineWidth != outlineWidth) {
                        this._outlineWidth = outlineWidth;
                        this.onPropertyChanged("outlineWidth");
                    }
                },
                enumerable: true,
                configurable: true
            });
            ElementStyle.prototype.onPropertyChanged = function (propertyName) {
                this._element.onStyleChanged(propertyName);
            };
            return ElementStyle;
        })();
        controls.ElementStyle = ElementStyle;
    })(controls = spa.controls || (spa.controls = {}));
})(spa || (spa = {}));
/// <reference path="element.ts" />
var spa;
(function (spa) {
    var controls;
    (function (controls) {
        var PertConnector = (function (_super) {
            __extends(PertConnector, _super);
            function PertConnector() {
                _super.call(this);
                this._anchors = false;
                this._locationChanged = false;
                this.onNodeChanged = this.onNodeChanged.bind(this);
            }
            Object.defineProperty(PertConnector.prototype, "anchors", {
                get: function () {
                    return this._anchors;
                },
                set: function (anchors) {
                    if (this._anchors != anchors) {
                        this._anchors = anchors;
                        this.onPropertyChanged("anchors");
                    }
                },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(PertConnector.prototype, "endNode", {
                get: function () {
                    return this._endNode;
                },
                set: function (endNode) {
                    if (this._endNode != endNode) {
                        if (this._endNode != null) {
                            this._endNode.unsubscribe(this.onNodeChanged);
                            this._endPoint = this._endNodePoint;
                        }
                        this._endNode = endNode;
                        if (this._endNode != null) {
                            this._endNode.subscribe(this.onNodeChanged);
                        }
                        this.onPropertyChanged("endNode");
                        this.onPropertyChanged("endPoint");
                    }
                },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(PertConnector.prototype, "endPoint", {
                get: function () {
                    return this._endNode == null ? this._endPoint : this._endNodePoint;
                },
                set: function (endPoint) {
                    if (!this.comparePoints(this._endPoint, endPoint)) {
                        this._endPoint = endPoint;
                        if (this._endNode == null) {
                            this.onPropertyChanged("endPoint");
                        }
                    }
                },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(PertConnector.prototype, "startNode", {
                get: function () {
                    return this._startNode;
                },
                set: function (startNode) {
                    if (this._startNode != startNode) {
                        if (this._startNode != null) {
                            this._startNode.unsubscribe(this.onNodeChanged);
                            this._startPoint = this._startNodePoint;
                            ;
                        }
                        this._startNode = startNode;
                        if (this._startNode != null) {
                            this._startNode.subscribe(this.onNodeChanged);
                        }
                        this.onPropertyChanged("startNode");
                        this.onPropertyChanged("startPoint");
                    }
                },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(PertConnector.prototype, "startPoint", {
                get: function () {
                    return this._startNode == null ? this._startPoint : this._startNodePoint;
                },
                set: function (startPoint) {
                    if (!this.comparePoints(this._startPoint, startPoint)) {
                        this._startPoint = startPoint;
                        if (this._startNode == null) {
                            this.onPropertyChanged("startPoint");
                        }
                    }
                },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(PertConnector.prototype, "style", {
                get: function () {
                    if (this._style == null) {
                        this._style = new ConnectorStyle(this);
                    }
                    return this._style;
                },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(PertConnector.prototype, "text", {
                get: function () {
                    return this._text;
                },
                set: function (text) {
                    if (this._text != text) {
                        this._text = text;
                        this.onPropertyChanged("text");
                    }
                },
                enumerable: true,
                configurable: true
            });
            PertConnector.prototype.onPropertyChanged = function (propertyName) {
                if (["anchors", "text"].indexOf(propertyName) != -1) {
                    this.updateBounds();
                    this.updateCanvas();
                    this.updateOutline();
                }
                if (["endPoint", "startPoint"].indexOf(propertyName) != -1) {
                    this.updateNodePoints();
                    this.updateBounds();
                    this._locationChanged = true;
                }
                _super.prototype.onPropertyChanged.call(this, propertyName);
            };
            PertConnector.prototype.onStyleChanged = function (propertyName) {
                this.updateCanvas();
                if (this.anchors) {
                    if (["anchorBorderWidth", "anchorRadius"].indexOf(propertyName)) {
                        this.updateBounds();
                        this.updateOutline();
                    }
                }
                if (["font", "lineHeight", "textOffset", "textUnderline", "width"].indexOf(propertyName)) {
                    this.updateBounds();
                    this.updateOutline();
                }
                _super.prototype.onStyleChanged.call(this, propertyName);
            };
            PertConnector.prototype.onLayout = function (ctx) {
                var start = this.startPoint;
                var end = this.endPoint;
                if (start == null || end == null) {
                    return [0, 0, 1, 1];
                }
                var ltr = end[0] >= start[0];
                var length = controls.Geometry.lineLength([start[0], start[1], end[0], end[1]]);
                var capLength = Math.max(this.style.width * 5, 5 * 5);
                var capWidth = Math.max(this.style.width * 3, 3 * 5);
                var lineLength = length - capLength;
                var width = Math.max(this.style.width, 5);
                if (lineLength < 0) {
                    lineLength = length;
                    capLength = 0;
                    capWidth = 0;
                }
                this._arrowBounds = this.getArrowBounds(start, end, width, capLength, capWidth);
                var bounds = controls.Geometry.polygonBoundingRectangle(this._arrowBounds);
                if (this.anchors) {
                    var anchorRadius = this.style.anchorRadius + this.style.anchorBorderWidth / 2;
                    this._startAnchorBounds = [start[0], start[1], anchorRadius];
                    this._endAnchorBounds = [end[0], end[1], anchorRadius];
                    bounds = controls.Geometry.inflateRectangle(bounds, anchorRadius, anchorRadius);
                }
                ctx.font = this.style.font;
                this._textBounds = [];
                if (this.text != null && this.text.trim().length > 0) {
                    var lines = this.wrapText(this.text, ctx, this.style.font, 3, lineLength - 16);
                    var bottom = -this.style.textOffset;
                    var origin = ltr ? start : end;
                    var angle = ltr ? controls.Geometry.lineAngle([start[0], start[1], end[0], end[1]]) : controls.Geometry.lineAngle([end[0], end[1], start[0], start[1]]);
                    for (var i = lines.length - 1; i >= 0; i--) {
                        var lineWidth = ctx.measureText(lines[i]).width;
                        var lineRect = [lineLength / 2 - lineWidth / 2, bottom - this.style.lineHeight, lineWidth, this.style.lineHeight];
                        if (!ltr) {
                            lineRect[0] += capLength;
                        }
                        var linePolygon = controls.Geometry.rotateRectangle(controls.Geometry.translateRectangle(lineRect, origin[0], origin[1]), origin, angle);
                        this._textBounds.push(linePolygon);
                        bounds = controls.Geometry.unionRectangle(bounds, controls.Geometry.polygonBoundingRectangle(linePolygon));
                        bottom -= this.style.lineHeight;
                    }
                }
                bounds = controls.Geometry.inflateRectangle(bounds, 2 + this.style.outlineWidth, 2 + this.style.outlineWidth);
                return bounds;
            };
            PertConnector.prototype.onPaint = function (ctx) {
                var start = this.startPoint;
                var end = this.endPoint;
                if (start == null || end == null) {
                    return;
                }
                var ltr = end[0] >= start[0];
                var length = start[1] == end[1] ? Math.abs(end[0] - start[0]) : controls.Geometry.lineLength([start[0], start[1], end[0], end[1]]);
                var capLength = Math.max(this.style.width * 5, 3 * 5);
                var capWidth = Math.max(this.style.width * 3, 3 * 3);
                var lineLength = length - capLength;
                if (lineLength < 0) {
                    lineLength = length;
                    capLength = 0;
                    capWidth = 0;
                }
                ctx.save();
                // translate;
                if (ltr) {
                    ctx.translate(start[0], start[1]);
                }
                else {
                    ctx.translate(end[0], end[1]);
                }
                if (start[1] != end[1]) {
                    if (ltr) {
                        ctx.rotate(controls.Geometry.lineAngle([start[0], start[1], end[0], end[1]]) * Math.PI / 180);
                    }
                    else {
                        ctx.rotate(controls.Geometry.lineAngle([end[0], end[1], start[0], start[1]]) * Math.PI / 180);
                    }
                }
                // arrow;
                ctx.beginPath();
                if (ltr) {
                    ctx.moveTo(0, 0);
                    ctx.lineTo(lineLength, 0);
                }
                else {
                    ctx.moveTo(capLength, 0);
                    ctx.lineTo(lineLength + capLength, 0);
                }
                ctx.lineWidth = this.style.width;
                if (this.style.lineDash != null) {
                    ctx.setLineDash(this.style.lineDash);
                }
                ctx.strokeStyle = this.style.color;
                ctx.stroke();
                if (capLength > 0) {
                    ctx.beginPath();
                    if (ltr) {
                        ctx.moveTo(lineLength, -capWidth / 2);
                        ctx.lineTo(lineLength + capLength, 0);
                        ctx.lineTo(lineLength, capWidth / 2);
                        ctx.lineTo(lineLength, -capWidth / 2);
                    }
                    else {
                        ctx.moveTo(0, 0);
                        ctx.lineTo(capLength, -capWidth / 2);
                        ctx.lineTo(capLength, capWidth / 2);
                        ctx.lineTo(0, 0);
                    }
                    ctx.fillStyle = this.style.color;
                    ctx.fill();
                }
                // anchors;
                if (this.anchors) {
                    ctx.beginPath();
                    ctx.arc(0, 0, this.style.anchorRadius, 0, Math.PI * 2);
                    ctx.moveTo(length + this.style.anchorRadius + this.style.anchorBorderWidth / 2, 0);
                    ctx.arc(length, 0, this.style.anchorRadius, 0, Math.PI * 2);
                    ctx.fillStyle = this.style.anchorBackgroundColor;
                    ctx.fill();
                    ctx.setLineDash([]);
                    ctx.lineWidth = this.style.anchorBorderWidth;
                    ctx.strokeStyle = this.style.anchorBorderColor;
                    ctx.stroke();
                }
                // text;
                if (this.text != null && this.text.length > 0 && lineLength > 0) {
                    ctx.fillStyle = this.style.color;
                    ctx.font = this.style.color;
                    ctx.textAlign = "center";
                    ctx.textBaseline = "bottom";
                    var left = ltr ? 0 : capLength;
                    var bottom = -this.style.width / 2 - this.style.textOffset;
                    var lines = this.wrapText(this.text, ctx, this.style.font, 3, lineLength - 16);
                    for (var i = lines.length - 1; i >= 0; i--) {
                        if (ltr) {
                            ctx.fillText(lines[i], lineLength / 2, bottom);
                        }
                        else {
                            ctx.fillText(lines[i], capLength + lineLength / 2, bottom);
                        }
                        bottom -= this.style.lineHeight;
                    }
                    bottom = -this.style.width / 2 - this.style.textOffset;
                    if (this.style.textUnderline) {
                        ctx.beginPath();
                        for (var i = lines.length - 1; i >= 0; i--) {
                            var lineWidth = ctx.measureText(lines[i]).width;
                            var x = ltr ? lineLength / 2 - lineWidth / 2 : capLength + lineLength / 2 - lineWidth / 2;
                            ctx.moveTo(x, bottom);
                            ctx.lineTo(x + lineWidth, bottom);
                            bottom -= this.style.lineHeight;
                        }
                        ctx.lineWidth = 1;
                        ctx.stroke();
                    }
                }
                ctx.restore();
            };
            PertConnector.prototype.onPaintOutline = function (ctx) {
                var start = this.startPoint;
                var end = this.endPoint;
                if (start == null || end == null) {
                    return;
                }
                var ltr = end[0] >= start[0];
                var length = start[1] == end[1] ? Math.abs(end[0] - start[0]) : controls.Geometry.lineLength([start[0], start[1], end[0], end[1]]);
                var capLength = Math.max(this.style.width * 5, 3 * 5);
                var capWidth = Math.max(this.style.width * 3, 3 * 3);
                var lineLength = length - capLength;
                var outline = this.style.outlineWidth;
                if (lineLength < 0) {
                    lineLength = length;
                    capLength = 0;
                    capWidth = 0;
                }
                ctx.save();
                // translate;
                if (ltr) {
                    ctx.translate(start[0], start[1]);
                }
                else {
                    ctx.translate(end[0], end[1]);
                }
                if (start[1] != end[1]) {
                    if (ltr) {
                        ctx.rotate(controls.Geometry.lineAngle([start[0], start[1], end[0], end[1]]) * Math.PI / 180);
                    }
                    else {
                        ctx.rotate(controls.Geometry.lineAngle([end[0], end[1], start[0], start[1]]) * Math.PI / 180);
                    }
                }
                // arrow;
                ctx.beginPath();
                if (ltr) {
                    ctx.moveTo(-outline, 0);
                    ctx.lineTo(lineLength - outline, 0);
                }
                else {
                    ctx.moveTo(capLength + outline, 0);
                    ctx.lineTo(capLength + lineLength + outline, 0);
                }
                ctx.lineWidth = this.style.width + outline * 2;
                ctx.strokeStyle = this.style.outlineColor;
                ctx.stroke();
                if (capLength > 0) {
                    ctx.beginPath();
                    if (ltr) {
                        ctx.moveTo(lineLength - outline, -capWidth / 2 - outline);
                        ctx.lineTo(lineLength + capLength + outline * 2, 0);
                        ctx.lineTo(lineLength - outline, capWidth / 2 + outline);
                        ctx.lineTo(lineLength - outline, -capWidth / 2 - outline);
                    }
                    else {
                        ctx.moveTo(-outline * 2, 0);
                        ctx.lineTo(capLength + outline, -capWidth / 2 - outline);
                        ctx.lineTo(capLength + outline, capWidth / 2 + outline);
                        ctx.lineTo(-outline * 2, 0);
                    }
                    ctx.fillStyle = this.style.outlineColor;
                    ctx.fill();
                }
                ctx.restore();
            };
            PertConnector.prototype.testPath = function (rect) {
                var result = _super.prototype.testPath.call(this, rect);
                if (result == false) {
                    if (controls.Geometry.polygonIntersectsRectangle(this._arrowBounds, rect)) {
                        return true;
                    }
                }
                return false;
            };
            PertConnector.prototype.testPoint = function (point) {
                var anchor = _super.prototype.testPoint.call(this, point);
                if (anchor == null) {
                    if (this.anchors) {
                        if (controls.Geometry.circleContainsPoint(this._startAnchorBounds, point)) {
                            return "START";
                        }
                        if (controls.Geometry.circleContainsPoint(this._endAnchorBounds, point)) {
                            return "END";
                        }
                    }
                    for (var i = 0; i < this._textBounds.length; i++) {
                        if (controls.Geometry.polygonContainsPoint(this._textBounds[i], point)) {
                            return "TEXT";
                        }
                    }
                    if (controls.Geometry.polygonContainsPoint(this._arrowBounds, point)) {
                        return "ARROW";
                    }
                }
                return anchor;
            };
            PertConnector.prototype.draw = function (ctx) {
                if (this._locationChanged) {
                    this.updateLocation();
                }
                _super.prototype.draw.call(this, ctx);
            };
            PertConnector.prototype.drawOutline = function (ctx) {
                if (this._locationChanged) {
                    this.updateLocation();
                }
                _super.prototype.drawOutline.call(this, ctx);
            };
            PertConnector.prototype.updateLocation = function () {
                var invalidate = true;
                if (this._imageEndPoint != null && this._imageStartPoint != null) {
                    if (this._imageStartPoint[0] - this.startPoint[0] == this._imageEndPoint[0] - this.endPoint[0]) {
                        if (this._imageStartPoint[1] - this.startPoint[1] == this._imageEndPoint[1] - this.endPoint[1]) {
                            invalidate = false;
                        }
                    }
                }
                if (invalidate) {
                    this.updateCanvas();
                    this.updateOutline();
                }
                this._imageEndPoint = this.endPoint;
                this._imageStartPoint = this.startPoint;
                this._locationChanged = false;
            };
            PertConnector.prototype.comparePoints = function (p1, p2) {
                if (p1 != null && p2 != null) {
                    return p1[0] == p2[0] && p1[1] == p2[1];
                }
                return p1 == null && p2 == null;
            };
            PertConnector.prototype.onNodeChanged = function (node, propertyName) {
                this.updateNodePoints();
                if (node == this.startNode) {
                    this.onPropertyChanged("startPoint");
                }
                else {
                    this.onPropertyChanged("endPoint");
                }
            };
            PertConnector.prototype.floorPoint = function (point) {
                return [Math.floor(point[0]), Math.floor(point[1])];
            };
            PertConnector.prototype.updateNodePoints = function () {
                if (this._endNode == null) {
                    this._endNodePoint = null;
                }
                else {
                    var nodeRadius = this._endNode.style.radius + this._endNode.style.borderWidth / 2;
                    if (this._startNode != null) {
                        this._endNodePoint = this.floorPoint(controls.Geometry.movePoint(this._endNode.location, this._startNode.location, nodeRadius));
                    }
                    else {
                        if (this.startPoint != null) {
                            this._endNodePoint = this.floorPoint(controls.Geometry.movePoint(this._endNode.location, this.startPoint, nodeRadius));
                        }
                        else {
                            this._endNodePoint = this._endNode.location;
                        }
                    }
                }
                if (this._startNode == null) {
                    this._startNodePoint = null;
                }
                else {
                    var nodeRadius = this._startNode.style.radius + this._startNode.style.borderWidth / 2;
                    if (this._endNode != null) {
                        this._startNodePoint = this.floorPoint(controls.Geometry.movePoint(this._startNode.location, this._endNode.location, nodeRadius));
                    }
                    else {
                        if (this.endPoint != null) {
                            this._startNodePoint = this.floorPoint(controls.Geometry.movePoint(this._startNode.location, this.endPoint, nodeRadius));
                        }
                        else {
                            this._startNodePoint = this._startNode.location;
                        }
                    }
                }
            };
            PertConnector.prototype.getArrowBounds = function (start, end, width, capLength, capWidth) {
                var length = start[1] == end[1] ? Math.abs(end[0] - start[0]) : controls.Geometry.lineLength([start[0], start[1], end[0], end[1]]);
                var lineLength = length - capLength;
                if (lineLength < 0) {
                    lineLength = length;
                    capLength = 0;
                    capWidth = width;
                }
                var arrow = [
                    [0, -width / 2],
                    [lineLength, -width / 2],
                    [lineLength, -capWidth / 2],
                    [lineLength + capLength, 0],
                    [lineLength, capWidth / 2],
                    [lineLength, width / 2],
                    [0, width / 2]
                ];
                arrow = controls.Geometry.translatePolygon(arrow, start[0], start[1]);
                if (start[1] != end[1] || end[0] < start[0]) {
                    var angle = controls.Geometry.lineAngle([start[0], start[1], end[0], end[1]]);
                    arrow = controls.Geometry.rotatePolygon(arrow, start, angle);
                }
                return arrow;
            };
            PertConnector.prototype.wrapText = function (text, ctx, font, maxLines, maxWidth) {
                ctx.font = font;
                var lines = [];
                var lineWidth = 0;
                var spaceWidth = ctx.measureText(" ").width;
                var words = text.split(' ');
                for (var i = 0; i < words.length; i++) {
                    var wordWidth = ctx.measureText(words[i]).width;
                    var newLine = (lineWidth == 0) || (lineWidth + spaceWidth + wordWidth > maxWidth);
                    if (newLine) {
                        if (lines.length == maxLines) {
                            lines[lines.length - 1] += "...";
                            break;
                        }
                        lines.push(words[i]);
                        lineWidth = wordWidth;
                    }
                    else {
                        lines[lines.length - 1] += " " + words[i];
                        lineWidth += spaceWidth + wordWidth;
                    }
                }
                return lines;
            };
            return PertConnector;
        })(controls.PertElement);
        controls.PertConnector = PertConnector;
        var ConnectorStyle = (function (_super) {
            __extends(ConnectorStyle, _super);
            function ConnectorStyle(element) {
                _super.call(this, element);
                this._anchorBackgroundColor = "#9b59b6";
                this._anchorBorderColor = "#8e44ad";
                this._anchorBorderWidth = 2;
                this._anchorRadius = 6;
                this._color = "#2e75b5";
                this._font = "12px Tahoma";
                this._lineHeight = 14;
                this._textOffset = 10;
                this._textUnderline = false;
                this._width = 4;
            }
            Object.defineProperty(ConnectorStyle.prototype, "anchorBackgroundColor", {
                get: function () {
                    return this._anchorBackgroundColor;
                },
                set: function (anchorBackgroundColor) {
                    if (this._anchorBackgroundColor != anchorBackgroundColor) {
                        this._anchorBackgroundColor = anchorBackgroundColor;
                        this.onPropertyChanged("anchorBackgroundColor");
                    }
                },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(ConnectorStyle.prototype, "anchorBorderColor", {
                get: function () {
                    return this._anchorBorderColor;
                },
                set: function (anchorBorderColor) {
                    if (this._anchorBorderColor != anchorBorderColor) {
                        this._anchorBorderColor = anchorBorderColor;
                        this.onPropertyChanged("anchorBorderColor");
                    }
                },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(ConnectorStyle.prototype, "anchorBorderWidth", {
                get: function () {
                    return this._anchorBorderWidth;
                },
                set: function (anchorBorderWidth) {
                    if (this._anchorBorderWidth != anchorBorderWidth) {
                        this._anchorBorderWidth = anchorBorderWidth;
                        this.onPropertyChanged("anchorBorderWidth");
                    }
                },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(ConnectorStyle.prototype, "anchorRadius", {
                get: function () {
                    return this._anchorRadius;
                },
                set: function (anchorRadius) {
                    if (this._anchorRadius != anchorRadius) {
                        this._anchorRadius = anchorRadius;
                        this.onPropertyChanged("anchorRadius");
                    }
                },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(ConnectorStyle.prototype, "color", {
                get: function () {
                    return this._color;
                },
                set: function (color) {
                    if (this._color != color) {
                        this._color = color;
                        this.onPropertyChanged("color");
                    }
                },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(ConnectorStyle.prototype, "font", {
                get: function () {
                    return this._font;
                },
                set: function (font) {
                    if (this._font != font) {
                        this._font = font;
                        this.onPropertyChanged("font");
                    }
                },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(ConnectorStyle.prototype, "lineDash", {
                get: function () {
                    return this._lineDash;
                },
                set: function (lineDash) {
                    if (this._lineDash != lineDash) {
                        this._lineDash = lineDash;
                        this.onPropertyChanged("lineDash");
                    }
                },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(ConnectorStyle.prototype, "lineHeight", {
                get: function () {
                    return this._lineHeight;
                },
                set: function (lineHeight) {
                    if (this._lineHeight != lineHeight) {
                        this._lineHeight = lineHeight;
                        this.onPropertyChanged("lineHeight");
                    }
                },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(ConnectorStyle.prototype, "textOffset", {
                get: function () {
                    return this._textOffset;
                },
                set: function (textOffset) {
                    if (this._textOffset != textOffset) {
                        this._textOffset = textOffset;
                        this.onPropertyChanged("textOffset");
                    }
                },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(ConnectorStyle.prototype, "textUnderline", {
                get: function () {
                    return this._textUnderline;
                },
                set: function (textUnderline) {
                    if (this._textUnderline != textUnderline) {
                        this._textUnderline = textUnderline;
                        this.onPropertyChanged("textUnderline");
                    }
                },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(ConnectorStyle.prototype, "width", {
                get: function () {
                    return this._width;
                },
                set: function (width) {
                    if (this._width != width) {
                        this._width = width;
                        this.onPropertyChanged("width");
                    }
                },
                enumerable: true,
                configurable: true
            });
            return ConnectorStyle;
        })(controls.ElementStyle);
        controls.ConnectorStyle = ConnectorStyle;
    })(controls = spa.controls || (spa.controls = {}));
})(spa || (spa = {}));
/// <reference path="connector.ts" />
var spa;
(function (spa) {
    var controls;
    (function (controls) {
        var PertActivity = (function (_super) {
            __extends(PertActivity, _super);
            function PertActivity() {
                _super.apply(this, arguments);
            }
            Object.defineProperty(PertActivity.prototype, "days", {
                get: function () {
                    return this._days;
                },
                set: function (days) {
                    if (this._days !== days) {
                        this._days = days;
                        this.onPropertyChanged("days");
                    }
                },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(PertActivity.prototype, "progress", {
                get: function () {
                    return this._days;
                },
                set: function (progress) {
                    if (this._progress !== progress) {
                        this._progress = progress;
                        this.onPropertyChanged("progress");
                    }
                },
                enumerable: true,
                configurable: true
            });
            PertActivity.prototype.onLayout = function (ctx) {
                var bounds = _super.prototype.onLayout.call(this, ctx);
                var start = this.startPoint;
                var end = this.endPoint;
                if (start == null || end == null) {
                    return bounds;
                }
                var ltr = end[0] >= start[0];
                var length = controls.Geometry.lineLength([start[0], start[1], end[0], end[1]]);
                var capLength = Math.max(this.style.width * 5, 5 * 5);
                var lineLength = length - capLength;
                var width = Math.max(this.style.width, 5);
                if (lineLength < 0) {
                    lineLength = length;
                    capLength = 0;
                }
                if (this._days != null) {
                    ctx.font = this.style.font;
                    var text = this._days.toString();
                    var textWidth = ctx.measureText(text).width;
                    var origin = ltr ? start : end;
                    var angle = ltr ? controls.Geometry.lineAngle([start[0], start[1], end[0], end[1]]) : controls.Geometry.lineAngle([end[0], end[1], start[0], start[1]]);
                    var rect = [lineLength / 2 - textWidth / 2, width / 2 + this.style.textOffset, textWidth, this.style.lineHeight];
                    if (!ltr) {
                        rect[0] += capLength;
                    }
                    var linePolygon = controls.Geometry.rotateRectangle(controls.Geometry.translateRectangle(rect, origin[0], origin[1]), origin, angle);
                    bounds = controls.Geometry.unionRectangle(bounds, controls.Geometry.polygonBoundingRectangle(linePolygon));
                }
                return bounds;
            };
            PertActivity.prototype.onPaint = function (ctx) {
                _super.prototype.onPaint.call(this, ctx);
                var start = this.startPoint;
                var end = this.endPoint;
                if (start == null || end == null) {
                    return;
                }
                if (this.days != null) {
                    ctx.save();
                    var ltr = end[0] >= start[0];
                    var length = start[1] == end[1] ? Math.abs(end[0] - start[0]) : controls.Geometry.lineLength([start[0], start[1], end[0], end[1]]);
                    var capLength = Math.max(this.style.width * 5, 3 * 5);
                    var lineLength = length - capLength;
                    if (lineLength < 0) {
                        lineLength = length;
                        capLength = 0;
                    }
                    // translate;
                    if (ltr) {
                        ctx.translate(start[0], start[1]);
                    }
                    else {
                        ctx.translate(end[0], end[1]);
                    }
                    if (start[1] != end[1]) {
                        if (ltr) {
                            ctx.rotate(controls.Geometry.lineAngle([start[0], start[1], end[0], end[1]]) * Math.PI / 180);
                        }
                        else {
                            ctx.rotate(controls.Geometry.lineAngle([end[0], end[1], start[0], start[1]]) * Math.PI / 180);
                        }
                    }
                    ctx.fillStyle = this.style.color;
                    ctx.font = this.style.color;
                    ctx.textAlign = "center";
                    ctx.textBaseline = "bottom";
                    var bottom = this.style.width / 2 + this.style.textOffset / 2 + this.style.lineHeight;
                    var text = this.days.toString() + " д";
                    if (ltr) {
                        ctx.fillText(text, lineLength / 2, bottom);
                    }
                    else {
                        ctx.fillText(text, capLength + lineLength / 2, bottom);
                    }
                    ctx.restore();
                }
            };
            PertActivity.prototype.onPropertyChanged = function (propertyName) {
                if (["days"].indexOf(propertyName) != -1) {
                    this.updateBounds();
                    this.updateCanvas();
                }
                if (["progress"].indexOf(propertyName) != -1) {
                    this.updateCanvas();
                }
                _super.prototype.onPropertyChanged.call(this, propertyName);
            };
            return PertActivity;
        })(controls.PertConnector);
        controls.PertActivity = PertActivity;
    })(controls = spa.controls || (spa.controls = {}));
})(spa || (spa = {}));
var spa;
(function (spa) {
    var controls;
    (function (controls) {
        var PertDependency = (function (_super) {
            __extends(PertDependency, _super);
            function PertDependency() {
                _super.call(this);
                this.style.color = "#999";
                this.style.lineDash = [8, 3];
                this.style.width = 1;
            }
            return PertDependency;
        })(controls.PertConnector);
        controls.PertDependency = PertDependency;
    })(controls = spa.controls || (spa.controls = {}));
})(spa || (spa = {}));
var spa;
(function (spa) {
    var controls;
    (function (controls) {
        var PertDiagram = (function () {
            // #endregion
            function PertDiagram(canvas) {
                this._scroll = [0, 0];
                this._selectedElements = [];
                this._tool = 6 /* Select */;
                this._updatesDisabled = 0;
                this._zoom = 1;
                // input state;
                this._alt = false;
                this._ctl = false;
                this._shift = false;
                // look & feel;
                this._gridColor = "#eee";
                this._gridSize = 40;
                this._outlineColor = "#ffc526";
                this._outlineWidth = 4;
                this._canvas = canvas;
                this._canvas.oncontextmenu = function (ev) {
                    return false;
                };
                this._context = canvas.getContext("2d");
                this._elements = new controls.PertElementCollection();
                this._elements.onelementadded = this.elementAdded.bind(this);
                this._elements.onelementpropertychanged = this.elementPropertyChanged.bind(this);
                this._elements.onelementremoved = this.elementRemoved.bind(this);
                this.addEventListeners();
                this.updateCanvasSize();
                this.setImageSmoothing(false);
                this.refresh();
            }
            PertDiagram.prototype.dispose = function () {
                this._elements.dispose();
                this._elements = null;
            };
            Object.defineProperty(PertDiagram.prototype, "canvas", {
                // #region Properties
                get: function () {
                    return this._canvas;
                },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(PertDiagram.prototype, "elements", {
                get: function () {
                    return this._elements;
                },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(PertDiagram.prototype, "scroll", {
                get: function () {
                    return this._scroll;
                },
                set: function (scroll) {
                    if (scroll == null) {
                        scroll = [0, 0];
                    }
                    if (scroll[0] != this._scroll[0] || scroll[1] != this._scroll[1]) {
                        this._scroll = scroll;
                        this.onScrollChanged(this._scroll);
                        this.refresh();
                    }
                },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(PertDiagram.prototype, "selectedElements", {
                get: function () {
                    return this._selectedElements;
                },
                set: function (selectedElements) {
                    this.beginUpdate();
                    var deselectedElements = this._selectedElements.slice(0);
                    for (var i = 0; i < deselectedElements.length; i++) {
                        deselectedElements[i].selected = false;
                    }
                    for (var i = 0; i < selectedElements.length; i++) {
                        selectedElements[i].selected = true;
                    }
                    this.endUpdate();
                },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(PertDiagram.prototype, "tool", {
                get: function () {
                    return this._tool;
                },
                set: function (tool) {
                    this._tool = tool;
                    if (this._selectedElements.length == 1 && this._selectedElements[0] instanceof controls.PertConnector) {
                        this._selectedElements[0].anchors = this._tool == 5 /* Move */;
                    }
                    if (this._selectedElements.length > 1) {
                        this.selectedElements = [this._selectedElements[0]];
                    }
                    this.resetTool();
                    this.onToolChanged();
                    this.refresh();
                },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(PertDiagram.prototype, "zoom", {
                get: function () {
                    return this._zoom;
                },
                set: function (zoom) {
                    if (this._zoom != zoom) {
                        this._zoom = zoom;
                        if (this._zoom == null) {
                            this._zoom = 1;
                        }
                        this.setImageSmoothing(this._zoom != 1);
                        this.onZoomChanged(this._zoom);
                        this.refresh();
                    }
                },
                enumerable: true,
                configurable: true
            });
            PertDiagram.prototype.onElementConnecting = function (connector, anchor, node) {
                if (this.onelementconnecting != null) {
                    return this.onelementconnecting(connector, anchor, node);
                }
                return true;
            };
            PertDiagram.prototype.onElementCreating = function (element) {
                if (this.onelementcreating != null) {
                    return this.onelementcreating(element);
                }
                return true;
            };
            PertDiagram.prototype.onElementCreated = function (element) {
                if (this.onelementcreated != null) {
                    this.onelementcreated(element);
                }
            };
            PertDiagram.prototype.onElementPropertyChanged = function (element, propertyName) {
                if (this.onelementpropertychanged != null) {
                    this.onelementpropertychanged(element, propertyName);
                }
            };
            PertDiagram.prototype.onElementDeleting = function (element) {
                if (this.onelementdeleting != null) {
                    return this.onelementdeleting(element);
                }
                return true;
            };
            PertDiagram.prototype.onElementDeleted = function (element) {
                if (this.onelementdeleted != null) {
                    this.onelementdeleted(element);
                }
            };
            PertDiagram.prototype.onElementDoubleClick = function (element) {
                if (this.onelementdoubleclick != null) {
                    this.onelementdoubleclick(element);
                }
            };
            PertDiagram.prototype.onGroupExpand = function (group) {
                if (this.ongroupexpand != null) {
                    this.ongroupexpand(group);
                }
            };
            PertDiagram.prototype.onScrollChanged = function (scroll) {
                if (this.onscrollchanged != null) {
                    this.onscrollchanged(scroll);
                }
            };
            PertDiagram.prototype.onSelectionChanged = function (selectedElements) {
                if (this._tool == 5 /* Move */) {
                    var focused = null;
                    if (selectedElements.length == 1 && selectedElements[0] instanceof controls.PertConnector) {
                        focused = selectedElements[0];
                    }
                    for (var i = 0; i < this._elements.length; i++) {
                        if (this._elements.item(i) instanceof controls.PertConnector) {
                            this._elements.item(i).anchors = focused == this._elements.item(i);
                        }
                    }
                }
                if (this.onselectionchanged != null) {
                    this.onselectionchanged(selectedElements);
                }
            };
            PertDiagram.prototype.onToolChanged = function (newTool) {
                if (this.ontoolchanged != null) {
                    this.ontoolchanged(newTool);
                }
            };
            PertDiagram.prototype.onZoomChanged = function (newZoom) {
                if (this.onzoomchanged != null) {
                    this.onzoomchanged(newZoom);
                }
            };
            // #endregion
            // #region Canvas events
            PertDiagram.prototype.addEventListeners = function () {
                this.onDoubleClick = this.onDoubleClick.bind(this);
                this.onKeyDown = this.onKeyDown.bind(this);
                this.onKeyUp = this.onKeyUp.bind(this);
                this.onMouseDown = this.onMouseDown.bind(this);
                this.onMouseMove = this.onMouseMove.bind(this);
                this.onMouseOut = this.onMouseOut.bind(this);
                this.onMouseOver = this.onMouseOver.bind(this);
                this.onMouseUp = this.onMouseUp.bind(this);
                this.onMouseWheel = this.onMouseWheel.bind(this);
                this.onWindowResize = this.onWindowResize.bind(this);
                this.canvas.addEventListener("dblclick ", this.onDoubleClick);
                this.canvas.addEventListener("keydown", this.onKeyDown);
                this.canvas.addEventListener("keyup", this.onKeyUp);
                this.canvas.addEventListener("mousedown", this.onMouseDown);
                this.canvas.addEventListener("mousemove", this.onMouseMove);
                this.canvas.addEventListener("mouseout", this.onMouseOut);
                this.canvas.addEventListener("mouseover", this.onMouseOver);
                this.canvas.addEventListener("mouseup", this.onMouseUp);
                this.canvas.addEventListener("mousewheel", this.onMouseWheel);
                this.canvas.addEventListener("DOMMouseScroll", this.onMouseWheel);
                window.addEventListener("resize", this.onWindowResize);
            };
            PertDiagram.prototype.removeEvemtListeners = function () {
                this.canvas.removeEventListener("dblclick ", this.onDoubleClick);
                this.canvas.removeEventListener("keydown", this.onKeyDown);
                this.canvas.removeEventListener("keyup", this.onKeyUp);
                this.canvas.removeEventListener("mousedown", this.onMouseDown);
                this.canvas.removeEventListener("mousemove", this.onMouseMove);
                this.canvas.removeEventListener("mouseout", this.onMouseOut);
                this.canvas.removeEventListener("mouseover", this.onMouseOver);
                this.canvas.removeEventListener("mouseup", this.onMouseUp);
                this.canvas.removeEventListener("mousewheel", this.onMouseWheel);
                this.canvas.removeEventListener("DOMMouseScroll", this.onMouseWheel);
                window.removeEventListener("resize", this.onWindowResize);
            };
            PertDiagram.prototype.onDoubleClick = function (ev) {
                if (this._cursor != null && this._cursor.element != null) {
                    this.onElementDoubleClick(this._cursor.element);
                }
            };
            PertDiagram.prototype.onKeyDown = function (ev) {
                if (ev.keyCode == 49) {
                    this.tool = 6 /* Select */;
                }
                if (ev.keyCode == 50) {
                    this.tool = 5 /* Move */;
                }
                if (ev.keyCode == 51) {
                    this.tool = 0 /* CreateDependency */;
                }
                if (ev.keyCode == 52) {
                    this.tool = 1 /* CreateGroup */;
                }
                if (ev.keyCode == 53) {
                    this.tool = 2 /* CreateMilestone */;
                }
                if (ev.keyCode == 54) {
                    this.tool = 3 /* CreateWait */;
                }
                if (ev.keyCode == 55) {
                    this.tool = 4 /* CreateWork */;
                }
                this.refresh();
            };
            PertDiagram.prototype.onKeyUp = function (ev) {
                if (ev.keyCode == 46) {
                    if (this._selectedElements.length > 0) {
                        var canDelete = this.onElementDeleting(this._selectedElements);
                        if (canDelete) {
                            this.beginUpdate();
                            var deletedElements = this._selectedElements.slice(0);
                            for (var i = 0; i < deletedElements.length; i++) {
                                this.deleteElement(deletedElements[i]);
                            }
                            this.endUpdate();
                            this.onElementDeleted(deletedElements);
                        }
                    }
                }
            };
            PertDiagram.prototype.onMouseDown = function (ev) {
                var cursor = this.getCursorPosition(ev);
                if (this._cursor == null) {
                    this._cursor = cursor;
                }
                if (ev.button == 0 && this._lmb == null) {
                    this._lmb = this.getCursorPosition(ev);
                }
                if (ev.button == 2 && this._rmb == null) {
                    this._rmb = this.getCursorPosition(ev);
                }
                // clear selection;
                if (this._lmb != null && this._lmb.element == null) {
                    this.selectedElements = [];
                }
                // select element;
                if (this._lmb != null && this._lmb.element != null) {
                    if (this._tool == 5 /* Move */ || this._tool == 6 /* Select */) {
                        if (this._lmb.element.selected == false) {
                            this.selectedElements = [this._lmb.element];
                        }
                    }
                }
                // new connector;
                if (this._tool == 0 /* CreateDependency */ || this._tool == 1 /* CreateGroup */ || this._tool == 3 /* CreateWait */ || this._tool == 4 /* CreateWork */) {
                    var connector = this._new;
                    var node = null;
                    if (cursor.element instanceof controls.PertNode && cursor.anchor == "NODE") {
                        var attach = this.onElementConnecting(this._new, this._lmb == null ? "START" : "END", cursor.element);
                        if (attach) {
                            cursor.element.hovered = cursor.anchor;
                            node = cursor.element;
                        }
                    }
                    connector.startNode = node;
                    connector.startPoint = [cursor.translatedX, cursor.translatedY];
                }
                this.refresh();
                return false;
            };
            PertDiagram.prototype.onMouseMove = function (ev) {
                var cursor = this.getCursorPosition(ev);
                if (this._cursor == null) {
                    this._cursor = cursor;
                }
                if (this._cursor.element != null && this._cursor.element != cursor.element) {
                    this._cursor.element.hovered = null;
                }
                var deltaX = Math.floor((cursor.x - this._cursor.x) / this._zoom);
                var deltaY = Math.floor((cursor.y - this._cursor.y) / this._zoom);
                // group expand;
                if (cursor.element instanceof controls.PertGroup && cursor.anchor == "TEXT") {
                    this.onGroupExpand(cursor.element);
                }
                // scroll;
                if ((this._tool == 6 /* Select */ && this._lmb != null) || (this._rmb != null)) {
                    this._scroll[0] += deltaX;
                    this._scroll[1] += deltaY;
                }
                // selecting;
                if (this._tool == 5 /* Move */ && this._lmb != null && this._lmb.element == null) {
                    var selectionRect = controls.Geometry.getRectangleFromPoints([this._lmb.translatedX, this._lmb.translatedY], [this._cursor.translatedX, this._cursor.translatedY]);
                    for (var i = 0; i < this._elements.length; i++) {
                        if (controls.Geometry.rectangleIntersectsRectangle(selectionRect, this._elements.item(i).bounds)) {
                            this._elements.item(i).selected = this._elements.item(i).testPath(selectionRect);
                        }
                        else {
                            this._elements.item(i).selected = false;
                        }
                    }
                }
                // dragging;
                if (this._tool == 5 /* Move */ && this._lmb != null && this._lmb.element != null) {
                    this.beginUpdate();
                    if (this._selectedElements.length == 1 && this._selectedElements[0] instanceof controls.PertConnector) {
                        var connector = this._selectedElements[0];
                        if (this._lmb.anchor == "START") {
                            connector.startPoint = [cursor.translatedX, cursor.translatedY];
                            if (cursor.element != null && cursor.element instanceof controls.PertNode) {
                                connector.startNode = cursor.element;
                            }
                            else {
                                connector.startNode = null;
                            }
                        }
                        else {
                            if (this._lmb.anchor == "END") {
                                connector.endPoint = [cursor.translatedX, cursor.translatedY];
                                if (cursor.element != null && cursor.element instanceof controls.PertNode) {
                                    connector.endNode = cursor.element;
                                }
                                else {
                                    connector.endNode = null;
                                }
                            }
                        }
                    }
                    else {
                        var offsetX = this._lmb.translatedX % this._gridSize;
                        var offsetY = this._lmb.translatedY % this._gridSize;
                        var deltaGridX = cursor.gridX - this._cursor.gridX;
                        var deltaGridY = cursor.gridY - this._cursor.gridY;
                        for (var i = 0; i < this._selectedElements.length; i++) {
                            if (this._selectedElements[i] instanceof controls.PertNode) {
                                var node = this._selectedElements[i];
                                node.location = [node.location[0] + deltaGridX, node.location[1] + deltaGridY];
                            }
                        }
                    }
                    this.endUpdate();
                }
                // new connector;
                if (this._tool == 0 /* CreateDependency */ || this._tool == 1 /* CreateGroup */ || this._tool == 3 /* CreateWait */ || this._tool == 4 /* CreateWork */) {
                    var connector = this._new;
                    var node = null;
                    if (cursor.element instanceof controls.PertNode && cursor.anchor == "NODE") {
                        var attach = this.onElementConnecting(this._new, this._lmb == null ? "START" : "END", cursor.element);
                        if (attach) {
                            cursor.element.hovered = cursor.anchor;
                            node = cursor.element;
                        }
                    }
                    connector.endNode = node;
                    connector.endPoint = [cursor.translatedX, cursor.translatedY];
                    if (this._lmb == null) {
                        connector.startNode = node;
                        connector.startPoint = [cursor.translatedX, cursor.translatedY];
                    }
                    else {
                    }
                }
                // new node;
                if (this._tool == 2 /* CreateMilestone */) {
                    var node = this._new;
                    node.location = [cursor.gridX, cursor.gridY];
                }
                // cursor;
                this._cursor = cursor;
                if (this._tool == 5 /* Move */ && (this._cursor.anchor == "NODE" || this._cursor.anchor == "START" || this._cursor.anchor == "END")) {
                    this._canvas.style.cursor = "move";
                }
                else {
                    if (this._cursor.element != null && this._cursor.element instanceof controls.PertGroup && this._cursor.anchor == "TEXT") {
                        this._canvas.style.cursor = "pointer";
                    }
                    else {
                        this._canvas.style.cursor = "default";
                    }
                }
                this.refresh();
            };
            PertDiagram.prototype.onMouseOut = function (ev) {
                this._cursor = null;
                this._lmb = null;
                this._rmb = null;
            };
            PertDiagram.prototype.onMouseOver = function (ev) {
                this.resetTool();
            };
            PertDiagram.prototype.onMouseUp = function (ev) {
                if (ev.button == 0 && this._lmb != null) {
                    if (this._lmb == null) {
                        return;
                    }
                    this._lmb = null;
                }
                if (ev.button == 2 && this._rmb != null) {
                    if (this._rmb == null) {
                        return;
                    }
                    this._rmb = null;
                }
                var createElement = false;
                // create connector;
                if (this._tool == 0 /* CreateDependency */ || this._tool == 1 /* CreateGroup */ || this._tool == 3 /* CreateWait */ || this._tool == 4 /* CreateWork */) {
                    createElement = true;
                }
                // create node;
                if (this._tool == 2 /* CreateMilestone */ && this._cursor.element == null) {
                    createElement = true;
                }
                if (createElement) {
                    createElement = this.onElementCreating(this._new);
                    if (createElement) {
                        var newElement = this._new;
                        newElement.creating = false;
                        this._elements.add(newElement);
                        this.onElementCreated(newElement);
                    }
                }
                this.resetTool();
                this.refresh();
            };
            PertDiagram.prototype.onMouseWheel = function (ev) {
                var zoomIn = Math.max(-1, Math.min(1, (ev.wheelDelta || -ev.detail))) > 0;
                var zoom = (this.zoom * 100 + (zoomIn ? 10 : -10)) / 100;
                if (zoom < 0.3) {
                    zoom = 0.3;
                }
                if (zoom > 1) {
                    zoom = 1;
                }
                var cursor = this.getCursorPosition(ev);
                var scrollX = Math.floor(cursor.x / zoom + this.scroll[0] - cursor.x / this.zoom);
                var scrollY = Math.floor(cursor.y / zoom + this.scroll[1] - cursor.y / this.zoom);
                if (this.zoom != zoom) {
                    this.scroll = [scrollX, scrollY];
                    this.zoom = zoom;
                    this.refresh();
                }
                return false;
            };
            PertDiagram.prototype.onWindowResize = function (ev) {
                this.updateCanvasSize();
                this.setImageSmoothing(this._zoom != 1);
                this.refresh();
            };
            // #endregion
            // #region Drawing 
            PertDiagram.prototype.setImageSmoothing = function (imageSmoothingEnabled) {
                this._context.msImageSmoothingEnabled = imageSmoothingEnabled;
                this._context.mozImageSmoothingEnabled = imageSmoothingEnabled;
                this._context.webkitImageSmoothingEnabled = imageSmoothingEnabled;
            };
            PertDiagram.prototype.refresh = function () {
                if (this._updatesDisabled == 0) {
                    this.draw();
                }
            };
            PertDiagram.prototype.draw = function (clientRect) {
                this._context.save();
                this.updateCanvasSize();
                this.setImageSmoothing(this._zoom != 1);
                if (clientRect == null) {
                    clientRect = this.getClientRect();
                }
                // transformin matrix;
                this._context.translate(0.5, 0.5);
                if (this._zoom != 1) {
                    this._context.scale(this._zoom, this._zoom);
                }
                if (this._scroll[0] != 0 || this._scroll[1] != 0) {
                    this._context.translate(this._scroll[0], this._scroll[1]);
                }
                // clearing;
                this._context.clearRect(clientRect[0], clientRect[1], clientRect[2], clientRect[3]);
                // draw grid;
                if (this.zoom > 0.5) {
                    this.drawGrid(this._context, clientRect);
                }
                // draw outlines;
                this.drawOutlines(this._context, this._selectedElements);
                for (var i = 0; i < this._elements.length; i++) {
                    if (this._elements.item(i).selected == false) {
                        this._elements.item(i).draw(this._context);
                    }
                }
                for (var i = 0; i < this._elements.length; i++) {
                    if (this._elements.item(i).selected) {
                        this._elements.item(i).draw(this._context);
                    }
                }
                if (this._tool == 0 /* CreateDependency */ || this._tool == 1 /* CreateGroup */ || this._tool == 3 /* CreateWait */ || this._tool == 4 /* CreateWork */) {
                    this._new.draw(this._context);
                }
                if (this._tool == 2 /* CreateMilestone */ && this._cursor != null) {
                    this._new.draw(this._context);
                }
                // draw element bounds;
                //   for (var i = 0; i < this._elements.length; i++) {
                //         this.drawElementBounds(this._context, this._elements.item(i));
                //   }
                // draw new elements;
                // draw selection;
                if (this._tool == 5 /* Move */ && this._lmb != null && this._lmb.element == null) {
                    this.drawSelection(this._context, [this._lmb.translatedX, this._lmb.translatedY], [this._cursor.translatedX, this._cursor.translatedY]);
                }
                // resetting transformations;
                this._context.restore();
                // draw debug data;
                //this.drawDebugData(this._context);
            };
            PertDiagram.prototype.drawGrid = function (ctx, clientRect) {
                ctx.beginPath();
                var x = Math.floor(clientRect[0] / this._gridSize) * this._gridSize;
                var y = Math.floor(clientRect[1] / this._gridSize) * this._gridSize;
                while (x < clientRect[0] + clientRect[2]) {
                    ctx.moveTo(x, clientRect[1]);
                    ctx.lineTo(x, clientRect[1] + clientRect[3]);
                    x += this._gridSize;
                }
                while (y < clientRect[1] + clientRect[3]) {
                    ctx.moveTo(clientRect[0], y);
                    ctx.lineTo(clientRect[0] + clientRect[2], y);
                    y += this._gridSize;
                }
                ctx.lineWidth = 1;
                ctx.strokeStyle = this._gridColor;
                ctx.stroke();
            };
            PertDiagram.prototype.drawOutlines = function (ctx, elements) {
                for (var i = 0; i < elements.length; i++) {
                    elements[i].drawOutline(ctx);
                }
            };
            PertDiagram.prototype.drawElements = function (ctx, elements) {
                for (var i = 0; i < elements.length; i++) {
                    elements[i].draw(ctx);
                }
            };
            PertDiagram.prototype.drawElementBounds = function (ctx, element) {
                this.drawRectangle(ctx, element.bounds);
            };
            PertDiagram.prototype.drawSelection = function (ctx, startPoint, endPoint) {
                ctx.beginPath();
                ctx.moveTo(startPoint[0], startPoint[1]);
                ctx.lineTo(endPoint[0], startPoint[1]);
                ctx.lineTo(endPoint[0], endPoint[1]);
                ctx.lineTo(startPoint[0], endPoint[1]);
                ctx.lineTo(startPoint[0], startPoint[1]);
                ctx.closePath();
                ctx.fillStyle = "rgba(255, 197, 38, 0.2)";
                ctx.fill();
                ctx.lineWidth = 2;
                ctx.strokeStyle = "rgb(255, 197, 38)";
                ctx.stroke();
            };
            PertDiagram.prototype.drawDebugData = function (ctx) {
                ctx.beginPath();
                ctx.moveTo(16, 16);
                ctx.lineTo(256, 16);
                ctx.lineTo(256, 164);
                ctx.lineTo(16, 164);
                ctx.lineTo(16, 16);
                ctx.fillStyle = "rgba(128, 128, 128, 0.1)";
                ctx.fill();
                ctx.font = "10px Consolas";
                ctx.fillStyle = "#000";
                ctx.fillText("CURSOR: " + this.cursorPositionToString(this._cursor), 32, 32);
                ctx.fillText("LMB: " + this.cursorPositionToString(this._lmb), 32, 48);
                ctx.fillText("RMB: " + this.cursorPositionToString(this._rmb), 32, 64);
                ctx.fillText("SCROLL: " + this.scroll[0] + ";" + this.scroll[1], 32, 80);
                ctx.fillText("ZOOM: " + this.zoom.toString(), 32, 96);
                ctx.fillText("TOOL: " + PertTool[this._tool], 32, 112);
            };
            PertDiagram.prototype.drawPolygon = function (ctx, polygon) {
                ctx.beginPath();
                ctx.moveTo(polygon[0][0], polygon[0][1]);
                for (var i = 0; i < polygon.length; i++) {
                    ctx.lineTo(polygon[i][0], polygon[i][1]);
                }
                ctx.lineTo(polygon[0][0], polygon[0][1]);
                ctx.strokeStyle = "#ddd";
                ctx.stroke();
            };
            PertDiagram.prototype.drawRectangle = function (ctx, rect) {
                ctx.beginPath();
                ctx.moveTo(rect[0], rect[1]);
                ctx.lineTo(rect[0] + rect[2], rect[1]);
                ctx.lineTo(rect[0] + rect[2], rect[1] + rect[3]);
                ctx.lineTo(rect[0], rect[1] + rect[3]);
                ctx.lineTo(rect[0], rect[1]);
                ctx.strokeStyle = "#ddd";
                ctx.stroke();
            };
            PertDiagram.prototype.getClientRect = function () {
                var clientRect = [0, 0, this.canvas.width, this.canvas.height];
                if (this.zoom != 1) {
                    clientRect[2] = clientRect[2] / this.zoom;
                    clientRect[3] = clientRect[3] / this.zoom;
                }
                clientRect[0] -= this.scroll[0];
                clientRect[1] -= this.scroll[1];
                return clientRect;
            };
            // #endregion
            // #region Element collection
            PertDiagram.prototype.elementAdded = function (element) {
                if (element instanceof controls.PertNode) {
                    var node = element;
                    node.location = [Math.round(node.location[0] / this._gridSize) * this._gridSize, Math.round(node.location[1] / this._gridSize) * this._gridSize];
                }
                if (element.selected) {
                    this._selectedElements.push(element);
                    this.onSelectionChanged(this._selectedElements);
                }
            };
            PertDiagram.prototype.elementPropertyChanged = function (element, propertyName) {
                if (propertyName == "selected") {
                    if (element.selected) {
                        this._selectedElements.push(element);
                    }
                    else {
                        this._selectedElements.splice(this._selectedElements.indexOf(element), 1);
                    }
                    this.onSelectionChanged(this._selectedElements);
                }
                this.onElementPropertyChanged(element, propertyName);
            };
            PertDiagram.prototype.elementRemoved = function (element) {
                if (element.selected) {
                    this._selectedElements.splice(this._selectedElements.indexOf(element), 1);
                    this.onSelectionChanged(this._selectedElements);
                }
            };
            PertDiagram.prototype.redrawElement = function (element) {
                var bounds = element.bounds;
                var canvasBounds = element["$canvasBounds"];
                if (canvasBounds != null) {
                    bounds = controls.Geometry.unionRectangle(bounds, canvasBounds);
                }
                this.draw(element.bounds);
                element["$canvasBounds"] = element.bounds;
            };
            PertDiagram.prototype.resetTool = function () {
                this._new = null;
                switch (this._tool) {
                    case 0 /* CreateDependency */:
                        this._new = new controls.PertDependency();
                        break;
                    case 1 /* CreateGroup */:
                        this._new = new controls.PertGroup();
                        break;
                    case 2 /* CreateMilestone */:
                        this._new = new controls.PertMilestone();
                        if (this._cursor != null) {
                            this._new.location = [Math.round(this._cursor.translatedX / this._gridSize) * this._gridSize, Math.round(this._cursor.translatedY / this._gridSize) * this._gridSize];
                        }
                        break;
                    case 3 /* CreateWait */:
                        this._new = new controls.PertWait();
                        break;
                    case 4 /* CreateWork */:
                        this._new = new controls.PertWork();
                        break;
                    default:
                        break;
                }
                if (this._new != null) {
                    this._new.creating = true;
                }
                return null;
            };
            // #endregion
            PertDiagram.prototype.deleteElement = function (element) {
                if (element instanceof controls.PertNode) {
                    for (var i = 0; i < this._elements.length; i++) {
                        if (this._elements.item(i) instanceof controls.PertConnector) {
                            var connector = this._elements.item(i);
                            if (connector.startNode == element) {
                                connector.startNode = null;
                            }
                            if (connector.endNode == element) {
                                connector.endNode = null;
                            }
                        }
                    }
                }
                this._elements.remove(element);
            };
            PertDiagram.prototype.beginUpdate = function () {
                this._updatesDisabled++;
            };
            PertDiagram.prototype.endUpdate = function () {
                this._updatesDisabled--;
                if (this._updatesDisabled == 0) {
                    this.refresh();
                }
            };
            PertDiagram.prototype.updateCanvasSize = function () {
                this.canvas.height = this.canvas.offsetHeight;
                this.canvas.width = this.canvas.offsetWidth;
            };
            PertDiagram.prototype.getCursorPosition = function (ev) {
                var totalOffsetX = 0;
                var totalOffsetY = 0;
                var currentElement = this.canvas;
                do {
                    totalOffsetX += currentElement.offsetLeft - currentElement.scrollLeft;
                    totalOffsetY += currentElement.offsetTop - currentElement.scrollTop;
                } while (currentElement = currentElement.offsetParent);
                var result = {
                    x: ev.pageX - totalOffsetX,
                    y: ev.pageY - totalOffsetY
                };
                result.translatedX = result.x;
                result.translatedY = result.y;
                if (this.zoom != null) {
                    result.translatedX = Math.floor(result.translatedX / this.zoom);
                    result.translatedY = Math.floor(result.translatedY / this.zoom);
                }
                if (this.scroll != null) {
                    result.translatedX -= this.scroll[0];
                    result.translatedY -= this.scroll[1];
                }
                result.gridX = Math.round(result.translatedX / this._gridSize) * this._gridSize;
                result.gridY = Math.round(result.translatedY / this._gridSize) * this._gridSize;
                var dragElement = null;
                if (this._tool == 5 /* Move */ && this._lmb != null && this._lmb.element != null && (this._lmb.anchor == "NODE" || this._lmb.anchor == "START" || this._lmb.anchor == "END")) {
                    dragElement = this._lmb.element;
                }
                for (var i = 0; i < this._elements.length; i++) {
                    if (this._elements.item(i) != dragElement) {
                        if (controls.Geometry.rectangleContainsPoint(this._elements.item(i).bounds, [result.translatedX, result.translatedY])) {
                            var anchor = this._elements.item(i).testPoint([result.translatedX, result.translatedY]);
                            if (anchor != null) {
                                result.anchor = anchor;
                                result.element = this._elements.item(i);
                            }
                        }
                    }
                }
                return result;
            };
            PertDiagram.prototype.cursorPositionToString = function (state) {
                if (state == null) {
                    return "null";
                }
                var text = state.x + ";" + state.y + ", " + state.translatedX + ";" + state.translatedY;
                if (state.element != null) {
                    text += " (" + state.element.toString();
                    if (state.anchor != null) {
                        text += ", " + state.anchor;
                    }
                    text += ")";
                }
                return text;
            };
            return PertDiagram;
        })();
        controls.PertDiagram = PertDiagram;
        (function (PertTool) {
            PertTool[PertTool["CreateDependency"] = 0] = "CreateDependency";
            PertTool[PertTool["CreateGroup"] = 1] = "CreateGroup";
            PertTool[PertTool["CreateMilestone"] = 2] = "CreateMilestone";
            PertTool[PertTool["CreateWait"] = 3] = "CreateWait";
            PertTool[PertTool["CreateWork"] = 4] = "CreateWork";
            PertTool[PertTool["Move"] = 5] = "Move";
            PertTool[PertTool["Select"] = 6] = "Select";
        })(controls.PertTool || (controls.PertTool = {}));
        var PertTool = controls.PertTool;
    })(controls = spa.controls || (spa.controls = {}));
})(spa || (spa = {}));
/// <reference path="element.ts" />
var spa;
(function (spa) {
    var controls;
    (function (controls) {
        var PertElementCollection = (function () {
            function PertElementCollection() {
                this._elements = [];
                this.onElementPropertyChanged = this.onElementPropertyChanged.bind(this);
            }
            Object.defineProperty(PertElementCollection.prototype, "length", {
                get: function () {
                    return this._elements.length;
                },
                enumerable: true,
                configurable: true
            });
            PertElementCollection.prototype.add = function (element) {
                this._elements.push(element);
                element.subscribe(this.onElementPropertyChanged);
                if (this.onelementadded != null) {
                    this.onelementadded(element);
                }
            };
            PertElementCollection.prototype.clear = function () {
                var removedElements = this._elements.slice();
                this._elements.length = 0;
                for (var i = 0; i < removedElements.length; i++) {
                    removedElements[i].unsubscribe(this.onElementPropertyChanged);
                    if (this.onelementremoved != null) {
                        this.onelementremoved(removedElements[i]);
                    }
                }
            };
            PertElementCollection.prototype.filter = function (callbackfn) {
                return this._elements.filter(callbackfn);
            };
            PertElementCollection.prototype.indexOf = function (element) {
                return this._elements.indexOf(element);
            };
            PertElementCollection.prototype.item = function (index) {
                return this._elements[index];
            };
            PertElementCollection.prototype.map = function (callbackfn) {
                return this._elements.map(callbackfn);
            };
            PertElementCollection.prototype.remove = function (element) {
                this._elements.splice(this.indexOf(element), 1);
                if (this.onelementremoved != null) {
                    this.onelementremoved(element);
                }
            };
            PertElementCollection.prototype.dispose = function () {
                this._elements.length = 0;
                this.onelementadded = null;
                this.onelementpropertychanged = null;
                this.onelementremoved = null;
            };
            PertElementCollection.prototype.onElementPropertyChanged = function (element, propertyName) {
                if (this.onelementpropertychanged != null) {
                    this.onelementpropertychanged(element, propertyName);
                }
            };
            return PertElementCollection;
        })();
        controls.PertElementCollection = PertElementCollection;
    })(controls = spa.controls || (spa.controls = {}));
})(spa || (spa = {}));
var spa;
(function (spa) {
    var controls;
    (function (controls) {
        var Geometry = (function () {
            function Geometry() {
            }
            // #region Point test
            Geometry.circleContainsPoint = function (circle, point) {
                return Geometry.lineLength([circle[0], circle[1], point[0], point[1]]) <= circle[2];
            };
            Geometry.polygonContainsPoint = function (polygon, point) {
                var rect = Geometry.polygonBoundingRectangle(polygon);
                if (Geometry.rectangleContainsPoint(rect, point) == false) {
                    return false;
                }
                for (var c = false, i = -1, l = polygon.length, j = l - 1; ++i < l; j = i) {
                    ((polygon[i][1] <= point[1] && point[1] < polygon[j][1]) || (polygon[j][1] <= point[1] && point[1] < polygon[i][1])) && (point[0] < (polygon[j][0] - polygon[i][0]) * (point[1] - polygon[i][1]) / (polygon[j][1] - polygon[i][1]) + polygon[i][0]) && (c = !c);
                }
                return c;
            };
            Geometry.rectangleContainsPoint = function (rectangle, point) {
                return (point[0] >= rectangle[0]) && (point[0] <= rectangle[0] + rectangle[2]) && (point[1] >= rectangle[1]) && (point[1] <= rectangle[1] + rectangle[3]);
            };
            // #endregion
            // #region Intersection test
            Geometry.circleIntersectsLine = function (circle, line) {
                // compute the euclidean distance between A and B
                var lab = Geometry.lineLength(line);
                // compute the direction vector D from A to B
                var dx = (line[2] - line[0]) / lab;
                var dy = (line[3] - line[1]) / lab;
                // compute the value t of the closest point to the circle center (Cx, Cy)
                var t = dx * (circle[0] - line[0]) + dy * (circle[1] - line[1]);
                // compute the coordinates of the point E on line and closest to C
                var ex = t * dx + line[0];
                var ey = t * dy + line[1];
                // compute the euclidean distance from E to C
                var lec = Math.sqrt(Math.pow(ex - circle[0], 2) + Math.pow(ey - circle[1], 2));
                // test if the line intersects the circle
                return lec < circle[2];
            };
            Geometry.circleIntersectsRectangle = function (circle, rect) {
                var rectX = rect[0] + rect[2] / 2;
                var rectY = rect[1] + rect[3] / 2;
                var circleDistanceX = Math.abs(circle[0] - rectX);
                var circleDistanceY = Math.abs(circle[1] - rectY);
                if (circleDistanceX > (rect[2] / 2 + circle[2])) {
                    return false;
                }
                if (circleDistanceY > (rect[3] / 2 + circle[2])) {
                    return false;
                }
                if (circleDistanceX <= (rect[2] / 2)) {
                    return true;
                }
                if (circleDistanceY <= (rect[3] / 2)) {
                    return true;
                }
                var cornerDistance_sq = Math.pow((circleDistanceX - rect[2] / 2), 2) + Math.pow((circleDistanceY - rect[3] / 2), 2);
                return (cornerDistance_sq <= (Math.pow(circle[2], 2)));
                //return cornerDistance_sq <= Math.pow(circle[2], 2);
            };
            Geometry.lineIntersectsLine = function (line1, line2) {
                var denominator = ((line2[3] - line2[1]) * (line1[2] - line1[0])) - ((line2[2] - line2[0]) * (line1[3] - line1[1]));
                if (denominator == 0) {
                    return false;
                }
                var ua = (line2[2] - line2[0]) * (line1[1] - line2[1]) - (line2[3] - line2[1]) * (line1[0] - line2[0]);
                var ub = (line1[2] - line1[0]) * (line1[1] - line2[1]) - (line1[3] - line1[1]) * (line1[0] - line2[0]);
                if (denominator != 0) {
                    ua = ua / denominator;
                    ub = ub / denominator;
                }
                return (ua > 0 && ua < 1) && (ub > 0 && ub < 1);
            };
            Geometry.polygonIntersectsRectangle = function (polygon, rect) {
                var polygonBounds = this.polygonBoundingRectangle(polygon);
                if (Geometry.rectangleIntersectsRectangle(polygonBounds, rect)) {
                    return Geometry.polygonIntersectsPolygon(polygon, [
                        [rect[0], rect[1]],
                        [rect[0] + rect[2], rect[1]],
                        [rect[0] + rect[2], rect[1] + rect[3]],
                        [rect[0], rect[1] + rect[3]]
                    ]);
                }
                return false;
            };
            Geometry.polygonIntersectsPolygon = function (polygon1, polygon2) {
                var lines1 = Geometry.getPolygonLines(polygon1);
                var lines2 = Geometry.getPolygonLines(polygon2);
                for (var i = 0; i < lines1.length; i++) {
                    for (var j = 0; j < lines2.length; j++) {
                        if (Geometry.lineIntersectsLine(lines1[i], lines2[j])) {
                            return true;
                        }
                    }
                }
                return Geometry.polygonContainsPoint(polygon1, polygon2[0]) || Geometry.polygonContainsPoint(polygon2, polygon1[1]);
            };
            Geometry.rectangleIntersectsRectangle = function (rect1, rect2) {
                return !((rect1[1] + rect1[3] < rect2[1]) || (rect1[1] > rect2[1] + rect2[3]) || (rect1[0] > rect2[0] + rect2[2]) || (rect1[0] + rect1[2] < rect2[0]));
            };
            // #endregion
            // #region Transformation
            Geometry.inflateRectangle = function (rect, width, height) {
                return [rect[0] - width, rect[1] - height, rect[2] + width * 2, rect[3] + height * 2];
            };
            Geometry.movePoint = function (point, targetPoint, distance) {
                var length = Geometry.lineLength([point[0], point[1], targetPoint[0], targetPoint[1]]);
                if (distance > length) {
                    return point;
                }
                if (point[0] == targetPoint[0]) {
                    return point[1] > targetPoint[1] ? [point[0], point[1] - distance] : [point[0], point[1] + distance];
                }
                else {
                    if (point[1] == targetPoint[1]) {
                        return point[0] > targetPoint[0] ? [point[0] - distance, point[1]] : [point[0] + distance, point[1]];
                    }
                    else {
                        return [point[0] + (targetPoint[0] - point[0]) * distance / length, point[1] + (targetPoint[1] - point[1]) * distance / length];
                    }
                }
            };
            Geometry.rotatePoint = function (point, origin, angle) {
                if (angle == 0) {
                    return point;
                }
                var radAngle = angle * (Math.PI / 180.0);
                var cos = Math.cos(radAngle);
                var sin = Math.sin(radAngle);
                var x = cos * (point[0] - origin[0]) - sin * (point[1] - origin[1]) + origin[0];
                var y = sin * (point[0] - origin[0]) + cos * (point[1] - origin[1]) + origin[1];
                return [x, y];
            };
            Geometry.rotatePolygon = function (polygon, origin, angle) {
                var radAngle = angle * (Math.PI / 180.0);
                var cos = Math.cos(radAngle);
                var sin = Math.sin(radAngle);
                var points = [];
                for (var i = 0; i < polygon.length; i++) {
                    var x = cos * (polygon[i][0] - origin[0]) - sin * (polygon[i][1] - origin[1]) + origin[0];
                    var y = sin * (polygon[i][0] - origin[0]) + cos * (polygon[i][1] - origin[1]) + origin[1];
                    points.push([x, y]);
                }
                return points;
            };
            Geometry.rotateRectangle = function (rectangle, origin, angle) {
                var polygon = [
                    [rectangle[0], rectangle[1]],
                    [rectangle[0] + rectangle[2], rectangle[1]],
                    [rectangle[0] + rectangle[2], rectangle[1] + rectangle[3]],
                    [rectangle[0], rectangle[1] + rectangle[3]]
                ];
                if (angle != 0) {
                    return Geometry.rotatePolygon(polygon, origin, angle);
                }
                else {
                    return polygon;
                }
            };
            Geometry.translatePolygon = function (polygon, x, y) {
                var points = [];
                for (var i = 0; i < polygon.length; i++) {
                    points.push([polygon[i][0] + x, polygon[i][1] + y]);
                }
                return points;
            };
            Geometry.translateRectangle = function (rect, x, y) {
                return [
                    rect[0] + x,
                    rect[1] + y,
                    rect[2],
                    rect[3]
                ];
            };
            Geometry.unionRectangle = function (rect1, rect2) {
                var left = Math.min(rect1[0], rect2[0]);
                var top = Math.min(rect1[1], rect2[1]);
                var right = Math.max(rect1[0] + rect1[2], rect2[0] + rect2[2]);
                var bottom = Math.max(rect1[1] + rect1[3], rect2[1] + rect2[3]);
                return [left, top, right - left, bottom - top];
            };
            // #endregion
            // #region Helpers
            Geometry.getPolygonLines = function (polygon) {
                var lines = [];
                for (var i = 0; i < polygon.length; i++) {
                    if (i == polygon.length - 1) {
                        lines.push([polygon[i][0], polygon[i][1], polygon[0][0], polygon[0][1]]);
                    }
                    else {
                        lines.push([polygon[i][0], polygon[i][1], polygon[i + 1][0], polygon[i + 1][1]]);
                    }
                }
                return lines;
            };
            Geometry.getRectangleFromPoints = function (point1, point2) {
                var left = Math.min(point1[0], point2[0]);
                var top = Math.min(point1[1], point2[1]);
                var right = Math.max(point1[0], point2[0]);
                var bottom = Math.max(point1[1], point2[1]);
                return [left, top, right - left, bottom - top];
            };
            Geometry.lineAngle = function (line) {
                if (line[1] == line[3]) {
                    if (line[0] > line[2]) {
                        return 180;
                    }
                    else {
                        return 0;
                    }
                }
                else {
                    return Math.atan2(line[3] - line[1], line[2] - line[0]) * 180 / Math.PI;
                }
            };
            Geometry.lineLength = function (line) {
                if (line[0] == line[2]) {
                    return Math.abs(line[3] - line[1]);
                }
                else {
                    if (line[1] == line[3]) {
                        return Math.abs(line[2] - line[0]);
                    }
                    else {
                        return Math.ceil(Math.sqrt(Math.pow(line[2] - line[0], 2) + Math.pow(line[3] - line[1], 2)));
                    }
                }
            };
            Geometry.polygonBoundingRectangle = function (polygon) {
                var left = polygon[0][0];
                var top = polygon[0][1];
                var right = left;
                var bottom = top;
                for (var i = 0; i < polygon.length; i++) {
                    left = Math.min(left, polygon[i][0]);
                    top = Math.min(top, polygon[i][1]);
                    right = Math.max(right, polygon[i][0]);
                    bottom = Math.max(bottom, polygon[i][1]);
                }
                return [left, top, right - left, bottom - top];
            };
            return Geometry;
        })();
        controls.Geometry = Geometry;
    })(controls = spa.controls || (spa.controls = {}));
})(spa || (spa = {}));
/// <reference path="activity.ts" />
var spa;
(function (spa) {
    var controls;
    (function (controls) {
        var PertGroup = (function (_super) {
            __extends(PertGroup, _super);
            function PertGroup() {
                _super.call(this);
                this.style.font = "bold 12px Tahoma";
                this.style.textUnderline = true;
                this.style.width = 5;
            }
            return PertGroup;
        })(controls.PertActivity);
        controls.PertGroup = PertGroup;
    })(controls = spa.controls || (spa.controls = {}));
})(spa || (spa = {}));
var spa;
(function (spa) {
    var controls;
    (function (controls) {
        var PertNode = (function (_super) {
            __extends(PertNode, _super);
            function PertNode() {
                _super.call(this);
                this._location = [0, 0];
                this._text = "";
            }
            Object.defineProperty(PertNode.prototype, "location", {
                get: function () {
                    return this._location;
                },
                set: function (location) {
                    if (location == null) {
                        location = [0, 0];
                    }
                    if (this._location[0] != location[0] || this._location[1] != location[1]) {
                        this._location = location;
                        this.onPropertyChanged("location");
                    }
                },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(PertNode.prototype, "style", {
                get: function () {
                    return null;
                },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(PertNode.prototype, "text", {
                get: function () {
                    return this._text;
                },
                set: function (text) {
                    if (this._text != text) {
                        this._text = text;
                        this.onPropertyChanged("text");
                    }
                },
                enumerable: true,
                configurable: true
            });
            PertNode.prototype.onPropertyChanged = function (propertyName) {
                if (propertyName == "location") {
                    this.update();
                }
                if (propertyName == "text") {
                    this.updateCanvas();
                }
                _super.prototype.onPropertyChanged.call(this, propertyName);
            };
            PertNode.prototype.onStyleChanged = function (propertyName) {
                if (propertyName == "borderWidth" || propertyName == "radius") {
                    this.update();
                }
                if (propertyName == "backgroundColor" || propertyName == "color" || propertyName == "font") {
                    this.updateCanvas();
                }
                _super.prototype.onStyleChanged.call(this, propertyName);
            };
            PertNode.prototype.onLayout = function (ctx) {
                var nodeRadius = this.style.radius + this.style.borderWidth / 2;
                this._nodeBounds = [this.location[0], this.location[1], nodeRadius];
                var bounds = [this.location[0] - nodeRadius, this.location[1] - nodeRadius, nodeRadius * 2, nodeRadius * 2];
                bounds = controls.Geometry.inflateRectangle(bounds, this.style.outlineWidth + 2, this.style.outlineWidth + 2);
                return bounds;
            };
            PertNode.prototype.onPaint = function (ctx) {
                _super.prototype.onPaint.call(this, ctx);
                // node;
                ctx.beginPath();
                ctx.arc(this.location[0], this.location[1], this.style.radius, 0, Math.PI * 2);
                ctx.fillStyle = this.style.backgroundColor;
                ctx.fill();
                ctx.lineWidth = this.style.borderWidth;
                ctx.strokeStyle = this.style.color;
                ctx.stroke();
                // text;
                if (!this.creating) {
                    ctx.font = this.style.font;
                    ctx.textAlign = "center";
                    ctx.textBaseline = "middle";
                    ctx.fillStyle = this.style.color;
                    ctx.fillText(this.text, this.location[0], this.location[1]);
                }
            };
            PertNode.prototype.onPaintOutline = function (ctx) {
                _super.prototype.onPaintOutline.call(this, ctx);
                var radius = this.style.radius + this.style.borderWidth / 2 + this.style.outlineWidth;
                ctx.beginPath();
                ctx.arc(this.location[0], this.location[1], radius, 0, Math.PI * 2);
                ctx.fillStyle = this.style.outlineColor;
                ctx.fill();
            };
            PertNode.prototype.testPath = function (rect) {
                var result = _super.prototype.testPath.call(this, rect);
                if (!result) {
                    result = controls.Geometry.circleIntersectsRectangle(this._nodeBounds, rect);
                }
                return result;
            };
            PertNode.prototype.testPoint = function (point) {
                var result = _super.prototype.testPoint.call(this, point);
                if (result == null) {
                    if (controls.Geometry.circleContainsPoint(this._nodeBounds, point)) {
                        result = "NODE";
                    }
                }
                return result;
            };
            return PertNode;
        })(controls.PertElement);
        controls.PertNode = PertNode;
        var NodeStyle = (function (_super) {
            __extends(NodeStyle, _super);
            function NodeStyle(element) {
                _super.call(this, element);
                this._backgroundColor = "#fff";
                this._borderWidth = 4;
                this._color = "#2e75b5";
                this._font = "bold 12px Tahoma";
                this._radius = 20;
            }
            Object.defineProperty(NodeStyle.prototype, "backgroundColor", {
                get: function () {
                    return this._backgroundColor;
                },
                set: function (backgroundColor) {
                    if (this._backgroundColor != backgroundColor) {
                        this._backgroundColor = backgroundColor;
                        this.onPropertyChanged("backgroundColor");
                    }
                },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(NodeStyle.prototype, "borderWidth", {
                get: function () {
                    return this._borderWidth;
                },
                set: function (borderWidth) {
                    if (this._borderWidth != borderWidth) {
                        this._borderWidth = borderWidth;
                        this.onPropertyChanged("borderWidth");
                    }
                },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(NodeStyle.prototype, "color", {
                get: function () {
                    return this._color;
                },
                set: function (color) {
                    if (this._color != color) {
                        this._color = color;
                        this.onPropertyChanged("color");
                    }
                },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(NodeStyle.prototype, "font", {
                get: function () {
                    return this._font;
                },
                set: function (font) {
                    if (this._font != font) {
                        this._font = font;
                        this.onPropertyChanged("font");
                    }
                },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(NodeStyle.prototype, "radius", {
                get: function () {
                    return this._radius;
                },
                set: function (radius) {
                    if (this._radius != radius) {
                        this._radius = radius;
                        this.onPropertyChanged("radius");
                    }
                },
                enumerable: true,
                configurable: true
            });
            return NodeStyle;
        })(controls.ElementStyle);
        controls.NodeStyle = NodeStyle;
    })(controls = spa.controls || (spa.controls = {}));
})(spa || (spa = {}));
/// <reference path="node.ts" />
var spa;
(function (spa) {
    var controls;
    (function (controls) {
        var PertMilestone = (function (_super) {
            __extends(PertMilestone, _super);
            function PertMilestone() {
                _super.apply(this, arguments);
                this._dateOffset = 10;
                this._dateLineHeight = 20;
                this._flag = false;
            }
            Object.defineProperty(PertMilestone.prototype, "date", {
                get: function () {
                    return this._date;
                },
                set: function (date) {
                    if (this._date != date) {
                        this._date = date;
                        this.onPropertyChanged("date");
                    }
                },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(PertMilestone.prototype, "flag", {
                get: function () {
                    return this._flag;
                },
                set: function (flag) {
                    if (this._flag != flag) {
                        this._flag = flag;
                        this.onPropertyChanged("flag");
                    }
                },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(PertMilestone.prototype, "style", {
                get: function () {
                    if (this._style == null) {
                        this._style = new MilestoneStyle(this);
                    }
                    return this._style;
                },
                enumerable: true,
                configurable: true
            });
            PertMilestone.prototype.onPropertyChanged = function (propertyName) {
                if (propertyName == "date" || propertyName == "flag") {
                    this.update();
                }
                _super.prototype.onPropertyChanged.call(this, propertyName);
            };
            PertMilestone.prototype.onStyleChanged = function (propertyName) {
                if (propertyName == "dateFont" || propertyName == "flagHeight") {
                    this.update();
                }
                _super.prototype.onStyleChanged.call(this, propertyName);
            };
            PertMilestone.prototype.onLayout = function (ctx) {
                var bounds = _super.prototype.onLayout.call(this, ctx);
                if (this.creating) {
                    return bounds;
                }
                if (this.date != null) {
                    ctx.font = this.style.dateFont;
                    var dateText = this.getDateText();
                    var dateTextWidth = ctx.measureText(dateText).width;
                    if (dateTextWidth > bounds[2]) {
                        bounds[0] = this.location[0] - dateTextWidth / 2;
                        bounds[2] = dateTextWidth;
                    }
                    bounds[3] += this._dateOffset + this._dateLineHeight;
                }
                if (this.flag) {
                    bounds[1] -= this.style.flagHeight;
                    bounds[3] += this.style.flagHeight;
                }
                return bounds;
            };
            PertMilestone.prototype.onPaint = function (ctx) {
                _super.prototype.onPaint.call(this, ctx);
                if (this.creating) {
                    return;
                }
                // flag;
                if (this.flag) {
                    var x = this.location[0];
                    var y = this.location[1] - this.style.radius - this.style.borderWidth / 2;
                    var height = this.style.flagHeight;
                    ctx.beginPath();
                    ctx.moveTo(x, y);
                    ctx.lineTo(x, y - height);
                    ctx.lineTo(x + height * 0.66, y - height * 0.66);
                    ctx.lineTo(x, y - height * 0.33);
                    ctx.lineWidth = 2;
                    ctx.stroke();
                }
                // date;
                if (this.date != null) {
                    var dateText = this.getDateText();
                    ctx.font = this.style.dateFont;
                    ctx.fillStyle = this.style.color;
                    ctx.textAlign = "center";
                    ctx.textBaseline = "middle";
                    ctx.fillText(dateText, this.location[0], this.location[1] + this.style.radius + this.style.borderWidth / 2 + this._dateOffset + this._dateLineHeight / 2);
                }
            };
            PertMilestone.prototype.onPaintOutline = function (ctx) {
                _super.prototype.onPaintOutline.call(this, ctx);
            };
            PertMilestone.prototype.testPath = function (rect) {
                return _super.prototype.testPath.call(this, rect);
            };
            PertMilestone.prototype.testPoint = function (point) {
                return _super.prototype.testPoint.call(this, point);
            };
            PertMilestone.prototype.getDateText = function () {
                var text = this.date.getDate().toString() + " ";
                switch (this.date.getMonth()) {
                    case 0:
                        text += "янв";
                        break;
                    case 1:
                        text += "фев";
                        break;
                    case 2:
                        text += "мар";
                        break;
                    case 3:
                        text += "апр";
                        break;
                    case 4:
                        text += "май";
                        break;
                    case 5:
                        text += "июн";
                        break;
                    case 6:
                        text += "июл";
                        break;
                    case 7:
                        text += "авг";
                        break;
                    case 8:
                        text += "сен";
                        break;
                    case 9:
                        text += "окт";
                        break;
                    case 10:
                        text += "ноя";
                        break;
                    case 11:
                        text += "дек";
                        break;
                }
                return text;
            };
            return PertMilestone;
        })(controls.PertNode);
        controls.PertMilestone = PertMilestone;
        var MilestoneStyle = (function (_super) {
            __extends(MilestoneStyle, _super);
            function MilestoneStyle(element) {
                _super.call(this, element);
                this._dateFont = "12px Tahoma";
                this._flagHeight = 20;
            }
            Object.defineProperty(MilestoneStyle.prototype, "dateFont", {
                get: function () {
                    return this._dateFont;
                },
                set: function (dateFont) {
                    if (this._dateFont != dateFont) {
                        this._dateFont = dateFont;
                        this.onPropertyChanged("dateFont");
                    }
                },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(MilestoneStyle.prototype, "flagHeight", {
                get: function () {
                    return this._flagHeight;
                },
                set: function (flagHeight) {
                    if (this._flagHeight != flagHeight) {
                        this._flagHeight = flagHeight;
                        this.onPropertyChanged("flagHeight");
                    }
                },
                enumerable: true,
                configurable: true
            });
            return MilestoneStyle;
        })(controls.NodeStyle);
        controls.MilestoneStyle = MilestoneStyle;
    })(controls = spa.controls || (spa.controls = {}));
})(spa || (spa = {}));
/// <reference path="activity.ts" />
var spa;
(function (spa) {
    var controls;
    (function (controls) {
        var PertWait = (function (_super) {
            __extends(PertWait, _super);
            function PertWait() {
                _super.call(this);
                this.style.width = 1;
            }
            return PertWait;
        })(controls.PertActivity);
        controls.PertWait = PertWait;
    })(controls = spa.controls || (spa.controls = {}));
})(spa || (spa = {}));
/// <reference path="activity.ts" />
var spa;
(function (spa) {
    var controls;
    (function (controls) {
        var PertWork = (function (_super) {
            __extends(PertWork, _super);
            function PertWork() {
                _super.call(this);
                this.style.width = 4;
            }
            return PertWork;
        })(controls.PertActivity);
        controls.PertWork = PertWork;
    })(controls = spa.controls || (spa.controls = {}));
})(spa || (spa = {}));
var spa;
(function (spa) {
    var controls;
    (function (controls) {
        var PivotView = (function (_super) {
            __extends(PivotView, _super);
            function PivotView(params) {
                _super.call(this, params);
                this.ensureParametersValid(["items", "selectedItem"], params, PivotView.componentName);
                if (params == null) {
                    params = {};
                }
                this.bindMethods();
                this.createObservableArrayProperty("items", null, params.items);
                this.createObservableProperty("selectedItem", null, params.selectedItem);
                this.subscribe(this.items, this.onItemsChanged);
                this.subscribe(this.selectedItem, this.onSelectedItemChanged);
            }
            PivotView.prototype.bindMethods = function () {
                this.onItemClick = this.onItemClick.bind(this);
                this.onItemsChanged = this.onItemsChanged.bind(this);
                this.onSelectedItemChanged = this.onSelectedItemChanged.bind(this);
            };
            PivotView.prototype.onItemsChanged = function (items) {
                var selectedItem = this.selectedItem();
                if (selectedItem != null) {
                    if (items == null || items.indexOf(selectedItem) == -1) {
                        this.selectedItem(null);
                    }
                }
            };
            PivotView.prototype.onItemClick = function (item) {
                this.selectedItem(item);
            };
            PivotView.prototype.onSelectedItemChanged = function (item) {
                var _this = this;
                var items = this.items();
                if (item != null && (items == null || items.indexOf(item) == -1)) {
                    setTimeout(function () {
                        _this.selectedItem(null);
                    }, 0);
                }
            };
            PivotView.prototype.dispose = function () {
                _super.prototype.dispose.call(this);
            };
            PivotView.componentName = "pivot-view";
            return PivotView;
        })(controls.Component);
        controls.PivotView = PivotView;
        ko.components.register(PivotView.componentName, {
            viewModel: PivotView,
            template: "<ul data-bind=\"foreach: items\">     <li>         <a class=\"item\" data-bind=\"             css: { 'selected': $parent.selectedItem() == $data },              text: $data == null ? '' : $data.toString(),              click: $parent.onItemClick\"></a>     </li> </ul>"
        });
    })(controls = spa.controls || (spa.controls = {}));
})(spa || (spa = {}));
var spa;
(function (spa) {
    var controls;
    (function (controls) {
        var ProgressBar = (function (_super) {
            __extends(ProgressBar, _super);
            function ProgressBar(params) {
                _super.call(this, params);
                this.ensureParametersValid(["value"], params, controls.PushButton.componentName);
                if (params == null) {
                    params = {};
                }
                this.createObservableProperty("value", null, params.value);
                this.createComputedProperties();
            }
            ProgressBar.prototype.createComputedProperties = function () {
                var _this = this;
                this.progress = ko.computed(function () {
                    var progress = _this.value();
                    if (progress == null) {
                        progress = 0;
                    }
                    return Math.max(0, Math.min(100, progress)).toString() + "%";
                });
            };
            ProgressBar.prototype.dispose = function () {
                this.progress.dispose();
                _super.prototype.dispose.call(this);
            };
            ProgressBar.componentName = "progress-bar";
            return ProgressBar;
        })(controls.Component);
        controls.ProgressBar = ProgressBar;
        ko.components.register(ProgressBar.componentName, {
            viewModel: ProgressBar,
            template: "<div class=\"progress\" data-bind=\"style: { width: progress }\"></div> <span data-bind=\"text: progress\"></span>"
        });
    })(controls = spa.controls || (spa.controls = {}));
})(spa || (spa = {}));
var spa;
(function (spa) {
    var controls;
    (function (controls) {
        var PushButton = (function (_super) {
            __extends(PushButton, _super);
            function PushButton(params) {
                _super.call(this, params);
                this.ensureParametersValid(["busy", "click", "enabled", "icon", "submit", "text", "title"], params, PushButton.componentName);
                if (params == null) {
                    params = {};
                }
                this.bindMethods();
                this.createObservableProperty("busy", false, params.busy);
                this.createObservableProperty("click", null, params.click);
                this.createObservableProperty("enabled", true, params.enabled);
                this.createObservableProperty("icon", null, params.icon);
                this.createObservableProperty("submit", false, params.submit);
                this.createObservableProperty("text", null, params.text);
                this.createObservableProperty("title", null, params.title);
                this.createComputedProperties();
            }
            PushButton.prototype.bindMethods = function () {
                this.onClick = this.onClick.bind(this);
            };
            PushButton.prototype.createComputedProperties = function () {
                var _this = this;
                this.className = ko.computed(function () {
                    var classList = [];
                    if (_this.busy()) {
                        classList.push("busy");
                    }
                    if (_this.busy() || (_this.icon() != null && _this.icon().trim().length > 0)) {
                        classList.push("icon");
                        if (_this.icon() != null) {
                            classList.push(_this.icon().trim());
                        }
                    }
                    if (_this.text() == null || _this.text().trim().length == 0) {
                        classList.push("icon-only");
                    }
                    return classList.join(" ");
                });
                this.disabled = ko.computed(function () {
                    return _this.busy() || !_this.enabled();
                });
                this.type = ko.computed(function () {
                    return _this.submit() ? "submit" : "button";
                });
            };
            PushButton.prototype.onClick = function (data, ev) {
                var handler = this.click();
                if (handler != null) {
                    handler(data, ev);
                }
            };
            PushButton.prototype.dispose = function () {
                this.className.dispose();
                this.disabled.dispose();
                this.type.dispose();
                _super.prototype.dispose.call(this);
            };
            PushButton.componentName = "push-button";
            return PushButton;
        })(controls.Component);
        controls.PushButton = PushButton;
        ko.components.register(PushButton.componentName, {
            viewModel: PushButton,
            template: "<!-- ko if: $componentTemplateNodes != null && $componentTemplateNodes.length > 0 --> <button class=\"button\" type=\"button\" data-bind=\"     attr: { title: title, type: type },     click: function(data, ev) { onClick($parent, ev); },     css: className,     disable: disabled,     template: { nodes: $componentTemplateNodes }\"></button> <!-- /ko --> <!-- ko if: $componentTemplateNodes == null || $componentTemplateNodes.length == 0  --> <button class=\"button\" type=\"button\" data-bind=\"     attr: { title: title, type: type },     click: function(data, ev) { onClick($parent, ev); },     css: className,     disable: disabled,     html: text\"></button> <!-- /ko -->"
        });
    })(controls = spa.controls || (spa.controls = {}));
})(spa || (spa = {}));
var spa;
(function (spa) {
    var controls;
    (function (controls) {
        var RadioButton = (function (_super) {
            __extends(RadioButton, _super);
            function RadioButton(params) {
                _super.call(this, params);
                this.disableSubscriptions = false;
                this.hasFocus = ko.observable();
                this.hasMouse = ko.observable();
                this.ensureParametersValid(["align", "autofocus", "checked", "enabled", "text", "value", "valueChecked"], params, RadioButton.componentName);
                if (params == null) {
                    params = {};
                }
                this.bindMethods();
                this.createObservableProperty("align", "left", params.align);
                this.createObservableProperty("autofocus", false, params.autofocus);
                this.createObservableProperty("checked", false, params.checked);
                this.createObservableProperty("enabled", true, params.enabled);
                this.createObservableProperty("text", null, params.text);
                this.createObservableProperty("value", false, params.value);
                this.createObservableProperty("valueChecked", true, params.valueChecked);
                if (params.checked !== undefined) {
                    this.onPropertyChanged("checked");
                }
                else {
                    if (params.value !== undefined) {
                        this.onPropertyChanged("value");
                    }
                }
                this.subscribe(this.checked, this.onCheckedChanged);
                this.subscribe(this.value, this.onValueChanged);
                this.subscribe(this.valueChecked, this.onValueCheckedChanged);
                this.createComputed();
            }
            RadioButton.prototype.onMouseEnter = function () {
                this.hasMouse(true);
            };
            RadioButton.prototype.onMouseLeave = function () {
                this.hasMouse(false);
            };
            RadioButton.prototype.bindMethods = function () {
                this.onCheckedChanged = this.onCheckedChanged.bind(this);
                this.onClick = this.onClick.bind(this);
                this.onKeyPress = this.onKeyPress.bind(this);
                this.onMouseEnter = this.onMouseEnter.bind(this);
                this.onMouseLeave = this.onMouseLeave.bind(this);
                this.onValueChanged = this.onValueChanged.bind(this);
                this.onValueCheckedChanged = this.onValueCheckedChanged.bind(this);
            };
            RadioButton.prototype.onClick = function () {
                if (this.enabled()) {
                    this.checked(true);
                    if (!this.hasFocus()) {
                        this.hasFocus(true);
                    }
                }
            };
            RadioButton.prototype.onLabelMouseDown = function () {
                if (this.enabled()) {
                    return false;
                }
                return true;
            };
            RadioButton.prototype.onKeyPress = function (data, ev) {
                if (this.enabled() && ev.keyCode == 32) {
                    this.checked(!this.checked());
                    return false;
                }
                return true;
            };
            RadioButton.prototype.createComputed = function () {
                var _this = this;
                this.hasText = ko.computed(function () {
                    return _this.text() != null && _this.text().trim().length > 0;
                });
                this.state = ko.computed(function () {
                    var state = [];
                    if (_this.enabled()) {
                        if (_this.hasFocus()) {
                            state.push("focused");
                        }
                        else {
                            if (_this.hasMouse()) {
                                state.push("hovered");
                            }
                        }
                    }
                    else {
                        state.push("disabled");
                    }
                    if (_this.checked()) {
                        state.push("checked");
                    }
                    return state.join(" ");
                });
            };
            RadioButton.prototype.onCheckedChanged = function (checked) {
                this.onPropertyChanged("checked");
            };
            RadioButton.prototype.onValueChanged = function (value) {
                this.onPropertyChanged("value");
            };
            RadioButton.prototype.onValueCheckedChanged = function (valueChecked) {
                this.onPropertyChanged("valueChecked");
            };
            RadioButton.prototype.onPropertyChanged = function (propertyName) {
                if (this.disableSubscriptions) {
                    return;
                }
                this.disableSubscriptions = true;
                if (propertyName == "checked") {
                    var valueChecked = this.valueChecked();
                    if (this.checked()) {
                        if (!this.compare(this.value(), valueChecked)) {
                            this.value(valueChecked);
                        }
                    }
                }
                if (propertyName == "value" || propertyName == "valueChecked") {
                    var checked = this.value() === this.valueChecked();
                    if (this.checked() != checked) {
                        this.checked(checked);
                    }
                }
                this.disableSubscriptions = false;
            };
            RadioButton.prototype.dispose = function () {
                this.hasText.dispose();
                this.state.dispose();
            };
            RadioButton.componentName = "radio-button";
            return RadioButton;
        })(controls.Component);
        controls.RadioButton = RadioButton;
        ko.components.register(RadioButton.componentName, {
            viewModel: RadioButton,
            template: "<table>     <tr>         <!-- ko if: align() == 'left' -->         <td class=\"button-cell\">             <div class=\"button\" data-bind=\"autofocus: autofocus, attr: { tabIndex: enabled() ? 0 : -1 }, hasFocus: hasFocus, click: onClick, css: 'button ' + state(), event: { keypress: onKeyPress, mouseover: onMouseEnter, mouseout: onMouseLeave }\"></div>         </td>         <!-- /ko -->         <!-- ko if: hasText -->         <td class=\"text-cell\" data-bind=\"style: { 'text-align': align }\">             <div class=\"text\" data-bind=\"click: onClick, html: text, css: 'text ' + state(), event: { mousedown: onLabelMouseDown, mouseover: onMouseEnter, mouseout: onMouseLeave }\"></div>         </td>         <!-- /ko -->         <!-- ko if: align() == 'right' -->         <td class=\"button-cell\">             <div class=\"button\" data-bind=\"autofocus: autofocus, attr: { tabIndex: enabled() ? 0 : -1 }, hasFocus: hasFocus, click: onClick, css: 'button ' + state(), event: { keypress: onKeyPress, mouseover: onMouseEnter, mouseout: onMouseLeave }\"></div>         </td>         <!-- /ko -->     </tr> </table>"
        });
    })(controls = spa.controls || (spa.controls = {}));
})(spa || (spa = {}));
var spa;
(function (spa) {
    var controls;
    (function (controls) {
        var TextBox = (function (_super) {
            __extends(TextBox, _super);
            function TextBox(params) {
                _super.call(this, params);
                this.ensureParametersValid(["autofocus", "enabled", "maxLength", "placeholder", "readOnly", "text", "usePasswordChar"], params, TextBox.componentName);
                if (params == null) {
                    params = {};
                }
                this.createObservableProperty("autofocus", false, params.autofocus);
                this.createObservableProperty("enabled", true, params.enabled);
                this.createObservableProperty("maxLength", null, params.maxLength);
                this.createObservableProperty("placeholder", null, params.placeholder);
                this.createObservableProperty("readOnly", false, params.readOnly);
                this.createObservableProperty("text", null, params.text);
                this.createObservableProperty("usePasswordChar", false, params.usePasswordChar);
                this.createComputedProperties();
            }
            TextBox.prototype.createComputedProperties = function () {
                var _this = this;
                this.type = ko.computed(function () {
                    return _this.usePasswordChar() == true ? "password" : "text";
                });
            };
            TextBox.prototype.dispose = function () {
                this.type.dispose();
                _super.prototype.dispose.call(this);
            };
            TextBox.componentName = "text-box";
            return TextBox;
        })(controls.Component);
        controls.TextBox = TextBox;
        ko.components.register(TextBox.componentName, {
            viewModel: TextBox,
            template: "<input class=\"input\" data-bind=\"     attr: { maxlength: maxLength, placeholder: placeholder, type: type },     autofocus: autofocus,     enable: enabled,     readOnly: readOnly,     value: text,     valueUpdate: 'input'\" />"
        });
    })(controls = spa.controls || (spa.controls = {}));
})(spa || (spa = {}));
var spa;
(function (spa) {
    var controls;
    (function (controls) {
        var TreeView = (function (_super) {
            __extends(TreeView, _super);
            function TreeView(params) {
                _super.call(this, params);
                this.ensureParametersValid(["nodes", "selectedNode"], params, TreeView.componentName);
                if (params == null) {
                    params = {};
                }
                this.createObservableArrayProperty("nodes", null, params.nodes);
                this.createObservableProperty("selectedNode", null, params.selectedNode);
                this.bindMethods();
            }
            TreeView.prototype.bindMethods = function () {
                this.nodeClick = this.nodeClick.bind(this);
                this.nodeExpanded = this.nodeExpanded.bind(this);
                this.nodeSelected = this.nodeSelected.bind(this);
                this.nodeText = this.nodeText.bind(this);
            };
            TreeView.prototype.nodeClick = function (node, ev) {
                if (node.nodes == null || ko.unwrap(node.nodes).length == 0) {
                    this.selectedNode(node);
                    return;
                }
                var expanded = this.nodeExpanded(node);
                node["$expanded"](!expanded);
                if (node.expanded != null) {
                    if (ko.isObservable(node.expanded)) {
                        node.expanded(!expanded);
                    }
                    else {
                        node.expanded = !expanded;
                    }
                }
            };
            TreeView.prototype.nodeExpandable = function (node) {
                return node.nodes != null;
            };
            TreeView.prototype.nodeExpanded = function (node) {
                if (node["$expanded"] == null) {
                    node["$expanded"] = ko.observable(node.expanded == null ? false : ko.unwrap(node.expanded));
                }
                return ko.unwrap(node["$expanded"]);
            };
            TreeView.prototype.nodeSelected = function (node) {
                return this.selectedNode() == node;
            };
            TreeView.prototype.nodeText = function (node) {
                if (node.text != null) {
                    return ko.unwrap(node.text);
                }
                if (node.toString != null) {
                    return node.toString();
                }
                return "";
            };
            TreeView.prototype.dispose = function () {
                this.treeNodeContentTemplate = null;
                this.treeNodeTemplate = null;
                this.treeTemplate = null;
                _super.prototype.dispose.call(this);
            };
            TreeView.componentName = "tree-view";
            return TreeView;
        })(controls.Component);
        controls.TreeView = TreeView;
        ko.components.register(TreeView.componentName, {
            viewModel: {
                createViewModel: function (params, componentInfo) {
                    var template = componentInfo.element;
                    var vm = new TreeView(params);
                    // при привязке модели до присоединения шаблона к документу, ko не может найти шаблоны по ID, поэтому передаем элементы;
                    vm.treeTemplate = template.getElementsByClassName("tree-view-template")[0].childNodes.toArray();
                    vm.treeNodeTemplate = template.getElementsByClassName("tree-view-node-template")[0].childNodes.toArray();
                    vm.treeNodeContentTemplate = template.getElementsByClassName("tree-view-content-template")[0].childNodes.toArray();
                    return vm;
                }
            },
            template: "<ul class=\"tree-view\" data-bind=\"template: { nodes: treeTemplate, foreach: $data, as: 'tree' }\"></ul>  <template class=\"tree-view-template\">     <!-- ko template: { nodes: tree.treeNodeTemplate, if: tree.nodes, foreach: tree.nodes } -->     <!-- /ko --> </template>  <template class=\"tree-view-node-template\">     <li>         <a class=\"node\" data-bind=\"click: tree.nodeClick, css: { expandable: tree.nodeExpandable($data), expanded: tree.nodeExpanded($data), selected: tree.nodeSelected($data) }, template: { nodes: tree.treeNodeContentTemplate }\"></a>         <!-- ko if: $data.nodes -->         <ul data-bind=\"template: { nodes: tree.treeNodeTemplate, foreach: $data.nodes }\"></ul>         <!-- /ko -->     </li> </template>  <template class=\"tree-view-content-template\">     <!-- ko if: $componentTemplateNodes != null && $componentTemplateNodes.length > 0 -->     <span class=\"node-content\" data-bind=\"template: { nodes: $componentTemplateNodes }\"></span>     <!-- /ko -->     <!-- ko if: $componentTemplateNodes == null || $componentTemplateNodes.length == 0 -->     <span class=\"node-content\" data-bind=\"html: text\"></span>     <!-- /ko --> </template>"
        });
    })(controls = spa.controls || (spa.controls = {}));
})(spa || (spa = {}));
var spa;
(function (spa) {
    var controls;
    (function (controls) {
        var YandexMap = (function (_super) {
            __extends(YandexMap, _super);
            function YandexMap(params) {
                _super.call(this, params);
                this.ensureParametersValid(["center", "placemarks", "type", "zoom"], params, YandexMap.componentName);
                if (params == null) {
                    params = {};
                }
                this.createObservableProperty("center", null, params.center);
                this.createObservableArrayProperty("placemarks", null, params.placemarks);
                this.createObservableProperty("type", 3 /* Roadmap */, params.type);
                this.createObservableProperty("zoom", 11, params.zoom);
            }
            YandexMap.prototype.dispose = function () {
                _super.prototype.dispose.call(this);
            };
            YandexMap.componentName = "YandexMap";
            return YandexMap;
        })(controls.Component);
        controls.YandexMap = YandexMap;
        (function (YandexMapType) {
            YandexMapType[YandexMapType["Hybrid"] = 0] = "Hybrid";
            YandexMapType[YandexMapType["HybridPublic"] = 1] = "HybridPublic";
            YandexMapType[YandexMapType["Public"] = 2] = "Public";
            YandexMapType[YandexMapType["Roadmap"] = 3] = "Roadmap";
            YandexMapType[YandexMapType["Satellite"] = 4] = "Satellite";
        })(controls.YandexMapType || (controls.YandexMapType = {}));
        var YandexMapType = controls.YandexMapType;
        ko.bindingHandlers["yandexMap"] = {
            init: function (element, valueAccessor, allBindings, viewModel, bindingContext) {
                initYandexApi(function () {
                    var center = ko.unwrap(viewModel.center);
                    if (center == null) {
                        center = [ymaps.geolocation.latitude, ymaps.geolocation.longitude];
                    }
                    var mapType = ko.unwrap(viewModel.type);
                    if (mapType == null) {
                        mapType = 3 /* Roadmap */;
                    }
                    var zoom = ko.unwrap(viewModel.zoom);
                    if (zoom == null) {
                        zoom = 7;
                    }
                    var map = new ymaps.Map(element, {
                        center: [center[0], center[1]],
                        type: mapTypeToString(mapType),
                        zoom: zoom
                    });
                    map.controls.add("mapTools").add("zoomControl").add("typeSelector");
                    map.behaviors.enable('scrollZoom');
                    var binding = new MapBinding(map, viewModel);
                    ko.utils.domNodeDisposal.addDisposeCallback(element, function () {
                        binding.dispose();
                        map.destroy();
                    });
                });
            }
        };
        function initYandexApi(callback) {
            ymaps.ready(function () {
                ymaps.load(['package.standard'], function () {
                    callback();
                });
            });
        }
        function mapTypeToString(mapType) {
            switch (mapType) {
                case 0 /* Hybrid */:
                    return "yandex#hybrid";
                    break;
                case 1 /* HybridPublic */:
                    return "yandex#publicMapHybrid";
                    break;
                case 2 /* Public */:
                    return "yandex#publicMap";
                    break;
                case 3 /* Roadmap */:
                    return "yandex#map";
                    break;
                case 4 /* Satellite */:
                    return "yandex#satellite";
                    break;
                default: return "yandex#map";
            }
        }
        function compareCoordinates(coords1, coords2) {
            if (coords1 == null && coords2 == null) {
                return true;
            }
            if (coords1 == null || coords2 == null) {
                return false;
            }
            if (coords1.length != coords2.length) {
                return false;
            }
            for (var i = 0; i < coords1.length; i++) {
                if (coords1[i] != coords2[i]) {
                    return false;
                }
            }
            return true;
        }
        ko.components.register("yandex-map", {
            viewModel: YandexMap,
            template: "<div class=\"map\" data-bind=\"yandexMap: true\"></div>"
        });
        var MapBinding = (function () {
            function MapBinding(map, bindingSource) {
                var _this = this;
                this.subscriptions = [];
                this.bindingSource = bindingSource;
                this.map = map;
                var placemarks = bindingSource.placemarks();
                if (placemarks != null) {
                    placemarks.forEach(function (placemark) {
                        _this.onBindingSourcePlacemarkAdded(placemark);
                    });
                }
                this.bindMethods();
                this.subscribeEvents();
            }
            MapBinding.prototype.bindMethods = function () {
                this.getMapCenter = this.getMapCenter.bind(this);
                this.getMapType = this.getMapType.bind(this);
                this.getMapZoom = this.getMapZoom.bind(this);
                this.setMapCenter = this.setMapCenter.bind(this);
                this.setMapType = this.setMapType.bind(this);
                this.setMapZoom = this.setMapZoom.bind(this);
                this.onBindingSourceCenterChanged = this.onBindingSourceCenterChanged.bind(this);
                this.onBindingSourcePlacemarkAdded = this.onBindingSourcePlacemarkAdded.bind(this);
                this.onBindingSourcePlacemarkRemoved = this.onBindingSourcePlacemarkRemoved.bind(this);
                this.onBindingSourceTypeChanged = this.onBindingSourceTypeChanged.bind(this);
                this.onBindingSourceZoomChanged = this.onBindingSourceZoomChanged.bind(this);
                this.onMapBoundsChanged = this.onMapBoundsChanged.bind(this);
                this.onMapTypeChanged = this.onMapTypeChanged.bind(this);
            };
            MapBinding.prototype.subscribeEvents = function () {
                var _this = this;
                this.map.events.add("boundschange", this.onMapBoundsChanged);
                this.map.events.add("typechange", this.onMapTypeChanged);
                this.subscriptions.push(this.bindingSource.center.subscribe(this.onBindingSourceCenterChanged));
                this.subscriptions.push(this.bindingSource.type.subscribe(this.onBindingSourceTypeChanged));
                this.subscriptions.push(this.bindingSource.zoom.subscribe(this.onBindingSourceZoomChanged));
                this.subscriptions.push(this.bindingSource.placemarks.subscribe(function (changes) {
                    changes.forEach(function (change) {
                        if (change.status == "added") {
                            _this.onBindingSourcePlacemarkAdded(change.value);
                        }
                        else {
                            if (change.status == "deleted") {
                                _this.onBindingSourcePlacemarkRemoved(change.value);
                            }
                        }
                    });
                }, null, "arrayChange"));
            };
            MapBinding.prototype.getMapCenter = function () {
                return this.map.getCenter();
            };
            MapBinding.prototype.getMapType = function () {
                switch (this.map.getType()) {
                    case "yandex#hybrid":
                        return 0 /* Hybrid */;
                        break;
                    case "yandex#publicMapHybrid":
                        return 1 /* HybridPublic */;
                        break;
                    case "yandex#publicMap":
                        return 2 /* Public */;
                        break;
                    case "yandex#map":
                        return 3 /* Roadmap */;
                        break;
                    case "yandex#satellite":
                        return 4 /* Satellite */;
                        break;
                    default: return 3 /* Roadmap */;
                }
            };
            MapBinding.prototype.getMapZoom = function () {
                return this.map.getZoom();
            };
            MapBinding.prototype.setMapCenter = function (center) {
                this.map.setCenter(center);
            };
            MapBinding.prototype.setMapType = function (type) {
                switch (type) {
                    case 0 /* Hybrid */:
                        this.map.setType("yandex#hybrid");
                        break;
                    case 1 /* HybridPublic */:
                        this.map.setType("yandex#publicMapHybrid");
                        break;
                    case 2 /* Public */:
                        this.map.setType("yandex#publicMap");
                        break;
                    case 3 /* Roadmap */:
                        this.map.setType("yandex#map");
                        break;
                    case 4 /* Satellite */:
                        this.map.setType("yandex#satellite");
                        break;
                    default: this.map.setType("yandex#map");
                }
            };
            MapBinding.prototype.setMapZoom = function (zoom) {
                this.map.setZoom(zoom);
            };
            MapBinding.prototype.onBindingSourceCenterChanged = function (center) {
                this.setMapCenter(center);
            };
            MapBinding.prototype.onBindingSourcePlacemarkAdded = function (placemarkBindingSource) {
                var coordinates = ko.unwrap(placemarkBindingSource.coordinates);
                if (coordinates == null) {
                    coordinates = [ymaps.geolocation.latitude, ymaps.geolocation.longitude];
                }
                var draggable = ko.unwrap(placemarkBindingSource.draggable);
                if (draggable == null) {
                    draggable = false;
                }
                var placemark = new ymaps.Placemark(coordinates, {}, {
                    draggable: draggable
                });
                this.map.geoObjects.add(placemark);
                var binding = new PlacemarkBinding(placemark, placemarkBindingSource);
                placemarkBindingSource["$binding"] = binding;
                placemarkBindingSource["$placemark"] = placemark;
            };
            MapBinding.prototype.onBindingSourcePlacemarkRemoved = function (placemarkBindingSource) {
                if (placemarkBindingSource["$placemark"] != null) {
                    this.map.geoObjects.remove(placemarkBindingSource["$placemark"]);
                    delete placemarkBindingSource["$placemark"];
                }
                if (placemarkBindingSource["$binding"] != null) {
                    placemarkBindingSource["$binding"].dispose();
                    delete placemarkBindingSource["$binding"];
                }
            };
            MapBinding.prototype.onBindingSourceTypeChanged = function (type) {
                this.setMapType(type);
            };
            MapBinding.prototype.onBindingSourceZoomChanged = function (zoom) {
                this.setMapZoom(zoom);
            };
            MapBinding.prototype.onMapBoundsChanged = function () {
                if (!compareCoordinates(this.getMapCenter(), this.bindingSource.center())) {
                    this.bindingSource.center(this.getMapCenter());
                }
                if (this.getMapZoom() != this.bindingSource.zoom()) {
                    this.bindingSource.zoom(this.getMapZoom());
                }
            };
            MapBinding.prototype.onMapTypeChanged = function () {
                if (this.getMapType() != this.bindingSource.type()) {
                    this.bindingSource.type(this.getMapType());
                }
            };
            MapBinding.prototype.dispose = function () {
                var _this = this;
                this.subscriptions.forEach(function (subscription) {
                    subscription.dispose();
                });
                this.subscriptions.length = 0;
                var placemarks = this.bindingSource.placemarks();
                placemarks.forEach(function (placemark) {
                    if (placemark["$placemark"] != null) {
                        _this.map.geoObjects.remove(placemark["$placemark"]);
                        delete placemark["$placemark"];
                    }
                    if (placemark["$binding"] != null) {
                        placemark["$binding"].dispose();
                        delete placemark["$binding"];
                    }
                });
                this.map.events.remove("boundschange", this.onMapBoundsChanged);
                this.map.events.remove("typechange", this.onMapTypeChanged);
            };
            return MapBinding;
        })();
        var PlacemarkBinding = (function () {
            function PlacemarkBinding(placemark, bindingSource) {
                this.subscriptions = [];
                this.bindingSource = bindingSource;
                this.placemark = placemark;
                this.bindMethods();
                this.subscribeEvents();
            }
            PlacemarkBinding.prototype.bindMethods = function () {
                this.getPlacemarkCoordinates = this.getPlacemarkCoordinates.bind(this);
                this.getPlacemarkDraggable = this.getPlacemarkDraggable.bind(this);
                this.setPlacemarkCoordinates = this.setPlacemarkCoordinates.bind(this);
                this.setPlacemarkDraggable = this.setPlacemarkDraggable.bind(this);
                this.onPlacemarkCoordinatesChanged = this.onPlacemarkCoordinatesChanged.bind(this);
                this.onBindingSourceCoordinatesChanged = this.onBindingSourceCoordinatesChanged.bind(this);
                this.onBindingSourceDraggableChanged = this.onBindingSourceDraggableChanged.bind(this);
            };
            PlacemarkBinding.prototype.subscribeEvents = function () {
                this.placemark.events.add("dragend", this.onPlacemarkCoordinatesChanged, this);
                if (ko.isSubscribable(this.bindingSource.coordinates)) {
                    this.subscriptions.push(this.bindingSource.coordinates.subscribe(this.onBindingSourceCoordinatesChanged));
                }
                if (ko.isSubscribable(this.bindingSource.draggable)) {
                    this.subscriptions.push(this.bindingSource.draggable.subscribe(this.onBindingSourceDraggableChanged));
                }
            };
            PlacemarkBinding.prototype.getPlacemarkCoordinates = function () {
                return this.placemark.geometry.getCoordinates();
            };
            PlacemarkBinding.prototype.getPlacemarkDraggable = function () {
                return this.placemark.options.get("draggable");
            };
            PlacemarkBinding.prototype.setPlacemarkCoordinates = function (coordinates) {
                this.placemark.geometry.setCoordinates(coordinates);
            };
            PlacemarkBinding.prototype.setPlacemarkDraggable = function (draggable) {
                this.placemark.options.set("draggable", draggable);
            };
            PlacemarkBinding.prototype.onPlacemarkCoordinatesChanged = function () {
                var coordinates = this.getPlacemarkCoordinates();
                if (ko.isObservable(this.bindingSource.coordinates)) {
                    if (ko.isWriteableObservable(this.bindingSource.coordinates)) {
                        var sourceCoordinates = this.bindingSource.coordinates();
                        if (!compareCoordinates(coordinates, sourceCoordinates)) {
                            this.bindingSource.coordinates(coordinates);
                        }
                    }
                }
                else {
                    if (!compareCoordinates(this.bindingSource.coordinates, coordinates)) {
                        this.bindingSource.coordinates = coordinates;
                    }
                }
            };
            PlacemarkBinding.prototype.onBindingSourceCoordinatesChanged = function (coordinates) {
                this.setPlacemarkCoordinates(coordinates);
            };
            PlacemarkBinding.prototype.onBindingSourceDraggableChanged = function (draggable) {
                this.setPlacemarkDraggable(draggable);
            };
            PlacemarkBinding.prototype.dispose = function () {
                this.subscriptions.forEach(function (subscription) {
                    subscription.dispose();
                });
                this.subscriptions.length = 0;
                this.placemark.events.remove("dragend", this.onPlacemarkCoordinatesChanged, this);
            };
            return PlacemarkBinding;
        })();
    })(controls = spa.controls || (spa.controls = {}));
})(spa || (spa = {}));
//# sourceMappingURL=spa.controls-latest.js.map
