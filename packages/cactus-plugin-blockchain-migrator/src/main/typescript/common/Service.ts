import { IService } from "./interfaces/IService";
import { ITranslatorService } from "./interfaces/ITranslatorService";
import { Utils } from "../utils/utils";

export class Service implements IService {
    private _srcAdapter: ITranslatorService;
    private _testAdapter: ITranslatorService;

    constructor(srcAdapter: ITranslatorService, testAdapter?: ITranslatorService) {
        this._srcAdapter = srcAdapter;
        this._testAdapter = testAdapter;
    }
    writeContractInFiles(outputDir: string, fileName: string): void {
        this._srcAdapter.write(outputDir, fileName);
    }

    translate(ast: any, inputDirectory: string, mainContract?: string): void {
        let astJSON: any = Utils.solFileToAST(ast);
        Utils.log(astJSON, mainContract);
        this._srcAdapter.translate(astJSON, inputDirectory, mainContract);
    }

    translateTest(ast: any, inputDirectory: string, mainContract?: string): void {
        let testAst: any = Utils.jsFileToAST(ast);
        Utils.log(testAst, mainContract.concat('_spec'));
        this._testAdapter.translate(testAst, inputDirectory, mainContract);
    }

    writeTestInFile(outputDir: string, fileName: string, testFileName: string): void {
        this._testAdapter.write(outputDir, fileName, testFileName);
    }

}