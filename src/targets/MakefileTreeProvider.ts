import * as vscode from "vscode";
import * as path from "node:path";
import {
  DEFAULT_EXCLUDE_GLOBS,
  discoverMakefiles,
  type DiscoveredMakefile,
} from "../makefile/discovery";
import { parseMakefileTargets, type MakeTarget } from "../makefile/parser";
import { MakefileSelection } from "../makefile/selection";
import { runMakeTarget } from "./runMakeTarget";
import { TargetFavorites } from "./TargetFavorites";

export const VIEW_ID = "makefileConventionGuard.targets";
export const FAVORITES_VIEW_ID = "makefileConventionGuard.favorites";
export const RUN_TARGET_COMMAND = "makefileConventionGuard.runTarget";
// Temporary switch for testing extension startup and manual Makefile selection.
const AUTO_DISCOVERY_ENABLED = false;

export class MakefileNode extends vscode.TreeItem {
  readonly contextValue = "makefile";

  constructor(
    public readonly makefile: DiscoveredMakefile,
  ) {
    super(path.basename(makefile.relativePath), vscode.TreeItemCollapsibleState.Collapsed);
    this.description = makefile.relativePath;
    this.resourceUri = makefile.uri;
    this.iconPath = new vscode.ThemeIcon(
      "file-code",
      new vscode.ThemeColor("charts.blue"),
    );
  }
}

export class TargetNode extends vscode.TreeItem {
  constructor(
    public readonly makefile: DiscoveredMakefile,
    public readonly target: MakeTarget,
    favorite: boolean,
    inFavorites = false,
  ) {
    super(target.name, vscode.TreeItemCollapsibleState.None);
    this.contextValue = favorite ? "favoriteMakefileTarget" : "makefileTarget";
    if (inFavorites) {
      this.description = makefile.relativePath;
    }
    this.tooltip = target.description
      ? `${target.description}\n${makefile.relativePath}`
      : `${target.name} (${makefile.relativePath})`;
    this.iconPath = new vscode.ThemeIcon(
      target.phony ? "symbol-event" : "symbol-method",
      new vscode.ThemeColor("charts.green"),
    );
    this.command = {
      command: RUN_TARGET_COMMAND,
      title: "Executar target",
      arguments: [this],
    };
  }
}

type MakefileTreeNode = MakefileNode | TargetNode;

export class MakefileTreeProvider implements vscode.TreeDataProvider<MakefileTreeNode> {
  private readonly changeEmitter = new vscode.EventEmitter<MakefileTreeNode | undefined>();
  readonly onDidChangeTreeData = this.changeEmitter.event;
  private discovered: DiscoveredMakefile[] = [];
  private activePaths: string[] = [];

  constructor(
    private readonly selection: MakefileSelection,
    private readonly favorites: TargetFavorites,
  ) {}

  getTreeItem(element: MakefileTreeNode): vscode.TreeItem {
    return element;
  }

  async getChildren(element?: MakefileTreeNode): Promise<MakefileTreeNode[]> {
    if (!element) {
      return this.discovered
        .filter((makefile) => this.activePaths.includes(makefile.relativePath))
        .map((makefile) => new MakefileNode(makefile));
    }

    if (element instanceof MakefileNode) {
      const targets = await this.readTargets(element.makefile);
      return targets.map((target) => new TargetNode(
        element.makefile,
        target,
        this.favorites.has(element.makefile.relativePath, target.name),
      ));
    }

    return [];
  }

  async getFavoriteTargets(): Promise<TargetNode[]> {
    const makefiles = new Map(this.discovered.map((makefile) => [makefile.relativePath, makefile]));
    const targetsByPath = new Map<string, MakeTarget[]>();
    const nodes: TargetNode[] = [];
    for (const favorite of this.favorites.list()) {
      const makefile = makefiles.get(favorite.relativePath);
      if (!makefile || !this.activePaths.includes(favorite.relativePath)) {
        continue;
      }
      let targets = targetsByPath.get(favorite.relativePath);
      if (!targets) {
        targets = await this.readTargets(makefile, true);
        targetsByPath.set(favorite.relativePath, targets);
      }
      const target = targets.find((item) => item.name === favorite.target);
      if (target) {
        nodes.push(new TargetNode(makefile, target, true, true));
      }
    }
    return nodes;
  }

