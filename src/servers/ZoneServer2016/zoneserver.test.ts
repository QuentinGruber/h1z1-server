import test from "node:test";
import { ZoneServer2016 } from "./zoneserver";

test("ZoneServer2016", async (t) => {
  const ZoneServer = new ZoneServer2016(1115);
  await t.test("start", async (t) => {
    await ZoneServer.start();
  });
  setImmediate(() => {
    process.exit(0);
  });
});
