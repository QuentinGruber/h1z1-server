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

import { ZoneServer2016 } from "../zoneserver";
import { ZoneClient2016 as Client } from "./zoneclient";
const debug = require("debug")("ZoneServer");

interface craftComponentDSEntry {
  itemDefinitionId: number,
  stackCount: number
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
      if(inventory[item.itemDefinitionId]) {
        inventory[item.itemDefinitionId].stackCount += item.stackCount;
      }
      else {
        inventory[item.itemDefinitionId] = { ...item }; // push new itemstack
      }
    });
  });
  return inventory;
}

export class CraftManager {
  componentsDataSource: { [itemDefinitionId: number]: craftComponentDSEntry } = {};
  constructor(client: Client, server: ZoneServer2016, recipeId: number, count: number) {
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
    } else { // if count > removeItem.stackCount
      return false;
    }
    return true;
  }

  async craftItem(server: ZoneServer2016, client: Client, recipeId: number, count: number): Promise<boolean> {
    // if craftItem gets stuck in an infinite loop somehow, setImmediate will prevent the server from crashing
    server.pSetImmediate();
    if(!count) return true;
    debug(`[CraftManager] Crafting ${count} of itemDefinitionId ${recipeId}`);
    const recipe = server._recipes[recipeId];
    if(!recipe) return false;
    for(const component of recipe.components) {
      const remainingItems = component.requiredAmount * count;
      if (!this.componentsDataSource[component.itemDefinitionId]) {
        if (!server._recipes[component.itemDefinitionId]) {
          return false; // no valid recipe to craft component
        }
        // if inventory doesn't have component but has materials for it
        for(let i = 0; i < count; i++) {
          if (
            !await this.craftItem(server, client, component.itemDefinitionId, component.requiredAmount)
          ) {
            return false; // craftItem returned some error
          }
        }
      }
      else if (this.componentsDataSource[component.itemDefinitionId].stackCount < remainingItems){
        if (!server._recipes[component.itemDefinitionId]) {
          return false; // no valid recipe to craft component
        }
        let stackCount = this.componentsDataSource[component.itemDefinitionId].stackCount;
        // if inventory has some of component but not enough
        for(let i = 0; i < count; i++) {
          let craftAmount = 0; // amount that needs crafted per recipe iteration
          if(stackCount >= component.requiredAmount) { // use some of stack and don't craft any component through one recipe iteration
            stackCount -= component.requiredAmount;
          }
          else { // use all of stack if required component amount is greater than stackCount
            craftAmount = component.requiredAmount - stackCount;
            stackCount = 0;
          }
          if (
            !await this.craftItem(server, client, component.itemDefinitionId, craftAmount)
          ) {
            return false; // craftItem returned some error
          }
        }
      }
      
      if(!this.removeCraftComponent(component.itemDefinitionId, remainingItems)) {
        return false;
      }
    }
    // push dummy item
    if(this.componentsDataSource[recipeId]) {
      this.componentsDataSource[recipeId].stackCount += count;
    }
    else {
      this.componentsDataSource[recipeId] = {
        itemDefinitionId: recipeId,
        stackCount: count
      }
    }

    await server.pUtilizeHudTimer(client, server.getItemDefinition(recipeId).NAME_ID, 1000 * count);
    const r = server._recipes[recipeId];
    for (const component of r.components) {
      let inventory = server.getInventoryAsContainer(client),
      remainingItems = component.requiredAmount * count;
      if(!inventory[component.itemDefinitionId]) return false;
      for(const item of inventory[component.itemDefinitionId]) {
        if (item.stackCount >= remainingItems) {
          if (!server.removeInventoryItem(client, item.itemGuid, remainingItems)) {
            return false; // return if not enough items
          }
        } else {
          if (server.removeInventoryItem(client, item.itemGuid, item.stackCount)) {
            remainingItems -= item.stackCount;
          } else {
            return false; // return if not enough items
          }
        }
      };
    }
    server.lootItem(client, server.generateItem(recipeId), count);
    return true;
  }

  async start(client: Client, server: ZoneServer2016, recipeId: number, count: number) {
    for(let i = 0; i < count; i++) {
      if(!await this.craftItem(server, client, recipeId, 1)) return;
    }
  }
}
