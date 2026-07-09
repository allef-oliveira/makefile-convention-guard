export const DIAGNOSTIC_MESSAGES = {
  TRAILING_WHITESPACE: "Trailing whitespace at the end of the line.",
  MULTIPLE_BLANK_LINES:
    "Multiple consecutive blank lines. Keep only one blank line.",
  MISSING_FINAL_NEWLINE: "Missing final newline at the end of the file.",
  BLANK_LINE_BEFORE_RECIPE_COMMAND:
    "Blank line between target and recipe command. Move the command directly below the target.",
} as const;
