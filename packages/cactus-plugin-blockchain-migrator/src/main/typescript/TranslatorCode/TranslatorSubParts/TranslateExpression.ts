import { EnumBuilder } from "../../model/src_model/typescript/EnumBuilder";
import { BasicFunctions } from "../BasicFunctions/BasicFunctions";

export class TranslateExpression {

  static getVariableNameFromSingleExpression(expression) {

    if (expression.type === "Identifier") {
      return expression.name;
    }
    if (expression.type === "IndexAccess") {
      if (expression.base.type === "IndexAccess") {
        return this.getVariableNameFromSingleExpression(expression.base);
      }
      return expression.base.name;
    }
    if (expression.type === "MemberAccess") {
      return expression.memberName;
    }
  }

  static translateArguments(argumentss, mappingVariablesList, functionCallsList, changedVariables, localVariablesList, structsList, enumsList, eventsList, modifiersList, functionsList, stateVariablesList, mappingTypeList, librarysList, parametersList): string {
    let output: string = '';

    for (let j = 0; j < argumentss.length; j++) {
      if (argumentss[j].type == 'FunctionCall') {
        let type: string = TranslateExpression.translateFunctionOrVariableType(argumentss[j].expression, false);
        output += `new ${type}(`;
        for (let i = 0; i < argumentss[j].arguments.length; i++) {
          output += this.translateExpression(
            argumentss[j].arguments[i],
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
            []
          );
          if (i != argumentss[j].arguments.length - 1) {
            output += ', ';
          }
        }
        output += ')'
      } else {
        output = output.concat(argumentss[j].name)
        if (j != argumentss.length - 1) {
          output += ', ';
        }
      }
    }
    return output;
  }

