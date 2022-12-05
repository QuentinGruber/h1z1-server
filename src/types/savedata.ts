interface BaseSaveData {
  serverId: number;
}

interface BaseEntityUpdateSaveData {
  position: Array<number>;
  rotation: Array<number>;
}

interface BaseFullEntitySaveData
  extends BaseEntityUpdateSaveData,
    BaseSaveData {
  characterId: string;
  actorModelId: number;
}

interface WeaponSaveData {
  ammoCount: number;
}

interface ItemSaveData {
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

interface BaseFullCharacterUpdateSaveData extends BaseEntityUpdateSaveData {
  _loadout: { [loadoutSlotId: number]: LoadoutItemSaveData };
  _containers: { [loadoutSlotId: number]: LoadoutContainerSaveData };
  _resources: { [resourceId: number]: number };
  worldSaveVersion: number;
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
    BaseFullEntitySaveData {}

export interface ServerSaveData extends BaseSaveData {
  lastItemGuid: string;
  worldSaveVersion: number;
}
