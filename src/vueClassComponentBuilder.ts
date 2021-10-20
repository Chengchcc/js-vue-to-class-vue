import {
    ClassDeclaration,
    GetAccessorDeclarationStructure,
    MethodDeclarationStructure,
    Node,
    ObjectLiteralElementLike,
    ObjectLiteralExpression,
    SourceFile,
    SpreadAssignment,
} from "ts-morph";
import { SyntaxKind } from "typescript";
import { String2PrimitiveType, titleCase } from "./util";

export default class VueClassComponentBuilder {
    readonly LIFECYCLE_HOOKS = [
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

    props?: ObjectLiteralElementLike;

    data?: ObjectLiteralElementLike;

    computed?: ObjectLiteralElementLike;

    watch?: ObjectLiteralElementLike;

    methods?: ObjectLiteralElementLike;

    components?: ObjectLiteralElementLike;

    lifecycle: Record<string, ObjectLiteralElementLike> = {};

    obj!: ObjectLiteralExpression;

    walk(sf: SourceFile) {
        const objLiteralExp = sf
            .getChildrenOfKind(SyntaxKind.ExportAssignment)[0]
            ?.getChildrenOfKind(SyntaxKind.ObjectLiteralExpression)[0];
        if (objLiteralExp) {
            this.obj = objLiteralExp;
            this.props = objLiteralExp.getProperty("props");
            this.data = objLiteralExp.getProperty("data");
            this.computed = objLiteralExp.getProperty("computed");
            this.watch = objLiteralExp.getProperty("watch");
            this.methods = objLiteralExp.getProperty("methods");
            this.components = objLiteralExp.getProperty("components");
            this.LIFECYCLE_HOOKS.forEach((key) => {
                const hook = objLiteralExp.getProperty(key);
                if (hook) {
                    this.lifecycle[key] = hook;
                }
            });
        }
    }

    buildClass(clazz: ClassDeclaration) {
        clazz.setIsDefaultExport(true);
        clazz.setExtends("Vue");

        // props
        if (this.props) {
            const props = this.props.asKindOrThrow(SyntaxKind.PropertyAssignment);
            let obj;
            if (
                (obj = props.getChildrenOfKind(SyntaxKind.ObjectLiteralExpression)[0])
            ) {
                const propArr = obj.forEachChildAsArray();
                propArr.forEach((prop) => {
                    const propertyAssignment = prop.asKindOrThrow(
                        SyntaxKind.PropertyAssignment
                    );
                    const { name } = propertyAssignment.getStructure();
                    let config: any;
                    if (
                        (config = propertyAssignment.getLastChildIfKind(
                            SyntaxKind.Identifier
                        ))
                    ) {
                        const type = String2PrimitiveType(config?.getText());
                        clazz.addProperty({ name, type }).addDecorator({
                            name: "Prop",
                            arguments: (writer) => {
                                writer.write(`{type: ${config?.getText()}}`);
                            },
                        });
                    } else if (
                        (config = propertyAssignment.getLastChildIfKind(
                            SyntaxKind.ObjectLiteralExpression
                        ))
                    ) {
                        const type = String2PrimitiveType(
                            config
                                ?.getProperty("type")
                                ?.getLastChildIfKind(SyntaxKind.Identifier)
                                ?.getText()
                        );
                        clazz.addProperty({ name, type }).addDecorator({
                            name: "Prop",
                            arguments: (writer) => {
                                writer.write(config?.getText());
                            },
                        });
                    }
                });
            } else if (
                (obj = props.getChildrenOfKind(SyntaxKind.ArrayLiteralExpression)[0])
            ) {
                const propArr = obj.forEachChildAsArray();
                propArr.forEach((prop) => {
                    const stringLiteral = prop.asKindOrThrow(SyntaxKind.StringLiteral);
                    const name = stringLiteral.getText();
                    const type = "any";
                    clazz.addProperty({ name, type }).addDecorator({
                        name: "Prop",
                        arguments: [],
                    });
                });
            }
        }

        // data
        if (this.data) {
            const methodDeclaration = this.data.asKindOrThrow(
                SyntaxKind.MethodDeclaration
            );
            const obj = methodDeclaration
                .getStatementByKind(SyntaxKind.ReturnStatement)
                ?.getChildrenOfKind(SyntaxKind.ObjectLiteralExpression)[0];
            const nodes = obj?.getChildrenOfKind(SyntaxKind.PropertyAssignment) || [];
            nodes.forEach((propertyAssignment) => {
                const { name } = propertyAssignment.getStructure();
                const define = propertyAssignment.getLastChild();
                let type = "any";
                if (!define?.forEachChildAsArray().length) {
                    type = String2PrimitiveType(
                        define
                            ?.getType()
                            .getApparentType()
                            .getText()
                    );
                }
                clazz.addProperty({ name, type });
            });
            const method = methodDeclaration.getStructure() as MethodDeclarationStructure;
            clazz.addMethod(method);
        }

        // computed
        const computedSpreadAssignments: SpreadAssignment[] = []
        if (this.computed) {
            const obj = this.computed
                .asKindOrThrow(SyntaxKind.PropertyAssignment)
                .getInitializerIfKindOrThrow(SyntaxKind.ObjectLiteralExpression)
            const getters = obj.getChildrenOfKind(SyntaxKind.MethodDeclaration);
            computedSpreadAssignments.push(...obj.getChildrenOfKind(SyntaxKind.SpreadAssignment))
            getters.forEach((getter) => {
                clazz.addGetAccessor(
                    (getter.getStructure() as unknown) as GetAccessorDeclarationStructure
                );
            });
        }

        if (this.watch) {
            const obj = this.watch
                .asKindOrThrow(SyntaxKind.PropertyAssignment)
                .getInitializerIfKindOrThrow(SyntaxKind.ObjectLiteralExpression);
            const watchers = obj.forEachChildAsArray()

            watchers.forEach(watcher => {
                if (Node.isMethodDeclaration(watcher)) {
                    const structure = watcher.getStructure() as MethodDeclarationStructure
                    clazz.addMethod({
                        ...structure,
                        name: 'on' + titleCase(structure.name) + 'Change',
                    }).addDecorator({
                        name: 'Watch',
                        arguments: [`"${structure.name}"`]
                    })
                } else if (Node.isPropertyAssignment(watcher)) {
                    const name = watcher.getName()
                    const initializer = watcher.getInitializerIfKindOrThrow(SyntaxKind.ObjectLiteralExpression)
                    const funcExp = initializer.getProperty('handler')?.asKind(SyntaxKind.PropertyAssignment)?.getInitializerIfKind(SyntaxKind.FunctionExpression)
                    const deep = initializer.getProperty('deep')
                    const immediate = initializer.getProperty('immediate')
                    clazz.addMethod({
                        parameters: funcExp?.getParameters().map(p => p.getStructure()),
                        statements: funcExp?.getStatements().map(s=>s.getText()),
                        name: 'on' + titleCase(watcher.getChildAtIndexIfKind(0,SyntaxKind.Identifier)?.getText()??'') + 'Change',
                    }).addDecorator({
                        name: 'Watch',
                        arguments: [`"${name}"`, writer=> {
                            writer.write('{')
                            writer.write([deep, immediate].filter(Boolean).map(exp=>exp?.getText()).join(','))
                            writer.write('}')
                        }]
                    })
                }
            })
        }

        // lifecycle
        Object.entries(this.lifecycle).forEach(([key, property]) => {
            const method = property
                .asKindOrThrow(SyntaxKind.MethodDeclaration)
                .getStructure() as MethodDeclarationStructure;
            clazz.addMethod(method);
        });

        // methods
        if (this.methods) {
            const obj = this.methods
                .asKindOrThrow(SyntaxKind.PropertyAssignment)
                .getInitializerIfKindOrThrow(SyntaxKind.ObjectLiteralExpression);
            const methods = obj
                .getChildrenOfKind(SyntaxKind.MethodDeclaration)
                .map((m) => m.getStructure() as MethodDeclarationStructure);
            clazz.addMethods(methods);
        }

        clazz.addDecorator({
            name: "Component",
            arguments: writer => {
                writer.write('{')
                writer.tab()
                writer.writeLine('name: "app",')
                if (this.components) {
                    writer.tab()
                    writer.write(this.components.getText() + ',\n')
                }
                if (computedSpreadAssignments.length) {
                    writer.tab()
                    writer.write('computed: {')
                    writer.write(computedSpreadAssignments.map(exp => exp.getText()).join(',\n'))
                    writer.writeLine('},')
                }
                writer.write('}')
            }
        });
    }

    build(sf: SourceFile) {
        // const exportAssignments =  sf.getExportAssignments();
        // console.log(exportAssignments[0])
        // sf.removeDefaultExport()
        this.walk(sf);

        const clazz = sf.addClass({
            name: "App",
        });

        this.buildClass(clazz);

        const namedImport = [];
        if (this.props) {
            namedImport.push("Prop");
        }
        if (this.watch) {
            namedImport.push("Watch");
        }

        sf.addImportDeclaration({
            namedImports: ["Vue", "Component", ...namedImport],
            moduleSpecifier: "vue-property-decorator",
        });

        sf.getChildrenOfKind(SyntaxKind.ExportAssignment)[0]?.remove()
    }
}
