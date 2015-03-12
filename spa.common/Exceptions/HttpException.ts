/// <reference path="exception.ts" />

module spa {
    export class HttpException extends Exception {
        public statusCode: HttpStatusCode;
        public url: string;

        constructor(message: string, url: string, statusCode: HttpStatusCode) {
            super(message);

            this.statusCode = statusCode;
            this.url = url;
        }

        public toString(): string {
            if (isNullOrWhiteSpace(this.message)) {
                return "{0}, {1}".format(this.statusCode, this.url);
            }
            else {
                return this.message;
            }
        }
    }
}