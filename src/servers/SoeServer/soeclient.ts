import { RemoteInfo } from "dgram";
import { SOEInputStream } from "./soeinputstream";
import { SOEOutputStream } from "./soeoutputstream";

export default class SOEClient {
  sessionId: number;
  address: string;
  port: number;
  crcSeed: number;
  crcLength: number;
  clientUdpLength: number;
  serverUdpLength: number;
  sequences: any;
  compression: number;
  useEncryption: boolean;
  outQueue: any[];
  protocolName?: string;
  outOfOrderPackets: any;
  nextAck: number;
  lastAck: number;
  inputStream: () => void;
  outputStream: () => void;
  outQueueTimer: any;
  ackTimer: any;
  outOfOrderTimer: any;
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
    this.crcLength = 2;
    this.clientUdpLength = 512;
    this.serverUdpLength = 512;
    this.sequences = [];
    this.compression = compression;
    this.useEncryption = true;
    this.outQueue = [];
    this.outOfOrderPackets = [];
    this.nextAck = -1;
    this.lastAck = -1;
    this.inputStream = new (SOEInputStream as any)(cryptoKey);
    this.outputStream = new (SOEOutputStream as any)(cryptoKey);
  }
}
