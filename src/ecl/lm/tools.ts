import * as vscode from "vscode";
import { FindWorkunitsTool } from "./tools/findWorkunits";
import { GetWorkunitErrorsTool } from "./tools/getWorkunitErrors";
import { GetWorkunitECLTool } from "./tools/getWorkunitECL";
import { GetWorkunitMetricsTool } from "./tools/getWorkunitMetrics";
import { FindLogicalFilesTool } from "./tools/findLogicalFiles";
import { SyntaxCheckTool } from "./tools/syntaxCheck";
import { ECLDocsLookupTool } from "./tools/eclDocsLookup";
import { GetTargetClustersTool } from "./tools/getTargetClusters";
import { GetLogicalFileRecordDefinitionTool } from "./tools/getLogicalFileRecordDefinition";
import { ListClientToolsTool } from "./tools/listClientTools";
import { ListECLBundlesTool } from "./tools/listECLBundles";
import { CreateECLArchiveTool } from "./tools/createECLArchive";

let eclLMTools: ECLLMTools;

export class ECLLMTools {

    protected constructor(ctx: vscode.ExtensionContext) {
        ctx.subscriptions.push(vscode.lm.registerTool("ecl-extension-findWorkunits", new FindWorkunitsTool()));
        ctx.subscriptions.push(vscode.lm.registerTool("ecl-extension-getWorkunitErrors", new GetWorkunitErrorsTool()));
        ctx.subscriptions.push(vscode.lm.registerTool("ecl-extension-getWorkunitECL", new GetWorkunitECLTool()));
        ctx.subscriptions.push(vscode.lm.registerTool("ecl-extension-getWorkunitMetrics", new GetWorkunitMetricsTool()));

        ctx.subscriptions.push(vscode.lm.registerTool("ecl-extension-findLogicalFiles", new FindLogicalFilesTool()));
        ctx.subscriptions.push(vscode.lm.registerTool("ecl-extension-getLogicalFileRecordDefinition", new GetLogicalFileRecordDefinitionTool()));
        ctx.subscriptions.push(vscode.lm.registerTool("ecl-extension-getTargetClusters", new GetTargetClustersTool()));
        ctx.subscriptions.push(vscode.lm.registerTool("ecl-extension-listClientTools", new ListClientToolsTool()));
        ctx.subscriptions.push(vscode.lm.registerTool("ecl-extension-listECLBundles", new ListECLBundlesTool()));
        ctx.subscriptions.push(vscode.lm.registerTool("ecl-extension-createECLArchive", new CreateECLArchiveTool()));
        ctx.subscriptions.push(vscode.lm.registerTool("ecl-extension-syntaxCheck", new SyntaxCheckTool()));
        ctx.subscriptions.push(vscode.lm.registerTool("ecl-extension-eclDocsLookup", new ECLDocsLookupTool(ctx)));
    }

    static attach(ctx: vscode.ExtensionContext): ECLLMTools {
        if (!eclLMTools) {
            eclLMTools = new ECLLMTools(ctx);
        }
        return eclLMTools;
    }
}
