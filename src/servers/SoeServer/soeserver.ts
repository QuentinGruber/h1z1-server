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

import { EventEmitter } from "events";
import { Soeprotocol } from "h1emu-core"
import Client from "./soeclient";
import SOEClient from "./soeclient";
import { Worker } from "worker_threads";

const debug = require("debug")("SOEServer");
process.env.isBin && require("../shared/workers/udpServerWorker.js");

export class SOEServer extends EventEmitter {
  _protocolName: string;
  _serverPort: number;
  _cryptoKey: Uint8Array;
  _compression: number = 0;
  _protocol: Soeprotocol;
  _udpLength: number;
  _useEncryption: boolean;
  _useMultiPackets: boolean;
  _clients: any;
  _connection: Worker;
  _crcSeed: number;
  _crcLength: number;
  _maxOutOfOrderPacketsPerLoop: number;
  _waitQueueTimeMs: number = 50;
  _isLocal: boolean = false;
  _pingTimeoutTime: number = 60000;
  _usePingTimeout: boolean;

  constructor(
    protocolName: string,
    serverPort: number,
    cryptoKey: Uint8Array,
    compression: number,
    useMultiPackets = false
  ) {
    super();
    Buffer.poolSize = 8192 * 4;
    this._protocolName = protocolName;
    this._serverPort = serverPort;
    this._cryptoKey = cryptoKey;
    this._crcSeed = 0;
    this._crcLength = 2;
    this._maxOutOfOrderPacketsPerLoop = 20;
    this._protocol = new Soeprotocol(true,false,false);
    this._udpLength = 512;
    this._useEncryption = true;
    this._useMultiPackets = false;
    this._usePingTimeout = false;
    this._clients = {};
    this._connection = new Worker(
      `${__dirname}/../shared/workers/udpServerWorker.js`,
      {
        workerData: { serverPort: serverPort },
      }
    );
  }

  checkClientOutQueue(client: SOEClient) {
    const data = client.outQueue.shift();
    if (data) {
      this._connection.postMessage(
        {
          type: "sendPacket",
          data: {
            packetData: data,
            length: data.length,
            port: client.port,
            address: client.address,
          },
        },
        [data.buffer]
      );
    }
    client.outQueueTimer.refresh();
  }

  checkAck(client: Client) {
    if (client.lastAck != client.nextAck) {
      client.lastAck = client.nextAck;
      this._sendPacket(
        client,
        "Ack",
        {
          channel: 0,
          sequence: client.nextAck,
        },
        false
      );
    }
    client.ackTimer.refresh();
  }
  sendClientWaitQueue(client: Client) {
    if (client.waitingQueue.length) {
      if(client.waitingQueue.length > 1){
        this._sendPacket(
          client,
          "MultiPacket",
          {
            sub_packets: client.waitingQueue,
          },
          true
        );
      }
      else{ // if only one packets
        const extractedPacket = client.waitingQueue[0];
        const data = this.createPacket(client, extractedPacket.name, extractedPacket.soePacket);
        client.outQueue.unshift(data);
      }
      client.waitingQueueCurrentByteLength = 0;
      client.waitingQueue = [];
    }
  }
  checkOutOfOrderQueue(client: Client) {
    if (client.outOfOrderPackets.length) {
      const packets = [];
      for (let i = 0; i < this._maxOutOfOrderPacketsPerLoop; i++) {
        const sequence = client.outOfOrderPackets.shift();
        packets.push({
          name: "OutOfOrder",
          channel: 0,
          sequence: sequence,
        });
        if (!client.outOfOrderPackets.length) {
          break;
        }
      }
      debug("Sending " + packets.length + " OutOfOrder packets");
      this._sendPacket(
        client,
        "MultiPacket",
        {
          name: "MultiPacket",
          sub_packets: packets,
        },
        true
      );
    }
    client.outOfOrderTimer.refresh();
  }

