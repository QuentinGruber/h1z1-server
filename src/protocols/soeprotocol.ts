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

const debug = require("debug")("SOEProtocol");
const PacketTable = require("../packets/packettable");
const { appendCRC } = require("../utils/crc");
const stand_alone_packets = [
  [
    "ZonePing",
    0x1,
    {
      parse: function (data: any) {
        return {
          PingId: data.readUInt16LE(1),
          Data: data.toString("hex").substring(6),
        };
      },
      pack: function (data: any) {
        const packet = new (Buffer as any).alloc(5);
        packet.writeUInt8(0x1, 0);
        packet.writeUInt16LE(data.PingId, 1);
        packet.write(data.Data, 3, "hex");
        return packet;
      },
    },
  ],
];
const packets = [
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
    },
  ],
  [
    "SessionReply",
    0x02,
    {
      parse: function (
        data: any,
        crcSeed: number,
        compression: number,
        isSubPacket: boolean
      ) {
        const serverSessionId = data.readUInt32BE(2);
        const serverCrcSeed = data.readUInt32BE(6);
        const serverCRCLength = data.readUInt8(10);
        const serverCompression = data.readUInt16BE(11);
        const serverUDPLength = data.readUInt32BE(13);
        return {
          crcSeed: serverCrcSeed,
          crcLength: serverCRCLength,
          sessionId: serverSessionId,
          compression: serverCompression,
          udpLength: serverUDPLength,
        };
      },
      pack: function (
        packet: any,
        crcSeed: number,
        compression: number,
        isSubPacket: boolean
      ) {
        const data = new (Buffer as any).alloc(21);
        data.writeUInt16BE(0x02, 0);
        data.writeUInt32BE(packet.sessionId, 2);
        data.writeUInt32BE(packet.crcSeed, 6);
        data.writeUInt8(packet.crcLength, 10);
        data.writeUInt16BE(packet.compression, 11);
        data.writeUInt32BE(packet.udpLength, 13);
        data.writeUInt32BE(3, 17);
        return data;
      },
    },
  ],
  [
    "MultiPacket",
    0x03,
    {
      parse: function (
        data: any,
        crcSeed: number,
        compression: number,
        isSubPacket: boolean,
        appData: any
      ) {
        let offset = 2 + (compression ? 1 : 0),
          dataLength;
        const subPackets = [];
        while (offset < data.length - 2) {
          dataLength = readDataLength(data, offset);
          offset += dataLength.numBytes;
          subPackets.push(
            parseSOEPacket(
              data.slice(offset, offset + dataLength.value),
              crcSeed,
              compression,
              true,
              appData
            )
          );
          offset += dataLength.value;
        }
        return {
          subPackets: subPackets,
        };
      },
      pack: function (
        packet: any,
        crcSeed: number,
        compression: number,
        isSubPacket: boolean
      ) {
        const dataParts = [];
        let subData,
          data = new (Buffer as any).alloc(2 + (compression ? 1 : 0));
        data.writeUInt16BE(0x03, 0);
        if (compression) {
          data.writeUInt8(0, 2);
        }
        dataParts.push(data);
        for (let i = 0; i < packet.subPackets.length; i++) {
          subData = packSOEPacket(
            packet.subPackets[i].name,
            packet.subPackets[i].soePacket,
            crcSeed,
            compression,
            true
          );
          dataParts.push(writeDataLength(subData.length), subData);
        }
        data = Buffer.concat(dataParts);
        data = appendCRC(data, crcSeed);
        return data;
      },
    },
  ],
  [
    "Disconnect",
    0x05,
    {
      parse: function (data: any) {
        return {};
      },
      pack: function () {
        const data = new (Buffer as any).alloc(2);
        data.writeUInt16BE(0x05, 0);
        return data;
      },
    },
  ],
  [
    "Ping",
    0x06,
    {
      parse: function (data: any) {
        return {};
      },
      pack: function () {
        const data = new (Buffer as any).alloc(2);
        data.writeUInt16BE(0x06, 0);
        return data;
      },
    },
  ],
  ["NetStatusRequest", 0x07, {}],
  ["NetStatusReply", 0x08, {}],
  [
    "Data",
    0x09,
    {
      parse: function (
        data: any,
        crcSeed: number,
        compression: number,
        isSubPacket: boolean,
        appData: any
      ) {
        const sequence = data.readUInt16BE(compression && !isSubPacket ? 3 : 2),
          dataEnd = data.length - (isSubPacket ? 0 : 2),
          crc = isSubPacket ? 0 : data.readUInt16BE(dataEnd);
        data = data.slice(compression && !isSubPacket ? 5 : 4, dataEnd);
        appData.push({
          sequence: sequence,
          data: data,
          fragment: false,
        });
        return {
          channel: 0,
          sequence: sequence,
          crc: crc,
          data: data,
        };
      },
      pack: function (
        packet: any,
        crcSeed: number,
        compression: number,
        isSubPacket: boolean
      ) {
        let data = new (Buffer as any).alloc(
            4 + (compression && !isSubPacket ? 1 : 0) + packet.data.length
          ),
          offset = 0;
        data.writeUInt16BE(0x09, offset);
        offset += 2;
        if (compression) {
          data.writeUInt8(0, offset);
          offset += 1;
        }
        data.writeUInt16BE(packet.sequence, offset);
        offset += 2;
        packet.data.copy(data, offset);
        if (!isSubPacket) {
          data = appendCRC(data, crcSeed);
        }
        return data;
      },
    },
  ],
  [
    "DataFragment",
    0x0d,
    {
      parse: function (
        data: any,
        crcSeed: number,
        compression: number,
        isSubPacket: boolean,
        appData: any
      ) {
        const sequence = data.readUInt16BE(compression && !isSubPacket ? 3 : 2),
          fragmentEnd = data.length - (isSubPacket ? 0 : 2),
          crc = isSubPacket ? 0 : data.readUInt16BE(fragmentEnd);
        data = data.slice(compression && !isSubPacket ? 5 : 4, fragmentEnd);
        appData.push({
          sequence: sequence,
          data: data,
          fragment: true,
        });
        return {
          channel: 0,
          sequence: sequence,
          crc: crc,
          data: data,
        };
      },
      pack: function (
        packet: any,
        crcSeed: number,
        compression: number,
        isSubPacket: boolean
      ) {
        let data = new (Buffer as any).alloc(
            4 + (compression && !isSubPacket ? 1 : 0) + packet.data.length
          ),
          offset = 0;
        data.writeUInt16BE(0x0d, offset);
        offset += 2;
        if (compression) {
          data.writeUInt8(0, offset);
          offset += 1;
        }
        data.writeUInt16BE(packet.sequence, offset);
        offset += 2;
        packet.data.copy(data, offset);
        if (!isSubPacket) {
          data = appendCRC(data, crcSeed);
        }
        return data;
      },
    },
  ],
  [
    "OutOfOrder",
    0x11,
    {
      parse: function (
        data: any,
        crcSeed: number,
        compression: number,
        isSubPacket: boolean
      ) {
        const sequence = data.readUInt16BE(
          2 + (compression && !isSubPacket ? 1 : 0)
        );
        return {
          channel: 0,
          sequence: sequence,
        };
      },
      pack: function (
        packet: any,
        crcSeed: number,
        compression: number,
        isSubPacket: boolean
      ) {
        let data = new (Buffer as any).alloc(
          4 + (compression && !isSubPacket ? 1 : 0)
        );
        let offset = 0;
        data.writeUInt16BE(0x11, offset);
        offset += 2;
        if (compression && !isSubPacket) {
          data.writeUInt8(0, offset);
          offset += 1;
        }
        data.writeUInt16BE(packet.sequence, offset);
        if (!isSubPacket) {
          data = appendCRC(data, crcSeed);
        }
        return data;
      },
    },
  ],
  [
    "Ack",
    0x15,
    {
      parse: function (
        data: any,
        crcSeed: number,
        compression: number,
        isSubPacket: boolean
      ) {
        const sequence = data.readUInt16BE(
          2 + (compression && !isSubPacket ? 1 : 0)
        );
        return {
          channel: 0,
          sequence: sequence,
        };
      },
      pack: function (
        packet: any,
        crcSeed: number,
        compression: number,
        isSubPacket: boolean
      ) {
        let data = new (Buffer as any).alloc(
            4 + (compression && !isSubPacket ? 1 : 0)
          ),
          offset = 0;
        data.writeUInt16BE(0x15, offset);
        offset += 2;
        if (compression && !isSubPacket) {
          data.writeUInt8(0, offset);
          offset += 1;
        }
        data.writeUInt16BE(packet.sequence, offset);
        if (!isSubPacket) {
          data = appendCRC(data, crcSeed);
        }
        return data;
      },
    },
  ],
  ["FatalError", 0x1d, {}],
  ["FatalErrorReply", 0x1e, {}],
];

