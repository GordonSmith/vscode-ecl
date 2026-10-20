// @vitest-environment node
import { describe, it, expect, vi } from "vitest";
import type { WsSQL2 } from "@hpcc-js/comms";
import { locateStatements } from "../src/sql/parse";
import { splitSQL, type SQL2SplitterLike } from "../src/sql/split";

function splitter(response: WsSQL2.SplitQueryResponse | Error): SQL2SplitterLike & { SplitQuery: ReturnType<typeof vi.fn> } {
    return {
        SplitQuery: vi.fn<SQL2SplitterLike["SplitQuery"]>(async () => {
            if (response instanceof Error) throw response;
            return response;
        })
    };
}

describe("sql/parse locateStatements", () => {
    it("maps verbatim server statements back to source offsets", () => {
        const text = "-- lead; comment\nSELECT 'x;y' AS b /* in; block */ FROM range(3);\n\n  select   1  ;";
        const located = locateStatements(text, ["-- lead; comment\nSELECT 'x;y' AS b /* in; block */ FROM range(3)", "select   1"], 10);
        expect(located).toEqual([
            { sql: "-- lead; comment\nSELECT 'x;y' AS b /* in; block */ FROM range(3)", start: 10, end: 10 + 64 },
            { sql: "select   1", start: 10 + 69, end: 10 + 79 }
        ]);
    });

    it("locates repeated identical statements in order", () => {
        const located = locateStatements("SELECT 1;\nSELECT 1;", ["SELECT 1", "SELECT 1"]);
        expect(located?.map(s => s.start)).toEqual([0, 10]);
    });

    it("returns undefined when a statement is not verbatim", () => {
        expect(locateStatements("SELECT  1;", ["SELECT 1"])).toBeUndefined();
    });
});

describe("sql/split splitSQL", () => {
    it("uses the server split when available", async () => {
        const text = "CREATE TABLE t AS SELECT 1; SELECT 2;\r\nSELECT\r\n  3";
        const service = splitter({ Statements: { Statement: ["CREATE TABLE t AS SELECT 1", "SELECT 2", "SELECT\r\n  3"] } });
        const result = await splitSQL(service, text, 5);
        expect(service.SplitQuery).toHaveBeenCalledWith({ SqlText: text });
        expect(result.source).toBe("server");
        expect(result.statements.map(s => [s.sql, s.start])).toEqual([
            ["CREATE TABLE t AS SELECT 1", 5],
            ["SELECT 2", 5 + 28],
            ["SELECT\r\n  3", 5 + 39]
        ]);
    });

    it("treats an empty server response as no statements", async () => {
        const result = await splitSQL(splitter({}), "-- only a comment\n");
        expect(result).toEqual({ statements: [], source: "server" });
    });

    it("falls back to the local splitter on server parse errors", async () => {
        const service = splitter({ Exceptions: { Exception: [{ Code: "-1", Message: "syntax error at or near \"SELEC\"" }] } });
        const result = await splitSQL(service, "SELECT 1;\nSELEC broken;");
        expect(result.source).toBe("local");
        expect(result.reason).toContain("SELEC");
        expect(result.statements.map(s => s.sql)).toEqual(["SELECT 1", "SELEC broken"]);
    });

    it("falls back to the local splitter when SplitQuery is unavailable", async () => {
        const result = await splitSQL(splitter(new Error("Method SplitQuery not available")), "SELECT 1; SELECT 2");
        expect(result.source).toBe("local");
        expect(result.statements).toHaveLength(2);
    });

    it("falls back when server statements cannot be located", async () => {
        const result = await splitSQL(splitter({ Statements: { Statement: ["SELECT 1"] } }), "SELECT   1");
        expect(result.source).toBe("local");
        expect(result.statements.map(s => s.sql)).toEqual(["SELECT   1"]);
    });

    it("does not call the server for blank text", async () => {
        const service = splitter({});
        expect(await splitSQL(service, "  \n")).toEqual({ statements: [], source: "local" });
        expect(service.SplitQuery).not.toHaveBeenCalled();
    });
});
