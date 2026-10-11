import * as vscode from "vscode";
import { MakefileSelection } from "../makefile/selection";
import { TargetFavorites } from "./TargetFavorites";
import {
  FAVORITES_VIEW_ID,
  FavoritesTreeProvider,
  MakefileNode,
  MakefileTreeProvider,
  RUN_TARGET_COMMAND,
  TargetNode,
  VIEW_ID,
} from "./MakefileTreeProvider";

export function registerTargetView(context: vscode.ExtensionContext): void {
  const selection = new MakefileSelection(context);
  const favorites = new TargetFavorites(context);
  const provider = new MakefileTreeProvider(selection, favorites);
  const favoritesProvider = new FavoritesTreeProvider(provider);
  context.subscriptions.push(
    favoritesProvider,
    vscode.commands.registerCommand("makefileConventionGuard.refreshTargets", () => provider.refresh()),
    vscode.commands.registerCommand("makefileConventionGuard.addMakefiles", () => provider.addMakefiles()),
    vscode.commands.registerCommand("makefileConventionGuard.reloadMakefile", (node?: MakefileNode) =>
      node instanceof MakefileNode ? provider.reloadMakefile(node) : undefined),
    vscode.commands.registerCommand("makefileConventionGuard.removeMakefile", (node?: MakefileNode) =>
      node instanceof MakefileNode ? provider.removeMakefile(node) : undefined),
    vscode.commands.registerCommand(RUN_TARGET_COMMAND, (node: TargetNode) => provider.run(node)),
    vscode.commands.registerCommand("makefileConventionGuard.addFavorite", (node?: TargetNode) =>
      node instanceof TargetNode ? provider.addFavorite(node) : undefined),
    vscode.commands.registerCommand("makefileConventionGuard.removeFavorite", (node?: TargetNode) =>
      node instanceof TargetNode ? provider.removeFavorite(node) : undefined),
    vscode.window.createTreeView(FAVORITES_VIEW_ID, { treeDataProvider: favoritesProvider }),
    vscode.window.createTreeView(VIEW_ID, { treeDataProvider: provider }),
  );
  provider.watch(context);
  void provider.refresh();
}
