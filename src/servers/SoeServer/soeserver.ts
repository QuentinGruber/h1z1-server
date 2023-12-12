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

import { EventEmitter } from "node:events";
import { RemoteInfo } from "node:dgram";
import { append_crc_legacy, SoeOpcode, Soeprotocol } from "h1emu-core";
import Client, { packetsQueue } from "./soeclient";
import SOEClient from "./soeclient";
import { crc_length_options } from "../../types/soeserver";
import { LogicalPacket } from "./logicalPacket";
import { json } from "types/shared";
import { wrappedUint16 } from "../../utils/utils";
import { SOEOutputChannels } from "./soeoutputstream";
import dgram from "node:dgram";
const debug = require("debug")("SOEServer");

export class SOEServer extends EventEmitter {
  _serverPort: number;
  _cryptoKey: Uint8Array;
  _protocol!: Soeprotocol;
  _udpLength: number = 512;
  _useEncryption: boolean = true;
  private _clients: Map<string, SOEClient> = new Map();
  private _connection: dgram.Socket;
  _crcSeed: number = Math.floor(Math.random() * 256);
  _crcLength: crc_length_options = 2;
  _waitQueueTimeMs: number = 50;
  keepAliveTimeoutTime: number = 40000;
  private readonly _maxMultiBufferSize: number;
  private _soeClientRoutineLoopMethod!: (
    arg0: () => void,
    arg1: number
  ) => void;
  private _resendTimeout: number = 500;
  packetRatePerClient: number = 500;
  private _routineTiming: number = 3;
  _allowRawDataReception: boolean = false;
  private _maxSeqResendRange: number = 50;
  private _packetResetInterval: NodeJS.Timeout | undefined;
  constructor(serverPort: number, cryptoKey: Uint8Array) {
    super();
    Buffer.poolSize = 8192 * 4;
    this._serverPort = serverPort;
    this._cryptoKey = cryptoKey;
    this._maxMultiBufferSize = this._udpLength - 4 - this._crcLength;
    this._connection = dgram.createSocket("udp4");
    this._packetResetInterval = setInterval(() => {
      this.resetPacketsSent();
    }, 1000);
  }

  getSoeClient(soeClientId: string): SOEClient | undefined {
    return this._clients.get(soeClientId);
  }

  private resetPacketsSent(): void {
    for (const client of this._clients.values()) {
      client.packetsSentThisSec = 0;
    }
  }

  private _sendPhysicalPacket(client: Client, packet: Uint8Array): void {
    client.packetsSentThisSec++;
    client.stats.totalPacketSent++;
    this._connection.send(packet, client.port, client.address);
  }

  private sendOutQueue(client: Client): void {
    debug("Sending out queue");
    while (client.packetsSentThisSec < this.packetRatePerClient) {
      const logicalPacket = client.outQueue.shift();
      if (logicalPacket) {
        // if is a reliable packet
        if (logicalPacket.isReliable && logicalPacket.sequence) {
          client.unAckData.set(logicalPacket.sequence, Date.now());
        }
        const data =
          logicalPacket.canCrc && this._crcLength
            ? append_crc_legacy(logicalPacket.data, this._crcSeed)
            : logicalPacket.data;
        this._sendPhysicalPacket(client, data);
      } else {
        break;
      }
    }
  }

  // Send pending packets from client, in priority ones from the priority queue
  private checkClientOutQueues(client: SOEClient) {
    if (client.outQueue.length > 0) {
      this.sendOutQueue(client);
    }
  }

  private soeRoutine(): void {
    const startTime = Date.now();
    for (const client of this._clients.values()) {
      this.soeClientRoutine(client);
    }
    this._soeClientRoutineLoopMethod(
      () => this.soeRoutine(),
      this._routineTiming
    );
    const endTime = Date.now();
    const timeTaken = endTime - startTime;
    if (timeTaken > this._routineTiming) {
      console.log(
        `SOE routine took ${timeTaken}ms to execute, which is more than the routine timing of ${this._routineTiming}ms`
      );
    }
  }

  // Executed at the same rate for every client
  private soeClientRoutine(client: Client) {
    // Acknowledge received packets
    this.checkAck(client);
    this.checkOutOfOrderQueue(client);
    // Send pending packets
    this.checkResendQueue(client);
    this.checkClientOutQueues(client);
  }

  // If a packet hasn't been acknowledge in the timeout time, then resend it via the priority queue
  checkResendQueue(client: Client) {
    const currentTime = Date.now();
    let resendedPackets = 0;
    for (const [sequence, time] of client.unAckData) {
      if (
        time + this._resendTimeout + client.avgPing < currentTime &&
        sequence <=
        wrappedUint16.wrap(
          client.outputStream.lastAck.get() + this._maxSeqResendRange
        )
      ) {
        client.outputStream.resendData(sequence);
        client.unAckData.delete(sequence);
        resendedPackets++;
        // So we don't loose our time with dead connections
        if (resendedPackets > 50) {
          break;
        }
      }
    }
  }

