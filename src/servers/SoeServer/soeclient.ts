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

import { RemoteInfo } from "dgram";
import { wrappedUint16 } from "../../utils/utils";
import { soePacket } from "../../types/soeserver";
import { SOEInputStream } from "./soeinputstream";
import { SOEOutputStream } from "./soeoutputstream";
import { LogicalPacket } from "./logicalPacket";

interface SOEClientStats {
  totalPacketSent: number;
  packetResend: number;
  packetsOutOfOrder: number;
}

export interface packetsQueue {
  packets: LogicalPacket[];
  CurrentByteLength: number;
  timer?: NodeJS.Timeout;
}
export default class SOEClient {
  sessionId: number = 0;
  address: string;
  port: number;
  crcSeed: number;
  crcLength: number = 2;
  clientUdpLength: number = 512;
  serverUdpLength: number = 512;
  packetsSentThisSec: number = 0;
  useEncryption: boolean = true;
  waitingQueue: packetsQueue = { packets: [], CurrentByteLength: 0 };
  outQueue: LogicalPacket[] = [];
  protocolName: string = "unset";
  unAckData: Map<number, number> = new Map();
  outOfOrderPackets: soePacket[] = [];
  nextAck: wrappedUint16 = new wrappedUint16(-1);
  lastAck: wrappedUint16 = new wrappedUint16(-1);
  inputStream: SOEInputStream;
  outputStream: SOEOutputStream;
  soeClientId: string;
  lastPingTimer!: NodeJS.Timeout;
  isDeleted: boolean = false;
  stats: SOEClientStats = {
    totalPacketSent: 0,
    packetsOutOfOrder: 0,
    packetResend: 0,
  };
  lastAckTime: number = 0;
  constructor(remote: RemoteInfo, crcSeed: number, cryptoKey: Uint8Array) {
    this.soeClientId = remote.address + ":" + remote.port;
    this.address = remote.address;
    this.port = remote.port;
    this.crcSeed = crcSeed;
    this.inputStream = new SOEInputStream(cryptoKey);
    this.outputStream = new SOEOutputStream(cryptoKey);
  }
  getNetworkStats(): string[] {
    const { totalPacketSent, packetResend, packetsOutOfOrder } = this.stats;
    const packetLossRate =
      Number((packetResend / totalPacketSent).toFixed(3)) * 100;
    const packetOutOfOrderRate =
      Number((packetsOutOfOrder / totalPacketSent).toFixed(3)) * 100;
    return [
      `Packet loss rate ${packetLossRate}%`,
      `Packet outOfOrder rate ${packetOutOfOrderRate}%`,
    ];
  }
}
