import * as vscode from "vscode";

import { DIAGNOSTIC_CODES } from "../../constants";
import type {
  DiagnosticCode,
  WhitespaceDiagnosticSettings,
} from "../../types/diagnostics";
import { createDiagnostic } from "../createDiagnostic";
import { DIAGNOSTIC_MESSAGES } from "../message";
import {
  analyzeWhitespaceRules,
  type WhitespaceDiagnosticFinding,
} from "./whitespaceAnalyzer";

/**
 * Whitespace diagnostic rules for Makefile documents.
 *
 * This module adapts pure whitespace rule findings into VS Code diagnostics.
 * The actual rule analysis is implemented in whitespaceAnalyzer.ts so it can
 * be tested without loading the VS Code Extension Host.
 */
export function validateWhitespaceRules(
  document: vscode.TextDocument,
  settings: WhitespaceDiagnosticSettings,
): vscode.Diagnostic[] {
  const text = document.getText();
  const findings = analyzeWhitespaceRules(text, settings);

  return findings.map((finding) => createWhitespaceDiagnostic(document, finding));
}

/**
 * Converts a pure whitespace finding into a VS Code diagnostic.
 */
function createWhitespaceDiagnostic(
  document: vscode.TextDocument,
  finding: WhitespaceDiagnosticFinding,
): vscode.Diagnostic {
  return createDiagnostic({
    document,
    lineIndex: finding.lineIndex,
    startColumn: finding.startColumn,
    endColumn: finding.endColumn,
    message: getDiagnosticMessage(finding.code),
    code: finding.code,
  });
}

/**
 * Resolves the user-facing diagnostic message for each whitespace rule code.
 */
function getDiagnosticMessage(code: DiagnosticCode): string {
  switch (code) {
    case DIAGNOSTIC_CODES.TRAILING_WHITESPACE:
      return DIAGNOSTIC_MESSAGES.TRAILING_WHITESPACE;

    case DIAGNOSTIC_CODES.MULTIPLE_BLANK_LINES:
      return DIAGNOSTIC_MESSAGES.MULTIPLE_BLANK_LINES;

    case DIAGNOSTIC_CODES.MISSING_FINAL_NEWLINE:
      return DIAGNOSTIC_MESSAGES.MISSING_FINAL_NEWLINE;

    case DIAGNOSTIC_CODES.BLANK_LINE_BEFORE_RECIPE_COMMAND:
      return DIAGNOSTIC_MESSAGES.BLANK_LINE_BEFORE_RECIPE_COMMAND;

    default:
      return "Makefile whitespace convention warning.";
  }
}
