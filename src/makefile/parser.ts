export function isMakeCommentLine(line: string): boolean {
  return line.trim().startsWith("#");
}

export function isPhonyTargetLine(line: string): boolean {
  return line.trim().startsWith(".PHONY");
}

export function isMakeVariableAssignmentLine(line: string): boolean {
  const trimmed = line.trim();

  return (
    trimmed.includes(":=") ||
    trimmed.includes("?=") ||
    trimmed.includes("+=") ||
    /^[A-Za-z_][A-Za-z0-9_]*\s*=/.test(trimmed)
  );
}

export function isMakeTargetLine(line: string): boolean {
  const trimmed = line.trim();

  if (trimmed === "") {
    return false;
  }

  if (isMakeCommentLine(line)) {
    return false;
  }

  if (isPhonyTargetLine(line)) {
    return false;
  }

  if (isMakeVariableAssignmentLine(line)) {
    return false;
  }

  return /^[^\s:#=][^:=#]*:(?![=])/.test(line);
}

export function isRecipeCommandLine(line: string): boolean {
  return /^\t.+/.test(line);
}
