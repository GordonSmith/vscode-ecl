import * as vscode from "vscode";
import { LaunchRequestArguments, LaunchConfig } from "./launchConfig";
import { WUQuery, TargetCluster, Workunit } from "@hpcc-js/comms";
import { eclConfigurationProvider } from "./configProvider";
import { submit } from "./workunit";
import { eclCommands } from "../ecl/command";

class Session {

    private _launchRequestArgs: LaunchRequestArguments;
    private _launchConfig: LaunchConfig;
    private _targetClusters: TargetCluster[] = [];
    private _targetCluster: TargetCluster;

    private _onDidChangeSession: vscode.EventEmitter<LaunchRequestArguments> = new vscode.EventEmitter<LaunchRequestArguments>();
    readonly onDidChangeSession: vscode.Event<LaunchRequestArguments> = this._onDidChangeSession.event;

    get name() {
        return this._launchRequestArgs?.name;
    }

    get launchRequestArgs() {
        return this._launchRequestArgs;
    }

    get userID() {
        return this._launchRequestArgs?.user;
    }

    private _statusBarLaunch: vscode.StatusBarItem;
    private _statusBarTargetCluster: vscode.StatusBarItem;

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

        vscode.debug.onDidReceiveDebugSessionCustomEvent(async event => {
            switch (event.event) {
                case "LaunchRequest":
                    if (session.name !== event.session.name) {
                        session.switchTo(event.session.name, event.session.configuration.targetCluster);
                    }
                    submit(event.session.configuration as unknown as LaunchRequestArguments).then(wu => {
                        vscode.commands.executeCommand("ecl.openECLWatch", session.launchRequestArgs, wu.Wuid, wu.Wuid);
                    });
                    break;
                case "WUCreated":
                    if (session.name !== event.session.name) {
                        session.switchTo(event.session.name, event.session.configuration.targetCluster);
                    }
                    break;
            }
        });

        vscode.commands.registerCommand("hpccPlatform.switch", async () => {
            this.switch();
        });
        vscode.commands.registerCommand("hpccPlatform.switchTargetCluster", async () => {
            this.switchTargetCluster();
        });
        vscode.commands.registerCommand("hpccPlatform.eclwatch", async () => {
            if (this._launchConfig) {
                vscode.env.openExternal(vscode.Uri.parse(`${this._launchConfig.espUrl()}/esp/files/stub.htm`));
            }
        });
        vscode.commands.registerCommand("ecl.submit", () => {
            this.submit(vscode.window.activeTextEditor.document);
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

    wuQuery(request: WUQuery.Request): Promise<Workunit[]> {
        if (this._launchConfig) {
            return this._launchConfig.wuQuery(request);
        }
        return Promise.resolve([]);
    }

    submit(doc: vscode.TextDocument) {
        const eclConfig = vscode.workspace.getConfiguration("ecl");
        const wf = vscode.workspace.getWorkspaceFolder(doc.uri);

        const debugSession: LaunchRequestArguments = {
            ...this._launchRequestArgs,
            targetCluster: this._targetCluster.Name
        };
        eclConfigurationProvider.localResolveDebugConfiguration(doc, debugSession).then(debugSession => {
            submit(debugSession).then(wu => {
                if (wu) {
                    eclCommands.openECLWatch(debugSession, wu.Wuid, wu.Wuid);
                }
            });
        });
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

    async switchTo(name?: string, targetCluster?: string) {
        let retVal = false;
        if (!this._launchRequestArgs || this._launchRequestArgs.name !== name) {
            const configs: LaunchRequestArguments[] = session.configurations();
            const launchConfigArgs = configs.filter(c => c.name === name)[0] || configs[0];
            if (launchConfigArgs) {
                retVal = await eclConfigurationProvider.checkCredentials(launchConfigArgs);
            }
            if (retVal) {
                this._launchRequestArgs = launchConfigArgs;
                this._launchConfig = this._launchRequestArgs ? new LaunchConfig(this._launchRequestArgs) : undefined;
                this.refreshStatusBar();
                this._targetClusters = this._launchConfig ? await this._launchConfig.targetClusters() : [];
            }
        } else {
            retVal = true;
        }
        if (targetCluster) {
            this._targetCluster = this._targetClusters.filter(tc => tc.Name === targetCluster)[0] || this._targetClusters.filter(tc => tc.IsDefault === true)[0] || this._targetClusters[0];
        } else {
            this._targetCluster = this._targetClusters.filter(tc => tc.Name === this._launchRequestArgs.targetCluster)[0] || this._targetClusters.filter(tc => tc.IsDefault === true)[0] || this._targetClusters[0];
        }
        this.refreshTCStatusBar();
        if (retVal) {
            this._onDidChangeSession.fire(this._launchRequestArgs);
        }
        return retVal;
    }

    switch(): void {
        const configs: LaunchRequestArguments[] = this.configurations();

        const input = vscode.window.createQuickPick();
        input.items = configs.map(config => {
            return {
                label: config.name
            };
        });

        input.onDidChangeSelection(async items => {
            const item = items[0];
            if (item) {
                this.switchTo(item.label);
            }
            input.hide();
        });
        input.show();
    }

    switchTargetCluster(): void {
        if (this._launchConfig) {
            this._launchConfig.targetClusters().then(targetClusters => {
                const input = vscode.window.createQuickPick();
                input.items = targetClusters.map(tc => {
                    return {
                        label: tc.Name
                    };
                });

                input.onDidChangeSelection(async items => {
                    const item = items[0];
                    if (item) {
                        this.switchTo(this.name, item.label);
                    }
                    input.hide();
                });
                input.show();
            });
        }
    }

    refreshStatusBar() {
        this._statusBarLaunch.text = this._launchRequestArgs?.name;
        this._statusBarLaunch.tooltip = this._launchRequestArgs?.serverAddress;
        this._launchRequestArgs ? this._statusBarLaunch.show() : this._statusBarLaunch.hide();
    }

    refreshTCStatusBar() {
        this._statusBarTargetCluster.text = this._targetCluster?.Name;
        this._statusBarTargetCluster.tooltip = this._targetCluster?.Type;
        this._targetCluster ? this._statusBarTargetCluster.show() : this._statusBarTargetCluster.hide();
    }
}
export const session: Session = new Session();
