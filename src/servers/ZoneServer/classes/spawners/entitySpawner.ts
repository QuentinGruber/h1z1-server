const debug = require("debug")("baseEntityCreator");
const Z1_vehicles = require("../../../../data/2015/sampleData/vehicleLocations.json");
const Z1_items = require("../../../../data/2015/zoneData/Z1_items.json");
const Z1_doors = require("../../../../data/2015/zoneData/Z1_doors.json");
const Z1_npcs = require("../../../../data/2015/zoneData/Z1_npcs.json");
const z1_Props = require("../../../../data/2015/zoneData/z1_Props.json");
const models = require("../../../../../data/2015/dataSources/Models.json");
const modelToName = require("../../../../../data/2015/sampleData/ModelToName.json");
const textures = require("../../../../../data/2015/sampleData/textures.json");
import { _, eul2quat, generateRandomGuid } from "../../../../utils/utils";
import { Vehicle } from "../vehicles";
import { ZoneServer } from "../../zoneserver";
import { parentPort } from "worker_threads";

export class entitySpawner {
    numberOfSpawnedEntity = 0;
    refreshInterval = 1000;
    processEntitiesSpawnTimeout:any;
    spawnedIds:number[] = [];
    nextSpawnBuffer: SharedArrayBuffer;
    nextSpawnBufferOffset: number = 0;
    nextSpawnBufferSize: number;
    entitiesSpawnList: any[];
    entitiesSpawnIdList: number[];
    worldId: number;
    constructor(numberOfSpawnedEntity:number,entitiesSpawnList:any[],nextSpawnBuffer:SharedArrayBuffer,worldId:number){
        this.numberOfSpawnedEntity = numberOfSpawnedEntity;
        this.entitiesSpawnList = entitiesSpawnList;
        this.worldId = worldId;
        this.entitiesSpawnIdList = entitiesSpawnList.map((e:any)=>{return e.id});
        this.processEntitiesSpawnTimeout = setTimeout(this.processEntitiesSpawn, this.refreshInterval);
        this.nextSpawnBuffer = nextSpawnBuffer
        this.nextSpawnBufferSize = nextSpawnBuffer.byteLength;
    }
    processEntitiesSpawn(){
        this.processEntitiesSpawnTimeout.refresh()
    }
    askParentToSpawnEntities(){
        parentPort.postMessage(this.nextSpawnBuffer)
    }
    addBufferedEntityToNextSpawn(bufferedEntity:Buffer){
        if(this.nextSpawnBufferOffset + bufferedEntity.byteLength < this.nextSpawnBufferSize){
            for (let index = this.nextSpawnBufferOffset; index < this.nextSpawnBufferSize; index++) {
                const bufferedEntityOffset = index - this.nextSpawnBufferOffset;
                this.nextSpawnBuffer[index] = bufferedEntity[bufferedEntityOffset];
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

