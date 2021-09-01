/* eslint-disable prettier/prettier */
import * as fs from 'fs';
import { ITranslatorTestService } from "../../common/interfaces/ITranslatorTestService";
import { ASTInterpreterToFile } from '../../common/interpreter/ASTInterpreterToFile';
import { IExpression } from '../../common/interfaces/IExpression';
import { ASTOutputLanguageFactory } from '../../common/factory/ASTOutputLanguageFactory';
import { Monitor } from '../../common/monitor/Monitor';
import { TypescriptTestCactus } from '../../ConstantCode/TypescriptTestCactus';
import { DefaultApi as BesuApiClient } from '@hyperledger/cactus-plugin-ledger-connector-besu';
import { ChainCodeProgrammingLanguage, DefaultApi as FabricApiClient } from '@hyperledger/cactus-plugin-ledger-connector-fabric';
import { FabricConfiguration, FabricTestInputConfiguration } from '../../common/config/OspreyConfiguration';
import { ASTInterpreter } from '../../common/interpreter/ASTInterpreter';
import { ASTInterpreterInLine } from '../../common/interpreter/ASTInterpreterInLine';

export class TypescriptTestAdapter implements ITranslatorTestService {

    private _languageFactory?: ASTInterpreter;
    private _testLang: string;
    private _monitor: Monitor;
    private _code: string;
    private _mainContract: string;

    constructor(testLanguage: string, monitor: Monitor) {
        this._monitor = monitor;
        this._testLang = testLanguage;
        this._code = "";
    }


    translate(ast: any, inputDirectory: string, mainContract?: string, config?: FabricTestInputConfiguration | any, apiClient?: BesuApiClient | FabricApiClient): void {
        this._languageFactory = new ASTInterpreterInLine(ASTOutputLanguageFactory.getInstance(this._testLang), this._monitor);
        const fabricConfig: FabricConfiguration = config;
        fabricConfig.ccName = mainContract;
        fabricConfig.ccLang = ChainCodeProgrammingLanguage.Typescript;
        for (let i = 0; i < ast.body.length; ++i) {
            const body: any = ast.body[i];
            if (body.type === "ExpressionStatement" && body.expression.callee.name === "contract") {

            }
        }
    }

    translateToFile(ast: any, inputDirectory: string, mainContract?: string): void {
        this._languageFactory = new ASTInterpreterToFile(ASTOutputLanguageFactory.getInstance(this._testLang), this._monitor);
        this._mainContract = mainContract;
        for (let i = 0; i < ast.body.length; ++i) {
            const body: any = ast.body[i];
            if (body.type === "ExpressionStatement" && body.expression.callee.name === "contract")
                this._code = this._code.concat(this.translateAst(body)).concat("\n");
        }
    }

    translateAst(body: any): string {
        const expression: IExpression = this._languageFactory.processExpression(body);
        if (expression !== undefined) {
            return expression.build(this._monitor);
        }
    }

    write(outputDir: string, fileName: string, testFileName?: string): void {
        const outputPath: string = outputDir.concat(testFileName).concat('/test');

        if (!fs.existsSync(outputPath)) {
            fs.mkdirSync(outputPath);
        }
        /*
        * below will be implemented the logic of building the
        * test's code to be written in the test file
        */
        // code goes here
        let sourceFiles: string = "";
        this._monitor.getSourceFiles().forEach((path: string, file: string) => {
            sourceFiles += TypescriptTestCactus.sourceFiles(file, path);
        });

        fs.writeFileSync(
            outputPath.concat(`/${testFileName}_test.spec.ts`),
            TypescriptTestCactus.cactusTestTemplate(this._code, this._mainContract, sourceFiles)
        );

    }






}