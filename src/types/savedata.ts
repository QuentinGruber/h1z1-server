import { loadoutContainer, loadoutItem } from "./zoneserver";

interface BaseEntityUpdateSaveData {
  position: Array<number>;
  rotation: Array<number>;
}

interface BaseFullCharacterUpdateSaveData
extends BaseEntityUpdateSaveData {
  _loadout: { [loadoutSlotId: number]: loadoutItem };
  _containers: { [loadoutSlotId: number]: loadoutContainer };
}

export interface CharacterUpdateSaveData 
extends BaseFullCharacterUpdateSaveData {
  isRespawning: boolean;
}

export interface FullCharacterSaveData
extends CharacterUpdateSaveData{
  serverId: number;
  creationDate: string;
  lastLoginDate: string;
  characterId: string;
  ownerId: string;
  characterName: string;
  actorModelId: number;
  headActor: string;
  hairModel: string;
  gender: number;
}

export interface VehicleUpdateSaveData 
extends BaseFullCharacterUpdateSaveData {
  
}

export interface FullVehicleSaveData
extends VehicleUpdateSaveData {

}