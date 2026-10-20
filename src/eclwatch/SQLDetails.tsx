import * as React from "react";
import { Button, MessageBar, MessageBarBody, Spinner, Tab, TabList, type SelectTabData, type SelectTabEvent } from "@fluentui/react-components";
import { StopRegular } from "@fluentui/react-icons";
import { useConst } from "@fluentui/react-hooks";
import type { WsWorkunits } from "@hpcc-js/comms";
import { Common } from "@hpcc-js/dgrid";
import { hashSum } from "@hpcc-js/util";
import { HolyGrail } from "./HolyGrail";
import { VisualizationComponent } from "./hpccVizAdapter";
import { cancelSql, requestSqlRange, startSql } from "./Message";
import { OverflowTabMenu, ResultTab, useResponsiveTabs } from "./WUDetails";
import { WUIssues } from "./WUResult";
import { createEmptyStore } from "./WUResultStore";
import { SQLResultStore } from "./SQLResultStore";
import { statementLabel } from "../sql/parse";
import type { SQLColumn, SQLRunState, SQLStatementState } from "../sql/types";

import "./WUResult.css";

const __VSCODE_ISSUES = "__vscode_issues";

export class SQLResultTable extends Common {

    protected _prevHash?: string;

    constructor() {
        super();
        this.renderHtml(false)
            .pagination(true)
            .pageSize(50)
            ;
    }

    update(domNode: HTMLElement, element: any) {
        super.update(domNode, element);
        const hash = hashSum({ runId: this.runId(), statementId: this.statementId(), columns: this.sqlColumns() });
        if (this._prevHash !== hash) {
            this._prevHash = hash;
            const runId = this.runId();
            const statementId = this.statementId();
            const columns = this.sqlColumns() ?? [];
            if (runId && columns.length) {
                const store = new SQLResultStore(columns, (start, end) => requestSqlRange(runId, statementId, start, end));
                const apply = () => {
                    if (this._prevHash !== hash) return;
                    this._dgrid?.set("columns", store.columns());
                    this._dgrid?.set("collection", store);
                };
                //  First page is cached by the store, so sizing columns from it costs no extra fetch
                store._request(0, this.pageSize()).then(response => {
                    store.sizeColumns(response.data);
                    apply();
                }, apply);
            } else {
                this._dgrid?.set("columns", []);
                this._dgrid?.set("collection", createEmptyStore());
            }
        }
    }

    click(_row: unknown, _col: unknown, _sel: unknown, _more: unknown): void {
    }
}
SQLResultTable.prototype._class += " eclwatch_SQLResultTable";

export interface SQLResultTable {
    runId(): string;
    runId(_: string): this;
    statementId(): number;
    statementId(_: number): this;
    sqlColumns(): SQLColumn[];
    sqlColumns(_: SQLColumn[]): this;
}
SQLResultTable.prototype.publish("runId", "", "string", "SQL Run ID");
SQLResultTable.prototype.publish("statementId", 0, "number", "SQL Statement ID");
SQLResultTable.prototype.publish("sqlColumns", [], "array", "SQL Columns");

interface SQLResultProps {
    runId: string;
    statement: SQLStatementState;
}

const SQLResult: React.FunctionComponent<SQLResultProps> = ({ runId, statement }) => {
    const table = useConst(() => new SQLResultTable());
    const columns = statement.columns;

    React.useEffect(() => {
        table
            .runId(runId)
            .statementId(statement.id)
            .sqlColumns(columns)
            ;
    }, [table, runId, statement.id, columns]);

    return <VisualizationComponent widget={table} debounce={true}>
    </VisualizationComponent>;
};

function formatMs(ms?: number): string | undefined {
    return ms === undefined ? undefined : `${Math.round(ms * 10) / 10}ms`;
}

function statementSummary(stmt: SQLStatementState): string {
    const parts: string[] = [];
    parts.push(`${stmt.rowCount}${stmt.complete ? "" : stmt.truncated ? " (truncated)" : "+"} rows`);
    const timings = [
        ["Init", formatMs(stmt.timings.initMs)],
        ["Prepare", formatMs(stmt.timings.prepareMs)],
        ["Execute", formatMs(stmt.timings.executeMs)],
        ["Elapsed", formatMs(stmt.timings.elapsedMs)]
    ].filter(([, value]) => value !== undefined).map(([label, value]) => `${label}: ${value}`);
    if (timings.length) {
        parts.push(timings.join(", "));
    }
    if (stmt.status === "cancelled") {
        parts.push("cancelled");
    }
    return parts.join("  |  ");
}

function statusSuffix(stmt: SQLStatementState): string {
    switch (stmt.status) {
        case "executing":
            return " …";
        case "error":
            return " ⚠";
        default:
            return "";
    }
}

