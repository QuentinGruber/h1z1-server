import dgram from "dgram";

import { workerData, parentPort } from "worker_threads";
const debug = require("debug")("UDPserver");

interface Message {
  type: string;
  data?: any;
}

if (workerData) {
  const { serverPort } = workerData;
  const connection = dgram.createSocket("udp4");

  connection.on("listening", () => {
    const { address, port } = connection.address();
    debug("Listening on " + address + ":" + port);
    try {
      // to be honest idk how much i need to alloc to that it's mostly a test
      connection.setRecvBufferSize(1000000000);
    } catch (error) {
      console.log(error);
    }
  });

  connection.on("error", (err) => {
    console.log(`server error:\n${err.stack}`);
  });

  connection.on("message", (data, remote) => {
    parentPort?.postMessage({
      type: "incommingPacket",
      data: data,
      remote: remote,
    });
  });

  parentPort?.on("message", (message: Message) => {
    switch (message.type) {
      case "sendPacket":
        const { packetData, port, address } = message.data;
        connection.send(packetData, port, address);
        break;
      case "bind":
        connection.bind(serverPort, function () {});
        break;
      case "close":
        connection.close();
        process.exit(0);
      default:
        break;
    }
  });
}
