// ======================================================================
//
//   GNU GENERAL PUBLIC LICENSE
//   Version 3, 29 June 2007
//   copyright (C) 2020 - 2021 Quentin Gruber
//   copyright (C) 2021 - 2022 H1emu community
//
//   https://github.com/QuentinGruber/h1z1-server
//   https://www.npmjs.com/package/h1z1-server
//
//   Based on https://github.com/psemu/soe-network
// ======================================================================

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
      return `ZombieFemale_Head_0${Math.floor(Math.random() * 2) + 1}.adr`;
    case 9634:
      return `ZombieMale_Head_0${Math.floor(Math.random() * 3) + 1}.adr`;
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
  vehicleSpawnCap: number = 100;

  lastLootRespawnTime: number = 0;
  lastVehicleRespawnTime: number = 0;
  lastNpcRespawnTime: number = 0;
  lootRespawnTimer: number = 600000; // 10 minutes
  vehicleRespawnTimer: number = 600000; // 10 minutes // 600000
  npcRespawnTimer: number = 600000; // 10 minutes

  // objects won't spawn if another object is within this radius
  vehicleSpawnRadius: number = 50;
  npcSpawnRadius: number = 3;
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

  constructor() {}

  run(server: ZoneServer2016) {
    debug("WOM::Run");
    if (this.lastLootRespawnTime + this.lootRespawnTimer <= Date.now()) {
      this.createLoot(server);
      this.lastLootRespawnTime = Date.now();
    }
    if (this.lastNpcRespawnTime + this.npcRespawnTimer <= Date.now()) {
      this.createNpcs(server);
      this.lastNpcRespawnTime = Date.now();
    }
    if (this.lastVehicleRespawnTime + this.vehicleRespawnTimer <= Date.now()) {
      this.createVehicles(server);
      this.lastVehicleRespawnTime = Date.now();
    }
  }
  createEntity(
    // todo: clean this up
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
      spawnerId: itemSpawnerId || 0,
    };
    if (itemSpawnerId) this.spawnedObjects[itemSpawnerId] = characterId;
  }

  createLootEntity(
    // todo: clean this up
    server: ZoneServer2016,
    itemDefinitionId: number,
    position: Array<number>,
    rotation: Array<number>,
    itemSpawnerId: number = -1
  ): void {
    const itemDef = server.getItemDefinition(itemDefinitionId);
    if(!itemDef){
      debug(`[ERROR] Tried to createLootEntity for invalid itemDefId: ${itemDefinitionId}`)
      return;
    }
    if(!itemDef.WORLD_MODEL_ID){
      debug(`[ERROR] Tried to createLootEntity for itemDefId: ${itemDefinitionId} with no WORLD_MODEL_ID`)
      return;
    }
    const guid = generateRandomGuid(),
      characterId = generateRandomGuid();
    server._objects[characterId] = {
      characterId: characterId,
      guid: guid,
      transientId: server.getTransientId(characterId),
      modelId: itemDef.WORLD_MODEL_ID,
      position: position,
      rotation: rotation,
      spawnerId: itemSpawnerId || 0,
      itemGuid: server.generateItem(itemDefinitionId)
    };
    if (itemSpawnerId) this.spawnedObjects[itemSpawnerId] = characterId;
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
    if (Object.keys(server._vehicles).length >= this.vehicleSpawnCap) return;
    Z1_vehicles.forEach((vehicle: any) => {
      let spawn = true;
      _.forEach(server._vehicles, (spawnedVehicle: Vehicle) => {
        if (
          isPosInRadius(
            this.vehicleSpawnRadius,
            vehicle.position,
            spawnedVehicle.npcData.position
          )
        )
          spawn = false;
        return;
      });
      if (!spawn) return;
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
            if (
              isPosInRadius(
                this.npcSpawnRadius,
                npcInstance.position,
                spawnedNpc.position
              )
            )
              spawn = false;
            return;
          });
          if (!spawn) return;
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
    debug(
      `WOM: AR15 and ammo items objects created. Spawnrate: ${this.chanceAR15}%`
    );
    debug(
      `WOM: PumpShotgun and ammo items objects created. Spawnrate: ${this.chancePumpShotgun}%`
    );
    debug(`WOM: Tools items objects created. Spawnrate: ${this.chanceTools}%`);
    debug(
      `WOM: 1911, M9, 380 and ammo items objects created. Spawnrate: ${this.chancePistols}%`
    );
    debug(
      `WOM: 308Rifle and ammo items objects created. Spawnrate: ${this.chanceM24}%`
    );
    debug(
      `WOM: Consumable items objects created. Spawnrate: ${this.chanceConsumables}%`
    );
    debug(
      `WOM: Clothes items objects created. Spawnrate: ${this.chanceClothes}%`
    );
    debug(
      `WOM: Residential Areas items objects created. Spawnrate: ${this.chanceResidential}%`
    );
    debug(`WOM: Rare items objects created. Spawnrate: ${this.chanceRare}%`);
    debug(
      `WOM: Industrial Areas items objects created. Spawnrate: ${this.chanceIndustrial}%`
    );
    debug(
      `WOM: World Areas items objects created. Spawnrate: ${this.chanceWorld}%`
    );
    debug(
      `WOM: Log Areas items objects created. Spawnrate: ${this.chanceWorld}%`
    );
    debug(
      `WOM: Commercial Areas items objects created. Spawnrate: ${this.chanceCommercial}%`
    );
    debug(
      `WOM: Farm Areas items objects created. Spawnrate: ${this.chanceFarm}%`
    );
    debug(`WOM: Hospital objects created. Spawnrate: ${this.chanceHospital}%`);
    debug(`WOM: Military objects created. Spawnrate: ${this.chanceMilitary}%`);
  }

  createAR15(server: ZoneServer2016, spawnerType: any) {
    const authorizedItemDefIds: number[] = [];
    switch (spawnerType.actorDefinition) {
      case "ItemSpawner_Weapon_M16A4.adr":
        authorizedItemDefIds.push(2425);
        break;
      case "ItemSpawner_AmmoBox02_M16A4.adr":
        authorizedItemDefIds.push(1430);
        break;
      case "ItemSpawner_AmmoBox02.adr":
        authorizedItemDefIds.push(1430);
        break;
      default:
        break;
    }
    if (authorizedItemDefIds.length) {
      spawnerType.instances.forEach((itemInstance: any) => {
        if (this.spawnedObjects[itemInstance.id]) return;
        const chance = Math.floor(Math.random() * 100) + 1; // temporary spawnchance
        if (chance <= this.chanceAR15) {
          // temporary spawnchance
          const r = itemInstance.rotation;
          this.createLootEntity(
            server,
            authorizedItemDefIds[
              Math.floor(Math.random() * authorizedItemDefIds.length)
            ],
            itemInstance.position,
            [r[1], r[0], r[2]],
            itemInstance.id
          );
        }
      });
    }
  }
  createPumpShotgun(server: ZoneServer2016, spawnerType: any) {
    const authorizedItemDefIds: number[] = [];
    switch (spawnerType.actorDefinition) {
      case "ItemSpawner_Weapon_PumpShotgun01.adr":
        authorizedItemDefIds.push(2663);
        break;
      case "ItemSpawner_AmmoBox02_12GaShotgun.adr":
        authorizedItemDefIds.push(1511);
        break;
      default:
        break;
    }
    if (authorizedItemDefIds.length) {
      spawnerType.instances.forEach((itemInstance: any) => {
        if (this.spawnedObjects[itemInstance.id]) return;
        const chance = Math.floor(Math.random() * 100) + 1; // temporary spawnchance
        if (chance <= this.chancePumpShotgun) {
          // temporary spawnchance
          const r = itemInstance.rotation;
          this.createLootEntity(
            server,
            authorizedItemDefIds[
              Math.floor(Math.random() * authorizedItemDefIds.length)
            ],
            itemInstance.position,
            [r[1], r[0], r[2]],
            itemInstance.id
          );
        }
      });
    }
  }

  createTools(server: ZoneServer2016, spawnerType: any) {
    const authorizedItemDefIds: number[] = [];
    switch (spawnerType.actorDefinition) {
      case "ItemSpawner_Weapon_Crowbar01.adr":
        authorizedItemDefIds.push(82);
        break;
      case "ItemSpawner_Weapon_CombatKnife01.adr":
        authorizedItemDefIds.push(84);
        break;
      case "ItemSpawner_Weapon_Machete01.adr":
        authorizedItemDefIds.push(83);
        authorizedItemDefIds.push(2961); // katana
        break;
      case "ItemSpawner_Weapon_Bat01.adr":
        authorizedItemDefIds.push(1721);
        break;
      case "ItemSpawner_BackpackOnGround001.adr":
        authorizedItemDefIds.push(1602);
        break;
      case "ItemSpawner_GasCan01.adr":
        authorizedItemDefIds.push(73);
        break;
      case "ItemSpawner_Weapon_Guitar01.adr":
        authorizedItemDefIds.push(1733);
        break;
      case "ItemSpawner_Weapon_WoodAxe01.adr":
        authorizedItemDefIds.push(58);
        break;
      case "ItemSpawner_Weapon_FireAxe01.adr":
        authorizedItemDefIds.push(1745);
        break;
      case "ItemSpawner_Weapon_ClawHammer01.adr":
        authorizedItemDefIds.push(1536);
        break;
      case "ItemSpawner_Weapon_Hatchet01.adr":
        authorizedItemDefIds.push(3);
        break;
      case "ItemSpawner_Weapon_Pipe01.adr":
        authorizedItemDefIds.push(1448);
        break;
      case "ItemSpawner_Weapon_Bat02.adr":
        authorizedItemDefIds.push(1724);
        break;
      case "ItemSpawner_Weapon_Bow.adr":
        authorizedItemDefIds.push(113);
        authorizedItemDefIds.push(1720);
        authorizedItemDefIds.push(1716);
        authorizedItemDefIds.push(1986); // recurve
        break;
      default:
        break;
    }
    if (authorizedItemDefIds.length) {
      spawnerType.instances.forEach((itemInstance: any) => {
        if (this.spawnedObjects[itemInstance.id]) return;
        const chance = Math.floor(Math.random() * 100) + 1; // temporary spawnchance
        if (chance <= this.chanceTools) {
          // temporary spawnchance
          const r = itemInstance.rotation;
          this.createLootEntity(
            server,
            authorizedItemDefIds[
              Math.floor(Math.random() * authorizedItemDefIds.length)
            ],
            itemInstance.position,
            [r[1], r[0], r[2]],
            itemInstance.id
          );
        }
      });
    }
  }

  createPistols(server: ZoneServer2016, spawnerType: any) {
    const authorizedItemDefIds: number[] = [];
    switch (spawnerType.actorDefinition) {
      case "ItemSpawner_Weapon_45Auto.adr":
        authorizedItemDefIds.push(2);
        break;
      case "ItemSpawner_Weapon_M9Auto.adr":
        authorizedItemDefIds.push(1997);
        break;
      case "ItemSpawner_AmmoBox02_1911.adr":
        authorizedItemDefIds.push(1428);//todo: find item spawner for m9 ammo
        break;
      default:
        break;
    }
    if (authorizedItemDefIds.length) {
      spawnerType.instances.forEach((itemInstance: any) => {
        if (this.spawnedObjects[itemInstance.id]) return;
        const chance = Math.floor(Math.random() * 100) + 1; // temporary spawnchance
        if (chance <= this.chancePistols) {
          // temporary spawnchance
          const r = itemInstance.rotation;
          this.createLootEntity(
            server,
            authorizedItemDefIds[
              Math.floor(Math.random() * authorizedItemDefIds.length)
            ],
            itemInstance.position,
            [r[1], r[0], r[2]],
            itemInstance.id
          );
        }
      });
    }
  }

  createM24(server: ZoneServer2016, spawnerType: any) {
    const authorizedItemDefIds: number[] = [];
    switch (spawnerType.actorDefinition) {
      case "ItemSpawner_Weapon_M24.adr":
        authorizedItemDefIds.push(1899);
        break;
      case "ItemSpawner_AmmoBox02_308Rifle.adr":
        authorizedItemDefIds.push(1469);
        break;
      default:
        break;
    }
    if (authorizedItemDefIds.length) {
      spawnerType.instances.forEach((itemInstance: any) => {
        if (this.spawnedObjects[itemInstance.id]) return;
        const chance = Math.floor(Math.random() * 100) + 1; // temporary spawnchance
        if (chance <= this.chanceM24) {
          // temporary spawnchance
          const r = itemInstance.rotation;
          this.createLootEntity(
            server,
            authorizedItemDefIds[
              Math.floor(Math.random() * authorizedItemDefIds.length)
            ],
            itemInstance.position,
            [r[1], r[0], r[2]],
            itemInstance.id
          );
        }
      });
    }
  }

  createConsumables(server: ZoneServer2016, spawnerType: any) {
    const authorizedItemDefIds: number[] = [];
    switch (spawnerType.actorDefinition) {
      case "ItemSpawner_FirstAidKit.adr":
        authorizedItemDefIds.push(2424);
        break;
      case "ItemSpawner_CannedFood.adr":
        authorizedItemDefIds.push(56);
        authorizedItemDefIds.push(7);
        break;
      case "ItemSpawner_WaterContainer_Small_Purified.adr":
        authorizedItemDefIds.push(1371);
        break;
      default:
        break;
    }
    if (authorizedItemDefIds.length) {
      spawnerType.instances.forEach((itemInstance: any) => {
        if (this.spawnedObjects[itemInstance.id]) return;
        const chance = Math.floor(Math.random() * 100) + 1; // temporary spawnchance
        if (chance <= this.chanceConsumables) {
          // temporary spawnchance
          const r = itemInstance.rotation;
          this.createLootEntity(
            server,
            authorizedItemDefIds[
              Math.floor(Math.random() * authorizedItemDefIds.length)
            ],
            itemInstance.position,
            [r[1], r[0], r[2]],
            itemInstance.id
          );
        }
      });
    }
  }

  createClothes(server: ZoneServer2016, spawnerType: any) {
    const authorizedItemDefIds: number[] = [];
    switch (spawnerType.actorDefinition) {
      case "ItemSpawner_Clothes_MotorcycleHelmet.adr":
        authorizedItemDefIds.push(2042);
        break;
      case "ItemSpawner_Clothes_BaseballCap.adr":
        authorizedItemDefIds.push(12);
        break;
      case "ItemSpawner_Clothes_FoldedShirt.adr":
        authorizedItemDefIds.push(92); // shirt
        authorizedItemDefIds.push(86); // pants
        break;
      case "ItemSpawner_Clothes_Beanie.adr":
        authorizedItemDefIds.push(2162);
        break;
      default:
        break;
    }
    if (authorizedItemDefIds.length) {
      spawnerType.instances.forEach((itemInstance: any) => {
        if (this.spawnedObjects[itemInstance.id]) return;
        const chance = Math.floor(Math.random() * 100) + 1; // temporary spawnchance
        if (chance <= this.chanceClothes) {
          // temporary spawnchance
          const r = itemInstance.rotation;
          this.createLootEntity(
            server,
            authorizedItemDefIds[
              Math.floor(Math.random() * authorizedItemDefIds.length)
            ],
            itemInstance.position,
            [r[1], r[0], r[2]],
            itemInstance.id
          );
        }
      });
    }
  }

  createResidential(server: ZoneServer2016, spawnerType: any) {
    const authorizedItemDefIds: number[] = [];
    switch (spawnerType.actorDefinition) {
      case "ItemSpawnerResidential_Tier00.adr":
        authorizedItemDefIds.push(57);
        authorizedItemDefIds.push(92); // shirt
        authorizedItemDefIds.push(86); // pants
        authorizedItemDefIds.push(1696);
        authorizedItemDefIds.push(84);
        authorizedItemDefIds.push(12);
        authorizedItemDefIds.push(2162);
        authorizedItemDefIds.push(2042);
        authorizedItemDefIds.push(7);
        authorizedItemDefIds.push(22);
        //authorizedModelId.push(9039); // can opener
        authorizedItemDefIds.push(1436);
        authorizedItemDefIds.push(1353);
        authorizedItemDefIds.push(1371);
        authorizedItemDefIds.push(1428);
        authorizedItemDefIds.push(1701);
        authorizedItemDefIds.push(106);
        authorizedItemDefIds.push(1402);
        authorizedItemDefIds.push(2424);
        authorizedItemDefIds.push(1542);
        authorizedItemDefIds.push(1724);
        break;
      default:
        break;
    }
    if (authorizedItemDefIds.length) {
      spawnerType.instances.forEach((itemInstance: any) => {
        if (this.spawnedObjects[itemInstance.id]) return;
        const chance = Math.floor(Math.random() * 100) + 1; // temporary spawnchance
        if (chance <= this.chanceResidential) {
          // temporary spawnchance
          const r = itemInstance.rotation;
          this.createLootEntity(
            server,
            authorizedItemDefIds[
              Math.floor(Math.random() * authorizedItemDefIds.length)
            ],
            itemInstance.position,
            [r[1], r[0], r[2]],
            itemInstance.id
          );
        }
      });
    }
  }

  createRare(server: ZoneServer2016, spawnerType: any) {
    const authorizedItemDefIds: number[] = [];
    switch (spawnerType.actorDefinition) {
      case "ItemSpawnerRare_Tier00.adr":
        authorizedItemDefIds.push(1428);
        authorizedItemDefIds.push(1469);
        authorizedItemDefIds.push(1511);
        authorizedItemDefIds.push(2);
        authorizedItemDefIds.push(1899);
        authorizedItemDefIds.push(1374);
        authorizedItemDefIds.push(2230);
        break;
      default:
        break;
    }
    if (authorizedItemDefIds.length) {
      spawnerType.instances.forEach((itemInstance: any) => {
        if (this.spawnedObjects[itemInstance.id]) return;
        const chance = Math.floor(Math.random() * 100) + 1; // temporary spawnchance
        if (chance <= this.chanceRare) {
          // temporary spawnchance
          const r = itemInstance.rotation;
          this.createLootEntity(
            server,
            authorizedItemDefIds[
              Math.floor(Math.random() * authorizedItemDefIds.length)
            ],
            itemInstance.position,
            [r[1], r[0], r[2]],
            itemInstance.id
          );
        }
      });
    }
  }

  createIndustrial(server: ZoneServer2016, spawnerType: any) {
    const authorizedItemDefIds: number[] = [];
    switch (spawnerType.actorDefinition) {
      case "ItemSpawnerIndustrial_Tier00.adr":
        authorizedItemDefIds.push(1696);
        authorizedItemDefIds.push(9);
        authorizedItemDefIds.push(1701);
        authorizedItemDefIds.push(90);
        authorizedItemDefIds.push(1353);
        authorizedItemDefIds.push(109);
        authorizedItemDefIds.push(46);
        authorizedItemDefIds.push(48);
        authorizedItemDefIds.push(1448);
        authorizedItemDefIds.push(58);
        authorizedItemDefIds.push(155);
        break;
      default:
        break;
    }
    if (authorizedItemDefIds.length) {
      spawnerType.instances.forEach((itemInstance: any) => {
        if (this.spawnedObjects[itemInstance.id]) return;
        const chance = Math.floor(Math.random() * 100) + 1; // temporary spawnchance
        if (chance <= this.chanceIndustrial) {
          // temporary spawnchance
          const r = itemInstance.rotation;
          this.createLootEntity(
            server,
            authorizedItemDefIds[
              Math.floor(Math.random() * authorizedItemDefIds.length)
            ],
            itemInstance.position,
            [r[1], r[0], r[2]],
            itemInstance.id
          );
        }
      });
    }
  }

  createWorld(server: ZoneServer2016, spawnerType: any) {
    const authorizedItemDefIds: number[] = [];
    switch (spawnerType.actorDefinition) {
      case "ItemSpawnerWorld_Tier00.adr":
        authorizedItemDefIds.push(83);
        authorizedItemDefIds.push(1353);
        authorizedItemDefIds.push(1371);
        authorizedItemDefIds.push(92); // shirt
        authorizedItemDefIds.push(86); // pants
        authorizedItemDefIds.push(1402);
        authorizedItemDefIds.push(3);
        authorizedItemDefIds.push(12);
        authorizedItemDefIds.push(2162);
        authorizedItemDefIds.push(2042);
        authorizedItemDefIds.push(7);
        break;
      default:
        break;
    }
    if (authorizedItemDefIds.length) {
      spawnerType.instances.forEach((itemInstance: any) => {
        if (this.spawnedObjects[itemInstance.id]) return;
        const chance = Math.floor(Math.random() * 100) + 1; // temporary spawnchance
        if (chance <= this.chanceWorld) {
          // temporary spawnchance
          const r = itemInstance.rotation;
          this.createLootEntity(
            server,
            authorizedItemDefIds[
              Math.floor(Math.random() * authorizedItemDefIds.length)
            ],
            itemInstance.position,
            [r[1], r[0], r[2]],
            itemInstance.id
          );
        }
      });
    }
  }

  createLog(server: ZoneServer2016, spawnerType: any) {
    const authorizedItemDefIds: number[] = [];
    switch (spawnerType.actorDefinition) {
      case "ItemSpawner_Log01.adr":
        authorizedItemDefIds.push(16);
        break;
      default:
        break;
    }
    if (authorizedItemDefIds.length) {
      spawnerType.instances.forEach((itemInstance: any) => {
        if (this.spawnedObjects[itemInstance.id]) return;
        const chance = Math.floor(Math.random() * 100) + 1; // temporary spawnchance
        if (chance <= this.chanceLog) {
          // temporary spawnchance
          const r = itemInstance.rotation;
          this.createLootEntity(
            server,
            authorizedItemDefIds[
              Math.floor(Math.random() * authorizedItemDefIds.length)
            ],
            itemInstance.position,
            [r[1], r[0], r[2]],
            itemInstance.id
          );
        }
      });
    }
  }

  createCommercial(server: ZoneServer2016, spawnerType: any) {
    const authorizedItemDefIds: number[] = [];
    switch (spawnerType.actorDefinition) {
      case "ItemSpawnerCommercial_Tier00.adr":
        authorizedItemDefIds.push(1696);
        authorizedItemDefIds.push(1701);
        authorizedItemDefIds.push(1353);
        authorizedItemDefIds.push(1353);
        authorizedItemDefIds.push(2042);
        authorizedItemDefIds.push(57);
        authorizedItemDefIds.push(22);
        authorizedItemDefIds.push(7);
        break;
      default:
        break;
    }
    if (authorizedItemDefIds.length) {
      spawnerType.instances.forEach((itemInstance: any) => {
        if (this.spawnedObjects[itemInstance.id]) return;
        const chance = Math.floor(Math.random() * 100) + 1; // temporary spawnchance
        if (chance <= this.chanceCommercial) {
          // temporary spawnchance
          const r = itemInstance.rotation;
          this.createLootEntity(
            server,
            authorizedItemDefIds[
              Math.floor(Math.random() * authorizedItemDefIds.length)
            ],
            itemInstance.position,
            [r[1], r[0], r[2]],
            itemInstance.id
          );
        }
      });
    }
  }

  createFarm(server: ZoneServer2016, spawnerType: any) {
    const authorizedItemDefIds: number[] = [];
    switch (spawnerType.actorDefinition) {
      case "ItemSpawnerFarm.adr":
        authorizedItemDefIds.push(25);
        authorizedItemDefIds.push(58);
        authorizedItemDefIds.push(106);
        authorizedItemDefIds.push(3);
        authorizedItemDefIds.push(1353);
        break;
      default:
        break;
    }
    if (authorizedItemDefIds.length) {
      spawnerType.instances.forEach((itemInstance: any) => {
        if (this.spawnedObjects[itemInstance.id]) return;
        const chance = Math.floor(Math.random() * 100) + 1; // temporary spawnchance
        if (chance <= this.chanceFarm) {
          // temporary spawnchance
          const r = itemInstance.rotation;
          this.createLootEntity(
            server,
            authorizedItemDefIds[
              Math.floor(Math.random() * authorizedItemDefIds.length)
            ],
            itemInstance.position,
            [r[1], r[0], r[2]],
            itemInstance.id
          );
        }
      });
    }
  }
  createHospital(server: ZoneServer2016, spawnerType: any) {
    const authorizedItemDefIds: number[] = [];
    switch (spawnerType.actorDefinition) {
      case "ItemSpawnerHospital.adr":
        authorizedItemDefIds.push(2424); // medkit
        authorizedItemDefIds.push(1402); // mre
        authorizedItemDefIds.push(2423); // bandage
        authorizedItemDefIds.push(2510); // vial
        authorizedItemDefIds.push(1508); // syringe
        authorizedItemDefIds.push(92); // shirt
        authorizedItemDefIds.push(86); // pants
        authorizedItemDefIds.push(2358); // water bottle
        authorizedItemDefIds.push(1353); // empty bottle
        break;
      default:
        break;
    }
    if (authorizedItemDefIds.length) {
      spawnerType.instances.forEach((itemInstance: any) => {
        if (this.spawnedObjects[itemInstance.id]) return;
        const chance = Math.floor(Math.random() * 100) + 1; // temporary spawnchance
        if (chance <= this.chanceHospital) {
          // temporary spawnchance
          const r = itemInstance.rotation;
          this.createLootEntity(
            server,
            authorizedItemDefIds[
              Math.floor(Math.random() * authorizedItemDefIds.length)
            ],
            itemInstance.position,
            [r[1], r[0], r[2]],
            itemInstance.id
          );
        }
      });
    }
  }
  createMilitary(server: ZoneServer2016, spawnerType: any) {
    const authorizedItemDefIds: number[] = [];
    switch (spawnerType.actorDefinition) {
      case "ItemSpawner_Z1_MilitaryBase_Tents1.adr": // uncommon
        authorizedItemDefIds.push(2246); // crossbow
        authorizedItemDefIds.push(1991); // r380
        authorizedItemDefIds.push(92); // shirt, should be ghille suit when inventory works
        authorizedItemDefIds.push(2042); // motorcycle helmet
        authorizedItemDefIds.push(2172); // tactical helmet
        authorizedItemDefIds.push(2148); // respirator
        authorizedItemDefIds.push(2424); // medkit
        //ammo
        authorizedItemDefIds.push(1428);
        authorizedItemDefIds.push(1429);
        authorizedItemDefIds.push(1430);
        authorizedItemDefIds.push(1992);
        authorizedItemDefIds.push(1998);
        authorizedItemDefIds.push(2325);

        authorizedItemDefIds.push(1700); // night vision goggles
        authorizedItemDefIds.push(1428); // ar-15 / ak-47 ammo
        authorizedItemDefIds.push(1402); // mre
        break;
      case "ItemSpawner_Z1_MilitaryBase_Tents2.adr": // rare
        authorizedItemDefIds.push(14); // molotov
        authorizedItemDefIds.push(1718); // magnum
        authorizedItemDefIds.push(1511); // shotgun ammo
        authorizedItemDefIds.push(1469); // 308 ammo
        authorizedItemDefIds.push(11); // gunpowder
        authorizedItemDefIds.push(74); // bag (landmine)
        authorizedItemDefIds.push(2271); // kevlar
        break;
      case "ItemSpawner_Z1_MilitaryBase_MotorPool.adr": // common
        authorizedItemDefIds.push(1542); // binoculars
        authorizedItemDefIds.push(84); // combat knife
        authorizedItemDefIds.push(1672); // flare
        authorizedItemDefIds.push(48); // scrap
        authorizedItemDefIds.push(74); // bag (cloth)
        authorizedItemDefIds.push(1380); // flashlight
        authorizedItemDefIds.push(155); // tarp
        authorizedItemDefIds.push(1402); // mre
        break;
      case "ItemSpawner_Z1_MilitaryBase_Hangar.adr": // industrial
        authorizedItemDefIds.push(48); // scrap
        authorizedItemDefIds.push(46); // sheet metal
        authorizedItemDefIds.push(47); // metal pipe
        authorizedItemDefIds.push(82); // crowbar
        authorizedItemDefIds.push(1536); // claw hammer
        authorizedItemDefIds.push(73); // gas can
        authorizedItemDefIds.push(1696); // battery
        //headlights
        authorizedItemDefIds.push(9);
        authorizedItemDefIds.push(1728);
        authorizedItemDefIds.push(1730);
        authorizedItemDefIds.push(2194);

        authorizedItemDefIds.push(1701); // sparkplugs
        // turbochargers
        authorizedItemDefIds.push(90);
        authorizedItemDefIds.push(1729);
        authorizedItemDefIds.push(1731);
        authorizedItemDefIds.push(2195);

        authorizedItemDefIds.push(1538); // wrench
        break;
      case "ItemSpawner_Weapon_GrenadeSmoke.adr":
        authorizedItemDefIds.push(2236);
        break;
      case "ItemSpawner_Weapon_GrenadeFlashbang.adr":
        authorizedItemDefIds.push(2235);
        break;
      case "ItemSpawner_Weapon_GrenadeGas.adr":
        authorizedItemDefIds.push(2237);
        break;
      case "ItemSpawner_Weapon_GrenadeHE.adr":
        authorizedItemDefIds.push(2243);
        break;
      default:
        break;
    }
    if (authorizedItemDefIds.length) {
      spawnerType.instances.forEach((itemInstance: any) => {
        if (this.spawnedObjects[itemInstance.id]) return;
        const chance = Math.floor(Math.random() * 100) + 1; // temporary spawnchance
        if (chance <= this.chanceMilitary) {
          // temporary spawnchance
          const r = itemInstance.rotation;
          this.createLootEntity(
            server,
            authorizedItemDefIds[
              Math.floor(Math.random() * authorizedItemDefIds.length)
            ],
            itemInstance.position,
            [r[1], r[0], r[2]],
            itemInstance.id
          );
        }
      });
    }
  }
}
