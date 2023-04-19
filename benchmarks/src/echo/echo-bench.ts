import { EchoServer } from "./echo-server";
import { BenchParameters, EchoClient } from "./echo-client";

const cryptoKey = Buffer.from("F70IaxuU8C/w7FPXY1ibXw==", "base64");
const echoServer = new EchoServer(1119, cryptoKey);

// uncomment this to disable multiPackets
// echoServer._waitQueueTimeMs = 0;

echoServer.start();

const benchParameters: BenchParameters = {
  packetsToExchange: 1000,
  packetsAtATime: 50,
  stopTimerOnAllAcked: true,
  bytesPerPacket: 200,
};
const echoClient = new EchoClient(1119, benchParameters);

echoClient.sendSessionRequest();

async function echoAwait() {
  const finalTime = await echoClient.getFinalTime();
  console.log(`Took ${finalTime}ms`);
  process.exit(0);
}

echoAwait();
