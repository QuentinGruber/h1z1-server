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

export class ItemObject extends BaseLightweightCharacter{
  npcRenderDistance = 25;
  spawnerId = 0;
  item: inventoryItem;
  constructor(
    characterId: string,
    transientId: number,
    actorModelId: number,
    position: Float32Array,
    rotation: Float32Array,
    flags: BaseLightweightCharacter["flags"],
    spawnerId: number,
    item: inventoryItem
  ) {
    super(characterId, transientId, actorModelId, position, rotation);
    this.flags = flags;
    this.spawnerId = spawnerId,
    this.item = item;
  }

}
