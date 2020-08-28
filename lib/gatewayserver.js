"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
var events_1 = require("events");
var SOEServer = require("./soeserver").SOEServer, GatewayProtocol = require("./gatewayprotocol").GatewayProtocol, debug = require("debug")("GatewayServer");
var GatewayServer = /** @class */ (function (_super) {
    __extends(GatewayServer, _super);
    function GatewayServer(protocolName, serverPort, gatewayKey) {
        var _this = _super.call(this) || this;
        _this._compression = 0x0000;
        _this._crcSeed = 0;
        _this._crcLength = 2;
        _this._udpLength = 512;
        var soeServer = (_this._soeServer = new SOEServer(protocolName, serverPort, gatewayKey));
        soeServer.toggleEncryption(false);
        _this._protocol = new GatewayProtocol();
        _this._soeServer.on("connect", function (err, client) {
            debug("Client connected from " + client.address + ":" + client.port);
            //server.emit('connect', err, client);
        });
        _this._soeServer.on("disconnect", function (err, client) {
            debug("Client disconnected from " + client.address + ":" + client.port);
            //server.emit('disconnect', err, client);
        });
        _this._soeServer.on("session", function (err, client) {
            debug("Session started for client " + client.address + ":" + client.port);
        });
        _this.on("sendTunnelData", function (client, tunnelData) {
            debug("Sending tunnel data to client");
            var data = _this._protocol.pack("TunnelPacketToExternalConnection", {
                channel: 0,
                tunnelData: tunnelData,
            });
            //fs.writeFileSync("gatewayserver_appdata_" + (n++) + ".dat", data);
            _this._soeServer.sendAppData(client, data);
        });
        _this.on("appdata", function (client, data) {
            var packet = _this._protocol.parse(data);
            if (packet != false && packet != undefined) {
                var result = packet.result;
                switch (packet.name) {
                    case "LoginRequest":
                        _this._soeServer.toggleEncryption(true);
                        _this._soeServer.sendAppData(client, _this._protocol.pack("LoginReply", { loggedIn: true }), true);
                        _this._soeServer.sendAppData(client, _this._protocol.pack("ChannelIsRoutable", {
                            channel: 0,
                            isRoutable: true,
                        }), true);
                        _this._soeServer.sendAppData(client, _this._protocol.pack("ChannelIsRoutable", {
                            channel: 1,
                            isRoutable: true,
                        }), true);
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
            }
            else {
                debug("Packet parsing was unsuccesful");
            }
        });
        return _this;
    }
    GatewayServer.prototype.start = function () {
        debug("Starting server");
        this._soeServer.start(this._compression, this._crcSeed, this._crcLength, this._udpLength);
    };
    GatewayServer.prototype.stop = function () {
        debug("Shutting down");
    };
    return GatewayServer;
}(events_1.EventEmitter));
exports.GatewayServer = GatewayServer;
