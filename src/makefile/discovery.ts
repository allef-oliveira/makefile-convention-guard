import * as path from "node:path";
import * as vscode from "vscode";

export const MAKEFILE_GLOB = "{Makefile,makefile,GNUmakefile,*.mk}";
export const DEFAULT_EXCLUDE_GLOBS = [
  "**/node_modules/**",
  "**/.git/**",
  "**/vendor/**",
];

export interface DiscoveredMakefile {
  uri: vscode.Uri;
  relativePath: string;
}

export async function discoverMakefiles(
  workspaceRoot: string,
  excludeGlobs: string[] = DEFAULT_EXCLUDE_GLOBS,
): Promise<DiscoveredMakefile[]> {
  const exclude = new vscode.RelativePattern(
    vscode.Uri.file(workspaceRoot),
    createExcludeGlob(excludeGlobs) ?? "**/node_modules/**",
  );
  const uris = await vscode.workspace.findFiles(MAKEFILE_GLOB, exclude);

  return uris
    .map((uri) => ({
      uri,
      relativePath: path.relative(workspaceRoot, uri.fsPath).split(path.sep).join("/"),
    }))
    .sort((left, right) => left.relativePath.localeCompare(right.relativePath));
}

function createExcludeGlob(globs: string[]): string | undefined {
  const values = globs.filter((glob) => glob.trim().length > 0);
  if (values.length === 0) {
    return undefined;
  }

  if (
    values.length === DEFAULT_EXCLUDE_GLOBS.length &&
    DEFAULT_EXCLUDE_GLOBS.every((glob) => values.includes(glob))
  ) {
    return "**/{node_modules,.git,vendor}/**";
  }

  if (values.length === 1) {
    return values[0];
  }

  return `{${values.join(",")}}`;
}
