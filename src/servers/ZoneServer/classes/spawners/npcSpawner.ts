import { EntitySpawner } from "./entitySpawner";
const Z1_npcs = require("../../../../data/2015/zoneData/Z1_npcs.json");

class NpcSpawner extends EntitySpawner {
    chanceZombie = 50;
    constructor(numberOfSpawnedEntity:number,entitiesSpawnList:any[],entitiesSpawnChances: { [spawnName: string]: number },worldId:number){
        super(numberOfSpawnedEntity,entitiesSpawnList,entitiesSpawnChances,worldId);
    }
    processEntitiesSpawn() {
        console.log("cc")
    }
}

//const npcSpawner = new NpcSpawner(0,[],new SharedArrayBuffer(1500),1)