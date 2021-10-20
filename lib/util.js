"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.titleCase = exports.String2PrimitiveType = exports.isNotPrimitiveType = void 0;
function isNotPrimitiveType(type) {
    return (!type.isAny() &&
        !type.isUnknown() &&
        !type.isNull() &&
        !type.isNumber() &&
        !type.isNumberLiteral() &&
        !type.isString() &&
        !type.isStringLiteral() &&
        !type.isBoolean() &&
        !type.isBooleanLiteral());
}
exports.isNotPrimitiveType = isNotPrimitiveType;
function String2PrimitiveType(str) {
    if (str === void 0) { str = ""; }
    switch (str) {
        case 'String':
        case 'Number':
        case 'Boolean':
            return str.toLocaleLowerCase();
        default:
            return 'any';
    }
}
exports.String2PrimitiveType = String2PrimitiveType;
function titleCase(str) {
    return str.slice(0, 1).toUpperCase() + str.slice(1).toLowerCase();
}
exports.titleCase = titleCase;
