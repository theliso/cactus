/* eslint-disable prettier/prettier */
import { IExpression } from "../../../../common/interfaces/IExpression";
import { TypescriptTestCactus } from "../../../../ConstantCode/TypescriptTestCactus";
import { Monitor } from "../../../../common/monitor/Monitor";


export class ArrowFunctionExpression implements IExpression {

    private readonly ACCOUNT_PARAM: string = "accounts";
    private readonly _async: boolean;
    private readonly _params: string;
    private readonly _body: string;

    constructor(async: boolean, params: string, body: string) {
        this._async = async;
        this._params = params;
        this._body = body;
    }

    build(tracker: Monitor): string {
        if (this._params === this.ACCOUNT_PARAM)
            return this._body;
        let arrowFcn: string = `${this._async ? "async" : ""}`
        .concat(` (${this._params === "" ? `t${tracker.getInnerTestNumber()}: Test` : `${this._params}`}) => {\n`)
        .concat("\t")
        .concat(this._body)
        .concat(TypescriptTestCactus.endTest(tracker.getInnerTestNumber()))
        .concat("}\n");
        tracker.decrementInnerTestNumber(); 
        return arrowFcn;
    }

}