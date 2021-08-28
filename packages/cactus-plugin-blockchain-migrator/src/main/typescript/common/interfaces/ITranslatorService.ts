export interface ITranslatorService {
    translate(ast: any, inputDirectory: string, mainContract?: string): void;
    write(outputDir: string, fileName: string, testFileName?: string): void;

}