import * as vscode from "vscode";

let saltDiagnosticCollection: vscode.DiagnosticCollection;
let saltQuickDiagnosticCollection: vscode.DiagnosticCollection;

export let diagnostic: Diagnostic;
export class Diagnostic {
    _ctx: vscode.ExtensionContext;

    private constructor(ctx: vscode.ExtensionContext) {
        this._ctx = ctx;
        saltDiagnosticCollection = vscode.languages.createDiagnosticCollection("salt");
        ctx.subscriptions.push(saltDiagnosticCollection);
        saltQuickDiagnosticCollection = vscode.languages.createDiagnosticCollection("saltQuick");
        ctx.subscriptions.push(saltQuickDiagnosticCollection);
    }

    static attach(ctx: vscode.ExtensionContext): Diagnostic {
        if (!diagnostic) {
            diagnostic = new Diagnostic(ctx);
        }
        return diagnostic;
    }

    set(uri: vscode.Uri, diagnostics: vscode.Diagnostic[]) {
        saltDiagnosticCollection.set(uri, diagnostics);
    }

    setQuick(uri: vscode.Uri, diagnostics: vscode.Diagnostic[]) {
        saltQuickDiagnosticCollection.set(uri, diagnostics);
    }
}
