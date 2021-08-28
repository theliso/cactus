import { IExpression } from "../../../../common/interfaces/IExpression";
import { OperatorEnum } from "../../../../enums/OperatorEnum";
import { Monitor } from "../../../../monitor/Monitor";

export class BinaryExpression implements IExpression {

    private readonly _left: string;
    private readonly _operator: OperatorEnum;
    private readonly _right: string;


    constructor(left: string, operator: string, right: string) {
        this._left = left;
        this._operator = operator as OperatorEnum;
        this._right = right;
    }
    build(tracker: Monitor): string {
        if (
            typeof this._right === 'string' &&
            this._right.startsWith("await apiClient.deployContractV1") &&
            tracker.getSmartContractInstanceVariable() === undefined
        ) {
            tracker.setSmartContractInstanceVariable(this._left.split(".")[1]);
        }
        return this._left
            .concat(" ")
            .concat(this._operator)
            .concat(" ")
            .concat(this._right);
    }


}