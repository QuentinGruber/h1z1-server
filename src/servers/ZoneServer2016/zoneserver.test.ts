import test, { after } from "node:test";
import { ZoneServer2016 } from "./zoneserver";
import { scheduler } from "node:timers/promises";

const isMongoTests = process.env.MONGO_TESTS === "true";
test("ZoneServer2016", { timeout: 10000 }, async (t) => {
  const ZoneServer = new ZoneServer2016(1117);
  await t.test("start", async () => {
    await ZoneServer.start();
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
      1117,
      Buffer.from("fake"),
      "mongodb://localhost:27017"
    );
    await t.test("start", async () => {
      await ZoneServer.start();
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
