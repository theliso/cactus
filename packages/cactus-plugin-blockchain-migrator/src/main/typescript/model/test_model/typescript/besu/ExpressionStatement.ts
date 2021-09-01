import { IExpression } from "../../../../common/interfaces/IExpression";
import { Monitor } from "../../../../common/monitor/Monitor";


export class ExpressionStatement implements IExpression {
    
    private readonly _expression: string;
    
    constructor(expression: string) {
        this._expression = expression;
    }
        
    build(tracker: Monitor): string {
        return this._expression;
    }

}