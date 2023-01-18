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

import { Items, StringIds } from "../models/enums";
import { ZoneServer2016 } from "../zoneserver";
import { LootableConstructionEntity } from "../entities/lootableconstructionentity";
import { BaseItem } from "./baseItem";
import { lootableContainerDefaultLoadouts } from "../data/loadouts";
import { BaseEntity } from "../entities/baseentity";
import { ZoneClient2016 } from "./zoneclient";

function getSubEntityData(
    entity: LootableConstructionEntity,
    child: CollectingEntity
) {
    switch (entity.itemDefinitionId) {
        case Items.DEW_COLLECTOR:
            entity.defaultLoadout = lootableContainerDefaultLoadouts.dew_collector;
            child.workingEffect = 0;
            break;
        case Items.ANIMAL_TRAP:
            entity.defaultLoadout = lootableContainerDefaultLoadouts.animal_trap;
            child.workingEffect = 0;
            break;
    }
}

export class CollectingEntity {
  parentObject: LootableConstructionEntity;
  workingEffect: number = 5028;
  tickTime: number = 60000;
  dictionary: { [characterId: string]: BaseEntity };
  requiredTicks: number = 15; // 15 min to fill
  currentTicks: number = 0;
  wasUsed: boolean = false;
  subType: string = "CollectingEntity"; // for saving identification
  constructor(
    parentObject: LootableConstructionEntity,
    server: ZoneServer2016
  ) {
    this.parentObject = parentObject;
    if (!parentObject.getParent(server)) {
      this.dictionary = server._worldLootableConstruction;
    } else this.dictionary = server._lootableConstruction;
      getSubEntityData(parentObject, this);
  }

  startWorking(
    server: ZoneServer2016,
    parentObject: LootableConstructionEntity
  ) {
    const container = parentObject.getContainer();
    if (!container) return;
    if (!this.dictionary[parentObject.characterId]) {
      return;
    }
    const checkEmpty = JSON.stringify(container.items) === "{}";
    switch (parentObject.itemDefinitionId) {
      case Items.ANIMAL_TRAP:
        if (checkEmpty) {
          if (this.wasUsed) {
            server.deleteEntity(parentObject.characterId, this.dictionary);
            return;
          }
          if (!this.wasUsed) this.currentTicks++;
          if (this.currentTicks >= this.requiredTicks) {
            this.currentTicks = 0;
            this.wasUsed = true;
            server.addContainerItemExternal(
              parentObject.mountedCharacter
                ? parentObject.mountedCharacter
                : "",
              server.generateItem(Items.MEAT_RABBIT),
              container,
              1
            );
            parentObject.actorModelId = 35;
            server.sendDataToAllWithSpawnedEntity(
              this.dictionary,
              parentObject.characterId,
              "Character.ReplaceBaseModel",
              {
                characterId: parentObject.characterId,
                modelId: parentObject.actorModelId,
              }
            );
          }
        }
        setTimeout(() => {
          this.startWorking(server, parentObject);
        }, this.tickTime);
        return;
      case Items.DEW_COLLECTOR:
        let passed = false;
        Object.values(container.items).forEach((item: BaseItem) => {
          if (passed) return;
          if (item.itemDefinitionId != Items.WATER_EMPTY) return;
          this.currentTicks++;
          passed = true;
          if (this.currentTicks >= this.requiredTicks) {
            this.currentTicks = 0;
            server.removeContainerItemNoClient(item, parentObject, 1);
            server.addContainerItemExternal(
              parentObject.mountedCharacter
                ? parentObject.mountedCharacter
                : "",
              server.generateItem(Items.WATER_STAGNANT),
              container,
              1
            );
            return;
          }
        });
        if (!passed) this.currentTicks = 0;
        setTimeout(() => {
          this.startWorking(server, parentObject);
        }, this.tickTime);
        return;
    }
  }
  OnInteractionString(server: ZoneServer2016, client: ZoneClient2016) {
    server.sendData(client, "Command.InteractionString", {
      guid: this.parentObject.characterId,
      stringId: StringIds.OPEN,
    });
  }
  OnFullCharacterDataRequest(server: ZoneServer2016, client: ZoneClient2016) {
  }
}
