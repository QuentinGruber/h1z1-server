import { ZoneServer2016 } from "../zoneserver";
const Z1_doors = require("../../../../data/2016/zoneData/Z1_doors.json");
const Z1_items = require("../../../../data/2016/zoneData/Z1_items.json");
const Z1_vehicles = require("../../../../data/2016/zoneData/Z1_vehicleLocations.json");
const Z1_npcs = require("../../../../data/2016/zoneData/Z1_npcs.json");
const models = require("../../../../data/2016/dataSources/Models.json");
import { _, generateRandomGuid, isPosInRadius } from "../../../utils/utils";
import { Vehicle2016 as Vehicle } from "./../classes/vehicle";
const debug = require("debug")("ZoneServer");

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

function getRandomVehicleId() {
    switch (Math.floor(Math.random() * 4)) {
      case 0: // offroader
        return 7225;
      case 1: // policecar
        return 9301;
      case 2: // pickup
        return 9258;
      case 3: // atv
        return 9588;
      default:
        // pickup
        return 9258;
    }
}

export class WorldObjectManager {
    spawnedObjects: { [spawnerId: number]: string } = {};

    lastLootRespawnTime: number = 0;
    lastVehicleRespawnTime: number = 0;
    lastNpcRespawnTime: number = 0;
    lootRespawnTimer: number = 600000; // 10 minutes
    vehicleRespawnTimer: number = 600000; // 10 minutes // 600000
    npcRespawnTimer: number = 600000; // 10 minutes

    // objects won't spawn if another object is within this radius
    vehicleSpawnRadius: number = 50;
    npcSpawnRadius: number = 10;
    // only really used to check if another loot object is already spawned in the same exact spot
    lootSpawnRadius: number = 1; 

    chancePumpShotgun: number = 50;
    chanceAR15: number = 50;
    chanceTools: number = 50;
    chancePistols: number = 100;
    chanceM24: number = 50;
    chanceConsumables: number = 50;
    chanceClothes: number = 50;
    chanceResidential: number = 10;
    chanceRare: number = 10;
    chanceIndustrial: number = 10;
    chanceWorld: number = 10;
    chanceLog: number = 10;
    chanceCommercial: number = 10;
    chanceFarm: number = 10;
    chanceHospital: number = 50;
    chanceMilitary: number = 20;

    chanceNpc: number = 50;
    chanceScreamer: number = 5; // 1000 max

    constructor() {

    }

    createWorldObjects(server: ZoneServer2016) {
      this.createDoors(server);
      this.createVehicles(server);
      this.createNpcs(server);
      this.createLoot(server);
    }

    run(server: ZoneServer2016) {
      debug("WOM::Run")
        if(this.lastLootRespawnTime + this.lootRespawnTimer <= Date.now()) {
            this.createLoot(server);
            this.lastLootRespawnTime = Date.now();
        }
        if(this.lastNpcRespawnTime + this.npcRespawnTimer <= Date.now()) {
            this.createNpcs(server);
            this.lastNpcRespawnTime = Date.now();
        }
        if(this.lastVehicleRespawnTime + this.vehicleRespawnTimer <= Date.now()) {
            this.createVehicles(server);
            this.lastVehicleRespawnTime = Date.now();
        }
    }
    createEntity(// todo: clean this up
        server: ZoneServer2016,
        modelID: number,
        position: Array<number>,
        rotation: Array<number>,
        dictionary: any,
        itemSpawnerId: number = -1
      ): void {
        const guid = generateRandomGuid(),
        characterId = generateRandomGuid();
        dictionary[characterId] = {
          characterId: characterId,
          guid: guid,
          transientId: server.getTransientId(characterId),
          nameId: 0,
          modelId: modelID,
          position: position,
          rotation: rotation,
          headActor: getHeadActor(modelID),
          attachedObject: {},
          color: {},
          spawnerId: itemSpawnerId || 0
        };
        if(itemSpawnerId) this.spawnedObjects[itemSpawnerId] = characterId;
    }

    createDoors(server: ZoneServer2016): void {
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
        debug("All door objects created");
    }

