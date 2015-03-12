ko.bindingHandlers["autofocus"] = {
    "update": function (element, valueAccessor) {
        var value = ko.utils.unwrapObservable(valueAccessor());

        if (value) {
            if (!element.hasAttribute("autofocus")) {
                element.setAttribute("autofocus", "");

                setTimeout(() => {
                    element.focus();
                }, 1);
            }
        } else {
            if (element.hasAttribute("autofocus")) {
                element.removeAttribute("autofocus");
            }
        }
    }
};