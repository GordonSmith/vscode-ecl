import * as vscode from "vscode";
import { LaunchRequestArguments, LaunchConfig } from "../debugger/launchConfig";
import { WUQuery, TargetCluster } from "@hpcc-js/comms";
import { eclConfigurationProvider } from "./configProvider";
import { ECLWUNode, ECLResultNode } from "./eclWatchTree";

class Session {

    private _config: LaunchRequestArguments;
    private _launchConfig: LaunchConfig;
    private _targetClusters: TargetCluster[];
    private _targetCluster: TargetCluster;

    get launchConfig() {
        return this._launchConfig;
    }

    get name() {
        return this._config?.name;
    }

    get userID() {
        return this._config?.user;
    }

    _statusBarLaunch: vscode.StatusBarItem;
    _statusBarTargetCluster: vscode.StatusBarItem;

    constructor() {
        this._statusBarLaunch = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, Number.MIN_VALUE + 1);
        this._statusBarLaunch.command = {
            command: "hpccPlatform.switch",
            arguments: [],
            title: "Switch HPCC Platform."
        };
        this._statusBarTargetCluster = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, Number.MIN_VALUE);
        this._statusBarTargetCluster.command = {
            command: "hpccPlatform.switchTargetCluster",
            arguments: [],
            title: "Switch Target Cluster."
        };
        vscode.commands.registerCommand("hpccPlatform.switchTargetCluster", async () => {
            if (await this.switchTargetCluster()) {
            }
        });
        vscode.commands.registerCommand("hpccPlatform.eclwatch", async () => {
            if (this._launchConfig) {
                vscode.env.openExternal(vscode.Uri.parse(`${this._launchConfig.espUrl()}/esp/files/stub.htm`));
            }
        });
        vscode.commands.registerCommand("ecl.submit", () => {
            this.submit(vscode.window.activeTextEditor.document);
        });
        vscode.commands.registerCommand("ecl.openECLWatchExternal", (source) => {
            if (source instanceof ECLWUNode) {
                vscode.env.openExternal(vscode.Uri.parse(source.url));
            } else if (source instanceof ECLResultNode) {
                vscode.env.openExternal(vscode.Uri.parse(source.url));
            }
        });
    }

    wuDetailsUrl(wuid: string) {
        if (this._launchConfig) {
            return this._launchConfig.wuDetailsUrl(wuid);
        }
    }

    wuResultsUrl(wuid: string, sequence: number) {
        return `${this._launchConfig.espUrl()}/?Widget=ResultWidget&Wuid=${wuid}&Sequence=${sequence}`;
    }

    wuQuery(request: WUQuery.Request) {
        if (this._launchConfig) {
            return this._launchConfig.wuQuery(request);
        }
        throw new Error("Invlid Launch Configuration.");
    }

    submit(doc: vscode.TextDocument) {
        const wf = vscode.workspace.getWorkspaceFolder(doc.uri);
        const debugSession = {
            ...this._config,
            targetCluster: this._targetCluster.Name
        } as unknown as vscode.DebugConfiguration;
        vscode.debug.startDebugging(wf, debugSession);
    }

    configurations() {
        const retVal: LaunchRequestArguments[] = [];

        function gatherServers(uri?: vscode.Uri) {
            const eclLaunch = vscode.workspace.getConfiguration("launch", uri);
            if (eclLaunch.has("configurations")) {
                for (const launchConfig of eclLaunch.get<any[]>("configurations")!) {
                    if (launchConfig.type === "ecl" && launchConfig.name) {
                        retVal.push(launchConfig);
                    }
                }
            }
        }
        if (vscode.workspace.workspaceFolders) {
            for (const wuf of vscode.workspace.workspaceFolders) {
                gatherServers(wuf.uri);
            }
        } else {
            gatherServers();
        }
        return retVal;
    }

    async switchTo(name?: string, taregtCluster?: string) {
        if (!this._config || this._config.name !== name) {
            const configs: LaunchRequestArguments[] = session.configurations();
            this._config = configs.filter(c => c.name === name)[0] || configs[0];
            this._launchConfig = this._config ? new LaunchConfig(this._config) : undefined;
            if (this._config) {
                await eclConfigurationProvider.checkCredentials(this._config as any);
            }
            this.refreshStatusBar();
            this._targetClusters = this._launchConfig ? await this._launchConfig.targetClusters() : [];
        }
        this._targetCluster = this._targetClusters.filter(tc => tc.Name === taregtCluster)[0] || this._targetClusters.filter(tc => tc.IsDefault === true)[0] || this._targetClusters[0];
        this.refreshTCStatusBar();
    }

    switch(): Promise<boolean> {
        return new Promise((resolve, reject) => {
            const configs: LaunchRequestArguments[] = this.configurations();

            const input = vscode.window.createQuickPick();
            input.items = configs.map(config => {
                return {
                    label: config.name
                };
            });

            input.onDidChangeSelection(items => {
                const item = items[0];
                if (item) {
                    this.switchTo(item.label);
                    resolve(true);
                } else {
                    resolve(false);
                }
                input.hide();
            });
            input.show();
        });
    }

    switchTargetCluster(): Promise<boolean> {
        return new Promise((resolve, reject) => {
            if (this._launchConfig) {
                this._launchConfig.targetClusters().then(targetClusters => {
                    const input = vscode.window.createQuickPick();
                    input.items = targetClusters.map(tc => {
                        return {
                            label: tc.Name
                        };
                    });

                    input.onDidChangeSelection(items => {
                        const item = items[0];
                        if (item) {
                            this.switchTo(this._config.name, item.label);
                            resolve(true);
                        } else {
                            resolve(false);
                        }
                        input.hide();
                    });
                    input.show();
                });
            }
        });
    }

    refreshStatusBar() {
        this._statusBarLaunch.text = this._config?.name;
        this._statusBarLaunch.tooltip = this._config?.serverAddress;
        this._config ? this._statusBarLaunch.show() : this._statusBarLaunch.hide();
    }

    refreshTCStatusBar() {
        this._statusBarTargetCluster.text = this._targetCluster?.Name;
        this._statusBarTargetCluster.tooltip = this._targetCluster?.Type;
        this._targetCluster ? this._statusBarTargetCluster.show() : this._statusBarTargetCluster.hide();
    }
}

export const session = new Session();