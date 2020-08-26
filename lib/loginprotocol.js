"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LoginProtocol = void 0;
var fs = require("fs"), debug = require("debug")("LoginProtocol"), DataSchema = require("h1z1-dataschema"), LoginPackets = require("./loginpackets");
var LoginProtocol = /** @class */ (function () {
    function LoginProtocol(SpamGlitch) {
        var n = 0;
        this._SpamGlitch = SpamGlitch;
    }
    LoginProtocol.prototype.parse = function (data) {
        var packetType = data[0], result, schema, name, packet = LoginPackets.Packets[packetType];
        if (packet == undefined && this._SpamGlitch)
            packet = LoginPackets.Packets[1]; // HACK
        if (packet) {
            if (packet.schema) {
                debug(packet.name);
                result = DataSchema.parse(packet.schema, data, 1).result;
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
            //fs.writeFileSync("debug/loginbadpacket.dat", data); Diseable that
            debug("parse() " + "Unknown or unhandled login packet type: " + packetType);
            return false;
        }
    };
    LoginProtocol.prototype.pack = function (packetName, object) {
        var packetType = LoginPackets.PacketTypes[packetName], packet = LoginPackets.Packets[packetType], payload, data;
        if (packet) {
            if (packet.schema) {
                debug("Packing data for " + packet.name);
                payload = DataSchema.pack(packet.schema, object);
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
