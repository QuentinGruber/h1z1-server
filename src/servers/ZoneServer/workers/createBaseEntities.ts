const debug = require("debug")("baseEntityCreator");
const Z1_vehicles = require("../../../../data/sampleData/vehicleLocations.json");
const Z1_items = require("../../../../data/zoneData/Z1_items.json");
const Z1_doors = require("../../../../data/zoneData/Z1_doors.json");
const Z1_npcs = require("../../../../data/zoneData/Z1_npcs.json");
const models = require("../../../../data/dataSources/Models.json");
const modelToName = require("../../../../data/sampleData/ModelToName.json");
import _ from "lodash";
import { generateRandomGuid } from "../../../utils/utils";
const npcs: any = {};
const objects: any = {};
const vehicles: any = {};
const doors: any = {};

const chancePumpShotgun = 50;
const chanceAR15 = 50;
const chanceTools = 50;
const chance1911 = 100;
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

let numberOfSpawnedEntity = 0;

function createEntity(
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
  dictionnary[characterId] = {
    characterId: characterId,
    guid: guid,
    transientId: numberOfSpawnedEntity,
    nameId: stringNameId,
    modelId: modelID,
    position: position,
    rotation: rotation,
    attachedObject: {},
    color: {},
    array5: [{ unknown1: 0 }],
    array17: [{ unknown1: 0 }],
    array18: [{ unknown1: 0 }],
  };
}

export function createAllEntities(): any {
  createAllDoors();
  createAR15();
  createPumpShotgun();
  createTools();
  create1911();
  createM24();
  createConsumables();
  createClothes();
  createResidential();
  createRare();
  createIndustrial();
  createWorld();
  createLog();
  createCommercial();
  createFarm();
  createAllVehicles();
  createSomeNpcs();
  return { npcs: npcs, objects: objects, vehicles: vehicles, doors: doors };
}

function getRandomVehicleId() {
  switch (Math.floor(Math.random() * 3)) {
    case 0:
      return 7225;
    case 1:
      return 9301;
    case 2:
      return 9258;
    default:
      return 9258;
  }
}

function createAllVehicles() {
  Z1_vehicles.forEach((vehicle: any) => {
    const characterId = generateRandomGuid();
    numberOfSpawnedEntity++;
    vehicles[characterId] = {
      npcData: {
        guid: generateRandomGuid(),
        characterId: characterId,
        transientId: numberOfSpawnedEntity,
        modelId: getRandomVehicleId(),
        scale: [1, 1, 1, 1],
        position: vehicle.position,
        rotation: vehicle.rotation,
        attachedObject: {},
	unknown26: true,
        color: {},
        unknownArray1: [],
        array5: [{ unknown1: 0 }],
        array17: [{ unknown1: 0 }],
        array18: [{ unknown1: 0 }],
      },
      unknownGuid1: generateRandomGuid(),
      positionUpdate: [0, 0, 0, 0],
    };
  });
  debug("All vehicles created");
}

function createSomeNpcs() {
  // This is only for giving the world some life
  Z1_npcs.forEach((spawnerType: any) => {
    const authorizedModelId: number[] = [];
    switch (spawnerType.actorDefinition) {
      case "NPCSpawner_ZombieLazy.adr":
        authorizedModelId.push(9001);
        authorizedModelId.push(9193);
        break;
      case "NPCSpawner_ZombieWalker.adr":
        authorizedModelId.push(9001);
        authorizedModelId.push(9193);
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
        if (spawnchance <= 40) {
          // temporary spawnchance
          createEntity(
            authorizedModelId[
              Math.floor(Math.random() * authorizedModelId.length)
            ],
            itemInstance.position,
            itemInstance.rotation,
            npcs
          );
        }
      });
    }
  });
  debug("All npcs objects created");
}

function createAR15() {
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
          createEntity(
            authorizedModelId[
              Math.floor(Math.random() * authorizedModelId.length)
            ],
            itemInstance.position,
            itemInstance.rotation,
            objects
          );
        }
      });
    }
  });
  debug("AR15 and ammo items objects created. Spawnrate:" + chanceAR15 + "%");
}

function createPumpShotgun() {
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
          createEntity(
            authorizedModelId[
              Math.floor(Math.random() * authorizedModelId.length)
            ],
            itemInstance.position,
            itemInstance.rotation,
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

function createTools() {
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
      default:
        break;
    }
    if (authorizedModelId.length) {
      spawnerType.instances.forEach((itemInstance: any) => {
        const chance = Math.floor(Math.random() * 100) + 1; // temporary spawnchance
        if (chance <= chanceTools) {
          // temporary spawnchance
          createEntity(
            authorizedModelId[
              Math.floor(Math.random() * authorizedModelId.length)
            ],
            itemInstance.position,
            itemInstance.rotation,
            objects
          );
        }
      });
    }
  });
  debug("Tools items objects created. Spawnrate:" + chanceTools + "%");
}

