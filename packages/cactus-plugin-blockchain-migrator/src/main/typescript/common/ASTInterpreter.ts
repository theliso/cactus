import { IExpression } from "./interfaces/IExpression";
import { OperatorEnum } from "../enums/OperatorEnum";
import { IFactory } from "./interfaces/IFactory";
import { Monitor } from "../monitor/Monitor";
import { NotHandle } from "../model/test_model/typescript/fabric/NotHandle";

export class ASTInterpreter {

    private readonly _expressionHandlerFactory: IFactory;
    private _codeMonitor: Monitor;
    private readonly CONTRACT: string = "contract";

    constructor(expressionHandlerFactory: IFactory, monitor: Monitor) {
        this._expressionHandlerFactory = expressionHandlerFactory;
        this._codeMonitor = monitor;
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
        let elements: string[] = node.elements.map(element => this.processExpression(element).build(this._codeMonitor))
        return this._expressionHandlerFactory.getArrayExpression(elements);
    }

    processThisExpression(node: any): IExpression {
        return this._expressionHandlerFactory.getThisExpression(node);
    }
    processFunctionExpression(node: any): IExpression {
        return this.processArrowFunctionExpression(node);
    }

    processAwaitExpression(node: any): IExpression {
        let awaitExpression: string = this.processExpression(node.argument).build(this._codeMonitor);
        return this._expressionHandlerFactory.getAwaitExpressionInstance(awaitExpression);
    }

    processBlockStatement(node: any): IExpression {
        let body: string = "";
        node.body.forEach(elem => body += this.processExpression(elem).build(this._codeMonitor).concat("\n"));
        return this._expressionHandlerFactory.getBlockStatementInstance(body);
    }

    processArrowFunctionExpression(node: any): IExpression {
        let arrowFunction: string = "";
        node.params.forEach((param, index) => {
            arrowFunction += this.processExpression(param).build(this._codeMonitor);
            if (index < node.params.length - 1) {
                arrowFunction = arrowFunction.concat(", ");
            }
        });
        let body: string = this.processExpression(node.body).build(this._codeMonitor);
        return this._expressionHandlerFactory.getArrowFunctionExpressionInstance(
            node.async || arrowFunction === 'accounts',
            arrowFunction,
            body
        );
    }

    processVariableDeclaration(node: any): IExpression {
        let declaration: any = node.declarations[0];
        return this._expressionHandlerFactory.getVariableDeclarationInstance(
            node.kind,
            declaration.id.name,
            OperatorEnum.EQUAl,
            this.processExpression(declaration.init).build(this._codeMonitor)
        );
    }

    processCallExpression(node: any): IExpression {
        let callee: string = this.processExpression(node.callee).build(this._codeMonitor);
        let args: string = "";
            node.arguments.forEach((element, index) => {
                args = args.concat(this.processExpression(element).build(this._codeMonitor));
                if (index < node.arguments.length - 1) {
                    args = args.concat(", ");
                }
            });
        return this._expressionHandlerFactory.getCallExpressionInstance(callee, args);
    }

    processMemberExpression(node: any): IExpression {
        let object: string = this.processExpression(node.object).build(this._codeMonitor);
        let property: string = this.processExpression(node.property).build(this._codeMonitor);
        return this._expressionHandlerFactory.getMemberExpressionInstance(object, property);
    }

    processIdentifier(node: any): IExpression {
        return this._expressionHandlerFactory.getIdentifierInstance(node.name);
    }

    processLiteral(node: any): IExpression {
        return this._expressionHandlerFactory.getLiteralInstance(node.raw);
    }

    processBinaryExpression(node: any): IExpression {
        let left: string = this.processExpression(node.left).build(this._codeMonitor);
        let right: string = this.processExpression(node.right).build(this._codeMonitor);
        return this._expressionHandlerFactory.getBinaryExpressionInstance(left, node.operator, right);

    }


    processExpressionStatement(node: any): IExpression {
        let expression: string = this.processExpression(node.expression).build(this._codeMonitor);
        return this._expressionHandlerFactory.getExpressionStatementInstance(expression);
    }

}