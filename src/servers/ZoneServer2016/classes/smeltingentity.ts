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

import {
  ConstructionPermissionIds,
  Items,
  ResourceIds,
  StringIds,
  FilterIds,
} from "../models/enums";
import { RecipeComponent } from "types/zoneserver";
import { smeltingData } from "../data/Recipes";
import { ZoneServer2016 } from "../zoneserver";
import { LootableConstructionEntity } from "./lootableconstructionentity";
import { ConstructionChildEntity } from "./constructionchildentity";
import { ConstructionParentEntity } from "./constructionparententity";
import { ZoneClient2016 } from "./zoneclient";
import { BaseItem } from "./baseItem";

function getAllowedFuel(itemDefinitionId: number): number[] {
  switch (itemDefinitionId) {
    case Items.FURNACE:
      return [Items.WOOD_LOG, Items.WOOD_PLANK, Items.CHARCOAL];
    case Items.BARBEQUE:
      return [Items.WOOD_STICK, Items.WOOD_PLANK];
    case Items.CAMPFIRE:
      return [Items.WOOD_LOG, Items.WOOD_PLANK, Items.WOOD_STICK];
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

function getSmeltingEntityData(entity: smeltingEntity) {
  switch (entity.itemDefinitionId) {
    case Items.FURNACE:
      entity.filterId = FilterIds.FURNACE;
      entity.containerId = Items.CONTAINER_FURNACE;
      entity.smeltingEffect = 5028;
      break;
    case Items.CAMPFIRE:
      entity.filterId = FilterIds.COOKING;
      entity.containerId = Items.CONTAINER_CAMPFIRE;
      entity.smeltingEffect = 1207;
      break;
    case Items.BARBEQUE:
      entity.filterId = FilterIds.COOKING;
      entity.containerId = Items.CONTAINER_BARBEQUE;
      entity.smeltingEffect = 5044;
      break;
    default:
      entity.filterId = FilterIds.FURNACE;
      entity.containerId = Items.CONTAINER_FURNACE;
      entity.smeltingEffect = 5028;
      break;
  }
}

export class smeltingEntity extends LootableConstructionEntity {
  get health() {
    return this._resources[ResourceIds.CONSTRUCTION_CONDITION];
  }
  set health(health: number) {
    this._resources[ResourceIds.CONSTRUCTION_CONDITION] = health;
  }
  placementTime = Date.now();
  parentObjectCharacterId: string;
  npcRenderDistance = 15;
  loadoutId = 5;
  itemDefinitionId: number;
  containerId: number = Items.FURNACE;
  allowedFuel: number[];
  filterId: number = FilterIds.FURNACE;
  smeltingEffect: number = 5028;
  isBurning: boolean = false;
  isSmelting: boolean = false;
  smeltingTime: number = 60000;
  constructor(
    characterId: string,
    transientId: number,
    actorModelId: number,
    position: Float32Array,
    rotation: Float32Array,
    server: ZoneServer2016,
    itemDefinitionId: number,
    parentObjectCharacterId: string,
  ) {
    super(
      characterId,
      transientId,
      actorModelId,
      position,
      rotation,
      server,
      itemDefinitionId,
      parentObjectCharacterId,
    );
    this.parentObjectCharacterId = parentObjectCharacterId || "";
    this.itemDefinitionId = itemDefinitionId;
    this.allowedFuel = getAllowedFuel(this.itemDefinitionId);
    getSmeltingEntityData(this);
    this.equipItem(server, server.generateItem(this.containerId), false);
  }

  startBurning(server: ZoneServer2016) {
    if (!this._containers["31"]) return;
    if (JSON.stringify(this._containers["31"].items) === "{}") {
      if (this.isBurning) {
        server.sendDataToAllWithSpawnedEntity(
          server._lootableConstruction,
          this.characterId,
          "Command.PlayDialogEffect",
          {
            characterId: this.characterId,
            effectId: 0,
          }
        );
        this.isBurning = false;
      }
      return;
    }
    let allowBurn = false;
    Object.values(this._containers["31"].items).forEach((item: BaseItem) => {
      if (allowBurn) return;
      if (this.allowedFuel.includes(item.itemDefinitionId)) {
        server.removeContainerItemNoClient(item, this, 1);
        if (item.itemDefinitionId == Items.WOOD_LOG) {
          // give charcoal if wood log was burned
          server.addContainerItemExternal(
            this.mountedCharacter ? this.mountedCharacter : "",
            server.generateItem(Items.CHARCOAL),
            this._containers["31"],
            1
          );
        }
        if (!this.isBurning) {
          server.sendDataToAllWithSpawnedEntity(
            server._lootableConstruction,
            this.characterId,
            "Command.PlayDialogEffect",
            {
              characterId: this.characterId,
              effectId: this.smeltingEffect,
            }
          );
        }
        this.isBurning = true;
        allowBurn = true;
        setTimeout(() => {
          if (!this.isSmelting) {
            this.startSmelting(server);
          }
        }, this.smeltingTime);
        setTimeout(() => {
          this.startBurning(server);
        }, getBurningTime(item.itemDefinitionId));
        return;
      }
    });
    if (allowBurn) return;
    this.isBurning = false;
    server.sendDataToAllWithSpawnedEntity(
      server._lootableConstruction,
      this.characterId,
      "Command.PlayDialogEffect",
      {
        characterId: this.characterId,
        effectId: 0,
      }
    );
  }

  startSmelting(server: ZoneServer2016) {
    if (!this.isBurning) {
      this.isSmelting = false;
      return;
    }
    if (!this._containers["31"]) return;
    if (JSON.stringify(this._containers["31"].items) === "{}") return;
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
          Object.values(this._containers["31"].items).forEach(
            (item: BaseItem) => {
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
                          this,
                          item.count
                        );
                      }
                    );
                    passed = true;
                    server.addContainerItemExternal(
                      this.mountedCharacter ? this.mountedCharacter : "",
                      server.generateItem(recipe.rewardId),
                      this._containers["31"],
                      1
                    );
                    return;
                  }
                }
              }
            }
          );
        });
      }
    });
    setTimeout(() => {
      this.startSmelting(server);
    }, this.smeltingTime);
  }

  getParent(
    server: ZoneServer2016
  ): ConstructionParentEntity | ConstructionChildEntity | undefined {
    return super.getParent(server);
  }

  getParentFoundation(
    server: ZoneServer2016
  ): ConstructionParentEntity | undefined {
    return super.getParentFoundation(server);
  }

  canUndoPlacement(server: ZoneServer2016, client: ZoneClient2016) {
    return super.canUndoPlacement(server, client);
  }

  destroy(server: ZoneServer2016, destructTime = 0) {
    super.destroy(server, destructTime);
    // TODO: drop any items into a lootbag, need to take destructTime into account
  }

  getHasPermission(
    server: ZoneServer2016,
    characterId: string,
    permission: ConstructionPermissionIds
  ) {
    return super.getHasPermission(server, characterId, permission);
  }

  OnPlayerSelect(server: ZoneServer2016, client: ZoneClient2016) {
    super.OnPlayerSelect(server, client);
  }

  OnFullCharacterDataRequest(server: ZoneServer2016, client: ZoneClient2016) {
    if (!this.isBurning) return;
    server.sendData(client, "Command.PlayDialogEffect", {
      characterId: this.characterId,
      effectId: this.smeltingEffect,
    });
  }

  OnInteractionString(server: ZoneServer2016, client: ZoneClient2016) {
    if (this.canUndoPlacement(server, client)) {
      server.undoPlacementInteractionString(this, client);
      return;
    }
    server.sendData(client, "Command.InteractionString", {
      guid: this.characterId,
      stringId: StringIds.OPEN,
    });
  }
}
