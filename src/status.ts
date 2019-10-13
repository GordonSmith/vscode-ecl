import { debug, ExtensionContext, languages, StatusBarAlignment, StatusBarItem, window, workspace } from "vscode";
import { ECL_MODE } from "./ecl/mode";

// launch.json configuration
const config = workspace.getConfiguration("launch");

// retrieve values
const values = config.get("configurations");

console.log(values);

debug.onDidChangeActiveDebugSession(evt => {
    debugger;
});

workspace.onDidChangeConfiguration(evt => {
    debugger;
});

export let eclStatusBar: ECLStatusBar;
export class ECLStatusBar {
    _ctx: ExtensionContext;
    _statusBarEntry: StatusBarItem;

    private constructor(ctx: ExtensionContext) {
        this._ctx = ctx;

        this._statusBarEntry = window.createStatusBarItem(StatusBarAlignment.Left, Number.MIN_VALUE);
        this._statusBarEntry.command = "ecl.selectCTVersion";

        this.onActiveWatcher();
    }

    static attach(ctx: ExtensionContext): ECLStatusBar {
        if (!eclStatusBar) {
            eclStatusBar = new ECLStatusBar(ctx);
        }
        return eclStatusBar;
    }

    onActiveWatcher() {
        window.onDidChangeActiveTextEditor(event => {
            if (event && window.activeTextEditor) {
                if (!this._statusBarEntry) {
                    return;
                }
                if (!window.activeTextEditor) {
                    this._statusBarEntry.hide();
                } else if (languages.match(ECL_MODE, window.activeTextEditor.document)) {
                    this._statusBarEntry.show();
                } else {
                    this._statusBarEntry.hide();
                }
            }
        }, null, this._ctx.subscriptions);
    }

    hideEclStatus() {
        if (this._statusBarEntry) {
            this._statusBarEntry.dispose();
            delete this._statusBarEntry;
        }
    }

    showEclStatus(message: string, tooltip?: string) {
        this._statusBarEntry.text = message;
        this._statusBarEntry.tooltip = tooltip;
        this._statusBarEntry.show();
    }
}