export interface SQLDetailsProps {
    run: SQLRunState;
}

export const SQLDetails: React.FunctionComponent<SQLDetailsProps> = ({ run }) => {

    const [name, setName] = React.useState<string>("");

    const issues = React.useMemo(() => run.statements.flatMap(stmt => stmt.issues) as unknown as WsWorkunits.ECLException[], [run]);
    const hasIssues = issues.length > 0;

    const tabs = React.useMemo<ResultTab[]>(() => [
        ...hasIssues ? [{ key: __VSCODE_ISSUES, label: `Issues (${issues.length})` }] : [],
        ...run.statements.map(stmt => ({
            key: String(stmt.id),
            label: `${run.statements.length > 1 ? `#${stmt.id + 1} ` : ""}${statementLabel(stmt.sql, 24)}${statusSuffix(stmt)}`,
            tooltip: stmt.sql.trim()
        }))
    ], [hasIssues, issues.length, run.statements]);

    const selected = tabs.some(tab => tab.key === name) ? name : String(run.statements[0]?.id ?? "");
    const selectedStatement = run.statements.find(stmt => String(stmt.id) === selected);

    //  Statements execute lazily - start the selected one when its tab is shown
    const selectedStatementId = selectedStatement?.id;
    const selectedPending = selectedStatement?.status === "pending" && !run.cancelled;
    React.useEffect(() => {
        if (selectedPending && selectedStatementId !== undefined) {
            startSql(run.runId, selectedStatementId);
        }
    }, [run.runId, selectedStatementId, selectedPending]);

    const handleTabSelect = React.useCallback((_event: SelectTabEvent, data: SelectTabData) => {
        setName(String(data.value));
    }, []);

    const handleOverflowSelect = React.useCallback((tab: ResultTab) => {
        setName(tab.key);
    }, []);

    const { containerRef, setItemRef, visibleKeys } = useResponsiveTabs(tabs, selected);
    const hiddenTabs = React.useMemo(() => tabs.filter(tab => !visibleKeys.includes(tab.key)), [tabs, visibleKeys]);

    const running = !run.complete && !run.cancelled;

    let main: React.ReactNode;
    if (selected === __VSCODE_ISSUES) {
        main = <WUIssues exceptions={issues} />;
    } else if (!selectedStatement) {
        main = <MessageBar intent="info"><MessageBarBody>No SQL statements.</MessageBarBody></MessageBar>;
    } else if (selectedStatement.status === "pending" || selectedStatement.status === "executing") {
        main = <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%" }}>
            <Spinner label="Executing..." />
        </div>;
    } else if (selectedStatement.status === "error" && selectedStatement.columns.length === 0) {
        main = <MessageBar intent="error">
            <MessageBarBody>{selectedStatement.issues.map(issue => issue.Message).join("\n") || "Failed"}</MessageBarBody>
        </MessageBar>;
    } else if (selectedStatement.status === "cancelled" && selectedStatement.columns.length === 0) {
        main = <MessageBar intent="warning"><MessageBarBody>Cancelled.</MessageBarBody></MessageBar>;
    } else {
        main = <SQLResult key={selectedStatement.id} runId={run.runId} statement={selectedStatement} />;
    }

    return <HolyGrail
        header={
            <div ref={containerRef} style={{ display: "flex", alignItems: "center", width: "100%", minWidth: 0, overflow: "hidden" }}>
                <TabList selectedValue={selected} onTabSelect={handleTabSelect} size="small" style={{ display: "flex", minWidth: 0 }}>
                    {tabs.map(tab => {
                        const hidden = !visibleKeys.includes(tab.key);
                        return <div
                            key={tab.key}
                            ref={setItemRef(tab.key)}
                            style={hidden ? { visibility: "hidden", position: "absolute", pointerEvents: "none" } : undefined}
                        >
                            <Tab value={tab.key} title={tab.tooltip}>{tab.label}</Tab>
                        </div>;
                    })}
                </TabList>
                <OverflowTabMenu tabs={hiddenTabs} onSelect={handleOverflowSelect} />
                {running ?
                    <Button appearance="transparent" size="small" icon={<StopRegular />} title="Cancel SQL" aria-label="Cancel SQL" onClick={() => cancelSql(run.runId)} /> :
                    undefined
                }
            </div>
        }
        main={main}
        footer={
            selectedStatement && selected !== __VSCODE_ISSUES && selectedStatement.status !== "pending" && selectedStatement.status !== "executing" ?
                <div style={{ padding: "2px 6px", fontSize: "var(--vscode-font-size)", color: "var(--vscode-descriptionForeground)" }}>
                    {statementSummary(selectedStatement)}
                </div> :
                undefined
        }
    />;
};
