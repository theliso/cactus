import { IExpression } from "../../../../common/interfaces/IExpression";


export class AwaitExpression implements IExpression {
    
    private readonly _awaitExpression: string;

    constructor(awaitExpression: string) {
        this._awaitExpression = awaitExpression;
    }
    
    
    build(r): string {
        return this._awaitExpression;
    }

}