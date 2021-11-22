import { ZoneServer2016 } from "../zoneserver";
const Z1_doors = require("../../../../data/2016/zoneData/Z1_doors.json");
const models = require("../../../../data/2016/dataSources/Models.json");
const modelToName = require("../../../../data/2016/dataSources/ModelToName.json");
import { _, generateRandomGuid } from "../../../utils/utils";
const debug = require("debug")("baseEntityCreator");

function getHeadActor(modelId: number): any {
    switch (modelId) {
      case 9510:
        return "ZombieFemale_Head_01.adr";
      case 9634:
        return "ZombieMale_Head_01.adr";
      default:
        return "";
    }
  }

export class WorldObjectManager {
    firstRun: boolean = true;
    lastLootRespawnTime: number = Date.now();
    lastVehicleRespawnTime: number = Date.now();
    lastNpcRespawnTime: number = Date.now();
    lootRespawnTimer: number = 600000; // 10 minutes
    vehicleRespawnTimer: number = 600000; // 10 minutes
    npcRespawnTimer: number = 600000; // 10 minutes
    constructor(

    ) {
      // spawn all initial entities in constructor
    }
    run(server: ZoneServer2016) {
        if(this.firstRun) {
            this.createAllDoors(server);
            this.firstRun = false;
        }
        if(this.lastLootRespawnTime + this.lootRespawnTimer >= Date.now()) {
            this.respawnLoot(server);
        }
    }

    respawnLoot(server: ZoneServer2016) {
        // todo:
        /*
            - iterate through all loot respawn locations and check if they have an item spawned
            - if a location has an item spawned already, do nothing
            - if not, normal spawnchance should apply
        */
    }

    createEntity(// todo: clean this up
        server: ZoneServer2016,
        modelID: number,
        position: Array<number>,
        rotation: Array<number>,
        dictionary: any
      ): void {
        let stringNameId = 0;
        modelToName.forEach((spawnername: any) => {
          if (modelID === spawnername.modelId) {
            stringNameId = spawnername.NameId;
          }
        });
      
        const guid = generateRandomGuid();
        const characterId = generateRandomGuid();
        dictionary[characterId] = {
          characterId: characterId,
          guid: guid,
          transientId: server.getTransientId(characterId),
          nameId: stringNameId,
          modelId: modelID,
          position: position,
          rotation: rotation,
          // rotation: [0, 0, 0], // default rotation for all items for now, needs 2016 item positions / rotations
          headActor: getHeadActor(modelID),
          attachedObject: {},
          color: {},
        };
      }

    createAllDoors(server: ZoneServer2016): void {
        Z1_doors.forEach((doorType: any) => {
          const modelId: number = _.find(models, (model: any) => {
            return (
              model.MODEL_FILE_NAME ===
              doorType.actorDefinition.replace("_Placer", "")
            );
          })?.ID;
          doorType.instances.forEach((doorInstance: any) => {
            const r = doorInstance.rotation;
            this.createEntity(
              server,
              modelId ? modelId : 9183,
              doorInstance.position,
              [0, r[0] + -1.5707963705062866, 0],
              server._doors
            );
          });
        });
        debug("All doors objects created");
    }
}
  