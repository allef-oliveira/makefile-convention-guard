export const EXTENSION_ID = "makefile-convention-guard";

export const CONFIG_SECTION = "makefileConventionGuard";

export const DIAGNOSTIC_SOURCE = "makefile-convention-guard";

export const DIAGNOSTIC_CODES = {
  TRAILING_WHITESPACE: "trailing-whitespace",
  MULTIPLE_BLANK_LINES: "multiple-blank-lines",
  MISSING_FINAL_NEWLINE: "missing-final-newline",
} as const;
