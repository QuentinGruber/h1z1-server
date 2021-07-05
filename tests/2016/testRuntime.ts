import * as h1emu from "../../h1z1-server";


const loginServer2016 = new h1emu.LoginServer(1115);
loginServer2016._protocol = new h1emu.LoginProtocol("LoginUdp_11");
loginServer2016.start();
new h1emu.ZoneServer2016(
  1117,
  new (Buffer as any).from("F70IaxuU8C/w7FPXY1ibXw==", 'base64')
).start();

setInterval(() => {
  process.stdout.write("Runtime tested\n");
  process.exit(0);
}, 2000);
