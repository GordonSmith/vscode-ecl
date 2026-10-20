// @vitest-environment node
import { describe, it, expect, vi } from "vitest";
import type { WsSQL2 } from "@hpcc-js/comms";
import { SQL2ServiceLike, SQLRun } from "../src/sql/executor";

function fakeService(pages: unknown[][][], opts: { executeResponse?: Partial<WsSQL2.ExecuteQueryResponse>, fetchError?: string } = {}) {
    let page = 0;
    const service = {
        ExecuteQuery: vi.fn<SQL2ServiceLike["ExecuteQuery"]>(async () => ({
            CursorId: "c1",
            InitMs: 1,
            PrepareMs: 2,
            ResultSetMetadata: { Column: [{ ColumnLabel: "a", ColumnTypeName: "INTEGER" }] },
            ...opts.executeResponse
        })),
        FetchResultSet: vi.fn<SQL2ServiceLike["FetchResultSet"]>(async () => {
            if (opts.fetchError) {
                return { Exceptions: { Exception: [{ Code: "42", Source: "DuckDB", Message: opts.fetchError }] } };
            }
            const rows = pages[page++] ?? [];
            return { Rows: JSON.stringify(rows), Complete: page >= pages.length, ExecuteMs: 5 };
        }),
        CloseResultSet: vi.fn<SQL2ServiceLike["CloseResultSet"]>(async () => ({ Closed: true }))
    };
    return service satisfies SQL2ServiceLike;
}

const rows = (from: number, count: number) => Array.from({ length: count }, (_, i) => [from + i]);
const opts = { title: "test", fileName: "/x.sql", fetchSize: 2, maxBufferedRows: 100 };

