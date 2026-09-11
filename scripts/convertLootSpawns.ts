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
//
// One-time migration script: converts lootspawns.ts → JSON loot table files.
// Run with: npx tsx scripts/convertLootSpawns.ts
//
// Output:
//   data/2016/lootTables/ground/{actorDefinitionName}.json
//   data/2016/lootTables/containers/{containerName}.json

import fs from "fs";
import path from "path";
import {
  lootTables,
  containerLootSpawners
} from "../src/servers/ZoneServer2016/data/lootspawns";
import type {
  GroundLootTableJson,
  ContainerLootTableJson,
  LootPool,
  LootTableEntry
} from "../src/types/zoneserver";

const ROOT = path.join(process.cwd(), "data", "2016", "lootTables");
const GROUND_DIR = path.join(ROOT, "ground");
const CONTAINER_DIR = path.join(ROOT, "containers");

fs.mkdirSync(GROUND_DIR, { recursive: true });
fs.mkdirSync(CONTAINER_DIR, { recursive: true });

// ── Ground spawners ────────────────────────────────────────────────────────────

let groundCount = 0;
for (const [actorDefinition, spawner] of Object.entries(lootTables)) {
  const pool: LootPool = {
    conditions: [],
    entries: spawner.items.map(
      (def): LootTableEntry => ({
        item: def.item,
        weight: def.weight,
        count: { min: def.spawnCount.min, max: def.spawnCount.max }
      })
    )
  };

  const table: GroundLootTableJson = {
    type: "ground",
    spawnChance: spawner.spawnChance,
    pools: [pool]
  };

  const fileName = path.join(GROUND_DIR, `${actorDefinition}.json`);
  fs.writeFileSync(fileName, JSON.stringify(table, null, 2), "utf8");
  groundCount++;
}

// ── Container spawners ─────────────────────────────────────────────────────────

let containerCount = 0;
for (const [spawnerName, spawner] of Object.entries(containerLootSpawners)) {
  const pool: LootPool = {
    conditions: [],
    entries: spawner.items.map(
      (def): LootTableEntry => ({
        item: def.item,
        weight: def.weight,
        count: { min: def.spawnCount.min, max: def.spawnCount.max }
      })
    )
  };

  const table: ContainerLootTableJson = {
    type: "container",
    maxItems: spawner.maxItems,
    pools: [pool]
  };

  const fileName = path.join(CONTAINER_DIR, `${spawnerName}.json`);
  fs.writeFileSync(fileName, JSON.stringify(table, null, 2), "utf8");
  containerCount++;
}

console.log(
  `Migration complete: ${groundCount} ground tables, ${containerCount} container tables written to data/2016/lootTables/`
);
