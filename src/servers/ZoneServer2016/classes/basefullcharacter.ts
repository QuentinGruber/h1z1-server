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

import {
  characterEquipment,
  loadoutItem,
  loadoutContainer,
  inventoryItem,
} from "../../../types/zoneserver";
import { BaseLightweightCharacter } from "./baselightweightcharacter";

const loadoutSlots = require("./../../../../data/2016/dataSources/LoadoutSlots.json");

export class BaseFullCharacter extends BaseLightweightCharacter{
  resources = {};
  _loadout: { [loadoutSlotId: number]: loadoutItem } = {};
  _equipment: { [equipmentSlotId: number]: characterEquipment } = {};
  _containers: { [loadoutSlotId: number]: loadoutContainer } = {};
  constructor(characterId: string, generatedTransient: number) {
    super(characterId, generatedTransient);
  }

  clearLoadoutSlot(loadoutSlotId: number) {
    this._loadout[loadoutSlotId] = {
      itemDefinitionId: 0,
      slotId: loadoutSlotId,
      itemGuid: "0x0",
      containerGuid: "0xFFFFFFFFFFFFFFFF",
      currentDurability: 0,
      stackCount: 0,
      loadoutItemOwnerGuid: "0x0"
    }
  }
  setupLoadoutSlots() {
    for(const slot of loadoutSlots) {
      if(slot.LOADOUT_ID == 3 && !this._loadout[slot.SLOT_ID]) {
        this.clearLoadoutSlot(slot.SLOT_ID);
      }
    }
  }

  getActiveLoadoutSlot(itemGuid: string): number {
    // gets the loadoutSlotId of a specified itemGuid in the loadout
    for(const item of Object.values(this._loadout)) {
      if(itemGuid == item.itemGuid) {
        return item.slotId;
      }
    }
    return 0;
  }
  getLoadoutItem(
    itemGuid: string
  ): loadoutItem | undefined {
    const loadoutSlotId = this.getActiveLoadoutSlot(itemGuid);
    if (this._loadout[loadoutSlotId]?.itemGuid == itemGuid) {
      return this._loadout[loadoutSlotId];
    }
    return;
  }
  getItemContainer(
    itemGuid: string
  ): loadoutContainer | undefined {
    // returns the container that an item is contained in
    for (const container of Object.values(this._containers)) {
      if (container.items[itemGuid]) {
        return container;
      }
    }
    return;
  }
  getInventoryItem(
    itemGuid: string
  ): inventoryItem | undefined {
    const loadoutItem = this.getLoadoutItem(itemGuid);
    if (loadoutItem) {
      return loadoutItem;
    } else {
      const container = this.getItemContainer(itemGuid);
      const item = container?.items[itemGuid];
      if (!container || !item) return undefined;
      return item;
    }
  }

  getContainerFromGuid(
    containerGuid: string
  ): loadoutContainer | undefined {
    for (const container of Object.values(this._containers)) {
      if (container.itemGuid == containerGuid) {
        return container;
      }
    }
    return undefined;
  }

  getItemById(itemDefId: number): inventoryItem | undefined {
    for (const container of Object.values(this._containers)) {
      for (const item of Object.values(container.items)) {
        if (item.itemDefinitionId == itemDefId) {
          return item;
        }
      }
    }
    return undefined;
  }
  getActiveEquipmentSlot(item: loadoutItem) {
    for(const equipment of Object.values(this._equipment)) {
      if(item.itemGuid == equipment.guid) {
        return equipment.slotId;
      }
    }
    return 0;
  }

}
