// ======================================================================
//
//   GNU GENERAL PUBLIC LICENSE
//   Version 3, 29 June 2007
//   copyright (C) 2020 - 2021 Quentin Gruber
//   copyright (C) 2021 - 2025 H1emu community
//
//   https://github.com/QuentinGruber/h1z1-server
//   https://www.npmjs.com/package/h1z1-server
//
//   Based on https://github.com/psemu/soe-network
// ======================================================================

import test, { after } from "node:test";
import { ZoneServer2016 } from "../zoneserver";
import {
  createFakeCharacter,
  createFakeZoneClient
} from "../../../utils/test.utils";
import assert from "node:assert";

process.env.FORCE_DISABLE_WS = "true";
const isMongoTests = process.env.MONGO_TESTS === "true";
test("PlayTimeManager", { timeout: 10000 }, async (t) => {
  t.mock.timers.enable({ apis: ["setInterval"] });
  const zone = new ZoneServer2016(0);
  await zone.start();
  const char = createFakeCharacter(zone);
  await t.test("PlayTime incrementation", () => {
    for (let i = 1; i <= 60; i++) {
      t.mock.timers.tick(60_000);

      assert.strictEqual(char.playTime, i, "Playtime doesn't update well!");
    }
  });
});
test(
  "PlayTimeManager-mongo",
  { timeout: 10000, skip: !isMongoTests },
  async (t) => {
    t.mock.timers.enable({ apis: ["setInterval"] });
    const zone = new ZoneServer2016(
      0,
      Buffer.from("fake"),
      "mongodb://localhost:27017"
    );
    await zone.start();
    const char = createFakeCharacter(zone);
    const client = createFakeZoneClient(zone, char);
    await t.test("PlayTime incrementation", () => {
      for (let i = 1; i <= 60; i++) {
        t.mock.timers.tick(60_000);

        assert.strictEqual(char.playTime, i, "Playtime doesn't update well!");
      }
    });
    await t.test("PlayTimeSave", async () => {
      await zone.saveWorld();
      await zone.fetchCharacterData(client);
      assert.strictEqual(
        client.character.playTime,
        char.playTime,
        "Playtime doesn't save well!"
      );
    });
  }
);

after(() => {
  setImmediate(() => {
    process.exit(0);
  });
});
