// ======================================================================
//
//   GNU GENERAL PUBLIC LICENSE
//   Version 3, 29 June 2007
//   copyright (C) 2020 - 2021 Quentin Gruber
//   copyright (C) 2021 - 2025 H1emu community
//
//   https://github.com/QuentinGruber/h1z1-server
//   https://www.npmjs.com/package/h1z1-server
//
//   Based on https://github.com/psemu/soe-network
// ======================================================================

import {
  AudioSetSwitch,
  EquipmentSetCharacterEquipment,
  EquipmentSetCharacterEquipmentSlot,
  LightweightToFullNpc
} from "types/zone2016packets";
import { CharacterEquipment, DamageInfo } from "../../../types/zoneserver";
import { LoadoutKit } from "../data/loadouts";
import {
  ContainerErrors,
  ItemClasses,
  ItemTypes,
  Items,
  LoadoutIds,
  LoadoutSlots,
  ModelIds,
  ResourceIds,
  ResourceTypes
} from "../models/enums";
import { ZoneServer2016 } from "../zoneserver";
import { BaseItem } from "../classes/baseItem";
import { BaseLightweightCharacter } from "./baselightweightcharacter";
import { LoadoutContainer } from "../classes/loadoutcontainer";
import { LoadoutItem } from "../classes/loadoutItem";
import { ZoneClient2016 } from "../classes/zoneclient";
import { Weapon } from "../classes/weapon";
import { _ } from "../../../utils/utils";
import {
  EXTERNAL_CONTAINER_GUID,
  LOADOUT_CONTAINER_ID
} from "../../../utils/constants";

const debugName = "ZoneServer",
  debug = require("debug")(debugName);

const loadoutSlots = require("./../../../../data/2016/dataSources/LoadoutSlots.json"),
  loadoutSlotItemClasses = require("./../../../../data/2016/dataSources/LoadoutSlotItemClasses.json"),
  equipSlotItemClasses = require("./../../../../data/2016/dataSources/EquipSlotItemClasses.json");

function getGender(actorModelId: number): number {
  switch (actorModelId) {
    case ModelIds.ZOMBIE_FEMALE_WALKER:
    case ModelIds.SURVIVOR_MALE_HEAD_01:
      return 1;
    case ModelIds.ZOMBIE_MALE_HEAD:
    case ModelIds.SURVIVAL_FEMALE_HEAD_01:
      return 2;
    default:
      return 0;
  }
}

export abstract class BaseFullCharacter extends BaseLightweightCharacter {
  /** Callback for OnFullCharacterDataRequest */
  onReadyCallback?: (clientTriggered: ZoneClient2016) => void;

  /** BaseFullCharacter loadout values */
  _resources: { [resourceId: number]: number } = {};
  _loadout: { [loadoutSlotId: number]: LoadoutItem } = {};
  _equipment: { [equipmentSlotId: number]: CharacterEquipment } = {};
  _containers: { [loadoutSlotId: number]: LoadoutContainer } = {};
  loadoutId = 5;
  currentLoadoutSlot = 0; // idk if other full npcs use this
  isLightweight = false;
  gender: number;
  hoodState: string = "Up";

