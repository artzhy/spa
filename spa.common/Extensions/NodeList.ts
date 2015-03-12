interface NodeList {
    toArray(): Node[];
}

NodeList.prototype.toArray = function () {
    var result = [];

    for (var i = 0; i < this.length; i++) {
        result.push(this[i]);
    }

    return result;
}