    createVehicles(server: ZoneServer2016) {
        Z1_vehicles.forEach((vehicle: any) => {
            let spawn = true;
            _.forEach(server._vehicles, (spawnedVehicle: Vehicle) => {
                if(isPosInRadius(
                    this.vehicleSpawnRadius, 
                    vehicle.position, 
                    spawnedVehicle.npcData.position)
                ) spawn = false; return; 
            })
          if(!spawn) return;
          const characterId = generateRandomGuid();
          const vehicleData = new Vehicle(
            server._worldId,
            characterId,
            server.getTransientId(characterId),
            getRandomVehicleId(),
            new Float32Array(vehicle.position),
            new Float32Array(vehicle.rotation),
            server.getGameTime()
          );
          server._vehicles[characterId] = vehicleData; // save vehicle
        });
        debug("All vehicles created");
    }

    createNpcs(server: ZoneServer2016) {
        // This is only for giving the world some life
        Z1_npcs.forEach((spawnerType: any) => {
          const authorizedModelId: number[] = [];
          switch (spawnerType.actorDefinition) {
            case "NPCSpawner_ZombieLazy.adr":
              authorizedModelId.push(9510);
              authorizedModelId.push(9634);
              break;
            case "NPCSpawner_ZombieWalker.adr":
              authorizedModelId.push(9510);
              authorizedModelId.push(9634);
              break;
            case "NPCSpawner_Deer001.adr":
              authorizedModelId.push(9002);
              break;
            default:
              break;
          }
          if (authorizedModelId.length) {
            let spawn = true;
            spawnerType.instances.forEach((npcInstance: any) => {
              _.forEach(server._npcs, (spawnedNpc: any) => {
                if(isPosInRadius(
                    this.npcSpawnRadius, 
                    npcInstance.position, 
                    spawnedNpc.position)
                  )  spawn = false; return; 
              })
              if(!spawn) return;
              const spawnchance = Math.floor(Math.random() * 100) + 1; // temporary spawnchance
              if (spawnchance <= this.chanceNpc) {
                const screamerChance = Math.floor(Math.random() * 1000) + 1; // temporary spawnchance
                if (screamerChance <= this.chanceScreamer) {
                  authorizedModelId.push(9667);
                }
                const r = npcInstance.rotation;
                this.createEntity(
                  server,
                  authorizedModelId[
                    Math.floor(Math.random() * authorizedModelId.length)
                  ],
                  npcInstance.position,
                  [0, r[0], 0],
                  server._npcs
                );
              }
            });
          }
        });
        debug("All npcs objects created");
      }

    createLoot(server: ZoneServer2016) {
        Z1_items.forEach((spawnerType: any) => {
            this.createAR15(server, spawnerType);
            this.createPumpShotgun(server, spawnerType);
            this.createTools(server, spawnerType);
            this.createPistols(server, spawnerType);
            this.createM24(server, spawnerType);
            this.createConsumables(server, spawnerType);
            this.createClothes(server, spawnerType);
            this.createResidential(server, spawnerType);
            this.createRare(server, spawnerType);
            this.createIndustrial(server, spawnerType);
            this.createWorld(server, spawnerType);
            this.createLog(server, spawnerType);
            this.createCommercial(server, spawnerType);
            this.createFarm(server, spawnerType);
            this.createHospital(server, spawnerType);
            this.createMilitary(server, spawnerType);
        });
        debug(`WOM: AR15 and ammo items objects created. Spawnrate: ${this.chanceAR15}%`);
        debug(`WOM: PumpShotgun and ammo items objects created. Spawnrate: ${this.chancePumpShotgun}%`);
        debug(`WOM: Tools items objects created. Spawnrate: ${this.chanceTools}%`);
        debug(`WOM: 1911, M9, 380 and ammo items objects created. Spawnrate: ${this.chancePistols}%`);
        debug(`WOM: 308Rifle and ammo items objects created. Spawnrate: ${this.chanceM24}%`);
        debug(`WOM: Consumable items objects created. Spawnrate: ${this.chanceConsumables}%`);
        debug(`WOM: Clothes items objects created. Spawnrate: ${this.chanceClothes}%`);
        debug(`WOM: Residential Areas items objects created. Spawnrate: ${this.chanceResidential}%`);
        debug(`WOM: Rare items objects created. Spawnrate: ${this.chanceRare}%`);
        debug(`WOM: Industrial Areas items objects created. Spawnrate: ${this.chanceIndustrial}%`);
        debug(`WOM: World Areas items objects created. Spawnrate: ${this.chanceWorld}%`);
        debug(`WOM: Log Areas items objects created. Spawnrate: ${this.chanceWorld}%`);
        debug(`WOM: Commercial Areas items objects created. Spawnrate: ${this.chanceCommercial}%`);
        debug(`WOM: Farm Areas items objects created. Spawnrate: ${this.chanceFarm}%`);
        debug(`WOM: Hospital objects created. Spawnrate: ${this.chanceHospital}%`);
        debug(`WOM: Military objects created. Spawnrate: ${this.chanceMilitary}%`);
    }

