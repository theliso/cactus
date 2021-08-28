import { IExpression } from "../../../../common/interfaces/IExpression";
import { Monitor } from "../../../../monitor/Monitor";

export class ArrayExpression implements IExpression {
    
    private readonly _elements: string[];

    constructor(elements: string[]) {
        this._elements = elements;
    }
    
    
    build(tracker: Monitor): string {
        return "";
    }

}