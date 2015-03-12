module spa {
    export class Validator {
        public static isBoolean(value: any): boolean {
            if (value != null) {
                if (typeof value === "boolean") {
                    return true;
                }

                return value == "true" || value == "false";
            }

            return false;
        }

        public static isDate(value: any): boolean {
            if (value != null) {
                if (value instanceof Date) {
                    return true;
                }

                var text: string = value.toString();

                if (text.indexOf(".") == -1) {
                    return parseDate(value) != null;
                }
                else {
                    return parseRussianDate(value) != null;
                }
            }

            return false;
        }

        public static isEmail(value: any): boolean {
            if (value != null) {
                return /^[-А-яёA-z0-9][-А-яёA-z0-9.]+@([А-яёA-z0-9][-А-яёA-z0-9]+\.)+[А-яёA-z]{2,4}$/.test(value);
            }

            return false;
        }

        public static isFloat(value: any): boolean {
            if (value != null) {
                if (typeof value === "number") {
                    return true;
                }

                return parseFloat(value) != NaN;
            }

            return false;
        }

        public static isInteger(value: any): boolean {
            if (value != null) {
                if (typeof value === "number") {
                    return parseInt(value) == value;
                }

                var parseResult = parseFloat(value);

                if (parseResult != NaN) {
                    return parseInt(value) == parseResult;
                }
            }

            return false;
        }

        public static isPhoneNumber(value: any): boolean {
            if (value == null) {
                return false;
            }

            var text: string = typeof value === "string" ? value : value.toString();

            if (text.length == 0) {
                return false;
            }

            var digits = 0;

            for (var i = 0; i < text.length; i++) {
                if (text[i] >= "0" && text[i] <= "9") {
                    digits++;
                }
            }

            return digits == 11;
        }
    }
} 