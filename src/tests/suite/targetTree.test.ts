import * as assert from "assert";
import * as vscode from "vscode";
import { TargetNode } from "../../targets/MakefileTreeProvider";

suite("Makefile target tree", () => {
  test("shows a target description and Makefile path in its tooltip", () => {
    const makefile = {
      uri: vscode.Uri.file("/workspace/Makefile"),
      relativePath: "Makefile",
    };
    const target = {
      name: "build",
      phony: true,
      pattern: false,
      description: "Build the project",
    };

    const node = new TargetNode(makefile, target, false);

    assert.strictEqual(node.tooltip, "Build the project\nMakefile");
  });

  test("falls back to the target name when it has no description", () => {
    const makefile = {
      uri: vscode.Uri.file("/workspace/Makefile"),
      relativePath: "Makefile",
    };
    const target = { name: "clean", phony: true, pattern: false };

    const node = new TargetNode(makefile, target, false);

    assert.strictEqual(node.tooltip, "clean (Makefile)");
  });
});
