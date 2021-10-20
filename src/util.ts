import { Type } from "ts-morph";

export function isNotPrimitiveType(type: Type): boolean {
    return (
        !type.isAny() &&
        !type.isUnknown() &&
        !type.isNull() &&
        !type.isNumber() &&
        !type.isNumberLiteral() &&
        !type.isString() &&
        !type.isStringLiteral() &&
        !type.isBoolean() &&
        !type.isBooleanLiteral()
    );
}


export function String2PrimitiveType(str: string = ""): string {
    switch(str){
        case 'String':
        case 'Number':
        case 'Boolean':
            return str.toLocaleLowerCase()
        default:
            return 'any'
    }
}

export function titleCase(str: string): string {
    return str.slice(0, 1).toUpperCase() + str.slice(1).toLowerCase()
}
