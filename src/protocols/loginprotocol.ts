// ======================================================================
//
//   GNU GENERAL PUBLIC LICENSE
//   Version 3, 29 June 2007
//   copyright (C) 2020 - 2021 Quentin Gruber
//   copyright (C) 2021 - 2022 H1emu community
//
//   https://github.com/QuentinGruber/h1z1-server
//   https://www.npmjs.com/package/h1z1-server
//
//   Based on https://github.com/psemu/soe-network
// ======================================================================

const debug = require("debug")("LoginProtocol");
import DataSchema from "h1z1-dataschema";

export class LoginProtocol {
  loginPackets: any;
  tunnelLoginPackets: any;
  constructor() {
    this.loginPackets =
      require("../packets/LoginUdp/LoginUdp_9/loginpackets").default;
    this.tunnelLoginPackets =
      require("../packets/LoginUdp/LoginUdp_9/loginTunnelPackets").default;
  }

  parse(data: any) {
    const packetType = data[0];
    let result;
    const packet = this.loginPackets.Packets[packetType];
    if (packet) {
      if (packet.name === "TunnelAppPacketClientToServer") {
        const { schema, name } =
          this.tunnelLoginPackets.Packets[data.readUint8(13)];
        const tunnelData = data.slice(14);
        try {
          result = DataSchema.parse(schema, tunnelData, 0, undefined).result;
        } catch (error) {
          console.error(`${packet.name} : ${error}`);
        }
        return {
          serverId: data.readUInt32LE(1),
          unknown: data.readUInt32LE(5),
          subPacketName: name,
          packetLength: data.readUInt32LE(9),
          name: packet.name,
          result: result,
        };
      } else if (packet.schema) {
        debug(packet.name);
        try {
          result = DataSchema.parse(packet.schema, data, 1, undefined).result;
        } catch (error) {
          console.error(`${packet.name} : ${error}`);
        }
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

  pack(packetName: string, object: any): Buffer {
    const packetType = this.loginPackets.PacketTypes[packetName];
    const packet = this.loginPackets.Packets[packetType];
    let payload;
    let data;
    if (packet) {
      if (packet.name === "TunnelAppPacketServerToClient") {
        const { subPacketOpcode } = object;
        const { schema } = this.tunnelLoginPackets.Packets[subPacketOpcode];
        let tunnelData;
        try {
          tunnelData = DataSchema.pack(
            schema,
            object,
            undefined,
            undefined,
            undefined
          );
        } catch (error) {
          console.error(`${subPacketOpcode} : ${error}`);
          return Buffer.from("0");
        }

        const basePacketLength = 14;
        const opcodesLength = 1;
        data = new (Buffer as any).alloc(basePacketLength + tunnelData.length);
        data.writeUInt8(packetType, 0);
        data.writeUInt32LE(object.serverId, 1);
        data.writeUInt32LE(0, 5);
        data.writeUInt32LE(tunnelData.length + opcodesLength, 9);
        data.writeUInt8(subPacketOpcode, 13);
        tunnelData.data.copy(data, basePacketLength);
        debug("tunnelpacket send data :", object);
      } else if (packet.schema) {
        debug("Packing data for " + packet.name);
        try {
          payload = DataSchema.pack(
            packet.schema,
            object,
            undefined,
            undefined,
            undefined
          );
        } catch (error) {
          console.error(`${packet.name} : ${error}`);
        }
        if (payload) {
          data = Buffer.allocUnsafe(1 + payload.length);
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
