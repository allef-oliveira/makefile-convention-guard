import { DIAGNOSTIC_CODES } from "../../constants";
import { isMakeTargetLine, isRecipeCommandLine } from "../../makefile/parser";
import type {
  DiagnosticCode,
  WhitespaceDiagnosticSettings,
} from "../../types/diagnostics";
import {
  findTrailingWhitespaceStart,
  getLine,
  hasFinalNewline,
  isBlankLine,
  splitLines,
} from "../../utils/lineUtils";

/**
 * Represents a whitespace rule finding without depending on the VS Code API.
 *
 * This structure is intentionally simple so it can be tested with unit tests
 * and later converted into a vscode.Diagnostic by the extension layer.
 */
export interface WhitespaceDiagnosticFinding {
  code: DiagnosticCode;
  lineIndex: number;
  startColumn: number;
  endColumn: number;
}

/**
 * Runs all enabled whitespace diagnostic rules against a text document content.
 */
export function analyzeWhitespaceRules(
  text: string,
  settings: WhitespaceDiagnosticSettings,
): WhitespaceDiagnosticFinding[] {
  const findings: WhitespaceDiagnosticFinding[] = [];

  if (!settings.enabled) {
    return findings;
  }

  const lines = splitLines(text);

  if (settings.warnTrailingWhitespace) {
    findings.push(...findTrailingWhitespace(lines));
  }

  if (settings.warnMultipleBlankLines) {
    findings.push(...findMultipleBlankLines(lines));
  }

  if (settings.requireFinalNewline) {
    findings.push(...findMissingFinalNewline(text, lines));
  }

  if (settings.warnBlankLineBeforeRecipeCommand) {
    findings.push(...findBlankLineBeforeRecipeCommand(lines));
  }

  return findings;
}

/**
 * Finds spaces or tabs left at the end of each line.
 */
function findTrailingWhitespace(lines: string[]): WhitespaceDiagnosticFinding[] {
  const findings: WhitespaceDiagnosticFinding[] = [];

  lines.forEach((line, lineIndex) => {
    const startColumn = findTrailingWhitespaceStart(line);

    if (startColumn === null) {
      return;
    }

    findings.push({
      code: DIAGNOSTIC_CODES.TRAILING_WHITESPACE,
      lineIndex,
      startColumn,
      endColumn: line.length,
    });
  });

  return findings;
}

/**
 * Finds two or more consecutive blank lines.
 */
function findMultipleBlankLines(lines: string[]): WhitespaceDiagnosticFinding[] {
  const findings: WhitespaceDiagnosticFinding[] = [];
  let consecutiveBlankLines = 0;

  lines.forEach((line, lineIndex) => {
    if (isBlankLine(line)) {
      consecutiveBlankLines += 1;

      if (consecutiveBlankLines >= 2) {
        findings.push({
          code: DIAGNOSTIC_CODES.MULTIPLE_BLANK_LINES,
          lineIndex,
          startColumn: 0,
          endColumn: line.length,
        });
      }

      return;
    }

    consecutiveBlankLines = 0;
  });

  return findings;
}

/**
 * Finds documents that do not end with a final newline.
 */
function findMissingFinalNewline(
  text: string,
  lines: string[],
): WhitespaceDiagnosticFinding[] {
  if (hasFinalNewline(text)) {
    return [];
  }

  const lastLineIndex = Math.max(0, lines.length - 1);
  const lastLine = getLine(lines, lastLineIndex);

  return [
    {
      code: DIAGNOSTIC_CODES.MISSING_FINAL_NEWLINE,
      lineIndex: lastLineIndex,
      startColumn: lastLine.length,
      endColumn: lastLine.length,
    },
  ];
}

/**
 * Finds one or more blank lines between a Makefile target and its first recipe command.
 */
function findBlankLineBeforeRecipeCommand(
  lines: string[],
): WhitespaceDiagnosticFinding[] {
  const findings: WhitespaceDiagnosticFinding[] = [];

  for (let lineIndex = 0; lineIndex + 1 < lines.length; lineIndex += 1) {
    const currentLine = getLine(lines, lineIndex);

    if (!isMakeTargetLine(currentLine)) {
      continue;
    }

    const firstBlankLineIndex = lineIndex + 1;

    if (!isBlankLine(getLine(lines, firstBlankLineIndex))) {
      continue;
    }

    let nextNonBlankLineIndex = firstBlankLineIndex;

    while (
      nextNonBlankLineIndex < lines.length &&
      isBlankLine(getLine(lines, nextNonBlankLineIndex))
    ) {
      nextNonBlankLineIndex += 1;
    }

    const nextNonBlankLine = getLine(lines, nextNonBlankLineIndex);

    if (!isRecipeCommandLine(nextNonBlankLine)) {
      continue;
    }

    findings.push({
      code: DIAGNOSTIC_CODES.BLANK_LINE_BEFORE_RECIPE_COMMAND,
      lineIndex: firstBlankLineIndex,
      startColumn: 0,
      endColumn: getLine(lines, firstBlankLineIndex).length,
    });
  }

  return findings;
}
