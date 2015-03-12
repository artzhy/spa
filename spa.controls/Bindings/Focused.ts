ko.bindingHandlers["focused"] = {
    init: function (element: HTMLElement, valueAccessor: any, allBindings, viewModel, bindingContext) {
        var subscription: KnockoutSubscription;
        var value = valueAccessor();

        if (ko.isObservable(value)) {
            subscription = value.subscribe((newValue) => {
                updateFocus();
            });
        }

        updateFocus();

        function updateFocus(): void {
            var focused = ko.unwrap(valueAccessor());

            if (focused) {
                if (element.tabIndex != -1 && !isElementFocused()) {
                    element.focus();
                }
            }
            else {
                if (isElementFocused()) {
                    (<HTMLElement>document.activeElement).blur();
                }
            }
        }

        function updateValue(): void {
            var focused = isElementFocused();
            var value = valueAccessor();

            if (ko.isObservable(value)) {
                if (ko.isWriteableObservable(value)) {
                    if (value() != focused) {
                        value(focused);
                    }
                }
            }
            else {
                if (value != focused) {
                    value = focused;
                }
            }
        }

        function isChildOf(child: Node, parent: Node): boolean {
            var element = child.parentNode;

            while (element != null && element != document.body) {
                if (element == parent) {
                    return true;
                }

                element = element.parentNode;
            }

            return false;
        }

        function isElementFocused(): boolean {
            return document.activeElement != null && (document.activeElement == element || isChildOf(document.activeElement, element));
        }

        function focusChanged(event: FocusEvent) {
            updateValue();
        }

        function windowBlur() {
            if (viewModel.focused() != false) {
                viewModel.focused(false);
            }
        }

        element.addEventListener('blur', focusChanged, true);
        element.addEventListener('focus', focusChanged, true);
        window.addEventListener("blur", windowBlur);

        ko.utils.domNodeDisposal.addDisposeCallback(element, function () {
            if (subscription != null) {
                subscription.dispose();
            }

            element.removeEventListener("blur", focusChanged, true);
            element.removeEventListener("focus", focusChanged, true);
            window.removeEventListener("blur", windowBlur);
        });
    }
};