  /** The default items that will spawn on and with the BaseFullCharacter */
  defaultLoadout: LoadoutKit = [];
  constructor(
    characterId: string,
    transientId: number,
    actorModelId: number,
    position: Float32Array,
    rotation: Float32Array,
    server: ZoneServer2016
  ) {
    super(characterId, transientId, actorModelId, position, rotation, server);
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

  getLoadoutItemById(itemDefId: number): LoadoutItem | undefined {
    for (const item of Object.values(this._loadout)) {
      if (item.itemDefinitionId == itemDefId) {
        return item;
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

  getEquippedWeapon(): LoadoutItem | undefined {
    return this._loadout[this.currentLoadoutSlot] || undefined;
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

  /* eslint-disable @typescript-eslint/no-unused-vars */
  updateLoadout(server: ZoneServer2016) {
    server.sendDataToAllWithSpawnedEntity(
      server._characters,
      this.characterId,
      "Loadout.SetLoadoutSlots",
      this.pGetLoadoutSlots()
    );
  }

  updateEquipment(server: ZoneServer2016) {
    server.sendDataToAllWithSpawnedEntity(
      server._characters,
      this.characterId,
      "Equipment.SetCharacterEquipment",
      this.pGetEquipment()
    );
  }

  updateFootwearAudio(server: ZoneServer2016) {
    server.sendDataToAllWithSpawnedEntity(
      server._characters,
      this.characterId,
      "Audio.SetSwitch",
      this.pGetFootwearAudio(server)
    );
  }

  updateEquipmentSlot(server: ZoneServer2016, slotId: number) {
    server.sendDataToAllWithSpawnedEntity(
      server._characters,
      this.characterId,
      "Equipment.SetCharacterEquipmentSlot",
      this.pGetEquipmentSlotFull(slotId) as EquipmentSetCharacterEquipmentSlot
    );
  }

  /**
   * Equips an item to a BaseFullCharacter.
   * @param server The ZoneServer instance.
   * @param item The item to equip.
   * @param sendPacket Optional: Only used if character param belongs to a client. Sends equipment,
   * loadout, and item update packets to client if true.
   * @param loadoutSlotId Optional: The loadoutSlotId to manually try to equip the item to. This will be
   * found automatically if not defined.
   */
  equipItem(
    server: ZoneServer2016,
    item?: BaseItem,
    sendPacket: boolean = true,
    loadoutSlotId: number = 0
  ) {
    if (!item || !item.isValid("equipItem")) return;
    const def = server.getItemDefinition(item.itemDefinitionId);
    if (!def) return;
    if (loadoutSlotId) {
      if (
        !server.validateLoadoutSlot(
          item.itemDefinitionId,
          loadoutSlotId,
          this.loadoutId
        )
      ) {
        debug(
          `[ERROR] EquipItem: Client tried to equip item ${item.itemDefinitionId} with invalid loadoutSlotId ${loadoutSlotId}!`
        );
        return;
      }
    } else {
      loadoutSlotId = this.getAvailableLoadoutSlot(
        server,
        item.itemDefinitionId
      );
      if (!loadoutSlotId) {
        loadoutSlotId = server.getLoadoutSlot(item.itemDefinitionId);
      }
    }
    if (!loadoutSlotId) {
      debug(
        `[ERROR] EquipItem: Tried to equip item with itemDefinitionId: ${item.itemDefinitionId} with an invalid loadoutSlotId!`
      );
      return;
    }

    let equipmentSlotId = def.PASSIVE_EQUIP_SLOT_ID; // default for any equipment
    if (server.isWeapon(item.itemDefinitionId)) {
      if (loadoutSlotId == this.currentLoadoutSlot) {
        equipmentSlotId = def.ACTIVE_EQUIP_SLOT_ID;
      } else {
        equipmentSlotId = this.getAvailablePassiveEquipmentSlot(
          server,
          item.itemDefinitionId
        );
      }
    }

    if (equipmentSlotId) {
      const equipmentData: CharacterEquipment = {
        modelName: def.MODEL_NAME.replace(
          "<gender>",
          this.gender == 1 ? "Male" : "Female"
        ),
        slotId: equipmentSlotId,
        guid: item.itemGuid,
        textureAlias: def.TEXTURE_ALIAS || "Default",
        effectId: def.EFFECT_ID || 0,
        tintAlias: "",
        SHADER_PARAMETER_GROUP: server.getShaderParameterGroup(
          item.itemDefinitionId
        )
      };
      this._equipment[equipmentSlotId] = equipmentData;
    }

    const loadoutItem = new LoadoutItem(item, loadoutSlotId, this.characterId);

    this._loadout[loadoutSlotId] = loadoutItem;
    const client = server.getClientByContainerAccessor(this);

    if (sendPacket) {
      server.deleteItem(this, loadoutItem.itemGuid);
    }

    if (def.ITEM_TYPE === ItemTypes.CONTAINER) {
      const loadoutContainer = this._containers[loadoutSlotId],
        itemDefId = loadoutContainer?.itemDefinitionId,
        items = loadoutContainer?.items;

      this._containers[loadoutSlotId] = new LoadoutContainer(
        loadoutItem,
        def.PARAM1
      );
      if (loadoutContainer && _.size(items) !== 0) {
        if (items && client) {
          Object.values(items).forEach((item) => {
            server.addContainerItem(
              this,
              item,
              this._containers[loadoutSlotId],
              false
            );
          });
        }
      }

      if (itemDefId) {
        const generatedItem = server.generateItem(itemDefId, 1);
        if (generatedItem)
          this.lootItem(server, generatedItem, undefined, false);
      }

      if (client && sendPacket) server.initializeContainerList(client, this);
    }

    // probably will need to replicate server for vehicles / maybe npcs
    if (client && sendPacket) {
      server.addItem(client, loadoutItem, LOADOUT_CONTAINER_ID, this);
    }

    if (!sendPacket) return;
    if (client && server.isWeapon(item.itemDefinitionId)) {
      server.sendRemoteWeaponDataToAllOthers(
        client,
        client.character.transientId,
        "RemoteWeapon.Reset",
        {
          data: {
            remoteWeapons: client.character.pGetRemoteWeaponsData(server),
            remoteWeaponsExtra:
              client.character.pGetRemoteWeaponsExtraData(server)
          }
        }
      );
      server.sendRemoteWeaponUpdateData(
        client,
        this.transientId,
        item.itemGuid,
        "Update.SwitchFireMode",
        {
          firegroupIndex: 0,
          firemodeIndex: 0
        }
      );
    }
    this.updateLoadout(server);
    if (equipmentSlotId) this.updateEquipmentSlot(server, equipmentSlotId);
    if (client && server.isFootwear(item.itemDefinitionId)) {
      server.updateFootwear(client, item.itemDefinitionId, false);
    }
  }

  generateEquipmentFromLoadout(server: ZoneServer2016) {
    for (const slot of Object.values(this._loadout)) {
      if (!slot.itemDefinitionId) continue;
      const def = server.getItemDefinition(slot.itemDefinitionId);
      if (!def) continue;
      let equipmentSlotId = def.PASSIVE_EQUIP_SLOT_ID; // default for any equipment
      if (server.isWeapon(slot.itemDefinitionId)) {
        if (slot.slotId == this.currentLoadoutSlot) {
          equipmentSlotId = def.ACTIVE_EQUIP_SLOT_ID;
        } else {
          equipmentSlotId = this.getAvailablePassiveEquipmentSlot(
            server,
            slot.itemDefinitionId
          );
        }
      }
      if (equipmentSlotId) {
        const equipmentData: CharacterEquipment = {
          modelName: def.MODEL_NAME.replace(
            "<gender>",
            this.gender == 1 ? "Male" : "Female"
          ),
          slotId: equipmentSlotId,
          guid: slot.itemGuid,
          textureAlias: def.TEXTURE_ALIAS || "",
          effectId: def.EFFECT_ID || 0,
          tintAlias: "",
          SHADER_PARAMETER_GROUP: server.getShaderParameterGroup(
            slot.itemDefinitionId
          )
        };
        this._equipment[equipmentSlotId] = equipmentData;
      }
    }
  }

  lootItem(
    server: ZoneServer2016,
    item?: BaseItem,
    count?: number,
    sendUpdate = true
  ) {
    const client = server.getClientByCharId(this.characterId);
    if (!item || !item.isValid("lootItem")) return;
    if (!count) count = item.stackCount;
    if (count > item.stackCount) {
      count = item.stackCount;
    }
    const itemDefId = item.itemDefinitionId;
    if (server.isAccountItem(itemDefId) && client) {
      server.lootAccountItem(server, client, item, sendUpdate);
    } else if (this.getAvailableLoadoutSlot(server, itemDefId)) {
      if (client && client.character.initialized && sendUpdate) {
        server.sendData(client, "Reward.AddNonRewardItem", {
          itemDefId: itemDefId,
          iconId: server.getItemDefinition(itemDefId)?.IMAGE_SET_ID,
          nameId: server.getItemDefinition(itemDefId)?.NAME_ID,
          count: count
        });
      }
      this.equipItem(server, item, sendUpdate);
    } else {
      this.lootContainerItem(server, item, count, sendUpdate);
    }
  }

  lootItemFromContainer(
    server: ZoneServer2016,
    sourceContainer: LoadoutContainer,
    item?: BaseItem,
    count?: number
  ) {
    const client = server.getClientByCharId(this.characterId);
    if (!item || !item.isValid("lootItem")) return;
    if (!count) count = item.stackCount;
    if (count > item.stackCount) {
      count = item.stackCount;
    }
    const sourceCharacter = client?.character.mountedContainer,
      itemDefId = item.itemDefinitionId;
    if (
      this.getAvailableLoadoutSlot(server, itemDefId) &&
      sourceCharacter &&
      server.removeContainerItem(sourceCharacter, item, sourceContainer, count)
    ) {
      if (client && client.character.initialized) {
        server.sendData(client, "Reward.AddNonRewardItem", {
          itemDefId: itemDefId,
          iconId: server.getItemDefinition(itemDefId)?.IMAGE_SET_ID,
          nameId: server.getItemDefinition(itemDefId)?.NAME_ID,
          count: count
        });
      }
      this.equipItem(server, item, true);
    } else {
      for (const container of this.getSortedContainers()) {
        const itemDefinition = server.getItemDefinition(item.itemDefinitionId);
        if (!itemDefinition) return;

        const availableBulk = container.getAvailableBulk(server),
          itemBulk = itemDefinition.BULK,
          lootableItemsCount = Math.floor(availableBulk / itemBulk);

        if (lootableItemsCount <= 0) continue;

        // use count param if lootableCount is higher, otherwise use lootableItemsCount or stackCount depending on which is lower
        const lootCount =
          count < lootableItemsCount
            ? count
            : lootableItemsCount > item.stackCount
              ? item.stackCount
              : lootableItemsCount;

        sourceContainer.transferItem(server, container, item, 0, lootCount);
        return;
      }

      if (client)
        server.sendData(client, "Character.NoSpaceNotification", {
          characterId: client.character.characterId
        });
    }
  }

  transferItemFromLoadout(
    server: ZoneServer2016,
    targetContainer: LoadoutContainer,
    loadoutItem: LoadoutItem
  ) {
    const client = server.getClientByContainerAccessor(this);
    if (!client) return;

    // to container
    if (!targetContainer.getHasSpace(server, loadoutItem.itemDefinitionId, 1)) {
      server.containerError(client, ContainerErrors.NO_SPACE);
      return;
    }

    if (!server.removeLoadoutItem(this, loadoutItem.slotId)) {
      server.containerError(client, ContainerErrors.NO_ITEM_IN_SLOT);
      return;
    }

    if (loadoutItem.weapon) {
      const ammo = server.generateItem(
        server.getWeaponAmmoId(loadoutItem.itemDefinitionId),
        loadoutItem.weapon.ammoCount
      );
      if (
        ammo &&
        loadoutItem.weapon.ammoCount > 0 &&
        loadoutItem.weapon.itemDefinitionId != Items.WEAPON_REMOVER &&
        server.getItemDefinition(loadoutItem.itemDefinitionId)?.ITEM_CLASS !=
          ItemClasses.THROWABLES
      ) {
        this.lootContainerItem(server, ammo, ammo.stackCount, true);
      }
      loadoutItem.weapon.ammoCount = 0;
    }

    const targetCharacter = server.getEntity(
      targetContainer.loadoutItemOwnerGuid
    );

    if (targetCharacter instanceof BaseFullCharacter) {
      server.addContainerItem(
        targetCharacter,
        loadoutItem,
        targetContainer,
        true
      );
    }
  }

  getSortedContainers() {
    if (this.loadoutId != LoadoutIds.CHARACTER) {
      return Object.values(this._containers);
    }
    const containers = Object.values(this._containers),
      order = [
        LoadoutSlots.BACK,
        LoadoutSlots.BELT,
        LoadoutSlots.CHEST,
        LoadoutSlots.LEGS
      ];

    containers.sort((a, b) => {
      const aIndex = order.indexOf(a.slotId);
      const bIndex = order.indexOf(b.slotId);

      return aIndex - bIndex;
    });
    return containers;
  }

  lootContainerItem(
    server: ZoneServer2016,
    item?: BaseItem,
    count?: number,
    sendUpdate: boolean = true,
    array: LoadoutContainer[] = []
  ) {
    const client = server.getClientByContainerAccessor(this);
    if (!item || !item.isValid("lootContainerItem")) return;
    if (item.weapon) {
      clearTimeout(item.weapon.reloadTimer);
      delete item.weapon.reloadTimer;
    }
    if (!count) count = item.stackCount;
    if (count > item.stackCount) {
      count = item.stackCount;
    }

    const itemDefId = item.itemDefinitionId,
      availableContainer = this.getAvailableContainer(server, itemDefId, count);

    if (!availableContainer) {
      // container error full
      if (client) {
        server.sendData(client, "Character.NoSpaceNotification", {
          characterId: client.character.characterId
        });
      }

      this.getSortedContainers().forEach((c) => {
        if (item.stackCount <= 0) return;
        if (array.includes(c)) return;
        array.push(c);
        const availableSpace = c.getAvailableBulk(server),
          itemBulk = server.getItemDefinition(item.itemDefinitionId)?.BULK ?? 1;
        let lootCount = Math.floor(availableSpace / itemBulk);
        if (lootCount) {
          if (lootCount > item.stackCount) {
            lootCount = item.stackCount;
          }
          item.stackCount -= lootCount;
          this.lootContainerItem(
            server,
            server.generateItem(item.itemDefinitionId, lootCount),
            count,
            true,
            array
          );
        }
      });
      if (item.stackCount > 0) {
        server.worldObjectManager.createLootEntity(
          server,
          item,
          this.state.position,
          new Float32Array([0, Number(Math.random() * 10 - 5), 0, 1])
        );
      }
      return;
    }

    const itemStackGuid = availableContainer.getAvailableItemStack(
      server,
      itemDefId,
      count
    );
    if (itemStackGuid) {
      const itemStack =
        this._containers[availableContainer.slotId].items[itemStackGuid];
      itemStack.stackCount += count;
      if (!client) return;

      server.updateContainerItem(this, itemStack, availableContainer);
      if (sendUpdate && client.character.initialized) {
        server.sendData(client, "Reward.AddNonRewardItem", {
          itemDefId: itemDefId,
          iconId: server.getItemDefinition(itemDefId)?.IMAGE_SET_ID,
          nameId: server.getItemDefinition(itemDefId)?.NAME_ID,
          count: count
        });
      }
    } else {
      server.addContainerItem(this, item, availableContainer, sendUpdate);
    }
  }

  isDefaultItem(itemDefinitionId: number): boolean {
    let isDefault = false;
    this.defaultLoadout.forEach((defaultItem) => {
      if (defaultItem.item == itemDefinitionId) {
        isDefault = true;
      }
    });
    return isDefault;
  }

  equipLoadout(
    server: ZoneServer2016,
    loadout?: LoadoutKit,
    forceMaxDurability = false
  ) {
    const l = loadout ? loadout : this.defaultLoadout;
    l.forEach((entry) => {
      if (
        entry.item != Items.WEAPON_FISTS ||
        !this._loadout[LoadoutSlots.FISTS]
      ) {
        this.lootItem(
          server,
          server.generateItem(entry.item, entry.count, forceMaxDurability),
          entry.count,
          true
        );
      }
    });
  }

  equipContainerItem(
    server: ZoneServer2016,
    item: BaseItem,
    slotId: number,
    sourceCharacter: BaseFullCharacter = this
  ) {
    // equips an existing item from a container

    const client = server.getClientByContainerAccessor(sourceCharacter);

    const externalContainer = sourceCharacter.characterId !== this.characterId,
      loadout = externalContainer ? this._loadout : sourceCharacter._loadout,
      oldLoadoutItem = loadout[slotId],
      container = sourceCharacter.getItemContainer(item.itemGuid);
    if (!oldLoadoutItem?.itemDefinitionId && !container) {
      if (client)
        server.containerError(client, ContainerErrors.UNKNOWN_CONTAINER);
      return;
    }
    if (!server.removeContainerItem(sourceCharacter, item, container, 1)) {
      if (client)
        server.containerError(client, ContainerErrors.NO_ITEM_IN_SLOT);
      return;
    }
    if (oldLoadoutItem?.itemDefinitionId) {
      //TODO: Probably have to rework this? This makes backpack swapping possible.
      const def = server.getItemDefinition(oldLoadoutItem.itemDefinitionId);
      if (def?.ITEM_TYPE == ItemTypes.CONTAINER) {
        if (this.getAvailableLoadoutSlot(server, item.itemDefinitionId)) {
          this.equipItem(server, item, true, slotId);
        } else {
          sourceCharacter.lootItem(server, item, 1, false);
        }
        return;
      }

      // if target loadoutSlot is occupied
      if (oldLoadoutItem.itemGuid == item.itemGuid) {
        if (client)
          server.sendChatText(client, "[ERROR] Item is already equipped!");
        return;
      }
      if (
        !server.removeLoadoutItem(
          externalContainer ? this : sourceCharacter,
          oldLoadoutItem.slotId
        )
      ) {
        if (client)
          server.containerError(client, ContainerErrors.NO_ITEM_IN_SLOT);
        return;
      }
      (externalContainer ? sourceCharacter : this).lootContainerItem(
        server,
        oldLoadoutItem,
        undefined,
        false
      );
    }
    if (item.weapon) {
      clearTimeout(item.weapon.reloadTimer);
      delete item.weapon.reloadTimer;
    }
    this.equipItem(server, item, true, slotId);
  }

  getDeathItems(server: ZoneServer2016) {
    // --- Durability loss for footwear on death ---
    const footwear = this._loadout[LoadoutSlots.FEET];
    if (
      footwear &&
      (server.isConvey(footwear.itemDefinitionId) ||
        server.isZed(footwear.itemDefinitionId) ||
        server.isGator(footwear.itemDefinitionId))
    ) {
      footwear.currentDurability = (footwear.currentDurability || 0) - 1080;
      if (footwear.currentDurability <= 0) {
        server.removeInventoryItem(this, footwear);
        this.lootContainerItem(server, server.generateItem(Items.CLOTH, 4));
      }
    }
    // --- End durability loss ---

    // --- Durability loss for MilitaryTan bag on death ---
    const MilitaryTan = this._loadout[LoadoutSlots.BACK];
    if (MilitaryTan && server.isMilitaryTan(MilitaryTan.itemDefinitionId)) {
      MilitaryTan.currentDurability =
        (MilitaryTan.currentDurability || 0) - 334; /// 6 Lifes/Tan
      if (MilitaryTan.currentDurability <= 0) {
        server.removeInventoryItem(this, MilitaryTan);
        this.lootContainerItem(server, server.generateItem(Items.CLOTH, 4));
        this.lootContainerItem(server, server.generateItem(Items.TWINE, 1));
        this.lootContainerItem(
          server,
          server.generateItem(Items.METAL_BRACKET, 1)
        );
      }
    }
    // --- End durability loss for MilitaryTan ---

    // --- Durability loss for Small Backpack on death ---
    const smallBackpack = this._loadout[LoadoutSlots.BACK];
    if (smallBackpack && server.isBackpack(smallBackpack.itemDefinitionId)) {
      smallBackpack.currentDurability =
        (smallBackpack.currentDurability || 0) - 500; // 4 lifes/small backpack
      if (smallBackpack.currentDurability <= 0) {
        server.removeInventoryItem(this, smallBackpack);
        this.lootContainerItem(server, server.generateItem(Items.CLOTH, 4));
      }
    }
    // --- End durability loss for Small Backpack ---

    // --- Durability loss for Framed Backpack on death ---
    const framedBackpack = this._loadout[LoadoutSlots.BACK];
    if (framedBackpack && server.isFramedBp(framedBackpack.itemDefinitionId)) {
      framedBackpack.currentDurability =
        (framedBackpack.currentDurability || 0) - 400; // 5 lifes/framed backpack
      if (framedBackpack.currentDurability <= 0) {
        server.removeInventoryItem(this, framedBackpack);
        this.lootContainerItem(server, server.generateItem(Items.CLOTH, 2));
        this.lootContainerItem(
          server,
          server.generateItem(Items.BACKPACK_FRAME, 1)
        );
      }
    }
    // --- End durability loss for Framed Backpack ---

    const items: { [itemGuid: string]: BaseItem } = {};
    Object.values(this._loadout).forEach((itemData) => {
      if (
        itemData.itemGuid != "0x0" &&
        !this.isDefaultItem(itemData.itemDefinitionId) &&
        !server.isAdminItem(itemData.itemDefinitionId)
      ) {
        const item = new BaseItem(
          itemData.itemDefinitionId,
          itemData.itemGuid,
          itemData.currentDurability,
          itemData.stackCount
        );

        item.debugFlag = "getDeathItems";
        if (itemData.weapon)
          item.weapon = new Weapon(item, itemData.weapon.ammoCount);
        item.slotId = Object.keys(items).length + 1;
        items[item.itemGuid] = item;
      }
    });

    Object.values(this._containers).forEach((container: LoadoutContainer) => {
      Object.values(container.items).forEach((item) => {
        if (
          !this.isDefaultItem(item.itemDefinitionId) &&
          !server.isAdminItem(item.itemDefinitionId)
        ) {
          let stacked = false;
          for (const i of Object.values(items)) {
            // stack similar items
            if (
              i.itemDefinitionId == item.itemDefinitionId &&
              server.isStackable(item.itemDefinitionId)
            ) {
              items[i.itemGuid].stackCount += item.stackCount;
              stacked = true;
              break;
            }
          }
          if (!stacked) {
            const newItem = new BaseItem(
              item.itemDefinitionId,
              item.itemGuid,
              item.currentDurability,
              item.stackCount
            );

            newItem.debugFlag = "getDeathItemsNotStacked";
            if (item.weapon)
              newItem.weapon = new Weapon(newItem, item.weapon.ammoCount);
            newItem.slotId = Object.keys(items).length + 1;
            items[newItem.itemGuid] = newItem;
          }
        }
      });
    });

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
            effectId: slot.effectId || 0,
            tintAlias: slot.tintAlias || "Default",
            decalAlias: slot.decalAlias || "#"
          }
        }
      : undefined;
  }

  pGetEquipmentSlots() {
    return Object.keys(this._equipment).map((slotId) => {
      return this.pGetEquipmentSlot(Number(slotId));
    });
  }

  pGetAttachmentSlot(slotId: number) {
    const slot = this._equipment[slotId];
    return slot
      ? {
          modelName: slot.modelName.replace(
            /Up|Down/g,
            this.hoodState == "Down" ? "Up" : "Down"
          ),
          effectId: slot.effectId || 0,
          textureAlias: slot.textureAlias || "",
          tintAlias: slot.tintAlias || "Default",
          decalAlias: slot.decalAlias || "#",
          slotId: slot.slotId,
          SHADER_PARAMETER_GROUP: slot?.SHADER_PARAMETER_GROUP ?? []
        }
      : undefined;
  }

  pGetAttachmentSlots() {
    return Object.keys(this._equipment).map((slotId) => {
      return this.pGetAttachmentSlot(Number(slotId));
    });
  }

  pGetEquipmentSlotFull(slotId: number) {
    const slot = this._equipment[slotId];
    if (!slot) return;
    return {
      characterData: {
        characterId: this.characterId
      },
      equipmentSlot: this.pGetEquipmentSlot(slotId),
      attachmentData: this.pGetAttachmentSlot(slotId)
    };
  }

  pGetEquipment(): EquipmentSetCharacterEquipment {
    return {
      characterData: {
        profileId: 5,
        characterId: this.characterId
      },
      unknownDword1: 0,
      tintAlias: "Default",
      decalAlias: "#",
      equipmentSlots: this.pGetEquipmentSlots(),
      attachmentData: this.pGetAttachmentSlots(),
      unknownBoolean1: true
    };
  }

  pGetFootwearAudio(server: ZoneServer2016): AudioSetSwitch {
    const item: LoadoutItem | undefined = this._loadout[LoadoutSlots.FEET];
    let footwearStatus = "Barefoot";
    if (item && server.isConvey(item.itemDefinitionId)) {
      footwearStatus = "Sneaker";
    } else if (item && server.isBoot(item.itemDefinitionId)) {
      footwearStatus = "Boot";
    } else if (
      item &&
      (server.isZed(item.itemDefinitionId) ||
        server.isGator(item.itemDefinitionId))
    ) {
      footwearStatus = "Silent";
    }

    return {
      characterId: this.characterId,
      unknownString1: "ShoeType",
      unknownString2: footwearStatus
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
        unknownByte1: 255 // flags?
      },
      unknownDword1: slotId
    };
  }

  getLoadoutSlots() {
    const slots: Array<number> = [];
    loadoutSlots.forEach((slot: any) => {
      if (slot.LOADOUT_ID == this.loadoutId) slots.push(slot.SLOT_ID);
    });
    return slots;
  }

  /**
   * Gets the first available loadout slot for a given item.
   * @param server The ZoneServer instance.
   * @param itemDefId The definition ID of an item to try to find a slot for.
   * @returns Returns the ID of an available loadout slot.
   */
  getAvailableLoadoutSlot(server: ZoneServer2016, itemDefId: number): number {
    // gets an open loadoutslot for a specified itemDefinitionId
    const itemDef = server.getItemDefinition(itemDefId),
      loadoutSlotItemClass = loadoutSlotItemClasses.find(
        (slot: any) =>
          slot.ITEM_CLASS == itemDef?.ITEM_CLASS &&
          this.loadoutId == slot.LOADOUT_ID
      );
    let slot = loadoutSlotItemClass?.SLOT;
    if (!slot) return 0;
    switch (itemDef?.ITEM_CLASS) {
      case ItemClasses.THROWABLES:
      case ItemClasses.WEAPONS_LONG:
      case ItemClasses.WEAPONS_PISTOL:
      case ItemClasses.WEAPONS_MELEES:
      case ItemClasses.WEAPONS_MELEES0:
      case ItemClasses.WEAPONS_CROSSBOW:
      case ItemClasses.WEAPONS_BOW:
        if (this._loadout[slot]?.itemDefinitionId) {
          // primary
          slot = LoadoutSlots.SECONDARY;
        }
        if (
          slot == LoadoutSlots.SECONDARY &&
          this._loadout[slot]?.itemDefinitionId
        ) {
          // secondary
          slot = LoadoutSlots.TERTIARY;
        }
        break;
      case ItemClasses.WEAPONS_GENERIC: // item1/item2 slots
        if (this._loadout[slot]?.itemDefinitionId) {
          slot = LoadoutSlots.ITEM2;
        }
        break;
      case ItemClasses.POUCHES:
      case ItemClasses.BACKPACKS:
        const currentItemBulk = server.getContainerDefinition(
            itemDef?.PARAM1
          )?.MAX_BULK,
          loadOutItemDef = server.getItemDefinition(
            this._loadout[slot]?.itemDefinitionId
          ),
          loadOutItemBulk = loadOutItemDef?.PARAM1
            ? server.getContainerDefinition(loadOutItemDef.PARAM1)?.MAX_BULK
            : 0;
        if (currentItemBulk > loadOutItemBulk) return slot;
        break;
    }
    if (this._loadout[slot]?.itemDefinitionId) return 0;
    return slot;
  }

  /**
   * Gets the first available passive equipment slot for a given item.
   * @param server The ZoneServer instance.
   * @param itemDefId The definition ID of an item to try to find a slot for.
   * @returns Returns the ID of an available passive equipment slot.
   */
  getAvailablePassiveEquipmentSlot(
    server: ZoneServer2016,
    itemDefId: number
  ): number {
    const itemDef = server.getItemDefinition(itemDefId),
      itemClass = itemDef?.ITEM_CLASS;
    if (!itemDef || !itemClass || !server.isWeapon(itemDefId)) return 0;
    for (const slot of equipSlotItemClasses) {
      if (
        slot.ITEM_CLASS == itemDef.ITEM_CLASS &&
        !this._equipment[slot.EQUIP_SLOT_ID]
      ) {
        return slot.EQUIP_SLOT_ID;
      }
    }
    return 0;
  }

  /**
   * Returns the first container that has enough space for an item stack.
   * @param server The ZoneServer instance.
   * @param itemDefinitionId The item definition ID to try to put in a container.
   * @param count The amount of items to try and fit in a container.
   * @returns Returns a container with available space, or undefined.
   */
  getAvailableContainer(
    server: ZoneServer2016,
    itemDefinitionId: number,
    count: number
  ): LoadoutContainer | undefined {
    const itemDef = server.getItemDefinition(itemDefinitionId);
    if (!itemDef) return;
    for (const container of this.getSortedContainers()) {
      if (!container) continue;
      if (
        container.getMaxBulk(server) == 0 ||
        container.getAvailableBulk(server) >= itemDef.BULK * count
      ) {
        return container;
      }
    }
    return;
  }

  pGetLoadoutSlots() {
    return {
      characterId: EXTERNAL_CONTAINER_GUID,
      loadoutId: this.loadoutId,
      loadoutData: {
        loadoutSlots: Object.values(this.getLoadoutSlots()).map((slotId) => {
          return this.pGetLoadoutSlot(slotId);
        })
      },
      currentSlotId: this.currentLoadoutSlot
    };
  }

  pGetItemWeaponData(server: ZoneServer2016, slot: BaseItem) {
    if (slot.weapon) {
      return {
        isWeapon: true, // not sent to client, only used as a flag for pack function
        unknownData1: {
          unknownBoolean1: false
        },
        unknownData2: {
          ammoSlots: server.getWeaponAmmoId(slot.itemDefinitionId)
            ? [{ ammoSlot: slot.weapon?.ammoCount }]
            : [],
          firegroups: [
            {
              firegroupId: server.getWeaponDefinition(
                server.getItemDefinition(slot.itemDefinitionId)?.PARAM1 ?? 0
              )?.FIRE_GROUPS[0]?.FIRE_GROUP_ID,
              unknownArray1: [
                // maybe firemodes?
                {
                  unknownByte1: 0,
                  unknownDword1: 0,
                  unknownDword2: 0,
                  unknownDword3: 0
                },
                {
                  unknownByte1: 0,
                  unknownDword1: 0,
                  unknownDword2: 0,
                  unknownDword3: 0
                }
              ]
            }
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
          unknownDword3: -1
        },
        characterStats: [],
        unknownArray1: []
      };
    }
    return {
      isWeapon: false, // not sent to client, only used as a flag for pack function
      unknownBoolean1: false
    };
  }

  pGetItemData(server: ZoneServer2016, item: BaseItem, containerDefId: number) {
    return {
      itemDefinitionId: item.itemDefinitionId,
      tintId: 0,
      guid: item.itemGuid,
      count: item.stackCount,
      itemSubData: {
        hasSubData: false
      },
      containerGuid: item.containerGuid,
      containerDefinitionId: containerDefId,
      containerSlotId: item.slotId,
      baseDurability: server.getItemBaseDurability(item.itemDefinitionId),
      currentDurability: item.currentDurability,
      maxDurabilityFromDefinition: server.getItemBaseDurability(
        item.itemDefinitionId
      ),
      unknownBoolean1: true,
      ownerCharacterId: EXTERNAL_CONTAINER_GUID,
      unknownDword9: 1,
      weaponData: this.pGetItemWeaponData(server, item)
    };
  }

  pGetInventoryItems(server: ZoneServer2016) {
    const items = Object.values(this._loadout)
      .filter((slot) => {
        if (slot.itemDefinitionId) {
          return true;
        }
      })
      .map((slot) => {
        return this.pGetItemData(server, slot, LOADOUT_CONTAINER_ID);
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

  pGetFull(server: ZoneServer2016): LightweightToFullNpc {
    return {
      transientId: this.transientId,
      attachmentData: this.pGetAttachmentSlots(),
      characterId: this.characterId,
      resources: {
        data: this.pGetResources()
      },
      effectTags: [],
      unknownData1: {},
      targetData: {},
      unknownArray1: [],
      unknownArray2: [],
      unknownArray3: { data: [] },
      unknownArray4: {},
      unknownArray5: { data: [] },
      remoteWeapons: { data: {} },
      materialType: this.materialType,
      itemsData: {
        items: this.pGetInventoryItems(server),
        unknownDword1: 0
      }
    };
  }

  pGetContainerData(server: ZoneServer2016, container: LoadoutContainer) {
    return {
      guid: container.itemGuid,
      definitionId: container.containerDefinitionId,
      associatedCharacterId: this.characterId,
      slots: container.getMaxSlots(server),
      items: Object.values(container.items).map((item, idx) => {
        container.items[item.itemGuid].slotId = idx + 1;
        return {
          itemDefinitionId: item.itemDefinitionId,
          itemData: this.pGetItemData(
            server,
            item,
            container.containerDefinitionId
          )
        };
      }),
      showBulk: true,
      maxBulk: container.getMaxBulk(server),
      unknownDword1: 28,
      bulkUsed: container.getUsedBulk(server),
      hasBulkLimit: !!container.getMaxBulk(server)
    };
  }

  pGetContainers(server: ZoneServer2016) {
    return Object.values(this._containers).map((container) => {
      return {
        loadoutSlotId: container.slotId,
        containerData: this.pGetContainerData(server, container)
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
      let resourceId = Number(resource);
      let resourceType = this.getResourceType(resourceId);
      // sending endurence with sendself makes it stuck on lower tier client-side
      if (resourceId == ResourceIds.ENDURANCE) {
        resourceId = 0;
        resourceType = 0;
      }
      return {
        resourceType: resourceType,
        resourceData: {
          resourceId: resourceId,
          resourceType: resourceType,
          value:
            this._resources[resourceId] > 0 ? this._resources[resourceId] : 0
        }
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
      !!itemDef.IS_ARMOR
    );
  }

  hasArmor(server: ZoneServer2016): boolean {
    const slot = this._loadout[LoadoutSlots.ARMOR],
      itemDef = server.getItemDefinition(slot?.itemDefinitionId);
    if (!slot || !itemDef) return false;
    return slot.itemDefinitionId >= 0 && itemDef.ITEM_CLASS == 25041;
  }

  hasItem(item: Items): boolean {
    return this.getItemById(item) != undefined;
  }

  OnFullCharacterDataRequest(server: ZoneServer2016, client: ZoneClient2016) {
    console.log(
      `[ERROR] Unhandled FullCharacterDataRequest from client ${client.guid}!`
    );
  }

  OnProjectileHit(server: ZoneServer2016, damageInfo: DamageInfo) {
    this.damage(server, damageInfo);
  }

  OnMeleeHit(server: ZoneServer2016, damageInfo: DamageInfo) {
    this.damage(server, damageInfo);
  }
}
