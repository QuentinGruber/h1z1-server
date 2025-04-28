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
import { ConstructionParentEntity } from "../entities/constructionparententity";
import { generate_random_guid } from "h1emu-core";
import { Items } from "../models/enums";

test("decaymanager", { timeout: 10000 }, async (t) => {
  const zone = new ZoneServer2016(0);
  await zone.start();
  const originalDate = Date.now();
  t.mock.timers.enable({ apis: ["Date"] });
  await t.test("test decay grief", () => {
    zone._constructionFoundations = {};
    const characterId = generate_random_guid();
    const transientId = zone.getTransientId(characterId);
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
    zone._constructionFoundations[characterId] = foundation;

    // TODO: load that from config
    const timeGrief = 60_000 * 60 * 24 * 30;
    t.mock.timers.tick(originalDate + timeGrief);
    zone.decayManager.run(zone);
    assert.strictEqual(Object.keys(zone._constructionFoundations).length, 0);
  });
  await t.test("test decay", () => {
    zone._constructionFoundations = {};
    const characterId = generate_random_guid();
    const transientId = zone.getTransientId(characterId);
    const pos = new Float32Array([0, 0, 0, 0]);
    const foundation = new ConstructionParentEntity(
      characterId,
      transientId,
      1,
      pos,
      pos,
      zone,
      1,
      "1",
      "name",
      "",
      ""
    );
    zone._constructionFoundations[characterId] = foundation;

    zone.decayManager.griefCheckSlotAmount = 0;
    t.mock.timers.tick(originalDate);
    for (let i = 0; i < 10_000; i++) {
      zone.decayManager.run(zone);
    }
    assert.strictEqual(Object.keys(zone._constructionFoundations).length, 0);
  });
});

after(() => {
  setImmediate(() => {
    process.exit(0);
  });
});
