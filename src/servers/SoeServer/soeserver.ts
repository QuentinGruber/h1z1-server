// ======================================================================
//
//   GNU GENERAL PUBLIC LICENSE
//   Version 3, 29 June 2007
//   copyright (c) 2021 Quentin Gruber
//
//   https://github.com/QuentinGruber/h1z1-server
//   https://www.npmjs.com/package/h1z1-server
//
//   Based on https://github.com/psemu/soe-network
// ======================================================================

import { EventEmitter } from "events";
import { SOEProtocol } from "../../protocols/soeprotocol";
import { SOEInputStream } from "./soeinputstream";
import { SOEOutputStream } from "./soeoutputstream";
import dgram from "dgram";
import { Client } from "../../types/soeserver";

const debug = require("debug")("SOEServer");

export class SOEServer extends EventEmitter {
  _protocolName: string;
  _serverPort: number;
  _cryptoKey: Uint8Array;
  _compression: number;
  _protocol: any;
  _udpLength: number;
  _useEncryption: boolean;
  _isGatewayServer: boolean;
  _clients: any;
  _connection: dgram.Socket;
  _crcSeed: number;
  _crcLength: number;

  constructor(
    protocolName: string,
    serverPort: number,
    cryptoKey: Uint8Array,
    compression: number,
    isGatewayServer = false
  ) {
    super();
    EventEmitter.call(this);

    this._protocolName = protocolName;
    this._serverPort = serverPort;
    this._cryptoKey = cryptoKey;
    this._crcSeed = 0;
    this._crcLength = 2;
    this._compression = compression;
    this._protocol = new SOEProtocol();
    this._udpLength = 512;
    this._useEncryption = true;
    this._isGatewayServer = isGatewayServer;

    this._clients = {};
    this._connection = dgram.createSocket("udp4");

    this._connection.on("message", (data, remote) => {
      let client: any;
      const clientId = remote.address + ":" + remote.port;
      debug(data.length + " bytes from ", clientId);
      let unknow_client;
      // if doesn't know the client
      if (!this._clients[clientId]) {
        unknow_client = true;
        client = this._clients[clientId] = {
          sessionId: 0,
          address: remote.address,
          port: remote.port,
          crcSeed: this._crcSeed,
          crcLength: 2,
          clientUdpLength: 512,
          serverUdpLength: 512,
          sequences: [],
          compression: this._compression,
          useEncryption: true,
          outQueue: [],
          outOfOrderPackets: [],
          nextAck: -1,
          lastAck: -1,
          inputStream: new (SOEInputStream as any)(cryptoKey),
          outputStream: new (SOEOutputStream as any)(cryptoKey),
        };

        (client as any).inputStream.on("data", (err: string, data: Buffer) => {
          this.emit("appdata", null, client, data);
        });

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

        const checkClientOutQueue = () => {
          const data = client.outQueue.shift();
          if (data) {
            this._connection.send(
              data,
              0,
              data.length,
              client.port,
              client.address
            );
          }
          (client as any).outQueueTimer = setTimeout(checkClientOutQueue, 0);
        };
        checkClientOutQueue();

        const checkAck = () => {
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
          (client as any).ackTimer = setTimeout(checkAck, 0); // maybe this is to much if we have a lot of ppl connected
        };
        checkAck();

        const checkOutOfOrderQueue = () => {
          if (client.outOfOrderPackets.length) {
            const packets = [];
            for (let i = 0; i < 20; i++) {
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
          (client as any).outOfOrderTimer = setTimeout(checkOutOfOrderQueue, 0);
        };
        checkOutOfOrderQueue();
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
    });

    this._connection.on("listening", () => {
      const { address, port } = this._connection.address();
      debug("Listening on " + address + ":" + port);
    });
  }

  handlePacket(client: Client, packet: any) {
    const {
      soePacket: { result },
      soePacket,
    } = packet;
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
          if (this._isGatewayServer) {
            (client as any).inputStream.setEncryption(false);
            (client as any).outputStream.setEncryption(false);
          } else {
            (client as any).inputStream.setEncryption(this._useEncryption);
            (client as any).outputStream.setEncryption(this._useEncryption);
          }
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
          this._sendPacket(client, "Ping", {
            sessionId: client.sessionId,
            crcSeed: client.crcSeed,
            crcLength: client.crcLength,
            compression: client.compression,
            udpLength: client.serverUdpLength,
          });
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
          if(result.sequence > 50000){
            console.log("Warn Ack, sequence ",result.sequence)
          }
          debug("Ack, sequence " + result.sequence);
          (client as any).outputStream.ack(result.sequence);
          break;
        case "ZonePing":
          debug("Receive Zone Ping ");
          this._sendPacket(client, "ZonePing", {
            PingId: result.PingId,
            Data: result.Data,
          });
          break;
        case "FatalError":
          debug("Received fatal error from client");
          break;
        case "FatalErrorReply":
          break;
      }
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
    this._connection.bind(this._serverPort, function () {});
  }

  stop(): void {
    this._connection.close();
    process.exit(0);
  }

  createPacket(client: Client, packetName: string, packet: any): any {
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
      client.outQueue.push(data);
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

  deleteClient(client: Client): void {
    clearTimeout(
      this._clients[client.address + ":" + client.port]?.outQueueTimer
    );
    clearTimeout(this._clients[client.address + ":" + client.port]?.ackTimer);
    clearTimeout(
      this._clients[client.address + ":" + client.port]?.outOfOrderTimer
    );
    delete this._clients[client.address + ":" + client.port];
    debug("client connection from port : ", client.port, " deleted");
  }
}

exports.SOEServer = SOEServer;
