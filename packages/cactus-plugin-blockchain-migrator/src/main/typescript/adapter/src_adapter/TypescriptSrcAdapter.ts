/* eslint-disable prettier/prettier */
import * as fs from 'fs';
import { ITranslatorSourceService } from '../../common/interfaces/ITranslatorSourceService';
import { Utils } from '../../utils/utils';
import { Mixins } from '../../model/src_model/typescript/Mixins';
import { ClassBuilder } from '../../model/src_model/typescript/ClassBuilder';
import { StructBuilder } from '../../model/src_model/typescript/StructBuilder';
import { EnumBuilder } from '../../model/src_model/typescript/EnumBuilder';
import { BasicFunctions } from '../../TranslatorCode/BasicFunctions/BasicFunctions';
import { TranslatorSubParts } from '../../TranslatorCode/TranslatorSubParts/TranslatorSubParts';
import { TranslateExpression } from '../../TranslatorCode/TranslatorSubParts/TranslateExpression';
import { ConstantCode } from '../../ConstantCode/Constants';
import { UsingBuilder } from '../../model/src_model/typescript/UsingBuilder';
import { Monitor } from '../../common/monitor/Monitor';
import path = require('path');

export class TypescriptSrcAdapter implements ITranslatorSourceService {

    public translatedCode = [];
    public structsList: Array<StructBuilder> = new Array<StructBuilder>();
    public enumsList: Array<EnumBuilder> = new Array<EnumBuilder>();
    public eventsList = [];
    public modifiersList = [];
    public functionsList = [];
    public stateVariablesList = [];
    public mappingTypeList = [];
    public librariesList: Array<UsingBuilder> = Array<UsingBuilder>();
    public overloadedFunctionsList = [];
    public functionLocalVars: Map<string, Map<string, string>> = new Map<string, Map<string, string>>();
    private _projectClasses: Map<string, ClassBuilder> = new Map<string, ClassBuilder>();
    private _mixins: Array<Mixins> = new Array<Mixins>();
    private _usings: Map<string, UsingBuilder> = new Map<string, UsingBuilder>();

    private _monitor: Monitor;

    constructor(monitor: Monitor) {
        this._monitor = monitor;
    }
    translate(ast: any, inputDirectory: string, mainContract?: string, config?: any, apiClient?: any): void {
        throw new Error('Method not implemented.');
    }

    translateToFile(ast: any, inputDirectory: string, mainContract?: string): void {
        for (let i = 0; i < ast.children.length; i++) {
            if (ast.children[i].type == 'ImportDirective') {
                const path = ast.children[i].path;
                const ast1 = Utils.solFileToAST(inputDirectory.concat('/').concat(path));
                this.translateToFile(ast1, inputDirectory, mainContract);
            }
        }
        for (let i = 0; i < ast.children.length; i++) {
            if (ast.children[i].type == 'ContractDefinition') {
                this.translateOneContractDefinition(ast.children[i], mainContract);
            }
        }
    }

    translateOneContractDefinition(contract: any, mainContract: string): void {
        const extendsClassesName = [];
        const otherClassesName = [];   //other classes name if use in contract for example using new or some other methods
        const contractTypeDetail = {
            isAbstractClass: false,
            isInterfaceClass: false,
            isLibrary: false
        };
        if (contract.kind == 'interface') {
            contractTypeDetail.isInterfaceClass = true;
            contractTypeDetail.isAbstractClass = true;
        }
        else if (contract.kind == 'library') {
            contractTypeDetail.isLibrary = true;
        }
        //assume all classes either extend or otherclasses must be declared above the current contract in the input file
        const builder: ClassBuilder = this
            .translateContract(contract, contractTypeDetail, extendsClassesName, otherClassesName, mainContract);
        this._projectClasses.set(contract.name, builder);

        let code: string = '';
        code = code.concat(builder.output);
        this.translatedCode.push({ Name: builder.fileName, Code: code, IsAbstractClass: contractTypeDetail.isAbstractClass, IsInterfaceClass: contractTypeDetail.isInterfaceClass, IsLibrary: contractTypeDetail.isLibrary });
    }


