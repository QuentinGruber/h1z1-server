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
import { LootableConstructionEntity } from "../entities/lootableconstructionentity";
import { WorldDataManager } from "./worlddatamanager";
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
  await t.test(
    "#1467 vacant decay keeps re-homed freeplace structures",
    async () => {
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
    }
  );
  // guard: the fix only narrows "vacant" — a genuinely empty deck is still cleaned up.
  await t.test(
    "#1467 genuinely empty foundation is still decayed",
    async () => {
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
    }
  );
  // #1467 regression guard: a plain loot/storage container left in freeplace is NOT a
  // structure and must NOT keep an otherwise-empty deck from despawning (only re-homed
  // shelters/gates do). Without this the deck would become immune to vacant decay.
  await t.test(
    "#1467 a lone loot container does not keep a vacant deck alive",
    async () => {
      zone._constructionFoundations = {};
      zone._lootableConstruction = {};
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

      // a standalone loot/storage container placed directly on the deck (freeplace)
      const lootId = generate_random_guid();
      const loot = new LootableConstructionEntity(
        lootId,
        zone.getTransientId(lootId),
        1,
        pos,
        pos,
        zone,
        new Float32Array([1, 1, 1, 1]),
        Items.REPAIR_BOX,
        foundationId,
        ""
      );
      zone._lootableConstruction[lootId] = loot;
      foundation.addFreeplaceConstruction(loot);

      foundation.ticksWithoutObjects = zone.decayManager.vacantFoundationTicks;
      await zone.decayManager.run(zone);
      zone.decayManager.clearTimers();

      assert.strictEqual(
        Object.keys(zone._constructionFoundations).length,
        0,
        "a deck holding only a loot container must still decay after the vacancy timer"
      );
    }
  );
  // #1467: the grief-cleanup heuristic must likewise spare a foundation that
  // still holds re-homed structures as freeplace entities (but not plain loot).
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
  // #1467 end-to-end: the literal bug report -> a re-homed shelter (with loot
  // inside it) must survive the decay tick AND a save/reload (serialize -> JSON
  // -> reconstruct) round-trip, which is what "after a server restart" exercises.
  await t.test(
    "#1467 re-homed shelter + loot survive decay and a save/reload round-trip",
    async () => {
      zone._constructionFoundations = {};
      zone._constructionSimple = {};
      zone._lootableConstruction = {};
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

      // a shelter re-homed onto the foundation as freeplace (the #1467 precondition)
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

      // a loot box stored inside the shelter
      const lootId = generate_random_guid();
      const loot = new LootableConstructionEntity(
        lootId,
        zone.getTransientId(lootId),
        1,
        pos,
        pos,
        zone,
        new Float32Array([1, 1, 1, 1]),
        Items.REPAIR_BOX,
        shelterId,
        ""
      );
      zone._lootableConstruction[lootId] = loot;
      shelter.addFreeplaceConstruction(loot);

      // push past the vacancy timer so the pre-fix decay WOULD have wiped the deck
      foundation.ticksWithoutObjects = zone.decayManager.vacantFoundationTicks;
      await zone.decayManager.run(zone);
      zone.decayManager.clearTimers();

      assert.ok(
        zone._constructionFoundations[foundationId],
        "foundation must survive the decay tick"
      );

      // serialize exactly as saveWorld does, JSON round-trip (the disk save), then
      // simulate a restart by clearing live state and loading from the saved data
      const saveData = WorldDataManager.getConstructionParentSaveData(
        foundation,
        zone._worldId
      );
      const persisted = JSON.parse(JSON.stringify(saveData));
      zone._constructionFoundations = {};
      zone._constructionSimple = {};
      zone._lootableConstruction = {};
      WorldDataManager.loadConstructionParentEntity(zone, persisted);

      assert.ok(
        zone._constructionFoundations[foundationId],
        "foundation must reload after restart"
      );
      assert.ok(
        zone._constructionSimple[shelterId],
        "shelter must reload after restart"
      );
      assert.ok(
        zone._constructionFoundations[foundationId].freeplaceEntities[
          shelterId
        ],
        "shelter must reattach to the foundation as freeplace after restart"
      );
      assert.ok(
        zone._lootableConstruction[lootId],
        "loot stored inside the shelter must reload after restart"
      );
    }
  );
});

after(() => {
  setImmediate(() => {
    process.exit(0);
  });
});
