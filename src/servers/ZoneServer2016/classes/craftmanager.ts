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

export class CraftManager {
  craftQueue: Array<{id: number, count: number}> = [];
  componentsDataSource: { [itemDefinitionId: number]: inventoryItem[] } = {};
  constructor(client: Client, server: ZoneServer2016, recipeId: number, count: number){
        
    // todo: include other datasources when they are available ex. proximity items, accessed container
    this.componentsDataSource = server.getInventoryAsContainer(client);
    this.generateQueue(server, client, recipeId, count);
    debug(`[CraftManager] Craft queue:`);
    console.log(this.craftQueue);
  }

  // used for removing items from internal recipe components data source (only for inventory rn)
  removeComponent(client: Client, itemDefinitionId: number, index: number, count: number = 1): boolean {
    const removeItem = this.componentsDataSource[itemDefinitionId][index];
    console.log("removeItem")
    console.log(removeItem);
    if (!removeItem) return false;
    if (removeItem.stackCount == count) {
      delete this.componentsDataSource[itemDefinitionId][index];
    } else if (removeItem.stackCount > count) {
      removeItem.stackCount -= count;
    } else {
      // if count > removeItem.stackCount
      return false;
    }
    return true;
  }

  generateQueue(server: ZoneServer2016, client: Client, recipeId: number, count: number): boolean {
    debug(`[CraftManager] Generating craft queue for recipeId ${recipeId}`)
    const recipe = server._recipes[recipeId];
    for (const component of recipe.components) {
      if (
        !Object.keys(this.componentsDataSource).includes(component.itemDefinitionId.toString())
      ) {
        if (!server._recipes[component.itemDefinitionId]) {
          return false; // no valid recipe to craft component
        }
        // if inventory doesn't have component but has materials for it
        for(let i = 0; i < count; i++) {
          if (
            !this.generateQueue(server, client, component.itemDefinitionId, component.requiredAmount)
          ) {
            console.log("Craftitem error");
            return false; // craftItem returned some error
          }
        }
      }
      let remainingItems = component.requiredAmount * count;
      this.componentsDataSource[component.itemDefinitionId]?.forEach((item, index) => {
        if (item.stackCount >= remainingItems) {
          if (!this.removeComponent(client, component.itemDefinitionId, index, remainingItems)) {
            console.log("removecomponent 1");
            return false; // return if not enough items
          }
        } else {
          if (!this.removeComponent(client, component.itemDefinitionId, index, item.stackCount)) {
            console.log("removecomponent 2");
            return false; // return if not enough items
          }
        }
        this.craftQueue.push({id: recipeId, count: count});
        // push dummy item
        if(this.componentsDataSource[recipeId]) {
          this.componentsDataSource[recipeId].push({
            itemDefinitionId: recipeId,
            itemGuid: "0x0000000000000000",
            slotId: 0,
            containerGuid: "0x0000000000000000",
            currentDurability: 0,
            stackCount: count
          })
        }
        else {
          this.componentsDataSource[recipeId] = [{
            itemDefinitionId: recipeId,
            itemGuid: "0x0000000000000000",
            slotId: 0,
            containerGuid: "0x0000000000000000",
            currentDurability: 0,
            stackCount: count
          }]
        }
        console.log("true")
        return true;
      });
    }
    console.log("true1")
    return true;
  }

  start() {

  }
}
