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

import { AddLightweightNpc, AddSimpleNpc } from "types/zone2016packets";
import { ZoneServer2016 } from "../zoneserver";
import { BaseEntity } from "./baseentity";
import { ModelIds, PositionUpdateType } from "../models/enums";
import { CrowdAgent } from "recast-navigation";

const FEMALE_ZOMBIE_HAIR_MODELS = [
  "ZombieFemale_Hair_01.adr",
  "SurvivorFemale_Hair_Afro.adr",
  "SurvivorFemale_Hair_AfroMohawk.adr",
  "SurvivorFemale_Hair_LongWavy.adr",
  "SurvivorFemale_Hair_MediumMessy.adr",
  "SurvivorFemale_Hair_MediumWavy.adr",
  "SurvivorFemale_Hair_ShortBun.adr",
  "SurvivorFemale_Hair_ShortMessy.adr",
  "SurvivorFemale_Hair_SpikeMohawk.adr",
  "SurvivorFemale_HatHair_Long.adr",
  "SurvivorFemale_HatHair_Short.adr"
];

const MALE_ZOMBIE_HAIR_MODELS = [
  "SurvivorMale_Hair_Afro.adr",
  "SurvivorMale_Hair_AfroMohawk.adr",
  "SurvivorMale_Hair_MediumMessy.adr",
  "SurvivorMale_Hair_ShortBun.adr",
  "SurvivorMale_Hair_ShortMessy.adr",
  "SurvivorMale_Hair_SpikeMohawk.adr",
  "SurvivorMale_HatHair_Long.adr",
  "SurvivorMale_HatHair_Short.adr"
];

const ZOMBIE_BALD_CHANCE = 0.4;

function getRandomHairModel(hairModels: string[]): string {
  if (Math.random() < ZOMBIE_BALD_CHANCE) return "";
  return hairModels[Math.floor(Math.random() * hairModels.length)];
}

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

function getHairModel(modelId: number): string {
  switch (modelId) {
    case ModelIds.ZOMBIE_FEMALE_WALKER:
    case ModelIds.ZOMBIE_FEMALE_HEAD:
      return getRandomHairModel(FEMALE_ZOMBIE_HAIR_MODELS);
    case ModelIds.ZOMBIE_MALE_WALKER:
    case ModelIds.ZOMBIE_MALE_HEAD:
      return getRandomHairModel(MALE_ZOMBIE_HAIR_MODELS);
    default:
      return "";
  }
}

function getEyeActor(modelId: number): string {
  switch (modelId) {
    case ModelIds.SURVIVOR_MALE_HEAD_01:
      return "SurvivorMale_Eyes_01.adr";
    case ModelIds.SURVIVAL_FEMALE_HEAD_01:
      return "SurvivorFemale_Eyes_01.adr";
    case ModelIds.ZOMBIE_FEMALE_HEAD:
      return Math.random() < 0.5
        ? "ZombieFemale_Eyes_01.adr"
        : "ZombieFemale_EyeLeft_01.adr";
    default:
      return "";
  }
}

function isZombieModel(modelId: number): boolean {
  return (
    modelId === ModelIds.ZOMBIE_FEMALE_WALKER ||
    modelId === ModelIds.ZOMBIE_MALE_WALKER ||
    modelId === ModelIds.ZOMBIE_FEMALE_HEAD ||
    modelId === ModelIds.ZOMBIE_MALE_HEAD
  );
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

  /** Sets eyes for characters */
  eyeActor = getEyeActor(this.actorModelId);

  /** Optional hair actor for characters that support separate hair models */
  hairModel = getHairModel(this.actorModelId);

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

  /** Object the character's animation is attached to. Overridden by Npc to
   * attach the animation to itself (used for zombie animations) */
  get attachedObjectTargetId(): string {
    return "0x0";
  }

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
      health: this.pGetSimpleProxyHealth().healthPercentage
    };
  }

  pGetSimpleProxyHealth() {
    // Don't show health bars for Stashes, this could be revisited if we ever want to protect stashes so people need to raid them before getting the loot
    return {
      characterId: this.characterId,
      healthPercentage:
        this.actorModelId == ModelIds.HAND_SHOVEL
          ? 100
          : (this.health / this.maxHealth) * 100
    };
  }

  /**
   * Gets the lightweight npc/pc packet fields for use in sendself, addlightweightnpc, or addlightweightpc
   */
  pGetLightweight(): AddLightweightNpc {
    const npcModelId = this.temporaryActorModelId
      ? this.temporaryActorModelId
      : this.actorModelId;
    const zombieModel = isZombieModel(npcModelId);

    return {
      characterId: this.characterId,
      transientId: this.transientId,
      actorModelId: npcModelId,
      position: this.state.position,
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
      eyeActor: zombieModel ? this.hairModel : this.eyeActor,
      unknownString4: zombieModel ? this.eyeActor : this.hairModel,
      attachedObject: {
        // This doesn't do anything. I thought it could've been related to animations - Jason
        //targetObjectId: this.attachedObjectTargetId,
        //animationName: "Idle"
      }
    };
  }
}
