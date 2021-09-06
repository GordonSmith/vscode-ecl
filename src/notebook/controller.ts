import * as vscode from "vscode";
import * as fs from "fs";
import * as path from "path";
import { ojsParse } from "@hpcc-js/observable-md";
import { hashSum } from "@hpcc-js/util";
import { sessionManager } from "../hpccplatform/session";

function encodeID(id: string) {
    return id.split(" ").join("_");
}

export class Controller {
    readonly controllerId = "ecl-notebook-controller-id";
    readonly notebookType = "ecl-notebook";
    readonly label = "ECL Notebook";
    readonly supportedLanguages = ["ecl", "ojs"];

    private readonly _controller: vscode.NotebookController;
    private _executionOrder = 0;

    constructor() {
        this._controller = vscode.notebooks.createNotebookController(
            this.controllerId,
            this.notebookType,
            this.label
        );

        this._controller.supportedLanguages = this.supportedLanguages;
        this._controller.supportsExecutionOrder = true;
        this._controller.executeHandler = this.execute.bind(this);
    }

    dispose() {
        this._controller.dispose();
    }

    private async executeECL(cell: vscode.NotebookCell, execution: vscode.NotebookCellExecution): Promise<void> {
        let tmpPath: string;
        try {
            const basename = path.basename(cell.document.uri.fsPath, ".eclnb");
            const dirname = path.dirname(cell.document.uri.fsPath);
            const code = cell.document.getText();
            const jobname = `${basename}-${hashSum(code.trim())}`;
            tmpPath = `${path.join(dirname, jobname)}.tmp`;
            fs.writeFileSync(tmpPath, cell.document.getText(), "utf8");
            const uri = vscode.Uri.file(tmpPath);
            const wu = await sessionManager.submit({ uri });
            fs.unlink(tmpPath, () => { });
            tmpPath = "";
            if (wu) {
                await wu.watchUntilComplete();
                const results = await wu.fetchResults();
                const outputs = {};
                await Promise.all(results.map(result => {
                    return result.fetchRows().then(rows => {
                        outputs[encodeID(result.Name)] = rows;
                    });
                }));
                execution.replaceOutput([
                    new vscode.NotebookCellOutput([
                        vscode.NotebookCellOutputItem.json(outputs),
                    ])
                ]);
            }
        } catch (e) {
            execution.replaceOutput([
                new vscode.NotebookCellOutput([
                    vscode.NotebookCellOutputItem.error(e)
                ])
            ]);
        } finally {
            if (tmpPath) {
                fs.unlink(tmpPath, () => { });
            }
        }
    }

    private async executeOJS(cell: vscode.NotebookCell, execution: vscode.NotebookCellExecution): Promise<void> {
        execution.replaceOutput([
            new vscode.NotebookCellOutput([
                vscode.NotebookCellOutputItem.json({ code: cell.document.getText() }, "hpcc.ecl-notebook/ojs")
            ])
        ]);
    }

    private async executeCell(cell: vscode.NotebookCell): Promise<void> {
        const execution = this._controller.createNotebookCellExecution(cell);
        execution.executionOrder = ++this._executionOrder;
        execution.start(Date.now());
        execution.replaceOutput([]);
        switch (cell.document.languageId) {
            case "ecl":
                await this.executeECL(cell, execution);
                break;
            case "ojs":
                await this.executeOJS(cell, execution);
                break;
        }
        execution.end(true, Date.now());
    }

    private execute(cells: vscode.NotebookCell[], _notebook: vscode.NotebookDocument, _controller: vscode.NotebookController): void {
        for (const cell of cells) {
            this.executeCell(cell);
        }
    }
}
