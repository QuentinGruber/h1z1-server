// ======================================================================
//
//   GNU GENERAL PUBLIC LICENSE
//   Version 3, 29 June 2007
//   copyright (C) 2020 - 2021 Quentin Gruber
//   copyright (C) 2021 - 2023 H1emu community
//
//   https://github.com/QuentinGruber/h1z1-server
//   https://www.npmjs.com/package/h1z1-server
//
//   Based on https://github.com/psemu/soe-network
// ======================================================================
import { ZoneServer2016 } from "../zoneserver";
import { ZoneClient2016 } from "../classes/zoneclient";
import { DamageInfo } from "../../../types/zoneserver";
import { randomIntFromInterval, isPosInRadius } from "../../../utils/utils";
import { containerLootSpawners } from "../data/lootspawns";
import { getRandomItem } from "../managers/worldobjectmanager";
import { BaseSimpleNpc } from "./basesimplenpc";
import { Effects } from "../models/enums";

function getActorModelId(actorModel: string): number {
  switch (actorModel) {
    case "Common_Props_Crate_Long01.adr":
      return 8014;
    case "Common_Props_Crate_Box01.adr":
      return 8013;
    case "Common_Props_Crate_Box02.adr":
      return 9088;
    default:
      console.log(`crate adr file not mapped to modelId: ${actorModel}`);
      return 0;
  }
}

function isBuffedCrate(position: Float32Array): boolean {
  const buffedPostions: [number, number, number, number][] = [
    [1814.5, 48.88, 224.07, 1],
    [2043.44, 46.28, 423.75, 1],
    [2216.36, 49.72, 772.95, 1],
    [2652.26, 57.87, 848.76, 1],
    [2303.37, 54.47, 1203.46, 1],
    [2333.07, 54.47, 1801.1, 1],
    [2601.42, 32.0, 2046.66, 1],
    [-2813.46, 47.66, 2735.36, 1],
    [-2399.8, 16.19, 1871.99, 1],
    [-3005.66, 52.51, -2055.08, 1],
    [418.6, 21.66, -723.23, 1],
    [-1514.96, 354.0, -832.32, 1],
    [-1781.56, 75.91, 1717.67, 1],
    [-448.43, 71.63, 1440.45, 1],
    [-65.6, 53.75, 847.88, 1],
    [-66.63, 56.4, 775.5, 1],
    [101.67, 34.26, 254.99, 1],
    [1604.81, 47.82, -592.11, 1],
    [1587.97, 57.38, -222.97, 1],
    [-2063.19, 62.97, 2722.55, 1]
  ];
  let result = false;
  for (const a of buffedPostions) {
    if (isPosInRadius(40, position, new Float32Array(a))) result = true;
  }
  return result;
}

export class Crate extends BaseSimpleNpc {
  spawnerId: number;
  requiredItemId: number = 0;
  rewardItems: number[] = [];
  maxHealth: number = 5000;
  health: number = this.maxHealth;
  spawnTimestamp: number = 0;
  isBuffed: boolean;
  respawnTime = 900000; // 15min respawn time
  constructor(
    characterId: string,
    transientId: number,
    actorModelId: number,
    position: Float32Array,
    rotation: Float32Array,
    server: ZoneServer2016,
    scale: Float32Array,
    zoneId: number,
    renderDistance: number,
    actorModel: string
  ) {
    super(characterId, transientId, actorModelId, position, rotation, server);
    this.spawnerId = zoneId;
    this.scale = scale;
    this.npcRenderDistance = renderDistance;
    this.actorModelId = getActorModelId(actorModel);
    this.isBuffed = isBuffedCrate(this.state.position);
  }

  spawnLoot(server: ZoneServer2016) {
    const lootTable = this.isBuffed
      ? containerLootSpawners["Crate_buffed"]
      : containerLootSpawners["Crate"];
    const chance = Math.floor(Math.random() * 100) + 1; // temporary spawnchance
    if (chance <= lootTable.spawnChance) {
      const item = getRandomItem(lootTable.items);
      if (item) {
        const spawnedItem = server.worldObjectManager.createLootEntity(
          server,
          server.generateItem(
            item.item,
            randomIntFromInterval(item.spawnCount.min, item.spawnCount.max)
          ),
          new Float32Array([
            this.state.position[0],
            this.actorModelId == 9088
              ? this.state.position[1] + 0.1
              : this.state.position[1],
            this.state.position[2],
            1
          ]),
          new Float32Array([0, 0, 0, 0])
        );
        if (!spawnedItem) return;
        server.executeFuncForAllReadyClientsInRange((c) => {
          c.spawnedEntities.push(spawnedItem);
          server.addLightweightNpc(c, spawnedItem);
        }, spawnedItem);
      }
    }
  }

  damage(server: ZoneServer2016, damageInfo: DamageInfo) {
    this.health -= damageInfo.damage;
    server.sendDataToAllWithSpawnedEntity(
      server._crates,
      this.characterId,
      "Character.UpdateSimpleProxyHealth",
      this.pGetSimpleProxyHealth()
    );
    if (this.health > 0) return;
    this.destroy(server);
  }

  destroy(server: ZoneServer2016): boolean {
    this.spawnLoot(server);

    this.spawnTimestamp = Date.now() + this.respawnTime;
    this.health = this.maxHealth;
    return server.deleteEntity(
      this.characterId,
      server._crates,
      Effects.PFX_Damage_Crate_01m
    );
  }

  OnProjectileHit(server: ZoneServer2016, damageInfo: DamageInfo) {
    this.damage(server, damageInfo);
  }

  OnMeleeHit(server: ZoneServer2016, damageInfo: DamageInfo) {
    const damage = damageInfo.damage * 2;
    this.damage(server, { ...damageInfo, damage });
  }

  /* eslint-disable @typescript-eslint/no-unused-vars */
  OnPlayerSelect(
    server: ZoneServer2016,
    client: ZoneClient2016,
    isInstant?: boolean
    /* eslint-enable @typescript-eslint/no-unused-vars */
  ) {}
}
