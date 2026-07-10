import * as vscode from "vscode";
import { isMakeTargetLine, isRecipeCommandLine } from "../makefile/parser";

/**
 * Finds the first blank line in the current consecutive blank-line block.
 */
export function findFirstBlankLineInBlock(
  document: vscode.TextDocument,
  lineIndex: number,
): number {
  let currentLineIndex = lineIndex;

  while (
    currentLineIndex > 0 &&
    isBlankDocumentLine(document, currentLineIndex - 1)
  ) {
    currentLineIndex -= 1;
  }

  return currentLineIndex;
}

/**
 * Finds the last blank line in the current consecutive blank-line block.
 */
export function findLastBlankLineInBlock(
  document: vscode.TextDocument,
  lineIndex: number,
): number {
  let currentLineIndex = lineIndex;

  while (
    currentLineIndex + 1 < document.lineCount &&
    isBlankDocumentLine(document, currentLineIndex + 1)
  ) {
    currentLineIndex += 1;
  }

  return currentLineIndex;
}

/**
 * Checks whether a document line is blank.
 */
export function isBlankDocumentLine(
  document: vscode.TextDocument,
  lineIndex: number,
): boolean {
  return document.lineAt(lineIndex).text.trim() === "";
}

/**
 * Creates a range that removes complete lines from startLineIndex to
 * endLineIndex, including line breaks when possible.
 */
export function createFullLinesDeleteRange(
  document: vscode.TextDocument,
  startLineIndex: number,
  endLineIndex: number,
): vscode.Range {
  const start = new vscode.Position(startLineIndex, 0);

  if (endLineIndex + 1 < document.lineCount) {
    return new vscode.Range(
      start,
      new vscode.Position(endLineIndex + 1, 0),
    );
  }

  return new vscode.Range(
    start,
    document.lineAt(endLineIndex).range.end,
  );
}

/**
 * Checks whether a blank-line block is located between a Makefile target
 * and its first recipe command.
 */
export function isBlankLineBlockBetweenTargetAndRecipe(
  document: vscode.TextDocument,
  firstBlankLineIndex: number,
  lastBlankLineIndex: number,
): boolean {
  const previousLineIndex = firstBlankLineIndex - 1;
  const nextLineIndex = lastBlankLineIndex + 1;

  if (previousLineIndex < 0 || nextLineIndex >= document.lineCount) {
    return false;
  }

  const previousLine = document.lineAt(previousLineIndex).text;
  const nextLine = document.lineAt(nextLineIndex).text;

  return isMakeTargetLine(previousLine) && isRecipeCommandLine(nextLine);
}

/**
 * Creates a range that removes the entire blank-line block.
 */
export function createBlankLineBlockDeleteRange(
  document: vscode.TextDocument,
  firstBlankLineIndex: number,
  lastBlankLineIndex: number,
): vscode.Range {
  const start = new vscode.Position(firstBlankLineIndex, 0);

  if (lastBlankLineIndex + 1 < document.lineCount) {
    return new vscode.Range(
      start,
      new vscode.Position(lastBlankLineIndex + 1, 0),
    );
  }

  return new vscode.Range(start, document.positionAt(document.getText().length));
}