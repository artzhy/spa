module spa {
    export class ForbiddenPage implements IPage {
        public static pageName = "Forbidden";
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
        name: ForbiddenPage.pageName,
        template: '<div data-bind="text: errorMessage"></div>',
        title: "Доступ запрещен",
        viewModel: ForbiddenPage
    });
} 