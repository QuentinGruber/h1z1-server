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
var debug = require("debug")("SOEProtocol");
var PacketTable = require("../packets/packettable");
var appendCRC = require('../utils/crc').appendCRC;
var stand_alone_packets = [
    [
        "ZonePing",
        0x1,
        {
            parse: function (data) {
                return {
                    PingId: data.readUInt16LE(1),
                    Data: data.toString("hex").substring(6),
                };
            },
            pack: function (data) {
                var packet = new Buffer.alloc(5);
                packet.writeUInt8(0x1, 0);
                packet.writeUInt16LE(data.PingId, 1);
                packet.write(data.Data, 3, "hex");
                return packet;
            },
        },
    ],
];
var packets = [
    [
        "SessionRequest",
        0x01,
        {
            parse: function (data, crcSeed, compression, isSubPacket) {
                var clientCRCLength = data.readUInt32BE(2);
                var clientSessionId = data.readUInt32BE(6);
                var clientUDPLength = data.readUInt32BE(10);
                var protocol = data.readNullTerminatedString(14);
                return {
                    crcLength: clientCRCLength,
                    sessionId: clientSessionId,
                    udpLength: clientUDPLength,
                    protocol: protocol,
                };
            },
            pack: function (packet, crcSeed, compression, isSubPacket, useCrc64) {
                var data = new Buffer.alloc(14 + packet.protocol.length + 1);
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
            parse: function (data, crcSeed, compression, isSubPacket) {
                var serverSessionId = data.readUInt32BE(2);
                var serverCrcSeed = data.readUInt32BE(6);
                var serverCRCLength = data.readUInt8(10);
                var serverCompression = data.readUInt16BE(11);
                var serverUDPLength = data.readUInt32BE(13);
                return {
                    crcSeed: serverCrcSeed,
                    crcLength: serverCRCLength,
                    sessionId: serverSessionId,
                    compression: serverCompression,
                    udpLength: serverUDPLength,
                };
            },
            pack: function (packet, crcSeed, compression, isSubPacket, useCrc64) {
                var data = new Buffer.alloc(21);
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
            parse: function (data, crcSeed, compression, isSubPacket, appData) {
                var offset = 2 + (compression ? 1 : 0), dataLength, subPackets = [];
                while (offset < data.length - 2) {
                    dataLength = readDataLength(data, offset);
                    offset += dataLength.numBytes;
                    subPackets.push(parseSOEPacket(data.slice(offset, offset + dataLength.value), crcSeed, compression, true, appData));
                    offset += dataLength.value;
                }
                return {
                    subPackets: subPackets,
                };
            },
            pack: function (packet, crcSeed, compression, isSubPacket, useCrc64) {
                var dataParts = [], subData, data = new Buffer.alloc(2 + (compression ? 1 : 0));
                data.writeUInt16BE(0x03, 0);
                if (compression) {
                    data.writeUInt8(0, 2);
                }
                dataParts.push(data);
                for (var i = 0; i < packet.subPackets.length; i++) {
                    subData = packSOEPacket(packet.subPackets[i].name, packet.subPackets[i].soePacket, crcSeed, compression, true);
                    dataParts.push(writeDataLength(subData.length), subData);
                }
                data = Buffer.concat(dataParts);
                data = appendCRC(data, crcSeed, useCrc64);
                return data;
            },
        },
    ],
    [
        "Disconnect",
        0x05,
        {
            parse: function (data) {
                return {};
            },
            pack: function () {
                var data = new Buffer.alloc(2);
                data.writeUInt16BE(0x05, 0);
                return data;
            },
        },
    ],
    [
        "Ping",
        0x06,
        {
            parse: function (data) {
                return {};
            },
            pack: function () {
                var data = new Buffer.alloc(2);
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
            parse: function (data, crcSeed, compression, isSubPacket, appData) {
                var sequence = data.readUInt16BE(compression && !isSubPacket ? 3 : 2), dataEnd = data.length - (isSubPacket ? 0 : 2), crc = isSubPacket ? 0 : data.readUInt16BE(dataEnd);
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
            pack: function (packet, crcSeed, compression, isSubPacket, useCrc64) {
                var data = new Buffer.alloc(4 + (compression && !isSubPacket ? 1 : 0) + packet.data.length), offset = 0;
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
                    data = appendCRC(data, crcSeed, useCrc64);
                }
                return data;
            },
        },
    ],
    [
        "DataFragment",
        0x0d,
        {
            parse: function (data, crcSeed, compression, isSubPacket, appData) {
                var sequence = data.readUInt16BE(compression && !isSubPacket ? 3 : 2), fragmentEnd = data.length - (isSubPacket ? 0 : 2), crc = isSubPacket ? 0 : data.readUInt16BE(fragmentEnd);
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
            pack: function (packet, crcSeed, compression, isSubPacket, useCrc64) {
                var data = new Buffer.alloc(4 + (compression && !isSubPacket ? 1 : 0) + packet.data.length), offset = 0;
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
                    data = appendCRC(data, crcSeed, useCrc64);
                }
                return data;
            },
        },
    ],
    [
        "OutOfOrder",
        0x11,
        {
            parse: function (data, crcSeed, compression, isSubPacket) {
                var sequence = data.readUInt16BE(2 + (compression && !isSubPacket ? 1 : 0));
                return {
                    channel: 0,
                    sequence: sequence,
                };
            },
            pack: function (packet, crcSeed, compression, isSubPacket, useCrc64) {
                var data = new Buffer.alloc(4 + (compression && !isSubPacket ? 1 : 0));
                var offset = 0;
                data.writeUInt16BE(0x11, offset);
                offset += 2;
                if (compression && !isSubPacket) {
                    data.writeUInt8(0, offset);
                    offset += 1;
                }
                data.writeUInt16BE(packet.sequence, offset);
                if (!isSubPacket) {
                    data = appendCRC(data, crcSeed, useCrc64);
                }
                return data;
            },
        },
    ],
    [
        "Ack",
        0x15,
        {
            parse: function (data, crcSeed, compression, isSubPacket) {
                var sequence = data.readUInt16BE(2 + (compression && !isSubPacket ? 1 : 0));
                return {
                    channel: 0,
                    sequence: sequence,
                };
            },
            pack: function (packet, crcSeed, compression, isSubPacket, useCrc64) {
                var data = new Buffer.alloc(4 + (compression && !isSubPacket ? 1 : 0)), offset = 0;
                data.writeUInt16BE(0x15, offset);
                offset += 2;
                if (compression && !isSubPacket) {
                    data.writeUInt8(0, offset);
                    offset += 1;
                }
                data.writeUInt16BE(packet.sequence, offset);
                if (!isSubPacket) {
                    data = appendCRC(data, crcSeed, useCrc64);
                }
                return data;
            },
        },
    ],
    ["FatalError", 0x1d, {}],
    ["FatalErrorReply", 0x1e, {}],
];
var SOEPackets = {
    PacketTypes: {},
    Packets: {},
};
var StandAlonePackets = {
    PacketTypes: {},
    Packets: {},
};
PacketTable.build(packets, SOEPackets.PacketTypes, SOEPackets.Packets);
PacketTable.build(stand_alone_packets, StandAlonePackets.PacketTypes, StandAlonePackets.Packets);
function packSOEPacket(packetName, object, crcSeed, compression, isSubPacket, useCrc64) {
    if (isSubPacket === void 0) { isSubPacket = false; }
    if (useCrc64 === void 0) { useCrc64 = false; }
    var packetType = SOEPackets.PacketTypes[packetName], packet = SOEPackets.Packets[packetType], data;
    if (!packet) {
        // try if packet is a stand-alone packet
        packetType = StandAlonePackets.PacketTypes[packetName];
        packet = StandAlonePackets.Packets[packetType];
    }
    if (packet) {
        if (packet.pack) {
            data = packet.pack(object, crcSeed, compression, isSubPacket, useCrc64);
            debug("Packing data for " + packet.name);
        }
        else {
            debug("pack()", "No pack function for packet " + packet.name);
        }
    }
    else {
        debug("pack()", "Unknown or unhandled SOE packet type: " + packetType);
    }
    return data;
}
function parseSOEPacket(data, crcSeed, compression, isSubPacket, appData) {
    var packetType = data.readUInt16BE(0), result, packet = SOEPackets.Packets[packetType];
    if (!packet) {
        // try with Int8 opcode
        packet = StandAlonePackets.Packets[data.readUInt8(0)];
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
        }
        else {
            debug("parse()", "No parser for packet " + packet.name);
        }
    }
    else {
        debug("parse()", "Unknown or unhandled SOE packet type: " + packetType);
        return {
            result: null,
        };
    }
}
function writeDataLength(length) {
    var data;
    if (length <= 0xff) {
        data = new Buffer.alloc(1);
        data.writeUInt8(length, 0);
    }
    else if (length < 0xffff) {
        data = new Buffer.alloc(3);
        data.writeUInt8(0xff, 0);
        data.writeUInt16BE(length, 1);
    }
    else {
        data = new Buffer.alloc(7);
        data.writeUInt8(0xff, 0);
        data.writeUInt8(0xff, 1);
        data.writeUInt8(0xff, 2);
        data.writeUInt32BE(length, 3);
    }
    return data;
}
function readDataLength(data, offset) {
    var dataLength = data.readUInt8(offset), n;
    if (dataLength == 0xff) {
        if (data[offset + 1] == 0xff && data[offset + 2] == 0xff) {
            dataLength = data.readUInt32BE(offset + 3);
            n = 7;
        }
        else if (data[offset + 1] > 0) {
            dataLength = data.readUInt16BE(offset + 1);
            n = 3;
        }
        else {
            n = 1;
        }
    }
    else {
        n = 1;
    }
    return {
        value: dataLength,
        numBytes: n,
    };
}
var SOEProtocol = /** @class */ (function () {
    function SOEProtocol(useCrc64) {
        if (useCrc64 === void 0) { useCrc64 = false; }
        this.useCrc64 = useCrc64;
    }
    SOEProtocol.prototype.parse = function (data, crcSeed, compression) {
        var appData = [], packet = parseSOEPacket(data, crcSeed, compression, false, appData);
        return {
            soePacket: packet,
            appPackets: appData,
        };
    };
    ;
    SOEProtocol.prototype.pack = function (packetName, object, crcSeed, compression) {
        var data = packSOEPacket(packetName, object, crcSeed, compression, false, this.useCrc64);
        return data;
    };
    ;
    return SOEProtocol;
}());
exports.SOEProtocol = SOEProtocol;
exports.SOEPackets = SOEPackets;
