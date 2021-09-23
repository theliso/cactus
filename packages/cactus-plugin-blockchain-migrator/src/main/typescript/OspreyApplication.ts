/* eslint-disable prettier/prettier */
import { IConfiguration } from "./common/interfaces/IConfiguration";
import { Monitor } from "./common/monitor/Monitor";
import * as path from "path";
import * as defaultConfig from "./config/config.json";
import { FabricTestInputConfiguration } from "./common/config/OspreyConfiguration";
import { DefaultApi as FabricApiClient } from "@hyperledger/cactus-plugin-ledger-connector-fabric";
import { DefaultApi as BesuApiClient } from "@hyperledger/cactus-plugin-ledger-connector-besu";
import { TypescriptTestAdapter } from "./adapter/tests_adapter/TypescriptTestAdapter";
import { Utils } from "./utils/utils";
import { TypescriptSrcAdapter } from "./adapter/src_adapter/TypescriptSrcAdapter";


export class OspreyApplication {

  private _config: IConfiguration;
  private _monitor: Monitor;

  // TODO: put hardcoded blockchain string in a file
  constructor(config: IConfiguration) {
    this._config = config;
    this._monitor = new Monitor();
  }

  public translateSrcContractToFabric(): void {
    const relativePath = this._config.smartContractDir;
    const fileName = this._config.srcFileName;
    const fabricSrcAdapter = new TypescriptSrcAdapter(this._monitor);
    const astJSON: any = Utils.solFileToAST(path.join(relativePath, fileName));
    fabricSrcAdapter.translateToFile(astJSON, relativePath, path.parse(fileName).name);
    fabricSrcAdapter.write(path.join(__dirname, defaultConfig.outputPath), path.parse(fileName).name);
  }

  public translateFabricTest(config: FabricTestInputConfiguration, apiClient: FabricApiClient): void {
    const relativePath = this._config.smartContractDir;
    const fileName = this._config.srcFileName;
    const fabricAdapter = new TypescriptTestAdapter("fabric", this._monitor);
    const astJSON: any = Utils.jsFileToAST(path.join(relativePath, fileName));
    fabricAdapter.translate(astJSON, relativePath, path.parse(fileName).name, config, apiClient);
  }

  public translateBesuTest(config: any, apiClient: BesuApiClient): any {
    const relativePath = this._config.smartContractDir;
    const fileName = this._config.srcFileName;
    const fabricAdapter = new TypescriptTestAdapter("solidity", this._monitor);
    const astJSON: any = Utils.jsFileToAST(path.join(relativePath, fileName));
    fabricAdapter.translate(astJSON, relativePath, path.parse(fileName).name, config, apiClient);
  }

  

  public translateTestAndWriteInFile(): void {
    throw new Error("Method not implemented.");
  }
}






