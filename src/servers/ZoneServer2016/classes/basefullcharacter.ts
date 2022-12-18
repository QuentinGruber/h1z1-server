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

import { characterEquipment, DamageInfo } from "../../../types/zoneserver";
import { LoadoutKit } from "../data/loadouts";
import { LoadoutSlots, ResourceIds, ResourceTypes } from "../models/enums";
import { ZoneServer2016 } from "../zoneserver";
import { BaseItem } from "./baseItem";
import { BaseLightweightCharacter } from "./baselightweightcharacter";
import { LoadoutContainer } from "./loadoutcontainer";
import { LoadoutItem } from "./loadoutItem";
import { ZoneClient2016 } from "./zoneclient";

const loadoutSlots = require("./../../../../data/2016/dataSources/LoadoutSlots.json");

function getGender(actorModelId: number): number {
  switch (actorModelId) {
    case 9510: // zombiemale
    case 9240: // male character
      return 1;
    case 9634: // zombiefemale
    case 9474: // female character
      return 2;
    default:
      return 0;
  }
}

export class BaseFullCharacter extends BaseLightweightCharacter {
  onReadyCallback?: (clientTriggered: ZoneClient2016) => void;
  _resources: { [resourceId: number]: number } = {};
  _loadout: { [loadoutSlotId: number]: LoadoutItem } = {};
  _equipment: { [equipmentSlotId: number]: characterEquipment } = {};
  _containers: { [loadoutSlotId: number]: LoadoutContainer } = {};
  loadoutId = 0;
  currentLoadoutSlot = 0; // idk if other full npcs use this
  isLightweight = false;
  gender: number;
  defaultLoadout: LoadoutKit = [];

  constructor(
    characterId: string,
    transientId: number,
    actorModelId: number,
    position: Float32Array,
    rotation: Float32Array
  ) {
    super(characterId, transientId, actorModelId, position, rotation);
    this.gender = getGender(this.actorModelId);
  }

