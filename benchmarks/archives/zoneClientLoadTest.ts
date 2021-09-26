import { ZoneClient } from "../../h1z1-server";

import { Worker } from "worker_threads";

const ZoneServer = new Worker(`${__dirname}/workers/zoneServer.js`);
ZoneServer.on("message", () => setTimeout(testLoad, 100));

function testLoad() {
  for (let index = 0; index < 100; index++) {
    const client = new ZoneClient(
      "127.0.0.1",
      1117,
      new (Buffer as any).from("F70IaxuU8C/w7FPXY1ibXw==", "base64"),
      "0x03147cca2a860191",
      "0",
      "",
      "",
      6457 + index
    );
    console.time("FullConnectToZone" + index);
    queueMicrotask(() => client.connect());
    client.on("ZoneDoneSendingInitialData", (err, res) => {
      console.timeEnd("FullConnectToZone" + index);
    });
  }
}
