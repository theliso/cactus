import { OspreyApplication } from "./OspreyApplication";
import { OspreyConfiguration } from "./common/config/OspreyConfiguration";

//let filepath = process.argv[2];

/* if (filepath == undefined) {
  filepath = readline.question(
    "Enter Solidity File Name with Complete Path (e.g ../Examples/Example#1/SimpleStorage.sol   or '/Users/ahmad/Desktop//Examples/Example#1/SimpleStorage.sol')  : ",
  );
} */
const ospreyConfig: OspreyConfiguration = new OspreyConfiguration({
  smartContractDir: "/media/luis/Disco\ rigido/Luis/university/Masters/second_year/thesis/smart_contract_migration/solidity_contracts/contracts/complex",
  srcLang: "ts",
  blockchain: "fabric",
  srcFileName: "Marketplace.sol",
});
const ospreyClient: OspreyApplication = new OspreyApplication(ospreyConfig);
ospreyClient.translateSrcContractToFabric();
// const pathParsed = path.parse(filepath);
// const directory = pathParsed.dir;
// const fileName = pathParsed.base;

// const config = new OspreyConfiguration({
//   srcLang: "ts",
//   blockchain: "fabric",
//   smartContractDir: directory,
//   srcFileName: fileName,
// });

// console.log(config);

// const app = new OspreyApplication(config);
// app.translateSrcContract();


// if (process.argv.length > 4) {
//   testsDir = parsePath(process.argv[4]);
//   new App(
//     new Service(
//       new TypescriptSrcAdapter(monitor),
//       new TypescriptTestsAdapter("ts", monitor),
//     ),
//   ).main(directory, fileName, outputDir, testsDir.dir, testsDir.basename);
// } else {
//   new App(new Service(new TypescriptSrcAdapter(monitor))).main(
//     directory,
//     fileName,
//     outputDir,
//   );
// }
