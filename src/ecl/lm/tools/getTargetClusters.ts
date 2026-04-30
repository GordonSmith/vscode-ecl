import * as vscode from "vscode";
import { isPlatformConnected } from "../../../hpccplatform/session";
import { reporter } from "../../../telemetry";
import localize from "../../../util/localize";
import { logToolEvent, requireConnectedSession, throwIfCancellationRequested } from "../utils";

export interface IGetTargetClustersParameters { }

export class GetTargetClustersTool implements vscode.LanguageModelTool<IGetTargetClustersParameters> {
    async invoke(_options: vscode.LanguageModelToolInvocationOptions<IGetTargetClustersParameters>, token: vscode.CancellationToken) {
        reporter?.sendTelemetryEvent("lmTool.invoke", { tool: "getTargetClusters" });
        logToolEvent("getTargetClusters", "invoke start");

        const session = requireConnectedSession();

        try {
            throwIfCancellationRequested(token);

            const clusters = await session.targetClusters();

            throwIfCancellationRequested(token);

            const parts: vscode.LanguageModelTextPart[] = [];
            const currentTarget = session.targetCluster;

            if (clusters.length === 0) {
                parts.push(new vscode.LanguageModelTextPart(localize("No target clusters were returned by the connected HPCC Platform.")));
            } else {
                parts.push(new vscode.LanguageModelTextPart(localize("Found {0} target cluster(s). Current target: {1}", clusters.length.toString(), currentTarget || localize("auto detect"))));
                parts.push(new vscode.LanguageModelTextPart(clusters.map(cluster => `- ${cluster.Name}`).join("\n")));

                for (const cluster of clusters) {
                    parts.push(new vscode.LanguageModelTextPart(JSON.stringify(cluster, null, 2)));
                }
            }

            logToolEvent("getTargetClusters", "invoke success", {
                clusterCount: clusters.length,
                currentTarget,
            });

            return new vscode.LanguageModelToolResult(parts);
        } catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            logToolEvent("getTargetClusters", "invoke failed", { error: message });
            throw new vscode.LanguageModelError(localize("Failed to fetch target clusters: {0}", message), { cause: error });
        }
    }

    async prepareInvocation(_options: vscode.LanguageModelToolInvocationPrepareOptions<IGetTargetClustersParameters>, _token: vscode.CancellationToken) {
        const connected = isPlatformConnected();

        return {
            invocationMessage: connected
                ? localize("Fetching HPCC target clusters")
                : localize("Cannot fetch target clusters: HPCC Platform not connected"),
            confirmationMessages: connected ? undefined : {
                title: localize("HPCC Platform not connected"),
                message: new vscode.MarkdownString(localize("This tool requires an active HPCC connection.")),
            }
        };
    }
}