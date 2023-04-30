import { EchoServer } from "../echo/echo-server";
import { BenchParameters, PerSecClient } from "./persec-client";

const cryptoKey = Buffer.from("F70IaxuU8C/w7FPXY1ibXw==", "base64");
const echoServer = new EchoServer(1119, cryptoKey);

// uncomment this to disable multiPackets
// echoServer._waitQueueTimeMs = 0;

echoServer.start();

const benchParameters: BenchParameters = {
  packetsPerSec: 50,
  bytesPerPacket: 50,
};

const CLIENTS_NUMBER = 140;
const clients: PerSecClient[] = [];
let routineCount = 0;
let totalPacketsRoutine = 0;
const routines: number[] = [];
for (let index = 0; index < CLIENTS_NUMBER; index++) {
  const parsecClient = new PerSecClient(1119, benchParameters);
  clients.push(parsecClient);
  parsecClient.sendSessionRequest();
  parsecClient.on(
    "report",
    (packetsThisRoutine: number, acksThisRoutine: number) => {
      totalPacketsRoutine += packetsThisRoutine;
      return;
      console.log(
        `Client #${index} received ${packetsThisRoutine}/${benchParameters.packetsPerSec} and got ${acksThisRoutine}/${benchParameters.packetsPerSec} acks this routine #${routineCount}`
      );
    }
  );
}

const warmupRoutines = 3;
const testRoutineNumber = 120;
setInterval(() => {
  console.log(
    `Total packets for routine #${routineCount} : ${totalPacketsRoutine} with ${clients.length} clients`
  );
  if (routineCount > warmupRoutines) {
    routines.push(totalPacketsRoutine);
    if (routines.length === testRoutineNumber) {
      let allPackets = 0;
      routines.forEach((e) => (allPackets += e));
      console.log(
        `Mean packets per sec ${Math.floor(allPackets / routines.length)}`
      );
      process.exit();
    }
  }
  totalPacketsRoutine = 0;
  routineCount++;
  for (const index in clients) {
    const client = clients[index];
    client.routine();
  }
}, 1000);
