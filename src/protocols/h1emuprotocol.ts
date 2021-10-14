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
import PacketTableBuild from "../packets/packettable";
const packets = [/*
  [
    "SessionRequest",
    0x01,
    {
      parse: function (
        data: any,
        crcSeed: number,
        compression: number,
        isSubPacket: boolean
      ) {
        const clientCRCLength = data.readUInt32BE(2);
        const clientSessionId = data.readUInt32BE(6);
        const clientUDPLength = data.readUInt32BE(10);
        const protocol = data.readNullTerminatedString(14);
        return {
          crcLength: clientCRCLength,
          sessionId: clientSessionId,
          udpLength: clientUDPLength,
          protocol: protocol,
        };
      },
      pack: function (
        packet: any,
        crcSeed: number,
        compression: number,
        isSubPacket: boolean
      ) {
        const data = new (Buffer as any).alloc(14 + packet.protocol.length + 1);
        data.writeUInt16BE(0x01, 0);
        data.writeUInt32BE(packet.crcLength, 2);
        data.writeUInt32BE(packet.sessionId, 6);
        data.writeUInt32BE(packet.udpLength, 10);
        data.write(packet.protocol, 14);
        return data;
      },
    }
  ],*/
  [
    "test",
    0x01,
    {
      parse: function (
        data: any
      ) {
        const msg = data.readUInt32LE(1);
        return {
          msg: msg
        };
      },
      pack: function (
        packet: any
      ) {
        const data = new (Buffer as any).alloc(1+4); // opcode byte + dword
        data.writeUInt8(0x01, 0); // opcode
        data.writeUint32LE(packet.msg, 1); // msg dword
        return data;
      },
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
  let packetType = (H1emuPackets as any).PacketTypes[packetName],
    packet = (H1emuPackets as any).Packets[packetType],
    data;
  if (packet) {
    if (packet.pack) {
      data = packet.pack(object);
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
    packet = (H1emuPackets as any).Packets[packetType];
  if (packet) {
    if (packet.parse) {
      //debug(packet.name);
      result = packet.parse(data);
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
