import * as vscode from "vscode";
import { FindWorkunitsTool } from "./tools/findWorkunits";
import { FindLogicalFilesTool } from "./tools/findLogicalFiles";
import { GetWorkunitDetailsTool } from "./tools/getWorkunitDetails";
import { SyntaxCheckTool } from "./tools/syntaxCheck";

let eclLMTools: ECLLMTools;

export class ECLLMTools {

    protected constructor(ctx: vscode.ExtensionContext) {
        ctx.subscriptions.push(vscode.lm.registerTool("ecl-extension-findWorkunits", new FindWorkunitsTool()));
        ctx.subscriptions.push(vscode.lm.registerTool("ecl-extension-findLogicalFiles", new FindLogicalFilesTool()));
        ctx.subscriptions.push(vscode.lm.registerTool("ecl-extension-getWorkunitDetails", new GetWorkunitDetailsTool()));
        ctx.subscriptions.push(vscode.lm.registerTool("ecl-extension-syntaxCheck", new SyntaxCheckTool()));
    }

    static attach(ctx: vscode.ExtensionContext): ECLLMTools {
        if (!eclLMTools) {
            eclLMTools = new ECLLMTools(ctx);
        }
        return eclLMTools;
    }
}
