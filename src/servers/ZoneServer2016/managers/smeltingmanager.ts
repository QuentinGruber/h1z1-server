// ======================================================================
//
//   GNU GENERAL PUBLIC LICENSE
//   Version 3, 29 June 2007
//   copyright (C) 2020 - 2021 Quentin Gruber
//   copyright (C) 2021 - 2024 H1emu community
//
//   https://github.com/QuentinGruber/h1z1-server
//   https://www.npmjs.com/package/h1z1-server
//
//   Based on https://github.com/psemu/soe-network
// ======================================================================

function getRewardId(itemDefinitionId: number): number | undefined {
  switch (itemDefinitionId) {
    case Items.DEW_COLLECTOR:
      return Items.WATER_STAGNANT;
    case Items.BEE_BOX:
      return Items.HONEY;
  }
  return;
}

import { ZoneServer2016 } from "../zoneserver";
import { Items } from "../models/enums";
import { RecipeComponent } from "types/zoneserver";
import { CollectingEntity } from "../classes/collectingentity";
import { SmeltingEntity } from "../classes/smeltingentity";
import { LootableConstructionEntity } from "../entities/lootableconstructionentity";
import { BaseItem } from "../classes/baseItem";
import { LoadoutContainer } from "../classes/loadoutcontainer";
import { smeltingData } from "../data/Recipes";
import { scheduler } from "timers/promises";
import { CharacterPlayWorldCompositeEffect } from "types/zone2016packets";

export class SmeltingManager {
  /** HashMap of all SmeltingEntities,
   * uses CharacterId (string) for indexing
   */
  _smeltingEntities: { [characterId: string]: string } = {};

  /** HashMap of all CollectingEntities,
   * uses CharacterId (string) for indexing
   */
  _collectingEntities: { [characterId: string]: string } = {};

  /** The time (milliseconds) it takes for a CollectingEntity to fill water/honey - 5 min x 4 ticks = 20 mins */
  collectingTickTime: number = 300000;

  /** The time (milliseconds) at which the most recent qualified item was "burned" */
  lastBurnTime: number = 0;

  /** The timer for checking all smeltable entities  */
  checkSmeltablesTimer?: NodeJS.Timeout;

  /** The timer to check for honeycomb inside of all collectable entities - 5 min x 72 ticks = 6 hours for honeycomb */
  checkCollectorsTimer?: NodeJS.Timeout;

  /** MANAGED BY CONFIGMANAGER - See defaultConfig.yaml for more information */
  /** The time (milliseconds) it takes for a fuel entity to burn - 2 minutes seconds by default */
  burnTime!: number;
  /** The time (milliseconds) it takes for a non-fuel entity to smelt - 7 seconds by default */
  smeltTime!: number;

  public clearTimers() {
    if (this.checkSmeltablesTimer) {
      clearTimeout(this.checkSmeltablesTimer);
    }
    if (this.checkCollectorsTimer) {
      clearTimeout(this.checkCollectorsTimer);
    }
  }

  public checkSmeltables(server: ZoneServer2016) {
    this.lastBurnTime = Date.now();
    for (const a in this._smeltingEntities) {
      const entity = this.getTrueEntity(server, this._smeltingEntities[a]);
      if (!entity) {
        delete this._smeltingEntities[a];
        continue;
      }
      const subEntity = entity.subEntity;
      if (!(subEntity instanceof SmeltingEntity)) continue;
      const container = entity.getContainer();
      if (!container) {
        delete this._smeltingEntities[a];
        continue;
      }
      const items = Object.values(container.items);
      //const dictionary = subEntity?.dictionary;
      if (items.length <= 0) {
        subEntity!.isWorking = false;
        this.extinguish(server, entity /*dictionary*/);
        continue;
      } else {
        if (!this.checkFuel(server, entity)) {
          this.extinguish(server, entity /*dictionary*/);
          continue;
        } else if (!subEntity!.isSmelting) {
          subEntity!.isSmelting = true;
          this.smelt(server, entity);
        }
      }
      server.sendDataToAllWithSpawnedEntity<CharacterPlayWorldCompositeEffect>(
        subEntity!.dictionary,
        entity.characterId,
        "Character.PlayWorldCompositeEffect",
        {
          characterId: entity.characterId,
          effectId: entity.subEntity!.workingEffect,
          position: entity.state.position,
          effectTime: Math.ceil(this.burnTime / 1000)
        }
      );
    }
    this.checkSmeltablesTimer = setTimeout(() => {
      this.checkSmeltables(server);
    }, this.burnTime);
  }

