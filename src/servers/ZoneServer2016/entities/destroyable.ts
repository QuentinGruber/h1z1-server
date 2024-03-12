// ======================================================================
//
//   GNU GENERAL PUBLIC LICENSE
//   Version 3, 29 June 2007
//   copyright (C) 2020 - 2021 Quentin Gruber
//   copyright (C) 2021 - 2024 H1emu community
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
import { Effects, ModelIds } from "../models/enums";
import { AddLightweightNpc, AddSimpleNpc } from "types/zone2016packets";
import { BaseSimpleNpc } from "./basesimplenpc";

function getDestroyedModels(actorModelId: ModelIds): number[] {
  switch (actorModelId) {
    case ModelIds.GLASS_WINDOW_01:
      return [
        ModelIds.GLASS_WINDOW_DESTROYED_1,
        ModelIds.GLASS_WINDOW_DESTROYED_2,
        ModelIds.GLASS_WINDOW_DESTROYED_3
      ];
    case ModelIds.TINTED_WINDOW_01:
      return [
        ModelIds.TINTED_WINDOW_DESTROYED_1,
        ModelIds.TINTED_WINDOW_DESTROYED_2,
        ModelIds.TINTED_WINDOW_DESTROYED_3
      ];
    default:
      return [];
  }
}

function getMaxHealth(actorModelId: ModelIds): number {
  switch (actorModelId) {
    case ModelIds.GLASS_WINDOW_01:
    case ModelIds.TINTED_WINDOW_01:
      return 2000;
    case ModelIds.FENCES_WOOD_PLANKS_GREY_PLANK:
    case ModelIds.FENCES_WOOD_PLANKS_GREY_POSTS_1X1:
    case ModelIds.FENCES_WOOD_PLANKS_GREY_1X1:
    case ModelIds.FENCES_WOOD_PLANKS_GREY_POSTS_1X2:
    case ModelIds.FENCES_WOOD_PLANKS_GREY_GAP_1X1:
      return 7500;
    default:
      return 2000;
  }
}

function getDestroyedEffectId(actorModelId: ModelIds): Effects {
  switch (actorModelId) {
    case ModelIds.GLASS_WINDOW_01:
    case ModelIds.TINTED_WINDOW_01:
      return Effects.PFX_Damage_GlassWindow_House;
    case ModelIds.FENCES_WOOD_PLANKS_GREY_PLANK:
    case ModelIds.FENCES_WOOD_PLANKS_GREY_POSTS_1X1:
    case ModelIds.FENCES_WOOD_PLANKS_GREY_1X1:
    case ModelIds.FENCES_WOOD_PLANKS_GREY_POSTS_1X2:
    case ModelIds.FENCES_WOOD_PLANKS_GREY_GAP_1X1:
      return Effects.PFX_Damage_Fence_ResidTall01;
    default:
      return Effects.PFX_Damage_GlassWindow_House;
  }
}
export class Destroyable extends BaseSimpleNpc {
  spawnerId: number;
  maxHealth: number;
  health: number;
  destroyedModel: number;
  destroyedModels: number[] = [];
  destroyed: boolean = false;
  destroyedEffectId: Effects;
  constructor(
    characterId: string,
    transientId: number,
    actorModelId: ModelIds,
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
    this.destroyedEffectId = getDestroyedEffectId(this.actorModelId);
    this.destroyedModels = getDestroyedModels(this.actorModelId);
    this.destroyedModel =
      this.destroyedModels[(this.destroyedModels.length * Math.random()) | 0];
    this.maxHealth = getMaxHealth(actorModelId);
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
    if (!this.destroyed) {
      this.destroyed = true;
      server.sendDataToAllWithSpawnedEntity(
        server._destroyables,
        this.characterId,
        "Character.RemovePlayer",
        {
          characterId: this.characterId,
          unknownWord1: 1,
          effectId: this.destroyedEffectId
        }
      );
      if (this.destroyedModel && useDestroyedModel) {
        server.sendDataToAllWithSpawnedEntity(
          server._destroyables,
          this.characterId,
          "AddLightweightNpc",
          this.pGetLightweight()
        );
      }
      return true;
    }
    server.deleteEntity(
      this.characterId,
      server._destroyables,
      Effects.PFX_Damage_GlassWindow_House
    );
    return true;
  }

  OnProjectileHit(server: ZoneServer2016, damageInfo: DamageInfo) {
    if (this.destroyed) return;
    this.damage(server, damageInfo);
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
