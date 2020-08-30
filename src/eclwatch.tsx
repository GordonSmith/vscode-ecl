import * as React from "react";
import * as ReactDOM from "react-dom";
import { Palette } from "@hpcc-js/common";
import { WUDetails } from "./eclwatch/WUDetails";
import { ThemeProvider } from "./eclwatch/themeGenerator";

const bodyStyles = window.getComputedStyle(document.body);

const backColor = bodyStyles.getPropertyValue("--vscode-editor-background");
const foreColour = bodyStyles.getPropertyValue("--vscode-input-foreground");//Palette.textColor(backColor);

const placeholder = document.getElementById("placeholder");

const themeProvider = new ThemeProvider(foreColour, backColor);
themeProvider.loadThemeForColor(bodyStyles.getPropertyValue("--vscode-progressBar-background"));

interface VSCodeAPI {
    postMessage: <T extends Message>(msg: T) => void;
    setState: (newState) => void;
    getState: () => any;
}

declare const acquireVsCodeApi: () => VSCodeAPI;

const vscode = acquireVsCodeApi();

interface Message {
    callbackID?: string;
}

interface LoadedMessage extends Message {
    command: "loaded";
}

export type Messages = LoadedMessage;

window.addEventListener("message", function (event) {
    const message = event.data; // The JSON data our extension sent
    switch (message.command) {
        case "navigate":
            render(message.data.config.protocol, message.data.config.serverAddress, message.data.config.port, message.data.wuid, message.data.result);
            break;
    }
});

// const oldState = vscode.getState() || { url: "" };
// const iframe: HTMLIFrameElement = document.getElementById("myFrame") as any;
// iframe.src = oldState.url;

vscode.postMessage<LoadedMessage>({
    command: "loaded"
});

let prevProtocol;
let prevServerAddress;
let prevPort;
let prevWuid;
let prevResult;
function render(protocol, serverAddress, port, wuid, result) {
    prevProtocol = protocol;
    prevServerAddress = serverAddress;
    prevPort = port;
    prevWuid = wuid;
    prevResult = result;
    const clientRect = placeholder.getBoundingClientRect();
    ReactDOM.render(<WUDetails
        baseUrl={`${protocol}://${serverAddress}:${port}`}
        wuid={wuid}
        sequence={result}
        width={clientRect.width}
        height={clientRect.height}
    />, placeholder);

}

//  Local debugging without VS Code
if (document.location.protocol === "file:") {
    render("https", "play.hpccsystems.com", "18010", "W20200904-185046", 2);
}

window.addEventListener("resize", () => {
    if (prevProtocol) {
        render(prevProtocol, prevServerAddress, prevPort, prevWuid, prevResult);
    }
});
