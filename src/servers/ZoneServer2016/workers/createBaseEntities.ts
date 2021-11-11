const debug = require("debug")("baseEntityCreator");
const Z1_vehicles = require("../../../../data/2016/zoneData/Z1_vehicleLocations.json");
const Z1_items = require("../../../../data/2016/zoneData/Z1_items.json");
const Z1_doors = require("../../../../data/2016/zoneData/Z1_doors.json");
const Z1_npcs = require("../../../../data/2016/zoneData/Z1_npcs.json");
const models = require("../../../../data/2016/dataSources/Models.json");
const modelToName = require("../../../../data/2016/dataSources/ModelToName.json");
import { _, generateRandomGuid } from "../../../utils/utils";
import { ZoneServer2016 } from "../zoneserver";
import { Vehicle2016 as Vehicle } from "./../classes/vehicle"

const npcs: any = {};
const objects: any = {};
const vehicles: any = {};
const doors: any = {};

const chancePumpShotgun = 50;
const chanceAR15 = 50;
const chanceTools = 50;
const chancePistols = 100;
const chanceM24 = 50;
const chanceConsumables = 50;
const chanceClothes = 50;
const chanceResidential = 10;
const chanceRare = 10;
const chanceIndustrial = 10;
const chanceWorld = 10;
const chanceLog = 10;
const chanceCommercial = 10;
const chanceFarm = 10;
const chanceHospital = 50;
const chanceMilitary = 20;

const chanceNpc = 50;
const chanceScreamer = 5; // 1000 max

let numberOfSpawnedEntity = 0;

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

function createEntity(
  server: ZoneServer2016,
  modelID: number,
  position: Array<number>,
  rotation: Array<number>,
  dictionnary: any
): void {
  let stringNameId = 0;
  modelToName.forEach((spawnername: any) => {
    if (modelID === spawnername.modelId) {
      stringNameId = spawnername.NameId;
    }
  });

  const guid = generateRandomGuid();
  const characterId = generateRandomGuid();
  numberOfSpawnedEntity++;
  if (numberOfSpawnedEntity > 30000) {
    numberOfSpawnedEntity = 1;
  }
  server._transientIds[numberOfSpawnedEntity] = characterId;
  dictionnary[characterId] = {
    characterId: characterId,
    guid: guid,
    transientId: numberOfSpawnedEntity,
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

export function createAllEntities(server: ZoneServer2016): any {
  createAllDoors(server);
  createAR15(server);
  createPumpShotgun(server);
  createTools(server);
  createPistols(server);
  createM24(server);
  createConsumables(server);
  createClothes(server);
  createResidential(server);
  createRare(server);
  createIndustrial(server);
  createWorld(server);
  createLog(server);
  createCommercial(server);
  createFarm(server);
  createHospital(server);
  createMilitary(server);

  createAllVehicles(server);
  createSomeNpcs(server);
  delete require.cache[require.resolve("../../../../data/2016/zoneData/Z1_vehicleLocations.json")];
  delete require.cache[require.resolve("../../../../data/2016/zoneData/Z1_items.json")];
  delete require.cache[require.resolve("../../../../data/2016/zoneData/Z1_doors.json")];
  delete require.cache[require.resolve("../../../../data/2016/zoneData/Z1_npcs.json")];
  return { npcs: npcs, objects: objects, vehicles: vehicles, doors: doors };
}

function getRandomVehicleId() {
  switch (Math.floor(Math.random() * 4)) {
    case 0: // offroader
      return { modelId: 7225, vehicleId: 1 };
    case 1: // policecar
      return { modelId: 9301, vehicleId: 3 };
    case 2: // pickup
      return { modelId: 9258, vehicleId: 2 };
    case 3: // atv
      return { modelId: 9588, vehicleId: 5 };
    default:
      // pickup
      return { modelId: 9258, vehicleId: 2 };
  }
}

function createAllVehicles(server: ZoneServer2016) {
  Z1_vehicles.forEach((vehicle: any) => {
    const characterId = generateRandomGuid();
    const v = getRandomVehicleId();
    numberOfSpawnedEntity++;
    server._transientIds[numberOfSpawnedEntity] = characterId;
    const vehicleData = new Vehicle(
      server._worldId, 
      characterId, 
      numberOfSpawnedEntity, 
      v.modelId, 
      vehicle.position, 
      vehicle.rotation,
      server.getGameTime()
    )
    vehicles[characterId] = vehicleData; // save vehicle
  });
  debug("All vehicles created");
}

function createSomeNpcs(server: ZoneServer2016) {
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
      spawnerType.instances.forEach((itemInstance: any) => {
        const spawnchance = Math.floor(Math.random() * 100) + 1; // temporary spawnchance
        if (spawnchance <= chanceNpc) {
          const screamerChance = Math.floor(Math.random() * 1000) + 1; // temporary spawnchance
          if (screamerChance <= chanceScreamer) {
            authorizedModelId.push(9667);
          }
          const r = itemInstance.rotation;
          createEntity(
            server,
            authorizedModelId[
              Math.floor(Math.random() * authorizedModelId.length)
            ],
            itemInstance.position,
            [0, r[0], 0],
            npcs
          );
        }
      });
    }
  });
  debug("All npcs objects created");
}

