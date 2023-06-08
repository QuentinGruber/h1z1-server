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

import { DamageInfo } from "../../../types/zoneserver";
import { ZoneServer2016 } from "../zoneserver";
import { BaseEntity } from "./baseentity";

function getHeadActor(modelId: number): string {
  switch (modelId) {
    case 9240:
      return "SurvivorMale_Head_01.adr";
    case 9474:
      return "SurvivorFemale_Head_01.adr";
    case 9510:
      return `ZombieFemale_Head_0${Math.floor(Math.random() * 2) + 1}.adr`;
    case 9634:
      return `ZombieMale_Head_0${Math.floor(Math.random() * 3) + 1}.adr`;
    default:
      return "";
  }
}

export abstract class BaseLightweightCharacter extends BaseEntity {
  state: {
    position: Float32Array;
    rotation: Float32Array;
    lookAt: Float32Array;
    yaw: number;
  };
  flags = {
    bit0: 0,
    bit1: 0,
    bit2: 0,
    bit3: 0,
    bit4: 0,
    bit5: 0,
    bit6: 0,
    bit7: 0,
    bit8: 0,
    bit9: 0,
    bit10: 0,
    bit11: 0,
    projectileCollision: 0,
    bit13: 0,
    bit14: 0,
    bit15: 0,
    bit16: 0,
    bit17: 0,
    bit18: 0,
    bit19: 0,
    noCollide: 0,
    knockedOut: 0,
    bit22: 0,
    bit23: 0
  };
  isLightweight = true;
  positionUpdateType = 0;
  headActor = getHeadActor(this.actorModelId);
  profileId: number = 0;
  nameId: number = 0;
  health: number = 1000000;
  maxHealth: number = 1000000;
  useSimpleStruct: boolean = false;
  constructor(
    characterId: string,
    transientId: number,
    actorModelId: number,
    position: Float32Array,
    rotation: Float32Array,
    server: ZoneServer2016
  ) {
    super(characterId, transientId, actorModelId, position, rotation, server);
    this.state = {
      position: position,
      rotation: rotation,
      lookAt: new Float32Array([0, 0, 0, 1]),
      yaw: 0
    };
  }

  pGetSimpleNpc() {
    return {
      characterId: this.characterId,
      transientId: this.transientId,
      position: this.state.position,
      rotation: this.state.rotation,
      modelId: this.actorModelId,
      scale: this.scale,
      showHealth: true,
      health: (this.health / this.maxHealth) * 100
    };
  }

  pGetSimpleProxyHealth() {
    return {
      characterId: this.characterId,
      healthPercentage: (this.health / this.maxHealth) * 100
    };
  }

  damageSimpleNpc(
    server: ZoneServer2016,
    damageInfo: DamageInfo,
    dictionary: any
  ) {
    // todo: redo this
    this.health -= damageInfo.damage;
    server.sendDataToAllWithSpawnedEntity(
      dictionary,
      this.characterId,
      "Character.UpdateSimpleProxyHealth",
      this.pGetSimpleProxyHealth()
    );
  }

  /**
   * Gets the lightweight npc/pc packet fields for use in sendself, addlightweightnpc, or addlightweightpc
   */
  pGetLightweight() {
    return {
      characterId: this.characterId,
      transientId: this.transientId,
      actorModelId: this.actorModelId,
      // fix players / vehicles spawning in ground
      position: Array.from(this.state.position).map((pos, idx) => {
        return idx == 1 ? pos++ : pos;
      }),
      rotation: this.state.rotation,
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
}
