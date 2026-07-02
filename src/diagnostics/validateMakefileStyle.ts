import * as vscode from "vscode";

import { getDiagnosticSettings } from "../config/getDiagnosticSettings";
import { validateWhitespaceRules } from "./rules/whitespaceRules";

export function validateMakefileStyle(
  document: vscode.TextDocument,
): vscode.Diagnostic[] {
  const settings = getDiagnosticSettings(document);

  if (!settings.enabled) {
    return [];
  }

  return validateWhitespaceRules(document, settings);
}
