/// <reference path="argumentexception.ts" />

module spa {
    export class ArgumentNullException extends ArgumentException {
        constructor(argument: string) {
            super(argument, "Value cannot be null. Parameter name: {0}.".format(argument));
        }
    }
}