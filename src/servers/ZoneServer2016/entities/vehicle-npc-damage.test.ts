import test from "node:test";
import assert from "node:assert/strict";
import { Vehicle2016 } from "./vehicle";
import type { ZoneServer2016 } from "../zoneserver";
import type { DamageInfo } from "types/zoneserver";
import { Items, NpcIds, ResourceIds } from "../models/enums";

test("NPC vehicle melee uses requested percentages in PvE and PvP without mutating the hit", () => {
  for (const isPvE of [true, false]) {
    for (const [npcId, damage, expected] of [
      [NpcIds.ZOMBIE, 2500, 1500],
      [NpcIds.WOLF, 2000, 2000],
      [NpcIds.BEAR, 4000, 4500],
      [-1, 3000, 3000]
    ]) {
      let condition = 100000;
      const vehicle = {
        damage: (_server: ZoneServer2016, hit: DamageInfo) => {
          condition -= hit.damage;
        }
      } as Vehicle2016;
      const server = {
        isPvE,
        _npcs: { npc: { npcId } },
        getClientByCharId: () => undefined
      } as unknown as ZoneServer2016;
      const hit: DamageInfo = { entity: "npc", damage };
      Vehicle2016.prototype.OnMeleeHit.call(vehicle, server, hit);
      Vehicle2016.prototype.OnMeleeHit.call(vehicle, server, hit);
      assert.equal(condition, 100000 - expected - expected);
      assert.equal(
        hit.damage,
        damage,
        "reused hits must not grow exponentially"
      );
    }
  }
});

test("player melee retains PvE protection and the PvP multiplier", () => {
  for (const isPvE of [true, false]) {
    const hits: number[] = [];
    const vehicle = {
      damage: (_server: ZoneServer2016, hit: DamageInfo) =>
        hits.push(hit.damage)
    } as unknown as Vehicle2016;
    const server = {
      isPvE,
      _npcs: {},
      getClientByCharId: () => undefined
    } as unknown as ZoneServer2016;
    Vehicle2016.prototype.OnMeleeHit.call(vehicle, server, {
      entity: "player",
      damage: 100
    });
    assert.deepEqual(hits, isPvE ? [] : [200]);
  }
});

test("wrench repair retains its condition gain and durability cost", () => {
  const hits: number[] = [];
  const durabilityCosts: number[] = [];
  const weapon = { itemDefinitionId: Items.WEAPON_WRENCH };
  const character = { getEquippedWeapon: () => weapon };
  const server = {
    isPvE: true,
    _npcs: {},
    getClientByCharId: () => ({ character }),
    damageItem: (_character: unknown, _weapon: unknown, cost: number) =>
      durabilityCosts.push(cost)
  } as unknown as ZoneServer2016;
  const vehicle = {
    _resources: { [ResourceIds.CONDITION]: 90000 },
    damage: (_server: ZoneServer2016, hit: DamageInfo) => hits.push(hit.damage)
  } as unknown as Vehicle2016;
  Vehicle2016.prototype.OnMeleeHit.call(vehicle, server, {
    entity: "player",
    damage: 100
  });
  assert.deepEqual(hits, [-2000]);
  assert.deepEqual(durabilityCosts, [80]);
});
