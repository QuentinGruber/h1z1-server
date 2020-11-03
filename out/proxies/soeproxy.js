"use strict";
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
var EventEmitter = require("events").EventEmitter, SOEServer = require("../servers/SoeServer/soeserver").SOEServer, SOEClient = require("../clients/soeclient").SOEClient, util = require("util"), fs = require("fs"), debug = require("debug")("SOEProxy");
function SOEProxy(protocolName, remoteAddress, remotePort, cryptoKey, localPort, localClientPort) {
    EventEmitter.call(this);
    debug(protocolName, remoteAddress, remotePort, cryptoKey, localPort, localClientPort);
    var server = (this._server = new SOEServer(protocolName, localPort, cryptoKey));
    var client = (this._client = new SOEClient(protocolName, remoteAddress, remotePort, cryptoKey, localClientPort));
    var proxyClient;
    this._useEncryption = true;
    this._dumpData = false;
    server.toggleEncryption(true);
    client.toggleEncryption(true);
    var me = this;
    server.on("connect", function (err, client) {
        debug("Client connected to local server");
        me._proxyClient = proxyClient = client;
    });
    client.on("connect", function (err, result) {
        debug("Connected to remote server, stating local server");
        server.start(result.compression, result.crcSeed, result.crcLength, result.udpLength);
    });
    var n0 = 0, n1 = 0;
    server.on("appdata", function (err, proxyClient, data) {
        debug("Received app data from proxy client");
        var obj = {
            appdata: data,
        };
        me.emit("clientappdata", err, obj);
        if (me._dumpData) {
            fs.writeFileSync("debug/soeproxy_clientappdata_" + n0 + ".dat", obj.appdata);
        }
        n0++;
        if (!obj.drop) {
            if (obj.delay) {
                setTimeout(function () {
                    client.sendAppData(obj.appdata, obj.useEncryption);
                }, obj.delay);
            }
            else {
                client.sendAppData(obj.appdata, obj.useEncryption);
            }
        }
    });
    client.on("appdata", function (err, data) {
        debug("Received app data from remote server");
        var obj = {
            appdata: data,
        };
        me.emit("serverappdata", err, obj);
        if (me._dumpData) {
            fs.writeFileSync("debug/soeproxy_serverappdata_" + n1 + ".dat", obj.appdata);
        }
        n1++;
        if (proxyClient) {
            if (!obj.drop) {
                if (obj.delay) {
                    setTimeout(function () {
                        server.sendAppData(proxyClient, obj.appdata, obj.useEncryption);
                    }, obj.delay);
                }
                else {
                    server.sendAppData(proxyClient, obj.appdata, obj.useEncryption);
                }
            }
        }
        else {
            debug("No client yet, dropping app data packet");
        }
    });
}
util.inherits(SOEProxy, EventEmitter);
SOEProxy.prototype.start = function () {
    debug("Connecting to remote server");
    this._client.connect();
};
SOEProxy.prototype.toggleEncryption = function (value) {
    value = !!value;
    this._useEncryption = value;
    this._client.toggleEncryption(value);
    this._server.toggleEncryption(value);
};
SOEProxy.prototype.toggleDataDump = function (value) {
    this._dumpData = value;
    this._server.toggleDataDump(value);
    this._client.toggleDataDump(value);
};
SOEProxy.prototype.stop = function () {
    this._client.disconnect();
    this._server.stop();
};
exports.SOEProxy = SOEProxy;
