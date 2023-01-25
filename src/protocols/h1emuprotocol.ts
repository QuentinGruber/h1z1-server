// ======================================================================
//
//   GNU GENERAL PUBLIC LICENSE
//   Version 3, 29 June 2007
//   copyright (C) 2020 - 2021 Quentin Gruber
//   copyright (C) 2021 - 2023 H1emu community
//
//   https://github.com/QuentinGruber/h1z1-server
//   https://www.npmjs.com/package/h1z1-server
//
//   Based on https://github.com/psemu/soe-network
// ======================================================================

const debug = require("debug")("H1emuProtocol");
import DataSchema from "h1z1-dataschema";
import { H1emuProtocolReadingFormat } from "types/protocols";
import PacketTableBuild from "../packets/packettable";
const packets = [
  [
    "SessionRequest",
    0x01,
    {
      fields: [
        { name: "serverId", type: "uint32", defaultValue: 0 },
        { name: "h1emuVersion", type: "string", defaultValue: "" },
      ],
    },
  ],
  [
    "SessionReply",
    0x02,
    {
      fields: [{ name: "status", type: "uint8", defaultValue: 0 }],
    },
  ],
  [
    "Ping",
    0x03,
    {
      fields: [],
    },
  ],
  ["Ack", 0x04, {}],
  [
    "CharacterCreateRequest",
    0x05,
    {
      fields: [
        { name: "reqId", type: "uint32", defaultValue: 0 },
        { name: "characterObjStringify", type: "string", defaultValue: "" },
      ],
    },
  ],
  [
    "CharacterCreateReply",
    0x06,
    {
      fields: [
        { name: "reqId", type: "uint32", defaultValue: 0 },
        { name: "status", type: "boolean", defaultValue: 0 },
      ],
    },
  ],
  [
    "CharacterDeleteRequest",
    0x07,
    {
      fields: [
        { name: "reqId", type: "uint32", defaultValue: 0 },
        { name: "characterId", type: "uint64string", defaultValue: 0 },
      ],
    },
  ],
  [
    "CharacterDeleteReply",
    0x08,
    {
      fields: [
        { name: "reqId", type: "uint32", defaultValue: 0 },
        { name: "status", type: "boolean", defaultValue: 0 },
      ],
    },
  ],
  [
    "UpdateZonePopulation",
    0x09,
    {
      fields: [{ name: "population", type: "uint8", defaultValue: 0 }],
    },
  ],
  [
    "ZonePingRequest",
    0x10,
    {
      fields: [
        { name: "reqId", type: "uint32", defaultValue: 0 },
        { name: "address", type: "string", defaultValue: 0 },
      ],
    },
  ],
  [
    "ZonePingReply",
    0x11,
    {
      fields: [
        { name: "reqId", type: "uint32", defaultValue: 0 },
        { name: "status", type: "boolean", defaultValue: 0 },
      ],
    },
  ],
  [
    "CharacterExistRequest",
    0x12,
    {
      fields: [
        { name: "reqId", type: "uint32", defaultValue: 0 },
        { name: "characterId", type: "uint64string", defaultValue: 0 },
      ],
    },
  ],
  [
    "CharacterExistReply",
    0x13,
    {
      fields: [
        { name: "reqId", type: "uint32", defaultValue: 0 },
        { name: "status", type: "boolean", defaultValue: 0 },
      ],
    },
  ],
  [
    "ClientIsAdminRequest",
    0x14,
    {
      fields: [
        { name: "reqId", type: "uint32", defaultValue: 0 },
        { name: "guid", type: "uint64string", defaultValue: 0 },
      ],
    },
  ],
  [
    "ClientIsAdminReply",
    0x15,
    {
      fields: [
        { name: "reqId", type: "uint32", defaultValue: 0 },
        { name: "status", type: "boolean", defaultValue: 0 },
      ],
    },
  ],
];

export const [H1emuPacketsPacketTypes, H1emuPacketsPackets] =
  PacketTableBuild(packets);

const H1emuPackets = {
  PacketTypes: H1emuPacketsPacketTypes,
  Packets: H1emuPacketsPackets,
};

export class H1emuProtocol {
  parse(data: Buffer): H1emuProtocolReadingFormat | null {
    const packetType = data.readUInt8(0);
    let result;
    const packet = H1emuPackets.Packets[packetType];
    if (packet) {
      if (packet.schema) {
        try {
          result = DataSchema.parse(packet.schema, data, 1).result;
        } catch (e) {
          console.error(`${packet.name} : ${e}`);
          return null;
        }
        return {
          type: packet.type,
          name: packet.name,
          data: result,
        };
      } else {
        debug("parse()", "No parser for packet " + packet.name);
        return null;
      }
    } else {
      debug("parse()", "Unknown or unhandled H1emu packet type: " + packetType);
      return null;
    }
  }

  pack(packetName: string, object: any): Buffer | null {
    const packetType = H1emuPackets.PacketTypes[packetName],
      packet = H1emuPackets.Packets[packetType];
    let data;
    if (packet) {
      if (packet.schema) {
        const packetData = DataSchema.pack(packet.schema, object);
        if (packetData) {
          data = Buffer.allocUnsafe(1 + packetData.length);
          data.writeUInt8(packetType, 0);
          packetData.data.copy(data, 1);
        } else {
          debug("Could not pack data schema for " + packet.name);
          return null;
        }
      } else {
        debug("pack()", "No pack function for packet " + packet.name);
        return null;
      }
    } else {
      debug("pack()", "Unknown or unhandled H1emu packet type: " + packetType);
      return null;
    }
    return data;
  }
}

exports.H1emuPackets = H1emuPackets as any;
