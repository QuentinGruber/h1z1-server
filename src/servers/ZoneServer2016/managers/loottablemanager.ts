// ======================================================================
//
//   GNU GENERAL PUBLIC LICENSE
//   Version 3, 29 June 2007
//   copyright (C) 2020 - 2021 Quentin Gruber
//   copyright (C) 2021 - 2026 H1emu community
//
//   https://github.com/QuentinGruber/h1z1-server
//   https://www.npmjs.com/package/h1z1-server
//
//   Based on https://github.com/psemu/soe-network
// ======================================================================

import * as fs from "fs";
import * as path from "path";
import { PluginManager } from "./pluginmanager";
import type {
  GroundLootTableJson,
  ContainerLootTableJson,
  LootPool
} from "types/zoneserver";

export class LootTableManager {
  private groundTables: Record<string, GroundLootTableJson> = {};
  private containerTables: Record<string, ContainerLootTableJson> = {};

  /**
   * Load all loot tables from data/2016/lootTables/, applying any plugin
   * overrides found in plugins/<name>/data/2016/lootTables/.
   */
  load(): void {
    const pluginDataRoots = PluginManager.getPluginDataRoots();
    this.groundTables = this.loadDirectory<GroundLootTableJson>(
      "ground",
      pluginDataRoots
    );
    this.containerTables = this.loadDirectory<ContainerLootTableJson>(
      "containers",
      pluginDataRoots
    );
    console.log(
      `[LootTableManager] Loaded ${Object.keys(this.groundTables).length} ground tables, ` +
        `${Object.keys(this.containerTables).length} container tables`
    );
  }

  getGroundTables(): Record<string, GroundLootTableJson> {
    return this.groundTables;
  }

  getContainerTables(): Record<string, ContainerLootTableJson> {
    return this.containerTables;
  }

  private loadDirectory<T extends GroundLootTableJson | ContainerLootTableJson>(
    subdir: string,
    pluginDataRoots: string[]
  ): Record<string, T> {
    const result: Record<string, T> = {};
    const baseDir = path.join(
      process.cwd(),
      "data",
      "2016",
      "lootTables",
      subdir
    );

    // Collect all known table names from the base directory including subdirectories
    const allNames = new Set<string>();
    if (fs.existsSync(baseDir)) {
      this.collectTableNames(baseDir, baseDir, allNames);
    }

    // Plugins can also introduce brand-new tables by adding files not present in base
    for (const pluginDataRoot of pluginDataRoots) {
      const pluginSubDir = path.join(
        pluginDataRoot,
        "2016",
        "lootTables",
        subdir
      );
      if (!fs.existsSync(pluginSubDir)) continue;
      this.collectTableNames(pluginSubDir, pluginSubDir, allNames);
    }

    for (const name of allNames) {
      const table = this.resolveTable<T>(subdir, name, pluginDataRoots);
      if (table) result[name] = table;
    }

    return result;
  }

  private collectTableNames(
    dir: string,
    rootDir: string,
    names: Set<string>
  ): void {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        this.collectTableNames(fullPath, rootDir, names);
      } else if (entry.name.endsWith(".json")) {
        const rel = path.relative(rootDir, fullPath);
        names.add(rel.slice(0, -5).replace(/\\/g, "/"));
      }
    }
  }

  private resolveTable<T extends GroundLootTableJson | ContainerLootTableJson>(
    subdir: string,
    name: string,
    pluginDataRoots: string[]
  ): T | null {
    const relPath = path.join("2016", "lootTables", subdir, `${name}.json`);
    const baseFilePath = path.join(process.cwd(), "data", relPath);

    // Collect plugin overrides in priority order (last one wins for full replace,
    // all appended pools are collected for append merges)
    const appendPools: LootPool[] = [];
    let pluginReplace: T | null = null;

    for (const pluginDataRoot of pluginDataRoots) {
      const pluginFile = path.join(pluginDataRoot, relPath);
      if (!fs.existsSync(pluginFile)) continue;

      const override = JSON.parse(fs.readFileSync(pluginFile, "utf8")) as T & {
        merge?: string;
      };

      if (override.merge === "append") {
        // Collect all pools from append-mode overrides
        appendPools.push(...(override.pools ?? []));
      } else {
        // Full replace — later plugin wins
        const { merge: _merge, ...rest } = override as any;
        pluginReplace = rest as T;
      }
    }

    // Load the base table if it exists
    let baseTable: T | null = null;
    if (fs.existsSync(baseFilePath)) {
      baseTable = JSON.parse(fs.readFileSync(baseFilePath, "utf8")) as T;
    }

    // Determine final table
    let finalTable: T | null;
    if (pluginReplace) {
      // Full replace wins over base; append pools still stack on top
      finalTable = pluginReplace;
    } else {
      finalTable = baseTable;
    }

    if (!finalTable) return null;

    // Append any collected pools
    if (appendPools.length > 0) {
      finalTable = {
        ...finalTable,
        pools: [...finalTable.pools, ...appendPools]
      } as T;
    }

    return finalTable;
  }
}
