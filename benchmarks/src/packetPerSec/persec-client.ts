import { Worker } from "worker_threads";
import { Soeprotocol } from "h1emu-core";
import EventEmitter from "events";
interface ServerTarger {
  address: string;
  port: number;
}

export interface BenchParameters {
  bytesPerPacket: number;
  packetsPerSec: number;
}
export class PerSecClient extends EventEmitter {
  private _connection: Worker;
  private _serverTarget: ServerTarger;
  private _protocol: Soeprotocol;
  private _sequenceNumber: number = 0;
  private _benchParameters: BenchParameters;
  private _receivedPackets: number = 0;
  private _receivedPacketsLast: number = 0;
  private _dummyData: Uint8Array;
  private _crcLen: number = 0;
  private _lastAck: number = 0;
  private _lastAckReport: number = 0;
  constructor(serverPort: number, benchParameters: BenchParameters) {
    super();
    this._benchParameters = benchParameters;
    this._dummyData = this.genDummyData();
    this._serverTarget = { address: "127.0.0.1", port: serverPort };
    this._protocol = new Soeprotocol(Boolean(this._crcLen), 0);
    this._connection = new Worker(
      `${__dirname}/../../../out/servers/shared/workers/udpServerWorker.js`,
      {
        workerData: { serverPort: 0, disableAntiDdos: true },
      }
    );

    this._connection.on("message", (message) => {
      const data = message.data;
      this.receiveData(data);
    });
  }
  genDummyData(): Uint8Array {
    const dummy: number[] = [];
    for (let i = 0; i < this._benchParameters.bytesPerPacket; i++) {
      dummy.push(0xff);
    }
    return new Uint8Array(dummy);
  }
  sendSessionRequest() {
    const sessionRequestPacket = this._protocol.pack_session_request_packet(
      Math.floor(Math.random() * 10000),
      this._crcLen,
      512,
      "Echo"
    );
    this._sendPhysicalPacket(sessionRequestPacket);
  }

  private _sendPhysicalPacket(packet: Uint8Array): void {
    this._connection.postMessage({
      type: "sendPacket",
      data: {
        packetData: packet,
        length: packet.length,
        port: this._serverTarget.port,
        address: this._serverTarget.address,
      },
    });
  }

  sendMultipleDataPackets() {
    const { packetsPerSec: packetsAtATime } = this._benchParameters;
    for (let i = 0; i < packetsAtATime; i++) {
      this.sendData();
    }
  }

  getPackedData() {
    const dataPacket = this._protocol.pack_data_packet(
      this._dummyData,
      this._sequenceNumber
    );
    this._sequenceNumber++;
    return dataPacket;
  }
  sendData(): void {
    this._sendPhysicalPacket(this.getPackedData());
  }

  routine(): void {
    const packetsThisRoutine =
      this._receivedPackets - this._receivedPacketsLast;
    const ackThisRoutine = this._lastAck - this._lastAckReport;
    this._receivedPacketsLast = this._receivedPackets;
    this._lastAckReport = this._lastAck;
    this.emit("report", packetsThisRoutine, ackThisRoutine);
    this.sendMultipleDataPackets();
  }

  handlePacket(packet: any): void {
    switch (packet.name) {
      case "SessionReply":
        setInterval(() => {
          this.routine();
        }, 1000);
        break;
      case "MultiPacket":
        for (let i = 0; i < packet.sub_packets.length; i++) {
          const subPacket = packet.sub_packets[i];
          this.handlePacket(subPacket);
        }
        break;
      case "Data":
        this._receivedPackets++;
        this.sendAck(packet.sequence);
        break;
      case "Ack":
        this._lastAck = packet.sequence;
        break;
    }
  }
  sendAck(sequence: number) {
    const ackPacket = this._protocol.pack_ack_packet(sequence);
    this._sendPhysicalPacket(ackPacket);
  }

  receiveData(data: Uint8Array): void {
    const raw_parsed_data: string = this._protocol.parse(data);
    const parsed_data = JSON.parse(raw_parsed_data);
    this.handlePacket(parsed_data);
  }
}
