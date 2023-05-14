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
import { lootableContainerDefaultLoadouts } from "../data/loadouts";
import { BaseEntity } from "../entities/baseentity";
import { ZoneClient2016 } from "./zoneclient";

function getSubEntityData(
  entity: LootableConstructionEntity,
  child: CollectingEntity
) {
  switch (entity.itemDefinitionId) {
    case Items.BEE_BOX:
      entity.defaultLoadout = lootableContainerDefaultLoadouts.bee_box;
      child.workingEffect = 188;
      break;
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
  workingEffect: number = 0; // bee box
  dictionary: { [characterId: string]: BaseEntity };
  requiredTicks: number = 4; // 20 min to fill
  currentTicks: number = 0;
  requiredWaxTicks: number = 144; // 12 hours to collect wax
  currentWaxTicks: number = 0;
  wasUsed: boolean = false;
  isWorking: boolean = true; // some values below arent used, keeping them to avoid compile errors related to 2 different subclasses
  isSmelting: boolean = true;
  smeltingTime: number = 40000;
  allowedFuel: number[] = [];
  filterId: number = 0;
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

  OnInteractionString(server: ZoneServer2016, client: ZoneClient2016) {
    server.sendData(client, "Command.InteractionString", {
      guid: this.parentObject.characterId,
      stringId: StringIds.OPEN
    });
  }

  OnFullCharacterDataRequest(server: ZoneServer2016, client: ZoneClient2016) {
    if (this.parentObject.itemDefinitionId != Items.BEE_BOX) return;
    const container = this.parentObject.getContainer();
    if (!container) return;
    for (const a in container.items) {
      const item = container.items[a];
      if (
        item.itemDefinitionId == Items.HONEY ||
        item.itemDefinitionId == Items.WAX
      ) {
        server.sendData(client, "Command.PlayDialogEffect", {
          characterId: this.parentObject.characterId,
          effectId: this.workingEffect
        });
        return;
      }
    }
  }
}
