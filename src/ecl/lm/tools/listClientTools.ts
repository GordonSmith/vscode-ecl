import * as vscode from "vscode";
import { locateAllClientTools } from "../../../debugger/launchRequestArguments";
import { reporter } from "../../../telemetry";
import localize from "../../../util/localize";
import { logToolEvent, throwIfCancellationRequested } from "../utils";

export interface IListClientToolsParameters {
    includeInvalid?: boolean;
}

export class ListClientToolsTool implements vscode.LanguageModelTool<IListClientToolsParameters> {
    async invoke(options: vscode.LanguageModelToolInvocationOptions<IListClientToolsParameters>, token: vscode.CancellationToken) {
        reporter?.sendTelemetryEvent("lmTool.invoke", { tool: "listClientTools" });
        const includeInvalid = options.input.includeInvalid === true;

        logToolEvent("listClientTools", "invoke start", { includeInvalid });

        try {
            throwIfCancellationRequested(token);

            const clientTools = await locateAllClientTools(includeInvalid);

            throwIfCancellationRequested(token);

            const parts: vscode.LanguageModelTextPart[] = [];

            if (clientTools.length === 0) {
                parts.push(new vscode.LanguageModelTextPart(localize("No ECL client tools were found.")));
            } else {
                parts.push(new vscode.LanguageModelTextPart(localize("Found {0} ECL client tool installation(s).", clientTools.length.toString())));
                parts.push(new vscode.LanguageModelTextPart(clientTools.map(ct => {
                    const version = ct.versionSync();
                    const label = version.exists() ? version.toString() : localize("invalid eclcc");
                    return `- ${label}: ${ct.eclccPath}`;
                }).join("\n")));

                for (const ct of clientTools) {
                    const version = ct.versionSync();
                    parts.push(new vscode.LanguageModelTextPart(JSON.stringify({
                        version: version.exists() ? version.toString() : undefined,
                        valid: version.exists(),
                        eclccPath: ct.eclccPath,
                        binPath: ct.binPath,
                    }, null, 2)));
                }
            }

            logToolEvent("listClientTools", "invoke success", {
                includeInvalid,
                clientToolCount: clientTools.length,
            });

            return new vscode.LanguageModelToolResult(parts);
        } catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            logToolEvent("listClientTools", "invoke failed", { includeInvalid, error: message });
            throw new vscode.LanguageModelError(localize("Failed to list ECL client tools: {0}", message), { cause: error });
        }
    }

    async prepareInvocation(options: vscode.LanguageModelToolInvocationPrepareOptions<IListClientToolsParameters>, _token: vscode.CancellationToken) {
        return {
            invocationMessage: options.input.includeInvalid === true
                ? localize("Locating ECL client tools, including invalid installations")
                : localize("Locating ECL client tools"),
        };
    }
}