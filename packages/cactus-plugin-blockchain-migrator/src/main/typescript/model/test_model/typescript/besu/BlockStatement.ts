import { IExpression } from "../../../../common/interfaces/IExpression";
import { Monitor } from "../../../../common/monitor/Monitor";


export class BlockStatement implements IExpression {
    
    private readonly _body: string;

    constructor(body: string) {
        this._body = body;
    }
    
    build(tracker: Monitor): string {
        return this._body.concat("\n");
    }

}