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

import { inventoryItem } from "types/zoneserver";
import { BaseLightweightCharacter } from "./baselightweightcharacter";

export class ItemObject extends BaseLightweightCharacter {
  npcRenderDistance = 25;
  spawnerId = 0;
  item: inventoryItem;
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
    noCollide: 1,
    knockedOut: 0,
    bit22: 0,
    bit23: 0,
  };
  creationTime: number = 0;
  constructor(
    characterId: string,
    transientId: number,
    actorModelId: number,
    position: Float32Array,
    rotation: Float32Array,
    spawnerId: number,
    item: inventoryItem
  ) {
    super(characterId, transientId, actorModelId, position, rotation);
    (this.spawnerId = spawnerId), (this.item = item);
  }
}
