import { hashSum } from "@hpcc-js/util";
import * as vscode from "vscode";
import type { Messages } from "../eclwatch";
import { LaunchConfig } from "./util";

type NavigateParams = { launchConfig: LaunchConfig, title: string, wuid: string, result?: number };
export let eclWatchPanelView: ECLWatchPanelView;
export class ECLWatchPanelView implements vscode.WebviewViewProvider {

    public static readonly viewType = "ecl.watch.lite";

    protected _ctx: vscode.ExtensionContext;
    private readonly _extensionUri: vscode.Uri
    private _webviewView?: vscode.WebviewView;

    private constructor(ctx: vscode.ExtensionContext) {
        this._ctx = ctx;
        this._extensionUri = this._ctx.extensionUri;

        ctx.subscriptions.push(vscode.window.registerWebviewViewProvider(ECLWatchPanelView.viewType, this, {
            webviewOptions: {
                retainContextWhenHidden: true
            }
        }));

        vscode.debug.onDidReceiveDebugSessionCustomEvent(event => {
            switch (event.event) {
                case "WUCreated":
                    const launchConfig = new LaunchConfig(event.body);
                    const url = launchConfig.wuDetailsUrl(event.body.wuid);
                    this.navigateTo(launchConfig, event.body.wuid, event.body.wuid);
                    break;
            }
        }, null, ctx.subscriptions);
    }

    static attach(ctx: vscode.ExtensionContext): ECLWatchPanelView {
        if (!eclWatchPanelView) {
            eclWatchPanelView = new ECLWatchPanelView(ctx);
        }
        return eclWatchPanelView;
    }

    private _prevParams: { launchConfig: LaunchConfig, title: string, wuid: string, result?: number };
    public resolveWebviewView(webviewView: vscode.WebviewView, context: vscode.WebviewViewResolveContext, _token: vscode.CancellationToken) {
        this._webviewView = webviewView;

        this._webviewView.onDidChangeVisibility(e => {
            if (!this._webviewView.visible) {
                this._webviewView.title = "";
            }
        });

        this._webviewView.webview.options = {
            enableScripts: true,
            enableCommandUris: true,
            localResourceRoots: [
                this._extensionUri
            ]
        };

        this._webviewView.webview.onDidReceiveMessage((message: Messages) => {
            switch (message.command) {
                case "loaded":
                    if (this._prevParams) {
                        this.navigateTo(this._prevParams.launchConfig, this._prevParams.title, this._prevParams.wuid, this._prevParams.result);
                    }
                    break;
            }
        });

        this._webviewView.webview.html = this._getHtmlForWebview(webviewView.webview);
    }

    private _prevHash: string;
    navigateTo(launchConfig: LaunchConfig, title: string, wuid: string, result?: number) {
        const params: NavigateParams = { launchConfig, title, wuid, result };
        if (this._webviewView) {
            const hash = hashSum(params);
            if (this._prevHash !== hash) {
                this._prevHash = hash;
                this._webviewView.title = title;
                this._webviewView.webview.postMessage({ command: "navigate", data: params });
                vscode.commands.executeCommand("ecl.watch.lite.focus");
            }
        } else {
            this._prevParams = params;
            vscode.commands.executeCommand("ecl.watch.lite.focus");
        }
    }

    private _getHtmlForWebview(webview: vscode.Webview) {
        // Get the local path to main script run in the webview, then convert it to a uri we can use in the webview.
        const scriptUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, "dist", "eclwatch.js"));

        // Use a nonce to only allow a specific script to be run.
        const nonce = getNonce();

        return `\
<!DOCTYPE html>
<html>

<head>
    <meta charset="utf-8">
    <title>HPCC</title>
    <style>
        body {
            padding:0px; 
            margin:0px; 
        }
       
        body.vscode-light {
        }
        
        body.vscode-dark {
        }
        
        body.vscode-high-contrast {
        }    

        #placeholder, .placeholder {
            position: absolute;
            left:4px;
            top:4px;
            right:4px;
            bottom:4px;
        }
    </style>
</head>

<body>
    <div id="placeholder"></div>
    <script nonce="${nonce}" src="${scriptUri}"></script>
</body>

</html>
`;
    }
}

function getNonce() {
    let text = "";
    const possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    for (let i = 0; i < 32; i++) {
        text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
}