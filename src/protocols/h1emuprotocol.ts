// ======================================================================
//
//   GNU GENERAL PUBLIC LICENSE
//   Version 3, 29 June 2007
//   copyright (c) 2020 - 2021 Quentin Gruber
//   copyright (c) 2021 H1emu community
//
//   https://github.com/QuentinGruber/h1z1-server
//   https://www.npmjs.com/package/h1z1-server
//
//   Based on https://github.com/psemu/soe-network
// ======================================================================

const debug = require("debug")("H1emuProtocol");
import DataSchema from "h1z1-dataschema";
import PacketTableBuild from "../packets/packettable";
const packets = [
  [
    "SessionRequest",
    0x01,
    {
        fields: [
            { name: "serverId", type: "uint32", defaultValue: 0 },
        ]
    }
  ],
  [
    "SessionReply",
    0x02,
    {
        fields: [
            { name: "status", type: "uint8", defaultValue: 0 },
        ]
    }
  ],
  [
    "Ping",
    0x03,
    {}
  ],
  [
    "ZoneInfoRequest",
    0x04,
    {
        fields: [
        ]
    }
  ],
  [
    "ZoneInfoReply",
    0x05,
    {
        fields: [
        ]
    }
  ],
  [
    "test",
    0xff,
    {
        fields: [
            { name: "msg", type: "uint32", defaultValue: 0 },
        ]
    }
  ]
];

export const [H1emuPacketsPacketTypes, H1emuPacketsPackets] =
  PacketTableBuild(packets);

const H1emuPackets = {
  PacketTypes: H1emuPacketsPacketTypes,
  Packets: H1emuPacketsPackets,
};

function packH1emuPacket(
  packetName: string,
  object: any
) {
  let packetType = H1emuPackets.PacketTypes[packetName],
    packet = H1emuPackets.Packets[packetType],
    data
  if (packet) {
    if (packet.schema) {
      const packetData = DataSchema.pack(packet.schema, object);
      if (packetData) {
        data = Buffer.alloc(1 + packetData.length);
        data.writeUInt8(packetType, 0);
        packetData.data.copy(data, 1);
      } else {
        debug("Could not pack data schema for " + packet.name);
      }
      debug("Packing data for " + packet.name);
    } else {
      debug("pack()", "No pack function for packet " + packet.name);
    }
  } else {
    debug("pack()", "Unknown or unhandled H1emu packet type: " + packetType);
  }
  return data;
}

function parseH1emuPacket(
  data: any
) {
  const packetType = data.readUInt8(0);
  let result,
    packet = H1emuPackets.Packets[packetType];
  if (packet) {
    if (packet.schema) {
      //debug(packet.name);
      result = DataSchema.parse(packet.schema, data, 1).result;
      return {
        type: packet.type,
        name: packet.name,
        result: result,
      };
    } else {
      debug("parse()", "No parser for packet " + packet.name);
    }
  } else {
    debug("parse()", "Unknown or unhandled H1emu packet type: " + packetType);
    return {
      result: null,
    };
  }
}

export class H1emuProtocol {
  parse(data: any) {
    return parseH1emuPacket(data);
  }

  pack(packetName: string, object: any) {
    const data = packH1emuPacket(packetName, object);
    return data;
  }
}

exports.H1emuPackets = H1emuPackets as any;
