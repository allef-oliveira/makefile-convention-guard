import * as vscode from "vscode";

import { registerCodeActions } from "./codeActions/registerCodeActions";
import { registerDiagnostics } from "./diagnostics/registerDiagnostics";
import { registerTargetView } from "./targets/registerTargetView";

/**
 * Activates the extension and registers Makefile diagnostics and quick fixes.
 */
export function activate(context: vscode.ExtensionContext): void {
  try {
    registerDiagnostics(context);
    registerCodeActions(context);
    registerTargetView(context);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("Makefile Convention Guard activation failed", error);
    void vscode.window.showErrorMessage(
      `Makefile Convention Guard não pôde ser ativada: ${message}`,
    );
  }
}

/**
 * Deactivates the extension.
 */
export function deactivate(): void {}
