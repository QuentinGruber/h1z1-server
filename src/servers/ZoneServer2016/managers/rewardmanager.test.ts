// ======================================================================
//
//   GNU GENERAL PUBLIC LICENSE
//   Version 3, 29 June 2007
//   copyright (C) 2020 - 2021 Quentin Gruber
//   copyright (C) 2021 - 2024 H1emu community
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
test("RewardManager", { timeout: 10000 }, async (t) => {
  const zone = new ZoneServer2016(0);
  await zone.start();
  await t.test("Total chances", () => {
    const totalChances = zone.rewardManager["rewards"].reduce(
      (sum, reward) => sum + reward.dropChances,
      0
    );
    assert.strictEqual(totalChances, 100, "TotalChances should be 100%");
  });
});

after(() => {
  setImmediate(() => {
    process.exit(0);
  });
});
