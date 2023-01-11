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

import { MAX_UINT32 } from "../../../utils/constants";
import { ContainerErrors } from "../models/enums";
import { ZoneServer2016 } from "../zoneserver";
import { BaseItem } from "./baseItem";
import { LoadoutItem } from "./loadoutItem";
import { ZoneClient2016 } from "./zoneclient";

// helper functions
function combineItemStack(
  server: ZoneServer2016,
  client: ZoneClient2016,
  oldStackCount: number,
  targetContainer: LoadoutContainer,
  item: BaseItem,
  count: number
) {
  if (oldStackCount == count) {
    // if full stack is moved
    server.addContainerItem(
      client.character,
      item,
      targetContainer,
      count,
      false
    );
    return;
  }
  // if only partial stack is moved
  server.addContainerItem(
    client.character,
    server.generateItem(item.itemDefinitionId),
    targetContainer,
    count,
    false
  );
}

export class LoadoutContainer extends LoadoutItem {
  containerDefinitionId: number;
  items: { [itemGuid: string]: BaseItem } = {};
  canAcceptItems: boolean = true;
  readonly isMutable: boolean = true;
  constructor(item: LoadoutItem, containerDefinitionId: number) {
    super(item, item.slotId, item.loadoutItemOwnerGuid);
    this.containerDefinitionId = containerDefinitionId;
  }

  /**
   * Gets the used bulk of this container.
   * @param server The ZoneServer instance.
   * @returns Returns the amount of bulk used.
   */
  getUsedBulk(server: ZoneServer2016): number {
    let bulk = 0;
    for (const item of Object.values(this.items)) {
      bulk +=
        server.getItemDefinition(item.itemDefinitionId).BULK * item.stackCount;
    }
    return bulk;
  }

  /**
   * Gets the maximum bulk that this container can hold.
   * @param server The ZoneServer instance.
   */
  getMaxBulk(server: ZoneServer2016): number {
    return server.getContainerDefinition(this.containerDefinitionId).MAX_BULK;
  }

  /**
   * Gets the available bulk for this container.
   * @param server The ZoneServer instance.
   * @returns Returns the amount of bulk available.
   */
  getAvailableBulk(server: ZoneServer2016): number {
    return this.getMaxBulk(server) - this.getUsedBulk(server);
  }

  /**
   * Returns a boolean if this container has enough space for a given amount of a certain item.
   * @param server The ZoneServer instance.
   * @param itemDefinitionId The definiton id of the item to check.
   * @param count The amount of the item to check.
   */
  getHasSpace(
    server: ZoneServer2016,
    itemDefinitionId: number,
    count: number
  ): boolean {
    if (this.getMaxBulk(server) == 0) return true; // for external containers
    return !!(
      this.getMaxBulk(server) -
        (this.getUsedBulk(server) +
          server.getItemDefinition(itemDefinitionId).BULK * count) >=
      0
    );
  }

  /**
   * Gets an item stack in a container that has space for a specified item.
   * @param server The ZoneServer instance.
   * @param itemDefId The item definition ID of the item stack to check.
   * @param count The amount of items to fit into the stack.
   * @param slotId Optional: The slotId of a specific item stack to check.
   * @returns Returns the itemGuid of the item stack.
   */
  getAvailableItemStack(
    server: ZoneServer2016,
    itemDefId: number,
    count: number,
    slotId: number = 0
  ): string {
    //
    // if slotId is defined, then only an item with the same slotId will be returned
    if (server.getItemDefinition(itemDefId).MAX_STACK_SIZE == 1) return "";
    for (const item of Object.values(this.items)) {
      if (
        item.itemDefinitionId == itemDefId &&
        server.getItemDefinition(item.itemDefinitionId).MAX_STACK_SIZE >=
          item.stackCount + count
      ) {
        if (!slotId || slotId == item.slotId) {
          return item.itemGuid;
        }
      }
    }
    return "";
  }

  /**
   * Gets the maximum slots that this container can hold.
   * @param server The ZoneServer instance.
   */
  getMaxSlots(server: ZoneServer2016) {
    return server.getContainerDefinition(this.containerDefinitionId)
      .MAXIMUM_SLOTS;
  }

  // transfers an item from this container to another
  transferItem(
    server: ZoneServer2016,
    targetContainer: LoadoutContainer,
    item: BaseItem,
    newSlotId: number,
    count?: number
  ) {
    if (!count) count = item.stackCount;
    const oldStackCount = item.stackCount; // saves stack count before it gets altered

    let client;

    const lootableEntity = server.getLootableEntity(this.loadoutItemOwnerGuid);
    if (lootableEntity) {
      const mountedCharacterId = lootableEntity.mountedCharacter;
      if (mountedCharacterId)
        client = server.getClientByCharId(mountedCharacterId);
    } else {
      client = server.getClientByCharId(this.loadoutItemOwnerGuid);
    }

    if (!client) return;

    if (!targetContainer.canAcceptItems) {
      server.containerError(client, ContainerErrors.DOES_NOT_ACCEPT_ITEMS);
      return;
    }
    if (!this.isMutable || !targetContainer.isMutable) {
      server.containerError(client, ContainerErrors.NOT_MUTABLE);
      return;
    }

    if (
      this.containerGuid != targetContainer.containerGuid &&
      !targetContainer.getHasSpace(server, item.itemDefinitionId, count)
    ) {
      // allows items in the same container but different stacks to be stacked
      return;
    }
    if (!server.removeContainerItem(client, item, this, count)) {
      server.containerError(client, ContainerErrors.NO_ITEM_IN_SLOT);
      return;
    }
    if (newSlotId == MAX_UINT32) {
      combineItemStack(
        server,
        client,
        oldStackCount,
        targetContainer,
        item,
        count
      );
    } else {
      const itemStack = targetContainer.getAvailableItemStack(
        server,
        item.itemDefinitionId,
        count,
        newSlotId
      );
      if (itemStack) {
        // add to existing item stack
        const item = targetContainer.items[itemStack];
        item.stackCount += count;
        server.updateContainerItem(client, item, targetContainer);
      } else {
        // add item to end
        combineItemStack(
          server,
          client,
          oldStackCount,
          targetContainer,
          item,
          count
        );
      }
    }
  }
}
