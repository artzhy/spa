/// <reference path="exception.ts" />

module spa {
    export class ForbiddenException extends Exception {
        constructor(message: string) {
            super(message);
        }
    }
}