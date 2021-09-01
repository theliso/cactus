/* eslint-disable prettier/prettier */
import { IExpression } from "../interfaces/IExpression";
import { IFactory } from "../interfaces/IFactory";
import { Monitor } from "../monitor/Monitor";
import { ASTInterpreter } from "./ASTInterpreter";

export class ASTInterpreterInLine extends ASTInterpreter {

    constructor(expressionHandlerFactory: IFactory, monitor: Monitor) {
        super(expressionHandlerFactory, monitor);
    }

    processForStatement(node: any): IExpression {
        throw new Error("Method not implemented.");
    }

    processUpdateExpression(node: any): IExpression {
        throw new Error("Method not implemented.");
    }

    processVariableDeclarator(node: any): IExpression {
        throw new Error("Method not implemented.");
    }

    processArrayExpression(node: any): IExpression {
        throw new Error("Method not implemented.");
    }

    processThisExpression(node: any): IExpression {
        throw new Error("Method not implemented.");
    }

    processFunctionExpression(node: any): IExpression {
        throw new Error("Method not implemented.");
    }

    processAwaitExpression(node: any): IExpression {
        throw new Error("Method not implemented.");
    }

    processBlockStatement(node: any): IExpression {
        throw new Error("Method not implemented.");
    }

    processArrowFunctionExpression(node: any): IExpression {
        throw new Error("Method not implemented.");
    }

    processVariableDeclaration(node: any): IExpression {
        throw new Error("Method not implemented.");
    }

    processCallExpression(node: any): IExpression {
        throw new Error("Method not implemented.");
    }

    processMemberExpression(node: any): IExpression {
        throw new Error("Method not implemented.");
    }

    processIdentifier(node: any): IExpression {
        throw new Error("Method not implemented.");
    }

    processLiteral(node: any): IExpression {
        throw new Error("Method not implemented.");
    }

    processBinaryExpression(node: any): IExpression {
        throw new Error("Method not implemented.");
    }
    
    processExpressionStatement(node: any): IExpression {
        throw new Error("Method not implemented.");
    }

}