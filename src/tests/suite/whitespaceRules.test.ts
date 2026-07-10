import * as assert from "assert";
import * as vscode from "vscode";

import { DIAGNOSTIC_CODES } from "../../constants";
import { validateWhitespaceRules } from "../../diagnostics/rules/whitespaceRules";
import type { WhitespaceDiagnosticSettings } from "../../types/diagnostics";

const defaultSettings: WhitespaceDiagnosticSettings = {
  enabled: true,
  warnTrailingWhitespace: true,
  warnMultipleBlankLines: true,
  requireFinalNewline: true,
  warnBlankLineBeforeRecipeCommand: true,
};

suite("Whitespace diagnostics", () => {
  test("warns about trailing whitespace", async () => {
    const document = await createMakefileDocument("NODE_VERSION := 22   \n");

    const diagnostics = validateWhitespaceRules(document, defaultSettings);

    assertHasDiagnosticCode(
      diagnostics,
      DIAGNOSTIC_CODES.TRAILING_WHITESPACE,
    );
  });

  test("warns about multiple consecutive blank lines", async () => {
    const document = await createMakefileDocument("A := 1\n\n\nB := 2\n");

    const diagnostics = validateWhitespaceRules(document, defaultSettings);

    assertHasDiagnosticCode(
      diagnostics,
      DIAGNOSTIC_CODES.MULTIPLE_BLANK_LINES,
    );
  });

  test("warns about missing final newline", async () => {
    const document = await createMakefileDocument("A := 1");

    const diagnostics = validateWhitespaceRules(document, defaultSettings);

    assertHasDiagnosticCode(
      diagnostics,
      DIAGNOSTIC_CODES.MISSING_FINAL_NEWLINE,
    );
  });

  test("warns about blank line before recipe command", async () => {
    const document = await createMakefileDocument("test:\n\n\tnvm install\n");

    const diagnostics = validateWhitespaceRules(document, defaultSettings);

    assertHasDiagnosticCode(
      diagnostics,
      DIAGNOSTIC_CODES.BLANK_LINE_BEFORE_RECIPE_COMMAND,
    );

    const diagnostic = diagnostics.find(
      (item) => item.code === DIAGNOSTIC_CODES.BLANK_LINE_BEFORE_RECIPE_COMMAND,
    );

    assert.strictEqual(diagnostic?.range.start.line, 1);
  });

  test("does not warn when recipe command is directly below target", async () => {
    const document = await createMakefileDocument("test:\n\tnvm install\n");

    const diagnostics = validateWhitespaceRules(document, defaultSettings);

    assertDoesNotHaveDiagnosticCode(
      diagnostics,
      DIAGNOSTIC_CODES.BLANK_LINE_BEFORE_RECIPE_COMMAND,
    );
  });
});

async function createMakefileDocument(
  content: string,
): Promise<vscode.TextDocument> {
  return vscode.workspace.openTextDocument({
    content,
    language: "makefile",
  });
}

function assertHasDiagnosticCode(
  diagnostics: vscode.Diagnostic[],
  code: string,
): void {
  const codes = diagnostics.map((diagnostic) => String(diagnostic.code));

  assert.ok(
    codes.includes(code),
    `Expected diagnostic code "${code}", but got: ${codes.join(", ")}`,
  );
}

function assertDoesNotHaveDiagnosticCode(
  diagnostics: vscode.Diagnostic[],
  code: string,
): void {
  const codes = diagnostics.map((diagnostic) => String(diagnostic.code));

  assert.ok(
    !codes.includes(code),
    `Expected diagnostic code "${code}" not to be present.`,
  );
}
