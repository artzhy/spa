/// <reference path="validationattribute.ts" />

module spa {
    export class RequiredAttribute extends ValidationAttribute {
        constructor(errorMessage?: string) {
            if (errorMessage == null) {
                errorMessage = "Требуется значение.";
            }

            super(errorMessage);
        }

        public isValid(value: any, viewModel?: any, propertyName?: string): boolean {
            return value != null;
        }
    }
}