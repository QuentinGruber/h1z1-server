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

import { Weapon } from "./weapon";

export class BaseItem {
  itemDefinitionId: number;
  slotId = 0;
  itemGuid: string;
  containerGuid = "0x0";
  currentDurability: number;
  stackCount: number;
  weapon?: Weapon;
  constructor(
    itemDefinitionId: number,
    guid: string,
    durability: number,
    stackCount: number
  ) {
    this.itemDefinitionId = itemDefinitionId;
    this.itemGuid = guid;
    this.currentDurability = durability;
    this.stackCount = stackCount;
  }
}
