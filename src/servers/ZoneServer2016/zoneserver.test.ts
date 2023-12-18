import test from "node:test";
import { ZoneServer2016 } from "./zoneserver";

test("ZoneServer2016", { timeout: 10000 }, async (t) => {
  const ZoneServer = new ZoneServer2016(1117);
  await t.test("start", async (t) => {
    await ZoneServer.start();
  });
  await t.test("stop", async (t) => {
    await ZoneServer.stop();
  });
});