function create1911() {
  Z1_items.forEach((spawnerType: any) => {
    const authorizedModelId: number[] = [];
    switch (spawnerType.actorDefinition) {
      case "ItemSpawner_Weapon_45Auto.adr":
        authorizedModelId.push(17);
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
        if (chance <= chance1911) {
          // temporary spawnchance
          createEntity(
            authorizedModelId[
              Math.floor(Math.random() * authorizedModelId.length)
            ],
            itemInstance.position,
            itemInstance.rotation,
            objects
          );
        }
      });
    }
  });
  debug("1911 and ammo items objects created. Spawnrate:" + chance1911 + "%");
}

function createM24() {
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
          createEntity(
            authorizedModelId[
              Math.floor(Math.random() * authorizedModelId.length)
            ],
            itemInstance.position,
            itemInstance.rotation,
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

function createConsumables() {
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
          createEntity(
            authorizedModelId[
              Math.floor(Math.random() * authorizedModelId.length)
            ],
            itemInstance.position,
            itemInstance.rotation,
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

function createClothes() {
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
        authorizedModelId.push(9249);
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
          createEntity(
            authorizedModelId[
              Math.floor(Math.random() * authorizedModelId.length)
            ],
            itemInstance.position,
            itemInstance.rotation,
            objects
          );
        }
      });
    }
  });
  debug("Clothes items objects created. Spawnrate:" + chanceClothes + "%");
}

function createResidential() {
  Z1_items.forEach((spawnerType: any) => {
    const authorizedModelId: number[] = [];
    switch (spawnerType.actorDefinition) {
      case "ItemSpawnerResidential_Tier00.adr":
        authorizedModelId.push(9064);
        authorizedModelId.push(9249);
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
          createEntity(
            authorizedModelId[
              Math.floor(Math.random() * authorizedModelId.length)
            ],
            itemInstance.position,
            itemInstance.rotation,
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

function createRare() {
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
          createEntity(
            authorizedModelId[
              Math.floor(Math.random() * authorizedModelId.length)
            ],
            itemInstance.position,
            itemInstance.rotation,
            objects
          );
        }
      });
    }
  });
  debug("Rare items objects created. Spawnrate:" + chanceRare + "%");
}

function createIndustrial() {
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
          createEntity(
            authorizedModelId[
              Math.floor(Math.random() * authorizedModelId.length)
            ],
            itemInstance.position,
            itemInstance.rotation,
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

function createWorld() {
  Z1_items.forEach((spawnerType: any) => {
    const authorizedModelId: number[] = [];
    switch (spawnerType.actorDefinition) {
      case "ItemSpawnerWorld_Tier00.adr":
        authorizedModelId.push(24);
        authorizedModelId.push(9156);
        authorizedModelId.push(9159);
        authorizedModelId.push(9249);
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
          createEntity(
            authorizedModelId[
              Math.floor(Math.random() * authorizedModelId.length)
            ],
            itemInstance.position,
            itemInstance.rotation,
            objects
          );
        }
      });
    }
  });
  debug("World Areas items objects created. Spawnrate:" + chanceWorld + "%");
}

function createLog() {
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
          createEntity(
            authorizedModelId[
              Math.floor(Math.random() * authorizedModelId.length)
            ],
            itemInstance.position,
            itemInstance.rotation,
            objects
          );
        }
      });
    }
  });
  debug("Log Areas items objects created. Spawnrate:" + chanceWorld + "%");
}

function createCommercial() {
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
          createEntity(
            authorizedModelId[
              Math.floor(Math.random() * authorizedModelId.length)
            ],
            itemInstance.position,
            itemInstance.rotation,
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

function createFarm() {
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
          createEntity(
            authorizedModelId[
              Math.floor(Math.random() * authorizedModelId.length)
            ],
            itemInstance.position,
            itemInstance.rotation,
            objects
          );
        }
      });
    }
  });
  debug("Farm Areas items objects created. Spawnrate:" + chanceFarm + "%");
}

function createAllDoors(): void {
  Z1_doors.forEach((doorType: any) => {
    // TODO: add types for Z1_doors
    const modelId: number = _.find(models, {
      MODEL_FILE_NAME: doorType.actorDefinition.replace("_Placer", ""),
    })?.ID;
    doorType.instances.forEach((doorInstance: any) => {
      createEntity(
        modelId ? modelId : 9183,
        doorInstance.position,
        doorInstance.rotation,
        doors
      );
    });
  });
  debug("All doors objects created");
}
