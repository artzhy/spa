module spa.controls {
    export class ProgressBar extends Component {
        public static componentName = "progress-bar";

        private progress: KnockoutComputed<string>;

        public value: KnockoutObservable<number>;

        constructor(params: any) {
            super(params);

            this.ensureParametersValid(["value"], params, PushButton.componentName);

            if (params == null) {
                params = {};
            }

            this.createObservableProperty("value", null, params.value);

            this.createComputedProperties();
        }

        private createComputedProperties(): void {
            this.progress = ko.computed(() => {
                var progress = this.value();

                if (progress == null) {
                    progress = 0;
                }

                return Math.max(0, Math.min(100, progress)).toString() + "%";
            });
        }

        public dispose(): void {
            this.progress.dispose();

            super.dispose();
        }
    }

    ko.components.register(ProgressBar.componentName, {
        viewModel: ProgressBar,
        template: "ProgressBar.html"
    });
}