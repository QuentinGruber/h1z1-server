import test, { after } from "node:test";
import { LoginServer } from "./loginserver";
import { scheduler } from "node:timers/promises";

const isMongoTests = process.env.MONGO_TESTS === "true";

test("LoginServer", { timeout: 5000 }, async (t) => {
  const loginServer = new LoginServer(1115);
  await t.test("start", async () => {
    await loginServer.start();
  });
  await t.test("stop", async () => {
    await loginServer.stop();
  });
});

test("LoginServer-mongo", { timeout: 5000, skip: !isMongoTests }, async (t) => {
  const loginServer = new LoginServer(1115, "mongodb://localhost:27017");
  await t.test("start", async () => {
    await loginServer.start();
  });
  // TODO: start should stop awaiting only when everything is really done
  await scheduler.yield();
  await t.test("stop", async () => {
    await loginServer.stop();
  });
});

after(() => {
  setImmediate(() => {
    process.exit(0);
  });
});
