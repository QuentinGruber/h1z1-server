// ======================================================================
//
//   GNU GENERAL PUBLIC LICENSE
//   Version 3, 29 June 2007
//   copyright (C) 2020 - 2021 Quentin Gruber
//   copyright (C) 2021 - 2025 H1emu community
//
//   https://github.com/QuentinGruber/h1z1-server
//   https://www.npmjs.com/package/h1z1-server
//
//   Based on https://github.com/psemu/soe-network
// ======================================================================

import { Effects, Items, StringIds } from "../models/enums";
import { ZoneServer2016 } from "../zoneserver";
import { LootableConstructionEntity } from "../entities/lootableconstructionentity";
import { lootableContainerDefaultLoadouts } from "../data/loadouts";
import { BaseEntity } from "../entities/baseentity";
import { ZoneClient2016 } from "./zoneclient";
import { CommandInteractionString } from "types/zone2016packets";

function getSubEntityData(
  entity: LootableConstructionEntity,
  child: CollectingEntity
) {
  switch (entity.itemDefinitionId) {
    case Items.BEE_BOX:
      entity.defaultLoadout = lootableContainerDefaultLoadouts.bee_box;
      child.workingEffect = Effects.EFX_Bees_BeeHiveBox;
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
  /** Id of the parent that the CollectingEntity sits on - used for deck foundations and ground tampers */
  parentObjectCharacterId: string;
  workingEffect: number = 0; // bee box
  dictionary: { [characterId: string]: BaseEntity };
  requiredTicks: number = 4; // 20 min to fill
  currentTicks: number = 0;
  requiredHoneycombTicks: number = 72; // 6 hours to collect honeycomb
  currentHoneycombTicks: number = 0;
  wasUsed: boolean = false;
  isWorking: boolean = true; // some values below arent used, keeping them to avoid compile errors related to 2 different subclasses
  isSmelting: boolean = true;
  allowedFuel: number[] = [];
  filterId: number = 0;
  subType: string = "CollectingEntity"; // for saving identification
  constructor(
    parentObject: LootableConstructionEntity,
    server: ZoneServer2016
  ) {
    this.parentObjectCharacterId = parentObject.characterId;
    if (!parentObject.getParent(server)) {
      this.dictionary = server._worldLootableConstruction;
    } else this.dictionary = server._lootableConstruction;
  }

  OnInteractionString(server: ZoneServer2016, client: ZoneClient2016) {
    server.sendData<CommandInteractionString>(
      client,
      "Command.InteractionString",
      {
        guid: this.parentObjectCharacterId,
        stringId: StringIds.OPEN
      }
    );
  }

  OnFullCharacterDataRequest(server: ZoneServer2016, client: ZoneClient2016) {
    const parentObject =
      server._lootableConstruction[this.parentObjectCharacterId];
    getSubEntityData(parentObject, this);
    if (parentObject.itemDefinitionId != Items.BEE_BOX) return;
    const container = parentObject.getContainer();
    if (!container) return;
    for (const a in container.items) {
      const item = container.items[a];
      if (
        item.itemDefinitionId == Items.HONEY ||
        item.itemDefinitionId == Items.WAX
      ) {
        server.sendData(client, "Command.PlayDialogEffect", {
          characterId: parentObject.characterId,
          effectId: this.workingEffect
        });
        return;
      }
    }
  }
}
