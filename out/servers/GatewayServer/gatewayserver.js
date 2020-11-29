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
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.GatewayServer = void 0;
var events_1 = require("events");
var soeserver_1 = require("../SoeServer/soeserver");
var gatewayprotocol_1 = require("../../protocols/gatewayprotocol");
var debug = require("debug")("GatewayServer");
var GatewayServer = /** @class */ (function (_super) {
    __extends(GatewayServer, _super);
    function GatewayServer(protocolName, serverPort, gatewayKey) {
        var _this = _super.call(this) || this;
        _this._compression = 0x0000;
        _this._crcSeed = 0;
        _this._crcLength = 2;
        _this._udpLength = 512;
        _this._soeServer = new soeserver_1.SOEServer(protocolName, serverPort, gatewayKey, _this._compression, true); // as any since SOEServer isn't typed
        _this._protocol = new gatewayprotocol_1.GatewayProtocol();
        _this._soeServer.on("connect", function (err, client) {
            debug("Client connected from " + client.address + ":" + client.port);
            _this.emit("connect", err, client);
        });
        _this._soeServer.on("disconnect", function (err, client) {
            debug("Client disconnected from " + client.address + ":" + client.port);
            _this.emit("disconnect", err, client);
        });
        _this._soeServer.on("session", function (err, client) {
            debug("Session started for client " + client.address + ":" + client.port);
        });
        _this._soeServer.on("appdata", function (err, client, data) {
            var packet = _this._protocol.parse(data);
            if (packet !== false && packet !== undefined) {
                var result = packet.result;
                switch (packet.name) {
                    case "LoginRequest":
                        _this._soeServer.toggleEncryption();
                        _this._soeServer.sendAppData(client, _this._protocol.pack("LoginReply", { loggedIn: true }), true);
                        if (result && result.characterId) {
                            _this.emit("login", null, client, result.characterId);
                        }
                        break;
                    case "Logout":
                        debug("Logout");
                        _this.emit("logout", null, client);
                        break;
                    case "TunnelPacketFromExternalConnection":
                        debug("TunnelPacketFromExternalConnection");
                        _this.emit("tunneldata", null, client, packet.tunnelData, packet.flags);
                        break;
                }
            }
            else {
                debug("Packet parsing was unsuccesful");
            }
        });
        _this.on("logout", function (err, client) {
            _this._soeServer.deleteClient(client);
        });
        return _this;
    }
    GatewayServer.prototype.start = function () {
        debug("Starting server");
        this._soeServer.start(this._compression, this._crcSeed, this._crcLength, this._udpLength);
    };
    GatewayServer.prototype.sendTunnelData = function (client, tunnelData) {
        debug("Sending tunnel data to client");
        var data = this._protocol.pack("TunnelPacketToExternalConnection", {
            channel: 0,
            tunnelData: tunnelData,
        });
        this._soeServer.sendAppData(client, data);
    };
    GatewayServer.prototype.stop = function () {
        debug("Shutting down");
        process.exit(0);
    };
    return GatewayServer;
}(events_1.EventEmitter));
exports.GatewayServer = GatewayServer;
