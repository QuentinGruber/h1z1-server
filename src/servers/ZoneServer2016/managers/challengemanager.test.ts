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
import assert from "node:assert";

process.env.FORCE_DISABLE_WS = "true";
const isMongoTests = process.env.MONGO_TESTS === "true" || true;
test(
  "Challenge-Mongo",
  { timeout: 10000, skip: !isMongoTests, only: true },
  async (t) => {
    const zone = new ZoneServer2016(
      0,
      Buffer.from("fake"),
      "mongodb://localhost:27017"
    );
    // Disabled on purpose to speedup the tests
    // await zone.start();
    const cmanager = zone.challengeManager;
    await t.test("Challenges points", () => {
      for (let i = 0; i < cmanager.challenges.length; i++) {
        const challenge = cmanager.challenges[i];
        assert(challenge.neededPoints, "NeededPoints can't be 0 or negatives");
      }
    });
    await t.test("Challenges points", () => {
      for (let i = 0; i < cmanager.challenges.length; i++) {
        const challenge = cmanager.challenges[i];
        assert(challenge.neededPoints, "NeededPoints can't be 0 or negatives");
      }
    });
  }
);

after(() => {
  setImmediate(() => {
    process.exit(0);
  });
});
