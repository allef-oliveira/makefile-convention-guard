import * as vscode from "vscode";

import { CONFIG_SECTION } from "../constants";
import type { WhitespaceDiagnosticSettings } from "../types/diagnostics";

export function getDiagnosticSettings(
  document: vscode.TextDocument,
): WhitespaceDiagnosticSettings {
  const config = vscode.workspace.getConfiguration(
    CONFIG_SECTION,
    document.uri,
  );

  return {
    enabled: config.get<boolean>("diagnostics.enabled", true),
    warnTrailingWhitespace: config.get<boolean>(
      "diagnostics.warnTrailingWhitespace",
      true,
    ),
    warnMultipleBlankLines: config.get<boolean>(
      "diagnostics.warnMultipleBlankLines",
      true,
    ),
    requireFinalNewline: config.get<boolean>(
      "diagnostics.requireFinalNewline",
      true,
    ),
    warnBlankLineBeforeRecipeCommand: config.get<boolean>(
      "diagnostics.warnBlankLineBeforeRecipeCommand",
      true,
    ),
  };
}
