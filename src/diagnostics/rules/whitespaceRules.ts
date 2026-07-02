import * as vscode from "vscode";

import { DIAGNOSTIC_CODES } from "../../constants";
import { DIAGNOSTIC_MESSAGES } from "../message";
import { createDiagnostic } from "../createDiagnostic";
import type { WhitespaceDiagnosticSettings } from "../../types/diagnostics";

export function validateWhitespaceRules(
  document: vscode.TextDocument,
  settings: WhitespaceDiagnosticSettings,
): vscode.Diagnostic[] {
  const diagnostics: vscode.Diagnostic[] = [];

  if (!settings.enabled) {
    return diagnostics;
  }

  const text = document.getText();
  const lines = text.split(/\r?\n/);

  if (settings.warnTrailingWhitespace) {
    diagnostics.push(...validateTrailingWhitespace(document, lines));
  }

  if (settings.warnMultipleBlankLines) {
    diagnostics.push(...validateMultipleBlankLines(document, lines));
  }

  if (settings.requireFinalNewline) {
    diagnostics.push(...validateFinalNewline(document, text, lines));
  }

  return diagnostics;
}

function validateTrailingWhitespace(
  document: vscode.TextDocument,
  lines: string[],
): vscode.Diagnostic[] {
  const diagnostics: vscode.Diagnostic[] = [];

  lines.forEach((line, lineIndex) => {
    const trailingWhitespaceMatch = line.match(/[ \t]+$/);

    if (
      !trailingWhitespaceMatch ||
      trailingWhitespaceMatch.index === undefined
    ) {
      return;
    }
    const startColumn = trailingWhitespaceMatch.index;

    diagnostics.push(
      createDiagnostic({
        document,
        lineIndex,
        startColumn,
        endColumn: line.length,
        message: DIAGNOSTIC_MESSAGES.TRAILING_WHITESPACE,
        code: DIAGNOSTIC_CODES.TRAILING_WHITESPACE,
      }),
    );
  });

  return diagnostics;
}

function validateMultipleBlankLines(
  document: vscode.TextDocument,
  lines: string[],
): vscode.Diagnostic[] {
  const diagnostics: vscode.Diagnostic[] = [];
  let consecutiveBlankLines = 0;

  lines.forEach((line, lineIndex) => {
    if (line.trim() === "") {
      consecutiveBlankLines += 1;

      if (consecutiveBlankLines >= 2) {
        diagnostics.push(
          createDiagnostic({
            document,
            lineIndex,
            startColumn: 0,
            endColumn: line.length,
            message: DIAGNOSTIC_MESSAGES.MULTIPLE_BLANK_LINES,
            code: DIAGNOSTIC_CODES.MULTIPLE_BLANK_LINES,
          }),
        );
      }

      return;
    }

    consecutiveBlankLines = 0;
  });

  return diagnostics;
}

function validateFinalNewline(
  document: vscode.TextDocument,
  text: string,
  lines: string[],
): vscode.Diagnostic[] {
  if (text.length === 0 || text.endsWith("\n")) {
    return [];
  }

  const lastLineIndex = Math.max(0, lines.length - 1);
  const lastLine = lines[lastLineIndex] ?? "";

  return [
    createDiagnostic({
      document,
      lineIndex: lastLineIndex,
      startColumn: lastLine.length,
      endColumn: lastLine.length,
      message: DIAGNOSTIC_MESSAGES.MISSING_FINAL_NEWLINE,
      code: DIAGNOSTIC_CODES.MISSING_FINAL_NEWLINE,
    }),
  ];
}