  getActiveLoadoutSlot(itemGuid: string): number {
    // gets the loadoutSlotId of a specified itemGuid in the loadout
    for (const item of Object.values(this._loadout)) {
      if (itemGuid == item.itemGuid) {
        return item.slotId;
      }
    }
    return 0;
  }
  getLoadoutItem(itemGuid: string): LoadoutItem | undefined {
    const loadoutSlotId = this.getActiveLoadoutSlot(itemGuid);
    if (this._loadout[loadoutSlotId]?.itemGuid == itemGuid) {
      return this._loadout[loadoutSlotId];
    }
    return;
  }
  getItemContainer(itemGuid: string): LoadoutContainer | undefined {
    // returns the container that an item is contained in
    for (const container of Object.values(this._containers)) {
      if (container.items[itemGuid]) {
        return container;
      }
    }
    return;
  }
  getInventoryItem(itemGuid: string): BaseItem | undefined {
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

  getContainerFromGuid(containerGuid: string): LoadoutContainer | undefined {
    for (const container of Object.values(this._containers)) {
      if (container.itemGuid == containerGuid) {
        return container;
      }
    }
    return undefined;
  }

  getItemById(itemDefId: number): BaseItem | undefined {
    for (const container of Object.values(this._containers)) {
      for (const item of Object.values(container.items)) {
        if (item.itemDefinitionId == itemDefId) {
          return item;
        }
      }
    }
    return undefined;
  }
  getActiveEquipmentSlot(item: BaseItem) {
    for (const equipment of Object.values(this._equipment)) {
      if (item.itemGuid == equipment.guid) {
        return equipment.slotId;
      }
    }
    return 0;
  }

  getEquippedWeapon(): LoadoutItem {
    return this._loadout[this.currentLoadoutSlot];
  }

  // gets the amount of items of a specific itemDefinitionId
  getInventoryItemAmount(itemDefinitionId: number): number {
    let items = 0;
    for (const container of Object.values(this._containers)) {
      for (const item of Object.values(container.items)) {
        if (item.itemDefinitionId == itemDefinitionId) {
          items += item.stackCount;
        }
      }
    }
    return items;
  }

  pGetEquipmentSlot(slotId: number) {
    const slot = this._equipment[slotId];
    return slot
      ? {
          equipmentSlotId: slot.slotId,
          equipmentSlotData: {
            equipmentSlotId: slot.slotId,
            guid: slot.guid || "",
            tintAlias: slot.tintAlias || "Default",
            decalAlias: slot.decalAlias || "#",
          },
        }
      : undefined;
  }

  pGetEquipmentSlots() {
    return Object.keys(this._equipment).map((slotId: any) => {
      return this.pGetEquipmentSlot(slotId);
    });
  }

  pGetAttachmentSlot(slotId: number) {
    const slot = this._equipment[slotId];
    return slot
      ? {
          modelName: slot.modelName,
          textureAlias: slot.textureAlias || "",
          tintAlias: slot.tintAlias || "Default",
          decalAlias: slot.decalAlias || "#",
          slotId: slot.slotId,
        }
      : undefined;
  }

  pGetAttachmentSlots() {
    return Object.keys(this._equipment).map((slotId: any) => {
      return this.pGetAttachmentSlot(slotId);
    });
  }

  pGetEquipmentSlotFull(slotId: number) {
    const slot = this._equipment[slotId];
    return slot
      ? {
          characterData: {
            characterId: this.characterId,
          },
          equipmentSlot: this.pGetEquipmentSlot(slotId),
          attachmentData: this.pGetAttachmentSlot(slotId),
        }
      : undefined;
  }

  pGetAttachmentSlotsMod() {
    return Object.keys(this._equipment).map((slotId: any) => {
      if (this.pGetAttachmentSlot(slotId)?.modelName == "Weapon_Empty.adr") {
        return this.pGetAttachmentSlot(slotId);
      }
      return {
        modelName: "",
        textureAlias: "",
        tintAlias: "Default",
        decalAlias: "#",
        slotId: slotId,
        unknownArray1: [], // todo: test
        unknownBool1: false,
      };
    });
  }

  pGetEquipment() {
    return {
      characterData: {
        profileId: 5,
        characterId: this.characterId,
      },
      unknownDword1: 0,
      unknownString1: "Default",
      unknownString2: "#",
      equipmentSlots: this.pGetEquipmentSlots(),
      attachmentData: this.pGetAttachmentSlots(),
      unknownBoolean1: true,
    };
  }

  pGetLoadoutSlot(slotId: number) {
    const slot = this._loadout[slotId];
    return {
      hotbarSlotId: slotId, // affects Equip Item context entry packet, and Container.MoveItem
      loadoutId: this.loadoutId,
      slotId: slotId,
      loadoutItemData: {
        itemDefinitionId: slot?.itemDefinitionId || 0,
        loadoutItemGuid: slot?.itemGuid || "0x0",
        unknownByte1: 255, // flags?
      },
      unknownDword1: slotId,
    };
  }

  getLoadoutSlots() {
    const slots: Array<number> = [];
    loadoutSlots.forEach((slot: any) => {
      if (slot.LOADOUT_ID == this.loadoutId) slots.push(slot.SLOT_ID);
    });
    return slots;
  }

  pGetLoadoutSlots() {
    return {
      characterId: this.characterId,
      loadoutId: this.loadoutId,
      loadoutData: {
        loadoutSlots: Object.values(this.getLoadoutSlots()).map(
          (slotId: any) => {
            return this.pGetLoadoutSlot(slotId);
          }
        ),
      },
      currentSlotId: this.currentLoadoutSlot,
    };
  }

  pGetItemWeaponData(server: ZoneServer2016, slot: BaseItem) {
    if (slot.weapon) {
      return {
        isWeapon: true, // not sent to client, only used as a flag for pack function
        unknownData1: {
          unknownBoolean1: false,
        },
        unknownData2: {
          ammoSlots: server.getWeaponAmmoId(slot.itemDefinitionId)
            ? [{ ammoSlot: slot.weapon?.ammoCount }]
            : [],
          firegroups: [
            {
              firegroupId: server.getWeaponDefinition(
                server.getItemDefinition(slot.itemDefinitionId).PARAM1
              )?.FIRE_GROUPS[0]?.FIRE_GROUP_ID,
              unknownArray1: [
                // maybe firemodes?
                {
                  unknownByte1: 0,
                  unknownDword1: 0,
                  unknownDword2: 0,
                  unknownDword3: 0,
                },
                {
                  unknownByte1: 0,
                  unknownDword1: 0,
                  unknownDword2: 0,
                  unknownDword3: 0,
                },
              ],
            },
          ],
          equipmentSlotId: this.getActiveEquipmentSlot(slot),
          unknownByte2: 1,
          unknownDword1: 0,
          unknownByte3: 0,
          unknownByte4: -1,
          unknownByte5: -1,
          unknownFloat1: 0,
          unknownByte6: 0,
          unknownDword2: 0,
          unknownByte7: 0,
          unknownDword3: -1,
        },
        characterStats: [],
        unknownArray1: [],
      };
    }
    return {
      isWeapon: false, // not sent to client, only used as a flag for pack function
      unknownBoolean1: false,
    };
  }

  pGetItemData(server: ZoneServer2016, item: BaseItem, containerDefId: number) {
    let durability: number = 0;
    const isWeapon = server.isWeapon(item.itemDefinitionId);
    switch (true) {
      case server.isWeapon(item.itemDefinitionId):
        durability = 2000;
        break;
      case server.isArmor(item.itemDefinitionId):
        durability = 1000;
        break;
      case server.isHelmet(item.itemDefinitionId):
        durability = 100;
        break;
    }
    return {
      itemDefinitionId: item.itemDefinitionId,
      tintId: 0,
      guid: item.itemGuid,
      count: item.stackCount,
      itemSubData: {
        hasSubData: false,
      },
      containerGuid: item.containerGuid,
      containerDefinitionId: containerDefId,
      containerSlotId: item.slotId,
      baseDurability: durability,
      currentDurability: durability ? item.currentDurability : 0,
      maxDurabilityFromDefinition: durability,
      unknownBoolean1: true,
      ownerCharacterId:
        isWeapon && item.itemDefinitionId !== 85 ? "" : this.characterId,
      unknownDword9: 1,
      weaponData: this.pGetItemWeaponData(server, item),
    };
  }

  pGetInventoryItems(server: ZoneServer2016) {
    const items: any[] = Object.values(this._loadout)
      .filter((slot) => {
        if (slot.itemDefinitionId) {
          return true;
        }
      })
      .map((slot) => {
        return this.pGetItemData(server, slot, 101);
      });
    Object.values(this._containers).forEach((container) => {
      Object.values(container.items).forEach((item) => {
        items.push(
          this.pGetItemData(server, item, container.containerDefinitionId)
        );
      });
    });
    return items;
  }

  pGetFull(server: ZoneServer2016) {
    return {
      transientId: this.transientId,
      attachmentData: this.pGetAttachmentSlots(),
      characterId: this.characterId,
      resources: {
        data: this.pGetResources(),
      },
      effectTags: [],
      unknownData1: {},
      targetData: {},
      unknownArray1: [],
      unknownArray2: [],
      unknownArray3: { data: {} },
      unknownArray4: { data: {} },
      unknownArray5: { data: {} },
      unknownArray6: { data: {} },
      remoteWeapons: { data: {} },
      itemsData: {
        items: this.pGetInventoryItems(server),
        unknownDword1: 0,
      },
    };
  }

  pGetContainerData(server: ZoneServer2016, container: LoadoutContainer) {
    return {
      guid: container.itemGuid,
      definitionId: container.containerDefinitionId,
      associatedCharacterId: this.characterId,
      slots: server.getContainerMaxSlots(container),
      items: Object.values(container.items).map((item, idx) => {
        container.items[item.itemGuid].slotId = idx + 1;
        return {
          itemDefinitionId: item.itemDefinitionId,
          itemData: this.pGetItemData(
            server,
            item,
            container.containerDefinitionId
          ),
        };
      }),
      showBulk: true, // needs to be true or bulk doesn't show up
      maxBulk: container.getMaxBulk(server),
      unknownDword1: 28,
      bulkUsed: container.getUsedBulk(server),
      hasBulkLimit: !!container.getMaxBulk(server),
    };
  }

  pGetContainers(server: ZoneServer2016) {
    return Object.values(this._containers).map((container) => {
      return {
        loadoutSlotId: container.slotId,
        containerData: this.pGetContainerData(server, container),
      };
    });
  }

  getResourceType(resourceId: number) {
    switch (resourceId) {
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
      const resourceType = this.getResourceType(resourceId);
      return {
        resourceType: resourceType,
        resourceData: {
          resourceId: resourceId,
          resourceType: resourceType,
          value:
            this._resources[resourceId] > 0 ? this._resources[resourceId] : 0,
        },
      };
    });
  }

