module spa.controls {
    export class CheckBox extends Component {
        public static componentName = "check-box";

        private disableSubscriptions = false;
        private hasFocus = ko.observable<boolean>();
        private hasMouse = ko.observable<boolean>();
        private hasText: KnockoutComputed<boolean>
        private state: KnockoutComputed<string>;

        public align: KnockoutObservable<string>;
        public autofocus: KnockoutObservable<boolean>;
        public checked: KnockoutObservable<boolean>;
        public enabled: KnockoutObservable<boolean>;
        public text: KnockoutObservable<string>;
        public value: KnockoutObservable<any>;
        public valueChecked: KnockoutObservable<any>;
        public valueUnchecked: KnockoutObservable<any>;

        constructor(params: any) {
            super(params);

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
            } else {
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

        private onMouseEnter() {
            this.hasMouse(true);
        }

        private onMouseLeave() {
            this.hasMouse(false);
        }

        private bindMethods(): void {
            this.onCheckedChanged = this.onCheckedChanged.bind(this);
            this.onClick = this.onClick.bind(this);
            this.onKeyPress = this.onKeyPress.bind(this);
            this.onMouseEnter = this.onMouseEnter.bind(this);
            this.onMouseLeave = this.onMouseLeave.bind(this);
            this.onValueChanged = this.onValueChanged.bind(this);
            this.onValueCheckedChanged = this.onValueCheckedChanged.bind(this);
            this.onValueUncheckedChanged = this.onValueUncheckedChanged.bind(this);
        }

        public onClick() {
            if (this.enabled()) {
                this.checked(!this.checked());

                if (!this.hasFocus()) {
                    this.hasFocus(true);
                }
            }
        }

        public onLabelMouseDown() {
            if (this.enabled()) {
                return false;
            }

            return true;
        }

        public onKeyPress(data: any, ev: KeyboardEvent): boolean {
            if (this.enabled() && ev.keyCode == 32) { // spacebar
                this.checked(!this.checked());
                return false;
            }

            return true;
        }

        private createComputed(): void {
            this.hasText = ko.computed(() => {
                return this.text() != null && this.text().trim().length > 0;
            });

            this.state = ko.computed(() => {
                var state: string[] = [];

                if (this.enabled()) {
                    if (this.hasFocus()) {
                        state.push("focused");
                    } else {
                        if (this.hasMouse()) {
                            state.push("hovered");
                        }
                    }
                }
                else {
                    state.push("disabled");
                }

                if (this.checked()) {
                    state.push("checked");
                }

                return state.join(" ");
            });
        }

        private onCheckedChanged(checked: boolean): void {
            this.onPropertyChanged("checked");
        }

        private onValueChanged(value: any): void {
            this.onPropertyChanged("value");
        }

        private onValueCheckedChanged(valueChecked: any): void {
            this.onPropertyChanged("valueChecked");
        }

        private onValueUncheckedChanged(valueUnchecked: any): void {
            this.onPropertyChanged("valueUnchecked");
        }

        private onPropertyChanged(propertyName: string): void {
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
        }

        public dispose(): void {
            this.hasText.dispose();
            this.state.dispose();
        }
    }

    ko.components.register(CheckBox.componentName, {
        viewModel: CheckBox,
        template: "CheckBox.html"
    });
}