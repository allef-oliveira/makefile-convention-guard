import * as vscode from "vscode";

/**
 * Creates a range that replaces a full block of blank lines.
 *
 * The range starts at the first blank line and ends at the beginning of the
 * line after the blank-line block. Replacing this range with a single EOL keeps
 * exactly one blank line between sections.
 */
export function createBlankLineBlockReplaceRange(
  document: vscode.TextDocument,
  firstBlankLineIndex: number,
  lastBlankLineIndex: number,
): vscode.Range {
  const startPosition = new vscode.Position(firstBlankLineIndex, 0);
  const endPosition = createLineStartOrDocumentEndPosition(
    document,
    lastBlankLineIndex + 1,
  );

  return new vscode.Range(startPosition, endPosition);
}

/**
 * Creates a safe position at the start of a line or at the end of the document
 * when the requested line is outside the document.
 */
function createLineStartOrDocumentEndPosition(
  document: vscode.TextDocument,
  lineIndex: number,
): vscode.Position {
  if (lineIndex < document.lineCount) {
    return new vscode.Position(lineIndex, 0);
  }

  const lastLine = document.lineAt(document.lineCount - 1);

  return lastLine.range.end;
}
