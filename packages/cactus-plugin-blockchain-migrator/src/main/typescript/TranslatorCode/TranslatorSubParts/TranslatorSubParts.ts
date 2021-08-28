import { TranslateExpression } from './TranslateExpression';
import { BasicFunctions } from '../BasicFunctions/BasicFunctions';
import { TranslateStatements } from './TranslateStatements';
import { EnumBuilder } from '../../model/src_model/typescript/EnumBuilder';
import { StructBuilder } from '../../model/src_model/typescript/StructBuilder';
import { UsingBuilder } from '../../model/src_model/typescript/UsingBuilder';
import { Monitor } from '../../monitor/Monitor';

declare global {
  interface String {
    replaceAll(search: string, replacement: string): string;
  }
}

String.prototype.replaceAll = function (search, replacement) { // For Replace All
  let target: string = this;
  return target.replace(new RegExp(search, 'g'), replacement);
};

export class TranslatorSubParts {

  static translateParameters(functionParameters, stateMutability?: string) {

    let parameters = [];
    for (let i = 0; i < functionParameters.length; i++) {
      let typeName = functionParameters[i].typeName;
      let variablename: string = functionParameters[i].name;
      parameters.push({ Name: variablename, TypeName: typeName });
    }
    if (stateMutability !== undefined && stateMutability === 'payable') {
      parameters.push({ Name: 'value', TypeName: { type: 'ElementaryTypeName', name: 'uint' } });
    }
    return parameters;
  }

  static translateStorageVariables(localVariablesList, changedVariables): string {
    let output: string = '';
    for (let i = 0; i < localVariablesList.length; i++) {
      if (localVariablesList[i].Type == 'storage') {
        let x: string = localVariablesList[i].InitValue.split('[')[0];
        if (!changedVariables.includes(localVariablesList[i].InitValue.split('[')[0])) {
          changedVariables.push(localVariablesList[i].InitValue.split('[')[0]);
        }
        output += localVariablesList[i].InitValue + ` = ` + localVariablesList[i].Name + `;
      `;
      }
    }
    return output;
  }

  static putChangesInOneStateVariable(contractName, variableDetail, changedVariable, variableCounter, enumsList): string {
    let output: string = '';
    if (variableDetail.TypeName.type == 'ElementaryTypeName' || (variableDetail.TypeName.type == 'UserDefinedTypeName' && BasicFunctions.isItemExistInListWithContractName(variableDetail.TypeName.namePath, contractName, enumsList))) {
      output += `\nawait ctx.stub.putState('` + changedVariable + `', Buffer.from(` + changedVariable + `.toString()));\n`;
    }
    else if (variableDetail.TypeName.type == 'ArrayTypeName' || variableDetail.TypeName.type == 'Mapping') {
      output += `let tempJSON${variableCounter.count} = JSON.stringify(${changedVariable}, Utils.replacer);
    await ctx.stub.putState('${changedVariable}', Buffer.from(tempJSON${variableCounter.count++}));\n`;
    }
    return output;
  }

  static putChangesInStateVariables(contractName, changedVariables, extendsClassesName, variableCounter, structsList, enumsList, eventsList, modifiersList, functionsList, stateVariablesList, mappingTypeList, librarysList): string {
    let output: string = '';

    for (let i = 0; i < changedVariables.length; i++) {
      if (BasicFunctions.isItemExistInListWithContractName(changedVariables[i], contractName, stateVariablesList)) {  //for derived class variables
        let variableDetail = BasicFunctions.getItemDetailWithContractName(changedVariables[i], contractName, stateVariablesList);
        output += this.putChangesInOneStateVariable(contractName, variableDetail, changedVariables[i], variableCounter, enumsList);
      }
      else {
        for (let j = 0; j < extendsClassesName.length; j++) {
          if (BasicFunctions.isItemExistInListWithContractName(changedVariables[i], extendsClassesName[j], stateVariablesList)) {  //for base class variables
            let variableDetail = BasicFunctions.getItemDetailWithContractName(changedVariables[i], extendsClassesName[j], stateVariablesList);
            output += this.putChangesInOneStateVariable(extendsClassesName[j], variableDetail, changedVariables[i], variableCounter, enumsList);
          }
        }
      }
    }
    return output;
  }

