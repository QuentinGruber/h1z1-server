import test, { after } from "node:test";
import { ZoneServer2016 } from "../zoneserver";
import { DamageInfo } from "types/zoneserver";
import assert from "node:assert";
import {
  createFakeCharacter,
  createFakeZoneClient
} from "../../../utils/test.utils";

test("Damage-pve", { timeout: 10000 }, async (t) => {
  const zone = new ZoneServer2016(1119);
  zone.isPvE = true;
  await zone.start();
  assert.equal(zone.isPvE, true);
  const character = createFakeCharacter(zone);
  createFakeZoneClient(zone, character);
  const damager = createFakeCharacter(zone);
  createFakeZoneClient(zone, damager);
  // console.log(zone.getClientByCharId(character.characterId));
  await t.test("Damage from entity", async () => {
    const oldHealth = character.getHealth();
    const dmg = 26;
    const damageInfo: DamageInfo = {
      entity: damager.characterId,
      damage: dmg,
      hitReport: {
        characterId: damager.characterId,
        sessionProjectileCount: 0,
        totalShotCount: 0,
        position: new Float32Array([0, 0, 0]),
        unknownByte2: 0,
        unknownFlag1: 0
      }
    };
    character.damage(zone, damageInfo);
    assert.equal(character.getHealth(), oldHealth);
  });
});

test("Damage-pvp", { timeout: 10000 }, async (t) => {
  const zone = new ZoneServer2016(1120);
  await zone.start();
  assert.equal(zone.isPvE, false);
  const character = createFakeCharacter(zone);
  createFakeZoneClient(zone, character);
  const damager = createFakeCharacter(zone);
  createFakeZoneClient(zone, damager);
  await t.test("Damage from entity", async () => {
    const oldHealth = character.getHealth();
    const dmg = 26;
    const damageInfo: DamageInfo = {
      entity: damager.characterId,
      damage: dmg,
      hitReport: {
        characterId: damager.characterId,
        sessionProjectileCount: 0,
        totalShotCount: 0,
        position: new Float32Array([0, 0, 0]),
        unknownByte2: 0,
        unknownFlag1: 0
      }
    };
    character.damage(zone, damageInfo);
    assert.equal(character.getHealth(), oldHealth - dmg);
  });
});
after(() => {
  setImmediate(() => {
    process.exit(0);
  });
});
