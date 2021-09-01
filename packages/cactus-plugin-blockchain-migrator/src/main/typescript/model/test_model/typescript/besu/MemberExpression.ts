import { IExpression } from "../../../../common/interfaces/IExpression";
import { ChainCodeProgrammingLanguage } from "../../../../common/enums/ChainCodeProgrammingLanguage";
import { FabricContractInvocationType } from "../../../../common/enums/FabricContractInvocationType";
import { Monitor } from "../../../../common/monitor/Monitor";


export class MemberExpression implements IExpression {

    private _object: string;
    private _property: string;
    private readonly DEPLOYED: string = "deployed";
    private readonly NEW: string = "new";
    private readonly CALL: string = "call";
    private readonly ASSERT: string = "assert";

    constructor(obj: string, property: string) {
        this._object = obj;
        this._property = property;
    }


    build(tracker: Monitor): string {
        if (this._property === this.DEPLOYED || this._property === this.NEW) {
            tracker.setSmartContractDeployFcn(true, ChainCodeProgrammingLanguage.TYPESCRIPT, this._object);
        }
        if (this._property === this.CALL) {
            let property: string = this._object.split(".")[1];
            tracker.setSmartContractFcnCall(true, FabricContractInvocationType.CALL, property)
        }
        if (this._object === this.ASSERT) {
            return "t".concat(tracker.getInnerTestNumber().toString()).concat(".").concat(this._property);
        }
        if (this._object === tracker.getSmartContractInstanceVariable()) {
            tracker.setSmartContractFcnCall(true, FabricContractInvocationType.SEND, this._property);
        }
        return this._object.concat(".").concat(this._property);
    }


}