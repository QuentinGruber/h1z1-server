const modelToName = require("../../../../../data/2015/sampleData/ModelToName.json");
import { generateRandomGuid } from "../../../../utils/utils";
import { parentPort } from "worker_threads";

export abstract class EntitySpawner {
    numberOfSpawnedEntity = 0;
    refreshInterval = 1000;
    canProcess:boolean = true;
    processEntitiesSpawnTimeout:any;
    spawnedIds:number[] = [];
    nextSpawnBuffer: Buffer;
    nextSpawnBufferOffset: number = 0;
    nextSpawnBufferSize: number = 2000;
    entitiesSpawnList: any[];
    entitiesSpawnChances: { [spawnName: string]: number } 
    entitiesSpawnParsed: { [spawnName: string]: any[] } = {} ;
    worldId: number;
    constructor(numberOfSpawnedEntity:number,entitiesSpawnList:any[],entitiesSpawnChances: { [spawnName: string]: number },worldId:number){
        this.numberOfSpawnedEntity = numberOfSpawnedEntity;
        this.entitiesSpawnList = entitiesSpawnList;
        this.entitiesSpawnChances = entitiesSpawnChances;
        this.worldId = worldId;
        Object.keys(entitiesSpawnChances).forEach((spawnType:string) => {
            this.entitiesSpawnParsed[spawnType] = entitiesSpawnList.filter((e:any)=>{return e.actorDefinition === spawnType});
        });
        this.processEntitiesSpawnTimeout = setTimeout(this.processEntitiesSpawnTimeoutCb, this.refreshInterval);
        this.nextSpawnBuffer = Buffer.alloc(this.nextSpawnBufferSize)
    }
    processEntitiesSpawnTimeoutCb(){
        if(this.canProcess){
            this.processEntitiesSpawn();
            this.processEntitiesSpawnTimeout.refresh();
        }
    }
    processEntitiesSpawn(){
        Object.keys(this.entitiesSpawnParsed).forEach((entityType:string) => {
            const allEntities = this.entitiesSpawnParsed[entityType]
            const totalEntities = allEntities.length;
            const nbToSpawn = this.entitiesSpawnChances[entityType] * totalEntities;
            const startingIndex = Math.floor(Math.random()* totalEntities) - nbToSpawn; // TODO: need to find a better way because rn index = 0 can't exist
            for (let index = startingIndex; index < nbToSpawn; index++) {
                const entity = allEntities[index];
                this.createEntity(entity.modelId)
                
            }
        });
        
    }
    askParentToSpawnEntities(){
        parentPort?.postMessage(this.nextSpawnBuffer)
    }
    addBufferedEntityToNextSpawn(bufferedEntity:Buffer){
        if(this.nextSpawnBufferOffset + bufferedEntity.byteLength < this.nextSpawnBufferSize){
            for (let index = this.nextSpawnBufferOffset; index < this.nextSpawnBufferSize; index++) {
                const bufferedEntityOffset = index - this.nextSpawnBufferOffset;
                this.nextSpawnBuffer.writeInt8(bufferedEntity.readUInt8(bufferedEntityOffset),index)
                // or this way ? => this.nextSpawnBuffer[index] = bufferedEntity[bufferedEntityOffset];
            }
            this.nextSpawnBufferOffset += bufferedEntity.byteLength;
        }
        else{
            this.askParentToSpawnEntities();
        }
    }

    convertEntityToBuffer(entity:any){
        return Buffer.from(JSON.stringify(entity));
    }
    
    createEntity(
        modelID: number,
        position: Float32Array,
        rotation: Float32Array,
        scale: Float32Array,
        texture: string,
        zoneId: number
    ): void {
        let stringNameId = 0;
        modelToName.forEach((spawnername: any) => {
          if (modelID === spawnername.modelId) {
            stringNameId = spawnername.NameId;
          }
        });
      
        const guid = generateRandomGuid();
        const characterId = generateRandomGuid();
        this.numberOfSpawnedEntity++;
        const entity = {
          worldId: this.worldId,
          zoneId: zoneId,
          characterId: characterId,
          guid: guid,
          transientId: this.numberOfSpawnedEntity,
          nameId: stringNameId,
          modelId: modelID,
          scale: scale,
          texture: texture,
          position: position,
          rotation: rotation,
          attachedObject: {},
          color: {},
        };
        this.addBufferedEntityToNextSpawn(this.convertEntityToBuffer(entity));
      }
}

