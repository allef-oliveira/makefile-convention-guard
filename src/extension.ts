import * as vscode from "vscode";

import { registerDiagnostics } from "./diagnostics/registerDiagnostics";

export function activate(context: vscode.ExtensionContext): void {
  registerDiagnostics(context);
}

export function deactivate(): void {}
