module spa {
    export class Exception {
        public message: string;

        constructor(message?: string) {
            this.message = message;
        }

        public toString(): string {
            return this.message;
        }
    }
} 