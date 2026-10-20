// @vitest-environment node
import { describe, it, expect } from "vitest";
import { normalizeException, parseErrorPosition, splitStatements, statementLabel, toDocumentPosition } from "../src/sql/parse";

describe("sql/parse splitStatements", () => {
    it("splits on top-level semicolons and trims", () => {
        const text = "SELECT 1;\n  SELECT 2  ;\n";
        const stmts = splitStatements(text);
        expect(stmts.map(s => s.sql)).toEqual(["SELECT 1", "SELECT 2"]);
        for (const s of stmts) {
            expect(text.substring(s.start, s.end)).toBe(s.sql);
        }
    });

    it("ignores semicolons in strings, identifiers, dollar quotes and comments", () => {
        const text = "SELECT 'a;''b' AS \"x;y\", $$c;d$$, $t$e;f$t$ -- g;h\n/* i;j */ FROM t; SELECT 2";
        const stmts = splitStatements(text);
        expect(stmts).toHaveLength(2);
        expect(stmts[0].sql).toBe("SELECT 'a;''b' AS \"x;y\", $$c;d$$, $t$e;f$t$ -- g;h\n/* i;j */ FROM t");
        expect(stmts[1].sql).toBe("SELECT 2");
    });

    it("drops empty and comment-only statements", () => {
        expect(splitStatements(";;  ; -- nothing\n /* here */ ;")).toEqual([]);
    });

    it("applies the base offset (selection submission)", () => {
        const stmts = splitStatements(" SELECT 1", 10);
        expect(stmts[0]).toEqual({ sql: "SELECT 1", start: 11, end: 19 });
    });

    it("handles unterminated strings and comments without throwing", () => {
        expect(splitStatements("SELECT 'abc;").map(s => s.sql)).toEqual(["SELECT 'abc;"]);
        expect(splitStatements("SELECT 1 /* abc;").map(s => s.sql)).toEqual(["SELECT 1 /* abc;"]);
    });
});

describe("sql/parse parseErrorPosition", () => {
    it("parses DuckDB LINE context and caret", () => {
        const msg = "Parser Error: syntax error at or near \"FORM\"\n\nLINE 1: SELECT * FORM t\n                 ^";
        expect(parseErrorPosition(msg, "SELECT * FORM t")).toEqual({ line: 1, character: 9 });
    });

    it("parses multi-line statements", () => {
        const sql = "SELECT a,\n  bogus\nFROM t";
        const msg = "Binder Error: Referenced column \"bogus\" not found\n\nLINE 2:   bogus\n          ^";
        expect(parseErrorPosition(msg, sql)).toEqual({ line: 2, character: 2 });
    });

    it("locates truncated context lines", () => {
        const sql = "SELECT aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa, bbbbbbbbbbbbbbbbbbbb, bogus FROM t";
        const contextLine = "LINE 1: ...bbbbbbbbbbbbbbbbbbbb, bogus FROM t";
        const caretLine = " ".repeat(contextLine.indexOf("bogus")) + "^";
        const pos = parseErrorPosition(`Binder Error: x\n\n${contextLine}\n${caretLine}`, sql);
        expect(pos?.line).toBe(1);
        expect(sql.substring(pos!.character!)).toMatch(/^bogus/);
    });

    it("returns line only when there is no caret, undefined when no context", () => {
        expect(parseErrorPosition("Catalog Error: x\n\nLINE 3: foo", "a\nb\nfoo")).toEqual({ line: 3 });
        expect(parseErrorPosition("IO Error: file not found", "SELECT 1")).toBeUndefined();
    });
});

describe("sql/parse helpers", () => {
    it("maps statement positions to document positions", () => {
        expect(toDocumentPosition({ line: 1, character: 4 }, { line: 10, character: 6 })).toEqual({ line: 10, character: 10 });
        expect(toDocumentPosition({ line: 3, character: 4 }, { line: 10, character: 6 })).toEqual({ line: 12, character: 4 });
        expect(toDocumentPosition({ line: 2 }, { line: 0, character: 6 })).toEqual({ line: 1, character: 0 });
    });

    it("creates short labels", () => {
        expect(statementLabel("-- c\nSELECT   *\n  FROM t")).toBe("SELECT * FROM t");
        expect(statementLabel("SELECT " + "x".repeat(100), 10)).toHaveLength(10);
    });

    it("unwraps WsSQL2 JSON engine errors", () => {
        const raw = "-1:  {\"exception_type\":\"Parser\",\"exception_message\":\"syntax error at or near \\\"SELEC\\\"\\n\\nLINE 1: SELEC broken FROM nowhere\\n        ^\",\"error_subtype\":\"SYNTAX_ERROR\"}";
        const normalized = normalizeException({ Source: "WsSQL2", Code: "", Message: raw });
        expect(normalized).toEqual({
            Source: "WsSQL2 (Parser)",
            Code: "SYNTAX_ERROR",
            Message: "Parser Error: syntax error at or near \"SELEC\"\n\nLINE 1: SELEC broken FROM nowhere\n        ^"
        });
        expect(parseErrorPosition(normalized.Message, "SELEC broken FROM nowhere")).toEqual({ line: 1, character: 0 });
        expect(normalizeException({ Message: "plain" })).toEqual({ Source: undefined, Code: undefined, Message: "plain" });
    });
});
