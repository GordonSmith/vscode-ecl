import * as vscode from "vscode";
import { SQL2Service } from "@hpcc-js/comms";
import { scopedLogger } from "@hpcc-js/util";
import { sessionManager } from "../hpccplatform/session";
import { eclWatchPanelView } from "../ecl/eclWatchPanelView";
import localize from "../util/localize";
import { sqlServiceOptions } from "./endpoint";
import { SQLRun, type SQLStatementInput } from "./executor";
import { splitStatements } from "./parse";
import { splitSQL } from "./split";
import type { SQLIssue, SQLRunState } from "./types";

const logger = scopedLogger("sql/main.ts");

const RUNNING_CONTEXT = "ecl.sql.running";

interface ActiveRun {
    run: SQLRun;
    uri: vscode.Uri;
    ranges: vscode.Range[];
    listener: { dispose: () => void };
}

export class SQLCommands {

    private readonly _diagnostics: vscode.DiagnosticCollection;
    private _active?: ActiveRun;

    private constructor(ctx: vscode.ExtensionContext) {
        this._diagnostics = vscode.languages.createDiagnosticCollection("hpcc-sql");
        ctx.subscriptions.push(
            this._diagnostics,
            vscode.commands.registerCommand("ecl.sql.submit", (uri?: vscode.Uri) => this.submit(uri)),
            vscode.commands.registerCommand("ecl.sql.cancel", () => this.cancel()),
            vscode.workspace.onDidCloseTextDocument(doc => this._diagnostics.delete(doc.uri)),
            vscode.workspace.onDidChangeTextDocument(e => {
                if (e.contentChanges.length && this._diagnostics.has(e.document.uri)) {
                    this._diagnostics.delete(e.document.uri);
                }
            }),
            { dispose: () => this.disposeActive() }
        );
        vscode.commands.executeCommand("setContext", RUNNING_CONTEXT, false);
    }

    static attach(ctx: vscode.ExtensionContext): SQLCommands {
        return new SQLCommands(ctx);
    }

    private async resolveEditor(uri?: vscode.Uri): Promise<vscode.TextEditor | undefined> {
        const active = vscode.window.activeTextEditor;
        if (!uri || active?.document.uri.toString() === uri.toString()) {
            return active;
        }
        const doc = await vscode.workspace.openTextDocument(uri);
        return vscode.window.showTextDocument(doc);
    }

    async submit(uri?: vscode.Uri): Promise<void> {
        const editor = await this.resolveEditor(uri);
        if (!editor) return;
        const doc = editor.document;

        const useSelection = !editor.selection.isEmpty;
        const baseOffset = useSelection ? doc.offsetAt(editor.selection.start) : 0;
        const text = useSelection ? doc.getText(editor.selection) : doc.getText();
        //  Cheap local pre-check, so we don't need to connect when there is nothing to submit
        if (splitStatements(text, baseOffset).length === 0) {
            vscode.window.showInformationMessage(localize("No SQL statements found"));
            return;
        }

        const session = sessionManager?.session;
        if (!session) {
            vscode.window.showErrorMessage(localize("No active HPCC Platform launch configuration"));
            return;
        }

        if (vscode.workspace.getConfiguration("ecl").get<boolean>("saveOnSubmit") && doc.isDirty && !doc.isUntitled) {
            await doc.save();
        }

        const credentials = await session.checkCredentials();
        if (!credentials) return;

        const service = new SQL2Service(sqlServiceOptions(session.launchRequestArgs, credentials.user, credentials.password));
        const split = await splitSQL(service, text, baseOffset);
        if (split.source === "local" && split.reason) {
            logger.debug(`SplitQuery not used, falling back to local SQL splitter:  ${split.reason}`);
        }
        const parsed = split.statements;
        if (parsed.length === 0) {
            vscode.window.showInformationMessage(localize("No SQL statements found"));
            return;
        }

        const statements: SQLStatementInput[] = parsed.map(stmt => {
            const pos = doc.positionAt(stmt.start);
            return { sql: stmt.sql, position: { line: pos.line, character: pos.character } };
        });
        const ranges = parsed.map(stmt => new vscode.Range(doc.positionAt(stmt.start), doc.positionAt(stmt.end)));

        const sqlConfig = vscode.workspace.getConfiguration("ecl.sql");
        const fileName = doc.isUntitled ? doc.uri.toString() : doc.uri.fsPath;
        const run = new SQLRun(service, statements, {
            title: `SQL: ${doc.isUntitled ? doc.uri.path : vscode.workspace.asRelativePath(doc.uri)}`,
            fileName,
            fetchSize: Math.max(1, sqlConfig.get<number>("fetchSize", 1000)),
            maxBufferedRows: Math.max(1, sqlConfig.get<number>("maxBufferedRows", 100000))
        });

        this.disposeActive();
        this._diagnostics.delete(doc.uri);
        const listener = run.onDidUpdate(state => {
            this.updateDiagnostics(run, state);
            this.updateRunning(run, !state.complete && !state.cancelled);
        });
        this._active = { run, uri: doc.uri, ranges, listener };

        //  Nothing executes yet - each statement runs when its result tab is first shown.
        eclWatchPanelView?.navigateSql(run);
    }

