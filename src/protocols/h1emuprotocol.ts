// ======================================================================
//
//   GNU GENERAL PUBLIC LICENSE
//   Version 3, 29 June 2007
//   copyright (c) 2021 Quentin Gruber
//
//   https://github.com/QuentinGruber/h1z1-server
//   https://www.npmjs.com/package/h1z1-server
//
//   Based on https://github.com/psemu/soe-network
// ======================================================================

const debug = require("debug")("H1emuProtocol");
import DataSchema from "h1z1-dataschema";
import h1emupackets from "../packets/H1emu/h1emupackets";
export class H1emuProtocol {
  h1emuPackets: any;
  constructor() {
    this.h1emuPackets = h1emupackets;
  }

  parse(data: any) {
    const packetType = data[0];
    let result;
    const packet = this.h1emuPackets.Packets[packetType];
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
        "parse() " + "Unknown or unhandled h1emu packet type: " + packetType
      );
      return false;
    }
  }

  pack(packetName: string, object: any) {
    const packetType = this.h1emuPackets.PacketTypes[packetName];
    const packet = this.h1emuPackets.Packets[packetType];
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
          payload.data.copy(data,1);
        } else {
          debug("Could not pack data schema for " + packet.name);
        }
      } else {
        debug("pack()", "No schema for packet " + packet.name);
      }
    } else {
      debug("pack()", "Unknown or unhandled h1emu packet type: " + packetType);
    }
    return data;
  }
}

exports.H1emuProtocol = H1emuProtocol;
