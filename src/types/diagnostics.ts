import * as vscode from "vscode";

export type DiagnosticCode =
  | "trailing-whitespace"
  | "multiple-blank-lines"
  | "missing-final-newline"
  | "blank-line-before-recipe-command";

export interface MakefileDiagnosticRule {
  code: DiagnosticCode;
  validate(document: vscode.TextDocument): vscode.Diagnostic[];
}

export interface WhitespaceDiagnosticSettings {
  enabled: boolean;
  warnTrailingWhitespace: boolean;
  warnMultipleBlankLines: boolean;
  requireFinalNewline: boolean;
  warnBlankLineBeforeRecipeCommand: boolean;
}
