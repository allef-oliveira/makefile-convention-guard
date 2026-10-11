import * as assert from "assert";
import type * as vscode from "vscode";
import { TargetFavorites } from "../../targets/TargetFavorites";

describe("Makefile target favorites", () => {
  it("keeps same-named targets from different Makefiles separate across reloads", async () => {
    const values = new Map<string, unknown>();
    const context = {
      workspaceState: {
        get<T>(key: string, defaultValue: T): T {
          return (values.get(key) as T | undefined) ?? defaultValue;
        },
        update(key: string, value: unknown): Promise<void> {
          values.set(key, value);
          return Promise.resolve();
        },
      },
    } as unknown as vscode.ExtensionContext;

    const favorites = new TargetFavorites(context);
    await favorites.add("app/Makefile", "build");
    await favorites.add("tools/Makefile", "build");
    await favorites.add("app/Makefile", "build");

    const reloaded = new TargetFavorites(context);
    assert.deepStrictEqual(reloaded.list(), [
      { relativePath: "app/Makefile", target: "build" },
      { relativePath: "tools/Makefile", target: "build" },
    ]);

    await reloaded.remove("app/Makefile", "build");
    assert.strictEqual(reloaded.has("app/Makefile", "build"), false);
    assert.strictEqual(reloaded.has("tools/Makefile", "build"), true);
  });
});
