import * as React from "react";
import { Workunit, WUInfo, Result } from "@hpcc-js/comms";
import { ILabelStyles } from "@fluentui/react/lib/Label";
import { Pivot, PivotItem, IPivotStyles, IPivotItemProps } from "@fluentui/react/lib/Pivot";
import { IStyleSet } from "@fluentui/react/lib/Styling";
import { WUIssues, WUResult } from "./WUResult";

const bodyStyles = window.getComputedStyle(document.body);

const pivotStyles: Partial<IStyleSet<IPivotStyles>> = {
    link: {
        fontSize: bodyStyles.getPropertyValue("--vscode-font-size"),
        lineHeight: 32,
        height: 32
    },
    linkIsSelected: {
        fontSize: bodyStyles.getPropertyValue("--vscode-font-size"),
        lineHeight: 32,
        height: 32
    },
};

const labelStyles: Partial<IStyleSet<ILabelStyles>> = {
    root: { marginTop: 10 },
};

const getTabId = (itemKey: string) => {
    return itemKey;
};

export interface WUDetailsProps {
    baseUrl: string;
    wuid: string;
    sequence?: number;
    width: number;
    height: number;
}

export const WUDetails: React.FunctionComponent<WUDetailsProps> = ({
    baseUrl,
    wuid,
    sequence,
    width,
    height
}) => {

    const pivotRef = React.useRef<HTMLDivElement>(null);

    const [bodyHeight, setBodyHeight] = React.useState(0);

    const [selectedKey, setSelectedKey] = React.useState(undefined);
    const handleLinkClick = (item: PivotItem) => {
        setSelectedKey(item.props.itemKey!);
    };

    const [exceptions, setExceptions] = React.useState<WUInfo.ECLException[]>([]);
    const [results, setResults] = React.useState<Result[]>([]);

    React.useEffect(() => {
        const wu = Workunit.attach({ baseUrl }, wuid);
        if (wu.isComplete()) {
            wu.fetchECLExceptions().then(exceptions => setExceptions([...exceptions]));
            wu.fetchResults().then(results => setResults([...results]));
        } else {
            let prevStateID;
            wu.watchUntilComplete(() => {
                if (prevStateID !== wu.StateID) {
                    prevStateID = wu.StateID;
                    wu.fetchECLExceptions().then(exceptions => setExceptions([...exceptions]));
                    wu.fetchResults().then(results => setResults([...results]));
                }
            });
        }
    }, [baseUrl, wuid]);

    React.useEffect(() => {
        setSelectedKey(isNaN(sequence) ? undefined : "" + sequence);
    }, [sequence]);

    if (pivotRef.current) {
        const newHeight = height - pivotRef.current.clientHeight;
        if (bodyHeight !== newHeight) {
            setBodyHeight(newHeight);
        }
    }

    const hasIssues = exceptions.length;
    const hasResults = results.length;
    let selected;
    if (selectedKey === "") {
        if (hasResults) {
            selected = "" + 0;
        }
    }

    return <>
        <div ref={pivotRef}>
            {
                exceptions.length > 0 || results.length > 0 ?
                    <Pivot styles={pivotStyles} selectedKey={selectedKey} onLinkClick={handleLinkClick} headersOnly={true}>
                        {[
                            ...(exceptions.length ? [<PivotItem key={"issues"} itemKey={"issues"} headerText={"Issues"} />] : []),
                            ...results.map(r => <PivotItem key={`${r.Wuid}:: ${r.Sequence}`} itemKey={"" + r.Sequence} headerText={r.Name} />)
                        ]}
                    </Pivot>
                    : undefined
            }
        </div>
        {
            selectedKey === "issues" || (selectedKey === undefined && hasIssues) ?
                <WUIssues exceptions={exceptions} width={width} height={bodyHeight} />
                : results.length > 0 && bodyHeight > 0 ?
                    <WUResult baseUrl={baseUrl} wuid={wuid} sequence={results.length > parseInt(selectedKey) ? parseInt(selectedKey) : 0} width={width} height={bodyHeight} />
                    : undefined
        }
    </>;
};
