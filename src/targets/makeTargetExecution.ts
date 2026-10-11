import * as path from "node:path";

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

export interface MakeTargetInvocation {
  command: string;
  args: string[];
}

export function createMakeTargetInvocation(
  makefilePath: string,
  target: string,
  useMise: boolean,
): MakeTargetInvocation {
  const makeArgs = ["-f", makefilePath, "--", target];
  return useMise
    ? { command: "mise", args: ["exec", "--", "make", ...makeArgs] }
    : { command: "make", args: makeArgs };
}

export async function findMiseConfig(
  startDirectory: string,
  isFile: (filePath: string) => Promise<boolean>,
): Promise<boolean> {
  let directory = startDirectory;

  while (true) {
    for (const configPath of MISE_CONFIG_PATHS) {
      try {
        if (await isFile(path.join(directory, configPath))) {
          return true;
        }
      } catch {
        // Continue searching other config names and parent directories.
      }
    }

    const parent = path.dirname(directory);
    if (parent === directory) {
      return false;
    }
    directory = parent;
  }
}
