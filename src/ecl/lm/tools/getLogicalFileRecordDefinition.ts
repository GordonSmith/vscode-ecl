import * as vscode from "vscode";
import { isPlatformConnected } from "../../../hpccplatform/session";
import { reporter } from "../../../telemetry";
import localize from "../../../util/localize";
import { logToolEvent, requireConnectedSession, throwIfCancellationRequested } from "../utils";

export interface IGetLogicalFileRecordDefinitionParameters {
    logicalFile: string;
}

export class GetLogicalFileRecordDefinitionTool implements vscode.LanguageModelTool<IGetLogicalFileRecordDefinitionParameters> {
    async invoke(options: vscode.LanguageModelToolInvocationOptions<IGetLogicalFileRecordDefinitionParameters>, token: vscode.CancellationToken) {
        reporter?.sendTelemetryEvent("lmTool.invoke", { tool: "getLogicalFileRecordDefinition" });
        const logicalFile = typeof options.input.logicalFile === "string" ? options.input.logicalFile.trim() : "";
        if (logicalFile.length === 0) {
            throw new vscode.LanguageModelError(localize("Logical file name is required"), { cause: "invalid_parameters" });
        }

        logToolEvent("getLogicalFileRecordDefinition", "invoke start", { logicalFile });

        const session = requireConnectedSession();

        try {
            throwIfCancellationRequested(token);

            const recordDefinition = await session.fetchRecordDef(logicalFile);

            throwIfCancellationRequested(token);

            const parts: vscode.LanguageModelTextPart[] = [];
            parts.push(new vscode.LanguageModelTextPart(localize("Record definition for logical file {0}:", logicalFile)));

            if (recordDefinition && recordDefinition.trim().length > 0) {
                parts.push(new vscode.LanguageModelTextPart("```ecl\n" + recordDefinition + "\n```"));
            } else {
                parts.push(new vscode.LanguageModelTextPart(localize("No record definition was returned for this logical file.")));
            }

            logToolEvent("getLogicalFileRecordDefinition", "invoke success", {
                logicalFile,
                hasRecordDefinition: !!recordDefinition,
            });

            return new vscode.LanguageModelToolResult(parts);
        } catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            logToolEvent("getLogicalFileRecordDefinition", "invoke failed", { logicalFile, error: message });
            throw new vscode.LanguageModelError(localize("Failed to fetch logical file record definition: {0}", message), { cause: error });
        }
    }

    async prepareInvocation(options: vscode.LanguageModelToolInvocationPrepareOptions<IGetLogicalFileRecordDefinitionParameters>, _token: vscode.CancellationToken) {
        const connected = isPlatformConnected();
        const logicalFile = typeof options.input.logicalFile === "string" ? options.input.logicalFile.trim() : "";

        return {
            invocationMessage: connected
                ? localize("Fetching record definition for {0}", logicalFile || localize("(unspecified logical file)"))
                : localize("Cannot fetch record definition: HPCC Platform not connected"),
            confirmationMessages: connected ? undefined : {
                title: localize("HPCC Platform not connected"),
                message: new vscode.MarkdownString(localize("This tool requires an active HPCC connection.")),
            }
        };
    }
}