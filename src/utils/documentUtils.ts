import * as vscode from "vscode";

/**
 * Returns the end-of-line sequence used by the current document.
 *
 * This keeps quick fixes consistent with the file line ending style,
 * preserving LF or CRLF when applying text edits.
 */
export function getDocumentEol(document: vscode.TextDocument): string {
  return document.eol === vscode.EndOfLine.CRLF ? "\r\n" : "\n";
}
