import { RemoteInfo } from "dgram";
import { SOEInputStream } from "./soeinputstream";
import { Worker } from "worker_threads";
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
  outQueue: any[] = [];
  protocolName?: string;
  outOfOrderPackets: any[] = [];
  nextAck: number = -1;
  lastAck: number = -1;
  inputStream: any;
  outputStream: Worker;
  outQueueTimer: any;
  ackTimer: any;
  outOfOrderTimer: any;
  cryptoKey: Uint8Array;

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
    this.outputStream = new Worker(__dirname+"/workers/soeoutputstream.js",{workerData:{cryptoKey:cryptoKey}});
  }

  clearAll(){
    this.clearWorkers();
    this.clearTimers();
  }
  clearWorkers() {
    console.log("cleaaar")
    this.outputStream.postMessage({type:"kill"});
  }
  clearTimers() {
    clearTimeout(this.outQueueTimer);
    clearTimeout(this.ackTimer);
    clearTimeout(this.outOfOrderTimer);
  }
}