    translateContract(contract: any, contractTypeDetail: any, extendsClassesName: any, otherClassesName: any, mainContract: string): ClassBuilder {
        const contractName = contract.name;
        const isMainContract: boolean = mainContract === contractName;
        const mixin: Array<Mixins> = new Array<Mixins>();
        const classBuilder: ClassBuilder = new ClassBuilder();
        const hasBaseClass: boolean = contract.baseContracts.length > 0;

        const extendsClassesString = this.translatebaseClassesName(contract, isMainContract, mixin); //1
        classBuilder.imports = classBuilder.imports.concat(this.translateStructDefinitions(contract.subNodes, contractName)); //2
        classBuilder.imports = classBuilder.imports.concat(this.translateEnumDefinitions(contract.subNodes, contractName));  //3
        this.translateEventDeclarations(contract.subNodes, contractName); //4
        this.translateModifiers(contract.subNodes, contractName); //5
        this.translateFunctionDefinitions(contract.subNodes, contractName); //6
        this.translateUsingForDeclarations(contract.subNodes, contractName, otherClassesName); //7

        if (this._projectClasses.size > 0) {
            this._mixins.forEach(elem => {
                if (this._projectClasses.has(elem.getContractName())) {
                    const auxClass: ClassBuilder = this._projectClasses.get(elem.getContractName());
                    auxClass.fileName = elem.getContractName().concat('Mixin');
                    auxClass.signature = elem.composeMixinIntoString();
                    auxClass.concatAllFields();
                    this.translatedCode.find(idx => idx.Name == elem.getContractName()).Code = auxClass.output.concat('\n }');
                    this.translatedCode.find(contract => contract.Name === elem.getContractName()).Name = auxClass.fileName;
                }
            });
        }

        if (hasBaseClass) {
            classBuilder.imports = classBuilder
                .imports
                .concat(this.extractClassDependencies(contract.baseContracts));
        }
        classBuilder.fileName = contractName;
        classBuilder.signature = 'export class '.concat(contractName);
        if (mixin.length > 0) {
            classBuilder.signature = classBuilder
                .signature
                .concat(extendsClassesString)
                .concat(' {\n');
        } else {
            classBuilder.signature = classBuilder
                .signature
                .concat(extendsClassesString)
                .concat(' {\n');
        }

        if (!contractTypeDetail.isInterfaceClass) {

            classBuilder.variableStateDeclaration = this.translateStateVariableDeclaration(contract.subNodes, contractName, isMainContract); //8  
            contractTypeDetail.isAbstractClass = this.isAbstractContract(contractName); // 9
            classBuilder.constructorFunction = this.translateConstructor(contract.subNodes, contractName, mixin, otherClassesName, hasBaseClass); // 10 
            if (!contractTypeDetail.isAbstractClass && !contractTypeDetail.isLibrary) {
                classBuilder.overloadFunctions = this.translateOverloadedFunctions(contractName);//11
            }
            classBuilder.functions = this.translateFunctions(contract.subNodes, contractName, mixin, otherClassesName, contractTypeDetail.isLibrary, isMainContract); // 12
            classBuilder.mappingUndefinedFunctions = this.translateMappingUndefinedFunctions(contractName, otherClassesName); //13 
            if (otherClassesName.length > 0) {
                otherClassesName.forEach(elem => {
                    classBuilder.imports = classBuilder.imports.concat(this.extractClassDependencies(null, { name: elem }));
                });
            }
        }
        this._usings.forEach(value => {
            if (value.ContractName === classBuilder.fileName) {
                classBuilder.usings = value.usings
            }
        });
        classBuilder.concatAllFields();
        return classBuilder;
    }

