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
import { RemoteInfo } from "dgram";
import { Soeprotocol } from "h1emu-core";
import Client from "./soeclient";
import SOEClient from "./soeclient";
import { Worker } from "worker_threads";
import { crc_length_options } from "../../types/soeserver";
import { MAX_SEQUENCE } from "../../utils/constants";
const debug = require("debug")("SOEServer");
process.env.isBin && require("../shared/workers/udpServerWorker.js");

export class SOEServer extends EventEmitter {
  _protocolName: string;
  _serverPort: number;
  _cryptoKey: Uint8Array;
  _compression: number = 0;
  _protocol!: Soeprotocol;
  _udpLength: number = 512;
  _useEncryption: boolean = true;
  private _clients: Map<string,SOEClient> = new Map();
  private _connection: Worker;
  _crcSeed: number = 0;
  _crcLength: crc_length_options = 2;
  _maxOutOfOrderPacketsPerLoop: number = 20;// TODO change this number, it need to be the max size of multipackets / the size of an outOfOrderPacket without crc + 2 
  _waitQueueTimeMs: number = 50;
  _pingTimeoutTime: number = 60000;
  _usePingTimeout: boolean = false;
  private _maxMultiBufferSize: number;
  reduceCpuUsage: boolean = true;
  private _soeClientRoutineLoopMethod!: (arg0:()=>void)=>void;
  private _resendTimeout: number = 1000;
  protected _maxGlobalPacketRate = 70000
  protected _minPacketRate: number = 100;
  private _currentPacketRatePerClient: number = 1000;
  constructor(protocolName: string, serverPort: number, cryptoKey: Uint8Array) {
    super();
    Buffer.poolSize = 8192 * 4;
    this._protocolName = protocolName;
    this._serverPort = serverPort;
    this._cryptoKey = cryptoKey;
    this._maxMultiBufferSize = this._udpLength - 4 - this._crcLength;
    this._connection = new Worker(
      `${__dirname}/../shared/workers/udpServerWorker.js`,
      {
        workerData: { serverPort: serverPort },
      }
    );
    setInterval(()=>{this.resetPacketsRate()},1000)
}

  getSoeClient(soeClientId:string) : SOEClient | undefined{
    return this._clients.get(soeClientId);
  }

  private calculatePacketRate(): number{
    const packetRate = this._maxGlobalPacketRate / this._clients.size;
    if(packetRate < this._minPacketRate){
      console.log("Calculated packet rate too low !")
      console.log("packetRate : ", packetRate)
      console.log("connectedClients : ", this._clients.size)
        return this._minPacketRate
    }
    else{
      return packetRate
    } 
  }

  private adjustPacketRate():void{
    this._currentPacketRatePerClient = this.calculatePacketRate();
  }

  private resetPacketsRate():void{
    for (const client of this._clients.values()) {
      client.packetsSentThisSec = 0
    }
  }

  private _sendPhysicalPacket(client: Client, packet: Buffer): void {
    client.packetsSentThisSec++;
    this._connection.postMessage(
      {
        type: "sendPacket",
        data: {
          packetData: packet,
          length: packet.length,
          port: client.port,
          address: client.address,
        },
      },
      [packet.buffer]
    );
  }

  private sendPriorityQueue(client: Client): void {
    while (client.packetsSentThisSec < this._currentPacketRatePerClient) {
      const data = client.priorityQueue.shift();
    if (data) {
      this._sendPhysicalPacket(client, data);
    }
    else {
      break
    }
    }
  }

  private sendOutQueue(client: Client): void {
    while (client.packetsSentThisSec < this._currentPacketRatePerClient) {
      const data = client.outQueue.shift();
    if (data) {
      this._sendPhysicalPacket(client, data);
    }
    else {
      break
    }
    }
  }

  private checkClientOutQueue(client: SOEClient) {    
    this.sendPriorityQueue(client);
    this.sendOutQueue(client);
  }

  private soeClientRoutine(client: Client) {
    if (!client.isDeleted) {
      this.checkOutOfOrderQueue(client);
      this.checkAck(client);
      this.checkResendQueue(client);
      console.log("priority queue size : ",client.priorityQueue.length)
      console.log("out queue size : ",client.outQueue.length)
      console.log("resend queue size : ",client.unAckData.size)
      this.checkClientOutQueue(client);
      this._soeClientRoutineLoopMethod(() => this.soeClientRoutine(client));
    }
  }
  checkResendQueue(client: Client) {
      const currentTime = Date.now()
      for (let [sequence, time] of client.unAckData) {
        if(time + this._resendTimeout <currentTime){
          client.outputStream.resendData(sequence);
        }
  }

  }

