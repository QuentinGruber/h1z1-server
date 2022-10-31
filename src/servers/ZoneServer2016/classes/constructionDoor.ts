// ======================================================================
//
//   GNU GENERAL PUBLIC LICENSE
//   Version 3, 29 June 2007
//   copyright (C) 2020 - 2021 Quentin Gruber
//   copyright (C) 2021 - 2022 H1emu community
//
//   https://github.com/QuentinGruber/h1z1-server
//   https://www.npmjs.com/package/h1z1-server
//
//   Based on https://github.com/psemu/soe-network
// ======================================================================

import { DoorEntity } from "./doorentity";
import { Items } from "../models/enums";
function getDamageRange(definitionId: number): number {
  switch (definitionId) {
    case Items.METAL_GATE:
      return 4.3;
    case Items.DOOR_WOOD:
    case Items.DOOR_METAL:
    case Items.DOOR_BASIC:
      return 1.5;
    default:
      return 1.5;
  }
}

export class constructionDoor extends DoorEntity {
  ownerCharacterId: string;
  password: number = 0;
  grantedAccess: any = [];
  health: number = 1000000;
  healthPercentage: number = 100;
  parentObjectCharacterId: string;
  buildingSlot: string;
  itemDefinitionId: number;
  slot?: string;
  damageRange: number;
  fixedPosition?: Float32Array;
  constructor(
    characterId: string,
    transientId: number,
    actorModelId: number,
    position: Float32Array,
    rotation: Float32Array,
    scale: Float32Array,
    itemDefinitionId: number,
    ownerCharacterId: string,
    parentObjectCharacterId: string,
    BuildingSlot: string,
    slot: string
  ) {
    super(
      characterId,
      transientId,
      actorModelId,
      position,
      rotation,
      new Float32Array(scale),
      0
    );
    this.ownerCharacterId = ownerCharacterId;
    this.itemDefinitionId = itemDefinitionId;
    this.parentObjectCharacterId = parentObjectCharacterId;
    this.buildingSlot = BuildingSlot;
    if (slot) this.slot = slot;
    this.profileId = 999; /// mark as construction
    this.damageRange = getDamageRange(this.itemDefinitionId);
  }
  pGetConstructionHealth() {
    return {
      characterId: this.characterId,
      health: this.health / 10000,
    };
  }
  pDamageConstruction(damage: number) {
    this.health -= damage;
    this.healthPercentage = this.health / 10000;
  }
}
