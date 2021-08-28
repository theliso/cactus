export class ClassBuilder {
    public fileName: string;
    public imports: string;
    public usings: string;
    public signature: string;
    public variableStateDeclaration: string;
    public initFunction: string;
    public constructorFunction: string;
    public overloadFunctions: string;
    public functions: string;
    public mappingUndefinedFunctions: string;
    public output: string;

    constructor() {
        this.fileName = '';
        this.imports = '';
        this.usings = '';
        this.signature = '';
        this.variableStateDeclaration = '';
        this.initFunction = '';
        this.constructorFunction = '';
        this.overloadFunctions = '';
        this.functions = '';
        this.mappingUndefinedFunctions = '';
        this.output = '';
    }

    public concatAllFields(): void {
        this.output = this.imports
            .concat(this.usings)
            .concat(this.signature)
            .concat(this.variableStateDeclaration)
            .concat(this.initFunction)
            .concat(this.constructorFunction)
            .concat(this.overloadFunctions)
            .concat(this.functions)
            .concat(this.mappingUndefinedFunctions)
            .concat('\n } \n');
    }
}