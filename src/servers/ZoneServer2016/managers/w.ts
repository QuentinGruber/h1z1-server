import { expose } from "threads/worker";
import { WorldDataManager } from "./worlddatamanager";

const worldDataManager = new WorldDataManager();
expose({
  initialize(worldId: number, mongoAddress: string) {
    return worldDataManager.initialize(worldId, mongoAddress);
  },
  getServerData(serverId: number, soloMode: boolean) {
    return worldDataManager.getServerData(serverId, soloMode);
  },
  fetchWorldData() {
    return worldDataManager.fetchWorldData();
  },
  fetchCharacterData(characterId: string) {
    return worldDataManager.fetchCharacterData(characterId);
  },
  run(){
    console.log("yeah i run");
  }
});
