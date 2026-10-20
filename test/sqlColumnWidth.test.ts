// @vitest-environment node
import { describe, expect, it } from "vitest";
import { columnCharWidths, sampleCharWidth, typeCharWidth } from "../src/sql/columnWidth";

const accountsType = "STRUCT(account VARCHAR, opendate VARCHAR, code1 BIGINT)[]";

describe("sql column widths", () => {
    it("treats nested types as nested even when they contain numeric field types", () => {
        expect(typeCharWidth({ label: "accounts", type: accountsType })).toBe(40);
        expect(typeCharWidth({ label: "m", type: "MAP(VARCHAR, INTEGER)" })).toBe(40);
        expect(typeCharWidth({ label: "l", type: "INTEGER[]" })).toBe(40);
    });

    it("sizes scalar types", () => {
        expect(typeCharWidth({ label: "id", type: "BIGINT", precision: 0 })).toBe(20);
        expect(typeCharWidth({ label: "b", type: "BOOLEAN" })).toBe(5);
        expect(typeCharWidth({ label: "s", type: "VARCHAR" })).toBe(24);
    });

    it("sums nested object field widths across samples", () => {
        const width = sampleCharWidth([
            [{ account: "12345", code1: 1 }, { account: "1", code1: 123456789 }],
            [{ account: "1234567890", code1: 2 }]
        ]);
        //  account: max(7, 10) + 2, code1: max(5, 9) + 2
        expect(width).toBe(23);
    });

    it("uses samples when available, otherwise the type, and never narrower than the label", () => {
        const columns = [
            { label: "personid", type: "BIGINT" },
            { label: "accounts", type: accountsType },
            { label: "x", type: "VARCHAR" }
        ];
        expect(columnCharWidths(columns)).toEqual([22, 42, 26]);
        const accounts = Array.from({ length: 3 }, () => ({ account: "a".repeat(20), opendate: "20200101", code1: 1 }));
        expect(columnCharWidths(columns, [[1, accounts, "ab"], [22, null, null]])).toEqual([10, 22 + 10 + 7 + 2, 5]);
    });
});
