import * as vscode from "vscode";
import { Antlr4Error, ErrorListener } from "../util/errorListener";

import * as antlr4 from "antlr4";
import { SALTLexer } from "../../src/grammar/salt/SaltLexer";
import { SALTParser } from "../../src/grammar/salt/SaltParser";
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
    const lexer = new SALTLexer(chars);
    const tokens = new antlr4.CommonTokenStream(lexer);
    const parser = new SALTParser(tokens);
    parser.buildParseTrees = true;
    parser.removeErrorListeners();
    parser.addErrorListener(errorListener);
    try {
        parser.program();
        //  TODO
        // const visitor = new SALTParserVisitor();
        // antlr4.tree.ParseTreeWalker.DEFAULT.walk(visitor, tree);
    } catch (e) {
        console.log(e);
    }
    retVal.errors = errorListener.errors;
    return retVal;
}
