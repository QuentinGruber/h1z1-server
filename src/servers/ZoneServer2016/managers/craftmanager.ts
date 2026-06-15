// ======================================================================
//
//   GNU GENERAL PUBLIC LICENSE
//   Version 3, 29 June 2007
//   copyright (C) 2020 - 2021 Quentin Gruber
//   copyright (C) 2021 - 2026 H1emu community
//
//   https://github.com/QuentinGruber/h1z1-server
//   https://www.npmjs.com/package/h1z1-server
//
//   Based on https://github.com/psemu/soe-network
// ======================================================================

import { ContainerErrors, FilterIds, Items } from "../models/enums";
import { ZoneServer2016 } from "../zoneserver";
import { ZoneClient2016 as Client } from "../classes/zoneclient";
import { checkConstructionInRange } from "../../../utils/utils";
import { Recipe } from "types/zoneserver";
import { Character2016 } from "../entities/character";
import { BaseItem } from "../classes/baseItem";
import { BaseLootableEntity } from "../entities/baselootableentity";
import { ChallengeType } from "./challengemanager";
import { ItemObject } from "../entities/itemobject";
import { ClientUpdateProximateItems } from "types/zone2016packets";
const debug = require("debug")("ZoneServer");

interface CraftComponentDSEntry {
  itemDefinitionId: number;
  stackCount: number;
}
interface RemovedItem {
  itemDS: ItemDataSource;
  count: number;
}

type ItemDataSource = {
  item: BaseItem;
  character: BaseLootableEntity | Character2016;
};
type InventoryDataSource = {
  [itemDefinitionId: number]: Array<ItemDataSource>;
};

/**
 * Retrieves the craft components data source from the client's inventory and mounted container.
 * @param client The client to get the craft components data source for.
 * @param server ZoneServer pointer.
 * @returns The craft components data source object.
 */
function getCraftComponentsDataSource(
  client: Client,
  server: ZoneServer2016
): {
  [itemDefinitionId: number]: CraftComponentDSEntry;
} {
  // ignoring proximity container items for now

  // todo: include other datasources when they are available ex. proximity items, accessed container
  const inventory: { [itemDefinitionId: number]: CraftComponentDSEntry } = {};
  Object.keys(client.character._containers).forEach((loadoutSlotId) => {
    const container = client.character._containers[Number(loadoutSlotId)];
    Object.keys(container.items).forEach((itemGuid) => {
      const item = container.items[itemGuid];
      if (inventory[item.itemDefinitionId]) {
        inventory[item.itemDefinitionId].stackCount += item.stackCount;
      } else {
        inventory[item.itemDefinitionId] = {
          ...item
        }; // push new itemstack
      }
    });
  });
  const proximityItems = server.getCraftingProximityItems(client)?.items;
  if (proximityItems) {
    proximityItems.forEach((item: any) => {
      if (inventory[item.itemDefinitionId]) {
        inventory[item.itemDefinitionId].stackCount += item.itemData.count;
      } else {
        inventory[item.itemDefinitionId] = {
          ...item.itemData,
          stackCount: item.itemData.count
        }; // push new itemstack
      }
    });
  }

  if (!client.character.mountedContainer) return inventory;

  const container = client.character.mountedContainer.getContainer();
  if (!container) return inventory; // should never trigger
  Object.keys(container.items).forEach((itemGuid) => {
    const item = container.items[itemGuid];
    if (inventory[item.itemDefinitionId]) {
      inventory[item.itemDefinitionId].stackCount += item.stackCount;
    } else {
      inventory[item.itemDefinitionId] = {
        ...item
      }; // push new itemstack
    }
  });

  return inventory;
}

/**
 * Finds a recipe that produces the given itemDefinitionId by checking rewardId fields
 * @param character The character whose recipes to search
 * @param itemDefinitionId The item ID to find a recipe for
 * @returns The first matching recipe and its recipe ID, or undefined if not found
 */
function findRecipeByRewardId(
  character: Character2016,
  itemDefinitionId: number
): { recipeId: number; recipe: Recipe } | undefined {
  for (const [recipeId, recipeEntry] of Object.entries(character.recipes)) {
    let recipe: Recipe | undefined;
    if (recipeEntry) {
      recipe = Array.isArray(recipeEntry) ? recipeEntry[0] : recipeEntry;
    }
    if (recipe && recipe.rewardId === itemDefinitionId) {
      return {
        recipeId: Number(recipeId),
        recipe
      };
    }
  }
  return undefined;
}

