import * as vscode from "vscode";

// Input contract for the tool
interface GetOpenEclFilesParams {
    /** If true, only include unsaved (dirty) files */
    onlyDirty?: boolean;
}

/**
 * Language Model Tool that returns a list of currently open ECL files.
 * Matches the contributes.languageModelTools entry with name: "ecl_get_open_ecl_files".
 */
class GetOpenEclFilesTool implements vscode.LanguageModelTool<GetOpenEclFilesParams> {
    async prepareInvocation(
        options: vscode.LanguageModelToolInvocationPrepareOptions<GetOpenEclFilesParams>,
        _token: vscode.CancellationToken
    ): Promise<vscode.PreparedToolInvocation | undefined> {
        const onlyDirty = options.input?.onlyDirty ?? false;
        const msg = new vscode.MarkdownString();
        msg.appendMarkdown(`List ${onlyDirty ? "unsaved " : ""}open ECL files in the editor.`);
        return {
            invocationMessage: `Listing ${onlyDirty ? "unsaved " : ""}open ECL files`,
            confirmationMessages: {
                title: "Get open ECL files",
                message: msg
            }
        };
    }

    async invoke(
        options: vscode.LanguageModelToolInvocationOptions<GetOpenEclFilesParams>,
        _token: vscode.CancellationToken
    ): Promise<vscode.LanguageModelToolResult> {
        const onlyDirty = options.input?.onlyDirty ?? false;

        // Collect open text documents that are ECL
        const docs = vscode.workspace.textDocuments.filter(d => d.languageId === "ecl");
        const items = docs
            .filter(d => (onlyDirty ? d.isDirty : true))
            .map(d => ({
                file_name: d.fileName.split(/[/\\]/).pop() ?? d.fileName,
                file_path: d.uri.fsPath,
                is_dirty: d.isDirty
            }));

        const summary = items.length === 0
            ? "No matching open ECL files found."
            : `Found ${items.length} open ECL file${items.length === 1 ? "" : "s"}.`;

        // Return a summary and include a JSON payload in a PromptTsx part for richer rendering
        return new vscode.LanguageModelToolResult([
            new vscode.LanguageModelTextPart(summary),
            new vscode.LanguageModelPromptTsxPart({ items })
        ]);
    }
}

export function registerLanguageModelTools(context: vscode.ExtensionContext) {
    context.subscriptions.push(vscode.lm.registerTool("ecl_get_open_ecl_files", new GetOpenEclFilesTool())
    );
}
