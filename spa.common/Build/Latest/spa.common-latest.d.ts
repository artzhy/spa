declare module spa {
    interface IDataSource<T> {
        getRows(skip: number, take: number, callback: (rows: T[]) => any): any;
        getRowCount(callback: (count: number) => any): any;
        sort: ISort[];
        onchanged: spa.Notification<any>;
    }
}
declare module spa {
    interface IFilter {
    }
}
declare module spa {
    interface ISort {
        columnName: string;
        ascending: boolean;
    }
}
declare module spa {
    class LocalDataSource<TRow> implements IDataSource<TRow> {
        private _rows;
        private _needResort;
        private _sort;
        private _sortedRows;
        constructor(rows?: TRow[]);
        onchanged: Notification<{}>;
        rows: TRow[];
        sort: ISort[];
        getRows(skip: number, take: number, callback: (rows: any[]) => any): void;
        getRowCount(callback: (count: number) => any): void;
        protected onChanged(): void;
        protected onSort(row1: TRow, row2: TRow, columnName: string): number;
        private sortRows(rows);
    }
}
declare module spa {
    class RemoteDataSource<TRow> implements IDataSource<TRow> {
        private _cache;
        private _cachedCount;
        private _filter;
        private _sort;
        onchanged: Notification<{}>;
        filter: IFilter;
        cacheSize: number;
        sort: ISort[];
        getRows(skip: number, take: number, callback: (rows: TRow[]) => any): void;
        getRowCount(callback: (count: number) => any): void;
        clearCache(): void;
        dataSourceChanged(): void;
        protected query(skip: number, take: number, callback: (rows: TRow[]) => any): void;
        protected queryCount(callback: (count: number) => any): void;
        protected onChanged(): void;
        private isIdenticalObjects(obj1, obj2);
    }
}
declare module spa {
    class Exception {
        message: string;
        constructor(message?: string);
        toString(): string;
    }
}
declare module spa {
    class ArgumentException extends Exception {
        argument: string;
        constructor(argument: string, message?: string);
    }
}
declare module spa {
    class ArgumentNullException extends ArgumentException {
        constructor(argument: string);
    }
}
declare module spa {
    class ArgumentOutOfRangeException extends ArgumentException {
        constructor(argument: string);
    }
}
declare module spa {
    class ForbiddenException extends Exception {
        constructor(message: string);
    }
}
declare module spa {
    class HttpException extends Exception {
        statusCode: HttpStatusCode;
        url: string;
        constructor(message: string, url: string, statusCode: HttpStatusCode);
        toString(): string;
    }
}
declare module spa {
    class NotFoundException extends Exception {
        constructor(message: string);
    }
}
declare module spa {
    class UnauthorizedException extends Exception {
        constructor(message?: string);
    }
}
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
interface Date {
    /** Returns a new Date that adds the specified number of days to the value of this instance. */
    addDays(value: number): Date;
    /** Returns a new Date that adds the specified number of hours to the value of this instance. */
    addHours(value: number): Date;
    /** Returns a new Date that adds the specified number of milliseconds to the value of this instance. */
    addMilliseconds(value: number): Date;
    /** Returns a new Date that adds the specified number of minutes to the value of this instance. */
    addMinutes(value: number): Date;
    /** Returns a new Date that adds the specified number of months to the value of this instance. */
    addMonths(value: number): Date;
    /** Returns a new Date that adds the specified number of seconds to the value of this instance. */
    addSeconds(value: number): Date;
    /** Returns a new Date that adds the specified number of years to the value of this instance. */
    addYears(value: number): Date;
    /** Gets the date component of this instance. */
    date: Date;
    daysAfter(date: Date): number;
    daysBefore(date: Date): number;
    format(format: string): string;
    toRussianDate(): string;
    toRussianDateTime(): string;
    toRussianTime(): string;
}
interface HTMLElement {
    getParentByClassName(className: string): HTMLElement;
    getParentByTagName(tagName: string): HTMLElement;
    isChildOf(parent: HTMLElement): boolean;
    isInDom(): boolean;
    isVisible(): boolean;
    toggleClass(className: string, visible: boolean): any;
}
declare module spa {
}
interface Node {
    getParentByClassName(className: string): HTMLElement;
    getParentByTagName(tagName: string): HTMLElement;
}
interface NodeList {
    toArray(): Node[];
}
interface Number {
    toCurrency(precision?: number): string;
    toNumber(): string;
    round(decimals?: number): number;
}
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
declare module spa {
    interface IPoint {
        x: number | string;
        y: number | string;
    }
}
declare module spa {
    interface ISize {
        height: number | string;
        width: number | string;
    }
}
declare module spa {
    class Attribute {
    }
    function addClassAttribute(objectClass: any, attribute: Attribute): void;
    function addClassMemberAttribute(objectClass: any, memberName: string, attribute: Attribute): void;
    function getClassAttributes(objectClass: any): Attribute[];
    function getClassMemberAttributes(objectClass: any, memberName: string): Attribute[];
    function getAttributeClasses(attributeClass: any): any[];
}
declare module spa {
    class GC {
        private static _container;
        static disposeElement(element: HTMLElement): void;
    }
}
declare module spa {
    class Geocoder {
        private static CitiesWithMetro;
        static getAddress(coordinates: number[]): Task<IGeocodeAddress>;
        static getCoordinates(address: string): Task<IGeocodeCoordinates>;
        private static getDistrict(coordinates);
        private static getMetro(coordinates);
        private static parseAddress(value);
        private static parseXAL(value, xal);
    }
    interface IGeocodeCoordinates {
        bounds: number[][];
        coordinates: number[];
    }
    interface IGeocodeAddress {
        address?: string;
        country?: string;
        area?: string;
        locality?: string;
        district?: string;
        metro?: string;
        street?: string;
        house?: string;
    }
}
declare module spa {
    class Geolocator {
        static getLocation(): Task<IGeolocation>;
    }
    interface IGeolocation {
        coordinates: number[];
        address: IGeocodeAddress;
    }
}
declare module spa {
    class JsonSerializer {
        static serializeToQueryString(object: Object): string;
        static deserializeQueryString<T>(queryString: string): T;
        private static deserializeProperty(object, name, value);
        private static serializeObjectToQueryString(object, parentProperty?);
        private static serializePropertyToQueryString(name, value);
    }
}
declare module spa {
    /** Уведомление. */
    class Notification<TArgs> {
        private _dispatched;
        private _listeners;
        private _args;
        /** Уведомляет подписчиков о событии. */
        notify(args?: TArgs): void;
        /** Уведомляет подписчиков о событии. Последующие подписчики также будут уведомлены о событии. */
        notifyOnce(args?: TArgs): void;
        /** Освобождает ресурсы уведомления и очищает список подпичсчиков. */
        dispose(): void;
        /** Подписаться на событие. */
        subscribe(handler: (args?: TArgs) => any): void;
        /** Отписаться от события. */
        unsubscribe(handler: (args?: TArgs) => any): boolean;
    }
}
declare module spa {
    class Transliterator {
        static toEn(text: string): string;
        static toEnUrl(text: string): string;
    }
}
declare module spa {
    class Validator {
        static isBoolean(value: any): boolean;
        static isDate(value: any): boolean;
        static isEmail(value: any): boolean;
        static isFloat(value: any): boolean;
        static isInteger(value: any): boolean;
        static isPhoneNumber(value: any): boolean;
    }
}
declare module spa {
    class Task<T> {
        private _action;
        private _error;
        private _fulfillHandlers;
        private _percentsComplete;
        private _progressHandlers;
        private _rejectHandlers;
        private _result;
        private _status;
        constructor(action: (fulfill: (result: T) => any, reject: (error: Exception) => any, progress: (percentsComplete: number) => any) => any);
        error: Exception;
        percentsComplete: number;
        result: T;
        status: TaskStatus;
        cancel(): void;
        continueWith(continuation: Task<T>): Task<T>;
        then(onFulfill?: (result: T) => any, onReject?: (error: Exception) => any, onProgress?: (percentsComplete: number) => any): Task<T>;
        private progress(percentsComplete);
        private reject(error);
        private fulfill(result);
        start(): void;
        static run<T>(action: (fullfill: (result?: T) => any, reject?: (error?: Exception) => any, progress?: (percentsComplete?: number) => any) => any): Task<T>;
        static when<T1>(task1: Task<T1>, ready: (result1: T1, error: Exception) => any): any;
        static when<T1, T2>(task1: Task<T1>, task2: Task<T2>, ready: (result1: T1, result2: T2, error: Exception) => any): any;
        static when<T1, T2, T3>(task1: Task<T1>, task2: Task<T2>, task3: Task<T3>, ready: (result1: T1, result2: T2, result3: T3, error: Exception) => any): any;
        static when<T1, T2, T3, T4>(task1: Task<T1>, task2: Task<T2>, task3: Task<T3>, task4: Task<T4>, ready: (result1: T1, result2: T2, result3: T3, result4: T4, error: Exception) => any): any;
        static whenAll<T>(...params: Task<T>[]): Task<T[]>;
        static fromResult<T>(result: T): Task<T>;
    }
    enum TaskStatus {
        Fulfilled = 0,
        Rejected = 1,
        Pending = 2,
    }
    function async<T>(work: (done: (result?: T) => void, error?: (exception: any) => void) => any): Task<T>;
    function await<T1>(task: Task<T1>, done: (result1?: T1) => any): any;
    function await<T1, T2>(task1: Task<T1>, task2: Task<T2>, done: (result1: T1, result2: T2) => any): any;
    function await<T1, T2, T3>(task1: Task<T1>, task2: Task<T2>, task3: Task<T3>, done: (result1: T1, result2: T2, result3: T3) => any): any;
    function await<T1, T2, T3, T4>(task1: Task<T1>, task2: Task<T2>, task3: Task<T3>, task4: Task<T4>, done: (result1: T1, result2: T2, result3: T3, result4: T4) => any): any;
}
declare module spa {
    class WebClient {
        private _runnigTaskCount;
        constructor();
        onstatechanged: Notification<IHttpClientStateChangedEventArgs>;
        isBusy: boolean;
        get<TResponse>(url: string, queryParams?: any): TResponse;
        getAsync<TResponse>(url: string, queryParams?: any): Task<TResponse>;
        head<TResponse>(url: string, queryParams?: any): TResponse;
        headAsync<TResponse>(url: string, queryParams?: any): Task<TResponse>;
        post<TResponse>(url: string, data?: any): TResponse;
        postAsync<TResponse>(url: string, data?: any): Task<TResponse>;
        postFileAsync<TResponse>(url: string, fileName: string, file: File): Task<TResponse>;
        put<TResponse>(url: string, data?: any): TResponse;
        putAsync<TResponse>(url: string, data?: any): Task<TResponse>;
        delete<TResponse>(url: string, queryParams?: any): TResponse;
        deleteAsync<TResponse>(url: string, queryParams?: any): Task<TResponse>;
        request<TResponse>(url: string, method: HttpRequestMethod, queryParams?: any, data?: any): TResponse;
        requestAsync<TResponse>(url: string, method: HttpRequestMethod, queryParams?: any, data?: any): Task<TResponse>;
        private makeRequest<TResponse>(url, method, async, queryParams?, data?);
        private getResponse(request);
        private updateTaskCount(delta);
        dispose(): void;
    }
    interface IHttpClientStateChangedEventArgs {
        isBusy: boolean;
    }
    enum HttpRequestMethod {
        GET = 0,
        HEAD = 1,
        POST = 2,
        PUT = 3,
        DELETE = 4,
    }
    enum HttpStatusCode {
        Continue = 100,
        SwitchingProtocols = 101,
        OK = 200,
        Created = 201,
        Accepted = 202,
        NonAuthoritativeInformation = 203,
        NoContent = 204,
        ResetContent = 205,
        PartialContent = 206,
        MultipleChoices = 300,
        MovedPermanently = 301,
        Found = 302,
        SeeOther = 303,
        NotModified = 304,
        UseProxy = 305,
        Unused = 306,
        TemporaryRedirect = 307,
        BadRequest = 400,
        Unauthorized = 401,
        PaymentRequired = 402,
        Forbidden = 403,
        NotFound = 404,
        MethodNotAllowed = 405,
        NotAcceptable = 406,
        ProxyAuthenticationRequired = 407,
        RequestTimeout = 408,
        Conflict = 409,
        Gone = 410,
        LengthRequired = 411,
        PreconditionFailed = 412,
        RequestEntityTooLarge = 413,
        RequestUriTooLong = 414,
        UnsupportedMediaType = 415,
        RequestedRangeNotSatisfiable = 416,
        ExpectationFailed = 417,
        InternalServerError = 500,
        NotImplemented = 501,
        BadGateway = 502,
        ServiceUnavailable = 503,
        GatewayTimeout = 504,
        HttpVersionNotSupported = 505,
    }
    class Http {
        private static webClient;
        static get<TResponse>(url: string, queryParams?: any): TResponse;
        static getAsync<TResponse>(url: string, queryParams?: any): Task<TResponse>;
        static head<TResponse>(url: string, queryParams?: any): TResponse;
        static headAsync<TResponse>(url: string, queryParams?: any): Task<TResponse>;
        static post<TResponse>(url: string, data?: any): TResponse;
        static postAsync<TResponse>(url: string, data?: any): Task<TResponse>;
        static postFileAsync<TResponse>(url: string, fileName: string, file: File): Task<TResponse>;
        static put<TResponse>(url: string, data?: any): TResponse;
        static putAsync<TResponse>(url: string, data?: any): Task<TResponse>;
        static delete<TResponse>(url: string, queryParams?: any): TResponse;
        static deleteAsync<TResponse>(url: string, queryParams?: any): Task<TResponse>;
        static requestAsync<TResponse>(url: string, method: HttpRequestMethod, queryParams?: any, data?: any): Task<TResponse>;
    }
}
declare module ymaps {
    /**
    * Обрабатывает запросы геокодирования. Результат запроса может быть представлен в формате JSON или в виде объекта GeoObjectCollection.
    * @param request String | Number[] Адрес, для которого необходимо определить координаты (прямое геокодирование) или координаты, для которых необходимо определить адрес (обратное геокодирование).
    * @param options Опции.
    */
    function geocode(request: any, options?: IGeocodeOptions): vow.Promise<any>;
    /**
     * Выполняет переданную в параметре функцию, когда API и DOM готовы к использованию.
     * @param successCallback Функция, которая будет вызвана при успешной загрузке и инициализации API и DOM. В функцию не будут переданы аргументы.
     * @param errorCallback Функция, которая будет вызвана если произошла ошибка при инициализации. В функцию будет передана ошибка.
     * @param context Контекст исполнения функции.
     */
    function ready(successCallback?: () => any, errorCallback?: () => any, context?: any): vow.Promise<any>;
    /** Содержит методы для создания и обработки объектов-promise. */
    module vow {
        /**
         * Класс, описывающий объекты-deferred.
         */
        class Deffered<T> {
            /** Создаёт объект-deferred. */
            new(): any;
            /** Возвращает связанный объект - promise. */
            promise(): Promise<T>;
            /**
             * Отклоняет связанный объект-promise с указанной причиной.
             * @param reason Причина отклонения.
            */
            reject(reason: any): void;
            /**
             * Разрешает связанный объект-promise указанным значением.
             * @param value Значение.
            */
            resolve(value: T): void;
        }
        /**
         * Класс, описывающий объекты-promise.
         */
        class Promise<T> {
            /**
             * Создаёт объект-promise.
             * @param resolver Функция, которая принимает в качестве параметров методы resolve и reject для установки состояния и значения создаваемому объекту-promise.
             */
            new(resolver?: (resolve: (value: T) => any, reject: (reason: any) => any) => any): any;
            /**
            * Аналог метода vow.Promise.then, завершающий цепочку промисов. Кидает исключение в случае отклонения объекта-promise.
            * @param onFulfilled Функция обратного вызова, которая будет вызвана в случае если объект-promise будет разрешён.
            * @param onRejected Функция обратного вызова, которая будет вызвана в случае если объект-promise будет отклонён.
            * @param onProgress Функция обратного вызова, которая будет вызвана при "оповещении" объекта-promise.
            * @param ctx Контекст выполнения функций обратного вызова.
            */
            done(onFulfilled?: (value: T) => any, onRejected?: (reason: any) => any, onProgress?: () => any, ctx?: any): void;
            /**
            * Аналог метода vow.Promise.then, вызывающий функции обратного вызова с набором аргументов, соответствующим массиву, которым будет разрешён/отклонён объект-promise. Обычно используется в сочетании с методами типа vow.all.
            * @param onFulfilled Функция обратного вызова, которая будет вызвана в случае если объект-promise будет разрешён.
            * @param onRejected Функция обратного вызова, которая будет вызвана в случае если объект-promise будет отклонён.
            * @param ctx Контекст выполнения функций обратного вызова.
            */
            spread(onFulfilled?: (value: T) => any, onRejected?: (reason: any) => any, ctx?: any): Promise<T>;
            /**
            * Задаёт функцию-обработчик для объекта-promise.
            * @param onFulfilled Функция обратного вызова, которая будет вызвана в случае если объект-promise будет разрешён.
            * @param onRejected Функция обратного вызова, которая будет вызвана в случае если объект-promise будет отклонён.
            * @param onProgress Функция обратного вызова, которая будет вызвана при "оповещении" объекта-promise.
            * @param ctx Контекст выполнения функций обратного вызова.
            */
            then(onFulfilled?: (value: T) => any, onRejected?: (reason: any) => any, onProgress?: () => any, ctx?: any): Promise<T>;
            /** Возвращает значение для разрешённого объекта-promise или причину отклонения для отклонённого. */
            valueOf(): any;
        }
        /**
         * Возвращает объект-promise, который будет разрешен или отклонён только когда будут разрешены или отклонены все указанные объекты.
         * @param iterable Object | Object[] Набор объектов-promise и/или значений.
         */
        function all<T>(iterable: any): Promise<T>;
        /**
         * Создаёт новый deferred-объект. Эквивалент для `new ymaps.vow.Deferred()`.
         */
        function defer<T>(): Deffered<T>;
        /**
         * Возвращает объект-promise, отклонённый с указанной причиной.
         * @param reason
         */
        function reject<T>(reason: any): Promise<T>;
        /**
         * Возвращает объект-promise, разрешённый указанным значением.
         * @param reason
         */
        function resolve<T>(value: any): Promise<T>;
    }
    var Map: any;
    var Placemark: any;
    var geolocation: any;
    interface IGeocodeOptions {
        /** Прямоугольная область на карте, в которой предположительно находится искомый объект. */
        boundedBy?: number[][];
        /** Если true, то в функцию-обработчик передается JSON. В противном случае в функцию обработчик передается объект, содержащий в поле geoObjects результаты геокодирования в виде коллекции GeoObjectCollection. */
        json?: boolean;
        /** Вид топонима (только для обратного геокодирования). Список возможных значений: house - дом; street - улица; metro - станция метро; district - район города; locality - населенный пункт (город/поселок/деревня/село/...). */
        kind?: string;
        /** IGeocodeProvider | String Провайдер геокодирования. Можно воспользоваться одним из стандартных провайдеров: 'yandex#map' - поиск по карте; 'yandex#publicMap' - поиск по народной карте. */
        provider?: any;
        /** Integer Максимальное количество возвращаемых результатов. */
        results?: number;
        /** Определяет каким образом нужно интрепретировать координаты в запросе. */
        searchCoordOrder?: string;
        /** Integer Число результатов, которое необходимо пропустить. */
        skip?: number;
        /** Искать только внутри области, заданной опцией boundedBy. */
        strictBounds?: boolean;
    }
}
declare module "ymaps" {
    export = ymaps;
}
/** Returns the number of days in the specified month and year. */
declare function daysInMonth(year: any, month: any): number;
declare function parseDate(value: any, sourceFormat?: string): Date;
declare function parseRussianDate(value: any): Date;
declare module spa {
    function getFunctionParameterNames(func: Function): string[];
    function getFunctionName(func: Function): string;
}
declare function clone<T>(obj: T): any;
/** Indicates whether a specified string is null, empty, or consists only of white-space characters. */
declare function isNullOrWhiteSpace(value: string): boolean;
/** Indicates whether the specified string is null or an empty string. */
declare function isNullOrEmpty(value: string): boolean;
declare function newGuid(): string;
