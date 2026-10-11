import * as assert from "assert";
import { parseMakefileTargets } from "../../makefile/parser";

describe("Makefile target parser", () => {
  it("ignores variable assignments and recipe lines", () => {
    const targets = parseMakefileTargets(
      "CC := cc\nfoo: VAR=1\n\techo $(CC)\n",
    );

    assert.deepStrictEqual(targets.map((target) => target.name), ["foo"]);
  });

  it("parses multiple targets and double-colon rules", () => {
    const targets = parseMakefileTargets("foo bar: deps\nclean::\n");

    assert.deepStrictEqual(targets.map((target) => target.name), ["foo", "bar", "clean"]);
  });

  it("keeps target names containing make expressions", () => {
    const targets = parseMakefileTargets("build-$(MODE):\n");

    assert.strictEqual(targets[0]?.name, "build-$(MODE)");
  });

  it("uses inline ## comments as target descriptions", () => {
    const targets = parseMakefileTargets(
      "build test: ## Build and test the project\n",
    );

    assert.deepStrictEqual(targets.map(({ name, description }) => ({ name, description })), [
      { name: "build", description: "Build and test the project" },
      { name: "test", description: "Build and test the project" },
    ]);
  });

  it("does not use ordinary or recipe comments as target descriptions", () => {
    const targets = parseMakefileTargets(
      "# General comment\nbuild: # ordinary comment\n\t@echo test ## recipe comment\n",
    );

    assert.deepStrictEqual(targets, [{ name: "build", phony: false, pattern: false }]);
  });

  it("marks phony targets and hides patterns and internal names by default", () => {
    const targets = parseMakefileTargets(
      ".PHONY: all _private\nall: %.o\n_private:\n%.o: %.c\n",
    );

    assert.deepStrictEqual(targets.map((target) => target.name), ["all"]);
    assert.strictEqual(targets[0]?.phony, true);
  });

  it("can include internal and pattern rules", () => {
    const targets = parseMakefileTargets(
      ".PHONY: _private\n_private:\n%.o: %.c\n",
      { includeInternal: true, includePatternRules: true },
    );

    assert.deepStrictEqual(targets.map((target) => target.name), ["_private", "%.o"]);
  });
});
