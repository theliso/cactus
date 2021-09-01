/* eslint-disable prettier/prettier */
import { ChainCodeProgrammingLanguage, DeployContractGoSourceV1RequestConstructorArgs, DeployContractV1Request, DeploymentTargetOrganization, FileBase64 } from "@hyperledger/cactus-plugin-ledger-connector-fabric";
import { IConfiguration } from "../interfaces/IConfiguration";

export class OspreyConfiguration {

    srcLang?: string;

    testLang?: string;

    blockchain?: string;

    smartContractDir?: string;

    srcFileName?: string;

    testDir?: string;

    testFileName?: string;

    constructor(config: IConfiguration = { }) {
        this.srcLang = config.srcLang;
        this.testLang = config.testLang;
        this.blockchain = config.blockchain;
        this.smartContractDir = config.smartContractDir;
        this.srcFileName = config.srcFileName;
        this.testDir = config.testDir;
        this.testFileName = config.testFileName;
    }

}

export interface FabricTestInputConfiguration {
    channelId: string;
    signaturePolicy?: string;
    collectionsConfigFile?: string;
    targetOrganizations: DeploymentTargetOrganization[];
}

export interface FabricConfiguration extends FabricTestInputConfiguration {
    ccLang: ChainCodeProgrammingLanguage;
    ccSequence: number;
    ccLabel: string;
    sourceFiles: FileBase64[];
    ccName: string;
    constructorArgs?: DeployContractGoSourceV1RequestConstructorArgs;
}

export class FabricClientDeployConfiguration implements DeployContractV1Request {
    ccLang: ChainCodeProgrammingLanguage;
    caFile: string;
    orderer: string;
    ordererTLSHostnameOverride: string;
    connTimeout?: number;
    signaturePolicy?: string;
    collectionsConfigFile?: string;
    channelId: string;
    targetOrganizations: DeploymentTargetOrganization[];
    constructorArgs?: DeployContractGoSourceV1RequestConstructorArgs;
    ccSequence: number;
    ccVersion: string;
    ccName: string;
    ccLabel: string;
    sourceFiles: FileBase64[];
    // static variables (based on fabric connector deploy contract typescript test file)
    private readonly _ca: string = "/opt/gopath/src/github.com/hyperledger/fabric/peer/organizations/ordererOrganizations/example.com/orderers/orderer.example.com/msp/tlscacerts/tlsca.example.com-cert.pem";
    private readonly _orderer: string = "orderer.example.com:7050";
    private readonly _tlsHostName: string = "orderer.example.com";
    private readonly _version: string = "1.0.0";
    private readonly _timeout: number = 60;

    constructor(params: FabricConfiguration) {
        this.ccLabel = params.ccLabel;
        this.caFile = this._ca;
        this.orderer = this._orderer;
        this.ordererTLSHostnameOverride = this._tlsHostName;
        this._version = this._version;
        this.connTimeout = this._timeout;
        this.ccSequence = params.ccSequence;
        this.sourceFiles = params.sourceFiles;
        this.constructorArgs = params.constructorArgs;
        this.ccLang = params.ccLang;
        this.targetOrganizations = params.targetOrganizations;
        this.channelId = params.channelId;
        this.signaturePolicy = params.signaturePolicy;
        this.collectionsConfigFile = params.collectionsConfigFile;
    }
}