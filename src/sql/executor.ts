import type { WsSQL2 } from "@hpcc-js/comms";
import { DocumentPosition, normalizeException, parseErrorPosition, toDocumentPosition } from "./parse";
import type { SQLColumn, SQLIssue, SQLRange, SQLRunState, SQLStatementState, SQLValue } from "./types";

//  Subset of @hpcc-js/comms SQL2Service used by SQLRun (allows a fake service in tests).
export interface SQL2ServiceLike {
    ExecuteQuery(request: WsSQL2.ExecuteQueryRequest, abortSignal?: AbortSignal): Promise<WsSQL2.ExecuteQueryResponse>;
    FetchResultSet(request: WsSQL2.FetchResultSetRequest, abortSignal?: AbortSignal): Promise<WsSQL2.FetchResultSetResponse>;
    CloseResultSet(request: WsSQL2.CloseResultSetRequest, abortSignal?: AbortSignal): Promise<WsSQL2.CloseResultSetResponse>;
}

export interface SQLStatementInput {
    sql: string;
    //  0-based document position of the first character of `sql`
    position: DocumentPosition;
}

export interface SQLRunOptions {
    title: string;
    fileName?: string;
    fetchSize: number;
    maxBufferedRows: number;
}

interface StatementRuntime {
    input: SQLStatementInput;
    state: SQLStatementState;
    cursorId?: string;
    rows: SQLValue[][];
    chain: Promise<void>;
    executed?: Promise<void>;
}

class SQLExceptionsError extends Error {
    constructor(readonly exceptions: WsSQL2.Exception[]) {
        super(exceptions.map(e => e.Message ?? e.Code).join("; "));
    }
}

let g_runID = 0;

export class SQLRun {

    readonly runId = `sql-${Date.now()}-${++g_runID}`;

    private readonly _abort = new AbortController();
    private readonly _stmts: StatementRuntime[];
    private readonly _listeners = new Set<(state: SQLRunState) => void>();
    private _cancelled = false;
    private _disposed = false;

    constructor(private readonly _service: SQL2ServiceLike, statements: SQLStatementInput[], private readonly _opts: SQLRunOptions) {
        this._stmts = statements.map((input, id) => ({
            input,
            rows: [],
            chain: Promise.resolve(),
            state: {
                id,
                sql: input.sql,
                status: "pending",
                columns: [],
                rowCount: 0,
                complete: false,
                truncated: false,
                timings: {},
                issues: []
            }
        }));
    }

    get cancelled(): boolean {
        return this._cancelled;
    }

    onDidUpdate(listener: (state: SQLRunState) => void): { dispose: () => void } {
        this._listeners.add(listener);
        return { dispose: () => this._listeners.delete(listener) };
    }

    state(): SQLRunState {
        return {
            runId: this.runId,
            title: this._opts.title,
            complete: !this._stmts.some(stmt => stmt.state.status === "executing"),
            cancelled: this._cancelled,
            statements: this._stmts.map(stmt => ({
                ...stmt.state,
                rowCount: stmt.rows.length,
                columns: [...stmt.state.columns],
                timings: { ...stmt.state.timings },
                issues: [...stmt.state.issues]
            }))
        };
    }

    issues(): SQLIssue[] {
        return this._stmts.flatMap(stmt => stmt.state.issues);
    }

    private emit() {
        if (this._disposed) return;
        const state = this.state();
        for (const listener of this._listeners) {
            try {
                listener(state);
            } catch (e) {
                console.error(e);
            }
        }
    }

    //  Statements execute lazily - only when first requested (i.e. when their result tab is shown).
    start(statementId: number): Promise<void> {
        const stmt = this._stmts[statementId];
        if (!stmt) return Promise.reject(new RangeError(`Unknown SQL statement: ${statementId}`));
        return this.startStatement(stmt);
    }

    private startStatement(stmt: StatementRuntime): Promise<void> {
        if (!stmt.executed) {
            stmt.executed = this._abort.signal.aborted || stmt.state.status !== "pending" ?
                Promise.resolve() :
                this.executeStatement(stmt);
        }
        return stmt.executed;
    }

    private async executeStatement(stmt: StatementRuntime): Promise<void> {
        stmt.state.status = "executing";
        this.emit();
        const start = Date.now();
        try {
            const response = await this._service.ExecuteQuery({ SqlText: stmt.input.sql, IncludeResultSetMetadata: true }, this._abort.signal);
            stmt.state.timings.initMs = response.InitMs;
            stmt.state.timings.prepareMs = response.PrepareMs;
            stmt.cursorId = response.CursorId || undefined;
            if (response.Exceptions?.Exception?.length) {
                throw new SQLExceptionsError(response.Exceptions.Exception);
            }
            if (!stmt.cursorId) {
                throw new Error("WsSQL2 response is missing CursorId");
            }
            stmt.state.columns = (response.ResultSetMetadata?.Column ?? []).map(toColumn);
            await this.fetchUntil(stmt, this._opts.fetchSize);
        } catch (e) {
            await this.fail(stmt, e);
        }
        stmt.state.timings.elapsedMs = Date.now() - start;
        if (stmt.state.status === "executing") {
            stmt.state.status = stmt.cursorId ? "ready" : "complete";
        }
        this.emit();
    }

