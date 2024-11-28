import test, { after } from "node:test";
import { ZoneServer2016 } from "../zoneserver";
import { DamageInfo } from "types/zoneserver";
import assert from "node:assert";
import {
  createFakeCharacter,
  createFakeZoneClient
} from "../../../utils/test.utils";
import { Npc } from "./npc";

process.env.FORCE_DISABLE_WS = "true";
test("Damage-pve", { timeout: 10000 }, async (t) => {
  const zone = new ZoneServer2016(0);
  zone.isPvE = true;
  await zone.start();
  assert.equal(zone.isPvE, true);
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
    assert.equal(character.getHealth(), oldHealth);
  });
  await zone.stop();
});
test("Damage-npc-pvp", { timeout: 10000 }, async (t) => {
  const zone = new ZoneServer2016(0);
  await zone.start();
  const character = createFakeCharacter(zone);
  createFakeZoneClient(zone, character);
  const zguid = zone.generateGuid();
  const damager = new Npc(
    zguid,
    zone.getTransientId(zguid),
    9510,
    new Float32Array([0, 0, 0, 1]),
    new Float32Array([0, 0, 0, 1]),
    zone
  );
  zone._npcs[zguid] = damager;
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
  await zone.stop();
});
test("Damage-npc-pve", { timeout: 10000 }, async (t) => {
  const zone = new ZoneServer2016(0);
  zone.isPvE = true;
  await zone.start();
  assert.equal(zone.isPvE, true);
  const character = createFakeCharacter(zone);
  createFakeZoneClient(zone, character);
  const zguid = zone.generateGuid();
  const damager = new Npc(
    zguid,
    zone.getTransientId(zguid),
    9510,
    new Float32Array([0, 0, 0, 1]),
    new Float32Array([0, 0, 0, 1]),
    zone
  );
  zone._npcs[zguid] = damager;
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
  await zone.stop();
});

test("Damage-pvp", { timeout: 10000 }, async (t) => {
  const zone = new ZoneServer2016(0);
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
  await zone.stop();
});
after(() => {
  setImmediate(() => {
    process.exit(0);
  });
});
