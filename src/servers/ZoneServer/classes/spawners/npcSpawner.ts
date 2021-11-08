import { entitySpawner } from "./entitySpawner";

class npcSpawner extends entitySpawner{
    chanceZombie = 50;
    constructor(numberOfSpawnedEntity:number){
        super(numberOfSpawnedEntity);
    }
}