    translatebaseClassesName(contract: any, isMainContract: boolean, extendedClasses: any): string {
        let output: string = isMainContract ? ' extends ' : '';
        if (contract.baseContracts.length != 0) {
            contract.baseContracts.forEach(elem => {
                output = output.concat(elem.baseName.namePath.concat('Mixin('));
                const mixinFunction: Mixins = new Mixins(elem.baseName.namePath);
                extendedClasses.push(mixinFunction);
                this._mixins.push(mixinFunction);
            });
            if (isMainContract) {
                output = output.concat('Contract');
            }
            contract.baseContracts.forEach(_ => {
                output = output.concat(')');
            });
            this._mixins = extendedClasses;
            return output;
        }
        return output.concat(isMainContract ? 'Contract' : '');
    }

    translateFunctions(contractParts: any, contractName: string, extendsClassesName: any, otherClassesName: any, isLibrary: boolean, isMainContract: boolean): string {
        let output: string = '';
        for (let i = 0; i < contractParts.length; i++) {
            if (contractParts[i].type == 'FunctionDefinition' && contractParts[i].name != contractName && contractParts[i].isConstructor == false
                && contractParts[i].body != null) {
                const isOverLoaded = BasicFunctions.getItemDetailWithContractName(contractParts[i].name, contractName, this.overloadedFunctionsList);
                output += TranslatorSubParts
                    .translateOneFunction(
                        contractParts[i],
                        contractName,
                        extendsClassesName,
                        otherClassesName,
                        isLibrary,
                        this.translatedCode,
                        isOverLoaded,
                        this.structsList,
                        this.enumsList,
                        this.eventsList,
                        this.modifiersList,
                        this.functionsList,
                        this.stateVariablesList,
                        this.mappingTypeList,
                        this.librariesList,
                        isMainContract
                    );
            }
        }
        return output;
    }

    translateStructDefinitions(contractParts: any, contractName: string): string {
        let imports = '';
        for (let i = 0; i < contractParts.length; i++) {
            if (contractParts[i].type == 'StructDefinition') {
                const structBuilt: StructBuilder = TranslatorSubParts.translateOneStructDefinition(contractParts[i], contractName);
                this.structsList.push(structBuilt);
                this.translatedCode.push({
                    Name: structBuilt.Name,
                    Code: structBuilt.output,
                    IsAbstractClass: false,
                    IsInterfaceClass: false,
                    IsLibrary: false,
                });
                imports = imports.concat(this.extractClassDependencies(null, contractParts[i]));
            }
        }
        return imports;
    }

    translateEnumDefinitions(contractParts: any, contractName: string): string {
        let imports: string = '';
        for (let i = 0; i < contractParts.length; i++) {
            if (contractParts[i].type == 'EnumDefinition') {
                const enumBuilt: EnumBuilder = TranslatorSubParts.translateOneEnumDefinition(contractParts[i], contractName);
                this.enumsList.push(enumBuilt);
                this.translatedCode.push({
                    Name: enumBuilt.Name,
                    Code: enumBuilt.output,
                    IsAbstractClass: false,
                    IsInterfaceClass: false,
                    IsLibrary: false,
                });
                imports = imports.concat(this.extractClassDependencies(null, contractParts[i]));
            }
        }
        return imports;
    }

    translateEventDeclarations(contractParts: any, contractName: string): void {
        for (let i = 0; i < contractParts.length; i++) {
            if (contractParts[i].type == 'EventDefinition') {
                this.eventsList.push(TranslatorSubParts.translateOneEventDefinition(contractParts[i], contractName));
            }
        }
    }

    translateModifiers(contractParts: any, contractName: string): void {
        for (let i = 0; i < contractParts.length; i++) {
            if (contractParts[i].type == 'ModifierDefinition') {
                this.modifiersList.push(
                    TranslatorSubParts.translateOneModifier(contractParts[i], contractName)
                );
            }
        }
    }

    translateFunctionDefinitions(contractParts: any, contractName: string): void {
        for (let i = 0; i < contractParts.length; i++) {
            if (contractParts[i].type == 'FunctionDefinition') {
                this.functionsList.push(TranslatorSubParts.translateOneFunctionDefinition(contractParts[i], contractName));
            }
        }
    }

