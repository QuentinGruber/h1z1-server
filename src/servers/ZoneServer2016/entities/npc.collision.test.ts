import assert from "node:assert";
import test from "node:test";
import { Npc } from "./npc";

test("static structure collision blocks NPC melee damage through a wall", () => {
  let traceFrom: Float32Array | undefined;
  let traceTo: Float32Array | undefined;
  const character = {
    state: { position: new Float32Array([4, 20, 8, 1]) },
    meleeHit: { abilityHitLocation: 0 },
    OnMeleeHit() {
      assert.fail("wall-blocked melee reached the player damage handler");
    }
  };
  const server = {
    getClientByCharId: () => ({
      isLoading: false,
      character,
      vehicle: { mountedVehicle: "" }
    }),
    collisionManager: {
      segmentBlocked(from: Float32Array, to: Float32Array) {
        traceFrom = from;
        traceTo = to;
        return true;
      }
    }
  };
  const npc = {
    server,
    state: { position: new Float32Array([1, 20, 2, 1]) }
  };

  Npc.prototype.applyDamage.call(npc, "player");

  assert.deepEqual(Array.from(traceFrom ?? []), [1, 21, 2, 1]);
  assert.deepEqual(Array.from(traceTo ?? []), [4, 21, 8, 1]);
});
