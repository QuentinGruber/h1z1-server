// ======================================================================
//
//   GNU GENERAL PUBLIC LICENSE
//   Version 3, 29 June 2007
//   copyright (C) 2020 - 2021 Quentin Gruber
//   copyright (C) 2021 - 2026 H1emu community
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
import { ConstructionChildEntity } from "../entities/constructionchildentity";
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
  await t.test("test decay", async () => {
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
    zone.decayManager.useDecayWorker = false;
    t.mock.timers.tick(originalDate);
    for (let i = 0; i < 10_000; i++) {
      zone.decayManager.clearTimers();
      await zone.decayManager.run(zone);
    }
    assert.strictEqual(Object.keys(zone._constructionFoundations).length, 0);
  });
  // #1467: structures re-homed onto a foundation as freeplace entities (e.g. an
  // upper shelter + gate + loot left after their supporting lower shelter is
  // removed) must not be treated as a "vacant" deck and wiped on decay.
  await t.test("#1467 vacant decay keeps re-homed freeplace structures", async () => {
    zone._constructionFoundations = {};
    zone._constructionSimple = {};
    zone.decayManager.griefCheckSlotAmount = 0; // isolate the vacant-foundation path
    zone.decayManager.useDecayWorker = false;
    const pos = new Float32Array([0, 0, 0, 0]);

    const foundationId = generate_random_guid();
    const foundation = new ConstructionParentEntity(
      foundationId,
      zone.getTransientId(foundationId),
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
    zone._constructionFoundations[foundationId] = foundation;

    const shelterId = generate_random_guid();
    const shelter = new ConstructionChildEntity(
      shelterId,
      zone.getTransientId(shelterId),
      1,
      pos,
      pos,
      zone,
      Items.SHELTER,
      foundationId,
      ""
    );
    zone._constructionSimple[shelterId] = shelter;
    foundation.addFreeplaceConstruction(shelter);

    // empty slot maps but a non-empty freeplace; force past the vacancy timer
    foundation.ticksWithoutObjects = zone.decayManager.vacantFoundationTicks;
    await zone.decayManager.run(zone);
    zone.decayManager.clearTimers();

    assert.ok(
      zone._constructionFoundations[foundationId],
      "foundation must survive while it still holds freeplace structures"
    );
    assert.ok(
      foundation.freeplaceEntities[shelterId],
      "re-homed shelter must not be wiped on decay"
    );
    assert.ok(
      zone._constructionSimple[shelterId],
      "re-homed shelter must remain in the world"
    );
  });
  // guard: the fix only narrows "vacant" — a genuinely empty deck is still cleaned up.
  await t.test("#1467 genuinely empty foundation is still decayed", async () => {
    zone._constructionFoundations = {};
    zone.decayManager.griefCheckSlotAmount = 0;
    zone.decayManager.useDecayWorker = false;
    const pos = new Float32Array([0, 0, 0, 0]);

    const foundationId = generate_random_guid();
    const foundation = new ConstructionParentEntity(
      foundationId,
      zone.getTransientId(foundationId),
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
    zone._constructionFoundations[foundationId] = foundation;
    foundation.ticksWithoutObjects = zone.decayManager.vacantFoundationTicks;
    await zone.decayManager.run(zone);
    zone.decayManager.clearTimers();

    assert.strictEqual(
      Object.keys(zone._constructionFoundations).length,
      0,
      "a truly empty foundation must still be removed after the vacancy timer"
    );
  });
  // #1467: the grief-cleanup heuristic must likewise spare a foundation that
  // still holds re-homed structures / loot as freeplace entities.
  await t.test(
    "#1467 grief cleanup spares a foundation holding freeplace structures",
    async () => {
      zone._constructionFoundations = {};
      zone._constructionSimple = {};
      zone.decayManager.griefFoundationTimer = 0; // any age qualifies for the grief check
      zone.decayManager.griefCheckSlotAmount = 5; // few walls -> grief heuristic active
      zone.decayManager.useDecayWorker = false;
      const pos = new Float32Array([0, 0, 0, 0]);

      const foundationId = generate_random_guid();
      const foundation = new ConstructionParentEntity(
        foundationId,
        zone.getTransientId(foundationId),
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
      zone._constructionFoundations[foundationId] = foundation;

      const shelterId = generate_random_guid();
      const shelter = new ConstructionChildEntity(
        shelterId,
        zone.getTransientId(shelterId),
        1,
        pos,
        pos,
        zone,
        Items.SHELTER,
        foundationId,
        ""
      );
      zone._constructionSimple[shelterId] = shelter;
      foundation.addFreeplaceConstruction(shelter);

      await zone.decayManager.run(zone);
      zone.decayManager.clearTimers();

      assert.ok(
        zone._constructionFoundations[foundationId],
        "grief cleanup must not wipe a foundation that holds freeplace structures"
      );
      assert.ok(
        foundation.freeplaceEntities[shelterId],
        "freeplace shelter must survive grief cleanup"
      );
    }
  );
});

after(() => {
  setImmediate(() => {
    process.exit(0);
  });
});
