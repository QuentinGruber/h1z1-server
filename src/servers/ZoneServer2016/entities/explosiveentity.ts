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

import { DamageInfo } from "types/zoneserver";
import {
  getDistance,
  isChristmasSeason,
  randomIntFromInterval
} from "../../../utils/utils";
import { Effects, Items } from "../models/enums";
import { ZoneServer2016 } from "../zoneserver";
import { BaseLightweightCharacter } from "./baselightweightcharacter";
import { ZoneClient2016 } from "../classes/zoneclient";
import { CharacterPlayWorldCompositeEffect } from "types/zone2016packets";
import { scheduler } from "node:timers/promises";
import { BaseEntity } from "./baseentity";

export class ExplosiveEntity extends BaseLightweightCharacter {
  /** Id of the item - See ServerItemDefinitions.json for more information */
  itemDefinitionId: number;

  /** The distance where the explosive will render for the player */
  npcRenderDistance = 300;

  /** Returns true upon explosion of the explosive */
  detonated = false;

  /** Used for shooting explosion with projectiles, 1 for IEDS and a coinflip between 1 and 2 for biofuel/ethanol */
  triggerExplosionShots =
    this.isLandmine() || this.isIED() ? 1 : Math.floor(Math.random() * 2) + 1;

  /** the characterId from who place this to keep track */
  ownerCharacterId: string;

  isAwaitingExplosion: boolean = false;

  constructor(
    characterId: string,
    transientId: number,
    actorModelId: number,
    position: Float32Array,
    rotation: Float32Array,
    server: ZoneServer2016,
    itemDefinitionId: number,
    ownerCharacterId: string = ""
  ) {
    super(characterId, transientId, actorModelId, position, rotation, server);
    this.itemDefinitionId = itemDefinitionId;
    this.ownerCharacterId = ownerCharacterId;
  }

  isIED() {
    return this.itemDefinitionId == Items.IED;
  }

  isLandmine() {
    return this.itemDefinitionId == Items.LANDMINE;
  }

  ignite(server: ZoneServer2016, client: ZoneClient2016) {
    if (!this.isIED()) {
      return;
    }
    const pos = this.state.position;
    server.sendDataToAllWithSpawnedEntity<CharacterPlayWorldCompositeEffect>(
      server._explosives,
      this.characterId,
      "Character.PlayWorldCompositeEffect",
      {
        characterId: this.characterId,
        effectId: Effects.PFX_Fire_Lighter,
        position: new Float32Array([pos[0], pos[1] + 0.1, pos[2], 1]),
        effectTime: 8
      }
    );

    server.sendDataToAllWithSpawnedEntity<CharacterPlayWorldCompositeEffect>(
      server._explosives,
      this.characterId,
      "Character.PlayWorldCompositeEffect",
      {
        characterId: this.characterId,
        effectId: Effects.EFX_Candle_Flame_01,
        position: new Float32Array([pos[0], pos[1] + 0.1, pos[2], 1]),
        effectTime: 8
      }
    );
    setTimeout(() => {
      this.detonate(client.character.characterId);
    }, 10000);
  }

  detonate(characterId: string = "") {
    let client = this.server.getClientByCharId(characterId);
    if (!this.server._explosives[this.characterId] || this.detonated) return;
    this.detonated = true;
    this.server.sendCompositeEffectToAllInRange(
      600,
      "",
      this.state.position,
      Effects.PFX_Impact_Explosion_Landmine_Dirt_10m
    );
    if (isChristmasSeason()) {
      this.server.sendCompositeEffectToAllInRange(
        600,
        "",
        this.state.position,
        Effects.PFX_Seasonal_Holiday_Snow_skel
      );
    }
    queueMicrotask(() => {
      this.server.deleteEntity(this.characterId, this.server._explosives);
    });
    this.server.explosionDamage(this, client);
  }

  /** Used by landmines to arm their explosivenss */
  async arm(server: ZoneServer2016) {
    // Wait 10 seconds before activating the trap
    await scheduler.wait(10_000);
    server.aiManager.addEntity(this);
  }

  /** Called when the explosive gets hit by a projectile (bullet, arrow, etc.) */
  OnProjectileHit(server: ZoneServer2016, damageInfo: DamageInfo) {
    this.triggerExplosionShots -= 1;
    if (
      damageInfo.weapon == Items.WEAPON_SHOTGUN ||
      damageInfo.weapon == Items.WEAPON_NAGAFENS_RAGE
    ) {
      // prevent shotguns one shotting gas cans
      const randomInt = randomIntFromInterval(0, 100);
      if (randomInt < 90) this.triggerExplosionShots += 1;
    }
    if (this.triggerExplosionShots > 0) return;
    this.detonate(damageInfo.entity);
  }

  async OnExplosiveHit(
    server: ZoneServer2016,
    sourceEntity: BaseEntity,
    client?: ZoneClient2016,
    waitTime: number = 0,
    useRaycast: boolean = false
  ) {
    if (this.isAwaitingExplosion) return;
    this.isAwaitingExplosion = true;
    if (this.characterId == sourceEntity.characterId) return;
    if (!useRaycast) {
      if (getDistance(sourceEntity.state.position, this.state.position) >= 2)
        return;
    }
    await scheduler.wait(waitTime);
    if (server._spawnedItems[this.characterId]) {
      const itemObject = server._spawnedItems[this.characterId];
      server.deleteEntity(this.characterId, server._spawnedItems);
      delete server.worldObjectManager.spawnedLootObjects[itemObject.spawnerId];
    }
    if (this.detonated) return;
    this.detonate(client?.character.characterId);
  }

  destroy(): boolean {
    this.detonate();
    return true;
  }
}
