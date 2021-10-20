"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
Object.defineProperty(exports, "__esModule", { value: true });
var ts_morph_1 = require("ts-morph");
var typescript_1 = require("typescript");
var util_1 = require("./util");
var VueClassComponentBuilder = /** @class */ (function () {
    function VueClassComponentBuilder() {
        this.LIFECYCLE_HOOKS = [
            "beforeCreate",
            "created",
            "beforeMount",
            "mounted",
            "beforeUpdate",
            "updated",
            "beforeDestroy",
            "destroyed",
            "activated",
            "deactivated",
            "errorCaptured",
        ];
        this.lifecycle = {};
    }
    VueClassComponentBuilder.prototype.walk = function (sf) {
        var _this = this;
        var _a;
        var objLiteralExp = (_a = sf
            .getChildrenOfKind(typescript_1.SyntaxKind.ExportAssignment)[0]) === null || _a === void 0 ? void 0 : _a.getChildrenOfKind(typescript_1.SyntaxKind.ObjectLiteralExpression)[0];
        if (objLiteralExp) {
            this.obj = objLiteralExp;
            this.props = objLiteralExp.getProperty("props");
            this.data = objLiteralExp.getProperty("data");
            this.computed = objLiteralExp.getProperty("computed");
            this.watch = objLiteralExp.getProperty("watch");
            this.methods = objLiteralExp.getProperty("methods");
            this.components = objLiteralExp.getProperty("components");
            this.LIFECYCLE_HOOKS.forEach(function (key) {
                var hook = objLiteralExp.getProperty(key);
                if (hook) {
                    _this.lifecycle[key] = hook;
                }
            });
        }
    };
    VueClassComponentBuilder.prototype.buildClass = function (clazz) {
        var _this = this;
        var _a;
        clazz.setIsDefaultExport(true);
        clazz.setExtends("Vue");
        // props
        if (this.props) {
            var props = this.props.asKindOrThrow(typescript_1.SyntaxKind.PropertyAssignment);
            var obj = void 0;
            if ((obj = props.getChildrenOfKind(typescript_1.SyntaxKind.ObjectLiteralExpression)[0])) {
                var propArr = obj.forEachChildAsArray();
                propArr.forEach(function (prop) {
                    var _a, _b;
                    var propertyAssignment = prop.asKindOrThrow(typescript_1.SyntaxKind.PropertyAssignment);
                    var name = propertyAssignment.getStructure().name;
                    var config;
                    if ((config = propertyAssignment.getLastChildIfKind(typescript_1.SyntaxKind.Identifier))) {
                        var type = (0, util_1.String2PrimitiveType)(config === null || config === void 0 ? void 0 : config.getText());
                        clazz.addProperty({ name: name, type: type }).addDecorator({
                            name: "Prop",
                            arguments: function (writer) {
                                writer.write("{type: " + (config === null || config === void 0 ? void 0 : config.getText()) + "}");
                            },
                        });
                    }
                    else if ((config = propertyAssignment.getLastChildIfKind(typescript_1.SyntaxKind.ObjectLiteralExpression))) {
                        var type = (0, util_1.String2PrimitiveType)((_b = (_a = config === null || config === void 0 ? void 0 : config.getProperty("type")) === null || _a === void 0 ? void 0 : _a.getLastChildIfKind(typescript_1.SyntaxKind.Identifier)) === null || _b === void 0 ? void 0 : _b.getText());
                        clazz.addProperty({ name: name, type: type }).addDecorator({
                            name: "Prop",
                            arguments: function (writer) {
                                writer.write(config === null || config === void 0 ? void 0 : config.getText());
                            },
                        });
                    }
                });
            }
            else if ((obj = props.getChildrenOfKind(typescript_1.SyntaxKind.ArrayLiteralExpression)[0])) {
                var propArr = obj.forEachChildAsArray();
                propArr.forEach(function (prop) {
                    var stringLiteral = prop.asKindOrThrow(typescript_1.SyntaxKind.StringLiteral);
                    var name = stringLiteral.getText();
                    var type = "any";
                    clazz.addProperty({ name: name, type: type }).addDecorator({
                        name: "Prop",
                        arguments: [],
                    });
                });
            }
        }
        // data
        if (this.data) {
            var methodDeclaration = this.data.asKindOrThrow(typescript_1.SyntaxKind.MethodDeclaration);
            var obj = (_a = methodDeclaration
                .getStatementByKind(typescript_1.SyntaxKind.ReturnStatement)) === null || _a === void 0 ? void 0 : _a.getChildrenOfKind(typescript_1.SyntaxKind.ObjectLiteralExpression)[0];
            var nodes = (obj === null || obj === void 0 ? void 0 : obj.getChildrenOfKind(typescript_1.SyntaxKind.PropertyAssignment)) || [];
            nodes.forEach(function (propertyAssignment) {
                var name = propertyAssignment.getStructure().name;
                var define = propertyAssignment.getLastChild();
                var type = "any";
                if (!(define === null || define === void 0 ? void 0 : define.forEachChildAsArray().length)) {
                    type = (0, util_1.String2PrimitiveType)(define === null || define === void 0 ? void 0 : define.getType().getApparentType().getText());
                }
                clazz.addProperty({ name: name, type: type });
            });
            var method = methodDeclaration.getStructure();
            clazz.addMethod(method);
        }
        // computed
        var computedSpreadAssignments = [];
        if (this.computed) {
            var obj = this.computed
                .asKindOrThrow(typescript_1.SyntaxKind.PropertyAssignment)
                .getInitializerIfKindOrThrow(typescript_1.SyntaxKind.ObjectLiteralExpression);
            var getters = obj.getChildrenOfKind(typescript_1.SyntaxKind.MethodDeclaration);
            computedSpreadAssignments.push.apply(computedSpreadAssignments, obj.getChildrenOfKind(typescript_1.SyntaxKind.SpreadAssignment));
            getters.forEach(function (getter) {
                clazz.addGetAccessor(getter.getStructure());
            });
        }
        if (this.watch) {
            var obj = this.watch
                .asKindOrThrow(typescript_1.SyntaxKind.PropertyAssignment)
                .getInitializerIfKindOrThrow(typescript_1.SyntaxKind.ObjectLiteralExpression);
            var watchers = obj.forEachChildAsArray();
            watchers.forEach(function (watcher) {
                var _a, _b, _c, _d;
                if (ts_morph_1.Node.isMethodDeclaration(watcher)) {
                    var structure = watcher.getStructure();
                    clazz.addMethod(__assign(__assign({}, structure), { name: 'on' + (0, util_1.titleCase)(structure.name) + 'Change' })).addDecorator({
                        name: 'Watch',
                        arguments: ["\"" + structure.name + "\""]
                    });
                }
                else if (ts_morph_1.Node.isPropertyAssignment(watcher)) {
                    var name_1 = watcher.getName();
                    var initializer = watcher.getInitializerIfKindOrThrow(typescript_1.SyntaxKind.ObjectLiteralExpression);
                    var funcExp = (_b = (_a = initializer.getProperty('handler')) === null || _a === void 0 ? void 0 : _a.asKind(typescript_1.SyntaxKind.PropertyAssignment)) === null || _b === void 0 ? void 0 : _b.getInitializerIfKind(typescript_1.SyntaxKind.FunctionExpression);
                    var deep_1 = initializer.getProperty('deep');
                    var immediate_1 = initializer.getProperty('immediate');
                    clazz.addMethod({
                        parameters: funcExp === null || funcExp === void 0 ? void 0 : funcExp.getParameters().map(function (p) { return p.getStructure(); }),
                        statements: funcExp === null || funcExp === void 0 ? void 0 : funcExp.getStatements().map(function (s) { return s.getText(); }),
                        name: 'on' + (0, util_1.titleCase)((_d = (_c = watcher.getChildAtIndexIfKind(0, typescript_1.SyntaxKind.Identifier)) === null || _c === void 0 ? void 0 : _c.getText()) !== null && _d !== void 0 ? _d : '') + 'Change',
                    }).addDecorator({
                        name: 'Watch',
                        arguments: ["\"" + name_1 + "\"", function (writer) {
                                writer.write('{');
                                writer.write([deep_1, immediate_1].filter(Boolean).map(function (exp) { return exp === null || exp === void 0 ? void 0 : exp.getText(); }).join(','));
                                writer.write('}');
                            }]
                    });
                }
            });
        }
        // lifecycle
        Object.entries(this.lifecycle).forEach(function (_a) {
            var key = _a[0], property = _a[1];
            var method = property
                .asKindOrThrow(typescript_1.SyntaxKind.MethodDeclaration)
                .getStructure();
            clazz.addMethod(method);
        });
        // methods
        if (this.methods) {
            var obj = this.methods
                .asKindOrThrow(typescript_1.SyntaxKind.PropertyAssignment)
                .getInitializerIfKindOrThrow(typescript_1.SyntaxKind.ObjectLiteralExpression);
            var methods = obj
                .getChildrenOfKind(typescript_1.SyntaxKind.MethodDeclaration)
                .map(function (m) { return m.getStructure(); });
            clazz.addMethods(methods);
        }
        clazz.addDecorator({
            name: "Component",
            arguments: function (writer) {
                writer.write('{');
                writer.tab();
                writer.writeLine('name: "app",');
                if (_this.components) {
                    writer.tab();
                    writer.write(_this.components.getText() + ',\n');
                }
                if (computedSpreadAssignments.length) {
                    writer.tab();
                    writer.write('computed: {');
                    writer.write(computedSpreadAssignments.map(function (exp) { return exp.getText(); }).join(',\n'));
                    writer.writeLine('},');
                }
                writer.write('}');
            }
        });
    };
    VueClassComponentBuilder.prototype.build = function (sf) {
        var _a;
        // const exportAssignments =  sf.getExportAssignments();
        // console.log(exportAssignments[0])
        // sf.removeDefaultExport()
        this.walk(sf);
        var clazz = sf.addClass({
            name: "App",
        });
        this.buildClass(clazz);
        var namedImport = [];
        if (this.props) {
            namedImport.push("Prop");
        }
        if (this.watch) {
            namedImport.push("Watch");
        }
        sf.addImportDeclaration({
            namedImports: __spreadArray(["Vue", "Component"], namedImport, true),
            moduleSpecifier: "vue-property-decorator",
        });
        (_a = sf.getChildrenOfKind(typescript_1.SyntaxKind.ExportAssignment)[0]) === null || _a === void 0 ? void 0 : _a.remove();
    };
    return VueClassComponentBuilder;
}());
exports.default = VueClassComponentBuilder;
