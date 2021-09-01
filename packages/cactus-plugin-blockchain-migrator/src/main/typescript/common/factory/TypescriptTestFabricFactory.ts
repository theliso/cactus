/* eslint-disable prettier/prettier */
import { IExpression } from "../interfaces/IExpression";
import { IFactory } from "../interfaces/IFactory";
import { ArrayExpression } from "../../model/test_model/typescript/fabric/ArrayExpression";
import { ArrowFunctionExpression } from "../../model/test_model/typescript/fabric/ArrowFunctionExpression";
import { AwaitExpression } from "../../model/test_model/typescript/fabric/AwaitExpression";
import { BinaryExpression } from "../../model/test_model/typescript/fabric/BinaryExpression";
import { BlockStatement } from "../../model/test_model/typescript/fabric/BlockStatement";
import { CallExpression } from "../../model/test_model/typescript/fabric/CallExpression";
import { ExpressionStatement } from "../../model/test_model/typescript/fabric/ExpressionStatement";
import { Identifier } from "../../model/test_model/typescript/fabric/Identifier";
import { Literal } from "../../model/test_model/typescript/fabric/Literal";
import { MemberExpression } from "../../model/test_model/typescript/fabric/MemberExpression";
import { ThisExpression } from "../../model/test_model/typescript/fabric/ThisExpression";
import { VariableDeclaration } from "../../model/test_model/typescript/fabric/VariableDeclaration";
import { VariableDeclarator } from "../../model/test_model/typescript/fabric/VariableDeclarator";

export class TypescriptTestFabricFactory implements IFactory {

    getBlockStatementInstance(body: any): IExpression {
        return new BlockStatement(body);
    }

    getArrowFunctionExpressionInstance(async: boolean, params: string, body: string): IExpression {
        return new ArrowFunctionExpression(async, params, body);
    }

    getAwaitExpressionInstance(awaitExpression: string): IExpression {
        return new AwaitExpression(awaitExpression);
    }

    getVariableDeclarationInstance(kind: string, leftSide: string, operator: string, rigthSide: string): IExpression {
        return new VariableDeclaration(kind, leftSide, operator, rigthSide);
    }

    getCallExpressionInstance(callee: string, args: string): IExpression {
        return new CallExpression(callee, args);
    }

    getMemberExpressionInstance(obj: string, property: string): IExpression {
        return new MemberExpression(obj, property);
    }

    getIdentifierInstance(name: string): IExpression {
        return new Identifier(name);
    }

    getLiteralInstance(value: string): IExpression {
        return new Literal(value);
    }

    getBinaryExpressionInstance(left: string, operator: string, right: string): IExpression {
        return new BinaryExpression(left, operator, right);
    }

    getExpressionStatementInstance(expression: string): IExpression {
        return new ExpressionStatement(expression);
    }

    getThisExpression(): IExpression {
        return new ThisExpression();
    }

    getArrayExpression(elements: string[]): IExpression {
        return new ArrayExpression(elements);
    }

    getVariableDeclarator(id: string, init: string): IExpression {
        return new VariableDeclarator(id, init);
    }

}