    private fetchUntil(stmt: StatementRuntime, end: number): Promise<void> {
        stmt.chain = stmt.chain.then(async () => {
            const prevCount = stmt.rows.length;
            try {
                while (stmt.cursorId && stmt.rows.length < end && !this._abort.signal.aborted) {
                    const response = await this._service.FetchResultSet({ CursorId: stmt.cursorId, FetchSize: this._opts.fetchSize }, this._abort.signal);
                    if (response.Exceptions?.Exception?.length) {
                        throw new SQLExceptionsError(response.Exceptions.Exception);
                    }
                    if (typeof response.Complete !== "boolean") {
                        throw new Error("WsSQL2 fetch response is missing Complete");
                    }
                    const rows = parseRows(response.Rows);
                    if (response.ExecuteMs !== undefined) {
                        stmt.state.timings.executeMs = (stmt.state.timings.executeMs ?? 0) + response.ExecuteMs;
                    }
                    for (const row of rows) {
                        if (stmt.rows.length >= this._opts.maxBufferedRows) {
                            stmt.state.truncated = true;
                            break;
                        }
                        stmt.rows.push(row);
                    }
                    if (response.Complete) {
                        //  Server releases the cursor once complete
                        stmt.cursorId = undefined;
                        stmt.state.complete = !stmt.state.truncated;
                    }
                    if (stmt.rows.length >= this._opts.maxBufferedRows && stmt.cursorId) {
                        stmt.state.truncated = true;
                        await this.closeCursor(stmt);
                    }
                    if (rows.length === 0 && stmt.cursorId) {
                        //  Avoid spinning on empty (incomplete) pages - the next range request will retry
                        break;
                    }
                }
            } catch (e) {
                await this.fail(stmt, e);
            }
            if (!stmt.cursorId && stmt.state.status === "ready") {
                stmt.state.status = "complete";
            }
            if (stmt.rows.length !== prevCount || stmt.state.status === "error") {
                this.emit();
            }
        });
        return stmt.chain;
    }

    async fetchRange(statementId: number, start: number, end: number): Promise<SQLRange> {
        const stmt = this._stmts[statementId];
        if (!stmt) throw new RangeError(`Unknown SQL statement: ${statementId}`);
        await this.startStatement(stmt);
        await this.fetchUntil(stmt, end);
        const more = !!stmt.cursorId && !this._abort.signal.aborted;
        return {
            rows: stmt.rows.slice(start, end),
            totalLength: stmt.rows.length + (more ? this._opts.fetchSize : 0),
            complete: !more
        };
    }

    private async fail(stmt: StatementRuntime, e: unknown): Promise<void> {
        if (this._abort.signal.aborted) {
            stmt.state.status = "cancelled";
        } else {
            stmt.state.status = "error";
            const exceptions: WsSQL2.Exception[] = e instanceof SQLExceptionsError ? e.exceptions : [{ Source: "WsSQL2", Message: e instanceof Error ? e.message : String(e) }];
            stmt.state.issues.push(...exceptions.map(ex => this.toIssue(stmt, ex)));
        }
        await this.closeCursor(stmt);
    }

    private toIssue(stmt: StatementRuntime, ex: WsSQL2.Exception): SQLIssue {
        const normalized = normalizeException(ex);
        const message = normalized.Message;
        const rel = parseErrorPosition(message, stmt.input.sql);
        const pos = toDocumentPosition(rel ?? { line: 1 }, stmt.input.position);
        return {
            Severity: "Error",
            Source: normalized.Source ?? "WsSQL2",
            Code: normalized.Code ?? "",
            Message: message,
            LineNo: pos.line + 1,
            Column: pos.character + 1,
            FileName: this._opts.fileName,
            statementId: stmt.state.id,
            positioned: rel?.character !== undefined
        };
    }

    private async closeCursor(stmt: StatementRuntime): Promise<void> {
        const cursorId = stmt.cursorId;
        stmt.cursorId = undefined;
        if (cursorId) {
            try {
                await this._service.CloseResultSet({ CursorId: cursorId });
            } catch (e) {
                console.warn(`Failed to close SQL cursor ${cursorId}:  ${e instanceof Error ? e.message : e}`);
            }
        }
    }

    async cancel(): Promise<void> {
        if (this._cancelled) return;
        this._cancelled = true;
        this._abort.abort();
        for (const stmt of this._stmts) {
            if (stmt.state.status === "pending" || stmt.state.status === "executing" || (stmt.state.status === "ready" && stmt.cursorId)) {
                stmt.state.status = "cancelled";
            }
        }
        await Promise.all(this._stmts.map(stmt => this.closeCursor(stmt)));
        this.emit();
    }

    async dispose(): Promise<void> {
        if (this._disposed) return;
        if (this._stmts.some(stmt => stmt.state.status === "executing" || stmt.cursorId)) {
            await this.cancel();
        }
        this._disposed = true;
        this._listeners.clear();
    }
}

function toColumn(column: WsSQL2.Column): SQLColumn {
    return {
        label: column.ColumnLabel ?? "",
        type: column.ColumnTypeName ?? "",
        precision: column.Precision,
        scale: column.Scale
    };
}

function parseRows(rows: string | undefined): SQLValue[][] {
    if (rows === undefined || rows === "") return [];
    const parsed: unknown = JSON.parse(rows);
    if (!Array.isArray(parsed) || !parsed.every(row => Array.isArray(row))) {
        throw new Error("WsSQL2 Rows must be an array of arrays");
    }
    return parsed as SQLValue[][];
}
