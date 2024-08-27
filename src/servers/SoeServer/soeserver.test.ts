import test, { after } from "node:test";
import { SOEServer } from "./soeserver";
import { PacketsQueue } from "./PacketsQueue";
import assert from "node:assert";

test("SoeServer", { timeout: 5000 }, async (t) => {
  const soeServer = new SOEServer(0, Buffer.from("1"));
  await t.test("start", async () => {
    soeServer.start();
  });

  await t.test("stop", async () => {
    await soeServer.stop();
  });
});

after(() => {
  setImmediate(() => {
    process.exit(0);
  });
});
