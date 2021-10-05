/* eslint-disable prettier/prettier */
import { TranslateExpression } from './TranslateExpression';
import { TranslatorSubParts } from './TranslatorSubParts';
import { BasicFunctions } from '../BasicFunctions/BasicFunctions';
import { Monitor } from '../../common/monitor/Monitor';

export class TranslateStatements {

  static getCommasSeparatedListString(parameters): string {
    let output: string = '';
    if (parameters != null) {
      for (let j = 0; j < parameters.length; j++) {
        output += parameters[j];
        if (j != parameters.length - 1) { output += ','; }
      }
    }
    return output;
  }
  static getFunctionCalls(contractName, mappingVariablesList, functionCallsList, changedVariables, variableCounter, structsList, enumsList, eventsList, modifiersList, functionsList, stateVariablesList, mappingTypeList, librarysList, monitor: Monitor): string {
    let output: string = '';

    for (let i = 0; i < functionCallsList.length; i++) {

      if (!BasicFunctions.isItemExistInList(functionCallsList[i].Name, functionsList) && (functionCallsList[i].Name == 'send' || functionCallsList[i].Name == 'transfer')) {
        monitor.setBalanceClass(true);
        output += '\nlet result' + variableCounter.count + ' = await Balance.send(ctx, await ctx.clientIdentity.getID(),' + functionCallsList[i].PreFunction + ',' + this.getCommasSeparatedListString(functionCallsList[i].Parameters) + `);\n`;
        functionCallsList[i].replaceVariable = variableCounter.count++;
        return output;
      }
      if (!BasicFunctions.isItemExistInList(functionCallsList[i].Name, functionsList) && functionCallsList[i].Name == 'balance') {
        monitor.setBalanceClass(true);
        output += '\nlet result' + variableCounter.count + ' = await Balance.' + functionCallsList[i].Name + '(ctx, ctx.clientIdentity.getID());\n';
        functionCallsList[i].replaceVariable = variableCounter.count++;
        return output;
      }
      if (!BasicFunctions.isItemExistInList(functionCallsList[i].Name, functionsList) && functionCallsList[i].Name == 'selfdestruct' || functionCallsList[i].Name == 'suicide') {
        output += '\nlet result' + variableCounter.count + ' = await  ConstantClass.' + 'selfdestruct' + '(stub , _this, ' + this.getCommasSeparatedListString(functionCallsList[i].Parameters) + `);`;
        functionCallsList[i].replaceVariable = variableCounter.count++;
      }
      else if (!BasicFunctions.isItemExistInList(functionCallsList[i].Name, functionsList)) {
        output += '\nlet result' + variableCounter.count + ' = await  ConstantClass.' + functionCallsList[i].Name + '(' + this.getCommasSeparatedListString(functionCallsList[i].Parameters) + `);`;
        functionCallsList[i].replaceVariable = variableCounter.count++;
      }
      else if (BasicFunctions.isItemExistInList(functionCallsList[i].Name, functionsList)) {
        functionCallsList[i].replaceVariable = variableCounter.count++;
        let functionDetail = BasicFunctions.getItemDetail(functionCallsList[i].Name, functionsList);
        if (functionDetail.Visibility == 'public') {
          output += 'stub,[ msg.value ';
          if (functionCallsList[i].Parameters != null && functionCallsList[i].Parameters.length > 0) {
            output += ',' + this.getCommasSeparatedListString(functionCallsList[i].Parameters);
          }
          output += '],thisClass' + `);`;
        }
        else {
          if (functionCallsList[i].Parameters != null && functionCallsList[i].Parameters.length > 0) {
            output += ',' + this.getCommasSeparatedListString(functionCallsList[i].Parameters);
          }
        }
      }
    }
    return output;
  }

