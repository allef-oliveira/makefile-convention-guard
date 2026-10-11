import * as vscode from "vscode";

const SELECTION_KEY = "makefileConventionGuard.makefileSelection.v2";

interface StoredSelection {
  selected: string[];
  known: string[];
}

export class MakefileSelection {
  constructor(private readonly context: vscode.ExtensionContext) {}

  getActivePaths(discoveredPaths: string[]): string[] {
    const stored = this.context.workspaceState.get<StoredSelection>(SELECTION_KEY);
    if (!stored) {
      void this.save({ selected: discoveredPaths, known: discoveredPaths });
      return [...discoveredPaths];
    }

    const known = new Set(stored.known);
    const selected = new Set(stored.selected);

    for (const path of discoveredPaths) {
      if (!known.has(path)) {
        selected.add(path);
      }
      known.add(path);
    }

    const next: StoredSelection = {
      selected: [...selected],
      known: [...known],
    };
    void this.save(next);
    return next.selected;
  }

  async setSelected(selected: string[], known: string[]): Promise<void> {
    await this.save({ selected: [...new Set(selected)], known: [...new Set(known)] });
  }

  private save(value: StoredSelection): Thenable<void> {
    return this.context.workspaceState.update(SELECTION_KEY, value);
  }
}
