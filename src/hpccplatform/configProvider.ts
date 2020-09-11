import { scopedLogger } from "@hpcc-js/util";
import * as vscode from "vscode";
import { LaunchRequestArguments, LaunchConfig } from "./launchConfig";

const logger = scopedLogger("eclConfigProvide.ts");

export let eclConfigurationProvider: ECLConfigurationProvider;
export class ECLConfigurationProvider implements vscode.DebugConfigurationProvider {
    protected _ctx: vscode.ExtensionContext;

    constructor(ctx: vscode.ExtensionContext) {
        this._ctx = ctx;
        ctx.subscriptions.push(vscode.debug.registerDebugConfigurationProvider("ecl", this));
    }

    static attach(ctx: vscode.ExtensionContext): ECLConfigurationProvider {
        if (!eclConfigurationProvider) {
            eclConfigurationProvider = new ECLConfigurationProvider(ctx);
        }
        return eclConfigurationProvider;
    }

    async resolveDebugConfiguration?(folder: vscode.WorkspaceFolder | undefined, debugConfiguration: vscode.DebugConfiguration, token?: vscode.CancellationToken): Promise<vscode.DebugConfiguration> {
        const eclConfig = vscode.workspace.getConfiguration("ecl");
        debugConfiguration.debugLogging = eclConfig.get<boolean>("debugLogging");
        if (debugConfiguration.user && debugConfiguration.password) {
            return debugConfiguration;
        } else {
            const launchConfig = new LaunchConfig(debugConfiguration as unknown as LaunchRequestArguments);
            if (await launchConfig.checkCredentials()) {
                return debugConfiguration;
            }
        }
        throw new Error("Invalid user ID / password");
    }

    async localResolveDebugConfiguration(doc: vscode.TextDocument, debugConfiguration: LaunchRequestArguments): Promise<LaunchRequestArguments> {
        const eclConfig = vscode.workspace.getConfiguration("ecl");
        const folder = vscode.workspace.getWorkspaceFolder(doc.uri);
        const configPrefix = "${config:ecl.";
        return this.resolveDebugConfiguration(folder, debugConfiguration as unknown as vscode.DebugConfiguration).then(debugConfiguration => {
            for (const key in debugConfiguration) {
                let value: any = debugConfiguration[key];
                switch (value) {
                    case "${workspaceRoot}":
                        debugConfiguration[key] = folder.uri.fsPath;
                        break;
                    case "${file}":
                        debugConfiguration[key] = doc.fileName;
                        break;
                    default:
                        if (typeof value === "string" && value.indexOf(configPrefix) === 0) {
                            const configKey = value.substring(configPrefix.length, value.length - 1);
                            debugConfiguration[key] = eclConfig.get(configKey);
                        }
                }
                value = debugConfiguration[key];
                if (Array.isArray(value)) {
                    debugConfiguration[key] = value.join(",");
                }
            }
            return debugConfiguration as unknown as LaunchRequestArguments;
        });
    }
}
