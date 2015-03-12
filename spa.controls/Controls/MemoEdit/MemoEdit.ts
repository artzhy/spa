module spa.controls {
    export class MemoEdit extends Component {
        public static componentName = "memo-edit";

        public autofocus: KnockoutObservable<boolean>;
        public enabled: KnockoutObservable<boolean>;
        public maxLength: KnockoutObservable<number>;
        public placeholder: KnockoutObservable<string>;
        public readOnly: KnockoutObservable<boolean>;
        public text: KnockoutObservable<string>;

        constructor(params: any) {
            super(params);

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
    }

    ko.components.register(MemoEdit.componentName, {
        viewModel: MemoEdit,
        template: "MemoEdit.html"
    });
}