/* eslint-disable prettier/prettier */
import { NotHandle } from "../../model/test_model/typescript/fabric/NotHandle";
import { OperatorEnum } from "../enums/OperatorEnum";
import { IExpression } from "../interfaces/IExpression";
import { IFactory } from "../interfaces/IFactory";
import { Monitor } from "../monitor/Monitor";
import { ASTInterpreter } from "./ASTInterpreter";

export class ASTInterpreterToFile extends ASTInterpreter {


    constructor(expressionHandlerFactory: IFactory, monitor: Monitor) {
        super(expressionHandlerFactory, monitor);
    }
    
    processForStatement(node: any): IExpression {
        return new NotHandle();
    }

    processUpdateExpression(node: any): IExpression {
        return new NotHandle();
    }

    processVariableDeclarator(node: any): IExpression {
        return new NotHandle();
    }

    processArrayExpression(node: any): IExpression {
        const elements: string[] = node.elements.map(element => this.processExpression(element).build(this.codeMonitor));
        return this.expressionHandlerFactory.getArrayExpression(elements);
    }

    processThisExpression(node: any): IExpression {
        return this.expressionHandlerFactory.getThisExpression(node);
    }
    processFunctionExpression(node: any): IExpression {
        return this.processArrowFunctionExpression(node);
    }

    processAwaitExpression(node: any): IExpression {
        const awaitExpression: string = this.processExpression(node.argument).build(this.codeMonitor);
        return this.expressionHandlerFactory.getAwaitExpressionInstance(awaitExpression);
    }

    processBlockStatement(node: any): IExpression {
        let body: string = "";
        node.body.forEach(elem => body += this.processExpression(elem).build(this.codeMonitor).concat("\n"));
        return this.expressionHandlerFactory.getBlockStatementInstance(body);
    }

    processArrowFunctionExpression(node: any): IExpression {
        let arrowFunction: string = "";
        node.params.forEach((param, index) => {
            arrowFunction += this.processExpression(param).build(this.codeMonitor);
            if (index < node.params.length - 1) {
                arrowFunction = arrowFunction.concat(", ");
            }
        });
        const body: string = this.processExpression(node.body).build(this.codeMonitor);
        return this.expressionHandlerFactory.getArrowFunctionExpressionInstance(
            node.async || arrowFunction === 'accounts',
            arrowFunction,
            body
        );
    }

    processVariableDeclaration(node: any): IExpression {
        const declaration: any = node.declarations[0];
        return this.expressionHandlerFactory.getVariableDeclarationInstance(
            node.kind,
            declaration.id.name,
            OperatorEnum.EQUAl,
            this.processExpression(declaration.init).build(this.codeMonitor)
        );
    }

    processCallExpression(node: any): IExpression {
        const callee: string = this.processExpression(node.callee).build(this.codeMonitor);
        let args: string = "";
        node.arguments.forEach((element, index) => {
            args = args.concat(this.processExpression(element).build(this.codeMonitor));
            if (index < node.arguments.length - 1) {
                args = args.concat(", ");
            }
        });
        return this.expressionHandlerFactory.getCallExpressionInstance(callee, args);
    }

    processMemberExpression(node: any): IExpression {
        const object: string = this.processExpression(node.object).build(this.codeMonitor);
        const property: string = this.processExpression(node.property).build(this.codeMonitor);
        return this.expressionHandlerFactory.getMemberExpressionInstance(object, property);
    }

    processIdentifier(node: any): IExpression {
        return this.expressionHandlerFactory.getIdentifierInstance(node.name);
    }

    processLiteral(node: any): IExpression {
        return this.expressionHandlerFactory.getLiteralInstance(node.raw);
    }

    processBinaryExpression(node: any): IExpression {
        const left: string = this.processExpression(node.left).build(this.codeMonitor);
        const right: string = this.processExpression(node.right).build(this.codeMonitor);
        return this.expressionHandlerFactory.getBinaryExpressionInstance(left, node.operator, right);

    }


    processExpressionStatement(node: any): IExpression {
        const expression: string = this.processExpression(node.expression).build(this.codeMonitor);
        return this.expressionHandlerFactory.getExpressionStatementInstance(expression);
    }

}