  handlePacket(client: SOEClient, packet: any) {
      switch (packet.name) {
        case "SessionRequest":
          debug(
            "Received session request from " +
              client.address +
              ":" +
              client.port
          );
          client.sessionId = packet.session_id;
          client.clientUdpLength = packet.udp_length;
          client.protocolName = packet.protocol;
          client.compression = this._compression;
          client.serverUdpLength = this._udpLength;
          client.crcSeed = this._crcSeed;
          client.crcLength = this._crcLength;
          client.inputStream.setEncryption(this._useEncryption);
          client.outputStream.setEncryption(this._useEncryption);
          client.outputStream.setFragmentSize(client.clientUdpLength - 7);
          if (this._usePingTimeout) {
            client.lastPingTimer = setTimeout(() => {
              this.emit("disconnect", null, client);
            }, this._pingTimeoutTime);
          }

          this._sendPacket(client, "SessionReply", {
            session_id: client.sessionId,
            crc_seed: client.crcSeed,
            crc_length: client.crcLength,
            encrypt_method: client.compression,
            udp_length: client.serverUdpLength,
          });
          this.emit("session", null, client);
          break;
        case "Disconnect":
          debug("Received disconnect from client");
          this.emit("disconnect", null, client);
          break;
        case "MultiPacket": {
          let lastOutOfOrder = 0;
          const channel = 0;
          for (let i = 0; i < packet.sub_packets.length; i++) {
            const subPacket = packet.sub_packets[i];
            switch (subPacket.name) {
              case "OutOfOrder":
                if (subPacket.sequence > lastOutOfOrder) {
                  lastOutOfOrder = subPacket.sequence;
                }
                break;
              default:
                this.handlePacket(client, subPacket);
            }
          }
          if (lastOutOfOrder > 0) {
            debug(
              "Received multiple out-order-packet packet on channel " +
                channel +
                ", sequence " +
                lastOutOfOrder
            );
            client.outputStream.resendData(lastOutOfOrder);
          }
          break;
        }
        case "Ping":
          debug("Received ping from client");
          if (this._usePingTimeout) {
            client.lastPingTimer.refresh();
          }
          this._sendPacket(client, "Ping", {});
          break;
        case "NetStatusRequest":
          debug("Received net status request from client");
          break;
        case "Data":
          debug(
            "Received data packet from client, sequence " + packet.sequence
          );
          client.inputStream.write(Buffer.from(packet.data), packet.sequence, false);
          break;
        case "DataFragment":
          debug(
            "Received data fragment from client, sequence " + packet.sequence
          );
          client.inputStream.write(Buffer.from(packet.data), packet.sequence, true);
          break;
        case "OutOfOrder":
          debug(
            "Received out-order-packet packet on channel " +
            packet.channel +
              ", sequence " +
              packet.sequence
          );
          client.outputStream.resendData(packet.sequence);
          break;
        case "Ack":
          if (packet.sequence > 40000) {
            console.log("Warn Ack, sequence ", packet.sequence);
            this._sendPacket(client, "PacketOrdered",{},true);
            // see https://github.com/QuentinGruber/h1z1-server/issues/363
           // this.emit("PacketLimitationReached", client);
          }
          debug("Ack, sequence " + packet.sequence);
          client.outputStream.ack(packet.sequence);
          break;
        case "ZonePing":
          debug("Receive Zone Ping ");
          /* this._sendPacket(client, "ZonePing", { respond to it is currently useless ( at least on the 2015 version )
            PingId: result.PingId,
            Data: result.Data,
          });*/
          break;
        case "FatalError":
          debug("Received fatal error from client");
          break;
        case "FatalErrorReply":
          break;
      }
  }

