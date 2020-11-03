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

const debug = require("debug")("LoginProtocol");
import DataSchema from "h1z1-dataschema";
const LoginPackets = require("../packets/loginpackets");

export class LoginProtocol {
  parse(data: any) {
    const packetType = data[0];
    let result;
    const packet = LoginPackets.Packets[packetType];
    if (packet) {
      if (packet.schema) {
        debug(packet.name);
        result = DataSchema.parse(packet.schema, data, 1, undefined).result;
        debug("[DEBUG] Packet receive :");
        debug(result);

        return {
          type: packet.type,
          name: packet.name,
          result: result,
        };
      } else {
        debug("parse()", "No schema for packet ", packet.name);
        return false;
      }
    } else {
      debug(
        "parse() " + "Unknown or unhandled login packet type: " + packetType
      );
      return false;
    }
  }

  pack(packetName: string, object: any) {
    const packetType = LoginPackets.PacketTypes[packetName];
    const packet = LoginPackets.Packets[packetType];
    let payload;
    let data;
    if (packet) {
      if (packet.schema) {
        debug("Packing data for " + packet.name);
        payload = DataSchema.pack(
          packet.schema,
          object,
          undefined,
          undefined,
          undefined
        );
        if (payload) {
          data = new (Buffer.alloc as any)(1 + payload.length);
          data.writeUInt8(packetType, 0);
          payload.data.copy(data, 1);
        } else {
          debug("Could not pack data schema for " + packet.name);
        }
      } else {
        debug("pack()", "No schema for packet " + packet.name);
      }
    } else {
      debug("pack()", "Unknown or unhandled login packet type: " + packetType);
    }
    return data;
  }
}

exports.LoginProtocol = LoginProtocol;
exports.LoginPackets = LoginPackets;
