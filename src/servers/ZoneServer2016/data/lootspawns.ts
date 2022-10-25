import { ContainerLootSpawner, LootSpawner } from "types/zoneserver"
import { Items } from "../enums"

export const lootSpawners: {[lootSpawner: string]: LootSpawner} = {
  "ItemSpawner_Weapon_M16A4.adr": {
    spawnChance: 100,
    items:  [
      {
        item: Items.WEAPON_AR15,
        weight: 100,
        spawnCount: {
         min: 1,
          max: 1
        }
      }
    ],
  },
  "ItemSpawner_AmmoBox02_M16A4.adr": {
    spawnChance: 100,
    items:  [
      {
        item: Items.AMMO_223,
        weight: 100,
        spawnCount: {
         min: 5,
          max: 10
        }
      }
    ],
  },
  "ItemSpawner_AmmoBox02.adr": {
    spawnChance: 100,
    items:  [
      {
        item: Items.AMMO_223,
        weight: 100,
        spawnCount: {
         min: 1,
          max: 5
        }
      }
    ],
  }
}

export const containerLootSpawners: {[lootSpawner: string]: ContainerLootSpawner} = {
  // TODO WHEN CONTAINERS WORK
  "test-container": {
    spawnChance: 100,
    maxItems: 5,
    items: [
      {
        item: Items.AMMO_223,
        weight: 100,
        spawnCount: {
         min: 1,
          max: 5
        }
      }
    ]
  }
}