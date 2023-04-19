import { EchoServer } from "../echo/echo-server";
import { BenchParameters, PerSecClient } from "./persec-client";

const cryptoKey = Buffer.from("F70IaxuU8C/w7FPXY1ibXw==", "base64");
const echoServer = new EchoServer(1119, cryptoKey);

// uncomment this to disable multiPackets
// echoServer._waitQueueTimeMs = 0;

echoServer.start();

const benchParameters: BenchParameters = {
  packetsPerSec: 200,
  bytesPerPacket: 50,
};

const CLIENTS_NUMBER = 1;
for (let index = 0; index < CLIENTS_NUMBER; index++) {
  const echoClient = new PerSecClient(1119, benchParameters);

  echoClient.sendSessionRequest();
  let routineCount = 0;
  echoClient.on(
    "report",
    (packetsThisRoutine: number, acksThisRoutine: number) => {
      routineCount++;
      console.log(
        `Client #${index} received ${packetsThisRoutine}/${benchParameters.packetsPerSec} and got ${acksThisRoutine}/${benchParameters.packetsPerSec} acks this routine #${routineCount}`
      );
    }
  );
}
