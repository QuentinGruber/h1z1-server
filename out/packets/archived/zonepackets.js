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
var PacketTable = require("../packettable"), DataSchema = require("h1z1-dataschema");
function readPacketType(data, packets) {
    var opCode = data[0] >>> 0, length = 0, packet;
    if (packets[opCode]) {
        packet = packets[opCode];
        length = 1;
    }
    else if (data.length > 1) {
        opCode = ((data[0] << 8) + data[1]) >>> 0;
        if (packets[opCode]) {
            packet = packets[opCode];
            length = 2;
        }
        else if (data.length > 2) {
            opCode = ((data[0] << 16) + (data[1] << 8) + data[2]) >>> 0;
            if (packets[opCode]) {
                packet = packets[opCode];
                length = 3;
            }
            else if (data.length > 3) {
                opCode =
                    ((data[0] << 24) + (data[1] << 16) + (data[2] << 8) + data[3]) >>> 0;
                if (packets[opCode]) {
                    packet = packets[opCode];
                    length = 4;
                }
            }
        }
    }
    return {
        packetType: opCode,
        packet: packet,
        length: length,
    };
}
function writePacketType(packetType) {
    var packetTypeBytes = [];
    while (packetType) {
        packetTypeBytes.unshift(packetType & 0xff);
        packetType = packetType >> 8;
    }
    var data = new Buffer.alloc(packetTypeBytes.length);
    for (var i = 0; i < packetTypeBytes.length; i++) {
        data.writeUInt8(packetTypeBytes[i], i);
    }
    return data;
}
function readUnsignedIntWith2bitLengthValue(data, offset) {
    var value = data.readUInt8(offset);
    var n = value & 3;
    for (var i = 0; i < n; i++) {
        value += data.readUInt8(offset + i + 1) << ((i + 1) * 8);
    }
    value = value >>> 2;
    return {
        value: value,
        length: n + 1,
    };
}
function packUnsignedIntWith2bitLengthValue(value) {
    value = Math.round(value);
    value = value << 2;
    var n = 0;
    if (value > 0xffffff) {
        n = 3;
    }
    else if (value > 0xffff) {
        n = 2;
    }
    else if (value > 0xff) {
        n = 1;
    }
    value |= n;
    var data = new Buffer.alloc(4);
    data.writeUInt32LE(value, 0);
    return data.slice(0, n + 1);
}
function readSignedIntWith2bitLengthValue(data, offset) {
    var value = data.readUInt8(offset);
    var sign = value & 1;
    var n = (value >> 1) & 3;
    for (var i = 0; i < n; i++) {
        value += data.readUInt8(offset + i + 1) << ((i + 1) * 8);
    }
    value = value >>> 3;
    if (sign) {
        value = -value;
    }
    return {
        value: value,
        length: n + 1,
    };
}
function packSignedIntWith2bitLengthValue(value) {
    value = Math.round(value);
    var sign = value < 0 ? 1 : 0;
    value = sign ? -value : value;
    value = value << 3;
    var n = 0;
    if (value > 0xffffff) {
        n = 3;
    }
    else if (value > 0xffff) {
        n = 2;
    }
    else if (value > 0xff) {
        n = 1;
    }
    value |= n << 1;
    value |= sign;
    var data = new Buffer.alloc(4);
    data.writeUInt32LE(value, 0);
    return data.slice(0, n + 1);
}
function readPositionUpdateData(data, offset) {
    var obj = {}, startOffset = offset;
    obj["flags"] = data.readUInt16LE(offset);
    offset += 2;
    obj["unknown2_int32"] = data.readUInt32LE(offset);
    offset += 4;
    obj["unknown3_int8"] = data.readUInt8(offset);
    offset += 1;
    if (obj.flags & 1) {
        var v = readUnsignedIntWith2bitLengthValue(data, offset);
        obj["unknown4"] = v.value;
        offset += v.length;
    }
    if (obj.flags & 2) {
        obj["position"] = [];
        var v = readSignedIntWith2bitLengthValue(data, offset);
        obj["position"][0] = v.value / 100;
        offset += v.length;
        var v = readSignedIntWith2bitLengthValue(data, offset);
        obj["position"][1] = v.value / 100;
        offset += v.length;
        var v = readSignedIntWith2bitLengthValue(data, offset);
        obj["position"][2] = v.value / 100;
        offset += v.length;
    }
    if (obj.flags & 0x20) {
        obj["unknown6_int32"] = data.readUInt32LE(offset);
        offset += 4;
    }
    if (obj.flags & 0x40) {
        var v = readSignedIntWith2bitLengthValue(data, offset);
        obj["unknown7_float"] = v.value / 100;
        offset += v.length;
    }
    if (obj.flags & 0x80) {
        var v = readSignedIntWith2bitLengthValue(data, offset);
        obj["unknown8_float"] = v.value / 100;
        offset += v.length;
    }
    if (obj.flags & 4) {
        var v = readSignedIntWith2bitLengthValue(data, offset);
        obj["unknown9_float"] = v.value / 100;
        offset += v.length;
    }
    if (obj.flags & 0x8) {
        var v = readSignedIntWith2bitLengthValue(data, offset);
        obj["unknown10_float"] = v.value / 100;
        offset += v.length;
    }
    if (obj.flags & 0x10) {
        var v = readSignedIntWith2bitLengthValue(data, offset);
        obj["unknown11_float"] = v.value / 10;
        offset += v.length;
    }
    if (obj.flags & 0x100) {
        obj["unknown12_float"] = [];
        var v = readSignedIntWith2bitLengthValue(data, offset);
        obj["unknown12_float"][0] = v.value / 100;
        offset += v.length;
        var v = readSignedIntWith2bitLengthValue(data, offset);
        obj["unknown12_float"][1] = v.value / 100;
        offset += v.length;
        var v = readSignedIntWith2bitLengthValue(data, offset);
        obj["unknown12_float"][2] = v.value / 100;
        offset += v.length;
    }
    if (obj.flags & 0x200) {
        obj["unknown13_float"] = [];
        var v = readSignedIntWith2bitLengthValue(data, offset);
        obj["unknown13_float"][0] = v.value / 100;
        offset += v.length;
        var v = readSignedIntWith2bitLengthValue(data, offset);
        obj["unknown13_float"][1] = v.value / 100;
        offset += v.length;
        var v = readSignedIntWith2bitLengthValue(data, offset);
        obj["unknown13_float"][2] = v.value / 100;
        offset += v.length;
        var v = readSignedIntWith2bitLengthValue(data, offset);
        obj["unknown13_float"][3] = v.value / 100;
        offset += v.length;
    }
    if (obj.flags & 0x400) {
        var v = readSignedIntWith2bitLengthValue(data, offset);
        obj["unknown14_float"] = v.value / 10;
        offset += v.length;
    }
    if (obj.flags & 0x800) {
        var v = readSignedIntWith2bitLengthValue(data, offset);
        obj["unknown15_float"] = v.value / 10;
        offset += v.length;
    }
    if (obj.flags & 0xe0) {
    }
    return {
        value: obj,
        length: offset - startOffset,
    };
}
function packPositionUpdateData(obj) {
    var data = new Buffer.alloc(7), flags = 0, v;
    data.writeUInt32LE(obj["unknown2_int32"], 2);
    data.writeUInt8(obj["unknown3_int8"], 6);
    if ("unknown4" in obj) {
        flags |= 1;
        v = packUnsignedIntWith2bitLengthValue(obj["unknown4"]);
        data = Buffer.concat([data, v]);
    }
    if ("position" in obj) {
        flags |= 2;
        v = packSignedIntWith2bitLengthValue(obj["position"][0] * 100);
        data = Buffer.concat([data, v]);
        v = packSignedIntWith2bitLengthValue(obj["position"][1] * 100);
        data = Buffer.concat([data, v]);
        v = packSignedIntWith2bitLengthValue(obj["position"][2] * 100);
        data = Buffer.concat([data, v]);
    }
    if ("unknown6_int32" in obj) {
        flags |= 0x20;
        v = new Buffer.alloc(4);
        v.writeUInt32LE(obj["unknown6_int32"], 0);
        data = Buffer.concat([data, v]);
    }
    if ("unknown7_float" in obj) {
        flags |= 0x40;
        v = packSignedIntWith2bitLengthValue(obj["unknown7_float"] * 100);
        data = Buffer.concat([data, v]);
    }
    if ("unknown8_float" in obj) {
        flags |= 0x80;
        v = packSignedIntWith2bitLengthValue(obj["unknown8_float"] * 100);
        data = Buffer.concat([data, v]);
    }
    if ("unknown9_float" in obj) {
        flags |= 4;
        v = packSignedIntWith2bitLengthValue(obj["unknown9_float"] * 100);
        data = Buffer.concat([data, v]);
    }
    if ("unknown10_float" in obj) {
        flags |= 8;
        v = packSignedIntWith2bitLengthValue(obj["unknown10_float"] * 100);
        data = Buffer.concat([data, v]);
    }
    if ("unknown11_float" in obj) {
        flags |= 0x10;
        v = packSignedIntWith2bitLengthValue(obj["unknown11_float"] * 10);
        data = Buffer.concat([data, v]);
    }
    if ("unknown12_float" in obj) {
        flags |= 0x100;
        v = packSignedIntWith2bitLengthValue(obj["unknown12_float"][0] * 100);
        data = Buffer.concat([data, v]);
        v = packSignedIntWith2bitLengthValue(obj["unknown12_float"][1] * 100);
        data = Buffer.concat([data, v]);
        v = packSignedIntWith2bitLengthValue(obj["unknown12_float"][2] * 100);
        data = Buffer.concat([data, v]);
    }
    if ("unknown13_float" in obj) {
        flags |= 0x200;
        v = packSignedIntWith2bitLengthValue(obj["unknown13_float"][0] * 100);
        data = Buffer.concat([data, v]);
        v = packSignedIntWith2bitLengthValue(obj["unknown13_float"][1] * 100);
        data = Buffer.concat([data, v]);
        v = packSignedIntWith2bitLengthValue(obj["unknown13_float"][2] * 100);
        data = Buffer.concat([data, v]);
        v = packSignedIntWith2bitLengthValue(obj["unknown13_float"][3] * 100);
        data = Buffer.concat([data, v]);
    }
    if ("unknown14_float" in obj) {
        flags |= 0x400;
        v = packSignedIntWith2bitLengthValue(obj["unknown14_float"] * 10);
        data = Buffer.concat([data, v]);
    }
    if ("unknown15_float" in obj) {
        flags |= 0x800;
        v = packSignedIntWith2bitLengthValue(obj["unknown15_float"] * 10);
        data = Buffer.concat([data, v]);
    }
    data.writeUInt16LE(flags, 0);
    return data;
}
function lz4_decompress(data, inSize, outSize) {
    var outdata = new Buffer.alloc(outSize), token, literalLength, matchLength, matchOffset, matchStart, matchEnd, offsetIn = 0, offsetOut = 0;
    while (1) {
        var token = data[offsetIn];
        var literalLength = token >> 4;
        var matchLength = token & 0xf;
        offsetIn++;
        if (literalLength) {
            if (literalLength == 0xf) {
                while (data[offsetIn] == 0xff) {
                    literalLength += 0xff;
                    offsetIn++;
                }
                literalLength += data[offsetIn];
                offsetIn++;
            }
            data.copy(outdata, offsetOut, offsetIn, offsetIn + literalLength);
            offsetIn += literalLength;
            offsetOut += literalLength;
        }
        if (offsetIn < data.length - 2) {
            var matchOffset = data.readUInt16LE(offsetIn);
            offsetIn += 2;
            if (matchLength == 0xf) {
                while (data[offsetIn] == 0xff) {
                    matchLength += 0xff;
                    offsetIn++;
                }
                matchLength += data[offsetIn];
                offsetIn++;
            }
            matchLength += 4;
            var matchStart = offsetOut - matchOffset, matchEnd = offsetOut - matchOffset + matchLength;
            for (var i = matchStart; i < matchEnd; i++) {
                outdata[offsetOut] = outdata[i];
                offsetOut++;
            }
        }
        else {
            break;
        }
    }
    return outdata;
}
var vehicleReferenceDataSchema = [
    {
        name: "move_info",
        type: "array",
        fields: [
            { name: "id", type: "uint32" },
            {
                name: "data",
                type: "schema",
                fields: [
                    { name: "id", type: "uint32" },
                    { name: "unknownByte1", type: "uint8" },
                    { name: "unknownByte2", type: "uint8" },
                    { name: "unknownDword2", type: "uint32" },
                    { name: "unknownByte3", type: "uint8" },
                    { name: "unknownFloat1", type: "float" },
                    { name: "unknownFloat2", type: "float" },
                    { name: "max_forward", type: "float" },
                    { name: "max_reverse", type: "float" },
                    { name: "max_dive", type: "float" },
                    { name: "max_rise", type: "float" },
                    { name: "max_strafe", type: "float" },
                    { name: "accel_forward", type: "float" },
                    { name: "accel_reverse", type: "float" },
                    { name: "accel_dive", type: "float" },
                    { name: "accel_rise", type: "float" },
                    { name: "accel_strafe", type: "float" },
                    { name: "brake_forward", type: "float" },
                    { name: "brake_reverse", type: "float" },
                    { name: "brake_dive", type: "float" },
                    { name: "brake_rise", type: "float" },
                    { name: "brake_strafe", type: "float" },
                    { name: "move_pitch_rate", type: "float" },
                    { name: "move_yaw_rate", type: "float" },
                    { name: "move_roll_rate", type: "float" },
                    { name: "still_pitch_rate", type: "float" },
                    { name: "still_yaw_rate", type: "float" },
                    { name: "still_roll_rate", type: "float" },
                    { name: "unknownDword3", type: "uint32" },
                    { name: "unknownDword4", type: "uint32" },
                    { name: "landing_gear_height", type: "uint32" },
                    { name: "vehicle_archetype", type: "uint8" },
                    { name: "movement_mode", type: "uint8" },
                    { name: "change_mode_speed_percent", type: "float" },
                    { name: "unknownFloat25", type: "float" },
                    { name: "unknownFloat26", type: "float" },
                    { name: "min_traction", type: "float" },
                    { name: "linear_redirect", type: "float" },
                    { name: "linear_dampening", type: "float" },
                    { name: "hover_power", type: "float" },
                    { name: "hover_length", type: "float" },
                    { name: "unknownFloat32", type: "float" },
                    { name: "unknownFloat33", type: "float" },
                    { name: "unknownFloat34", type: "float" },
                    { name: "unknownFloat35", type: "float" },
                    { name: "unknownFloat36", type: "float" },
                    { name: "dead_zone_size", type: "float" },
                    { name: "dead_zone_rate", type: "float" },
                    { name: "dead_zone_sensitivity", type: "float" },
                    { name: "unknownFloat40", type: "float" },
                    { name: "unknownFloat41", type: "float" },
                    { name: "auto_level_roll_rate", type: "float" },
                    { name: "camera_shake_intensity", type: "float" },
                    { name: "camera_shake_speed", type: "float" },
                    { name: "camera_shake_change_speed", type: "float" },
                    { name: "unknownFloat46", type: "float" },
                    { name: "inward_yaw_mod", type: "float" },
                    { name: "unknownFloat48", type: "float" },
                    { name: "vehicle_strafe_lift", type: "float" },
                    { name: "dead_zone_influence_exponent", type: "float" },
                    { name: "camera_shake_initial_intensity", type: "float" },
                    { name: "unknownFloat52", type: "float" },
                    { name: "dampening", type: "floatvector3" },
                    { name: "unknownFloat53", type: "float" },
                    { name: "unknownFloat54", type: "float" },
                    { name: "sprint_lift_sub", type: "float" },
                    { name: "sprint_lift_factor", type: "float" },
                    { name: "lift_factor", type: "float" },
                    { name: "unknownFloat58", type: "float" },
                    { name: "steer_burst_factor", type: "floatvector3" },
                    { name: "steer_burst_speed", type: "float" },
                    { name: "steer_factor", type: "float" },
                    { name: "steer_exponent", type: "float" },
                    { name: "steer_spin_factor", type: "float" },
                    { name: "steer_spin_exponent", type: "float" },
                    { name: "steer_lean_factor", type: "float" },
                    { name: "steer_lean_turn_factor", type: "float" },
                    { name: "steer_compensate_factor", type: "float" },
                    { name: "unknownFloat67", type: "float" },
                    { name: "unknownFloat68", type: "float" },
                    { name: "angular_dampening_scalar", type: "float" },
                    { name: "angular_dampening", type: "floatvector3" },
                    { name: "estimated_max_speed", type: "uint32" },
                    { name: "hill_climb", type: "float" },
                    { name: "hill_climb_decay_range", type: "float" },
                    { name: "hill_climb_min_power", type: "float" },
                    { name: "unknownFloat73", type: "float" },
                    { name: "unknownDword7", type: "uint32" },
                    { name: "unknownDword8", type: "uint32" },
                    { name: "unknownDword9", type: "uint32" },
                    { name: "unknownDword10", type: "uint32" },
                    { name: "unknownDword11", type: "uint32" },
                    { name: "unknownDword12", type: "uint32" },
                    { name: "unknownDword13", type: "uint32" },
                    { name: "unknownDword14", type: "uint32" },
                    { name: "unknownDword15", type: "uint32" },
                    { name: "unknownDword16", type: "uint32" },
                    { name: "unknownDword17", type: "uint32" },
                    { name: "wake_effect", type: "uint32" },
                    { name: "debris_effect", type: "uint32" },
                ],
            },
        ],
    },
    {
        name: "dynamics_info",
        type: "array",
        fields: [
            { name: "id", type: "uint32" },
            {
                name: "data",
                type: "schema",
                fields: [
                    { name: "id", type: "uint32" },
                    { name: "max_velocity", type: "float" },
                    { name: "turn_torque", type: "float" },
                    { name: "turn_rate", type: "float" },
                    { name: "center_of_gravity_y", type: "float" },
                ],
            },
        ],
    },
    {
        name: "engine_info",
        type: "array",
        fields: [
            { name: "id", type: "uint32" },
            {
                name: "data",
                type: "schema",
                fields: [
                    { name: "id", type: "uint32" },
                    { name: "peak_torque", type: "float" },
                    { name: "torque_curve_y", type: "float" },
                    { name: "engaged_clutch_damp", type: "float" },
                    { name: "disengaged_clutch_damp", type: "float" },
                    { name: "clutch_strength", type: "float" },
                    { name: "reverse_gear", type: "float" },
                    { name: "first_gear", type: "float" },
                    { name: "second_gear", type: "float" },
                    { name: "third_gear", type: "float" },
                    { name: "fourth_gear", type: "float" },
                    { name: "switch_gear_time", type: "float" },
                ],
            },
        ],
    },
    {
        name: "suspension_info",
        type: "array",
        fields: [
            { name: "id", type: "uint32" },
            {
                name: "data",
                type: "schema",
                fields: [
                    { name: "id", type: "uint32" },
                    { name: "spring_frequency", type: "float" },
                    { name: "spring_damper_ratio", type: "float" },
                    {
                        name: "hashes",
                        type: "array",
                        fields: [
                            { name: "hash_1", type: "uint32" },
                            { name: "hash_2", type: "uint32" },
                        ],
                    },
                ],
            },
        ],
    },
    {
        name: "vehicle_model_mappings",
        type: "array",
        fields: [
            { name: "vehicle_id", type: "uint32" },
            { name: "model_id", type: "uint32" },
        ],
    },
    {
        name: "wheel_info",
        type: "array",
        fields: [
            { name: "id", type: "uint32" },
            {
                name: "data",
                type: "schema",
                fields: [
                    { name: "id", type: "uint32" },
                    { name: "max_brake", type: "float" },
                    { name: "max_hand_brake", type: "float" },
                    { name: "max_steer", type: "float" },
                    {
                        name: "hashes",
                        type: "array",
                        fields: [
                            { name: "hash_1", type: "uint32" },
                            { name: "hash_2", type: "uint32" },
                        ],
                    },
                ],
            },
        ],
    },
    {
        name: "tire_info",
        type: "array",
        fields: [
            { name: "id", type: "uint32" },
            {
                name: "data",
                type: "schema",
                fields: [
                    { name: "id", type: "uint32" },
                    { name: "long_stiff", type: "float" },
                    { name: "tire_second", type: "float" },
                    {
                        name: "hashes",
                        type: "array",
                        fields: [
                            { name: "hash_1", type: "uint32" },
                            { name: "hash_2", type: "uint32" },
                        ],
                    },
                ],
            },
        ],
    },
    {
        name: "vehicle_move_info_mappings",
        type: "array",
        fields: [
            { name: "vehicle_id", type: "uint32" },
            { name: "move_info", type: "array", elementType: "uint32" },
        ],
    },
];
function parseVehicleReferenceData(data, offset) {
    var dataLength = data.readUInt32LE(offset);
    offset += 4;
    data = data.slice(offset, offset + dataLength);
    var inSize = data.readUInt32LE(0), outSize = data.readUInt32LE(4), compData = data.slice(8);
    data = lz4_decompress(compData, inSize, outSize);
    var result = DataSchema.parse(vehicleReferenceDataSchema, data, 0).result;
    return {
        value: result,
        length: dataLength + 4,
    };
}
function packVehicleReferenceData(obj) {
    var data = DataSchema.pack(vehicleReferenceDataSchema, obj);
    return data;
}
function parseItemAddData(data, offset, referenceData) {
    var itemDataLength = data.readUInt32LE(offset);
    offset += 4;
    var itemData = data.slice(offset, offset + itemDataLength);
    var inSize = itemData.readUInt16LE(0), outSize = itemData.readUInt16LE(2), compData = itemData.slice(4, 4 + inSize), decompData = lz4_decompress(compData, inSize, outSize), itemDefinition = DataSchema.parse(baseItemDefinitionSchema, decompData, 0)
        .result;
    var itemData = parseItemData(itemData, 4 + inSize, referenceData).value;
    return {
        value: {
            itemDefinition: itemDefinition,
            itemData: itemData,
        },
        length: itemDataLength + 4,
    };
}
function packItemAddData(obj) { }
function parseItemDefinitions(data, offset) {
    var itemDataLength = data.readUInt32LE(offset);
    offset += 4;
    var itemData = data.slice(offset, offset + itemDataLength);
    var itemDefinitions = [], item, n = itemData.readUInt32LE(0), itemDataOffset = 4;
    for (var i = 0; i < n; i++) {
        var blockSize = itemData.readUInt16LE(itemDataOffset), blockSizeOut = itemData.readUInt16LE(itemDataOffset + 2), blockData = itemData.slice(itemDataOffset + 4, itemDataOffset + 4 + blockSize), itemDefinitionData = lz4_decompress(blockData, blockSize, blockSizeOut);
        itemDataOffset += 4 + blockSize;
        itemDefinitions.push(DataSchema.parse(baseItemDefinitionSchema, itemDefinitionData, 0).result);
    }
    // var str = "";
    // for (var a in itemDefinitions[0]) {
    //     if (a == "flags1" || a == "flags2") {
    //         for (var j in itemDefinitions[0][a]) {
    //             str += a + "_" + j + "\t";
    //         }
    //     } else {
    //         str += a + "\t";
    //     }
    // }
    // str += "\n";
    // for (var i=0;i<itemDefinitions.length;i++) {
    //     for (var a in itemDefinitions[i]) {
    //         if (a == "flags1" || a == "flags2") {
    //             for (var j in itemDefinitions[i][a]) {
    //                 str += +itemDefinitions[i][a][j] + "\t";
    //             }
    //         } else {
    //             str += itemDefinitions[i][a] + "\t";
    //         }
    //     }
    //     str += "\n";
    // }
    // require("fs").writeFileSync("debug/itemDefinitions.txt", str);
    return {
        value: itemDefinitions,
        length: itemDataLength + 4,
    };
}
function packItemDefinitions(obj) { }
var profileDataSchema = [
    { name: "profileId", type: "uint32" },
    { name: "nameId", type: "uint32" },
    { name: "descriptionId", type: "uint32" },
    { name: "type", type: "uint32" },
    { name: "iconId", type: "uint32" },
    { name: "unknownDword6", type: "uint32" },
    { name: "unknownDword7", type: "uint32" },
    { name: "unknownDword8", type: "uint32" },
    { name: "unknownBoolean1", type: "boolean" },
    { name: "unknownDword9", type: "uint32" },
    {
        name: "unknownArray1",
        type: "array",
        fields: [
            { name: "unknownDword1", type: "uint32" },
            { name: "unknownDword2", type: "uint32" },
            { name: "unknownDword3", type: "uint32" },
        ],
    },
    { name: "unknownBoolean2", type: "boolean" },
    { name: "unknownDword10", type: "uint32" },
    { name: "unknownDword11", type: "uint32" },
    { name: "unknownBoolean3", type: "boolean" },
    { name: "unknownByte1", type: "uint8" },
    { name: "unknownBoolean4", type: "boolean" },
    { name: "unknownBoolean5", type: "boolean" },
    { name: "unknownFloat1", type: "float" },
    { name: "unknownFloat2", type: "float" },
    { name: "unknownFloat3", type: "float" },
    { name: "unknownFloat4", type: "float" },
    { name: "unknownDword13", type: "uint32" },
    { name: "unknownFloat5", type: "float" },
    { name: "unknownDword14", type: "uint32" },
    { name: "unknownDword15", type: "uint32" },
    { name: "unknownDword16", type: "uint32" },
    { name: "unknownDword17", type: "uint32" },
    { name: "unknownDword18", type: "uint32" },
    { name: "unknownDword19", type: "uint32" },
];
var baseItemDefinitionSchema = [
    { name: "itemId", type: "uint32" },
    {
        name: "flags1",
        type: "bitflags",
        flags: [
            { bit: 0, name: "bit0" },
            { bit: 1, name: "forceDisablePreview" },
            { bit: 2, name: "bit2" },
            { bit: 3, name: "bit3" },
            { bit: 4, name: "bit4" },
            { bit: 5, name: "bit5" },
            { bit: 6, name: "bit6" },
            { bit: 7, name: "noTrade" },
        ],
    },
    {
        name: "flags2",
        type: "bitflags",
        flags: [
            { bit: 0, name: "bit0" },
            { bit: 1, name: "bit1" },
            { bit: 2, name: "bit2" },
            { bit: 3, name: "accountScope" },
            { bit: 4, name: "canEquip" },
            { bit: 5, name: "removeOnUse" },
            { bit: 6, name: "consumeOnUse" },
            { bit: 7, name: "quickUse" },
        ],
    },
    { name: "flags3", type: "uint8" },
    { name: "nameId", type: "uint32" },
    { name: "descriptionId", type: "uint32" },
    { name: "contentId", type: "uint32" },
    { name: "imageSetId", type: "uint32" },
    { name: "unknown4", type: "uint32" },
    { name: "hudImageSetId", type: "uint32" },
    { name: "unknown6", type: "uint32" },
    { name: "unknown7", type: "uint32" },
    { name: "cost", type: "uint32" },
    { name: "itemClass", type: "uint32" },
    { name: "profileOverride", type: "uint32" },
    { name: "slot", type: "uint32" },
    { name: "unknownDword1", type: "uint32" },
    { name: "modelName", type: "string" },
    { name: "textureAlias", type: "string" },
    { name: "unknown13", type: "uint8" },
    { name: "unknown14", type: "uint32" },
    { name: "categoryId", type: "uint32" },
    { name: "unknown16", type: "uint32" },
    { name: "unknown17", type: "uint32" },
    { name: "unknown18", type: "uint32" },
    { name: "minProfileRank", type: "uint32" },
    { name: "unknown19", type: "uint32" },
    { name: "activatableAbililtyId", type: "uint32" },
    { name: "passiveAbilityId", type: "uint32" },
    { name: "passiveAbilitySetId", type: "uint32" },
    { name: "maxStackable", type: "uint32" },
    { name: "tintAlias", type: "string" },
    { name: "unknown23", type: "uint32" },
    { name: "unknown24", type: "uint32" },
    { name: "unknown25", type: "uint32" },
    { name: "unknown26", type: "uint32" },
    { name: "uiModelCameraId", type: "uint32" },
    { name: "equipCountMax", type: "uint32" },
    { name: "currencyType", type: "uint32" },
    { name: "dataSheetId", type: "uint32" },
    { name: "itemType", type: "uint32" },
    { name: "skillSetId", type: "uint32" },
    { name: "overlayTexture", type: "string" },
    { name: "decalSlot", type: "string" },
    { name: "overlayAdjustment", type: "uint32" },
    { name: "trialDurationSec", type: "uint32" },
    { name: "nextTrialDelaySec", type: "uint32" },
    { name: "clientUseRequirementId", type: "uint32" },
    { name: "overrideAppearance", type: "string" },
    { name: "unknown35", type: "uint32" },
    { name: "unknown36", type: "uint32" },
    { name: "param1", type: "uint32" },
    { name: "param2", type: "uint32" },
    { name: "param3", type: "uint32" },
    { name: "uiModelCameraId2", type: "uint32" },
    { name: "unknown41", type: "uint32" },
];
var lightWeightNpcSchema = [
    { name: "guid", type: "uint64" },
    {
        name: "transientId",
        type: "custom",
        parser: readUnsignedIntWith2bitLengthValue,
        packer: packUnsignedIntWith2bitLengthValue,
    },
    { name: "unknownString0", type: "string", defaultValue: "" },
    { name: "nameId", type: "uint32" },
    { name: "unknownDword2", type: "uint32" },
    { name: "unknownDword3", type: "uint32" },
    { name: "unknownByte1", type: "uint8" },
    { name: "modelId", type: "uint32" },
    { name: "scale", type: "floatvector4" },
    { name: "unknownString1", type: "string" },
    { name: "unknownString2", type: "string" },
    { name: "unknownDword5", type: "uint32" },
    { name: "unknownString3", type: "string" },
    { name: "position", type: "floatvector3" },
    { name: "unknownVector1", type: "floatvector4" },
    { name: "rotation", type: "floatvector4" },
    { name: "unknownDword7", type: "uint32" },
    { name: "unknownFloat1", type: "float" },
    { name: "unknownString4", type: "string" },
    { name: "unknownString5", type: "string" },
    { name: "unknownString6", type: "string" },
    { name: "vehicleId", type: "uint32" },
    { name: "unknownDword9", type: "uint32" },
    { name: "npcDefinitionId", type: "uint32" },
    { name: "unknownByte2", type: "uint8" },
    { name: "profileId", type: "uint32" },
    { name: "unknownBoolean1", type: "boolean" },
    {
        name: "unknownData1",
        type: "schema",
        fields: [
            { name: "unknownByte1", type: "uint8" },
            { name: "unknownByte2", type: "uint8" },
            { name: "unknownByte3", type: "uint8" },
        ],
    },
    { name: "unknownByte6", type: "uint8" },
    { name: "unknownDword11", type: "uint32" },
    { name: "unknownGuid1", type: "uint64" },
    {
        name: "unknownData2",
        type: "schema",
        fields: [{ name: "unknownGuid1", type: "uint64" }],
    },
];
var profileStatsSubSchema1 = [
    { name: "unknownDword1", type: "uint32" },
    { name: "unknownArray1", type: "array", elementType: "uint32" },
    { name: "unknownDword2", type: "uint32" },
    { name: "unknownDword3", type: "uint32" },
    { name: "unknownDword4", type: "uint32" },
    { name: "unknownDword5", type: "uint32" },
    { name: "unknownDword6", type: "uint32" },
    { name: "unknownDword7", type: "uint32" },
    { name: "unknownDword8", type: "uint32" },
];
var weaponStatsDataSubSchema1 = [
    { name: "unknownDword1", type: "uint32" },
    { name: "unknownDword2", type: "uint32" },
    { name: "unknownDword3", type: "uint32" },
    { name: "unknownDword4", type: "uint32" },
    { name: "unknownDword5", type: "uint32" },
    { name: "unknownDword6", type: "uint32" },
    { name: "unknownDword7", type: "uint32" },
    { name: "unknownDword8", type: "uint32" },
    { name: "unknownDword9", type: "uint32" },
    { name: "unknownDword10", type: "uint32" },
    { name: "unknownDword11", type: "uint32" },
    { name: "unknownDword12", type: "uint32" },
    { name: "unknownDword13", type: "uint32" },
    { name: "unknownBoolean1", type: "boolean" },
    { name: "unknownDword14", type: "uint32" },
];
var weaponStatsDataSchema = [
    { name: "unknownData1", type: "schema", fields: profileStatsSubSchema1 },
    { name: "unknownDword1", type: "uint32" },
    { name: "unknownDword2", type: "uint32" },
    { name: "unknownDword3", type: "uint32" },
    { name: "unknownDword4", type: "uint32" },
    { name: "unknownDword5", type: "uint32" },
    { name: "unknownDword6", type: "uint32" },
    { name: "unknownDword7", type: "uint32" },
    { name: "unknownDword8", type: "uint32" },
    { name: "unknownDword9", type: "uint32" },
    { name: "unknownDword10", type: "uint32" },
    { name: "unknownDword11", type: "uint32" },
    { name: "unknownData2", type: "schema", fields: weaponStatsDataSubSchema1 },
    { name: "unknownData3", type: "schema", fields: weaponStatsDataSubSchema1 },
];
var vehicleStatsDataSchema = [
    { name: "unknownData1", type: "schema", fields: profileStatsSubSchema1 },
    { name: "unknownData2", type: "schema", fields: weaponStatsDataSubSchema1 },
];
var facilityStatsDataSchema = [
    { name: "unknownData1", type: "schema", fields: weaponStatsDataSubSchema1 },
];
var itemBaseSchema = [
    { name: "itemId", type: "uint32" },
    { name: "unknownDword2", type: "uint32" },
    { name: "unknownGuid1", type: "uint64" },
    { name: "unknownDword3", type: "uint32" },
    { name: "unknownDword4", type: "uint32" },
    { name: "unknownDword5", type: "uint32" },
    { name: "unknownDword6", type: "uint32" },
    { name: "unknownBoolean1", type: "boolean" },
    { name: "unknownDword7", type: "uint32" },
    { name: "unknownByte1", type: "uint8" },
    {
        name: "unknownData",
        type: "variabletype8",
        types: {
            0: [],
            1: [
                { name: "unknownDword1", type: "uint32" },
                { name: "unknownDword2", type: "uint32" },
                { name: "unknownDword3", type: "uint32" },
            ],
        },
    },
];
var effectTagDataSchema = [
    { name: "unknownDword1", type: "uint32" },
    { name: "unknownDword2", type: "uint32" },
    { name: "unknownDword3", type: "uint32" },
    { name: "unknownDword4", type: "uint32" },
    { name: "unknownDword5", type: "uint32" },
    {
        name: "unknownData1",
        type: "schema",
        fields: [
            { name: "unknownGuid1", type: "uint64" },
            { name: "unknownGuid2", type: "uint64" },
        ],
    },
    {
        name: "unknownData2",
        type: "schema",
        fields: [
            { name: "unknownGuid1", type: "uint64" },
            { name: "unknownGuid2", type: "uint64" },
            { name: "unknownVector1", type: "floatvector4" },
        ],
    },
    {
        name: "unknownData3",
        type: "schema",
        fields: [
            { name: "unknownDword1", type: "uint32" },
            { name: "unknownDword2", type: "uint32" },
            { name: "unknownDword3", type: "uint32" },
        ],
    },
    { name: "unknownDword6", type: "uint32" },
    { name: "unknownByte1", type: "uint8" },
];
var targetDataSchema = [{ name: "targetType", type: "uint8" }];
var itemDetailSchema = [{ name: "unknownBoolean1", type: "boolean" }];
var statDataSchema = [
    { name: "statId", type: "uint32" },
    {
        name: "statValue",
        type: "variabletype8",
        types: {
            0: [
                { name: "baseValue", type: "uint32" },
                { name: "modifierValue", type: "uint32" },
            ],
            1: [
                { name: "baseValue", type: "float" },
                { name: "modifierValue", type: "float" },
            ],
        },
    },
];
var itemWeaponDetailSubSchema1 = [
    { name: "statOwnerId", type: "uint32" },
    { name: "statData", type: "schema", fields: statDataSchema },
];
var itemWeaponDetailSubSchema2 = [
    { name: "unknownDword1", type: "uint32" },
    {
        name: "unknownArray1",
        type: "array",
        fields: [
            { name: "unknownDword1", type: "uint32" },
            {
                name: "unknownArray1",
                type: "array",
                fields: itemWeaponDetailSubSchema1,
            },
        ],
    },
];
var itemWeaponDetailSchema = [
    { name: "unknownBoolean1", type: "boolean" },
    {
        name: "unknownArray1",
        type: "array",
        fields: [
            { name: "unknownDword1", type: "uint32" },
            { name: "unknownDword2", type: "uint32" },
        ],
    },
    {
        name: "unknownArray2",
        type: "array8",
        fields: [
            { name: "unknownDword1", type: "uint32" },
            {
                name: "unknownArray1",
                type: "array8",
                fields: [
                    { name: "unknownByte1", type: "uint8" },
                    { name: "unknownDword1", type: "uint32" },
                    { name: "unknownDword2", type: "uint32" },
                    { name: "unknownDword3", type: "uint32" },
                ],
            },
        ],
    },
    { name: "unknownByte1", type: "uint8" },
    { name: "unknownByte2", type: "uint8" },
    { name: "unknownDword1", type: "uint32" },
    { name: "unknownByte3", type: "uint8" },
    { name: "unknownFloat1", type: "float" },
    { name: "unknownByte4", type: "uint8" },
    { name: "unknownDword2", type: "uint32" },
    { name: "unknownArray3", type: "array", fields: itemWeaponDetailSubSchema1 },
    { name: "unknownArray4", type: "array", fields: itemWeaponDetailSubSchema2 },
];
var weaponPackets = [
    [
        "Weapon.FireStateUpdate",
        0x8501,
        {
            fields: [
                { name: "guid", type: "uint64" },
                { name: "unknownByte1", type: "uint8" },
                { name: "unknownByte2", type: "uint8" },
            ],
        },
    ],
    ["Weapon.FireStateTargetedUpdate", 0x8502, {}],
    [
        "Weapon.Fire",
        0x8503,
        {
            fields: [
                { name: "guid", type: "uint64" },
                { name: "position", type: "floatvector3" },
                { name: "unknownDword1", type: "uint32" },
                { name: "unknownDword2", type: "uint32" },
                { name: "unknownDword3", type: "uint32" },
            ],
        },
    ],
    ["Weapon.FireWithDefinitionMapping", 0x8504, {}],
    ["Weapon.FireNoProjectile", 0x8505, {}],
    ["Weapon.ProjectileHitReport", 0x8506, {}],
    [
        "Weapon.ReloadRequest",
        0x8507,
        {
            fields: [{ name: "guid", type: "uint64" }],
        },
    ],
    ["Weapon.Reload", 0x8508, {}],
    ["Weapon.ReloadInterrupt", 0x8509, {}],
    ["Weapon.ReloadComplete", 0x850a, {}],
    [
        "Weapon.AddAmmo",
        0x850b,
        {
            fields: [
                { name: "guid", type: "uint64" },
                { name: "unknownByte1", type: "uint8" },
                { name: "unknownDword1", type: "uint32" },
                { name: "unknownBoolean1", type: "boolean" },
                { name: "unknownBoolean2", type: "boolean" },
            ],
        },
    ],
    ["Weapon.SetAmmo", 0x850c, {}],
    [
        "Weapon.SwitchFireModeRequest",
        0x850d,
        {
            fields: [
                { name: "guid", type: "uint64" },
                { name: "unknownByte1", type: "uint8" },
                { name: "unknownByte2", type: "uint8" },
                { name: "unknownByte3", type: "uint8" },
            ],
        },
    ],
    ["Weapon.LockOnGuidUpdate", 0x850e, {}],
    ["Weapon.LockOnLocationUpdate", 0x850f, {}],
    ["Weapon.MeleeSlash", 0x8510, {}],
    ["Weapon.MeleeStabStart", 0x8511, {}],
    ["Weapon.MeleeStabFinish", 0x8512, {}],
    [
        "Weapon.StatUpdate",
        0x8513,
        {
            fields: [
                {
                    name: "statData",
                    type: "array",
                    fields: [
                        { name: "guid", type: "uint64" },
                        { name: "unknownBoolean1", type: "boolean" },
                        {
                            name: "statUpdates",
                            type: "array",
                            fields: [
                                { name: "statCategory", type: "uint8" },
                                {
                                    name: "statUpdateData",
                                    type: "schema",
                                    fields: itemWeaponDetailSubSchema1,
                                },
                            ],
                        },
                    ],
                },
            ],
        },
    ],
    ["Weapon.DebugProjectile", 0x8514, {}],
    ["Weapon.AddFireGroup", 0x8515, {}],
    ["Weapon.RemoveFireGroup", 0x8516, {}],
    ["Weapon.ReplaceFireGroup", 0x8517, {}],
    ["Weapon.GuidedUpdate", 0x8518, {}],
    ["Weapon.RemoteWeapon.Reset", 0x851901, {}],
    ["Weapon.RemoteWeapon.AddWeapon", 0x851902, {}],
    ["Weapon.RemoteWeapon.RemoveWeapon", 0x851903, {}],
    [
        "Weapon.RemoteWeapon.Update",
        0x851904,
        {
            fields: [
                {
                    name: "unknownUint1",
                    type: "custom",
                    parser: readUnsignedIntWith2bitLengthValue,
                    packer: packUnsignedIntWith2bitLengthValue,
                },
                { name: "unknownByte1", type: "uint8" },
                { name: "unknownQword1", type: "uint64" },
                { name: "unknownByte2", type: "uint8" },
                {
                    name: "unknownUint2",
                    type: "custom",
                    parser: readUnsignedIntWith2bitLengthValue,
                    packer: packUnsignedIntWith2bitLengthValue,
                },
            ],
        },
    ],
    // ["Weapon.RemoteWeapon.Update.FireState",                        0x85190401, {}],
    // ["Weapon.RemoteWeapon.Update.Empty",                            0x85190402, {}],
    // ["Weapon.RemoteWeapon.Update.Reload",                           0x85190403, {}],
    // ["Weapon.RemoteWeapon.Update.ReloadLoopEnd",                    0x85190404, {}],
    // ["Weapon.RemoteWeapon.Update.ReloadInterrupt",                  0x85190405, {}],
    // ["Weapon.RemoteWeapon.Update.SwitchFireMode",                   0x85190406, {}],
    // ["Weapon.RemoteWeapon.Update.StatUpdate",                       0x85190407, {}],
    // ["Weapon.RemoteWeapon.Update.AddFireGroup",                     0x85190408, {}],
    // ["Weapon.RemoteWeapon.Update.RemoveFireGroup",                  0x85190409, {}],
    // ["Weapon.RemoteWeapon.Update.ReplaceFireGroup",                 0x8519040A, {}],
    // ["Weapon.RemoteWeapon.Update.ProjectileLaunch",                 0x8519040B, {}],
    // ["Weapon.RemoteWeapon.Update.Chamber",                          0x8519040C, {}],
    // ["Weapon.RemoteWeapon.Update.Throw",                            0x8519040D, {}],
    // ["Weapon.RemoteWeapon.Update.Trigger",                          0x8519040E, {}],
    // ["Weapon.RemoteWeapon.Update.ChamberInterrupt",                 0x8519040F, {}],
    // ["Weapon.RemoteWeapon.Update.RemoteSetAmmo",                    0x85190410, {}],
    // ["Weapon.RemoteWeapon.Update.Unknown",                          0x85190411, {}],
    ["Weapon.RemoteWeapon.MeleeSlash", 0x851905, {}],
    ["Weapon.RemoteWeapon.MeleeStabStart", 0x851906, {}],
    ["Weapon.RemoteWeapon.MeleeStabFinish", 0x851907, {}],
    ["Weapon.RemoteWeapon.QuickUse", 0x851908, {}],
    ["Weapon.RemoteWeapon.ProjectileLaunchHint", 0x851909, {}],
    ["Weapon.RemoteWeapon.ProjectileDetonateHint", 0x85190a, {}],
    ["Weapon.RemoteWeapon.ProjectileRemoteContactReport", 0x85190b, {}],
    ["Weapon.ChamberRound", 0x851a, {}],
    ["Weapon.QuickUse", 0x851b, {}],
    ["Weapon.GuidedSetNonSeeking", 0x851c, {}],
    ["Weapon.ChamberInterrupt", 0x851d, {}],
    ["Weapon.GuidedExplode", 0x851e, {}],
    ["Weapon.DestroyNpcProjectile", 0x851f, {}],
    ["Weapon.WeaponToggleEffects", 0x8520, {}],
    [
        "Weapon.Reset",
        0x8521,
        {
            fields: [
                { name: "unknownQword1", type: "uint64" },
                { name: "unknownBoolean1", type: "boolean" },
                { name: "unknownByte1", type: "uint8" },
            ],
        },
    ],
    ["Weapon.ProjectileSpawnNpc", 0x8522, {}],
    ["Weapon.FireRejected", 0x8523, {}],
    [
        "Weapon.MultiWeapon",
        0x8524,
        {
            fields: [
                {
                    name: "packets",
                    type: "custom",
                    parser: parseMultiWeaponPacket,
                    packer: packMultiWeaponPacket,
                },
            ],
        },
    ],
    ["Weapon.WeaponFireHint", 0x8525, {}],
    ["Weapon.ProjectileContactReport", 0x8526, {}],
];
var weaponPacketTypes = {}, weaponPacketDescriptors = {};
PacketTable.build(weaponPackets, weaponPacketTypes, weaponPacketDescriptors);
function parseMultiWeaponPacket(data, offset) {
    var startOffset = offset, packets = [];
    var n = data.readUInt32LE(offset);
    offset += 4;
    for (var i = 0; i < n; i++) {
        var size = data.readUInt32LE(offset);
        offset += 4;
        var subData = data.slice(offset, offset + size);
        offset += size;
        packets.push(parseWeaponPacket(subData, 2).value);
    }
    return {
        value: packets,
        length: startOffset - offset,
    };
}
function packMultiWeaponPacket(obj) { }
function parseWeaponPacket(data, offset) {
    var obj = {};
    obj.gameTime = data.readUInt32LE(offset);
    var tmpData = data.slice(offset + 4);
    var weaponPacketData = new Buffer.alloc(tmpData.length + 1);
    weaponPacketData.writeUInt8(0x85, 0);
    tmpData.copy(weaponPacketData, 1);
    var weaponPacket = readPacketType(weaponPacketData, weaponPacketDescriptors);
    if (weaponPacket.packet) {
        obj.packetType = weaponPacket.packetType;
        obj.packetName = weaponPacket.packet.name;
        if (weaponPacket.packet.schema) {
            obj.packet = DataSchema.parse(weaponPacket.packet.schema, weaponPacketData, weaponPacket.length, null).result;
        }
    }
    else {
        obj.packetType = weaponPacket.packetType;
        obj.packetData = data;
    }
    return {
        value: obj,
        length: data.length - offset,
    };
}
function packWeaponPacket(obj) {
    var subObj = obj.packet, subName = obj.packetName, subType = weaponPacketTypes[subName], data;
    if (weaponPacketDescriptors[subType]) {
        var subPacket = weaponPacketDescriptors[subType], subTypeData = writePacketType(subType), subData = DataSchema.pack(subPacket.schema, subObj).data;
        subData = Buffer.concat([subTypeData.slice(1), subData]);
        data = new Buffer.alloc(subData.length + 4);
        data.writeUInt32LE((obj.gameTime & 0xffffffff) >>> 0, 0);
        subData.copy(data, 4);
    }
    else {
        throw "Unknown weapon packet type: " + subType;
    }
    return data;
}
function parseItemData(data, offset, referenceData) {
    var startOffset = offset, detailItem, detailSchema;
    var baseItem = DataSchema.parse(itemBaseSchema, data, offset);
    offset += baseItem.length;
    if (referenceData.itemTypes[baseItem.result.itemId] == "Weapon") {
        detailSchema = itemWeaponDetailSchema;
    }
    else {
        detailSchema = itemDetailSchema;
    }
    detailItem = DataSchema.parse(detailSchema, data, offset);
    offset += detailItem.length;
    return {
        value: {
            baseItem: baseItem.result,
            detail: detailItem.result,
        },
        length: offset - startOffset,
    };
}
function packItemData(obj, referenceData) {
    var baseData = DataSchema.pack(itemBaseSchema, obj.baseItem), detailData, detailSchema;
    if (referenceData.itemTypes[obj.baseItem.itemId] == "Weapon") {
        detailSchema = itemWeaponDetailSchema;
    }
    else {
        detailSchema = itemDetailSchema;
    }
    detailData = DataSchema.pack(detailSchema, obj.detail);
    return Buffer.concat([baseData.data, detailData.data]);
}
var resourceEventDataSubSchema = [
    {
        name: "resourceData",
        type: "schema",
        fields: [
            { name: "resourceId", type: "uint32" },
            { name: "resourceType", type: "uint32" },
        ],
    },
    {
        name: "unknownArray1",
        type: "array",
        fields: [
            { name: "unknownDword1", type: "uint32" },
            {
                name: "unknownData1",
                type: "schema",
                fields: [
                    { name: "unknownDword1", type: "uint32" },
                    { name: "unknownFloat1", type: "float" },
                    { name: "unknownFloat2", type: "float" },
                ],
            },
        ],
    },
    {
        name: "unknownData2",
        type: "schema",
        fields: [
            { name: "max_value", type: "uint32" },
            { name: "initial_value", type: "uint32" },
            { name: "unknownFloat1", type: "float" },
            { name: "unknownFloat2", type: "float" },
            { name: "unknownFloat3", type: "float" },
            { name: "unknownDword3", type: "uint32" },
            { name: "unknownDword4", type: "uint32" },
            { name: "unknownDword5", type: "uint32" },
        ],
    },
    { name: "unknownByte1", type: "uint8" },
    { name: "unknownByte2", type: "uint8" },
    { name: "unknownTime1", type: "uint64" },
    { name: "unknownTime2", type: "uint64" },
    { name: "unknownTime3", type: "uint64" },
];
var rewardBundleDataSchema = [
    { name: "unknownByte1", type: "boolean" },
    {
        name: "currency",
        type: "array",
        fields: [
            { name: "currencyId", type: "uint32" },
            { name: "quantity", type: "uint32" },
        ],
    },
    { name: "unknownDword1", type: "uint32" },
    { name: "unknownByte2", type: "uint8" },
    { name: "unknownDword2", type: "uint32" },
    { name: "unknownDword3", type: "uint32" },
    { name: "unknownDword4", type: "uint32" },
    { name: "unknownDword5", type: "uint32" },
    { name: "unknownDword6", type: "uint32" },
    { name: "time", type: "uint64" },
    { name: "characterId", type: "uint64" },
    { name: "nameId", type: "uint32" },
    { name: "unknownDword8", type: "uint32" },
    { name: "imageSetId", type: "uint32" },
    {
        name: "entries",
        type: "array",
        fields: [
            {
                name: "entryData",
                type: "variabletype8",
                types: {
                    1: [
                        {
                            name: "unknownData1",
                            type: "schema",
                            fields: [
                                { name: "unknownBoolean1", type: "boolean" },
                                { name: "imageSetId", type: "uint32" },
                                { name: "unknownDword2", type: "uint32" },
                                { name: "nameId", type: "uint32" },
                                { name: "quantity", type: "uint32" },
                                { name: "itemId", type: "uint32" },
                                { name: "unknownDword6", type: "uint32" },
                                { name: "unknownString1", type: "string" },
                                { name: "unknownDword7", type: "uint32" },
                                { name: "unknownDword8", type: "uint32" },
                            ],
                        },
                    ],
                },
            },
        ],
    },
    { name: "unknownDword10", type: "uint32" },
];
var objectiveDataSchema = [
    { name: "objectiveId", type: "uint32" },
    { name: "nameId", type: "uint32" },
    { name: "descriptionId", type: "uint32" },
    { name: "rewardData", type: "schema", fields: rewardBundleDataSchema },
    { name: "unknownByte1", type: "uint8" },
    { name: "unknownDword3", type: "uint32" },
    { name: "unknownDword4", type: "uint32" },
    { name: "unknownByte2", type: "uint8" },
    { name: "unknownByte3", type: "uint8" },
    {
        name: "unknownData1",
        type: "schema",
        fields: [
            { name: "unknownDword1", type: "uint32" },
            { name: "unknownDword2", type: "uint32" },
            { name: "unknownDword3", type: "uint32" },
            { name: "unknownDword4", type: "uint32" },
        ],
    },
    { name: "unknownByte4", type: "uint8" },
];
var achievementDataSchema = [
    { name: "achievementId", type: "uint32" },
    { name: "unknownBoolean1", type: "boolean" },
    { name: "nameId", type: "uint32" },
    { name: "descriptionId", type: "uint32" },
    { name: "timeStarted", type: "uint64" },
    { name: "timeFinished", type: "uint64" },
    { name: "progress", type: "float" },
    {
        name: "objectives",
        type: "array",
        fields: [
            { name: "index", type: "uint32" },
            { name: "objectiveData", type: "schema", fields: objectiveDataSchema },
        ],
    },
    { name: "iconId", type: "uint32" },
    { name: "unknownDword5", type: "uint32" },
    { name: "unknownDword6", type: "uint32" },
    { name: "points", type: "uint32" },
    { name: "unknownDword8", type: "uint32" },
    { name: "unknownBoolean2", type: "boolean" },
    { name: "unknownDword9", type: "uint32" },
];
var loadoutDataSubSchema1 = [
    { name: "loadoutId", type: "uint32" },
    {
        name: "unknownData1",
        type: "schema",
        fields: [
            { name: "unknownDword1", type: "uint32" },
            { name: "unknownByte1", type: "uint8" },
        ],
    },
    { name: "unknownDword2", type: "uint32" },
    {
        name: "unknownData2",
        type: "schema",
        fields: [
            { name: "unknownDword1", type: "uint32" },
            { name: "loadoutName", type: "string" },
        ],
    },
    { name: "tintItemId", type: "uint32" },
    { name: "unknownDword4", type: "uint32" },
    { name: "decalItemId", type: "uint32" },
    {
        name: "loadoutSlots",
        type: "array",
        fields: [
            { name: "loadoutSlotId", type: "uint32" },
            {
                name: "loadoutSlotData",
                type: "schema",
                fields: [
                    { name: "index", type: "uint32" },
                    {
                        name: "loadoutSlotItem",
                        type: "schema",
                        fields: [
                            { name: "itemLineId", type: "uint32" },
                            { name: "flags", type: "uint8" },
                            {
                                name: "attachments",
                                type: "array",
                                fields: [{ name: "attachmentId", type: "uint32" }],
                            },
                            {
                                name: "attachmentClasses",
                                type: "array",
                                fields: [
                                    { name: "classId", type: "uint32" },
                                    { name: "attachmentId", type: "uint32" },
                                ],
                            },
                        ],
                    },
                    { name: "tintItemId", type: "uint32" },
                    { name: "itemSlot", type: "uint32" },
                ],
            },
        ],
    },
];
var loadoutDataSubSchema2 = [
    { name: "unknownDword1", type: "uint32" },
    {
        name: "unknownData1",
        type: "schema",
        fields: [
            { name: "unknownDword1", type: "uint32" },
            { name: "unknownByte1", type: "uint8" },
        ],
    },
    { name: "unknownString1", type: "string" },
    { name: "unknownDword2", type: "uint32" },
    { name: "unknownDword3", type: "uint32" },
    { name: "unknownDword4", type: "uint32" },
    { name: "unknownDword5", type: "uint32" },
    {
        name: "unknownArray1",
        type: "array",
        fields: [
            { name: "unknownDword1", type: "uint32" },
            {
                name: "unknownData1",
                type: "schema",
                fields: [
                    { name: "unknownDword1", type: "uint32" },
                    {
                        name: "unknownData1",
                        type: "schema",
                        fields: [
                            { name: "unknownDword1", type: "uint32" },
                            { name: "unknownByte1", type: "uint8" },
                            {
                                name: "unknownArray1",
                                type: "array",
                                fields: [{ name: "unknownDword1", type: "uint32" }],
                            },
                            {
                                name: "unknownArray2",
                                type: "array",
                                fields: [
                                    { name: "unknownDword1", type: "uint32" },
                                    { name: "unknownDword2", type: "uint32" },
                                ],
                            },
                        ],
                    },
                    { name: "unknownDword2", type: "uint32" },
                    { name: "unknownDword3", type: "uint32" },
                ],
            },
        ],
    },
];
var fullNpcDataSchema = [
    {
        name: "transient_id",
        type: "custom",
        parser: readUnsignedIntWith2bitLengthValue,
        packer: packUnsignedIntWith2bitLengthValue,
    },
    { name: "unknownDword1", type: "uint32" },
    { name: "unknownDword2", type: "uint32" },
    { name: "unknownDword3", type: "uint32" },
    {
        name: "attachments",
        type: "array",
        fields: [
            { name: "unknownString1", type: "string" },
            { name: "unknownString2", type: "string" },
            { name: "unknownString3", type: "string" },
            { name: "unknownString4", type: "string" },
            { name: "unknownDword1", type: "uint32" },
            { name: "unknownDword2", type: "uint32" },
            { name: "unknownDword3", type: "uint32" },
        ],
    },
    { name: "unknownString1", type: "string" },
    { name: "unknownString2", type: "string" },
    { name: "unknownDword4", type: "uint32" },
    { name: "unknownFloat1", type: "float" },
    { name: "unknownDword5", type: "uint32" },
    { name: "unknownVector1", type: "floatvector3" },
    { name: "unknownVector2", type: "floatvector3" },
    { name: "unknownFloat2", type: "float" },
    { name: "unknownDword6", type: "uint32" },
    { name: "unknownDword7", type: "uint32" },
    { name: "unknownDword8", type: "uint32" },
    {
        name: "effectTags",
        type: "array",
        fields: [
            { name: "unknownDword1", type: "uint32" },
            { name: "unknownDword2", type: "uint32" },
            { name: "unknownDword3", type: "uint32" },
            { name: "unknownDword4", type: "uint32" },
            { name: "unknownDword5", type: "uint32" },
            { name: "unknownDword6", type: "uint32" },
            { name: "unknownDword7", type: "uint32" },
            { name: "unknownDword8", type: "uint32" },
            { name: "unknownDword9", type: "uint32" },
            { name: "unknownFloat1", type: "float" },
            { name: "unknownDword10", type: "uint32" },
            { name: "unknownQword1", type: "uint64" },
            { name: "unknownQword2", type: "uint64" },
            { name: "unknownQword3", type: "uint64" },
            { name: "unknownGuid1", type: "uint64" },
            { name: "unknownDword11", type: "uint32" },
            { name: "unknownDword12", type: "uint32" },
            { name: "unknownDword13", type: "uint32" },
            { name: "unknownDword14", type: "uint32" },
            { name: "unknownDword15", type: "uint32" },
            { name: "unknownDword16", type: "uint32" },
            { name: "unknownDword17", type: "uint32" },
            { name: "unknownGuid2", type: "uint64" },
            { name: "unknownDword18", type: "uint32" },
            { name: "unknownDword19", type: "uint32" },
            { name: "unknownDword20", type: "uint32" },
            { name: "unknownDword21", type: "uint32" },
            { name: "unknownGuid3", type: "uint64" },
            { name: "unknownGuid4", type: "uint64" },
            { name: "unknownDword22", type: "uint32" },
            { name: "unknownQword4", type: "uint64" },
            { name: "unknownDword23", type: "uint32" },
        ],
    },
    {
        name: "unknownData1",
        type: "schema",
        fields: [
            { name: "unknownDword1", type: "uint32" },
            { name: "unknownString1", type: "string" },
            { name: "unknownString2", type: "string" },
            { name: "unknownDword2", type: "uint32" },
            { name: "unknownString3", type: "string" },
        ],
    },
    { name: "unknownVector4", type: "floatvector4" },
    { name: "unknownDword9", type: "uint32" },
    { name: "unknownDword10", type: "uint32" },
    { name: "unknownDword11", type: "uint32" },
    { name: "characterId", type: "uint64" },
    { name: "unknownFloat3", type: "float" },
    { name: "targetData", type: "schema", fields: targetDataSchema },
    {
        name: "characterVariables",
        type: "array",
        fields: [
            { name: "unknownString1", type: "string" },
            { name: "unknownDword1", type: "uint32" },
        ],
    },
    { name: "unknownDword12", type: "uint32" },
    { name: "unknownFloat4", type: "float" },
    { name: "unknownVector5", type: "floatvector4" },
    { name: "unknownDword13", type: "uint32" },
    { name: "unknownFloat5", type: "float" },
    { name: "unknownFloat6", type: "float" },
    {
        name: "unknownData2",
        type: "schema",
        fields: [{ name: "unknownFloat1", type: "float" }],
    },
    { name: "unknownDword14", type: "uint32" },
    { name: "unknownDword15", type: "uint32" },
    { name: "unknownDword16", type: "uint32" },
    { name: "unknownDword17", type: "uint32" },
    { name: "unknownDword18", type: "uint32" },
    { name: "unknownByte1", type: "uint8" },
    { name: "unknownByte2", type: "uint8" },
    { name: "unknownDword19", type: "uint32" },
    { name: "unknownDword20", type: "uint32" },
    { name: "unknownDword21", type: "uint32" },
    { name: "resources", type: "array", fields: resourceEventDataSubSchema },
    { name: "unknownGuid1", type: "uint64" },
    {
        name: "unknownData3",
        type: "schema",
        fields: [{ name: "unknownDword1", type: "uint32" }],
    },
    { name: "unknownDword22", type: "uint32" },
    { name: "unknownBytes1", type: "byteswithlength" },
    { name: "unknownBytes2", type: "byteswithlength" },
];
var respawnLocationDataSchema = [
    { name: "guid", type: "uint64" },
    { name: "respawnType", type: "uint8" },
    { name: "position", type: "floatvector4" },
    { name: "unknownDword1", type: "uint32" },
    { name: "unknownDword2", type: "uint32" },
    { name: "iconId1", type: "uint32" },
    { name: "iconId2", type: "uint32" },
    { name: "respawnTotalTime", type: "uint32" },
    { name: "unknownDword3", type: "uint32" },
    { name: "nameId", type: "uint32" },
    { name: "distance", type: "float" },
    { name: "unknownByte1", type: "uint8" },
    { name: "unknownByte2", type: "uint8" },
    {
        name: "unknownData1",
        type: "schema",
        fields: [
            { name: "unknownByte1", type: "uint8" },
            { name: "unknownByte2", type: "uint8" },
            { name: "unknownByte3", type: "uint8" },
            { name: "unknownByte4", type: "uint8" },
            { name: "unknownByte5", type: "uint8" },
        ],
    },
    { name: "unknownDword4", type: "uint32" },
    { name: "unknownByte3", type: "uint8" },
    { name: "unknownByte4", type: "uint8" },
];
var packets = [
    ["Server", 0x01, {}],
    ["ClientFinishedLoading", 0x02, {}],
    [
        "SendSelfToClient",
        0x03,
        {
            fields: [
                {
                    name: "data",
                    type: "byteswithlength",
                    fields: [
                        { name: "guid", type: "uint64" },
                        { name: "characterId", type: "uint64" },
                        {
                            name: "unknownUint1",
                            type: "custom",
                            parser: readUnsignedIntWith2bitLengthValue,
                            packer: packUnsignedIntWith2bitLengthValue,
                        },
                        { name: "lastLoginDate", type: "uint64" },
                        { name: "actorModelId", type: "uint32" },
                        { name: "headActor", type: "string" },
                        { name: "unknownString1", type: "string" },
                        { name: "unknownDword4", type: "uint32" },
                        { name: "unknownDword5", type: "uint32" },
                        { name: "unknownString2", type: "string" },
                        { name: "unknownString3", type: "string" },
                        { name: "unknownString4", type: "string" },
                        { name: "headId", type: "uint32" },
                        { name: "unknownDword6", type: "uint32" },
                        { name: "factionId", type: "uint32" },
                        { name: "unknownDword9", type: "uint32" },
                        { name: "unknownDword10", type: "uint32" },
                        { name: "position", type: "floatvector4" },
                        { name: "unknownVector2", type: "floatvector4" },
                        {
                            name: "identity",
                            type: "schema",
                            fields: [
                                { name: "unknownDword1", type: "uint32" },
                                { name: "unknownDword2", type: "uint32" },
                                { name: "unknownDword3", type: "uint32" },
                                { name: "characterName", type: "string" },
                                { name: "unknownString1", type: "string" },
                            ],
                        },
                        { name: "unknownDword14", type: "uint32" },
                        {
                            name: "currency",
                            type: "array",
                            fields: [
                                { name: "currencyId", type: "uint32" },
                                { name: "quantity", type: "uint32" },
                            ],
                        },
                        { name: "creationDate", type: "uint64" },
                        { name: "unknownDword15", type: "uint32" },
                        { name: "unknownDword16", type: "uint32" },
                        { name: "unknownBoolean1", type: "boolean" },
                        { name: "unknownBoolean2", type: "boolean" },
                        { name: "unknownDword17", type: "uint32" },
                        { name: "unknownDword18", type: "uint32" },
                        { name: "unknownBoolean3", type: "boolean" },
                        { name: "unknownDword19", type: "uint32" },
                        { name: "gender", type: "uint32" },
                        { name: "unknownDword21", type: "uint32" },
                        { name: "unknownDword22", type: "uint32" },
                        { name: "unknownDword23", type: "uint32" },
                        { name: "unknownBoolean4", type: "boolean" },
                        { name: "unknownTime1", type: "uint64" },
                        { name: "unknownTime2", type: "uint64" },
                        { name: "unknownTime3", type: "uint64" },
                        { name: "unknownDword24", type: "uint32" },
                        { name: "unknownBoolean5", type: "boolean" },
                        { name: "unknownDword25", type: "uint32" },
                        { name: "profiles", type: "array", fields: profileDataSchema },
                        { name: "currentProfile", type: "uint32" },
                        {
                            name: "unknownArray2",
                            type: "array",
                            fields: [
                                { name: "unknownDword1", type: "int32" },
                                { name: "unknownDword2", type: "int32" },
                            ],
                        },
                        {
                            name: "collections",
                            type: "array",
                            fields: [
                                { name: "unknownDword1", type: "uint32" },
                                { name: "unknownDword2", type: "uint32" },
                                { name: "unknownDword3", type: "uint32" },
                                { name: "unknownDword4", type: "uint32" },
                                { name: "unknownDword5", type: "uint32" },
                                { name: "unknownDword6", type: "uint32" },
                                { name: "unknownDword7", type: "uint32" },
                                {
                                    name: "unknownData1",
                                    type: "schema",
                                    fields: rewardBundleDataSchema,
                                },
                                {
                                    name: "unknownArray2",
                                    type: "array",
                                    fields: [
                                        { name: "unknownDword1", type: "uint32" },
                                        {
                                            name: "unknownData1",
                                            type: "schema",
                                            fields: [
                                                { name: "unknownDword1", type: "uint32" },
                                                { name: "unknownDword2", type: "uint32" },
                                                { name: "unknownDword3", type: "uint32" },
                                                { name: "unknownDword4", type: "uint32" },
                                                { name: "unknownDword5", type: "uint32" },
                                                { name: "unknownDword6", type: "uint32" },
                                                { name: "unknownDword7", type: "uint32" },
                                                { name: "unknownBoolean1", type: "boolean" },
                                            ],
                                        },
                                    ],
                                },
                            ],
                        },
                        {
                            name: "inventory",
                            type: "schema",
                            fields: [
                                {
                                    name: "items",
                                    type: "array",
                                    fields: [
                                        {
                                            name: "itemData",
                                            type: "custom",
                                            parser: parseItemData,
                                            packer: packItemData,
                                        },
                                    ],
                                },
                                { name: "unknownDword1", type: "uint32" },
                            ],
                        },
                        { name: "unknownDword28", type: "uint32" },
                        {
                            name: "characterQuests",
                            type: "schema",
                            fields: [
                                {
                                    name: "quests",
                                    type: "array",
                                    fields: [
                                        { name: "unknownDword1", type: "uint32" },
                                        { name: "unknownDword2", type: "uint32" },
                                        { name: "unknownDword3", type: "uint32" },
                                        { name: "unknownDword4", type: "uint32" },
                                        { name: "unknownBoolean1", type: "boolean" },
                                        { name: "unknownGuid1", type: "uint64" },
                                        { name: "unknownDword5", type: "uint32" },
                                        { name: "unknownBoolean2", type: "boolean" },
                                        { name: "unknownFloat1", type: "float" },
                                        {
                                            name: "reward",
                                            type: "schema",
                                            fields: rewardBundleDataSchema,
                                        },
                                        {
                                            name: "unknownArray2",
                                            type: "array",
                                            fields: [
                                                { name: "unknownDword1", type: "uint32" },
                                                { name: "unknownDword2", type: "uint32" },
                                                { name: "unknownDword3", type: "uint32" },
                                                { name: "unknownBoolean1", type: "boolean" },
                                                {
                                                    name: "reward",
                                                    type: "schema",
                                                    fields: rewardBundleDataSchema,
                                                },
                                                { name: "unknownDword14", type: "uint32" },
                                                { name: "unknownDword15", type: "uint32" },
                                                { name: "unknownDword16", type: "uint32" },
                                                { name: "unknownDword17", type: "uint32" },
                                                { name: "unknownBoolean4", type: "boolean" },
                                                { name: "unknownDword18", type: "uint32" },
                                                { name: "unknownDword19", type: "uint32" },
                                                { name: "unknownDword20", type: "uint32" },
                                                { name: "unknownDword21", type: "uint32" },
                                            ],
                                        },
                                        { name: "unknownDword6", type: "uint32" },
                                        { name: "unknownBoolean3", type: "boolean" },
                                        { name: "unknownBoolean4", type: "boolean" },
                                    ],
                                },
                                { name: "unknownDword1", type: "uint32" },
                                { name: "unknownDword2", type: "uint32" },
                                { name: "unknownBoolean1", type: "boolean" },
                                { name: "unknownDword3", type: "uint32" },
                                { name: "unknownDword4", type: "uint32" },
                            ],
                        },
                        {
                            name: "characterAchievements",
                            type: "array",
                            fields: achievementDataSchema,
                        },
                        {
                            name: "acquaintances",
                            type: "array",
                            fields: [
                                { name: "unknownGuid1", type: "uint64" },
                                { name: "unknownString1", type: "string" },
                                { name: "unknownDword1", type: "uint32" },
                                { name: "unknownGuid2", type: "uint64" },
                                { name: "unknownBoolean1", type: "boolean" },
                            ],
                        },
                        {
                            name: "recipes",
                            type: "array",
                            fields: [
                                { name: "unknownDword1", type: "uint32" },
                                { name: "unknownDword2", type: "uint32" },
                                { name: "unknownDword3", type: "uint32" },
                                { name: "unknownDword4", type: "uint32" },
                                { name: "unknownDword5", type: "uint32" },
                                { name: "unknownDword6", type: "uint32" },
                                { name: "unknownBoolean1", type: "boolean" },
                                { name: "unknownDword7", type: "uint32" },
                                {
                                    name: "components",
                                    type: "array",
                                    fields: [
                                        { name: "unknownDword1", type: "uint32" },
                                        { name: "unknownDword2", type: "uint32" },
                                        { name: "unknownDword3", type: "uint32" },
                                        { name: "unknownDword4", type: "uint32" },
                                        { name: "unknownDword5", type: "uint32" },
                                        { name: "unknownQword1", type: "uint64" },
                                        { name: "unknownDword6", type: "uint32" },
                                        { name: "unknownDword7", type: "uint32" },
                                    ],
                                },
                                { name: "unknownDword8", type: "uint32" },
                            ],
                        },
                        {
                            name: "mounts",
                            type: "array",
                            fields: [
                                { name: "unknownDword1", type: "uint32" },
                                { name: "unknownDword2", type: "uint32" },
                                { name: "unknownDword3", type: "uint32" },
                                { name: "unknownQword1", type: "uint64" },
                                { name: "unknownBoolean1", type: "boolean" },
                                { name: "unknownDword4", type: "uint32" },
                                { name: "unknownString1", type: "string" },
                            ],
                        },
                        {
                            name: "unknownCoinStoreData",
                            type: "schema",
                            fields: [
                                { name: "unknownBoolean1", type: "boolean" },
                                {
                                    name: "unknownArray1",
                                    type: "array",
                                    fields: [{ name: "unknownDword1", type: "uint32" }],
                                },
                            ],
                        },
                        {
                            name: "unknownArray10",
                            type: "array",
                            fields: [{ name: "unknownDword1", type: "uint32" }],
                        },
                        {
                            name: "unknownEffectArray",
                            type: "array",
                            fields: [
                                { name: "unknownDword1", type: "uint32" },
                                {
                                    name: "unknownData1",
                                    type: "schema",
                                    fields: [
                                        {
                                            name: "unknownData1",
                                            type: "schema",
                                            fields: [
                                                { name: "unknownDword1", type: "uint32" },
                                                { name: "unknownDword2", type: "uint32" },
                                                { name: "unknownDword3", type: "uint32" },
                                                { name: "unknownDword4", type: "uint32" },
                                                { name: "unknownDword5", type: "uint32" },
                                                { name: "unknownDword6", type: "uint32" },
                                                { name: "unknownDword7", type: "uint32" },
                                                { name: "unknownDword8", type: "uint32" },
                                                { name: "unknownDword9", type: "uint32" },
                                                { name: "unknownFloat1", type: "float" },
                                                { name: "unknownDword10", type: "uint32" },
                                                { name: "unknownQword1", type: "uint64" },
                                                { name: "unknownQword2", type: "uint64" },
                                                { name: "unknownQword3", type: "uint64" },
                                                { name: "unknownGuid1", type: "uint64" },
                                                { name: "unknownDword11", type: "uint32" },
                                                { name: "unknownDword12", type: "uint32" },
                                                { name: "unknownDword13", type: "uint32" },
                                                { name: "unknownDword14", type: "uint32" },
                                                { name: "unknownDword15", type: "uint32" },
                                                { name: "unknownDword16", type: "uint32" },
                                                { name: "unknownDword17", type: "uint32" },
                                                { name: "unknownGuid2", type: "uint64" },
                                                { name: "unknownDword18", type: "uint32" },
                                                { name: "unknownDword19", type: "uint32" },
                                                { name: "unknownByte1", type: "uint8" },
                                                { name: "unknownDword20", type: "uint32" },
                                                { name: "unknownGuid3", type: "uint64" },
                                                { name: "unknownGuid4", type: "uint64" },
                                                { name: "unknownDword21", type: "uint32" },
                                                { name: "unknownQword4", type: "uint64" },
                                                { name: "unknownDword22", type: "uint32" },
                                            ],
                                        },
                                        { name: "unknownDword1", type: "uint32" },
                                        { name: "unknownBoolean1", type: "boolean" },
                                        { name: "unknownDword2", type: "uint32" },
                                        { name: "unknownDword3", type: "uint32" },
                                        {
                                            name: "unknownArray1",
                                            type: "array",
                                            fields: [{ name: "unknownDword1", type: "uint32" }],
                                        },
                                    ],
                                },
                            ],
                        },
                        {
                            name: "stats",
                            type: "array",
                            fields: [
                                { name: "statId", type: "uint32" },
                                {
                                    name: "statData",
                                    type: "schema",
                                    fields: [
                                        { name: "statId", type: "uint32" },
                                        {
                                            name: "statValue",
                                            type: "variabletype8",
                                            types: {
                                                0: [
                                                    { name: "base", type: "uint32" },
                                                    { name: "modifier", type: "uint32" },
                                                ],
                                                1: [
                                                    { name: "base", type: "float" },
                                                    { name: "modifier", type: "float" },
                                                ],
                                            },
                                        },
                                    ],
                                },
                            ],
                        },
                        {
                            name: "playerTitles",
                            type: "array",
                            fields: [
                                { name: "titleId", type: "uint32" },
                                { name: "titleType", type: "uint32" },
                                { name: "stringId", type: "uint32" },
                            ],
                        },
                        { name: "currentPlayerTitle", type: "uint32" },
                        {
                            name: "unknownArray13",
                            type: "array",
                            fields: [
                                { name: "unknownDword1", type: "uint32" },
                                { name: "unknownDword2", type: "uint32" },
                            ],
                        },
                        {
                            name: "unknownArray14",
                            type: "array",
                            fields: [{ name: "unknownDword1", type: "uint32" }],
                        },
                        { name: "unknownDword33", type: "uint32" },
                        {
                            name: "unknownArray15",
                            type: "array",
                            fields: [{ name: "unknownDword1", type: "uint32" }],
                        },
                        {
                            name: "unknownArray16",
                            type: "array",
                            fields: [{ name: "unknownDword1", type: "uint32" }],
                        },
                        {
                            name: "unknownArray17",
                            type: "array",
                            fields: [{ name: "unknownBoolean1", type: "boolean" }],
                        },
                        // { name: "unknownDword34",           type: "uint32" },
                        // { name: "unknownDword35",           type: "uint32" },
                        // { name: "unknownDword36",           type: "uint32" },
                        {
                            name: "unknownArray18",
                            type: "array",
                            fields: [
                                { name: "unknownDword1", type: "uint32" },
                                { name: "unknownDword2", type: "uint32" },
                                { name: "unknownDword3", type: "uint32" },
                                { name: "unknownDword4", type: "uint32" },
                                { name: "unknownDword5", type: "uint32" },
                                { name: "unknownDword6", type: "uint32" },
                                { name: "unknownDword7", type: "uint32" },
                                { name: "unknownByte1", type: "uint8" },
                            ],
                        },
                        {
                            name: "unknownArray19",
                            type: "array",
                            fields: [
                                { name: "unknownDword1", type: "uint32" },
                                { name: "unknownDword2", type: "uint32" },
                                { name: "unknownDword3", type: "uint32" },
                                { name: "unknownDword4", type: "uint32" },
                                { name: "unknownDword5", type: "uint32" },
                                { name: "unknownDword6", type: "uint32" },
                                { name: "unknownDword7", type: "uint32" },
                                { name: "unknownByte1", type: "uint8" },
                            ],
                        },
                        {
                            name: "unknownArray20",
                            type: "array",
                            fields: [
                                { name: "unknownDword1", type: "uint32" },
                                { name: "unknownDword2", type: "uint32" },
                            ],
                        },
                        {
                            name: "unknownData1",
                            type: "schema",
                            fields: [
                                {
                                    name: "abilityLines",
                                    type: "array",
                                    fields: [
                                        { name: "abilityLineId", type: "uint32" },
                                        {
                                            name: "abilityLineData",
                                            type: "schema",
                                            fields: [
                                                { name: "abilityLineId", type: "uint32" },
                                                { name: "abilityId", type: "uint32" },
                                                { name: "abilityLineIndex", type: "uint32" },
                                            ],
                                        },
                                    ],
                                },
                                {
                                    name: "unknownArray2",
                                    type: "array",
                                    fields: [
                                        { name: "unknownDword1", type: "uint32" },
                                        { name: "unknownDword2", type: "uint32" },
                                        { name: "unknownDword3", type: "uint32" },
                                        { name: "unknownDword4", type: "uint32" },
                                    ],
                                },
                                {
                                    name: "unknownArray3",
                                    type: "array",
                                    fields: [
                                        { name: "unknownDword1", type: "uint32" },
                                        { name: "unknownDword2", type: "uint32" },
                                        { name: "unknownDword3", type: "uint32" },
                                        { name: "unknownDword4", type: "uint32" },
                                    ],
                                },
                                {
                                    name: "unknownArray4",
                                    type: "array",
                                    fields: [
                                        { name: "unknownDword1", type: "uint32" },
                                        { name: "unknownDword2", type: "uint32" },
                                        { name: "unknownDword3", type: "uint32" },
                                        { name: "unknownDword4", type: "uint32" },
                                    ],
                                },
                                { name: "unknownDword1", type: "uint32" },
                                { name: "unknownDword2", type: "uint32" },
                                {
                                    name: "unknownArray5",
                                    type: "array",
                                    fields: [
                                        { name: "unknownDword1", type: "uint32" },
                                        {
                                            name: "unknownData1",
                                            type: "schema",
                                            fields: [
                                                { name: "unknownDword1", type: "uint32" },
                                                { name: "unknownDword2", type: "uint32" },
                                                { name: "unknownDword3", type: "uint32" },
                                                { name: "unknownGuid1", type: "uint64" },
                                                { name: "unknownGuid2", type: "uint64" },
                                            ],
                                        },
                                    ],
                                },
                                {
                                    name: "unknownArray6",
                                    type: "array",
                                    fields: [
                                        { name: "unknownDword1", type: "uint32" },
                                        {
                                            name: "unknownData1",
                                            type: "schema",
                                            fields: [
                                                { name: "unknownDword1", type: "uint32" },
                                                { name: "unknownDword2", type: "uint32" },
                                                { name: "unknownDword3", type: "uint32" },
                                                { name: "unknownGuid1", type: "uint64" },
                                            ],
                                        },
                                    ],
                                },
                                {
                                    name: "unknownArray7",
                                    type: "array",
                                    fields: [
                                        { name: "unknownDword1", type: "uint32" },
                                        { name: "unknownDword2", type: "uint32" },
                                    ],
                                },
                            ],
                        },
                        {
                            name: "unknownArray21",
                            type: "array",
                            fields: [
                                { name: "unknownDword1", type: "uint32" },
                                { name: "unknownDword2", type: "uint32" },
                                { name: "unknownDword3", type: "uint32" },
                            ],
                        },
                        {
                            name: "unknownArray22",
                            type: "array",
                            fields: [
                                { name: "unknownDword1", type: "uint32" },
                                { name: "unknownDword2", type: "uint32" },
                                { name: "unknownGuid1", type: "uint64" },
                                { name: "unknownFloat1", type: "float" },
                                { name: "unknownDword3", type: "uint32" },
                            ],
                        },
                        {
                            name: "unknownArray23",
                            type: "array",
                            fields: [
                                { name: "unknownDword1", type: "uint32" },
                                { name: "unknownByte1", type: "uint8" },
                                { name: "unknownDword2", type: "uint32" },
                                { name: "unknownGuid1", type: "uint64" },
                                { name: "unknownFloat1", type: "float" },
                                { name: "unknownDword3", type: "uint32" },
                                { name: "unknownByte2", type: "uint8" },
                            ],
                        },
                        { name: "unknownByte1", type: "uint8" },
                        {
                            name: "unknownData2",
                            type: "schema",
                            fields: [
                                { name: "unknownDword1", type: "uint32" },
                                {
                                    name: "unknownData1",
                                    type: "schema",
                                    fields: [
                                        { name: "unknownDword1", type: "uint32" },
                                        { name: "unknownDword2", type: "uint32" },
                                        { name: "unknownDword3", type: "uint32" },
                                    ],
                                },
                                {
                                    name: "unknownData2",
                                    type: "schema",
                                    fields: [
                                        { name: "unknownDword1", type: "uint32" },
                                        { name: "unknownDword2", type: "uint32" },
                                        { name: "unknownDword3", type: "uint32" },
                                    ],
                                },
                                { name: "unknownDword2", type: "uint32" },
                            ],
                        },
                        { name: "unknownDword37", type: "uint32" },
                        {
                            name: "unknownArray24",
                            type: "array",
                            fields: [
                                { name: "unknownDword1", type: "uint32" },
                                { name: "unknownFloat1", type: "float" },
                            ],
                        },
                        {
                            name: "unknownData3",
                            type: "schema",
                            fields: [
                                { name: "unknownDword1", type: "uint32" },
                                { name: "unknownDword2", type: "uint32" },
                                { name: "unknownDword3", type: "uint32" },
                                { name: "unknownDword4", type: "uint32" },
                                { name: "unknownDword5", type: "uint32" },
                            ],
                        },
                        {
                            name: "unknownArray25",
                            type: "array",
                            fields: [
                                { name: "unknownDword1", type: "uint32" },
                                { name: "unknownGuid1", type: "uint64" },
                                { name: "unknownFloat1", type: "float" },
                                { name: "unknownFloat2", type: "float" },
                            ],
                        },
                        {
                            name: "unknownArray26",
                            type: "array",
                            fields: [
                                { name: "unknownDword1", type: "uint32" },
                                { name: "unknownGuid1", type: "uint64" },
                                {
                                    name: "unknownArray1",
                                    type: "array",
                                    fields: [
                                        { name: "unknownDword1", type: "uint32" },
                                        { name: "unknownDword2", type: "uint32" },
                                    ],
                                },
                            ],
                        },
                        {
                            name: "unknownArray27",
                            type: "array",
                            fields: [
                                {
                                    name: "unknownData1",
                                    type: "schema",
                                    fields: [
                                        { name: "unknownDword1", type: "uint32" },
                                        { name: "unknownGuid1", type: "uint64" },
                                        { name: "unknownGuid2", type: "uint64" },
                                    ],
                                },
                                {
                                    name: "effectTagData",
                                    type: "schema",
                                    fields: effectTagDataSchema,
                                },
                            ],
                        },
                        {
                            name: "unknownArray28",
                            type: "array",
                            fields: [
                                { name: "unknownDword1", type: "uint32" },
                                { name: "unknownDword2", type: "uint32" },
                                {
                                    name: "unknownData1",
                                    type: "schema",
                                    fields: [
                                        { name: "unknownString1", type: "string" },
                                        { name: "unknownString2", type: "string" },
                                    ],
                                },
                                {
                                    name: "unknownArray1",
                                    type: "array",
                                    fields: [
                                        { name: "unknownDword1", type: "uint32" },
                                        {
                                            name: "unknownData1",
                                            type: "schema",
                                            fields: [
                                                { name: "unknownDword1", type: "uint32" },
                                                { name: "unknownGuid1", type: "uint64" },
                                                { name: "unknownString1", type: "string" },
                                                { name: "unknownString2", type: "string" },
                                            ],
                                        },
                                    ],
                                },
                            ],
                        },
                        {
                            name: "playerRanks",
                            type: "array",
                            fields: [
                                { name: "rankId", type: "uint32" },
                                {
                                    name: "rankData",
                                    type: "schema",
                                    fields: [
                                        { name: "rankId", type: "uint32" },
                                        { name: "score", type: "uint32" },
                                        { name: "unknownDword3", type: "uint32" },
                                        { name: "rank", type: "uint32" },
                                        { name: "rankProgress", type: "uint32" },
                                    ],
                                },
                            ],
                        },
                        {
                            name: "unknownData4",
                            type: "schema",
                            fields: [
                                { name: "unknownDword1", type: "uint32" },
                                { name: "unknownDword2", type: "uint32" },
                                { name: "unknownDword3", type: "uint32" },
                                { name: "unknownDword4", type: "uint32" },
                                { name: "unknownDword5", type: "uint32" },
                            ],
                        },
                        {
                            name: "unknownData5",
                            type: "schema",
                            fields: [
                                { name: "unknownDword1", type: "uint32" },
                                { name: "unknownDword2", type: "uint32" },
                                { name: "unknownDword3", type: "uint32" },
                            ],
                        },
                        {
                            name: "implantSlots",
                            type: "array",
                            fields: [
                                { name: "unknownDword1", type: "uint32" },
                                {
                                    name: "unknownData1",
                                    type: "schema",
                                    fields: [
                                        { name: "unknownDword1", type: "uint32" },
                                        { name: "unknownDword2", type: "uint32" },
                                        { name: "unknownDword3", type: "uint32" },
                                        { name: "unknownDword4", type: "uint32" },
                                    ],
                                },
                            ],
                        },
                        {
                            name: "itemTimerData",
                            type: "schema",
                            fields: [
                                {
                                    name: "unknownData1",
                                    type: "schema",
                                    fields: [
                                        { name: "unknownDword1", type: "uint32" },
                                        { name: "unknownFloat1", type: "float" },
                                        { name: "unknownTime1", type: "uint64" },
                                        { name: "unknownTime2", type: "uint64" },
                                    ],
                                },
                                {
                                    name: "unknownArray1",
                                    type: "array",
                                    fields: [
                                        { name: "unknownDword1", type: "uint32" },
                                        {
                                            name: "unknownData1",
                                            type: "schema",
                                            fields: [
                                                { name: "unknownDword1", type: "uint32" },
                                                { name: "unknownFloat1", type: "float" },
                                                { name: "unknownTime1", type: "uint64" },
                                                { name: "unknownTime2", type: "uint64" },
                                            ],
                                        },
                                        { name: "unknownDword2", type: "uint32" },
                                    ],
                                },
                                {
                                    name: "unknownData2",
                                    type: "schema",
                                    fields: [
                                        { name: "unknownDword1", type: "uint32" },
                                        { name: "unknownFloat1", type: "float" },
                                        { name: "unknownTime1", type: "uint64" },
                                    ],
                                },
                                {
                                    name: "unknownArray2",
                                    type: "array",
                                    fields: [
                                        { name: "unknownDword1", type: "uint32" },
                                        {
                                            name: "unknownData1",
                                            type: "schema",
                                            fields: [
                                                { name: "unknownDword1", type: "uint32" },
                                                { name: "unknownFloat1", type: "float" },
                                                { name: "unknownTime1", type: "uint64" },
                                                { name: "unknownDword2", type: "uint32" },
                                                { name: "unknownDword3", type: "uint32" },
                                                { name: "unknownDword4", type: "uint32" },
                                            ],
                                        },
                                    ],
                                },
                                {
                                    name: "unknownArray3",
                                    type: "array",
                                    fields: [
                                        { name: "unknownDword1", type: "uint32" },
                                        {
                                            name: "unknownData1",
                                            type: "schema",
                                            fields: [
                                                { name: "unknownDword1", type: "uint32" },
                                                { name: "unknownFloat1", type: "float" },
                                                { name: "unknownTime1", type: "uint64" },
                                                { name: "unknownDword2", type: "uint32" },
                                                { name: "unknownDword3", type: "uint32" },
                                                { name: "unknownByte1", type: "uint8" },
                                            ],
                                        },
                                    ],
                                },
                                {
                                    name: "unknownArray4",
                                    type: "array",
                                    fields: [
                                        { name: "unknownDword1", type: "uint32" },
                                        {
                                            name: "unknownData1",
                                            type: "schema",
                                            fields: [
                                                { name: "unknownDword1", type: "uint32" },
                                                { name: "unknownFloat1", type: "float" },
                                                { name: "unknownTime1", type: "uint64" },
                                                { name: "unknownDword2", type: "uint32" },
                                                { name: "unknownDword3", type: "uint32" },
                                                { name: "unknownDword4", type: "uint32" },
                                                { name: "unknownByte1", type: "uint8" },
                                            ],
                                        },
                                    ],
                                },
                                { name: "unknownByte1", type: "uint8" },
                            ],
                        },
                        {
                            name: "characterLoadoutData",
                            type: "schema",
                            fields: [
                                {
                                    name: "loadouts",
                                    type: "array",
                                    fields: [
                                        { name: "loadoutId", type: "uint32" },
                                        { name: "unknownDword2", type: "uint32" },
                                        {
                                            name: "loadoutData",
                                            type: "schema",
                                            fields: loadoutDataSubSchema1,
                                        },
                                    ],
                                },
                                {
                                    name: "unknownArray2",
                                    type: "array",
                                    fields: [
                                        { name: "unknownDword1", type: "uint32" },
                                        { name: "unknownDword2", type: "uint32" },
                                        {
                                            name: "unknownData1",
                                            type: "schema",
                                            fields: loadoutDataSubSchema2,
                                        },
                                    ],
                                },
                                {
                                    name: "unknownArray3",
                                    type: "array",
                                    fields: [
                                        { name: "unknownDword1", type: "uint32" },
                                        {
                                            name: "unknownData1",
                                            type: "schema",
                                            fields: [
                                                { name: "unknownDword1", type: "uint32" },
                                                { name: "unknownByte1", type: "uint8" },
                                                {
                                                    name: "unknownArray1",
                                                    type: "array",
                                                    fields: [{ name: "unknownDword1", type: "uint32" }],
                                                },
                                                {
                                                    name: "unknownArray2",
                                                    type: "array",
                                                    fields: [
                                                        { name: "unknownDword1", type: "uint32" },
                                                        { name: "unknownDword2", type: "uint32" },
                                                    ],
                                                },
                                            ],
                                        },
                                    ],
                                },
                                {
                                    name: "unknownData1",
                                    type: "schema",
                                    fields: loadoutDataSubSchema1,
                                },
                                {
                                    name: "unknownData2",
                                    type: "schema",
                                    fields: loadoutDataSubSchema2,
                                },
                                { name: "unknownDword1", type: "uint32" },
                                { name: "unknownDword2", type: "uint32" },
                                { name: "unknownDword3", type: "uint32" },
                                { name: "unknownDword4", type: "uint32" },
                            ],
                        },
                        {
                            name: "missionData",
                            type: "schema",
                            fields: [
                                {
                                    name: "unknownArray1",
                                    type: "array",
                                    fields: [
                                        {
                                            name: "unknownData1",
                                            type: "schema",
                                            fields: [
                                                { name: "unknownDword1", type: "uint32" },
                                                { name: "unknownTime1", type: "uint64" },
                                                { name: "unknownByte1", type: "uint8" },
                                                { name: "unknownDword2", type: "uint32" },
                                                { name: "unknownDword3", type: "uint32" },
                                            ],
                                        },
                                        { name: "unknownDword1", type: "uint32" },
                                    ],
                                },
                                {
                                    name: "unknownArray2",
                                    type: "array",
                                    fields: [
                                        {
                                            name: "unknownData1",
                                            type: "schema",
                                            fields: [
                                                { name: "unknownDword1", type: "uint32" },
                                                { name: "unknownTime1", type: "uint64" },
                                                { name: "unknownByte1", type: "uint8" },
                                                { name: "unknownDword2", type: "uint32" },
                                                { name: "unknownDword3", type: "uint32" },
                                            ],
                                        },
                                        { name: "unknownFloat1", type: "float" },
                                    ],
                                },
                                {
                                    name: "unknownArray3",
                                    type: "array",
                                    fields: [
                                        {
                                            name: "unknownData1",
                                            type: "schema",
                                            fields: [
                                                { name: "unknownDword1", type: "uint32" },
                                                { name: "unknownTime1", type: "uint64" },
                                                { name: "unknownByte1", type: "uint8" },
                                                { name: "unknownDword2", type: "uint32" },
                                                { name: "unknownDword3", type: "uint32" },
                                            ],
                                        },
                                        { name: "unknownGuid1", type: "uint64" },
                                    ],
                                },
                                {
                                    name: "unknownArray4",
                                    type: "array",
                                    fields: [
                                        {
                                            name: "unknownData1",
                                            type: "schema",
                                            fields: [
                                                {
                                                    name: "unknownData1",
                                                    type: "schema",
                                                    fields: [
                                                        { name: "unknownDword1", type: "uint32" },
                                                        { name: "unknownTime1", type: "uint64" },
                                                        { name: "unknownByte1", type: "uint8" },
                                                    ],
                                                },
                                                {
                                                    name: "unknownData2",
                                                    type: "schema",
                                                    fields: [
                                                        { name: "unknownDword1", type: "uint32" },
                                                        { name: "unknownTime1", type: "uint64" },
                                                        { name: "unknownByte1", type: "uint8" },
                                                    ],
                                                },
                                                {
                                                    name: "unknownData3",
                                                    type: "schema",
                                                    fields: [
                                                        { name: "unknownDword1", type: "uint32" },
                                                        { name: "unknownDword2", type: "uint32" },
                                                        { name: "unknownDword3", type: "uint32" },
                                                    ],
                                                },
                                                { name: "unknownDword1", type: "uint32" },
                                                {
                                                    name: "unknownData4",
                                                    type: "schema",
                                                    fields: [
                                                        { name: "unknownDword1", type: "uint32" },
                                                        { name: "unknownDword2", type: "uint32" },
                                                        { name: "unknownDword3", type: "uint32" },
                                                        { name: "unknownDword4", type: "uint32" },
                                                        { name: "unknownVector1", type: "floatvector4" },
                                                    ],
                                                },
                                            ],
                                        },
                                    ],
                                },
                                {
                                    name: "unknownArray5",
                                    type: "array",
                                    fields: [
                                        {
                                            name: "unknownData1",
                                            type: "schema",
                                            fields: [
                                                {
                                                    name: "unknownData1",
                                                    type: "schema",
                                                    fields: [
                                                        { name: "unknownDword1", type: "uint32" },
                                                        { name: "unknownTime1", type: "uint64" },
                                                        { name: "unknownByte1", type: "uint8" },
                                                    ],
                                                },
                                                {
                                                    name: "unknownData2",
                                                    type: "schema",
                                                    fields: [
                                                        { name: "unknownDword1", type: "uint32" },
                                                        { name: "unknownTime1", type: "uint64" },
                                                        { name: "unknownByte1", type: "uint8" },
                                                    ],
                                                },
                                                {
                                                    name: "unknownData3",
                                                    type: "schema",
                                                    fields: [
                                                        { name: "unknownDword1", type: "uint32" },
                                                        { name: "unknownDword2", type: "uint32" },
                                                        { name: "unknownDword3", type: "uint32" },
                                                    ],
                                                },
                                                { name: "unknownDword1", type: "uint32" },
                                                {
                                                    name: "unknownData4",
                                                    type: "schema",
                                                    fields: [
                                                        { name: "unknownDword1", type: "uint32" },
                                                        { name: "unknownDword2", type: "uint32" },
                                                        { name: "unknownDword3", type: "uint32" },
                                                        { name: "unknownDword4", type: "uint32" },
                                                        { name: "unknownVector1", type: "floatvector4" },
                                                    ],
                                                },
                                            ],
                                        },
                                    ],
                                },
                            ],
                        },
                        {
                            name: "characterResources",
                            type: "array",
                            fields: [
                                { name: "resourceType", type: "uint32" },
                                {
                                    name: "resourceData",
                                    type: "schema",
                                    fields: resourceEventDataSubSchema,
                                },
                            ],
                        },
                        {
                            name: "characterResourceChargers",
                            type: "array",
                            fields: [
                                { name: "resourceChargerId", type: "uint32" },
                                {
                                    name: "resourceChargerData",
                                    type: "schema",
                                    fields: [
                                        { name: "resourceChargerId", type: "uint32" },
                                        { name: "unknownDword2", type: "uint32" },
                                        {
                                            name: "itemData",
                                            type: "schema",
                                            fields: [
                                                { name: "itemId", type: "uint32" },
                                                { name: "itemClass", type: "uint32" },
                                            ],
                                        },
                                    ],
                                },
                                { name: "unknownByte1", type: "uint8" },
                            ],
                        },
                        {
                            name: "skillPointData",
                            type: "schema",
                            fields: [
                                { name: "skillPointsGranted", type: "uint64" },
                                { name: "skillPointsTotal", type: "uint64" },
                                { name: "skillPointsSpent", type: "uint64" },
                                { name: "nextSkillPointPct", type: "double" },
                                { name: "unknownTime1", type: "uint64" },
                                { name: "unknownDword1", type: "uint32" },
                            ],
                        },
                        {
                            name: "skills",
                            type: "array",
                            fields: [
                                { name: "skillLineId", type: "uint32" },
                                { name: "skillId", type: "uint32" },
                            ],
                        },
                        { name: "unknownBoolean8", type: "boolean" },
                        { name: "unknownQword1", type: "uint64" },
                        { name: "unknownDword38", type: "uint32" },
                        { name: "unknownQword2", type: "uint64" },
                        { name: "unknownQword3", type: "uint64" },
                        { name: "unknownDword39", type: "uint32" },
                        { name: "unknownDword40", type: "uint32" },
                        { name: "unknownBoolean9", type: "boolean" },
                    ],
                },
            ],
        },
    ],
    [
        "ClientIsReady",
        0x04,
        {
            fields: [],
        },
    ],
    [
        "ZoneDoneSendingInitialData",
        0x05,
        {
            fields: [],
        },
    ],
    [
        "Chat.Chat",
        0x060100,
        {
            fields: [
                { name: "unknown2", type: "uint16" },
                { name: "channel", type: "uint16" },
                { name: "characterId1", type: "uint64" },
                { name: "characterId2", type: "uint64" },
                { name: "unknown5_0", type: "uint32" },
                { name: "unknown5_1", type: "uint32" },
                { name: "unknown5_2", type: "uint32" },
                { name: "characterName1", type: "string" },
                { name: "unknown5_3", type: "string" },
                { name: "unknown6_0", type: "uint32" },
                { name: "unknown6_1", type: "uint32" },
                { name: "unknown6_2", type: "uint32" },
                { name: "characterName2", type: "string" },
                { name: "unknown6_3", type: "string" },
                { name: "message", type: "string" },
                { name: "position", type: "floatvector4" },
                { name: "unknownGuid", type: "uint64" },
                { name: "unknown13", type: "uint32" },
                { name: "color1", type: "uint32" },
                { name: "color2", type: "uint32" },
                { name: "unknown15", type: "uint8" },
                { name: "unknown16", type: "boolean" },
            ],
        },
    ],
    ["Chat.EnterArea", 0x060200, {}],
    ["Chat.DebugChat", 0x060300, {}],
    ["Chat.FromStringId", 0x060400, {}],
    ["Chat.TellEcho", 0x060500, {}],
    [
        "Chat.ChatText",
        0x060600,
        {
            fields: [
                { name: "message", type: "string" },
                { name: "unknownDword1", type: "uint32" },
                { name: "color", type: "bytes", length: 4 },
                { name: "unknownDword2", type: "uint32" },
                { name: "unknownByte3", type: "uint8" },
                { name: "unknownByte4", type: "uint8" },
            ],
        },
    ],
    ["ClientLogout", 0x07, {}],
    ["TargetClientNotOnline", 0x08, {}],
    ["Command.ShowDialog", 0x090100, {}],
    ["Command.EndDialog", 0x090200, {}],
    ["Command.StartDialog", 0x090300, {}],
    ["Command.PlayerPlaySpeech", 0x090400, {}],
    ["Command.DialogResponse", 0x090500, {}],
    ["Command.PlaySoundAtLocation", 0x090600, {}],
    [
        "Command.InteractRequest",
        0x090700,
        {
            fields: [{ name: "guid", type: "uint64" }],
        },
    ],
    ["Command.InteractCancel", 0x090800, { fields: [] }],
    [
        "Command.InteractionList",
        0x090900,
        {
            fields: [
                { name: "guid", type: "uint64" },
                { name: "unknownBoolean1", type: "boolean" },
                {
                    name: "unknownArray1",
                    type: "array",
                    fields: [
                        { name: "unknownDword1", type: "uint32" },
                        { name: "unknownDword2", type: "uint32" },
                        { name: "unknownDword3", type: "uint32" },
                        { name: "unknownDword4", type: "uint32" },
                        { name: "unknownDword5", type: "uint32" },
                        { name: "unknownDword6", type: "uint32" },
                        { name: "unknownDword7", type: "uint32" },
                    ],
                },
                { name: "unknownString1", type: "string" },
                { name: "unknownBoolean2", type: "boolean" },
                {
                    name: "unknownArray2",
                    type: "array",
                    fields: [
                        { name: "unknownString1", type: "uint32" },
                        { name: "unknownFloat2", type: "uint32" },
                        { name: "unknownDword1", type: "uint32" },
                        { name: "unknownDword2", type: "uint32" },
                        { name: "unknownDword3", type: "uint32" },
                        { name: "unknownDword4", type: "uint32" },
                        { name: "unknownDword5", type: "uint32" },
                        { name: "unknownDword6", type: "uint32" },
                        { name: "unknownDword7", type: "uint32" },
                    ],
                },
                { name: "unknownBoolean3", type: "boolean" },
            ],
        },
    ],
    [
        "Command.InteractionSelect",
        0x090a00,
        {
            fields: [
                { name: "guid", type: "uint64" },
                { name: "interactionId", type: "uint32" },
            ],
        },
    ],
    ["Command.InteractionStartWheel", 0x090b00, {}],
    ["Command.StartFlashGame", 0x090c00, {}],
    [
        "Command.SetProfile",
        0x090d00,
        {
            fields: [
                { name: "profileId", type: "uint32" },
                { name: "tab", type: "uint32" },
            ],
        },
    ],
    ["Command.AddFriendRequest", 0x090e00, {}],
    ["Command.RemoveFriendRequest", 0x090f00, {}],
    ["Command.ConfirmFriendRequest", 0x091000, {}],
    ["Command.ConfirmFriendResponse", 0x091100, {}],
    ["Command.SetChatBubbleColor", 0x091200, {}],
    [
        "Command.PlayerSelect",
        0x091300,
        {
            fields: [
                { name: "characterId", type: "uint64" },
                { name: "guid", type: "uint64" },
            ],
        },
    ],
    [
        "Command.FreeInteractionNpc",
        0x091400,
        {
            fields: [],
        },
    ],
    ["Command.FriendsPositionRequest", 0x091500, {}],
    ["Command.MoveAndInteract", 0x091600, {}],
    ["Command.QuestAbandon", 0x091700, {}],
    ["Command.RecipeStart", 0x091800, {}],
    ["Command.ShowRecipeWindow", 0x091900, {}],
    ["Command.ActivateProfileFailed", 0x091a00, {}],
    ["Command.PlayDialogEffect", 0x091b00, {}],
    ["Command.ForceClearDialog", 0x091c00, {}],
    ["Command.IgnoreRequest", 0x091d00, {}],
    ["Command.SetActiveVehicleGuid", 0x091e00, {}],
    ["Command.ChatChannelOn", 0x091f00, {}],
    ["Command.ChatChannelOff", 0x092000, {}],
    ["Command.RequestPlayerPositions", 0x092100, {}],
    ["Command.RequestPlayerPositionsReply", 0x092200, {}],
    ["Command.SetProfileByItemDefinitionId", 0x092300, {}],
    ["Command.RequestRewardPreviewUpdate", 0x092400, {}],
    ["Command.RequestRewardPreviewUpdateReply", 0x092500, {}],
    ["Command.PlaySoundIdOnTarget", 0x092600, {}],
    ["Command.RequestPlayIntroEncounter", 0x092700, {}],
    ["Command.SpotPlayer", 0x092800, {}],
    ["Command.SpotPlayerReply", 0x092900, {}],
    ["Command.SpotPrimaryTarget", 0x092a00, {}],
    [
        "Command.InteractionString",
        0x092b00,
        {
            fields: [
                { name: "guid", type: "uint64" },
                { name: "stringId", type: "uint32" },
                { name: "unknown4", type: "uint32" },
            ],
        },
    ],
    ["Command.GiveCurrency", 0x092c00, {}],
    ["Command.HoldBreath", 0x092d00, {}],
    ["Command.ChargeCollision", 0x092e00, {}],
    ["Command.DebrisLaunch", 0x092f00, {}],
    ["Command.Suicide", 0x093000, {}],
    ["Command.RequestHelp", 0x093100, {}],
    ["Command.OfferHelp", 0x093200, {}],
    ["Command.Redeploy", 0x093300, {}],
    ["Command.PlayersInRadius", 0x093400, {}],
    ["Command.AFK", 0x093500, {}],
    ["Command.ReportPlayerReply", 0x093600, {}],
    ["Command.ReportPlayerCheckNameRequest", 0x093700, {}],
    ["Command.ReportPlayerCheckNameReply", 0x093800, {}],
    ["Command.ReportRendererDump", 0x093900, {}],
    ["Command.ChangeName", 0x093a00, {}],
    ["Command.NameValidation", 0x093b00, {}],
    ["Command.PlayerFileDistribution", 0x093c00, {}],
    ["Command.ZoneFileDistribution", 0x093d00, {}],
    [
        "Command.AddWorldCommand",
        0x093e00,
        {
            fields: [{ name: "command", type: "string" }],
        },
    ],
    [
        "Command.AddZoneCommand",
        0x093f00,
        {
            fields: [{ name: "command", type: "string" }],
        },
    ],
    [
        "Command.ExecuteCommand",
        0x094000,
        {
            fields: [
                { name: "commandHash", type: "uint32" },
                { name: "arguments", type: "string" },
            ],
        },
    ],
    ["Command.ZoneExecuteCommand", 0x094100, {}],
    ["Command.RequestStripEffect", 0x094200, {}],
    ["Command.ItemDefinitionRequest", 0x094300, {}],
    ["Command.ItemDefinitionReply", 0x094400, {}],
    [
        "Command.ItemDefinitions",
        0x094500,
        {
            fields: [
                {
                    name: "data",
                    type: "custom",
                    parser: parseItemDefinitions,
                    packer: packItemDefinitions,
                },
            ],
        },
    ],
    [
        "Command.EnableCompositeEffects",
        0x094600,
        {
            fields: [{ name: "enabled", type: "boolean" }],
        },
    ],
    ["Command.StartRentalUpsell", 0x094700, {}],
    ["Command.SafeEject", 0x094800, {}],
    [
        "Command.WeaponFireStateUpdate",
        0x094900,
        {
            fields: [{ name: "characterId", type: "uint64" }],
        },
    ],
    ["Command.ForceBlacklist", 0x094a00, {}],
    ["Command.ValidateDataForZoneOwnedTiles", 0x0946b0, {}],
    ["Command.AddItem", 0x09ea03, {}],
    ["Command.DeleteItem", 0x093eb0, {}],
    ["Command.AbilityReply", 0x093ec0, {}],
    ["Command.AbilityList", 0x093ed0, {}],
    ["Command.AbilityAdd", 0x093ee0, {}],
    ["Command.ServerInformation", 0x093ef0, {}],
    [
        "AdminCommand.RunSpeed",
        0x09c404,
        {
            fields: [{ name: "runSpeed", type: "float" }],
        },
    ],
    [
        "AdminCommand.SpawnVehicle",
        0x099904,
        {
            fields: [
                { name: "vehicleId", type: "uint32" },
                { name: "factionId", type: "uint8" },
                { name: "position", type: "floatvector3" },
                { name: "heading", type: "float" },
                { name: "unknownDword1", type: "uint32" },
                { name: "autoMount", type: "boolean" },
            ],
        },
    ],
    ["ClientBeginZoning", 0x0b, {}],
    ["Combat.AutoAttackTarget", 0x0c01, {}],
    ["Combat.AutoAttackOff", 0x0c02, {}],
    ["Combat.SingleAttackTarget", 0x0c03, {}],
    ["Combat.AttackTargetDamage", 0x0c04, {}],
    ["Combat.AttackAttackerMissed", 0x0c05, {}],
    ["Combat.AttackTargetDodged", 0x0c06, {}],
    ["Combat.AttackProcessed", 0x0c07, {}],
    ["Combat.EnableBossDisplay", 0x0c09, {}],
    ["Combat.AttackTargetBlocked", 0x0c0a, {}],
    ["Combat.AttackTargetParried", 0x0c0b, {}],
    ["Mail", 0x0e, {}],
    ["PlayerUpdate.None", 0x0f00, {}],
    [
        "PlayerUpdate.RemovePlayer",
        0x0f010000,
        {
            fields: [{ name: "guid", type: "uint64" }],
        },
    ],
    [
        "PlayerUpdate.RemovePlayerGracefully",
        0x0f010100,
        {
            fields: [
                { name: "guid", type: "uint64" },
                { name: "unknown5", type: "boolean" },
                { name: "unknown6", type: "uint32" },
                { name: "unknown7", type: "uint32" },
                { name: "unknown8", type: "uint32" },
                { name: "unknown9", type: "uint32" },
                { name: "unknown10", type: "uint32" },
            ],
        },
    ],
    ["PlayerUpdate.Knockback", 0x0f02, {}],
    ["PlayerUpdate.UpdateHitpoints", 0x0f03, {}],
    ["PlayerUpdate.SetAnimation", 0x0f04, {}],
    ["PlayerUpdate.AddNotifications", 0x0f05, {}],
    ["PlayerUpdate.RemoveNotifications", 0x0f06, {}],
    [
        "PlayerUpdate.NpcRelevance",
        0x0f07,
        {
            fields: [
                {
                    name: "npcs",
                    type: "array",
                    fields: [
                        { name: "guid", type: "uint64" },
                        { name: "unknownBoolean1", type: "boolean" },
                        { name: "unknownByte1", type: "uint8" },
                    ],
                },
            ],
        },
    ],
    ["PlayerUpdate.UpdateScale", 0x0f08, {}],
    ["PlayerUpdate.UpdateTemporaryAppearance", 0x0f09, {}],
    ["PlayerUpdate.RemoveTemporaryAppearance", 0x0f0a, {}],
    ["PlayerUpdate.PlayCompositeEffect", 0x0f0b, {}],
    ["PlayerUpdate.SetLookAt", 0x0f0c, {}],
    ["PlayerUpdate.RenamePlayer", 0x0f0d, {}],
    [
        "PlayerUpdate.UpdateCharacterState",
        0x0f0e,
        {
            fields: [
                { name: "characterId", type: "uint64" },
                { name: "unknownDword1", type: "uint32" },
                { name: "unknownDword2", type: "uint32" },
                { name: "gameTime", type: "uint32" },
            ],
        },
    ],
    ["PlayerUpdate.QueueAnimation", 0x0f0f, {}],
    ["PlayerUpdate.ExpectedSpeed", 0x0f10, {}],
    ["PlayerUpdate.ScriptedAnimation", 0x0f11, {}],
    ["PlayerUpdate.ThoughtBubble", 0x0f12, {}],
    ["PlayerUpdate.SetDisposition", 0x0f13, {}],
    ["PlayerUpdate.LootEvent", 0x0f14, {}],
    ["PlayerUpdate.SlotCompositeEffectOverride", 0x0f15, {}],
    ["PlayerUpdate.EffectPackage", 0x0f16, {}],
    ["PlayerUpdate.PreferredLanguages", 0x0f17, {}],
    ["PlayerUpdate.CustomizationChange", 0x0f18, {}],
    ["PlayerUpdate.PlayerTitle", 0x0f19, {}],
    ["PlayerUpdate.AddEffectTagCompositeEffect", 0x0f1a, {}],
    ["PlayerUpdate.RemoveEffectTagCompositeEffect", 0x0f1b, {}],
    ["PlayerUpdate.SetSpawnAnimation", 0x0f1c, {}],
    ["PlayerUpdate.CustomizeNpc", 0x0f1d, {}],
    ["PlayerUpdate.SetSpawnerActivationEffect", 0x0f1e, {}],
    ["PlayerUpdate.SetComboState", 0x0f1f, {}],
    ["PlayerUpdate.SetSurpriseState", 0x0f20, {}],
    ["PlayerUpdate.RemoveNpcCustomization", 0x0f21, {}],
    ["PlayerUpdate.ReplaceBaseModel", 0x0f22, {}],
    ["PlayerUpdate.SetCollidable", 0x0f23, {}],
    ["PlayerUpdate.UpdateOwner", 0x0f24, {}],
    ["PlayerUpdate.UpdateTintAlias", 0x0f25, {}],
    ["PlayerUpdate.MoveOnRail", 0x0f26, {}],
    ["PlayerUpdate.ClearMovementRail", 0x0f27, {}],
    ["PlayerUpdate.MoveOnRelativeRail", 0x0f28, {}],
    [
        "PlayerUpdate.Destroyed",
        0x0f29,
        {
            fields: [
                { name: "guid", type: "uint64" },
                { name: "unknown1", type: "uint32" },
                { name: "unknown2", type: "uint32" },
                { name: "unknown3", type: "uint32" },
                { name: "unknown4", type: "uint8" },
            ],
        },
    ],
    ["PlayerUpdate.SeekTarget", 0x0f2a, {}],
    ["PlayerUpdate.SeekTargetUpdate", 0x0f2b, {}],
    [
        "PlayerUpdate.UpdateActiveWieldType",
        0x0f2c,
        {
            fields: [
                { name: "characterId", type: "uint64" },
                { name: "unknownDword1", type: "uint32" },
            ],
        },
    ],
    ["PlayerUpdate.LaunchProjectile", 0x0f2d, {}],
    ["PlayerUpdate.SetSynchronizedAnimations", 0x0f2e, {}],
    ["PlayerUpdate.HudMessage", 0x0f2f, {}],
    [
        "PlayerUpdate.CustomizationData",
        0x0f30,
        {
            fields: [
                {
                    name: "customizationData",
                    type: "array",
                    fields: [
                        { name: "unknown1", type: "uint32" },
                        { name: "modelName", type: "string" },
                        { name: "unknown3", type: "uint32" },
                        { name: "unknown4", type: "uint32" },
                    ],
                },
            ],
        },
    ],
    ["PlayerUpdate.MemberStatus", 0x0f31, {}],
    ["PlayerUpdate.SetCurrentAdventure", 0x0f32, {}],
    ["PlayerUpdate.StartHarvest", 0x0f33, {}],
    ["PlayerUpdate.StopHarvest", 0x0f34, {}],
    [
        "PlayerUpdate.KnockedOut",
        0x0f35,
        {
            fields: [{ name: "guid", type: "uint64" }],
        },
    ],
    ["PlayerUpdate.KnockedOutDamageReport", 0x0f36, {}],
    [
        "PlayerUpdate.Respawn",
        0x0f37,
        {
            fields: [
                { name: "respawnType", type: "uint8" },
                { name: "respawnGuid", type: "uint64" },
                { name: "profileId", type: "uint32" },
                { name: "profileId2", type: "uint32" },
            ],
        },
    ],
    [
        "PlayerUpdate.RespawnReply",
        0x0f38,
        {
            fields: [
                { name: "characterId", type: "uint64" },
                { name: "status", type: "boolean" },
            ],
        },
    ],
    ["PlayerUpdate.ReadyToReviveResponse", 0x0f39, {}],
    ["PlayerUpdate.ActivateProfile", 0x0f3a, {}],
    ["PlayerUpdate.SetSpotted", 0x0f3b, {}],
    [
        "PlayerUpdate.Jet",
        0x0f3c,
        {
            fields: [
                { name: "characterId", type: "uint64" },
                { name: "state", type: "uint8" },
            ],
        },
    ],
    ["PlayerUpdate.Turbo", 0x0f3d, {}],
    ["PlayerUpdate.StartRevive", 0x0f3e, {}],
    ["PlayerUpdate.StopRevive", 0x0f3f, {}],
    ["PlayerUpdate.ReadyToRevive", 0x0f40, {}],
    [
        "PlayerUpdate.SetFaction",
        0x0f41,
        {
            fields: [
                { name: "guid", type: "uint64" },
                { name: "factionId", type: "uint8" },
            ],
        },
    ],
    [
        "PlayerUpdate.SetBattleRank",
        0x0f42,
        {
            fields: [
                { name: "characterId", type: "uint64" },
                { name: "battleRank", type: "uint32" },
            ],
        },
    ],
    ["PlayerUpdate.StartHeal", 0x0f43, {}],
    ["PlayerUpdate.StopHeal", 0x0f44, {}],
    ["PlayerUpdate.Currency", 0x0f45, {}],
    ["PlayerUpdate.RewardCurrency", 0x0f46, {}],
    [
        "PlayerUpdate.ManagedObject",
        0x0f47,
        {
            fields: [
                { name: "guid", type: "uint64" },
                { name: "guid2", type: "uint64" },
                { name: "characterId", type: "uint64" },
            ],
        },
    ],
    ["PlayerUpdate.MaterialTypeOverride", 0x0f48, {}],
    ["PlayerUpdate.DebrisLaunch", 0x0f49, {}],
    ["PlayerUpdate.HideCorpse", 0x0f4a, {}],
    [
        "PlayerUpdate.CharacterStateDelta",
        0x0f4b,
        {
            fields: [
                { name: "guid1", type: "uint64" },
                { name: "guid2", type: "uint64" },
                { name: "guid3", type: "uint64" },
                { name: "guid4", type: "uint64" },
                { name: "gameTime", type: "uint32" },
            ],
        },
    ],
    ["PlayerUpdate.UpdateStat", 0x0f4c, {}],
    ["PlayerUpdate.AnimationRequest", 0x0f4d, {}],
    ["PlayerUpdate.NonPriorityCharacters", 0x0f4e, {}],
    ["PlayerUpdate.PlayWorldCompositeEffect", 0x0f4f, {}],
    ["PlayerUpdate.AFK", 0x0f50, {}],
    [
        "PlayerUpdate.AddLightweightPc",
        0x0f51,
        {
            fields: [
                { name: "characterId", type: "uint64" },
                {
                    name: "transientId",
                    type: "custom",
                    parser: readUnsignedIntWith2bitLengthValue,
                    packer: packUnsignedIntWith2bitLengthValue,
                },
                { name: "unknownDword1", type: "uint32" },
                { name: "unknownDword2", type: "uint32" },
                { name: "unknownDword3", type: "uint32" },
                { name: "name", type: "string" },
                { name: "unknownString1", type: "string" },
                { name: "unknownByte1", type: "uint8" },
                { name: "unknownDword4", type: "uint32" },
                { name: "unknownDword5", type: "uint32" },
                { name: "position", type: "floatvector3" },
                { name: "rotation", type: "floatvector4" },
                { name: "unknownFloat1", type: "float" },
                { name: "unknownGuid1", type: "uint64" },
                { name: "unknownDword6", type: "uint32" },
                { name: "unknownDword7", type: "uint32" },
                { name: "unknownByte2", type: "uint8" },
                { name: "unknownDword8", type: "uint32" },
                { name: "unknownDword9", type: "uint32" },
                { name: "unknownGuid2", type: "uint64" },
                { name: "unknownByte3", type: "uint8" },
            ],
        },
    ],
    [
        "PlayerUpdate.AddLightweightNpc",
        0x0f52,
        {
            fields: lightWeightNpcSchema,
        },
    ],
    [
        "PlayerUpdate.AddLightweightVehicle",
        0x0f53,
        {
            fields: [
                { name: "npcData", type: "schema", fields: lightWeightNpcSchema },
                { name: "unknownGuid1", type: "uint64" },
                { name: "unknownDword1", type: "uint32" },
                { name: "unknownDword2", type: "uint32" },
                {
                    name: "positionUpdate",
                    type: "custom",
                    parser: readPositionUpdateData,
                    packer: packPositionUpdateData,
                },
                { name: "unknownString1", type: "string" },
            ],
        },
    ],
    ["PlayerUpdate.AddProxiedObject", 0x0f54, {}],
    ["PlayerUpdate.LightweightToFullPc", 0x0f55, {}],
    [
        "PlayerUpdate.LightweightToFullNpc",
        0x0f56,
        {
            fields: fullNpcDataSchema,
        },
    ],
    [
        "PlayerUpdate.LightweightToFullVehicle",
        0x0f57,
        {
            fields: [
                { name: "npcData", type: "schema", fields: fullNpcDataSchema },
                { name: "unknownByte1", type: "uint8" },
                { name: "unknownDword1", type: "uint32" },
                {
                    name: "unknownArray1",
                    type: "array",
                    fields: [
                        { name: "unknownDword1", type: "uint32" },
                        { name: "unknownBoolean1", type: "boolean" },
                    ],
                },
                {
                    name: "unknownArray2",
                    type: "array",
                    fields: [
                        { name: "unknownDword1", type: "uint32" },
                        { name: "unknownByte1", type: "boolean" },
                    ],
                },
                { name: "unknownVector1", type: "floatvector4" },
                { name: "unknownVector2", type: "floatvector4" },
                { name: "unknownByte3", type: "uint8" },
                {
                    name: "unknownArray3",
                    type: "array",
                    fields: [
                        { name: "unknownDword1", type: "uint32" },
                        { name: "unknownQword1", type: "uint64" },
                    ],
                },
                {
                    name: "unknownArray4",
                    type: "array",
                    fields: [
                        { name: "unknownDword1", type: "uint32" },
                        { name: "unknownQword1", type: "uint64" },
                    ],
                },
                {
                    name: "unknownArray5",
                    type: "array",
                    fields: [
                        {
                            name: "unknownData1",
                            type: "schema",
                            fields: [
                                { name: "unknownQword1", type: "uint64" },
                                {
                                    name: "unknownData1",
                                    type: "schema",
                                    fields: [
                                        { name: "unknownDword1", type: "uint32" },
                                        { name: "unknownDword2", type: "uint32" },
                                        { name: "unknownDword3", type: "uint32" },
                                        { name: "unknownString1", type: "string" },
                                        { name: "unknownString2", type: "string" },
                                    ],
                                },
                                { name: "unknownDword1", type: "uint32" },
                                { name: "unknownString1", type: "string" },
                            ],
                        },
                        { name: "unknownByte1", type: "uint8" },
                    ],
                },
                {
                    name: "unknownArray6",
                    type: "array",
                    fields: [{ name: "unknownString1", type: "string" }],
                },
                {
                    name: "unknownArray7",
                    type: "array",
                    fields: itemWeaponDetailSubSchema1,
                },
                {
                    name: "unknownArray8",
                    type: "array",
                    fields: itemWeaponDetailSubSchema2,
                },
                { name: "unknownFloat1", type: "float" },
            ],
        },
    ],
    [
        "PlayerUpdate.FullCharacterDataRequest",
        0x0f58,
        {
            fields: [{ name: "guid", type: "uint64" }],
        },
    ],
    ["PlayerUpdate.InitiateNameChange", 0x0f59, {}],
    ["PlayerUpdate.NameChangeResult", 0x0f5a, {}],
    ["PlayerUpdate.NameValidationResult", 0x0f5b, {}],
    ["PlayerUpdate.Deploy", 0x0f5c, {}],
    ["PlayerUpdate.LowAmmoUpdate", 0x0f5d, {}],
    ["PlayerUpdate.EnterCache", 0x0f5e, {}],
    ["PlayerUpdate.ExitCache", 0x0f5f, {}],
    ["Ability.ClientRequestStartAbility", 0x1001, {}],
    ["Ability.ClientRequestStopAbility", 0x1002, {}],
    ["Ability.ClientMoveAndCast", 0x1003, {}],
    ["Ability.Failed", 0x1004, {}],
    ["Ability.StartCasting", 0x1005, {}],
    ["Ability.Launch", 0x1006, {}],
    ["Ability.Land", 0x1007, {}],
    ["Ability.StartChanneling", 0x1008, {}],
    ["Ability.StopCasting", 0x1009, {}],
    ["Ability.StopAura", 0x100a, {}],
    ["Ability.MeleeRefresh", 0x100b, {}],
    ["Ability.AbilityDetails", 0x100c, {}],
    ["Ability.PurchaseAbility", 0x100d, {}],
    ["Ability.UpdateAbilityExperience", 0x100e, {}],
    ["Ability.SetDefinition", 0x100f, {}],
    ["Ability.RequestAbilityDefinition", 0x1010, {}],
    ["Ability.AddAbilityDefinition", 0x1011, {}],
    ["Ability.PulseLocationTargeting", 0x1012, {}],
    ["Ability.ReceivePulseLocation", 0x1013, {}],
    ["Ability.ActivateItemAbility", 0x1014, {}],
    ["Ability.ActivateVehicleAbility", 0x1015, {}],
    ["Ability.DeactivateItemAbility", 0x1016, {}],
    ["Ability.DeactivateVehicleAbility", 0x1017, {}],
    ["ClientUpdate.Hitpoints", 0x110100, {}],
    [
        "ClientUpdate.ItemAdd",
        0x110200,
        {
            fields: [
                {
                    name: "itemAddData",
                    type: "custom",
                    parser: parseItemAddData,
                    packer: packItemAddData,
                },
            ],
        },
    ],
    ["ClientUpdate.ItemUpdate", 0x110300, {}],
    ["ClientUpdate.ItemDelete", 0x110400, {}],
    ["ClientUpdate.AddItems", 0x110500, {}],
    [
        "ClientUpdate.RemoveItems",
        0x110600,
        {
            fields: [
                {
                    name: "itemData",
                    type: "byteswithlength",
                    fields: [
                        {
                            name: "items",
                            type: "array",
                            fields: [{ name: "guid", type: "uint64" }],
                        },
                    ],
                },
            ],
        },
    ],
    [
        "ClientUpdate.UpdateStat",
        0x110700,
        {
            fields: [{ name: "stats", type: "array", fields: statDataSchema }],
        },
    ],
    ["ClientUpdate.CollectionStart", 0x110800, {}],
    ["ClientUpdate.CollectionRemove", 0x110900, {}],
    ["ClientUpdate.CollectionAddEntry", 0x110a00, {}],
    ["ClientUpdate.CollectionRemoveEntry", 0x110b00, {}],
    ["ClientUpdate.UpdateLocation", 0x110c00, {}],
    ["ClientUpdate.Mana", 0x110d00, {}],
    ["ClientUpdate.UpdateProfileExperience", 0x110e00, {}],
    ["ClientUpdate.AddProfileAbilitySetApl", 0x110f00, {}],
    ["ClientUpdate.AddEffectTag", 0x111000, {}],
    ["ClientUpdate.RemoveEffectTag", 0x111100, {}],
    ["ClientUpdate.UpdateProfileRank", 0x111200, {}],
    ["ClientUpdate.CoinCount", 0x111300, {}],
    ["ClientUpdate.DeleteProfile", 0x111400, {}],
    [
        "ClientUpdate.ActivateProfile",
        0x111500,
        {
            fields: [
                {
                    name: "profileData",
                    type: "byteswithlength",
                    fields: profileDataSchema,
                },
                {
                    name: "attachmentData",
                    type: "array",
                    fields: [
                        { name: "modelName", type: "string" },
                        { name: "unknownString1", type: "string" },
                        { name: "tintAlias", type: "string" },
                        { name: "unknownString2", type: "string" },
                        { name: "unknownDword1", type: "uint32" },
                        { name: "unknownDword2", type: "uint32" },
                        { name: "slotId", type: "uint32" },
                    ],
                },
                { name: "unknownDword1", type: "uint32" },
                { name: "unknownDword2", type: "uint32" },
                { name: "unknownDword3", type: "uint32" },
                { name: "unknownDword4", type: "uint32" },
                { name: "unknownString1", type: "string" },
                { name: "unknownString2", type: "string" },
            ],
        },
    ],
    ["ClientUpdate.AddAbility", 0x111600, {}],
    ["ClientUpdate.NotifyPlayer", 0x111700, {}],
    ["ClientUpdate.UpdateProfileAbilitySetApl", 0x111800, {}],
    ["ClientUpdate.RemoveActionBars", 0x111900, {}],
    ["ClientUpdate.UpdateActionBarSlot", 0x111a00, {}],
    [
        "ClientUpdate.DoneSendingPreloadCharacters",
        0x111b00,
        {
            fields: [{ name: "unknownBoolean1", type: "uint8" }],
        },
    ],
    ["ClientUpdate.SetGrandfatheredStatus", 0x111c00, {}],
    ["ClientUpdate.UpdateActionBarSlotUsed", 0x111d00, {}],
    ["ClientUpdate.PhaseChange", 0x111e00, {}],
    ["ClientUpdate.UpdateKingdomExperience", 0x111f00, {}],
    ["ClientUpdate.DamageInfo", 0x112000, {}],
    [
        "ClientUpdate.ZonePopulation",
        0x112200,
        {
            fields: [
            // { name: "populations",                  type: "array",     elementType: "uint8" }
            ],
        },
    ],
    [
        "ClientUpdate.RespawnLocations",
        0x112100,
        {
        // fields: [
        //     { name: "unknownFlags",                 type: "uint8" },
        //     { name: "locations",                    type: "array",  fields: respawnLocationDataSchema },
        //     { name: "unknownDword1",                type: "uint32" },
        //     { name: "unknownDword2",                type: "uint32" },
        //     { name: "locations2",                   type: "array",  fields: respawnLocationDataSchema }
        // ]
        },
    ],
    ["ClientUpdate.ModifyMovementSpeed", 0x112300, {}],
    ["ClientUpdate.ModifyTurnRate", 0x112400, {}],
    ["ClientUpdate.ModifyStrafeSpeed", 0x112500, {}],
    ["ClientUpdate.UpdateManagedLocation", 0x112600, {}],
    ["ClientUpdate.ScreenEffect", 0x112700, {}],
    [
        "ClientUpdate.MovementVersion",
        0x112800,
        {
            fields: [{ name: "version", type: "uint8" }],
        },
    ],
    [
        "ClientUpdate.ManagedMovementVersion",
        0x112900,
        {
            fields: [
                {
                    name: "version",
                    type: "custom",
                    parser: readUnsignedIntWith2bitLengthValue,
                    packer: packUnsignedIntWith2bitLengthValue,
                },
            ],
        },
    ],
    [
        "ClientUpdate.UpdateWeaponAddClips",
        0x112a00,
        {
            fields: [
                { name: "unknownDword1", type: "uint32" },
                { name: "unknownByte1", type: "uint8" },
                { name: "unknownFloat1", type: "float" },
            ],
        },
    ],
    ["ClientUpdate.SpotProbation", 0x112b00, {}],
    ["ClientUpdate.DailyRibbonCount", 0x112c00, {}],
    ["ClientUpdate.DespawnNpcUpdate", 0x112d00, {}],
    ["ClientUpdate.LoyaltyPoints", 0x112e00, {}],
    ["ClientUpdate.Membership", 0x112f00, {}],
    ["ClientUpdate.ResetMissionRespawnTimer", 0x113000, {}],
    ["ClientUpdate.ResetSquadDeployTimer", 0x113100, {}],
    ["ClientUpdate.Freeze", 0x113200, {}],
    ["ClientUpdate.InGamePurchaseResult", 0x113300, {}],
    ["ClientUpdate.QuizComplete", 0x113400, {}],
    ["ClientUpdate.AutoMountComplete", 0x113500, []],
    ["MiniGame", 0x12, {}],
    ["Group", 0x13, {}],
    ["Encounter", 0x14, {}],
    ["Inventory", 0x15, {}],
    [
        "SendZoneDetails",
        0x16,
        {
            fields: [
                { name: "zoneName", type: "string" },
                { name: "unknownDword1", type: "uint32" },
                { name: "unknownBoolean1", type: "boolean" },
                { name: "unknownString2", type: "string" },
                { name: "unknownByte3", type: "uint8" },
                { name: "zoneId1", type: "uint32" },
                { name: "zoneId2", type: "uint32" },
                { name: "nameId", type: "uint32" },
                { name: "unknownBoolean7", type: "boolean" },
            ],
        },
    ],
    ["ReferenceData.ItemClassDefinitions", 0x1701, {}],
    ["ReferenceData.ItemCategoryDefinitions", 0x1702, {}],
    [
        "ReferenceData.ClientProfileData",
        0x1703,
        {
            fields: [
                {
                    name: "profiles",
                    type: "array",
                    fields: [
                        { name: "profileId", type: "uint32" },
                        {
                            name: "profileData",
                            type: "schema",
                            fields: [
                                { name: "profileId", type: "uint32" },
                                { name: "nameId", type: "uint32" },
                                { name: "descriptionId", type: "uint32" },
                                { name: "profileType", type: "uint32" },
                                { name: "iconId", type: "uint32" },
                                { name: "unknownDword6", type: "uint32" },
                                { name: "unknownDword7", type: "uint32" },
                                { name: "unknownDword8", type: "uint32" },
                                { name: "unknownDword9", type: "uint32" },
                                { name: "unknownBoolean1", type: "boolean" },
                                { name: "unknownBoolean2", type: "boolean" },
                                { name: "unknownDword10", type: "uint32" },
                                { name: "unknownDword11", type: "uint32" },
                                {
                                    name: "unknownArray1",
                                    type: "array",
                                    fields: [
                                        { name: "unknownDword1", type: "uint32" },
                                        { name: "unknownDword2", type: "uint32" },
                                    ],
                                },
                                { name: "firstPersonArms1", type: "uint32" },
                                { name: "firstPersonArms2", type: "uint32" },
                                { name: "unknownDword14", type: "uint32" },
                                {
                                    name: "unknownArray2",
                                    type: "array",
                                    fields: [{ name: "unknownDword1", type: "uint32" }],
                                },
                                { name: "unknownFloat1", type: "float" },
                                { name: "unknownFloat2", type: "float" },
                                { name: "unknownFloat3", type: "float" },
                                { name: "unknownFloat4", type: "float" },
                                { name: "unknownDword15", type: "uint32" },
                                { name: "unknownDword16", type: "uint32" },
                                { name: "unknownDword17", type: "uint32" },
                                { name: "imageSetId1", type: "uint32" },
                                { name: "imageSetId2", type: "uint32" },
                            ],
                        },
                    ],
                },
            ],
        },
    ],
    [
        "ReferenceData.WeaponDefinitions",
        0x1704,
        {
            fields: [{ name: "data", type: "byteswithlength" }],
        },
    ],
    ["ReferenceData.ProjectileDefinitions", 0x1705, {}],
    [
        "ReferenceData.VehicleDefinitions",
        0x1706,
        {
            fields: [
                {
                    name: "data",
                    type: "custom",
                    parser: parseVehicleReferenceData,
                    packer: packVehicleReferenceData,
                },
            ],
        },
    ],
    ["Objective", 0x18, {}],
    ["Debug", 0x19, {}],
    ["Ui.TaskAdd", 0x1a01, {}],
    ["Ui.TaskUpdate", 0x1a02, {}],
    ["Ui.TaskComplete", 0x1a03, {}],
    ["Ui.TaskFail", 0x1a04, {}],
    ["Ui.Unknown", 0x1a05, {}],
    ["Ui.ExecuteScript", 0x1a07, {}],
    ["Ui.StartTimer", 0x1a09, {}],
    ["Ui.ResetTimer", 0x1a0a, {}],
    ["Ui.ObjectiveTargetUpdate", 0x1a0d, {}],
    ["Ui.Message", 0x1a0e, {}],
    ["Ui.CinematicStartLookAt", 0x1a0f, {}],
    ["Ui.WeaponHitFeedback", 0x1a10, {}],
    ["Ui.HeadShotFeedback", 0x1a11, {}],
    ["Ui.WaypointCooldown", 0x1a14, {}],
    ["Ui.ZoneWaypoint", 0x1a15, {}],
    ["Ui.WaypointNotify", 0x1a16, {}],
    ["Ui.ContinentDominationNotification", 0x1a17, {}],
    ["Ui.InteractStart", 0x1a18, {}],
    ["Ui.SomeInteractionThing", 0x1a19, {}],
    ["Ui.RewardNotification", 0x1a1a, {}],
    ["Ui.WarpgateRotateWarning", 0x1a1b, {}],
    ["Ui.SystemBroadcast", 0x1a1c, {}],
    ["Quest", 0x1b, {}],
    ["Reward", 0x1c, {}],
    [
        "GameTimeSync",
        0x1d,
        {
            fields: [
                { name: "time", type: "uint64" },
                { name: "unknownFloat1", type: "float" },
                { name: "unknownBoolean1", type: "boolean" },
            ],
        },
    ],
    ["Pet", 0x1e, {}],
    ["PointOfInterestDefinitionRequest", 0x1f, {}],
    ["PointOfInterestDefinitionReply", 0x20, {}],
    ["WorldTeleportRequest", 0x21, {}],
    ["Trade", 0x22, {}],
    ["EscrowGivePackage", 0x23, {}],
    ["EscrowGotPackage", 0x24, {}],
    ["UpdateEncounterDataCommon", 0x25, {}],
    ["Recipe", 0x26, {}],
    ["InGamePurchase.PreviewOrderRequest", 0x270100, {}],
    ["InGamePurchase.PreviewOrderResponse", 0x270200, {}],
    ["InGamePurchase.PlaceOrderRequest", 0x270300, {}],
    ["InGamePurchase.PlaceOrderResponse", 0x270400, {}],
    [
        "InGamePurchase.StoreBundles",
        0x270500,
        {
            fields: [
                { name: "unknownDword1", type: "uint32" },
                { name: "unknownDword2", type: "uint32" },
                { name: "storeId", type: "uint32" },
                { name: "unknownDword3", type: "uint32" },
                { name: "unknownDword4", type: "uint32" },
                {
                    name: "imageData",
                    type: "schema",
                    fields: [
                        { name: "imageSetId", type: "string" },
                        { name: "imageTintValue", type: "string" },
                    ],
                },
                {
                    name: "storeBundles",
                    type: "array",
                    fields: [
                        { name: "bundleId", type: "uint32" },
                        {
                            name: "appStoreBundle",
                            type: "schema",
                            fields: [
                                {
                                    name: "storeBundle",
                                    type: "schema",
                                    fields: [
                                        {
                                            name: "marketingBundle",
                                            type: "schema",
                                            fields: [
                                                { name: "bundleId", type: "uint32" },
                                                { name: "nameId", type: "uint32" },
                                                { name: "descriptionId", type: "uint32" },
                                                { name: "unknownDword4", type: "uint32" },
                                                {
                                                    name: "imageData",
                                                    type: "schema",
                                                    fields: [
                                                        { name: "imageSetId", type: "string" },
                                                        { name: "imageTintValue", type: "string" },
                                                    ],
                                                },
                                                { name: "unknownBoolean1", type: "boolean" },
                                                { name: "unknownString1", type: "string" },
                                                { name: "stationCurrencyId", type: "uint32" },
                                                { name: "price", type: "uint32" },
                                                { name: "currencyId", type: "uint32" },
                                                { name: "currencyPrice", type: "uint32" },
                                                { name: "unknownDword9", type: "uint32" },
                                                { name: "unknownTime1", type: "uint64" },
                                                { name: "unknownTime2", type: "uint64" },
                                                { name: "unknownDword10", type: "uint32" },
                                                { name: "unknownBoolean2", type: "boolean" },
                                                {
                                                    name: "itemListDetails",
                                                    type: "array",
                                                    fields: [
                                                        { name: "unknownDword1", type: "uint32" },
                                                        { name: "imageSetId", type: "uint32" },
                                                        { name: "itemId", type: "uint32" },
                                                        { name: "unknownString1", type: "string" },
                                                    ],
                                                },
                                            ],
                                        },
                                        { name: "storeId", type: "uint32" },
                                        { name: "categoryId", type: "uint32" },
                                        { name: "unknownBoolean1", type: "boolean" },
                                        { name: "unknownDword3", type: "uint32" },
                                        { name: "unknownDword4", type: "uint32" },
                                        { name: "unknownDword5", type: "uint32" },
                                        { name: "unknownDword6", type: "uint32" },
                                        { name: "unknownDword7", type: "uint32" },
                                        { name: "unknownDword8", type: "uint32" },
                                        { name: "unknownDword9", type: "uint32" },
                                        { name: "unknownDword10", type: "uint32" },
                                        { name: "unknownBoolean2", type: "boolean" },
                                        { name: "unknownBoolean3", type: "boolean" },
                                        { name: "unknownBoolean4", type: "boolean" },
                                    ],
                                },
                                { name: "unknownDword1", type: "uint32" },
                                { name: "unknownDword2", type: "uint32" },
                                { name: "unknownDword3", type: "uint32" },
                                { name: "unknownDword4", type: "uint32" },
                                { name: "unknownDword5", type: "uint32" },
                                { name: "unknownDword6", type: "uint32" },
                                { name: "unknownString1", type: "string" },
                                { name: "unknownDword7", type: "uint32" },
                                { name: "unknownDword8", type: "uint32" },
                                { name: "unknownDword9", type: "uint32" },
                                { name: "memberSalePrice", type: "uint32" },
                                { name: "unknownDword11", type: "uint32" },
                                { name: "unknownString2", type: "string" },
                                { name: "unknownDword12", type: "uint32" },
                                { name: "unknownBoolean1", type: "boolean" },
                            ],
                        },
                    ],
                },
                { name: "offset", type: "debugoffset" },
            ],
        },
    ],
    ["InGamePurchase.StoreBundleStoreUpdate", 0x270501, {}],
    ["InGamePurchase.StoreBundleStoreBundleUpdate", 0x270502, {}],
    ["InGamePurchase.StoreBundleCategoryGroups", 0x270600, {}],
    [
        "InGamePurchase.StoreBundleCategories",
        0x270700,
        {
            fields: [
                {
                    name: "categories",
                    type: "array",
                    fields: [
                        { name: "categoryId", type: "uint32" },
                        {
                            name: "categoryData",
                            type: "schema",
                            fields: [
                                { name: "categoryId", type: "uint32" },
                                { name: "unknownDword1", type: "uint32" },
                                { name: "name", type: "string" },
                                { name: "unknownDword2", type: "uint32" },
                                { name: "unknownDword3", type: "uint32" },
                                { name: "unknownDword4", type: "uint32" },
                                { name: "unknownBoolean1", type: "boolean" },
                                { name: "unknownDword5", type: "uint32" },
                            ],
                        },
                    ],
                },
            ],
        },
    ],
    ["InGamePurchase.ExclusivePartnerStoreBundles", 0x270800, {}],
    ["InGamePurchase.StoreBundleGroups", 0x270900, {}],
    ["InGamePurchase.WalletInfoRequest", 0x270a00, {}],
    [
        "InGamePurchase.WalletInfoResponse",
        0x270b00,
        {
            fields: [
                { name: "unknownDword1", type: "uint32" },
                { name: "unknownBoolean1", type: "boolean" },
                { name: "unknownDword2", type: "uint32" },
                { name: "unknownDword3", type: "uint32" },
                { name: "unknownString1", type: "string" },
                { name: "unknownString2", type: "string" },
                { name: "unknownBoolean2", type: "boolean" },
            ],
        },
    ],
    ["InGamePurchase.ServerStatusRequest", 0x270c00, {}],
    ["InGamePurchase.ServerStatusResponse", 0x270d00, {}],
    ["InGamePurchase.StationCashProductsRequest", 0x270e00, {}],
    ["InGamePurchase.StationCashProductsResponse", 0x270f00, {}],
    ["InGamePurchase.CurrencyCodesRequest", 0x271000, {}],
    ["InGamePurchase.CurrencyCodesResponse", 0x271100, {}],
    ["InGamePurchase.StateCodesRequest", 0x271200, {}],
    ["InGamePurchase.StateCodesResponse", 0x271300, {}],
    ["InGamePurchase.CountryCodesRequest", 0x271400, {}],
    ["InGamePurchase.CountryCodesResponse", 0x271500, {}],
    ["InGamePurchase.SubscriptionProductsRequest", 0x271600, {}],
    ["InGamePurchase.SubscriptionProductsResponse", 0x271700, {}],
    [
        "InGamePurchase.EnableMarketplace",
        0x271800,
        {
            fields: [
                { name: "unknownBoolean1", type: "boolean" },
                { name: "unknownBoolean2", type: "boolean" },
            ],
        },
    ],
    [
        "InGamePurchase.AcccountInfoRequest",
        0x271900,
        {
            fields: [{ name: "locale", type: "string" }],
        },
    ],
    ["InGamePurchase.AcccountInfoResponse", 0x271a00, {}],
    ["InGamePurchase.StoreBundleContentRequest", 0x271b00, {}],
    ["InGamePurchase.StoreBundleContentResponse", 0x271c00, {}],
    ["InGamePurchase.ClientStatistics", 0x271d00, {}],
    ["InGamePurchase.SendMannequinStoreBundlesToClient", 0x271e00, {}],
    ["InGamePurchase.DisplayMannequinStoreBundles", 0x271f00, {}],
    [
        "InGamePurchase.ItemOfTheDay",
        0x272000,
        {
            fields: [{ name: "bundleId", type: "uint32" }],
        },
    ],
    ["InGamePurchase.EnablePaymentSources", 0x272100, {}],
    ["InGamePurchase.SetMembershipFreeItemInfo", 0x272200, {}],
    ["InGamePurchase.WishListAddBundle", 0x272300, {}],
    ["InGamePurchase.WishListRemoveBundle", 0x272400, {}],
    ["InGamePurchase.PlaceOrderRequestClientTicket", 0x272500, {}],
    ["InGamePurchase.GiftOrderNotification", 0x272600, {}],
    [
        "InGamePurchase.ActiveSchedules",
        0x272700,
        {
            fields: [
                {
                    name: "unknown1",
                    type: "array",
                    fields: [{ name: "id", type: "uint32" }],
                },
                { name: "unknown2", type: "uint32" },
                {
                    name: "unknown3",
                    type: "array",
                    fields: [
                        { name: "scheduleId", type: "uint32" },
                        { name: "time", type: "uint32" },
                        { name: "unknown1", type: "uint32" },
                        { name: "unknown2", type: "uint8" },
                        { name: "unknown3", type: "uint8" },
                        { name: "unknown4", type: "uint8" },
                        { name: "unknown5", type: "uint8" },
                    ],
                },
            ],
        },
    ],
    ["InGamePurchase.LoyaltyInfoAndStoreRequest", 0x272800, {}],
    ["InGamePurchase.NudgeOfferNotification", 0x272900, {}],
    ["InGamePurchase.NudgeRequestStationCashProducts", 0x272a00, {}],
    ["InGamePurchase.SpiceWebAuthUrlRequest", 0x272b00, {}],
    ["InGamePurchase.SpiceWebAuthUrlResponse", 0x272c00, {}],
    ["InGamePurchase.BundlePriceUpdate", 0x272d00, {}],
    ["InGamePurchase.WalletBalanceUpdate", 0x272e00, {}],
    ["InGamePurchase.MemberFreeItemCount", 0x272f00, {}],
    [
        "QuickChat.SendData",
        0x280100,
        {
            fields: [
                {
                    name: "commands",
                    type: "array",
                    fields: [
                        { name: "commandId", type: "uint32" },
                        {
                            name: "commandData",
                            type: "schema",
                            fields: [
                                { name: "commandId", type: "uint32" },
                                { name: "menuStringId", type: "uint32" },
                                { name: "chatStringId", type: "uint32" },
                                { name: "unknownDword1", type: "uint32" },
                                { name: "unknownDword2", type: "uint32" },
                                { name: "unknownDword3", type: "uint32" },
                                { name: "unknownDword4", type: "uint32" },
                                { name: "unknownDword5", type: "uint32" },
                                { name: "unknownDword6", type: "uint32" },
                                { name: "unknownDword7", type: "uint32" },
                            ],
                        },
                    ],
                },
            ],
        },
    ],
    ["QuickChat.SendTell", 0x2802, {}],
    ["QuickChat.SendChatToChannel", 0x2803, {}],
    ["Report", 0x29, {}],
    ["LiveGamer", 0x2a, {}],
    ["Acquaintance", 0x2b, {}],
    ["ClientServerShuttingDown", 0x2c, {}],
    [
        "Friend.List",
        0x2d01,
        {
            fields: [
                {
                    name: "friends",
                    type: "array",
                    fields: [
                        { name: "unknown1", type: "uint32" },
                        { name: "unknown2", type: "uint32" },
                        { name: "unknown3", type: "uint32" },
                        { name: "characterName", type: "string" },
                        { name: "unknown4", type: "uint32" },
                        { name: "characterId", type: "uint64" },
                        {
                            name: "is_online_data",
                            type: "variabletype8",
                            types: {
                                0: [
                                    { name: "unknown5", type: "uint32" },
                                    { name: "unknown6", type: "uint32" },
                                ],
                                1: [
                                    { name: "unknown5", type: "uint32" },
                                    { name: "unknown6", type: "uint32" },
                                    { name: "unknown7", type: "uint32" },
                                    { name: "unknown8", type: "uint32" },
                                    { name: "unknown9", type: "uint8" },
                                    { name: "location_x", type: "float" },
                                    { name: "location_y", type: "float" },
                                    { name: "unknown10", type: "uint32" },
                                    { name: "unknown11", type: "uint32" },
                                    { name: "unknown12", type: "uint32" },
                                    { name: "unknown13", type: "uint32" },
                                    { name: "unknown14", type: "uint8" },
                                ],
                            },
                        },
                    ],
                },
            ],
        },
    ],
    ["Friend.Online", 0x2d02, {}],
    ["Friend.Offline", 0x2d03, {}],
    ["Friend.UpdateProfileInfo", 0x2d04, {}],
    ["Friend.UpdatePositions", 0x2d05, {}],
    ["Friend.Add", 0x2d06, {}],
    ["Friend.Remove", 0x2d07, {}],
    [
        "Friend.Message",
        0x2d08,
        {
            fields: [
                { name: "messageType", type: "uint8" },
                { name: "messageTime", type: "uint64" },
                {
                    name: "messageData1",
                    type: "schema",
                    fields: [
                        { name: "unknowndDword1", type: "uint32" },
                        { name: "unknowndDword2", type: "uint32" },
                        { name: "unknowndDword3", type: "uint32" },
                        { name: "characterName", type: "string" },
                        { name: "unknownString1", type: "string" },
                    ],
                },
                {
                    name: "messageData2",
                    type: "schema",
                    fields: [
                        { name: "unknowndDword1", type: "uint32" },
                        { name: "unknowndDword2", type: "uint32" },
                        { name: "unknowndDword3", type: "uint32" },
                        { name: "characterName", type: "string" },
                        { name: "unknownString1", type: "string" },
                    ],
                },
            ],
        },
    ],
    ["Friend.Status", 0x2d09, {}],
    ["Friend.Rename", 0x2d0a, {}],
    ["Broadcast", 0x2e, {}],
    ["ClientKickedFromServer", 0x2f, {}],
    [
        "UpdateClientSessionData",
        0x30,
        {
            fields: [
                { name: "sessionId", type: "string" },
                { name: "stationName", type: "string" },
                { name: "unknownBoolean1", type: "boolean" },
                { name: "unknownString1", type: "string" },
                { name: "unknownString2", type: "string" },
                { name: "stationCode", type: "string" },
                { name: "unknownString3", type: "string" },
            ],
        },
    ],
    ["BugSubmission", 0x31, {}],
    [
        "WorldDisplayInfo",
        0x32,
        {
            fields: [{ name: "worldId", type: "uint32" }],
        },
    ],
    ["MOTD", 0x33, {}],
    [
        "SetLocale",
        0x34,
        {
            fields: [{ name: "locale", type: "string" }],
        },
    ],
    ["SetClientArea", 0x35, {}],
    ["ZoneTeleportRequest", 0x36, {}],
    ["TradingCard", 0x37, {}],
    ["WorldShutdownNotice", 0x38, {}],
    ["LoadWelcomeScreen", 0x39, {}],
    ["ShipCombat", 0x3a, {}],
    ["AdminMiniGame", 0x3b, {}],
    [
        "KeepAlive",
        0x3c,
        {
            fields: [{ name: "gameTime", type: "uint32" }],
        },
    ],
    ["ClientExitLaunchUrl", 0x3d, {}],
    ["ClientPath", 0x3e, {}],
    ["ClientPendingKickFromServer", 0x3f, {}],
    [
        "MembershipActivation",
        0x40,
        {
            fields: [{ name: "unknown", type: "uint32" }],
        },
    ],
    ["Lobby.JoinLobbyGame", 0x4101, {}],
    ["Lobby.LeaveLobbyGame", 0x4102, {}],
    ["Lobby.StartLobbyGame", 0x4103, {}],
    ["Lobby.UpdateLobbyGame", 0x4104, {}],
    ["Lobby.SendLobbyToClient", 0x4106, {}],
    ["Lobby.SendLeaveLobbyToClient", 0x4107, {}],
    ["Lobby.RemoveLobbyGame", 0x4108, {}],
    ["Lobby.LobbyErrorMessage", 0x410b, {}],
    ["Lobby.ShowLobbyUi", 0x410c, {}],
    [
        "LobbyGameDefinition.DefinitionsRequest",
        0x420100,
        {
            fields: [],
        },
    ],
    [
        "LobbyGameDefinition.DefinitionsResponse",
        0x420200,
        {
            fields: [{ name: "definitionsData", type: "byteswithlength" }],
        },
    ],
    ["ShowSystemMessage", 0x43, {}],
    ["POIChangeMessage", 0x44, {}],
    ["ClientMetrics", 0x45, {}],
    ["FirstTimeEvent", 0x46, {}],
    ["Claim", 0x47, {}],
    [
        "ClientLog",
        0x48,
        {
            fields: [
                { name: "file", type: "string" },
                { name: "message", type: "string" },
            ],
        },
    ],
    ["Ignore", 0x49, {}],
    ["SnoopedPlayer", 0x4a, {}],
    ["Promotional", 0x4b, {}],
    ["AddClientPortraitCrc", 0x4c, {}],
    ["ObjectiveTarget", 0x4d, {}],
    ["CommerceSessionRequest", 0x4e, {}],
    ["CommerceSessionResponse", 0x4f, {}],
    ["TrackedEvent", 0x50, {}],
    ["LoginFailed", 0x51, {}],
    ["LoginToUChat", 0x52, {}],
    ["ZoneSafeTeleportRequest", 0x53, {}],
    ["RemoteInteractionRequest", 0x54, {}],
    ["UpdateCamera", 0x55, {}],
    ["Housing", 0x56, {}],
    ["Guild.Disband", 0x5702, {}],
    ["Guild.Rename", 0x5703, {}],
    ["Guild.ChangeMemberRank", 0x570a, {}],
    ["Guild.MotdUpdate", 0x570b, {}],
    ["Guild.UpdateRank", 0x570e, {}],
    ["Guild.DataFull", 0x570f, {}],
    ["Guild.Data", 0x5710, {}],
    ["Guild.Invitations", 0x5711, {}],
    ["Guild.AddMember", 0x5712, {}],
    ["Guild.RemoveMember", 0x5713, {}],
    ["Guild.UpdateInvitation", 0x5714, {}],
    ["Guild.MemberOnlineStatus", 0x5715, {}],
    ["Guild.TagsUpdated", 0x5716, {}],
    ["Guild.Notification", 0x5717, {}],
    ["Guild.UpdateAppData", 0x5720, {}],
    ["Guild.RecruitingGuildsForBrowserReply", 0x5726, {}],
    ["Broker", 0x58, {}],
    ["GuildAdmin", 0x59, {}],
    ["AdminBroker", 0x5a, {}],
    ["BattleMages", 0x5b, {}],
    ["WorldToWorld", 0x5c, {}],
    ["PerformAction", 0x5d, {}],
    ["EncounterMatchmaking", 0x5e, {}],
    ["ClientLuaMetrics", 0x5f, {}],
    ["RepeatingActivity", 0x60, {}],
    [
        "ClientGameSettings",
        0x61,
        {
            fields: [
                { name: "unknownDword1", type: "uint32" },
                { name: "unknownDword2", type: "uint32" },
                { name: "unknownBoolean1", type: "boolean" },
                { name: "unknownFloat1", type: "float" },
                { name: "unknownDword3", type: "uint32" },
                { name: "unknownDword4", type: "uint32" },
                { name: "unknownDword5", type: "uint32" },
                { name: "unknownFloat2", type: "float" },
                { name: "unknownFloat3", type: "float" },
            ],
        },
    ],
    ["ClientTrialProfileUpsell", 0x62, {}],
    ["ActivityManager.ProfileList", 0x6301, {}],
    ["ActivityManager.JoinError", 0x6302, {}],
    ["RequestSendItemDefinitionsToClient", 0x64, {}],
    ["Inspect", 0x65, {}],
    [
        "Achievement.Add",
        0x6602,
        {
            fields: [
                { name: "achievementId", type: "uint32" },
                {
                    name: "achievementData",
                    type: "schema",
                    fields: objectiveDataSchema,
                },
            ],
        },
    ],
    [
        "Achievement.Initialize",
        0x6603,
        {
            fields: [
                {
                    name: "clientAchievements",
                    type: "array",
                    fields: achievementDataSchema,
                },
                {
                    name: "achievementData",
                    type: "byteswithlength",
                    fields: [
                        {
                            name: "achievements",
                            type: "array",
                            fields: achievementDataSchema,
                        },
                    ],
                },
            ],
        },
    ],
    ["Achievement.Complete", 0x6604, {}],
    ["Achievement.ObjectiveAdded", 0x6605, {}],
    ["Achievement.ObjectiveActivated", 0x6606, {}],
    ["Achievement.ObjectiveUpdate", 0x6607, {}],
    ["Achievement.ObjectiveComplete", 0x6608, {}],
    [
        "PlayerTitle",
        0x67,
        {
            fields: [
                { name: "unknown1", type: "uint8" },
                { name: "titleId", type: "uint32" },
            ],
        },
    ],
    ["Fotomat", 0x68, {}],
    ["UpdateUserAge", 0x69, {}],
    ["Loot", 0x6a, {}],
    ["ActionBarManager", 0x6b, {}],
    ["ClientTrialProfileUpsellRequest", 0x6c, {}],
    ["AdminSocialProfile", 0x6d, {}],
    ["SocialProfile", 0x6e, {}],
    ["PlayerUpdateJump", 0x6f, {}],
    [
        "CoinStore.ItemList",
        0x700100,
        {
            fields: [
                {
                    name: "items",
                    type: "array",
                    fields: [
                        { name: "itemId", type: "uint32" },
                        {
                            name: "itemData",
                            type: "schema",
                            fields: [
                                { name: "itemId2", type: "uint32" },
                                { name: "unknownDword1", type: "uint32" },
                                { name: "unknownBoolean1", type: "boolean" },
                                { name: "unknownBoolean2", type: "boolean" },
                            ],
                        },
                    ],
                },
                { name: "unknown1", type: "uint32" },
            ],
        },
    ],
    ["CoinStore.ItemDefinitionsRequest", 0x700200, {}],
    ["CoinStore.ItemDefinitionsResponse", 0x700300, {}],
    [
        "CoinStore.SellToClientRequest",
        0x700400,
        {
            fields: [
                { name: "unknown1", type: "uint32" },
                { name: "unknown2", type: "uint32" },
                { name: "itemId", type: "uint32" },
                { name: "unknown4", type: "uint32" },
                { name: "quantity", type: "uint32" },
                { name: "unknown6", type: "uint32" },
            ],
        },
    ],
    ["CoinStore.BuyFromClientRequest", 0x700500, {}],
    [
        "CoinStore.TransactionComplete",
        0x700600,
        {
            fields: [
                { name: "unknown1", type: "uint32" },
                { name: "unknown2", type: "uint32" },
                { name: "unknown3", type: "uint32" },
                { name: "unknown4", type: "uint32" },
                { name: "unknown5", type: "uint32" },
                { name: "unknown6", type: "uint32" },
                { name: "unknown7", type: "uint32" },
                { name: "unknown8", type: "uint32" },
                { name: "timestamp", type: "uint32" },
                { name: "unknown9", type: "uint32" },
                { name: "itemId", type: "uint32" },
                { name: "unknown10", type: "uint32" },
                { name: "quantity", type: "uint32" },
                { name: "unknown11", type: "uint32" },
                { name: "unknown12", type: "uint8" },
            ],
        },
    ],
    ["CoinStore.Open", 0x700700, {}],
    ["CoinStore.ItemDynamicListUpdateRequest", 0x700800, {}],
    ["CoinStore.ItemDynamicListUpdateResponse", 0x700900, {}],
    ["CoinStore.MerchantList", 0x700a00, {}],
    ["CoinStore.ClearTransactionHistory", 0x700b00, {}],
    ["CoinStore.BuyBackRequest", 0x700c00, {}],
    ["CoinStore.BuyBackResponse", 0x700d00, {}],
    ["CoinStore.SellToClientAndGiftRequest", 0x700e00, {}],
    ["CoinStore.ReceiveGiftItem", 0x701100, {}],
    ["CoinStore.GiftTransactionComplete", 0x701200, {}],
    [
        "InitializationParameters",
        0x71,
        {
            fields: [
                { name: "environment", type: "string" },
                { name: "serverId", type: "uint32" },
            ],
        },
    ],
    ["ActivityService.Activity.ListOfActivities", 0x720101, {}],
    ["ActivityService.Activity.UpdateActivityFeaturedStatus", 0x720105, {}],
    ["ActivityService.ScheduledActivity.ListOfActivities", 0x720201, {}],
    ["Mount.MountRequest", 0x7301, {}],
    [
        "Mount.MountResponse",
        0x7302,
        {
            fields: [
                { name: "characterId", type: "uint64" },
                { name: "guid", type: "uint64" },
                { name: "unknownDword1", type: "uint32" },
                { name: "unknownDword2", type: "uint32" },
                { name: "unknownDword3", type: "uint32" },
                { name: "unknownDword4", type: "uint32" },
                {
                    name: "characterData",
                    type: "schema",
                    fields: [
                        { name: "unknownDword1", type: "uint32" },
                        { name: "unknownDword2", type: "uint32" },
                        { name: "unknownDword3", type: "uint32" },
                        { name: "characterName", type: "string" },
                        { name: "unknownString1", type: "string" },
                    ],
                },
                { name: "tagString", type: "string" },
                { name: "unknownDword5", type: "uint32" },
            ],
        },
    ],
    [
        "Mount.DismountRequest",
        0x7303,
        {
            fields: [{ name: "unknownByte1", type: "uint8" }],
        },
    ],
    [
        "Mount.DismountResponse",
        0x7304,
        {
            fields: [
                { name: "characterId", type: "uint64" },
                { name: "guid", type: "uint64" },
                { name: "unknownDword1", type: "uint32" },
                { name: "unknownBoolean1", type: "boolean" },
                { name: "unknownByte1", type: "uint8" },
            ],
        },
    ],
    ["Mount.List", 0x7305, {}],
    ["Mount.Spawn", 0x7306, {}],
    ["Mount.Despawn", 0x7307, {}],
    ["Mount.SpawnByItemDefinitionId", 0x7308, {}],
    ["Mount.OfferUpsell", 0x7309, {}],
    ["Mount.SeatChangeRequest", 0x730a, {}],
    ["Mount.SeatChangeResponse", 0x730b, {}],
    ["Mount.SeatSwapRequest", 0x730c, {}],
    ["Mount.SeatSwapResponse", 0x730d, {}],
    ["Mount.TypeCount", 0x730e, {}],
    [
        "ClientInitializationDetails",
        0x74,
        {
            fields: [{ name: "unknownDword1", type: "uint32" }],
        },
    ],
    ["ClientAreaTimer", 0x75, {}],
    ["LoyaltyReward", 0x76, {}],
    ["Rating", 0x77, {}],
    ["ClientActivityLaunch", 0x78, {}],
    ["ServerActivityLaunch", 0x79, {}],
    ["ClientFlashTimer", 0x7a, {}],
    ["InviteAndStartMiniGame", 0x7b, {}],
    [
        "PlayerUpdate.UpdatePositionZoneToClient",
        0x7c,
        {
            fields: [{ name: "unknown1", type: "uint32" }],
        },
    ],
    ["PlayerUpdate.Flourish", 0x7d, {}],
    ["Quiz", 0x7e, {}],
    ["PlayerUpdate.PositionOnPlatform", 0x7f, {}],
    ["ClientMembershipVipInfo", 0x80, {}],
    ["Target", 0x81, {}],
    ["GuideStone", 0x82, {}],
    ["Raid", 0x83, {}],
    [
        "Voice.Login",
        0x8400,
        {
            fields: [
                { name: "clientName", type: "string" },
                { name: "sessionId", type: "string" },
                { name: "url", type: "string" },
                { name: "characterName", type: "string" },
            ],
        },
    ],
    [
        "Voice.JoinChannel",
        0x8401,
        {
            fields: [
                { name: "roomType", type: "uint8" },
                { name: "uri", type: "string" },
                { name: "unknown1", type: "uint32" },
            ],
        },
    ],
    ["Voice.LeaveChannel", 0x8402, {}],
    [
        "Weapon.Weapon",
        0x8500,
        {
        // fields: [
        //     { name: "weaponPacket",                         type: "custom", parser: parseWeaponPacket, packer: packWeaponPacket }
        // ]
        },
    ],
    [
        "Facility.ReferenceData",
        0x8701,
        {
            fields: [{ name: "data", type: "byteswithlength" }],
        },
    ],
    [
        "Facility.FacilityData",
        0x8702,
        {
            fields: [
                { name: "unknown1_uint32", type: "uint32" },
                {
                    name: "facilities",
                    type: "array",
                    fields: [
                        { name: "facilityId", type: "uint32" },
                        { name: "facilityType", type: "uint8" },
                        { name: "unknown2_uint8", type: "uint8" },
                        { name: "regionId", type: "uint32" },
                        { name: "nameId", type: "uint32" },
                        { name: "locationX", type: "float" },
                        { name: "locationY", type: "float" },
                        { name: "locationZ", type: "float" },
                        { name: "unknown3_float", type: "float" },
                        { name: "imageSetId", type: "uint32" },
                        { name: "unknown5_uint32", type: "uint32" },
                        { name: "unknown6_uint8", type: "uint8" },
                        { name: "unknown7_uint8", type: "uint8" },
                    ],
                },
            ],
        },
    ],
    ["Facility.CurrentFacilityUpdate", 0x8703, {}],
    ["Facility.SpawnDataRequest", 0x8704, {}],
    ["Facility.FacilitySpawnData", 0x8705, {}],
    [
        "Facility.FacilityUpdate",
        0x8706,
        {
            fn: function (data, offset) {
                var result = {}, startOffset = offset, n, i, values, flags;
                result["facilityId"] = data.readUInt32LE(offset);
                flags = data.readUInt16LE(offset + 4);
                result["flags"] = flags;
                offset += 6;
                if (flags & 1) {
                    result["unknown1"] = data.readUInt8(offset);
                    offset += 1;
                }
                if ((flags >> 1) & 1) {
                    n = data.readUInt32LE(offset);
                    values = [];
                    for (i = 0; i < n; i++) {
                        values[i] = data.readUInt8(offset + 4 + i);
                    }
                    result["unknown2"] = values;
                    offset += 4 + n;
                }
                if ((flags >> 2) & 1) {
                    result["unknown3"] = data.readUInt8(offset);
                    offset += 1;
                }
                if ((flags >> 3) & 1) {
                    n = data.readUInt32LE(offset);
                    values = [];
                    for (i = 0; i < n; i++) {
                        values[i] = data.readUInt8(offset + 4 + i);
                    }
                    result["unknown4"] = values;
                    offset += 4 + n;
                }
                if ((flags >> 4) & 1) {
                    n = data.readUInt32LE(offset);
                    values = [];
                    for (i = 0; i < n; i++) {
                        values[i] = data.readUInt8(offset + 4 + i);
                    }
                    result["unknown5"] = values;
                    offset += 4 + n;
                }
                if ((flags >> 5) & 1) {
                    values = [];
                    for (i = 0; i < 4; i++) {
                        values[i] = data.readUInt8(offset + i);
                    }
                    result["unknown6"] = values;
                    offset += 4;
                }
                if ((flags >> 6) & 1) {
                    result["unknown7"] = data.readUInt8(offset);
                    offset += 1;
                }
                if ((flags >> 8) & 1) {
                    result["unknown8"] = data.readUInt8(offset);
                    offset += 1;
                }
                if ((flags >> 10) & 1) {
                    result["unknown9"] = data.readUInt8(offset);
                    offset += 1;
                }
                if ((flags >> 11) & 1) {
                    result["unknown10"] = [
                        data.readUInt32LE(offset),
                        data.readUInt32LE(offset + 4),
                    ];
                    offset += 8;
                }
                if ((flags >> 12) & 1) {
                    result["unknown11"] = data.readUInt8(offset);
                    offset += 1;
                }
                if ((flags >> 13) & 1) {
                    result["unknown12"] = data.readUInt32LE(offset);
                    offset += 4;
                }
                return {
                    result: result,
                    length: offset - startOffset,
                };
            },
        },
    ],
    ["Facility.FacilitySpawnStatus", 0x8707, {}],
    ["Facility.FacilitySpawnStatusTracked", 0x8708, {}],
    ["Facility.NotificationFacilityCaptured", 0x8709, {}],
    ["Facility.NotificationFacilitySignificantCaptureProgress", 0x870a, {}],
    ["Facility.NotificationFacilityCloseToCapture", 0x870b, {}],
    ["Facility.NotificationFacilitySpawnBeginCapture", 0x870c, {}],
    ["Facility.NotificationFacilitySpawnFinishCapture", 0x870d, {}],
    ["Facility.NotificationLeavingFacilityDuringContention", 0x870e, {}],
    ["Facility.ProximitySpawnCaptureUpdate", 0x870f, {}],
    ["Facility.ClearProximitySpawn", 0x8710, {}],
    ["Facility.GridStabilizeTimerUpdated", 0x8711, {}],
    [
        "Facility.SpawnCollisionChanged",
        0x8712,
        {
            fields: [
                { name: "unknown1", type: "uint32" },
                { name: "unknown2", type: "boolean" },
                { name: "unknown3", type: "uint32" },
            ],
        },
    ],
    ["Facility.NotificationFacilitySecondaryObjectiveEventPacket", 0x8713, {}],
    ["Facility.PenetrateShieldEffect", 0x8714, {}],
    ["Facility.SpawnUpdateGuid", 0x8715, {}],
    ["Facility.FacilityUpdateRequest", 0x8716, {}],
    ["Facility.EmpireScoreValueUpdate", 0x8717, {}],
    ["Facility.FacilityTypePropertyUpdate", 0x8718, {}],
    ["Skill.Echo", 0x8801, {}],
    ["Skill.SelectSkillSet", 0x8802, {}],
    ["Skill.SelectSkill", 0x8803, {}],
    ["Skill.GetSkillPointManager", 0x8804, {}],
    ["Skill.SetLoyaltyPoints", 0x8805, {}],
    ["Skill.LoadSkillDefinitionManager", 0x8806, {}],
    ["Skill.SetSkillPointManager", 0x8807, {}],
    [
        "Skill.SetSkillPointProgress",
        0x8808,
        {
            fields: [
                { name: "unknown1", type: "uint32" },
                { name: "unknown2", type: "float" },
                { name: "unknown3", type: "float" },
            ],
        },
    ],
    ["Skill.AddSkill", 0x8809, {}],
    ["Skill.ReportSkillGrant", 0x880a, {}],
    ["Skill.ReportOfflineEarnedSkillPoints", 0x880b, {}],
    ["Skill.ReportDeprecatedSkillLine", 0x880c, {}],
    ["Loadout.LoadLoadoutDefinitionManager", 0x8901, {}],
    ["Loadout.SelectLoadout", 0x8902, {}],
    [
        "Loadout.SetCurrentLoadout",
        0x8903,
        {
            fields: [
                { name: "type", type: "uint8" },
                { name: "unknown1", type: "uint8" },
                { name: "loadoutId", type: "uint32" },
                { name: "tabId", type: "uint32" },
                { name: "unknown2", type: "uint32" },
            ],
        },
    ],
    [
        "Loadout.SelectSlot",
        0x8904,
        {
            fields: [
                { name: "type", type: "uint8" },
                { name: "unknownByte1", type: "uint8" },
                { name: "unknownByte2", type: "uint8" },
                { name: "loadoutSlotId", type: "uint32" },
                { name: "gameTime", type: "uint32" },
            ],
        },
    ],
    ["Loadout.SelectClientSlot", 0x8905, {}],
    [
        "Loadout.SetCurrentSlot",
        0x8906,
        {
            fields: [
                { name: "type", type: "uint8" },
                { name: "unknownByte1", type: "uint8" },
                { name: "slotId", type: "uint32" },
            ],
        },
    ],
    ["Loadout.CreateCustomLoadout", 0x8907, {}],
    ["Loadout.SelectSlotItem", 0x8908, {}],
    ["Loadout.UnselectSlotItem", 0x8909, {}],
    ["Loadout.SelectSlotTintItem", 0x890a, {}],
    ["Loadout.UnselectSlotTintItem", 0x890b, {}],
    ["Loadout.SelectAllSlotTintItems", 0x890c, {}],
    ["Loadout.UnselectAllSlotTintItems", 0x890d, {}],
    ["Loadout.SelectBodyTintItem", 0x890e, {}],
    ["Loadout.UnselectBodyTintItem", 0x890f, {}],
    ["Loadout.SelectAllBodyTintItems", 0x8910, {}],
    ["Loadout.UnselectAllBodyTintItems", 0x8911, {}],
    ["Loadout.SelectGuildTintItem", 0x8912, {}],
    ["Loadout.UnselectGuildTintItem", 0x8913, {}],
    ["Loadout.SelectDecalItem", 0x8914, {}],
    ["Loadout.UnselectDecalItem", 0x8915, {}],
    ["Loadout.SelectAttachmentItem", 0x8916, {}],
    ["Loadout.UnselectAttachmentItem", 0x8917, {}],
    ["Loadout.SelectCustomName", 0x8918, {}],
    ["Loadout.ActivateLoadoutTerminal", 0x8919, {}],
    [
        "Loadout.ActivateVehicleLoadoutTerminal",
        0x891a,
        {
            fields: [
                { name: "type", type: "uint8" },
                { name: "guid", type: "uint64" },
            ],
        },
    ],
    [
        "Loadout.SetLoadouts",
        0x891b,
        {
            fields: [
                { name: "type", type: "uint8" },
                { name: "guid", type: "uint64" },
                { name: "unknownDword1", type: "uint32" },
            ],
        },
    ],
    ["Loadout.AddLoadout", 0x891c, {}],
    ["Loadout.UpdateCurrentLoadout", 0x891d, {}],
    ["Loadout.UpdateLoadoutSlot", 0x891e, {}],
    ["Loadout.SetVehicleLoadouts", 0x891f, {}],
    ["Loadout.AddVehicleLoadout", 0x8920, {}],
    ["Loadout.ClearCurrentVehicleLoadout", 0x8921, {}],
    ["Loadout.UpdateVehicleLoadoutSlot", 0x8922, {}],
    ["Loadout.SetSlotTintItem", 0x8923, {}],
    ["Loadout.UnsetSlotTintItem", 0x8924, {}],
    ["Loadout.SetBodyTintItem", 0x8925, {}],
    ["Loadout.UnsetBodyTintItem", 0x8926, {}],
    ["Loadout.SetGuildTintItem", 0x8927, {}],
    ["Loadout.UnsetGuildTintItem", 0x8928, {}],
    ["Loadout.SetDecalItem", 0x8929, {}],
    ["Loadout.UnsetDecalItem", 0x892a, {}],
    ["Loadout.SetCustomName", 0x892b, {}],
    ["Loadout.UnsetCustomName", 0x892c, {}],
    ["Loadout.UpdateLoadoutSlotItemLineConfig", 0x892d, {}],
    ["Experience.SetExperience", 0x8a01, {}],
    [
        "Experience.SetExperienceRanks",
        0x8a02,
        {
            fields: [
                {
                    name: "experienceRanks",
                    type: "array",
                    fields: [
                        { name: "unknownDword1", type: "uint32" },
                        {
                            name: "experienceRankData",
                            type: "array",
                            fields: [
                                { name: "experienceRequired", type: "uint32" },
                                {
                                    name: "factionRanks",
                                    type: "array",
                                    length: 4,
                                    fields: [
                                        { name: "nameId", type: "uint32" },
                                        { name: "unknownDword2", type: "uint32" },
                                        { name: "imageSetId", type: "uint32" },
                                        {
                                            name: "rewards",
                                            type: "array",
                                            fields: [
                                                { name: "itemId", type: "uint32" },
                                                { name: "nameId", type: "uint32" },
                                                { name: "imageSetId", type: "uint32" },
                                                { name: "itemCountMin", type: "uint32" },
                                                { name: "itemCountMax", type: "uint32" },
                                                { name: "itemType", type: "uint32" },
                                            ],
                                        },
                                    ],
                                },
                            ],
                        },
                    ],
                },
            ],
        },
    ],
    [
        "Experience.SetExperienceRateTier",
        0x8a03,
        {
            fields: [
                { name: "unknownDword1", type: "uint32" },
                { name: "unknownDword2", type: "uint32" },
                { name: "unknownDword3", type: "uint32" },
                { name: "unknownDword4", type: "uint32" },
                { name: "unknownDword5", type: "uint32" },
            ],
        },
    ],
    [
        "Vehicle.Owner",
        0x8b01,
        {
            fields: [
                { name: "guid", type: "uint64" },
                { name: "characterId", type: "uint64" },
                { name: "unknownDword1", type: "uint32" },
                { name: "vehicleId", type: "uint32" },
                {
                    name: "passengers",
                    type: "array",
                    fields: [
                        {
                            name: "passengerData",
                            type: "schema",
                            fields: [
                                { name: "characterId", type: "uint64" },
                                {
                                    name: "characterData",
                                    type: "schema",
                                    fields: [
                                        { name: "unknownDword1", type: "uint32" },
                                        { name: "unknownDword2", type: "uint32" },
                                        { name: "unknownDword3", type: "uint32" },
                                        { name: "characterName", type: "string" },
                                        { name: "unknownString1", type: "string" },
                                    ],
                                },
                                { name: "unknownDword1", type: "uint32" },
                                { name: "unknownString1", type: "string" },
                            ],
                        },
                        { name: "unknownByte1", type: "uint8" },
                    ],
                },
            ],
        },
    ],
    [
        "Vehicle.Occupy",
        0x8b02,
        {
            fields: [
                { name: "guid", type: "uint64" },
                { name: "characterId", type: "uint64" },
                { name: "vehicleId", type: "uint32" },
                { name: "unknownDword1", type: "uint32" },
                {
                    name: "unknownArray1",
                    type: "array",
                    fields: [
                        { name: "unknownDword1", type: "uint32" },
                        { name: "unknownBoolean1", type: "boolean" },
                    ],
                },
                {
                    name: "passengers",
                    type: "array",
                    fields: [
                        {
                            name: "passengerData",
                            type: "schema",
                            fields: [
                                { name: "characterId", type: "uint64" },
                                {
                                    name: "characterData",
                                    type: "schema",
                                    fields: [
                                        { name: "unknownDword1", type: "uint32" },
                                        { name: "unknownDword2", type: "uint32" },
                                        { name: "unknownDword3", type: "uint32" },
                                        { name: "characterName", type: "string" },
                                        { name: "unknownString1", type: "string" },
                                    ],
                                },
                                { name: "unknownDword1", type: "uint32" },
                                { name: "unknownString1", type: "string" },
                            ],
                        },
                        { name: "unknownByte1", type: "uint8" },
                    ],
                },
                {
                    name: "unknownArray2",
                    type: "array",
                    fields: [{ name: "unknownQword1", type: "uint64" }],
                },
                {
                    name: "unknownData1",
                    type: "schema",
                    fields: [
                        { name: "unknownDword1", type: "uint32" },
                        {
                            name: "unknownData1",
                            type: "schema",
                            fields: [
                                { name: "unknownDword1", type: "uint32" },
                                { name: "unknownByte1", type: "uint8" },
                            ],
                        },
                        { name: "unknownString1", type: "string" },
                        { name: "unknownDword2", type: "uint32" },
                        { name: "unknownDword3", type: "uint32" },
                        { name: "unknownDword4", type: "uint32" },
                        { name: "unknownDword5", type: "uint32" },
                        {
                            name: "unknownArray3",
                            type: "array",
                            fields: [
                                { name: "unknownDword1", type: "uint32" },
                                {
                                    name: "unknownData1",
                                    type: "schema",
                                    fields: [
                                        { name: "unknownDword1", type: "uint32" },
                                        {
                                            name: "unknownData1",
                                            type: "schema",
                                            fields: [
                                                { name: "unknownDword1", type: "uint32" },
                                                { name: "unknownByte1", type: "uint8" },
                                                {
                                                    name: "unknownArray1",
                                                    type: "array",
                                                    fields: [{ name: "unknownDword1", type: "uint32" }],
                                                },
                                                {
                                                    name: "unknownArray2",
                                                    type: "array",
                                                    fields: [
                                                        { name: "unknownDword1", type: "uint32" },
                                                        { name: "unknownDword2", type: "uint32" },
                                                    ],
                                                },
                                            ],
                                        },
                                        { name: "unknownDword2", type: "uint32" },
                                        { name: "unknownDword3", type: "uint32" },
                                    ],
                                },
                            ],
                        },
                    ],
                },
                {
                    name: "unknownBytes1",
                    type: "byteswithlength",
                    defaultValue: null,
                    fields: [
                        {
                            name: "itemData",
                            type: "custom",
                            parser: parseItemData,
                            packer: packItemData,
                        },
                    ],
                },
                { name: "unknownBytes2", type: "byteswithlength", defaultValue: null },
            ],
        },
    ],
    [
        "Vehicle.StateData",
        0x8b03,
        {
            fields: [
                { name: "guid", type: "uint64" },
                { name: "unknown3", type: "float" },
                {
                    name: "unknown4",
                    type: "array",
                    fields: [
                        { name: "unknown1", type: "uint32" },
                        { name: "unknown2", type: "uint8" },
                    ],
                },
                {
                    name: "unknown5",
                    type: "array",
                    fields: [
                        { name: "unknown1", type: "uint32" },
                        { name: "unknown2", type: "uint8" },
                    ],
                },
            ],
        },
    ],
    ["Vehicle.StateDamage", 0x8b04, {}],
    ["Vehicle.PlayerManager", 0x8b05, {}],
    [
        "Vehicle.Spawn",
        0x8b06,
        {
            fields: [
                { name: "vehicleId", type: "uint32" },
                { name: "loadoutTab", type: "uint32" },
            ],
        },
    ],
    ["Vehicle.Tint", 0x8b07, {}],
    ["Vehicle.LoadVehicleTerminalDefinitionManager", 0x8b08, {}],
    ["Vehicle.ActiveWeapon", 0x8b09, {}],
    ["Vehicle.Stats", 0x8b0a, {}],
    ["Vehicle.DamageInfo", 0x8b0b, {}],
    ["Vehicle.StatUpdate", 0x8b0c, {}],
    ["Vehicle.UpdateWeapon", 0x8b0d, {}],
    ["Vehicle.RemovedFromQueue", 0x8b0e, {}],
    [
        "Vehicle.UpdateQueuePosition",
        0x8b0f,
        {
            fields: [{ name: "queuePosition", type: "uint32" }],
        },
    ],
    ["Vehicle.PadDestroyNotify", 0x8b10, {}],
    [
        "Vehicle.SetAutoDrive",
        0x8b11,
        {
            fields: [{ name: "guid", type: "uint64" }],
        },
    ],
    ["Vehicle.LockOnInfo", 0x8b12, {}],
    ["Vehicle.LockOnState", 0x8b13, {}],
    ["Vehicle.TrackingState", 0x8b14, {}],
    ["Vehicle.CounterMeasureState", 0x8b15, {}],
    [
        "Vehicle.LoadVehicleDefinitionManager",
        0x8b16,
        {
            fields: [
                {
                    name: "vehicleDefinitions",
                    type: "array",
                    fields: [
                        { name: "vehicleId", type: "uint32" },
                        { name: "modelId", type: "uint32" },
                    ],
                },
            ],
        },
    ],
    ["Vehicle.AcquireState", 0x8b17, {}],
    ["Vehicle.Dismiss", 0x8b18, {}],
    [
        "Vehicle.AutoMount",
        0x8b19,
        {
            fields: [
                { name: "guid", type: "uint64" },
                { name: "unknownBoolean1", type: "boolean" },
                { name: "unknownDword1", type: "uint32" },
            ],
        },
    ],
    ["Vehicle.WeaponSlots", 0x8b1a, {}],
    ["Vehicle.Deploy", 0x8b1b, {}],
    ["Vehicle.HeadLight", 0x8b1c, {}],
    ["Vehicle.AccessType", 0x8b1d, {}],
    ["Vehicle.KickPlayer", 0x8b1e, {}],
    ["Vehicle.HealthUpdateOwner", 0x8b1f, {}],
    ["Vehicle.OwnerPassengerList", 0x8b20, {}],
    ["Vehicle.Kick", 0x8b21, {}],
    ["Vehicle.NoAccess", 0x8b22, {}],
    [
        "Vehicle.Expiration",
        0x8b23,
        {
            fields: [{ name: "expireTime", type: "uint32" }],
        },
    ],
    ["Vehicle.Group", 0x8b24, {}],
    ["Vehicle.DeployResponse", 0x8b25, {}],
    ["Vehicle.ExitPoints", 0x8b26, {}],
    ["Vehicle.ControllerLogOut", 0x8b27, {}],
    ["Vehicle.CurrentMoveMode", 0x8b28, {}],
    ["Vehicle.ItemDefinitionRequest", 0x8b29, {}],
    ["Vehicle.ItemDefinitionReply", 0x8b2a, {}],
    ["Vehicle.AirToAirRadar", 0x8b2b, {}],
    ["Grief", 0x8c, {}],
    ["SpotPlayer", 0x8d, {}],
    ["Faction", 0x8e, {}],
    [
        "Synchronization",
        0x8f,
        {
            fields: [
                { name: "time1", type: "uint64" },
                { name: "time2", type: "uint64" },
                { name: "clientTime", type: "uint64" },
                { name: "serverTime", type: "uint64" },
                { name: "serverTime2", type: "uint64" },
                { name: "time3", type: "uint64" },
            ],
        },
    ],
    [
        "ResourceEvent",
        0x9000,
        {
            fields: [
                { name: "gameTime", type: "uint32" },
                {
                    name: "eventData",
                    type: "variabletype8",
                    types: {
                        1: [
                            { name: "characterId", type: "uint64" },
                            {
                                name: "unknownArray1",
                                type: "array",
                                fields: [
                                    { name: "unknownDword1", type: "uint32" },
                                    {
                                        name: "unknownData1",
                                        type: "schema",
                                        fields: resourceEventDataSubSchema,
                                    },
                                ],
                            },
                        ],
                        2: [
                            { name: "characterId", type: "uint64" },
                            { name: "unknownDword1", type: "uint32" },
                            { name: "unknownDword2", type: "uint32" },
                            {
                                name: "unknownArray1",
                                type: "array",
                                fields: [
                                    { name: "unknownDword1", type: "float" },
                                    { name: "unknownDword2", type: "float" },
                                    { name: "unknownDword3", type: "float" },
                                    { name: "unknownDword4", type: "float" },
                                ],
                            },
                            { name: "unknownDword3", type: "uint32" },
                            { name: "unknownDword4", type: "uint32" },
                            { name: "unknownFloat5", type: "float" },
                            { name: "unknownFloat6", type: "float" },
                            { name: "unknownFloat7", type: "float" },
                            { name: "unknownDword8", type: "uint32" },
                            { name: "unknownDword9", type: "uint32" },
                            { name: "unknownDword10", type: "uint32" },
                            { name: "unknownByte1", type: "uint8" },
                            { name: "unknownByte2", type: "uint8" },
                            { name: "unknownGuid3", type: "uint64" },
                            { name: "unknownGuid4", type: "uint64" },
                            { name: "unknownGuid5", type: "uint64" },
                        ],
                        3: [
                            { name: "characterId", type: "uint64" },
                            { name: "unknownDword1", type: "uint32" },
                            { name: "unknownDword2", type: "uint32" },
                            { name: "unknownDword3", type: "uint32" },
                            { name: "unknownDword4", type: "uint32" },
                            { name: "unknownFloat5", type: "float" },
                            { name: "unknownFloat6", type: "float" },
                            { name: "unknownFloat7", type: "float" },
                            { name: "unknownDword8", type: "uint32" },
                            { name: "unknownDword9", type: "uint32" },
                            { name: "unknownDword10", type: "uint32" },
                            { name: "unknownByte1", type: "uint8" },
                            { name: "unknownByte2", type: "uint8" },
                            { name: "unknownGuid3", type: "uint64" },
                            { name: "unknownGuid4", type: "uint64" },
                            { name: "unknownGuid5", type: "uint64" },
                            { name: "unknownBoolean", type: "boolean" },
                        ],
                    },
                },
            ],
        },
    ],
    ["Collision.Damage", 0x9101, {}],
    ["Leaderboard", 0x92, {}],
    ["PlayerUpdateManagedPosition", 0x93, {}],
    ["PlayerUpdateNetworkObjectComponents", 0x94, {}],
    ["PlayerUpdateUpdateVehicleWeapon", 0x95, {}],
    [
        "ProfileStats.GetPlayerProfileStats",
        0x960000,
        {
            fields: [{ name: "characterId", type: "uint64" }],
        },
    ],
    ["ProfileStats.GetZonePlayerProfileStats", 0x960100, {}],
    [
        "ProfileStats.PlayerProfileStats",
        0x960200,
        {
            fields: [
                {
                    name: "unknownData1",
                    type: "schema",
                    fields: [
                        {
                            name: "unknownData1",
                            type: "schema",
                            fields: profileStatsSubSchema1,
                        },
                        { name: "unknownDword1", type: "uint32" },
                        { name: "unknownArray1", type: "array", elementType: "uint32" },
                        { name: "unknownDword2", type: "uint32" },
                        { name: "characterName", type: "string" },
                        { name: "characterId", type: "uint64" },
                        { name: "battleRank", type: "uint32" },
                        { name: "unknownDword4", type: "uint32" },
                        { name: "unknownDword6", type: "uint32" },
                        { name: "unknownDword7", type: "uint32" },
                        { name: "unknownByte1", type: "uint8" },
                        { name: "unknownArray2", type: "array", elementType: "uint32" },
                        { name: "unknownDword8", type: "uint32" },
                        { name: "unknownDword9", type: "uint32" },
                        { name: "unknownDword10", type: "uint32" },
                        { name: "unknownDword11", type: "uint32" },
                        { name: "unknownDword12", type: "uint32" },
                        { name: "unknownArray3", type: "array", elementType: "uint32" },
                        { name: "unknownDword13", type: "uint32" },
                        { name: "unknownArray4", type: "array", elementType: "uint32" },
                        {
                            name: "unknownArray5",
                            type: "array",
                            length: 10,
                            fields: [
                                { name: "unknownDword1", type: "uint32" },
                                { name: "unknownArray1", type: "array", elementType: "uint32" },
                                { name: "unknownArray2", type: "array", elementType: "uint32" },
                                { name: "unknownArray3", type: "array", elementType: "uint32" },
                            ],
                        },
                    ],
                },
                { name: "weaponStats1", type: "array", fields: weaponStatsDataSchema },
                { name: "weaponStats2", type: "array", fields: weaponStatsDataSchema },
                { name: "vehicleStats", type: "array", fields: vehicleStatsDataSchema },
                {
                    name: "facilityStats1",
                    type: "array",
                    fields: facilityStatsDataSchema,
                },
                {
                    name: "facilityStats2",
                    type: "array",
                    fields: facilityStatsDataSchema,
                },
            ],
        },
    ],
    ["ProfileStats.ZonePlayerProfileStats", 0x960300, {}],
    ["ProfileStats.UpdatePlayerLeaderboards", 0x960400, {}],
    ["ProfileStats.UpdatePlayerLeaderboardsReply", 0x960500, {}],
    ["ProfileStats.GetLeaderboard", 0x960600, {}],
    ["ProfileStats.Leaderboard", 0x960700, {}],
    ["ProfileStats.GetZoneCharacterStats", 0x960800, {}],
    ["ProfileStats.ZoneCharacterStats", 0x960900, {}],
    [
        "Equipment.SetCharacterEquipment",
        0x9701,
        {
            fields: [
                { name: "profileId", type: "uint32" },
                { name: "characterId", type: "uint64" },
                { name: "unknownDword1", type: "uint32" },
                { name: "unknownString1", type: "string" },
                { name: "unknownString2", type: "string" },
                {
                    name: "equipmentSlots",
                    type: "array",
                    fields: [
                        { name: "equipmentSlotId", type: "uint32" },
                        {
                            name: "equipmentSlotData",
                            type: "schema",
                            fields: [
                                { name: "equipmentSlotId", type: "uint32" },
                                { name: "guid", type: "uint64" },
                                { name: "unknownString1", type: "string" },
                                { name: "unknownString2", type: "string" },
                            ],
                        },
                    ],
                },
                {
                    name: "attachmentData",
                    type: "array",
                    fields: [
                        { name: "modelName", type: "string" },
                        { name: "unknownString1", type: "string" },
                        { name: "tintAlias", type: "string" },
                        { name: "unknownString2", type: "string" },
                        { name: "unknownDword1", type: "uint32" },
                        { name: "unknownDword2", type: "uint32" },
                        { name: "slotId", type: "uint32" },
                    ],
                },
            ],
        },
    ],
    ["Equipment.SetCharacterEquipmentSlot", 0x9702, {}],
    ["Equipment.UnsetCharacterEquipmentSlot", 0x9703, {}],
    [
        "Equipment.SetCharacterEquipmentSlots",
        0x9704,
        {
            fields: [
                { name: "profileId", type: "uint32" },
                { name: "characterId", type: "uint64" },
                { name: "gameTime", type: "uint32" },
                {
                    name: "slots",
                    type: "array",
                    fields: [
                        { name: "index", type: "uint32" },
                        { name: "slotId", type: "uint32" },
                    ],
                },
                { name: "unknown1", type: "uint32" },
                { name: "unknown2", type: "uint32" },
                { name: "unknown3", type: "uint32" },
                {
                    name: "textures",
                    type: "array",
                    fields: [
                        { name: "index", type: "uint32" },
                        { name: "slotId", type: "uint32" },
                        { name: "itemId", type: "uint32" },
                        { name: "unknown1", type: "uint32" },
                        { name: "textureAlias", type: "string" },
                        { name: "unknown2", type: "string" },
                    ],
                },
                {
                    name: "models",
                    type: "array",
                    fields: [
                        { name: "modelName", type: "string" },
                        { name: "unknown1", type: "string" },
                        { name: "textureAlias", type: "string" },
                        { name: "unknown3", type: "string" },
                        { name: "unknown4", type: "uint32" },
                        { name: "unknown5", type: "uint32" },
                        { name: "slotId", type: "uint32" },
                    ],
                },
            ],
        },
    ],
    ["DefinitionFilter.ListDefinitionVariables", 0x9801, {}],
    [
        "DefinitionFilter.SetDefinitionVariable",
        0x9802,
        {
            fields: [
                { name: "unknownDword1", type: "uint32" },
                { name: "unknownQword1", type: "uint64" },
                {
                    name: "unknownData1",
                    type: "schema",
                    fields: [
                        { name: "unknownFloat1", type: "float" },
                        { name: "unknownFloat2", type: "float" },
                    ],
                },
            ],
        },
    ],
    [
        "DefinitionFilter.SetDefinitionIntSet",
        0x9803,
        {
            fields: [
                { name: "unknownDword1", type: "uint32" },
                { name: "unknownQword1", type: "uint64" },
                {
                    name: "unknownData1",
                    type: "array",
                    fields: [
                        { name: "unknownDword1", type: "uint32" },
                        { name: "unknownDword2", type: "uint32" },
                    ],
                },
            ],
        },
    ],
    [
        "DefinitionFilter.UnknownWithVariable1",
        0x9804,
        {
            fields: [
                { name: "unknownDword1", type: "uint32" },
                { name: "unknownQword1", type: "uint64" },
            ],
        },
    ],
    [
        "DefinitionFilter.UnknownWithVariable2",
        0x9805,
        {
            fields: [
                { name: "unknownDword1", type: "uint32" },
                { name: "unknownQword1", type: "uint64" },
            ],
        },
    ],
    [
        "ContinentBattleInfo",
        0x99,
        {
            fields: [
                {
                    name: "zones",
                    type: "array",
                    fields: [
                        { name: "id", type: "uint32" },
                        { name: "nameId", type: "uint32" },
                        { name: "descriptionId", type: "uint32" },
                        { name: "population", type: "array", elementType: "uint8" },
                        { name: "regionPercent", type: "array", elementType: "uint8" },
                        { name: "populationBuff", type: "array", elementType: "uint8" },
                        {
                            name: "populationTargetPercent",
                            type: "array",
                            elementType: "uint8",
                        },
                        { name: "name", type: "string" },
                        { name: "hexSize", type: "float" },
                        { name: "isProductionZone", type: "uint8" },
                    ],
                },
            ],
        },
    ],
    [
        "GetContinentBattleInfo",
        0x9a,
        {
            fields: [],
        },
    ],
    [
        "GetRespawnLocations",
        0x9b,
        {
            fields: [],
        },
    ],
    ["WallOfData.PlayerKeyboard", 0x9c03, {}],
    [
        "WallOfData.UIEvent",
        0x9c05,
        {
            fields: [
                { name: "object", type: "string" },
                { name: "function", type: "string" },
                { name: "argument", type: "string" },
            ],
        },
    ],
    ["WallOfData.ClientSystemInfo", 0x9c06, {}],
    ["WallOfData.VoiceChatEvent", 0x9c07, {}],
    ["WallOfData.NudgeEvent", 0x9c09, {}],
    ["WallOfData.LaunchPadFingerprint", 0x9c0a, {}],
    ["WallOfData.VideoCapture", 0x9c0b, {}],
    [
        "WallOfData.ClientTransition",
        0x9c0c,
        {
            fields: [
                { name: "oldState", type: "uint32" },
                { name: "newState", type: "uint32" },
                { name: "msElapsed", type: "uint32" },
            ],
        },
    ],
    ["ThrustPad.Data", 0x9d01, {}],
    ["ThrustPad.Update", 0x9d02, {}],
    ["ThrustPad.PlayerEntered", 0x9d03, {}],
    ["Implant.SelectImplant", 0x9e01, {}],
    ["Implant.UnselectImplant", 0x9e02, {}],
    ["Implant.LoadImplantDefinitionManager", 0x9e03, {}],
    ["Implant.SetImplants", 0x9e04, {}],
    ["Implant.UpdateImplantSlot", 0x9e05, {}],
    ["ClientInGamePurchase", 0x9f, {}],
    ["Mission.ListMissions", 0xa001, {}],
    ["Mission.ConquerZone", 0xa002, {}],
    ["Mission.SelectMission", 0xa003, {}],
    ["Mission.UnselectMission", 0xa004, {}],
    ["Mission.SetMissionInstanceManager", 0xa005, {}],
    ["Mission.SetMissionManager", 0xa006, {}],
    ["Mission.AddGlobalAvailableMission", 0xa007, {}],
    ["Mission.RemoveGlobalAvailableMission", 0xa008, {}],
    ["Mission.AddAvailableMission", 0xa009, {}],
    ["Mission.RemoveAvailableMission", 0xa00a, {}],
    ["Mission.AddActiveMission", 0xa00b, {}],
    ["Mission.RemoveActiveMission", 0xa00c, {}],
    ["Mission.ReportCompletedMission", 0xa00d, {}],
    ["Mission.AddAvailableMissions", 0xa00e, {}],
    ["Mission.SetMissionChangeList", 0xa00f, {}],
    ["Mission.SetConqueredZone", 0xa010, {}],
    ["Mission.UnsetConqueredZone", 0xa011, {}],
    ["Mission.SetConqueredZones", 0xa012, {}],
    [
        "Effect.AddEffect",
        0xa101,
        {
            fields: [
                {
                    name: "unknownData1",
                    type: "schema",
                    fields: [
                        { name: "unknownDword1", type: "uint32" },
                        { name: "unknownDword2", type: "uint32" },
                        { name: "unknownDword3", type: "uint32" },
                    ],
                },
                {
                    name: "unknownData2",
                    type: "schema",
                    fields: [
                        { name: "unknownQword1", type: "uint64" },
                        { name: "unknownQword2", type: "uint64" },
                    ],
                },
                {
                    name: "unknownData3",
                    type: "schema",
                    fields: [
                        { name: "unknownQword1", type: "uint64" },
                        { name: "unknownQword2", type: "uint64" },
                        { name: "unknownVector1", type: "floatvector4" },
                    ],
                },
            ],
        },
    ],
    [
        "Effect.UpdateEffect",
        0xa102,
        {
            fields: [
                {
                    name: "unknownData1",
                    type: "schema",
                    fields: [
                        { name: "unknownDword1", type: "uint32" },
                        { name: "unknownDword2", type: "uint32" },
                        { name: "unknownDword3", type: "uint32" },
                    ],
                },
                {
                    name: "unknownData2",
                    type: "schema",
                    fields: [
                        { name: "unknownDword1", type: "uint32" },
                        { name: "unknownQword1", type: "uint64" },
                    ],
                },
                {
                    name: "unknownData3",
                    type: "schema",
                    fields: [
                        { name: "unknownQword1", type: "uint64" },
                        { name: "unknownQword2", type: "uint64" },
                        { name: "unknownVector1", type: "floatvector4" },
                    ],
                },
            ],
        },
    ],
    [
        "Effect.RemoveEffect",
        0xa103,
        {
            fields: [
                {
                    name: "unknownData1",
                    type: "schema",
                    fields: [
                        { name: "unknownDword1", type: "uint32" },
                        { name: "unknownDword2", type: "uint32" },
                        { name: "unknownDword3", type: "uint32" },
                    ],
                },
                {
                    name: "unknownData2",
                    type: "schema",
                    fields: [{ name: "unknownQword1", type: "uint64" }],
                },
                {
                    name: "unknownData3",
                    type: "schema",
                    fields: [
                        { name: "unknownQword1", type: "uint64" },
                        { name: "unknownQword2", type: "uint64" },
                        { name: "unknownVector1", type: "floatvector4" },
                    ],
                },
            ],
        },
    ],
    [
        "Effect.AddEffectTag",
        0xa104,
        {
            fields: effectTagDataSchema,
        },
    ],
    [
        "Effect.RemoveEffectTag",
        0xa105,
        {
            fields: [
                {
                    name: "unknownData1",
                    type: "schema",
                    fields: [{ name: "unknownQword1", type: "uint64" }],
                },
                {
                    name: "unknownData2",
                    type: "schema",
                    fields: [
                        { name: "unknownDword1", type: "uint32" },
                        { name: "unknownQword1", type: "uint64" },
                        { name: "unknownQword2", type: "uint64" },
                    ],
                },
            ],
        },
    ],
    [
        "Effect.TargetBlockedEffect",
        0xa106,
        {
            fields: [
                {
                    name: "unknownData1",
                    type: "schema",
                    fields: [{ name: "unknownQword1", type: "uint64" }],
                },
            ],
        },
    ],
    ["RewardBuffs.RewardBuffs", 0xa201, {}],
    ["RewardBuffs.WorldToZoneRewardBuffs", 0xa202, {}],
    ["RewardBuffs.ReceivedBundlePacket", 0xa203, {}],
    ["RewardBuffs.NonBundledItem", 0xa204, {}],
    ["RewardBuffs.AddBonus", 0xa205, {}],
    ["RewardBuffs.RemoveBonus", 0xa206, {}],
    ["RewardBuffs.GiveRewardToPlayer", 0xa207, {}],
    ["RewardBuffs.GiveLoyaltyReward", 0xa208, {}],
    ["Abilities.InitAbility", 0xa301, {}],
    ["Abilities.UpdateAbility", 0xa302, {}],
    ["Abilities.UninitAbility", 0xa303, {}],
    ["Abilities.SetAbilityActivationManager", 0xa304, {}],
    [
        "Abilities.SetActivatableAbilityManager",
        0xa305,
        {
            fields: [
                {
                    name: "unknownArray1",
                    type: "array",
                    fields: [
                        { name: "unknownQword1", type: "uint64" },
                        {
                            name: "unknownData1",
                            type: "schema",
                            fields: [
                                { name: "unknownQword1", type: "uint64" },
                                { name: "unknownDword1", type: "uint32" },
                                { name: "unknownDword2", type: "uint32" },
                            ],
                        },
                        { name: "unknownDword1", type: "uint32" },
                        { name: "unknownByte1", type: "uint8" },
                    ],
                },
            ],
        },
    ],
    ["Abilities.SetVehicleActivatableAbilityManager", 0xa306, {}],
    ["Abilities.SetAbilityTimerManager", 0xa307, {}],
    ["Abilities.AddAbilityTimer", 0xa308, {}],
    ["Abilities.RemoveAbilityTimer", 0xa309, {}],
    ["Abilities.UpdateAbilityTimer", 0xa30a, {}],
    ["Abilities.SetAbilityLockTimer", 0xa30b, {}],
    ["Abilities.ActivateAbility", 0xa30c, {}],
    ["Abilities.VehicleActivateAbility", 0xa30d, {}],
    ["Abilities.DeactivateAbility", 0xa30e, {}],
    ["Abilities.VehicleDeactivateAbility", 0xa30f, {}],
    ["Abilities.ActivateAbilityFailed", 0xa310, {}],
    ["Abilities.VehicleActivateAbilityFailed", 0xa311, {}],
    ["Abilities.ClearAbilityLineManager", 0xa312, {}],
    ["Abilities.SetAbilityLineManager", 0xa313, {}],
    ["Abilities.SetProfileAbilityLineMembers", 0xa314, {}],
    ["Abilities.SetProfileAbilityLineMember", 0xa315, {}],
    ["Abilities.RemoveProfileAbilityLineMember", 0xa316, {}],
    ["Abilities.SetVehicleAbilityLineMembers", 0xa317, {}],
    ["Abilities.SetVehicleAbilityLineMember", 0xa318, {}],
    ["Abilities.RemoveVehicleAbilityLineMember", 0xa319, {}],
    ["Abilities.SetFacilityAbilityLineMembers", 0xa31a, {}],
    ["Abilities.SetFacilityAbilityLineMember", 0xa31b, {}],
    ["Abilities.RemoveFacilityAbilityLineMember", 0xa31c, {}],
    ["Abilities.SetEmpireAbilityLineMembers", 0xa31d, {}],
    ["Abilities.SetEmpireAbilityLineMember", 0xa31e, {}],
    ["Abilities.RemoveEmpireAbilityLineMember", 0xa31f, {}],
    [
        "Abilities.SetLoadoutAbilities",
        0xa320,
        {
            fields: [
                {
                    name: "abilities",
                    type: "array",
                    fields: [
                        { name: "abilitySlotId", type: "uint32" },
                        {
                            name: "abilityData",
                            type: "schema",
                            fields: [
                                { name: "abilitySlotId", type: "uint32" },
                                { name: "abilityId", type: "uint32" },
                                { name: "unknownDword1", type: "uint32" },
                                { name: "guid1", type: "uint64" },
                                { name: "guid2", type: "uint64" },
                            ],
                        },
                    ],
                },
            ],
        },
    ],
    ["Abilities.AddLoadoutAbility", 0xa321, {}],
    ["Abilities.RemoveLoadoutAbility", 0xa322, {}],
    ["Abilities.SetImplantAbilities", 0xa323, {}],
    ["Abilities.AddImplantAbility", 0xa324, {}],
    ["Abilities.RemoveImplantAbility", 0xa325, {}],
    ["Abilities.SetPersistentAbilities", 0xa326, {}],
    ["Abilities.AddPersistentAbility", 0xa327, {}],
    ["Abilities.RemovePersistentAbility", 0xa328, {}],
    ["Deployable.Place", 0xa401, {}],
    ["Deployable.Remove", 0xa402, {}],
    ["Deployable.Pickup", 0xa403, {}],
    ["Deployable.ActionResponse", 0xa404, {}],
    [
        "Security",
        0xa5,
        {
            fields: [{ name: "code", type: "uint32" }],
        },
    ],
    [
        "MapRegion.GlobalData",
        0xa601,
        {
            fields: [
                { name: "unknown1", type: "float" },
                { name: "unknown2", type: "float" },
            ],
        },
    ],
    [
        "MapRegion.Data",
        0xa602,
        {
            fields: [
                { name: "unknown1", type: "float" },
                { name: "unknown2", type: "uint32" },
                {
                    name: "regions",
                    type: "array",
                    fields: [
                        { name: "regionId", type: "uint32" },
                        { name: "regionId2", type: "uint32" },
                        { name: "nameId", type: "uint32" },
                        { name: "facilityId", type: "uint32" },
                        { name: "facilityType", type: "uint8" },
                        { name: "currencyId", type: "uint8" },
                        { name: "ownerFactionId", type: "uint8" },
                        {
                            name: "hexes",
                            type: "array",
                            fields: [
                                { name: "x", type: "int32" },
                                { name: "y", type: "int32" },
                                { name: "type", type: "uint32" },
                            ],
                        },
                        { name: "flags", type: "uint8" },
                        { name: "unknown4", type: "array", elementType: "uint8" },
                        { name: "unknown5", type: "array", elementType: "uint8" },
                        { name: "unknown6", type: "array", elementType: "uint8" },
                        { name: "connectionFacilityId", type: "uint32" },
                    ],
                },
            ],
        },
    ],
    ["MapRegion.ExternalData", 0xa603, {}],
    ["MapRegion.Update", 0xa604, {}],
    ["MapRegion.UpdateAll", 0xa605, {}],
    [
        "MapRegion.MapOutOfBounds",
        0xa606,
        {
            fields: [
                { name: "characterId", type: "uint64" },
                { name: "unknownDword1", type: "uint32" },
                { name: "unknownByte2", type: "uint8" },
            ],
        },
    ],
    ["MapRegion.Population", 0xa607, {}],
    [
        "MapRegion.RequestContinentData",
        0xa608,
        {
            fields: [{ name: "zoneId", type: "uint32" }],
        },
    ],
    ["MapRegion.InfoRequest", 0xa609, {}],
    ["MapRegion.InfoReply", 0xa60a, {}],
    ["MapRegion.ExternalFacilityData", 0xa60b, {}],
    ["MapRegion.ExternalFacilityUpdate", 0xa60c, {}],
    ["MapRegion.ExternalFacilityUpdateAll", 0xa60d, {}],
    ["MapRegion.ExternalFacilityEmpireScoreUpdate", 0xa60e, {}],
    ["MapRegion.NextTick", 0xa60f, {}],
    ["MapRegion.HexActivityUpdate", 0xa610, {}],
    ["MapRegion.ConquerFactionUpdate", 0xa611, {}],
    ["Hud", 0xa7, {}],
    ["ClientPcData.SetSpeechPack", 0xa801, {}],
    [
        "ClientPcData.SpeechPackList",
        0xa803,
        {
            fields: [
                {
                    name: "speechPacks",
                    type: "array",
                    fields: [{ name: "speechPackId", type: "uint32" }],
                },
            ],
        },
    ],
    ["AcquireTimer", 0xa9, {}],
    ["PlayerUpdateGuildTag", 0xaa, {}],
    ["Warpgate.ActivateTerminal", 0xab01, {}],
    ["Warpgate.ZoneRequest", 0xab02, {}],
    ["Warpgate.PostQueueNotify", 0xab03, {}],
    ["Warpgate.QueueForZone", 0xab04, {}],
    ["Warpgate.CancelQueue", 0xab05, {}],
    ["Warpgate.WarpToQueuedZone", 0xab06, {}],
    ["Warpgate.WarpToSocialZone", 0xab07, {}],
    ["LoginQueueStatus", 0xac, {}],
    [
        "ServerPopulationInfo",
        0xad,
        {
            fields: [
                { name: "population", type: "array", elementType: "uint16" },
                { name: "populationPercent", type: "array", elementType: "uint8" },
                { name: "populationBuff", type: "array", elementType: "uint8" },
            ],
        },
    ],
    [
        "GetServerPopulationInfo",
        0xae,
        {
            fields: [],
        },
    ],
    ["PlayerUpdate.VehicleCollision", 0xaf, {}],
    [
        "PlayerUpdate.Stop",
        0xb0,
        {
            fields: [
                {
                    name: "unknownUint",
                    type: "custom",
                    parser: readUnsignedIntWith2bitLengthValue,
                    packer: packUnsignedIntWith2bitLengthValue,
                },
            ],
        },
    ],
    [
        "Currency.SetCurrencyDiscount",
        0xb101,
        {
            fields: [
                { name: "currencyId", type: "uint32" },
                { name: "discount", type: "float" },
            ],
        },
    ],
    ["Currency.SetCurrencyRateTier", 0xb102, {}],
    ["Currency.ListCurrencyDiscounts", 0xb103, {}],
    ["Currency.RequestSetCurrencyDiscount", 0xb104, {}],
    ["Items.LoadItemRentalDefinitionManager", 0xb201, {}],
    ["Items.SetItemTimerManager", 0xb201, {}],
    ["Items.SetItemLockTimer", 0xb201, {}],
    ["Items.SetItemLineTimers", 0xb201, {}],
    ["Items.SetItemTrialLockTimer", 0xb201, {}],
    ["Items.SetItemLineTrialTimers", 0xb201, {}],
    ["Items.AddItemLineTrialTimer", 0xb201, {}],
    ["Items.RemoveItemLineTrialTimer", 0xb201, {}],
    ["Items.ExpireItemLineTrialTimer", 0xb201, {}],
    ["Items.UpdateItemLineTrialTimer", 0xb201, {}],
    ["Items.SetItemLineRentalTimers", 0xb201, {}],
    ["Items.AddItemLineRentalTimer", 0xb201, {}],
    ["Items.RemoveItemLineRentalTimer", 0xb201, {}],
    ["Items.ExpireItemLineRentalTimer", 0xb201, {}],
    ["Items.SetImplantTimers", 0xb201, {}],
    ["Items.AddImplantTimer", 0xb201, {}],
    ["Items.RemoveImplantTimer", 0xb201, {}],
    ["Items.UpdateImplantTimer", 0xb201, {}],
    ["Items.ExpireImplantTimer", 0xb201, {}],
    ["Items.RequestAddItemLineTimer", 0xb201, {}],
    ["Items.RequestTrialItemLine", 0xb201, {}],
    ["Items.RequestRentalItemLine", 0xb201, {}],
    ["Items.ListItemRentalTerms", 0xb201, {}],
    ["Items.ListItemLineTimers", 0xb201, {}],
    ["Items.ExpireItemLineTrialTimers", 0xb201, {}],
    ["Items.ExpireItemLineRentalTimers", 0xb201, {}],
    ["Items.ExpireImplantTimers", 0xb201, {}],
    ["Items.ClearItemLineTrialTimers", 0xb201, {}],
    ["Items.ClearItemLineRentalTimers", 0xb201, {}],
    ["Items.ClearImplantTimers", 0xb201, {}],
    ["Items.LoadItemRentalDefinitionManager", 0xb201, {}],
    ["PlayerUpdate.AttachObject", 0xb3, {}],
    ["PlayerUpdate.DetachObject", 0xb4, {}],
    [
        "ClientSettings",
        0xb5,
        {
            fields: [
                { name: "helpUrl", type: "string" },
                { name: "shopUrl", type: "string" },
                { name: "shop2Url", type: "string" },
            ],
        },
    ],
    [
        "RewardBuffInfo",
        0xb6,
        {
            fields: [
                { name: "unknownFloat1", type: "float" },
                { name: "unknownFloat2", type: "float" },
                { name: "unknownFloat3", type: "float" },
                { name: "unknownFloat4", type: "float" },
                { name: "unknownFloat5", type: "float" },
                { name: "unknownFloat6", type: "float" },
                { name: "unknownFloat7", type: "float" },
                { name: "unknownFloat8", type: "float" },
                { name: "unknownFloat9", type: "float" },
                { name: "unknownFloat10", type: "float" },
                { name: "unknownFloat11", type: "float" },
                { name: "unknownFloat12", type: "float" },
                { name: "unknownDword1", type: "uint32" },
                { name: "unknownDword2", type: "uint32" },
            ],
        },
    ],
    [
        "GetRewardBuffInfo",
        0xb7,
        {
            fields: [],
        },
    ],
    ["Cais", 0xb8, {}],
    [
        "ZoneSetting.Data",
        0xb901,
        {
            fields: [
                {
                    name: "settings",
                    type: "array",
                    fields: [
                        { name: "hash", type: "uint32" },
                        { name: "unknown1", type: "uint32", defaultValue: 0 },
                        { name: "unknown2", type: "uint32", defaultValue: 0 },
                        { name: "value", type: "uint32" },
                        { name: "settingType", type: "uint32" },
                    ],
                },
            ],
        },
    ],
    ["RequestPromoEligibilityUpdate", 0xba, {}],
    ["PromoEligibilityReply", 0xbb, {}],
    ["MetaGameEvent.StartWarning", 0xbc01, {}],
    ["MetaGameEvent.Start", 0xbc02, {}],
    ["MetaGameEvent.Update", 0xbc03, {}],
    ["MetaGameEvent.CompleteDominating", 0xbc04, {}],
    ["MetaGameEvent.CompleteStandard", 0xbc05, {}],
    ["MetaGameEvent.CompleteCancel", 0xbc06, {}],
    ["MetaGameEvent.ExperienceBonusUpdate", 0xbc07, {}],
    ["MetaGameEvent.ClearExperienceBonus", 0xbc08, {}],
    ["RequestWalletTopupUpdate", 0xbd, {}],
    ["RequestStationCashActivePromoUpdate", 0xbe, {}],
    ["CharacterSlot", 0xbf, {}],
    ["Operation.RequestCreate", 0xc001, {}],
    ["Operation.RequestDestroy", 0xc002, {}],
    ["Operation.RequestJoin", 0xc003, {}],
    ["Operation.RequestJoinByName", 0xc004, {}],
    ["Operation.RequestLeave", 0xc005, {}],
    ["Operation.ClientJoined", 0xc006, {}],
    ["Operation.ClientLeft", 0xc007, {}],
    ["Operation.BecomeListener", 0xc008, {}],
    ["Operation.AvailableData", 0xc009, {}],
    ["Operation.Created", 0xc00a, {}],
    ["Operation.Destroyed", 0xc00b, {}],
    [
        "Operation.ClientClearMissions",
        0xc00c,
        {
            fields: [],
        },
    ],
    ["Operation.InstanceAreaUpdate", 0xc00d, {}],
    ["Operation.ClientInArea", 0xc00e, {}],
    ["Operation.InstanceLocationUpdate", 0xc00f, {}],
    ["Operation.GroupOperationListRequest", 0xc010, {}],
    ["Operation.GroupOperationListReply", 0xc011, {}],
    ["Operation.GroupOperationSelect", 0xc012, {}],
    ["Operation.InstanceLockUpdate", 0xc013, {}],
    [
        "WordFilter.Data",
        0xc101,
        {
            fields: [{ name: "wordFilterData", type: "byteswithlength" }],
        },
    ],
    ["StaticFacilityInfo.Request", 0xc201, {}],
    ["StaticFacilityInfo.Reply", 0xc202, {}],
    [
        "StaticFacilityInfo.AllZones",
        0xc203,
        {
            fields: [
                {
                    name: "facilities",
                    type: "array",
                    fields: [
                        { name: "zoneId", type: "uint32" },
                        { name: "facilityId", type: "uint32" },
                        { name: "nameId", type: "uint32" },
                        { name: "facilityType", type: "uint8" },
                        { name: "locationX", type: "float" },
                        { name: "locationY", type: "float" },
                        { name: "locationZ", type: "float" },
                    ],
                },
            ],
        },
    ],
    ["StaticFacilityInfo.ReplyWarpgate", 0xc204, {}],
    ["StaticFacilityInfo.AllWarpgateRespawns", 0xc205, {}],
    ["ProxiedPlayer", 0xc3, {}],
    ["Resist", 0xc4, {}],
    ["InGamePurchasing", 0xc5, {}],
    ["BusinessEnvironments", 0xc6, {}],
    ["EmpireScore", 0xc7, {}],
    [
        "CharacterSelectSessionRequest",
        0xc8,
        {
            fields: [],
        },
    ],
    [
        "CharacterSelectSessionResponse",
        0xc9,
        {
            fields: [
                { name: "status", type: "uint8" },
                { name: "sessionId", type: "string" },
            ],
        },
    ],
    ["Stats", 0xca, {}],
    ["DeathReport", 0xcb, {}],
    ["Crafting", 0xcc, {}],
    ["ExperienceScheduledEvent", 0xcd, {}],
    ["NudgeNotification", 0xce, {}],
    ["Resource", 0xcf, {}],
    [
        "Directive.Initialize",
        0xd001,
        {
            fields: [
                {
                    name: "directivesData",
                    type: "byteswithlength",
                    fields: [
                        { name: "unknownDword1", type: "uint32" },
                        {
                            name: "treeCategories",
                            type: "array",
                            fields: [
                                { name: "categoryId", type: "uint32" },
                                {
                                    name: "categoryData",
                                    type: "schema",
                                    fields: [
                                        { name: "nameId", type: "uint32" },
                                        { name: "locked", type: "boolean" },
                                        { name: "completion", type: "float" },
                                        { name: "unknownByte1", type: "uint8" },
                                    ],
                                },
                            ],
                        },
                        {
                            name: "trees",
                            type: "array",
                            fields: [
                                { name: "treeId", type: "uint32" },
                                {
                                    name: "treeData",
                                    type: "schema",
                                    fields: [
                                        { name: "treeId", type: "uint32" },
                                        { name: "imageSet", type: "uint32" },
                                        { name: "categoryId", type: "uint32" },
                                        {
                                            name: "detailData",
                                            type: "variabletype8",
                                            types: {
                                                0: [
                                                    { name: "nameId", type: "uint32" },
                                                    { name: "descriptionId", type: "uint32" },
                                                    { name: "unknownDword3", type: "uint32" },
                                                    { name: "unknownQword1", type: "uint64" },
                                                    {
                                                        name: "tiers",
                                                        type: "array",
                                                        fields: [
                                                            { name: "tierId", type: "uint32" },
                                                            { name: "nameId", type: "uint32" },
                                                            { name: "unknownDword3", type: "uint32" },
                                                            { name: "imageSetId", type: "uint32" },
                                                            {
                                                                name: "rewardBundle",
                                                                type: "schema",
                                                                fields: rewardBundleDataSchema,
                                                            },
                                                            { name: "unknownDword5", type: "uint32" },
                                                            { name: "unknownBoolean1", type: "boolean" },
                                                            { name: "unknownQword1", type: "uint64" },
                                                            { name: "unknownDword6", type: "uint32" },
                                                            {
                                                                name: "objectives",
                                                                type: "array",
                                                                fields: [
                                                                    { name: "objectiveId", type: "uint32" },
                                                                    {
                                                                        name: "objectiveData",
                                                                        type: "schema",
                                                                        fields: [
                                                                            { name: "objectiveId", type: "uint32" },
                                                                            { name: "unknownDword2", type: "uint32" },
                                                                            { name: "unknownByte1", type: "uint8" },
                                                                            { name: "unknownByte2", type: "uint8" },
                                                                            { name: "nameId", type: "uint32" },
                                                                            { name: "imageSetId", type: "uint32" },
                                                                            { name: "unknownDword5", type: "uint32" },
                                                                            { name: "unknownWord1", type: "uint16" },
                                                                            { name: "unknownByte3", type: "uint8" },
                                                                            { name: "unknownWord2", type: "uint16" },
                                                                            { name: "time", type: "uint64" },
                                                                        ],
                                                                    },
                                                                ],
                                                            },
                                                        ],
                                                    },
                                                    {
                                                        name: "unknownArray2",
                                                        type: "array",
                                                        fields: [
                                                            { name: "unknownDword1", type: "uint32" },
                                                            { name: "unknownDword2", type: "uint32" },
                                                            { name: "unknownDword3", type: "uint32" },
                                                            { name: "unknownDword4", type: "uint32" },
                                                        ],
                                                    },
                                                ],
                                                1: [{ name: "unlockHintStringId", type: "uint32" }],
                                            },
                                        },
                                    ],
                                },
                            ],
                        },
                        {
                            name: "scoreLevels",
                            type: "array",
                            fields: [
                                { name: "nameId", type: "uint32" },
                                { name: "points", type: "uint32" },
                                { name: "rewardStringId", type: "uint32" },
                                { name: "rewardImageSetId", type: "uint32" },
                            ],
                        },
                    ],
                },
            ],
        },
    ],
];
var packetTypes = {}, packetDescriptors = {};
PacketTable.build(packets, packetTypes, packetDescriptors);
exports.PacketTypes = packetTypes;
exports.Packets = packetDescriptors;
