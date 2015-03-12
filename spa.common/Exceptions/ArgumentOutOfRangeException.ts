/// <reference path="argumentexception.ts" />

module spa {
    export class ArgumentOutOfRangeException extends ArgumentException {
        constructor(argument: string) {
            super(argument, "Specified argument was out of the range of valid values. Parameter name: {0}.".format(argument));
        }
    }
}