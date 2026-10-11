import * as path from "node:path";
import * as vscode from "vscode";
import type { DiscoveredMakefile } from "../makefile/discovery";
import {
  createMakeTargetInvocation,
  findMiseConfig,
} from "./makeTargetExecution";

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
  const usesMise = await findMiseConfig(cwd, async (filePath) => {
    const stat = await vscode.workspace.fs.stat(vscode.Uri.file(filePath));
    return (stat.type & vscode.FileType.File) !== 0;
  });
  const invocation = createMakeTargetInvocation(makefile.uri.fsPath, target, usesMise);
  const execution = new vscode.ShellExecution(invocation.command, invocation.args, { cwd });
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
