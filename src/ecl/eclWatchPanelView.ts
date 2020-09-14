import * as vscode from "vscode";
import { hashSum } from "@hpcc-js/util";
import { espUrl, LaunchRequestArguments, wuDetailsUrl, wuResultUrl } from "../hpccplatform/launchConfig";
import { session } from "../hpccplatform/session";
import type { Messages } from "../eclwatch";

type NavigateParams = {
    launchRequestArgs: LaunchRequestArguments,
    title: string,
    wuid: string,
    result?: number,
    show: boolean
};
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
    }

    static attach(ctx: vscode.ExtensionContext): ECLWatchPanelView {
        if (!eclWatchPanelView) {
            eclWatchPanelView = new ECLWatchPanelView(ctx);
        }
        return eclWatchPanelView;
    }

    private _currParams: NavigateParams;
    private _resolveParams: NavigateParams;
    public resolveWebviewView(webviewView: vscode.WebviewView, context: vscode.WebviewViewResolveContext, _token: vscode.CancellationToken) {
        this._webviewView = webviewView;

        session.onDidChangeSession(launchRequestArgs => {
            this.navigateTo(launchRequestArgs, "", "", 0, false);
        });

        session.onDidCreateWorkunit(wu => {
            this.navigateTo(session.launchRequestArgs, wu.Wuid, wu.Wuid);
        });

        vscode.commands.registerCommand("ecl.watch.lite.openECLWatchExternal", async () => {
            if (this._currParams) {
                if (this._currParams.result === undefined) {
                    vscode.env.openExternal(vscode.Uri.parse(wuDetailsUrl(this._currParams.launchRequestArgs, this._currParams.wuid)));
                } else {
                    vscode.env.openExternal(vscode.Uri.parse(wuResultUrl(this._currParams.launchRequestArgs, this._currParams.wuid, this._currParams.result)));
                }
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
                    if (this._resolveParams) {
                        this.navigateTo(this._resolveParams.launchRequestArgs, this._resolveParams.title, this._resolveParams.wuid, this._resolveParams.result, this._resolveParams.show);
                    }
                    break;
            }
        });

        this._webviewView.webview.html = this._getHtmlForWebview(webviewView.webview);
    }

    private _prevHash: string;
    navigateTo(launchRequestArgs: LaunchRequestArguments, title: string, wuid: string, result?: number, show = true) {
        this._currParams = { launchRequestArgs, title, wuid, result, show };
        if (this._webviewView) {
            const hash = hashSum(this._currParams);
            if (this._prevHash !== hash) {
                this._prevHash = hash;
                this._webviewView.title = title;
                this._webviewView.webview.postMessage({ command: "navigate", data: this._currParams });
                if (show) {
                    this._webviewView.show(true);
                }
            }
        } else {
            this._resolveParams = this._currParams;
            if (show) {
                this._webviewView.show(true);
            }
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