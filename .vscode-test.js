const { defineConfig } = require("@vscode/test-cli");

module.exports = defineConfig({
  files: "dist/tests/suite/**/*.test.js",
  launchArgs: ["--disable-extensions"],
});
