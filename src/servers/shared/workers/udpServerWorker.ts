// ======================================================================
//
//   GNU GENERAL PUBLIC LICENSE
//   Version 3, 29 June 2007
//   copyright (C) 2020 - 2021 Quentin Gruber
//   copyright (C) 2021 - 2023 H1emu community
//
//   https://github.com/QuentinGruber/h1z1-server
//   https://www.npmjs.com/package/h1z1-server
//
//   Based on https://github.com/psemu/soe-network
// ======================================================================

import dgram from "dgram";
import { expose } from "threads/worker";
import { parentPort } from "worker_threads";

const debug = require("debug")("UDPserver");

let remoteRate = 1000;
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

const remotesRate: { [address: string]: number } = {};
const packetQueue: UdpPacket[] = [];

connection.on("message", (data, remote) => {
  if (remotesRate[remote.address]) {
    remotesRate[remote.address]++;
    if (remotesRate[remote.address] > remoteRate) {
      return;
    }
  } else {
    remotesRate[remote.address] = 1;
  }
  packetQueue.push({ data, remote });
});

setInterval(() => {
  for (const index in remotesRate) {
    remotesRate[index] = 0;
  }
}, 1000);

export interface UdpPacket {
  data: Uint8Array;
  remote: any; // TODO
}
export interface UdpServerWorker {
  disableAntiDDOS: () => Promise<void>;
  bind: (port: number) => Promise<void>;
  close: () => Promise<void>;
  send: (
    packetData: WebGLUniformLocation,
    port: number,
    address: string
  ) => Promise<void>;
  fetchPackets: (max: number) => Promise<UdpPacket[]>;
}
expose({
  disableAntiDDOS() {
    remoteRate = Infinity;
  },
  bind(port: number) {
    connection.bind(port);
  },
  close() {
    connection.close();
  },
  send(packetData: Uint8Array, port: number, address: string) {
    connection.send(packetData, port, address);
  },
  fetchPackets(max: number) {
    const packetsToReturn: UdpPacket[] = [];
    for (
      let i = 0;
      i < (packetQueue.length < max ? packetQueue.length : max);
      i++
    ) {
      const packet = packetQueue.shift() as UdpPacket
      packetsToReturn.push(packet);
    }
    return packetsToReturn;
  },
});
