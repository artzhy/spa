module spa {
    export class JsonSerializer {
        public static serializeToQueryString(object: Object): string {
            return JsonSerializer.serializeObjectToQueryString(object);
        }

        public static deserializeQueryString<T>(queryString: string): T {
            if (isNullOrWhiteSpace(queryString)) {
                return null;
            }

            var result: any = {};

            queryString.split("&").forEach((param) => {
                JsonSerializer.deserializeProperty(result, decodeURIComponent(param.split("=")[0]), decodeURIComponent(param.split("=")[1]));
            });

            return result;
        }

        private static deserializeProperty(object: any, name: string, value: any): void {
            var nameParts = name.split(".");
            name = nameParts[0];

            var arrayIndex = -1;

            if (name.contains("[")) {
                arrayIndex = parseInt(name.substring(name.indexOf("[") + 1, name.length - 1));
                name = name.substring(0, name.indexOf("["));
            }

            if (nameParts.length == 1) {
                // detecting number;
                if (!isNaN(value)) {
                    value = parseFloat(value);
                } else {
                    // detecting boolean;
                    if (value == "true" || value == "false") {
                        value = value == "true";
                    } else {
                        // detecting ISO date 2014-06-21T00:36:04.472Z;
                        if (value[10] == "T") {
                            try {
                                value = new Date(value);
                            }
                            catch (error) {
                            }
                        }
                    }
                }

                if (arrayIndex == -1) {
                    object[name] = value;
                }
                else {
                    if (object[name] == null) {
                        object[name] = [];
                    }

                    object[name][arrayIndex] = value;
                }
            }
            else {
                if (arrayIndex == -1) {
                    if (object[name] == null) {
                        object[name] = {};
                    }

                    JsonSerializer.deserializeProperty(object[name], nameParts.slice(1).join("."), value);
                }
                else {
                    if (object[name] == null) {
                        object[name] = [];
                    }

                    if (object[name][arrayIndex] == null) {
                        object[name][arrayIndex] = {};
                    }

                    JsonSerializer.deserializeProperty(object[name][arrayIndex], nameParts.slice(1).join("."), value);
                }
            }
        }

        private static serializeObjectToQueryString(object: Object, parentProperty?: string): string {
            var properties = [];

            for (var memberName in object) {
                if (typeof object[memberName] != "function") {
                    properties.push(memberName);
                }
            }

            return properties
                .map(name => JsonSerializer.serializePropertyToQueryString(parentProperty == null ? name : parentProperty + "." + name, object[name]))
                .join("&");
        }

        private static serializePropertyToQueryString(name: string, value: any): string {
            if (isNullOrWhiteSpace(value == null ? null : value.toString())) {
                return name;
            }

            if (value instanceof Array) {
                return value.map((v, i) => JsonSerializer.serializePropertyToQueryString(name + "[" + i + "]", v)).join("&");
            }

            if (value instanceof Date) {
                value = value.toUTCString();
            }

            if (value instanceof Object) {
                return JsonSerializer.serializeObjectToQueryString(value, name);
            }
            else {
                return encodeURIComponent(name) + "=" + encodeURIComponent(value);
            }
        }
    }
} 