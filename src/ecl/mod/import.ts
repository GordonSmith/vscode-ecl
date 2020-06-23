import * as vscode from "vscode";
import * as OS from "os";
import * as fs from "fs";
import * as path from "path";

const IMPORT_TAG = "//Import:";

interface ModAttr {
    mod: string;
    attr: string;
    content: string;
}

async function writeAttr(folder: string, { mod, attr, content }: ModAttr, legacy, state: { overwriteAll?: boolean }) {
    if (mod && attr && content) {
        const modFolder = path.join(folder, mod);
        if (!fs.existsSync(modFolder)) {
            fs.mkdirSync(modFolder)
        }
        const attrPath = path.join(modFolder, `${attr}.ecl`);
        if (!state.overwriteAll && fs.existsSync(attrPath)) {
            const response = await vscode.window.showWarningMessage(`File already exists "${attrPath}", overwrite?`, "Yes", "All", "Cancel");
            switch (response) {
                case "Yes":
                    break;
                case "All":
                    state.overwriteAll = true;
                    break;
                case "Cancel":
                default:
                    return;
            }
        }
        if (legacy) {
            content = `//#IMPORT(LEGACY)` + OS.EOL + content;
        }
        fs.writeFile(attrPath, content, "utf8", (err) => {
        });
    }
}

async function writeAttrs(folder: string, modAttrs: ModAttr[], legacy: boolean = false, progress?: vscode.Progress<{ message?: string; increment?: number }>) {
    const state = {};
    const increment = 100 / modAttrs.length;

    for (const modAttr of modAttrs) {
        if (progress) {
            progress.report({ message: `Importing ${modAttr.mod}.${modAttr.attr}`, increment });
        }
        await writeAttr(folder, modAttr, legacy, state);
    }
}

function parseMod(text: string): ModAttr[] {
    const retVal: ModAttr[] = [];
    text = text.split("\r\n").join("\n");
    const textParts = text.split("\n");
    let mod = "";
    let attr = "";
    let content: string[] = [];
    textParts.forEach(line => {
        if (line.indexOf(IMPORT_TAG) === 0) {
            const [m, a] = line.substring(IMPORT_TAG.length).split(".");
            if (mod && attr && content.length) {
                retVal.push({ mod, attr, content: content.join(OS.EOL) });
            }
            mod = m;
            attr = a;
            content = [];
        } else {
            content.push(line);
        }
    });
    if (mod && attr && content.length) {
        retVal.push({ mod, attr, content: content.join(OS.EOL) });
    }
    return retVal;
}

async function parseModFile(uri: vscode.Uri) {
    return vscode.workspace.openTextDocument(uri).then(document => {
        return parseMod(document.getText());
    });
}

export function importModString(folderPath: string, modStr: string) {
    let modAttrs: ModAttr[] = parseMod(modStr);
    return writeAttrs(folderPath, modAttrs);
}

export function importModFile(legacy = false) {
    vscode.window.withProgress({
        location: vscode.ProgressLocation.Notification,
        title: "Import MOD File",
        cancellable: false
    }, async (progress, token) => {
        token.onCancellationRequested(() => {
            console.log("User canceled the long running operation");
        });

        progress.report({ increment: 0 });

        let destination;
        if (vscode.workspace.workspaceFolders.length === 1) {
            destination = vscode.workspace.workspaceFolders[0];
        } else {
            destination = await vscode.window.showQuickPick(vscode.workspace.workspaceFolders.map(wf => wf.name), { placeHolder: "Target Workspace" });
            if (!destination) {
                return;
            }
        }

        return vscode.window.showOpenDialog({
            canSelectMany: true,
            openLabel: "Select *.mod file(s)",
            filters: {
                'MOD': ['mod']
            }
        }).then(async paths => {
            if (paths) {
                let modAttrs: ModAttr[] = [];
                for (const p of paths) {
                    modAttrs = [...modAttrs, ...await parseModFile(p)];
                }
                return writeAttrs(destination.uri.fsPath, modAttrs, legacy, progress);
            }
        });
    });
}
