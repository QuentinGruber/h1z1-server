const h1emu = require("../h1z1-server");
const { toUint8Array } = require("js-base64");

new h1emu.LoginServer(1115).start();
new h1emu.ZoneServer(1115, toUint8Array("F70IaxuU8C/w7FPXY1ibXw==")).start();

setInterval(() => {
  process.stdout.write("Runtime tested\n");
  process.exit(0);
}, 2000);
