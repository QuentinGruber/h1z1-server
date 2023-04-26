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
import { Scheduler } from "../../../utils/utils";

export class SmeltingManager {
  _smeltingEntities: { [characterId: string]: string } = {};
  _collectingEntities: { [characterId: string]: string } = {};
  collectingTickTime: number = 300000; // 5 min x 4 ticks = 20 min to fill water/honey
  lastBurnTime: number = 0;
  // 5 min x 144 ticks = 12 hours for wax

  /* MANAGED BY CONFIGMANAGER */
  burnTime!: number;
  smeltTime!: number;

  public async checkSmeltables(server: ZoneServer2016) {
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
      server.sendDataToAllWithSpawnedEntity(
        subEntity!.dictionary,
        entity.characterId,
        "Character.PlayWorldCompositeEffect",
        {
          characterId: entity.characterId,
          effectId: entity.subEntity!.workingEffect,
          position: entity.state.position,
          unk3: Math.ceil(this.burnTime / 1000),
        }
      );
    }
    await Scheduler.wait(this.burnTime);
    this.checkSmeltables(server);
  }

  public async checkCollectors(server: ZoneServer2016) {
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
          this.checkWax(server, entity, subEntity, container);
          break;
        case Items.DEW_COLLECTOR:
          this.checkCollector(server, entity, subEntity, container);
          break;
        case Items.ANIMAL_TRAP:
          this.checkAnimalTrap(server, entity, subEntity, container);
          break;
      }
    }
    await Scheduler.wait(this.collectingTickTime);
    this.checkCollectors(server);
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
            true
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
    await Scheduler.wait(this.smeltTime);
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
                    true
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
      if (item.itemDefinitionId != Items.WATER_EMPTY) continue;
      if (subEntity.currentTicks >= subEntity.requiredTicks) {
        subEntity.currentTicks = 0;
        server.removeContainerItem(entity, item, container, 1);
        const reward = getRewardId(entity.itemDefinitionId);
        if (reward) {
          entity.lootContainerItem(
            server,
            server.generateItem(reward),
            1,
            true
          );
          if (reward == Items.HONEY) {
            server.sendDataToAllWithSpawnedEntity(
              subEntity.dictionary,
              entity.characterId,
              "Command.PlayDialogEffect",
              {
                characterId: entity.characterId,
                effectId: subEntity.workingEffect,
              }
            );
          }
        }
        return;
      }
      subEntity.currentTicks++;
    }
  }

  private checkWax(
    server: ZoneServer2016,
    entity: LootableConstructionEntity,
    subEntity: CollectingEntity,
    container: LoadoutContainer
  ) {
    let checkEmpty = true;
    for (const a in container.items) {
      const item = container.items[a];
      if (
        item.itemDefinitionId != Items.WATER_EMPTY &&
        item.itemDefinitionId != Items.HONEY
      )
        checkEmpty = false;
    }
    if (checkEmpty) {
      if (subEntity.currentWaxTicks >= subEntity.requiredWaxTicks) {
        subEntity.currentWaxTicks = 0;
        entity.lootContainerItem(
          server,
          server.generateItem(Items.WAX),
          1,
          true
        );
        server.sendDataToAllWithSpawnedEntity(
          subEntity.dictionary,
          entity.characterId,
          "Command.PlayDialogEffect",
          {
            characterId: entity.characterId,
            effectId: subEntity.workingEffect,
          }
        );
        return;
      }
      subEntity.currentWaxTicks++;
    }
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
          true
        );
        entity.actorModelId = 35;
        server.sendDataToAllWithSpawnedEntity(
          subEntity.dictionary,
          entity.characterId,
          "Character.ReplaceBaseModel",
          {
            characterId: entity.characterId,
            modelId: entity.actorModelId,
          }
        );
        subEntity.wasUsed = true;
        return;
      }
      subEntity.currentTicks++;
    }
  }
}
