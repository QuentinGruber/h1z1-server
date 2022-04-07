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
  protocolName: string = "unset";
  outOfOrderPackets: any[] = [];
  nextAck: number = -1;
  lastAck: number = -1;
  inputStream: SOEInputStream;
  outputStream: SOEOutputStream;
  cryptoKey: Uint8Array;
  waitQueueTimer?: NodeJS.Timeout;
  waitingQueueCurrentByteLength: number = 0;
  soeClientId: string;
  lastPingTimer!: NodeJS.Timeout;
  isDeleted: boolean = false;
  constructor(
    remote: RemoteInfo,
    crcSeed: number,
    compression: number,
    cryptoKey: Uint8Array
  ) {
    this.sessionId = 0;
    this.soeClientId = remote.address + ":" + remote.port;
    this.address = remote.address;
    this.port = remote.port;
    this.crcSeed = crcSeed;
    this.compression = compression;
    this.cryptoKey = cryptoKey;
    this.inputStream = new SOEInputStream(cryptoKey);
    this.outputStream = new SOEOutputStream(cryptoKey);
  }
}
