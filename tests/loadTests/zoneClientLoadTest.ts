import { Base64 } from "js-base64";
import { ZoneServer,ZoneClient } from "../../h1z1-server";
import {Int64String} from "../../out/utils/utils.js"

new ZoneServer(1117,Base64.toUint8Array("F70IaxuU8C/w7FPXY1ibXw==")).start();

for (let index = 0; index < 100; index++) {
  var client = new ZoneClient(
    "127.0.0.1",
    1117,
    Base64.toUint8Array("F70IaxuU8C/w7FPXY1ibXw=="),
    Int64String(index),"0","","",(6457 + index)
  );
  console.time("FullConnectToZone"+ index)
  client.connect();
  client.on("ZoneDoneSendingInitialData", (err,res) => {
    console.timeEnd("FullConnectToZone"+ index)
  });
}