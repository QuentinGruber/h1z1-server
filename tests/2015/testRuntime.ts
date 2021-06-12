import * as h1emu from "../../h1z1-server";
import { toUint8Array } from "js-base64";

new h1emu.LoginServer(1115).start();
new h1emu.ZoneServer(1117, toUint8Array("F70IaxuU8C/w7FPXY1ibXw==")).start();

setInterval(() => {
  process.stdout.write("Runtime tested\n");
  process.exit(0);
}, 2000);
