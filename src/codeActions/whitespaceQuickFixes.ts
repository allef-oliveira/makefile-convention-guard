import * as vscode from "vscode";

import { DIAGNOSTIC_CODES } from "../constants";
import type { DiagnosticCode } from "../types/diagnostics";
import { createBlankLineBlockReplaceRange } from "../utils/blankLineRanges";
import { getDocumentEol } from "../utils/documentUtils";
import {
  createBlankLineBlockDeleteRange,
  findFirstBlankLineInBlock,
  findLastBlankLineInBlock,
  isBlankLineBlockBetweenTargetAndRecipe,
} from "../utils/helpers";

/**
 * Provides quick fixes for whitespace diagnostics reported by the extension.
 *
 * Each quick fix is selected based on the diagnostic code and applies a
 * WorkspaceEdit to the current Makefile document.
 */
export class WhitespaceQuickFixProvider implements vscode.CodeActionProvider {
  public static readonly providedCodeActionKinds: vscode.CodeActionKind[] = [
    vscode.CodeActionKind.QuickFix,
  ];

  public provideCodeActions(
    document: vscode.TextDocument,
    _range: vscode.Range | vscode.Selection,
    context: vscode.CodeActionContext,
  ): vscode.CodeAction[] {
    return context.diagnostics
      .map((diagnostic) => createQuickFix(document, diagnostic))
      .filter((action): action is vscode.CodeAction => action !== null);
  }
}

/**
 * Creates the appropriate quick fix for a diagnostic.
 */
function createQuickFix(
  document: vscode.TextDocument,
  diagnostic: vscode.Diagnostic,
): vscode.CodeAction | null {
  const code = getDiagnosticCode(diagnostic);

  switch (code) {
    case DIAGNOSTIC_CODES.TRAILING_WHITESPACE:
      return createRemoveTrailingWhitespaceFix(document, diagnostic);

    case DIAGNOSTIC_CODES.MULTIPLE_BLANK_LINES:
      return createRemoveMultipleBlankLinesFix(document, diagnostic);

    case DIAGNOSTIC_CODES.MISSING_FINAL_NEWLINE:
      return createAddFinalNewlineFix(document, diagnostic);

    case DIAGNOSTIC_CODES.BLANK_LINE_BEFORE_RECIPE_COMMAND:
      return createRemoveBlankLinesBeforeRecipeCommandFix(document, diagnostic);

    default:
      return null;
  }
}

/**
 * Creates a quick fix to remove spaces or tabs at the end of a line.
 */
function createRemoveTrailingWhitespaceFix(
  document: vscode.TextDocument,
  diagnostic: vscode.Diagnostic,
): vscode.CodeAction {
  const action = new vscode.CodeAction(
    "Remove trailing whitespace",
    vscode.CodeActionKind.QuickFix,
  );

  action.diagnostics = [diagnostic];
  action.isPreferred = true;

  const edit = new vscode.WorkspaceEdit();

  edit.delete(document.uri, diagnostic.range);

  action.edit = edit;

  return action;
}

/**
 * Creates a quick fix to remove extra blank lines.
 *
 * In general, it keeps one blank line between sections.
 * However, when the blank-line block is between a Makefile target and its
 * recipe command, it removes all blank lines so the command stays directly
 * below the target.
 */
function createRemoveMultipleBlankLinesFix(
  document: vscode.TextDocument,
  diagnostic: vscode.Diagnostic,
): vscode.CodeAction {
  const action = new vscode.CodeAction(
    "Remove extra blank lines",
    vscode.CodeActionKind.QuickFix,
  );

  action.diagnostics = [diagnostic];
  action.isPreferred = true;

  const edit = new vscode.WorkspaceEdit();

  const diagnosticLineIndex = diagnostic.range.start.line;
  const firstBlankLineIndex = findFirstBlankLineInBlock(
    document,
    diagnosticLineIndex,
  );
  const lastBlankLineIndex = findLastBlankLineInBlock(
    document,
    diagnosticLineIndex,
  );

  if (
    isBlankLineBlockBetweenTargetAndRecipe(
      document,
      firstBlankLineIndex,
      lastBlankLineIndex,
    )
  ) {
    const deleteRange = createBlankLineBlockDeleteRange(
      document,
      firstBlankLineIndex,
      lastBlankLineIndex,
    );

    edit.delete(document.uri, deleteRange);
    action.edit = edit;

    return action;
  }

  const replaceRange = createBlankLineBlockReplaceRange(
    document,
    firstBlankLineIndex,
    lastBlankLineIndex,
  );

  edit.replace(document.uri, replaceRange, getDocumentEol(document));

  action.edit = edit;

  return action;
}

/**
 * Creates a quick fix to insert a missing final newline at the end of the file.
 */
function createAddFinalNewlineFix(
  document: vscode.TextDocument,
  diagnostic: vscode.Diagnostic,
): vscode.CodeAction {
  const action = new vscode.CodeAction(
    "Add final newline",
    vscode.CodeActionKind.QuickFix,
  );

  action.diagnostics = [diagnostic];
  action.isPreferred = true;

  const edit = new vscode.WorkspaceEdit();
  const endPosition = document.positionAt(document.getText().length);

  edit.insert(document.uri, endPosition, getDocumentEol(document));

  action.edit = edit;

  return action;
}

/**
 * Creates a quick fix to remove all blank lines between a Makefile target
 * and its first recipe command.
 */
function createRemoveBlankLinesBeforeRecipeCommandFix(
  document: vscode.TextDocument,
  diagnostic: vscode.Diagnostic,
): vscode.CodeAction {
  const action = new vscode.CodeAction(
    "Remove blank lines before recipe command",
    vscode.CodeActionKind.QuickFix,
  );

  action.diagnostics = [diagnostic];
  action.isPreferred = true;

  const edit = new vscode.WorkspaceEdit();

  const firstBlankLineIndex = diagnostic.range.start.line;
  const lastBlankLineIndex = findLastBlankLineInBlock(
    document,
    firstBlankLineIndex,
  );
  const deleteRange = createBlankLineBlockDeleteRange(
    document,
    firstBlankLineIndex,
    lastBlankLineIndex,
  );

  edit.delete(document.uri, deleteRange);

  action.edit = edit;

  return action;
}

/**
 * Normalizes the diagnostic code value to the project DiagnosticCode type.
 */
function getDiagnosticCode(
  diagnostic: vscode.Diagnostic,
): DiagnosticCode | undefined {
  if (typeof diagnostic.code === "string") {
    return diagnostic.code as DiagnosticCode;
  }

  if (
    diagnostic.code &&
    typeof diagnostic.code === "object" &&
    "value" in diagnostic.code &&
    typeof diagnostic.code.value === "string"
  ) {
    return diagnostic.code.value as DiagnosticCode;
  }

  return undefined;
}
