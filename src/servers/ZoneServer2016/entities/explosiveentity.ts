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
import { getDistance } from "../../../utils/utils";
import { Items } from "../models/enums";
import { ZoneServer2016 } from "../zoneserver";
import { BaseLightweightCharacter } from "./baselightweightcharacter";
import { ZoneClient2016 } from "../classes/zoneclient";

export class ExplosiveEntity extends BaseLightweightCharacter {
  itemDefinitionId: number;
  mineTimer?: NodeJS.Timeout;
  npcRenderDistance = 300;
  detonated = false;
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
    server.sendDataToAllWithSpawnedEntity(
      server._explosives,
      this.characterId,
      "Command.PlayDialogEffect",
      {
        characterId: this.characterId,
        effectId: 5034,
      }
    );
    server.sendDataToAllWithSpawnedEntity(
      server._explosives,
      this.characterId,
      "Command.PlayDialogEffect",
      {
        characterId: this.characterId,
        effectId: 185,
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
    client
      ? server.explosionDamage(this.state.position, this.characterId, client)
      : server.explosionDamage(this.state.position, this.characterId);
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
          2.2
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
    this.detonate(server, server.getClientByCharId(damageInfo.entity));
  }
}
