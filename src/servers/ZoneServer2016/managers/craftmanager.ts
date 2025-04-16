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

import { ContainerErrors, FilterIds, Items } from "../models/enums";
import { ZoneServer2016 } from "../zoneserver";
import { ZoneClient2016 as Client } from "../classes/zoneclient";
import { checkConstructionInRange } from "../../../utils/utils";
import { Recipe } from "types/zoneserver";
import { Character2016 } from "../entities/character";
import { BaseItem } from "../classes/baseItem";
import { BaseLootableEntity } from "../entities/baselootableentity";
import { ChallengeType } from "./challengemanager";
const debug = require("debug")("ZoneServer");

interface CraftComponentDSEntry {
  itemDefinitionId: number;
  stackCount: number;
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
          ...item,
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
  removeCraftComponent(
    server: ZoneServer2016,
    itemDS: ItemDataSource,
    count: number
  ): boolean {
    return (
      server.removeInventoryItem(itemDS.character, itemDS.item, count) ||
      server.deleteEntity(
        (itemDS.item as any).associatedCharacterGuid,
        server._spawnedItems
      )
    );
  }

  /**
   * Generates the craft queue based on the recipe and its components.
   * @param server The ZoneServer2016 instance.
   * @param client The client performing the craft.
   * @param recipe The recipe object.
   * @param recipeCount The number of times to repeat the recipe.
   * @param recipeId The ID of the recipe being crafted.
   * @param craftCount The total number of items to craft.
   * @returns A promise resolving to a boolean indicating if the craft queue generation was successful.
   */
  async generateCraftQueue(
    server: ZoneServer2016,
    client: Client,
    recipe: Recipe,
    recipeCount: number,
    recipeId: number,
    craftCount: number
  ): Promise<boolean> {
    for (const component of recipe.components) {
      const remainingItems = component.requiredAmount * recipeCount;
      // if component isn't found at all
      if (!this.componentsDataSource[component.itemDefinitionId]) {
        const componentRecipe =
            client.character.recipes[component.itemDefinitionId],
          componentBundleCount = componentRecipe?.bundleCount || 1;
        if (!componentRecipe) {
          debug(
            `[CraftManager] ${client.character.name} tried to craft an invalid recipe ${component.itemDefinitionId}!`
          );
          return false; // no valid recipe to craft component
        }

        if (component.requiredAmount / componentBundleCount < 1) {
          if (
            !(await this.craftItem(
              server,
              client,
              component.itemDefinitionId,
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
                component.itemDefinitionId,
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
        const componentRecipe =
            client.character.recipes[component.itemDefinitionId],
          componentBundleCount = componentRecipe?.bundleCount || 1;
        if (!componentRecipe) {
          debug(
            `[CraftManager] ${client.character.name} tried to craft an invalid recipe ${component.itemDefinitionId}!`
          );
          return false; // no valid recipe to craft component
        }
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
            !(await this.craftItem(
              server,
              client,
              component.itemDefinitionId,
              craft
            ))
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
                component.itemDefinitionId,
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
    // push dummy item
    if (this.componentsDataSource[recipeId]) {
      this.componentsDataSource[recipeId].stackCount += craftCount;
    } else {
      this.componentsDataSource[recipeId] = {
        itemDefinitionId: recipeId,
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
    const recipe = client.character.recipes[recipeId],
      bundleCount = recipe?.bundleCount || 1, // the amount of an item crafted from 1 recipe (ex. crafting 1 stick recipe gives you 2)
      craftCount = recipeCount * bundleCount; // the actual amount of items to craft
    if (!recipe) return false;
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
        recipeId,
        craftCount
      ))
    ) {
      return false;
    }

    //#region CRAFTING
    await server.pUtilizeHudTimer(
      client,
      server.getItemDefinition(recipeId)?.NAME_ID ?? 0,
      1000 * recipeCount,
      0
    );
    const r = client.character.recipes[recipeId];
    for (const component of r.components) {
      const inventory = this.getInventoryDataSource(client.character);
      const proximityItems = server.getProximityItems(client) as {
        items: any[];
      };
      if (proximityItems?.items) {
        const character = client.character;
        proximityItems.items.forEach((item) => {
          if (inventory[item.itemDefinitionId]) {
            inventory[item.itemDefinitionId].push({ item, character });
          } else {
            inventory[item.itemDefinitionId] = [{ item, character }];
          }
        });
      }
      let remainingItems = component.requiredAmount * recipeCount,
        stackCount = 0;
      if (!inventory[component.itemDefinitionId]) {
        server.containerError(client, ContainerErrors.NO_ITEM_IN_SLOT);
        return false;
      }
      for (const itemDS of inventory[component.itemDefinitionId]) {
        stackCount += itemDS.item.stackCount;
      }
      if (remainingItems > stackCount) {
        server.containerError(client, ContainerErrors.NO_ITEM_IN_SLOT);
        return false;
      }
      for (const itemDS of inventory[component.itemDefinitionId]) {
        if (itemDS.item.stackCount >= remainingItems) {
          if (!this.removeCraftComponent(server, itemDS, remainingItems)) {
            server.containerError(client, ContainerErrors.NO_ITEM_IN_SLOT);
            return false; // return if not enough items
          }
          remainingItems = 0;
        } else {
          if (
            this.removeCraftComponent(server, itemDS, itemDS.item.stackCount)
          ) {
            remainingItems -= itemDS.item.stackCount;
          } else {
            server.containerError(client, ContainerErrors.NO_ITEM_IN_SLOT);
            return false; // return if not enough items
          }
        }
        if (!remainingItems) break;
      }
    }
    client.character.lootItem(
      server,
      server.generateItem(recipeId, craftCount, true)
    );
    if (recipe.leftOverItems) {
      recipe.leftOverItems.forEach((id: number) => {
        client.character.lootItem(server, server.generateItem(id, 1));
      });
    }
    switch (recipeId) {
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