  // Use the lastAck value to acknowlege multiple packets as a time
  // This function could be called less often but rn it will stick that way
  private checkAck(client: Client) {
    if (client.lastAck.get() != client.nextAck.get()) {
      client.lastAck.set(client.nextAck.get());
      this._sendLogicalPacket(client, SoeOpcode.Ack, {
        sequence: client.nextAck.get()
      });
    }
  }

  private resetPacketsQueue(queue: packetsQueue) {
    queue.packets = [];
    queue.CurrentByteLength = 0;
  }

  private setupResendForQueuedPackets(client: Client, queue: packetsQueue) {
    for (let index = 0; index < queue.packets.length; index++) {
      const packet = queue.packets[index];
      if (packet.isReliable) {
        client.unAckData.set(
          packet.sequence as number,
          Date.now() + this._waitQueueTimeMs
        );
      }
    }
  }

  // send the queued packets
  private sendClientWaitQueue(client: Client, queue: packetsQueue): void {
    if (queue.timer) {
      clearTimeout(queue.timer);
      queue.timer = undefined;
    }
    if (queue.packets.length) {
      this._sendLogicalPacket(client, SoeOpcode.MultiPacket, {
        sub_packets: queue.packets.map((packet) => {
          return Array.from(packet.data);
        })
      });
      // if a packet in the waiting queue is a reliable packet, then we need to set the timeout
      this.setupResendForQueuedPackets(client, queue);
      this.resetPacketsQueue(queue);
    }
  }
  // If some packets are received out of order then we Acknowledge then one by one
  private checkOutOfOrderQueue(client: Client) {
    if (client.outOfOrderPackets.length) {
      for (let i = 0; i < client.outOfOrderPackets.length; i++) {
        const sequence = client.outOfOrderPackets.shift();
        if (sequence > client.lastAck.get()) {
          this._sendLogicalPacket(client, SoeOpcode.OutOfOrder, {
            sequence: sequence
          });
        }
      }
    }
  }

  private _createClient(clientId: string, remote: RemoteInfo) {
    const client = new SOEClient(remote, this._crcSeed, this._cryptoKey);
    this._clients.set(clientId, client);
    return client;
  }

  private handlePacket(client: SOEClient, packet: any) {
    if (client.lastKeepAliveTimer) {
      client.lastKeepAliveTimer.refresh();
    }
    switch (packet.name) {
      case "SessionRequest":
        debug(
          "Received session request from " + client.address + ":" + client.port
        );
        client.sessionId = packet.session_id;
        client.clientUdpLength = packet.udp_length;
        client.protocolName = packet.protocol;
        client.serverUdpLength = this._udpLength;
        client.crcSeed = this._crcSeed;
        client.crcLength = this._crcLength;
        client.inputStream.setEncryption(this._useEncryption);
        client.outputStream.setEncryption(this._useEncryption);
        client.outputStream.setFragmentSize(client.clientUdpLength - 7); // TODO: 7? calculate this based on crc enabled / compression etc
        client.lastKeepAliveTimer = this.keepAliveTimeoutTime
          ? setTimeout(() => {
            debug("Client keep alive timeout");
            this.emit("disconnect", client);
          }, this.keepAliveTimeoutTime)
          : null;

        this._sendLogicalPacket(
          client,
          SoeOpcode.SessionReply,
          {
            session_id: client.sessionId,
            crc_seed: client.crcSeed,
            crc_length: client.crcLength,
            encrypt_method: 0,
            udp_length: client.serverUdpLength
          },
          true
        );
        break;
      case "FatalError":
      case "Disconnect":
        debug("Received disconnect from client");
        this.emit("disconnect", client);
        break;
      case "MultiPacket": {
        for (let i = 0; i < packet.sub_packets.length; i++) {
          const subPacket = packet.sub_packets[i];
          this.handlePacket(client, subPacket);
        }
        break;
      }
      case "Ping":
        debug("Received ping from client");
        this._sendLogicalPacket(client, SoeOpcode.Ping, {}, true);
        break;
      case "NetStatusRequest":
        debug("Received net status request from client");
        break;
      case "Data":
        client.inputStream.write(
          Buffer.from(packet.data),
          packet.sequence,
          false
        );
        break;
      case "DataFragment":
        client.inputStream.write(
          Buffer.from(packet.data),
          packet.sequence,
          true
        );
        break;
      case "OutOfOrder":
        client.addPing(
          Date.now() +
          this._waitQueueTimeMs -
          (client.unAckData.get(packet.sequence) as number)
        );
        client.outputStream.removeFromCache(packet.sequence);
        client.unAckData.delete(packet.sequence);
        break;
      case "Ack":
        const mostWaitedPacketTime = client.unAckData.get(
          client.outputStream.lastAck.get()
        ) as number;
        if (mostWaitedPacketTime) {
          client.addPing(
            Date.now() + this._waitQueueTimeMs - mostWaitedPacketTime
          );
        }
        client.outputStream.ack(packet.sequence, client.unAckData);
        break;
      default:
        console.log(`Unknown SOE packet received from ${client.sessionId}`);
        console.log(packet);
    }
  }

