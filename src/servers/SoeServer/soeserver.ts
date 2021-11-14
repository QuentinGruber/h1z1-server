// ======================================================================
//
//   GNU GENERAL PUBLIC LICENSE
//   Version 3, 29 June 2007
//   copyright (c) 2020 - 2021 Quentin Gruber
//   copyright (c) 2021 H1emu community
//
//   https://github.com/QuentinGruber/h1z1-server
//   https://www.npmjs.com/package/h1z1-server
//
//   Based on https://github.com/psemu/soe-network
// ======================================================================

import { EventEmitter } from "events";
import { SOEProtocol } from "../../protocols/soeprotocol";
import Client from "./soeclient";
import SOEClient from "./soeclient";
import { Worker } from "worker_threads";

const debug = require("debug")("SOEServer");
process.env.isBin && require("../shared/workers/udpServerWorker.js");

export class SOEServer extends EventEmitter {
  _protocolName: string;
  _serverPort: number;
  _cryptoKey: Uint8Array;
  _compression: number;
  _protocol: any;
  _udpLength: number;
  _useEncryption: boolean;
  _useMultiPackets: boolean;
  _clients: any;
  _connection: Worker;
  _crcSeed: number;
  _crcLength: number;
  _maxOutOfOrderPacketsPerLoop: number;
  _waitQueueTimeMs: number;
  _smallPacketsSize: number = 50;
  _isLocal: boolean = false;

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
    this._compression = compression;
    this._protocol = new SOEProtocol();
    this._udpLength = 512;
    this._useEncryption = true;
    this._useMultiPackets = useMultiPackets;
    this._waitQueueTimeMs = 20;
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
      this._connection.postMessage({
        type: "sendPacket",
        data: {
          packetData: data,
          length: data.length,
          port: client.port,
          address: client.address,
        },
      });
    }
    (client as any).outQueueTimer.refresh();
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
        true
      );
    }
    (client as any).ackTimer.refresh();
  }
  sendClientWaitQueue(client: Client) {
    if (client.waitingQueue.length) {
      client.waitingQueueCurrentByteLength = 0;
      this._sendPacket(
        client,
        "MultiPacket",
        {
          subPackets: client.waitingQueue,
        },
        true
      );
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
          soePacket: {
            channel: 0,
            sequence: sequence,
          },
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
          subPackets: packets,
        },
        true
      );
    }
    (client as any).outOfOrderTimer.refresh();
  }

  handlePacket(client: SOEClient, packet: any) {
    const { soePacket } = packet;
    const result = soePacket?.result;
    if (result) {
      switch (soePacket.name) {
        case "SessionRequest":
          debug(
            "Received session request from " +
              client.address +
              ":" +
              client.port
          );
          client.sessionId = result.sessionId;
          client.clientUdpLength = result.udpLength;
          client.protocolName = result.protocol;
          client.compression = this._compression;
          client.serverUdpLength = this._udpLength;
          client.crcSeed = this._crcSeed;
          client.crcLength = this._crcLength;
          (client as any).inputStream.setEncryption(this._useEncryption);
          (client as any).outputStream.setEncryption(this._useEncryption);
          (client as any).outputStream.setFragmentSize(
            client.clientUdpLength - 7
          );

          this._sendPacket(client, "SessionReply", {
            sessionId: client.sessionId,
            crcSeed: client.crcSeed,
            crcLength: client.crcLength,
            compression: client.compression,
            udpLength: client.serverUdpLength,
          });
          this.emit("session", null, client);
          break;
        case "Disconnect":
          // hack so updateInterval is cleared even if user badly close the client
          this.emit(
            "appdata",
            null,
            client,
            Buffer.from(new Uint8Array([0x03]))
          ); // trigger "Logout"

          debug("Received disconnect from client");
          delete this._clients[client.address + ":" + client.port];
          this.emit("disconnect", null, client);
          break;
        case "MultiPacket": {
          let lastOutOfOrder = 0;
          const channel = 0;
          for (let i = 0; i < result.subPackets.length; i++) {
            const subPacket = result.subPackets[i];
            switch (subPacket.name) {
              case "OutOfOrder":
                if (subPacket.sequence > lastOutOfOrder) {
                  lastOutOfOrder = subPacket.sequence;
                }
                break;
              default:
                this.handlePacket(client, {
                  soePacket: subPacket,
                });
            }
          }
          if (lastOutOfOrder > 0) {
            debug(
              "Received multiple out-order-packet packet on channel " +
                channel +
                ", sequence " +
                lastOutOfOrder
            );
            (client as any).outputStream.resendData(lastOutOfOrder);
          }
          break;
        }
        case "Ping":
          debug("Received ping from client");
          this._sendPacket(client, "Ping", {});
          break;
        case "NetStatusRequest":
          debug("Received net status request from client");
          break;
        case "Data":
          debug(
            "Received data packet from client, sequence " + result.sequence
          );
          (client as any).inputStream.write(
            result.data,
            result.sequence,
            false
          );
          break;
        case "DataFragment":
          debug(
            "Received data fragment from client, sequence " + result.sequence
          );
          (client as any).inputStream.write(result.data, result.sequence, true);
          break;
        case "OutOfOrder":
          debug(
            "Received out-order-packet packet on channel " +
              result.channel +
              ", sequence " +
              result.sequence
          );
          (client as any).outputStream.resendData(result.sequence);
          break;
        case "Ack":
          if (result.sequence > 63000) {
            // see https://github.com/QuentinGruber/h1z1-server/issues/363
            console.log("Warn Ack, sequence ", result.sequence);
            this.emit("PacketLimitationReached", client);
          }
          debug("Ack, sequence " + result.sequence);
          (client as any).outputStream.ack(result.sequence);
          break;
        case "ZonePing":
          debug("Receive Zone Ping ");
          const pingTime = Date.now();
          /* this._sendPacket(client, "ZonePing", { respond to it is currently useless ( at least on the 2015 version )
            PingId: result.PingId,
            Data: result.Data,
          });*/
          if (client.lastZonePingTimestamp) {
            client.zonePingTimeMs =
              pingTime - client.lastZonePingTimestamp - 5000; // zonepings are sent every 5 sec by the game
          }
          client.lastZonePingTimestamp = pingTime;
          break;
        case "FatalError":
          debug("Received fatal error from client");
          break;
        case "FatalErrorReply":
          break;
      }
    } else {
      console.error("handlePacket failed : ", packet);
    }
  }

  start(
    compression: number,
    crcSeed: number,
    crcLength: number,
    udpLength: number
  ): void {
    this._compression = compression;
    this._crcSeed = crcSeed;
    this._crcLength = crcLength;
    this._udpLength = udpLength;
    if (this._isLocal) {
      this._useMultiPackets = false;
    }
    this._connection.on("message", (message) => {
      const { data: dataUint8, remote } = message;
      const data = Buffer.from(dataUint8);
      try {
        let client: SOEClient;
        const clientId = remote.address + ":" + remote.port;
        debug(data.length + " bytes from ", clientId);
        let unknow_client;
        // if doesn't know the client
        if (!this._clients[clientId]) {
          unknow_client = true;
          client = this._clients[clientId] = new SOEClient(
            remote,
            this._crcSeed,
            this._compression,
            this._cryptoKey
          );

          if (this._isLocal) {
            client.outputStream._enableCaching = false;
          }

          (client as any).inputStream.on(
            "data",
            (err: string, data: Buffer) => {
              this.emit("appdata", null, client, data);
            }
          );

          (client as any).inputStream.on(
            "ack",
            (err: string, sequence: number) => {
              client.nextAck = sequence;
            }
          );

          (client as any).inputStream.on(
            "outoforder",
            (err: string, expected: any, sequence: number) => {
              client.outOfOrderPackets.push(sequence);
            }
          );

          (client as any).outputStream.on(
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
          (client as any).outQueueTimer = setTimeout(() =>
            this.checkClientOutQueue(client)
          );
          if (this._useMultiPackets) {
            (client as any).waitQueueTimer = setTimeout(
              () => this.sendClientWaitQueue(client),
              this._waitQueueTimeMs
            );
          }
          (client as any).ackTimer = setTimeout(() => this.checkAck(client));

          if (!this._isLocal) {
            (client as any).outOfOrderTimer = setTimeout(
              () => this.checkOutOfOrderQueue(client),
              50
            );
          }
          this.emit("connect", null, this._clients[clientId]);
        }
        client = this._clients[clientId];
        const result = this._protocol.parse(
          data,
          client.crcSeed,
          client.compression
        );
        if (result !== undefined && result !== null) {
          if (
            !unknow_client &&
            result.soePacket &&
            result.soePacket.name === "SessionRequest"
          ) {
            delete this._clients[clientId];
            debug(
              "Delete an old session badly closed by the client (",
              clientId,
              ") )"
            );
          }
          this.handlePacket(client, result);
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
    try {
      return this._protocol.pack(
        packetName,
        packet,
        client.crcSeed,
        client.compression
      );
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
      client.outQueue.unshift(data);
    } else {
      if (
        this._useMultiPackets &&
        data.length < this._smallPacketsSize &&
        client.waitingQueueCurrentByteLength + data.length <
          this._udpLength - 2 &&
        (packetName == "Data" || packetName == "DataFragment")
      ) {
        client.waitingQueue.push({
          name: packetName,
          soePacket: packet,
        });
        client.waitingQueueCurrentByteLength += data.length;
        client.waitQueueTimer.refresh();
      } else {
        this.sendClientWaitQueue(client);
        client.outQueue.push(data);
      }
    }
  }

  sendAppData(client: Client, data: Buffer, overrideEncryption: boolean): void {
    if ((client as any).outputStream._useEncryption) {
      debug("Sending app data: " + data.length + " bytes with encryption");
    } else {
      debug("Sending app data: " + data.length + " bytes");
    }
    (client as any).outputStream.write(data, overrideEncryption);
  }

  setEncryption(client: Client, value: boolean): void {
    (client as any).outputStream.setEncryption(value);
    (client as any).inputStream.setEncryption(value);
  }

  toggleEncryption(client: Client): void {
    (client as any).outputStream.toggleEncryption();
    (client as any).inputStream.toggleEncryption();
  }

  deleteClient(client: SOEClient): void {
    client.clearTimers();
    delete this._clients[client.address + ":" + client.port];
    debug("client connection from port : ", client.port, " deleted");
  }
}

exports.SOEServer = SOEServer;
