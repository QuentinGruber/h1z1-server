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
import { eul2quat } from "../../../utils/utils";
import { Items } from "../models/enums";

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

export class Destroyable extends BaseLightweightCharacter {
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
    this.useSimpleStruct = true;
  }

  OnProjectileHit(server: ZoneServer2016, damageInfo: DamageInfo) {
    if (this.destroyed) return;
    if (damageInfo.weapon == Items.WEAPON_SHOTGUN) damageInfo.damage *= 2.5;
    this.damageSimpleNpc(server, damageInfo, server._crates);
    if (this.health > 0) return;
    this.destroyed = true;
    if (this.destroyedModel) {
      server.sendDataToAllWithSpawnedEntity(
        server._destroyables,
        this.characterId,
        "Character.RemovePlayer",
        {
          characterId: this.characterId,
          unknownWord1: 1,
          effectId: 165
        }
      );
      server.sendDataToAllWithSpawnedEntity(
        server._destroyables,
        this.characterId,
        "AddLightweightNpc",
        this.pGetLightweight()
      );
    } else {
      server.deleteEntity(this.characterId, server._destroyables, 242);
    }
  }

  pGetSimpleNpc() {
    return {
      characterId: this.characterId,
      transientId: this.transientId,
      position: this.state.position,
      rotation: this.state.rotation,
      modelId: this.destroyed ? this.destroyedModel : this.actorModelId,
      scale: this.scale,
      showHealth: true,
      health: (this.health / this.maxHealth) * 100
    };
  }
  pGetLightweight() {
    return {
      characterId: this.characterId,
      transientId: this.transientId,
      actorModelId: this.destroyed ? this.destroyedModel : this.actorModelId,
      position: Array.from(this.state.position).map((pos, idx) => {
        return idx == 1 ? pos++ : pos;
      }),
      rotation: eul2quat(new Float32Array([this.state.rotation[1], 0, 0])),
      scale: this.scale,
      positionUpdateType: this.positionUpdateType,
      profileId: this.profileId,
      isLightweight: this.isLightweight,
      flags: {
        flags1: this.flags,
        flags2: this.flags,
        flags3: this.flags
      },
      headActor: this.headActor
    };
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
