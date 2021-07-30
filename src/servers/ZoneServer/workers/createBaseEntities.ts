const debug = require("debug")("baseEntityCreator");
const Z1_vehicles = require("../../../../data/2015/sampleData/vehicleLocations.json");
const Z1_items = require("../../../../data/2015/zoneData/Z1_items.json");
const Z1_doors = require("../../../../data/2015/zoneData/Z1_doors.json");
const Z1_npcs = require("../../../../data/2015/zoneData/Z1_npcs.json");
const z1_Props = require("../../../../data/2015/zoneData/z1_Props.json");
const models = require("../../../../data/2015/dataSources/Models.json");
const modelToName = require("../../../../data/2015/sampleData/ModelToName.json");
import { _ } from "../../../utils/utils";
import { generateRandomGuid } from "../../../utils/utils";
import { ZoneServer } from "../zoneserver";
const npcs: any = {};
const objects: any = {};
const vehicles: any = {};
const doors: any = {};
const props: any = {};

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
  server: ZoneServer,
  modelID: number,
  position: Array<number>,
  rotation: Array<number>,
  scale: Array<number>,
  zoneId: number,
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
  if (numberOfSpawnedEntity > 60000) {
    numberOfSpawnedEntity = 1;
  }
  server._transientIds[numberOfSpawnedEntity] = characterId;
  dictionnary[characterId] = {
    worldId: server._worldId,
    zoneId: zoneId,
    characterId: characterId,
    guid: guid,
    transientId: numberOfSpawnedEntity,
    nameId: stringNameId,
    modelId: modelID,
    scale: scale,
    position: position,
    rotation: rotation,
    attachedObject: {},
    color: {},
    array5: [{ unknown1: 0 }],
    array17: [{ unknown1: 0 }],
    array18: [{ unknown1: 0 }],
  };
}

export function createAllEntities(server: ZoneServer): any {
  createAllDoors(server);
  createAR15(server);
  createPumpShotgun(server);
  createTools(server);
  create1911(server);
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
  createProps(server);
  createAllVehicles(server);
  createSomeNpcs(server);
  return {
    npcs: npcs,
    objects: objects,
    vehicles: vehicles,
    doors: doors,
    props: props,
  };
}

function getRandomVehicleModelId() {
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

function getVehicleId(ModelId:number) {
  switch (ModelId) {
    case 7225:
      return 1;
    case 9301:
      return 3;
    case 9258:
      return 2;
    default:
      return 1;
  }
}

function createAllVehicles(server: ZoneServer) {
  Z1_vehicles.forEach((vehicle: any) => {
    const characterId = generateRandomGuid();
    numberOfSpawnedEntity++;
    server._transientIds[numberOfSpawnedEntity] = characterId;
    const modelId = getRandomVehicleModelId();
    vehicles[characterId] = {
      worldId: server._worldId,
      npcData: {
        guid: generateRandomGuid(),
        characterId: characterId,
        transientId: numberOfSpawnedEntity,
        modelId: modelId,
        scale: [1, 1, 1, 1],
        position: vehicle.position,
        rotation: vehicle.rotation,
        attachedObject: {},
        vehicleId: getVehicleId(modelId),
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

function createSomeNpcs(server: ZoneServer) {
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
            server,
            authorizedModelId[
              Math.floor(Math.random() * authorizedModelId.length)
            ],
            itemInstance.position,
            itemInstance.rotation,
            itemInstance.scale,
            itemInstance.id,
            npcs
          );
        }
      });
    }
  });
  debug("All npcs objects created");
}

function createAR15(server: ZoneServer) {
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
            server,
            authorizedModelId[
              Math.floor(Math.random() * authorizedModelId.length)
            ],
            itemInstance.position,
            itemInstance.rotation,
            itemInstance.scale,
            itemInstance.id,
            objects
          );
        }
      });
    }
  });
  debug("AR15 and ammo items objects created. Spawnrate:" + chanceAR15 + "%");
}

function createPumpShotgun(server: ZoneServer) {
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
            server,
            authorizedModelId[
              Math.floor(Math.random() * authorizedModelId.length)
            ],
            itemInstance.position,
            itemInstance.rotation,
            itemInstance.scale,
itemInstance.id,
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

function createTools(server: ZoneServer) {
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
            server,
            authorizedModelId[
              Math.floor(Math.random() * authorizedModelId.length)
            ],
            itemInstance.position,
            itemInstance.rotation,
            itemInstance.scale,
itemInstance.id,
            objects
          );
        }
      });
    }
  });
  debug("Tools items objects created. Spawnrate:" + chanceTools + "%");
}

