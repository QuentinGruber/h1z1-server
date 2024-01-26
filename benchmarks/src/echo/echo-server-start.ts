import { EchoServer } from "./echo-server";

const cryptoKey = Buffer.from("F70IaxuU8C/w7FPXY1ibXw==", "base64");
const echoServer = new EchoServer(1115, cryptoKey);

// uncomment this to disable multiPackets
// echoServer._waitQueueTimeMs = 0;

echoServer.start();