  public fillDewCollectors(server: ZoneServer2016) {
    for (const a in this._collectingEntities) {
      const entity = this.getTrueEntity(server, this._collectingEntities[a]);
      if (!entity) {
        delete this._smeltingEntities[a];
        continue;
      }
      const subEntity = entity.subEntity;
      if (!(subEntity instanceof CollectingEntity)) {
        delete this._smeltingEntities[a];
        continue;
      }
      const container = entity.getContainer();
      if (!container) {
        delete this._smeltingEntities[a];
        continue;
      }
      if (entity.itemDefinitionId === Items.DEW_COLLECTOR) {
        for (const a in container.items) {
          const item = container.items[a];
          if (item.itemDefinitionId != Items.WATER_EMPTY) continue;

          if (!server.removeContainerItem(entity, item, container, 1)) {
            return;
          }
          const reward = getRewardId(entity.itemDefinitionId);
          if (reward) {
            entity.lootContainerItem(
              server,
              server.generateItem(reward),
              1,
              false
            );
          }
        }
      }
    }
  }

  public checkCollectors(server: ZoneServer2016) {
    for (const a in this._collectingEntities) {
      const entity = this.getTrueEntity(server, this._collectingEntities[a]);
      if (!entity) {
        delete this._smeltingEntities[a];
        continue;
      }
      const subEntity = entity.subEntity;
      if (!(subEntity instanceof CollectingEntity)) {
        delete this._smeltingEntities[a];
        continue;
      }
      const container = entity.getContainer();
      if (!container) {
        delete this._smeltingEntities[a];
        continue;
      }
      switch (entity.itemDefinitionId) {
        case Items.BEE_BOX:
          this.checkCollector(server, entity, subEntity, container);
          this.checkHoneycomb(server, entity, subEntity, container);
          break;
        case Items.DEW_COLLECTOR:
          this.checkCollector(server, entity, subEntity, container);
          break;
        case Items.ANIMAL_TRAP:
          this.checkAnimalTrap(server, entity, subEntity, container);
          break;
      }
    }
    this.checkCollectorsTimer = setTimeout(() => {
      this.checkCollectors(server);
    }, this.collectingTickTime);
  }

  private getTrueEntity(
    server: ZoneServer2016,
    characterId: string
  ): LootableConstructionEntity | undefined {
    return (
      server._lootableConstruction[characterId] ||
      server._worldLootableConstruction[characterId] ||
      undefined
    );
  }

  private extinguish(
    server: ZoneServer2016,
    entity: LootableConstructionEntity
    //dictionary: any
  ) {
    delete this._smeltingEntities[entity.characterId];
    //this.sendWorkingEffect(server, 0, entity.characterId, dictionary);
    entity.subEntity!.isWorking = false;
  }

  /*private sendWorkingEffect(
    server: ZoneServer2016,
    effect: number,
    characterId: string,
    dictionary: any
  ) {
    server.sendDataToAllWithSpawnedEntity(
      dictionary,
      characterId,
      "Command.PlayDialogEffect",
      {
        characterId: characterId,
        effectId: effect,
      }
    );
  }*/

  private checkFuel(
    server: ZoneServer2016,
    entity: LootableConstructionEntity
  ): boolean | BaseItem {
    const container = entity.getContainer();
    for (const a in container!.items) {
      const item = container!.items[a];
      if (entity.subEntity!.allowedFuel.includes(item.itemDefinitionId)) {
        server.removeContainerItem(entity, item, entity.getContainer(), 1);
        if (item.itemDefinitionId == Items.WOOD_LOG) {
          // give charcoal if wood log was burned
          entity.lootContainerItem(
            server,
            server.generateItem(Items.CHARCOAL),
            1,
            false
          );
        }
        return true;
      }
    }
    return false;
  }

