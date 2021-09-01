/* eslint-disable prettier/prettier */
import http from "http";
import fs from "fs-extra";
import { AddressInfo } from "net";
import test, { Test } from "tape-promise/tape";
import { v4 as uuidv4 } from "uuid";
import bodyParser from "body-parser";
import express from "express";
import {
  Containers,
  FabricTestLedgerV1,
  pruneDockerAllIfGithubAction,
} from "@hyperledger/cactus-test-tooling";
import {
  Checks,
  IListenOptions,
  LogLevelDesc,
  Servers,
} from "@hyperledger/cactus-common";
import { PluginKeychainMemory } from "@hyperledger/cactus-plugin-keychain-memory";
import { PluginRegistry } from "@hyperledger/cactus-core";
import {
  Configuration,
} from "@hyperledger/cactus-core-api";
import {
  ChainCodeProgrammingLanguage,
  DefaultEventHandlerStrategy,
  FabricContractInvocationType,
  FileBase64,
  IPluginLedgerConnectorFabricOptions,
  PluginLedgerConnectorFabric,
  DefaultApi as FabricApi,
} from "@hyperledger/cactus-plugin-ledger-connector-fabric";

import { OspreyApplication } from "../../../main/typescript/OspreyApplication";
import { OspreyConfiguration } from "../../../main/typescript/common/config/OspreyConfiguration";
import path = require("path/posix");
import { DiscoveryOptions } from "fabric-network";

const logLevel: LogLevelDesc = "TRACE";



