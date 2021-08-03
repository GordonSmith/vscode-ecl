import * as vscode from "vscode";
import { activate as dashyActivate } from "./dashy/main";
import { activate as eclActivate } from "./ecl/main";
import { activate as kelActivate } from "./kel/main";
import { activate as ojsActivate } from "./ojs/index";

export function activate(ctx: vscode.ExtensionContext) {
    eclActivate(ctx);
    kelActivate(ctx);
    dashyActivate(ctx);
    ojsActivate(ctx);
}
