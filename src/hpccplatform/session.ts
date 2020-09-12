import { WUQuery, TargetCluster, Workunit, WUUpdate } from "@hpcc-js/comms";
import * as vscode from "vscode";
import { LaunchConfig, LaunchRequestArguments, espUrl, wuDetailsUrl, wuResultsUrl, action } from "./launchConfig";
import { eclConfigurationProvider } from "./configProvider";
import { eclCommands } from "../ecl/command";

class Session {
    private _launchRequestArgs?: LaunchRequestArguments;
    private _launchConfig?: LaunchConfig;
    private _targetCluster: string;

    private _onDidChangeSession: vscode.EventEmitter<LaunchRequestArguments> = new vscode.EventEmitter<LaunchRequestArguments>();
    readonly onDidChangeSession: vscode.Event<LaunchRequestArguments> = this._onDidChangeSession.event;

    private _onDidCreateWorkunit: vscode.EventEmitter<Workunit> = new vscode.EventEmitter<Workunit>();
    readonly onDidCreateWorkunit: vscode.Event<Workunit> = this._onDidCreateWorkunit.event;

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
            const launchRequestArgs = event.session.configuration as unknown as LaunchRequestArguments;
            switch (event.event) {
                case "LaunchRequest":
                    if (this.name !== event.session.name) {
                        this.switchTo(event.session.name, launchRequestArgs.targetCluster);
                    }
                    if (this._launchConfig) {
                        this._launchConfig.submit(launchRequestArgs.program, launchRequestArgs.targetCluster, launchRequestArgs.mode).then(wu => {
                            vscode.commands.executeCommand("ecl.openECLWatch", this.launchRequestArgs, wu.Wuid, wu.Wuid);
                        });
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
            vscode.env.openExternal(vscode.Uri.parse(`${espUrl(this._launchRequestArgs)}/esp/files/stub.htm`));
        });

        vscode.commands.registerCommand("ecl.submit", () => {
            this.submit(vscode.window.activeTextEditor.document);
        });

        vscode.commands.registerCommand("ecl.compile", () => {
            this.compile(vscode.window.activeTextEditor.document);
        });
        this.switchTo();
    }

    wuDetailsUrl(wuid: string) {
        return wuDetailsUrl(this._launchRequestArgs, wuid);
    }

    wuResultsUrl(wuid: string, sequence: number) {
        return wuResultsUrl(this._launchRequestArgs, wuid, sequence);
    }

    wuQuery(request: WUQuery.Request): Promise<Workunit[]> {
        if (this._launchConfig) {
            return this._launchConfig.wuQuery(request);
        }
        return Promise.resolve([]);
    }

    submit(doc: vscode.TextDocument) {
        if (this._launchConfig) {
            return this._launchConfig.submit(doc.uri.fsPath, this._targetCluster, "submit").then(wu => {
                this._onDidCreateWorkunit.fire(wu);
                return wu;
            });
        }
    }

    compile(doc: vscode.TextDocument) {
        if (this._launchConfig) {
            return this._launchConfig.submit(doc.uri.fsPath, this._targetCluster, "compile").then(wu => {
                this._onDidCreateWorkunit.fire(wu);
                return wu;
            });
        }
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

    switchTo(name?: string, targetCluster?: string) {
        if (!this._launchRequestArgs || this._launchRequestArgs.name !== name) {
            const configs: LaunchRequestArguments[] = this.configurations();
            this._launchRequestArgs = configs.filter(c => c.name === name)[0] || configs[0];
            this._launchConfig = this._launchRequestArgs ? new LaunchConfig(this._launchRequestArgs) : undefined;
            this.refreshStatusBar();
        }
        this._targetCluster = targetCluster || this._launchRequestArgs?.targetCluster || undefined;
        this.refreshTCStatusBar();
        if (this._launchRequestArgs) {
            this._onDidChangeSession.fire(this._launchRequestArgs);
        }
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
        this._statusBarTargetCluster.text = this._targetCluster;
        this._statusBarTargetCluster.tooltip = this._targetCluster;
        this._targetCluster ? this._statusBarTargetCluster.show() : this._statusBarTargetCluster.hide();
    }
}
export const session: Session = new Session();
