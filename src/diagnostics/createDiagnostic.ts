import * as vscode from "vscode";

import { DIAGNOSTIC_SOURCE } from "../constants";
import type { DiagnosticCode } from "../types/diagnostics";

interface CreateDiagnosticParams {
  document: vscode.TextDocument;
  lineIndex: number;
  startColumn: number;
  endColumn: number;
  message: string;
  code: DiagnosticCode;
  severity?: vscode.DiagnosticSeverity;
}

export function createDiagnostic({
  document: _,
  lineIndex,
  startColumn,
  endColumn,
  message,
  code,
  severity = vscode.DiagnosticSeverity.Warning,
}: CreateDiagnosticParams): vscode.Diagnostic {
  const diagnostic = new vscode.Diagnostic(
    new vscode.Range(
      new vscode.Position(lineIndex, startColumn),
      new vscode.Position(lineIndex, endColumn),
    ),
    message,
    severity,
  );

  diagnostic.source = DIAGNOSTIC_SOURCE;
  diagnostic.code = code;

  return diagnostic;
}