function createMilitary(server: ZoneServer2016) {
  Z1_items.forEach((spawnerType: any) => {
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
        const chance = Math.floor(Math.random() * 100) + 1; // temporary spawnchance
        if (chance <= chanceMilitary) {
          // temporary spawnchance
          const r = itemInstance.rotation;
          createEntity(
            server,
            authorizedModelId[
              Math.floor(Math.random() * authorizedModelId.length)
            ],
            itemInstance.position,
            //itemInstance.rotation,
            [r[1], r[0], r[2]],
            objects
          );
        }
      });
    }
  });
  debug("Military objects created. Spawnrate:" + chanceMilitary + "%");
}

function createHospital(server: ZoneServer2016) {
  Z1_items.forEach((spawnerType: any) => {
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
        const chance = Math.floor(Math.random() * 100) + 1; // temporary spawnchance
        if (chance <= chanceHospital) {
          // temporary spawnchance
          const r = itemInstance.rotation;
          createEntity(
            server,
            authorizedModelId[
              Math.floor(Math.random() * authorizedModelId.length)
            ],
            itemInstance.position,
            //itemInstance.rotation,
            [r[1], r[0], r[2]],
            objects
          );
        }
      });
    }
  });
  debug("Hospital objects created. Spawnrate:" + chanceHospital + "%");
}

function createAR15(server: ZoneServer2016) {
  Z1_items.forEach((spawnerType: any) => {
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
        const chance = Math.floor(Math.random() * 100) + 1; // temporary spawnchance
        if (chance <= chanceAR15) {
          // temporary spawnchance
          const r = itemInstance.rotation;
          createEntity(
            server,
            authorizedModelId[
              Math.floor(Math.random() * authorizedModelId.length)
            ],
            itemInstance.position,
            //itemInstance.rotation,
            [r[1], r[0], r[2]],
            objects
          );
        }
      });
    }
  });
  debug("AR15 and ammo items objects created. Spawnrate:" + chanceAR15 + "%");
}

function createPumpShotgun(server: ZoneServer2016) {
  Z1_items.forEach((spawnerType: any) => {
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
        const chance = Math.floor(Math.random() * 100) + 1; // temporary spawnchance
        if (chance <= chancePumpShotgun) {
          // temporary spawnchance
          const r = itemInstance.rotation;
          createEntity(
            server,
            authorizedModelId[
              Math.floor(Math.random() * authorizedModelId.length)
            ],
            itemInstance.position,
            //itemInstance.rotation,
            [r[1], r[0], r[2]],
            objects
          );
        }
      });
    }
  });
  debug(
    "PumpShotgun and ammo items objects created. Spawnrate:" +
      chancePumpShotgun +
      "%"
  );
}

function createTools(server: ZoneServer2016) {
  Z1_items.forEach((spawnerType: any) => {
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
        const chance = Math.floor(Math.random() * 100) + 1; // temporary spawnchance
        if (chance <= chanceTools) {
          // temporary spawnchance
          const r = itemInstance.rotation;
          createEntity(
            server,
            authorizedModelId[
              Math.floor(Math.random() * authorizedModelId.length)
            ],
            itemInstance.position,
            //itemInstance.rotation,
            [r[1], r[0], r[2]],
            objects
          );
        }
      });
    }
  });
  debug("Tools items objects created. Spawnrate:" + chanceTools + "%");
}

