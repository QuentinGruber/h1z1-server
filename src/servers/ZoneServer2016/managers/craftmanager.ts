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

import { ContainerErrors, FilterIds, Items } from "../models/enums";
import { ZoneServer2016 } from "../zoneserver";
import { ZoneClient2016 as Client } from "../classes/zoneclient";
import { checkConstructionInRange } from "../../../utils/utils";
const debug = require("debug")("ZoneServer");

interface craftComponentDSEntry {
  itemDefinitionId: number;
  stackCount: number;
}

function getCraftComponentsDataSource(client: Client): {
  [itemDefinitionId: number]: craftComponentDSEntry;
} {
  // todo: include other datasources when they are available ex. proximity items, accessed container
  const inventory: { [itemDefinitionId: number]: craftComponentDSEntry } = {};
  Object.keys(client.character._containers).forEach((loadoutSlotId) => {
    const container = client.character._containers[Number(loadoutSlotId)];
    Object.keys(container.items).forEach((itemGuid) => {
      const item = container.items[itemGuid];
      if (inventory[item.itemDefinitionId]) {
        inventory[item.itemDefinitionId].stackCount += item.stackCount;
      } else {
        inventory[item.itemDefinitionId] = {
          ...item,
          stackCount: item.stackCount
        }; // push new itemstack
      }
    });
  });
  return inventory;
}

export class CraftManager {
  private craftLoopCount: number = 0;
  private maxCraftLoopCount: number = 500;
  private componentsDataSource: {
    [itemDefinitionId: number]: craftComponentDSEntry;
  } = {};
  constructor(
    client: Client,
    server: ZoneServer2016,
    recipeId: number,
    count: number
  ) {
    this.componentsDataSource = getCraftComponentsDataSource(client);
    this.start(client, server, recipeId, count);
  }

  // used for removing items from internal recipe components data source (only for inventory rn)
  removeCraftComponent(itemDefinitionId: number, count: number): boolean {
    const removeItem = this.componentsDataSource[itemDefinitionId];
    if (!removeItem) return false;
    if (removeItem.stackCount == count) {
      delete this.componentsDataSource[itemDefinitionId];
    } else if (removeItem.stackCount > count) {
      this.componentsDataSource[itemDefinitionId].stackCount -= count;
    } else {
      // if count > removeItem.stackCount
      return false;
    }
    return true;
  }

  async craftItem(
    server: ZoneServer2016,
    client: Client,
    recipeId: number,
    recipeCount: number
  ): Promise<boolean> {
    // if craftItem gets stuck in an infinite loop somehow, setImmediate will prevent the server from crashing
    // Scheduler.yield(); well this is not a good idea, it will make the server being overloaded, while an infinite loop will be detected and the server will be restarted

    //#region GENERATE CRAFT QUEUE
    if (!recipeCount) return true;
    this.craftLoopCount++;
    if (this.craftLoopCount > this.maxCraftLoopCount) {
      return false;
    }
    debug(`[CraftManager] Crafting ${recipeCount} of recipe ${recipeId}`);
    const recipe = server._recipes[recipeId],
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
    for (const component of recipe.components) {
      const remainingItems = component.requiredAmount * recipeCount;
      // if component isn't found at all
      if (!this.componentsDataSource[component.itemDefinitionId]) {
        const componentRecipe = server._recipes[component.itemDefinitionId],
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
        const componentRecipe = server._recipes[component.itemDefinitionId],
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
        !this.removeCraftComponent(component.itemDefinitionId, remainingItems)
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
    //#endregion

    //#region CRAFTING
    await server.pUtilizeHudTimer(
      client,
      server.getItemDefinition(recipeId).NAME_ID,
      1000 * recipeCount
    );
    const r = server._recipes[recipeId];
    for (const component of r.components) {
      const inventory = client.character.getInventoryAsContainer();
      let remainingItems = component.requiredAmount * recipeCount,
        stackCount = 0;
      if (!inventory[component.itemDefinitionId]) {
        server.containerError(client, ContainerErrors.NO_ITEM_IN_SLOT);
        return false;
      }
      for (const item of inventory[component.itemDefinitionId]) {
        stackCount += item.stackCount;
      }
      if (remainingItems > stackCount) {
        server.containerError(client, ContainerErrors.NO_ITEM_IN_SLOT);
        return false;
      }
      for (const item of inventory[component.itemDefinitionId]) {
        if (item.stackCount >= remainingItems) {
          if (
            !server.removeInventoryItem(client.character, item, remainingItems)
          ) {
            server.containerError(client, ContainerErrors.NO_ITEM_IN_SLOT);
            return false; // return if not enough items
          }
          remainingItems = 0;
        } else {
          if (
            server.removeInventoryItem(client.character, item, item.stackCount)
          ) {
            remainingItems -= item.stackCount;
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
      server.generateItem(recipeId, craftCount)
    );
    if (recipe.leftOverItems) {
      recipe.leftOverItems.forEach((id: number) => {
        client.character.lootItem(server, server.generateItem(id, 1));
      });
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
