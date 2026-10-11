import * as assert from "assert";
import * as path from "node:path";
import {
  createMakeTargetInvocation,
  findMiseConfig,
} from "../../targets/makeTargetExecution";

describe("Make target execution", () => {
  it("runs make through mise when the project declares a mise config", async () => {
    const workspaceRoot = path.join(path.parse(process.cwd()).root, "mise-config-test");
    const makefilePath = path.join(workspaceRoot, "apps", "web", "Makefile");
    const configFiles = new Set([path.join(workspaceRoot, ".mise.toml")]);
    const found = await findMiseConfig(
      path.dirname(makefilePath),
      async (filePath) => configFiles.has(filePath),
    );

    assert.strictEqual(found, true);
    assert.deepStrictEqual(
      createMakeTargetInvocation(makefilePath, "build", found),
      {
        command: "mise",
        args: [
          "exec",
          "--",
          "make",
          "-f",
          makefilePath,
          "--",
          "build",
        ],
      },
    );
  });

  it("keeps direct make execution when no mise config exists", async () => {
    const workspaceRoot = path.join(path.parse(process.cwd()).root, "mise-config-test");
    const makefilePath = path.join(workspaceRoot, "Makefile");
    const found = await findMiseConfig(workspaceRoot, async () => false);

    assert.strictEqual(found, false);
    assert.deepStrictEqual(
      createMakeTargetInvocation(makefilePath, "clean", found),
      {
        command: "make",
        args: ["-f", makefilePath, "--", "clean"],
      },
    );
  });

  it("continues searching when a config path cannot be read", async () => {
    const workspaceRoot = path.join(path.parse(process.cwd()).root, "mise-config-test");
    const found = await findMiseConfig(path.join(workspaceRoot, "app"), async (filePath) => {
      if (filePath === path.join(workspaceRoot, ".mise.toml")) {
        return true;
      }
      throw new Error("not found");
    });

    assert.strictEqual(found, true);
  });
});
