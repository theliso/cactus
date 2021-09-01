/* eslint-disable prettier/prettier */
import { parse } from "solidity-parser-antlr";
import { parse as parseAccorn } from "acorn";
import * as fs from 'fs';
import * as path from "path";

export class Utils {

    static solFileToAST(fileName: string): any {
        console.log(fileName);
        const input = fs.readFileSync(fileName, 'utf8');
        return parse(input);
    }

    static jsFileToAST(fileName: string): any {
        const input = fs.readFileSync(fileName, 'utf8');
        return parseAccorn(input, { ecmaVersion: "latest" });
    }

    static log(ast: any, mainContract?: string): void {
        const logPath: string = path.join(__dirname, "../../logs");
        if (!fs.existsSync(logPath)) {
            fs.mkdirSync(logPath);
        }
        fs.writeFileSync(
            path.join(logPath, mainContract.concat("_log.json")),
            JSON.stringify(ast, null, 1)
        );
    }


}