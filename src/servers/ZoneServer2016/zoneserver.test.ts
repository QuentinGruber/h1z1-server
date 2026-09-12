import test, { after } from "node:test";
import { ZoneServer2016 } from "./zoneserver";
import { scheduler } from "node:timers/promises";
import {
  createFakeCharacter,
  createFakeZoneClient
} from "../../utils/test.utils";
import assert from "node:assert";

process.env.FORCE_DISABLE_WS = "true";

const isMongoTests = process.env.MONGO_TESTS === "true";
test("ZoneServer2016", { timeout: 60000 }, async (t) => {
  const zone = new ZoneServer2016(0);
  await t.test("start", async () => {
    await zone.start();
  });
  await t.test("save", async () => {
    await zone.saveWorld();
  });
  await t.test("batch deletion releases Crowd agents", () => {
    const character = createFakeCharacter(zone);
    const agent = {} as NonNullable<typeof character.navAgent>;
    character.navAgent = agent;
    let released = 0;
    const originalRemoveAgent = zone.navManager.removeAgent.bind(
      zone.navManager
    );
    zone.navManager.removeAgent = (candidate) => {
      assert.equal(candidate, agent);
      released++;
      return true;
    };
    try {
      zone.batchDeleteEntities([character.characterId], zone._characters);
    } finally {
      zone.navManager.removeAgent = originalRemoveAgent;
    }
    assert.equal(released, 1);
    assert.equal(character.navAgent, undefined);
    assert.equal(zone._characters[character.characterId], undefined);
  });
  await t.test(
    "failed Crowd releases are counted before handles are dropped",
    () => {
      const character = createFakeCharacter(zone);
      character.navAgent = {} as NonNullable<typeof character.navAgent>;
      const originalRemoveAgent = zone.navManager.removeAgent.bind(
        zone.navManager
      );
      const originalWarn = console.warn;
      zone.navManager.removeAgent = () => false;
      console.warn = () => undefined;
      try {
        zone.batchDeleteEntities([character.characterId], zone._characters);
      } finally {
        zone.navManager.removeAgent = originalRemoveAgent;
        console.warn = originalWarn;
      }
      assert.equal(zone.navManager.unreleasedAgentCount, 1);
      assert.equal(character.navAgent, undefined);
    }
  );
  await t.test("non-native NPC FSM failures are not misclassified", () => {
    const originalTickNpcFsms = (
      zone as unknown as { tickNpcFsms: (dt: number) => void }
    ).tickNpcFsms;
    (zone as unknown as { tickNpcFsms: (dt: number) => void }).tickNpcFsms =
      () => {
        throw new Error("ordinary AI failure");
      };
    try {
      assert.throws(
        () => (zone as unknown as { tickAi: () => void }).tickAi(),
        /ordinary AI failure/
      );
      assert.equal(zone.navManager.crowdHealthy, true);
    } finally {
      (zone as unknown as { tickNpcFsms: (dt: number) => void }).tickNpcFsms =
        originalTickNpcFsms;
    }
  });
  await t.test("NPC FSM WASM faults latch navigation and stop re-entry", () => {
    let fsmTicks = 0;
    const originalTickNpcFsms = (
      zone as unknown as { tickNpcFsms: (dt: number) => void }
    ).tickNpcFsms;
    (zone as unknown as { tickNpcFsms: (dt: number) => void }).tickNpcFsms =
      () => {
        fsmTicks++;
        throw new WebAssembly.RuntimeError("memory access out of bounds");
      };
    const originalError = console.error;
    const originalWarn = console.warn;
    console.error = () => undefined;
    console.warn = () => undefined;
    try {
      (zone as unknown as { tickAi: () => void }).tickAi();
      (zone as unknown as { tickAi: () => void }).tickAi();
    } finally {
      (zone as unknown as { tickNpcFsms: (dt: number) => void }).tickNpcFsms =
        originalTickNpcFsms;
      console.error = originalError;
      console.warn = originalWarn;
    }
    assert.equal(fsmTicks, 1);
    assert.equal(zone.navManager.crowdHealthy, false);
    assert.equal(zone.navManager.obstacleUpdatesHealthy, false);
  });
  await t.test("character deletion", async () => {
    const character = createFakeCharacter(zone);
    createFakeZoneClient(zone, character);
    assert.equal(
      Object.keys(zone._characters).length,
      1,
      "Character not created"
    );
    assert.equal(Object.keys(zone._clients).length, 1, "Client not created");
    const client = zone.getClientByCharId(character.characterId);
    if (client) {
      await zone.deleteClient(client);
      assert.equal(
        Object.keys(zone._characters).length,
        0,
        "Character not deleted"
      );
      assert.equal(Object.keys(zone._clients).length, 0, "Client not deleted");
    } else {
      throw "client undefined";
    }
  });
  await t.test("stop", async () => {
    await zone.stop();
  });
});

test(
  "ZoneServer2016-mongo",
  { timeout: 60000, skip: !isMongoTests },
  async (t) => {
    const zone = new ZoneServer2016(
      0,
      Buffer.from("fake"),
      "mongodb://localhost:27017"
    );
    await t.test("start", async () => {
      await zone.start();
    });
    await t.test("save", async () => {
      await zone.saveWorld();
    });
    await t.test("character deletion", async () => {
      const character = createFakeCharacter(zone);
      createFakeZoneClient(zone, character);
      assert.equal(
        Object.keys(zone._characters).length,
        1,
        "Character not created"
      );
      assert.equal(Object.keys(zone._clients).length, 1, "Client not created");
      const client = zone.getClientByCharId(character.characterId);
      if (client) {
        await zone.deleteClient(client);
        assert.equal(
          Object.keys(zone._characters).length,
          0,
          "Character not deleted"
        );
        assert.equal(
          Object.keys(zone._clients).length,
          0,
          "Client not deleted"
        );
      } else {
        throw "client undefined";
      }
    });
    await scheduler.wait(500);
    await t.test("stop", async () => {
      await zone.stop();
    });
  }
);

after(() => {
  setImmediate(() => {
    process.exit(0);
  });
});
