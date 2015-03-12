interface HTMLElement {
    getParentByClassName(className: string): HTMLElement;
    getParentByTagName(tagName: string): HTMLElement;
    isChildOf(parent: HTMLElement): boolean;
    isInDom(): boolean;
    isVisible(): boolean;
    toggleClass(className: string, visible: boolean);
}

HTMLElement.prototype.getParentByClassName = function (className: string): HTMLElement {
    var parentElement = this.parentElement;

    while (parentElement != null) {
        if ( parentElement.classList.contains(className)) {
            return parentElement;
        }

        parentElement = parentElement.parentElement;
    }

    return null;
}

HTMLElement.prototype.getParentByTagName = function (tagName: string): HTMLElement {
    var parentElement = this.parentElement;

    while (parentElement != null) {
        if (parentElement.tagName == tagName.toUpperCase()) {
            return parentElement;
        }

        parentElement = parentElement.parentElement;
    }

    return null;
}

HTMLElement.prototype.isChildOf = function (parent: Element): boolean {
    var parentElement = this.parentNode;

    while (parentElement != null) {
        if (parentElement == parent) {
            return true;
        }

        parentElement = parentElement.parentNode;
    }

    return false;
}

HTMLElement.prototype.isInDom = function (): boolean {
    var parent = this.parentElement;

    while (parent != null) {
        if (parent.tagName == "HTML") {
            return true;
        }

        parent = parent.parentElement
    }

    return false;
}

HTMLElement.prototype.isVisible = function () {
    return this.offsetWidth > 0 && this.offsetHeight > 0;
}

HTMLElement.prototype.toggleClass = function (className: string, visible: boolean) {
    if (visible) {
        if (this.classList.contains(className) == false) {
            this.classList.add(className);
        }
    }
    else {
        if (this.classList.contains(className)) {
            this.classList.remove(className);
        }
    }
}