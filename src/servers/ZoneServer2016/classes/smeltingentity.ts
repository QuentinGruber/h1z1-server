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

import { Items, FilterIds, StringIds, Effects } from "../models/enums";
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
      child.workingEffect = Effects.EFX_Fire_Furnace;
      break;
    case Items.CAMPFIRE:
      child.filterId = FilterIds.COOKING;
      entity.defaultLoadout = lootableContainerDefaultLoadouts.campfire;
      child.workingEffect = Effects.EFX_Fire_Campfire;
      break;
    case Items.BARBEQUE:
      child.filterId = FilterIds.COOKING;
      entity.defaultLoadout = lootableContainerDefaultLoadouts.barbeque;
      child.workingEffect = Effects.EFX_Fire_Barbecue;
      break;
    default:
      child.filterId = FilterIds.FURNACE;
      entity.defaultLoadout = lootableContainerDefaultLoadouts.furnace;
      child.workingEffect = Effects.EFX_Fire_Furnace;
      break;
  }
}

export class SmeltingEntity {
  /** The CharacterId of the parent that the entity sits on */
  parentObjectCharacterId: string;

  /** Array of item id's that can be used as fuel */
  allowedFuel: number[];

  /** Determines if a smelting entity is for cooking or smelting - Default: smelting */
  filterId: number = FilterIds.FURNACE;

  /** Id of the effect the smelting entity will have, Default: Furance EFX
   * - See Effects enum for more information */
  workingEffect: number = Effects.EFX_Fire_Furnace;

  /** Returns true when the smelting entity has been ignited */
  isWorking: boolean = false;

  /** Returns true when the item is smelted */
  isSmelting: boolean = false;

  /** Global HashMap of SmeltingEntities - uses CharacterId (string) for indexing */
  dictionary: { [characterId: string]: BaseEntity };

  /** For identification upon saving */
  subType: string = "SmeltingEntity";

  constructor(
    parentObject: LootableConstructionEntity,
    server: ZoneServer2016
  ) {
    this.parentObjectCharacterId = parentObject.characterId;
    this.allowedFuel = getAllowedFuel(parentObject.itemDefinitionId);
    getSmeltingEntityData(parentObject, this);
    if (!parentObject.getParent(server)) {
      this.dictionary = server._worldLootableConstruction;
    } else this.dictionary = server._lootableConstruction;
  }

  OnInteractionString(server: ZoneServer2016, client: ZoneClient2016) {
    server.sendData(client, "Command.InteractionString", {
      guid: this.parentObjectCharacterId,
      stringId: StringIds.USE_IGNITABLE
    });
  }

  OnFullCharacterDataRequest(server: ZoneServer2016, client: ZoneClient2016) {
    if (!this.isWorking) return;
    server.sendData(client, "Command.PlayDialogEffect", {
      characterId: this.parentObjectCharacterId,
      effectId: this.workingEffect
    });
  }
}
