module spa.controls {
    export class PushButton extends Component {
        public static componentName = "push-button";

        private className: KnockoutComputed<string>;
        private disabled: KnockoutComputed<boolean>;
        private type: KnockoutComputed<string>;

        public busy: KnockoutObservable<boolean>;
        public click: KnockoutObservable<Function>;
        public enabled: KnockoutObservable<boolean>;
        public icon: KnockoutObservable<string>;
        public submit: KnockoutObservable<boolean>;
        public text: KnockoutObservable<string>;
        public title: KnockoutObservable<string>;

        constructor(params: any) {
            super(params);

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

        private bindMethods(): void {
            this.onClick = this.onClick.bind(this);
        }

        private createComputedProperties(): void {
            this.className = ko.computed(() => {
                var classList = [];

                if (this.busy()) {
                    classList.push("busy");
                }

                if (this.busy() || (this.icon() != null && this.icon().trim().length > 0)) {
                    classList.push("icon");

                    if (this.icon() != null) {
                        classList.push(this.icon().trim());
                    }
                }

                if (this.text() == null || this.text().trim().length == 0) {
                    classList.push("icon-only");
                }

                return classList.join(" ");
            });

            this.disabled = ko.computed(() => {
                return this.busy() || !this.enabled();
            });

            this.type = ko.computed(() => {
                return this.submit() ? "submit" : "button";
            });
        }

        public onClick(data: any, ev: MouseEvent): void {
            var handler = this.click();

            if (handler != null) {
                handler(data, ev);
            }
        }

        public dispose(): void {
            this.className.dispose();
            this.disabled.dispose();
            this.type.dispose();

            super.dispose();
        }
    }

    ko.components.register(PushButton.componentName, {
        viewModel: PushButton,
        template: "PushButton.html"
    });
}