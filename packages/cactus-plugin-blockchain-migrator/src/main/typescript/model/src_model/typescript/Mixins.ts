export class Mixins {

    private ContractName: string;

    constructor(mixin: string) {
        this.ContractName = mixin;
    }

    public composeMixinIntoString(): string {
        return `export function ${this.ContractName}Mixin<Base extends Class>(base: Base) {
            return class extends base {`;
    }

    public getContractName(): string {
        return this.ContractName;
    }

}