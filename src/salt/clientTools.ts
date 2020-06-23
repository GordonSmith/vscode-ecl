import { ClientTools, Errors, Version } from "@hpcc-js/comms";
import { scopedLogger } from "@hpcc-js/util";
import { QuickPickItem, Uri, window, workspace } from "vscode";
import { saltStatusBar } from "./status";
import * as cp from "child_process";
import * as path from "path";
import * as os from "os";
import * as fs from "fs";
import * as AdmZip from "adm-zip";
import { importModString } from '../ecl/mod/import';

const logger = scopedLogger("salt/clientTools.ts");

class SaltccErrors extends Errors {

    constructor(infilePath: string, stdErr: string, checked: string[]) {
        super(checked);
        if (stdErr && stdErr.length) {
            for (const errLine of stdErr.split(os.EOL)) {
                // Windows Only  ---
                logger.debug("errLine:  " + errLine);
                let match = /((?:[a-zA-Z]:)?(?:\\[a-z  A-Z0-9_.-]+)+\.[a-zA-Z0-9]+):(\d+),(\d+):(.*) ([A-Z]\d+) - (.*)$/.exec(errLine);
                if (match) {
                    const [, filePath, row, _col, severity, code, _msg] = match;
                    const line: number = +row;
                    const col: number = +_col;
                    const msg = code + ":  " + _msg;
                    this.errWarn.push({ filePath, line, col, msg, severity });
                    continue;
                }
                match = /(error|warning|info): (.*)/i.exec(errLine);
                if (match) {
                    const [, severity, msg] = match;
                    this.errWarn.push({ filePath: "", line: 0, col: 0, msg, severity });
                    continue;
                }
                match = /\d error(s?), \d warning(s?)/.exec(errLine);
                if (match) {
                    continue;
                }
                logger.warning(`parseSaltErrors:  Unable to parse "${errLine}"`);
                this.errWarn.push({ filePath: infilePath, line: 0, col: 0, msg: errLine, severity: "warning" });
                continue;
            }
        }
        this._checked = checked;
    }
}

export interface SaltResponse {
    stdout: string;
    errors: SaltccErrors;
}

class SALTClientTools extends ClientTools {

    readonly saltPath: string;

    constructor(path: string, cwd?: string, includeFolders?: string[], legacyMode?: boolean, args?: string[], version?: Version) {
        super(path, cwd, includeFolders, legacyMode, args, version);
        this.saltPath = path;
    }

    fileFolder(uri: Uri): string {
        const filePath = uri.fsPath;
        return path.dirname(filePath);
    }

    genFolder(uri: Uri): string {
        const filePath = uri.fsPath;
        const saltConfig = workspace.getConfiguration("salt");
        if (saltConfig.get<string>("generateLocation") === "Child Folder") {
            const ext = path.extname(filePath);
            const folder = path.basename(filePath, ext);
            return path.join(this.fileFolder(uri), folder);
        }
        return path.join(path.dirname(filePath));
    }

    workspaceFolder(uri: Uri): string {
        return workspace.getWorkspaceFolder(uri).uri.fsPath;
    }

    extractLibs(uri: Uri) {
        const zip = new AdmZip(path.join(this.binPath, "SALT.zip"));
        const workspaceFolder = this.workspaceFolder(uri);
        zip.extractAllTo(workspaceFolder);
    }

    _fullVersion: Version;
    version(): Promise<Version> {
        if (this._fullVersion) {
            return Promise.resolve(this._fullVersion);
        }
        return this.spawnJava("", ["-legacy -v"]).then(response => {
            this._fullVersion = new Version(response.stdout);
            return this._fullVersion;
        });
    }

    versionSync(): Version {
        return this._fullVersion;
    }

    checkSyntax(filePath: string, args?: string[]): Promise<SaltResponse> {
        const uri = Uri.file(filePath);
        const saltFolder = path.dirname(filePath);
        return this.spawnSalt2(workspace.getWorkspaceFolder(uri).uri.fsPath, uri.fsPath, this.args([
        ]));
    }

    generate(uri: Uri): Promise<SaltResponse> {
        // this.extractLibs(uri);
        const filePath = uri.fsPath;
        const workspaceFolder = workspace.getWorkspaceFolder(uri).uri.fsPath;
        return this.spawnSalt2(workspaceFolder, uri.fsPath, this.args([
            // "--pack", "dir",
            // "-o", outPath
        ])).then(response => {
            importModString(workspaceFolder, response.stdout);
            return response;
        });
    }

    private spawnSalt(cwd: string, inFolder: string, inFile: string, args: string[]): Promise<SaltResponse> {
        return this.spawnJava(cwd, ["-e", "inFolder", "-s", inFile, ...args], inFile);
    }

    private spawnSalt2(cwd: string, inFile: string, args: string[]): Promise<SaltResponse> {
        return this.spawnJava(cwd, ["-s", inFile, ...args], inFile);
    }

    private spawnJava(cwd: string, args: string[], inFile?: string): Promise<SaltResponse> {
        const saltConfig = workspace.getConfiguration("salt");
        const javaArgs = saltConfig.get<string[]>("javaArgs");
        return this.spawnProc("java", cwd, this.args([
            ...javaArgs,
            "-cp", path.join(this.binPath, "SALT.jar"), "com.relx.rba.tardis.salt.apps.SaltECL",
            ...args
        ]), "salt", `Cannot find ${this.saltPath}`).then(response => {
            const checked: string[] = [];
            logger.info(response.stdout);
            return {
                stdout: response.stdout,
                errors: new SaltccErrors(inFile, response.stderr, checked)
            }
        });
    }