    translateUsingForDeclarations(contractParts: any, contractName: string, otherClassesName: any): void {
        for (let i = 0; i < contractParts.length; i++) {
            if (contractParts[i].type == 'UsingForDeclaration') {
                const type: string = TranslateExpression.translateFunctionOrVariableType(contractParts[i].typeName, false);
                const usingBuilder: UsingBuilder = TranslatorSubParts.translateOneUsingForDeclaration(contractParts[i], contractName, this.functionsList);
                this.librariesList.push(usingBuilder);
                otherClassesName.push(usingBuilder.Name);
                if (contractParts[i].typeName.type === 'ElementaryTypeName') {
                    if (!this._usings.has(type)) {
                        this._usings.set(type, usingBuilder);
                    }
                }

            }
        }
    }

    translateStateVariableDeclaration(contractParts: any, contractName: string, isMainContract: boolean): string {
        let output: string = '';
        const gettersList = [];
        for (let i = 0; i < contractParts.length; i++) {
            if (contractParts[i].type == 'StateVariableDeclaration') {
                this.stateVariablesList.push(
                    TranslatorSubParts
                        .translateOneStateVariableDeclaration(
                            contractParts[i],
                            contractName,
                            gettersList,
                            this.structsList,
                            this.enumsList,
                            this.eventsList,
                            this.modifiersList,
                            this.functionsList,
                            this.stateVariablesList,
                            this.mappingTypeList,
                            this.librariesList
                        )
                );
            }
        }

        for (let i = 0; i < gettersList.length; i++) {
            if (!isMainContract) {
                output += TranslatorSubParts
                    .translateOneGetter(
                        contractName,
                        gettersList[i],
                        this.structsList,
                        this.enumsList,
                        this.eventsList,
                        this.modifiersList,
                        this.functionsList,
                        this.stateVariablesList,
                        this.mappingTypeList,
                        this.librariesList
                    );
            }
        }
        return output;
    }

    isAbstractContract(contractName: string): boolean {
        const _functionsList = BasicFunctions.getListWithGivenContractName(contractName, this.functionsList);
        for (let i = 0; i < _functionsList.length; i++) {
            if (_functionsList[i].IsImplementationExist == false) {
                return true;
            }
        }
        return false;
    }

    translateConstructor(contractParts: any, contractName: string, extendsClassesName: any, otherClassesName: any, hasBaseClass: boolean): string {
        // 3 type of constructor in solidity 
        // a. With Constructor KeyWord  
        // b. With Function Name = contract Name  
        // c. No define any thing in solidity
        let output: string = '';
        let contractHaveConstructor: boolean = false;
        for (let i = 0; i < contractParts.length; i++) {

            if (contractParts[i].isConstructor == true || (contractParts[i].type == 'FunctionDefinition' && contractParts[i].name == contractName)) {
                contractHaveConstructor = true;
                const parametersList = [];
                const returnParametersList = [];
                const changedVariables = []; //for checking state variables changes
                const localVariablesList = [];
                const variableCounter = { count: 0 };

                output = output.concat('public async Constructor(ctx: Context');
                const parameters: any[] = contractParts[i].parameters.parameters;
                for (let j = 0; j < parameters.length; ++j) {
                    if (j < parameters.length) {
                        output = output.concat(', ');
                    }
                    const type: string = TranslateExpression.translateFunctionOrVariableType(parameters[j].name, true);
                    output = output.concat(`${parameters[j].name}: ${type}`);

                }
                output = output.concat(') : Promise<void> { \n');
                if (extendsClassesName.length > 0) {
                    output = output.concat('super.Constructor(ctx);\n');
                }
                output += TranslatorSubParts
                    .byDefaultSetStateVariables(
                        contractName,
                        extendsClassesName,
                        this.structsList,
                        this.enumsList,
                        this.eventsList,
                        this.modifiersList,
                        this.functionsList,
                        this.stateVariablesList,
                        this.mappingTypeList,
                        this.librariesList,
                        this._monitor
                    );
                output += TranslatorSubParts.translateFunctionParameters(parameters, parametersList, '');

                output += TranslatorSubParts
                    .translateBody(
                        contractParts[i].body,
                        contractName,
                        parametersList,
                        returnParametersList,
                        changedVariables,
                        localVariablesList,
                        variableCounter,
                        extendsClassesName,
                        otherClassesName,
                        this.translatedCode,
                        this.structsList,
                        this.enumsList,
                        this.eventsList,
                        this.modifiersList,
                        this.functionsList,
                        this.stateVariablesList,
                        this.mappingTypeList,
                        this.librariesList,
                        [false]
                    );
                break;
            }
        }
        if (!contractHaveConstructor) {
            output = output.concat(`public async Constructor(ctx: Context): Promise<void> { \n  `);
            if (hasBaseClass) {
                output = output.concat('super.Constructor(ctx);\n');
            }
            output = output.concat(
                TranslatorSubParts
                    .byDefaultSetStateVariables(
                        contractName,
                        extendsClassesName,
                        this.structsList,
                        this.enumsList,
                        this.eventsList,
                        this.modifiersList,
                        this.functionsList,
                        this.stateVariablesList,
                        this.mappingTypeList,
                        this.librariesList,
                        this._monitor
                    )
            );
        }
        output += `} \n`;
        return output;
    }

