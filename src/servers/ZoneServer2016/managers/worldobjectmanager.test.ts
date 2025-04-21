// ======================================================================
//
//   GNU GENERAL PUBLIC LICENSE
//   Version 3, 29 June 2007
//   copyright (C) 2020 - 2021 Quentin Gruber
//   copyright (C) 2021 - 2025 H1emu community
//
//   https://github.com/QuentinGruber/h1z1-server
//   https://www.npmjs.com/package/h1z1-server
//
//   Based on https://github.com/psemu/soe-network
// ======================================================================

import test, { after } from "node:test";
import { containerLootSpawners } from "../data/lootspawns";
import assert from "node:assert";

test("WorldObjectManager", { timeout: 10000 }, async (t) => {
  await t.test("containerLootSpawners", () => {
    for (const key in containerLootSpawners) {
      const containerLootTable = containerLootSpawners[key];
      if (containerLootTable.maxItems) {
        assert(
          containerLootTable.maxItems <= containerLootTable.items.length,
          `${key} MaxItems is > items.length`
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
