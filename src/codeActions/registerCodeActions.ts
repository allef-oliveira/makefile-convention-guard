import * as vscode from "vscode";

import { WhitespaceQuickFixProvider } from "./whitespaceQuickFixes";

/**
 * Registers all code action providers used by the extension.
 */
export function registerCodeActions(context: vscode.ExtensionContext): void {
  context.subscriptions.push(
    vscode.languages.registerCodeActionsProvider(
      { language: "makefile", scheme: "file" },
      new WhitespaceQuickFixProvider(),
      {
        providedCodeActionKinds:
          WhitespaceQuickFixProvider.providedCodeActionKinds,
      },
    ),
  );
}