function create1911(server: ZoneServer) {
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
            server,
            authorizedModelId[
              Math.floor(Math.random() * authorizedModelId.length)
            ],
            itemInstance.position,
            itemInstance.rotation,
            itemInstance.scale,
            itemInstance.id,
            objects
          );
        }
      });
    }
  });
  debug("1911 and ammo items objects created. Spawnrate:" + chance1911 + "%");
}

function createM24(server: ZoneServer) {
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
            server,
            authorizedModelId[
              Math.floor(Math.random() * authorizedModelId.length)
            ],
            itemInstance.position,
            itemInstance.rotation,
            itemInstance.scale,
itemInstance.id,
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

function createConsumables(server: ZoneServer) {
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
            server,
            authorizedModelId[
              Math.floor(Math.random() * authorizedModelId.length)
            ],
            itemInstance.position,
            itemInstance.rotation,
            itemInstance.scale,
itemInstance.id,
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

function createClothes(server: ZoneServer) {
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
            server,
            authorizedModelId[
              Math.floor(Math.random() * authorizedModelId.length)
            ],
            itemInstance.position,
            itemInstance.rotation,
            itemInstance.scale,
itemInstance.id,
            objects
          );
        }
      });
    }
  });
  debug("Clothes items objects created. Spawnrate:" + chanceClothes + "%");
}

function createResidential(server: ZoneServer) {
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
            server,
            authorizedModelId[
              Math.floor(Math.random() * authorizedModelId.length)
            ],
            itemInstance.position,
            itemInstance.rotation,
            itemInstance.scale,
itemInstance.id,
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

function createRare(server: ZoneServer) {
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
            server,
            authorizedModelId[
              Math.floor(Math.random() * authorizedModelId.length)
            ],
            itemInstance.position,
            itemInstance.rotation,
            itemInstance.scale,
itemInstance.id,
            objects
          );
        }
      });
    }
  });
  debug("Rare items objects created. Spawnrate:" + chanceRare + "%");
}

function createIndustrial(server: ZoneServer) {
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
            server,
            authorizedModelId[
              Math.floor(Math.random() * authorizedModelId.length)
            ],
            itemInstance.position,
            itemInstance.rotation,
            itemInstance.scale,
itemInstance.id,
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

function createWorld(server: ZoneServer) {
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
            server,
            authorizedModelId[
              Math.floor(Math.random() * authorizedModelId.length)
            ],
            itemInstance.position,
            itemInstance.rotation,
            itemInstance.scale,
itemInstance.id,
            objects
          );
        }
      });
    }
  });
  debug("World Areas items objects created. Spawnrate:" + chanceWorld + "%");
}

function createLog(server: ZoneServer) {
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
            server,
            authorizedModelId[
              Math.floor(Math.random() * authorizedModelId.length)
            ],
            itemInstance.position,
            itemInstance.rotation,
            itemInstance.scale,
itemInstance.id,
            objects
          );
        }
      });
    }
  });
  debug("Log Areas items objects created. Spawnrate:" + chanceWorld + "%");
}

function createCommercial(server: ZoneServer) {
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
            server,
            authorizedModelId[
              Math.floor(Math.random() * authorizedModelId.length)
            ],
            itemInstance.position,
            itemInstance.rotation,
            itemInstance.scale,
itemInstance.id,
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

function createFarm(server: ZoneServer) {
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
            server,
            authorizedModelId[
              Math.floor(Math.random() * authorizedModelId.length)
            ],
            itemInstance.position,
            itemInstance.rotation,
            itemInstance.scale,
itemInstance.id,
            objects
          );
        }
      });
    }
  });
  debug("Farm Areas items objects created. Spawnrate:" + chanceFarm + "%");
}

function createProps(server: ZoneServer) {
  z1_Props.forEach((propType: any) => {
    const modelId: number = _.find(models, (model: any) => {
      return model.MODEL_FILE_NAME === propType.actorDefinition;
    })?.ID;
    propType.instances.forEach((propInstance: any) => {
      createEntity(
        server,
        modelId,
        propInstance.position,
        propInstance.rotation,
        propInstance.scale,
        propInstance.id,
        props
      );
    });
  });
  debug("Props objects created");
}

function createAllDoors(server: ZoneServer): void {
  Z1_doors.forEach((doorType: any) => {
    // TODO: add types for Z1_doors
    const modelId: number = _.find(models, (model: any) => {
      return (
        model.MODEL_FILE_NAME ===
        doorType.actorDefinition.replace("_Placer", "")
      );
    })?.ID;
    doorType.instances.forEach((doorInstance: any) => {
      createEntity(
        server,
        modelId ? modelId : 9183,
        doorInstance.position,
        doorInstance.rotation,
        doorInstance.scale,
        doorInstance.id,
        doors
      );
    });
  });
  debug("All doors objects created");
}