/**
 * CraftManager handles the crafting of a recipe by a client.
 */
export class CraftManager {
  /** Iterated count of craft actions in a loop */
  private craftLoopCount: number = 0;
  private maxCraftLoopCount: number = 500;
  /** HashMap of item components that make-up the parent item,
   * uses itemDefinitionId (number) for indexing
   */
  private componentsDataSource: {
    [itemDefinitionId: number]: CraftComponentDSEntry;
  } = {};

  /**
   * Constructs a new instance of the CraftManager class.
   * @param client - The client object.
   * @param server - The server object.
   * @param recipeId - The ID of the recipe to craft.
   * @param count - The number of times to craft the recipe.
   */
  constructor(
    client: Client,
    server: ZoneServer2016,
    recipeId: number = 0,
    count: number = 0
  ) {
    this.componentsDataSource = getCraftComponentsDataSource(client, server);
    this.start(client, server, recipeId, count);
  }

  /**
   * Removes simulated craft components from the internal recipe components data source.
   * @param itemDefinitionId The item definition ID of the craft component to remove.
   * @param count The number of craft components to remove.
   * @returns A boolean indicating if the removal was successful.
   */
  removeSimulatedCraftComponent(
    itemDefinitionId: number,
    count: number
  ): boolean {
    const removeItem = this.componentsDataSource[itemDefinitionId];
    if (!removeItem) return false;
    if (removeItem.stackCount == count) {
      delete this.componentsDataSource[itemDefinitionId];
    } else if (removeItem.stackCount > count) {
      this.componentsDataSource[itemDefinitionId].stackCount -= count;
    } else {
      // if removeItem.stackCount < count
      return false;
    }
    return true;
  }

  /**
   * Removes a craft component from the character and updates the remaining items.
   * @param server The ZoneServer2016 instance.
   * @param itemDS The item data source containing the craft component.
   * @param count The number of craft components to remove.
   * @returns A boolean indicating if the removal was successful.
   */
  async removeCraftComponent(
    server: ZoneServer2016,
    itemDS: ItemDataSource,
    count: number
  ): Promise<boolean> {
    if (await server.removeInventoryItem(itemDS.character, itemDS.item, count))
      return true;

    const item: any = itemDS.item;
    const remainder = item?.stackCount - count;
    if (remainder <= 0) {
      return server.deleteEntity(item.ownerCharacterId, server._spawnedItems);
    }

    const entity = server.getEntity(item.ownerCharacterId);
    if (entity instanceof ItemObject) {
      entity.item.stackCount -= count;
      const client = server.getClientByCharId(itemDS.character.characterId);
      if (!client) return true;
      server.sendData<ClientUpdateProximateItems>(
        client,
        "ClientUpdate.ProximateItems",
        server.getProximityItems(client)
      );
      return true;
    }

    return false;
  }

  /**
   * Restores removed items to the character's inventory.
   * @param server The ZoneServer2016 instance.
   * @param client The client whose inventory needs restoration.
   * @param removedItems Array of removed items to restore.
   */
  async restoreRemovedItems(
    server: ZoneServer2016,
    client: Client,
    removedItems: RemovedItem[]
  ): Promise<void> {
    for (const removed of removedItems) {
      await client.character.lootItem(
        server,
        server.generateItem(removed.itemDS.item.itemDefinitionId, removed.count)
      );
    }
  }

