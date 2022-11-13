import { EchoServer } from "./echo-server"
import { EchoClient } from "./echo-client"

const cryptoKey = Buffer.from("F70IaxuU8C/w7FPXY1ibXw==", "base64");
const echoServer = new EchoServer(1119,cryptoKey)

echoServer.start()

const echoClient = new EchoClient("127.0.0.1",1119)

echoClient.sendSessionRequest()
