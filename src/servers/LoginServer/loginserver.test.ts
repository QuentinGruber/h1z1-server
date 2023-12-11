import test from "node:test";
import { LoginServer } from "./loginserver";

test("LoginServer", async () => {
  const loginServer = new LoginServer(1115, "mongodb://localhost:27017/");
  await loginServer.start();
  loginServer.stop();
});
