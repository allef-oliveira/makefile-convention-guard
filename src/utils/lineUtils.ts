export function splitLines(text: string): string[] {
  return text.split(/\r?\n/);
}

export function getLine(lines: string[], index: number): string {
  return lines[index] ?? "";
}

export function isBlankLine(line: string): boolean {
  return line.trim() === "";
}

export function hasFinalNewline(text: string): boolean {
  return text.length === 0 || text.endsWith("\n");
}

export function findTrailingWhitespaceStart(line: string): number | null {
  const match = line.match(/[ \t]+$/);

  if (!match || match.index === undefined) {
    return null;
  }

  return match.index;
}
