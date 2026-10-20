//  Shared between the extension host and the ECL Watch webview - must not import "vscode" or any webview globals.

export type SQLValue = string | number | boolean | null | SQLValue[] | { [key: string]: SQLValue };

export interface SQLColumn {
    label: string;
    type: string;
    precision?: number;
    scale?: number;
}

export interface SQLIssue {
    Severity: "Error" | "Warning" | "Info";
    Source: string;
    Code: string;
    Message: string;
    //  1-based document coordinates (when known)
    LineNo?: number;
    Column?: number;
    FileName?: string;
    statementId: number;
    //  true when the server reported an exact error column
    positioned: boolean;
}

export type SQLStatementStatus = "pending" | "executing" | "ready" | "complete" | "error" | "cancelled";

export interface SQLTimings {
    initMs?: number;
    prepareMs?: number;
    executeMs?: number;
    elapsedMs?: number;
}

export interface SQLStatementState {
    id: number;
    sql: string;
    status: SQLStatementStatus;
    columns: SQLColumn[];
    rowCount: number;
    complete: boolean;
    truncated: boolean;
    timings: SQLTimings;
    issues: SQLIssue[];
}

export interface SQLRunState {
    runId: string;
    title: string;
    complete: boolean;
    cancelled: boolean;
    statements: SQLStatementState[];
}

export interface SQLRange {
    rows: SQLValue[][];
    totalLength: number;
    complete: boolean;
}
