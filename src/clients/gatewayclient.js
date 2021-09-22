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

var EventEmitter = require("events").EventEmitter,
  SOEClient = require("./soeclient").SOEClient,
  fs = require("fs"),
  util = require("util"),
  GatewayProtocol = require("../protocols/gatewayprotocol").GatewayProtocol,
  GatewayPackets = require("../protocols/gatewayprotocol").GatewayPackets,
  debug = require("debug")("GatewayClient");

function GatewayClientError(message) {
  this.name = this.constructor.name;
  this.message = message;
}

util.inherits(GatewayClientError, Error);

class GatewayClient {
  constructor(serverAddress, serverPort, key, localPort) {
    EventEmitter.call(this);

    var soeClient = (this._soeClient = new SOEClient(
      "ExternalGatewayApi_3",
      serverAddress,
      serverPort,
      key,
      localPort
    ));
    var protocol = (this._protocol = new GatewayProtocol());
    var me = this;

    soeClient.on("appdata", function (err, data) {
      var packet = protocol.parse(data);
      var result = packet.result;

      switch (packet.name) {
        case "LoginReply":
          if (result.loggedIn) {
            me.emit("login", null, result);
          } else {
            me.emit("login", new GatewayClientError("Login failed"));
          }
          break;
        case "TunnelPacketToExternalConnection":
          me.emit("tunneldata", null, packet.tunnelData, packet.flags);
          break;
      }
    });

    soeClient.on("connect", function (err, result) {
      debug("Connected to login server");
      soeClient.toggleEncryption(false);
      me.emit("connect", err, result);
    });

    soeClient.on("disconnect", function (err, result) {
      debug("Disconnected");
      me.emit("disconnect", err, result);
    });
  }

  connect(callback) {
    debug("Connecting to gateway server");
    this._soeClient.connect();
  }

  sendTunnelData(tunnelData, channel) {
    channel = channel || 0;
    debug("Sending tunnel data to gateway server");
    var data = this._protocol.pack("TunnelPacketFromExternalConnection", {
      channel: channel,
      tunnelData: tunnelData,
    });
    //fs.writeFileSync("dump/out_tunneldata_" + (tunnelCount++) + ".dat", data);
    this._soeClient.sendAppData(data, true);
  }

  login(characterId, ticket, clientProtocol, clientBuild) {
    debug("Sending login request");
    var data = this._protocol.pack("LoginRequest", {
      characterId: characterId,
      ticket: ticket,
      clientProtocol: clientProtocol,
      clientBuild: clientBuild,
    });
    //fs.writeFileSync("loginrequest.dat", data);
    this._soeClient.sendAppData(data, false);
    this._soeClient.toggleEncryption(true);
  }

  disconnect() {}
}

util.inherits(GatewayClient, EventEmitter);

var tunnelCount = 0;

exports.GatewayClient = GatewayClient;