  static getMappingUndefined(contractName, mappingVariablesList, variableCounter, structsList, enumsList, eventsList, modifiersList, functionsList, stateVariablesList, mappingTypeList, librarysList, parametersList): string {

    let output: string = '';

    for (let i = 0; i < mappingVariablesList.length; i++) {
      if (BasicFunctions.isItemExistInList(mappingVariablesList[i].VariableName, stateVariablesList)) {
        let variableDetail = BasicFunctions.getItemDetail(mappingVariablesList[i].VariableName, stateVariablesList);

        if (variableDetail.TypeName.type == 'Mapping') {
          let key: string = mappingVariablesList[i].Key;
          if (parametersList !== undefined || parametersList.length > 0) {
            let param: any = parametersList.find(elem => elem.parameter === mappingVariablesList[i].Key);
            if (param !== undefined) {
              key = param.Name;
            }
          }
          output = output.concat(`this.Mapping${variableDetail.Name}(${variableDetail.Name}, ${key}`);
          let typeName = variableDetail.TypeName.valueType;
          while (typeName.type == 'Mapping') {
            i++;
            output += ',' + key;
            typeName = typeName.valueType;
          }
          output += ');\n';
        }
      }
    }
    return output;
  }

  static replaceWithFunctionResult(string, functionCallsList, functionsList): string {

    for (let i = 0; i < functionCallsList.length; i++) {
      let functionDetail = BasicFunctions.getItemDetail(functionCallsList[i].Name, functionsList);
      if ((BasicFunctions.isItemExistInList(functionCallsList[i].Name, functionsList) && functionDetail.ReturnParameters.length == 0) || (!BasicFunctions.isItemExistInList(functionCallsList[i].Name, functionsList) && functionCallsList[i].Name == 'transfer')) {
        string = string.replace('#' + functionCallsList[i].VariableNameReplaced + '#', '');
      }
      else {
        if (functionCallsList[i].Name === 'balance') {
          string = string.replace('#' + functionCallsList[i].VariableNameReplaced + '#', `result${functionCallsList[i].replaceVariable}`);
        } else {
          string = string.replace('#' + functionCallsList[i].VariableNameReplaced + '#', 'JSON.parse(result' + functionCallsList[i].replaceVariable + ')');
        }
      }
    }
    return string;
  }

  static translateVariableInitExpression(expression): string {
    let output: string = '';
    if (expression.variables.length > 0) {
      output += 'let ' + expression.variables[0].name + ' = ' + expression.initialValue.number;
    }
    return output;
  }

  static translateExpressionStatement(statement, contractName, parametersList, returnParametersList, changedVariables, localVariablesList, variableCounter, extendsClassesName, otherClassesName, contractsTranslatedCode, structsList, enumsList, eventsList, modifiersList, functionsList, stateVariablesList, mappingTypeList, librarysList, interfaceContractVariableName, monitor: Monitor): string {

    let output: string = '';
    let mappingVariablesList = [];
    let functionCallsList = [];
    let expressionStatement = TranslateExpression.translateExpression(statement.expression, mappingVariablesList, functionCallsList, changedVariables, localVariablesList, structsList, enumsList, eventsList, modifiersList, functionsList, stateVariablesList, mappingTypeList, librarysList, parametersList, interfaceContractVariableName);
    let functionCallsStatements = this.getFunctionCalls(contractName, mappingVariablesList, functionCallsList, changedVariables, variableCounter, structsList, enumsList, eventsList, modifiersList, functionsList, stateVariablesList, mappingTypeList, librarysList, monitor);
    let mappingStatements = this.getMappingUndefined(contractName, mappingVariablesList, variableCounter, structsList, enumsList, eventsList, modifiersList, functionsList, stateVariablesList, mappingTypeList, librarysList, parametersList);
    mappingStatements = this.replaceWithFunctionResult(mappingStatements, functionCallsList, functionsList);
    expressionStatement = this.replaceWithFunctionResult(expressionStatement, functionCallsList, functionsList);
    functionCallsStatements = this.replaceWithFunctionResult(functionCallsStatements, functionCallsList, functionsList);
    output = functionCallsStatements + "\n" + mappingStatements + "\n" + expressionStatement;
    return output;
  }

