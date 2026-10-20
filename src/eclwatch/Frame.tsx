import React from "react";
import { FluentProvider } from "@fluentui/react-components";
import { initTheme } from "./themeGenerator";
import { WUDetails } from "./WUDetails";
import { SQLDetails } from "./SQLDetails";
import { useMessageReceiver } from "./Message";

const theme = initTheme();

export const Frame: React.FunctionComponent = () => {

    const viewState = useMessageReceiver();

    return <FluentProvider theme={theme} style={{ height: "100%" }}>
        {
            viewState?.kind === "sql" ?
                <SQLDetails key={viewState.run.runId} run={viewState.run} /> :
                viewState?.kind === "wu" ?
                    <WUDetails key={`${viewState.state.wuid}-${viewState.state.resultName}`} opts={viewState.state} wuid={viewState.state.wuid} initialName={viewState.state.resultName ?? ""} /> :
                    <div>...loading...</div>
        }
    </FluentProvider>;
};