    translateInitFunction(contractParts: any): string {
        throw new Error("Method not implemented.");
    }

    translateOverloadedFunctions(contractName: string): string {
        let output: string = '';
        const contractFunctionList = [];
        for (let i = 0; i < this.functionsList.length; i++) {
            if (this.functionsList[i].ContractName == contractName) {
                contractFunctionList.push(this.functionsList[i]);
            }
        }
        const overloadedFunctions = [];
        for (let i = 0; i < contractFunctionList.length; i++) {
            const functionName = contractFunctionList[i].Name;
            for (let j = i + 1; j < contractFunctionList.length; j++) {
                if (contractFunctionList[j].Name == functionName) {
                    if (!overloadedFunctions.includes(functionName)) {
                        overloadedFunctions.push(functionName);
                    }
                }
            }
        }
        for (let i = 0; i < overloadedFunctions.length; i++) {
            const name = overloadedFunctions[i];
            const list = [];
            for (let j = 0; j < contractFunctionList.length; j++) {
                if (name == contractFunctionList[j].Name) {
                    list.push(contractFunctionList[j].Parameters.length);
                }
            }
            this.overloadedFunctionsList.push({ Name: name, List: list, ContractName: contractName });
        }
        for (let i = 0; i < this.overloadedFunctionsList.length; i++) {
            output += `async ` + this.overloadedFunctionsList[i].Name + `(ctx: Context) { \n let method;\n`;
            for (let j = 0; j < this.overloadedFunctionsList[i].List.length; j++) {
                output += `if (args.length == ` + (this.overloadedFunctionsList[i].List[j] + 1) + ` ){\n  method = thisClass['` + this.overloadedFunctionsList[i].Name + `_` + this.overloadedFunctionsList[i].List[j] + `']; \nreturn await method(stub, args, thisClass);\n}`
            }
            output += '}\n';
        }
        return output;
    }

    translateMappingUndefinedFunctions(contractName: string, otherClassesName: string[]): string {
        let output: string = '';
        const contractMappingType = BasicFunctions.getListWithGivenContractName(contractName, this.mappingTypeList);
        for (let i = 0; i < contractMappingType.length; i++) {
            output += `async Mapping` + contractMappingType[i].Name + `(` + contractMappingType[i].Name + `,arg1`;
            let typeName = contractMappingType[i].ValueType;
            let counter = 1;
            while (typeName.type == 'Mapping') {
                typeName = typeName.valueType;
                counter++;
                output += `,arg` + counter;
            }
            output += '){\n';
            typeName = contractMappingType[i].ValueType;
            let indexOutputString = '';
            counter = 1;
            do {
                indexOutputString += '[arg' + counter + ']';
                output += 'if(' + contractMappingType[i].Name + indexOutputString + ' == undefined) {\n';
                output += contractMappingType[i].Name + indexOutputString + ' =';
                if (typeName.type == 'UserDefinedTypeName' && !BasicFunctions.isItemExistInList(typeName.namePath, this.enumsList)) {
                    const idx: number = typeName.namePath.indexOf('.');
                    const namePath: string = idx !== -1 ? typeName.namePath.substring(idx + 1, typeName.namePath.length) : typeName.namePath;
                    const structDetail = BasicFunctions.getItemDetail(namePath, this.structsList);
                    if (!otherClassesName.includes(structDetail.Name)) {
                        otherClassesName.push(structDetail.Name);
                    }
                    output += ` new ${structDetail.Name}(`;
                    for (let j = 0; j < structDetail.members.length; j++) {
                        output += BasicFunctions.defaultValue(structDetail.memberTypes[j]);
                        if (j != structDetail.members.length - 1) {
                            output += `, `;
                        }
                    }
                    output += `);\n }`;
                }
                else {
                    output += BasicFunctions.defaultValue(typeName) + `;\n}\n`;
                }
                counter++;
                if (typeName.type != 'Mapping') {
                    break;
                }
                typeName = typeName.valueType;
            }
            while (1);
            output += '}\n';
        }
        return output;
    }

