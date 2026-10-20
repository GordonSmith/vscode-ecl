import type { WsSQL2 } from "@hpcc-js/comms";
import { locateStatements, splitStatements, type SQLStatementText } from "./parse";

export interface SQL2SplitterLike {
    SplitQuery(request: WsSQL2.SplitQueryRequest, abortSignal?: AbortSignal): Promise<WsSQL2.SplitQueryResponse>;
}

export interface SplitResult {
    statements: SQLStatementText[];
    source: "server" | "local";
    //  Why the server split was not used (when source === "local")
    reason?: string;
}

/**
 * Splits SQL using the server's DuckDB parser (WsSQL2 SplitQuery), falling back to the local splitter when
 * the server cannot split the text (syntax errors, older servers without SplitQuery, unmappable results).
 * Falling back keeps "run every statement, report errors per statement" behaviour.
 */
export async function splitSQL(service: SQL2SplitterLike | undefined, text: string, baseOffset = 0): Promise<SplitResult> {
    if (!text.trim()) {
        return { statements: [], source: "local" };
    }
    if (!service) {
        return { statements: splitStatements(text, baseOffset), source: "local", reason: "No server" };
    }
    let reason: string;
    try {
        const response = await service.SplitQuery({ SqlText: text });
        const exceptions = response?.Exceptions?.Exception ?? [];
        if (exceptions.length) {
            reason = exceptions.map(e => e.Message ?? e.Code).join("; ");
        } else {
            const statements = response?.Statements?.Statement ?? [];
            if (!Array.isArray(statements) || !statements.every(s => typeof s === "string")) {
                reason = "Invalid SplitQuery response";
            } else {
                const located = locateStatements(text, statements, baseOffset);
                if (located) {
                    return { statements: located, source: "server" };
                }
                reason = "Unable to locate server statements in source text";
            }
        }
    } catch (e) {
        reason = e instanceof Error ? e.message : String(e);
    }
    return { statements: splitStatements(text, baseOffset), source: "local", reason };
}
