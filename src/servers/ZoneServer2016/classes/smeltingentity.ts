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

import { Items, FilterIds } from "../models/enums";
import { RecipeComponent } from "types/zoneserver";
import { smeltingData } from "../data/Recipes";
import { ZoneServer2016 } from "../zoneserver";
import { LootableConstructionEntity } from "./lootableconstructionentity";
import { BaseItem } from "./baseItem";
import { lootableContainerDefaultLoadouts } from "../data/loadouts";
import { BaseEntity } from "./baseentity";

function getAllowedFuel(itemDefinitionId: number): number[] {
  switch (itemDefinitionId) {
    case Items.FURNACE:
      return [Items.WOOD_LOG, Items.WOOD_PLANK, Items.CHARCOAL];
    case Items.BARBEQUE:
      return [Items.WOOD_STICK, Items.WOOD_PLANK, Items.CHARCOAL];
    case Items.CAMPFIRE:
      return [
        Items.WOOD_LOG,
        Items.WOOD_PLANK,
        Items.WOOD_STICK,
        Items.CHARCOAL,
      ];
    default:
      return [Items.WOOD_LOG, Items.WOOD_PLANK, Items.CHARCOAL];
  }
}

function getBurningTime(itemDefinitionId: number): number {
  switch (itemDefinitionId) {
    case Items.WOOD_LOG:
      return 120000;
    case Items.CHARCOAL:
      return 180000;
    case Items.WOOD_PLANK:
      return 60000;
    case Items.WOOD_STICK:
      return 30000;
    default:
      return 30000;
  }
}

function getSmeltingEntityData(
  entity: LootableConstructionEntity,
  child: smeltingEntity
) {
  switch (entity.itemDefinitionId) {
    case Items.FURNACE:
      child.filterId = FilterIds.FURNACE;
      entity.defaultLoadout = lootableContainerDefaultLoadouts.furnace;
      child.smeltingEffect = 5028;
      break;
    case Items.CAMPFIRE:
      child.filterId = FilterIds.COOKING;
      entity.defaultLoadout = lootableContainerDefaultLoadouts.campfire;
      child.smeltingEffect = 1207;
      break;
    case Items.BARBEQUE:
      child.filterId = FilterIds.COOKING;
      entity.defaultLoadout = lootableContainerDefaultLoadouts.barbeque;
      child.smeltingEffect = 5044;
      break;
    default:
      child.filterId = FilterIds.FURNACE;
      entity.defaultLoadout = lootableContainerDefaultLoadouts.furnace;
      child.smeltingEffect = 5028;
      break;
  }
}

export class smeltingEntity {
  parentObject: LootableConstructionEntity;
  allowedFuel: number[];
  filterId: number = FilterIds.FURNACE;
  smeltingEffect: number = 5028;
  isBurning: boolean = false;
  isSmelting: boolean = false;
  smeltingTime: number = 60000;
  dictionary: {[characterId: string]: BaseEntity};
  constructor(
    parentObject: LootableConstructionEntity,
    server: ZoneServer2016
  ) {
    this.parentObject = parentObject;
    this.allowedFuel = getAllowedFuel(parentObject.itemDefinitionId);
    getSmeltingEntityData(parentObject, this);
    if (!parentObject.getParent(server)) {
      this.dictionary = server._worldLootableConstruction;
    } else this.dictionary = server._lootableConstruction;
  }

  startBurning(
    server: ZoneServer2016,
    parentObject: LootableConstructionEntity
  ) {
    const container = parentObject.getContainer();
    if (!container) return;
    if (JSON.stringify(container.items) === "{}") {
      if (this.isBurning) {
        server.sendDataToAllWithSpawnedEntity(
          this.dictionary,
          parentObject.characterId,
          "Command.PlayDialogEffect",
          {
            characterId: parentObject.characterId,
            effectId: 0,
          }
        );
        this.isBurning = false;
      }
      return;
    }
    let allowBurn = false;
    Object.values(container.items).forEach((item: BaseItem) => {
      if (allowBurn) return;
      if (this.allowedFuel.includes(item.itemDefinitionId)) {
        server.removeContainerItemNoClient(item, parentObject, 1);
        if (item.itemDefinitionId == Items.WOOD_LOG) {
          // give charcoal if wood log was burned
          server.addContainerItemExternal(
            parentObject.mountedCharacter ? parentObject.mountedCharacter : "",
            server.generateItem(Items.CHARCOAL),
            container,
            1
          );
        }
        if (!this.isBurning) {
          server.sendDataToAllWithSpawnedEntity(
            this.dictionary,
            parentObject.characterId,
            "Command.PlayDialogEffect",
            {
              characterId: parentObject.characterId,
              effectId: this.smeltingEffect,
            }
          );
        }
        this.isBurning = true;
        allowBurn = true;
        setTimeout(() => {
          if (!this.isSmelting) {
            this.startSmelting(server, parentObject);
          }
        }, this.smeltingTime);
        setTimeout(() => {
          this.startBurning(server, parentObject);
        }, getBurningTime(item.itemDefinitionId));
        return;
      }
    });
    if (allowBurn) return;
    this.isBurning = false;
    server.sendDataToAllWithSpawnedEntity(
      this.dictionary,
      parentObject.characterId,
      "Command.PlayDialogEffect",
      {
        characterId: parentObject.characterId,
        effectId: 0,
      }
    );
  }

  startSmelting(
    server: ZoneServer2016,
    parentObject: LootableConstructionEntity
  ) {
    if (!this.isBurning) {
      this.isSmelting = false;
      return;
    }
    const container = parentObject.getContainer();
    if (!container) return;
    if (JSON.stringify(container.items) === "{}") return;
    this.isSmelting = true;
    let passed = false;
    Object.keys(smeltingData).forEach((data: string) => {
      if (passed) return;
      const recipe = smeltingData[Number(data)];
      if (recipe.filterId == this.filterId) {
        const fulfilledComponents: RecipeComponent[] = [];
        const itemsToRemove: { item: BaseItem; count: number }[] = [];
        recipe.components.forEach((component: RecipeComponent) => {
          if (passed) return;
          let requiredAmount = component.requiredAmount;
          Object.values(container.items).forEach((item: BaseItem) => {
            if (passed) return;
            if (!fulfilledComponents.includes(component)) {
              if (component.itemDefinitionId == item.itemDefinitionId) {
                if (requiredAmount > item.stackCount) {
                  requiredAmount -= item.stackCount;
                  itemsToRemove.push({ item: item, count: item.stackCount });
                } else {
                  fulfilledComponents.push(component);
                  itemsToRemove.push({ item: item, count: requiredAmount });
                }
                if (fulfilledComponents.length == recipe.components.length) {
                  itemsToRemove.forEach(
                    (item: { item: BaseItem; count: number }) => {
                      server.removeContainerItemNoClient(
                        item.item,
                        parentObject,
                        item.count
                      );
                    }
                  );
                  passed = true;
                  server.addContainerItemExternal(
                    parentObject.mountedCharacter
                      ? parentObject.mountedCharacter
                      : "",
                    server.generateItem(recipe.rewardId),
                    container,
                    1
                  );
                  return;
                }
              }
            }
          });
        });
      }
    });
    setTimeout(() => {
      this.startSmelting(server, parentObject);
    }, this.smeltingTime);
  }
}
