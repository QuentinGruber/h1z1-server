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
    "#1467 destroying a top deck promotes its structures to world-owned (no orphan)",
    () => {
      zone._constructionFoundations = {};
      zone._constructionSimple = {};
      zone._worldSimpleConstruction = {};

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

      deck.destroy(zone);

      assert.ok(
        !zone._constructionFoundations[deckId],
        "deck should be removed from the world"
      );
      assert.ok(
        zone._worldSimpleConstruction[shelterId],
        "structure should be promoted to world-owned construction, not orphaned"
      );
      assert.ok(
        !zone._constructionSimple[shelterId],
        "structure should no longer be foundation-owned"
      );
    }
  );

  await t.test(
    "#1467 destroying a child with a broken parent chain promotes survivors",
    () => {
      zone._constructionSimple = {};
      zone._worldSimpleConstruction = {};

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

      const survivorId = generate_random_guid();
      const survivor = new ConstructionChildEntity(
        survivorId,
        zone.getTransientId(survivorId),
        1,
        pos,
        pos,
        zone,
        Items.SHELTER,
        shelterAId,
        ""
      );
      zone._constructionSimple[survivorId] = survivor;
      shelterA.freeplaceEntities[survivorId] = survivor;

      shelterA.destroy(zone);

      assert.ok(
        zone._worldSimpleConstruction[survivorId],
        "survivor should be promoted to world-owned when the parent chain is broken"
      );
      assert.ok(
        !zone._constructionSimple[survivorId],
        "survivor should be removed from foundation-owned construction"
      );
    }
  );
});

after(() => {
  setImmediate(() => {
    process.exit(0);
  });
});
