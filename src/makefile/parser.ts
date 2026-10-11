export function isMakeCommentLine(line: string): boolean {
  return line.trim().startsWith("#");
}

export function isPhonyTargetLine(line: string): boolean {
  return /^\.PHONY\s*:(?![:=])/.test(line.trim());
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

export interface MakeTarget {
  name: string;
  phony: boolean;
  pattern: boolean;
  description?: string;
}

export interface TargetParserOptions {
  includeInternal?: boolean;
  includePatternRules?: boolean;
}

/**
 * Extracts explicit target names without executing make. This intentionally
 * handles the common rule syntax used by the view; dynamic targets created by
 * eval, shell functions, or included generated files are outside its scope.
 */
export function parseMakefileTargets(
  text: string,
  options: TargetParserOptions = {},
): MakeTarget[] {
  const phonyNames = new Set<string>();
  const names: string[] = [];
  const descriptions = new Map<string, string>();

  for (const rawLine of text.split(/\r?\n/)) {
    const description = extractTargetDescription(rawLine);
    const line = stripMakeComment(rawLine);

    if (line.trim() === "" || isRecipeCommandLine(line) || /^\s+/.test(line)) {
      continue;
    }

    const match = line.match(/^([^:=#]+)(::|:(?!=))/);
    if (!match || !match[1]) {
      continue;
    }

    const targetNames = match[1]
      .trim()
      .split(/\s+/)
      .filter((name) => name.length > 0);

    if (targetNames.includes(".PHONY")) {
      const phonyPart = line.slice(match[0].length).trim();
      for (const name of phonyPart.split(/\s+/)) {
        if (name) {
          phonyNames.add(name);
        }
      }
      continue;
    }

    for (const name of targetNames) {
      if (!names.includes(name)) {
        names.push(name);
      }
      if (description && !descriptions.has(name)) {
        descriptions.set(name, description);
      }
    }
  }

  return names
    .map((name): MakeTarget => {
      const description = descriptions.get(name);
      return {
        name,
        phony: phonyNames.has(name),
        pattern: name.includes("%"),
        ...(description ? { description } : {}),
      };
    })
    .filter((target) => {
      const internal = target.name.startsWith("_") || target.name.startsWith(".");
      return (
        ((options.includeInternal ?? false) || !internal) &&
        ((options.includePatternRules ?? false) || !target.pattern)
      );
    });
}

function extractTargetDescription(line: string): string | undefined {
  const commentIndex = findMakeCommentStart(line);
  if (commentIndex < 0) {
    return undefined;
  }

  const comment = line.slice(commentIndex);
  const match = comment.match(/^##\s*(.*)$/);
  return match?.[1]?.trim() || undefined;
}

function stripMakeComment(line: string): string {
  const commentIndex = findMakeCommentStart(line);
  return commentIndex < 0 ? line : line.slice(0, commentIndex);
}

function findMakeCommentStart(line: string): number {
  for (let index = 0; index < line.length; index += 1) {
    if (line[index] === "#" && (index === 0 || line[index - 1] !== "\\")) {
      return index;
    }
  }

  return -1;
}
