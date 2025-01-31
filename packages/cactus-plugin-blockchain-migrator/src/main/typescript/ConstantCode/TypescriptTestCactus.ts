import { ChainCodeProgrammingLanguage } from "../common/enums/ChainCodeProgrammingLanguage"
import { FabricContractInvocationType } from "../common/enums/FabricContractInvocationType"

export class TypescriptTestCactus {


    static runTransctionV1 = (methodName: string, params: string[], invocationType: FabricContractInvocationType): string => {
        return `await apiClient.runTransactionV1({
            contractName,
            channelName,
            params: [${params}],
            methodName: "${methodName}",
            invocationType: FabricContractInvocationType.${invocationType},
            signingCredential: {
              keychainId,
              keychainRef: keychainEntryKey,
            },
          });`
    }

    static endTest(innerTestNumber: number): string {
      return `t${innerTestNumber}.end();\n`;
    }

    static sourceFiles(file: string, relativePath: string): string {
      return `{
  const filename = "./${file}";
  const relativePath = "${relativePath}";
  const filePath = path.join(contractDir, relativePath, filename);
  const buffer = await fs.readFile(filePath);
  sourceFiles.push({
    body: buffer.toString("base64"),
    filepath: relativePath,
    filename,
  });
}\n`;
  }

    static deployContractV1 = (hasConstructor: boolean, chainCodeProgrammingLanguage: ChainCodeProgrammingLanguage, ccLabel: string, constructorAgrs?: string[]): string => {
      return `await apiClient.deployContractV1({
        channelId,
        ccVersion: "1.0.0",
        ${hasConstructor ? `constructorArgs: { Args: [${constructorAgrs}] },` : ""}
        sourceFiles,
        ccName: contractName,
        targetOrganizations: [org1Env, org2Env],
        caFile: \`\${orgCfgDir}ordererOrganizations/example.com/orderers/orderer.example.com/msp/tlscacerts/tlsca.example.com-cert.pem\`,
        ccLabel: "${ccLabel}",
        ccLang: ChainCodeProgrammingLanguage.${chainCodeProgrammingLanguage},
        ccSequence: 1,
        orderer: "orderer.example.com:7050",
        ordererTLSHostnameOverride: "orderer.example.com",
        connTimeout: 60,
      });`
    }

