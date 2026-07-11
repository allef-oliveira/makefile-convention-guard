const { defineConfig } = require("@vscode/test-cli");

const vscodeExecutablePath = process.env.VSCODE_EXECUTABLE_PATH;

module.exports = defineConfig({
  files: "dist/tests/suite/**/*.test.js",
  launchArgs: ["--disable-extensions"],
  useInstallation: vscodeExecutablePath
    ? {
        fromPath: vscodeExecutablePath,
      }
    : undefined,
});