  private async smelt(
    server: ZoneServer2016,
    entity: LootableConstructionEntity
  ) {
    await scheduler.wait(this.smeltTime, {});
    if (!entity.subEntity?.isWorking) {
      entity.subEntity!.isSmelting = false;
      return;
    }
    const container = entity.getContainer();
    if (!container) return;
    if (!entity.subEntity) return;
    for (const a in smeltingData) {
      const recipe = smeltingData[a];
      if (recipe.filterId == entity.subEntity.filterId) {
        const fulfilledComponents: RecipeComponent[] = [];
        const itemsToRemove: { item: BaseItem; count: number }[] = [];
        for (const a in recipe.components) {
          const component = recipe.components[a];
          let requiredAmount = component.requiredAmount;
          for (const a in container.items) {
            const item = container.items[a];
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
                      server.removeContainerItem(
                        entity,
                        item.item,
                        entity.getContainer(),
                        item.count
                      );
                    }
                  );
                  entity.lootContainerItem(
                    server,
                    server.generateItem(recipe.rewardId),
                    1,
                    false
                  );
                  this.smelt(server, entity);
                  return;
                }
              }
            }
          }
        }
      }
    }
    this.smelt(server, entity);
    return;
  }

  private checkCollector(
    server: ZoneServer2016,
    entity: LootableConstructionEntity,
    subEntity: CollectingEntity,
    container: LoadoutContainer
  ) {
    for (const a in container.items) {
      const item = container.items[a];
      // check if the current item is an empty water bottle and that the container is either empty
      // or currently not containing honeycomb, in that case then exit the scope of the for loop
      if (entity.itemDefinitionId == Items.BEE_BOX) {
        if (
          item.itemDefinitionId == Items.WATER_EMPTY &&
          (Object.keys(container.items).length == 1 ||
            !Object.values(container.items).some(
              (item) => item.itemDefinitionId == Items.HONEYCOMB
            ))
        )
          continue;
      }
      if (item.itemDefinitionId != Items.WATER_EMPTY) continue;
      if (subEntity.currentTicks >= subEntity.requiredTicks) {
        subEntity.currentTicks = 0;
        if (!server.removeContainerItem(entity, item, container, 1)) {
          return;
        }
        const reward = getRewardId(entity.itemDefinitionId);
        if (reward) {
          if (reward == Items.HONEY) {
            if (item.stackCount >= 10) return;
            const honeycombItem = entity.getItemById(Items.HONEYCOMB);
            if (
              !honeycombItem ||
              !server.removeContainerItem(entity, honeycombItem, container, 1)
            ) {
              return;
            }
            entity.lootContainerItem(
              server,
              server.generateItem(Items.WAX),
              1,
              false
            );
            server.sendDataToAllWithSpawnedEntity(
              subEntity.dictionary,
              entity.characterId,
              "Command.PlayDialogEffect",
              {
                characterId: entity.characterId,
                effectId: subEntity.workingEffect
              }
            );
          }
          entity.lootContainerItem(
            server,
            server.generateItem(reward),
            1,
            false
          );
        }
        return;
      }
      subEntity.currentTicks++;
    }
  }

  private checkHoneycomb(
    server: ZoneServer2016,
    entity: LootableConstructionEntity,
    subEntity: CollectingEntity,
    container: LoadoutContainer
  ) {
    for (const a in container.items) {
      const item = container.items[a];
      if (item.itemDefinitionId == Items.HONEYCOMB) {
        if (item.stackCount >= 5) return;
        server.sendDataToAllWithSpawnedEntity<CharacterPlayWorldCompositeEffect>(
          subEntity!.dictionary,
          entity.characterId,
          "Character.PlayWorldCompositeEffect",
          {
            characterId: entity.characterId,
            effectId: entity.subEntity!.workingEffect,
            position: entity.state.position,
            effectTime: Math.ceil(this.collectingTickTime / 1000)
          }
        );
      }
    }

    if (subEntity.currentHoneycombTicks >= subEntity.requiredHoneycombTicks) {
      subEntity.currentHoneycombTicks = 0;

      server.sendDataToAllWithSpawnedEntity<CharacterPlayWorldCompositeEffect>(
        subEntity!.dictionary,
        entity.characterId,
        "Character.PlayWorldCompositeEffect",
        {
          characterId: entity.characterId,
          effectId: entity.subEntity!.workingEffect,
          position: entity.state.position,
          effectTime: Math.ceil(this.collectingTickTime / 1000)
        }
      );

      entity.lootContainerItem(
        server,
        server.generateItem(Items.HONEYCOMB),
        1,
        false
      );
      return;
    }
    subEntity.currentHoneycombTicks++;
  }

  private checkAnimalTrap(
    server: ZoneServer2016,
    entity: LootableConstructionEntity,
    subEntity: CollectingEntity,
    container: LoadoutContainer
  ) {
    const checkEmpty = Object.keys(container.items).length === 0;
    if (checkEmpty) {
      if (subEntity.wasUsed) {
        entity.destroy(server);
        return;
      }
      if (subEntity.currentTicks >= subEntity.requiredTicks) {
        subEntity.currentTicks = 0;
        entity.lootContainerItem(
          server,
          server.generateItem(Items.MEAT_RABBIT),
          1,
          false
        );
        entity.actorModelId = 35;
        server.sendDataToAllWithSpawnedEntity(
          subEntity.dictionary,
          entity.characterId,
          "Character.ReplaceBaseModel",
          {
            characterId: entity.characterId,
            modelId: entity.actorModelId
          }
        );
        subEntity.wasUsed = true;
        return;
      }
      subEntity.currentTicks++;
    }
  }
}