  private checkAck(client: Client) {
    if (client.lastAck != client.nextAck) {
      client.lastAck = client.nextAck;
      this._sendLogicalPacket(
        client,
        "Ack",
        {
          sequence: client.nextAck,
        },
        false
      );
    }
  }

  private sendClientWaitQueue(client: Client) {
    if (client.waitQueueTimer) {
      clearTimeout(client.waitQueueTimer);
      client.waitQueueTimer = undefined;
    }
    if (client.waitingQueue.length) {
      if (client.waitingQueue.length > 1) {
        this._sendLogicalPacket(
          client,
          "MultiPacket",
          {
            sub_packets: client.waitingQueue,
          }
        );
      } else {
        // if only one packets
        const extractedPacket = client.waitingQueue[0];
        const data = this.createPacket(
          client,
          extractedPacket.name,
          extractedPacket
        );
        client.outQueue.push(data);
      }
      client.waitingQueueCurrentByteLength = 0;
      client.waitingQueue = [];
    }
  }
  private checkOutOfOrderQueue(client: Client) {
    if (client.outOfOrderPackets.length) {
      const packets = [];
      for (let i = 0; i < this._maxOutOfOrderPacketsPerLoop; i++) {
        const sequence = client.outOfOrderPackets.shift();
        packets.push({
          name: "OutOfOrder",
          sequence: sequence,
        });
        if (!client.outOfOrderPackets.length) {
          break;
        }
      }
      
      this._sendLogicalPacket(
        client,
        "MultiPacket",
        {
          name: "MultiPacket",
          sub_packets: packets,
        },
        true
      );
    }
  }

  private _createClient(clientId:string,remote: RemoteInfo){
    this.adjustPacketRate();
    const client =new SOEClient(
      remote,
      this._crcSeed,
      this._compression,
      this._cryptoKey
    );
    this._clients.set(clientId,client);
    return client
  }

  private _disconnectClient(client: Client) {
    this._sendPhysicalPacket(client, Buffer.from([0x00, 0x99,0x99])); // doesnt work
  }

