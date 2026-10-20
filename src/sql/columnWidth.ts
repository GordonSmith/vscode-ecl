//  Pure helpers (no DOM / "vscode" imports) for sizing SQL result grid columns - unit tested in test/sqlColumnWidth.test.ts

import type { SQLColumn } from "./types";

//  Padding of a (nested) table cell, in characters
const NESTED_CELL_PADDING = 2;
const MAX_LEAF_CHARS = 60;
const MAX_COLUMN_CHARS = 400;

function isPlainObject(value: unknown): value is Record<string, unknown> {
    return value !== null && typeof value === "object" && !Array.isArray(value);
}

//  Mirrors WUResultStore.isChildDataset - single key objects wrapping an array are rendered without a header
function unwrapChildDataset(value: Record<string, unknown>): unknown[] | undefined {
    const keys = Object.keys(value);
    return keys.length === 1 && Array.isArray(value[keys[0]]) ? value[keys[0]] as unknown[] : undefined;
}

/**
 * Estimates the rendered width (in characters) of a set of sample values from one column / nested field.
 * Objects render as tables (one column per key, header = key) and arrays as stacked rows, so widths of
 * nested fields are aggregated across all samples before summing.
 */
export function sampleCharWidth(values: unknown[]): number {
    let primitiveWidth = 0;
    const objects: Record<string, unknown>[] = [];
    const arrayItems: unknown[] = [];
    for (const value of values) {
        if (value === null || value === undefined) continue;
        if (Array.isArray(value)) {
            arrayItems.push(...value);
        } else if (isPlainObject(value)) {
            const dataset = unwrapChildDataset(value);
            if (dataset) {
                arrayItems.push(...dataset);
            } else {
                objects.push(value);
            }
        } else {
            primitiveWidth = Math.max(primitiveWidth, Math.min(String(value).trim().length, MAX_LEAF_CHARS));
        }
    }

    let objectWidth = 0;
    if (objects.length) {
        const keys = new Set<string>();
        objects.forEach(obj => Object.keys(obj).forEach(key => keys.add(key)));
        for (const key of keys) {
            objectWidth += Math.max(key.length, sampleCharWidth(objects.map(obj => obj[key]))) + NESTED_CELL_PADDING;
        }
    }

    const arrayWidth = arrayItems.length ? sampleCharWidth(arrayItems) + (arrayItems.some(item => !isPlainObject(item) && !Array.isArray(item)) ? NESTED_CELL_PADDING : 0) : 0;

    return Math.max(primitiveWidth, objectWidth, arrayWidth);
}

function isNestedType(type: string): boolean {
    return /\[\d*\]\s*$|^\s*(STRUCT|MAP|UNION|LIST)\b/i.test(type);
}

//  Fallback (no sample rows) width, in characters, derived from the column type
export function typeCharWidth(column: SQLColumn): number {
    const type = column.type.toUpperCase();
    if (isNestedType(type)) return 40;
    if (/^BOOL/.test(type)) return 5;
    if (/^(U?TINYINT)/.test(type)) return 4;
    if (/^(U?SMALLINT)/.test(type)) return 6;
    if (/^(U?INTEGER|INT\b)/.test(type)) return 11;
    if (/^(U?BIGINT)/.test(type)) return 20;
    if (/^(U?HUGEINT)/.test(type)) return 40;
    if (/^(DECIMAL|NUMERIC)/.test(type)) return Math.min(Math.max((column.precision || 18) + 2, 6), 40);
    if (/^(DOUBLE|FLOAT|REAL)/.test(type)) return 16;
    if (/^TIMESTAMP/.test(type)) return 26;
    if (/^DATE/.test(type)) return 10;
    if (/^TIME/.test(type)) return 15;
    if (/^UUID/.test(type)) return 36;
    return 24;
}

/**
 * Column widths (in characters) - sized from sample rows when available (falling back to the column type).
 */
export function columnCharWidths(columns: SQLColumn[], sampleRows: unknown[][] = []): number[] {
    return columns.map((column, idx) => {
        const samples = sampleRows.map(row => row[idx]);
        const hasSamples = samples.some(value => value !== null && value !== undefined);
        const dataWidth = hasSamples ? sampleCharWidth(samples) : typeCharWidth(column);
        return Math.min(Math.max(column.label.length, dataWidth, 3) + NESTED_CELL_PADDING, MAX_COLUMN_CHARS);
    });
}
