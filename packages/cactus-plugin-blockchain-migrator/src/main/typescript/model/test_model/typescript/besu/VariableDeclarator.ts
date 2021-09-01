import { IExpression } from "../../../../common/interfaces/IExpression";
import { Monitor } from "../../../../common/monitor/Monitor";

export class VariableDeclarator implements IExpression {
    
    private readonly _id: string;
    private readonly _init: string;


    constructor(id: string, init: string) {
        this._id = id;
        this._init = init;
    }
    
    build(tracker: Monitor): string {
        return "";
    }

}