  static translateReturnStatement(statement, contractName, parametersList, returnParametersList, changedVariables, localVariablesList, variableCounter, extendsClassesName, otherClassesName, contractsTranslatedCode, structsList, enumsList, eventsList, modifiersList, functionsList, stateVariablesList, mappingTypeList, librarysList, interfaceContractVariableName, isLibrary, monitor: Monitor): string {

    let output: string = '';

    if (statement.expression == null) {
      let storageVariables = TranslatorSubParts.translateStorageVariables(localVariablesList[localVariablesList.length - 1].ListofVariables, changedVariables);
      let saveStateVariables = TranslatorSubParts.putChangesInStateVariables(contractName, changedVariables, extendsClassesName, variableCounter, structsList, enumsList, eventsList, modifiersList, functionsList, stateVariablesList, mappingTypeList, librarysList);
      output = storageVariables + saveStateVariables + `\nreturn ; \n`;
    }
    else {
      let mappingVariablesList = [];
      let functionCallsList = [];

      let expressionStatement = TranslateExpression.translateExpression(statement.expression, mappingVariablesList, functionCallsList, changedVariables, localVariablesList, structsList, enumsList, eventsList, modifiersList, functionsList, stateVariablesList, mappingTypeList, librarysList, parametersList, interfaceContractVariableName);
      let functionCallsStatements = this.getFunctionCalls(contractName, mappingVariablesList, functionCallsList, changedVariables, variableCounter, structsList, enumsList, eventsList, modifiersList, functionsList, stateVariablesList, mappingTypeList, librarysList, monitor);
      let mappingStatements = this.getMappingUndefined(contractName, mappingVariablesList, variableCounter, structsList, enumsList, eventsList, modifiersList, functionsList, stateVariablesList, mappingTypeList, librarysList, parametersList);
      mappingStatements = this.replaceWithFunctionResult(mappingStatements, functionCallsList, functionsList);
      expressionStatement = this.replaceWithFunctionResult(expressionStatement, functionCallsList, functionsList);
      functionCallsStatements = this.replaceWithFunctionResult(functionCallsStatements, functionCallsList, functionsList);
      let storageVariables = TranslatorSubParts.translateStorageVariables(localVariablesList[localVariablesList.length - 1].ListofVariables, changedVariables);
      let saveStateVariables = TranslatorSubParts.putChangesInStateVariables(contractName, changedVariables, extendsClassesName, variableCounter, structsList, enumsList, eventsList, modifiersList, functionsList, stateVariablesList, mappingTypeList, librarysList);
      // This if else must rethought because it must be adjusted with the function returning type
      if (isLibrary) {
        output = functionCallsStatements + mappingStatements + `\n let returnTemp = ` + expressionStatement + `;\n` + storageVariables + saveStateVariables + `\n return returnTemp;\n `;
        output = output === ';' ? '' : output;
      }
      else {
        output = functionCallsStatements
          .concat(mappingStatements)
          .concat('\n')
          .concat(storageVariables)
          .concat(saveStateVariables)
          .concat(`return ${expressionStatement};\n`);
      }
    }
    return output;
  }

  static translateForStatement(statement, contractName, parametersList, returnParametersList, changedVariables, localVariablesList, variableCounter, extendsClassesName, otherClassesName, contractsTranslatedCode, structsList, enumsList, eventsList, modifiersList, functionsList, stateVariablesList, mappingTypeList, librarysList, interfaceContractVariableName, isLibrary, hasTranslatedReturn: boolean[], monitor: Monitor): string {

    let output: string = '';
    let mappingVariablesList = [];
    let functionCallsList = [];

    let initStatement = this.translateVariableInitExpression(statement.initExpression); // for the time being just handle one variable 
    let conditionStatement = TranslateExpression.translateExpression(statement.conditionExpression, mappingVariablesList, functionCallsList, changedVariables, localVariablesList, structsList, enumsList, eventsList, modifiersList, functionsList, stateVariablesList, mappingTypeList, librarysList, parametersList, interfaceContractVariableName);
    let loopExpressionStatement = TranslateExpression.translateExpression(statement.loopExpression.expression, mappingVariablesList, functionCallsList, changedVariables, localVariablesList, structsList, enumsList, eventsList, modifiersList, functionsList, stateVariablesList, mappingTypeList, librarysList, interfaceContractVariableName);

    let functionCallsStatements = this.getFunctionCalls(contractName, mappingVariablesList, functionCallsList, changedVariables, variableCounter, structsList, enumsList, eventsList, modifiersList, functionsList, stateVariablesList, mappingTypeList, librarysList, monitor);
    let mappingStatements = this.getMappingUndefined(contractName, mappingVariablesList, variableCounter, structsList, enumsList, eventsList, modifiersList, functionsList, stateVariablesList, mappingTypeList, librarysList, parametersList);
    mappingStatements = this.replaceWithFunctionResult(mappingStatements, functionCallsList, functionsList);
    conditionStatement = this.replaceWithFunctionResult(conditionStatement, functionCallsList, functionsList);
    loopExpressionStatement = this.replaceWithFunctionResult(loopExpressionStatement, functionCallsList, functionsList);
    functionCallsStatements = this.replaceWithFunctionResult(functionCallsStatements, functionCallsList, functionsList);
    output += functionCallsStatements + mappingStatements + `\n for ( ` + initStatement + `;` + conditionStatement + `;` + loopExpressionStatement + `)\n{\n`;
    output += TranslatorSubParts.translateBody(statement.body, contractName, parametersList, returnParametersList, changedVariables, localVariablesList, variableCounter, extendsClassesName, otherClassesName, contractsTranslatedCode, structsList, enumsList, eventsList, modifiersList, functionsList, stateVariablesList, mappingTypeList, librarysList, hasTranslatedReturn, interfaceContractVariableName, isLibrary);
    output += `\n }`;
    return output;
  }