  start(crcLength?: crc_length_options, udpLength?: number): void {
    if (crcLength !== undefined) {
      this._crcLength = crcLength;
    }
    this._protocol = new Soeprotocol(Boolean(this._crcLength), this._crcSeed);
    if (udpLength !== undefined) {
      this._udpLength = udpLength;
    }
    this._soeClientRoutineLoopMethod = setTimeout;
    this._soeClientRoutineLoopMethod(
      () => this.soeRoutine(),
      this._routineTiming
    );
    this._connection.on("message", (data, remote) => {
      try {
        let client: SOEClient;
        const clientId = remote.address + ":" + remote.port;
        debug(data.length + " bytes from ", clientId);
        // if doesn't know the client
        if (!this._clients.has(clientId)) {
          if (data[1] !== 1) {
            return;
          }
          client = this._createClient(clientId, remote);

          client.inputStream.on("appdata", (data: Buffer) => {
            this.emit("appdata", client, data);
          });

          client.inputStream.on("error", (err: Error) => {
            console.error(err);
            this.emit("disconnect", client);
          });

          client.inputStream.on("ack", (sequence: number) => {
            client.nextAck.set(sequence);
          });

          client.inputStream.on("outoforder", (outOfOrderSequence: number) => {
            client.stats.packetsOutOfOrder++;
            client.outOfOrderPackets.push(outOfOrderSequence);
          });

          client.outputStream.on(
            SOEOutputChannels.Reliable,
            (
              data: Buffer,
              sequence: number,
              fragment: boolean,
              unbuffered: boolean
            ) => {
              this._sendLogicalPacket(
                client,
                fragment ? SoeOpcode.DataFragment : SoeOpcode.Data,
                {
                  sequence: sequence,
                  data: data
                },
                unbuffered
              );
            }
          );

          client.outputStream.on(
            SOEOutputChannels.Ordered,
            (data: Buffer, sequence: number, unbuffered: boolean) => {
              console.log("ordered");
              this._sendLogicalPacket(
                client,
                SoeOpcode.Ordered,
                {
                  sequence: sequence,
                  data: data
                },
                unbuffered
              );
            }
          );

          // client.outputStream.on(SOEOutputChannels.Raw, (data: Buffer) => {
          // TODO:
          // });

          // the only difference with the event "data" is that resended data is send via the priority queue
          client.outputStream.on(
            "dataResend",
            (data: Buffer, sequence: number, fragment: boolean) => {
              client.stats.packetResend++;
              this._sendLogicalPacket(
                client,
                fragment ? SoeOpcode.DataFragment : SoeOpcode.Data,
                {
                  sequence: sequence,
                  data: data
                }
              );
            }
          );
        } else {
          client = this._clients.get(clientId) as SOEClient;
        }
        if (data[0] === 0x00) {
          const raw_parsed_data: string = this._protocol.parse(data);
          if (raw_parsed_data) {
            const parsed_data = JSON.parse(raw_parsed_data);
            if (parsed_data.name === "Error") {
              console.error("parsing error " + parsed_data.error);
              console.error(parsed_data);
            } else {
              this.handlePacket(client, parsed_data);
            }
          } else {
            console.error("Unmanaged packet from client", clientId, data);
          }
        } else {
          if (this._allowRawDataReception) {
            console.log("Raw data received from client", clientId, data);
            this.emit("appdata", client, data, true); // Unreliable + Unordered
          } else {
            console.log(
              "Raw data received from client but raw data reception isn't enabled",
              clientId,
              data
            );
          }
        }
      } catch (e) {
        console.log(e);
        process.exitCode = 1;
      }
    });
    this._connection.bind(this._serverPort);
  }

  async stop(): Promise<void> {
    this._soeClientRoutineLoopMethod = () => { };
    clearInterval(this._packetResetInterval);
    // delete all _clients
    for (const client of this._clients.values()) {
      client.closeTimers();
    }
    await new Promise<void>((resolve) => {
      this._connection.close(() => {
        resolve();
      });
    }
    );
  }

