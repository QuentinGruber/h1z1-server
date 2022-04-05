// UNUSED FOR NOW 2016 SIMULATED CLIENT ISN'T DONE

import { ZoneServer2016, ZoneClient } from "../../h1z1-server";

new ZoneServer2016(
  1117,
  Buffer.from("F70IaxuU8C/w7FPXY1ibXw==", "base64")
).start();

var client = new ZoneClient(
  "127.0.0.1",
  1117,
  Buffer.from("F70IaxuU8C/w7FPXY1ibXw==", "base64"),
  "0x0000000000000001",
  "0",
  "",
  "",
  6457
);
client.connect();
client.on("connect", (err, res) => {
  console.log("connect");
});
client.on("ZoneDoneSendingInitialData", (err, res) => {
  console.log("ZoneDoneSendingInitialData");
  process.exit(0);
});

setInterval(() => {
  throw new Error("Test timed out!");
}, 15000);
