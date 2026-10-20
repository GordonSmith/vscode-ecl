import type { Result, XSDSchema } from "@hpcc-js/comms";
import type { ColumnType } from "@hpcc-js/dgrid";
import { Store } from "./WUResultStore";
import type { SQLColumn, SQLRange, SQLValue } from "../sql/types";
import { columnCharWidths } from "../sql/columnWidth";

type SQLRow = Record<string, unknown> & {
    __hpcc_id: number;
    __hpcc_orig: Record<string, SQLValue>;
};

export type SQLRangeFetcher = (start: number, end: number) => Promise<SQLRange>;

const CHAR_PX = 9;

function fieldID(idx: number): string {
    return `c${idx}`;
}

//  Reuses the WU result store paging / nested value rendering, with rows sourced from a WsSQL2 cursor (via the extension host).
export class SQLResultStore extends Store {

    constructor(private readonly sqlColumns: SQLColumn[], private readonly fetcher: SQLRangeFetcher) {
        super(undefined as unknown as Result, { root: undefined } as unknown as XSDSchema, false);
        const widths = columnCharWidths(this.sqlColumns);
        this._columns = this.sqlColumns.map((column, idx): ColumnType => ({
            field: fieldID(idx),
            leafID: fieldID(idx),
            idx,
            label: column.label,
            className: "resultGridCell",
            hidden: false,
            isSet: false,
            sortable: false,
            width: widths[idx] * CHAR_PX,
            renderCell: (row: unknown, cell: unknown, cellElement: HTMLElement) => {
                if (cell !== null && typeof cell === "object") {
                    this.rowToTable(cell, row, cellElement);
                } else {
                    cellElement.textContent = cell === undefined || cell === null ? "" : String(cell);
                }
            }
        }));
    }

    //  Resize columns to fit sample rows (e.g. nested tables, whose width can't be inferred from the type alone)
    sizeColumns(rows: SQLRow[]): void {
        const samples = rows.map(row => this.sqlColumns.map((_column, idx) => row[fieldID(idx)]));
        const widths = columnCharWidths(this.sqlColumns, samples);
        this._columns.forEach((column, idx) => {
            column.width = widths[idx] * CHAR_PX;
        });
    }

    toRow(values: SQLValue[], id: number): SQLRow {
        const orig: Record<string, SQLValue> = {};
        this.sqlColumns.forEach((column, idx) => {
            orig[column.label] = values[idx];
        });
        const row: SQLRow = { __hpcc_id: id, __hpcc_orig: orig };
        values.forEach((value, idx) => {
            row[fieldID(idx)] = value;
        });
        return row;
    }

    _request(start: number, end: number): Promise<{ totalLength: number, data: SQLRow[] }> {
        const cacheKey = `${start}->${end}`;
        const cached = this._cache[cacheKey];
        if (cached) return cached as Promise<{ totalLength: number, data: SQLRow[] }>;
        const request = this.fetcher(start, end).then(range => ({
            totalLength: range.totalLength,
            data: range.rows.map((values, idx) => this.toRow(values, start + idx))
        })).catch((error: unknown) => {
            delete this._cache[cacheKey];
            throw error;
        });
        //  Only cache fully satisfied ranges - partial ranges may grow as the cursor advances
        request.then(response => {
            if (response.data.length < end - start) {
                delete this._cache[cacheKey];
            }
        }, () => undefined);
        this._cache[cacheKey] = request;
        return request;
    }
}
