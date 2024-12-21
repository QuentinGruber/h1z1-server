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
import assert from "node:assert";
import { RewardManager } from "./rewardmanager";

process.env.FORCE_DISABLE_WS = "true";
test("RewardManager", { timeout: 10000 }, async (t) => {
  const rewardManager = new RewardManager(void 0 as any);
  await t.test("Total chances rewards", () => {
    const totalChances = rewardManager["rewards"].reduce(
      (sum, reward) => sum + reward.dropChances,
      0
    );
    assert.strictEqual(totalChances, 100, "TotalChances should be 100%");
  });
  await t.test("Total chances playtimerewards", () => {
    const totalChances = rewardManager["playTimerewards"].reduce(
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