  static translateIfStatement(statement, contractName, parametersList, returnParametersList, changedVariables, localVariablesList, variableCounter, extendsClassesName, otherClassesName, contractsTranslatedCode, structsList, enumsList, eventsList, modifiersList, functionsList, stateVariablesList, mappingTypeList, librarysList, interfaceContractVariableName, hasTranslatedReturn: boolean[], monitor: Monitor): string {

    let output: string = '';
    let mappingVariablesList = [];
    let functionCallsList = [];

    let expressionStatement = TranslateExpression.translateExpression(statement.condition, mappingVariablesList, functionCallsList, changedVariables, localVariablesList, structsList, enumsList, eventsList, modifiersList, functionsList, stateVariablesList, mappingTypeList, librarysList, parametersList, interfaceContractVariableName);
    let functionCallsStatements = this.getFunctionCalls(contractName, mappingVariablesList, functionCallsList, changedVariables, variableCounter, structsList, enumsList, eventsList, modifiersList, functionsList, stateVariablesList, mappingTypeList, librarysList, monitor);
    let mappingStatements = this.getMappingUndefined(contractName, mappingVariablesList, variableCounter, structsList, enumsList, eventsList, modifiersList, functionsList, stateVariablesList, mappingTypeList, librarysList, parametersList);

    mappingStatements = this.replaceWithFunctionResult(mappingStatements, functionCallsList, functionsList);
    expressionStatement = this.replaceWithFunctionResult(expressionStatement, functionCallsList, functionsList);
    functionCallsStatements = this.replaceWithFunctionResult(functionCallsStatements, functionCallsList, functionsList);

    localVariablesList.push({ Scope: localVariablesList.length, ListofVariables: [] });
    output = functionCallsStatements + mappingStatements + `\n if(` + expressionStatement + `)\n{\n` + TranslatorSubParts.translateOneStatement(statement.trueBody, contractName, parametersList, returnParametersList, changedVariables, localVariablesList, variableCounter, extendsClassesName, otherClassesName, contractsTranslatedCode, structsList, enumsList, eventsList, modifiersList, functionsList, stateVariablesList, mappingTypeList, librarysList, interfaceContractVariableName, hasTranslatedReturn, monitor) + `\n}\n`;
    if (statement.falseBody != null) {
      output += `else {\n` + TranslatorSubParts.translateOneStatement(statement.falseBody, contractName, parametersList, returnParametersList, changedVariables, localVariablesList, variableCounter, extendsClassesName, otherClassesName, contractsTranslatedCode, structsList, enumsList, eventsList, modifiersList, functionsList, stateVariablesList, mappingTypeList, librarysList, interfaceContractVariableName, hasTranslatedReturn, monitor) + `\n}\n`;
    }
    localVariablesList.pop();
    return output;

  }

