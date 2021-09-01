/* eslint-disable prettier/prettier */
import { IExpression } from "./IExpression";

export interface IFactory {

    getBlockStatementInstance(body: any): IExpression;
    getArrowFunctionExpressionInstance(async: boolean, params: string, body: string): IExpression;
    getAwaitExpressionInstance(node: any): IExpression;
    getVariableDeclarationInstance(kind: string, leftSide: string, operator: string, rightSide: string): IExpression;
    getCallExpressionInstance(callee: string, args: string): IExpression;
    getMemberExpressionInstance(obj: string, property: string): IExpression;
    getIdentifierInstance(name: string): IExpression;
    getLiteralInstance(value: string): IExpression;
    getBinaryExpressionInstance(left: string, operator: string, right: string): IExpression;
    getExpressionStatementInstance(expression: string): IExpression;
    getThisExpression(node: any): IExpression;
    getArrayExpression(elements: string[]): IExpression;
    getVariableDeclarator(id: string, init: string): IExpression;
}