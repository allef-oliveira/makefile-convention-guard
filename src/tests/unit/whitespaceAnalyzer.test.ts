import * as assert from "assert";

import { DIAGNOSTIC_CODES } from "../../constants";
import { analyzeWhitespaceRules } from "../../diagnostics/rules/whitespaceAnalyzer";
import type {
  DiagnosticCode,
  WhitespaceDiagnosticSettings,
} from "../../types/diagnostics";

const defaultSettings: WhitespaceDiagnosticSettings = {
  enabled: true,
  warnTrailingWhitespace: true,
  warnMultipleBlankLines: true,
  requireFinalNewline: true,
  warnBlankLineBeforeRecipeCommand: true,
};

describe("Whitespace analyzer", () => {
  it("warns about trailing whitespace", () => {
    const text = "NODE_VERSION := 22   \n";

    const findings = analyzeWhitespaceRules(text, defaultSettings);

    const finding = getFindingByCode(
      findings,
      DIAGNOSTIC_CODES.TRAILING_WHITESPACE,
    );

    assert.strictEqual(finding.lineIndex, 0);
    assert.strictEqual(finding.startColumn, "NODE_VERSION := 22".length);
    assert.strictEqual(finding.endColumn, "NODE_VERSION := 22   ".length);
  });

  it("warns about multiple consecutive blank lines", () => {
    const text = "A := 1\n\n\nB := 2\n";

    const findings = analyzeWhitespaceRules(text, defaultSettings);

    const finding = getFindingByCode(
      findings,
      DIAGNOSTIC_CODES.MULTIPLE_BLANK_LINES,
    );

    assert.strictEqual(finding.lineIndex, 2);
    assert.strictEqual(finding.startColumn, 0);
    assert.strictEqual(finding.endColumn, 0);
  });

  it("warns about missing final newline", () => {
    const text = "A := 1";

    const findings = analyzeWhitespaceRules(text, defaultSettings);

    const finding = getFindingByCode(
      findings,
      DIAGNOSTIC_CODES.MISSING_FINAL_NEWLINE,
    );

    assert.strictEqual(finding.lineIndex, 0);
    assert.strictEqual(finding.startColumn, "A := 1".length);
    assert.strictEqual(finding.endColumn, "A := 1".length);
  });

  it("warns about blank line before recipe command", () => {
    const text = "test:\n\n\tnvm install\n";

    const findings = analyzeWhitespaceRules(text, defaultSettings);

    const finding = getFindingByCode(
      findings,
      DIAGNOSTIC_CODES.BLANK_LINE_BEFORE_RECIPE_COMMAND,
    );

    assert.strictEqual(finding.lineIndex, 1);
    assert.strictEqual(finding.startColumn, 0);
    assert.strictEqual(finding.endColumn, 0);
  });

  it("does not warn when recipe command is directly below target", () => {
    const text = "test:\n\tnvm install\n";

    const findings = analyzeWhitespaceRules(text, defaultSettings);

    assertDoesNotHaveFindingCode(
      findings,
      DIAGNOSTIC_CODES.BLANK_LINE_BEFORE_RECIPE_COMMAND,
    );
  });

  it("does not warn when diagnostics are disabled", () => {
    const text = "test:\n\n\tnvm install";

    const findings = analyzeWhitespaceRules(text, {
      ...defaultSettings,
      enabled: false,
    });

    assert.deepStrictEqual(findings, []);
  });

  it("respects disabled trailing whitespace rule", () => {
    const text = "NODE_VERSION := 22   \n";

    const findings = analyzeWhitespaceRules(text, {
      ...defaultSettings,
      warnTrailingWhitespace: false,
    });

    assertDoesNotHaveFindingCode(
      findings,
      DIAGNOSTIC_CODES.TRAILING_WHITESPACE,
    );
  });
});

type Finding = ReturnType<typeof analyzeWhitespaceRules>[number];

function getFindingByCode(
  findings: Finding[],
  code: DiagnosticCode,
): Finding {
  const finding = findings.find((item) => item.code === code);

  assert.ok(
    finding,
    `Expected finding with code "${code}", but got: ${findings
      .map((item) => item.code)
      .join(", ")}`,
  );

  return finding;
}

function assertDoesNotHaveFindingCode(
  findings: Finding[],
  code: DiagnosticCode,
): void {
  assert.ok(
    !findings.some((item) => item.code === code),
    `Expected finding with code "${code}" not to be present.`,
  );
}
