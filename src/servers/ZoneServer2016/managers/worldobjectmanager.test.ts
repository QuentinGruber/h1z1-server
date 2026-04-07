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

import test, { after } from "node:test";
import assert from "node:assert";
import { LootTableManager } from "./loottablemanager";

test("WorldObjectManager", { timeout: 10000 }, async (t) => {
  await t.test("containerLootSpawners", () => {
    const manager = new LootTableManager();
    manager.load();
    const containerTables = manager.getContainerTables();
    for (const key in containerTables) {
      const containerLootTable = containerTables[key];
      const totalEntries = containerLootTable.pools.flatMap(
        (p) => p.entries
      ).length;
      if (containerLootTable.maxItems) {
        assert(
          containerLootTable.maxItems <= totalEntries,
          `${key} MaxItems is > total entries count`
        );
      }
    }
  });
});

after(() => {
  setImmediate(() => {
    process.exit(0);
  });
});
