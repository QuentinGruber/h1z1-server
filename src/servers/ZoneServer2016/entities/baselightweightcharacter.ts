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

import { AddLightweightNpc, AddSimpleNpc } from "types/zone2016packets";
import { ZoneServer2016 } from "../zoneserver";
import { BaseEntity } from "./baseentity";
import { ModelIds, PositionUpdateType } from "../models/enums";
import { CrowdAgent } from "recast-navigation";

function getHeadActor(modelId: number): string {
  switch (modelId) {
    case ModelIds.SURVIVOR_MALE_HEAD_01:
      return "SurvivorMale_Head_01.adr";
    case ModelIds.SURVIVAL_FEMALE_HEAD_01:
      return "SurvivorFemale_Head_01.adr";
    case ModelIds.ZOMBIE_FEMALE_HEAD:
      return `ZombieFemale_Head_0${Math.floor(Math.random() * 2) + 1}.adr`;
    case ModelIds.ZOMBIE_MALE_HEAD:
      return `ZombieMale_Head_0${Math.floor(Math.random() * 3) + 1}.adr`;
    default:
      return "";
  }
}

export abstract class BaseLightweightCharacter extends BaseEntity {
  /** State of the BaseLightweightCharacter, includes: state (Float32Array),
   * rotation(Float32Array), lookAt(Float32Array), and yaw (number) */
  state: {
    position: Float32Array;
    rotation: Float32Array;
    lookAt: Float32Array;
    yaw: number;
  };

  /** Adjustable flags for the lightweight, useful flags:
   * nonAttackable - disables melee flinch
   * noCollide - determines if NpcCollision packet gets sent on player collide
   * bit13 - causes a crash if 1 with noCollide 1
   * knockedOut - currently used for determining if a character is dead
   */
  flags = {
    bit0: 0,
    bit1: 0,
    bit2: 0,
    bit3: 0,
    bit4: 0,
    bit5: 0,
    bit6: 0,
    bit7: 0,
    nonAttackable: 0,
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

  /** Returns true if the character is a lightweight */
  isLightweight = true;

  /** Determines if the lightweight is moving with the positionUpdate - Avcio
   */
  positionUpdateType: PositionUpdateType = PositionUpdateType.STATIC;

  /** Returns the modelId of the lightweight, zombies or players */
  headActor = getHeadActor(this.actorModelId);

  /** Used for constructions */
  profileId: number = 0;

  /** Id of the lightweight, used in determining the proper name for HUDTimer and InteractionString */
  nameId: number = 0;

  /** Health of the lightweight  */
  health: number = 1000000;

  /** Maximum health of the lightweight */
  maxHealth: number = 1000000;

  /** Determines if the lightweight should be used as a SimpleNpc (non-moving) */
  useSimpleStruct: boolean = false;

  movementVersion: number = 0;

  navAgent?: CrowdAgent;

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

  pGetSimpleNpc(): AddSimpleNpc {
    return {
      characterId: this.characterId,
      transientId: this.transientId,
      position: this.state.position,
      rotation: this.state.rotation,
      modelId: this.actorModelId,
      scale: this.scale,
      health: (this.health / this.maxHealth) * 100
    };
  }

  pGetSimpleProxyHealth() {
    return {
      characterId: this.characterId,
      healthPercentage: (this.health / this.maxHealth) * 100
    };
  }

  /**
   * Gets the lightweight npc/pc packet fields for use in sendself, addlightweightnpc, or addlightweightpc
   */
  pGetLightweight(): AddLightweightNpc {
    return {
      characterId: this.characterId,
      transientId: this.transientId,
      actorModelId: this.temporaryActorModelId
        ? this.temporaryActorModelId
        : this.actorModelId,
      // fix players / vehicles spawning in ground
      position: new Float32Array(
        Array.from(this.state.position).map((pos, idx) => {
          return idx == 1 ? pos++ : pos;
        })
      ),
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
      movementVersion: this.movementVersion,
      headActor: this.headActor,
      attachedObject: {}
    };
  }
}
