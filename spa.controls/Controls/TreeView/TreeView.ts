module spa.controls {
    export class TreeView extends Component {
        public static componentName = "tree-view";

        public treeTemplate: Node[];
        public treeNodeTemplate: Node[];
        public treeNodeContentTemplate: Node[];

        // bindable members;
        public nodes: KnockoutObservableArray<ITreeNode>;
        public selectedNode: KnockoutObservable<ITreeNode>;

        constructor(params: any) {
            super(params);

            this.ensureParametersValid(["nodes", "selectedNode"], params, TreeView.componentName);

            if (params == null) {
                params = {};
            }

            this.createObservableArrayProperty("nodes", null, params.nodes);
            this.createObservableProperty("selectedNode", null, params.selectedNode);

            this.bindMethods();
        }

        private bindMethods(): void {
            this.nodeClick = this.nodeClick.bind(this);
            this.nodeExpanded = this.nodeExpanded.bind(this);
            this.nodeSelected = this.nodeSelected.bind(this);
            this.nodeText = this.nodeText.bind(this);
        }

        private nodeClick(node: ITreeNode, ev: MouseEvent): void {
            if (node.nodes == null || ko.unwrap(node.nodes).length == 0) {
                this.selectedNode(node);
                return;
            }

            var expanded = this.nodeExpanded(node);

            node["$expanded"](!expanded);

            if (node.expanded != null) {
                if (ko.isObservable(node.expanded)) {
                    (<any>node).expanded(!expanded);
                } else {
                    node.expanded = !expanded;
                }
            }
        }

        private nodeExpandable(node: ITreeNode): boolean {
            return node.nodes != null;
        }

        private nodeExpanded(node: ITreeNode): boolean {
            if (node["$expanded"] == null) {
                node["$expanded"] = ko.observable(node.expanded == null ? false : ko.unwrap(node.expanded));
            }

            return ko.unwrap(node["$expanded"]);
        }

        private nodeSelected(node: ITreeNode): boolean {
            return this.selectedNode() == node;
        }

        private nodeText(node: ITreeNode): string {
            if (node.text != null) {
                return ko.unwrap(node.text);
            }

            if (node.toString != null) {
                return node.toString();
            }

            return "";
        }

        public dispose(): void {
            this.treeNodeContentTemplate = null;
            this.treeNodeTemplate = null;
            this.treeTemplate = null;

            super.dispose();
        }
    }

    export interface ITreeNode {
        expanded?: boolean | KnockoutObservable<boolean>;
        nodes?: ITreeNode[] | KnockoutObservableArray<ITreeNode>;
        text?: string | KnockoutObservable<string>;
    }

    ko.components.register(TreeView.componentName, {
        viewModel: {
            createViewModel: function (params, componentInfo) {
                var template = <HTMLDivElement>componentInfo.element;
                var vm = new TreeView(params);

                // при привязке модели до присоединения шаблона к документу, ko не может найти шаблоны по ID, поэтому передаем элементы;
                vm.treeTemplate = template.getElementsByClassName("tree-view-template")[0].childNodes.toArray();
                vm.treeNodeTemplate = template.getElementsByClassName("tree-view-node-template")[0].childNodes.toArray();
                vm.treeNodeContentTemplate = template.getElementsByClassName("tree-view-content-template")[0].childNodes.toArray();

                return vm;
            }
        },
        template: "TreeView.html"
    });
}