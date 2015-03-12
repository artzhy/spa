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
            new();

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
            new(resolver?: (resolve: (value: T) => any, reject: (reason: any) => any) => any);

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
        function reject<T>(reason): Promise<T>;

        /** 
         * Возвращает объект-promise, разрешённый указанным значением. 
         * @param reason
         */
        function resolve<T>(value): Promise<T>;
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