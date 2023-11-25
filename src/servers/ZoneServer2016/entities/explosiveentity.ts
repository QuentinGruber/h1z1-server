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

import { DamageInfo } from "types/zoneserver";
import { getDistance, randomIntFromInterval } from "../../../utils/utils";
import { Effects, Items } from "../models/enums";
import { ZoneServer2016 } from "../zoneserver";
import { BaseLightweightCharacter } from "./baselightweightcharacter";
import { ZoneClient2016 } from "../classes/zoneclient";
import { CharacterPlayWorldCompositeEffect } from "types/zone2016packets";

export class ExplosiveEntity extends BaseLightweightCharacter {
  itemDefinitionId: number;
  mineTimer?: NodeJS.Timeout;
  npcRenderDistance = 300;
  detonated = false;
  triggerExplosionShots =
    this.isLandmine() || this.isIED() ? 1 : Math.floor(Math.random() * 2) + 1; // random number 1-2 neccesary shots if fuel
  constructor(
    characterId: string,
    transientId: number,
    actorModelId: number,
    position: Float32Array,
    rotation: Float32Array,
    server: ZoneServer2016,
    itemDefinitionId: number
  ) {
    super(characterId, transientId, actorModelId, position, rotation, server);
    this.itemDefinitionId = itemDefinitionId;
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
      this.detonate(server, client);
    }, 10000);
  }

  detonate(server: ZoneServer2016, client?: ZoneClient2016) {
    if (!server._explosives[this.characterId] || this.detonated) return;
    this.detonated = true;
    server.sendCompositeEffectToAllInRange(600, "", this.state.position, 1875);
    server.deleteEntity(this.characterId, server._explosives);
    server.explosionDamage(
      this.state.position,
      this.characterId,
      this.itemDefinitionId,
      client
    );
  }

  arm(server: ZoneServer2016) {
    this.mineTimer = setTimeout(() => {
      if (!server._explosives[this.characterId]) {
        return;
      }
      for (const a in server._clients) {
        if (
          getDistance(
            server._clients[a].character.state.position,
            this.state.position
          ) < 0.6
        ) {
          this.detonate(server);
          return;
        }
      }
      for (const a in server._vehicles) {
        if (
          getDistance(server._vehicles[a].state.position, this.state.position) <
          1.8
        ) {
          this.detonate(server);
          return;
        }
      }
      if (server._explosives[this.characterId]) {
        this.mineTimer?.refresh();
      }
    }, 90);
  }

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
    this.detonate(server, server.getClientByCharId(damageInfo.entity));
  }

  destroy(server: ZoneServer2016): boolean {
    return server.deleteEntity(this.characterId, server._explosives);
  }
}
