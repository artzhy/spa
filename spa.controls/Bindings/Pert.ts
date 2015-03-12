ko.bindingHandlers["pert"] = {
    init: function (element, valueAccessor: KnockoutObservable<any>, allBindings, viewModel, bindingContext) {
        var value = valueAccessor();

        var pert = new spa.controls.PertDiagram(element);
        pert.refresh();

        value(pert);

        ko.utils.domNodeDisposal.addDisposeCallback(element, function () {
            pert.dispose();
        });
    }
};