  static translateType(_expression, mappingVariablesList, functionCallsList, changedVariables, localVariablesList, structsList, enumsList, eventsList, modifiersList, functionsList, stateVariablesList, mappingTypeList, librarysList, interfaceContractVariableName, parametersList): string {

    let output: string = '';

    if (_expression.type == 'Identifier') {
      if (_expression.name == 'this') {
        return '_this';
      }
      if (_expression.name === 'now') {
        return 'ctx.stub.GetTxTimestamp()';
      }
      if (parametersList === undefined || parametersList.length === 0) {
        return _expression.name;
      }
      const name = parametersList.find(elem => elem.parameter === _expression.name);
      if (name === undefined) {
        return _expression.name;
      }
      return name.Name;
    }
    else if (_expression.type == 'Mapping') {
      return '{}';
    }
    else if (_expression.type == 'NumberLiteral') {
      return _expression.number;
    }
    else if (_expression.type == 'BooleanLiteral') {
      return _expression.value;
    }
    else if (_expression.type == 'StringLiteral') {
      return '\'' + _expression.value + '\'';
    }
    else if (_expression.type == 'MemberAccess') {

      if (_expression.expression.type == 'Identifier' && BasicFunctions.isItemExistInList(_expression.expression.name, enumsList)) {
        let enumObj: EnumBuilder = enumsList.find(elem => _expression.expression.name == elem.Name);
        return `${enumObj.Name}.${enumObj.getMember(_expression.memberName)}`;
      }
      else if (_expression.memberName == 'balance') {
        let preFunction = this.translateType(_expression.expression, mappingVariablesList, functionCallsList, changedVariables, localVariablesList, structsList, enumsList, eventsList, modifiersList, functionsList, stateVariablesList, mappingTypeList, librarysList, interfaceContractVariableName, parametersList);
        let VariableNameReplaced = 'functionVariable' + functionCallsList.length;
        functionCallsList.push({ PreFunction: preFunction, Name: _expression.memberName, VariableNameReplaced: VariableNameReplaced })
        return '#' + VariableNameReplaced + '#';
      }
      else {
        let translatedType: string = this.translateType(_expression.expression, mappingVariablesList, functionCallsList, changedVariables, localVariablesList, structsList, enumsList, eventsList, modifiersList, functionsList, stateVariablesList, mappingTypeList, librarysList, interfaceContractVariableName, parametersList) + '.' + _expression.memberName;
        if (translatedType === 'msg.sender') {
          return ' await ctx.clientIdentity.getID()';
        }
        if (translatedType === 'msg.value') {
          let value: any = parametersList.find(elem => elem.parameter === _expression.memberName);
          translatedType = value !== undefined ? value.Name : translatedType;
        }
        return translatedType;
      }
    }
    else if (_expression.type == 'IndexAccess') {
      let baseName = this.translateExpression(_expression.base, mappingVariablesList, functionCallsList, changedVariables, localVariablesList, structsList, enumsList, eventsList, modifiersList, functionsList, stateVariablesList, mappingTypeList, librarysList, parametersList, interfaceContractVariableName);
      let index = this.translateExpression(_expression.index, mappingVariablesList, functionCallsList, changedVariables, localVariablesList, structsList, enumsList, eventsList, modifiersList, functionsList, stateVariablesList, mappingTypeList, librarysList, parametersList, interfaceContractVariableName);
      let name: any = undefined;
      let idx: any = undefined;
      if (parametersList !== undefined && parametersList.length > 0) {
        name = parametersList.find(elem => elem.parameter === baseName);
        idx = parametersList.find(elem => elem.parameter === index);
        baseName = name !== undefined ? name.Name : baseName;
        index = idx !== undefined ? name.Name : index;
      }
      if (!BasicFunctions.isItemExistInList(baseName + ' ' + index, mappingVariablesList)) // already exist check // it may be array or mapping type 
      {
        mappingVariablesList.push({ Name: baseName + ' ' + index, VariableName: baseName, Key: index });
      }

      return baseName + '[' + index + ']';
    }
    else if (_expression.type == 'FunctionCall') {

      if (_expression.expression.name == 'require' || _expression.expression.name == 'assert') {
        output += 'if(!(' + this.translateExpression(_expression.arguments[0], mappingVariablesList, functionCallsList, changedVariables, localVariablesList, structsList, enumsList, eventsList, modifiersList, functionsList, stateVariablesList, mappingTypeList, librarysList, parametersList, interfaceContractVariableName) + `)){\n`;

        if (_expression.arguments.length > 1) {
          output += 'throw new Error("' + _expression.arguments[1].value + '");\n}\n';
        }
        else {
          output += 'throw new Error( "Condition Failed" );\n}';
        }
      }
      else if (_expression.expression.name == 'revert') {
        output += 'throw "Error";';
      }
      else if (_expression.expression.type == 'ElementaryTypeNameExpression') { // type casting for the time being doing for some cases
        if (((_expression.expression.typeName.name).replace(/\'/g, '').split(/(\d+)/)[0] == 'uint' || (_expression.expression.typeName.name).replace(/\'/g, '').split(/(\d+)/)[0] == 'int' || _expression.expression.typeName.name == 'bytes4') && _expression.arguments[0].type == 'Identifier') {
          return _expression.arguments[0].name;
        }
        if (((_expression.expression.typeName.name).replace(/\'/g, '').split(/(\d+)/)[0] == 'uint' || (_expression.expression.typeName.name).replace(/\'/g, '').split(/(\d+)/)[0] == 'int') && _expression.arguments[0].type == 'IndexAccess') {
          return this.translateType(_expression.arguments[0], mappingVariablesList, functionCallsList, changedVariables, localVariablesList, structsList, enumsList, eventsList, modifiersList, functionsList, stateVariablesList, mappingTypeList, librarysList, interfaceContractVariableName, parametersList);
        }
        if (_expression.arguments[0].type === 'FunctionCall' && (_expression.arguments[0].expression.name === 'keccak256' || _expression.arguments[0].expression.name === 'abi')) {
          return this.translateType(_expression.arguments[0], mappingVariablesList, functionCallsList, changedVariables, localVariablesList, structsList, enumsList, eventsList, modifiersList, functionsList, stateVariablesList, mappingTypeList, librarysList, interfaceContractVariableName, parametersList);
        }
        if (_expression.expression.typeName.name == 'address' && _expression.arguments[0].type == 'NumberLiteral' && _expression.arguments[0].number == 0) {
          return '\'\'';
        }
        if (_expression.expression.typeName.name == 'bytes32' && _expression.arguments[0].type == 'NumberLiteral' && _expression.arguments[0].number == 0) {
          return '\'0x0000000000000000000000000000000000000000000000000000000000000000\'';
        }
        if (_expression.expression.typeName.name == 'address' && _expression.arguments[0].type == 'Identifier' && _expression.arguments[0].name == 'this') {
          return '_this';
        }
      }
      else if (_expression.expression.type == 'Identifier') { // for handling Ballot a = Ballot(....);

        if (_expression.expression.name === 'keccak256') {
          return this.translateType(_expression.arguments[0], mappingVariablesList, functionCallsList, changedVariables, localVariablesList, structsList, enumsList, eventsList, modifiersList, functionsList, stateVariablesList, mappingTypeList, librarysList, interfaceContractVariableName, parametersList);
        }

        if (BasicFunctions.isItemExistInList(_expression.expression.name, structsList)) {
          let structDetail = BasicFunctions.getItemDetail(_expression.expression.name, structsList);
          let tempoutput: string = `new ${structDetail.Name}(`;
          let i: number = 0;
          for (; i < _expression.arguments.length; i++) {
            let arg: string = this.translateExpression(_expression.arguments[i], mappingVariablesList, functionCallsList, changedVariables, localVariablesList, structsList, enumsList, eventsList, modifiersList, functionsList, stateVariablesList, mappingTypeList, librarysList, parametersList, interfaceContractVariableName);
            let newArg: any = parametersList.find(elem => {
              if (arg === 'msg.value') {
                return elem.parameter === 'value';
              }
              return elem.parameter === arg;
            });
            if (newArg !== undefined) {
              tempoutput = tempoutput.concat(newArg.Name);
            } else {
              tempoutput = tempoutput.concat(arg);
            }
            if (i != _expression.arguments.length - 1) {
              tempoutput = tempoutput.concat(', ');
            }
          }
          if (i < structDetail.memberTypes.length) {
            tempoutput = tempoutput.concat(', ');
            for (; i < structDetail.memberTypes.length; ++i) {
              let arg: string = this.translateExpression(structDetail.memberTypes[i], mappingVariablesList, functionCallsList, changedVariables, localVariablesList, structsList, enumsList, eventsList, modifiersList, functionsList, stateVariablesList, mappingTypeList, librarysList, parametersList, interfaceContractVariableName);
              tempoutput = tempoutput.concat(arg);
              if (i != structDetail.memberTypes.length - 1) {
                tempoutput = tempoutput.concat(', ');
              }
            }
          }
          tempoutput = tempoutput.concat(')\n');
          return tempoutput;
        }
        else {
          let functionParameters = [];
          let size: number = _expression.arguments.length;
          let functionCallConstructed: string = '';
          let functionName: any = functionsList.find(elem => elem.Name === _expression.expression.name);
          if (functionName !== undefined) {
            functionCallConstructed = functionCallConstructed.concat('(await this.').concat(_expression.expression.name).concat('(ctx').concat(size > 0 ? ', ' : '');
          } else {
            functionCallConstructed = functionCallConstructed.concat(_expression.expression.name).concat('(');
          }
          for (let i = 0; i < size; i++) {
            let argument: string = this.translateExpression(_expression.arguments[i], mappingVariablesList, functionCallsList, changedVariables, localVariablesList, structsList, enumsList, eventsList, modifiersList, functionsList, stateVariablesList, mappingTypeList, librarysList, parametersList, interfaceContractVariableName);
            if (i < size - 1) {
              argument = argument.concat(', ');
            }
            functionCallConstructed = functionCallConstructed.concat(argument)
            functionParameters.push(argument);
          }
          functionCallConstructed = functionCallConstructed.concat(functionName !== undefined ? '))' : ')');
          return functionCallConstructed;
        }
      }
      else if (_expression.expression.type == 'MemberAccess') {

        if (_expression.expression.name === 'abi' || _expression.expression.memberName === 'encodePacked') {
          return this.translateType(_expression.arguments[0], mappingVariablesList, functionCallsList, changedVariables, localVariablesList, structsList, enumsList, eventsList, modifiersList, functionsList, stateVariablesList, mappingTypeList, librarysList, interfaceContractVariableName, parametersList);
        }

        if (BasicFunctions.isItemExistInList(_expression.expression.expression.name, interfaceContractVariableName)) {
          let interfacefunctiondetail = BasicFunctions.getItemDetail(_expression.expression.expression.name, interfaceContractVariableName);

          let parameters = '';
          for (let i = 0; i < _expression.arguments.length; i++) {
            parameters += ",";
            parameters += this.translateExpression(_expression.expression.expression, mappingVariablesList, functionCallsList, changedVariables, localVariablesList, structsList, enumsList, eventsList, modifiersList, functionsList, stateVariablesList, mappingTypeList, librarysList, parametersList, interfaceContractVariableName);
            parameters += ".toString()";
          }

          output += ` let arguments123 = ['` + _expression.expression.memberName + `',msg.value.toString()` + parameters + `]
        await stub.invokeChaincode(`+ interfacefunctiondetail.Contractaddress + `, arguments123);`;

          return output;
        }
        else if (_expression.expression.memberName == 'push') {

          if (!changedVariables.includes(_expression.expression.expression.name)) {
            changedVariables.push(_expression.expression.expression.name)
          };
          return this.translateType(
            _expression.expression,
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
            interfaceContractVariableName,
            parametersList
          ) + '('
            + this
              .translateArguments(
                _expression.arguments,
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
                parametersList
              ) + ')';
        }
        else if (_expression.expression.memberName == 'send' || _expression.expression.memberName == 'transfer') {

          //let preFunction = this.translateType(_expression.expression.expression, mappingVariablesList, functionCallsList, changedVariables, localVariablesList, structsList, enumsList, eventsList, modifiersList, functionsList, stateVariablesList, mappingTypeList, librarysList, interfaceContractVariableName, parametersList);
          let preFunction: string = "await this.owner(ctx)";
          let functionParameters = [];
          for (let i = 0; i < _expression.arguments.length; i++) {
            functionParameters.push(this.translateExpression(_expression.arguments[i], mappingVariablesList, functionCallsList, changedVariables, localVariablesList, structsList, enumsList, eventsList, modifiersList, functionsList, stateVariablesList, mappingTypeList, librarysList, parametersList, interfaceContractVariableName));
          }

          let VariableNameReplaced = 'functionVariable' + functionCallsList.length;
          functionCallsList.push({ PreFunction: preFunction, Name: _expression.expression.memberName, VariableNameReplaced: VariableNameReplaced, Parameters: functionParameters })
          return '#' + VariableNameReplaced + '#';
        }
        else {
          let preFunction = this.translateType(_expression.expression.expression, mappingVariablesList, functionCallsList, changedVariables, localVariablesList, structsList, enumsList, eventsList, modifiersList, functionsList, stateVariablesList, mappingTypeList, librarysList, interfaceContractVariableName, parametersList);
          let variablename = this.getVariableNameFromSingleExpression(_expression.expression.expression);

          if (BasicFunctions.isItemExistInList(variablename, stateVariablesList) || BasicFunctions.isItemExistInList(variablename, localVariablesList)) {
            let variableDetail = BasicFunctions.getItemDetail(variablename, stateVariablesList);
            for (let i = 0; i < librarysList.length; i++) {
              let name: string = librarysList[i].TypeName.name === undefined ? librarysList[i].TypeName.namePath : librarysList[i].TypeName.name;
              if ((variableDetail.TypeName.type === 'Mapping' && variableDetail.TypeName.valueType.namePath === name) || variableDetail.TypeName.name === name) {

                let parameters = '';
                for (let i = 0; i < _expression.arguments.length; i++) {
                  parameters += ", ";
                  parameters += this.translateExpression(_expression.arguments[i], mappingVariablesList, functionCallsList, changedVariables, localVariablesList, structsList, enumsList, eventsList, modifiersList, functionsList, stateVariablesList, mappingTypeList, librarysList, parametersList, interfaceContractVariableName);
                }

                let functioncall = librarysList[i].Name + "." + _expression.expression.memberName + '(' + preFunction + parameters + ')';
                return functioncall;
              }
            }
          }
          else if (BasicFunctions.isItemExistInList(variablename, librarysList)) {
            let parameters = '';
            for (let i = 0; i < _expression.arguments.length; i++) {
              parameters += this.translateExpression(_expression.arguments[i], mappingVariablesList, functionCallsList, changedVariables, localVariablesList, structsList, enumsList, eventsList, modifiersList, functionsList, stateVariablesList, mappingTypeList, librarysList, parametersList, interfaceContractVariableName);
              if (i != _expression.arguments.length - 1) {
                parameters += ", ";
              }
            }
            let functioncall = variablename + "." + _expression.expression.memberName + '(' + parameters + ')';
            return functioncall;
          }
          else {
            let className: any = librarysList.find(elem => {
              let className = elem._functions.find(fcn => fcn.Name === _expression.expression.memberName)
              return className !== undefined ? className.Name : '';
            });
            let parameters = className !== undefined ? preFunction.concat(', ') : '';
            for (let i = 0; i < _expression.arguments.length; i++) {
              if (_expression.arguments[i].type === 'StringLiteral') {
                parameters = parameters.concat('\'')
                  .concat(
                    this
                      .translateType(
                        _expression.arguments[i],
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
                        interfaceContractVariableName,
                        parametersList
                      )
                  )
                  .concat('\'');
              } else {
                parameters = parameters.concat(
                  this
                    .translateType(
                      _expression.arguments[i],
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
                      interfaceContractVariableName,
                      parametersList
                    )
                )
              }
            }
            let functioncall: string = `${className !== undefined ? className.Name : preFunction}.${_expression.expression.memberName}(${parameters})`;
            return functioncall;

          }
        }
      }
    }
    return output;
  }

  static translateOneVariableAndFunction(_expression, mappingVariablesList, functionCallsList, changedVariables, localVariablesList, structsList, enumsList, eventsList, modifiersList, functionsList, stateVariablesList, mappingTypeList, librarysList, interfaceContractVariableName, parametersList): string {
    let output: string = '';

    if (_expression.type == 'Conditional') {
      output += this.translateExpression(_expression.condition, mappingVariablesList, functionCallsList, changedVariables, localVariablesList, structsList, enumsList, eventsList, modifiersList, functionsList, stateVariablesList, mappingTypeList, librarysList, interfaceContractVariableName)
        + '?' +
        this.translateExpression(_expression.trueExpression, mappingVariablesList, functionCallsList, changedVariables, structsList, enumsList, eventsList, modifiersList, functionsList, stateVariablesList, mappingTypeList, librarysList, interfaceContractVariableName, parametersList) + ' : '
        + this.translateExpression(_expression.falseExpression, mappingVariablesList, functionCallsList, changedVariables, structsList, enumsList, eventsList, modifiersList, functionsList, stateVariablesList, mappingTypeList, librarysList, interfaceContractVariableName, parametersList);
    }
    else if (_expression.type == 'UnaryOperation' && _expression.isPrefix == false) {
      output += this.translateExpression(_expression.subExpression, mappingVariablesList, functionCallsList, changedVariables, localVariablesList, structsList, enumsList, eventsList, modifiersList, functionsList, stateVariablesList, mappingTypeList, librarysList, interfaceContractVariableName);
      output += _expression.operator;
      if (_expression.operator == '++' || _expression.operator == '--') {
        let variableName = this.getVariableNameFromSingleExpression(_expression.subExpression);
        if (!changedVariables.includes(variableName)) {
          changedVariables.push(variableName);
        }
      }
    }
    else if (_expression.type == 'UnaryOperation' && _expression.isPrefix == true) {
      output += _expression.operator;
      output += this.translateExpression(_expression.subExpression, mappingVariablesList, functionCallsList, changedVariables, localVariablesList, structsList, enumsList, eventsList, modifiersList, functionsList, stateVariablesList, mappingTypeList, librarysList, interfaceContractVariableName);
      if (_expression.operator === '++' || _expression.operator === '--' || _expression.operator === 'delete') {
        let subExpression: any = _expression.subExpression.components[0] !== undefined
          ? _expression.subExpression.components[0] : _expression.subExpression;
        let variableName = this.getVariableNameFromSingleExpression(subExpression);
        if (!changedVariables.includes(variableName)) {
          changedVariables.push(variableName);
        }
      }
    }
    else if (_expression.type == 'TupleExpression') {
      let expression: any = _expression.components !== undefined ? _expression.components : _expression.elements;
      output = output.concat('(');
      expression.forEach((elem, index) => {
        output = output.concat(
          this.
            translateExpression(
              elem,
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
        )
        if (index < expression.length - 1) {
          output = output.concat(', ');
        }
      });
      output = output.concat(')');
    }
    else {
      // TODO: need to pass the information about the current class the expression is being translated
      output += this.translateType(_expression, mappingVariablesList, functionCallsList, changedVariables, localVariablesList, structsList, enumsList, eventsList, modifiersList, functionsList, stateVariablesList, mappingTypeList, librarysList, interfaceContractVariableName, parametersList);
    }
    return output;
  }

  static translateExpression(_expression, mappingVariablesList, functionCallsList, changedVariables, localVariablesList, structsList, enumsList, eventsList, modifiersList, functionsList, stateVariablesList, mappingTypeList, librarysList, parametersList, interfaceContractVariableName?): string {

    let output: string = '';

    if (_expression.type != 'BinaryOperation') {
      output += this
        .translateOneVariableAndFunction(
          _expression,
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
          interfaceContractVariableName,
          parametersList
        );
    }
    else {
      let stack = new Array();

      while (_expression.type == 'BinaryOperation') {
        stack.push(_expression);
        _expression = _expression.left;
      }
      while (stack.length > 0) {
        _expression = stack.pop();

        if (_expression.left.type != 'BinaryOperation') {
          output += this.translateOneVariableAndFunction(_expression.left, mappingVariablesList, functionCallsList, changedVariables, localVariablesList, structsList, enumsList, eventsList, modifiersList, functionsList, stateVariablesList, mappingTypeList, librarysList, interfaceContractVariableName, parametersList);
        }

        output += _expression.operator;

        if (BasicFunctions.isAssignmentOperator(_expression.operator)) {
          let variableName = this.getVariableNameFromSingleExpression(_expression.left);

          if (!changedVariables.includes(variableName)) {
            changedVariables.push(variableName);
          }
        }

        if (_expression.right.type == 'BinaryOperation') {
          _expression = _expression.right;

          while (_expression.type == 'BinaryOperation') {
            stack.push(_expression);
            _expression = _expression.left;
          }
        }
        else {
          output += this
            .translateOneVariableAndFunction(
              _expression.right,
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
              interfaceContractVariableName,
              parametersList
            );
        }
      }
    }
    return output;
  }

  static translateFunctionOrVariableType(type: any, isParameter: boolean): string {
    if (isParameter) return 'string'
    if (type === 'void') {
      return type;
    }
    let name = type.name !== undefined ? type.name : type.namePath;
    if (type.type === 'Mapping') {
      return 'any';
    }
    if (type.type === 'ArrayTypeName') {
      return 'Array<any>';
    }

    return this.checkType(name);
  }

  private static checkType(typeName: string): string {
    if (typeName.startsWith("uint") || typeName.startsWith("int")) {
      return 'number'
    }
    if (typeName === 'bool') {
      return 'boolean';
    }
    if (typeName === 'address' || typeName.startsWith('bytes')) {
      return 'string';
    }
    return typeName;
  }

}