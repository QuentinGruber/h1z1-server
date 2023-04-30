import { Worker } from "worker_threads";
import { Soeprotocol } from "h1emu-core";
import { Scheduler } from "../../../out/utils/utils";
interface ServerTarger {
  address: string;
  port: number;
}

export interface BenchParameters {
  packetsToExchange: number;
  packetsAtATime: number;
  stopTimerOnAllAcked: boolean;
  bytesPerPacket: number;
}
export class EchoClient {
  private _connection: Worker;
  private _serverTarget: ServerTarger;
  private _protocol: Soeprotocol;
  private _sequenceNumber: number = 0;
  private _benchParameters: BenchParameters;
  private _receiveEchoedPackets: number = 0;
  private _timerStartTime: number = 0;
  private _finalTime: any;
  private _isRunning: boolean = true;
  private _receivePacketsFromBundle: number = 0;
  private _lastAck: number = 0;
  private _dummyData: Uint8Array;
  constructor(serverPort: number, benchParameters: BenchParameters) {
    this._benchParameters = benchParameters;
    this._dummyData = this.genDummyData();
    this._serverTarget = { address: "127.0.0.1", port: serverPort };
    this._protocol = new Soeprotocol(false, 0);
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
      Math.floor(Math.random() * 100000),
      0,
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
    const { packetsAtATime } = this._benchParameters;
    const packetsLeftsToSend =
      this._benchParameters.packetsToExchange - this._receiveEchoedPackets;
    const packetsToSend =
      packetsLeftsToSend > packetsAtATime ? packetsAtATime : packetsLeftsToSend;
    for (let i = 0; i < packetsToSend; i++) {
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

  startTimer() {
    this._timerStartTime = Date.now();
  }

  stopTimer() {
    this._finalTime = Date.now() - this._timerStartTime;
  }

  async getFinalTime() {
    while (!this._finalTime) {
      await Scheduler.yield();
    }
    return this._finalTime;
  }

  hasFinish(): boolean {
    const allPacketsEchoed =
      this._receiveEchoedPackets === this._benchParameters.packetsToExchange;

    const allPacketsAcked =
      this._lastAck === this._benchParameters.packetsToExchange - 1;

    return (
      allPacketsEchoed &&
      (!this._benchParameters.stopTimerOnAllAcked || allPacketsAcked)
    );
  }

  finish() {
    this._isRunning = false;
    this.stopTimer();
  }

  handlePacket(packet: any): void {
    if (!this._isRunning) {
      return;
    }
    switch (packet.name) {
      case "SessionReply":
        this.sendMultipleDataPackets();
        this.startTimer();
        break;
      case "MultiPacket":
        for (let i = 0; i < packet.sub_packets.length; i++) {
          const subPacket = packet.sub_packets[i];
          this.handlePacket(subPacket);
        }
        break;
      case "Data":
        this._receiveEchoedPackets++;
        this._receivePacketsFromBundle++;
        if (this.hasFinish()) {
          this.finish();
        } else if (
          this._receivePacketsFromBundle ===
          this._benchParameters.packetsAtATime
        ) {
          this._receivePacketsFromBundle = 0;
          this.sendMultipleDataPackets();
        }
        this.sendAck(packet.sequence);
        break;
      case "Ack":
        this._lastAck = packet.sequence;
        if (this.hasFinish()) {
          this.finish();
        }
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
