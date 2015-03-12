interface Array<T> {
    /** Computes the average of a sequence of values. */
    average(): number;

    /** Computes the average of a sequence of values that are obtained by invoking a transform function on each element of the input sequence. */
    average(selector?: (item: T) => number): number;

    contains(item: T): boolean;
    clone(): T[];
    distinct(): T[];
    distinct<TResult>(selector?: (item: T) => TResult): TResult[];
    max<T>(): T;
    max(selector?: (item: T) => Date): Date;
    max(selector?: (item: T) => number): number;
    min<T>(): T;
    min(selector?: (item: T) => Date): Date;
    min(selector?: (item: T) => number): number;

    /** Removes the first occurrence of the specified item from an Array object. Returns true if the specified item exists as element in the array and was removed; otherwise, false. */
    remove(item: T): boolean;

    sum(): number;
    sum(selector?: (item: T) => number): number;
}

Array.prototype.average = function <T>(selector?: (item: T) => number): number {
    var count = 0;
    var sum = 0;

    for (var i = 0; i < this.length; i++) {
        var value = selector == null ? this[i] : selector(this[i]);

        if (value != null) {
            count++;
            sum += value;
        }
    }

    if (count == 0) {
        return null;
    }

    return sum / count;
}

Array.prototype.contains = function <T>(item: T) {
    // loop is ~70% faster than indexOf http://jsperf.com/js-for-loop-vs-array-indexof/70;
    for (var i = 0; i < this.length; i++) {
        if (this[i] === item) {
            return true;
        }
    }

    return false;
}

Array.prototype.clone = function <T>() {
    return JSON.parse(JSON.stringify(this));
}

Array.prototype.distinct = function <T, TResult>(selector?: (item: T) => TResult): TResult[] {
    var result = [];

    for (var i = 0; i < this.length; i++) {
        var value = selector == null ? this[i] : selector(this[i]);

        if (result.indexOf(value) == -1) {
            result.push(value);
        }
    }

    return result;
}

Array.prototype.min = function <T>(selector?: (item: T) => any): any {
    var result = null;

    for (var i = 0; i < this.length; i++) {
        var value = selector == null ? this[i] : selector(this[i]);

        if (value != null) {
            result = result == null ? value : Math.min(result, value);
        }
    }

    return result;
}

Array.prototype.max = function <T>(selector?: (item: T) => any): any {
    var result = null;

    for (var i = 0; i < this.length; i++) {
        var value = selector == null ? this[i] : selector(this[i]);

        if (value != null) {
            result = result == null ? value : Math.max(result, value);
        }
    }

    return result;
}

Array.prototype.remove = function <T>(item: T): boolean {
    var index = this.indexOf(item);

    if (index != -1) {
        this.splice(index, 1);
    }

    return index != -1;
}

Array.prototype.sum = function <T>(selector?: (item: T) => number): number {
    var result = 0;

    for (var i = 0; i < this.length; i++) {
        var value = selector == null ? this[i] : selector(this[i]);

        if (value != null) {
            result += value;
        }
    }

    return result;
}