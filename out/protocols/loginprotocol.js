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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LoginProtocol = void 0;
var debug = require("debug")("LoginProtocol");
var h1z1_dataschema_1 = __importDefault(require("h1z1-dataschema"));
var LoginPackets = require("../packets/loginpackets");
var LoginProtocol = /** @class */ (function () {
    function LoginProtocol() {
    }
    LoginProtocol.prototype.parse = function (data) {
        var packetType = data[0];
        var result;
        var packet = LoginPackets.Packets[packetType];
        if (packet) {
            if (packet.schema) {
                debug(packet.name);
                result = h1z1_dataschema_1.default.parse(packet.schema, data, 1, undefined).result;
                debug("[DEBUG] Packet receive :");
                debug(result);
                return {
                    type: packet.type,
                    name: packet.name,
                    result: result,
                };
            }
            else {
                debug("parse()", "No schema for packet ", packet.name);
                return false;
            }
        }
        else {
            debug("parse() " + "Unknown or unhandled login packet type: " + packetType);
            return false;
        }
    };
    LoginProtocol.prototype.pack = function (packetName, object) {
        var packetType = LoginPackets.PacketTypes[packetName];
        var packet = LoginPackets.Packets[packetType];
        var payload;
        var data;
        if (packet) {
            if (packet.schema) {
                debug("Packing data for " + packet.name);
                payload = h1z1_dataschema_1.default.pack(packet.schema, object, undefined, undefined, undefined);
                if (payload) {
                    data = new Buffer.alloc(1 + payload.length);
                    data.writeUInt8(packetType, 0);
                    payload.data.copy(data, 1);
                }
                else {
                    debug("Could not pack data schema for " + packet.name);
                }
            }
            else {
                debug("pack()", "No schema for packet " + packet.name);
            }
        }
        else {
            debug("pack()", "Unknown or unhandled login packet type: " + packetType);
        }
        return data;
    };
    return LoginProtocol;
}());
exports.LoginProtocol = LoginProtocol;
exports.LoginProtocol = LoginProtocol;
exports.LoginPackets = LoginPackets;
