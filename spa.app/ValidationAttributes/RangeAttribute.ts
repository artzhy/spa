/// <reference path="validationattribute.ts" />

module spa {
    export class RangeAttribute extends ValidationAttribute {
        public minimum: number;
        public maximum: number;

        constructor(minimum: number, maximum: number, errorMessage: string) {
            this.maximum = maximum;
            this.minimum = minimum;

            if (errorMessage == null) {
                errorMessage = "Длина строки выходит за допустимые пределы.".format(minimum, maximum);
            }

            super(errorMessage);
        }

        public isValid(value: any, viewModel?: any, propertyName?: string): boolean {
            return value >= this.minimum && value <= this.maximum;
        }
    }
} 