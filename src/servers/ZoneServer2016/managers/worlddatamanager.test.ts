import test, { after } from "node:test";
import { WorldArg, WorldDataManager } from "./worlddatamanager";
import assert from "assert";
import { ZoneServer2016 } from "../zoneserver";

const isMongoTests = process.env.MONGO_TESTS === "true";
test("WorldDataManager", { timeout: 10000 }, async (t) => {
  const zone = new ZoneServer2016(1118);
  await zone.start();
  const wdmanager = new WorldDataManager();
  const worldId = 81;
  await t.test("check world save version", async () => {
    assert.equal(wdmanager.worldSaveVersion, 2);
  });
  await t.test("init world", async () => {
    await wdmanager.initialize(worldId, "");
  });
  const world: WorldArg = {
    lastGuidItem: 1000n,
    vehicles: [],
    characters: [],
    constructions: [],
    worldConstructions: [],
    crops: []
  };
  // TODO: need investigation
  // await t.test("convert vehicles", async () => {
  //   world.vehicles = WorldDataManager.convertVehiclesToSaveData(
  //     Object.values(zone._vehicles),
  //     worldId
  //   );
  // });
  await t.test("save world", async () => {
    await wdmanager.saveWorld({ ...world });
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
    assert.deepEqual(loadedVehicles, world.vehicles);
  });
  await t.test("load constructions", async () => {
    const loadedConstructions = await wdmanager.loadConstructionData();
    assert.deepEqual(loadedConstructions, world.constructions);
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
});
after(() => {
  setImmediate(() => {
    process.exit(0);
  });
});

test(
  "WorldDataManager-mongo",
  { timeout: 10000, skip: !isMongoTests },
  async (t) => {
    const wdmanager = new WorldDataManager();
    const worldId = 81;
    await t.test("check world save version", async () => {
      assert.equal(wdmanager.worldSaveVersion, 2);
    });
    const world: WorldArg = {
      lastGuidItem: 1000n,
      vehicles: [],
      characters: [],
      constructions: [],
      worldConstructions: [],
      crops: []
    };
    await t.test("init world", async () => {
      await wdmanager.initialize(worldId, "mongodb://localhost:27017");
      await wdmanager.insertWorld(world.lastGuidItem);
    });
    await t.test("save world", async () => {
      await wdmanager.saveWorld({ ...world });
    });

    await t.test("load world data", async () => {
      const loadedWorldData = await wdmanager.getServerData(worldId);
      assert.deepEqual(loadedWorldData?.serverId, worldId);
      assert.deepEqual(loadedWorldData?.lastItemGuid, world.lastGuidItem);
    });
    await t.test("load vehicles", async () => {
      const loadedVehicles = await wdmanager.loadVehiclesData();
      assert.deepEqual(loadedVehicles, world.vehicles);
    });
    await t.test("load constructions", async () => {
      const loadedConstructions = await wdmanager.loadConstructionData();
      assert.deepEqual(loadedConstructions, world.constructions);
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
);
after(() => {
  setImmediate(() => {
    process.exit(0);
  });
});
