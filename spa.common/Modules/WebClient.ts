/// <reference path="../modules/notification.ts" />
/// <reference path="../modules/task.ts" />

module spa {
    export class WebClient {
        private _runnigTaskCount = 0;

        constructor() {
            this.onstatechanged = new Notification<IHttpClientStateChangedEventArgs>();
        }

        public onstatechanged: Notification<IHttpClientStateChangedEventArgs>;

        public get isBusy(): boolean {
            return this._runnigTaskCount > 0;
        }

        public get<TResponse>(url: string, queryParams?: any): TResponse {
            return this.request<TResponse>(url, HttpRequestMethod.GET, queryParams, null);
        }

        public getAsync<TResponse>(url: string, queryParams?: any): Task<TResponse> {
            return this.requestAsync<TResponse>(url, HttpRequestMethod.GET, queryParams, null);
        }

        public head<TResponse>(url: string, queryParams?: any): TResponse {
            return this.request<TResponse>(url, HttpRequestMethod.HEAD, queryParams, null);
        }

        public headAsync<TResponse>(url: string, queryParams?: any): Task<TResponse> {
            return this.requestAsync<TResponse>(url, HttpRequestMethod.HEAD, queryParams, null);
        }

        public post<TResponse>(url: string, data?: any): TResponse {
            return this.request<TResponse>(url, HttpRequestMethod.POST, null, data);
        }

        public postAsync<TResponse>(url: string, data?: any): Task<TResponse> {
            return this.requestAsync<TResponse>(url, HttpRequestMethod.POST, null, data);
        }

        public postFileAsync<TResponse>(url: string, fileName: string, file: File): Task<TResponse> {
            var data = new FormData();
            data.append(fileName, file);

            return this.requestAsync<TResponse>(url, HttpRequestMethod.POST, null, data);
        }

        public put<TResponse>(url: string, data?: any): TResponse {
            return this.request<TResponse>(url, HttpRequestMethod.PUT, null, data);
        }

        public putAsync<TResponse>(url: string, data?: any): Task<TResponse> {
            return this.requestAsync<TResponse>(url, HttpRequestMethod.PUT, null, data);
        }

        public delete<TResponse>(url: string, queryParams?: any): TResponse {
            return this.request<TResponse>(url, HttpRequestMethod.DELETE, queryParams, null);
        }

        public deleteAsync<TResponse>(url: string, queryParams?: any): Task<TResponse> {
            return this.requestAsync<TResponse>(url, HttpRequestMethod.DELETE, queryParams, null);
        }

        public request<TResponse>(url: string, method: HttpRequestMethod, queryParams?: any, data?: any): TResponse {
            var request = this.makeRequest<TResponse>(url, method, false, queryParams, data);

            if (request.error != null) {
                throw request.error;
            }

            return request.result;
        }

        public requestAsync<TResponse>(url: string, method: HttpRequestMethod, queryParams?: any, data?: any): Task<TResponse> {
            return this.makeRequest<TResponse>(url, method, true, queryParams, data);
        }

