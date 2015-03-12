module spa {
    export class InputStringDialog implements IDialog {
        public static dialogName = "InputString";
        
        constructor() {
            this.okClick = this.okClick.bind(this);
        }

        public text = ko.observable("");

        public close(result?: any) {
        }

        public okClick() {
            this.close(this.text());
        }
    }

    dialogs.register({
        name: InputStringDialog.dialogName,
        template: "<input data-bind='textInput: text' /><button data-bind='click: okClick'>ОК</button>",
        title: "Ввод строки",
        viewModel: InputStringDialog,
        size: {
            height: 300,
            width: 400
        }
    });
}