  async refresh(): Promise<void> {
    const folder = vscode.workspace.workspaceFolders?.[0];
    if (!folder) {
      this.discovered = [];
      this.activePaths = [];
      this.changeEmitter.fire(undefined);
      return;
    }

    try {
      const rootMakefiles = AUTO_DISCOVERY_ENABLED
        ? await discoverMakefiles(
          folder.uri.fsPath,
          vscode.workspace.getConfiguration("makefileConventionGuard")
            .get<string[]>("discovery.exclude", DEFAULT_EXCLUDE_GLOBS),
        )
        : [];
      const rootPaths = rootMakefiles.map((makefile) => makefile.relativePath);
      const activePaths = this.selection.getActivePaths(rootPaths);
      const validPaths: string[] = [];
      const makefiles = new Map(rootMakefiles.map((makefile) => [makefile.relativePath, makefile]));

      for (const relativePath of activePaths) {
        const uri = vscode.Uri.joinPath(folder.uri, ...relativePath.split("/"));
        try {
          const stat = await vscode.workspace.fs.stat(uri);
          if ((stat.type & vscode.FileType.File) !== 0) {
            validPaths.push(relativePath);
            if (!makefiles.has(relativePath)) {
              makefiles.set(relativePath, { uri, relativePath });
            }
          }
        } catch {
          // Removed manually-added files are cleaned from the persisted state below.
        }
      }

      await this.selection.setSelected(validPaths, [...new Set([...rootPaths, ...validPaths])]);
      this.discovered = [...makefiles.values()]
        .sort((left, right) => left.relativePath.localeCompare(right.relativePath));
      this.activePaths = validPaths;
    } catch (error) {
      this.discovered = [];
      this.activePaths = [];
      void vscode.window.showErrorMessage(
        `Não foi possível descobrir os Makefiles: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
    this.changeEmitter.fire(undefined);
  }

  async addMakefiles(): Promise<void> {
    const folder = vscode.workspace.workspaceFolders?.[0];
    if (!folder) {
      return;
    }

    const uris = await vscode.window.showOpenDialog({
      canSelectFiles: true,
      canSelectFolders: false,
      canSelectMany: true,
      defaultUri: folder.uri,
      openLabel: "Adicionar Makefiles",
    });
    if (!uris) {
      return;
    }

    const root = folder.uri.fsPath + path.sep;
    const additions = uris
      .filter((uri) => uri.fsPath === folder.uri.fsPath || uri.fsPath.startsWith(root))
      .map((uri) => path.relative(folder.uri.fsPath, uri.fsPath).split(path.sep).join("/"));
    const selected = [...new Set([...this.activePaths, ...additions])];
    await this.selection.setSelected(
      selected,
      this.discovered.map((makefile) => makefile.relativePath),
    );
    await this.refresh();
  }

  async reloadMakefile(element: MakefileNode): Promise<void> {
    if (!this.activePaths.includes(element.makefile.relativePath)) {
      return;
    }
    await this.refresh();
  }

  async removeMakefile(element: MakefileNode): Promise<void> {
    const relativePath = element.makefile.relativePath;
    if (!this.activePaths.includes(relativePath)) {
      return;
    }
    await this.selection.setSelected(
      this.activePaths.filter((activePath) => activePath !== relativePath),
      this.discovered.map((makefile) => makefile.relativePath),
    );
    await this.refresh();
  }

  run(element: TargetNode): Promise<void> {
    return runMakeTarget(element.makefile, element.target.name);
  }

  async addFavorite(element: TargetNode): Promise<void> {
    await this.favorites.add(element.makefile.relativePath, element.target.name);
    this.changeEmitter.fire(undefined);
  }

  async removeFavorite(element: TargetNode): Promise<void> {
    await this.favorites.remove(element.makefile.relativePath, element.target.name);
    this.changeEmitter.fire(undefined);
  }

  private async readTargets(makefile: DiscoveredMakefile, includeHidden = false): Promise<MakeTarget[]> {
    let contents: string;
    try {
      const bytes = await vscode.workspace.fs.readFile(makefile.uri);
      contents = new TextDecoder().decode(bytes);
    } catch {
      return [];
    }
    const config = vscode.workspace.getConfiguration("makefileConventionGuard");
    return parseMakefileTargets(contents, {
      includeInternal: includeHidden || config.get<boolean>("targets.showInternal", false),
      includePatternRules: includeHidden || config.get<boolean>("targets.showPatternRules", false),
    });
  }

  watch(context: vscode.ExtensionContext): void {
    const folder = vscode.workspace.workspaceFolders?.[0];
    if (!folder) {
      return;
    }
    if (AUTO_DISCOVERY_ENABLED) {
      const watcher = vscode.workspace.createFileSystemWatcher(
        new vscode.RelativePattern(folder, "{Makefile,makefile,GNUmakefile,*.mk}"),
      );
      context.subscriptions.push(
        watcher,
        watcher.onDidCreate(() => void this.refresh()),
        watcher.onDidChange(() => void this.refresh()),
        watcher.onDidDelete(() => void this.refresh()),
      );
    }
    context.subscriptions.push(
      vscode.workspace.onDidSaveTextDocument((document) => {
        const relativePath = path.relative(folder.uri.fsPath, document.uri.fsPath).split(path.sep).join("/");
        if (this.discovered.some((makefile) => makefile.relativePath === relativePath)) {
          this.changeEmitter.fire(undefined);
        }
      }),
      vscode.workspace.onDidChangeConfiguration((event) => {
        if (event.affectsConfiguration("makefileConventionGuard")) {
          void this.refresh();
        }
      }),
    );
  }
}

export class FavoritesTreeProvider implements vscode.TreeDataProvider<TargetNode>, vscode.Disposable {
  private readonly changeEmitter = new vscode.EventEmitter<TargetNode | undefined>();
  readonly onDidChangeTreeData = this.changeEmitter.event;
  private readonly sourceSubscription: vscode.Disposable;

  constructor(private readonly source: MakefileTreeProvider) {
    this.sourceSubscription = source.onDidChangeTreeData(() => this.changeEmitter.fire(undefined));
  }

  getTreeItem(element: TargetNode): vscode.TreeItem {
    return element;
  }

  getChildren(element?: TargetNode): Promise<TargetNode[]> {
    return element ? Promise.resolve([]) : this.source.getFavoriteTargets();
  }

  dispose(): void {
    this.sourceSubscription.dispose();
    this.changeEmitter.dispose();
  }
}
