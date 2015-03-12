ko.bindingHandlers["scrollTop"] = {
    init: function (element, valueAccessor, allBindings, viewModel, bindingContext) {
        //function onScroll(ev: Event) {
        //    var value = valueAccessor();

        //    if (ko.isWriteableObservable(value)) {
        //        value(element.scrollTop);
        //    } else {
        //        value = element.scrollTop;
        //    }
        //}

        //element.addEventListener("scroll", onScroll);

        //ko.utils.domNodeDisposal.addDisposeCallback(element, function () {
        //    element.removeEventListener("scroll", onScroll);
        //});
    },
    update: function (element, valueAccessor, allBindings, viewModel, bindingContext) {
        element.scrollTop = ko.unwrap(valueAccessor());
    }
};