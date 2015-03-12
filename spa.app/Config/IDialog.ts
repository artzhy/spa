module spa {
    export interface IDialog {
        close? (result?: any): any;
        dialogSize?: ISize | KnockoutObservable<ISize>;
        dialogTitle?: string | KnockoutObservable<string>;
        dispose? (): any;
    }

    export class DialogViewModel<TResult> {
        public size = ko.observable<ISize>();
        public title = ko.observable<string>();

        constructor(params?: any, ready?: (dialog: DialogViewModel<TResult>, error?: Exception) => any) {
        }

        protected close(result?: TResult): void {
        }

        public show(closeCallback: (result?: TResult) => any): void {
        }

        public dispose() {
        }
    }

    export class InputNumberDialog extends DialogViewModel<number> {
        public value = ko.observable<number>();

        private okClick() {
            this.close(this.value());
        }

        private cancelClick() {
            this.close();
        }
    }

}