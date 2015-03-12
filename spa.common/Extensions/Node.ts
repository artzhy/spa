interface Node {
    getParentByClassName(className: string): HTMLElement;
    getParentByTagName(tagName: string): HTMLElement;
}

Node.prototype.getParentByClassName = function (className: string): HTMLElement {
    var parentNode = this.parentNode;

    while (parentNode != null) {
        if (parentNode.classList.contains(className)) {
            return parentNode;
        }

        parentNode = parentNode.parentNode;
    }

    return null;
}

Node.prototype.getParentByTagName = function (tagName: string): HTMLElement {
    var parentNode = this.parentNode;

    while (parentNode != null) {
        if (parentNode.tagName == tagName.toUpperCase()) {
            return parentNode;
        }

        parentNode = parentNode.parentNode;
    }

    return null;
}