// ======================================================================
//
//   GNU GENERAL PUBLIC LICENSE
//   Version 3, 29 June 2007
//   copyright (C) 2020 - 2021 Quentin Gruber
//   copyright (C) 2021 - 2022 H1emu community
//
//   https://github.com/QuentinGruber/h1z1-server
//   https://www.npmjs.com/package/h1z1-server
//
//   Based on https://github.com/psemu/soe-network
// ======================================================================

import dgram from "node:dgram";

import { parentPort, workerData } from "node:worker_threads";

const debug = require("debug")("UDPserver");

interface Message {
  type: string;
  data?: any;
}

if (workerData) {
  const { serverPort } = workerData;
  const connection = dgram.createSocket("udp4");

  connection.once("listening", () => {
    const { address, port } = connection.address();
    debug("Listening on " + address + ":" + port);
    try {
      connection.setRecvBufferSize(64 * 1024);
      connection.setSendBufferSize(64 * 1024);
    } catch (error) {
      console.log(error);
    }
  });

  connection.on("error", (err) => {
    throw new Error(`server error:\n${err.stack}`);
  });

  connection.on("message", (data, remote) => {
    parentPort?.postMessage({
      type: "incomingPacket",
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
