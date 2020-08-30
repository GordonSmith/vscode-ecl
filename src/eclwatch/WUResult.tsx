import * as React from "react";
import { publish } from "@hpcc-js/common";
import { Result } from "@hpcc-js/comms";
import { WUInfo } from "@hpcc-js/comms";
import { Common, Table } from "@hpcc-js/dgrid";
import { hashSum } from "@hpcc-js/util";
import { VisualizationComponent } from "./hpccVizAdapter";
import { Store } from "./WUResultStore";

import "../../src/eclwatch/WUResult.css";

export class WUResultTable extends Common {
    protected _prevHash: string;

    constructor() {
        super();
    }

    @publish(undefined, "string", "URL to WsWorkunits")
    baseUrl: { (): string, (_: string): WUResultTable };
    @publish(undefined, "string", "Workunit ID")
    wuid: { (): string, (_: string): WUResultTable };
    @publish(undefined, "string", "Result Name")
    resultName: { (): string, (_: string): WUResultTable };
    @publish(undefined, "number", "Sequence Number")
    sequence: { (): number, (_: number): WUResultTable };
    @publish("", "string", "Logical File Name")
    logicalFile: { (): string, (_: string): WUResultTable };

    calcResult(): Result | null {
        if (this.wuid() && this.resultName()) {
            return new Result({ baseUrl: this.baseUrl() }, this.wuid(), this.resultName());
        } else if (this.wuid() && this.sequence() !== undefined) {
            return new Result({ baseUrl: this.baseUrl() }, this.wuid(), this.sequence());
        } else if (this.logicalFile()) {
            return new Result({ baseUrl: this.baseUrl() }, this.logicalFile());
        }
        return null;
    }

    update(domNode, element) {
        super.update(domNode, element);
        const hash = hashSum({
            wsWorkunitsUrl: this.baseUrl(),
            wuid: this.wuid(),
            resultName: this.resultName(),
            sequence: this.sequence(),
            logicalFile: this.logicalFile()
        });
        if (this._prevHash !== hash) {
            this._prevHash = hash;
            const result = this.calcResult();
            if (result) {
                result.fetchXMLSchema().then((schema) => {
                    const store = new Store(result, schema, this.renderHtml());
                    this._dgrid.set("columns", store.columns());
                    this._dgrid.set("collection", store);
                });
            }
        }
    }

    click(row, col, sel) {
    }
}
WUResultTable.prototype._class += " eclwatch_WUResultTable";

interface WUResultProps {
    baseUrl: string;
    wuid: string;
    sequence: number;
    width: number;
    height: number;
}

export const WUResult: React.FunctionComponent<WUResultProps> = ({
    baseUrl,
    wuid,
    sequence,
    width,
    height
}) => {

    const table = React.useRef(
        new WUResultTable()
    ).current;

    table
        .baseUrl(baseUrl)
        .wuid(wuid)
        .sequence(sequence)
        ;

    return <VisualizationComponent widget={table} width={width} height={height} >
    </VisualizationComponent>;
};

interface WUIssues {
    exceptions: WUInfo.ECLException[];
    width: number;
    height: number;
}

export const WUIssues: React.FunctionComponent<WUIssues> = ({
    exceptions,
    width,
    height
}) => {

    const table = React.useRef(
        new Table()
    ).current;

    table
        .columns(["Severity", "Source", "Code", "Message", "Col", "Line", "File Name"])
        .data(exceptions.map(e => [e.Severity, e.Source, e.Code, e.Message, e.Column, e.LineNo, e.FileName]))
        ;

    return <VisualizationComponent widget={table} width={width} height={height} >
    </VisualizationComponent>;
};
