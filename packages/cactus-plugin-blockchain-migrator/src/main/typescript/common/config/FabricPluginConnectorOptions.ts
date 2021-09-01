import { ICactusPlugin } from "../../../../../cactus-core-api/src/main/typescript/plugin/i-cactus-plugin";

export class FabricPluginConnectorOptions implements ICactusPlugin {
    getInstanceId(): string {
        throw new Error("Method not implemented.");
    }
    getPackageName(): string {
        throw new Error("Method not implemented.");
    }
    onPluginInit(): Promise<unknown> {
        throw new Error("Method not implemented.");
    }

}