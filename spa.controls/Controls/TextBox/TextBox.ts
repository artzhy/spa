module spa.controls {
    export class TextBox extends Component {
        public static componentName = "text-box";

        private type: KnockoutComputed<string>;

        public autofocus: KnockoutObservable<boolean>;
        public enabled: KnockoutObservable<boolean>;
        public maxLength: KnockoutObservable<number>;
        public placeholder: KnockoutObservable<string>;
        public readOnly: KnockoutObservable<boolean>;
        public text: KnockoutObservable<string>;
        public usePasswordChar: KnockoutObservable<boolean>;

        constructor(params: any) {
            super(params);

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

        private createComputedProperties(): void {
            this.type = ko.computed(() => {
                return this.usePasswordChar() == true ? "password" : "text";
            });
        }

        public dispose(): void {
            this.type.dispose();

            super.dispose();
        }
    }

    ko.components.register(TextBox.componentName, {
        viewModel: TextBox,
        template: "TextBox.html"
    });
}