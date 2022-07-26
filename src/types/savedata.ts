import { loadoutContainer, loadoutItem } from "./zoneserver";

export interface CharacterUpdateSaveData {
  position: Array<number>;
  rotation: Array<number>;
  isRespawning: boolean;
  _loadout: { [loadoutSlotId: number]: loadoutItem };
  _containers: { [loadoutSlotId: number]: loadoutContainer };
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