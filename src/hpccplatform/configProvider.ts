import { scopedLogger } from "@hpcc-js/util";
import * as vscode from "vscode";
import { LaunchRequestArguments, LaunchConfig } from "./launchConfig";

const logger = scopedLogger("eclConfigProvide.ts");

export interface Credentials {
    user: string;
    password: string;
}

export let eclConfigurationProvider: ECLConfigurationProvider;
export class ECLConfigurationProvider implements vscode.DebugConfigurationProvider {
    protected _ctx: vscode.ExtensionContext;
    protected _credentials: { [configName: string]: Credentials } = {};
    protected _currentConfig?: vscode.DebugConfiguration;

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

    credentials(launchConfigArgs: LaunchRequestArguments): Credentials {
        let retVal = this._credentials[launchConfigArgs.serverAddress];
        if (!retVal) {
            retVal = this._credentials[launchConfigArgs.serverAddress] = {
                user: launchConfigArgs.user,
                password: launchConfigArgs.password
            };
        }
        return retVal;
    }

    async verifyUser(launchConfigArgs: LaunchRequestArguments): Promise<boolean> {
        const launchConfig = new LaunchConfig(launchConfigArgs);
        const credentials = this.credentials(launchConfigArgs);
        try {
            await launchConfig.verifyUser(credentials.user, credentials.password);
            launchConfigArgs.user = credentials.user;
            launchConfigArgs.password = credentials.password;
            return true;
        } catch (e) {
            if (e.Exception && e.Exception.length) {
                for (const excpt of e.Exception) {
                    logger.warning(`${excpt.Code}:  ${excpt.Message}`);
                }
            }
            if (e.Exception && e.Exception.length !== undefined && !e.Exception.some(exp => exp.Code === 0)) {
                launchConfigArgs.user = credentials.user;
                launchConfigArgs.password = credentials.password;
                return true;
            }
            logger.info(`Verify User Failed (${launchConfigArgs.name}):  ${credentials.user}@${launchConfigArgs.serverAddress}:${launchConfigArgs.port}`);
            return false;
        }
    }

    async promptUserID(launchConfigArgs: LaunchRequestArguments) {
        const credentials = this.credentials(launchConfigArgs);
        credentials.user = await vscode.window.showInputBox({
            prompt: `User ID (${launchConfigArgs.name})`,
            password: false,
            value: credentials.user
        }) || "";
    }

    async promptPassword(launchConfigArgs: LaunchRequestArguments): Promise<boolean> {
        const credentials = this.credentials(launchConfigArgs);
        credentials.password = await vscode.window.showInputBox({
            prompt: `Password (${launchConfigArgs.name})`,
            password: true,
            value: credentials.password
        }) || "";
        return false;
    }

    async checkCredentials(launchConfig: LaunchRequestArguments): Promise<boolean> {
        for (let i = 0; i < 3; ++i) {
            if (await this.verifyUser(launchConfig)) {
                return true;
            }
            await this.promptUserID(launchConfig);
            await this.promptPassword(launchConfig);
        }
        return false;
    }

    async resolveDebugConfiguration?(folder: vscode.WorkspaceFolder | undefined, debugConfiguration: vscode.DebugConfiguration, token?: vscode.CancellationToken): Promise<vscode.DebugConfiguration> {
        const eclConfig = vscode.workspace.getConfiguration("ecl");
        debugConfiguration.debugLogging = eclConfig.get<boolean>("debugLogging");
        this._currentConfig = debugConfiguration;
        if (debugConfiguration.user && debugConfiguration.password) {
            return debugConfiguration;
        } else if (await this.checkCredentials(debugConfiguration as unknown as LaunchRequestArguments)) {
            return debugConfiguration;
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