    createAR15(server: ZoneServer2016, spawnerType: any) {
        const authorizedModelId: number[] = [];
        switch (spawnerType.actorDefinition) {
          case "ItemSpawner_Weapon_M16A4.adr":
            authorizedModelId.push(23);
            break;
          case "ItemSpawner_AmmoBox02_M16A4.adr":
            authorizedModelId.push(10);
            break;
          case "ItemSpawner_AmmoBox02.adr":
            authorizedModelId.push(10);
            break;
          default:
            break;
        }
        if (authorizedModelId.length) {
          spawnerType.instances.forEach((itemInstance: any) => {
            if(this.spawnedObjects[itemInstance.id]) return;
            const chance = Math.floor(Math.random() * 100) + 1; // temporary spawnchance
            if (chance <= this.chanceAR15) {
              // temporary spawnchance
              const r = itemInstance.rotation;
              this.createEntity(
                server,
                authorizedModelId[
                  Math.floor(Math.random() * authorizedModelId.length)
                ],
                itemInstance.position,
                [r[1], r[0], r[2]],
                server._objects,
                itemInstance.id
              );
            }
          });
        }
    }
    createPumpShotgun(server: ZoneServer2016, spawnerType: any) {
        const authorizedModelId: number[] = [];
        switch (spawnerType.actorDefinition) {
          case "ItemSpawner_Weapon_PumpShotgun01.adr":
            authorizedModelId.push(9286);
            break;
          case "ItemSpawner_AmmoBox02_12GaShotgun.adr":
            authorizedModelId.push(8023);
            break;
          default:
            break;
        }
        if (authorizedModelId.length) {
          spawnerType.instances.forEach((itemInstance: any) => {
            if(this.spawnedObjects[itemInstance.id]) return;
            const chance = Math.floor(Math.random() * 100) + 1; // temporary spawnchance
            if (chance <= this.chancePumpShotgun) {
              // temporary spawnchance
              const r = itemInstance.rotation;
              this.createEntity(
                server,
                authorizedModelId[
                  Math.floor(Math.random() * authorizedModelId.length)
                ],
                itemInstance.position,
                [r[1], r[0], r[2]],
                server._objects,
                itemInstance.id
              );
            }
          });
        }
    }
    
