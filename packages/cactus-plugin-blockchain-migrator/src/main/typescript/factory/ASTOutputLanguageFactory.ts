import { TypescriptTestBesuFactory } from "./TypescriptTestBesuFactory";
import { TypescriptTestFabricFactory } from "./TypescriptTestFabricFactory";

export class ASTOutputLanguageFactory {

    private static readonly _testOutputLanguagesObj = {
        "ts": new TypescriptTestFabricFactory(),
        "": new TypescriptTestBesuFactory()
    };

    static getInstance(languageExtension: string): any {
        let objInstance = this._testOutputLanguagesObj[languageExtension];
        if (objInstance === undefined) {
            throw new Error(`${languageExtension} is not supported by the tool.`)
        }
        return objInstance;
    }
}