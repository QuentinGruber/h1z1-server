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

import { inventoryItem } from "../../../types/zoneserver";
import { ZoneServer2016 } from "../zoneserver";
import { ZoneClient2016 as Client } from "./zoneclient";
const debug = require("debug")("ZoneServer");
import { promisify } from "util";
const pSetImmediate = promisify(setImmediate);

interface componentItem {
  itemDefinitionId: number,
  stackCount: number
}

interface recipe {
  id: number,
  count: number
}

function getComponentsDataSource(client: Client): {
  [itemDefinitionId: number]: componentItem;
} {
  // todo: include other datasources when they are available ex. proximity items, accessed container
  const inventory: { [itemDefinitionId: number]: componentItem } = {};
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
  craftQueue: Array<recipe> = [];
  componentsDataSource: { [itemDefinitionId: number]: componentItem } = {};
  constructor(){}

  // used for removing items from internal recipe components data source (only for inventory rn)
  removeComponent(client: Client, itemDefinitionId: number, count: number = 1): boolean {
    const removeItem = this.componentsDataSource[itemDefinitionId];
    console.log("removeItem")
    console.log(removeItem);
    if (!removeItem) return false;
    if (removeItem.stackCount == count) {
      delete this.componentsDataSource[itemDefinitionId];
    } else if (removeItem.stackCount > count) {
      removeItem.stackCount -= count;
    } else {
      // if count > removeItem.stackCount
      return false;
    }
    return true;
  }

  /*async*/ generateQueue(server: ZoneServer2016, client: Client, recipeId: number, count: number): /*Promise<*/boolean/*>*/ {
    console.log(`[CraftManager] Generating craft queue for recipeId ${recipeId}`)
    const recipe = server._recipes[recipeId];
    for(const component of recipe.components) {
      if (
        !Object.keys(this.componentsDataSource).includes(component.itemDefinitionId.toString())
      ) {
        if (!server._recipes[component.itemDefinitionId]) {
          return false; // no valid recipe to craft component
        }
        // if inventory doesn't have component but has materials for it
        for(let i = 0; i < count; i++) {
          /*await*/ pSetImmediate();
          if (
            !this.generateQueue(server, client, component.itemDefinitionId, component.requiredAmount)
          ) {
            console.log("Craftitem error");
            return false; // craftItem returned some error
          }
        }
      }
      let remainingItems = component.requiredAmount * count;
      const item = this.componentsDataSource[component.itemDefinitionId];
      if(!item) {
        console.log("!item")
        return false;
      }
      if (
        !this.removeComponent(
          client, 
          component.itemDefinitionId, 
          item.stackCount >= remainingItems?remainingItems:item.stackCount)
      ) {
        console.log("removecomponent 1");
        return false; // return if not enough items
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
    }
    this.craftQueue.push({id: recipeId, count: count});
    console.log("true1")
    return true;
  }

  /*async*/ start(client: Client, server: ZoneServer2016, recipeId: number, count: number) {
    this.componentsDataSource = getComponentsDataSource(client);
    for(let i = 0; i < count; i++) {
      /*await*/ this.generateQueue(server, client, recipeId, 1);
    }
    debug(`[CraftManager] Craft queue:`);
    console.log(this.craftQueue);
    console.log("craft start");
    this.craftQueue.forEach((recipe) => {
      server.lootItem(client, server.generateItem(recipe.id), recipe.count)
    })
  }
}
