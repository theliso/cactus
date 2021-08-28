import { IExpression } from "../../../../common/interfaces/IExpression";
import { TypescriptTestCactus } from "../../../../ConstantCode/TypescriptTestCactus";
import { Monitor } from "../../../../monitor/Monitor";

export class VariableDeclaration implements IExpression {

    private _kind: string;
    private _leftSide: string;
    private _operator: string;
    private _rightSide: string;

    constructor(kind: string, leftSide: string, operator: string, rightSide: string) {
        this._kind = kind;
        this._leftSide = leftSide;
        this._operator = operator;
        this._rightSide = rightSide;
    }


    build(tracker: Monitor): string {
        if (this._rightSide.startsWith("import")) {
            return this._rightSide;
        }
        if (this._rightSide.startsWith("await apiClient.deployContractV1")) {
            tracker.setSmartContractInstanceVariable(this._leftSide);
            this._rightSide = this._rightSide.concat("\n").concat(TypescriptTestCactus.assertsAfterDeploy(this._leftSide, tracker.getInnerTestNumber()));
        }
        if (this._rightSide.startsWith("await apiClient.runTransactionV1")){
            tracker.addTransaction(this._leftSide);
        }
        if (this._rightSide === '') {
            return "";
        }
        return this._kind
            .concat(" ")
            .concat(this._leftSide)
            .concat(" ")
            .concat(this._operator)
            .concat(" ")
            .concat(this._rightSide);
    }



}