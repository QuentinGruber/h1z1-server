import { ZoneClient } from "../../h1z1-server";
import { Int64String } from "../../out/utils/utils.js";

import { Worker } from "worker_threads";

const ZoneServer = new Worker(`${__dirname}/workers/zoneServer.js`);
ZoneServer.on("message", testLoad);

function testLoad() {
  for (let index = 0; index < 100; index++) {
    const client = new ZoneClient(
      "127.0.0.1",
      1117,
      new (Buffer as any).from("F70IaxuU8C/w7FPXY1ibXw==", 'base64'),
      Int64String(index),
      "0",
      "",
      "",
      6457 + index
    );
    console.time("FullConnectToZone" + index);
    client.connect();
    client.on("ZoneDoneSendingInitialData", (err, res) => {
      console.timeEnd("FullConnectToZone" + index);
    });
  }
}
