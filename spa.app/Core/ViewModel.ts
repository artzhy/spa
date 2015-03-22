module spa {
    export class ViewModel {
        protected getValidationErrors(): IValidationError[]{
            var viewModelClass = this.constructor;
            var viewModelErrors: IValidationError[] = [];

            for (var memberName in this) {
                var memberAttributes = <ValidationAttribute[]>getClassMemberAttributes(viewModelClass, memberName).filter(x => x instanceof ValidationAttribute);

                if (memberAttributes.length > 0) {
                    var value = ko.unwrap(this[memberName]);

                    memberAttributes.forEach((attribute) => {
                        if (!attribute.isValid(value, this, memberName)) {
                            viewModelErrors.push({ errorText: attribute.errorMessage, propertyName: memberName });
                        }
                    });
                }
            }

            return viewModelErrors;
        }

        public valid = ko.pureComputed(() => {
            return this.validationErrors() != null || this.validationErrors().length == 0;
        });

        public validationErrors = ko.pureComputed(() => {
            return this.getValidationErrors();
        });
    }

    export function addValidationAttribute(viewModelType: any, memberName: string, attributeType: any, attributeProperties?: any) {
        var attribute = new attributeType();

        if (attributeProperties != null) {
            Object.getOwnPropertyNames(attributeProperties).forEach((propertyName) => {
                attribute[propertyName] = attributeProperties[propertyName];
                //if (propertyName in attribute) {
                //} else {
                //    throw new Exception("Не удалось создать атрибут валидации {0} модели представления {1}. Свойство {2} не найдено.".format(
                //        getFunctionName(viewModelType),
                //        getFunctionName(attributeType),
                //        propertyName));
                //}
            });
        }

        addClassMemberAttribute(viewModelType, memberName, attribute);
    }
}