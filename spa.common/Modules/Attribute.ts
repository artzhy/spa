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

    export function addClassMemberAttribute(objectClass: any, memberName: string, attribute: Attribute) {
        attributes.push({
            objectClass: objectClass,
            attribute: attribute,
            memberName: memberName
        });
    }

    export function getClassAttributes(objectClass: any): Attribute[]{
        return attributes.filter(x => x.objectClass == objectClass).map(x => x.attribute);
    }

    export function getClassMemberAttributes(objectClass: any, memberName: string): Attribute[] {
        return attributes.filter(x => x.objectClass == objectClass && x.memberName == memberName).map(x => x.attribute);
    }

    export function getAttributeClasses(attributeClass: any): any[]{
        return attributes.filter(x => x.attribute instanceof attributeClass).map(x => x.objectClass);
    }
} 