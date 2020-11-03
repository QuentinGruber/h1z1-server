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
  util = require("util"),
  fs = require("fs"),
  dgram = require("dgram"),
  debug = require("debug")("TransparentProxy");

function TransparentProxy(
  remoteAddress,
  remotePort,
  localPort,
  localClientPort
) {
  EventEmitter.call(this);

  var server = (this._server = dgram.createSocket("udp4"));
  var client = (this._client = dgram.createSocket("udp4"));
  var proxyClient;

  this._serverPort = remotePort;
  this._serverAddress = remoteAddress;
  this._localPort = localPort;
  this._localClientPort = localClientPort;

  var me = this;

  server.on("message", function (data, remote) {
    if (!proxyClient) {
      proxyClient = remote;
    }
    debug("Client -> Server (" + data.length + ")");
    client.send(
      data,
      0,
      data.length,
      me._serverPort,
      me._serverAddress,
      function (err, bytes) {}
    );
  });

  client.on("message", function (data, remote) {
    if (!proxyClient) {
      debug("Received data from server but client is not ready");
    }
    debug("Server -> Client (" + data.length + ")");
    server.send(
      data,
      0,
      data.length,
      proxyClient.port,
      proxyClient.address,
      function (err, bytes) {}
    );
  });

  client.on("listening", function () {
    var address = this.address();
    debug(
      "Listening for remote server on " + address.address + ":" + address.port
    );
  });
  server.on("listening", function () {
    var address = this.address();
    debug(
      "Listening for local client on " + address.address + ":" + address.port
    );
  });
}
util.inherits(TransparentProxy, EventEmitter);

TransparentProxy.prototype.start = function () {
  this._server.bind(this._localPort, function () {});
  this._client.bind(this._localClientPort, function () {});
};

TransparentProxy.prototype.stop = function () {
  this._server.close();
  this._client.close();
};

exports.TransparentProxy = TransparentProxy;