  private handlePacket(client: SOEClient, packet: any) {
    switch (packet.name) {
      case "SessionRequest":
        debug(
          "Received session request from " + client.address + ":" + client.port
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
        client.outputStream.setFragmentSize(client.clientUdpLength - 7); // TODO: 7? calculate this based on crc enabled / compression etc
        if (this._usePingTimeout) {
          client.lastPingTimer = setTimeout(() => {
            this.emit("disconnect", null, client);
          }, this._pingTimeoutTime);
        }

        this._sendLogicalPacket(client, "SessionReply", {
          session_id: client.sessionId,
          crc_seed: client.crcSeed,
          crc_length: client.crcLength,
          encrypt_method: client.compression,
          udp_length: client.serverUdpLength,
        },true);
        break;
      case "Disconnect":
        debug("Received disconnect from client");
        this.emit("disconnect", null, client);
        break;
      case "MultiPacket": {
        for (let i = 0; i < packet.sub_packets.length; i++) {
          const subPacket = packet.sub_packets[i];
          switch (subPacket.name) {
            default:
              this.handlePacket(client, subPacket);
          }
        }
        break;
      }
      case "Ping":
        debug("Received ping from client");
        if (this._usePingTimeout) {
          client.lastPingTimer.refresh();
        }
        this._sendLogicalPacket(client, "Ping", {});
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
        client.unAckData.delete(packet.sequence);
        //client.outputStream.resendData(packet.sequence);
        break;
      case "Ack":
        client.outputStream.ack(packet.sequence,client.unAckData);
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
      default :
        console.log("Unknown packet " + packet.name);
    }
  }

  start(crcLength?: crc_length_options, udpLength?: number): void {
    this._compression = 0;
    if (crcLength !== undefined) {
      this._crcLength = crcLength;
    }
    this._protocol = new Soeprotocol(Boolean(this._crcLength), this._crcSeed);
    if (udpLength !== undefined) {
      this._udpLength = udpLength;
    }
    if (this.reduceCpuUsage || process.env.FORCE_REDUCE_CPU_USAGE) {
      this._soeClientRoutineLoopMethod = setTimeout;
    } else {
      this._soeClientRoutineLoopMethod = setImmediate;
    }
    this._connection.on("message", (message) => {
      const data = Buffer.from(message.data);
      try {
        let client: SOEClient;
        const clientId = message.remote.address + ":" + message.remote.port;
        debug(data.length + " bytes from ", clientId);
        let unknow_client;
        // if doesn't know the client
        if (!this._clients.has(clientId)) {
          if (data[1] !== 1) {
            return;
          }
          unknow_client = true;
          client = this._createClient(clientId, message.remote);

          client.inputStream.on("appdata", (err: string, data: Buffer) => {
            this.emit("appdata", null, client, data);
          });

          client.outputStream.on("cacheError", () => {
            this._disconnectClient(client);
          });

          client.inputStream.on("ack", (err: string, sequence: number) => {
            client.nextAck = sequence;
          });          

          client.inputStream.on(
            "outoforder",
            (err: string, expectedSequence: number, outOfOrderSequence: number) => {
              client.outOfOrderPackets.push(outOfOrderSequence);
            }
          );

          client.outputStream.on(
            "data",
            (err: string, data: Buffer, sequence: number, fragment: any) => {
              const sequenceUint16 = sequence & MAX_SEQUENCE ;
              client.unAckData.set(sequenceUint16,Date.now());
              this._sendLogicalPacket(client, fragment ? "DataFragment" : "Data", {
                sequence: sequenceUint16 ,
                data: data,
              });
            }
          );

          client.outputStream.on(
            "dataResend",
            (err: string, data: Buffer, sequence: number, fragment: any) => {
              const sequenceUint16 = sequence & MAX_SEQUENCE ;
              client.unAckData.set(sequenceUint16, Date.now());
              this._sendLogicalPacket(
                client,
                fragment ? "DataFragment" : "Data",
                {
                  sequence: sequenceUint16 ,
                  data: data,
                },
                true
              );
            }
          );

          this._soeClientRoutineLoopMethod(() => this.soeClientRoutine(client));
        }
        else{
          client = this._clients.get(clientId) as SOEClient;
        }
        if (data[0] === 0x00) {
          const raw_parsed_data: string = this._protocol.parse(data);
          if (raw_parsed_data) {
            const parsed_data = JSON.parse(raw_parsed_data);
            if (parsed_data.name === "Error") {
              console.error(parsed_data.error);
            }
            if (!unknow_client && parsed_data.name === "SessionRequest") {
              this.deleteClient(this._clients.get(clientId) as SOEClient);
              debug(
                "Delete an old session badly closed by the client (",
                clientId,
                ") )"
              );
            }
            this.handlePacket(client, parsed_data);
          } else {
            console.error("Unmanaged packet from client", clientId, data);
          }
        } else {
          debug("Unmanaged standalone packet from client", clientId, data);
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

  private createPacket(
    client: Client,
    packetName: string,
    packet: any
  ): Buffer {
    if (packet.data) {
      packet.data = [...packet.data];
    }
    try {
      return Buffer.from(
        this._protocol.pack(packetName, JSON.stringify(packet))
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
      process.exit(1)
    }
  }

  private _sendLogicalPacket(
    client: Client,
    packetName: string,
    packet: any,
    prioritize = false
  ): void {
    const data = this.createPacket(client, packetName, packet);
    if (prioritize) {
      if (packetName !== "MultiPacket")
        this.sendClientWaitQueue(client);
      client.priorityQueue.push(data);
    } else {
      if (
        packetName !== "MultiPacket" && this._waitQueueTimeMs > 0 &&
        data.length < 255 &&
        client.waitingQueueCurrentByteLength + data.length <=
          this._maxMultiBufferSize
      ) {
        const fullBufferedPacketLen = data.length + 1; // the additionnal byte is the length of the packet written in the buffer when assembling the packet
        client.waitingQueue.push({
          name: packetName,
          ...packet,
        });
        client.waitingQueueCurrentByteLength += fullBufferedPacketLen;
        if (!client.waitQueueTimer) {
          client.waitQueueTimer = setTimeout(
            () => this.sendClientWaitQueue(client),
            this._waitQueueTimeMs
          );
        }
      } else {
        if(packetName !== "MultiPacket"){ // that's bad but it's the only way to avoid a bug rn
          this.sendClientWaitQueue(client);
        }
        client.outQueue.push(data);
      }
    }
  }

  sendAppData(client: Client, data: Buffer): void {
    if (client.outputStream.isUsingEncryption()) {
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
    this._clients.get(client.address + ":" + client.port);
    client.isDeleted = true;
    this.adjustPacketRate();
    debug("client connection from port : ", client.port, " deleted");
  }
}

exports.SOEServer = SOEServer;
