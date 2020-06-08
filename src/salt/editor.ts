import * as vscode from "vscode";
import { Commands } from "./command";

let saltEditor: Editor;
export class Editor {
    _ctx: vscode.ExtensionContext;
    _commands: Commands;

    private constructor(ctx: vscode.ExtensionContext) {
        this._ctx = ctx;
        this._commands = Commands.attach(ctx);

        this.onOpenWatcher();
        this.onSaveWatcher();
    }

    static attach(ctx: vscode.ExtensionContext): Editor {
        if (!saltEditor) {
            saltEditor = new Editor(ctx);
        }
        return saltEditor;
    }

    onOpenWatcher() {
        vscode.workspace.onDidSaveTextDocument(doc => {
            if (doc.languageId !== "salt" || this._ignoreNextSave.has(doc)) {
                return;
            }

            const saltConfig = vscode.workspace.getConfiguration("salt", doc.uri);
            if (!!saltConfig["syntaxCheckOnLoad"]) {
                this._commands.checkSyntax(doc);
            }
        });
    }

    private _ignoreNextSave = new WeakSet<vscode.TextDocument>();
    onSaveWatcher() {
        vscode.workspace.onDidSaveTextDocument(doc => {
            if (doc.languageId !== "salt" || this._ignoreNextSave.has(doc)) {
                return;
            }
            if (vscode.window.activeTextEditor) {
                const saltConfig = vscode.workspace.getConfiguration("salt", doc.uri);
                const formatPromise: PromiseLike<void> = Promise.resolve();
                if (saltConfig.get<boolean>("generateOnSave")) {
                    formatPromise.then(() => {
                        this._commands.generate(doc);
                    });
                } else if (saltConfig.get<boolean>("syntaxCheckOnSave")) {
                    formatPromise.then(() => {
                        this._commands.checkSyntax(doc);
                    });
                }
            }
        }, null, this._ctx.subscriptions);
    }
}
