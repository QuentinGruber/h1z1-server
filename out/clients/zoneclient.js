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
var EventEmitter = require("events").EventEmitter, GatewayClient = require("./gatewayclient").GatewayClient, fs = require("fs"), util = require("util"), ZoneProtocol = require("../protocols/archived/zoneprotocol").ZoneProtocol, ZonePackets = require("../protocols/archived/zoneprotocol").ZonePackets, debug = require("debug")("ZoneClient");
function ZoneClientError(message) {
    this.name = this.constructor.name;
    this.message = message;
}
util.inherits(ZoneClientError, Error);
function ZoneClient(serverAddress, serverPort, key, characterId, ticket, clientProtocol, clientBuild, localPort) {
    EventEmitter.call(this);
    var gatewayClient = (this._gatewayClient = new GatewayClient(serverAddress, serverPort, key, localPort));
    var protocol = (this._protocol = new ZoneProtocol());
    this._characterId = characterId;
    this._ticket = ticket;
    this._clientProtocol = clientProtocol;
    this._clientBuild = clientBuild;
    this._referenceData;
    this._environment = "";
    this._serverId = 0;
    var me = this;
    var n = 0;
    gatewayClient.on("tunneldata", function (err, data, flags) {
        debug("Received tunnel data (" + data.length + " bytes)");
        n++;
        //fs.writeFileSync("dump/tunneldata_" + n + ".dat", data);
        var packet;
        try {
            packet = protocol.parse(data, flags, false, me._referenceData);
        }
        catch (e) {
            //fs.writeFileSync("tunneldata_" + n + ".dat", data);
            debug("Failed parsing tunnel data: tunneldata_" + n + ".dat");
            return;
        }
        if (packet) {
            //fs.writeFileSync("dump/tunneldata_" + n + ".json", JSON.stringify(packet,null,2));
            switch (packet.name) {
                case "InitializationParameters":
                    me.emit("initializationParameters", null, packet.data);
                    break;
                case "ReferenceDataWeaponDefinitions":
                    me.emit("referenceDataWeaponDefinitions", null, packet.data);
                    break;
                case "SendZoneDetails":
                    me.emit("zoneDetails", null, packet.data);
                    break;
                case "ClientUpdateBaseZonePopulation":
                    me.emit("zonePopulation", null, packet.data.populations);
                    break;
                case "ClientUpdateBaseRespawnLocations":
                    me.emit("respawnLocations", null, packet.data.locations);
                    break;
                case "ClientGameSettings":
                    me.emit("clientGameSettings", null, packet.data);
                    break;
                case "VehicleBaseLoadVehicleDefinitionManager":
                    me.emit("loadVehicleDefinitionManager", null, packet.data.vehicleDefinitions);
                    break;
                case "CommandBaseItemDefinitions":
                    me.emit("itemDefinitions", null, packet.data);
                    break;
                case "SendSelfToClient":
                    me.emit("sendSelfToClient", null, packet.data.self);
                    gatewayClient.sendTunnelData(protocol.pack("ClientInitializationDetails", {
                        unknownDword1: 7200,
                    }), 0);
                    gatewayClient.sendTunnelData(protocol.pack("SetLocale", {
                        locale: "en_US",
                    }), 1);
                    gatewayClient.sendTunnelData(protocol.pack("GetContinentBattleInfo"), 1);
                    gatewayClient.sendTunnelData(protocol.pack("GetRewardBuffInfo"));
                    gatewayClient.sendTunnelData(protocol.pack("ClientIsReady"));
                    break;
            }
        }
    });
    gatewayClient.on("connect", function (err, result) {
        debug("Connected to gateway server");
        me.emit("connect", err, result);
        gatewayClient.login(characterId, ticket, clientProtocol, clientBuild);
    });
    gatewayClient.on("disconnect", function (err, result) {
        debug("Disconnected");
        me.emit("disconnect", err, result);
    });
}
util.inherits(ZoneClient, EventEmitter);
ZoneClient.prototype.connect = function () {
    debug("Connecting to gateway server");
    this._gatewayClient.connect();
};
ZoneClient.prototype.login = function () { };
ZoneClient.prototype.disconnect = function () { };
ZoneClient.prototype.setReferenceData = function (data) {
    this._referenceData = data;
};
exports.ZoneClient = ZoneClient;