function createPistols(server: ZoneServer2016) {
  Z1_items.forEach((spawnerType: any) => {
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
        const chance = Math.floor(Math.random() * 100) + 1; // temporary spawnchance
        if (chance <= chancePistols) {
          // temporary spawnchance
          const r = itemInstance.rotation;
          createEntity(
            server,
            authorizedModelId[
              Math.floor(Math.random() * authorizedModelId.length)
            ],
            itemInstance.position,
            //itemInstance.rotation,
            [r[1], r[0], r[2]],
            objects
          );
        }
      });
    }
  });
  debug(
    "1911, M9 and ammo items objects created. Spawnrate:" + chancePistols + "%"
  );
}

function createM24(server: ZoneServer2016) {
  Z1_items.forEach((spawnerType: any) => {
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
        const chance = Math.floor(Math.random() * 100) + 1; // temporary spawnchance
        if (chance <= chanceM24) {
          // temporary spawnchance
          const r = itemInstance.rotation;
          createEntity(
            server,
            authorizedModelId[
              Math.floor(Math.random() * authorizedModelId.length)
            ],
            itemInstance.position,
            //itemInstance.rotation,
            [r[1], r[0], r[2]],
            objects
          );
        }
      });
    }
  });
  debug(
    "SniperRifle and ammo items objects created. Spawnrate:" + chanceM24 + "%"
  );
}

function createConsumables(server: ZoneServer2016) {
  Z1_items.forEach((spawnerType: any) => {
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
        const chance = Math.floor(Math.random() * 100) + 1; // temporary spawnchance
        if (chance <= chanceConsumables) {
          // temporary spawnchance
          const r = itemInstance.rotation;
          createEntity(
            server,
            authorizedModelId[
              Math.floor(Math.random() * authorizedModelId.length)
            ],
            itemInstance.position,
            //itemInstance.rotation,
            [r[1], r[0], r[2]],
            objects
          );
        }
      });
    }
  });
  debug(
    "Consumable items objects created. Spawnrate:" + chanceConsumables + "%"
  );
}

function createClothes(server: ZoneServer2016) {
  Z1_items.forEach((spawnerType: any) => {
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
        const chance = Math.floor(Math.random() * 100) + 1; // temporary spawnchance
        if (chance <= chanceClothes) {
          // temporary spawnchance
          const r = itemInstance.rotation;
          createEntity(
            server,
            authorizedModelId[
              Math.floor(Math.random() * authorizedModelId.length)
            ],
            itemInstance.position,
            //itemInstance.rotation,
            [r[1], r[0], r[2]],
            objects
          );
        }
      });
    }
  });
  debug("Clothes items objects created. Spawnrate:" + chanceClothes + "%");
}

function createResidential(server: ZoneServer2016) {
  Z1_items.forEach((spawnerType: any) => {
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
        const chance = Math.floor(Math.random() * 100) + 1; // temporary spawnchance
        if (chance <= chanceResidential) {
          // temporary spawnchance
          const r = itemInstance.rotation;
          createEntity(
            server,
            authorizedModelId[
              Math.floor(Math.random() * authorizedModelId.length)
            ],
            itemInstance.position,
            //itemInstance.rotation,
            [r[1], r[0], r[2]],
            objects
          );
        }
      });
    }
  });
  debug(
    "Residential Areas items objects created. Spawnrate:" +
      chanceResidential +
      "%"
  );
}

function createRare(server: ZoneServer2016) {
  Z1_items.forEach((spawnerType: any) => {
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
        const chance = Math.floor(Math.random() * 100) + 1; // temporary spawnchance
        if (chance <= chanceRare) {
          // temporary spawnchance
          const r = itemInstance.rotation;
          createEntity(
            server,
            authorizedModelId[
              Math.floor(Math.random() * authorizedModelId.length)
            ],
            itemInstance.position,
            //itemInstance.rotation,
            [r[1], r[0], r[2]],
            objects
          );
        }
      });
    }
  });
  debug("Rare items objects created. Spawnrate:" + chanceRare + "%");
}

