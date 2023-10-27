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
import { eul2quat } from "../../../utils/utils";
import { Effects } from "../models/enums";
import { AddLightweightNpc, AddSimpleNpc } from "types/zone2016packets";
import { BaseSimpleNpc } from "./basesimplenpc";

function getDestroyedModels(actorModel: string): number[] {
  switch (actorModel) {
    case "Common_Props_GlassWindow01.adr":
      return [8027, 8028, 8029];
    case "Common_Props_TintedWindow01.adr":
      return [9433, 9434, 9435];
    default:
      return [];
  }
}

export class Destroyable extends BaseSimpleNpc {
  spawnerId: number;
  maxHealth: number;
  health: number;
  destroyedModel: number;
  destroyedModels: number[] = [];
  destroyed: boolean = false;
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
    this.destroyedModels = getDestroyedModels(actorModel);
    this.destroyedModel =
      this.destroyedModels[(this.destroyedModels.length * Math.random()) | 0];
    this.maxHealth = actorModel.toLowerCase().includes("fence") ? 30000 : 2000;
    this.health = this.maxHealth;
  }

  damage(server: ZoneServer2016, damageInfo: DamageInfo) {
    this.health -= damageInfo.damage;
    server.sendDataToAllWithSpawnedEntity(
      server._destroyables,
      this.characterId,
      "Character.UpdateSimpleProxyHealth",
      this.pGetSimpleProxyHealth()
    );
    if (this.health > 0) return;
    this.destroy(server, true);
  }

  destroy(server: ZoneServer2016, useDestroyedModel: boolean = false): boolean {
    if (!this.destroyed && this.destroyedModel && useDestroyedModel) {
      this.destroyed = true;
      server.sendDataToAllWithSpawnedEntity(
        server._destroyables,
        this.characterId,
        "Character.RemovePlayer",
        {
          characterId: this.characterId,
          unknownWord1: 1,
          effectId: Effects.PFX_Damage_GlassWindow_House
        }
      );
      server.sendDataToAllWithSpawnedEntity(
        server._destroyables,
        this.characterId,
        "AddLightweightNpc",
        this.pGetLightweight()
      );
      return true;
    }
    server.deleteEntity(
      this.characterId,
      server._destroyables,
      Effects.PFX_Damage_GlassWindow_House
    );
    return true;
  }

  // eslint-disable-next-line
  OnProjectileHit(server: ZoneServer2016, damageInfo: DamageInfo) {
    if (this.destroyed) return;
    this.destroy(server, true);
  }

  OnMeleeHit(server: ZoneServer2016, damageInfo: DamageInfo) {
    if (this.destroyed) return;
    this.damage(server, damageInfo);
  }

  pGetSimpleNpc(): AddSimpleNpc {
    return {
      characterId: this.characterId,
      transientId: this.transientId,
      position: this.state.position,
      rotation: this.state.rotation,
      modelId: this.destroyed ? this.destroyedModel : this.actorModelId,
      scale: this.scale,
      health: (this.health / this.maxHealth) * 100
    };
  }
  pGetLightweight(): AddLightweightNpc {
    return {
      characterId: this.characterId,
      transientId: this.transientId,
      actorModelId: this.destroyed ? this.destroyedModel : this.actorModelId,
      position: new Float32Array(
        Array.from(this.state.position).map((pos, idx) => {
          return idx == 1 ? pos++ : pos;
        })
      ),
      rotation: eul2quat(new Float32Array([this.state.rotation[1], 0, 0])),
      scale: this.scale,
      isLightweight: true,
      flags: {
        flags1: {},
        flags2: {},
        flags3: {}
      },
      attachedObject: {}
    };
  }

  /* eslint-disable @typescript-eslint/no-unused-vars */
  OnPlayerSelect(
    server: ZoneServer2016,
    client: ZoneClient2016,
    isInstant?: boolean
    /* eslint-enable @typescript-eslint/no-unused-vars */
  ) {}
}