  /**
   * Generates the craft queue based on the recipe and its components.
   * @param server The ZoneServer2016 instance.
   * @param client The client performing the craft.
   * @param recipe The recipe object.
   * @param recipeCount The number of times to repeat the recipe.
   * @param rewardItemId The item ID that will be produced by this recipe.
   * @param craftCount The total number of items to craft.
   * @returns A promise resolving to a boolean indicating if the craft queue generation was successful.
   */
  async generateCraftQueue(
    server: ZoneServer2016,
    client: Client,
    recipe: Recipe,
    recipeCount: number,
    rewardItemId: number,
    craftCount: number
  ): Promise<boolean> {
    for (const component of recipe.components) {
      const remainingItems = component.requiredAmount * recipeCount;
      // if component isn't found at all
      if (!this.componentsDataSource[component.itemDefinitionId]) {
        const componentRecipeLookup = findRecipeByRewardId(
          client.character,
          component.itemDefinitionId
        );
        if (!componentRecipeLookup) {
          debug(
            `[CraftManager] ${client.character.name} tried to craft an invalid recipe for item ${component.itemDefinitionId}!`
          );
          return false; // no valid recipe to craft component
        }
        const componentRecipe = componentRecipeLookup.recipe;
        const componentRecipeId = componentRecipeLookup.recipeId;
        const componentBundleCount = componentRecipe?.bundleCount || 1;

        if (component.requiredAmount / componentBundleCount < 1) {
          if (
            !(await this.craftItem(
              server,
              client,
              componentRecipeId,
              Math.ceil(
                (component.requiredAmount / componentBundleCount) * recipeCount
              )
            ))
          ) {
            return false; // craftItem returned some error
          }
        } else {
          for (let i = 0; i < recipeCount; i++) {
            if (
              !(await this.craftItem(
                server,
                client,
                componentRecipeId,
                Math.ceil(component.requiredAmount / componentBundleCount)
              ))
            ) {
              return false; // craftItem returned some error
            }
          }
        }

        // if there is only some of the component
      } else if (
        this.componentsDataSource[component.itemDefinitionId].stackCount <
        remainingItems
      ) {
        const componentRecipeLookup = findRecipeByRewardId(
          client.character,
          component.itemDefinitionId
        );
        if (!componentRecipeLookup) {
          debug(
            `[CraftManager] ${client.character.name} tried to craft an invalid recipe for item ${component.itemDefinitionId}!`
          );
          return false; // no valid recipe to craft component
        }
        const componentRecipe = componentRecipeLookup.recipe;
        const componentRecipeId = componentRecipeLookup.recipeId;
        const componentBundleCount = componentRecipe?.bundleCount || 1;
        let stackCount =
          this.componentsDataSource[component.itemDefinitionId].stackCount;
        if (component.requiredAmount / componentBundleCount < 1) {
          let craft = 0;
          for (let i = 0; i < recipeCount; i++) {
            let craftAmount = 0; // amount that needs crafted per recipe iteration
            if (stackCount >= component.requiredAmount) {
              // use some of stack and don't craft any component through one recipe iteration
              stackCount -= Math.ceil(
                component.requiredAmount / componentBundleCount
              );
            } else {
              // use all of stack if required component amount is greater than stackCount
              craftAmount =
                Math.ceil(component.requiredAmount / componentBundleCount) -
                stackCount;
              stackCount = 0;
            }
            craft += Math.ceil(craftAmount / componentBundleCount);
          }
          if (
            !(await this.craftItem(server, client, componentRecipeId, craft))
          ) {
            return false; // craftItem returned some error
          }
        } else {
          for (let i = 0; i < recipeCount; i++) {
            let craftAmount = 0; // amount that needs crafted per recipe iteration
            if (stackCount >= component.requiredAmount) {
              // use some of stack and don't craft any component through one recipe iteration
              stackCount -= component.requiredAmount;
            } else {
              // use all of stack if required component amount is greater than stackCount
              craftAmount = component.requiredAmount - stackCount;
              stackCount = 0;
            }
            if (
              !(await this.craftItem(
                server,
                client,
                componentRecipeId,
                Math.ceil(craftAmount / componentBundleCount)
              ))
            ) {
              return false; // craftItem returned some error
            }
          }
        }
      }

      if (
        !this.removeSimulatedCraftComponent(
          component.itemDefinitionId,
          remainingItems
        )
      ) {
        server.containerError(client, ContainerErrors.NO_ITEM_IN_SLOT);
        return false;
      }
    }
    // push dummy item using the reward item ID (not the recipe ID)
    if (this.componentsDataSource[rewardItemId]) {
      this.componentsDataSource[rewardItemId].stackCount += craftCount;
    } else {
      this.componentsDataSource[rewardItemId] = {
        itemDefinitionId: rewardItemId,
        stackCount: craftCount
      };
    }

    return true;
  }

