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
import { BaseLightweightCharacter } from "./baselightweightcharacter";
import { ZoneClient2016 } from "../classes/zoneclient";
import { DamageInfo } from "../../../types/zoneserver";
import { randomIntFromInterval, isPosInRadius } from "../../../utils/utils";
import { containerLootSpawners } from "../data/lootspawns";
import { getRandomItem } from "../managers/worldobjectmanager";

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

export class Crate extends BaseLightweightCharacter {
  detonated = false;
  spawnerId: number;
  requiredItemId: number = 0;
  rewardItems: number[] = [];
  health: number = 5000;
  spawnTimestamp: number = 0;
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
  }

  spawnLoot(server: ZoneServer2016) {
    const lootTable = containerLootSpawners["Crate"];
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
          this.state.position,
          new Float32Array([0, 0, 0, 0])
        );
        if (!spawnedItem) return;
        for (const a in server._clients) {
          const c = server._clients[a];
          if (
            isPosInRadius(
              spawnedItem.npcRenderDistance
                ? spawnedItem.npcRenderDistance
                : server._charactersRenderDistance,
              spawnedItem.state.position,
              c.character.state.position
            )
          ) {
            c.spawnedEntities.push(spawnedItem);
            server.addLightweightNpc(c, spawnedItem);
          }
        }
      }
    }
  }

  OnProjectileHit(server: ZoneServer2016, damageInfo: DamageInfo) {
    this.health -= damageInfo.damage;
    if (this.health > 0) return;
    this.spawnLoot(server);
    server.deleteCrate(this, 255);
  }

  /* eslint-disable @typescript-eslint/no-unused-vars */
  OnPlayerSelect(
    server: ZoneServer2016,
    client: ZoneClient2016,
    isInstant?: boolean
    /* eslint-enable @typescript-eslint/no-unused-vars */
  ) {
    this.destroy(server);
  }
}
