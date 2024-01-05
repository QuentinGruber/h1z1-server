import { expose } from "threads/worker";
import {
  CharacterUpdateSaveData,
  FullCharacterSaveData,
  ServerSaveData
} from "types/savedata";
import {
  FetchedWorldData,
  WorldArg,
  WorldDataManager
} from "./worlddatamanager";

const worldDataManager = new WorldDataManager();
export interface WorldDataManagerThreaded {
  readonly worldSaveVersion: number;
  saveTimeInterval: number;
  nextSaveTime: number;
  initialize: (arg0: number, arg1: string) => Promise<void>;
  getServerData: (arg0: number) => Promise<ServerSaveData>;
  fetchWorldData: () => Promise<FetchedWorldData>;
  fetchCharacterData: (arg0: string) => Promise<FullCharacterSaveData>;
  insertWorld: (arg0: bigint) => Promise<void>;
  deleteWorld: () => Promise<void>;
  saveWorld: (arg0: WorldArg) => Promise<void>;
  saveCharacters: (arg0: CharacterUpdateSaveData[]) => Promise<void>;
  saveCharacterData: (
    arg0: CharacterUpdateSaveData,
    arg1?: bigint
  ) => Promise<void>;
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
  saveCharacters(characters: CharacterUpdateSaveData[]) {
    return worldDataManager.saveCharacters(characters);
  },
  saveCharacterData(character: CharacterUpdateSaveData, lastItemGuid?: bigint) {
    return worldDataManager.saveCharacterData(character, lastItemGuid);
  }
});
