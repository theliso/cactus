import { IExpression } from "../../../../common/interfaces/IExpression";
import { Monitor } from "../../../../common/monitor/Monitor";


export class NotHandle implements IExpression {

    build(tracker: Monitor): string {
        return "";
    }

}