  static translateReturnParameters(parameters, returnParametersList): string {
    let output: string = '';

    for (let i = 0; i < parameters.length; i++) {
      let variableName = '';
      let typeName = parameters[i].typeName;
      if (parameters[i].name != null) {
        variableName = parameters[i].name;
        output += `let ` + variableName + ` = ` + BasicFunctions.defaultValue(typeName) + `;\n`;
      }
      returnParametersList.push({ Name: variableName, TypeName: typeName });
    }
    return output;
  }

  static getStateOneVariable(variableDetail, variableCounter): string {
    let output: string = '';

    if (variableDetail.TypeName.type == 'ElementaryTypeName' && (variableDetail.TypeName.name.replace(/\'/g, '').split(/(\d+)/)[0] == 'uint'
      || variableDetail.TypeName.name.replace(/\'/g, '').split(/(\d+)/)[0] == 'int')) {
      output = output
        .concat(`let ${variableDetail.Name}: number = parseFloat((await ctx.stub.getState('${variableDetail.Name}')).toString());\n`);
    }
    else if (variableDetail.TypeName.type == 'ElementaryTypeName' && (variableDetail.TypeName.name == 'bool')) {
      output += `let temp` + variableCounter.count + ` = await ctx.stub.getState('` + variableDetail.Name + `');
      let ` + variableDetail.Name + ` = JSON.parse(temp` + variableCounter.count++ + `);\n`;
    }
    else if (variableDetail.TypeName.type == 'ElementaryTypeName' && (variableDetail.TypeName.name == 'address' || variableDetail.TypeName.name == 'string' || variableDetail.TypeName.name.startsWith("bytes"))) {
      output += `let temp` + variableCounter.count + ` = await ctx.stub.getState('` + variableDetail.Name + `');
      let ` + variableDetail.Name + ` = temp` + variableCounter.count++ + `.toString();\n`;
    }
    else if (variableDetail.TypeName.type == 'UserDefinedTypeName') {
      let name: string = variableDetail.Name;
      let type: string = TranslateExpression.translateFunctionOrVariableType(variableDetail.TypeName, false);
      output += `let temp${variableCounter.count} = await ctx.stub.getState('${name}');
      let ${name}: ${type} = (${type}) [temp${variableCounter.count++}.toString()];\n`;
    }
    else if (variableDetail.TypeName.type == 'Mapping' || variableDetail.TypeName.type == 'ArrayTypeName') {
      let type: string = TranslateExpression.translateFunctionOrVariableType(variableDetail.TypeName, false);
      let fieldType: string = type === '' ? '' : `: ${type}`;
      output = output
        .concat(`let ${variableDetail.Name}${fieldType} = JSON.parse(( await ctx.stub.getState('${variableDetail.Name}')).toString(), Utils.reviver);\n`);
    }
    return output;
  }

  static getStateVariables(contractName, extendsClassesName, variableCounter, stateVariablesList): string {
    let output: string = '';

    let derivedClassStateVariableList = BasicFunctions.getListWithGivenContractName(contractName, stateVariablesList);

    for (let i = 0; i < derivedClassStateVariableList.length; i++) { // for derived class
      output += this.getStateOneVariable(derivedClassStateVariableList[i], variableCounter);
    }

    for (let i = 0; i < extendsClassesName.length; i++) { // for base classes
      let basedClassStateVariableList = BasicFunctions.getListWithGivenContractName(extendsClassesName[i], stateVariablesList);
      for (let j = 0; j < basedClassStateVariableList.length; j++) {
        output += this.getStateOneVariable(basedClassStateVariableList[j], variableCounter)
      }
    }
    return output;
  }


  static returnParameters(returnParametersList, isLibrary): string // for the time being only one variable return
  {
    let output: string = '';
    if (returnParametersList.length > 0 && returnParametersList[0].Name != "") {
      if (isLibrary) {
        output += `return ` + returnParametersList[0].Name + `;\n`;
      }
      else {
        output = output.concat(`return ${returnParametersList[0].Name};`)
      }
    }
    return output;
  }
  static translateModifiersCode(contractName, functionModifiers, parametersList, returnParametersList, changedVariables, localVariablesList, variableCounter, extendsClassesName, otherClassesName, contractsTranslatedCode, isBefore, structsList, enumsList, eventsList, modifiersList, functionsList, stateVariablesList, mappingTypeList, librarysList, interfaceContractVariableName, isLibrary): string {


    let oneModifier: string = '';

    for (let i = 0; i < functionModifiers.length; i++) {

      if (BasicFunctions.isItemExistInList(functionModifiers[i].name, modifiersList)) {
        let modifierDetail = BasicFunctions.getItemDetail(functionModifiers[i].name, modifiersList)

        let localVariablesList = [];
        localVariablesList.push({ Scope: 0, ListofVariables: [] });

        if (isBefore == true) {
          for (let k = 0; k < modifierDetail.BeforeStatements.length; k++) {
            oneModifier += this.translateOneStatement(modifierDetail.BeforeStatements[k], contractName, parametersList, returnParametersList, changedVariables, localVariablesList, variableCounter, extendsClassesName, otherClassesName, contractsTranslatedCode, structsList, enumsList, eventsList, modifiersList, functionsList, stateVariablesList, mappingTypeList, librarysList, interfaceContractVariableName, [false], isLibrary);
          }
        }
        else {
          for (let k = 0; k < modifierDetail.AfterStatements.length; k++) {
            oneModifier += this.translateOneStatement(modifierDetail.AfterStatements[k], contractName, parametersList, returnParametersList, changedVariables, localVariablesList, variableCounter, extendsClassesName, otherClassesName, contractsTranslatedCode, structsList, enumsList, eventsList, modifiersList, functionsList, stateVariablesList, mappingTypeList, librarysList, interfaceContractVariableName, [false], isLibrary)
          }
        }

        oneModifier += this.translateStorageVariables(localVariablesList.pop().ListofVariables, changedVariables);

        for (let k = 0; k < functionModifiers[i].arguments.length; k++) {
          if (functionModifiers[i].arguments[k].type == 'BinaryOperation') {

            let mappingVariablesList = [];
            let functionCallsList = [];
            let expressionStatement = TranslateExpression
              .translateExpression(
                functionModifiers[i].arguments[k],
                mappingVariablesList,
                functionCallsList,
                changedVariables,
                localVariablesList,
                structsList,
                enumsList,
                eventsList,
                modifiersList,
                functionsList,
                stateVariablesList,
                mappingTypeList,
                librarysList,
                interfaceContractVariableName
              );
            oneModifier = oneModifier.replaceAll(modifierDetail.Parameters[k].Name, ' ' + expressionStatement + ' ');
          }
          else if (functionModifiers[i].arguments[k].type == 'MemberAccess'
            && BasicFunctions.isItemExistInList(functionModifiers[i].arguments[k].expression.name, enumsList)) {
            let EnumType = functionModifiers[i].arguments[k].expression.name;
            let enumDetail = BasicFunctions.getItemDetail(EnumType, enumsList);
            let EnumValue = enumDetail.Index;
            oneModifier = oneModifier.replaceAll(modifierDetail.Parameters[k].Name, ' ' + EnumValue + ' ');
          }
        }
      }
    }
    return oneModifier;
  }

  static translateOneStructDefinition(structDefinition, contractName): StructBuilder {
    let structBuilder: StructBuilder = new StructBuilder();
    structBuilder.build(structDefinition, contractName);
    return structBuilder;
  }

  static translateOneEnumDefinition(enumDefinition, contractName): EnumBuilder {
    let enumBuilder: EnumBuilder = new EnumBuilder();
    enumBuilder.build(enumDefinition, contractName);
    return enumBuilder
  }

  static translateOneUsingForDeclaration(usingForStatement, contractName, functionList: any[]): UsingBuilder {
    let type: string = TranslateExpression.translateFunctionOrVariableType(usingForStatement.typeName, false);
    let usingBuilder: UsingBuilder = new UsingBuilder(
      type,
      functionList.filter(elem => elem.ContractName === usingForStatement.libraryName),
      contractName,
      usingForStatement.libraryName,
      usingForStatement.typeName
    );
    usingBuilder.build();
    return usingBuilder;
  }

  static translateOneEventDefinition(eventDefinition, contractName) {

    let name = eventDefinition.name;
    let parameters = this.translateParameters(eventDefinition.parameters.parameters);
    let event = { Name: name, Parameters: parameters, ContractName: contractName }
    return event;
  }

  static translateOneModifier(modifier, contractName) { // only handle Expression Satement (not handled if,while,for)

    let beforeStatements = [];
    let afterStatements = [];
    let name = modifier.name;
    let parameters = this.translateParameters(modifier.parameters.parameters);

    let body = modifier.body;
    let j = 0;
    for (j = 0; j < body.statements.length; j++) {
      if (body.statements[j].expression.type == 'Identifier' && body.statements[j].expression.name == '_') break;
      beforeStatements.push(body.statements[j]);
    }
    for (j = j + 1; j < body.statements.length; j++) {
      afterStatements.push(body.statements[j]);
    }

    let _modifier = {
      Name: name,
      Parameters: parameters,
      BeforeStatements: beforeStatements,
      AfterStatements: afterStatements,
      ContractName: contractName
    };
    return _modifier;
  }

  static translateOneFunctionDefinition(functionDefinition, contractName) {

    let name: string = '';
    let parameters = [];
    let returnParameters = [];
    let modifiers = [];
    let visibility: string = '';
    let stateMutability = '';
    let isConstructor = false;
    let isImplementationExist = false;

    if (functionDefinition.isConstructor == true || functionDefinition.name == contractName) {
      isConstructor = true;
    }
    else {
      name = functionDefinition.name;
    }

    if (functionDefinition.parameters != null) {
      parameters = this.translateParameters(functionDefinition.parameters.parameters, functionDefinition.stateMutability);
    }

    modifiers = functionDefinition.modifiers;
    visibility = functionDefinition.visibility;
    if (visibility == 'default') {
      visibility = 'public';
    }
    stateMutability = functionDefinition.stateMutability;
    if (functionDefinition.body != null) {
      isImplementationExist = true;
    }
    if (functionDefinition.returnParameters != null) {
      returnParameters = this.translateParameters(functionDefinition.returnParameters.parameters);
    }

    let functionDetail = {
      Name: name,
      Parameters: parameters,
      ReturnParameters: returnParameters,
      Modifiers: modifiers,
      Visibility: visibility,
      StateMutability: stateMutability,
      IsConstructor: isConstructor,
      IsImplementationExist: isImplementationExist,
      ContractName: contractName
    }
    return functionDetail;

  }

  static translateOneStateVariableDeclaration(stateVariableDeclaration, contractName, gettersList, structsList, enumsList, eventsList, modifiersList, functionsList, stateVariablesList, mappingTypeList, librarysList) {

    let variables = stateVariableDeclaration.variables;
    for (let i = 0; i < variables.length; i++) {

      if (variables[i].visibility == 'public') {
        gettersList.push({ Name: variables[i].name, contract: contractName, Call: `this.${variables[i].name}()` });
      }

      let variableName = variables[i].name;
      let typeName = variables[i].typeName;
      if (typeName.type == 'Mapping') {
        mappingTypeList.push({ Name: variableName, KeyType: typeName.keyType, ValueType: typeName.valueType, ContractName: contractName });
      }
      let initialValue = null;
      if (stateVariableDeclaration.initialValue != null) {
        initialValue = TranslateExpression
          .translateExpression(
            stateVariableDeclaration.initialValue,
            [],
            [],
            [],
            [],
            structsList,
            enumsList,
            eventsList,
            modifiersList,
            functionsList,
            stateVariablesList,
            mappingTypeList,
            librarysList,
            []
          );
      }
      let stateVariable = {
        Name: variableName,
        TypeName: typeName,
        InitialValue: initialValue,
        ContractName: contractName
      };
      return stateVariable;
    }
  }

  static translateOneGetter(contractName, variableName, structsList, enumsList, eventsList, modifiersList, functionsList, stateVariablesList, mappingTypeList, librarysList): string {
    let output: string = '';
    let variableDetail = BasicFunctions.getItemDetailWithContractName(variableName.Name, contractName, stateVariablesList);

    let type: string = TranslateExpression.translateFunctionOrVariableType(variableDetail.TypeName, false);
    output += `public async ${variableName.Name}(ctx: Context): Promise<${type}> { \n`;


    if (variableDetail.TypeName.type == 'ElementaryTypeName' || variableDetail.TypeName.type == 'UserDefinedTypeName'
      && BasicFunctions.isItemExistInListWithContractName(variableDetail.TypeName.namePath, contractName, enumsList)) {
      output = output
        .concat(`let returnTemp = await ctx.stub.getState('${variableName.Name}');\n`)
        .concat('return returnTemp.toString();\n');
    }
    else if (variableDetail.TypeName.type == 'ArrayTypeName' || variableDetail.TypeName.type == 'Mapping') {
      let numberOfArguments = 0;
      let argumentsOutput = '';
      let indexOutput = '';
      let typeName = variableDetail.TypeName;

      do {
        numberOfArguments++;
        if (typeName.type == 'ArrayTypeName') {
          typeName = typeName.baseTypeName;
          argumentsOutput += '\nlet arg' + numberOfArguments + ' = parseFloat(args[' + (numberOfArguments) + ']);\n'
        }
        else if (typeName.type == 'Mapping') {
          typeName = typeName.valueType;
          argumentsOutput += '\nlet arg' + numberOfArguments + ' = args[' + (numberOfArguments) + '];\n'
        }
        indexOutput += `[arg` + numberOfArguments + `]`;
      }
      while (typeName.type == 'ArrayTypeName' || typeName.type == 'Mapping');

      output += argumentsOutput;

      output += `let temp = await ctx.stub.getState('` + variableName + `');
      let `+ variableName + ` = JSON.parse(temp); `

      if (variableDetail.TypeName.type == 'Mapping') {
        output += `\nlet method = thisClass['Mapping` + variableName + `'];\n`;
        output += 'await method(' + variableName;
        for (let i = 1; i <= numberOfArguments; i++) {
          output += ',arg' + i;
        }
        output += ');\n';
      }

      output += `return Buffer.from(` + variableName + `` + indexOutput + `.toString());`;
      output = output.concat('\n');

    }
    output = output.concat('}\n');

    return output;
  }

  static ByDefaultSetStateOneVariable(stateVariable, contractName, enumsList, monitor: Monitor): string {

    let output: string = '';
    if (stateVariable.TypeName.type == 'ElementaryTypeName' || (stateVariable.TypeName.type == 'UserDefinedTypeName'
      && BasicFunctions.isItemExistInListWithContractName(stateVariable.TypeName.namePath, contractName, enumsList))) {

      let initalValue = BasicFunctions.defaultValue(stateVariable.TypeName);
      if (stateVariable.InitialValue != null) {
        initalValue = stateVariable.InitialValue;
      }
      return output += ` let ${stateVariable.Name}: ${TranslateExpression.translateFunctionOrVariableType(stateVariable.TypeName, false)}  = ${initalValue};
    await ctx.stub.putState('`+ stateVariable.Name + `', Buffer.from(` + stateVariable.Name + `.toString()));\n`;
    }
    if (stateVariable.TypeName.type == 'Mapping') {
      monitor.setUtils(true);
      return output = output
        .concat(`let ${stateVariable.Name} = {}\n`)
        .concat(`await ctx.stub.putState('${stateVariable.Name}', Buffer.from(JSON.stringify(${stateVariable.Name}, Utils.replacer)));\n`);
    }
    if (stateVariable.TypeName.type == 'ArrayTypeName') {
      return output += `let ${stateVariable.Name} = [];
      await ctx.stub.putState('${stateVariable.Name}', Buffer.from(JSON.stringify(${stateVariable.Name})));\n`;
    }
    return output;
  }

  static byDefaultSetStateVariables(contractName, extendsClassesName, structsList, enumsList, eventsList, modifiersList, functionsList, stateVariablesList, mappingTypeList, librarysList, monitor: Monitor): string {
    let output: string = '';

    let derivedClassStateVariableList = BasicFunctions.getListWithGivenContractName(contractName, stateVariablesList);

    for (let i = 0; i < derivedClassStateVariableList.length; i++) { // for derived class
      output += this.ByDefaultSetStateOneVariable(derivedClassStateVariableList[i], contractName, enumsList, monitor);
    }

    for (let i = 0; i < extendsClassesName.length; i++) { // for base classes
      let basedClassStateVariableList = BasicFunctions.getListWithGivenContractName(extendsClassesName[i], stateVariablesList);
      for (let j = 0; j < basedClassStateVariableList.length; j++) {
        output += this.ByDefaultSetStateOneVariable(basedClassStateVariableList[j], extendsClassesName[i], enumsList, monitor);
      }
    }
    return output;
  }

  static translateFunctionParameters(parameters, parametersList, stateMutability: string): string {
    let output: string = '';

    /* let output: string = `\nif (args.length != ` + (parameters.length + 1) + ` ){
            throw new Error('Incorrect number of arguments. Expecting `+ (parameters.length + 1) + `');
          }\n
          let now = await ConstantClass.getNowValue(); 
          let block = { timestamp:now }; //block.timestamp is alias for now 
          let msg = { value:parseFloat(args[0]) , sender:await ConstantClass.getSenderAddress(stub)};
          let _this = await stub.getState('This');  // contract address\n`; */
    if (stateMutability === 'payable') {
      parameters.push({
        name: 'value',
        typeName: {
          type: 'ElementaryTypeName',
          name: 'int'
        }
      });
    }
    for (let i = 0; i < parameters.length; i++) {
      let variableName = parameters[i].name;
      let typeName = parameters[i].typeName;
      if (typeName.type == 'ElementaryTypeName') {
        if (typeName.name.replace(/\'/g, '').split(/(\d+)/)[0] == 'int' || typeName.name.replace(/\'/g, '').split(/(\d+)/)[0] == 'uint') {
          output = output.concat(`\nlet ${variableName}${i} : number = parseFloat(${variableName});\n`);
          output = output.concat(`if(typeof ${variableName}${i} !== 'number') { 
          throw new Error('${variableName} should be of type number');
          }\n`)
        }
        else if (typeName.name == 'address' || typeName.name == 'bytes32' || typeName.name == 'string' || typeName.name == 'bytes') {
          output = output.concat(`\nlet ${variableName}${i} : string = ${variableName};\n`);
        }
      }
      else if ((typeName.type == 'ArrayTypeName')) {
        output += `\nlet ${variableName}${i} = JSON.parse(${variableName}, Utils.reviver);\n`;
      }
      parametersList.push({ Name: variableName.concat(i), TypeName: typeName, parameter: variableName });
    }
    return output;
  }

  static translateOneStatement(statement, contractName, parametersList, returnParametersList, changedVariables, localVariablesList, variableCounter, extendsClassesName, otherClassesName, contractsTranslatedCode, structsList, enumsList, eventsList, modifiersList, functionsList, stateVariablesList, mappingTypeList, librarysList, interfaceContractVariableName, hasTranslatedReturn: boolean[], isLibrary?): string {
    let output: string = '';
    if (statement.type == 'ExpressionStatement') {
      return TranslateStatements.translateExpressionStatement(statement, contractName, parametersList, returnParametersList, changedVariables, localVariablesList, variableCounter, extendsClassesName, otherClassesName, contractsTranslatedCode, structsList, enumsList, eventsList, modifiersList, functionsList, stateVariablesList, mappingTypeList, librarysList, interfaceContractVariableName);
    }
    if (statement.type == 'ReturnStatement') {
      hasTranslatedReturn[0] = true;
      return TranslateStatements.translateReturnStatement(statement, contractName, parametersList, returnParametersList, changedVariables, localVariablesList, variableCounter, extendsClassesName, otherClassesName, contractsTranslatedCode, structsList, enumsList, eventsList, modifiersList, functionsList, stateVariablesList, mappingTypeList, librarysList, interfaceContractVariableName, isLibrary);
    }
    if (statement.type == 'IfStatement') {
      return TranslateStatements.translateIfStatement(statement, contractName, parametersList, returnParametersList, changedVariables, localVariablesList, variableCounter, extendsClassesName, otherClassesName, contractsTranslatedCode, structsList, enumsList, eventsList, modifiersList, functionsList, stateVariablesList, mappingTypeList, librarysList, interfaceContractVariableName, hasTranslatedReturn);
    }
    if (statement.type == 'ForStatement') {
      return TranslateStatements.translateForStatement(statement, contractName, parametersList, returnParametersList, changedVariables, localVariablesList, variableCounter, extendsClassesName, otherClassesName, contractsTranslatedCode, structsList, enumsList, eventsList, modifiersList, functionsList, stateVariablesList, mappingTypeList, librarysList, interfaceContractVariableName, isLibrary, hasTranslatedReturn);
    }
    if (statement.type == 'WhileStatement') {
      return TranslateStatements.translateWhileStatement(statement, contractName, parametersList, returnParametersList, changedVariables, localVariablesList, variableCounter, extendsClassesName, otherClassesName, contractsTranslatedCode, structsList, enumsList, eventsList, modifiersList, functionsList, stateVariablesList, mappingTypeList, librarysList, interfaceContractVariableName, isLibrary);
    }
    if (statement.type == 'VariableDeclarationStatement') {
      return TranslateStatements.translateVariableDeclarationStatement(statement, contractName, parametersList, returnParametersList, changedVariables, localVariablesList, variableCounter, extendsClassesName, otherClassesName, contractsTranslatedCode, structsList, enumsList, eventsList, modifiersList, functionsList, stateVariablesList, mappingTypeList, librarysList, interfaceContractVariableName);
    }
    if (statement.type == 'EmitStatement') {
      return TranslateStatements.translateEmitStatement(statement, contractName, parametersList, returnParametersList, changedVariables, localVariablesList, variableCounter, extendsClassesName, otherClassesName, contractsTranslatedCode, structsList, enumsList, eventsList, modifiersList, functionsList, stateVariablesList, mappingTypeList, librarysList, interfaceContractVariableName);
    }
    if (statement.type == 'Block') {
      return this.translateBody(statement, contractName, parametersList, returnParametersList, changedVariables, localVariablesList, variableCounter, extendsClassesName, otherClassesName, contractsTranslatedCode, structsList, enumsList, eventsList, modifiersList, functionsList, stateVariablesList, mappingTypeList, librarysList, hasTranslatedReturn, interfaceContractVariableName, isLibrary);
    }
    if (statement.type == 'ContinueStatement') {
      return `continue;`
    }
    if (statement.type == 'BreakStatement') {
      return `break;`
    }
    if (statement.type == 'ThrowStatement') {
      return `throw 'Error';`
    }
    return output;
  }

  static translateBody(body, contractName, parametersList, returnParametersList, changedVariables, localVariablesList, variableCounter, extendsClassesName, otherClassesName, contractsTranslatedCode, structsList, enumsList, eventsList, modifiersList, functionsList, stateVariablesList, mappingTypeList, librarysList, hasTranslatedReturn: boolean[], interfaceContractVariableName?, isLibrary?): string {

    localVariablesList.push({ Scope: localVariablesList.length, ListofVariables: [] });
    let output: string = '';
    for (let i = 0; i < body.statements.length; i++) {
      output += this.translateOneStatement(
        body.statements[i],
        contractName,
        parametersList,
        returnParametersList,
        changedVariables,
        localVariablesList,
        variableCounter,
        extendsClassesName,
        otherClassesName,
        contractsTranslatedCode,
        structsList,
        enumsList,
        eventsList,
        modifiersList,
        functionsList,
        stateVariablesList,
        mappingTypeList,
        librarysList,
        interfaceContractVariableName,
        hasTranslatedReturn,
        isLibrary
      );
      output += '\n';
    }
    if (!hasTranslatedReturn[0]) {
      output += this.putChangesInStateVariables(contractName, changedVariables, extendsClassesName, variableCounter, structsList, enumsList, eventsList, modifiersList, functionsList, stateVariablesList, mappingTypeList, librarysList);
      let changedVariableSize: number = changedVariables.length;
      output += this.translateStorageVariables(localVariablesList.pop().ListofVariables, changedVariables); //2.h
      if (changedVariableSize !== changedVariables.length) {
        changedVariables = changedVariables.slice(changedVariableSize);
        output += this.putChangesInStateVariables(contractName, changedVariables, extendsClassesName, variableCounter, structsList, enumsList, eventsList, modifiersList, functionsList, stateVariablesList, mappingTypeList, librarysList);
      }
    }
    return output;
  }

  static translateOneFunction(functionDetail, contractName, extendsClassesName, otherClassesName, isLibrary, contractsTranslatedCode, isOverloaded, structsList, enumsList, eventsList, modifiersList, functionsList, stateVariablesList, mappingTypeList, librarysList, isMainContract: boolean): string {

    let output: string = '';
    let functionModifiers = functionDetail.modifiers;
    let parametersList = [];
    let returnParametersList = [];
    let localVariablesList = [];
    let changedVariables = [];
    let variableCounter = { count: 0 };
    let interfaceContractVariableName = [];
    output = this
      .constructFunctionSignature(
        functionDetail.parameters ? functionDetail.parameters.parameters : [],
        functionDetail.returnParameters ? functionDetail.returnParameters.parameters : [],
        functionDetail.visibility === 'public' || functionDetail.visibility === 'default',
        isOverloaded ? functionDetail.name.concat('_').concat(functionDetail.parameters.parameters.length) : functionDetail.name,
        functionDetail.stateMutability,
        isLibrary
      );
    if (!isLibrary) {
      output += this.translateFunctionParameters(functionDetail.parameters.parameters, parametersList, functionDetail.stateMutability);
    }

    if (functionDetail.returnParameters != null) {
      output += this.translateReturnParameters(functionDetail.returnParameters.parameters, returnParametersList);
    }
    let hasTranslatedReturn: boolean[] = [false];
    output += this.getStateVariables(contractName, extendsClassesName, variableCounter, stateVariablesList);
    output += this.translateModifiersCode(contractName, functionModifiers, parametersList, returnParametersList, changedVariables, localVariablesList, variableCounter, extendsClassesName, otherClassesName, contractsTranslatedCode, true, structsList, enumsList, eventsList, modifiersList, functionsList, stateVariablesList, mappingTypeList, librarysList, interfaceContractVariableName, isLibrary);
    output += this.translateBody(functionDetail.body, contractName, parametersList, returnParametersList, changedVariables, localVariablesList, variableCounter, extendsClassesName, otherClassesName, contractsTranslatedCode, structsList, enumsList, eventsList, modifiersList, functionsList, stateVariablesList, mappingTypeList, librarysList, hasTranslatedReturn, interfaceContractVariableName, isLibrary);
    output += this.translateModifiersCode(contractName, functionModifiers, parametersList, returnParametersList, changedVariables, localVariablesList, variableCounter, extendsClassesName, otherClassesName, contractsTranslatedCode, false, structsList, enumsList, eventsList, modifiersList, functionsList, stateVariablesList, mappingTypeList, librarysList, interfaceContractVariableName, isLibrary);
    if (!hasTranslatedReturn[0]) {
      output += this.returnParameters(returnParametersList, isLibrary);
    }
    output += `\n}\n`;

    return output;
  }


  private static constructFunctionSignature(inputParams: any[], returnParams: any[], isPublic: boolean, functionName: string, stateMutability: string, isLibrary: boolean): string {
    let toOutput: string = '';
    if (isLibrary) {
      toOutput = toOutput
        .concat(`static `)
        .concat(functionName)
        .concat(`(`);
      inputParams.forEach((elem, index) => {
        toOutput = toOutput
          .concat(elem.name)
          .concat(': ')
          .concat(TranslateExpression.translateFunctionOrVariableType(elem.typeName, false))
          .concat(index < inputParams.length - 1 ? ', ' : '');
      });
    } else {
      toOutput = isPublic ? 'public ' : 'private ';
      toOutput = toOutput
        .concat(`async `)
        .concat(functionName)
        .concat(`(ctx: Context`);
      toOutput = stateMutability === 'payable' ? toOutput.concat(', value: string') : toOutput;
      inputParams.forEach(elem => {
        toOutput = toOutput
          .concat(', ')
          .concat(elem.name)
          .concat(': ')
          .concat(TranslateExpression.translateFunctionOrVariableType(elem.typeName, true));
      });
    }

    toOutput = toOutput.concat('): ');
    let returnType: string;
    if (returnParams.length > 1) {
      toOutput = toOutput.concat(isLibrary ? 'any' : 'Promise<any>');
    } else {
      if (returnParams.length === 0) {
        returnType = TranslateExpression.translateFunctionOrVariableType('void', false);
      } else {
        returnType = TranslateExpression.translateFunctionOrVariableType(returnParams[0].typeName, false);
      }
      toOutput = toOutput.concat(isLibrary ? returnType : `Promise<${returnType}>`);
    }
    return toOutput.concat(' {\n');
  }

}