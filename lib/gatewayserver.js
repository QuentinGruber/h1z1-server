var EventEmitter = require("events").EventEmitter,
  SOEServer = require("./soeserver").SOEServer,
  https = require("https"),
  fs = require("fs"),
  util = require("util"),
  GatewayProtocol = require("./gatewayprotocol").GatewayProtocol,
  debug = require("debug")("GatewayServer");
log = require("./utils").log;

function GatewayServerError(message) {
  this.name = this.constructor.name;
  this.message = message;
}
util.inherits(GatewayServerError, Error);

function GatewayServer(protocolName, serverPort, gatewayKey) {
  EventEmitter.call(this);

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
  var protocol = (this._protocol = new GatewayProtocol());
  var me = this;

  soeServer.on("connect", function (err, client) {
    console.log("Client connected from " + client.address + ":" + client.port);
    me.emit("connect", err, client);
  });

  soeServer.on("disconnect", function (err, client) {
    console.log(
      "Client disconnected from " + client.address + ":" + client.port
    );
    me.emit("disconnect", err, client);
  });

  soeServer.on("session", function (err, client) {
    console.log(
      "Session started for client " + client.address + ":" + client.port
    );
  });

  soeServer.on("appdata", function (err, client, data) {
    var packet = protocol.parse(data);
    if (packet != false && packet != undefined) {
      var result = packet.result;
      switch (packet.name) {
        case "LoginRequest":
          soeServer.toggleEncryption(true);
          soeServer.sendAppData(
            client,
            protocol.pack("LoginReply", { loggedIn: true }),
            true
          );
          soeServer.sendAppData(
            client,
            protocol.pack("ChannelIsRoutable", {
              channel: 0,
              isRoutable: true,
            }),
            true
          );
          soeServer.sendAppData(
            client,
            protocol.pack("ChannelIsRoutable", {
              channel: 1,
              isRoutable: true,
            }),
            true
          );

          me.emit("login", null, client, result.characterId);
          break;
        case "Logout":
          me.emit("logout", null, client);
          break;
        case "TunnelPacketFromExternalConnection":
          me.emit("tunneldata", null, client, packet.tunnelData, packet.flags);
          break;
      }
    } else {
      log("Packet parsing was unsuccesful", 2);
    }
  });
}
util.inherits(GatewayServer, EventEmitter);

GatewayServer.prototype.start = function (callback) {
  console.log("Starting Gateway server");
  this._soeServer.start(
    this._compression,
    this._crcSeed,
    this._crcLength,
    this._udpLength
  );
};

var n = 0;

GatewayServer.prototype.sendTunnelData = function (client, tunnelData) {
  console.log("Sending tunnel data to client");
  var data = this._protocol.pack("TunnelPacketToExternalConnection", {
    channel: 0,
    tunnelData: tunnelData,
  });
  //fs.writeFileSync("gatewayserver_appdata_" + (n++) + ".dat", data);
  this._soeServer.sendAppData(client, data);
};

GatewayServer.prototype.stop = function () {
  console.log("Shutting down");
};

exports.GatewayServer = GatewayServer;
