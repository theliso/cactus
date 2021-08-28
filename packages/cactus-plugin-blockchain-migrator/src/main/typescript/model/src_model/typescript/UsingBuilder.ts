import { TranslateExpression } from "../../../TranslatorCode/TranslatorSubParts/TranslateExpression";
import { ClassBuilder } from "./ClassBuilder";

export class UsingBuilder extends ClassBuilder {

    private _interfaceType: string;
    public _functions: Array<any>;
    public ContractName: string;
    public Name: string;
    public TypeName: string;

    constructor(interfaceType: string, functions: Array<any>, contractName: string, libraryName: string, typeName: string) {
        super();
        this._interfaceType = interfaceType;
        this._functions = functions;
        this.ContractName = contractName;
        this.Name = libraryName;
        this.TypeName = typeName;
    }



    private declareGlobalInterfaceInit(): string {
        let type = this._interfaceType.charAt(0).toUpperCase().concat(this._interfaceType.slice(1));
        return 'declare global { \n'
            .concat(`\tinterface ${type} {\n`);
    }

    private declareGlobalInterfaceEnd(): string {
        return '\t}\n'.concat('}\n');
    }

    private insertFunctionDefinition(name: string, parameters?: any[], returnType?: any[]): string {
        let fcn: string = `\t\t${name}(`;
        parameters.forEach((elem, index) => {
            fcn = fcn.concat(elem.Name);
            if (index < parameters.length - 1) {
                fcn = fcn.concat(', ');
            }
        });
        if (returnType.length == 0) {
            fcn = fcn.concat(`): void;\n`);
        } else {
            let type: string = TranslateExpression.translateFunctionOrVariableType(returnType[0].TypeName, false);
            fcn = fcn.concat(`): ${type};\n`);
        }
        return fcn;
    }

    private assignFunctionsToPrototypes(fcnName: string, parameters?: any[]): string {
        let type = this._interfaceType.charAt(0).toUpperCase().concat(this._interfaceType.slice(1));
        let prototype: string = `${type}.prototype.${fcnName} = `;
        let params: string = '';
        if (parameters !== undefined) {
            if (parameters.length > 0) {
                parameters.forEach((elem, index) => {
                    params = params.concat(elem.Name);
                    if (index < parameters.length - 1) {
                        params = params.concat(', ');
                    }
                });
            }
        }
        prototype = prototype.concat(`(${params}) => ${this.Name}.${fcnName}(${params});\n`);
        return prototype;
    }

    public build(): void {
        let usingDeclaration: string = this.declareGlobalInterfaceInit();
        this._functions.forEach(elem => {
            usingDeclaration = usingDeclaration.concat(
                this.insertFunctionDefinition(elem.Name, elem.Parameters, elem.ReturnParameters)
            );
        });
        usingDeclaration = usingDeclaration.concat(this.declareGlobalInterfaceEnd());
        this._functions.forEach(elem => {
            usingDeclaration = usingDeclaration.concat(this.assignFunctionsToPrototypes(elem.Name, elem.Parameters));
        });
        this.usings = usingDeclaration;
        this.concatAllFields();
    }




}