    private spawnProc(cmd: string, cwd: string, args: string[], _toolName: string, _notFoundError?: string): Promise<{ stdout: string, stderr: string }> {
        logger.info(`cd "${cwd}"`);
        logger.info(`${cmd} ${args.map(arg => `"${arg}"`).join(" ")}`);
        return new Promise<{ stdout: string, stderr: string }>((resolve, _reject) => {
            const child = cp.spawn(cmd, args, { cwd });
            let stdOut = "";
            let stdErr = "";
            child.stdout.on("data", (data) => {
                stdOut += data.toString();
            });
            child.stderr.on("data", (data) => {
                stdErr += data.toString();
            });
            child.on("error", e => {
                window.showErrorMessage(e.message);
            });
            child.on("close", (_code, _signal) => {
                resolve({
                    stdout: stdOut.trim(),
                    stderr: stdErr.trim()
                });
            });
        });
    }
}

function locateClientToolsInFolder(rootFolder: string, clientTools: SALTClientTools[]) {
    if (rootFolder) {
        const hpccSystemsFolder = path.join(rootFolder, "HPCCSystems");
        if (fs.existsSync(hpccSystemsFolder) && fs.statSync(hpccSystemsFolder).isDirectory()) {
            if (os.type() !== "Windows_NT") {
                const saltPath = path.join(hpccSystemsFolder, "SALT", "SALT.jar");
                if (fs.existsSync(saltPath)) {
                    clientTools.push(new SALTClientTools(saltPath));
                }
            }
            fs.readdirSync(hpccSystemsFolder).forEach((versionFolder) => {
                const saltPath = path.join(hpccSystemsFolder, versionFolder, "SALT", "SALT.jar");
                if (fs.existsSync(saltPath)) {
                    const name = path.basename(versionFolder);
                    const version = new Version(name);
                    if (version.exists()) {
                        clientTools.push(new SALTClientTools(saltPath, undefined, undefined, undefined, undefined, version));
                    }
                }
            });
        }
    }
}

let allClientToolsCache: Promise<SALTClientTools[]>;
function locateAllClientTools() {
    if (allClientToolsCache) return allClientToolsCache;
    const clientTools: SALTClientTools[] = [];
    switch (os.type()) {
        case "Windows_NT":
            const rootFolder86 = process.env["ProgramFiles(x86)"] || "";
            if (rootFolder86) {
                locateClientToolsInFolder(rootFolder86, clientTools);
            }
            const rootFolder = process.env["ProgramFiles"] || "";
            if (rootFolder) {
                locateClientToolsInFolder(rootFolder, clientTools);
            }
            if (!rootFolder86 && !rootFolder) {
                locateClientToolsInFolder("c:\\Program Files (x86)", clientTools);
            }
            break;
        case "Linux":
        case "Darwin":
            locateClientToolsInFolder("/opt", clientTools);
            break;
        default:
            break;
    }

    allClientToolsCache = Promise.all(clientTools.map(ct => ct.version())).then(() => {
        clientTools.sort((l: ClientTools, r: ClientTools) => {
            return r.versionSync().compare(l.versionSync());
        });
        return clientTools;
    });
    return allClientToolsCache;
}


function showSaltStatus(version: string, overriden: boolean, tooltip: string) {
    saltStatusBar.showSaltStatus(`${overriden ? "*" : ""}${version}`, tooltip);
}

export function locateClientTools(): Promise<SALTClientTools | undefined> {
    const saltConfig = workspace.getConfiguration("salt");
    const saltPath = saltConfig.get<string>("saltPath");
    if (saltPath) {
        return Promise.resolve(new SALTClientTools(saltPath));
    } else {
        return locateAllClientTools().then(clientToolsArr => {
            if (clientToolsArr.length > 0) {
                const clientTools = clientToolsArr[0];
                let saltPathOverriden = false;
                if (clientTools) {
                    if (clientTools.saltPath === saltPath) {
                        saltPathOverriden = true;
                    }
                    clientTools.version().then(version => {
                        showSaltStatus(`SALT_${version.major}.${version.minor}.${version.patch}`, saltPathOverriden, clientTools.saltPath);
                    });
                } else {
                    showSaltStatus("Unknown", false, "Unable to locate eclcc");
                }
                return clientTools;
            }
        });
    }
}

interface SelectQP extends QuickPickItem {
    saltPath?: string;
}

export function selectCTVersion() {
    const input = window.createQuickPick<SelectQP>();
    input.placeholder = "Select eclcc version";
    locateAllClientTools().then(clientTools => {
        input.items = [{ label: "Auto Detect", saltPath: undefined }, ...clientTools.map(ct => {
            const version = ct.versionSync();
            return {
                label: `SALT_${version.major}.${version.minor}.${version.patch}${version.postfix ? "-" + version.postfix : ""}`,
                saltPath: ct.saltPath
            };
        })];
        input.onDidChangeSelection(items => {
            const item = items[0];
            if (item) {
                const eclConfig = workspace.getConfiguration("salt");
                eclConfig.update("saltPath", item.saltPath);
                showSaltStatus(item.label, !!item.saltPath, !!item.saltPath ? item.saltPath : "");
            }
            input.hide();
        });
        input.show();
    });
}
