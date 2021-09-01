/* eslint-disable prettier/prettier */
import { IExpression } from "../interfaces/IExpression";
import { IFactory } from "../interfaces/IFactory";
import { Monitor } from "../monitor/Monitor";
import { NotHandle } from "../../model/test_model/typescript/fabric/NotHandle";

export abstract class ASTInterpreter {

    protected readonly expressionHandlerFactory: IFactory;
    protected codeMonitor: Monitor;

    constructor(expressionHandlerFactory: IFactory, monitor: Monitor) {
        this.expressionHandlerFactory = expressionHandlerFactory;
        this.codeMonitor = monitor;
    }

    processExpression(node: any): IExpression {
        if (node.type === 'CallExpression')
            return this.processCallExpression(node);
        if (node.type === 'MemberExpression')
            return this.processMemberExpression(node);
        if (node.type === 'Identifier')
            return this.processIdentifier(node);
        if (node.type === 'Literal')
            return this.processLiteral(node);
        if (node.type === 'VariableDeclaration')
            return this.processVariableDeclaration(node);
        if (node.type === 'ExpressionStatement')
            return this.processExpressionStatement(node);
        if (node.type === 'ArrowFunctionExpression')
            return this.processArrowFunctionExpression(node);
        if (node.type === 'BlockStatement')
            return this.processBlockStatement(node);
        if (node.type === 'AwaitExpression')
            return this.processAwaitExpression(node);
        if (node.type === 'FunctionExpression')
            return this.processFunctionExpression(node);
        if (node.type === 'BinaryExpression' || node.type === 'AssignmentExpression')
            return this.processBinaryExpression(node);
        if (node.type === 'ThisExpression')
            return this.processThisExpression(node);
        if (node.type === 'ArrayExpression')
            return this.processArrayExpression(node);
        if (node.type === 'VariableDeclarator')
            return this.processVariableDeclarator(node);
        if (node.type === 'UpdateExpression')
            return this.processUpdateExpression(node);
        if (node.type === 'ForStatement')
            return this.processForStatement(node);
        return new NotHandle();
    }

    abstract processForStatement(node: any): IExpression;

    abstract processUpdateExpression(node: any): IExpression;

    abstract processVariableDeclarator(node: any): IExpression;

    abstract processArrayExpression(node: any): IExpression;

    abstract processThisExpression(node: any): IExpression;

    abstract processFunctionExpression(node: any): IExpression;

    abstract processAwaitExpression(node: any): IExpression;

    abstract processBlockStatement(node: any): IExpression;

    abstract processArrowFunctionExpression(node: any): IExpression;

    abstract processVariableDeclaration(node: any): IExpression;

    abstract processCallExpression(node: any): IExpression;

    abstract processMemberExpression(node: any): IExpression;

    abstract processIdentifier(node: any): IExpression;

    abstract processLiteral(node: any): IExpression;

    abstract processBinaryExpression(node: any): IExpression;

    abstract processExpressionStatement(node: any): IExpression;

}