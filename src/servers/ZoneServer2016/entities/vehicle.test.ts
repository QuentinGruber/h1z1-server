import test, { after } from "node:test";
import { ZoneServer2016 } from "../zoneserver";
import { Vehicle2016 } from "./vehicle";
import { DamageInfo } from "types/zoneserver";
import { getCurrentServerTimeWrapper } from "../../../utils/utils";
import assert from "node:assert";

process.env.FORCE_DISABLE_WS = "true";
test("Damage-pve", { timeout: 10000 }, async (t) => {
  const zone = new ZoneServer2016(0);
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
    getCurrentServerTimeWrapper().getTruncatedU32(),
    3
  );
  await t.test("Damage from entity", async () => {
    const oldHealth = vehicle.getHealth();
    const dmg = 10;
    const damageInfo: DamageInfo = { entity: "idk", damage: dmg };
    vehicle.OnProjectileHit(zone, damageInfo);
    vehicle.OnMeleeHit(zone, damageInfo);
    assert.equal(vehicle.getHealth(), oldHealth);
  });
  await t.test("Damage from collisions", async () => {
    const oldHealth = vehicle.getHealth();
    const dmg = 10;
    const damageInfo: DamageInfo = { entity: "", damage: dmg };
    vehicle.damage(zone, damageInfo);
    assert.equal(vehicle.getHealth(), oldHealth - dmg);
  });
  await zone.stop();
});

test("Damage-pvp", { timeout: 10000 }, async (t) => {
  const zone = new ZoneServer2016(0);
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
    getCurrentServerTimeWrapper().getTruncatedU32(),
    3
  );
  await t.test("Damage from entity", async () => {
    let oldHealth = vehicle.getHealth();
    const dmg = 10;
    const damageInfo: DamageInfo = { entity: "idk", damage: dmg };
    vehicle.OnProjectileHit(zone, damageInfo);
    assert.equal(vehicle.getHealth(), oldHealth - dmg);
    oldHealth = vehicle.getHealth();
    vehicle.OnMeleeHit(zone, damageInfo);
    // don't ask me why it's *2
    assert.equal(vehicle.getHealth(), oldHealth - dmg * 2);
  });
  await t.test("Damage from collisions", async () => {
    const oldHealth = vehicle.getHealth();
    const dmg = 10;
    const damageInfo: DamageInfo = { entity: "", damage: dmg };
    vehicle.damage(zone, damageInfo);
    assert.equal(vehicle.getHealth(), oldHealth - dmg);
  });
  await zone.stop();
});
after(() => {
  setImmediate(() => {
    process.exit(0);
  });
});
