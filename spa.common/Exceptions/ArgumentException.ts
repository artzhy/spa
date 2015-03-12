/// <reference path="exception.ts" />

module spa {
    export class ArgumentException extends Exception {
        public argument: string;

        constructor(argument: string, message?: string) {
            super(message);

            if (message === undefined) {
                this.message = "Invalid argument {0}".format(argument);
            }
        }
    }
}