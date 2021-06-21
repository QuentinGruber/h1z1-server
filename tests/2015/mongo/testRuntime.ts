import * as h1emu from "../../../h1z1-server";
import { toUint8Array } from "js-base64";

async function test() {
await new h1emu.LoginServer(1115,"mongodb://localhost:27017/").start();
await new h1emu.ZoneServer(1117, toUint8Array("F70IaxuU8C/w7FPXY1ibXw=="),"mongodb://localhost:27017/",1).start();

setInterval(() => {
  process.stdout.write("Runtime tested\n");
  process.exit(0);
}, 2000);
}
test();