import { IExpression } from "../../../../common/interfaces/IExpression";
import { Monitor } from "../../../../monitor/Monitor";

export class ThisExpression implements IExpression {

    build(tracker: Monitor): string {
        return 'this';
    }

}