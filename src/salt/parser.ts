import * as vscode from "vscode";
import { Antlr4Error, ErrorListener } from "../util/errorListener";

import * as antlr4 from "antlr4";
import { SaltLexer } from "../grammar/salt/SaltLexer";
import { SaltParser } from "../grammar/salt/SaltParser";
// import { SALTParserVisitor } from "../../src/grammar/salt/SALTParserVisitor";

interface Parsed {
    errors: Antlr4Error[];
}

export const isBoolean = (str: string) => str === "boolean";
export const isString = (str: string) => str === "string";
export const isNumber = (str: string) => str === "number";
export function parse(doc: vscode.TextDocument): Parsed {
    const errorListener = new ErrorListener(doc);
    const retVal: Parsed = {
        errors: []
    };
    const chars = new antlr4.InputStream(doc.getText());
    const lexer = new SaltLexer(chars);
    const tokens = new antlr4.CommonTokenStream(lexer);
    const parser: any = new SaltParser(tokens);
    parser.buildParseTrees = true;
    parser.removeErrorListeners();
    parser.addErrorListener(errorListener);
    try {
        parser.spc();
        //  TODO
        // const visitor = new SALTParserVisitor();
        // antlr4.tree.ParseTreeWalker.DEFAULT.walk(visitor, tree);
    } catch (e) {
        console.log(e);
    }
    retVal.errors = errorListener.errors;
    return retVal;
}
