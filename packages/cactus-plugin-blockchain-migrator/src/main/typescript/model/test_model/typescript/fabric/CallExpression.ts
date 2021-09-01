import { IExpression } from "../../../../common/interfaces/IExpression";
import { TypescriptTestCactus } from "../../../../ConstantCode/TypescriptTestCactus";
import { Monitor } from "../../../../common/monitor/Monitor";


export class CallExpression implements IExpression {

    private readonly ARTIFACTS: string = "artifacts";
    private readonly REQUIRE: string = "require";
    private readonly CONTRACT: string = "contract";
    private _callee: string;
    private _args: string;

    constructor(callee: string, args: string) {
        this._callee = callee;
        this._args = args;
    }


    build(tracker: Monitor): string {
        if (this._callee.startsWith(this.ARTIFACTS) || this._callee.startsWith(this.REQUIRE))
            return "";
        if (tracker.getSmartContractDeployFcn()) {
            let deployDetails: any = tracker.getSmartContractDeployDetails();
            tracker.clearSmartContractDeployDetails();
            deployDetails.constructorArgs = this._args !== "" && this._args !== undefined ? this._args.split(",") : undefined;
            return TypescriptTestCactus.deployContractV1(
                deployDetails.constructorArgs !== undefined,
                deployDetails.progLanguage,
                deployDetails.contractName,
                deployDetails.constructorArgs
            );
        }
        if (tracker.getSmartContractFcnCall()) {
            let args: string[] = this._args.split(",").filter(arg => arg !== " ").map(arg => `\"${arg}\"`);
            let fcnDetails: any = tracker.getSmartContractFcnDetails();
            tracker.clearSmartContractFcnCall();
            return TypescriptTestCactus.runTransctionV1(fcnDetails.methodName, args, fcnDetails.invocationType);
        }
        if (this._callee.startsWith("await apiClient.deployContractV1")) {
            return this._callee;
        }
        if (this._callee === this.CONTRACT) {
            return this._args.substring(this._args.indexOf(",") + 1);
        }
        return this._callee
            .concat("(")
            .concat(this._args)
            .concat(");\n");
    }

}