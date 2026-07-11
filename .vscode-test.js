const { defineConfig } = require("@vscode/test-cli");

const vscodeExecutablePath = process.env.VSCODE_EXECUTABLE_PATH;
const runId = process.env.GITHUB_RUN_ID ?? "local";

module.exports = defineConfig({
  files: "dist/tests/suite/**/*.test.js",
  launchArgs: [
    "--disable-extensions",
    "--disable-workspace-trust",
    "--disable-gpu",
    `--user-data-dir=/tmp/mcg-vscode-user-${runId}`,
    `--extensions-dir=/tmp/mcg-vscode-ext-${runId}`,
  ],
  useInstallation: vscodeExecutablePath
    ? {
        fromPath: vscodeExecutablePath,
      }
    : undefined,
});
