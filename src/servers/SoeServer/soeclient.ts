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
import { SOEInputStream } from "./soeinputstream";
import { SOEOutputStream } from "./soeoutputstream";

export default class SOEClient {
  sessionId: number;
  address: string;
  port: number;
  crcSeed: number;
  crcLength: number = 2;
  clientUdpLength: number = 512;
  serverUdpLength: number = 512;
  sequences: any;
  compression: number;
  useEncryption: boolean = true;
  waitingQueue: any[] = [];
  outQueue: any[] = [];
  protocolName?: string;
  outOfOrderPackets: any[] = [];
  nextAck: number = -1;
  lastAck: number = -1;
  inputStream: () => void;
  outputStream: any;
  outQueueTimer: any;
  ackTimer: any;
  outOfOrderTimer: any;
  cryptoKey: Uint8Array;
  waitQueueTimer: any;
  waitingQueueCurrentByteLength: number = 0;
  constructor(
    remote: RemoteInfo,
    crcSeed: number,
    compression: number,
    cryptoKey: Uint8Array
  ) {
    this.sessionId = 0;
    this.address = remote.address;
    this.port = remote.port;
    this.crcSeed = crcSeed;
    this.compression = compression;
    this.cryptoKey = cryptoKey;
    this.inputStream = new (SOEInputStream as any)(cryptoKey);
    this.outputStream = new (SOEOutputStream as any)(cryptoKey);
  }

  clearTimers() {
    clearTimeout(this.outQueueTimer);
    clearTimeout(this.ackTimer);
    clearTimeout(this.outOfOrderTimer);
  }
}
