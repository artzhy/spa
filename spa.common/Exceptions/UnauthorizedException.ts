/// <reference path="exception.ts" />

module spa {
    export class UnauthorizedException extends Exception {
        constructor(message?: string) {
            super(message);
        }
    }
} 