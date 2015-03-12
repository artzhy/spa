/// <reference path="../component.ts" />

module spa.controls {
    class Autocomplete extends Component {
        public static componentName = "autocomplete";

        private activeItem = ko.observable<any>(null);
        private autocompleteFocused: KnockoutComputed<boolean>;
        private focused = ko.observable(false);
        private placeholderText: KnockoutComputed<string>;
        private popupFocused = ko.observable(false);
        private popupVisible: KnockoutComputed<boolean>;
        private searchTimer: number = null;
        private suggestions = ko.observableArray();
        private suspendEvents = 0;
        private visited = false;

        // bindable properties;
        public autofocus: KnockoutObservable<boolean>;
        public buffer: KnockoutObservable<number>;
        public enabled: KnockoutObservable<boolean>;
        public items: KnockoutObservable<any>;
        public placeholder: KnockoutObservable<string>;
        public text: KnockoutObservable<string>;
        public textMember: KnockoutObservable<any>;
        public value: KnockoutObservable<any>;

        constructor(params: any) {
            super(params);

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

        private bindMethods(): void {
            this.onFocusedChanged = this.onFocusedChanged.bind(this);
            this.onKeyDown = this.onKeyDown.bind(this);
            this.onItemClick = this.onItemClick.bind(this);
            this.onItemMouseOver = this.onItemMouseOver.bind(this);
            this.onItemsChanged = this.onItemsChanged.bind(this);
            this.onTextChanged = this.onTextChanged.bind(this);
            this.onTextMemberChanged = this.onTextMemberChanged.bind(this);
            this.onValueChanged = this.onValueChanged.bind(this);
        }

        private createComputedProperties(): void {
            this.placeholderText = ko.computed(() => {
                if (this.value() == null) {
                    return this.placeholder();
                }

                return "";
            });

            this.autocompleteFocused = ko.computed(() => {
                return this.focused() || this.popupFocused();
            }).extend({ rateLimit: 1 });

            this.popupVisible = ko.computed(() => {
                //  console.log("input: " + this.focused() + ", popup: " + this.popupFocused());
                // return true;
                return this.enabled() && this.autocompleteFocused() && this.value() == null && this.suggestions() != null && this.suggestions().length > 0;
            });
        }

        private onFocusedChanged(focused: boolean): void {
            if (this.visited == false) {
                this.updateItems(false);
                this.visited = true;
            }
        }

        private onKeyDown(data: any, ev: KeyboardEvent): boolean {
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
        }

        private onItemClick(item: any, ev: MouseEvent): void {
            this.focused(true);
            this.value(item);
        }

        private onItemMouseDown(item: any, ev: MouseEvent): boolean {
            return false;
        }

        private onItemMouseOver(item: any, ev: MouseEvent): void {
            this.activeItem(item);
        }

        private onItemsChanged(func: (text: string, callback: (items: any[]) => any) => any): void {
            var value = this.value();

            if (value == null) {
                this.updateItems(true);
            }
        }

        private onPopupMouseDown(): void {
        }

        private onTextChanged(text: string): void {
            if (this.suspendEvents > 0) {
                return;
            }

            this.updateItems(true);
        }

        private onTextMemberChanged(textMember: string): void {
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
        }

        private onValueChanged(value: any): void {
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
        }

        private updateItems(buffered: boolean): void {
            var timeout = buffered ? this.buffer(): 0;

            if (this.searchTimer != null) {
                clearTimeout(this.searchTimer);
            }

            this.searchTimer = setTimeout(() => {
                this.searchTimer = null;

                var text = this.text();

                this.queryItems(text, (items) => {
                    if (text == this.text()) {
                        this.suggestions(items);

                        if (items != null && items.length == 1 && this.getItemText(items[0]).toUpperCase() == (text + "").toUpperCase()) {
                            if (this.value() != items[0]) {
                                this.value(items[0]);
                            }
                        } else {
                            var value = this.value();

                            if (value != null && this.getItemText(value).toUpperCase() != (text + "").toUpperCase()) {
                                this.value(null);
                            }
                        }
                    }
                });

            }, timeout);
        }

        private getItemText(item: any): string {
            if (item == null) {
                return null;
            }

            var textMember = this.textMember();

            if (textMember != null) {
                var text = typeof textMember == "function" ? textMember(item) : ko.unwrap(item[textMember]);

                if (text != null) {
                    text = text.toString();
                } else {
                    text = "";
                }

                return text;
            }
            else {
                return item.toString();
            }
        }

        private queryItems(text: string, done: (items: any[]) => any): void {
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
                items(text, (response) => {
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
                var searchWords = text.toLowerCase().split(" ").filter(x => x.trim().length > 0);

                items.forEach((item) => {
                    var itemText = this.getItemText(item).toLowerCase();

                    if (searchWords.every(x=> itemText.indexOf(x) != -1)) {
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
        }

        private queryUrl(url: string, text: string, done: (items: any) => any): void {
            url += (url.indexOf("?") == -1 ? "&" : "?") + "searchText=" + text;

            var request = new XMLHttpRequest();

            // Fires when the request aborted.
            request.onabort = () => {
                console.error("Autocomplete request aborted: " + url);
            };

            // Fires when the request fails.
            request.onerror = (ev) => {
                console.error("Autocomplete request error: " + url + ". " + ev.message + ". " + request.status);
            };

            // Fires when the request is successfully completed.
            request.onload = () => {
                if (request.status >= 200 && request.status <= 204) {
                    try {
                        done(this.parseAjaxResponse(request.response));
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
            }

            // Fires when an author-specified period of time has elapsed.
            request.ontimeout = () => {
                console.error("Autocomplete request timeout: " + url);
            };

            request.open("GET", url, true);
            request.send();
        }

        private parseAjaxResponse(response: any): any[] {
            return JSON.parse(response, (key, value) => {
                if (typeof value == "string") {
                    // detecting ISO date 2014-06-21T00:36:04.472Z; 2014-07-16T00:00:00 2013-12-31T20:00:00Z;
                    if (value[10] == "T") {
                        try {
                            var date = new Date(value);

                            if (isNaN(date.getTime())) {
                                return value;
                            } else {
                                return date;
                            }
                        }
                        catch (error) {
                            return value;
                        }
                    }
                };

                return value;
            });
        }

        private getAdjacentItem(currentItem: any, previous: boolean): any {
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
        }

        public dispose(): void {
            super.dispose();

            this.placeholderText.dispose();
            this.popupVisible.dispose();
        }
    }

    ko.components.register("autocomplete", {
        viewModel: Autocomplete,
        template: "Autocomplete.html"
    });
}