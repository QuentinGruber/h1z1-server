import { Base64 } from "js-base64";
import { ZoneServer, ZoneClient } from "../../../h1z1-server";

async function test() {
  await new ZoneServer(1117, Base64.toUint8Array("F70IaxuU8C/w7FPXY1ibXw=="),"mongodb://localhost:27017/",1).start();

var client = new ZoneClient(
  "127.0.0.1",
  1117,
  Base64.toUint8Array("F70IaxuU8C/w7FPXY1ibXw=="),
  "0x03147cca2a860195",
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

setTimeout(() => {
  throw new Error("Test timed out!");
}, 15000);

}
test()