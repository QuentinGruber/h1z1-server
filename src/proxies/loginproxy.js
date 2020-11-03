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
  LoginProtocol = require("../protocols/loginprotocol").LoginProtocol,
  fs = require("fs"),
  util = require("util"),
  debug = require("debug")("LoginProxy");

function LoginProxy(
  remoteAddress,
  remotePort,
  cryptoKey,
  localPort,
  localClientPort
) {
  EventEmitter.call(this);

  var protocol = new LoginProtocol();

  var soeProxy = (this._soeProxy = new SOEProxy(
    "LoginUdp_9",
    remoteAddress,
    remotePort,
    cryptoKey,
    localPort,
    localClientPort,
    0x100
  ));

  var me = this;

  soeProxy.on("clientappdata", function (err, data) {
    var packet = protocol.parse(data.appdata);
    me.emit("clientdata", err, packet);
    if (packet.dirty) {
      data.appdata = protocol.pack(packet.name, packet.result);
    }
    if (packet.delay) {
      data.delay = packet.delay;
    }
  });

  soeProxy.on("serverappdata", function (err, data) {
    var packet = protocol.parse(data.appdata),
      result = packet.result;
    me.emit("serverdata", err, packet);
    if (packet.dirty) {
      data.appdata = protocol.pack(packet.name, packet.result);
    }
    if (packet.delay) {
      data.delay = packet.delay;
    }
  });
}
util.inherits(LoginProxy, EventEmitter);

LoginProxy.prototype.start = function () {
  this._soeProxy.start();
};

LoginProxy.prototype.stop = function () {
  this._soeProxy.stop();
};

exports.LoginProxy = LoginProxy;
