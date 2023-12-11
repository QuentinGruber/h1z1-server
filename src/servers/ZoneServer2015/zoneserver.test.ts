import test from "node:test";
import { ZoneServer2015 } from "./zoneserver";

test("ZoneServer2015", async (t) => {
  const ZoneServer = new ZoneServer2015(1115);
  await t.test("start", async (t) => {
    await ZoneServer.start();
  });
  setImmediate(() => {
    process.exit(0);
  });
});
