import { expose } from "threads/worker";
import { FullCharacterSaveData, ServerSaveData } from "types/savedata";
import { Character2016 } from "../entities/character";
import { CharacterSaveDataTransfer, FetchedWorldData, WorldArg, WorldDataManager } from "./worlddatamanager";

const worldDataManager = new WorldDataManager();
export interface WorldDataManagerThreaded {
  initialize: (arg0: number, arg1: string) => Promise<void>;
  getServerData: (arg0: number) => Promise<ServerSaveData>;
  fetchWorldData: () => Promise<FetchedWorldData>;
  fetchCharacterData: (arg0: string) => Promise<FullCharacterSaveData>;
  insertWorld: (arg0: bigint) => Promise<void>;
  deleteWorld: () => Promise<void>;
  saveWorld: (arg0: WorldArg) => Promise<void>;
  saveCharacters: (arg0: Character2016[]) => Promise<void>;
  saveCharacterData: (arg0: Character2016) => Promise<void>;
}
expose({
  initialize(worldId: number, mongoAddress: string) {
    return worldDataManager.initialize(worldId, mongoAddress);
  },
  getServerData(serverId: number) {
    return worldDataManager.getServerData(serverId) as Promise<ServerSaveData>;
  },
  fetchWorldData() {
    return worldDataManager.fetchWorldData();
  },
  fetchCharacterData(characterId: string) {
    return worldDataManager.fetchCharacterData(characterId);
  },
  saveWorld(world: WorldArg) {
    return worldDataManager.saveWorld(world);
  },
  insertWorld(lastItemGuid: bigint) {
    return worldDataManager.insertWorld(lastItemGuid);
  },
  deleteWorld() {
    return worldDataManager.deleteWorld();
  },
  saveCharacters(characters: CharacterSaveDataTransfer[]) {
    return worldDataManager.saveCharacters(characters);
  },
  saveCharacterData(character: CharacterSaveDataTransfer) {
    return worldDataManager.saveCharacterData(character);
  },
});
