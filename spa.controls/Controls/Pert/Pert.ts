module spa.controls {
    export class PertViewModel extends Component {
        public viewModel = ko.observable<PertDiagram>(null);

        constructor(params: any) {
            super(params);

            if (params == null) {
                params = {};
            }

            this.createObservableProperty("viewModel", this.viewModel, params.viewModel);
        }
    }
}

ko.components.register("c:pert", {
    viewModel: spa.controls.PertViewModel,
    template: "Pert.html"
});