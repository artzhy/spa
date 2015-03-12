module spa {
    export class UnknownError implements IPage {
        public static pageName = "UnknownError";
        public errorMessage = ko.observable<string>();

        constructor(params: any) {
            if (params == null || params.error == null) {
                this.errorMessage("Произошла ошибка при выполнении программы.");
            }
            else {
                this.errorMessage(params.error.toString());
            }
        }
    }

    pages.register({
        name: UnknownError.pageName,
        template: '<div data-bind="text: errorMessage"></div>',
        title: "Ошибка",
        viewModel: UnknownError
    });
}  