import * as h1emu from "../../../h1z1-server";

async function test() {
  const loginServer = new h1emu.LoginServer(1115, "mongodb://localhost:27017/");
  loginServer._enableHttpServer = false; // note: if i want to enable it and test routes , i need to change port 80 to something superior at 1024
  await loginServer.start();
  await new h1emu.ZoneServer(
    1117,
    Buffer.from("F70IaxuU8C/w7FPXY1ibXw==", "base64"),
    "mongodb://localhost:27017/",
    1
  ).start();

  setInterval(() => {
    process.stdout.write("Runtime tested\n");
    process.exit(0);
  }, 2000);
}
test();
