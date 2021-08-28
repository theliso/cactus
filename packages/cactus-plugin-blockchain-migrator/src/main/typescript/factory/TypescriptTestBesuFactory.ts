import { IExpression } from "../common/interfaces/IExpression";
import { IFactory } from "../common/interfaces/IFactory";

export class TypescriptTestBesuFactory implements IFactory {
    
    getBlockStatementInstance(body: any): IExpression {
        throw new Error("Method not implemented.");
    }
    getArrowFunctionExpressionInstance(async: boolean, params: string, body: string): IExpression {
        throw new Error("Method not implemented.");
    }
    getAwaitExpressionInstance(node: any): IExpression {
        throw new Error("Method not implemented.");
    }
    getVariableDeclarationInstance(kind: string, leftSide: string, operator: string, rigthSide: string): IExpression {
        throw new Error("Method not implemented.");
    }
    getCallExpressionInstance(callee: string, args: string): IExpression {
        throw new Error("Method not implemented.");
    }
    getMemberExpressionInstance(obj: string, property: string): IExpression {
        throw new Error("Method not implemented.");
    }
    getIdentifierInstance(name: string): IExpression {
        throw new Error("Method not implemented.");
    }
    getLiteralInstance(value: string): IExpression {
        throw new Error("Method not implemented.");
    }
    getBinaryExpressionInstance(left: string, operator: string, right: string): IExpression {
        throw new Error("Method not implemented.");
    }
    getExpressionStatementInstance(expression: string): IExpression {
        throw new Error("Method not implemented.");
    }
    getThisExpression(node: any): IExpression {
        throw new Error("Method not implemented.");
    }
    getArrayExpression(elements: string[]): IExpression {
        throw new Error("Method not implemented.");
    }
    getVariableDeclarator(id: string, init: string): IExpression {
        throw new Error("Method not implemented.");
    }

}