/* eslint-disable prettier/prettier */

import { BesuApiClient } from "@hyperledger/cactus-plugin-ledger-connector-besu";
import { DefaultApi as FabricApiClient } from "@hyperledger/cactus-plugin-ledger-connector-fabric";
import { FabricTestInputConfiguration } from "../config/OspreyConfiguration";

// TODO: Documentation - This should be the class that the src and test adapter should implement
export interface ITranslatorService {
    translate(ast: any, inputDirectory: string, mainContract?: string, config?: FabricTestInputConfiguration | any, apiClient?: BesuApiClient | FabricApiClient): void;
    translateToFile(ast: any, inputDirectory: string, mainContract?: string): void;
    write(outputDir: string, fileName: string, testFileName?: string): void;
}