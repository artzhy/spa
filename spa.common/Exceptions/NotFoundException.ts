/// <reference path="exception.ts" />

module spa {
    export class NotFoundException extends Exception {
        constructor(message: string) {
            super(message);
        }
    }
}