    createTools(server: ZoneServer2016, spawnerType: any) {
        const authorizedModelId: number[] = [];
        switch (spawnerType.actorDefinition) {
          case "ItemSpawner_Weapon_Crowbar01.adr":
            authorizedModelId.push(18);
            break;
          case "ItemSpawner_Weapon_CombatKnife01.adr":
            authorizedModelId.push(21);
            break;
          case "ItemSpawner_Weapon_Machete01.adr":
            authorizedModelId.push(24);
            authorizedModelId.push(9695); // katana
            break;
          case "ItemSpawner_Weapon_Bat01.adr":
            authorizedModelId.push(42);
            break;
          case "ItemSpawner_BackpackOnGround001.adr":
            authorizedModelId.push(9093);
            break;
          case "ItemSpawner_GasCan01.adr":
            authorizedModelId.push(9135);
            break;
          case "ItemSpawner_Weapon_Guitar01.adr":
            authorizedModelId.push(9318);
            break;
          case "ItemSpawner_Weapon_WoodAxe01.adr":
            authorizedModelId.push(27);
            break;
          case "ItemSpawner_Weapon_FireAxe01.adr":
            authorizedModelId.push(9325);
            break;
          case "ItemSpawner_Weapon_ClawHammer01.adr":
            authorizedModelId.push(9252);
            break;
          case "ItemSpawner_Weapon_Hatchet01.adr":
            authorizedModelId.push(22);
            break;
          case "ItemSpawner_Weapon_Pipe01.adr":
            authorizedModelId.push(9209);
            break;
          case "ItemSpawner_Weapon_Bat02.adr":
            authorizedModelId.push(9313);
            break;
          case "ItemSpawner_Weapon_Bow.adr":
            authorizedModelId.push(9162);
            authorizedModelId.push(9214);
            authorizedModelId.push(9398);
            authorizedModelId.push(9420); // recurve
            break;
          default:
            break;
        }
        if (authorizedModelId.length) {
          spawnerType.instances.forEach((itemInstance: any) => {
            if(this.spawnedObjects[itemInstance.id]) return;
            const chance = Math.floor(Math.random() * 100) + 1; // temporary spawnchance
            if (chance <= this.chanceTools) {
              // temporary spawnchance
              const r = itemInstance.rotation;
              this.createEntity(
                server,
                authorizedModelId[
                  Math.floor(Math.random() * authorizedModelId.length)
                ],
                itemInstance.position,
                [r[1], r[0], r[2]],
                server._objects,
                itemInstance.id
              );
            }
          });
        }
    }
    
    createPistols(server: ZoneServer2016, spawnerType: any) {
        const authorizedModelId: number[] = [];
        switch (spawnerType.actorDefinition) {
          case "ItemSpawner_Weapon_45Auto.adr":
            authorizedModelId.push(17);
            break;
          case "ItemSpawner_Weapon_M9Auto.adr":
            authorizedModelId.push(9423);
            break;
          case "ItemSpawner_AmmoBox02_1911.adr":
            authorizedModelId.push(10);
            break;
          default:
            break;
        }
        if (authorizedModelId.length) {
          spawnerType.instances.forEach((itemInstance: any) => {
            if(this.spawnedObjects[itemInstance.id]) return;
            const chance = Math.floor(Math.random() * 100) + 1; // temporary spawnchance
            if (chance <= this.chancePistols) {
              // temporary spawnchance
              const r = itemInstance.rotation;
              this.createEntity(
                server,
                authorizedModelId[
                  Math.floor(Math.random() * authorizedModelId.length)
                ],
                itemInstance.position,
                [r[1], r[0], r[2]],
                server._objects,
                itemInstance.id
              );
            }
          });
        }
    }
    
    createM24(server: ZoneServer2016, spawnerType: any) {
        const authorizedModelId: number[] = [];
        switch (spawnerType.actorDefinition) {
          case "ItemSpawner_Weapon_M24.adr":
            authorizedModelId.push(9204);
            break;
          case "ItemSpawner_AmmoBox02_308Rifle.adr":
            authorizedModelId.push(9287);
            break;
          default:
            break;
        }
        if (authorizedModelId.length) {
          spawnerType.instances.forEach((itemInstance: any) => {
            if(this.spawnedObjects[itemInstance.id]) return;
            const chance = Math.floor(Math.random() * 100) + 1; // temporary spawnchance
            if (chance <= this.chanceM24) {
              // temporary spawnchance
              const r = itemInstance.rotation;
              this.createEntity(
                server,
                authorizedModelId[
                  Math.floor(Math.random() * authorizedModelId.length)
                ],
                itemInstance.position,
                [r[1], r[0], r[2]],
                server._objects,
                itemInstance.id
              );
            }
          });
        }
    }
    
