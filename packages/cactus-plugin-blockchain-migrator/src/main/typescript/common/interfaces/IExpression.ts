import { Monitor } from "../../monitor/Monitor";

export interface IExpression {
    build(tracker: Monitor): string;
}