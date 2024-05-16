// ======================================================================
//
//   GNU GENERAL PUBLIC LICENSE
//   Version 3, 29 June 2007
//   copyright (C) 2020 - 2021 Quentin Gruber
//   copyright (C) 2021 - 2024 H1emu community
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
import { AccountInventory } from "../classes/accountinventory";

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
  loadAccountInventory: (arg0: string) => Promise<AccountInventory>;
  saveAccountInventory: (arg0: AccountInventory) => Promise<void>;
  kill: () => void;
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
  },
  loadAccountInventory(loginSessionId: string) {
    return worldDataManager.loadAccountInventory(loginSessionId);
  },
  saveAccountInventory(accountInventory: AccountInventory) {
    return worldDataManager.saveAccountInventory(accountInventory);
  },
  kill() {
    process.exit(0);
  }
});
