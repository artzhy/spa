module spa {
    export class Attribute {
    }

    var attributes: any[] = [];

    export function addClassAttribute(objectClass: any, attribute: Attribute) {
        attributes.push({
            objectClass: objectClass,
            attribute: attribute
        });
    }

    export function getClassAttributes(objectClass: any): Attribute[]{
        return attributes.filter(x => x.objectClass == objectClass);
    }

    export function getAttributeClasses(attributeClass: any): any[] {
        return attributes.filter(x => x.attribute instanceof attributeClass);
    }
} 