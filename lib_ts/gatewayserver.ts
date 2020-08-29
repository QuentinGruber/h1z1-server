import { EventEmitter } from "events";

const SOEServer = require("./soeserver").SOEServer,
  GatewayProtocol = require("./gatewayprotocol").GatewayProtocol,
  debug = require("debug")("GatewayServer");

interface GatewayProtocol {
  pack: Function;
  parse: Function;
}

interface SoeServer {
  on: Function;
  start: Function;
  stop: Function;
  _sendPacket: Function;
  sendAppData: Function;
  toggleEncryption: Function;
  toggleDataDump: Function;
}

interface Client {
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
  outQueue: any;
  outOfOrderPackets: any;
  nextAck: number;
  lastAck: number;
  inputStream: Function;
  outputStream: Function;
  outQueueTimer: Function;
  ackTimer: Function;
  outOfOrderTimer: Function;
}

export class GatewayServer extends EventEmitter {
  _soeServer: SoeServer;
  _protocol: GatewayProtocol;
  _compression: number;
  _crcSeed: number;
  _crcLength: number;
  _udpLength: number;
  constructor(protocolName: string, serverPort: number, gatewayKey: string) {
    super();
    this._compression = 0x0000;
    this._crcSeed = 0;
    this._crcLength = 2;
    this._udpLength = 512;

    var soeServer = (this._soeServer = new SOEServer(
      protocolName,
      serverPort,
      gatewayKey
    ));
    soeServer.toggleEncryption(false);
    this._protocol = new GatewayProtocol();
    this._soeServer.on("connect", (err: string, client: Client) => {
      debug("Client connected from " + client.address + ":" + client.port);
      //server.emit('connect', err, client);
    });
    this._soeServer.on("disconnect", (err: string, client: Client) => {
      debug("Client disconnected from " + client.address + ":" + client.port);
      //server.emit('disconnect', err, client);
    });
    this._soeServer.on("session", (err: string, client: Client) => {
      debug("Session started for client " + client.address + ":" + client.port);
    });

    this._soeServer.on(
      "appdata",
      (err: string, client: Client, data: Buffer) => {
        var packet = this._protocol.parse(data);
        if (packet != false && packet != undefined) {
          var result = packet.result;
          switch (packet.name) {
            case "LoginRequest":
              this._soeServer.toggleEncryption(true);
              this._soeServer.sendAppData(
                client,
                this._protocol.pack("LoginReply", { loggedIn: true }),
                true
              );
              this._soeServer.sendAppData(
                client,
                this._protocol.pack("ChannelIsRoutable", {
                  channel: 0,
                  isRoutable: true,
                }),
                true
              );
              this._soeServer.sendAppData(
                client,
                this._protocol.pack("ChannelIsRoutable", {
                  channel: 1,
                  isRoutable: true,
                }),
                true
              );

              //  me.emit("login", null, client, result.characterId);
              break;
            case "Logout":
              debug("Logout");
              //     me.emit("logout", null, client);
              break;
            case "TunnelPacketFromExternalConnection":
              debug("TunnelPacketFromExternalConnection");
              //   me.emit("tunneldata", null, client, packet.tunnelData, packet.flags);
              break;
          }
        } else {
          debug("Packet parsing was unsuccesful");
        }
      }
    );
  }
  start() {
    debug("Starting server");
    this._soeServer.start(
      this._compression,
      this._crcSeed,
      this._crcLength,
      this._udpLength
    );
  }
  sendTunnelData(client: Client, tunnelData: string) {
    debug("Sending tunnel data to client");
    var data = this._protocol.pack("TunnelPacketToExternalConnection", {
      channel: 0,
      tunnelData: tunnelData,
    });
    //fs.writeFileSync("gatewayserver_appdata_" + (n++) + ".dat", data);
    this._soeServer.sendAppData(client, data);
  }
  stop() {
    debug("Shutting down");
  }
}
