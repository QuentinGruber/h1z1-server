import test from "node:test";
import { SOEServer } from "./soeserver";

test("SoeServer", { timeout: 5000 }, async (t) => {
  const soeServer = new SOEServer(1115, Buffer.from("1"));
  await t.test("start", async () => {
    soeServer.start();
  });
  await t.test("stop", async () => {
    await soeServer.stop();
  });
});