  /**
   * Retrieves the inventory data source for a character.
   * @param character The Character2016 instance.
   * @returns The inventory data source object.
   */
  getInventoryDataSource(character: Character2016): InventoryDataSource {
    const inv: InventoryDataSource = {};

    Object.values(character.getInventoryAsContainer()).forEach((items) => {
      inv[items[0].itemDefinitionId] = items.map((item) => {
        return {
          item: item,
          character: character
        };
      });
    });

    const mountedContainer = character.mountedContainer;
    if (!mountedContainer) return inv;

    const container = mountedContainer.getContainer();
    if (!container) return inv; // should never trigger

    for (const item of Object.values(container.items)) {
      const itemDS = {
        item,
        character: mountedContainer
      };

      if (inv[item.itemDefinitionId]) {
        inv[item.itemDefinitionId].push(itemDS);
        continue;
      }
      inv[item.itemDefinitionId] = [itemDS];
    }

    return inv;
  }

  /**
   * Crafts an item using the given recipe and adds it to the client's inventory.
   * @param server The ZoneServer2016 instance.
   * @param client The client performing the craft.
   * @param recipeId The ID of the recipe being crafted.
   * @param recipeCount The number of times to repeat the recipe.
   * @returns A promise resolving to a boolean indicating if the crafting process was successful.
   */
  async craftItem(
    server: ZoneServer2016,
    client: Client,
    recipeId: number,
    recipeCount: number
  ): Promise<boolean> {
    if (!recipeCount) return false;
    this.craftLoopCount++;
    if (this.craftLoopCount > this.maxCraftLoopCount) {
      return false;
    }

    // Extract base recipe ID (handle both single and variant recipe IDs)
    const baseRecipeId = recipeId % 1000000;
    const variantIndex = Math.floor(recipeId / 1000000);

    const recipeEntry = client.character.recipes[baseRecipeId];

    // Handle recipe arrays - try each variant or specific variant if requested
    let recipeVariants: any[] = [];
    if (Array.isArray(recipeEntry)) {
      if (variantIndex < recipeEntry.length && recipeEntry[variantIndex]) {
        // Specific variant requested
        recipeVariants = [recipeEntry[variantIndex]];
      } else {
        // Try all variants
        recipeVariants = recipeEntry;
      }
    } else {
      recipeVariants = [recipeEntry];
    }

    // Try to craft with the recipe variant(s)
    for (const recipe of recipeVariants) {
      if (!recipe) continue;
      // Create a backup of the components data source
      const backupComponents = { ...this.componentsDataSource };
      if (
        await this.tryCraftWithRecipe(
          server,
          client,
          recipe,
          baseRecipeId,
          recipeCount
        )
      ) {
        return true;
      }
      // Restore backup if this variant failed
      this.componentsDataSource = backupComponents;
    }
    return false;
  }

