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
var EventEmitter = require("events").EventEmitter, GatewayProxy = require("./gatewayproxy").GatewayProxy, ZoneProtocol = require("../protocols/archived/zoneprotocol").ZoneProtocol, util = require("util"), fs = require("fs"), debug = require("debug")("ZoneProxy");
function ZoneProxy(remoteAddress, remotePort, cryptoKey, localPort, localClientPort) {
    EventEmitter.call(this);
    var gatewayProxy = (this._gatewayProxy = new GatewayProxy("ExternalGatewayApi_3", remoteAddress, remotePort, cryptoKey, localPort, localClientPort));
    var protocol = new ZoneProtocol();
    var me = this;
    var failCount = 0;
    var dropClientPackets = [], dropServerPackets = [];
    setInterval(function () {
        try {
            var data = JSON.parse(fs.readFileSync("zonedroppackets.json"));
            if (data && data.clientPackets) {
                dropClientPackets = data.clientPackets;
            }
            if (data && data.serverPackets) {
                dropServerPackets = data.serverPackets;
            }
        }
        catch (e) {
            console.log(e);
        }
    }, 1000);
    var n = 0;
    gatewayProxy.on("clienttunneldata", function (err, data, flags) {
        var packet;
        try {
            packet = protocol.parse(data, flags, true);
        }
        catch (e) {
            fs.writeFileSync("debug/clienttunnelfail_" + failCount + ".dat", data);
            debug("Failed parsing client tunnel data " + failCount);
            failCount++;
        }
        if (packet) {
            me.emit("clientdata", err, packet);
            debug(Date.now(), "Client data: " + packet.name);
            //fs.writeFileSync("debug/gatewayproxy_" + (n++) + "_" + packet.name + "_client.dat", data);
            if (dropClientPackets.indexOf(packet.name) > -1) {
                debug("Dropping client packet: " + packet.name);
                data.drop = true;
            }
            if (packet.dirty) {
                data.newData = protocol.pack(packet.name, packet.data);
                data.dirty = true;
            }
        }
    });
    gatewayProxy.on("servertunneldata", function (err, data, flags) {
        var packet;
        try {
            packet = protocol.parse(data, flags, false);
        }
        catch (e) {
            fs.writeFileSync("debug/servertunnelfail_" + failCount + ".dat", data);
            debug("Failed parsing server tunnel data " + failCount);
            failCount++;
        }
        if (packet) {
            me.emit("serverdata", err, packet);
            debug(Date.now(), "Server data: " + packet.name);
            if (packet.name == "SendSelfToClient") {
                debug("Rewriting!");
                packet.data.unknownBoolean9 = true;
                packet.dirty = true;
            }
            //fs.writeFileSync("debug/gatewayproxy_" + (n++) + "_" + packet.name + "_server.dat", data);
            // if (dropServerPackets.indexOf(packet.name) > -1) {
            //     debug("Dropping server packet: " + packet.name);
            //     data.drop = true;
            // }
            // if (packet.name == "Command.AddWorldCommand") {
            //     console.log(JSON.stringify(packet, null, 4));
            //     if (packet.data.command == "friend") {
            //         console.log("Rewriting!");
            //         packet.data.command = "gm";
            //         packet.dirty = true;
            //     }
            // }
            // if (packet.name == "Command.AddZoneCommand") {
            //     console.log(JSON.stringify(packet, null, 4));
            //     if (packet.data.command == "location") {
            //         console.log("Rewriting!");
            //         packet.data.command = "zonebroadbast";
            //         packet.dirty = true;
            //     }
            // }
            // if (packet.name == "ClientUpdate.UpdateStat") {
            //     console.log(JSON.stringify(packet, null, 4));
            //     for (var i=0;i<packet.data.stats.length;i++) {
            //         if (packet.data.stats[i].statId == 3) {
            //             packet.data.stats[i].statValue.value = 1;
            //             packet.dirty = true;
            //         }
            //         if (packet.data.stats[i].statId == 9) {
            //             packet.data.stats[i].statValue.value = 0;
            //             packet.dirty = true;
            //         }
            //         if (packet.data.stats[i].statId == 12) {
            //             packet.data.stats[i].statValue.value = 0;
            //             packet.dirty = true;
            //         }
            //         if (packet.data.stats[i].statId == 11) {
            //             packet.data.stats[i].statValue.value = 0;
            //             packet.dirty = true;
            //         }
            //         if (packet.data.stats[i].statId == 18 || packet.data.stats[i].statId == 19 || packet.data.stats[i].statId == 20) {
            //             packet.data.stats[i].statValue.value = 1500;
            //             packet.dirty = true;
            //         }
            //     }
            // }
            if (packet.dirty) {
                console.log("Repacking!");
                data.newData = protocol.pack(packet.name, packet.data);
                data.dirty = true;
            }
        }
    });
}
util.inherits(ZoneProxy, EventEmitter);
ZoneProxy.prototype.start = function () {
    debug("Starting gateway proxy");
    this._gatewayProxy.start();
};
ZoneProxy.prototype.stop = function () {
    debug("Stopping gateway proxy");
    this._gatewayProxy.stop();
};
exports.ZoneProxy = ZoneProxy;
