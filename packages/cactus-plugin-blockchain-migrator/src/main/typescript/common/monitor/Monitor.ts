
// The gold of this class is to keep track of the code's behavior and changes
// example, knowing if a member expression is a calling on a smart contract's 

import { ChainCodeProgrammingLanguage } from "../enums/ChainCodeProgrammingLanguage";
import { FabricContractInvocationType } from "../enums/FabricContractInvocationType";

// function or not
export class Monitor {

    // capture the smart contract instance
    private _smartContractInstance: string;
    // flag to capture the deployed function
    private _smartContractDeployFcn: boolean
    // object to keep the specific details of the deploying function
    // such as the programming language (ex: hainCodeProgrammingLanguage.TYPESCRIPT)
    // smart contract constructor arguments
    private _smartContractDeployDetails: any = {};
    // flag to capture smart contract function calls
    private _smartContractFcnCall: boolean;
    // object to keep the specific details such as FabricContractInvocationType
    // and smart contract method name
    private _smartContractFcnDetails: any = {};
    // data structure to keep tracking the amount of sub tests within a test
    private _subTestTracking: Map<string, boolean> = new Map<string, boolean>();

    private _needUtilsClass: boolean;

    private _needBalanceClass: boolean;

    private _sourceFiles: Map<string, string> = new Map<string, string>();

    private _transactionResults: Map<string, string> = new Map<string, string>();

    private _innerTestNumber: number = 0;

    public getTransactionResult(key: string): string {
        return this._transactionResults.get(key);
    }

    public getInnerTestNumber(): number {
        return this._innerTestNumber;
    }

    public getSourceFiles(): Map<string, string> {
        return this._sourceFiles;
    }

    public needBalanceClass(): boolean {
        return this._needBalanceClass;
    }

    public needUtilsClass(): boolean {
        return this._needUtilsClass;
    }

    public getSmartContractInstanceVariable(): string {
        return this._smartContractInstance;
    }

    public getSmartContractFcnCall(): boolean {
        return this._smartContractFcnCall;
    }

    public getSmartContractDeployFcn(): boolean {
        return this._smartContractDeployFcn;
    }

    public getSmartContractFcnDetails(): any {
        return this._smartContractFcnDetails;
    }

    public getSmartContractDeployDetails(): any {
        return this._smartContractDeployDetails;
    }

    public getSubTest(key: string): boolean {
        return this._subTestTracking.get(key);
    }

    public setSmartContractInstanceVariable(instanceVariable: string): void {
        this._smartContractInstance = instanceVariable;
    }

    public setSmartContractFcnCall(flag: boolean, invocationType: FabricContractInvocationType, methodName: string): void {
        this._smartContractFcnCall = flag;
        this._smartContractFcnDetails = { invocationType: invocationType, methodName: methodName };
    }

    public setSmartContractDeployFcn(deploy: boolean, progLanguage: ChainCodeProgrammingLanguage, contractName: string, constructorArgs?: string[]): void {
        this._smartContractDeployFcn = deploy;
        this._smartContractDeployDetails = { progLanguage: progLanguage, contractName: contractName, constructorArgs: constructorArgs };
    }

    public setSubTest(key: string, value: boolean): void {
        this._subTestTracking.set(key, value);
    }

    public setUtils(needUtils: boolean): void {
        this._needUtilsClass = needUtils;
    }

    public setBalanceClass(needBalanceClass: boolean): void {
        this._needBalanceClass = needBalanceClass;
    }

    public addSourceFile(file: string, relativePath: string): void {
        this._sourceFiles.set(file, relativePath);
    }

    public addTransaction(value: string): void {
        this._transactionResults.set(value, `JSON.parse(${value}.data.functionOutput)`);
    }

    public incrementInnerTestNumber(): void {
        this._innerTestNumber++;
    }

    public decrementInnerTestNumber(): void {
        if (this._innerTestNumber > 1) {
            this._innerTestNumber--;
        }
    }

    public clearSmartContractFcnCall(): void {
        this._smartContractFcnDetails = {};
        this._smartContractFcnCall = false;
    }

    clearSmartContractDeployDetails() {
        this._smartContractDeployFcn = false;
        this._smartContractDeployDetails = {};
    }

    clearTransactionsVariables(): void {
        this._transactionResults.clear();
    }


}