module spa {
    export class InternalServerErrorPage implements IPage {
        public static pageName = "InternalServerError";
        public errorMessage = ko.observable<string>();

        constructor(params: any) {
            if (params == null || params.error == null) {
                this.errorMessage("Ресурс не найден.");
            }
            else {
                this.errorMessage(params.error.toString());
            }
        }
    }

    pages.register({
        name: InternalServerErrorPage.pageName,
        template: '<div data-bind="text: errorMessage"></div>',
        title: "Ошибка приложения",
        viewModel: InternalServerErrorPage
    });
} 