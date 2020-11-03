// ======================================================================
//
//   GNU GENERAL PUBLIC LICENSE
//   Version 3, 29 June 2007
//   copyright (c) 2020 Quentin Gruber
//
//   https://github.com/QuentinGruber/h1z1-server
//   https://www.npmjs.com/package/h1z1-server
//
//   Based on https://github.com/psemu/soe-network
// ======================================================================

var EventEmitter = require("events").EventEmitter,
  SOEProxy = require("./soeproxy").SOEProxy,
  GatewayProtocol = require("../protocols/gatewayprotocol").GatewayProtocol,
  fs = require("fs"),
  util = require("util"),
  debug = require("debug")("GatewayProxy");

function GatewayProxy(
  protocolName,
  remoteAddress,
  remotePort,
  cryptoKey,
  localPort,
  localClientPort
) {
  EventEmitter.call(this);

  var soeProxy = (this._soeProxy = new SOEProxy(
    protocolName,
    remoteAddress,
    remotePort,
    cryptoKey,
    localPort,
    localClientPort
  ));
  this._soeProxy.toggleEncryption(false);
  this._dumpData = false;
  this._soeProxy.toggleDataDump(false);

  var protocol = new GatewayProtocol();

  var me = this;

  var n = 0,
    k = 0;

  soeProxy.on("clientappdata", function (err, data) {
    var packet = protocol.parse(data.appdata);
    if (!packet) {
      return;
    }
    var result = packet.result;
    if (me._dumpData) {
      fs.writeFileSync(
        "debug/gateway_clientappdata_" + n + ".dat",
        JSON.stringify(packet, null, 4)
      );
    }
    n++;
    switch (packet.name) {
      case "LoginRequest":
        soeProxy.toggleEncryption(true);
        data.useEncryption = false;
        break;
      case "Logout":
        break;
      case "TunnelPacketFromExternalConnection":
        me.emit("clienttunneldata", err, packet.tunnelData, packet.flags);
        if (packet.tunnelData.drop) {
          data.drop = true;
        }
        if (packet.tunnelData.dirty) {
          data.appdata = protocol.pack(packet.name, {
            channel: 0,
            tunnelData: packet.tunnelData.newData,
          });
        }
        break;
    }
  });

  soeProxy.on("serverappdata", function (err, data) {
    var packet = protocol.parse(data.appdata);
    if (!packet) {
      return;
    }
    var result = packet.result;
    if (me._dumpData) {
      fs.writeFileSync(
        "debug/gateway_serverappdata_" + k + ".dat",
        data.appdata
      );
    }
    k++;
    switch (packet.name) {
      case "LoginReply":
        break;
      case "ForceDisconnect":
        break;
      case "ChannelIsRoutable":
        break;
      case "TunnelPacketToExternalConnection":
        me.emit("servertunneldata", err, packet.tunnelData, packet.flags);
        if (packet.tunnelData.drop) {
          data.drop = true;
        }
        if (packet.tunnelData.dirty) {
          data.appdata = protocol.pack(packet.name, {
            channel: 0,
            tunnelData: packet.tunnelData.newData,
          });
        }
        break;
    }
  });
}

util.inherits(GatewayProxy, EventEmitter);

GatewayProxy.prototype.start = function () {
  debug("Starting SOE proxy");
  this._soeProxy.start();
};

GatewayProxy.prototype.stop = function () {
  debug("Stopping SOE proxy");
  this._soeProxy.stop();
};

exports.GatewayProxy = GatewayProxy;
