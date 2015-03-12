module spa {
    export class NotFoundPage implements IPage {
        public static pageName = "NotFound";
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
        name: NotFoundPage.pageName,
        template: '<div data-bind="text: errorMessage"></div>',
        title: "Ресурс не найден",
        viewModel: NotFoundPage
    });
}  