        private makeRequest<TResponse>(url: string, method: HttpRequestMethod, async: boolean, queryParams?: any, data?: any): Task<TResponse> {
            var task = Task.run<TResponse>((fulfill, reject, progress) => {
                var request = new XMLHttpRequest();

                // Fires when the request is canceled, for instance, when the abort() method is called.
                request.onabort = () => {
                    reject(null);
                };

                // Fires when the request fails.
                request.onerror = (ev) => {
                    reject(new HttpException(ev.message, url, request.status));
                };

                // Fires when the request is successfully completed.
                request.onload = () => {
                    if (request.status >= 200 && request.status <= 204) {
                        if (request.response) {
                            fulfill(this.getResponse(request));
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

                        reject(new HttpException(errorMessage, url, request.status));
                    }
                };

                // Fires at server-defined intervals while the request is sending or receiving data.
                request.onprogress = (ev) => {
                    progress(ev.lengthComputable ? 100 * ev.loaded / ev.total : 0);
                };

                // Fires when an author-specified period of time has elapsed.
                request.ontimeout = () => {
                    reject(new Exception("Превышено время ожидания запроса."));
                };

                // preparing url;
                var xhrUrl = url;

                if (method == HttpRequestMethod.GET) {
                    xhrUrl += (xhrUrl.indexOf("?") == -1 ? "?" : "&") + "__nocache=" + new Date().getTime();
                }

                if (queryParams != null) {
                    var queryString = null;

                    if (typeof queryParams == 'object') {
                        queryString = JsonSerializer.serializeToQueryString(queryParams);
                    } else {
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
                } else {
                    request.send(xhrData);
                }
            });

            this.updateTaskCount(1);

            task.then(
                (response) => {
                    this.updateTaskCount(-1);
                },
                (error) => {
                    this.updateTaskCount(-1);
                });

            return task;
        }

        private getResponse(request: XMLHttpRequest): any {
            var contentType = request.getResponseHeader("Content-Type");

            if (contentType.contains("json")) {
                var parsedResponse = null;

                try {
                    parsedResponse = JSON.parse(request.response,(key, value) => {
                        if (typeof value == "string") {
                            // detecting ISO date 
                            // 2014-06-21T00:36:04.472Z; 2014-07-16T00:00:00
                            // 2013-12-31T20:00:00Z
                            if (value[10] == "T") {
                                try {
                                    var date = new Date(value);

                                    if (isNaN(date.getTime())) {
                                        return value;
                                    } else {
                                        return date;
                                    }
                                }
                                catch (error) {
                                    return value;
                                }
                            }
                        };

                        return value;
                    });
                }
                catch (parseException) {
                    parsedResponse = request.response;
                }

                return parsedResponse;
            } else {
                return request.responseText;
            }
        }

        private updateTaskCount(delta: number): void {
            var oldState = this._runnigTaskCount > 0;
            var newState = this._runnigTaskCount + delta > 0;

            this._runnigTaskCount += delta;

            if (oldState != newState) {
                this.onstatechanged.notify({ isBusy: newState });
            }
        }

        public dispose() {
            this.onstatechanged.dispose();
            this.onstatechanged = null;
        }
    }

    export interface IHttpClientStateChangedEventArgs {
        isBusy: boolean;
    }

    export enum HttpRequestMethod {
        GET,
        HEAD,
        POST,
        PUT,
        DELETE
    }

    export enum HttpStatusCode {
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
        HttpVersionNotSupported = 505
    }

    export class Http {
        private static webClient = new WebClient();

        public static get<TResponse>(url: string, queryParams?: any): TResponse {
            return Http.webClient.get<TResponse>(url, queryParams);
        }

        public static getAsync<TResponse>(url: string, queryParams?: any): Task<TResponse> {
            return Http.webClient.getAsync<TResponse>(url, queryParams);
        }

        public static head<TResponse>(url: string, queryParams?: any): TResponse {
            return Http.webClient.head<TResponse>(url, queryParams);
        }

        public static headAsync<TResponse>(url: string, queryParams?: any): Task<TResponse> {
            return Http.webClient.headAsync<TResponse>(url, queryParams);
        }

        public static post<TResponse>(url: string, data?: any): TResponse {
            return Http.webClient.post<TResponse>(url, data);
        }

        public static postAsync<TResponse>(url: string, data?: any): Task<TResponse> {
            return Http.webClient.postAsync<TResponse>(url, data);
        }

        public static postFileAsync<TResponse>(url: string, fileName: string, file: File): Task<TResponse> {
            return Http.webClient.postFileAsync<TResponse>(url, fileName, file);
        }

        public static put<TResponse>(url: string, data?: any): TResponse {
            return Http.webClient.put<TResponse>(url, data);
        }

        public static putAsync<TResponse>(url: string, data?: any): Task<TResponse> {
            return Http.webClient.putAsync<TResponse>(url, data);
        }

        public static delete<TResponse>(url: string, queryParams?: any): TResponse {
            return Http.webClient.delete<TResponse>(url, queryParams);
        }

        public static deleteAsync<TResponse>(url: string, queryParams?: any): Task<TResponse> {
            return Http.webClient.deleteAsync<TResponse>(url, queryParams);
        }

        public static requestAsync<TResponse>(url: string, method: HttpRequestMethod, queryParams?: any, data?: any): Task<TResponse> {
            return this.requestAsync<TResponse>(url, method, queryParams, data);
        }
    }
}