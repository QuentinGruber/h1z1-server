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
import Client from "./soeclient";
import SOEClient from "./soeclient";
import { crc_length_options } from "../../types/soeserver";
import { LogicalPacket } from "./logicalPacket";
import { json } from "types/shared";
import { SOEOutputChannels } from "./soeoutputstream";
import dgram from "node:dgram";
import { PacketsQueue } from "./PacketsQueue";
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
  _waitTimeMs: number = 50;
  keepAliveTimeoutTime: number = 40000;
  private readonly _maxMultiBufferSize: number;
  private _resendTimeout: number = 500;
  _allowRawDataReception: boolean = false;
  private _packetResetInterval: NodeJS.Timeout | undefined;
  constructor(serverPort: number, cryptoKey: Uint8Array) {
    super();
    const oneMb = 1024 * 1024;
    Buffer.poolSize = oneMb;
    this._serverPort = serverPort;
    this._cryptoKey = cryptoKey;
    this._maxMultiBufferSize = this._udpLength - 4 - this._crcLength;
    this._connection = dgram.createSocket("udp4");
    // set recv buffer size to 1mb and send buffer size to 1mb
    this._connection.on("listening", () => {
      this._connection.setRecvBufferSize(oneMb);
      this._connection.setSendBufferSize(oneMb);
    });
  }

  getSoeClient(soeClientId: string): SOEClient | undefined {
    return this._clients.get(soeClientId);
  }

  private _sendAndBuildPhysicalPacket(
    client: Client,
    logicalPacket: LogicalPacket
  ): void {
    const data =
      logicalPacket.canCrc && this._crcLength
        ? append_crc_legacy(logicalPacket.data, this._crcSeed)
        : logicalPacket.data;
    //FIXME: that's shit
    if (logicalPacket.isReliable) {
      client.unAckData.set(logicalPacket.sequence as number, Date.now());
    }
    client.sendSinceLastAck++;
    this._sendPhysicalPacket(client, data);
  }

  private _sendPhysicalPacket(client: Client, packet: Uint8Array): void {
    client.packetsSentThisSec++;
    client.bytesSentThisSec += packet.byteLength;
    client.stats.totalPhysicalPacketSent++;
    debug("Sending physical packet", packet);

    // const packetopcode = SoeOpcode[packet[1]];
    // console.log("sends : ", packetopcode);
    // 10% chances to drop the packet
    // const rnd = Math.random() * 100;
    // if (rnd < 10) {
    //   return;
    // }
    this._connection.send(packet, client.port, client.address);
  }

  // If a packet hasn't been acknowledge in the timeout time, then resend it
  getResends(client: Client): LogicalPacket[] {
    const currentTime = Date.now();
    const resends: LogicalPacket[] = [];
    const resendedSequence: Set<number> = new Set();
    // First added packets are the first to be resend
    for (const [sequence, time] of client.unAckData) {
      // So we don't loose our time with dead connections
      if (time + this._resendTimeout + client.avgPing < currentTime) {
        const dataCache = client.outputStream.getDataCache(sequence);
        if (dataCache) {
          client.stats.packetResend++;

          const logicalPacket = this.createLogicalPacket(
            dataCache.fragment ? SoeOpcode.DataFragment : SoeOpcode.Data,
            { sequence: sequence, data: dataCache.data }
          );
          if (logicalPacket) {
            resendedSequence.add(sequence);
            resends.push(logicalPacket);
          }
        } else {
          console.log("(timeout)Data cache not found for sequence " + sequence);
        }
      }
    }
    // check for possible accerated resends
    for (const sequence of client.outputStream.outOfOrder) {
      if (sequence < client.outputStream.lastAck.get()) {
        continue;
      }

      // resend every packets between the last ack and the out of order packet
      for (
        let index = client.outputStream.lastAck.get();
        index < sequence;
        index++
      ) {
        // If that sequence has been out of order acked or resended then we don't resend it again
        if (
          client.outputStream.outOfOrder.has(index) ||
          resendedSequence.has(index)
        ) {
          continue;
        }
        const dataCache = client.outputStream.getDataCache(index);
        if (dataCache) {
          client.stats.packetResend++;

          const logicalPacket = this.createLogicalPacket(
            dataCache.fragment ? SoeOpcode.DataFragment : SoeOpcode.Data,
            { sequence: index, data: dataCache.data }
          );
          if (logicalPacket) {
            resendedSequence.add(index);
            resends.push(logicalPacket);
          }
        } else {
          // well if it's not in the cache then it means that it has been acked
          // console.log("(accelerated)Data cache not found for sequence " + sequence);
        }
      }
    }

    client.outputStream.outOfOrder.clear();

    // if a packet is lost then we increase the ping
    // this will auto-fix when the connection goes well again
    for (let index = 0; index < resends.length; index++) {
      client.avgPing += 50;
      if (client.avgPing > 5000) {
        client.avgPing = 5000;
      }
    }
    return resends;
  }

  // Use the lastAck value to acknowlege multiple packets as a time
  // This function could be called less often but rn it will stick that way
  private getAck(client: Client): LogicalPacket | undefined {
    if (client.lastAckSend.get() != client.inputStream._lastAck.get()) {
      client.lastAckSend.set(client.inputStream._lastAck.get());
      return this.createLogicalPacket(SoeOpcode.Ack, {
        sequence: client.inputStream._lastAck.get()
      });
    }
  }

  private setupResendForQueuedPackets(client: Client, queue: PacketsQueue) {
    for (let index = 0; index < queue.packets.length; index++) {
      const packet = queue.packets[index];
      if (packet.isReliable) {
        client.unAckData.set(
          packet.sequence as number,
          Date.now() + this._waitTimeMs
        );
      }
    }
  }

  // send the queued packets
  private getClientWaitQueuePacket(
    client: Client,
    queue: PacketsQueue
  ): LogicalPacket | null {
    if (queue.packets.length > 1) {
      this.setupResendForQueuedPackets(client, queue);
      const multiPacket = this.createLogicalPacket(
        SoeOpcode.MultiPacket,
        {
          sub_packets: queue.packets.map((packet) => {
            return Array.from(packet.data);
          })
        },
        true
      );
      queue.clear();
      return multiPacket;
      // if a packet in the waiting queue is a reliable packet, then we need to set the timeout
    } else if (queue.packets.length === 1) {
      const singlePacketCopy = structuredClone(queue.packets[0]);
      queue.clear();
      return singlePacketCopy;
    } else {
      return null;
    }
  }

  private _createClient(clientId: string, remote: RemoteInfo) {
    const client = new SOEClient(remote, this._crcSeed, this._cryptoKey);
    this._clients.set(clientId, client);
    return client;
  }

  private _activateSendingTimer(client: SOEClient, additonalTime: number = 0) {
    if (!client.sendingTimer) {
      client.sendingTimer = setTimeout(() => {
        client.sendingTimer = null;
        this.sendingProcess(client);
      }, this._waitTimeMs + additonalTime);
    }
  }

  private handlePacket(client: SOEClient, packet: any) {
    // console.log("recieved : ", packet.name);
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
        // 4 since we don't count the opcode and it's an uint16
        client.outputStream.setFragmentSize(client.clientUdpLength - (4 + this._crcLength)); 
        client.lastKeepAliveTimer = this.keepAliveTimeoutTime
          ? setTimeout(() => {
              debug("Client keep alive timeout");
              this.emit("disconnect", client);
            }, this.keepAliveTimeoutTime)
          : null;

        this._sendAndBuildLogicalPacket(
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
        this.deleteClient(client);
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
        this._sendAndBuildLogicalPacket(client, SoeOpcode.Ping, {}, true);
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
        client.stats.packetsOutOfOrder++;
        client.outputStream.outOfOrder.add(packet.sequence);
        client.outputStream.removeFromCache(packet.sequence);
        client.unAckData.delete(packet.sequence);
        break;
      case "Ack":
        const mostWaitedPacketTime = client.unAckData.get(packet.sequence);
        if (mostWaitedPacketTime) {
          client.addPing(Date.now() - mostWaitedPacketTime);
        }
        client.outputStream.ack(packet.sequence, client.unAckData);
        this.sendingProcess(client);
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
    this._connection.on("message", (data, remote) => {
      try {
        let client: SOEClient;
        const clientId = remote.address + ":" + remote.port;
        debug(data.length + " bytes from ", clientId);
        // if doesn't know the client
        if (!this._clients.has(clientId)) {
          // if it's not a session request then we ignore it
          if (data[1] !== 1) {
            return;
          }
          client = this._createClient(clientId, remote);

          client.inputStream.on("appdata", (data: Buffer) => {
            this.emit("appdata", client, data);
          });

          client.inputStream.on("outOfOrder", (sequence: number) => {
            this._sendAndBuildLogicalPacket(client, SoeOpcode.OutOfOrder, {
              sequence: sequence
            });
          });

          client.inputStream.on("error", (err: Error) => {
            console.error(err);
            this.emit("disconnect", client);
          });

          client.outputStream.on(SOEOutputChannels.Reliable, () => {
            // some reliables are available, we send them
            this.sendingProcess(client);
          });

          client.outputStream.on(
            SOEOutputChannels.Ordered,
            (data: Buffer, sequence: number, unbuffered: boolean) => {
              console.log("ordered");
              this._sendAndBuildLogicalPacket(
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
              client.sendSinceLastAck = 0;
              if (client.lastKeepAliveTimer) {
                client.lastKeepAliveTimer.refresh();
              }
              this._activateSendingTimer(client);
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
    clearInterval(this._packetResetInterval);
    // delete all _clients
    for (const client of this._clients.values()) {
      client.closeTimers();
    }
    await new Promise<void>((resolve) => {
      this._connection.close(() => {
        resolve();
      });
    });
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
  private _clearSendingTimer(client: Client) {
    if (client.sendingTimer) {
      // console.log("an awaiting sending timer was removed");
      // Idk maybe it create and delete too much timers :/
      clearTimeout(client.sendingTimer);
      client.sendingTimer = null;
    }
  }

  private getAvailableAppPackets(client: Client): LogicalPacket[] {
    const dataCaches = client.outputStream.getAvailableReliableData();
    const appPackets: LogicalPacket[] = [];
    for (const dataCache of dataCaches) {
      const logicalPacket = this.createLogicalPacket(
        dataCache.fragment ? SoeOpcode.DataFragment : SoeOpcode.Data,
        { sequence: dataCache.sequence, data: dataCache.data }
      );
      if (logicalPacket) {
        appPackets.push(logicalPacket);
      }
    }
    return appPackets;
  }
  private sendingProcess(client: Client) {
    // console.log("sending process");
    //

    this._clearSendingTimer(client);

    if (client.outputStream.isReliableAvailable()) {
      const appPackets = this.getAvailableAppPackets(client);
      client.delayedLogicalPackets.push(...appPackets);
    }

    if (client.delayedLogicalPackets.length > 0) {
      for (
        let index = 0;
        index < client.delayedLogicalPackets.length;
        index++
      ) {
        const packet = client.delayedLogicalPackets.shift();
        if (!packet) {
          break;
        }
        if (this._canBeBufferedIntoQueue(packet, client.waitingQueue)) {
          client.waitingQueue.addPacket(packet);
        } else {
          // sends the already buffered packets
          const waitingQueuePacket = this.getClientWaitQueuePacket(
            client,
            client.waitingQueue
          );
          if (waitingQueuePacket) {
            this._sendAndBuildPhysicalPacket(client, waitingQueuePacket);
          }
          if (this._canBeBufferedIntoQueue(packet, client.waitingQueue)) {
            client.waitingQueue.addPacket(packet);
          } else {
            // if it still can't be buffered it means that the packet is too big so we send it directly
            this._sendAndBuildPhysicalPacket(client, packet);
          }
        }
      }
    }
    const ackPacket = this.getAck(client);
    if (ackPacket) {
      client.stats.totalLogicalPacketSent++;
      if (this._canBeBufferedIntoQueue(ackPacket, client.waitingQueue)) {
        client.waitingQueue.addPacket(ackPacket);
      } else {
        const waitingQueuePacket = this.getClientWaitQueuePacket(
          client,
          client.waitingQueue
        );
        if (waitingQueuePacket) {
          this._sendAndBuildPhysicalPacket(client, waitingQueuePacket);
        }
        // no additionnal check needed here because ack packets have a fixed size
        client.waitingQueue.addPacket(ackPacket);
      }
    }
    const resends = this.getResends(client);
    for (const resend of resends) {
      client.stats.totalLogicalPacketSent++;
      if (this._canBeBufferedIntoQueue(resend, client.waitingQueue)) {
        client.waitingQueue.addPacket(resend);
      } else {
        const waitingQueuePacket = this.getClientWaitQueuePacket(
          client,
          client.waitingQueue
        );
        if (waitingQueuePacket) {
          this._sendAndBuildPhysicalPacket(client, waitingQueuePacket);
        }
        if (this._canBeBufferedIntoQueue(resend, client.waitingQueue)) {
          client.waitingQueue.addPacket(resend);
        } else {
          // if it still can't be buffered it means that the packet is too big so we send it directly
          this._sendAndBuildPhysicalPacket(client, resend);
        }
      }
      client.unAckData.delete(resend.sequence as number);
    }
    const waitingQueuePacket = this.getClientWaitQueuePacket(
      client,
      client.waitingQueue
    );
    if (waitingQueuePacket) {
      this._sendAndBuildPhysicalPacket(client, waitingQueuePacket);
    }

    if (client.unAckData.size > 0) {
      // console.log("unack data size", client.unAckData.size);
      // console.log("next sending scheduled in", 100 * client.sendingVsHandleRate);
      this._activateSendingTimer(client);
    }
  }
  // Build the logical packet via the soeprotocol
  private createLogicalPacket(
    packetOpcode: SoeOpcode,
    packet: json,
    unbuffered: boolean = false
  ): LogicalPacket {
    try {
      const logicalPacket = new LogicalPacket(
        this.packLogicalData(packetOpcode, packet),
        packet.sequence,
        unbuffered
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

  private _canBeBufferedIntoQueue(
    logicalPacket: LogicalPacket,
    queue: PacketsQueue
  ): boolean {
    return (
      this._waitTimeMs > 0 &&
      logicalPacket.canBeBuffered &&
      queue.CurrentByteLength + logicalPacket.data.length <=
        this._maxMultiBufferSize
    );
  }

  private _sendLogicalPacket(
    client: Client,
    logicalPacket: LogicalPacket
  ): void {
    client.stats.totalLogicalPacketSent++;
    if (this._canBeBufferedIntoQueue(logicalPacket, client.waitingQueue)) {
      client.waitingQueue.addPacket(logicalPacket);
      this._activateSendingTimer(client);
    } else {
      client.delayedLogicalPackets.push(logicalPacket);
      this.sendingProcess(client);
    }
  }

  // The packets is builded from schema and added to one of the queues
  private _sendAndBuildLogicalPacket(
    client: Client,
    packetOpcode: SoeOpcode,
    packet: json,
    unbuffered = false
  ): void {
    const logicalPacket = this.createLogicalPacket(
      packetOpcode,
      packet,
      unbuffered
    );
    this._sendLogicalPacket(client, logicalPacket);
  }

  // Called by the application to send data to a client
  sendAppData(
    client: Client,
    data: Uint8Array,
    channel = SOEOutputChannels.Reliable,
    unbuffered: boolean = false
  ): void {
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
    this._clearSendingTimer(client);
    this._clients.delete(client.address + ":" + client.port);
    debug("client connection from port : ", client.port, " deleted");
  }
}

exports.SOEServer = SOEServer;