const SOEPackets = {
  PacketTypes: {},
  Packets: {},
};

const StandAlonePackets = {
  PacketTypes: {},
  Packets: {},
};

PacketTable.build(packets, SOEPackets.PacketTypes, SOEPackets.Packets);
PacketTable.build(
  stand_alone_packets,
  StandAlonePackets.PacketTypes,
  StandAlonePackets.Packets
);

function packSOEPacket(
  packetName: string,
  object: any,
  crcSeed: number,
  compression: number,
  isSubPacket: boolean = false
) {
  let packetType = (SOEPackets as any).PacketTypes[packetName],
    packet = (SOEPackets as any).Packets[packetType],
    data;
  if (!packet) {
    // try if packet is a stand-alone packet
    packetType = (StandAlonePackets as any).PacketTypes[packetName];
    packet = (StandAlonePackets as any).Packets[packetType];
  }
  if (packet) {
    if (packet.pack) {
      data = packet.pack(object, crcSeed, compression, isSubPacket);
      debug("Packing data for " + packet.name);
    } else {
      debug("pack()", "No pack function for packet " + packet.name);
    }
  } else {
    debug("pack()", "Unknown or unhandled SOE packet type: " + packetType);
  }
  return data;
}

function parseSOEPacket(
  data: any,
  crcSeed: number,
  compression: number,
  isSubPacket: boolean,
  appData: any
) {
  const packetType = data.readUInt16BE(0);
  let result,
    packet = (SOEPackets as any).Packets[packetType];
  if (!packet) {
    // try with Int8 opcode
    packet = (StandAlonePackets as any).Packets[data.readUInt8(0)];
  }
  if (packet) {
    if (packet.parse) {
      //debug(packet.name);
      result = packet.parse(data, crcSeed, compression, isSubPacket, appData);
      return {
        type: packet.type,
        name: packet.name,
        result: result,
      };
    } else {
      debug("parse()", "No parser for packet " + packet.name);
    }
  } else {
    debug("parse()", "Unknown or unhandled SOE packet type: " + packetType);
    return {
      result: null,
    };
  }
}

