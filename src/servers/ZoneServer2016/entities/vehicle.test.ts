import test, { after } from "node:test";
import { ZoneServer2016 } from "../zoneserver";
import { Vehicle2016 } from "./vehicle";
import { DamageInfo } from "types/zoneserver";
import { getCurrentTimeWrapper } from "../../../utils/utils";
import assert from "node:assert";

test("Damage-pve", { timeout: 10000 }, async (t) => {
  const zone = new ZoneServer2016(1117);
  zone.isPvE = true;
  await zone.start();
  assert.equal(zone.isPvE, true);
  const characterId = zone.generateGuid();
  const transientId = zone.getTransientId(characterId);
  const vehicle = new Vehicle2016(
    characterId,
    transientId,
    1,
    new Float32Array([0, 0, 0]),
    new Float32Array([0, 0, 0]),
    zone,
    getCurrentTimeWrapper().getTruncatedU32(),
    3
  );
  await t.test("Damage from entity", async () => {
    const oldHealth = vehicle.getHealth();
    const dmg = 10;
    const damageInfo: DamageInfo = { entity: "idk", damage: dmg };
    vehicle.damage(zone, damageInfo);
    assert.equal(vehicle.getHealth(), oldHealth);
  });
  await t.test("Damage from collisions", async () => {
    const oldHealth = vehicle.getHealth();
    const dmg = 10;
    const damageInfo: DamageInfo = { entity: "", damage: dmg };
    vehicle.damage(zone, damageInfo);
    assert.equal(vehicle.getHealth(), oldHealth - dmg);
  });
});

test("Damage-pvp", { timeout: 10000 }, async (t) => {
  const zone = new ZoneServer2016(1118);
  await zone.start();
  assert.equal(zone.isPvE, false);
  const characterId = zone.generateGuid();
  const transientId = zone.getTransientId(characterId);
  const vehicle = new Vehicle2016(
    characterId,
    transientId,
    1,
    new Float32Array([0, 0, 0]),
    new Float32Array([0, 0, 0]),
    zone,
    getCurrentTimeWrapper().getTruncatedU32(),
    3
  );
  await t.test("Damage from entity", async () => {
    const oldHealth = vehicle.getHealth();
    const dmg = 10;
    const damageInfo: DamageInfo = { entity: "idk", damage: dmg };
    vehicle.damage(zone, damageInfo);
    assert.equal(vehicle.getHealth(), oldHealth - dmg);
  });
  await t.test("Damage from collisions", async () => {
    const oldHealth = vehicle.getHealth();
    const dmg = 10;
    const damageInfo: DamageInfo = { entity: "", damage: dmg };
    vehicle.damage(zone, damageInfo);
    assert.equal(vehicle.getHealth(), oldHealth - dmg);
  });
});
after(() => {
  setImmediate(() => {
    process.exit(0);
  });
});
