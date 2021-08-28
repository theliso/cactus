import { IExpression } from "../../../../common/interfaces/IExpression";
import { Monitor } from "../../../../monitor/Monitor";

export class Identifier implements IExpression {

    private readonly CONTRACT_FUNCTION: string = "contract";
    private readonly DESCRIBE: string = "describe";
    private readonly TEST: string = "test";
    private readonly IT: string = "it";
    private _name: string;

    constructor(name: string) {
        this._name = name;
    }


    build(tracker: Monitor): string {
        if (this._name === this.CONTRACT_FUNCTION)
            return this._name;
        if (this._name === this.DESCRIBE || this._name === this.IT) {
            tracker.incrementInnerTestNumber();
            return this.TEST;
        } 
        const result: string = tracker.getTransactionResult(this._name);
        return result === undefined ? this._name : result;
    }
}