    createConsumables(server: ZoneServer2016, spawnerType: any) {
        const authorizedModelId: number[] = [];
        switch (spawnerType.actorDefinition) {
          case "ItemSpawner_FirstAidKit.adr":
            authorizedModelId.push(9221);
            break;
          case "ItemSpawner_CannedFood.adr":
            authorizedModelId.push(7);
            authorizedModelId.push(8020);
            break;
          case "ItemSpawner_WaterContainer_Small_Purified.adr":
            authorizedModelId.push(9159);
            break;
          default:
            break;
        }
        if (authorizedModelId.length) {
          spawnerType.instances.forEach((itemInstance: any) => {
            if(this.spawnedObjects[itemInstance.id]) return;
            const chance = Math.floor(Math.random() * 100) + 1; // temporary spawnchance
            if (chance <= this.chanceConsumables) {
              // temporary spawnchance
              const r = itemInstance.rotation;
              this.createEntity(
                server,
                authorizedModelId[
                  Math.floor(Math.random() * authorizedModelId.length)
                ],
                itemInstance.position,
                [r[1], r[0], r[2]],
                server._objects,
                itemInstance.id
              );
            }
          });
        }
    }
    
    createClothes(server: ZoneServer2016, spawnerType: any) {
        const authorizedModelId: number[] = [];
        switch (spawnerType.actorDefinition) {
          case "ItemSpawner_Clothes_MotorcycleHelmet.adr":
            authorizedModelId.push(68);
            break;
          case "ItemSpawner_Clothes_BaseballCap.adr":
            authorizedModelId.push(66);
            break;
          case "ItemSpawner_Clothes_FoldedShirt.adr":
            authorizedModelId.push(9249); // shirt
            authorizedModelId.push(9736); // pants
            break;
          case "ItemSpawner_Clothes_Beanie.adr":
            authorizedModelId.push(67);
            break;
          default:
            break;
        }
        if (authorizedModelId.length) {
          spawnerType.instances.forEach((itemInstance: any) => {
            if(this.spawnedObjects[itemInstance.id]) return;
            const chance = Math.floor(Math.random() * 100) + 1; // temporary spawnchance
            if (chance <= this.chanceClothes) {
              // temporary spawnchance
              const r = itemInstance.rotation;
              this.createEntity(
                server,
                authorizedModelId[
                  Math.floor(Math.random() * authorizedModelId.length)
                ],
                itemInstance.position,
                [r[1], r[0], r[2]],
                server._objects,
                itemInstance.id
              );
            }
          });
        }
    }
    
    createResidential(server: ZoneServer2016, spawnerType: any) {
        const authorizedModelId: number[] = [];
        switch (spawnerType.actorDefinition) {
          case "ItemSpawnerResidential_Tier00.adr":
            authorizedModelId.push(9064);
            authorizedModelId.push(9249); // shirt
            authorizedModelId.push(9736); // pants
            authorizedModelId.push(70);
            authorizedModelId.push(21);
            authorizedModelId.push(66);
            authorizedModelId.push(67);
            authorizedModelId.push(68);
            authorizedModelId.push(8020);
            authorizedModelId.push(9065);
            authorizedModelId.push(9039);
            authorizedModelId.push(9182);
            authorizedModelId.push(9156);
            authorizedModelId.push(9159);
            authorizedModelId.push(10);
            authorizedModelId.push(72);
            authorizedModelId.push(9163);
            authorizedModelId.push(9250);
            authorizedModelId.push(9221);
            authorizedModelId.push(9199);
            authorizedModelId.push(9313);
            break;
          default:
            break;
        }
        if (authorizedModelId.length) {
          spawnerType.instances.forEach((itemInstance: any) => {
            if(this.spawnedObjects[itemInstance.id]) return;
            const chance = Math.floor(Math.random() * 100) + 1; // temporary spawnchance
            if (chance <= this.chanceResidential) {
              // temporary spawnchance
              const r = itemInstance.rotation;
              this.createEntity(
                server,
                authorizedModelId[
                  Math.floor(Math.random() * authorizedModelId.length)
                ],
                itemInstance.position,
                [r[1], r[0], r[2]],
                server._objects,
                itemInstance.id
              );
            }
          });
        }
    }
    
