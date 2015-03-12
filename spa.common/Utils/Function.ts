module spa {
    var STRIP_COMMENTS = /((\/\/.*$)|(\/\*[\s\S]*?\*\/))/mg;
    var ARGUMENT_NAMES = /([^\s,]+)/g;

    export function getFunctionParameterNames(func: Function): string[]{
        var fnStr = func.toString().replace(STRIP_COMMENTS, '');
        var result = fnStr.slice(fnStr.indexOf('(') + 1, fnStr.indexOf(')')).match(ARGUMENT_NAMES);

        if (result === null) {
            result = [];
        }

        return result
    }

    export function getFunctionName(func: Function): string {
        var s = func.toString();
        return s.slice(9, s.indexOf("("));
    }
} 