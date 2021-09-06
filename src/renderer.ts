import type { ActivationFunction } from "vscode-notebook-renderer";
import { OJSRuntime } from "@hpcc-js/observable-md";

export const activate: ActivationFunction = context => ({
    renderOutputItem(data, element) {

        const runtime = new OJSRuntime(element);
        runtime.evaluate("", data.json().code);

        //  element.innerText = JSON.stringify(data.json());
    }
});
