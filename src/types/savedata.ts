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

import { ConstructionPermissions } from "./zoneserver";

export interface BaseSaveData {
  serverId: number;
}

export interface BaseEntityUpdateSaveData {
  position: Array<number>;
  rotation: Array<number>;
}

export interface BaseFullEntitySaveData
  extends BaseEntityUpdateSaveData,
  BaseSaveData {
  characterId: string;
  actorModelId: number;
}

export interface WeaponSaveData {
  ammoCount: number;
}

export interface AccountItemSaveData {
  loginSessionId: string;
  items: ItemSaveData[];
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
  worldSaveVersion: number;
}

export interface CharacterUpdateSaveData
  extends BaseFullCharacterUpdateSaveData {
  characterId: string,
  isRespawning: boolean;
  spawnGridData: number[];
  metrics: CharacterMetricsSaveData;
  mutedCharacters: string[];
  playTime: number;
  lastDropPlayTime: number;
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

export interface positionUpdate {
        orientation?: any;
        frontTilt?: number;
        sideTilt?: number;
}

export interface FullVehicleSaveData
  extends BaseFullCharacterUpdateSaveData,
    BaseFullEntitySaveData {
    positionUpdate: positionUpdate;
    vehicleId: number,
    shaderGroupId: number
}

export interface BaseConstructionSaveData
  extends BaseFullEntitySaveData {
    health: number;
    placementTime: number;
    parentObjectCharacterId: string;
    itemDefinitionId: number;
    slot: string;
}

export interface ConstructionDoorSaveData
  extends BaseConstructionSaveData {
    ownerCharacterId: string;
    passwordHash: number;
    grantedAccess: Array<string>;
}

export interface LootableConstructionSaveData
  extends BaseConstructionSaveData {
    container?: LoadoutContainerSaveData
    subEntityType: string;
}

export interface ConstructionChildSaveData
  extends BaseConstructionSaveData {
    eulerAngle: number;

    occupiedWallSlots: {
      [slot: number]: ConstructionDoorSaveData | ConstructionChildSaveData;
    }
    occupiedUpperWallSlots: { [slot: number]: ConstructionChildSaveData }
    occupiedShelterSlots: { [slot: number]: ConstructionChildSaveData }
    freeplaceEntities: {
      [characterId: string]:
        | ConstructionChildSaveData
        | ConstructionDoorSaveData
        | LootableConstructionSaveData;
    }
}

export interface ConstructionParentSaveData
  extends ConstructionChildSaveData {
    permissions: { [characterId: string]: ConstructionPermissions };
    ownerCharacterId: string;
    occupiedExpansionSlots: { [slot: number]: ConstructionParentSaveData };
    occupiedRampSlots: { [slot: number]: ConstructionChildSaveData }
}

export interface PlantSaveData
  extends BaseFullEntitySaveData {
    growState: number;
    nextStateTime: number;
    parentObjectCharacterId: string;
    slot: string;
    item: ItemSaveData;
}

export interface PlantingDiameterSaveData
  extends BaseFullEntitySaveData {
    seedSlots: { [id: string]: PlantSaveData };
    fertilizedTimestamp: number;
    placementTime: number;
    isFertilized: boolean;
}

export interface TrapSaveData
  extends BaseFullEntitySaveData {
    ownerCharacterId: string;
    itemDefinitionId: number;
    health: number;
}

export interface ServerSaveData extends BaseSaveData {
  lastItemGuid: string;
  worldSaveVersion: number;
}

export interface CharacterMetricsSaveData {
  zombiesKilled: number;
  wildlifeKilled: number;
  recipesDiscovered: number;
  startedSurvivingTP: number;
  vehiclesDestroyed: number;
  playersKilled: number;
}