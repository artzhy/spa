/// <reference path="validationattribute.ts" />

module spa {
    export class MaxLengthAttribute extends ValidationAttribute {
        public maxLength: number;

        constructor(maxLength: number, errorMessage: string) {
            this.maxLength = maxLength;

            super(errorMessage);
        }

        public isValid(value: any, viewModel?: any, propertyName?: string): boolean {
            return value == null || this.maxLength == null || value.toString().length <= this.maxLength;
        }

        protected getDefaultErrorMessage() {
            return "Длина строки не должна превышать {0}.".format(this.maxLength);
        }
    }
}  