import * as vscode from "vscode";
import { LaunchConfig } from "../debugger/launchConfig";
import { checkTextDocument, checkWorkspace } from "./check";
import { selectCTVersion } from "./clientTools";
import { eclDiagnostic } from "./diagnostic";
import { session } from "./session";
import { eclWatchPanelView } from "./eclWatchPanelView";

export let eclCommands: ECLCommands;
export class ECLCommands {
    _ctx: vscode.ExtensionContext;

    private constructor(ctx: vscode.ExtensionContext) {
        this._ctx = ctx;
        ctx.subscriptions.push(vscode.commands.registerCommand("ecl.checkSubmit", this.submit));
        ctx.subscriptions.push(vscode.commands.registerCommand("ecl.checkSyntax", this.checkSyntax));
        ctx.subscriptions.push(vscode.commands.registerCommand("ecl.checkSyntaxAll", this.checkSyntaxAll));
        ctx.subscriptions.push(vscode.commands.registerCommand("ecl.checkSyntaxClear", this.checkSyntaxClear));
        ctx.subscriptions.push(vscode.commands.registerCommand("ecl.showLanguageReference", this.showLanguageReference));
        ctx.subscriptions.push(vscode.commands.registerTextEditorCommand("ecl.searchTerm", this.searchTerm));
        ctx.subscriptions.push(vscode.commands.registerCommand("ecl.openECLWatch", this.openECLWatch));
        ctx.subscriptions.push(vscode.commands.registerCommand("ecl.selectCTVersion", selectCTVersion));
    }

    static attach(ctx: vscode.ExtensionContext): ECLCommands {
        if (!eclCommands) {
            eclCommands = new ECLCommands(ctx);
        }
        return eclCommands;
    }

    submit() {
        if (vscode.window.activeTextEditor) {
            vscode.window.activeTextEditor.document.save();
            session.submit(vscode.window.activeTextEditor.document);
        }
    }

    checkSyntax() {
        if (vscode.window.activeTextEditor) {
            vscode.window.activeTextEditor.document.save();
            checkTextDocument(vscode.window.activeTextEditor.document, vscode.workspace.getConfiguration("ecl", vscode.window.activeTextEditor.document.uri));
        }
    }

    checkSyntaxAll() {
        if (vscode.workspace.workspaceFolders) {
            for (const wsf of vscode.workspace.workspaceFolders) {
                checkWorkspace(wsf);
            }
        }
    }

    checkSyntaxClear() {
        eclDiagnostic.clear();
    }

    showLanguageReference() {
        vscode.commands.executeCommand("vscode.open", vscode.Uri.parse("https://hpccsystems.com/training/documentation/ecl-language-reference/html"));
    }

    searchTerm(editor: vscode.TextEditor) {
        if (vscode.window.activeTextEditor) {
            const range = vscode.window.activeTextEditor.document.getWordRangeAtPosition(editor.selection.active);
            const searchTerm = editor.document.getText(range);
            vscode.commands.executeCommand("vscode.open", vscode.Uri.parse(`https://hpccsystems.com/training/documentation/ecl-language-reference/html/${searchTerm}.html`));
        }
    }

    openECLWatch(launchConfig: LaunchConfig, title: string, wuid: string, result?: number) {
        eclWatchPanelView.navigateTo(launchConfig, title, wuid, result);
    }
}
