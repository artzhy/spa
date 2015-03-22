var spa;
(function (spa) {
    var LocalDataSource = (function () {
        function LocalDataSource(rows) {
            this._needResort = false;
            this.onchanged = new spa.Notification();
            if (rows != null) {
                this.rows = rows;
            }
        }
        Object.defineProperty(LocalDataSource.prototype, "rows", {
            get: function () {
                return this._rows;
            },
            set: function (rows) {
                if (this._rows != rows) {
                    this._rows = rows;
                    this._needResort = true;
                    this.onChanged();
                }
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(LocalDataSource.prototype, "sort", {
            get: function () {
                return this._sort;
            },
            set: function (sort) {
                if (this._sort != sort) {
                    this._sort = sort;
                    this._needResort = true;
                    this.onChanged();
                }
            },
            enumerable: true,
            configurable: true
        });
        LocalDataSource.prototype.getRows = function (skip, take, callback) {
            if (this._sort != null && this._sort.length > 0) {
                if (this._needResort) {
                    this._sortedRows = this.sortRows(this._rows);
                }
                callback(this._sortedRows.slice(skip, skip + take));
            }
            else {
                callback(this._rows.slice(skip, skip + take));
            }
        };
        LocalDataSource.prototype.getRowCount = function (callback) {
            callback(this._rows.length);
        };
        LocalDataSource.prototype.onChanged = function () {
            this.onchanged.notify();
        };
        LocalDataSource.prototype.onSort = function (row1, row2, columnName) {
            var a = row1[columnName];
            var b = row2[columnName];
            if (a == null && b == null) {
                return 0;
            }
            if (a == null) {
                return -1;
            }
            if (b == null) {
                return 1;
            }
            if (typeof a == "string") {
                a = a.toLowerCase();
            }
            if (typeof b == "string") {
                b = b.toLowerCase();
            }
            if (a < b) {
                return -1;
            }
            if (a > b) {
                return 1;
            }
            return 0;
        };
        LocalDataSource.prototype.sortRows = function (rows) {
            var _this = this;
            var result = rows.slice(0);
            if (this._sort == null || this._sort.length == 0) {
                return result;
            }
            result.sort(function (r1, r2) {
                for (var i = 0; i < _this._sort.length; i++) {
                    var sortResult = _this.onSort(r1, r2, _this._sort[i].columnName);
                    if (sortResult != 0) {
                        if (_this._sort[i].ascending) {
                            return sortResult;
                        }
                        else {
                            return -sortResult;
                        }
                    }
                }
                return 0;
            });
            return result;
        };
        return LocalDataSource;
    })();
    spa.LocalDataSource = LocalDataSource;
})(spa || (spa = {}));
var spa;
(function (spa) {
    var RemoteDataSource = (function () {
        function RemoteDataSource() {
            this._cache = new RemoteDataSourceCache();
            this._cachedCount = {};
            this.onchanged = new spa.Notification();
        }
        Object.defineProperty(RemoteDataSource.prototype, "filter", {
            get: function () {
                return this._filter;
            },
            set: function (filter) {
                if (!this.isIdenticalObjects(this._filter, filter)) {
                    this._filter = filter;
                    this.onChanged();
                }
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(RemoteDataSource.prototype, "cacheSize", {
            get: function () {
                return this._cache.size;
            },
            set: function (cacheSize) {
                this._cache.size = cacheSize;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(RemoteDataSource.prototype, "sort", {
            get: function () {
                return this._sort;
            },
            set: function (sort) {
                if (!this.isIdenticalObjects(this.sort, sort)) {
                    this._sort = sort;
                    this.onChanged();
                }
            },
            enumerable: true,
            configurable: true
        });
        RemoteDataSource.prototype.getRows = function (skip, take, callback) {
            var _this = this;
            var cachedRows = this._cache.getRows(this.filter, this.sort, skip, skip + take - 1);
            if (cachedRows != null) {
                callback(cachedRows);
            }
            else {
                this.query(skip, take, function (rows) {
                    _this._cache.cacheRows(_this.filter, _this.sort, skip, skip + take, rows);
                    if ((skip == null || skip == 0) && take == null) {
                        _this._cachedCount[_this.filter == null ? "null" : JSON.stringify(_this.filter)] = rows.length;
                    }
                    callback(rows);
                });
            }
        };
        RemoteDataSource.prototype.getRowCount = function (callback) {
            var _this = this;
            var filterText = this.filter == null ? "null" : JSON.stringify(this.filter);
            if (filterText in this._cachedCount) {
                callback(this._cachedCount[filterText]);
            }
            this.queryCount(function (count) {
                _this._cachedCount[filterText] = count;
                callback(count);
            });
        };
        RemoteDataSource.prototype.clearCache = function () {
            this._cache.clear();
            this._cachedCount = {};
        };
        RemoteDataSource.prototype.dataSourceChanged = function () {
            this.clearCache();
            this.onChanged();
        };
        RemoteDataSource.prototype.query = function (skip, take, callback) {
            throw "Method 'query' is not implemented.";
        };
        RemoteDataSource.prototype.queryCount = function (callback) {
            throw "Method 'queryCount' is not implemented.";
        };
        RemoteDataSource.prototype.onChanged = function () {
            this.onchanged.notify();
        };
        RemoteDataSource.prototype.isIdenticalObjects = function (obj1, obj2) {
            if (obj1 == null && obj2 == null) {
                return true;
            }
            if (obj1 == null || obj2 == null) {
                return false;
            }
            return JSON.stringify(obj1) == JSON.stringify(obj2);
        };
        return RemoteDataSource;
    })();
    spa.RemoteDataSource = RemoteDataSource;
    var RemoteDataSourceCache = (function () {
        function RemoteDataSourceCache() {
            this._data = [];
            this._maxSize = null;
            this._size = 0;
        }
        Object.defineProperty(RemoteDataSourceCache.prototype, "maxSize", {
            /** Indicates the number of rows that are cached locally in memory. */
            get: function () {
                return this._maxSize;
            },
            set: function (maxSize) {
                this._maxSize = maxSize;
                if (this._maxSize != null && this._size > this._maxSize) {
                    this.clear(this._maxSize);
                }
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(RemoteDataSourceCache.prototype, "size", {
            /** Indicates the current cache size. */
            get: function () {
                return this.size;
            },
            enumerable: true,
            configurable: true
        });
        /** Adds rows to cache. */
        RemoteDataSourceCache.prototype.cacheRows = function (filter, sort, fromIndex, toIndex, rows) {
            var cacheRecord = {
                filter: filter == null ? null : JSON.stringify(filter),
                sort: sort == null ? null : JSON.stringify(sort),
                fromIndex: fromIndex,
                toIndex: toIndex,
                rows: rows,
                lastUsed: new Date().getTime()
            };
            this.putRowsInCache(cacheRecord);
            if (this._maxSize != null && this._size > this._maxSize) {
                this.clear(this._maxSize);
            }
        };
        /** Clears the cache or sets it current size to specified value. */
        RemoteDataSourceCache.prototype.clear = function (targetSize) {
            if (targetSize == null) {
                this._data.length = 0;
                this._size = 0;
            }
            this._data.sort(function (a, b) {
                if (a == b) {
                    return 0;
                }
                else {
                    return a > b ? 1 : -1;
                }
            });
            while (this._size > targetSize && this._size != 0) {
                this._size -= this._data.shift().rows.length;
            }
        };
        /** Returns rows from cache starting from 'fromIndex' to 'toIndex' inclusive. */
        RemoteDataSourceCache.prototype.getRows = function (filter, sort, fromIndex, toIndex) {
            if (this._data.length == null) {
                return null;
            }
            var filterText = filter == null ? null : JSON.stringify(filter);
            var sortText = sort == null ? null : JSON.stringify(sort);
            for (var i = 0; i < this._data.length; i++) {
                var cacheRecord = this._data[i];
                var count = toIndex - fromIndex + 1;
                if (cacheRecord.filter == filterText && cacheRecord.sort == sortText) {
                    if (cacheRecord.fromIndex <= fromIndex && cacheRecord.toIndex >= toIndex) {
                        cacheRecord.lastUsed = new Date().getTime();
                        return cacheRecord.rows.slice(fromIndex - cacheRecord.fromIndex, fromIndex - cacheRecord.fromIndex + count);
                    }
                }
            }
            return null;
        };
        RemoteDataSourceCache.prototype.putRowsInCache = function (rows) {
            for (var i = 0; i < this._data.length; i++) {
                if (this._data[i].filter == rows.filter && this._data[i].sort == rows.sort) {
                    if (this.checkIntersection(rows, this._data[i])) {
                        var cacheRecord = this._data.splice(i, 1)[0];
                        cacheRecord = this.union(cacheRecord, rows);
                        this.putRowsInCache(cacheRecord);
                        return;
                    }
                }
            }
            this._data.push(rows);
        };
        RemoteDataSourceCache.prototype.union = function (a, b) {
            // a contains b;
            if (b.fromIndex >= a.fromIndex && b.toIndex <= a.toIndex) {
                return a;
            }
            // b contains a;
            if (a.fromIndex >= b.fromIndex && a.toIndex <= b.toIndex) {
                return b;
            }
            // a before b;
            if (a.fromIndex < b.fromIndex) {
                return {
                    fromIndex: a.fromIndex,
                    toIndex: b.toIndex,
                    rows: a.rows.slice(0).concat(b.rows.slice(a.toIndex - b.fromIndex + 1)),
                    filter: a.filter,
                    sort: a.sort,
                    lastUsed: Math.max(a.lastUsed, b.lastUsed)
                };
            }
            else {
                // b before a;
                return {
                    fromIndex: b.fromIndex,
                    toIndex: a.toIndex,
                    rows: b.rows.slice(0).concat(a.rows.slice(b.toIndex - a.fromIndex + 1)),
                    filter: a.filter,
                    sort: a.sort,
                    lastUsed: Math.max(a.lastUsed, b.lastUsed)
                };
            }
        };
        RemoteDataSourceCache.prototype.checkIntersection = function (range1, range2) {
            return range1.fromIndex < range2.toIndex && range2.fromIndex < range1.toIndex;
        };
        return RemoteDataSourceCache;
    })();
})(spa || (spa = {}));
var spa;
(function (spa) {
    var Exception = (function () {
        function Exception(message) {
            this.message = message;
        }
        Exception.prototype.toString = function () {
            return this.message;
        };
        return Exception;
    })();
    spa.Exception = Exception;
})(spa || (spa = {}));
/// <reference path="exception.ts" />
var __extends = this.__extends || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
var spa;
(function (spa) {
    var ArgumentException = (function (_super) {
        __extends(ArgumentException, _super);
        function ArgumentException(argument, message) {
            _super.call(this, message);
            if (message === undefined) {
                this.message = "Invalid argument {0}".format(argument);
            }
        }
        return ArgumentException;
    })(spa.Exception);
    spa.ArgumentException = ArgumentException;
})(spa || (spa = {}));
/// <reference path="argumentexception.ts" />
var spa;
(function (spa) {
    var ArgumentNullException = (function (_super) {
        __extends(ArgumentNullException, _super);
        function ArgumentNullException(argument) {
            _super.call(this, argument, "Value cannot be null. Parameter name: {0}.".format(argument));
        }
        return ArgumentNullException;
    })(spa.ArgumentException);
    spa.ArgumentNullException = ArgumentNullException;
})(spa || (spa = {}));
/// <reference path="argumentexception.ts" />
var spa;
(function (spa) {
    var ArgumentOutOfRangeException = (function (_super) {
        __extends(ArgumentOutOfRangeException, _super);
        function ArgumentOutOfRangeException(argument) {
            _super.call(this, argument, "Specified argument was out of the range of valid values. Parameter name: {0}.".format(argument));
        }
        return ArgumentOutOfRangeException;
    })(spa.ArgumentException);
    spa.ArgumentOutOfRangeException = ArgumentOutOfRangeException;
})(spa || (spa = {}));
/// <reference path="exception.ts" />
var spa;
(function (spa) {
    var ForbiddenException = (function (_super) {
        __extends(ForbiddenException, _super);
        function ForbiddenException(message) {
            _super.call(this, message);
        }
        return ForbiddenException;
    })(spa.Exception);
    spa.ForbiddenException = ForbiddenException;
})(spa || (spa = {}));
/// <reference path="exception.ts" />
var spa;
(function (spa) {
    var HttpException = (function (_super) {
        __extends(HttpException, _super);
        function HttpException(message, url, statusCode) {
            _super.call(this, message);
            this.statusCode = statusCode;
            this.url = url;
        }
        HttpException.prototype.toString = function () {
            if (isNullOrWhiteSpace(this.message)) {
                return "{0}, {1}".format(this.statusCode, this.url);
            }
            else {
                return this.message;
            }
        };
        return HttpException;
    })(spa.Exception);
    spa.HttpException = HttpException;
})(spa || (spa = {}));
/// <reference path="exception.ts" />
var spa;
(function (spa) {
    var NotFoundException = (function (_super) {
        __extends(NotFoundException, _super);
        function NotFoundException(message) {
            _super.call(this, message);
        }
        return NotFoundException;
    })(spa.Exception);
    spa.NotFoundException = NotFoundException;
})(spa || (spa = {}));
/// <reference path="exception.ts" />
var spa;
(function (spa) {
    var UnauthorizedException = (function (_super) {
        __extends(UnauthorizedException, _super);
        function UnauthorizedException(message) {
            _super.call(this, message);
        }
        return UnauthorizedException;
    })(spa.Exception);
    spa.UnauthorizedException = UnauthorizedException;
})(spa || (spa = {}));
Array.prototype.average = function (selector) {
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
};
Array.prototype.contains = function (item) {
    for (var i = 0; i < this.length; i++) {
        if (this[i] === item) {
            return true;
        }
    }
    return false;
};
Array.prototype.clone = function () {
    return JSON.parse(JSON.stringify(this));
};
Array.prototype.distinct = function (selector) {
    var result = [];
    for (var i = 0; i < this.length; i++) {
        var value = selector == null ? this[i] : selector(this[i]);
        if (result.indexOf(value) == -1) {
            result.push(value);
        }
    }
    return result;
};
Array.prototype.min = function (selector) {
    var result = null;
    for (var i = 0; i < this.length; i++) {
        var value = selector == null ? this[i] : selector(this[i]);
        if (value != null) {
            result = result == null ? value : Math.min(result, value);
        }
    }
    return result;
};
Array.prototype.max = function (selector) {
    var result = null;
    for (var i = 0; i < this.length; i++) {
        var value = selector == null ? this[i] : selector(this[i]);
        if (value != null) {
            result = result == null ? value : Math.max(result, value);
        }
    }
    return result;
};
Array.prototype.remove = function (item) {
    var index = this.indexOf(item);
    if (index != -1) {
        this.splice(index, 1);
    }
    return index != -1;
};
Array.prototype.sum = function (selector) {
    var result = 0;
    for (var i = 0; i < this.length; i++) {
        var value = selector == null ? this[i] : selector(this[i]);
        if (value != null) {
            result += value;
        }
    }
    return result;
};
Date.prototype.addDays = function (days) {
    return new Date(this.getTime() + 1000 * 60 * 60 * 24 * days);
};
Date.prototype.addHours = function (hours) {
    return new Date(this.getTime() + 1000 * 60 * 60 * hours);
};
Date.prototype.addMilliseconds = function (milliseconds) {
    return new Date(this.getTime() + milliseconds);
};
Date.prototype.addMinutes = function (minutes) {
    return new Date(this.getTime() + 1000 * 60 * minutes);
};
Date.prototype.addMonths = function (months) {
    var month = this.getMonth();
    var year = this.getFullYear();
    while (months != 0) {
        if (months > 0) {
            month++;
            months--;
            if (month == 12) {
                year++;
                month = 0;
            }
        }
        else {
            month--;
            months++;
            if (month == -1) {
                year--;
                month = 11;
            }
        }
    }
    var day = Math.min(this.getDate(), daysInMonth(year, month));
    return new Date(year, month, day, this.getHours(), this.getMinutes(), this.getSeconds(), this.getMilliseconds());
};
Date.prototype.addSeconds = function (seconds) {
    return new Date(this.getTime() + 1000 * seconds);
};
Date.prototype.addYears = function (years) {
    var month = this.getMonth();
    var year = this.getFullYear() + years;
    var day = Math.min(this.getDate(), daysInMonth(year, month));
    return new Date(year, month, day, this.getHours(), this.getMinutes(), this.getSeconds(), this.getMilliseconds());
};
Date.prototype.daysAfter = function (date) {
    return (this.getTime() - date.getTime()) / (24 * 60 * 60 * 1000);
};
Date.prototype.daysBefore = function (date) {
    return (date.getTime() - this.getTime()) / (24 * 60 * 60 * 1000);
};
Object.defineProperty(Date.prototype, "date", {
    get: function () {
        return new Date(this.getFullYear(), this.getMonth(), this.getDate(), 0, 0, 0, 0);
    }
});
Date.prototype.format = function (format) {
    // yyyy-MM-dd HH:mm:ss
    //getDate() Returns the day of the month(from 1 - 31)
    //getDay() Returns the day of the week(from 0 - 6)
    //getFullYear() Returns the year(four digits)
    //getHours() Returns the hour(from 0 - 23)
    //getMilliseconds() Returns the milliseconds(from 0 - 999)
    //getMinutes() Returns the minutes(from 0 - 59)
    //getMonth() Returns the month(from 0 - 11)
    //getSeconds() Returns the seconds(from 0 - 59) 
    var year = this.getFullYear();
    var month = this.getMonth() + 1;
    var day = this.getDate();
    var hours = this.getHours();
    var minutes = this.getMinutes();
    var seconds = this.getSeconds();
    var milliseconds = this.getMilliseconds();
    return format.replace("yyyy", year).replace("MM", month < 10 ? ("0" + month.toString()) : month.toString()).replace("dd", day < 10 ? ("0" + day.toString()) : day.toString()).replace("HH", hours < 10 ? ("0" + hours.toString()) : hours.toString()).replace("mm", minutes < 10 ? ("0" + minutes.toString()) : minutes.toString()).replace("ss", seconds < 10 ? ("0" + seconds.toString()) : seconds.toString());
};
Date.prototype.toRussianDate = function () {
    return this.format("dd.MM.yyyy");
};
Date.prototype.toRussianDateTime = function () {
    return this.format("dd.MM.yyyy HH:mm");
};
Date.prototype.toRussianTime = function () {
    return this.format("HH:mm");
};
HTMLElement.prototype.getParentByClassName = function (className) {
    var parentElement = this.parentElement;
    while (parentElement != null) {
        if (parentElement.classList.contains(className)) {
            return parentElement;
        }
        parentElement = parentElement.parentElement;
    }
    return null;
};
HTMLElement.prototype.getParentByTagName = function (tagName) {
    var parentElement = this.parentElement;
    while (parentElement != null) {
        if (parentElement.tagName == tagName.toUpperCase()) {
            return parentElement;
        }
        parentElement = parentElement.parentElement;
    }
    return null;
};
HTMLElement.prototype.isChildOf = function (parent) {
    var parentElement = this.parentNode;
    while (parentElement != null) {
        if (parentElement == parent) {
            return true;
        }
        parentElement = parentElement.parentNode;
    }
    return false;
};
HTMLElement.prototype.isInDom = function () {
    var parent = this.parentElement;
    while (parent != null) {
        if (parent.tagName == "HTML") {
            return true;
        }
        parent = parent.parentElement;
    }
    return false;
};
HTMLElement.prototype.isVisible = function () {
    return this.offsetWidth > 0 && this.offsetHeight > 0;
};
HTMLElement.prototype.toggleClass = function (className, visible) {
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
};
var spa;
(function (spa) {
    var templateFromUrlLoader = {
        loadTemplate: function (name, templateConfig, callback) {
            if (templateConfig.url) {
                var webClient = new spa.WebClient();
                webClient.getAsync(templateConfig.url).then(function (templateHtml) {
                    ko.components.defaultLoader.loadTemplate(name, templateHtml, callback);
                }, function (error) {
                    alert(error.toString());
                });
            }
            else {
                callback(null);
            }
        }
    };
    ko.components.loaders.unshift(templateFromUrlLoader);
})(spa || (spa = {}));
Node.prototype.getParentByClassName = function (className) {
    var parentNode = this.parentNode;
    while (parentNode != null) {
        if (parentNode.classList.contains(className)) {
            return parentNode;
        }
        parentNode = parentNode.parentNode;
    }
    return null;
};
Node.prototype.getParentByTagName = function (tagName) {
    var parentNode = this.parentNode;
    while (parentNode != null) {
        if (parentNode.tagName == tagName.toUpperCase()) {
            return parentNode;
        }
        parentNode = parentNode.parentNode;
    }
    return null;
};
NodeList.prototype.toArray = function () {
    var result = [];
    for (var i = 0; i < this.length; i++) {
        result.push(this[i]);
    }
    return result;
};
Number.prototype.toCurrency = function (precision) {
    var c = 2;
    if (precision === undefined) {
        c = this.toFixed(0) == this ? 0 : 2;
    }
    else {
        c = precision;
    }
    var n = this, d = ",", t = " ", s = n < 0 ? "-" : "", i = parseInt(n = Math.abs(+n || 0).toFixed(c)) + "", j = (j = i.length) > 3 ? j % 3 : 0;
    return s + (j ? i.substr(0, j) + t : "") + i.substr(j).replace(/(\d{3})(?=\d)/g, "$1" + t) + (c ? d + Math.abs(n - i).toFixed(c).slice(2) : "") + " р.";
};
Number.prototype.toNumber = function () {
    var c = (this.toString().split(".")[1] || []).length;
    var n = this, d = ",", t = " ", s = n < 0 ? "-" : "", i = parseInt(n = Math.abs(+n || 0).toFixed(c)) + "", j = (j = i.length) > 3 ? j % 3 : 0;
    return s + (j ? i.substr(0, j) + t : "") + i.substr(j).replace(/(\d{3})(?=\d)/g, "$1" + t) + (c ? d + Math.abs(n - i).toFixed(c).slice(2) : "");
};
Number.prototype.round = function (decimalPlaces) {
    if (decimalPlaces == 0) {
        return Math.round(this);
    }
    else {
        var pow = Math.pow(10, Math.abs(decimalPlaces));
        if (decimalPlaces > 0) {
            return Math.round(this * pow) / pow;
        }
        else {
            return Math.round(this / pow) * pow;
        }
    }
};
//interface Object {
//    clone(): Object;
//} 
//Object.prototype.clone = function() {
//    return JSON.parse(JSON.stringify(this));
//}; 
String.prototype.contains = function (value, ignoreCase) {
    if (ignoreCase === void 0) { ignoreCase = false; }
    if (ignoreCase) {
        return (this.toUpperCase().indexOf(value.toUpperCase()) != -1);
    }
    else {
        return (this.indexOf(value) != -1);
    }
};
String.prototype.endsWith = function (value, ignoreCase) {
    if (ignoreCase === void 0) { ignoreCase = false; }
    if (ignoreCase) {
        return (this.toUpperCase().substr(this.length - value.length) === value.toUpperCase());
    }
    else {
        return (this.substr(this.length - value.length) === value);
    }
};
String.prototype.format = function () {
    var args = [];
    for (var _i = 0; _i < arguments.length; _i++) {
        args[_i - 0] = arguments[_i];
    }
    var result = "";
    var currentParam = null;
    for (var i = 0; i < this.length; i++) {
        if (currentParam == null) {
            if (this[i] == "{") {
                // parameter start;
                currentParam = "";
            }
            else {
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
                        text = args[index].toCurrency(precision);
                    }
                    else {
                        if (prefix == "n") {
                            text = args[index].toNumber();
                        }
                        else {
                            throw "Ошибка форматирования строки '" + this + "'. Недопустимый формат '" + currentParam + "'.";
                        }
                    }
                }
                else {
                    text = args[index];
                }
                result += text;
                currentParam = null;
            }
            else {
                // parameter text;
                currentParam += this[i];
            }
        }
    }
    if (currentParam != null) {
        throw "Ошибка форматирования строки '" + this + "'. Не удалось найти конец параметра.";
    }
    return result;
};
String.prototype.insert = function (index, value) {
    if (index > 0) {
        return this.substring(0, index) + value + this.substring(index, this.length);
    }
    else {
        return value + this;
    }
};
String.prototype.startsWith = function (value, ignoreCase) {
    if (ignoreCase === void 0) { ignoreCase = false; }
    if (ignoreCase) {
        return (this.toUpperCase().substr(0, value.length) === value.toUpperCase());
    }
    else {
        return (this.substr(0, value.length) === value);
    }
};
var spa;
(function (spa) {
    var Attribute = (function () {
        function Attribute() {
        }
        return Attribute;
    })();
    spa.Attribute = Attribute;
    var attributes = [];
    function addClassAttribute(objectClass, attribute) {
        attributes.push({
            objectClass: objectClass,
            attribute: attribute
        });
    }
    spa.addClassAttribute = addClassAttribute;
    function addClassMemberAttribute(objectClass, memberName, attribute) {
        attributes.push({
            objectClass: objectClass,
            attribute: attribute,
            memberName: memberName
        });
    }
    spa.addClassMemberAttribute = addClassMemberAttribute;
    function getClassAttributes(objectClass) {
        return attributes.filter(function (x) { return x.objectClass == objectClass; }).map(function (x) { return x.attribute; });
    }
    spa.getClassAttributes = getClassAttributes;
    function getClassMemberAttributes(objectClass, memberName) {
        return attributes.filter(function (x) { return x.objectClass == objectClass && x.memberName == memberName; }).map(function (x) { return x.attribute; });
    }
    spa.getClassMemberAttributes = getClassMemberAttributes;
    function getAttributeClasses(attributeClass) {
        return attributes.filter(function (x) { return x.attribute instanceof attributeClass; }).map(function (x) { return x.objectClass; });
    }
    spa.getAttributeClasses = getAttributeClasses;
})(spa || (spa = {}));
var spa;
(function (spa) {
    var GC = (function () {
        function GC() {
        }
        GC.disposeElement = function (element) {
            if (GC._container == null) {
                GC._container = document.createElement("div");
                GC._container.style.display = "none";
            }
            document.body.appendChild(GC._container);
            GC._container.appendChild(element);
            GC._container.innerHTML = "";
            document.body.removeChild(GC._container);
        };
        return GC;
    })();
    spa.GC = GC;
})(spa || (spa = {}));
var spa;
(function (spa) {
    var Geocoder = (function () {
        function Geocoder() {
        }
        Geocoder.getAddress = function (coordinates) {
            var task = new spa.Task(function (fulfill, reject, progress) {
                ymaps.geocode(coordinates, {
                    json: true,
                    kind: "house",
                    results: 1
                }).then(function (res) {
                    var address = Geocoder.parseAddress(res);
                    if (address.locality != null) {
                        Geocoder.getDistrict(coordinates).then(function (district) {
                            if (district != null) {
                                address.district = district;
                            }
                            if (Geocoder.CitiesWithMetro.contains(address.locality)) {
                                Geocoder.getMetro(coordinates).then(function (metro) {
                                    if (metro != null) {
                                        address.metro = metro;
                                    }
                                    fulfill(address);
                                }, function (metroError) {
                                    reject(metroError);
                                });
                            }
                            else {
                                fulfill(address);
                            }
                        }, function (districtError) {
                            reject(districtError);
                        });
                    }
                    else {
                        fulfill(address);
                    }
                }, function (error) {
                    reject(new spa.Exception(error.toString()));
                });
            });
            task.start();
            return task;
        };
        Geocoder.getCoordinates = function (address) {
            var task = new spa.Task(function (fulfill, reject, progress) {
                var options = {
                    json: false,
                    kind: "house",
                    results: 1
                };
                ymaps.geocode(address, options).then(function (res) {
                    var firstGeoObject = res.geoObjects.get(0);
                    var coordinates = firstGeoObject.geometry.getCoordinates();
                    var bounds = firstGeoObject.properties.get('boundedBy');
                    fulfill({ bounds: bounds, coordinates: coordinates });
                }, function (error) {
                    reject(new spa.Exception(error.toString()));
                });
            });
            task.start();
            return task;
        };
        Geocoder.getDistrict = function (coordinates) {
            var task = new spa.Task(function (fulfill, reject, progress) {
                ymaps.geocode(coordinates, {
                    json: false,
                    kind: "district",
                    results: 1
                }).then(function (metroRes) {
                    if (metroRes.geoObjects.getLength() > 0) {
                        var firstGeoObject = metroRes.geoObjects.get(0);
                        var district = firstGeoObject.properties.get("name");
                        if (isNullOrWhiteSpace(district) == false) {
                            fulfill(district);
                        }
                        else {
                            fulfill(null);
                        }
                    }
                    else {
                        fulfill(null);
                    }
                }, function (error) {
                    reject(new spa.Exception(error.toString()));
                });
            });
            task.start();
            return task;
        };
        Geocoder.getMetro = function (coordinates) {
            var task = new spa.Task(function (fulfill, reject, progress) {
                ymaps.geocode(coordinates, {
                    json: false,
                    kind: "metro",
                    results: 1
                }).then(function (metroRes) {
                    if (metroRes.geoObjects.getLength() > 0) {
                        var firstGeoObject = metroRes.geoObjects.get(0);
                        var metro = firstGeoObject.properties.get("name");
                        if (isNullOrWhiteSpace(metro) == false) {
                            fulfill(metro);
                        }
                        else {
                            fulfill(null);
                        }
                    }
                    else {
                        fulfill(null);
                    }
                }, function (error) {
                    reject(new spa.Exception(error.toString()));
                });
            });
            task.start();
            return task;
        };
        Geocoder.parseAddress = function (value) {
            var xal = {
                CountryName: "",
                AdministrativeAreaName: "",
                LocalityName: "",
                DependentLocalityName: "",
                ThoroughfareName: "",
                ThoroughfareNumber: "",
                SubAdministrativeAreaName: "",
                PostalCodeNumber: "",
                PremiseName: "",
                PremiseNumber: "",
                PremiseNumberSuffix: "",
                PremiseNumberPrefix: "",
                BuildingName: "",
                SubPremiseName: ""
            };
            Geocoder.parseXAL(value, xal);
            for (var paramName in xal) {
                if (xal[paramName] == "") {
                    delete xal[paramName];
                }
            }
            var result = {};
            if (xal.CountryName != null) {
                result.country = xal.CountryName;
            }
            if (xal.AdministrativeAreaName != null) {
                result.area = xal.AdministrativeAreaName;
            }
            if (xal.SubAdministrativeAreaName != null) {
            }
            if (xal.LocalityName != null) {
                result.locality = xal.LocalityName;
            }
            if (xal.DependentLocalityName != null) {
                result.district = xal.DependentLocalityName;
            }
            if (xal.ThoroughfareName != null) {
                result.street = xal.ThoroughfareName;
            }
            if (xal.PremiseNumber != null) {
                result.house = xal.PremiseNumber;
            }
            var address = [result.country, result.area, result.locality, result.street, result.house];
            result.address = address.filter(function (x) { return isNullOrWhiteSpace(x) == false; }).join(", ");
            //    metro: string;
            return result;
        };
        Geocoder.parseXAL = function (value, xal) {
            for (var memberName in value) {
                if (value[memberName] instanceof Object) {
                    Geocoder.parseXAL(value[memberName], xal);
                }
                else {
                    for (var xalMemberName in xal) {
                        if (memberName == xalMemberName) {
                            xal[xalMemberName] = value[memberName];
                        }
                    }
                }
            }
        };
        Geocoder.CitiesWithMetro = ["Москва", "Санкт-Петербург", "Волгоград", "Нижний Новгород", "Новосибирск", "Самара", "Екатеринбург", "Казань"];
        return Geocoder;
    })();
    spa.Geocoder = Geocoder;
})(spa || (spa = {}));
var spa;
(function (spa) {
    var Geolocator = (function () {
        function Geolocator() {
        }
        Geolocator.getLocation = function () {
            var task = new spa.Task(function (fulfill, reject, progress) {
                ymaps.geolocation.get({
                    provider: "yandex"
                }).then(function (result) {
                    if (result != null && result.geoObjects.getLength() > 0) {
                        var coordinates = result.geoObjects.get(0).geometry.getCoordinates();
                        spa.Geocoder.getAddress(coordinates).then(function (address) {
                            fulfill({ address: address, coordinates: coordinates });
                        }, function (addressError) {
                            reject(addressError);
                        });
                    }
                    else {
                        fulfill(null);
                    }
                }, function (error) {
                    reject(new spa.Exception(error.toString()));
                });
            });
            task.start();
            return task;
        };
        return Geolocator;
    })();
    spa.Geolocator = Geolocator;
})(spa || (spa = {}));
var spa;
(function (spa) {
    var JsonSerializer = (function () {
        function JsonSerializer() {
        }
        JsonSerializer.serializeToQueryString = function (object) {
            return JsonSerializer.serializeObjectToQueryString(object);
        };
        JsonSerializer.deserializeQueryString = function (queryString) {
            if (isNullOrWhiteSpace(queryString)) {
                return null;
            }
            var result = {};
            queryString.split("&").forEach(function (param) {
                JsonSerializer.deserializeProperty(result, decodeURIComponent(param.split("=")[0]), decodeURIComponent(param.split("=")[1]));
            });
            return result;
        };
        JsonSerializer.deserializeProperty = function (object, name, value) {
            var nameParts = name.split(".");
            name = nameParts[0];
            var arrayIndex = -1;
            if (name.contains("[")) {
                arrayIndex = parseInt(name.substring(name.indexOf("[") + 1, name.length - 1));
                name = name.substring(0, name.indexOf("["));
            }
            if (nameParts.length == 1) {
                // detecting number;
                if (!isNaN(value)) {
                    value = parseFloat(value);
                }
                else {
                    // detecting boolean;
                    if (value == "true" || value == "false") {
                        value = value == "true";
                    }
                    else {
                        // detecting ISO date 2014-06-21T00:36:04.472Z;
                        if (value[10] == "T") {
                            try {
                                value = new Date(value);
                            }
                            catch (error) {
                            }
                        }
                    }
                }
                if (arrayIndex == -1) {
                    object[name] = value;
                }
                else {
                    if (object[name] == null) {
                        object[name] = [];
                    }
                    object[name][arrayIndex] = value;
                }
            }
            else {
                if (arrayIndex == -1) {
                    if (object[name] == null) {
                        object[name] = {};
                    }
                    JsonSerializer.deserializeProperty(object[name], nameParts.slice(1).join("."), value);
                }
                else {
                    if (object[name] == null) {
                        object[name] = [];
                    }
                    if (object[name][arrayIndex] == null) {
                        object[name][arrayIndex] = {};
                    }
                    JsonSerializer.deserializeProperty(object[name][arrayIndex], nameParts.slice(1).join("."), value);
                }
            }
        };
        JsonSerializer.serializeObjectToQueryString = function (object, parentProperty) {
            var properties = [];
            for (var memberName in object) {
                if (typeof object[memberName] != "function") {
                    properties.push(memberName);
                }
            }
            return properties.map(function (name) { return JsonSerializer.serializePropertyToQueryString(parentProperty == null ? name : parentProperty + "." + name, object[name]); }).join("&");
        };
        JsonSerializer.serializePropertyToQueryString = function (name, value) {
            if (isNullOrWhiteSpace(value == null ? null : value.toString())) {
                return name;
            }
            if (value instanceof Array) {
                return value.map(function (v, i) { return JsonSerializer.serializePropertyToQueryString(name + "[" + i + "]", v); }).join("&");
            }
            if (value instanceof Date) {
                value = value.toUTCString();
            }
            if (value instanceof Object) {
                return JsonSerializer.serializeObjectToQueryString(value, name);
            }
            else {
                return encodeURIComponent(name) + "=" + encodeURIComponent(value);
            }
        };
        return JsonSerializer;
    })();
    spa.JsonSerializer = JsonSerializer;
})(spa || (spa = {}));
var spa;
(function (spa) {
    /** Уведомление. */
    var Notification = (function () {
        function Notification() {
            this._dispatched = false;
            this._listeners = [];
        }
        /** Уведомляет подписчиков о событии. */
        Notification.prototype.notify = function (args) {
            this._listeners.forEach(function (listener) {
                listener(args);
            });
        };
        /** Уведомляет подписчиков о событии. Последующие подписчики также будут уведомлены о событии. */
        Notification.prototype.notifyOnce = function (args) {
            if (this._dispatched) {
                return;
            }
            else {
                this._args = args;
                this._dispatched = true;
                this.notify(args);
            }
        };
        /** Освобождает ресурсы уведомления и очищает список подпичсчиков. */
        Notification.prototype.dispose = function () {
            this._args = null;
            this._listeners.length = 0;
            this._listeners = null;
        };
        /** Подписаться на событие. */
        Notification.prototype.subscribe = function (handler) {
            this._listeners.push(handler);
            if (this._dispatched) {
                handler(this._args);
            }
        };
        /** Отписаться от события. */
        Notification.prototype.unsubscribe = function (handler) {
            return this._listeners.remove(handler);
        };
        return Notification;
    })();
    spa.Notification = Notification;
})(spa || (spa = {}));
var spa;
(function (spa) {
    var Transliterator = (function () {
        function Transliterator() {
        }
        Transliterator.toEn = function (text) {
            if (text == null || text.length == 0) {
                return text;
            }
            var translit = "";
            for (var i = 0; i < text.length; i++) {
                var char = text[i];
                switch (char) {
                    case "А":
                        translit += "A";
                        break;
                    case "а":
                        translit += "a";
                        break;
                    case "Б":
                        translit += "B";
                        break;
                    case "б":
                        translit += "b";
                        break;
                    case "В":
                        translit += "V";
                        break;
                    case "в":
                        translit += "v";
                        break;
                    case "Г":
                        translit += "G";
                        break;
                    case "г":
                        translit += "g";
                        break;
                    case "Д":
                        translit += "D";
                        break;
                    case "д":
                        translit += "d";
                        break;
                    case "Е":
                        translit += "E";
                        break;
                    case "е":
                        translit += "e";
                        break;
                    case "Ё":
                        translit += "E";
                        break;
                    case "ё":
                        translit += "e";
                        break;
                    case "Ж":
                        translit += "Zh";
                        break;
                    case "ж":
                        translit += "zh";
                        break;
                    case "З":
                        translit += "Z";
                        break;
                    case "з":
                        translit += "z";
                        break;
                    case "И":
                        translit += "I";
                        break;
                    case "и":
                        translit += "i";
                        break;
                    case "Й":
                        translit += "J";
                        break;
                    case "й":
                        translit += "j";
                        break;
                    case "К":
                        translit += "K";
                        break;
                    case "к":
                        translit += "k";
                        break;
                    case "Л":
                        translit += "L";
                        break;
                    case "л":
                        translit += "l";
                        break;
                    case "М":
                        translit += "M";
                        break;
                    case "м":
                        translit += "m";
                        break;
                    case "Н":
                        translit += "N";
                        break;
                    case "н":
                        translit += "n";
                        break;
                    case "О":
                        translit += "O";
                        break;
                    case "о":
                        translit += "o";
                        break;
                    case "П":
                        translit += "P";
                        break;
                    case "п":
                        translit += "p";
                        break;
                    case "Р":
                        translit += "R";
                        break;
                    case "р":
                        translit += "r";
                        break;
                    case "С":
                        translit += "S";
                        break;
                    case "с":
                        translit += "s";
                        break;
                    case "Т":
                        translit += "T";
                        break;
                    case "т":
                        translit += "t";
                        break;
                    case "У":
                        translit += "U";
                        break;
                    case "у":
                        translit += "u";
                        break;
                    case "Ф":
                        translit += "F";
                        break;
                    case "ф":
                        translit += "f";
                        break;
                    case "Х":
                        translit += "Kh";
                        break;
                    case "х":
                        translit += "kh";
                        break;
                    case "Ц":
                        translit += "C";
                        break;
                    case "ц":
                        translit += "c";
                        break;
                    case "Ч":
                        translit += "Ch";
                        break;
                    case "ч":
                        translit += "ch";
                        break;
                    case "Ш":
                        translit += "Sh";
                        break;
                    case "ш":
                        translit += "sh";
                        break;
                    case "Щ":
                        translit += "Shh";
                        break;
                    case "щ":
                        translit += "shh";
                        break;
                    case "Ъ":
                        translit += "";
                        break;
                    case "ъ":
                        translit += "";
                        break;
                    case "Ы":
                        translit += "Y";
                        break;
                    case "ы":
                        translit += "y";
                        break;
                    case "Ь":
                        translit += "";
                        break;
                    case "ь":
                        translit += "";
                        break;
                    case "Э":
                        translit += "E";
                        break;
                    case "э":
                        translit += "e";
                        break;
                    case "Ю":
                        translit += "Yu";
                        break;
                    case "ю":
                        translit += "yu";
                        break;
                    case "Я":
                        translit += "Ya";
                        break;
                    case "я":
                        translit += "ya";
                        break;
                    default: translit += char;
                }
            }
            return translit;
        };
        Transliterator.toEnUrl = function (text) {
            if (text == null || text.length == 0) {
                return null;
            }
            var translit = Transliterator.toEn(text);
            var url = "";
            for (var i = 0; i < translit.length; i++) {
                var char = translit[i];
                if ((char >= "A" && char <= "Z") || (char >= "a" && char <= "z") || (char >= "0" && char <= "9")) {
                    url += char;
                }
                else {
                    if (url.length > 0 && url[url.length - 1] == "-") {
                        continue;
                    }
                    url += "-";
                }
            }
            return url;
        };
        return Transliterator;
    })();
    spa.Transliterator = Transliterator;
})(spa || (spa = {}));
var spa;
(function (spa) {
    var Validator = (function () {
        function Validator() {
        }
        Validator.isBoolean = function (value) {
            if (value != null) {
                if (typeof value === "boolean") {
                    return true;
                }
                return value == "true" || value == "false";
            }
            return false;
        };
        Validator.isDate = function (value) {
            if (value != null) {
                if (value instanceof Date) {
                    return true;
                }
                var text = value.toString();
                if (text.indexOf(".") == -1) {
                    return parseDate(value) != null;
                }
                else {
                    return parseRussianDate(value) != null;
                }
            }
            return false;
        };
        Validator.isEmail = function (value) {
            if (value != null) {
                return /^[-А-яёA-z0-9][-А-яёA-z0-9.]+@([А-яёA-z0-9][-А-яёA-z0-9]+\.)+[А-яёA-z]{2,4}$/.test(value);
            }
            return false;
        };
        Validator.isFloat = function (value) {
            if (value != null) {
                if (typeof value === "number") {
                    return true;
                }
                return parseFloat(value) != NaN;
            }
            return false;
        };
        Validator.isInteger = function (value) {
            if (value != null) {
                if (typeof value === "number") {
                    return parseInt(value) == value;
                }
                var parseResult = parseFloat(value);
                if (parseResult != NaN) {
                    return parseInt(value) == parseResult;
                }
            }
            return false;
        };
        Validator.isPhoneNumber = function (value) {
            if (value == null) {
                return false;
            }
            var text = typeof value === "string" ? value : value.toString();
            if (text.length == 0) {
                return false;
            }
            var digits = 0;
            for (var i = 0; i < text.length; i++) {
                if (text[i] >= "0" && text[i] <= "9") {
                    digits++;
                }
            }
            return digits == 11;
        };
        return Validator;
    })();
    spa.Validator = Validator;
})(spa || (spa = {}));
var spa;
(function (spa) {
    var Task = (function () {
        function Task(action) {
            this._fulfillHandlers = [];
            this._percentsComplete = 0;
            this._progressHandlers = [];
            this._rejectHandlers = [];
            this._status = 2 /* Pending */;
            this._action = action;
        }
        Object.defineProperty(Task.prototype, "error", {
            get: function () {
                return this._error;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Task.prototype, "percentsComplete", {
            get: function () {
                return this._percentsComplete;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Task.prototype, "result", {
            get: function () {
                return this._result;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Task.prototype, "status", {
            get: function () {
                return this._status;
            },
            enumerable: true,
            configurable: true
        });
        Task.prototype.cancel = function () {
            var _this = this;
            if (this._status == 2 /* Pending */) {
                this._status = 1 /* Rejected */;
                if (this._rejectHandlers.length > 0) {
                    this._rejectHandlers.forEach(function (h) {
                        h(_this._error);
                    });
                    this._progressHandlers = [];
                    this._rejectHandlers = [];
                }
            }
        };
        Task.prototype.continueWith = function (continuation) {
            var _this = this;
            return new Task(function (fulfill, reject, progress) {
                _this.then(function (thisResult) {
                    continuation.start();
                    continuation.then(function (cf) {
                        fulfill(cf);
                    }, function (cr) {
                        reject(cr);
                    }, function (cp) {
                        progress(cp);
                    });
                }, function (thisError) {
                    reject(_this.error);
                }, function (thisProgress) {
                    progress(thisProgress);
                });
            });
        };
        Task.prototype.then = function (onFulfill, onReject, onProgress) {
            if (onFulfill != null) {
                if (this._status == 2 /* Pending */) {
                    this._fulfillHandlers.push(onFulfill);
                }
                else {
                    if (this._status == 0 /* Fulfilled */) {
                        onFulfill(this._result);
                    }
                }
            }
            if (onReject != null) {
                if (this._status == 2 /* Pending */) {
                    this._rejectHandlers.push(onReject);
                }
                else {
                    if (this._status == 1 /* Rejected */) {
                        onReject(this._error);
                    }
                }
            }
            if (onProgress != null) {
                if (this._status == 2 /* Pending */) {
                    this._progressHandlers.push(onProgress);
                }
            }
            return this;
        };
        Task.prototype.progress = function (percentsComplete) {
            this._percentsComplete = percentsComplete;
            if (this._progressHandlers.length > 0) {
                this._progressHandlers.forEach(function (h) {
                    h(percentsComplete);
                });
            }
        };
        Task.prototype.reject = function (error) {
            var _this = this;
            if (this._status == 2 /* Pending */) {
                this._error = error;
                this._status = 1 /* Rejected */;
                if (this._rejectHandlers.length > 0) {
                    this._rejectHandlers.forEach(function (h) {
                        h(_this._error);
                    });
                    this._progressHandlers = [];
                    this._rejectHandlers = [];
                }
            }
        };
        Task.prototype.fulfill = function (result) {
            var _this = this;
            if (this._status == 2 /* Pending */) {
                this._result = result;
                this._status = 0 /* Fulfilled */;
                if (this._fulfillHandlers.length > 0) {
                    this._fulfillHandlers.forEach(function (h) {
                        h(_this._result);
                    });
                    this._progressHandlers = [];
                    this._fulfillHandlers = [];
                }
            }
        };
        Task.prototype.start = function () {
            var _this = this;
            setTimeout(function () {
                _this._action(function (result) {
                    _this.fulfill(result);
                }, function (error) {
                    _this.reject(error);
                }, function (percentsComplete) {
                    _this.progress(percentsComplete);
                });
            }, 1);
        };
        Task.run = function (action) {
            var task = new Task(action);
            task.start();
            return task;
        };
        Task.when = function (p1, p2, p3, p4, p5) {
            var callback = null;
            var params = [p1, p2, p3, p4, p5];
            var tasks = [];
            params.forEach(function (p) {
                if (p != null) {
                    if (p instanceof Task) {
                        tasks.push(p);
                    }
                    else {
                        if (typeof p == "function") {
                            callback = p;
                        }
                    }
                }
            });
            var calledBack = false;
            if (tasks.length > 0) {
                tasks.forEach(function (task) {
                    task.then(function () {
                        if (tasks.every(function (x) { return x.status == 0 /* Fulfilled */; }) && callback != null) {
                            switch (tasks.length) {
                                case 1:
                                    callback(tasks[0].result);
                                    break;
                                case 2:
                                    callback(tasks[0].result, tasks[1].result);
                                    break;
                                case 3:
                                    callback(tasks[0].result, tasks[1].result, tasks[2].result);
                                    break;
                                case 4:
                                    callback(tasks[0].result, tasks[1].result, tasks[2].result, tasks[3].result);
                                    break;
                                case 5:
                                    callback(tasks[0].result, tasks[1].result, tasks[2].result, tasks[3].result, tasks[4].result);
                                    break;
                                case 6:
                                    callback(tasks[0].result, tasks[1].result, tasks[2].result, tasks[3].result, tasks[4].result, tasks[5].result);
                                    break;
                                case 7:
                                    callback(tasks[0].result, tasks[1].result, tasks[2].result, tasks[3].result, tasks[4].result, tasks[5].result, tasks[6].result);
                                    break;
                                case 8:
                                    callback(tasks[0].result, tasks[1].result, tasks[2].result, tasks[3].result, tasks[4].result, tasks[5].result, tasks[6].result, tasks[7].result);
                                    break;
                                case 9:
                                    callback(tasks[0].result, tasks[1].result, tasks[2].result, tasks[3].result, tasks[4].result, tasks[5].result, tasks[6].result, tasks[7].result, tasks[8].result);
                                    break;
                                case 10:
                                    callback(tasks[0].result, tasks[1].result, tasks[2].result, tasks[3].result, tasks[4].result, tasks[5].result, tasks[6].result, tasks[7].result, tasks[8].result, tasks[9].result);
                                    break;
                                default: callback();
                            }
                        }
                    }, function (error) {
                        if (!calledBack) {
                            if (callback != null) {
                                calledBack = true;
                                callback();
                            }
                        }
                    });
                });
            }
            else {
                if (callback != null) {
                    callback();
                }
            }
        };
        Task.whenAll = function () {
            var params = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                params[_i - 0] = arguments[_i];
            }
            if (params == null) {
                throw "Invalid argument";
            }
            var summaryTask = new Task(function (fullfill, reject, progress) {
                var pendingTasks = params.slice(0);
                pendingTasks.forEach(function (t) {
                    t.then(function (result) {
                        if (summaryTask.status == 2 /* Pending */) {
                            if (pendingTasks.every(function (x) { return x.status == 0 /* Fulfilled */; })) {
                                fullfill(pendingTasks.map(function (x) { return x.result; }));
                            }
                        }
                    }, function (taskError) {
                        if (summaryTask.status == 2 /* Pending */) {
                            reject(taskError);
                        }
                    }, function (taskPercentsComplete) {
                        if (summaryTask.status == 2 /* Pending */) {
                            progress(pendingTasks.min(function (x) { return x.percentsComplete; }));
                        }
                    });
                });
            });
            return summaryTask;
        };
        Task.fromResult = function (result) {
            var task = new Task(function (resolve) {
                resolve(result);
            });
            task.start();
            return task;
        };
        return Task;
    })();
    spa.Task = Task;
    (function (TaskStatus) {
        TaskStatus[TaskStatus["Fulfilled"] = 0] = "Fulfilled";
        TaskStatus[TaskStatus["Rejected"] = 1] = "Rejected";
        TaskStatus[TaskStatus["Pending"] = 2] = "Pending";
    })(spa.TaskStatus || (spa.TaskStatus = {}));
    var TaskStatus = spa.TaskStatus;
    function async(work) {
        return Task.run(work);
    }
    spa.async = async;
    function await(p1, p2, p3, p4, p5) {
        if (p4 instanceof Task) {
            Task.when(p1, p2, p3, p4, function (res1, res2, res3, res4, error) {
                if (error == null) {
                    p5(res1, res2, res3, res4);
                }
                else {
                    throw error;
                }
            });
        }
        else {
            if (p3 instanceof Task) {
                Task.when(p1, p2, p3, function (res1, res2, res3, error) {
                    if (error == null) {
                        p4(res1, res2, res3);
                    }
                    else {
                        throw error;
                    }
                });
            }
            else {
                if (p2 instanceof Task) {
                    Task.when(p1, p2, function (res1, res2, error) {
                        if (error == null) {
                            p3(res1, res2);
                        }
                        else {
                            throw error;
                        }
                    });
                }
                else {
                    p1.then(function (result) {
                        p2(result);
                    }, function (error) {
                        throw error;
                    });
                }
            }
        }
    }
    spa.await = await;
})(spa || (spa = {}));
/// <reference path="../modules/notification.ts" />
/// <reference path="../modules/task.ts" />
var spa;
(function (spa) {
    var WebClient = (function () {
        function WebClient() {
            this._runnigTaskCount = 0;
            this.onstatechanged = new spa.Notification();
        }
        Object.defineProperty(WebClient.prototype, "isBusy", {
            get: function () {
                return this._runnigTaskCount > 0;
            },
            enumerable: true,
            configurable: true
        });
        WebClient.prototype.get = function (url, queryParams) {
            return this.request(url, 0 /* GET */, queryParams, null);
        };
        WebClient.prototype.getAsync = function (url, queryParams) {
            return this.requestAsync(url, 0 /* GET */, queryParams, null);
        };
        WebClient.prototype.head = function (url, queryParams) {
            return this.request(url, 1 /* HEAD */, queryParams, null);
        };
        WebClient.prototype.headAsync = function (url, queryParams) {
            return this.requestAsync(url, 1 /* HEAD */, queryParams, null);
        };
        WebClient.prototype.post = function (url, data) {
            return this.request(url, 2 /* POST */, null, data);
        };
        WebClient.prototype.postAsync = function (url, data) {
            return this.requestAsync(url, 2 /* POST */, null, data);
        };
        WebClient.prototype.postFileAsync = function (url, fileName, file) {
            var data = new FormData();
            data.append(fileName, file);
            return this.requestAsync(url, 2 /* POST */, null, data);
        };
        WebClient.prototype.put = function (url, data) {
            return this.request(url, 3 /* PUT */, null, data);
        };
        WebClient.prototype.putAsync = function (url, data) {
            return this.requestAsync(url, 3 /* PUT */, null, data);
        };
        WebClient.prototype.delete = function (url, queryParams) {
            return this.request(url, 4 /* DELETE */, queryParams, null);
        };
        WebClient.prototype.deleteAsync = function (url, queryParams) {
            return this.requestAsync(url, 4 /* DELETE */, queryParams, null);
        };
        WebClient.prototype.request = function (url, method, queryParams, data) {
            var request = this.makeRequest(url, method, false, queryParams, data);
            if (request.error != null) {
                throw request.error;
            }
            return request.result;
        };
        WebClient.prototype.requestAsync = function (url, method, queryParams, data) {
            return this.makeRequest(url, method, true, queryParams, data);
        };
        WebClient.prototype.makeRequest = function (url, method, async, queryParams, data) {
            var _this = this;
            var task = spa.Task.run(function (fulfill, reject, progress) {
                var request = new XMLHttpRequest();
                // Fires when the request is canceled, for instance, when the abort() method is called.
                request.onabort = function () {
                    reject(null);
                };
                // Fires when the request fails.
                request.onerror = function (ev) {
                    reject(new spa.HttpException(ev.message, url, request.status));
                };
                // Fires when the request is successfully completed.
                request.onload = function () {
                    if (request.status >= 200 && request.status <= 204) {
                        if (request.response) {
                            fulfill(_this.getResponse(request));
                        }
                        else {
                            fulfill(null);
                        }
                    }
                    else {
                        var errorMessage = request.statusText;
                        try {
                            var response = JSON.parse(request.response);
                            if ("exceptionMessage" in response) {
                                errorMessage = response["exceptionMessage"];
                            }
                            else {
                                if ("message" in response) {
                                    errorMessage = response["message"];
                                }
                            }
                        }
                        catch (e) {
                        }
                        reject(new spa.HttpException(errorMessage, url, request.status));
                    }
                };
                // Fires at server-defined intervals while the request is sending or receiving data.
                request.onprogress = function (ev) {
                    progress(ev.lengthComputable ? 100 * ev.loaded / ev.total : 0);
                };
                // Fires when an author-specified period of time has elapsed.
                request.ontimeout = function () {
                    reject(new spa.Exception("Превышено время ожидания запроса."));
                };
                // preparing url;
                var xhrUrl = url;
                if (method == 0 /* GET */) {
                    xhrUrl += (xhrUrl.indexOf("?") == -1 ? "?" : "&") + "__nocache=" + new Date().getTime();
                }
                if (queryParams != null) {
                    var queryString = null;
                    if (typeof queryParams == 'object') {
                        queryString = spa.JsonSerializer.serializeToQueryString(queryParams);
                    }
                    else {
                        queryString = queryParams.toString();
                    }
                    if (queryString) {
                        xhrUrl += (xhrUrl.indexOf("?") == -1 ? "?" : "&") + queryString;
                    }
                }
                // opening request;
                request.open(HttpRequestMethod[method], xhrUrl, async);
                // preparing data;
                var xhrData = null;
                if (data != null) {
                    if (data instanceof FormData) {
                        xhrData = data;
                    }
                    else {
                        request.setRequestHeader("Content-Type", "application/json");
                        xhrData = JSON.stringify(data, function (key, value) {
                            if (this[key] instanceof Date) {
                                return new Date(this[key].getTime() - this[key].getTimezoneOffset() * 60 * 1000).toISOString();
                            }
                            return value;
                        });
                    }
                }
                // sending data;
                if (xhrData == null) {
                    request.send();
                }
                else {
                    request.send(xhrData);
                }
            });
            this.updateTaskCount(1);
            task.then(function (response) {
                _this.updateTaskCount(-1);
            }, function (error) {
                _this.updateTaskCount(-1);
            });
            return task;
        };
        WebClient.prototype.getResponse = function (request) {
            var contentType = request.getResponseHeader("Content-Type");
            if (contentType.contains("json")) {
                var parsedResponse = null;
                try {
                    parsedResponse = JSON.parse(request.response, function (key, value) {
                        if (typeof value == "string") {
                            // detecting ISO date 
                            // 2014-06-21T00:36:04.472Z; 2014-07-16T00:00:00
                            // 2013-12-31T20:00:00Z
                            if (value[10] == "T") {
                                try {
                                    var date = new Date(value);
                                    if (isNaN(date.getTime())) {
                                        return value;
                                    }
                                    else {
                                        return date;
                                    }
                                }
                                catch (error) {
                                    return value;
                                }
                            }
                        }
                        ;
                        return value;
                    });
                }
                catch (parseException) {
                    parsedResponse = request.response;
                }
                return parsedResponse;
            }
            else {
                return request.responseText;
            }
        };
        WebClient.prototype.updateTaskCount = function (delta) {
            var oldState = this._runnigTaskCount > 0;
            var newState = this._runnigTaskCount + delta > 0;
            this._runnigTaskCount += delta;
            if (oldState != newState) {
                this.onstatechanged.notify({ isBusy: newState });
            }
        };
        WebClient.prototype.dispose = function () {
            this.onstatechanged.dispose();
            this.onstatechanged = null;
        };
        return WebClient;
    })();
    spa.WebClient = WebClient;
    (function (HttpRequestMethod) {
        HttpRequestMethod[HttpRequestMethod["GET"] = 0] = "GET";
        HttpRequestMethod[HttpRequestMethod["HEAD"] = 1] = "HEAD";
        HttpRequestMethod[HttpRequestMethod["POST"] = 2] = "POST";
        HttpRequestMethod[HttpRequestMethod["PUT"] = 3] = "PUT";
        HttpRequestMethod[HttpRequestMethod["DELETE"] = 4] = "DELETE";
    })(spa.HttpRequestMethod || (spa.HttpRequestMethod = {}));
    var HttpRequestMethod = spa.HttpRequestMethod;
    (function (HttpStatusCode) {
        HttpStatusCode[HttpStatusCode["Continue"] = 100] = "Continue";
        HttpStatusCode[HttpStatusCode["SwitchingProtocols"] = 101] = "SwitchingProtocols";
        HttpStatusCode[HttpStatusCode["OK"] = 200] = "OK";
        HttpStatusCode[HttpStatusCode["Created"] = 201] = "Created";
        HttpStatusCode[HttpStatusCode["Accepted"] = 202] = "Accepted";
        HttpStatusCode[HttpStatusCode["NonAuthoritativeInformation"] = 203] = "NonAuthoritativeInformation";
        HttpStatusCode[HttpStatusCode["NoContent"] = 204] = "NoContent";
        HttpStatusCode[HttpStatusCode["ResetContent"] = 205] = "ResetContent";
        HttpStatusCode[HttpStatusCode["PartialContent"] = 206] = "PartialContent";
        HttpStatusCode[HttpStatusCode["MultipleChoices"] = 300] = "MultipleChoices";
        HttpStatusCode[HttpStatusCode["MovedPermanently"] = 301] = "MovedPermanently";
        HttpStatusCode[HttpStatusCode["Found"] = 302] = "Found";
        HttpStatusCode[HttpStatusCode["SeeOther"] = 303] = "SeeOther";
        HttpStatusCode[HttpStatusCode["NotModified"] = 304] = "NotModified";
        HttpStatusCode[HttpStatusCode["UseProxy"] = 305] = "UseProxy";
        HttpStatusCode[HttpStatusCode["Unused"] = 306] = "Unused";
        HttpStatusCode[HttpStatusCode["TemporaryRedirect"] = 307] = "TemporaryRedirect";
        HttpStatusCode[HttpStatusCode["BadRequest"] = 400] = "BadRequest";
        HttpStatusCode[HttpStatusCode["Unauthorized"] = 401] = "Unauthorized";
        HttpStatusCode[HttpStatusCode["PaymentRequired"] = 402] = "PaymentRequired";
        HttpStatusCode[HttpStatusCode["Forbidden"] = 403] = "Forbidden";
        HttpStatusCode[HttpStatusCode["NotFound"] = 404] = "NotFound";
        HttpStatusCode[HttpStatusCode["MethodNotAllowed"] = 405] = "MethodNotAllowed";
        HttpStatusCode[HttpStatusCode["NotAcceptable"] = 406] = "NotAcceptable";
        HttpStatusCode[HttpStatusCode["ProxyAuthenticationRequired"] = 407] = "ProxyAuthenticationRequired";
        HttpStatusCode[HttpStatusCode["RequestTimeout"] = 408] = "RequestTimeout";
        HttpStatusCode[HttpStatusCode["Conflict"] = 409] = "Conflict";
        HttpStatusCode[HttpStatusCode["Gone"] = 410] = "Gone";
        HttpStatusCode[HttpStatusCode["LengthRequired"] = 411] = "LengthRequired";
        HttpStatusCode[HttpStatusCode["PreconditionFailed"] = 412] = "PreconditionFailed";
        HttpStatusCode[HttpStatusCode["RequestEntityTooLarge"] = 413] = "RequestEntityTooLarge";
        HttpStatusCode[HttpStatusCode["RequestUriTooLong"] = 414] = "RequestUriTooLong";
        HttpStatusCode[HttpStatusCode["UnsupportedMediaType"] = 415] = "UnsupportedMediaType";
        HttpStatusCode[HttpStatusCode["RequestedRangeNotSatisfiable"] = 416] = "RequestedRangeNotSatisfiable";
        HttpStatusCode[HttpStatusCode["ExpectationFailed"] = 417] = "ExpectationFailed";
        HttpStatusCode[HttpStatusCode["InternalServerError"] = 500] = "InternalServerError";
        HttpStatusCode[HttpStatusCode["NotImplemented"] = 501] = "NotImplemented";
        HttpStatusCode[HttpStatusCode["BadGateway"] = 502] = "BadGateway";
        HttpStatusCode[HttpStatusCode["ServiceUnavailable"] = 503] = "ServiceUnavailable";
        HttpStatusCode[HttpStatusCode["GatewayTimeout"] = 504] = "GatewayTimeout";
        HttpStatusCode[HttpStatusCode["HttpVersionNotSupported"] = 505] = "HttpVersionNotSupported";
    })(spa.HttpStatusCode || (spa.HttpStatusCode = {}));
    var HttpStatusCode = spa.HttpStatusCode;
    var Http = (function () {
        function Http() {
        }
        Http.get = function (url, queryParams) {
            return Http.webClient.get(url, queryParams);
        };
        Http.getAsync = function (url, queryParams) {
            return Http.webClient.getAsync(url, queryParams);
        };
        Http.head = function (url, queryParams) {
            return Http.webClient.head(url, queryParams);
        };
        Http.headAsync = function (url, queryParams) {
            return Http.webClient.headAsync(url, queryParams);
        };
        Http.post = function (url, data) {
            return Http.webClient.post(url, data);
        };
        Http.postAsync = function (url, data) {
            return Http.webClient.postAsync(url, data);
        };
        Http.postFileAsync = function (url, fileName, file) {
            return Http.webClient.postFileAsync(url, fileName, file);
        };
        Http.put = function (url, data) {
            return Http.webClient.put(url, data);
        };
        Http.putAsync = function (url, data) {
            return Http.webClient.putAsync(url, data);
        };
        Http.delete = function (url, queryParams) {
            return Http.webClient.delete(url, queryParams);
        };
        Http.deleteAsync = function (url, queryParams) {
            return Http.webClient.deleteAsync(url, queryParams);
        };
        Http.requestAsync = function (url, method, queryParams, data) {
            return this.requestAsync(url, method, queryParams, data);
        };
        Http.webClient = new WebClient();
        return Http;
    })();
    spa.Http = Http;
})(spa || (spa = {}));
/** Returns the number of days in the specified month and year. */
function daysInMonth(year, month) {
    var nextMonth = null;
    if (month == 11) {
        nextMonth = new Date(year + 1, 0, 1);
    }
    else {
        nextMonth = new Date(year, month + 1, 1);
    }
    nextMonth.setDate(0);
    return nextMonth.getDate();
}
function parseDate(value, sourceFormat) {
    if (sourceFormat === void 0) { sourceFormat = "yyyy-MM-dd HH:mm:ss"; }
    if (value instanceof Date) {
        return value;
    }
    function extractDatePart(dateString, format, part) {
        if (format.indexOf(part) == -1) {
            return undefined;
        }
        else {
            var result = parseInt(dateString.substr(format.indexOf(part), part.length));
            if (result == null || isNaN(result)) {
                throw "Invalid date string " + value;
            }
            return result;
        }
    }
    if (value) {
        var s = value.toString();
        try {
            var year = extractDatePart(s, sourceFormat, "yyyy");
            var month = extractDatePart(s, sourceFormat, "MM");
            var day = extractDatePart(s, sourceFormat, "dd");
            var hours = extractDatePart(s, sourceFormat, "HH");
            var minutes = extractDatePart(s, sourceFormat, "mm");
            var seconds = extractDatePart(s, sourceFormat, "ss");
            var result = new Date(year, month - 1, day, hours, minutes, seconds);
            if ((result instanceof Date) && !(isNaN(result.getTime()))) {
                return result;
            }
        }
        catch (error) {
        }
    }
    return null;
}
function parseRussianDate(value) {
    return parseDate(value, "dd.MM.yyyy HH:mm:ss");
}
var spa;
(function (spa) {
    var STRIP_COMMENTS = /((\/\/.*$)|(\/\*[\s\S]*?\*\/))/mg;
    var ARGUMENT_NAMES = /([^\s,]+)/g;
    function getFunctionParameterNames(func) {
        var fnStr = func.toString().replace(STRIP_COMMENTS, '');
        var result = fnStr.slice(fnStr.indexOf('(') + 1, fnStr.indexOf(')')).match(ARGUMENT_NAMES);
        if (result === null) {
            result = [];
        }
        return result;
    }
    spa.getFunctionParameterNames = getFunctionParameterNames;
    function getFunctionName(func) {
        var s = func.toString();
        return s.slice(9, s.indexOf("("));
    }
    spa.getFunctionName = getFunctionName;
})(spa || (spa = {}));
function clone(obj) {
    return JSON.parse(JSON.stringify(obj));
}
/** Indicates whether a specified string is null, empty, or consists only of white-space characters. */
function isNullOrWhiteSpace(value) {
    return value == null || value.trim().length == 0;
}
/** Indicates whether the specified string is null or an empty string. */
function isNullOrEmpty(value) {
    return value == null || value.length == 0;
}
function newGuid() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}
//# sourceMappingURL=spa.common-latest.js.map