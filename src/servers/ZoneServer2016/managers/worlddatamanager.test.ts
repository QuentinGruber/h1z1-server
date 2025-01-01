import test, { after } from "node:test";
import { WorldArg, WorldDataManager } from "./worlddatamanager";
import assert from "assert";
import { ZoneServer2016 } from "../zoneserver";
import { ConstructionParentEntity } from "../entities/constructionparententity";
import { generate_random_guid } from "h1emu-core";
import { ConstructionChildEntity } from "../entities/constructionchildentity";
import { ConstructionDoor } from "../entities/constructiondoor";
import { Items } from "../models/enums";

const isMongoTests = process.env.MONGO_TESTS === "true";
process.env.FORCE_DISABLE_WS = "true";

function removeUndefinedKeys(obj: any) {
  for (const key in obj) {
    if (obj[key] === undefined) {
      delete obj[key];
    } else if (typeof obj[key] === "object") {
      removeUndefinedKeys(obj[key]);
    }
  }
  return obj;
}

function removeMongoDbId(obj: any) {
  for (const key in obj) {
    if (key === "_id") {
      delete obj[key];
    } else if (typeof obj[key] === "object") {
      removeMongoDbId(obj[key]);
    }
  }
  return obj;
}

async function worldSaveUnitTests(t: any, mongoAddress: string) {
  const worldId = 81;
  const zone = new ZoneServer2016(
    0,
    Buffer.from("fake"),
    mongoAddress,
    worldId
  );
  await zone.start();
  const wdmanager = new WorldDataManager();
  await t.test("check world save version", async () => {
    assert.equal(wdmanager.worldSaveVersion, 2);
  });
  await t.test("init world", async () => {
    await wdmanager.initialize(worldId, mongoAddress);
  });
  const world: WorldArg = {
    lastGuidItem: 1000n,
    vehicles: [],
    characters: [],
    constructions: [],
    worldConstructions: [],
    crops: [],
    traps: []
  };
  await t.test("convert vehicles", async () => {
    world.vehicles = WorldDataManager.convertVehiclesToSaveData(
      Object.values(zone._vehicles),
      worldId
    );
  });
  const constructionNb = 1;
  await t.test("convert constructions", async () => {
    // clear the construction list
    zone._constructionFoundations = {};
    assert.deepStrictEqual(
      Object.keys(zone._constructionFoundations).length,
      0
    );
    for (let i = 0; i < constructionNb; i++) {
      let characterId = generate_random_guid();
      let transientId = zone.getTransientId(characterId);
      const pos = new Float32Array([0, 0, 0, 0]);
      const foundation = new ConstructionParentEntity(
        characterId,
        transientId,
        1,
        pos,
        pos,
        zone,
        Items.FOUNDATION,
        "1",
        "name",
        "",
        ""
      );
      for (let j = 0; j < 4; j++) {
        characterId = generate_random_guid();
        transientId = zone.getTransientId(characterId);
        const wall = new ConstructionChildEntity(
          characterId,
          transientId,
          1,
          pos,
          pos,
          zone,
          Items.METAL_WALL,
          foundation.characterId,
          ""
        );
        foundation.setWallSlot(zone, wall);
      }

      characterId = generate_random_guid();
      transientId = zone.getTransientId(characterId);
      const door = new ConstructionDoor(
        characterId,
        transientId,
        1,
        pos,
        pos,
        zone,
        Items.DOOR_METAL,
        foundation.characterId,
        "",
        ""
      );
      foundation.setWallSlot(zone, door);
      zone._constructionFoundations[characterId] = foundation;
    }

    Object.values(zone._constructionFoundations).forEach((entity) => {
      const construction = WorldDataManager.getConstructionParentSaveData(
        entity,
        zone._worldId
      );
      world.constructions.push(construction);
    });
    assert.deepStrictEqual(world.constructions.length, constructionNb);
  });
  await t.test("save world", async () => {
    await wdmanager.saveWorld({ ...world });
  });
  await t.test("sanitize world object", async () => {
    world.vehicles.forEach((vehicle) => {
      // some keys are undefined, so we need to remove them
      // there like undefined but defined at the same time weird to explain
      // the value is undefined but the key is defined
      removeUndefinedKeys(vehicle);
    });
  });
  await t.test("load world data", async () => {
    const loadedWorldData = await wdmanager.getServerData(worldId);
    assert.deepEqual(loadedWorldData?.serverId, worldId);
    assert.deepEqual(
      BigInt(loadedWorldData?.lastItemGuid as string),
      world.lastGuidItem
    );
  });
  await t.test("load vehicles", async () => {
    const loadedVehicles = await wdmanager.loadVehiclesData();
    removeMongoDbId(loadedVehicles);
    assert.deepStrictEqual(loadedVehicles, world.vehicles);
  });
  await t.test("load constructions", async () => {
    const loadedConstructions = await wdmanager.loadConstructionData();
    assert.deepStrictEqual(
      loadedConstructions?.length,
      world.constructions.length
    );

    assert.deepStrictEqual(loadedConstructions?.length, constructionNb);
    removeMongoDbId(loadedConstructions);
    removeMongoDbId(world.constructions);
    // sort per characterId since mongo mangle the order
    loadedConstructions.sort((a, b) => {
      return a.characterId.localeCompare(b.characterId);
    });
    world.constructions.sort((a, b) => {
      return a.characterId.localeCompare(b.characterId);
    });

    assert.deepStrictEqual(loadedConstructions, world.constructions);
  });
  await t.test("load world constructions", async () => {
    const loadedWorldConstructions =
      await wdmanager.loadWorldFreeplaceConstruction();
    assert.deepEqual(loadedWorldConstructions, world.worldConstructions);
  });
  await t.test("load crops", async () => {
    const loadedCrops = await wdmanager.loadCropData();
    assert.deepEqual(loadedCrops, world.crops);
  });
}
test("WorldDataManager", { timeout: 10000 }, async (t) => {
  await worldSaveUnitTests(t, "");
});

test(
  "WorldDataManager-mongo",
  { timeout: 10000, skip: !isMongoTests },
  async (t) => {
    await worldSaveUnitTests(t, "mongodb://localhost:27017");
  }
);
after(() => {
  setImmediate(() => {
    process.exit(0);
  });
});
