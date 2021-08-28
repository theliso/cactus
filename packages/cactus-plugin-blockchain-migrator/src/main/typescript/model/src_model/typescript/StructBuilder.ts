import { TranslateExpression } from '../../../TranslatorCode/TranslatorSubParts/TranslateExpression';
import { ClassBuilder } from './ClassBuilder';

export class StructBuilder extends ClassBuilder {

    public Name: string;
    public ContractName: string;
    public members: Array<string>;
    public memberTypes: Array<any>;

    constructor() {
        super();
        this.members = new Array<string>();
        this.memberTypes = new Array<any>();
    }

    public build(structDefinition: any, contractName: string): void {
        this.ContractName = contractName;
        this.Name = structDefinition.name;
        this.signature = `export class ${this.Name} {\n`;
        this.constructorFunction = 'constructor(';
        structDefinition.members.forEach(member => {
            this.imports = this.imports.concat(this.importUserDefinesTypeName(member.typeName));

            let type: string = TranslateExpression.translateFunctionOrVariableType(member.typeName, false);
            this.variableStateDeclaration = this.variableStateDeclaration
                .concat(`public ${member.name}: ${type};\n`);
            this.members.push(member.name);
            this.memberTypes.push(member.typeName);
            this.constructorFunction = this.constructorFunction.concat(`${member.name}: ${type},`);
        });
        this.constructorFunction = this.constructorFunction.substring(0, this.constructorFunction.length - 1);
        this.constructorFunction = this.constructorFunction.concat(') {\n');
        this.members.forEach(elem => {
            this.constructorFunction = this.constructorFunction.concat(`this.${elem} = ${elem};\n`);
        });
        this.constructorFunction = this.constructorFunction.concat('}\n');
        this.concatAllFields();
    }

    private importUserDefinesTypeName(type: any): string {
        let imports: string = '';
        if (type.type === 'UserDefinedTypeName') {
            return `import { ${type.name} } from \'./${type.namePath}\'\n`;
        }
        return imports;
    }


}