import { IExpression } from "../../../../common/interfaces/IExpression";
import { Monitor } from "../../../../common/monitor/Monitor";

export class Literal implements IExpression {

    private _value: string;

    constructor(value: string) {
        this._value = value;
    }

    build(tracker: Monitor): string {
        return this._value;
    }

}