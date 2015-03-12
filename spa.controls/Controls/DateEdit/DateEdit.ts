/// <reference path="../component.ts" />

module spa.controls {
    export class DateEdit extends Component {
        public static componentName = "date-edit";

        private focused = ko.observable(false);
        private popupToggle = ko.observable(false);
        private popupVisible: KnockoutComputed<boolean>;

        // bindable properties;
        public autofocus: KnockoutObservable<boolean>;
        public enabled: KnockoutObservable<boolean>;
        public text: KnockoutObservable<string>;
        public value: KnockoutObservable<Date>;

        constructor(params: any) {
            super(params);

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
            } else {
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

        private bindMethods(): void {
            this.onButtonClick = this.onButtonClick.bind(this);
            this.onButtonMouseDown = this.onButtonMouseDown.bind(this);
            this.onEnabledChanged = this.onEnabledChanged.bind(this);
            this.onFocusedChanged = this.onFocusedChanged.bind(this);
            this.onKeyDown = this.onKeyDown.bind(this);
            this.onPopupMouseDown = this.onPopupMouseDown.bind(this);
            this.onTextChanged = this.onTextChanged.bind(this);
            this.onValueChanged = this.onValueChanged.bind(this);
        }

        // #region Computed properties

        private createComputedProperties(): void {
            this.popupVisible = ko.computed(() => {
                return this.getPopupVisible();
            });
        }

        private getPopupVisible(): boolean {
            return this.enabled() && this.focused() && this.popupToggle();
        }

        // #endregion

        // #region Subscriptions

        private onEnabledChanged(enabled: boolean): void {
            this.popupToggle(false);
        }

        private onFocusedChanged(focused: boolean): void {
            this.popupToggle(false);

            if (this.value() == null) {
                this.text("");
            }
        }

        private onTextChanged(text: string): void {
            var newValue = this.parse(text);

            if (!this.isSameDate(newValue, this.value())) {
                this.value(newValue);
            }

            this.popupToggle(false);
        }

        private onValueChanged(value: Date): void {
            var currentValue = this.parse(this.text());

            if (!this.isSameDate(currentValue, value)) {
                var text = this.format(value);

                if (this.text() != text) {
                    this.text(text);
                }

                this.popupToggle(false);
            }
        }

        // #endregion

        // #region Handlers

        private onButtonClick(): void {
            if (this.enabled()) {
                this.popupToggle(!this.popupToggle());
            }
        }

        private onButtonMouseDown(): void {
            if (!this.focused()) {
                this.focused(true);
            }
        }

        private onPopupMouseDown(): void {
        }

        private onKeyDown(data: any, ev: KeyboardEvent): boolean {
            return true;
        }

        // #endregion

        // #region Helpers

        private format(date: Date): string {
            if (date == null || isNaN(date.getTime())) {
                return "";
            }

            var day = date.getDate();
            var month = date.getMonth() + 1;
            var year = date.getFullYear();

            return "dd.mm.yyyy"
                .replace("dd", day > 9 ? day.toString() : "0" + day.toString())
                .replace("mm", month > 9 ? month.toString() : "0" + month.toString())
                .replace("yyyy", year.toString());
        }

        private daysInMonth(year, month) {
            var nextMonth: Date = null;

            if (month == 11) {
                nextMonth = new Date(year + 1, 0, 1);
            }
            else {
                nextMonth = new Date(year, month + 1, 1);
            }

            nextMonth.setDate(0);

            return nextMonth.getDate();
        }

        private isSameDate(date1: Date, date2: Date): boolean {
            if (date1 == null || date2 == null) {
                return date1 == null && date2 == null;
            }
            else {
                return date1.toDateString() == date2.toDateString();
            }
        }

        private isValidDate(date: Date): boolean {
            if (Object.prototype.toString.call(date) !== "[object Date]") {
                return false;
            }

            return !isNaN(date.getTime());
        }

        private parse(text: string): Date {
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
        }

        // #endregion

        public dispose(): void {
            this.popupVisible.dispose();

            super.dispose();
        }
    }

    ko.components.register(DateEdit.componentName, {
        viewModel: DateEdit,
        template: "DateEdit.html"
    });
}