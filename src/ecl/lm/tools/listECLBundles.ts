import * as vscode from "vscode";
import { reporter } from "../../../telemetry";
import localize from "../../../util/localize";
import { logToolEvent, requireConnectedSession, throwIfCancellationRequested } from "../utils";

export interface IListECLBundlesParameters { }

export class ListECLBundlesTool implements vscode.LanguageModelTool<IListECLBundlesParameters> {
    async invoke(_options: vscode.LanguageModelToolInvocationOptions<IListECLBundlesParameters>, token: vscode.CancellationToken) {
        reporter?.sendTelemetryEvent("lmTool.invoke", { tool: "listECLBundles" });
        logToolEvent("listECLBundles", "invoke start");

        const session = requireConnectedSession();

        try {
            throwIfCancellationRequested(token);

            const bundles = await session.bundleList();

            throwIfCancellationRequested(token);

            const parts: vscode.LanguageModelTextPart[] = [];

            if (bundles.length === 0) {
                parts.push(new vscode.LanguageModelTextPart(localize("No ECL bundles were returned by the client tools.")));
            } else {
                parts.push(new vscode.LanguageModelTextPart(localize("Found {0} ECL bundle(s).", bundles.length.toString())));
                parts.push(new vscode.LanguageModelTextPart(bundles.map(bundle => {
                    const version = bundle.props?.Version ? ` ${bundle.props.Version}` : "";
                    const installed = bundle.props ? localize("installed") : localize("available");
                    return `- ${bundle.name}${version} (${installed}) — ${bundle.description || bundle.url || localize("no description")}`;
                }).join("\n")));

                for (const bundle of bundles) {
                    parts.push(new vscode.LanguageModelTextPart(JSON.stringify(bundle, null, 2)));
                }
            }

            logToolEvent("listECLBundles", "invoke success", { bundleCount: bundles.length });

            return new vscode.LanguageModelToolResult(parts);
        } catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            logToolEvent("listECLBundles", "invoke failed", { error: message });
            throw new vscode.LanguageModelError(localize("Failed to list ECL bundles: {0}", message), { cause: error });
        }
    }

    async prepareInvocation(_options: vscode.LanguageModelToolInvocationPrepareOptions<IListECLBundlesParameters>, _token: vscode.CancellationToken) {
        return {
            invocationMessage: localize("Listing ECL bundles with client tools"),
        };
    }
}