    static cactusTestTemplate = (testCode: string, smartContractName: string, sourceFiles: string): string => {
      return `
import { AddressInfo } from "net";
import http from "http";
import fs from "fs-extra";
import path from "path";

import test, { Test } from "tape-promise/tape";
import { v4 as uuidv4 } from "uuid";

import express from "express";
import bodyParser from "body-parser";

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
import { PluginRegistry } from "@hyperledger/cactus-core";

import {
ChainCodeProgrammingLanguage,
DefaultEventHandlerStrategy,
FabricContractInvocationType,
FileBase64,
PluginLedgerConnectorFabric,
} from "../../../../main/typescript/public-api";

import { DefaultApi as FabricApi } from "../../../../main/typescript/public-api";

import { IPluginLedgerConnectorFabricOptions } from "../../../../main/typescript/plugin-ledger-connector-fabric";

import { DiscoveryOptions } from "fabric-network";
import { PluginKeychainMemory } from "@hyperledger/cactus-plugin-keychain-memory";
import { Configuration } from "@hyperledger/cactus-core-api";

const testCase = "deploys Fabric 2.x contract from typescript source";
const logLevel: LogLevelDesc = "TRACE";

test("BEFORE " + testCase, async (t: Test) => {
  const pruning = pruneDockerAllIfGithubAction({ logLevel });
  await t.doesNotReject(pruning, "Pruning didn't throw OK");
  t.end();
});
test(testCase, async (t: Test) => {
  const channelId = "mychannel";
  const channelName = channelId;

  test.onFailure(async () => {
    await Containers.logDiagnostics({ logLevel });
  });

  const ledger = new FabricTestLedgerV1({
    emitContainerLogs: true,
    publishAllPorts: true,
    // imageName: "faio2x",
    // imageVersion: "latest",
    imageName: "ghcr.io/hyperledger/cactus-fabric2-all-in-one",
    imageVersion: "2021-04-20-nodejs",
    envVars: new Map([["FABRIC_VERSION", "2.2.0"]]),
    logLevel,
  });
  const tearDown = async () => {
    await ledger.stop();
    await ledger.destroy();
    await pruneDockerAllIfGithubAction({ logLevel });
  };

  test.onFinish(tearDown);
  await ledger.start();

  const connectionProfile = await ledger.getConnectionProfileOrg1();
  t.ok(connectionProfile, "getConnectionProfileOrg1() out truthy OK");

  const enrollAdminOut = await ledger.enrollAdmin();
  const adminWallet = enrollAdminOut[1];
  const [userIdentity] = await ledger.enrollUser(adminWallet);
  const sshConfig = await ledger.getSshConfig();

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
  const orgCfgDir = "/opt/gopath/src/github.com/hyperledger/fabric/peer/organizations/";

  // these below mirror how the fabric-samples sets up the configuration
  const org1Env = {
    CORE_LOGGING_LEVEL: "debug",
    FABRIC_LOGGING_SPEC: "debug",
    CORE_PEER_LOCALMSPID: "Org1MSP",

    ORDERER_CA: \`\${orgCfgDir}ordererOrganizations/example.com/orderers/orderer.example.com/msp/tlscacerts/tlsca.example.com-cert.pem\`,

    FABRIC_CFG_PATH: "/etc/hyperledger/fabric",
    CORE_PEER_TLS_ENABLED: "true",
    CORE_PEER_TLS_ROOTCERT_FILE: \`\${orgCfgDir}peerOrganizations/org1.example.com/peers/peer0.org1.example.com/tls/ca.crt\`,
    CORE_PEER_MSPCONFIGPATH: \`\${orgCfgDir}peerOrganizations/org1.example.com/users/Admin@org1.example.com/msp\`,
    CORE_PEER_ADDRESS: "peer0.org1.example.com:7051",
    ORDERER_TLS_ROOTCERT_FILE: \`\${orgCfgDir}ordererOrganizations/example.com/orderers/orderer.example.com/msp/tlscacerts/tlsca.example.com-cert.pem\`,
  };

  // these below mirror how the fabric-samples sets up the configuration
  const org2Env = {
    CORE_LOGGING_LEVEL: "debug",
    FABRIC_LOGGING_SPEC: "debug",
    CORE_PEER_LOCALMSPID: "Org2MSP",

    FABRIC_CFG_PATH: "/etc/hyperledger/fabric",
    CORE_PEER_TLS_ENABLED: "true",
    ORDERER_CA: \`\${orgCfgDir}ordererOrganizations/example.com/orderers/orderer.example.com/msp/tlscacerts/tlsca.example.com-cert.pem\`,

    CORE_PEER_ADDRESS: "peer0.org2.example.com:9051",
    CORE_PEER_MSPCONFIGPATH: \`\${orgCfgDir}peerOrganizations/org2.example.com/users/Admin@org2.example.com/msp\`,
    CORE_PEER_TLS_ROOTCERT_FILE: \`\${orgCfgDir}peerOrganizations/org2.example.com/peers/peer0.org2.example.com/tls/ca.crt\`,
    ORDERER_TLS_ROOTCERT_FILE: \`\${orgCfgDir}ordererOrganizations/example.com/orderers/orderer.example.com/msp/tlscacerts/tlsca.example.com-cert.pem\`,
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
    port: 0,
    server,
  };
  const addressInfo = (await Servers.listen(listenOptions)) as AddressInfo;
  const { port } = addressInfo;
  test.onFinish(async () => await Servers.shutdown(server));

  await plugin.getOrCreateWebServices();
  await plugin.registerWebServices(expressApp);
  const apiUrl = \`http://localhost:\${port}\`;

  const config = new Configuration({ basePath: apiUrl });

  const apiClient = new FabricApi(config);
  const contractName = \"${smartContractName}\";
  const contractRelPath = "../../fixtures/go/${smartContractName}";
  const contractDir = path.join(__dirname, contractRelPath);

  // ├── package.json
  // ├── src
  // │   ├── assetTransfer.ts
  // │   ├── asset.ts
  // │   └── index.ts
  // ├── tsconfig.json
  // └── tslint.json
  const sourceFiles: FileBase64[] = [];
  ${sourceFiles}
  ${testCode}

  t.end();
});
      `;
    }

    static assertsAfterDeploy = (deployInstance: string, innerTestNumber: number) : string => {
      return `  const { packageIds, lifecycle, success } = ${deployInstance}.data;
  t${innerTestNumber}.equal(${deployInstance}.status, 200, "${deployInstance}.status === 200 OK");
  t${innerTestNumber}.true(success, "${deployInstance}.data.success === true");

  const {
    approveForMyOrgList,
    installList,
    queryInstalledList,
    commit,
    packaging,
    queryCommitted,
  } = lifecycle;

  Checks.truthy(packageIds, \`packageIds truthy OK\`);
  Checks.truthy(
    Array.isArray(packageIds),
    \`Array.isArray(packageIds) truthy OK\`,
  );
  Checks.truthy(approveForMyOrgList, \`approveForMyOrgList truthy OK\`);
  Checks.truthy(
    Array.isArray(approveForMyOrgList),
    \`Array.isArray(approveForMyOrgList) truthy OK\`,
  );
  Checks.truthy(installList, \`installList truthy OK\`);
  Checks.truthy(
    Array.isArray(installList),
    \`Array.isArray(installList) truthy OK\`,
  );
  Checks.truthy(queryInstalledList, \`queryInstalledList truthy OK\`);
  Checks.truthy(
    Array.isArray(queryInstalledList),
    \`Array.isArray(queryInstalledList) truthy OK\`,
  );
  Checks.truthy(commit, \`commit truthy OK\`);
  Checks.truthy(packaging, \`packaging truthy OK\`);
  Checks.truthy(queryCommitted, \`queryCommitted truthy OK\`);
  // FIXME - without this wait it randomly fails with an error claiming that
  // the endorsement was impossible to be obtained. The fabric-samples script
  // does the same thing, it just waits 10 seconds for good measure so there
  // might not be a way for us to avoid doing this, but if there is a way we
  // absolutely should not have timeouts like this, anywhere...
  await new Promise((resolve) => setTimeout(resolve, 10000));
  `;
    }
}