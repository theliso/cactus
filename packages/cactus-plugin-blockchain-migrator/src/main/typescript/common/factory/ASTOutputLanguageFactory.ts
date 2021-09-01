/* eslint-disable prettier/prettier */
import { IFactory } from "../interfaces/IFactory";
import { TypescriptTestBesuFactory } from "./TypescriptTestBesuFactory";
import { TypescriptTestFabricFactory } from "./TypescriptTestFabricFactory";

export class ASTOutputLanguageFactory {

    // Add new factories to this key-value object
    // if you want to support translations for other blockchains.
    // key = blockchain name | value = factory where your model logic is implemented
    private static readonly _testOutputLanguagesObj = {
        "fabric": new TypescriptTestFabricFactory(),
        "solidity": new TypescriptTestBesuFactory(),
    };

    // function to obtain the specific factory instance
    static getInstance(blockchain: string): IFactory {
        const objInstance = this._testOutputLanguagesObj[blockchain];
        if (objInstance === undefined) {
            throw new Error(`${blockchain} is not supported by the tool.`);
        }
        return objInstance;
    }
}