var EventEmitter = require("events").EventEmitter,
  SOEServer = require("./soeserver").SOEServer,
  https = require("https"),
  fs = require("fs"),
  util = require("util"),
  GatewayProtocol = require("./gatewayprotocol").GatewayProtocol,
  debug = require("debug")("GatewayServer")

export class GatewayServer {
  _soeServer: any;
  _protocol: any;
  _compression: number;
  _crcSeed: number;
  _crcLength: number;
  _udpLength: number;
  constructor(protocolName: string, serverPort: number, gatewayKey: string) {
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
  stop() {
    debug("Shutting down");
  }
  sendTunnelData(client: any, tunnelData: any) {
    debug("Sending tunnel data to client");
    var data = this._protocol.pack("TunnelPacketToExternalConnection", {
      channel: 0,
      tunnelData: tunnelData,
    });
    //fs.writeFileSync("gatewayserver_appdata_" + (n++) + ".dat", data);
    this._soeServer.sendAppData(client, data);
  }
  private connect(client: any) {
    debug("Client connected from " + client.address + ":" + client.port);
  }
  private disconnect(client: any) {
    debug("Client disconnected from " + client.address + ":" + client.port);
  }
  private session(client: any) {
    debug("Session started for client " + client.address + ":" + client.port);
  }
  appdata(client: any, data: any) {
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
          //     me.emit("logout", null, client);
          break;
        case "TunnelPacketFromExternalConnection":
          //   me.emit("tunneldata", null, client, packet.tunnelData, packet.flags);
          break;
      }
    } else {
      debug("Packet parsing was unsuccesful");
    }
  }
}
