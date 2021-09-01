import { DefaultApi } from "@hyperledger/cactus-plugin-ledger-connector-fabric";
import { BesuApiClient } from "@hyperledger/cactus-plugin-ledger-connector-besu";
import { FabricTestInputConfiguration } from "../config/OspreyConfiguration";

export interface IService {
    translate(ast: any, inputDirectory: string, mainContract?: string): void;
    writeContractInFiles(outputDir: string, fileName: string): void;
    translateTestToFile(file: string, inputDir: string, mainContract?: string): void;
    writeTestInFile(outputDir: string, fileName: string, testFileName: string): void;
    translateFabricTest(file: string, inputDir: string, mainContract: string, config: FabricTestInputConfiguration, apiClient: DefaultApi);
    translateBesuTest(file: string, inputDir: string, mainContract: string, config: any, apiClient: BesuApiClient);
}