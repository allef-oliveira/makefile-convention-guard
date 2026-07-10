import * as vscode from "vscode";

import { registerCodeActions } from "./codeActions/registerCodeActions";
import { registerDiagnostics } from "./diagnostics/registerDiagnostics";

/**
 * Activates the extension and registers Makefile diagnostics and quick fixes.
 */
export function activate(context: vscode.ExtensionContext): void {
  registerDiagnostics(context);
  registerCodeActions(context);
}

/**
 * Deactivates the extension.
 */
export function deactivate(): void {}
