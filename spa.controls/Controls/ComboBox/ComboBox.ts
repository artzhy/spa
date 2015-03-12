module spa.controls {
    class ComboBox extends Component {
        public static componentName = "combo-box";

        private activeItem = ko.observable<any>(null);
        private emptyItem = {};
        private emptyItemText: KnockoutComputed<string>;
        private hasMouse = ko.observable(false);
        private hasFocus: KnockoutComputed<boolean>;
        private inputHasFocus = ko.observable(false);
        private inputText: KnockoutComputed<string>;
        private popupHasFocus = ko.observable(false);
        private popupVisible = ko.observable(false);
        private selectedItem = ko.observable<any>();
        private state: KnockoutComputed<string>;

        // properties;
        public autofocus: KnockoutObservable<boolean>;
        public emptyText: KnockoutObservable<string>;
        public enabled: KnockoutObservable<boolean>;
        public items: KnockoutObservableArray<any>;
        public placeholder: KnockoutObservable<string>;
        public text: KnockoutObservable<string>;
        public textMember: KnockoutObservable<any>;
        public value: KnockoutObservable<any>;
        public valueMember: KnockoutObservable<any>;

        constructor(params: any) {
            super(params);

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

        private bindMethods(): void {
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
        }

        private createComputedProperties(): void {
            this.emptyItemText = ko.computed(() => {
                var emptyText = this.emptyText();

                if (emptyText == null || emptyText.toString().trim().length == 0) {
                    return "&nbsp;";
                }
                else {
                    return emptyText;
                }
            });

            this.inputText = ko.computed(() => {
                var selectedItem = this.selectedItem();

                if (selectedItem != this.emptyItem) {
                    return this.getItemText(selectedItem);
                }
                else {
                    var placeholder = this.placeholder();

                    if (placeholder != null) {
                        return placeholder;
                    }
                    else {
                        return "";
                    }
                }
            });

            this.hasFocus = ko.computed(() => {
                return this.inputHasFocus() || this.popupHasFocus();
            }).extend({ rateLimit: 1 });

            this.state = ko.computed(() => {
                if (this.enabled() == false) {
                    return "disabled";
                } else {
                    if (this.hasFocus()) {
                        return "focus";
                    } else {
                        if (this.hasMouse()) {
                            return "hover";
                        }
                    }
                }

                return "";
            });
        }

        private onHasFocusChanged(focused: boolean): void {
            if (!focused) {
                this.popupVisible(false);
            }
        }

        private onItemsChanged(items: any[]): void {
            var selectedItem = this.selectedItem();

            if (selectedItem != this.emptyItem && items.indexOf(selectedItem) == -1) {
                this.selectedItem(null);
            }
        }

        private onMouseEnter() {
            this.hasMouse(true);
        }

        private onMouseLeave() {
            this.hasMouse(false);
        }

        private onSelectedItemChanged(selectedItem: any): void {
            var items = this.items();

            if (selectedItem == this.emptyItem) {
                this.value(null);
                this.text(null);
            }
            else {
                this.value(this.getItemValue(selectedItem));
                this.text(this.getItemText(selectedItem));
            }
        }

        private onTextChanged(text: string): void {
            var selectedItem = this.emptyItem;

            var items = this.items();

            if (items != null && items.length > 0) {
                var searchResult = items.filter(x => this.getItemText(x) == text);

                if (searchResult.length > 0) {
                    selectedItem = searchResult[0];
                }
            }

            if (this.selectedItem() != selectedItem) {
                this.selectedItem(selectedItem);
            } else {
                if (selectedItem == this.emptyItem && text != null && text.length > 0) {
                    setTimeout(() => { this.text(null); }, 0);
                }
            }
        }

        private onTextMemberChanged(text: string): void {
            var selectedItem = this.selectedItem();

            if (selectedItem != this.emptyItem) {
                var text = this.getItemText(selectedItem);

                if (text != this.text()) {
                    this.text(text);
                }
            }
        }

        private onValueChanged(value: any): void {
            var selectedItem = this.emptyItem;

            var items = this.items();

            if (items != null && items.length > 0) {
                var searchResult = items.filter(x => this.getItemValue(x) == value);

                if (searchResult.length > 0) {
                    selectedItem = searchResult[0];
                }
            }

            if (this.selectedItem() != selectedItem) {
                this.selectedItem(selectedItem);
            } else {
                if (selectedItem == this.emptyItem && value != null) {
                    setTimeout(() => { this.value(null); }, 0);
                }
            }
        }

        private onValueMemberChanged(valueMember: string): void {
            var selectedItem = this.selectedItem();

            if (selectedItem != this.emptyItem) {
                var value = this.getItemValue(selectedItem);

                if (value != this.value()) {
                    this.value(value);
                }
            }
        }

        public onInputClick(): void {
            if (this.enabled()) {
                this.activeItem(this.selectedItem());
                this.popupVisible(!this.popupVisible());

                if (!this.inputHasFocus()) {
                    this.inputHasFocus(true);
                }
            }
        }

        public onKeyDown(data, ev: KeyboardEvent): boolean {
            if (!this.enabled()) {
                return true;
            }

            if (ev.keyCode == 13) { // enter;
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
                        var popup = (<any>ev.target).parentElement.querySelector(".popup");
                        var activeItem = (<any>ev.target).parentElement.querySelector(".active");
                        this.scrollToElement(popup, activeItem);
                    }

                    return false;
                } else {
                    if (ev.keyCode == 46) { // delete
                        if (this.selectedItem() != this.emptyItem) {
                            this.selectedItem(this.emptyItem);
                            this.popupVisible(false);
                        }
                    }
                }
            }

            return true;
        }

        private scrollToElement(container: HTMLElement, element: HTMLElement): void {
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
        }

        private onEmptyItemClick(): void {
            this.inputHasFocus(true);
            this.selectedItem(this.emptyItem);
            this.popupVisible(false);
        }

        public onEmptyItemHovered(): void {
            this.activeItem(this.emptyItem);
        }

        public onItemHovered(item: any): void {
            this.activeItem(item);
        }

        public onItemClick(item: any) {
            if (this.enabled()) {
                this.inputHasFocus(true);

                if (this.selectedItem() != item) {
                    this.selectedItem(item);
                }

                this.popupVisible(false);

                return false;
            }
        }

        private getItemText(item: any): string {
            if (item == this.emptyItem) {
                return "";
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

        private getItemValue(item: any): any {
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
        }

        private getAdjacentItem(currentItem: any, previous: boolean): any {
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
        }

        public dispose(): void {
            this.emptyItemText.dispose();
            this.hasFocus.dispose();
            this.inputText.dispose();
            this.state.dispose();
        }
    }

    ko.components.register(ComboBox.componentName, {
        viewModel: ComboBox,
        template: "ComboBox.html"
    });
}