  static translateEmitStatement(statement, contractName, parametersList, returnParametersList, changedVariables, localVariablesList, variableCounter, extendsClassesName, otherClassesName, contractsTranslatedCode, structsList, enumsList, eventsList, modifiersList, functionsList, stateVariablesList, mappingTypeList, librarysList, interfaceContractVariableName, monitor: Monitor): string {

    let output: string = '';
    let mappingVariablesList = [];
    let functionCallsList = [];
    let eventDetail;

    let payloadVariableObject: string = `payload${variableCounter.count}`;
    let payload = `let ${payloadVariableObject}: any = {\n`;
    let eventName = statement.eventCall.expression.name;


    if (BasicFunctions.isItemExistInListWithContractName(eventName, contractName, eventsList)) {
      eventDetail = BasicFunctions.getItemDetail(eventName, eventsList);
    }
    else {
      for (let i = 0; i < extendsClassesName.length; i++) {
        if (BasicFunctions.isItemExistInListWithContractName(eventName, extendsClassesName[i].getContractName(), eventsList)) {
          eventDetail = BasicFunctions.getItemDetailWithContractName(eventName, extendsClassesName[i].getContractName(), eventsList);
          break;
        }
      }
    }

    for (let i = 0; i < eventDetail.Parameters.length; i++) {
      let arg: string = TranslateExpression.translateExpression(statement.eventCall.arguments[i], mappingVariablesList, functionCallsList, changedVariables, localVariablesList, structsList, enumsList, eventsList, modifiersList, functionsList, stateVariablesList, mappingTypeList, librarysList, parametersList, interfaceContractVariableName);
      payload += eventDetail.Parameters[i].Name + ': ' + (arg === 'owner' ? 'this.owner(ctx)' : arg); // Hammered
      if (i != eventDetail.Parameters.length - 1) {
        payload += `,\n`;
      }
    }
    payload += `\n}\n`;
    variableCounter.count++;
    payload = payload.concat(`let payload${variableCounter.count}: string = JSON.stringify(${payloadVariableObject}); \n`);
    payload = payload.concat(`ctx.stub.setEvent(\'${eventName}\', Buffer.from(payload${variableCounter.count}));\n`);

    let functionCallsStatements = this.getFunctionCalls(contractName, mappingVariablesList, functionCallsList, changedVariables, variableCounter, structsList, enumsList, eventsList, modifiersList, functionsList, stateVariablesList, mappingTypeList, librarysList, monitor);
    let mappingStatements = this.getMappingUndefined(contractName, mappingVariablesList, variableCounter, structsList, enumsList, eventsList, modifiersList, functionsList, stateVariablesList, mappingTypeList, librarysList, parametersList);

    mappingStatements = this.replaceWithFunctionResult(mappingStatements, functionCallsList, functionsList);
    functionCallsStatements = this.replaceWithFunctionResult(functionCallsStatements, functionCallsList, functionsList);
    payload = this.replaceWithFunctionResult(payload, functionCallsList, functionsList);
    output = functionCallsStatements + mappingStatements + payload;
    return output;
  }

