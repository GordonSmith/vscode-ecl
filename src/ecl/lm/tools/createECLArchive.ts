import * as vscode from "vscode";
import * as os from "os";
import { reporter } from "../../../telemetry";
import localize from "../../../util/localize";
import { logToolEvent, requireConnectedSession, throwIfCancellationRequested } from "../utils";

export interface ICreateECLArchiveParameters {
    ecl: string;
    includeArchive?: boolean;
}

export class CreateECLArchiveTool implements vscode.LanguageModelTool<ICreateECLArchiveParameters> {
    async invoke(options: vscode.LanguageModelToolInvocationOptions<ICreateECLArchiveParameters>, token: vscode.CancellationToken) {
        reporter?.sendTelemetryEvent("lmTool.invoke", { tool: "createECLArchive" });
        const ecl = typeof options.input.ecl === "string" ? options.input.ecl : "";
        const includeArchive = options.input.includeArchive === true;
        if (ecl.trim().length === 0) {
            throw new vscode.LanguageModelError(localize("ECL code is required"), { cause: "invalid_parameters" });
        }

        logToolEvent("createECLArchive", "invoke start", {
            inputLength: ecl.length,
            includeArchive,
        });

        const session = requireConnectedSession();
        const tmpUri = vscode.Uri.joinPath(vscode.Uri.file(os.tmpdir()), `ecl_archive_${Date.now()}.ecl`);

        try {
            await vscode.workspace.fs.writeFile(tmpUri, new TextEncoder().encode(ecl));

            throwIfCancellationRequested(token);

            const clientTools = await session.locateClientTools();
            if (!clientTools) {
                throw new Error(localize("Unable to locate eclcc"));
            }

            const archive = await clientTools.createArchive(tmpUri.fsPath);

            throwIfCancellationRequested(token);

            const errors = archive.err?.all?.() ?? [];
            const hasErrors = archive.err?.hasError?.() ?? false;
            const content = archive.content ?? "";
            const parts: vscode.LanguageModelTextPart[] = [];

            parts.push(new vscode.LanguageModelTextPart(localize(
                "eclcc archive generation completed. Archive size: {0} characters. Issue count: {1}.",
                content.length.toString(),
                errors.length.toString()
            )));

            parts.push(new vscode.LanguageModelTextPart(JSON.stringify({
                eclccPath: clientTools.eclccPath,
                archiveSize: content.length,
                hasErrors,
                issueCount: errors.length,
                issues: errors,
            }, null, 2)));

            if (includeArchive) {
                parts.push(new vscode.LanguageModelTextPart("```xml\n" + content + "\n```"));
            } else if (content.length > 0) {
                const preview = content.length > 4000 ? content.slice(0, 4000) + "\n..." : content;
                parts.push(new vscode.LanguageModelTextPart(localize("Archive preview. Set includeArchive to true to return the full archive.")));
                parts.push(new vscode.LanguageModelTextPart("```xml\n" + preview + "\n```"));
            }

            logToolEvent("createECLArchive", "invoke success", {
                eclccPath: clientTools.eclccPath,
                archiveSize: content.length,
                issueCount: errors.length,
                hasErrors,
            });

            return new vscode.LanguageModelToolResult(parts);
        } catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            logToolEvent("createECLArchive", "invoke failed", { error: message });
            throw new vscode.LanguageModelError(localize("Failed to create ECL archive: {0}", message), { cause: error });
        } finally {
            try {
                await vscode.workspace.fs.delete(tmpUri);
            } catch {
                // ignore
            }
        }
    }

    async prepareInvocation(options: vscode.LanguageModelToolInvocationPrepareOptions<ICreateECLArchiveParameters>, _token: vscode.CancellationToken) {
        const eclPreview = options.input.ecl ? `\n\n${options.input.ecl.slice(0, 200)}${options.input.ecl.length > 200 ? "..." : ""}` : "";

        return {
            invocationMessage: localize("Creating ECL archive with eclcc"),
            confirmationMessages: {
                title: localize("Create ECL Archive"),
                message: new vscode.MarkdownString(localize("Run eclcc to create an ECL archive from the supplied code?") + eclPreview),
            },
        };
    }
}