  /**
   * Gets all inventory containers as an array of items.
   * @param character The character to check.
   * @returns Returns an array containing all items across all containers.
   */
  getInventoryAsContainer(): {
    [itemDefinitionId: number]: BaseItem[];
  } {
    const inventory: { [itemDefinitionId: number]: BaseItem[] } = {};
    for (const container of Object.values(this._containers)) {
      for (const item of Object.values(container.items)) {
        if (!inventory[item.itemDefinitionId]) {
          inventory[item.itemDefinitionId] = []; // init array
        }
        inventory[item.itemDefinitionId].push(item); // push new itemstack
      }
    }
    return inventory;
  }

  hasHelmet(server: ZoneServer2016): boolean {
    const slot = this._loadout[LoadoutSlots.HEAD],
      itemDef = server.getItemDefinition(slot?.itemDefinitionId);
    if (!slot || !itemDef) return false;
    return (
      slot.itemDefinitionId >= 0 &&
      itemDef.ITEM_CLASS == 25000 &&
      itemDef.IS_ARMOR
    );
  }

  hasArmor(server: ZoneServer2016): boolean {
    const slot = this._loadout[LoadoutSlots.ARMOR],
      itemDef = server.getItemDefinition(slot?.itemDefinitionId);
    if (!slot || !itemDef) return false;
    return slot.itemDefinitionId >= 0 && itemDef.ITEM_CLASS == 25041;
  }

  OnFullCharacterDataRequest(server: ZoneServer2016, client: ZoneClient2016) {
    console.log(
      `[ERROR] Unhandled FullCharacterDataRequest from client ${client.guid}!`
    );
  }

  OnProjectileHit(server: ZoneServer2016, damageInfo: DamageInfo) {
    this.damage(server, damageInfo);
  }
}