  private packLogicalData(packetOpcode: SoeOpcode, packet: json): Buffer {
    let logicalData;
    switch (packetOpcode) {
      case SoeOpcode.SessionRequest:
        logicalData = this._protocol.pack_session_request_packet(
          packet.session_id,
          packet.crc_length,
          packet.udp_length,
          packet.protocol
        );
        break;
      case SoeOpcode.SessionReply:
        logicalData = this._protocol.pack_session_reply_packet(
          packet.session_id,
          packet.crc_seed,
          packet.crc_length,
          packet.encrypt_method,
          packet.udp_length
        );
        break;
      case SoeOpcode.MultiPacket:
        logicalData = this._protocol.pack_multi_fromjs(packet);
        break;
      case SoeOpcode.Ack:
        logicalData = this._protocol.pack_ack_packet(packet.sequence);
        break;
      case SoeOpcode.OutOfOrder:
        logicalData = this._protocol.pack_out_of_order_packet(packet.sequence);
        break;
      case SoeOpcode.Ordered:
        logicalData = this._protocol.pack_ordered_packet(
          packet.data,
          packet.sequence
        );
        break;
      case SoeOpcode.Data:
        logicalData = this._protocol.pack_data_packet(
          packet.data,
          packet.sequence
        );
        break;
      case SoeOpcode.DataFragment:
        logicalData = this._protocol.pack_fragment_data_packet(
          packet.data,
          packet.sequence
        );
        break;
      default:
        logicalData = this._protocol.pack(packetOpcode, JSON.stringify(packet));
        break;
    }
    return Buffer.from(logicalData);
  }
  // Build the logical packet via the soeprotocol
  private createLogicalPacket(
    packetOpcode: SoeOpcode,
    packet: json
  ): LogicalPacket {
    try {
      const logicalPacket = new LogicalPacket(
        this.packLogicalData(packetOpcode, packet),
        packet.sequence
      );
      return logicalPacket;
    } catch (e) {
      console.error(
        `Failed to create packet ${packetOpcode} packet data : ${JSON.stringify(
          packet,
          null,
          4
        )}`
      );
      console.error(e);
      process.exitCode = 444;
      // @ts-ignore
      return null;
    }
  }

  private _addPacketToQueue(
    logicalPacket: LogicalPacket,
    queue: packetsQueue
  ): void {
    const fullBufferedPacketLen = logicalPacket.data.length + 1; // the additionnal byte is the length of the packet written in the buffer when assembling the packet
    queue.packets.push(logicalPacket);
    queue.CurrentByteLength += fullBufferedPacketLen;
  }

  private _canBeBuffered(
    logicalPacket: LogicalPacket,
    queue: packetsQueue
  ): boolean {
    return (
      this._waitQueueTimeMs > 0 &&
      logicalPacket.data.length < 255 &&
      queue.CurrentByteLength + logicalPacket.data.length <=
      this._maxMultiBufferSize
    );
  }

  private _addPacketToBuffer(
    client: SOEClient,
    logicalPacket: LogicalPacket,
    queue: packetsQueue
  ): void {
    this._addPacketToQueue(logicalPacket, queue);
    if (!queue.timer) {
      queue.timer = setTimeout(() => {
        this.sendClientWaitQueue(client, queue);
      }, this._waitQueueTimeMs);
    }
  }

  // The packets is builded from schema and added to one of the queues
  private _sendLogicalPacket(
    client: Client,
    packetOpcode: SoeOpcode,
    packet: json,
    unbuffered = false
  ): void {
    const logicalPacket = this.createLogicalPacket(packetOpcode, packet);
    if (
      !unbuffered &&
      packetOpcode !== SoeOpcode.MultiPacket &&
      this._canBeBuffered(logicalPacket, client.waitingQueue)
    ) {
      this._addPacketToBuffer(client, logicalPacket, client.waitingQueue);
    } else {
      if (packetOpcode !== SoeOpcode.MultiPacket) {
        this.sendClientWaitQueue(client, client.waitingQueue);
      }
      client.outQueue.push(logicalPacket);
    }
  }

  // Called by the application to send data to a client
  sendAppData(
    client: Client,
    data: Uint8Array,
    channel = SOEOutputChannels.Reliable,
    unbuffered: boolean = false
  ): void {
    if (client.outputStream.isUsingEncryption()) {
      debug("Sending app data: " + data.length + " bytes with encryption");
    } else {
      debug("Sending app data: " + data.length + " bytes");
    }
    client.outputStream.write(data, channel, unbuffered);
  }

  setEncryption(client: Client, value: boolean): void {
    client.outputStream.setEncryption(value);
    client.inputStream.setEncryption(value);
  }

  toggleEncryption(client: Client): void {
    client.outputStream.toggleEncryption();
    client.inputStream.toggleEncryption();
  }

  deleteClient(client: SOEClient): void {
    client.closeTimers();
    this._clients.delete(client.address + ":" + client.port);
    debug("client connection from port : ", client.port, " deleted");
  }
}

exports.SOEServer = SOEServer;