    private _running?: { run: SQLRun, done: () => void };

    private updateRunning(run: SQLRun | undefined, running: boolean) {
        if (running && run && this._running?.run !== run) {
            this._running?.done();
            let done!: () => void;
            const finished = new Promise<void>(resolve => done = resolve);
            this._running = { run, done };
            vscode.commands.executeCommand("setContext", RUNNING_CONTEXT, true);
            vscode.window.withProgress({ location: vscode.ProgressLocation.Window, title: localize("Executing SQL") }, () => finished);
        } else if (!running && this._running && (!run || this._running.run === run)) {
            this._running.done();
            this._running = undefined;
            vscode.commands.executeCommand("setContext", RUNNING_CONTEXT, false);
        }
    }

    async cancel(): Promise<void> {
        const active = this._active;
        if (!active) return;
        await active.run.cancel();
        this.updateRunning(active.run, false);
    }

    private updateDiagnostics(run: SQLRun, _state: SQLRunState) {
        const active = this._active;
        if (!active || active.run !== run) return;
        const doc = vscode.workspace.textDocuments.find(d => d.uri.toString() === active.uri.toString());
        const diagnostics = run.issues().map(issue => this.toDiagnostic(issue, active.ranges, doc));
        this._diagnostics.set(active.uri, diagnostics);
    }

    private toDiagnostic(issue: SQLIssue, ranges: vscode.Range[], doc?: vscode.TextDocument): vscode.Diagnostic {
        const stmtRange = ranges[issue.statementId] ?? new vscode.Range(0, 0, 0, 0);
        let range = stmtRange;
        if (issue.positioned && issue.LineNo !== undefined && issue.Column !== undefined) {
            const start = new vscode.Position(Math.max(0, issue.LineNo - 1), Math.max(0, issue.Column - 1));
            const wordRange = doc?.getWordRangeAtPosition(start);
            range = wordRange ?? new vscode.Range(start, doc ? doc.lineAt(Math.min(start.line, doc.lineCount - 1)).range.end : start);
            if (range.isEmpty) {
                range = new vscode.Range(start, start.translate(0, 1));
            }
        }
        const diagnostic = new vscode.Diagnostic(range, issue.Message, toSeverity(issue.Severity));
        diagnostic.source = issue.Source || "WsSQL2";
        if (issue.Code !== undefined && issue.Code !== "") {
            diagnostic.code = issue.Code;
        }
        return diagnostic;
    }

    private disposeActive() {
        const active = this._active;
        this._active = undefined;
        if (active) {
            active.listener.dispose();
            this.updateRunning(active.run, false);
            active.run.dispose().catch(() => undefined);
        }
    }
}

function toSeverity(severity?: string): vscode.DiagnosticSeverity {
    switch ((severity ?? "").toLowerCase()) {
        case "warning":
            return vscode.DiagnosticSeverity.Warning;
        case "info":
        case "information":
            return vscode.DiagnosticSeverity.Information;
        default:
            return vscode.DiagnosticSeverity.Error;
    }
}

export function activate(ctx: vscode.ExtensionContext): void {
    SQLCommands.attach(ctx);
}
