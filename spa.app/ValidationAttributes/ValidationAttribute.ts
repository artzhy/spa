module spa {
    export class ValidationAttribute extends Attribute {
        private _errorMessage: string;

        constructor(errorMessage?: string) {
            super();

            this._errorMessage = errorMessage;
        }

        public get errorMessage() {
            if (isNullOrWhiteSpace(this._errorMessage)) {
                return this.getDefaultErrorMessage();
            }

            return this._errorMessage;
        }

        public set errorMessage(value: string) {
            this._errorMessage = value;
        }

        public isValid(value: any, viewModel?: any, propertyName?: string): boolean {
            return true;
        }

        protected getDefaultErrorMessage() {
            return "Поле содержит недопустимое значение.";
        }
    }
}