    extractClassDependencies(baseClasse?: any[], structEnum?: any): string {
        let imports: string = "";
        if (baseClasse !== null) {
            baseClasse.forEach(elem => {
                imports = imports.concat(`import { ${elem.baseName.namePath}Mixin } from \'./${elem.baseName.namePath}Mixin\';\n`);
            });
            return imports;
        }
        if (structEnum !== null) {
            return `import { ${structEnum.name} } from \'./${structEnum.name}\';\n`;
        }
        return imports;
    }

    write(outputDir: string, fileName: string): void {
        const needUtilsOrBalance: boolean = this._monitor.needUtilsClass() || this._monitor.needBalanceClass();
        const outputPath: string = path.join(outputDir, fileName);
        let imports: string = "";
        if (!fs.existsSync(outputPath)) {
            fs.mkdirSync(outputPath);
            fs.mkdirSync(outputPath.concat('/src'));
            if (needUtilsOrBalance) {
                fs.mkdirSync(outputPath.concat('/src/utils'));
            }
            if (this._monitor.needUtilsClass()) {
                fs.writeFileSync(
                    outputPath.concat('/src/utils/Utils.ts'),
                    ConstantCode.build()
                );
                this._monitor.addSourceFile('Utils.ts', "./src/utils/");
                imports += ConstantCode.utils;
            }
            if (this._monitor.needBalanceClass()) {
                fs.writeFileSync(
                    outputPath.concat('/src/utils/Balance.ts'),
                    ConstantCode.balanceClass()
                );
                this._monitor.addSourceFile('Balance.ts', "./src/utils/");
                imports += ConstantCode.balance;
            }
        }
        for (let i = 0; i < this.translatedCode.length; i++) {
            const contractDetail = this.translatedCode[i];
            let output: string = ConstantCode.header(fileName == contractDetail.Name).concat(imports);
            const contractFileName: string = contractDetail.Name;
            output = output.concat(contractDetail.Code);
            this._monitor.addSourceFile(`${contractFileName}.ts`, "./src/");
            fs.writeFileSync(
                outputPath.concat('/src/').concat(`${contractFileName}.ts`),
                output
            );
        }
        fs.writeFileSync(
            outputPath.concat('/src/index.ts'),
            ConstantCode.indexTsFile(fileName)
        );
        this._monitor.addSourceFile(`index.ts`, "./src/");

        fs.writeFileSync(
            outputPath.concat('/package.json'),
            ConstantCode.packageJsonFile(fileName)
        );
        this._monitor.addSourceFile(`package.json`, "./");

        fs.writeFileSync(
            outputPath.concat('/tsconfig.json'),
            ConstantCode.tsConfigJson
        );
        this._monitor.addSourceFile(`tsconfig.json`, "./");

        fs.writeFileSync(
            outputPath.concat('/tslint.json'),
            ConstantCode.tslintJson
        );
        this._monitor.addSourceFile(`tslint.json`, "./");

        this._monitor.setUtils(false);
        this._monitor.setBalanceClass(false);
    }



}