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
  getServerData: (arg0: number) => Promise<ServerSaveData | null>;
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
  kill: () => void;
}
expose({
  initialize(worldId: number, mongoAddress: string) {
    return worldDataManager.initialize(worldId, mongoAddress);
  },
  getServerData(serverId: number) {
    return worldDataManager.getServerData(serverId);
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
  },
  kill() {
    process.exit(0);
  }
});
