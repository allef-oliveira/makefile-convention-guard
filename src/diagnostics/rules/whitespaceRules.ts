import * as vscode from "vscode";

import { DIAGNOSTIC_CODES } from "../../constants";
import { isMakeTargetLine, isRecipeCommandLine } from "../../makefile/parser";
import type { WhitespaceDiagnosticSettings } from "../../types/diagnostics";
import {
  findTrailingWhitespaceStart,
  hasFinalNewline,
  splitLines,
} from "../../utils/lineUtils";
import { createDiagnostic } from "../createDiagnostic";
import { DIAGNOSTIC_MESSAGES } from "../message";


export function validateWhitespaceRules(
  document: vscode.TextDocument,
  settings: WhitespaceDiagnosticSettings,
): vscode.Diagnostic[] {
  const diagnostics: vscode.Diagnostic[] = [];

  if (!settings.enabled) {
    return diagnostics;
  }

  const text = document.getText();
  const lines = splitLines(text);

  if (settings.warnTrailingWhitespace) {
    diagnostics.push(...validateTrailingWhitespace(document, lines));
  }

  if (settings.warnMultipleBlankLines) {
    diagnostics.push(...validateMultipleBlankLines(document, lines));
  }

  if (settings.requireFinalNewline) {
    diagnostics.push(...validateFinalNewline(document, text, lines));
  }

  if (settings.warnBlankLineBeforeRecipeCommand) {
    diagnostics.push(...validateBlankLineBeforeRecipeCommand(document, lines));
  }

  return diagnostics;
}

function validateTrailingWhitespace(
  document: vscode.TextDocument,
  lines: string[],
): vscode.Diagnostic[] {
  const diagnostics: vscode.Diagnostic[] = [];

  lines.forEach((line, lineIndex) => {
    const startColumn = findTrailingWhitespaceStart(line);

    if (startColumn === null) {
      return;
    }

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
  if (hasFinalNewline(text)) {
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

function validateBlankLineBeforeRecipeCommand(
  document: vscode.TextDocument,
  lines: string[],
): vscode.Diagnostic[] {
  const diagnostics: vscode.Diagnostic[] = [];

  for (let lineIndex = 0; lineIndex + 2 < lines.length; lineIndex += 1) {
    const currentLine = lines[lineIndex] ?? "";
    const nextLine = lines[lineIndex + 1] ?? "";
    const followingLine = lines[lineIndex + 2] ?? "";

    if (!isMakeTargetLine(currentLine)) {
      continue;
    }

    if (nextLine.trim() !== "") {
      continue;
    }

    if (!isRecipeCommandLine(followingLine)) {
      continue;
    }

    diagnostics.push(
      createDiagnostic({
        document,
        lineIndex: lineIndex + 1,
        startColumn: 0,
        endColumn: nextLine.length,
        message: DIAGNOSTIC_MESSAGES.BLANK_LINE_BEFORE_RECIPE_COMMAND,
        code: DIAGNOSTIC_CODES.BLANK_LINE_BEFORE_RECIPE_COMMAND,
      }),
    );
  }

  return diagnostics;
}