  static translateVariableDeclarationStatement(statement, contractName, parametersList, returnParametersList, changedVariables, localVariablesList, variableCounter, extendsClassesName, otherClassesName, contractsTranslatedCode, structsList, enumsList, eventsList, modifiersList, functionsList, stateVariablesList, mappingTypeList, librarysList, interfaceContractVariableName, monitor: Monitor): string {
    let output: string = '';
    let mappingVariablesList = [];
    let functionCallsList = [];
    let initValues = [];

    if (statement.initialValue != null) {
      if (statement.initialValue.type == 'TupleExpression') {
        for (let i = 0; i < statement.initialValue.elements.length; i++) {
          initValues.push(
            TranslateExpression
              .translateExpression(
                statement.initialValue.elements[i],
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
              )
          );
        }
      }
      else if (statement.initialValue.type == 'FunctionCall' && statement.initialValue.expression.type == 'NewExpression'
        && statement.initialValue.expression.typeName.type == 'UserDefinedTypeName') {

        let newContract = 'new ' + statement.initialValue.expression.typeName.namePath + '()';
        otherClassesName.push(statement.initialValue.expression.typeName.namePath);
        initValues.push(newContract);
      }
      else if (statement.initialValue.type == 'FunctionCall' && statement.initialValue.expression.type == 'Identifier'
        && statement.initialValue.arguments.length == 1) {
        initValues.push("\'\'");
        //otherClassesName.push(statement.initialValue.expression.name);
        //interfaceContractVariableName.push({ Name: statement.variables[0].name, Contractaddress: statement.initialValue.arguments[0].name })
      }
      else {
        initValues.push(
          TranslateExpression
            .translateExpression(
              statement.initialValue,
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
              parametersList,
              interfaceContractVariableName
            )
        );
      }
    }

    let initStatement: string = '';

    for (let i = 0; i < statement.variables.length; i++) {
      if (statement.initialValue != null) {

        if (statement.variables[i].typeName.type == 'UserDefinedTypeName' && statement.initialValue.type == 'FunctionCall'
          && statement.initialValue.expression.type == 'NewExpression' && statement.initialValue.expression.typeName.type == 'UserDefinedTypeName') {
          initStatement += `let ` + statement.variables[i].name + `=` + initValues[i] + `;
        `;
          initStatement += 'await ' + statement.variables[i].name + '.Constructor(ctx);';
        }
        else {
          initStatement += `let ` + statement.variables[i].name + `=` + initValues[i] + `;
        `;
        }
      }
      else {

        if (statement.variables[i].typeName.type == 'UserDefinedTypeName') {
          initStatement += `let ` + statement.variables[i].name + ` = {};
        `;
        }
        else {
          initStatement += `let ` + statement.variables[i].name + `;
        `;
        }
      }

      localVariablesList[localVariablesList.length - 1].ListofVariables.push({ Name: statement.variables[i].name, TypeName: statement.variables[i].typeName, Type: statement.variables[i].storageLocation, InitValue: initValues[i] });
    }

    let functionCallsStatements = this.getFunctionCalls(contractName, mappingVariablesList, functionCallsList, changedVariables, variableCounter, structsList, enumsList, eventsList, modifiersList, functionsList, stateVariablesList, mappingTypeList, librarysList, monitor);
    let mappingStatements = this.getMappingUndefined(contractName, mappingVariablesList, variableCounter, structsList, enumsList, eventsList, modifiersList, functionsList, stateVariablesList, mappingTypeList, librarysList, parametersList);

    mappingStatements = this.replaceWithFunctionResult(mappingStatements, functionCallsList, functionsList);
    functionCallsStatements = this.replaceWithFunctionResult(functionCallsStatements, functionCallsList, functionsList);
    initStatement = this.replaceWithFunctionResult(initStatement, functionCallsList, functionsList);

    output = functionCallsStatements + mappingStatements + initStatement;
    return output;
  }

  static translateWhileStatement(statement, contractName, parametersList, returnParametersList, changedVariables, localVariablesList, variableCounter, extendsClassesName, otherClassesName, contractsTranslatedCode, structsList, enumsList, eventsList, modifiersList, functionsList, stateVariablesList, mappingTypeList, librarysList, interfaceContractVariableName, isLibrary, monitor: Monitor): string {

    let output: string = '';
    let mappingVariablesList = [];
    let functionCallsList = [];

    let conditionStatement = TranslateExpression.translateExpression(statement.condition, mappingVariablesList, functionCallsList, changedVariables, localVariablesList, structsList, enumsList, eventsList, modifiersList, functionsList, stateVariablesList, mappingTypeList, librarysList, interfaceContractVariableName);
    let functionCallsStatements = this.getFunctionCalls(contractName, mappingVariablesList, functionCallsList, changedVariables, variableCounter, structsList, enumsList, eventsList, modifiersList, functionsList, stateVariablesList, mappingTypeList, librarysList, monitor);
    let mappingStatements = this.getMappingUndefined(contractName, mappingVariablesList, variableCounter, structsList, enumsList, eventsList, modifiersList, functionsList, stateVariablesList, mappingTypeList, librarysList, parametersList);

    mappingStatements = this.replaceWithFunctionResult(mappingStatements, functionCallsList, functionsList);
    functionCallsStatements = this.replaceWithFunctionResult(functionCallsStatements, functionCallsList, functionsList);
    conditionStatement = this.replaceWithFunctionResult(conditionStatement, functionCallsList, functionsList);

    output = functionCallsStatements + mappingStatements + `\nwhile (` + conditionStatement + `) {\n`;
    output += TranslatorSubParts.translateBody(statement.body, contractName, parametersList, returnParametersList, changedVariables, localVariablesList, variableCounter, extendsClassesName, otherClassesName, contractsTranslatedCode, structsList, enumsList, eventsList, modifiersList, functionsList, stateVariablesList, mappingTypeList, librarysList, interfaceContractVariableName, isLibrary) + `\n}`;
    return output;
  }

}

