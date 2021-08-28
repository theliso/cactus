export class BasicFunctions {
  static getItemDetail(name, list) {
    for (let i = 0; i < list.length; i++) {
      if (list[i].Name == name) {
        return list[i];
      }
    }
  }

  static isItemExistInList(name, list): boolean {

    if (list == undefined) return false;

    for (let i = 0; i < list.length; i++) {
      if (list[i].Name == name) {
        return true;
      }
    }
    return false;
  }

  static getItemDetailWithContractName(name, contractName, list) {
    for (let i = 0; i < list.length; i++) {
      if (list[i].Name === name && list[i].ContractName === contractName) {
        return list[i];
      }
    }
  }

  static isItemExistInListWithContractName(name, contractName, list): boolean {
    for (let i = 0; i < list.length; i++) {
      if (list[i].Name === name && list[i].ContractName === contractName) {
        return true;
      }
    }
    return false;
  }

  static getListWithGivenContractName(contractName, list) {
    let returnList = [];
    for (let i = 0; i < list.length; i++) {
      if (list[i].ContractName == contractName) {
        returnList.push(list[i]);
      }
    }
    return returnList;
  }

  static defaultValue(TypeName): string {

    if (TypeName.type == 'ElementaryTypeName') {
      if (TypeName.name.replace(/\'/g, '').split(/(\d+)/)[0] == 'uint' || TypeName.name.replace(/\'/g, '').split(/(\d+)/)[0] == 'int') {
        return '0';
      }
      else if (TypeName.name == 'bool') {
        return 'false';
      }
      else if (TypeName.name == 'address' || TypeName.name == 'string' || TypeName.name.startsWith("bytes")) {
        return '\'\'';
      }
    }
    else if (TypeName.type == 'UserDefinedTypeName') // not struct yet
    {
      return '0'; // for enumType
    }
    else if (TypeName.type == 'ArrayTypeName') {
      return '[]';
    }
    else if (TypeName.type == 'Mapping') {
      return '{}';
    }
  }

  static isAssignmentOperator(operator: string): boolean {
    if (operator == '=' || operator == '+=' || operator == '-=' || operator == '*=' || operator == '/=' || operator == '%=' || operator == '|=' || operator == '&=' || operator == '^=' || operator == '<<=' || operator == '>>=') {
      return true;
    }
    return false;
  }

  static isEquivalent(a: any, b: any): boolean {

    if (a == undefined || b == undefined) {
      return false;
    }

    // Create arrays of property names
    let aProps = Object.getOwnPropertyNames(a);
    let bProps = Object.getOwnPropertyNames(b);

    if (aProps.length != bProps.length) {
      return false;
    }

    for (let i = 0; i < aProps.length; i++) {
      let propName = aProps[i];

      if (a[propName] !== b[propName]) {
        return false;
      }
    }

    return true;
  }

}