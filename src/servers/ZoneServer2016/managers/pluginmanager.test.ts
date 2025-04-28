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
import assert from "node:assert";
import { ZoneServer2016 } from "../zoneserver";

process.env.FORCE_DISABLE_WS = "true";
// This way plugins are only enabled for this test
delete process.env.DISABLE_PLUGINS;
test("PluginManager", { timeout: 10000 }, async (t) => {
  const zone = new ZoneServer2016(0);
  await t.test("Plugin Load", async () => {
    await zone.start();
    assert.strictEqual(
      zone.pluginManager.pluginCount,
      1,
      "Test Plugin didn't load"
    );
  });
});

after(() => {
  setImmediate(() => {
    process.exit(0);
  });
});