    createRare(server: ZoneServer2016, spawnerType: any) {
        const authorizedModelId: number[] = [];
        switch (spawnerType.actorDefinition) {
          case "ItemSpawnerRare_Tier00.adr":
            authorizedModelId.push(10);
            authorizedModelId.push(9287);
            authorizedModelId.push(8023);
            authorizedModelId.push(17);
            authorizedModelId.push(9204);
            authorizedModelId.push(9286);
            authorizedModelId.push(23);
            break;
          default:
            break;
        }
        if (authorizedModelId.length) {
          spawnerType.instances.forEach((itemInstance: any) => {
            if(this.spawnedObjects[itemInstance.id]) return;
            const chance = Math.floor(Math.random() * 100) + 1; // temporary spawnchance
            if (chance <= this.chanceRare) {
              // temporary spawnchance
              const r = itemInstance.rotation;
              this.createEntity(
                server,
                authorizedModelId[
                  Math.floor(Math.random() * authorizedModelId.length)
                ],
                itemInstance.position,
                [r[1], r[0], r[2]],
                server._objects,
                itemInstance.id
              );
            }
          });
        }
    }
    
    createIndustrial(server: ZoneServer2016, spawnerType: any) {
        const authorizedModelId: number[] = [];
        switch (spawnerType.actorDefinition) {
          case "ItemSpawnerIndustrial_Tier00.adr":
            authorizedModelId.push(70);
            authorizedModelId.push(71);
            authorizedModelId.push(72);
            authorizedModelId.push(73);
            authorizedModelId.push(9156);
            authorizedModelId.push(64);
            authorizedModelId.push(11);
            authorizedModelId.push(30);
            authorizedModelId.push(9209);
            authorizedModelId.push(27);
            authorizedModelId.push(54);
            break;
          default:
            break;
        }
        if (authorizedModelId.length) {
          spawnerType.instances.forEach((itemInstance: any) => {
            if(this.spawnedObjects[itemInstance.id]) return;
            const chance = Math.floor(Math.random() * 100) + 1; // temporary spawnchance
            if (chance <= this.chanceIndustrial) {
              // temporary spawnchance
              const r = itemInstance.rotation;
              this.createEntity(
                server,
                authorizedModelId[
                  Math.floor(Math.random() * authorizedModelId.length)
                ],
                itemInstance.position,
                [r[1], r[0], r[2]],
                server._objects,
                itemInstance.id
              );
            }
          });
        }
    }
    
    createWorld(server: ZoneServer2016, spawnerType: any) {
        const authorizedModelId: number[] = [];
        switch (spawnerType.actorDefinition) {
          case "ItemSpawnerWorld_Tier00.adr":
            authorizedModelId.push(24);
            authorizedModelId.push(9156);
            authorizedModelId.push(9159);
            authorizedModelId.push(9249); // shirt
            authorizedModelId.push(9736); // pants
            authorizedModelId.push(9250);
            authorizedModelId.push(22);
            authorizedModelId.push(66);
            authorizedModelId.push(67);
            authorizedModelId.push(68);
            authorizedModelId.push(8020);
            break;
          default:
            break;
        }
        if (authorizedModelId.length) {
          spawnerType.instances.forEach((itemInstance: any) => {
            if(this.spawnedObjects[itemInstance.id]) return;
            const chance = Math.floor(Math.random() * 100) + 1; // temporary spawnchance
            if (chance <= this.chanceWorld) {
              // temporary spawnchance
              const r = itemInstance.rotation;
              this.createEntity(
                server,
                authorizedModelId[
                  Math.floor(Math.random() * authorizedModelId.length)
                ],
                itemInstance.position,
                [r[1], r[0], r[2]],
                server._objects,
                itemInstance.id
              );
            }
          });
        }
    }
    
