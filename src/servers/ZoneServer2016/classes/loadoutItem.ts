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

import { BaseItem } from "./baseItem";

export class LoadoutItem extends BaseItem {
  loadoutItemOwnerGuid: string;
  constructor(
    item: BaseItem,
    loadoutSlotId: number,
    loadoutItemOwnerGuid: string
  ) {
    super(
      item.itemDefinitionId,
      item.itemGuid,
      item.currentDurability,
      item.stackCount
    );
    this.slotId = loadoutSlotId;
    this.containerGuid = "0xFFFFFFFFFFFFFFFF";
    this.stackCount = 1;
    this.weapon = item.weapon;
    this.loadoutItemOwnerGuid = loadoutItemOwnerGuid;
  }
}
