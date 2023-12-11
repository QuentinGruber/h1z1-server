import test from "node:test";
import { LoginServer } from "./loginserver";

test("LoginServer",{timeout:5000}, async (t) => {
  const loginServer = new LoginServer(1115);
  await t.test("start", async (t) => {
    await loginServer.start();
  });
  await t.test("stop", async (t) => {
    await loginServer.stop();
  }
  );
});

test("LoginServer-mongo", { timeout:5000,skip: false}, async (t) => {
  const loginServer = new LoginServer(1115, "mongodb://localhost:27017");
  await t.test("start", async (t) => {
    await loginServer.start();
  });
  await t.test("stop", async (t) => {
    await loginServer.stop();
  }
  );
}
);


setTimeout(() => {
  process.exit(0);
}
, 10000);
