import { ITranslatorService } from './ITranslatorService';

export interface ITranslatorTestService extends ITranslatorService {

    translateAst(body: any): void;


}