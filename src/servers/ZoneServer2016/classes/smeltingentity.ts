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

import { Items, FilterIds, StringIds } from "../models/enums";
import { ZoneServer2016 } from "../zoneserver";
import { LootableConstructionEntity } from "../entities/lootableconstructionentity";
import { lootableContainerDefaultLoadouts } from "../data/loadouts";
import { BaseEntity } from "../entities/baseentity";
import { ZoneClient2016 } from "./zoneclient";

function getAllowedFuel(itemDefinitionId: number): number[] {
  switch (itemDefinitionId) {
    case Items.FURNACE:
      return [
        Items.WOOD_LOG,
        Items.WEAPON_BRANCH,
        Items.WOOD_PLANK,
        Items.WOOD_STICK,
        Items.CHARCOAL
      ];
    case Items.BARBEQUE:
      return [
        Items.WEAPON_BRANCH,
        Items.WOOD_STICK,
        Items.WOOD_PLANK,
        Items.CHARCOAL
      ];
    case Items.CAMPFIRE:
      return [
        Items.WOOD_LOG,
        Items.WEAPON_BRANCH,
        Items.WOOD_PLANK,
        Items.WOOD_STICK,
        Items.CHARCOAL
      ];
    default:
      return [
        Items.WOOD_LOG,
        Items.WEAPON_BRANCH,
        Items.WOOD_PLANK,
        Items.CHARCOAL
      ];
  }
}

function getSmeltingEntityData(
  entity: LootableConstructionEntity,
  child: SmeltingEntity
) {
  switch (entity.itemDefinitionId) {
    case Items.FURNACE:
      child.filterId = FilterIds.FURNACE;
      entity.defaultLoadout = lootableContainerDefaultLoadouts.furnace;
      child.workingEffect = 5028;
      break;
    case Items.CAMPFIRE:
      child.filterId = FilterIds.COOKING;
      entity.defaultLoadout = lootableContainerDefaultLoadouts.campfire;
      child.workingEffect = 1207;
      break;
    case Items.BARBEQUE:
      child.filterId = FilterIds.COOKING;
      entity.defaultLoadout = lootableContainerDefaultLoadouts.barbeque;
      child.workingEffect = 5044;
      break;
    default:
      child.filterId = FilterIds.FURNACE;
      entity.defaultLoadout = lootableContainerDefaultLoadouts.furnace;
      child.workingEffect = 5028;
      break;
  }
}

export class SmeltingEntity {
  parentObject: LootableConstructionEntity;
  allowedFuel: number[];
  filterId: number = FilterIds.FURNACE;
  workingEffect: number = 5028;
  isWorking: boolean = false;
  isSmelting: boolean = false;
  smeltingTime: number = 40000;
  dictionary: { [characterId: string]: BaseEntity };
  subType: string = "SmeltingEntity"; // for saving identification
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

  OnInteractionString(server: ZoneServer2016, client: ZoneClient2016) {
    server.sendData(client, "Command.InteractionString", {
      guid: this.parentObject.characterId,
      stringId: StringIds.USE_IGNITABLE
    });
  }

  OnFullCharacterDataRequest(server: ZoneServer2016, client: ZoneClient2016) {
    if (!this.isWorking) return;
    server.sendData(client, "Command.PlayDialogEffect", {
      characterId: this.parentObject.characterId,
      effectId: this.workingEffect
    });
  }
}