test("Testing migration using fabric and besu connector", async (t: Test) => {
  // Fabric initialization
  const pruning = pruneDockerAllIfGithubAction({ logLevel });
  await t.doesNotReject(pruning, "Pruning didn't throw OK");
  test.onFailure(async () => {
    await Containers.logDiagnostics({ logLevel });
  });
  console.log("after prunning");
  const channelId = "mychannel";
  const channelName = channelId;
  const fabricLedger = new FabricTestLedgerV1({
    emitContainerLogs: true,
    publishAllPorts: true,
    // imageName: "faio2x",
    // imageVersion: "latest",
    imageName: "ghcr.io/hyperledger/cactus-fabric2-all-in-one",
    imageVersion: "2021-04-20-nodejs",
    envVars: new Map([["FABRIC_VERSION", "2.2.0"]]),
    logLevel,
  });
  console.log("Starting Fabric");
  const tearDown = async () => {
    await fabricLedger.stop();
    await fabricLedger.destroy();
    await pruneDockerAllIfGithubAction({ logLevel });
  };

  test.onFinish(tearDown);
  console.log("After test tearDown is done!");
  await fabricLedger.start();
  console.log("After Starting Fabric");
  const connectionProfile = await fabricLedger.getConnectionProfileOrg1();
  t.ok(connectionProfile, "getConnectionProfileOrg1() out truthy OK");
  const enrollAdminOut = await fabricLedger.enrollAdmin();
  const adminWallet = enrollAdminOut[1];
  const [userIdentity] = await fabricLedger.enrollUser(adminWallet);
  const sshConfig = await fabricLedger.getSshConfig();
  const keychainInstanceId = uuidv4();
  const keychainId = uuidv4();
  const keychainEntryKey = "user2";
  const keychainEntryValue = JSON.stringify(userIdentity);
  const keychainPlugin = new PluginKeychainMemory({
    instanceId: keychainInstanceId,
    keychainId,
    logLevel,
    backend: new Map([
      [keychainEntryKey, keychainEntryValue],
      ["some-other-entry-key", "some-other-entry-value"],
    ]),
  });

  const pluginRegistry = new PluginRegistry({ plugins: [keychainPlugin] });

  const discoveryOptions: DiscoveryOptions = {
    enabled: true,
    asLocalhost: true,
  };
  // This is the directory structure of the Fabirc 2.x CLI container (fabric-tools image)
  // const orgCfgDir = "/fabric-samples/test-network/organizations/";
  const orgCfgDir =
    "/opt/gopath/src/github.com/hyperledger/fabric/peer/organizations/";

  // these below mirror how the fabric-samples sets up the configuration
  const org1Env = {
    CORE_LOGGING_LEVEL: "debug",
    FABRIC_LOGGING_SPEC: "debug",
    CORE_PEER_LOCALMSPID: "Org1MSP",

    ORDERER_CA: `${orgCfgDir}ordererOrganizations/example.com/orderers/orderer.example.com/msp/tlscacerts/tlsca.example.com-cert.pem`,

    FABRIC_CFG_PATH: "/etc/hyperledger/fabric",
    CORE_PEER_TLS_ENABLED: "true",
    CORE_PEER_TLS_ROOTCERT_FILE: `${orgCfgDir}peerOrganizations/org1.example.com/peers/peer0.org1.example.com/tls/ca.crt`,
    CORE_PEER_MSPCONFIGPATH: `${orgCfgDir}peerOrganizations/org1.example.com/users/Admin@org1.example.com/msp`,
    CORE_PEER_ADDRESS: "peer0.org1.example.com:7051",
    ORDERER_TLS_ROOTCERT_FILE: `${orgCfgDir}ordererOrganizations/example.com/orderers/orderer.example.com/msp/tlscacerts/tlsca.example.com-cert.pem`,
  };

  // these below mirror how the fabric-samples sets up the configuration
  const org2Env = {
    CORE_LOGGING_LEVEL: "debug",
    FABRIC_LOGGING_SPEC: "debug",
    CORE_PEER_LOCALMSPID: "Org2MSP",

    FABRIC_CFG_PATH: "/etc/hyperledger/fabric",
    CORE_PEER_TLS_ENABLED: "true",
    ORDERER_CA: `${orgCfgDir}ordererOrganizations/example.com/orderers/orderer.example.com/msp/tlscacerts/tlsca.example.com-cert.pem`,

    CORE_PEER_ADDRESS: "peer0.org2.example.com:9051",
    CORE_PEER_MSPCONFIGPATH: `${orgCfgDir}peerOrganizations/org2.example.com/users/Admin@org2.example.com/msp`,
    CORE_PEER_TLS_ROOTCERT_FILE: `${orgCfgDir}peerOrganizations/org2.example.com/peers/peer0.org2.example.com/tls/ca.crt`,
    ORDERER_TLS_ROOTCERT_FILE: `${orgCfgDir}ordererOrganizations/example.com/orderers/orderer.example.com/msp/tlscacerts/tlsca.example.com-cert.pem`,
  };

  const pluginOptions: IPluginLedgerConnectorFabricOptions = {
    instanceId: uuidv4(),
    dockerBinary: "/usr/local/bin/docker",
    peerBinary: "/fabric-samples/bin/peer",
    goBinary: "/usr/local/go/bin/go",
    pluginRegistry,
    cliContainerEnv: org1Env,
    sshConfig,
    logLevel,
    connectionProfile,
    discoveryOptions,
    eventHandlerOptions: {
      strategy: DefaultEventHandlerStrategy.NetworkScopeAllfortx,
      commitTimeout: 300,
    },
  };
  const plugin = new PluginLedgerConnectorFabric(pluginOptions);

  const expressApp = express();
  expressApp.use(bodyParser.json({ limit: "250mb" }));
  const server = http.createServer(expressApp);
  const listenOptions: IListenOptions = {
    hostname: "localhost",
    port: 9000,
    server,
  };
  const addressInfo = (await Servers.listen(listenOptions)) as AddressInfo;
  const { port } = addressInfo;
  test.onFinish(async () => await Servers.shutdown(server));

  await plugin.getOrCreateWebServices();
  await plugin.registerWebServices(expressApp);
  const apiUrl = `http://localhost:${port}`;
  const config = new Configuration({ basePath: apiUrl });
  console.info("Initializing Fabric api");
  const apiClient = new FabricApi(config);

  // Besu initialization


  // 1 - Osprey initialization - checked
  // 2 - Read the solidity dataset and compile the smart contracts to a JSON file - 
  // 3 - assign the JSON file to the keychainPlugin, the  associate to the pluginRegistry of the
  // connector (keychainPlugin.set(json.contractName, json.parse(jsonFile))) - 
  // 4 - Call the Osprey translation function - checked
  // 5 - Call Osprey test translation - 
  // 6 - Test the smart contracts and chaincode in its test ledgers - 
  // 7 - Once the results are out, in case of OK deploy in Fabric - 
  console.info("Initialize Osprey");
  const ospreyConfig: OspreyConfiguration = new OspreyConfiguration({
    smartContractDir: "/media/luis/Disco\ rigido/Luis/university/Masters/second_year/thesis/smart_contract_migration/solidity_contracts/contracts/simple",
    srcLang: "ts",
    blockchain: "fabric",
    srcFileName: "SimpleStorage.sol",
    testDir: "/media/luis/Disco\ rigido/Luis/university/Masters/second_year/thesis/smart_contract_migration/solidity_contracts/test/simple",
    testFileName: "simplestorage.js",
    testLang: "js"
  });
  const ospreyClient: OspreyApplication = new OspreyApplication(ospreyConfig);
  ospreyClient.translateSrcContractToFabric();
  //ospreyClient.translateTest();
  console.info("After translating Contract");
  const contractName = "SimpleStorage";
  const contractRelPath = "../../typescript/fixtures";
  const contractDir = path.join(__dirname, contractRelPath, contractName);

  // ├── package.json
  // ├── src
  // │   ├── assetTransfer.ts
  // │   ├── asset.ts
  // │   └── index.ts
  // ├── tsconfig.json
  // └── tslint.json
  const sourceFiles: FileBase64[] = [];
  {
    const filename = "./SimpleStorage.ts";
    const relativePath = "./src/";
    const filePath = path.join(contractDir, relativePath, filename);
    const buffer = await fs.readFile(filePath);
    sourceFiles.push({
      body: buffer.toString("base64"),
      filepath: relativePath,
      filename,
    });
  }
  {
    const filename = "./index.ts";
    const relativePath = "./src/";
    const filePath = path.join(contractDir, relativePath, filename);
    const buffer = await fs.readFile(filePath);
    sourceFiles.push({
      body: buffer.toString("base64"),
      filepath: relativePath,
      filename,
    });
  }
  {
    const filename = "./package.json";
    const relativePath = "./";
    const filePath = path.join(contractDir, relativePath, filename);
    const buffer = await fs.readFile(filePath);
    sourceFiles.push({
      body: buffer.toString("base64"),
      filepath: relativePath,
      filename,
    });
  }
  {
    const filename = "./tsconfig.json";
    const relativePath = "./";
    const filePath = path.join(contractDir, relativePath, filename);
    const buffer = await fs.readFile(filePath);
    sourceFiles.push({
      body: buffer.toString("base64"),
      filepath: relativePath,
      filename,
    });
  }
  {
    const filename = "./tslint.json";
    const relativePath = "./";
    const filePath = path.join(contractDir, relativePath, filename);
    const buffer = await fs.readFile(filePath);
    sourceFiles.push({
      body: buffer.toString("base64"),
      filepath: relativePath,
      filename,
    });
  }

  test("...should store the value 89.", async (t1: Test) => {
    const simpleStorageInstance = await apiClient.deployContractV1({
      channelId,
      ccVersion: "1.0.0",

      sourceFiles,
      ccName: contractName,
      targetOrganizations: [org1Env, org2Env],
      caFile: `${orgCfgDir}ordererOrganizations/example.com/orderers/orderer.example.com/msp/tlscacerts/tlsca.example.com-cert.pem`,
      ccLabel: "SimpleStorage",
      ccLang: ChainCodeProgrammingLanguage.Typescript,
      ccSequence: 1,
      orderer: "orderer.example.com:7050",
      ordererTLSHostnameOverride: "orderer.example.com",
      connTimeout: 60,
    });
    const { packageIds, lifecycle, success } = simpleStorageInstance.data;
    t1.equal(simpleStorageInstance.status, 200, "simpleStorageInstance.status === 200 OK");
    t1.true(success, "simpleStorageInstance.data.success === true");

    const {
      approveForMyOrgList,
      installList,
      queryInstalledList,
      commit,
      packaging,
      queryCommitted,
    } = lifecycle;

    Checks.truthy(packageIds, `packageIds truthy OK`);
    Checks.truthy(
      Array.isArray(packageIds),
      `Array.isArray(packageIds) truthy OK`,
    );
    Checks.truthy(approveForMyOrgList, `approveForMyOrgList truthy OK`);
    Checks.truthy(
      Array.isArray(approveForMyOrgList),
      `Array.isArray(approveForMyOrgList) truthy OK`,
    );
    Checks.truthy(installList, `installList truthy OK`);
    Checks.truthy(
      Array.isArray(installList),
      `Array.isArray(installList) truthy OK`,
    );
    Checks.truthy(queryInstalledList, `queryInstalledList truthy OK`);
    Checks.truthy(
      Array.isArray(queryInstalledList),
      `Array.isArray(queryInstalledList) truthy OK`,
    );
    Checks.truthy(commit, `commit truthy OK`);
    Checks.truthy(packaging, `packaging truthy OK`);
    Checks.truthy(queryCommitted, `queryCommitted truthy OK`);
    // FIXME - without this wait it randomly fails with an error claiming that
    // the endorsement was impossible to be obtained. The fabric-samples script
    // does the same thing, it just waits 10 seconds for good measure so there
    // might not be a way for us to avoid doing this, but if there is a way we
    // absolutely should not have timeouts like this, anywhere...
    await new Promise((resolve) => setTimeout(resolve, 10000));

    await apiClient.runTransactionV1({
      contractName,
      channelName,
      params: ["89"],
      methodName: "set",
      invocationType: FabricContractInvocationType.Send,
      signingCredential: {
        keychainId,
        keychainRef: keychainEntryKey,
      },
    });
    const storedData = await apiClient.runTransactionV1({
      contractName,
      channelName,
      params: [""],
      methodName: "get",
      invocationType: FabricContractInvocationType.Call,
      signingCredential: {
        keychainId,
        keychainRef: keychainEntryKey,
      },
    });
    t1.equal(JSON.parse(storedData.data.functionOutput), 89, "The value 89 was stored.");


    t1.end();
  }
  );

  // Dispose the test
  t.end();
});
