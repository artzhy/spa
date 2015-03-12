module spa.controls {
    export class Component {
        private _propertySubscriptions: KnockoutSubscription[] = [];

        constructor(params: any) {
        }

        public createObservableProperty<T>(propertyName: string, value: T, sourceProperty: any): void {
            if (sourceProperty == null) {
                this[propertyName] = ko.observable<T>(value);
            } else {
                if (ko.isObservable(sourceProperty)) {
                    if (ko.isComputed(sourceProperty)) {
                        this[propertyName] = ko.observable<T>(ko.unwrap(sourceProperty));

                        this._propertySubscriptions.push(sourceProperty.subscribe((newValue) => {
                            if (!this.compare(this[propertyName](), newValue)) {
                                this[propertyName](newValue);
                            }
                        }));
                    } else {
                        this[propertyName] = sourceProperty;
                    }
                }
                else {
                    this[propertyName] = ko.observable<T>(sourceProperty);
                }
            }
        }

        public createObservableArrayProperty<T>(propertyName: string, value: T[], sourceProperty: any): void {
            if (sourceProperty == null) {
                this[propertyName] = ko.observableArray<T>(value);
            } else {
                if (ko.isObservable(sourceProperty)) {
                    if (ko.isComputed(sourceProperty)) {
                        this[propertyName] = ko.observableArray<T>(ko.unwrap(sourceProperty));

                        this._propertySubscriptions.push(sourceProperty.subscribe((newValue) => {
                            this[propertyName](newValue);
                        }));
                    } else {
                        this[propertyName] = sourceProperty;
                    }
                }
                else {
                    this[propertyName] = ko.observableArray<T>(sourceProperty);
                }
            }
        }

        public compare(value1: any, value2: any): boolean {
            if (value1 === undefined || value2 === undefined) {
                return value1 === undefined && value2 === undefined;
            }

            if (value1 === null || value2 === null) {
                return value1 === null && value2 === null;
            }

            if (typeof value1 == "number" || typeof value2 == "number") {
                return (value1 == value2) || (isNaN(value1) && isNaN(value2));
            }

            if (value1 instanceof Date || value2 instanceof Date) {
                return value1.toString() == value2.toString();
            }

            return value1 === value2;
        }

        public subscribe<T>(property: KnockoutObservable<T>, handler: (newValue: T) => any): void {
            this._propertySubscriptions.push(property.subscribe(handler));
        }

        public subscribeArrayChange<T>(property: KnockoutObservable<T>, added?: (value: T) => any, removed?: (value: T) => any): void {
            this._propertySubscriptions.push(property.subscribe((changes: any[]) => {
                changes.forEach((change: any) => {
                    if (change.status == "added") {
                        if (added != null) {
                            added(change.value);
                        }
                    } else {
                        if (change.status == "deleted") {
                            if (removed != null) {
                                removed(change.value);
                            }
                        }
                    }
                });
            }, null, "arrayChange"));
        }

        public ensureParametersValid(validParameters: string[], params: any, componentName?: string) {
            if (params != null) {
                Object.getOwnPropertyNames(params).forEach((propertyName) => {
                    if (validParameters.indexOf(propertyName) == -1 && propertyName != "$raw") {
                        if (componentName === undefined) {
                            throw "Invalid parameter name: " + propertyName;
                        }
                        else {
                            throw "Invalid parameter name: " + propertyName + " (component name: " + componentName + ")";
                        }
                    }
                });
            }
            Object
        }

        public dispose(): void {
            this._propertySubscriptions.forEach((subscription) => {
                subscription.dispose();
            });

            this._propertySubscriptions.length = 0;
        }
    }
}