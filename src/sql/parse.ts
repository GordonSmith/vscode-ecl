//  Pure helpers (no "vscode" imports) - unit tested in test/sqlParse.test.ts

export interface SQLStatementText {
    sql: string;
    //  Offsets (inclusive start, exclusive end) into the original text, including baseOffset
    start: number;
    end: number;
}

const DOLLAR_TAG = /^\$([A-Za-z_][A-Za-z0-9_]*)?\$/;

/**
 * Splits SQL text into statements on top-level ";" - ignoring semicolons inside quoted strings,
 * quoted identifiers, dollar-quoted strings and comments.  Statements without any code are dropped.
 */
export function splitStatements(text: string, baseOffset = 0): SQLStatementText[] {
    const retVal: SQLStatementText[] = [];
    let segStart = 0;
    let hasCode = false;

    const pushSegment = (segEnd: number) => {
        if (hasCode) {
            let s = segStart;
            let e = segEnd;
            while (s < e && /\s/.test(text[s])) s++;
            while (e > s && /\s/.test(text[e - 1])) e--;
            retVal.push({ sql: text.substring(s, e), start: baseOffset + s, end: baseOffset + e });
        }
        hasCode = false;
    };

    let i = 0;
    while (i < text.length) {
        const ch = text[i];
        const next = text[i + 1];
        if (ch === "-" && next === "-") {
            const eol = text.indexOf("\n", i);
            i = eol < 0 ? text.length : eol + 1;
        } else if (ch === "/" && next === "*") {
            const close = text.indexOf("*/", i + 2);
            i = close < 0 ? text.length : close + 2;
        } else if (ch === "'" || ch === "\"") {
            hasCode = true;
            i++;
            while (i < text.length) {
                if (text[i] === ch) {
                    if (text[i + 1] === ch) {
                        i += 2;
                        continue;
                    }
                    i++;
                    break;
                }
                i++;
            }
        } else if (ch === "$" && DOLLAR_TAG.test(text.substring(i, i + 64))) {
            hasCode = true;
            const tag = DOLLAR_TAG.exec(text.substring(i, i + 64))![0];
            const close = text.indexOf(tag, i + tag.length);
            i = close < 0 ? text.length : close + tag.length;
        } else if (ch === ";") {
            pushSegment(i);
            segStart = i + 1;
            i++;
        } else {
            if (!/\s/.test(ch)) {
                hasCode = true;
            }
            i++;
        }
    }
    pushSegment(text.length);
    return retVal;
}

/**
 * Maps statements returned by the server (WsSQL2 SplitQuery - verbatim, trimmed substrings in source order)
 * back to offsets within the original text.  Returns undefined if any statement cannot be located.
 */
export function locateStatements(text: string, statements: string[], baseOffset = 0): SQLStatementText[] | undefined {
    const retVal: SQLStatementText[] = [];
    let from = 0;
    for (const sql of statements) {
        const trimmed = sql.trim();
        if (!trimmed) continue;
        const idx = text.indexOf(trimmed, from);
        if (idx < 0) return undefined;
        from = idx + trimmed.length;
        retVal.push({ sql: trimmed, start: baseOffset + idx, end: baseOffset + from });
    }
    return retVal;
}

export interface RelativePosition {
    //  1-based line within the statement
    line: number;
    //  0-based character within that line (when known)
    character?: number;
}

const LINE_CONTEXT = /^LINE (\d+): ?(.*)$/m;

/**
 * Extracts an error position from DuckDB style messages:
 *   Parser Error: syntax error at or near "FORM"
 *
 *   LINE 1: SELECT * FORM t
 *                    ^
 */
export function parseErrorPosition(message: string, sql: string): RelativePosition | undefined {
    const match = LINE_CONTEXT.exec(message ?? "");
    if (!match) return undefined;
    const line = parseInt(match[1], 10);
    if (!Number.isFinite(line) || line < 1) return undefined;

    const retVal: RelativePosition = { line };
    const prefixLen = match[0].length - match[2].length;
    const rest = message.substring(match.index + match[0].length).split(/\r?\n/);
    const caretLine = rest.length > 1 ? rest[1] : undefined;
    const caretIdx = caretLine?.indexOf("^") ?? -1;
    if (caretIdx >= prefixLen) {
        let character = caretIdx - prefixLen;
        const context = match[2];
        if (context.startsWith("...")) {
            //  DuckDB truncates long lines - locate the visible fragment within the actual statement line.
            const sqlLine = sql.split(/\r?\n/)[line - 1] ?? "";
            const fragment = context.substring(3).replace(/\.\.\.$/, "").substring(0, 20);
            const fragmentIdx = fragment ? sqlLine.indexOf(fragment) : -1;
            character = fragmentIdx >= 0 ? fragmentIdx + character - 3 : undefined;
        }
        if (character !== undefined && character >= 0) {
            retVal.character = character;
        }
    }
    return retVal;
}

export interface NormalizedException {
    Source?: string;
    Code?: string;
    Message: string;
}

const JSON_ERROR = /^\s*(-?\d+)?\s*:?\s*(\{[\s\S]*\})\s*$/;

/**
 * WsSQL2 wraps engine errors as `<code>:  {"exception_type": "...", "exception_message": "...", ...}`.
 * Unwraps them into a readable message (falls back to the raw message).
 */
export function normalizeException(ex: { Source?: string, Code?: string, Message?: string }): NormalizedException {
    const raw = ex.Message ?? ex.Code ?? "Unknown error";
    const match = JSON_ERROR.exec(raw);
    if (match) {
        try {
            const json = JSON.parse(match[2]);
            if (json && typeof json.exception_message === "string") {
                const type = typeof json.exception_type === "string" ? json.exception_type : undefined;
                const subtype = typeof json.error_subtype === "string" ? json.error_subtype : undefined;
                return {
                    Source: type ? `${ex.Source ?? "WsSQL2"} (${type})` : ex.Source,
                    Code: ex.Code || subtype || match[1],
                    Message: type ? `${type} Error: ${json.exception_message}` : json.exception_message
                };
            }
        } catch {
            //  Not JSON - use raw message
        }
    }
    return { Source: ex.Source, Code: ex.Code, Message: raw };
}

export interface DocumentPosition {
    //  0-based
    line: number;
    character: number;
}

/** Converts a statement relative position into a (0-based) document position. */
export function toDocumentPosition(rel: RelativePosition, statementStart: DocumentPosition): DocumentPosition {
    return {
        line: statementStart.line + rel.line - 1,
        character: (rel.line === 1 ? statementStart.character : 0) + (rel.character ?? 0)
    };
}

/** Short single line label for a statement (used for tab titles). */
export function statementLabel(sql: string, maxLen = 32): string {
    const flat = sql.replace(/--[^\n]*\n?/g, " ").replace(/\/\*[\s\S]*?\*\//g, " ").replace(/\s+/g, " ").trim();
    return flat.length > maxLen ? flat.substring(0, maxLen - 1) + "…" : flat;
}
