/* eslint-disable prettier/prettier */
import { BesuApiClient } from "@hyperledger/cactus-plugin-ledger-connector-besu";
import { DefaultApi as FabricApiClient } from "@hyperledger/cactus-plugin-ledger-connector-fabric";
import { FabricTestInputConfiguration } from "../config/OspreyConfiguration";
import { ITranslatorService } from "./ITranslatorService";

export interface ITranslatorTestService extends ITranslatorService {
    translateAst(body: any): void;
}