    createLog(server: ZoneServer2016, spawnerType: any) {
        const authorizedModelId: number[] = [];
        switch (spawnerType.actorDefinition) {
          case "ItemSpawner_Log01.adr":
            authorizedModelId.push(9043);
            authorizedModelId.push(64);
            authorizedModelId.push(65);
            break;
          default:
            break;
        }
        if (authorizedModelId.length) {
          spawnerType.instances.forEach((itemInstance: any) => {
            if(this.spawnedObjects[itemInstance.id]) return;
            const chance = Math.floor(Math.random() * 100) + 1; // temporary spawnchance
            if (chance <= this.chanceLog) {
              // temporary spawnchance
              const r = itemInstance.rotation;
              this.createEntity(
                server,
                authorizedModelId[
                  Math.floor(Math.random() * authorizedModelId.length)
                ],
                itemInstance.position,
                [r[1], r[0], r[2]],
                server._objects,
                itemInstance.id
              );
            }
          });
        }
    }
    
    createCommercial(server: ZoneServer2016, spawnerType: any) {
        const authorizedModelId: number[] = [];
        switch (spawnerType.actorDefinition) {
          case "ItemSpawnerCommercial_Tier00.adr":
            authorizedModelId.push(70);
            authorizedModelId.push(72);
            authorizedModelId.push(9159);
            authorizedModelId.push(9156);
            authorizedModelId.push(68);
            authorizedModelId.push(9064);
            authorizedModelId.push(9065);
            authorizedModelId.push(8020);
            break;
          default:
            break;
        }
        if (authorizedModelId.length) {
          spawnerType.instances.forEach((itemInstance: any) => {
            if(this.spawnedObjects[itemInstance.id]) return;
            const chance = Math.floor(Math.random() * 100) + 1; // temporary spawnchance
            if (chance <= this.chanceCommercial) {
              // temporary spawnchance
              const r = itemInstance.rotation;
              this.createEntity(
                server,
                authorizedModelId[
                  Math.floor(Math.random() * authorizedModelId.length)
                ],
                itemInstance.position,
                [r[1], r[0], r[2]],
                server._objects,
                itemInstance.id
              );
            }
          });
        }
    }
    
