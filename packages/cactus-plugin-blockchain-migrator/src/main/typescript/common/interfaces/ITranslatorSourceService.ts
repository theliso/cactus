/* eslint-disable prettier/prettier */
import { ClassBuilder } from "../../model/src_model/typescript/ClassBuilder";
import { ITranslatorService } from "./ITranslatorService";

export interface ITranslatorSourceService extends ITranslatorService {
    translateOneContractDefinition(contract: any, mainContract: string): void;
    translateContract(contract: any, contractTypeDetail: any, extendsClassesName: any, otherClassesName: any, mainContract: string): ClassBuilder;
    translatebaseClassesName(contract: any, isMainContract: boolean, extendedClasses: any): string;
    translateStructDefinitions(contractParts: any, contractName: string): string;
    translateEnumDefinitions(contractParts: any, contractName: string): string;
    translateEventDeclarations(contractParts: any, contractName: string): void;
    translateModifiers(contractParts: any, contractName: string): void;
    translateFunctionDefinitions(contractParts: any, contractName: string): void;
    translateUsingForDeclarations(contractParts: any, contractName: string, otherClassesName: any): void;
    translateStateVariableDeclaration(contractParts: any, contractName: string, isMainContract: boolean): string;
    isAbstractContract(contractName: string): boolean;
    translateConstructor(contractParts: any, contractName: string, extendsClassesName: any, otherClassesName: any, hasBaseClass: boolean): string;
    translateInitFunction(contractParts: any): string;
    translateOverloadedFunctions(contractName: string): string;
    translateMappingUndefinedFunctions(contractName: string, otherClassesName: string[]): string;
    extractClassDependencies(baseClasse?: any[], structEnum?: any): string;
    translateFunctions(contractParts: any, contractName: string, extendsClassesName: any, otherClassesName: any, isLibrary: boolean, isMainContract: boolean): string;   
}