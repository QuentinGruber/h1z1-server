import { ZoneServer, ZoneClient } from "../../../h1z1-server";

async function test() {
  const zoneServer = new ZoneServer(
    1117,
    new (Buffer as any).from("F70IaxuU8C/w7FPXY1ibXw==", "base64"),
    "mongodb://localhost:27017/",
    1
  )
  zoneServer._gatewayServer._soeServer._useMultiPackets = false;
  await zoneServer.start();

  setTimeout(() => {
    var client = new ZoneClient(
      "127.0.0.1",
      1117,
      new (Buffer as any).from("F70IaxuU8C/w7FPXY1ibXw==", "base64"),
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
  }, 2000);

  setTimeout(() => {
    throw new Error("Test timed out!");
  }, 60000);
}
test();