function writeDataLength(length: number) {
  let data;
  if (length <= 0xff) {
    data = new (Buffer as any).alloc(1);
    data.writeUInt8(length, 0);
  } else if (length < 0xffff) {
    data = new (Buffer as any).alloc(3);
    data.writeUInt8(0xff, 0);
    data.writeUInt16BE(length, 1);
  } else {
    data = new (Buffer as any).alloc(7);
    data.writeUInt8(0xff, 0);
    data.writeUInt8(0xff, 1);
    data.writeUInt8(0xff, 2);
    data.writeUInt32BE(length, 3);
  }
  return data;
}

function readDataLength(data: any, offset: number) {
  let dataLength = data.readUInt8(offset),
    n;
  if (dataLength == 0xff) {
    if (data[offset + 1] == 0xff && data[offset + 2] == 0xff) {
      dataLength = data.readUInt32BE(offset + 3);
      n = 7;
    } else if (data[offset + 1] > 0) {
      dataLength = data.readUInt16BE(offset + 1);
      n = 3;
    } else {
      n = 1;
    }
  } else {
    n = 1;
  }
  return {
    value: dataLength,
    numBytes: n,
  };
}

class SOEProtocol {
  parse(data: any, crcSeed: number, compression: number) {
    const appData: Array<any> = [],
      packet = parseSOEPacket(data, crcSeed, compression, false, appData);
    return {
      soePacket: packet,
      appPackets: appData,
    };
  }

  pack(packetName: string, object: any, crcSeed: number, compression: number) {
    const data = packSOEPacket(packetName, object, crcSeed, compression, false);
    return data;
  }
}

exports.SOEProtocol = SOEProtocol as any;
exports.SOEPackets = SOEPackets as any;
