ko.bindingHandlers["validation"] = {
    init: function (element: HTMLElement, valueAccessor, allBindings, viewModel: any, bindingContext) {
        if (viewModel.validationErrors == null) {
            throw new spa.Exception("Property 'validationErrors' not found.");
        }

        var boundProperties: string[] = ko.unwrap(valueAccessor());

        if (boundProperties == null || boundProperties.length == 0) {
            return;
        }

        element.toggleClass("validation-errors", true);

        updateErrors(viewModel.validationErrors());

        function updateErrors(errors: spa.IValidationError[]) {
            var visibleErrors: string[] = errors == null ? [] : errors
                .filter((error) => boundProperties.contains(error.propertyName))
                .map((error) => error.errorText);

            var currentErrorList: string[] = [];

            element.toggleClass("no-errors", visibleErrors.length == 0);

            for (var i = 0; i < element.children.length; i++) {
                var li = <HTMLLIElement>element.children[i];

                if (visibleErrors.contains(li.innerHTML)) {
                    if (li.classList.contains("hidden")) {
                        li.classList.remove("hidden");
                    }
                }
                else {
                    if (!li.classList.contains("hidden")) {
                        li.classList.add("hidden");
                    }
                }

                currentErrorList.push(li.innerHTML);
            }

            for (var i = 0; i < visibleErrors.length; i++) {
                if (currentErrorList.contains(visibleErrors[i])) {
                    continue;
                }

                var li = document.createElement("li");
                li.innerHTML = visibleErrors[i];
                li.classList.add("hidden");

                element.appendChild(li);

                showElement(li);
            }
        }

        function showElement(li) {
            setTimeout(() => {
                li.classList.remove("hidden");
            }, 100);
        }

        var subscription = viewModel.validationErrors.subscribe((errors: spa.IValidationError[]) => {
            updateErrors(errors);
        });

        ko.utils.domNodeDisposal.addDisposeCallback(element, function () {
            subscription.dispose();
        });
    }
}; 

module spa {
    export interface IValidationError {
        errorText: string;
        propertyName: string;
    }
}