describe("sql/executor SQLRun", () => {
    it("executes, prefetches the first page and fetches further ranges lazily", async () => {
        const service = fakeService([rows(0, 2), rows(2, 2), rows(4, 1)]);
        const run = new SQLRun(service, [{ sql: "SELECT a FROM t", position: { line: 0, character: 0 } }], opts);
        await run.start(0);

        let state = run.state();
        expect(state.complete).toBe(true);
        expect(state.statements[0]).toMatchObject({ status: "ready", rowCount: 2, columns: [{ label: "a", type: "INTEGER" }], timings: { initMs: 1, prepareMs: 2, executeMs: 5 } });
        expect(service.FetchResultSet).toHaveBeenCalledTimes(1);

        const r1 = await run.fetchRange(0, 0, 3);
        expect(r1.rows).toEqual([[0], [1], [2]]);
        expect(r1.complete).toBe(false);
        expect(r1.totalLength).toBe(4 + opts.fetchSize);

        const r2 = await run.fetchRange(0, 3, 50);
        expect(r2).toEqual({ rows: [[3], [4]], totalLength: 5, complete: true });
        state = run.state();
        expect(state.statements[0]).toMatchObject({ status: "complete", complete: true, rowCount: 5 });
        //  Completed cursors are released by the server
        expect(service.CloseResultSet).not.toHaveBeenCalled();
    });

    it("serialises concurrent range requests on the forward-only cursor", async () => {
        const service = fakeService([rows(0, 2), rows(2, 2), rows(4, 2), rows(6, 2)]);
        const run = new SQLRun(service, [{ sql: "SELECT 1", position: { line: 0, character: 0 } }], opts);
        await run.start(0);
        const [a, b] = await Promise.all([run.fetchRange(0, 0, 4), run.fetchRange(0, 4, 8)]);
        expect(a.rows).toEqual([[0], [1], [2], [3]]);
        expect(b.rows).toEqual([[4], [5], [6], [7]]);
        expect(service.FetchResultSet).toHaveBeenCalledTimes(4);
    });

    it("reports execute exceptions as positioned issues without affecting other statements", async () => {
        const service = fakeService([rows(0, 1)]);
        service.ExecuteQuery.mockResolvedValueOnce({
            CursorId: "bad",
            Exceptions: { Exception: [{ Code: "1", Source: "DuckDB", Message: "Parser Error: syntax error\n\nLINE 1: SELECT * FORM t\n                 ^" }] }
        });
        const run = new SQLRun(service, [
            { sql: "SELECT * FORM t", position: { line: 4, character: 2 } },
            { sql: "SELECT 1", position: { line: 5, character: 0 } }
        ], opts);
        await run.start(0);
        await run.start(1);
        const state = run.state();
        expect(state.statements[0].status).toBe("error");
        expect(state.statements[0].issues[0]).toMatchObject({ Severity: "Error", Code: "1", LineNo: 5, Column: 12, positioned: true, statementId: 0, FileName: "/x.sql" });
        expect(service.CloseResultSet).toHaveBeenCalledWith({ CursorId: "bad" });
        expect(state.statements[1].status).toBe("complete");
    });

    it("reports fetch exceptions against the statement", async () => {
        const service = fakeService([], { fetchError: "Conversion Error: boom" });
        const run = new SQLRun(service, [{ sql: "SELECT 1", position: { line: 2, character: 3 } }], opts);
        await run.start(0);
        const stmt = run.state().statements[0];
        expect(stmt.status).toBe("error");
        expect(stmt.issues[0]).toMatchObject({ Message: "Conversion Error: boom", LineNo: 3, Column: 4, positioned: false });
        expect(service.CloseResultSet).toHaveBeenCalledWith({ CursorId: "c1" });
    });

    it("truncates at maxBufferedRows and closes the cursor", async () => {
        const service = fakeService([rows(0, 2), rows(2, 2), rows(4, 2)]);
        const run = new SQLRun(service, [{ sql: "SELECT 1", position: { line: 0, character: 0 } }], { ...opts, maxBufferedRows: 3 });
        await run.start(0);
        const range = await run.fetchRange(0, 0, 10);
        expect(range).toEqual({ rows: [[0], [1], [2]], totalLength: 3, complete: true });
        expect(run.state().statements[0]).toMatchObject({ truncated: true, complete: false, status: "complete" });
        expect(service.CloseResultSet).toHaveBeenCalledTimes(1);
    });

    it("cancel closes open cursors and marks pending statements cancelled", async () => {
        const service = fakeService([rows(0, 2), rows(2, 2)]);
        const run = new SQLRun(service, [{ sql: "SELECT 1", position: { line: 0, character: 0 } }], opts);
        await run.start(0);
        const listener = vi.fn();
        run.onDidUpdate(listener);
        await run.cancel();
        expect(service.CloseResultSet).toHaveBeenCalledWith({ CursorId: "c1" });
        expect(run.state()).toMatchObject({ cancelled: true, statements: [{ status: "cancelled" }] });
        expect(listener).toHaveBeenCalled();
        const range = await run.fetchRange(0, 0, 10);
        expect(range).toEqual({ rows: [[0], [1]], totalLength: 2, complete: true });
        await run.dispose();
        expect(service.CloseResultSet).toHaveBeenCalledTimes(1);
    });

    function gatedService() {
        const gates = new Map<string, () => void>();
        const started: string[] = [];
        const service: SQL2ServiceLike = {
            ExecuteQuery: vi.fn<SQL2ServiceLike["ExecuteQuery"]>(async req => {
                const sql = req.SqlText!;
                started.push(sql);
                await new Promise<void>(resolve => gates.set(sql, resolve));
                return { CursorId: `cur-${sql}`, ResultSetMetadata: { Column: [{ ColumnLabel: "a", ColumnTypeName: "INTEGER" }] } };
            }),
            FetchResultSet: vi.fn<SQL2ServiceLike["FetchResultSet"]>(async req => ({ Rows: JSON.stringify([[req.CursorId]]), Complete: true })),
            CloseResultSet: vi.fn<SQL2ServiceLike["CloseResultSet"]>(async () => ({ Closed: true }))
        };
        const release = async (sql: string) => {
            await vi.waitFor(() => expect(gates.has(sql)).toBe(true));
            gates.get(sql)!();
        };
        return { service, started, release };
    }
    const stmt = (sql: string) => ({ sql, position: { line: 0, character: 0 } });

    it("does not execute any statement until it is requested", async () => {
        const { service, started } = gatedService();
        const run = new SQLRun(service, ["s0", "s1", "s2"].map(stmt), opts);
        await new Promise(resolve => setTimeout(resolve, 20));
        expect(started).toEqual([]);
        expect(run.state()).toMatchObject({ complete: true, statements: [{ status: "pending" }, { status: "pending" }, { status: "pending" }] });
    });

    it("executes a requested statement independently of earlier statements", async () => {
        const { service, started, release } = gatedService();
        const run = new SQLRun(service, ["s0", "s1", "s2"].map(stmt), opts);
        const last = run.fetchRange(2, 0, 10);
        await vi.waitFor(() => expect(started).toEqual(["s2"]));
        expect(run.state().complete).toBe(false);
        await release("s2");
        expect(await last).toEqual({ rows: [["cur-s2"]], totalLength: 1, complete: true });
        expect(run.state()).toMatchObject({ complete: true, statements: [{ status: "pending" }, { status: "pending" }, { status: "complete" }] });
        //  Repeated requests do not re-execute
        await run.fetchRange(2, 0, 10);
        await run.start(2);
        expect(service.ExecuteQuery).toHaveBeenCalledTimes(1);
    });

    it("cancel marks unexecuted statements cancelled and they never execute", async () => {
        const { service, started } = gatedService();
        const run = new SQLRun(service, ["s0", "s1"].map(stmt), opts);
        await run.cancel();
        await run.start(1);
        expect(started).toEqual([]);
        expect(run.state().statements.map(s => s.status)).toEqual(["cancelled", "cancelled"]);
    });
});