function createIndustrial(server: ZoneServer2016) {
  Z1_items.forEach((spawnerType: any) => {
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
        const chance = Math.floor(Math.random() * 100) + 1; // temporary spawnchance
        if (chance <= chanceIndustrial) {
          // temporary spawnchance
          const r = itemInstance.rotation;
          createEntity(
            server,
            authorizedModelId[
              Math.floor(Math.random() * authorizedModelId.length)
            ],
            itemInstance.position,
            //itemInstance.rotation,
            [r[1], r[0], r[2]],
            objects
          );
        }
      });
    }
  });
  debug(
    "Industrial Areas items objects created. Spawnrate:" +
      chanceIndustrial +
      "%"
  );
}

function createWorld(server: ZoneServer2016) {
  Z1_items.forEach((spawnerType: any) => {
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
        const chance = Math.floor(Math.random() * 100) + 1; // temporary spawnchance
        if (chance <= chanceWorld) {
          // temporary spawnchance
          const r = itemInstance.rotation;
          createEntity(
            server,
            authorizedModelId[
              Math.floor(Math.random() * authorizedModelId.length)
            ],
            itemInstance.position,
            //itemInstance.rotation,
            [r[1], r[0], r[2]],
            objects
          );
        }
      });
    }
  });
  debug("World Areas items objects created. Spawnrate:" + chanceWorld + "%");
}

function createLog(server: ZoneServer2016) {
  Z1_items.forEach((spawnerType: any) => {
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
        const chance = Math.floor(Math.random() * 100) + 1; // temporary spawnchance
        if (chance <= chanceLog) {
          // temporary spawnchance
          const r = itemInstance.rotation;
          createEntity(
            server,
            authorizedModelId[
              Math.floor(Math.random() * authorizedModelId.length)
            ],
            itemInstance.position,
            //itemInstance.rotation,
            [r[1], r[0], r[2]],
            objects
          );
        }
      });
    }
  });
  debug("Log Areas items objects created. Spawnrate:" + chanceWorld + "%");
}

function createCommercial(server: ZoneServer2016) {
  Z1_items.forEach((spawnerType: any) => {
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
        const chance = Math.floor(Math.random() * 100) + 1; // temporary spawnchance
        if (chance <= chanceCommercial) {
          // temporary spawnchance
          const r = itemInstance.rotation;
          createEntity(
            server,
            authorizedModelId[
              Math.floor(Math.random() * authorizedModelId.length)
            ],
            itemInstance.position,
            //itemInstance.rotation,
            [r[1], r[0], r[2]],
            objects
          );
        }
      });
    }
  });
  debug(
    "Commercial Areas items objects created. Spawnrate:" +
      chanceCommercial +
      "%"
  );
}

function createFarm(server: ZoneServer2016) {
  Z1_items.forEach((spawnerType: any) => {
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
        const chance = Math.floor(Math.random() * 100) + 1; // temporary spawnchance
        if (chance <= chanceFarm) {
          // temporary spawnchance
          const r = itemInstance.rotation;
          createEntity(
            server,
            authorizedModelId[
              Math.floor(Math.random() * authorizedModelId.length)
            ],
            itemInstance.position,
            //itemInstance.rotation,
            [r[1], r[0], r[2]],
            objects
          );
        }
      });
    }
  });
  debug("Farm Areas items objects created. Spawnrate:" + chanceFarm + "%");
}

function createAllDoors(server: ZoneServer2016): void {
  Z1_doors.forEach((doorType: any) => {
    const modelId: number = _.find(models, (model: any) => {
      return (
        model.MODEL_FILE_NAME ===
        doorType.actorDefinition.replace("_Placer", "")
      );
    })?.ID;
    doorType.instances.forEach((doorInstance: any) => {
      const r = doorInstance.rotation;
      createEntity(
        server,
        modelId ? modelId : 9183,
        doorInstance.position,
        [0, r[0] + -1.5707963705062866, 0],
        doors
      );
    });
  });
  debug("All doors objects created");
}
