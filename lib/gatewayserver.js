"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GatewayServer = void 0;
var EventEmitter = require("events").EventEmitter, SOEServer = require("./soeserver").SOEServer, https = require("https"), fs = require("fs"), util = require("util"), GatewayProtocol = require("./gatewayprotocol").GatewayProtocol;
function debug(arg) {
    console.log(arg);
}
var GatewayServer = /** @class */ (function () {
    function GatewayServer(protocolName, serverPort, gatewayKey) {
        this._compression = 0x0000;
        this._crcSeed = 0;
        this._crcLength = 2;
        this._udpLength = 512;
        var soeServer = (this._soeServer = new SOEServer(protocolName, serverPort, gatewayKey));
        soeServer.toggleEncryption(false);
        this._protocol = new GatewayProtocol();
    }
    GatewayServer.prototype.start = function () {
        debug("Starting server");
        this._soeServer.start(this._compression, this._crcSeed, this._crcLength, this._udpLength);
    };
    GatewayServer.prototype.stop = function () {
        debug("Shutting down");
    };
    GatewayServer.prototype.sendTunnelData = function (client, tunnelData) {
        debug("Sending tunnel data to client");
        var data = this._protocol.pack("TunnelPacketToExternalConnection", {
            channel: 0,
            tunnelData: tunnelData,
        });
        //fs.writeFileSync("gatewayserver_appdata_" + (n++) + ".dat", data);
        this._soeServer.sendAppData(client, data);
    };
    GatewayServer.prototype.connect = function (client) {
        debug("Client connected from " + client.address + ":" + client.port);
    };
    GatewayServer.prototype.disconnect = function (client) {
        debug("Client disconnected from " + client.address + ":" + client.port);
    };
    GatewayServer.prototype.session = function (client) {
        debug("Session started for client " + client.address + ":" + client.port);
    };
    GatewayServer.prototype.appdata = function (client, data) {
        var packet = this._protocol.parse(data);
        if (packet != false && packet != undefined) {
            var result = packet.result;
            switch (packet.name) {
                case "LoginRequest":
                    this._soeServer.toggleEncryption(true);
                    this._soeServer.sendAppData(client, this._protocol.pack("LoginReply", { loggedIn: true }), true);
                    this._soeServer.sendAppData(client, this._protocol.pack("ChannelIsRoutable", {
                        channel: 0,
                        isRoutable: true,
                    }), true);
                    this._soeServer.sendAppData(client, this._protocol.pack("ChannelIsRoutable", {
                        channel: 1,
                        isRoutable: true,
                    }), true);
                    //  me.emit("login", null, client, result.characterId);
                    break;
                case "Logout":
                    //     me.emit("logout", null, client);
                    break;
                case "TunnelPacketFromExternalConnection":
                    //   me.emit("tunneldata", null, client, packet.tunnelData, packet.flags);
                    break;
            }
        }
        else {
            debug("Packet parsing was unsuccesful");
        }
    };
    return GatewayServer;
}());
exports.GatewayServer = GatewayServer;
