import type * as vscode from "vscode";

const FAVORITES_KEY = "makefileConventionGuard.favoriteTargets.v1";

export interface FavoriteTarget {
  relativePath: string;
  target: string;
}

export class TargetFavorites {
  constructor(private readonly context: vscode.ExtensionContext) {}

  list(): FavoriteTarget[] {
    return this.context.workspaceState.get<FavoriteTarget[]>(FAVORITES_KEY, []);
  }

  has(relativePath: string, target: string): boolean {
    return this.list().some(
      (favorite) => favorite.relativePath === relativePath && favorite.target === target,
    );
  }

  async add(relativePath: string, target: string): Promise<void> {
    if (this.has(relativePath, target)) {
      return;
    }
    await this.context.workspaceState.update(FAVORITES_KEY, [
      ...this.list(),
      { relativePath, target },
    ]);
  }

  async remove(relativePath: string, target: string): Promise<void> {
    await this.context.workspaceState.update(
      FAVORITES_KEY,
      this.list().filter(
        (favorite) => favorite.relativePath !== relativePath || favorite.target !== target,
      ),
    );
  }
}
