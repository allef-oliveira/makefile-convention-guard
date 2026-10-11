import * as path from "node:path";
import * as vscode from "vscode";
import type { DiscoveredMakefile } from "../makefile/discovery";

const MISE_CONFIG_PATHS = [
  "mise.toml",
  "mise.local.toml",
  ".mise.toml",
  ".mise.local.toml",
  "mise/config.toml",
  ".mise/config.toml",
  ".config/mise.toml",
  ".config/mise/config.toml",
];

export async function runMakeTarget(
  makefile: DiscoveredMakefile,
  target: string,
): Promise<void> {
  const folder = vscode.workspace.workspaceFolders?.[0];
  if (!folder) {
    return;
  }

  const config = vscode.workspace.getConfiguration("makefileConventionGuard");
  const cwdMode = config.get<string>("execution.cwd", "makefileDirectory");
  const cwd = cwdMode === "workspaceRoot"
    ? folder.uri.fsPath
    : path.dirname(makefile.uri.fsPath);
  const makeArgs = ["-f", makefile.uri.fsPath, "--", target];
  const usesMise = await hasMiseConfig(cwd);
  const execution = usesMise
    ? new vscode.ShellExecution("mise", ["exec", "--", "make", ...makeArgs], { cwd })
    : new vscode.ShellExecution("make", makeArgs, { cwd });
  const task = new vscode.Task(
    {
      type: "makefileConventionGuard",
      makefile: makefile.relativePath,
      target,
    },
    folder,
    `make ${target}`,
    "Makefile Convention Guard",
    execution,
  );
  task.presentationOptions = {
    reveal: vscode.TaskRevealKind.Always,
    focus: false,
    panel: vscode.TaskPanelKind.Shared,
    clear: false,
  };
  await vscode.tasks.executeTask(task);
}

async function hasMiseConfig(startDirectory: string): Promise<boolean> {
  let directory = startDirectory;

  while (true) {
    for (const configPath of MISE_CONFIG_PATHS) {
      try {
        const uri = vscode.Uri.file(path.join(directory, configPath));
        const stat = await vscode.workspace.fs.stat(uri);
        if ((stat.type & vscode.FileType.File) !== 0) {
          return true;
        }
      } catch {
        // Continue searching parent directories for a mise config.
      }
    }

    const parent = path.dirname(directory);
    if (parent === directory) {
      return false;
    }
    directory = parent;
  }
}
