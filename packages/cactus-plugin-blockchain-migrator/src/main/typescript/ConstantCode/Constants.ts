/* eslint-disable prettier/prettier */

export class ConstantCode {

	static mixinDeclaration: string = 'export type Class = new (...args: any[]) => any;';
	static header = (isMainContract: boolean): string =>
		`import { ${isMainContract ? 'Contract, ' : ''}Context } from 'fabric-contract-api';\n`;

	static utils: string = 'import { Utils, Class } from \'./utils/Utils\';\n';
	
	static balance: string = 'import { Balance } from \'./utils/Balance\';\n';

	static indexTsFile = (file: string): string => {
		return `import { ${file} } from './${file}';\n`
			.concat(`export { ${file} } from './${file}';\n`)
			.concat(`export const contracts: any[] = [${file}];`);
	}

	static balanceClass = () : string => {
		return 'import { Context } from \'fabric-contract-api\';\n\n'
		.concat('export class Balance {\n')
		.concat('\tstatic async send(ctx: Context, addressFrom: string, addressTo: string, amount: number): Promise<void> {\n')
		.concat('\t\tlet senderBalanceVal = parseFloat(await ctx.stub.invokeChaincode("balance", ["getBalance", addressFrom], "mychannel"));\n')
		.concat('\t\tlet receiverBalanceVal = parseFloat(await ctx.stub.invokeChaincode("balance", ["getBalance", addressTo], "mychannel"));\n')
		.concat('\t\tif (senderBalanceVal > amount) {\n')
		.concat('\t\t\tsenderBalanceVal -= amount;\n')
		.concat('\t\t\treceiverBalanceVal += amount;\n')
		.concat('\t\t\tawait ctx.stub.putState(addressFrom, Buffer.from(senderBalanceVal.toString()));\n')
		.concat('\t\t\tawait ctx.stub.putState(addressTo, Buffer.from(receiverBalanceVal.toString()));\n')
		.concat('\t\t} else {\n')
		.concat('\t\t\tthrow new Error(\'Sender has not enough amount to transfer\');\n')
		.concat('\t\t}\n')
		.concat('\t}\n')
		.concat('\tstatic async balance(ctx: Context, userAddress: string): Promise<number> {\n')
		.concat('\t\tlet balance = await ctx.stub.getState(userAddress);\n')
		.concat('\t\treturn parseFloat(balance);\n')
		.concat('\t}\n')
		.concat('}');

	}


	static packageJsonFile = (projectName: string): string => `{
		"name": "${projectName.toLowerCase()}",
		"version": "1.0.0",
		"description": "",
		"main": "dist/index.js",
		"typings": "dist/index.d.ts",
		"engines": {
		  "node": ">=12",
		  "npm": ">=5"
		},
		"scripts": {
		  "lint": "tslint -c tslint.json 'src/**/*.ts'",
		  "pretest": "npm run lint",
		  "test": "nyc mocha -r ts-node/register src/**/*.spec.ts",
		  "start": "fabric-chaincode-node start",
		  "build": "tsc",
		  "build:watch": "tsc -w",
		  "prepublishOnly": "npm run build"
		},
		"engineStrict": true,
		"author": "",
		"license": "ISC",
		"dependencies": {
		  "fabric-contract-api": "^2.0.0",
		  "fabric-shim": "^2.0.0"
		},
		"devDependencies": {
			"@types/chai": "^4.2.15",
			"@types/mocha": "^8.2.1",
			"@types/node": "^14.14.31",
			"@types/sinon": "^9.0.10",
			"@types/sinon-chai": "^3.2.5",
			"chai": "^4.3.0",
			"mocha": "^8.3.1",
			"nyc": "^15.1.0",
			"sinon": "^9.2.4",
			"sinon-chai": "^3.5.0",
			"ts-node": "^7.0.1",
			"tslint": "^5.11.0",
			"typescript": "^3.1.6"
		},
		"nyc": {
		  "extension": [
			".ts",
			".tsx"
		  ],
		  "exclude": [
			"coverage/**",
			"dist/**"
		  ],
		  "reporter": [
			"text-summary",
			"html"
		  ],
		  "all": true,
		  "check-coverage": true,
		  "statements": 100,
		  "branches": 100,
		  "functions": 100,
		  "lines": 100
		}
}`;

	static tsConfigJson: string = `{
		"compilerOptions": {
			"experimentalDecorators": true,
			"emitDecoratorMetadata": true,
			"outDir": "dist",
			"target": "es2017",
			"moduleResolution": "node",
			"module": "commonjs",
			"declaration": true,
			"sourceMap": true
		},
		"include": [
			"./src/**/*",
			"./test/**/*"
		],
		"exclude": [
			"./test/**/*.spec.ts"
		]
}`;

	static tslintJson: string = `{
		"defaultSeverity": "error",
		"extends": [
			"tslint:recommended"
		],
		"jsRules": {},
		"rules": {
			"indent": [true, "spaces", 4],
			"linebreak-style": [true, "LF"],
			"quotemark": [true, "single"],
			"semicolon": [true, "always"],
			"no-console": false,
			"curly": true,
			"triple-equals": true,
			"no-string-throw": true,
			"no-var-keyword": true,
			"no-trailing-whitespace": true,
			"object-literal-key-quotes": [true, "as-needed"],
			"object-literal-sort-keys": false,
			"max-line-length": false
		},
		"rulesDirectory": []
}`;

	static replacer: string = `static replacer(key, value): any {
	if (value instanceof Map) {
		return {
			dataType: 'Map',
			value: Array.from(value.entries()),
		};
	} else {
		return value;
	}
}`;

	static reviver: string = `static reviver(key, value): any {
	if (typeof value === 'object' && value !== null) {
		if (value.dataType === 'Map') {
			return new Map(value.value);
		}
	}
	return value;
	}`;

	static build(): string {
		let utils: string = '';
		utils = utils.concat(this.mixinDeclaration).concat('\n');
		utils = utils.concat('export class Utils {\n').concat(this.replacer).concat('\n').concat(this.reviver).concat('\n}');
		return utils;
	}

	static invokeReviver(): string {
		return `Utils.reviver`;
	}

	static invokeReplacer(): string {
		return `Utils.replacer`;
	}
}
