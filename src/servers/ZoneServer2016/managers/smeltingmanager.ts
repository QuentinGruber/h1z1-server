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

import { ZoneServer2016 } from "../zoneserver";
import { Items } from "../models/enums";
import { RecipeComponent } from "types/zoneserver";
import { CollectingEntity } from "../classes/collectingentity";
import { SmeltingEntity } from "../classes/smeltingentity";
import { LootableConstructionEntity } from "../entities/lootableconstructionentity";
import { BaseItem } from "../classes/baseItem";
import { smeltingData } from "../data/Recipes";
import { Scheduler } from "../../../utils/utils";

export class SmeltingManager {
  _workingEntities: { [characterId: string]: string } = {};
  burningTime: number = 60000;
  smeltingTime: number = 40000;

  public async run(server: ZoneServer2016) {
    console.log(this._workingEntities);
    for (const a in this._workingEntities) {
      const entity = this.getTrueEntity(server, this._workingEntities[a]);
      if (!entity) {
        delete this._workingEntities[a];
        continue;
      }
      const subEntity = entity.subEntity;
      if (entity.subEntity instanceof CollectingEntity) {
        // do stuff here
      } else if (entity.subEntity instanceof SmeltingEntity) {
        const container = entity.getContainer();
        if (!container) {
          delete this._workingEntities[a];
          continue;
        }
        const items = Object.values(container.items);
        const dictionary = entity.subEntity?.dictionary;
        if (items.length <= 0) {
          subEntity!.isWorking = false;
          this.extingush(server, entity, dictionary);
        } else {
          if (!this.checkFuel(server, entity)) {
            this.extingush(server, entity, dictionary);
            continue;
          } else if (!subEntity!.isSmelting) {
            subEntity!.isSmelting = true;
            this.smelt(server, entity);
          }
        }
      }
    }
    await Scheduler.wait(this.burningTime);
    this.run(server);
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

  private extingush(
    server: ZoneServer2016,
    entity: LootableConstructionEntity,
    dictionary: any
  ) {
    delete this._workingEntities[entity.characterId];
    this.sendWorkingEffect(server, 0, entity.characterId, dictionary);
    entity.subEntity!.isWorking = false;
  }

  private sendWorkingEffect(
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
  }

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
          server.addContainerItemExternal(
            entity.mountedCharacter ? entity.mountedCharacter : "",
            server.generateItem(Items.CHARCOAL),
            container!,
            1
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
    await Scheduler.wait(this.smeltingTime);
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
                  server.addContainerItemExternal(
                    entity.mountedCharacter ? entity.mountedCharacter : "",
                    server.generateItem(recipe.rewardId),
                    container,
                    1
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
}
