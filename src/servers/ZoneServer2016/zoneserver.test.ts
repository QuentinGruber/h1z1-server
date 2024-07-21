import test, { after } from "node:test";
import { ZoneServer2016 } from "./zoneserver";
import { scheduler } from "node:timers/promises";

process.env.FORCE_DISABLE_WS = "true";

const isMongoTests = process.env.MONGO_TESTS === "true";
test("ZoneServer2016", { timeout: 10000 }, async (t) => {
  const ZoneServer = new ZoneServer2016(0);
  await t.test("start", async () => {
    await ZoneServer.start();
  });
  await t.test("save", async () => {
    await ZoneServer.saveWorld();
  });
  await t.test("stop", async () => {
    await ZoneServer.stop();
  });
});

test(
  "ZoneServer2016-mongo",
  { timeout: 10000, skip: !isMongoTests },
  async (t) => {
    const ZoneServer = new ZoneServer2016(
      0,
      Buffer.from("fake"),
      "mongodb://localhost:27017"
    );
    await t.test("start", async () => {
      await ZoneServer.start();
    });
    await t.test("save", async () => {
      await ZoneServer.saveWorld();
    });
    await scheduler.yield();
    await t.test("stop", async () => {
      await ZoneServer.stop();
    });
  }
);

after(() => {
  setImmediate(() => {
    process.exit(0);
  });
});
