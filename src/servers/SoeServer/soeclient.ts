// ======================================================================
//
//   GNU GENERAL PUBLIC LICENSE
//   Version 3, 29 June 2007
//   copyright (C) 2020 - 2021 Quentin Gruber
//   copyright (C) 2021 - 2025 H1emu community
//
//   https://github.com/QuentinGruber/h1z1-server
//   https://www.npmjs.com/package/h1z1-server
//
//   Based on https://github.com/psemu/soe-network
// ======================================================================

import { RemoteInfo } from "node:dgram";
import { toInt, wrappedUint16, _ } from "../../utils/utils";
import { SOEInputStream } from "./soeinputstream";
import { SOEOutputStream } from "./soeoutputstream";
import { PacketsQueue } from "./PacketsQueue";
import { clearInterval } from "node:timers";
import { LogicalPacket } from "./logicalPacket";

interface SOEClientStats {
  totalPhysicalPacketSent: number;
  totalLogicalPacketSent: number;
  packetResend: number;
  packetsOutOfOrder: number;
}

export default class SOEClient {
  sessionId: number = 0;
  address: string;
  port: number;
  family: "IPv4" | "IPv6";
  crcSeed: number;
  crcLength: number = 2;
  clientUdpLength: number = 512;
  serverUdpLength: number = 512;
  packetsSentThisSec: number = 0;
  useEncryption: boolean = true;
  waitingQueue: PacketsQueue = new PacketsQueue();
  protocolName: string = "unset";
  unAckData: Map<number, number> = new Map();
  lastAckSend: wrappedUint16 = new wrappedUint16(-1);
  inputStream: SOEInputStream;
  outputStream: SOEOutputStream;
  soeClientId: string;
  lastKeepAliveTimer: NodeJS.Timeout | null = null;
  isDeleted: boolean = false;
  stats: SOEClientStats = {
    totalPhysicalPacketSent: 0,
    totalLogicalPacketSent: 0,
    packetsOutOfOrder: 0,
    packetResend: 0
  };
  avgPing: number = 0;
  pings: number[] = [];
  avgPingLen: number = 6;
  sendingTimer: NodeJS.Timeout | null = null;
  private _statsResetTimer: NodeJS.Timer;
  delayedLogicalPackets: LogicalPacket[] = [];
  constructor(remote: RemoteInfo, crcSeed: number, cryptoKey: Uint8Array) {
    this.soeClientId = SOEClient.getClientId(remote);
    this.address = remote.address;
    this.port = remote.port;
    this.family = remote.family;
    this.crcSeed = crcSeed;
    this.inputStream = new SOEInputStream(cryptoKey);
    this.outputStream = new SOEOutputStream(cryptoKey);
    if (remote.address === "127.0.0.1") {
      this.outputStream = new SOEOutputStream(cryptoKey, 100);
    } else {
      this.outputStream = new SOEOutputStream(cryptoKey);
    }
    this._statsResetTimer = setInterval(() => this._resetStats(), 60000);
  }
  static getClientId(remote: RemoteInfo): string {
    return remote.address + ":" + remote.port;
  }
  closeTimers() {
    // wierd stuff with the new global Symbol used with the using keyword, skipping that headache for now
    clearInterval(this._statsResetTimer as unknown as number);
  }
  private _resetStats() {
    this.stats.totalPhysicalPacketSent = 0;
    this.stats.packetsOutOfOrder = 0;
    this.stats.packetResend = 0;
    this.stats.totalLogicalPacketSent = 0;
  }
  getNetworkStats(): string[] {
    const {
      totalPhysicalPacketSent: totalPacketSent,
      packetResend,
      packetsOutOfOrder
    } = this.stats;
    const packetLossRate =
      Number((packetResend / totalPacketSent).toFixed(3)) * 100;
    const packetOutOfOrderRate =
      Number((packetsOutOfOrder / totalPacketSent).toFixed(3)) * 100;
    return [
      `Packet loss rate ${packetLossRate}%`,
      `Packet outOfOrder rate ${packetOutOfOrderRate}%`,
      `Avg ping ${this.avgPing}ms`
    ];
  }
  addPing(ping: number) {
    if (ping > 0) {
      this.pings.push(ping);
    }
    if (this.pings.length > this.avgPingLen) {
      this.pings.shift();
    }
    this._updateAvgPing();
  }
  private _updateAvgPing() {
    this.avgPing = toInt(_.sum(this.pings) / this.pings.length);
  }
}
