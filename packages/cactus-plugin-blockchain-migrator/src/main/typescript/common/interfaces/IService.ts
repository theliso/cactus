export interface IService {

    translate(ast: any, inputDirectory: string, mainContract?: string): void;
    writeContractInFiles(outputDir: string, fileName: string): void;
    translateTest(ast: any, inputDir: string, mainContract?: string): void;
    writeTestInFile(outputDir: string, fileName: string, testFileName: string): void;
}