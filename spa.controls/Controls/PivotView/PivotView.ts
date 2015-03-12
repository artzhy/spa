module spa.controls {
    export class PivotView extends Component {
        public static componentName = "pivot-view";

        // bindable properties;
        public items: KnockoutObservableArray<any>;
        public selectedItem: KnockoutObservable<any>;

        constructor(params: any) {
            super(params);

            this.ensureParametersValid(["items", "selectedItem"], params, PivotView.componentName);

            if (params == null) {
                params = {};
            }

            this.bindMethods();

            this.createObservableArrayProperty("items", null, params.items);
            this.createObservableProperty("selectedItem", null, params.selectedItem);

            this.subscribe(this.items, this.onItemsChanged);
            this.subscribe(this.selectedItem, this.onSelectedItemChanged);
        }

        private bindMethods(): void {
            this.onItemClick = this.onItemClick.bind(this);
            this.onItemsChanged = this.onItemsChanged.bind(this);
            this.onSelectedItemChanged = this.onSelectedItemChanged.bind(this);
        }

        private onItemsChanged(items: any): void {
            var selectedItem = this.selectedItem();

            if (selectedItem != null) {
                if (items == null || items.indexOf(selectedItem) == -1) {
                    this.selectedItem(null);
                }
            }
        }

        private onItemClick(item: any): void {
            this.selectedItem(item);
        }

        private onSelectedItemChanged(item: any): void {
            var items = this.items();

            if (item != null && (items == null || items.indexOf(item) == -1)) {
                setTimeout(() => {
                    this.selectedItem(null);
                }, 0);
            }
        }

        public dispose(): void {
            super.dispose();
        }
    }

    ko.components.register(PivotView.componentName, {
        viewModel: PivotView,
        template: "PivotView.html"
    }); 
}