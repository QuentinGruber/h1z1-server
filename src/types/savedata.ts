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

import { ConstructionPermissions } from "./zoneserver";

export interface BaseSaveData {
  serverId: number;
  worldSaveVersion: number;
}

export interface BaseEntityUpdateSaveData 
  extends BaseSaveData {
  position: Array<number>;
  rotation: Array<number>;
}

export interface BaseFullEntitySaveData
  extends BaseEntityUpdateSaveData {
  characterId: string;
  actorModelId: number;
}

export interface WeaponSaveData {
  ammoCount: number;
}

export interface ItemSaveData {
  itemDefinitionId: number;
  slotId: number;
  itemGuid: string;
  containerGuid: string;
  currentDurability: number;
  stackCount: number;
  weapon?: WeaponSaveData;
}

export interface LoadoutItemSaveData extends ItemSaveData {
  loadoutItemOwnerGuid: string;
}

export interface LoadoutContainerSaveData extends LoadoutItemSaveData {
  containerDefinitionId: number;
  items: { [itemGuid: string]: ItemSaveData };
}

export interface BaseFullCharacterUpdateSaveData extends BaseEntityUpdateSaveData {
  _loadout: { [loadoutSlotId: number]: LoadoutItemSaveData };
  _containers: { [loadoutSlotId: number]: LoadoutContainerSaveData };
  _resources: { [resourceId: number]: number };
}

export interface CharacterUpdateSaveData
  extends BaseFullCharacterUpdateSaveData {
  isRespawning: boolean;
}

export interface FullCharacterSaveData
  extends CharacterUpdateSaveData,
    BaseFullEntitySaveData {
  creationDate: string;
  lastLoginDate: string;
  ownerId: string;
  characterName: string;
  headActor: string;
  hairModel: string;
  gender: number;
  status: number;
}

export interface FullVehicleSaveData
  extends BaseFullCharacterUpdateSaveData,
    BaseFullEntitySaveData {
    vehicleId: number
}

export interface ConstructionChildSaveData
  extends BaseFullCharacterUpdateSaveData,
  BaseFullEntitySaveData {
    health: number;
    
}

export interface ConstructionParentSaveData
  extends ConstructionChildSaveData {
    permissions: { [characterId: string]: ConstructionPermissions };
    ownerCharacterId: string;
    occupiedExpansionSlots: { [slot: number]: ConstructionParentSaveData };
    occupiedRampSlots: { [slot: number]: ConstructionChildSaveData }
}


export interface ServerSaveData extends BaseSaveData {
  lastItemGuid: string;
  worldSaveVersion: number;
}