  start(
    compression: number,
    crcSeed: number,
    crcLength: number,
    udpLength: number
  ): void {
    this._compression = 0; // TODO: renable that
    this._crcSeed = crcSeed;
    this._crcLength = crcLength;
    this._udpLength = udpLength;
    if (false && this._isLocal) { // TODO: renable that
      this._useMultiPackets = false;
    }
    this._connection.on("message", (message) => {
      const data = Buffer.from(message.data);
      try {
        let client: SOEClient;
        const clientId = message.remote.address + ":" + message.remote.port;
        debug(data.length + " bytes from ", clientId);
        let unknow_client;
        // if doesn't know the client
        if (!this._clients[clientId]) {
          if (data[1] !== 1) {
            return;
          }
          unknow_client = true;
          client = this._clients[clientId] = new SOEClient(
            message.remote,
            this._crcSeed,
            this._compression,
            this._cryptoKey
          );

          if (false && this._isLocal) { // TODO: renable that
            client.outputStream._enableCaching = false;
          } else {
            client.outOfOrderTimer = setTimeout(
              () => this.checkOutOfOrderQueue(client),
              50
            );
          }

          client.inputStream.on("data", (err: string, data: Buffer) => {
            this.emit("appdata", null, client, data);
          });

          client.outputStream.on("cacheError", (err: string, data: Buffer) => {
            this.emit("fatalError", client);
          });

          client.inputStream.on("ack", (err: string, sequence: number) => {
            client.nextAck = sequence;
          });

          client.inputStream.on(
            "outoforder",
            (err: string, expected: any, sequence: number) => {
              client.outOfOrderPackets.push(sequence);
            }
          );

          client.outputStream.on(
            "data",
            (err: string, data: Buffer, sequence: number, fragment: any) => {
              if (fragment) {
                this._sendPacket(client, "DataFragment", {
                  sequence: sequence,
                  data: data,
                });
              } else {
                this._sendPacket(client, "Data", {
                  sequence: sequence,
                  data: data,
                });
              }
            }
          );

          client.outputStream.on(
            "dataResend",
            (err: string, data: Buffer, sequence: number, fragment: any) => {
              if (fragment) {
                this._sendPacket(client, "DataFragment", {
                  sequence: sequence,
                  data: data,
                },true);
              } else {
                this._sendPacket(client, "Data", {
                  sequence: sequence,
                  data: data,
                },true);
              }
            }
          );

          
          client.outQueueTimer = setTimeout(() =>
            this.checkClientOutQueue(client)
          );
          if (this._useMultiPackets) {
            client.waitQueueTimer = setTimeout(
              () => this.sendClientWaitQueue(client),
              this._waitQueueTimeMs
            );
          }
          client.ackTimer = setTimeout(() => this.checkAck(client));

          this.emit("connect", null, this._clients[clientId]);
        }
        client = this._clients[clientId];
        const raw_parsed_data: string = this._protocol.parse(
          data,
          client.outputStream._rc4
        );
        if (raw_parsed_data) {
          const parsed_data = JSON.parse(raw_parsed_data);
          if (!unknow_client && parsed_data.name === "SessionRequest") {
            this.deleteClient(this._clients[clientId]);
            debug(
              "Delete an old session badly closed by the client (",
              clientId,
              ") )"
            );
          }
          this.handlePacket(client, parsed_data);
        }
      } catch (e) {
        console.log(e);
      }
    });
    this._connection.postMessage({ type: "bind" });
  }

  stop(): void {
    this._connection.postMessage({ type: "close" });
    process.exit(0);
  }

  createPacket(client: Client, packetName: string, packet: any): Buffer {
    if(packet.data){
      packet.data = [...packet.data]
    }
    try {
      return Buffer.from(this._protocol.pack(
        packetName,
        JSON.stringify(packet),
        client.crcSeed,
        client.outputStream._rc4
      ));
    } catch (e) {
      console.error(
        `Failed to create packet ${packetName} packet data : ${JSON.stringify(
          packet,
          null,
          4
        )}`
      );
      console.error(e);
      return Buffer.from("0");
    }
  }

  _sendPacket(
    client: Client,
    packetName: string,
    packet: any,
    prioritize = false
  ): void {
    const data = this.createPacket(client, packetName, packet);
    if (prioritize) {
      if(packetName !== "MultiPacket")
        this.sendClientWaitQueue(client);
      client.outQueue.push(data);
    } else {
      if (
        this._useMultiPackets &&
        packetName != "DataFragment" &&
        (client.waitingQueueCurrentByteLength + data.length + 1 < 300 )&&
        (data.length + 1) < 255
      ) {
        const fullBufferedPacketLen = data.length + 1;
        client.waitingQueue.push({
          name: packetName,
          soePacket: packet,
        });
        client.waitingQueueCurrentByteLength += fullBufferedPacketLen;
        client.waitQueueTimer.refresh();
      } else {
        this.sendClientWaitQueue(client);
        client.outQueue.push(data);
      }
    }
  }

  sendAppData(client: Client, data: Buffer): void {
    if (client.outputStream._useEncryption) {
      debug("Sending app data: " + data.length + " bytes with encryption");
    } else {
      debug("Sending app data: " + data.length + " bytes");
    }
    client.outputStream.write(data);
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
    client.clearTimers();
    delete this._clients[client.address + ":" + client.port];
    debug("client connection from port : ", client.port, " deleted");
  }
}

exports.SOEServer = SOEServer;
