import { EchoServer } from "./echo-server";
import { BenchParameters, EchoClient } from "./echo-client";

const cryptoKey = Buffer.from("F70IaxuU8C/w7FPXY1ibXw==", "base64");
const echoServer = new EchoServer(1119, cryptoKey);

// uncomment this to disable multiPackets
// echoServer._waitQueueTimeMs = 0;

echoServer.start();
async function echoAwait(echoClient: EchoClient, clientId: number) {
  const finalTime = await echoClient.getFinalTime();
  console.log(`Took ${finalTime}ms #${clientId}`);
}

const benchParameters: BenchParameters = {
  packetsToExchange: 1000,
  packetsAtATime: 50,
  stopTimerOnAllAcked: true,
  bytesPerPacket: 200,
};

const CLIENTS_NUMBER = 50;
for (let index = 0; index < CLIENTS_NUMBER; index++) {
  const echoClient = new EchoClient(1119, benchParameters);

  echoClient.sendSessionRequest();

  echoAwait(echoClient, index);
}
