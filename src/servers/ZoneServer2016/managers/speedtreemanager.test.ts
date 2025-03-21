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
import { SpeedTreeManager } from "./speedtreemanager";
import { PropInstance } from "types/zoneserver";
import { ZoneServer2016 } from "../zoneserver";
import assert from "node:assert";

test("speedTreeManager", { timeout: 10000 }, async (t) => {
  const speedTreeManager = new SpeedTreeManager();
  await t.test("initiateList", () => {
    speedTreeManager.initiateList();
    assert.notStrictEqual(Object.keys(speedTreeManager._speedTreesList), 0);
  });

  const destroyedDto: number = 1000;
  await t.test("destroy", () => {
    const zone = new ZoneServer2016(1117);

    for (let i = 0; i < destroyedDto; i++) {
      speedTreeManager.destroy(zone, i, "ouai");
    }
    assert.strictEqual(
      Object.keys(speedTreeManager._speedTreesDestroyed).length,
      destroyedDto
    );
  });
  await t.test("customize", () => {
    const arr: PropInstance[] = [];
    speedTreeManager.customize(arr);
    assert.strictEqual(arr.length, destroyedDto);
  });
});

after(() => {
  setImmediate(() => {
    process.exit(0);
  });
});
