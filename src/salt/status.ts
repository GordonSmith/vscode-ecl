import { ExtensionContext, languages, StatusBarAlignment, StatusBarItem, window } from "vscode";
import { SALT_MODE } from "../mode";

export let saltStatusBar: StatusBar;
export class StatusBar {
    _ctx: ExtensionContext;
    _statusBarEntry: StatusBarItem;

    private constructor(ctx: ExtensionContext) {
        this._ctx = ctx;

        this._statusBarEntry = window.createStatusBarItem(StatusBarAlignment.Left, Number.MIN_VALUE);
        this._statusBarEntry.command = "salt.selectCTVersion";

        this.onActiveWatcher();
    }

    static attach(ctx: ExtensionContext): StatusBar {
        if (!saltStatusBar) {
            saltStatusBar = new StatusBar(ctx);
        }
        return saltStatusBar;
    }

    onActiveWatcher() {
        window.onDidChangeActiveTextEditor(event => {
            if (event && window.activeTextEditor) {
                if (!this._statusBarEntry) {
                    return;
                }
                if (!window.activeTextEditor) {
                    this._statusBarEntry.hide();
                } else if (languages.match(SALT_MODE, window.activeTextEditor.document)) {
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

    showSaltStatus(message: string, tooltip?: string) {
        this._statusBarEntry.text = message;
        this._statusBarEntry.tooltip = tooltip;
        this._statusBarEntry.show();
    }
}
