import { App } from "./app";
import * as parsePath from "parse-filepath";
import * as readline from "readline-sync";
import { Service } from "./common/Service";
import { TypescriptSrcAdapter } from "./adapter/src_adapter/TypescriptSrcAdapter";
import { TypescriptTestsAdapter } from "./adapter/tests_adapter/TypescriptTestsAdapter";
import { Monitor } from "./monitor/Monitor";

let filepath = process.argv[2];
const outputDir = process.argv[3];

if (filepath == undefined) {
  filepath = readline.question(
    "Enter Solidity File Name with Complete Path (e.g ../Examples/Example#1/SimpleStorage.sol   or '/Users/ahmad/Desktop//Examples/Example#1/SimpleStorage.sol')  : ",
  );
}

const directory = parsePath(filepath).dir;
const fileName = parsePath(filepath).basename;
let testsDir: any = undefined;
const monitor: Monitor = new Monitor();
if (process.argv.length > 4) {
  testsDir = parsePath(process.argv[4]);
  new App(
    new Service(
      new TypescriptSrcAdapter(monitor),
      new TypescriptTestsAdapter("ts", monitor),
    ),
  ).main(directory, fileName, outputDir, testsDir.dir, testsDir.basename);
} else {
  new App(new Service(new TypescriptSrcAdapter(monitor))).main(
    directory,
    fileName,
    outputDir,
  );
}
