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

import { ContainerErrors } from "../models/enums";
import { ZoneServer2016 } from "../zoneserver";
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

  transferLoadoutItem(
    server: ZoneServer2016,
    targetCharacterId: string,
    newSlotId: number
  ) {
    const client = server.getClientByCharId(targetCharacterId);
    if (!client) return;
    const oldLoadoutItem = client.character._loadout[newSlotId];
    if (
      !server.validateLoadoutSlot(
        this.itemDefinitionId,
        newSlotId,
        client.character.loadoutId
      )
    ) {
      server.containerError(client, ContainerErrors.INVALID_LOADOUT_SLOT);
      return;
    }
    if (oldLoadoutItem) {
      if (!server.removeLoadoutItem(client, oldLoadoutItem.slotId)) {
        server.containerError(client, ContainerErrors.NO_ITEM_IN_SLOT);
        return;
      }
    }
    if (!server.removeLoadoutItem(client, this.slotId)) {
      server.containerError(client, ContainerErrors.NO_ITEM_IN_SLOT);
      return;
    }
    if (oldLoadoutItem) {
      client.character.equipItem(server, oldLoadoutItem, true, this.slotId);
    }
    client.character.equipItem(server, this, true, newSlotId);
  }
}