    createFarm(server: ZoneServer2016, spawnerType: any) {
        const authorizedModelId: number[] = [];
        switch (spawnerType.actorDefinition) {
          case "ItemSpawnerFarm.adr":
            authorizedModelId.push(15);
            authorizedModelId.push(27);
            authorizedModelId.push(9163);
            authorizedModelId.push(22);
            authorizedModelId.push(9156);
            break;
          default:
            break;
        }
        if (authorizedModelId.length) {
          spawnerType.instances.forEach((itemInstance: any) => {
            if(this.spawnedObjects[itemInstance.id]) return;
            const chance = Math.floor(Math.random() * 100) + 1; // temporary spawnchance
            if (chance <= this.chanceFarm) {
              // temporary spawnchance
              const r = itemInstance.rotation;
              this.createEntity(
                server,
                authorizedModelId[
                  Math.floor(Math.random() * authorizedModelId.length)
                ],
                itemInstance.position,
                [r[1], r[0], r[2]],
                server._objects,
                itemInstance.id
              );
            }
          });
        }
    }
    createHospital(server: ZoneServer2016, spawnerType: any) {
        const authorizedModelId: number[] = [];
        switch (spawnerType.actorDefinition) {
          case "ItemSpawnerHospital.adr":
            authorizedModelId.push(9221); // medkit
            authorizedModelId.push(9250); // mre
            authorizedModelId.push(9066); // bandage
            authorizedModelId.push(9543); // vial
            authorizedModelId.push(9540); // syringe
            authorizedModelId.push(9249); // shirt
            authorizedModelId.push(9736); // pants
            authorizedModelId.push(9296); // water bottle
            authorizedModelId.push(9156); // empty bottle
            break;
          default:
            break;
        }
        if (authorizedModelId.length) {
          spawnerType.instances.forEach((itemInstance: any) => {
            if(this.spawnedObjects[itemInstance.id]) return;
            const chance = Math.floor(Math.random() * 100) + 1; // temporary spawnchance
            if (chance <= this.chanceHospital) {
              // temporary spawnchance
              const r = itemInstance.rotation;
              this.createEntity(
                server,
                authorizedModelId[
                  Math.floor(Math.random() * authorizedModelId.length)
                ],
                itemInstance.position,
                [r[1], r[0], r[2]],
                server._objects,
                itemInstance.id
              );
            }
          });
        }
    }
    createMilitary(server: ZoneServer2016, spawnerType: any) {
        const authorizedModelId: number[] = [];
        switch (spawnerType.actorDefinition) {
          case "ItemSpawner_Z1_MilitaryBase_Tents1.adr": // uncommon
            authorizedModelId.push(9202); // crossbow
            authorizedModelId.push(9422); // r380
            authorizedModelId.push(9249); // shirt, should be ghille suit when inventory works
            authorizedModelId.push(68); // motorcycle helmet
            authorizedModelId.push(9418); // tactical helmet
            authorizedModelId.push(9419); // respirator
            authorizedModelId.push(9221); // medkit
            authorizedModelId.push(10); // pistol ammo
            authorizedModelId.push(9445); // night vision goggles
            authorizedModelId.push(10); // ar-15 / ak-47 ammo
            authorizedModelId.push(9250); // mre
            break;
          case "ItemSpawner_Z1_MilitaryBase_Tents2.adr": // rare
            authorizedModelId.push(9449); // molotov
            authorizedModelId.push(9483); // magnum
            authorizedModelId.push(8023); // shotgun ammo
            authorizedModelId.push(9287); // 308 ammo
            authorizedModelId.push(16); // gunpowder
            authorizedModelId.push(9391); // bag (landmine)
            authorizedModelId.push(9583); // kevlar
            break;
          case "ItemSpawner_Z1_MilitaryBase_MotorPool.adr": // common
            authorizedModelId.push(9199); // binoculars
            authorizedModelId.push(21); // combat knife
            authorizedModelId.push(25); // flare
            authorizedModelId.push(30); // scrap
            authorizedModelId.push(9391); // bag (cloth)
            authorizedModelId.push(58); // flashlight
            authorizedModelId.push(54); // tarp
            authorizedModelId.push(9250); // mre
            break;
          case "ItemSpawner_Z1_MilitaryBase_Hangar.adr": // industrial
            authorizedModelId.push(30); // scrap
            authorizedModelId.push(11); // sheet metal
            authorizedModelId.push(12); // metal pipe
            authorizedModelId.push(18); // crowbar
            authorizedModelId.push(9252); // claw hammer
            authorizedModelId.push(9135); // gas can
            authorizedModelId.push(70); // battery
            authorizedModelId.push(71); // headlights
            authorizedModelId.push(72); // sparkplugs
            authorizedModelId.push(73); // turbocharger
            authorizedModelId.push(9393); // wrench
            break;
          case "ItemSpawner_Weapon_GrenadeSmoke.adr":
            authorizedModelId.push(9450);
            break;
          case "ItemSpawner_Weapon_GrenadeFlashbang.adr":
            authorizedModelId.push(9448);
            break;
          case "ItemSpawner_Weapon_GrenadeGas.adr":
            authorizedModelId.push(9479);
            break;
          case "ItemSpawner_Weapon_GrenadeHE.adr":
            authorizedModelId.push(9476);
            break;
          default:
            break;
        }
        if (authorizedModelId.length) {
          spawnerType.instances.forEach((itemInstance: any) => {
            if(this.spawnedObjects[itemInstance.id]) return;
            const chance = Math.floor(Math.random() * 100) + 1; // temporary spawnchance
            if (chance <= this.chanceMilitary) {
              // temporary spawnchance
              const r = itemInstance.rotation;
              this.createEntity(
                server,
                authorizedModelId[
                  Math.floor(Math.random() * authorizedModelId.length)
                ],
                itemInstance.position,
                [r[1], r[0], r[2]],
                server._objects,
                itemInstance.id
              );
            }
          });
        }
    }
}
  