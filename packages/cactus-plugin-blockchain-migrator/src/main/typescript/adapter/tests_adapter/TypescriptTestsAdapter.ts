import * as fs from 'fs';
import { ITranslatorTestService } from "../../common/interfaces/ITranslatorTestService";
import { ASTInterpreter } from '../../common/ASTInterpreter';
import { IExpression } from '../../common/interfaces/IExpression';
import { ASTOutputLanguageFactory } from '../../factory/ASTOutputLanguageFactory';
import { Monitor } from '../../monitor/Monitor';
import { TypescriptTestCactus } from '../../ConstantCode/TypescriptTestCactus';
import { ConstantCode } from '../../ConstantCode/Constants';

export class TypescriptTestsAdapter implements ITranslatorTestService {

    private readonly _languageFactory: ASTInterpreter;
    private _monitor: Monitor;
    private _code: string;
    private _mainContract: string;

    constructor(testLanguage: string, monitor: Monitor) {
        this._monitor = monitor;
        this._languageFactory = new ASTInterpreter(
            ASTOutputLanguageFactory.getInstance(testLanguage),
            this._monitor
        );
        this._code = "";
    }

    translate(ast: any, inputDirectory: string, mainContract?: string): void {
        this._mainContract = mainContract;
        for (let i = 0; i < ast.body.length; ++i) {
            let body: any = ast.body[i];
            if (body.type === "ExpressionStatement" && body.expression.callee.name === "contract")
                this._code = this._code.concat(this.translateAst(body)).concat("\n");
        }
    }

    translateAst(body: any): string {
        let expression: IExpression = this._languageFactory.processExpression(body);
        if (expression !== undefined) {
            return expression.build(this._monitor);
        }
    }

    write(outputDir: string, fileName: string, testFileName?: string): void {
        let outputPath: string = outputDir.concat(testFileName).concat('/test');
 
        if (!fs.existsSync(outputPath)) {
            fs.mkdirSync(outputPath);
        }
        /*
        * below will be implemented the logic of building the
        * test's code to be written in the test file
        */
        // code goes here
        let sourceFiles: string = ""
        this._monitor.getSourceFiles().forEach((path: string, file: string) => {
            sourceFiles += TypescriptTestCactus.sourceFiles(file, path);
        });
        
        fs.writeFileSync(
            outputPath.concat(`/${testFileName}_test.spec.ts`),
            TypescriptTestCactus.cactusTestTemplate(this._code, this._mainContract, sourceFiles)
        )

    }



}