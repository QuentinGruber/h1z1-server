import { Base64 } from "js-base64";
import { ZoneServer,ZoneClient } from "../h1z1-server";


new ZoneServer(1117,Base64.toUint8Array("F70IaxuU8C/w7FPXY1ibXw==")).start();


var client = new ZoneClient(
  "127.0.0.1",
  1117,
  Base64.toUint8Array("F70IaxuU8C/w7FPXY1ibXw=="),
  "0x0000000000000001","0","","",6457
);
client.connect();
console.log("connect")
client.on("connect", (err,res) => {
  console.log(res)
});
client.on("SendZoneDetails", (err,res) => {
  console.log(res)
});

  setInterval(()=>{
    throw new Error("Test timed out!");
  },15000)