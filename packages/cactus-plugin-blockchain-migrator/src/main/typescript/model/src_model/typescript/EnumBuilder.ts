import { ClassBuilder } from "./ClassBuilder";

export class EnumBuilder extends ClassBuilder {

    private _enumIndex: Array<string>;
    public Name: string;
    public ContractName: string;

    constructor() {
        super();
        this._enumIndex = new Array<string>();
    }

    public build(enumDefinition: any, contractName: string) : void {
        this.ContractName = contractName;
        this.Name = enumDefinition.name
        this.signature = `export enum ${this.Name} { \n`;
        enumDefinition.members.forEach(elem => {
            this.variableStateDeclaration = this.variableStateDeclaration.concat(`${elem.name},\n`);
            this._enumIndex.push(elem.name);
        });
        this.concatAllFields();
    }

    public getMember(member: string) : string {
        return this._enumIndex[this._enumIndex.indexOf(member)];
    }

}