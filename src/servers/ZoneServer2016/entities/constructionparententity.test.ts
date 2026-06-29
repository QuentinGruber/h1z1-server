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
import { ConstructionParentEntity } from "./constructionparententity";
import { ConstructionChildEntity } from "./constructionchildentity";
import { LootableConstructionEntity } from "./lootableconstructionentity";
import { generate_random_guid } from "h1emu-core";
import { Items } from "../models/enums";

process.env.FORCE_DISABLE_WS = "true";

// #1467 (preserve): destroying a deck/expansion must never orphan its children
// (leave them live in-world but unreachable from the save graph).
test("constructionparententity-destroy-preserve", { timeout: 10000 }, async (t) => {
  const zone = new ZoneServer2016(0);
  await zone.start();
  const pos = new Float32Array([0, 0, 0, 0]);

  await t.test(
    "#1467 destroying an expansion re-homes its children to the surviving deck",
    () => {
      zone._constructionFoundations = {};
      zone._constructionSimple = {};

      const deckId = generate_random_guid();
      const deck = new ConstructionParentEntity(
        deckId,
        zone.getTransientId(deckId),
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
      zone._constructionFoundations[deckId] = deck;

      const expansionId = generate_random_guid();
      const expansion = new ConstructionParentEntity(
        expansionId,
        zone.getTransientId(expansionId),
        1,
        pos,
        pos,
        zone,
        Items.FOUNDATION_EXPANSION,
        "1",
        "name",
        deckId,
        ""
      );
      zone._constructionFoundations[expansionId] = expansion;

      const shelterId = generate_random_guid();
      const shelter = new ConstructionChildEntity(
        shelterId,
        zone.getTransientId(shelterId),
        1,
        pos,
        pos,
        zone,
        Items.SHELTER,
        expansionId,
        ""
      );
      zone._constructionSimple[shelterId] = shelter;
      expansion.occupiedShelterSlots[1] = shelter;

      expansion.destroy(zone);

      assert.ok(
        !zone._constructionFoundations[expansionId],
        "expansion should be removed from the world"
      );
      assert.ok(
        deck.freeplaceEntities[shelterId],
        "shelter should be re-homed onto the surviving deck as a freeplace entity"
      );
      assert.strictEqual(
        shelter.parentObjectCharacterId,
        deckId,
        "shelter should now reference the surviving deck"
      );
      assert.ok(
        zone._constructionSimple[shelterId],
        "shelter should remain a live construction entity"
      );
    }
  );

  await t.test(
    "#1467 destroying a top deck cascade-destroys structures and preserves nested loot",
    () => {
      zone._constructionFoundations = {};
      zone._constructionSimple = {};
      zone._worldSimpleConstruction = {};
      zone._worldLootableConstruction = {};
      zone._lootableConstruction = {};

      const deckId = generate_random_guid();
      const deck = new ConstructionParentEntity(
        deckId,
        zone.getTransientId(deckId),
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
      zone._constructionFoundations[deckId] = deck;

      const shelterId = generate_random_guid();
      const shelter = new ConstructionChildEntity(
        shelterId,
        zone.getTransientId(shelterId),
        1,
        pos,
        pos,
        zone,
        Items.SHELTER,
        deckId,
        ""
      );
      zone._constructionSimple[shelterId] = shelter;
      deck.occupiedShelterSlots[1] = shelter;

      // a nested structure (upper shelter) and a loot box stored inside the shelter
      const upperId = generate_random_guid();
      const upper = new ConstructionChildEntity(
        upperId,
        zone.getTransientId(upperId),
        1,
        pos,
        pos,
        zone,
        Items.SHELTER_UPPER,
        shelterId,
        ""
      );
      zone._constructionSimple[upperId] = upper;
      shelter.occupiedShelterSlots[1] = upper;

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
      shelter.freeplaceEntities[lootId] = loot;

      deck.destroy(zone);

      assert.ok(
        !zone._constructionFoundations[deckId],
        "deck should be removed from the world"
      );
      // structures are cascade-destroyed, never dumped into the regenerated
      // world-prop dictionary
      assert.ok(
        !zone._constructionSimple[shelterId] &&
          !zone._worldSimpleConstruction[shelterId],
        "shelter should be removed, not left in world-simple"
      );
      assert.ok(
        !zone._constructionSimple[upperId] &&
          !zone._worldSimpleConstruction[upperId],
        "nested upper shelter should be removed, not left in world-simple"
      );
      // loot is preserved as world-owned (persisted)
      assert.ok(
        zone._worldLootableConstruction[lootId],
        "loot nested inside the shelter should be preserved as world-owned"
      );
      assert.ok(
        !zone._lootableConstruction[lootId],
        "loot should no longer be foundation-owned"
      );
    }
  );

  await t.test(
    "#1467 destroying a child with a broken parent chain preserves loot and removes structures",
    () => {
      zone._constructionSimple = {};
      zone._worldSimpleConstruction = {};
      zone._worldLootableConstruction = {};
      zone._lootableConstruction = {};

      // shelterB's parent does not exist -> the chain up to a foundation is broken
      const shelterBId = generate_random_guid();
      const shelterB = new ConstructionChildEntity(
        shelterBId,
        zone.getTransientId(shelterBId),
        1,
        pos,
        pos,
        zone,
        Items.SHELTER,
        "missing-parent",
        ""
      );
      zone._constructionSimple[shelterBId] = shelterB;

      const shelterAId = generate_random_guid();
      const shelterA = new ConstructionChildEntity(
        shelterAId,
        zone.getTransientId(shelterAId),
        1,
        pos,
        pos,
        zone,
        Items.SHELTER,
        shelterBId,
        ""
      );
      zone._constructionSimple[shelterAId] = shelterA;

      // a structural survivor and a loot survivor placed on shelterA
      const structId = generate_random_guid();
      const struct = new ConstructionChildEntity(
        structId,
        zone.getTransientId(structId),
        1,
        pos,
        pos,
        zone,
        Items.SHELTER,
        shelterAId,
        ""
      );
      zone._constructionSimple[structId] = struct;
      shelterA.freeplaceEntities[structId] = struct;

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
        shelterAId,
        ""
      );
      zone._lootableConstruction[lootId] = loot;
      shelterA.freeplaceEntities[lootId] = loot;

      shelterA.destroy(zone);

      assert.ok(
        zone._worldLootableConstruction[lootId],
        "loot survivor should be preserved as world-owned when the chain is broken"
      );
      assert.ok(
        !zone._constructionSimple[structId] &&
          !zone._worldSimpleConstruction[structId],
        "structural survivor should be cascade-destroyed, not left in world-simple"
      );
    }
  );
  // #1467 (real reported cause): setSlot must not silently overwrite an occupied
  // slot. Two upper shelters resolving to the same slot on one lower shelter would
  // otherwise overwrite in occupiedShelterSlots, orphaning the first upper (and its
  // nested loot) so it is dropped from the next save and vanishes on restart.
  await t.test(
    "#1467 setShelterSlot rejects a second entity on an occupied slot (no overwrite-orphan)",
    () => {
      zone._constructionFoundations = {};
      zone._constructionSimple = {};
      const p = new Float32Array([0, 0, 0, 0]);

      const foundationId = generate_random_guid();
      const foundation = new ConstructionParentEntity(
        foundationId,
        zone.getTransientId(foundationId),
        1,
        p,
        p,
        zone,
        Items.FOUNDATION,
        "1",
        "name",
        "",
        ""
      );
      const lowerId = generate_random_guid();
      const lower = new ConstructionChildEntity(
        lowerId,
        zone.getTransientId(lowerId),
        1,
        p,
        p,
        zone,
        Items.SHELTER,
        foundationId,
        "Structure01"
      );
      assert.strictEqual(
        foundation.setShelterSlot(zone, lower),
        true,
        "lower shelter attaches to the foundation"
      );

      // two upper shelters that both resolve to the same slot on the lower shelter
      const upperAId = generate_random_guid();
      const upperA = new ConstructionChildEntity(
        upperAId,
        zone.getTransientId(upperAId),
        1,
        p,
        p,
        zone,
        Items.SHELTER_UPPER,
        lowerId,
        "Structure01"
      );
      const upperBId = generate_random_guid();
      const upperB = new ConstructionChildEntity(
        upperBId,
        zone.getTransientId(upperBId),
        1,
        p,
        p,
        zone,
        Items.SHELTER_UPPER,
        lowerId,
        "Structure01"
      );

      assert.strictEqual(
        lower.setShelterSlot(zone, upperA),
        true,
        "first upper shelter attaches"
      );
      assert.strictEqual(
        lower.setShelterSlot(zone, upperB),
        false,
        "second upper on the same slot is rejected, not silently overwritten"
      );
      assert.strictEqual(
        Object.keys(lower.occupiedShelterSlots).length,
        1,
        "only one upper occupies the slot"
      );
      assert.strictEqual(
        lower.occupiedShelterSlots[upperA.getSlotNumber()].characterId,
        upperAId,
        "the first upper is preserved, not overwritten by the second"
      );

      // re-setting the SAME entity stays idempotent (safe re-load of one save)
      assert.strictEqual(
        lower.setShelterSlot(zone, upperA),
        true,
        "re-setting the same entity is allowed (idempotent reload)"
      );
      assert.strictEqual(
        Object.keys(lower.occupiedShelterSlots).length,
        1,
        "idempotent re-set does not add a duplicate"
      );
    }
  );
});

after(() => {
  setImmediate(() => {
    process.exit(0);
  });
});
