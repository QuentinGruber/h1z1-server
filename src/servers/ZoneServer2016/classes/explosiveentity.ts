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
import { ZoneServer2016 } from "../zoneserver";
import { BaseLightweightCharacter } from "./baselightweightcharacter";
import { ZoneClient2016 } from "./zoneclient";

export class ExplosiveEntity extends BaseLightweightCharacter {
  isIED = false;
  mineTimer?: NodeJS.Timeout;
  npcRenderDistance = 300;
  detonated = false;
  constructor(
    characterId: string,
    transientId: number,
    actorModelId: number,
    position: Float32Array,
    rotation: Float32Array,
    isIED: boolean = false
  ) {
    super(characterId, transientId, actorModelId, position, rotation);
    this.isIED = isIED;
  }

  ignite(server: ZoneServer2016, client: ZoneClient2016) {
    if (!this.isIED) {
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
    this.detonated = true;
    server.sendCompositeEffectToAllInRange(600, "", this.state.position, 1875);
    server.deleteEntity(this.characterId, server._explosives);
    client
      ? server.explosionDamage(this.state.position, this.characterId, client)
      : server.explosionDamage(this.state.position, this.characterId);
  }

  OnProjectileHit(server: ZoneServer2016, damageInfo: DamageInfo) {
    this.detonate(server, server.getClientByCharId(damageInfo.entity));
  }
}
