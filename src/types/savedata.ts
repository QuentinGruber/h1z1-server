import { loadoutContainer, loadoutItem } from "./zoneserver";

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

interface BaseFullCharacterUpdateSaveData
extends BaseEntityUpdateSaveData {
  _loadout: { [loadoutSlotId: number]: loadoutItem };
  _containers: { [loadoutSlotId: number]: loadoutContainer };
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
}

export interface FullVehicleSaveData
extends BaseFullCharacterUpdateSaveData,
BaseFullEntitySaveData {

}