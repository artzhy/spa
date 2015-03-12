interface String {
    /** Returns a value indicating whether a specified substring occurs within this string. */
    contains(value: string, ignoreCase?: boolean): boolean;

    /** Determines whether the end of this string instance matches a specified string. */
    endsWith(value: string, ignoreCase?: boolean): boolean;

    /** Replaces each format item in a specified string with the text equivalent of a corresponding object's value. */
    format(...args: any[]): string;

    /** Returns a new string in which a specified string is inserted at a specified index position in this instance. */
    insert(index: number, value: string): string;

    /** Determines whether the beginning of this string instance matches a specified string. */
    startsWith(value: string, ignoreCase?: boolean): boolean;
}

String.prototype.contains = function (value: string, ignoreCase: boolean = false) {
    if (ignoreCase) {
        return (this.toUpperCase().indexOf(value.toUpperCase()) != -1);
    }
    else {
        return (this.indexOf(value) != -1);
    }
}

String.prototype.endsWith = function (value: string, ignoreCase: boolean = false) {
    if (ignoreCase) {
        return (this.toUpperCase().substr(this.length - value.length) === value.toUpperCase());
    }
    else {
        return (this.substr(this.length - value.length) === value);
    }
}

String.prototype.format = function (...args: any[]) {
    var result = "";
    var currentParam: string = null;

    for (var i = 0; i < this.length; i++) {
        if (currentParam == null) {
            if (this[i] == "{") {
                // parameter start;
                currentParam = "";
            } else {
                // text;
                result += this[i];
            }
        }
        else {
            if (this[i] == "}") {
                // parameter end;
                var param = currentParam.split(":");

                if (param.length == 0 || param.length > 2) {
                    throw "Ошибка форматирования строки '" + this + "'. Недопустимое значение параметра '" + currentParam + "'.";
                }

                var index = parseInt(param[0]);

                if (isNaN(index) || index > args.length - 1) {
                    throw "Ошибка форматирования строки '" + this + "'. Индекс параметра '" + currentParam + "' превышает число аргументов.";
                }

                var text = param[0];

                if (param.length == 2) {
                    var precision = null;

                    if (param[2].length > 1) {
                        precision = parseInt(param[2].substr(1));

                        if (isNaN(precision)) {
                            throw "Ошибка форматирования строки '" + this + "'. Недопустимый формат '" + currentParam + "'.";
                        }
                    }

                    var prefix = param[2].substr(0, 1).toLowerCase();

                    if (prefix == "c") {
                        text = (<number>args[index]).toCurrency(precision);
                    }
                    else {
                        if (prefix == "n") {
                            text = (<number>args[index]).toNumber();
                        }
                        else {
                            throw "Ошибка форматирования строки '" + this + "'. Недопустимый формат '" + currentParam + "'.";
                        }
                    }
                } else {
                    text = args[index];
                }

                result += text;

                currentParam = null;
            } else {
                // parameter text;
                currentParam += this[i];
            }
        }
    }

    if (currentParam != null) {
        throw "Ошибка форматирования строки '" + this + "'. Не удалось найти конец параметра.";
    }

    return result;
}

String.prototype.insert = function (index: number, value: string): string {
    if (index > 0) {
        return this.substring(0, index) + value + this.substring(index, this.length);
    }
    else {
        return value + this;
    }
};

String.prototype.startsWith = function (value: string, ignoreCase: boolean = false) {
    if (ignoreCase) {
        return (this.toUpperCase().substr(0, value.length) === value.toUpperCase());
    }
    else {
        return (this.substr(0, value.length) === value);
    }
}