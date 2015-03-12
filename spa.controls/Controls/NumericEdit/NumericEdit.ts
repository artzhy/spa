module spa.controls {
    export class NumericEdit extends Component {
        public static componentName = "numeric-edit";

        private hasFocus = ko.observable(false);
        private text = ko.observable<string>();

        public autofocus: KnockoutObservable<boolean>;
        public decimals: KnockoutObservable<number>;
        public enabled: KnockoutObservable<boolean>
        public increment: KnockoutObservable<number>;
        public max: KnockoutObservable<number>;
        public min: KnockoutObservable<number>;
        public placeholder: KnockoutObservable<string>
        public readOnly: KnockoutObservable<boolean>
        public units: KnockoutObservable<string>;
        public value: KnockoutObservable<number>

        constructor(params: any) {
            super(params);

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

        private bindMethods(): void {
            this.onButtonMouseDown = this.onButtonMouseDown.bind(this);
            this.onDecimalsChanged = this.onDecimalsChanged.bind(this);
            this.onFocusChanged = this.onFocusChanged.bind(this);
            this.onMinChanged = this.onMinChanged.bind(this);
            this.onMaxChanged = this.onMaxChanged.bind(this);
            this.onTextChanged = this.onTextChanged.bind(this);
            this.onUnitsChanged = this.onUnitsChanged.bind(this);
            this.onValueChanged = this.onValueChanged.bind(this);
        }

        private onButtonMouseDown(ev: MouseEvent): boolean {
            return false;
        }

        private onDecimalsChanged(decimals: number): void {
            var value = this.value();

            if (value != null && !isNaN(value)) {
                value = this.truncate(value);
            }

            if (!this.compare(this.value(), value)) {
                this.value(value);
            }
        }

        private onFocusChanged(focused: boolean): void {
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
        }

        private onMinChanged(min: number): void {
            var value = this.value();

            if (value != null && !isNaN(value) && min != null && value < min) {
                this.value(min);
            }
        }

        private onMaxChanged(max: number): void {
            var value = this.value();

            if (value != null && !isNaN(value) && max != null && value > max) {
                this.value(max);
            }
        }

        private onTextChanged(text: string): void {
            if (this.hasFocus() == false) {
                return;
            }

            var value = this.parse(text);

            if (isNaN(value)) {
                setTimeout(() => {
                    var value = this.value();

                    if (value == null || isNaN(value)) {
                        this.text("");
                    } else {
                        this.text(value.toString().replace(".", ","));
                    }
                }, 0);
            }
            else {
                if (!this.compare(this.value(), value)) {
                    this.value(value);
                }
            }
        }

        private onUnitsChanged(units: string): void {
            if (!this.hasFocus()) {
                var text = this.format(this.value());

                if (this.text() != text) {
                    this.text(text);
                }
            }
        }

        private onValueChanged(value: number): void {
            if (value != null && !isNaN(value)) {
                var truncatedValue = this.truncate(value);

                if (!this.compare(truncatedValue, value)) {
                    setTimeout(() => {
                        this.value(truncatedValue);
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
        }

        private decrease(): void {
            if (this.enabled()) {
                this.addIncrement(false);
                this.hasFocus(true);
            }
        }

        private increase(): void {
            if (this.enabled()) {
                this.addIncrement(true);
                this.hasFocus(true);
            }
        }

        private addIncrement(up: boolean): void {
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
        }

        private format(value: number): string {
            if (value == null || isNaN(value)) {
                return "";
            }

            var text = value.toLocaleString("ru-RU");
            var units = this.units();

            if (units != null && units.length > 0) {
                text += " " + units;
            }

            return text;
        }

        private parse(text: string): number {
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

            var value = <number>(new Number(text));

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
        }

        private truncate(value: number): number {
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
        }
    }

    ko.components.register(NumericEdit.componentName, {
        viewModel: NumericEdit,
        template: "NumericEdit.html"
    });
}