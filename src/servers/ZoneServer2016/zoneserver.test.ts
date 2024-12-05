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
test("ZoneServer2016", { timeout: 10000 }, async (t) => {
  const zone = new ZoneServer2016(0);
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
  { timeout: 10000, skip: !isMongoTests },
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
