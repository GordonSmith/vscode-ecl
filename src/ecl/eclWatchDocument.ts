import * as vscode from "vscode";

export class ECLWatchEditorProvider implements vscode.CustomReadonlyEditorProvider {

    public static register(context: vscode.ExtensionContext): vscode.Disposable {

        // vscode.workspace.registerTextDocumentContentProvider("cowsay", new MyProvider());

        return vscode.window.registerCustomEditorProvider(
            "cowsay",
            new ECLWatchEditorProvider(context),
            {
                webviewOptions: {
                    retainContextWhenHidden: true,
                },
                supportsMultipleEditorsPerDocument: false,
            });
    }

    constructor(private readonly _context: vscode.ExtensionContext) {
    }

    openCustomDocument(uri: vscode.Uri, openContext: vscode.CustomDocumentOpenContext, token: vscode.CancellationToken): vscode.CustomDocument | Thenable<vscode.CustomDocument> {
        throw new Error("XXXMethod not implemented.");
    }

    resolveCustomEditor(document: vscode.CustomDocument, webviewPanel: vscode.WebviewPanel, token: vscode.CancellationToken): void | Thenable<void> {
        throw new Error("YYYMethod not implemented.");
    }
}