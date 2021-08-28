/* eslint-disable prettier/prettier */
import { Service } from "./common/Service";


export class App {

  private _service: Service;

  constructor(service: Service) {
    this._service = service;
  }

  public main(inputDir: string, fileName: string, outputDir: string, testsInputDir?: string, testFileName?: string): void {
    try {
      this._service.translate(inputDir.concat('/').concat(fileName), inputDir, fileName.substring(0, fileName.indexOf('.')));
      const file: string = fileName.substring(0, fileName.indexOf("."));
      this._service.writeContractInFiles(outputDir, file);
      if (testsInputDir !== undefined) {
        this._service.translateTest(
          testsInputDir.concat("/").concat(testFileName),
          testsInputDir,
          file,
        );
        this._service.writeTestInFile(outputDir, testFileName.substring(0, testFileName.indexOf('.')), file);
        console.log("Successfully Translated Output Tests are in " + testsInputDir + " Folder");
      }
    }
    catch (error) {
      console.log(error);
    }
  }
}






