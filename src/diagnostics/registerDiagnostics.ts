import * as vscode from "vscode";

import { EXTENSION_ID } from "../constants";
import { validateMakefileStyle } from "./validateMakefileStyle";

export function registerDiagnostics(context: vscode.ExtensionContext): void {
  const collection = vscode.languages.createDiagnosticCollection(EXTENSION_ID);

  const updateDiagnostics = (document: vscode.TextDocument): void => {
    if (!isMakefileDocument(document)) {
      return;
    }

    const diagnostics = validateMakefileStyle(document);

    collection.set(document.uri, diagnostics);
  };

  context.subscriptions.push(collection);

  context.subscriptions.push(
    vscode.workspace.onDidOpenTextDocument(updateDiagnostics),
  );

  context.subscriptions.push(
    vscode.workspace.onDidSaveTextDocument(updateDiagnostics),
  );

  context.subscriptions.push(
    vscode.workspace.onDidChangeTextDocument((event) => {
      updateDiagnostics(event.document);
    }),
  );

  context.subscriptions.push(
    vscode.workspace.onDidChangeConfiguration((event) => {
      if (!event.affectsConfiguration("makefileConventionGuard")) {
        return;
      }

      vscode.workspace.textDocuments.forEach(updateDiagnostics);
    }),
  );

  vscode.workspace.textDocuments.forEach(updateDiagnostics);
}

function isMakefileDocument(document: vscode.TextDocument) : boolean {
    return document.languageId === "makefile";
}
