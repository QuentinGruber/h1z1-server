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
import { ZoneServer2016 } from "../zoneserver";
import { ZoneClient2016 } from "../classes/zoneclient";
import { DamageInfo } from "../../../types/zoneserver";
import { randomIntFromInterval } from "../../../utils/utils";
import { getRandomItem } from "../managers/worldobjectmanager";
import { BaseSimpleNpc } from "./basesimplenpc";
import { Effects, Items, ModelIds } from "../models/enums";
import { CharacterRemovePlayer } from "../../../types/zone2016packets";

export function getActorModelId(actorModel: string): number {
  switch (actorModel) {
    case "Common_Props_Crate_Long01.adr":
      return ModelIds.CRATE_LONG;
    case "Common_Props_Crate_Box01.adr":
      return ModelIds.CRATE_BOX_1;
    case "Common_Props_Crate_Box02.adr":
      return ModelIds.CRATE_BOX_2;
    case "Common_Props_Barell01.adr":
      return ModelIds.BARELL_1;
    default:
      console.log(`crate adr file not mapped to modelId: ${actorModel}`);
      return 0;
  }
}

export class Crate extends BaseSimpleNpc {
  spawnerId: number;
  requiredItemId: number = 0;
  rewardItems: number[] = [];
  maxHealth: number = 5000;
  health: number = this.maxHealth;
  spawnTimestamp: number = 0;
  destroyed: boolean = false;
  /** Time (milliseconds) for the crate to respawn in the world */
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
    renderDistance: number
  ) {
    super(characterId, transientId, actorModelId, position, rotation, server);
    this.spawnerId = zoneId;
    this.scale = scale;
    this.npcRenderDistance = renderDistance;
  }

  spawnLoot(server: ZoneServer2016) {
    // Don't generate loot if crate is already destroyed
    if (this.destroyed) return;
    const containerTables =
      server.worldObjectManager.lootTableManager.getContainerTables();
    const lootTable = containerTables["Crate"];
    if (!lootTable) return;
    const chance = Math.floor(Math.random() * 100) + 1;
    if (chance <= (lootTable.spawnChance ?? 100)) {
      const allEntries = lootTable.pools.flatMap((p) => p.entries);
      const entry = getRandomItem(allEntries);
      if (entry) {
        const spawnedItem = server.worldObjectManager.createLootEntity(
          server,
          server.generateItem(
            entry.item,
            randomIntFromInterval(entry.count.min, entry.count.max)
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
          c.spawnedEntities.add(spawnedItem);
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

    this.generateWoodPlanks(server, damageInfo);
    this.destroy(server);
  }

  generateWoodPlanks(server: ZoneServer2016, damageInfo: DamageInfo) {
    const client = server.getClientByCharId(damageInfo.entity);
    if (!client) return;

    server.lootCrateWithChance(client, 5);
    const weapon = client.character.getEquippedWeapon();
    if (!weapon) return;

    // Don't generate wood planks if crate is already destroyed
    if (this.destroyed) return;

    // 20% chance to spawn wood planks, 60% if it's a crowbar
    const woodPlanksChance = Math.floor(Math.random() * 100) + 1;
    const spawnChanceWoodPlank =
      weapon.itemDefinitionId == Items.WEAPON_CROWBAR ? 60 : 20;

    if (woodPlanksChance < spawnChanceWoodPlank) {
      const woodPlankItem = server.worldObjectManager.createLootEntity(
        server,
        server.generateItem(Items.WOOD_PLANK),
        new Float32Array([
          this.state.position[0],
          this.actorModelId == ModelIds.CRATE_BOX_2
            ? this.state.position[1] + 0.1
            : this.state.position[1],
          this.state.position[2],
          1
        ]),
        new Float32Array([0, 0, 0, 0])
      );
      if (!woodPlankItem) return;
      server.executeFuncForAllReadyClientsInRange((c) => {
        c.spawnedEntities.add(woodPlankItem);
        server.addLightweightNpc(c, woodPlankItem);
      }, woodPlankItem);
    }
  }

  destroy(server: ZoneServer2016): boolean {
    if (server.isSurvival()) {
      this.spawnLoot(server);
    }

    this.destroyed = true;
    this.spawnTimestamp = Date.now() + this.respawnTime;
    this.health = this.maxHealth;
    server.sendDataToAllWithSpawnedEntity<CharacterRemovePlayer>(
      server._crates,
      this.characterId,
      "Character.RemovePlayer",
      {
        characterId: this.characterId,
        unknownWord1: 1,
        effectId: Effects.PFX_Damage_Crate_01m,
        timeToDisappear: 0,
        effectDelay: 0
      }
    );

    for (const a in server._clients) {
      const client = server._clients[a];
      client.spawnedEntities.delete(server._crates[this.characterId]);
    }
    return true;
    // crates cannot get deleted from dictionarries, need separate function to despawn
  }

  OnProjectileHit(server: ZoneServer2016, damageInfo: DamageInfo) {
    this.damage(server, damageInfo);
  }

  OnMeleeHit(server: ZoneServer2016, damageInfo: DamageInfo) {
    const damage = damageInfo.damage * 2;
    this.damage(server, { ...damageInfo, damage });
    const client = server.getClientByCharId(damageInfo.entity),
      weapon = client?.character.getEquippedWeapon();

    if (!client || !weapon) return;

    const durabilityDamage = server.getDurabilityDamage(
      weapon.itemDefinitionId
    );

    server.damageItem(client.character, weapon, durabilityDamage);
  }

  /* eslint-disable @typescript-eslint/no-unused-vars */
  OnPlayerSelect(
    server: ZoneServer2016,
    client: ZoneClient2016,
    isInstant?: boolean
    /* eslint-enable @typescript-eslint/no-unused-vars */
  ) {}
}
