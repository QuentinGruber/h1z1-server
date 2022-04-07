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
import { ResourceIds, ResourceTypes } from "../enums";
import { BaseLightweightCharacter } from "./baselightweightcharacter";

const loadoutSlots = require("./../../../../data/2016/dataSources/LoadoutSlots.json");

export class BaseFullCharacter extends BaseLightweightCharacter{
  _resources: { [resourceId: number]: number } = {};
  _loadout: { [loadoutSlotId: number]: loadoutItem } = {};
  _equipment: { [equipmentSlotId: number]: characterEquipment } = {};
  _containers: { [loadoutSlotId: number]: loadoutContainer } = {};
  loadoutId = 0;
  currentLoadoutSlot = 0; // idk if other full npcs use this
  constructor(characterId: string, generatedTransient: number) {
    super(characterId, generatedTransient);
    this.setupLoadoutSlots();
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
      if(slot.LOADOUT_ID == this.loadoutId && !this._loadout[slot.SLOT_ID]) {
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

  pGetEquipmentSlot(slotId: number) {
    const slot = this._equipment[slotId];
    return slot?{
      equipmentSlotId: slot.slotId,
      equipmentSlotData: {
        equipmentSlotId: slot.slotId,
        guid: slot.guid || "",
        tintAlias: slot.tintAlias || "",
        decalAlias: slot.tintAlias || "#",
      }
    }:undefined
  }

  pGetAttachmentSlot(slotId: number) {
    const slot = this._equipment[slotId];
    return slot?{
      modelName: slot.modelName,
      textureAlias: slot.textureAlias || "",
      tintAlias: slot.tintAlias || "",
      decalAlias: slot.tintAlias || "#",
      slotId: slot.slotId,
    }:undefined
  }

  pGetAttachmentSlots() {
    return Object.keys(this._equipment).map((slotId: any) => {
      return this.pGetEquipmentSlot(slotId);
    })
  }

  pGetEquipmentSlotFull(slotId: number) {
    const slot = this._equipment[slotId];
    return slot?{
      characterData: {
        characterId: this.characterId,
      },
      equipmentSlot: this.pGetEquipmentSlot(slotId),
      attachmentData: this.pGetAttachmentSlot(slotId)
    }:undefined
  }

  pGetEquipment() {
    return {
      characterData: {
        characterId: this.characterId,
      },
      equipmentSlots: this.pGetAttachmentSlots(),
      attachmentData: Object.keys(this._equipment).map((slotId: any) => {
        return this.pGetAttachmentSlot(slotId);
      }),
    }
  }

  pGetLoadoutSlots() {
    return {
      characterId: this.characterId,
      loadoutId: 3, // needs to be 3
      loadoutData: {
        loadoutSlots: Object.keys(this._loadout).map(
          (slotId: any) => {
            const slot = this._loadout[slotId];
            return {
              hotbarSlotId: slot.slotId, // affects Equip Item context entry packet, and Container.MoveItem
              loadoutId: this.loadoutId,
              slotId: slot.slotId,
              loadoutItemData: {
                itemDefinitionId: slot.itemDefinitionId,
                loadoutItemOwnerGuid: slot.itemGuid,
                unknownByte1: 255, // flags?
              },
              unknownDword4: slot.slotId,
            };
          }
        ),
      },
      currentSlotId: this.currentLoadoutSlot,
    }
  }

  pGetFull() {
    return {
      transientId: this.transientId,

    }
  }

  getResourceType(resourceId: number) {
    switch(resourceId) {
      case ResourceIds.HEALTH:
        return ResourceTypes.HEALTH;
      case ResourceIds.HUNGER:
        return ResourceTypes.HUNGER;
      case ResourceIds.HYDRATION:
        return ResourceTypes.HYDRATION;
      case ResourceIds.STAMINA:
        return ResourceTypes.STAMINA;
      case ResourceIds.VIRUS:
        return ResourceTypes.VIRUS;
      case ResourceIds.BLEEDING:
        return ResourceTypes.BLEEDING;
      case ResourceIds.COMFORT:
        return ResourceTypes.COMFORT;
      case ResourceIds.FUEL:
        return ResourceTypes.FUEL;
      case ResourceIds.CONDITION:
        return ResourceTypes.CONDITION;
      default:
        return 0;
    }
  }

  pGetResources() {
    return Object.keys(this._resources).map((resource) => {
      const resourceId = Number(resource);
      const resourceType = this.getResourceType(resourceId)
      return {
        resourceType: resourceType,
        resourceData: {
          resourceId: resourceId,
          resourceType: resourceType,
          value: this._resources[resourceId] > 0
          ? this._resources[resourceId]
          : 0
        }
      }
    })
  }

}
