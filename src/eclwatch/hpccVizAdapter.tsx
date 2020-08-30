import * as React from "react";
import { Widget } from "@hpcc-js/common";

export interface VisualizationProps {
    widget: Widget;
    width: number;
    height: number;
}

let g_id = 0;
export const VisualizationComponent: React.FunctionComponent<VisualizationProps> = ({
    widget,
    width,
    height
}) => {

    const divRef = React.createRef<HTMLDivElement>();

    const [divID] = React.useState("viz-component-" + ++g_id);

    React.useEffect(() => {
        widget
            .target(divID)
            .resize({ width, height })
            .render()
            ;
        return () => {
            widget.target(null);
        };
    }, []);

    if (widget.target()) {
        widget
            .resize({ width, height })
            .lazyRender()
            ;
    }

    return <div ref={divRef} id={divID}></div>;
};