  /**
   * Attempts to craft using a specific recipe variant.
   */
  private async tryCraftWithRecipe(
    server: ZoneServer2016,
    client: Client,
    recipe: Recipe,
    recipeId: number,
    recipeCount: number
  ): Promise<boolean> {
    const bundleCount = recipe.bundleCount || 1;
    const craftCount = recipeCount * bundleCount;
    const rewardItemId = recipe.rewardId || recipeId; // fallback to recipeId if rewardId not defined

    switch (recipe.filterId) {
      case FilterIds.COOKING:
      case FilterIds.FURNACE:
        server.sendAlert(
          client,
          "This recipe requires a furnace, barbeque, or campfire to craft"
        );
        return false;
    }
    if (recipe.requireWorkbench) {
      if (
        !checkConstructionInRange(
          server._constructionSimple,
          client.character.state.position,
          3,
          Items.WORKBENCH
        ) &&
        !checkConstructionInRange(
          server._worldSimpleConstruction,
          client.character.state.position,
          3,
          Items.WORKBENCH
        )
      ) {
        server.sendAlert(
          client,
          "You must be near a workbench to complete this recipe"
        );
        return false;
      }
    }
    if (recipe.requireWeaponWorkbench) {
      if (
        !checkConstructionInRange(
          server._constructionSimple,
          client.character.state.position,
          3,
          Items.WORKBENCH_WEAPON
        ) &&
        !checkConstructionInRange(
          server._worldSimpleConstruction,
          client.character.state.position,
          3,
          Items.WORKBENCH_WEAPON
        )
      ) {
        server.sendAlert(
          client,
          "You must be near a weapon workbench to complete this recipe"
        );
        return false;
      }
    }

    if (
      !(await this.generateCraftQueue(
        server,
        client,
        recipe,
        recipeCount,
        rewardItemId,
        craftCount
      ))
    ) {
      return false;
    }

    //#region CRAFTING
    await server.pUtilizeHudTimer(
      client,
      server.getItemDefinition(rewardItemId)?.NAME_ID ?? 0,
      1000 * recipeCount,
      0
    );
    const removedItems: RemovedItem[] = [];
    let craftSuccess = true;
    for (const component of recipe.components) {
      const inventory = this.getInventoryDataSource(client.character);
      const proximityItems = server.getCraftingProximityItems(client) as {
        items: any[];
      };
      if (proximityItems?.items) {
        const character = client.character;
        proximityItems.items.forEach((item) => {
          if (!inventory[item.itemDefinitionId]) {
            inventory[item.itemDefinitionId] = [
              {
                item: {
                  ...item.itemData,
                  stackCount: item?.itemData?.count ?? 0
                },
                character
              }
            ];
          } else if (inventory[item.itemDefinitionId]) {
            inventory[item.itemDefinitionId].push({
              item: {
                ...item.itemData,
                stackCount: item?.itemData?.count ?? 0
              },
              character
            });
          }
        });
      }
      let remainingItems = component.requiredAmount * recipeCount,
        stackCount = 0;
      if (!inventory[component.itemDefinitionId]) {
        server.containerError(client, ContainerErrors.NO_ITEM_IN_SLOT);
        craftSuccess = false;
        break;
      }
      for (const itemDS of inventory[component.itemDefinitionId]) {
        stackCount += itemDS.item.stackCount;
      }
      if (remainingItems > stackCount) {
        server.containerError(client, ContainerErrors.NO_ITEM_IN_SLOT);
        craftSuccess = false;
        break;
      }
      for (const itemDS of inventory[component.itemDefinitionId]) {
        if (itemDS.item.stackCount >= remainingItems) {
          if (
            !(await this.removeCraftComponent(server, itemDS, remainingItems))
          ) {
            server.containerError(client, ContainerErrors.NO_ITEM_IN_SLOT);
            craftSuccess = false; // return if not enough items
            break;
          }
          removedItems.push({
            itemDS,
            count: Math.min(itemDS.item.stackCount, remainingItems)
          });
          remainingItems = 0;
        } else {
          if (
            await this.removeCraftComponent(
              server,
              itemDS,
              itemDS.item.stackCount
            )
          ) {
            removedItems.push({
              itemDS,
              count: Math.min(itemDS.item.stackCount, remainingItems)
            });
            remainingItems -= itemDS.item.stackCount;
          } else {
            server.containerError(client, ContainerErrors.NO_ITEM_IN_SLOT);
            craftSuccess = false; // return if not enough items
            break;
          }
        }
        if (!remainingItems) break;
      }
    }

    if (!craftSuccess) {
      await this.restoreRemovedItems(server, client, removedItems);
      return false;
    }

    client.character.lootItem(
      server,
      server.generateItem(rewardItemId, craftCount, true)
    );
    if (recipe.leftOverItems) {
      recipe.leftOverItems.forEach((id: number) => {
        client.character.lootItem(server, server.generateItem(id, 1));
      });
    }
    switch (rewardItemId) {
      case Items.IED:
        server.challengeManager.registerChallengeProgression(
          client,
          ChallengeType.IED,
          1
        );
        break;

      case Items.FOUNDATION:
        server.challengeManager.registerChallengeProgression(
          client,
          ChallengeType.MY_LAND,
          1
        );
        break;

      case Items.SHACK:
        server.challengeManager.registerChallengeProgression(
          client,
          ChallengeType.MY_HOME,
          1
        );
        break;
    }

    return true;
    //#endregion
  }

  async start(
    client: Client,
    server: ZoneServer2016,
    recipeId: number,
    count: number
  ) {
    for (let i = 0; i < count; i++) {
      if (!(await this.craftItem(server, client, recipeId, 1))) return;
    }
  }
}
