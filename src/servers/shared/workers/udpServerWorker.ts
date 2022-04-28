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

import dgram from "dgram";

import { parentPort, workerData } from "worker_threads";

const debug = require("debug")("UDPserver");

interface Message {
  type: string;
  data: {packetData:Buffer, port:number, address:string};
}

let sentPerSec = 0
let receivedPerSec = 0
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

  const remotesRate:any = {}

  connection.on("message", (data, remote) => {
    receivedPerSec++;
    if(remotesRate[remote.address]){
      remotesRate[remote.address]++
      if(remotesRate[remote.address] > 1000){
        return
      }
    }
    else{
      remotesRate[remote.address] = 1
    }
  
    parentPort?.postMessage({
      data: data,
      remote: remote,
    });
  });

  parentPort?.on("message", (message: Message) => {
    switch (message.type) {
      case "sendPacket":
        sentPerSec++;
        const { packetData, port, address } = message.data;
        connection.send(packetData, port, address);
        break;
      case "bind":
        connection.bind(serverPort);
        break;
      case "close":
        connection.close();
      default:
        break;
    }
  });

  setInterval(() => {
   // console.log("sentPerSec:", sentPerSec);
   // console.log("receivedPerSec:", receivedPerSec);
    sentPerSec = 0
    receivedPerSec = 0;
    for (const index in remotesRate) {
      remotesRate[index] = 0;
    }
  } , 1000);
}
