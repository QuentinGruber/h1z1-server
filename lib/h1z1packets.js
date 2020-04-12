var PacketTable = require("./packettable"),
    DataSchema = require("dataschema");

function readPacketType(data, packets) {
    var opCode = data[0] >>> 0,
        length = 0,
        packet;
    if (packets[opCode]) {
        packet = packets[opCode];
        length = 1;
    } else if (data.length > 1) {
        opCode = ((data[0] << 8) + data[1]) >>> 0;
        if (packets[opCode]) {
            packet = packets[opCode];
            length = 2;
        } else if (data.length > 2) {
            opCode = ((data[0] << 16) + (data[1] << 8) + data[2]) >>> 0;
            if (packets[opCode]) {
                packet = packets[opCode];
                length = 3;
            } else if (data.length > 3) {
                opCode = ((data[0] << 24) + (data[1] << 16) + (data[2] << 8) + data[3]) >>> 0;
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
        length : length
    };
}

function writePacketType(packetType) {
    var packetTypeBytes = [];
    while (packetType) {
        packetTypeBytes.unshift(packetType & 0xFF);
        packetType = packetType >> 8;
    }
    var data = new Buffer(packetTypeBytes.length);
    for (var i=0;i<packetTypeBytes.length;i++) {
        data.writeUInt8(packetTypeBytes[i], i);
    }
    return data;
}

function readUnsignedIntWith2bitLengthValue(data, offset) {
    var value = data.readUInt8(offset);
    var n = value & 3;
    for (var i=0;i<n;i++) {
        value += data.readUInt8(offset + i + 1) << ((i+1)*8);
    }
    value = value >>> 2;
    return {
        value: value,
        length: n+1
    };
}

function packUnsignedIntWith2bitLengthValue(value) {
    value = Math.round(value);
    value = value << 2;
    var n = 0;
    if (value > 0xFFFFFF) {
        n = 3;
    } else if (value > 0xFFFF) {
        n = 2;
    } else if (value > 0xFF) {
        n = 1;
    }
    value |= n;
    var data = new Buffer(4);
    data.writeUInt32LE(value, 0);
    return data.slice(0, n+1);
}

function readSignedIntWith2bitLengthValue(data, offset) {
    var value = data.readUInt8(offset);
    var sign = value & 1;
    var n = (value >> 1) & 3;
    for (var i=0;i<n;i++) {
        value += data.readUInt8(offset + i + 1) << ((i+1)*8);
    }
    value = value >>> 3;
    if (sign) {
        value = -value;
    }
    return {
        value: value,
        length: n+1
    };
}

function packSignedIntWith2bitLengthValue(value) {
    value = Math.round(value);
    var sign = value < 0 ? 1 : 0;
    value = sign ? -value : value;
    value = value << 3;
    var n = 0;
    if (value > 0xFFFFFF) {
        n = 3;
    } else if (value > 0xFFFF) {
        n = 2;
    } else if (value > 0xFF) {
        n = 1;
    }
    value |= (n << 1);
    value |= sign;
    var data = new Buffer(4);
    data.writeUInt32LE(value, 0);
    return data.slice(0, n+1);
}

function readPositionUpdateData(data, offset) {
    var obj = {},
        startOffset = offset;

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
    if (obj.flags & 0xE0) {
    }

    return {
        value: obj,
        length: offset - startOffset
    };
}

function packPositionUpdateData(obj) {
    var data = new Buffer(7),
        flags = 0,
        v;

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
        v = new Buffer(4);
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
    var outdata = new Buffer(outSize),
        token,
        literalLength,
        matchLength, matchOffset, matchStart, matchEnd,
        offsetIn = 0,
        offsetOut = 0;

    while (1) {
        var token = data[offsetIn];
        var literalLength = token >> 4;
        var matchLength = token & 0xF;
        offsetIn++;
        if (literalLength) {
            if (literalLength == 0xF) {
                while (data[offsetIn] == 0xFF) {
                    literalLength += 0xFF;
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

            if (matchLength == 0xF) {
                while (data[offsetIn] == 0xFF) {
                    matchLength += 0xFF;
                    offsetIn++;
                }
                matchLength += data[offsetIn];
                offsetIn++;
            }
            matchLength += 4;
            var matchStart = offsetOut - matchOffset,
                matchEnd = offsetOut - matchOffset + matchLength;
            for (var i=matchStart; i<matchEnd; i++) {
                outdata[offsetOut] = outdata[i];
                offsetOut++;
            }
        } else {
            break;
        }
    }
    return outdata;
}

var vehicleReferenceDataSchema = [
    { name: "move_info",                    type: "array", fields: [
        { name: "id",                           type: "uint32" },
        { name: "data",                         type: "schema", fields: [
            { name: "id",                           type: "uint32" },
            { name: "unknownByte1",                 type: "uint8" },
            { name: "unknownByte2",                 type: "uint8" },
            { name: "unknownDword2",                type: "uint32" },
            { name: "unknownByte3",                 type: "uint8" },

            { name: "unknownFloat1",                type: "float" },
            { name: "unknownFloat2",                type: "float" },
            { name: "max_forward",                  type: "float" },
            { name: "max_reverse",                  type: "float" },
            { name: "max_dive",                     type: "float" },
            { name: "max_rise",                     type: "float" },
            { name: "max_strafe",                   type: "float" },
            { name: "accel_forward",                type: "float" },
            { name: "accel_reverse",                type: "float" },
            { name: "accel_dive",                   type: "float" },
            { name: "accel_rise",                   type: "float" },
            { name: "accel_strafe",                 type: "float" },
            { name: "brake_forward",                type: "float" },
            { name: "brake_reverse",                type: "float" },
            { name: "brake_dive",                   type: "float" },
            { name: "brake_rise",                   type: "float" },
            { name: "brake_strafe",                 type: "float" },
            { name: "move_pitch_rate",              type: "float" },
            { name: "move_yaw_rate",                type: "float" },
            { name: "move_roll_rate",               type: "float" },
            { name: "still_pitch_rate",             type: "float" },
            { name: "still_yaw_rate",               type: "float" },
            { name: "still_roll_rate",              type: "float" },
            { name: "unknownDword3",                type: "uint32" },
            { name: "unknownDword4",                type: "uint32" },
            { name: "landing_gear_height",          type: "uint32" },
            { name: "vehicle_archetype",            type: "uint8" },
            { name: "movement_mode",                type: "uint8" },
            { name: "change_mode_speed_percent",    type: "float" },
            { name: "unknownFloat25",               type: "float" },
            { name: "unknownFloat26",               type: "float" },
            { name: "min_traction",                 type: "float" },
            { name: "linear_redirect",              type: "float" },
            { name: "linear_dampening",             type: "float" },
            { name: "hover_power",                  type: "float" },
            { name: "hover_length",                 type: "float" },
            { name: "unknownFloat32",               type: "float" },
            { name: "unknownFloat33",               type: "float" },
            { name: "unknownFloat34",               type: "float" },
            { name: "unknownFloat35",               type: "float" },
            { name: "unknownFloat36",               type: "float" },
            { name: "dead_zone_size",               type: "float" },
            { name: "dead_zone_rate",               type: "float" },
            { name: "dead_zone_sensitivity",        type: "float" },
            { name: "unknownFloat40",               type: "float" },
            { name: "unknownFloat41",               type: "float" },
            { name: "auto_level_roll_rate",         type: "float" },
            { name: "camera_shake_intensity",       type: "float" },
            { name: "camera_shake_speed",           type: "float" },
            { name: "camera_shake_change_speed",    type: "float" },
            { name: "unknownFloat46",               type: "float" },
            { name: "inward_yaw_mod",               type: "float" },
            { name: "unknownFloat48",               type: "float" },
            { name: "vehicle_strafe_lift",          type: "float" },
            { name: "dead_zone_influence_exponent", type: "float" },
            { name: "camera_shake_initial_intensity", type: "float" },
            { name: "unknownFloat52",               type: "float" },
            { name: "dampening",                    type: "floatvector3" },
            { name: "unknownFloat53",               type: "float" },
            { name: "unknownFloat54",               type: "float" },
            { name: "sprint_lift_sub",              type: "float" },
            { name: "sprint_lift_factor",           type: "float" },
            { name: "lift_factor",                  type: "float" },
            { name: "unknownFloat58",               type: "float" },
            { name: "steer_burst_factor",           type: "floatvector3" },
            { name: "steer_burst_speed",            type: "float" },
            { name: "steer_factor",                 type: "float" },
            { name: "steer_exponent",               type: "float" },
            { name: "steer_spin_factor",            type: "float" },
            { name: "steer_spin_exponent",          type: "float" },
            { name: "steer_lean_factor",            type: "float" },
            { name: "steer_lean_turn_factor",       type: "float" },
            { name: "steer_compensate_factor",      type: "float" },
            { name: "unknownFloat67",               type: "float" },
            { name: "unknownFloat68",               type: "float" },
            { name: "angular_dampening_scalar",     type: "float" },
            { name: "angular_dampening",            type: "floatvector3" },
            { name: "estimated_max_speed",          type: "uint32" },
            { name: "hill_climb",                   type: "float" },
            { name: "hill_climb_decay_range",       type: "float" },
            { name: "hill_climb_min_power",         type: "float" },
            { name: "unknownFloat73",               type: "float" },
            { name: "unknownDword7",                type: "uint32" },
            { name: "unknownDword8",                type: "uint32" },
            { name: "unknownDword9",                type: "uint32" },
            { name: "unknownDword10",               type: "uint32" },
            { name: "unknownDword11",               type: "uint32" },
            { name: "unknownDword12",               type: "uint32" },
            { name: "unknownDword13",               type: "uint32" },
            { name: "unknownDword14",               type: "uint32" },
            { name: "unknownDword15",               type: "uint32" },
            { name: "unknownDword16",               type: "uint32" },
            { name: "unknownDword17",               type: "uint32" },
            { name: "wake_effect",                  type: "uint32" },
            { name: "debris_effect",                type: "uint32" }
        ]}
    ]},
    { name: "dynamics_info",                type: "array", fields: [
        { name: "id",                           type: "uint32" },
        { name: "data",                         type: "schema", fields: [
            { name: "id",                       type: "uint32" },
            { name: "max_velocity",                 type: "float" },
            { name: "turn_torque",                  type: "float" },
            { name: "turn_rate",                    type: "float" },
            { name: "center_of_gravity_y",          type: "float" }
        ]}
    ]},
    { name: "engine_info",                  type: "array", fields: [
        { name: "id",                           type: "uint32" },
        { name: "data",                         type: "schema", fields: [
            { name: "id",                       type: "uint32" },
            { name: "peak_torque",                  type: "float" },
            { name: "torque_curve_y",               type: "float" },
            { name: "engaged_clutch_damp",          type: "float" },
            { name: "disengaged_clutch_damp",       type: "float" },
            { name: "clutch_strength",              type: "float" },
            { name: "reverse_gear",                 type: "float" },
            { name: "first_gear",                   type: "float" },
            { name: "second_gear",                  type: "float" },
            { name: "third_gear",                   type: "float" },
            { name: "fourth_gear",                  type: "float" },
            { name: "switch_gear_time",             type: "float" }
        ]}
    ]},
    { name: "suspension_info",              type: "array", fields: [
        { name: "id",                           type: "uint32" },
        { name: "data",                         type: "schema", fields: [
            { name: "id",                       type: "uint32" },
            { name: "spring_frequency",             type: "float" },
            { name: "spring_damper_ratio",          type: "float" },
            { name: "hashes",                       type: "array", fields: [
                { name: "hash_1",                       type: "uint32" },
                { name: "hash_2",                       type: "uint32" }
            ]}
        ]}
    ]},

    { name: "vehicle_model_mappings",       type: "array", fields: [
        { name: "vehicle_id",                   type: "uint32" },
        { name: "model_id",                     type: "uint32" }
    ]},

    { name: "wheel_info",                   type: "array", fields: [
        { name: "id",                           type: "uint32" },
        { name: "data",                         type: "schema", fields: [
            { name: "id",                           type: "uint32" },
            { name: "max_brake",                    type: "float" },
            { name: "max_hand_brake",               type: "float" },
            { name: "max_steer",                    type: "float" },
            { name: "hashes",                       type: "array", fields: [
                { name: "hash_1",                       type: "uint32" },
                { name: "hash_2",                       type: "uint32" }
            ]}
        ]}
    ]},
    { name: "tire_info",                    type: "array", fields: [
        { name: "id",                           type: "uint32" },
        { name: "data",                         type: "schema", fields: [
            { name: "id",                           type: "uint32" },
            { name: "long_stiff",                   type: "float" },
            { name: "tire_second",                  type: "float" },
            { name: "hashes",                       type: "array", fields: [
                { name: "hash_1",                       type: "uint32" },
                { name: "hash_2",                       type: "uint32" }
            ]}
        ]}
    ]},
    { name: "vehicle_move_info_mappings",   type: "array", fields: [
        { name: "vehicle_id",                   type: "uint32" },
        { name: "move_info",                    type: "array", elementType: "uint32" }
    ]}
];

function parseVehicleReferenceData(data, offset) {
    var dataLength = data.readUInt32LE(offset);
    offset += 4;
    data = data.slice(offset, offset + dataLength); 

    var inSize = data.readUInt32LE(0),
        outSize = data.readUInt32LE(4),
        compData = data.slice(8);
    data = lz4_decompress(compData, inSize, outSize);

    var result = DataSchema.parse(vehicleReferenceDataSchema, data, 0).result;

    return {
        value: result,
        length: dataLength + 4
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

    var inSize = itemData.readUInt16LE(0),
        outSize = itemData.readUInt16LE(2),
        compData = itemData.slice(4, 4 + inSize),
        decompData = lz4_decompress(compData, inSize, outSize),
        itemDefinition = DataSchema.parse(baseItemDefinitionSchema, decompData, 0).result;

    var itemData = parseItemData(itemData, 4 + inSize, referenceData).value;
    return {
        value: {
            itemDefinition: itemDefinition,
            itemData: itemData
        },
        length: itemDataLength + 4
    };
}

function packItemAddData(obj) {
}

function parseItemDefinitions(data, offset) {
    var itemDataLength = data.readUInt32LE(offset);
    offset += 4;
    var itemData = data.slice(offset, offset + itemDataLength);

    var itemDefinitions = [],
        item,
        n = itemData.readUInt32LE(0),
        itemDataOffset = 4;

    for (var i=0;i<n;i++) {
        var blockSize = itemData.readUInt16LE(itemDataOffset),
            blockSizeOut = itemData.readUInt16LE(itemDataOffset + 2),
            blockData = itemData.slice(itemDataOffset + 4, itemDataOffset + 4 + blockSize),
            itemDefinitionData = lz4_decompress(blockData, blockSize, blockSizeOut);
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
        length: itemDataLength + 4
    };
}

function packItemDefinitions(obj) {
}


var profileDataSchema = [
    { name: "profileId",            type: "uint32" },
    { name: "nameId",               type: "uint32" },
    { name: "descriptionId",        type: "uint32" },
    { name: "type",                 type: "uint32" },
    { name: "iconId",               type: "uint32" },
    { name: "unknownDword6",        type: "uint32" },
    { name: "unknownDword7",        type: "uint32" },
    { name: "unknownDword8",        type: "uint32" },
    { name: "unknownBoolean1",      type: "boolean" },
    { name: "unknownDword9",        type: "uint32" },
    { name: "unknownArray1",        type: "array", fields: [
        { name: "unknownDword1",        type: "uint32" },
        { name: "unknownDword2",        type: "uint32" },
        { name: "unknownDword3",        type: "uint32" }
    ]},
    { name: "unknownBoolean2",      type: "boolean" },
    { name: "unknownDword10",       type: "uint32" },
    { name: "unknownDword11",       type: "uint32" },
    { name: "unknownBoolean3",      type: "boolean" },
    { name: "unknownByte1",         type: "uint8" },
    { name: "unknownBoolean4",      type: "boolean" },
    { name: "unknownBoolean5",      type: "boolean" },
    { name: "unknownFloat1",        type: "float" },
    { name: "unknownFloat2",        type: "float" },
    { name: "unknownFloat3",        type: "float" },
    { name: "unknownFloat4",        type: "float" },
    { name: "unknownDword13",       type: "uint32" },
    { name: "unknownFloat5",        type: "float" },
    { name: "unknownDword14",       type: "uint32" },
    { name: "unknownDword15",       type: "uint32" },
    { name: "unknownDword16",       type: "uint32" },
    { name: "unknownDword17",       type: "uint32" },
    { name: "unknownDword18",       type: "uint32" },
    { name: "unknownDword19",       type: "uint32" }
];

var baseItemDefinitionSchema = [
    { name: "itemId",                   type: "uint32" },
    { name: "flags1",                   type: "bitflags", flags: [
        { bit: 0,   name: "bit0" },
        { bit: 1,   name: "forceDisablePreview" },
        { bit: 2,   name: "bit2" },
        { bit: 3,   name: "bit3" },
        { bit: 4,   name: "bit4" },
        { bit: 5,   name: "bit5" },
        { bit: 6,   name: "bit6" },
        { bit: 7,   name: "noTrade" }
    ]},
    { name: "flags2",                   type: "bitflags", flags: [
        { bit: 0,   name: "bit0" },
        { bit: 1,   name: "bit1" },
        { bit: 2,   name: "bit2" },
        { bit: 3,   name: "accountScope" },
        { bit: 4,   name: "canEquip" },
        { bit: 5,   name: "removeOnUse" },
        { bit: 6,   name: "consumeOnUse" },
        { bit: 7,   name: "quickUse" }
    ]},
    { name: "flags3",                       type: "uint8" },
    { name: "nameId",                       type: "uint32" },
    { name: "descriptionId",                type: "uint32" },
    { name: "contentId",                    type: "uint32" },
    { name: "imageSetId",                   type: "uint32" },
    { name: "unknown4",                     type: "uint32" },
    { name: "hudImageSetId",                type: "uint32" },
    { name: "unknown6",                     type: "uint32" },
    { name: "unknown7",                     type: "uint32" },
    { name: "cost",                         type: "uint32" },
    { name: "itemClass",                    type: "uint32" },
    { name: "profileOverride",              type: "uint32" },
    { name: "slot",                         type: "uint32" },
    { name: "unknownDword1",                type: "uint32" },
    { name: "modelName",                    type: "string" },
    { name: "textureAlias",                 type: "string" },
    { name: "unknown13",                    type: "uint8" },
    { name: "unknown14",                    type: "uint32" },
    { name: "categoryId",                   type: "uint32" },
    { name: "unknown16",                    type: "uint32" },
    { name: "unknown17",                    type: "uint32" },
    { name: "unknown18",                    type: "uint32" },
    { name: "minProfileRank",               type: "uint32" },
    { name: "unknown19",                    type: "uint32" },
    { name: "activatableAbililtyId",        type: "uint32" },
    { name: "passiveAbilityId",             type: "uint32" },
    { name: "passiveAbilitySetId",          type: "uint32" },
    { name: "maxStackable",                 type: "uint32" },
    { name: "tintAlias",                    type: "string" },
    { name: "unknown23",                    type: "uint32" },
    { name: "unknown24",                    type: "uint32" },
    { name: "unknown25",                    type: "uint32" },
    { name: "unknown26",                    type: "uint32" },
    { name: "uiModelCameraId",              type: "uint32" },
    { name: "equipCountMax",                type: "uint32" },
    { name: "currencyType",                 type: "uint32" },
    { name: "dataSheetId",                  type: "uint32" },
    { name: "itemType",                     type: "uint32" },
    { name: "skillSetId",                   type: "uint32" },
    { name: "overlayTexture",               type: "string" },
    { name: "decalSlot",                    type: "string" },
    { name: "overlayAdjustment",            type: "uint32" },
    { name: "trialDurationSec",             type: "uint32" },
    { name: "nextTrialDelaySec",            type: "uint32" },
    { name: "clientUseRequirementId",       type: "uint32" },
    { name: "overrideAppearance",           type: "string" },
    { name: "unknown35",                    type: "uint32" },
    { name: "unknown36",                    type: "uint32" },
    { name: "param1",                       type: "uint32" },
    { name: "param2",                       type: "uint32" },
    { name: "param3",                       type: "uint32" },
    { name: "uiModelCameraId2",             type: "uint32" },
    { name: "unknown41",                    type: "uint32" }
];

var lightWeightNpcSchema = [
    { name: "guid",             type: "uint64" },
    { name: "transientId",      type: "custom", parser: readUnsignedIntWith2bitLengthValue, packer: packUnsignedIntWith2bitLengthValue },
    { name: "unknownString0",   type: "string", defaultValue: "" },
    { name: "nameId",           type: "uint32" },
    { name: "unknownDword2",    type: "uint32" },
    { name: "unknownDword3",    type: "uint32" },
    { name: "unknownByte1",     type: "uint8" },
    { name: "modelId",          type: "uint32" },
    { name: "scale",            type: "floatvector4" },
    { name: "unknownString1",   type: "string" },
    { name: "unknownString2",   type: "string" },
    { name: "unknownDword5",    type: "uint32" },
    // { name: "unknownString3",   type: "string" },
    { name: "position",         type: "floatvector3" },
    { name: "unknownVector1",   type: "floatvector4" },
    { name: "rotation",         type: "floatvector4" },
    // { name: "unknownDword7",    type: "uint32" },
    // { name: "unknownFloat1",    type: "float" },
    // { name: "unknownString4",   type: "string" },
    // { name: "unknownString5",   type: "string" },
    // { name: "unknownString6",   type: "string" },
    // { name: "vehicleId",        type: "uint32" },
    // { name: "unknownDword9",    type: "uint32" },
    // { name: "npcDefinitionId",  type: "uint32" },
    // { name: "unknownByte2",     type: "uint8" },
    // { name: "profileId",        type: "uint32" },
    // { name: "unknownBoolean1",  type: "boolean" },
    // { name: "unknownData1",     type: "schema", fields: [
    //     { name: "unknownByte1",     type: "uint8" },
    //     { name: "unknownByte2",     type: "uint8" },
    //     { name: "unknownByte3",     type: "uint8" }
    // ]},
    // { name: "unknownByte6",     type: "uint8" },
    // { name: "unknownDword11",   type: "uint32" },
    // { name: "unknownGuid1",     type: "uint64" },
    // { name: "unknownData2",     type: "schema", fields: [
    //     { name: "unknownGuid1",     type: "uint64" }
    // ]},


    // { name: "unknownDword12",   type: "uint32" },
    // { name: "unknownDword13",   type: "uint32" },
    // { name: "unknownDword14",   type: "uint32" },
    // { name: "unknownByte7",     type: "uint8" },
    // { name: "unknownArray1",    type: "array", fields: [
    //     { name: "unknownByte1",     type: "uint8" },
    //     { name: "unknownDword1",    type: "uint32" },
    //     { name: "unknownDword2",    type: "uint32" },
    //     { name: "unknownDword3",    type: "uint32" },
    //     { name: "characterId",      type: "uint64" },
    //     { name: "unknownDword4",    type: "uint32" },
    //     { name: "unknownDword5",    type: "uint32" }
    // ]}
];

var profileStatsSubSchema1 = [
    { name: "unknownDword1",            type: "uint32" },
    { name: "unknownArray1",            type: "array", elementType: "uint32" },
    { name: "unknownDword2",            type: "uint32" },
    { name: "unknownDword3",            type: "uint32" },
    { name: "unknownDword4",            type: "uint32" },
    { name: "unknownDword5",            type: "uint32" },
    { name: "unknownDword6",            type: "uint32" },
    { name: "unknownDword7",            type: "uint32" },
    { name: "unknownDword8",            type: "uint32" }
];

var weaponStatsDataSubSchema1 = [
    { name: "unknownDword1",            type: "uint32" },
    { name: "unknownDword2",            type: "uint32" },
    { name: "unknownDword3",            type: "uint32" },
    { name: "unknownDword4",            type: "uint32" },
    { name: "unknownDword5",            type: "uint32" },
    { name: "unknownDword6",            type: "uint32" },
    { name: "unknownDword7",            type: "uint32" },
    { name: "unknownDword8",            type: "uint32" },
    { name: "unknownDword9",            type: "uint32" },
    { name: "unknownDword10",           type: "uint32" },
    { name: "unknownDword11",           type: "uint32" },
    { name: "unknownDword12",           type: "uint32" },
    { name: "unknownDword13",           type: "uint32" },
    { name: "unknownBoolean1",          type: "boolean" },
    { name: "unknownDword14",           type: "uint32" }
];

var weaponStatsDataSchema = [
    { name: "unknownData1",             type: "schema", fields: profileStatsSubSchema1 },
    { name: "unknownDword1",            type: "uint32" },
    { name: "unknownDword2",            type: "uint32" },
    { name: "unknownDword3",            type: "uint32" },
    { name: "unknownDword4",            type: "uint32" },
    { name: "unknownDword5",            type: "uint32" },
    { name: "unknownDword6",            type: "uint32" },
    { name: "unknownDword7",            type: "uint32" },
    { name: "unknownDword8",            type: "uint32" },
    { name: "unknownDword9",            type: "uint32" },
    { name: "unknownDword10",           type: "uint32" },
    { name: "unknownDword11",           type: "uint32" },
    { name: "unknownData2",             type: "schema", fields: weaponStatsDataSubSchema1 },
    { name: "unknownData3",             type: "schema", fields: weaponStatsDataSubSchema1 }
];

var vehicleStatsDataSchema = [
    { name: "unknownData1",             type: "schema", fields: profileStatsSubSchema1 },
    { name: "unknownData2",             type: "schema", fields: weaponStatsDataSubSchema1 }
];

var facilityStatsDataSchema = [
    { name: "unknownData1",             type: "schema", fields: weaponStatsDataSubSchema1 }
];

var itemBaseSchema = [
    { name: "itemId",               type: "uint32" },
    { name: "unknownDword2",        type: "uint32" },
    { name: "unknownGuid1",         type: "uint64" },
    { name: "unknownDword3",        type: "uint32" },
    { name: "unknownDword4",        type: "uint32" },
    { name: "unknownDword5",        type: "uint32" },
    { name: "unknownDword6",        type: "uint32" },
    { name: "unknownBoolean1",      type: "boolean" },
    { name: "unknownDword7",        type: "uint32" },
    { name: "unknownByte1",         type: "uint8" },
    { name: "unknownData",          type: "variabletype8",
        types: {
            0: [],
            1: [
                { name: "unknownDword1",       type: "uint32" },
                { name: "unknownDword2",       type: "uint32" },
                { name: "unknownDword3",       type: "uint32" }
            ]
        }
    }
];

var effectTagDataSchema = [
    { name: "unknownDword1",           type: "uint32" },
    { name: "unknownDword2",           type: "uint32" },

    { name: "unknownDword3",           type: "uint32" },
    { name: "unknownDword4",           type: "uint32" },
    { name: "unknownDword5",           type: "uint32" },

    { name: "unknownData1",             type: "schema", fields: [
        { name: "unknownGuid1",            type: "uint64" },
        { name: "unknownGuid2",            type: "uint64" }
    ]},

    { name: "unknownData2",             type: "schema", fields: [
        { name: "unknownGuid1",            type: "uint64" },
        { name: "unknownGuid2",            type: "uint64" },
        { name: "unknownVector1",          type: "floatvector4" }
    ]},

    { name: "unknownData3",             type: "schema", fields: [
        { name: "unknownDword1",           type: "uint32" },
        { name: "unknownDword2",           type: "uint32" },
        { name: "unknownDword3",           type: "uint32" }
    ]},

    { name: "unknownDword6",           type: "uint32" },
    { name: "unknownByte1",            type: "uint8" }
];

var targetDataSchema = [
    { name: "targetType",               type: "uint8" }
];


var itemDetailSchema = [
    { name: "unknownBoolean1",          type: "boolean" }
];

var statDataSchema = [
    { name: "statId",                   type: "uint32" },
    { name: "statValue",                type: "variabletype8",
        types: {
            0: [
                { name: "baseValue",            type: "uint32" },
                { name: "modifierValue",        type: "uint32" }
            ],
            1: [
                { name: "baseValue",            type: "float" },
                { name: "modifierValue",        type: "float" }
            ]
        }
    }
];

var itemWeaponDetailSubSchema1 = [
    { name: "statOwnerId",              type: "uint32" },
    { name: "statData",                 type: "schema", fields: statDataSchema }
];

var itemWeaponDetailSubSchema2 = [
    { name: "unknownDword1",        type: "uint32" },
    { name: "unknownArray1",        type: "array", fields: [
        { name: "unknownDword1",        type: "uint32" },
        { name: "unknownArray1",        type: "array", fields: itemWeaponDetailSubSchema1 }
    ]}
];

var itemWeaponDetailSchema = [
    { name: "unknownBoolean1",          type: "boolean" },
    { name: "unknownArray1",            type: "array", fields: [
        { name: "unknownDword1",        type: "uint32" },
        { name: "unknownDword2",        type: "uint32" }
    ]},
    { name: "unknownArray2",            type: "array8", fields: [
        { name: "unknownDword1",        type: "uint32" },
        { name: "unknownArray1",        type: "array8", fields: [
            { name: "unknownByte1",         type: "uint8" },
            { name: "unknownDword1",        type: "uint32" },
            { name: "unknownDword2",        type: "uint32" },
            { name: "unknownDword3",        type: "uint32" }
        ]}
    ]},
    { name: "unknownByte1",         type: "uint8" },
    { name: "unknownByte2",         type: "uint8" },
    { name: "unknownDword1",        type: "uint32" },
    { name: "unknownByte3",         type: "uint8" },
    { name: "unknownFloat1",        type: "float" },
    { name: "unknownByte4",         type: "uint8" },
    { name: "unknownDword2",        type: "uint32" },
    { name: "unknownArray3",        type: "array", fields: itemWeaponDetailSubSchema1 },
    { name: "unknownArray4",        type: "array", fields: itemWeaponDetailSubSchema2 }
];

var weaponPackets = [
    ["Weapon.FireStateUpdate",                                      0x8201, {
        fields: [
            { name: "guid",                         type: "uint64" },
            { name: "unknownByte1",                 type: "uint8" },
            { name: "unknownByte2",                 type: "uint8" }
        ]
    }],
    ["Weapon.FireStateTargetedUpdate",                              0x8202, {}],
    ["Weapon.Fire",                                                 0x8203, {
        fields: [
            { name: "guid",                         type: "uint64" },
            { name: "position",                     type: "floatvector3" },
            { name: "unknownDword1",                type: "uint32" },
            { name: "unknownDword2",                type: "uint32" },
            { name: "unknownDword3",                type: "uint32" }
        ]
    }],
    ["Weapon.FireWithDefinitionMapping",                            0x8204, {}],
    ["Weapon.FireNoProjectile",                                     0x8205, {}],
    ["Weapon.ProjectileHitReport",                                  0x8206, {}],
    ["Weapon.ReloadRequest",                                        0x8207, {
        fields: [
            { name: "guid",                         type: "uint64" }
        ]
    }],
    ["Weapon.Reload",                                               0x8208, {}],
    ["Weapon.ReloadInterrupt",                                      0x8209, {}],
    ["Weapon.ReloadComplete",                                       0x820A, {}],
    ["Weapon.SwitchFireModeRequest",                                0x820B, {
        fields: [
            { name: "guid",                         type: "uint64" },
            { name: "unknownByte1",                 type: "uint8" },
            { name: "unknownByte2",                 type: "uint8" },
            { name: "unknownByte3",                 type: "uint8" }
        ]
    }],
    ["Weapon.LockOnGuidUpdate",                                     0x820C, {}],
    ["Weapon.LockOnLocationUpdate",                                 0x820D, {}],
    ["Weapon.StatUpdate",                                           0x820E, {
        fields: [
            { name: "statData",                     type: "array", fields: [
                { name: "guid",                         type: "uint64" },
                { name: "unknownBoolean1",              type: "boolean" },
                { name: "statUpdates",                  type: "array", fields: [
                    { name: "statCategory",                 type: "uint8" },
                    { name: "statUpdateData",               type: "schema", fields: itemWeaponDetailSubSchema1 }
                ]}
            ]}
        ]
    }],
    ["Weapon.DebugProjectile",                                      0x820F, {}],
    ["Weapon.AddFireGroup",                                         0x8210, {}],
    ["Weapon.RemoveFireGroup",                                      0x8211, {}],
    ["Weapon.ReplaceFireGroup",                                     0x8212, {}],
    ["Weapon.GuidedUpdate",                                         0x8213, {}],
    ["Weapon.RemoteWeapon.Reset",                                   0x821401, {}],
    ["Weapon.RemoteWeapon.AddWeapon",                               0x821402, {}],
    ["Weapon.RemoteWeapon.RemoveWeapon",                            0x821403, {}],
    ["Weapon.RemoteWeapon.Update",                                  0x821404, {
        fields: [
            { name: "unknownUint1",                 type: "custom", parser: readUnsignedIntWith2bitLengthValue, packer: packUnsignedIntWith2bitLengthValue },
            { name: "unknownByte1",                 type: "uint8" },
            { name: "unknownQword1",                type: "uint64" },
            { name: "unknownByte2",                 type: "uint8" },
            { name: "unknownUint2",                 type: "custom", parser: readUnsignedIntWith2bitLengthValue, packer: packUnsignedIntWith2bitLengthValue }
        ]
    }],
    ["Weapon.RemoteWeapon.Update.FireState",                        0x82140401, {}],
    ["Weapon.RemoteWeapon.Update.Empty",                            0x82140402, {}],
    ["Weapon.RemoteWeapon.Update.Reload",                           0x82140403, {}],
    ["Weapon.RemoteWeapon.Update.ReloadLoopEnd",                    0x82140404, {}],
    ["Weapon.RemoteWeapon.Update.ReloadInterrupt",                  0x82140405, {}],
    ["Weapon.RemoteWeapon.Update.SwitchFireMode",                   0x82140406, {}],
    ["Weapon.RemoteWeapon.Update.StatUpdate",                       0x82140407, {}],
    ["Weapon.RemoteWeapon.Update.AddFireGroup",                     0x82140408, {}],
    ["Weapon.RemoteWeapon.Update.RemoveFireGroup",                  0x82140409, {}],
    ["Weapon.RemoteWeapon.Update.ReplaceFireGroup",                 0x8214040A, {}],
    ["Weapon.RemoteWeapon.Update.ProjectileLaunch",                 0x8214040B, {}],
    ["Weapon.RemoteWeapon.Update.Chamber",                          0x8214040C, {}],
    ["Weapon.RemoteWeapon.Update.Throw",                            0x8214040D, {}],
    ["Weapon.RemoteWeapon.Update.Trigger",                          0x8214040E, {}],
    ["Weapon.RemoteWeapon.Update.ChamberInterrupt",                 0x8214040F, {}],
    ["Weapon.RemoteWeapon.ProjectileLaunchHint",                    0x821405, {}],
    ["Weapon.RemoteWeapon.ProjectileDetonateHint",                  0x821406, {}],
    ["Weapon.RemoteWeapon.ProjectileRemoteContactReport",           0x821407, {}],
    ["Weapon.ChamberRound",                                         0x8215, {}],
    ["Weapon.GuidedSetNonSeeking",                                  0x8216, {}],
    ["Weapon.ChamberInterrupt",                                     0x8217, {}],
    ["Weapon.GuidedExplode",                                        0x8218, {}],
    ["Weapon.DestroyNpcProjectile",                                 0x8219, {}],
    ["Weapon.WeaponToggleEffects",                                  0x821A, {}],
    ["Weapon.Reset",                                                0x821B, {
        fields: [
            { name: "unknownQword1",                type: "uint64" },
            { name: "unknownBoolean1",              type: "boolean" },
            { name: "unknownByte1",                 type: "uint8" }
        ]
    }],
    ["Weapon.ProjectileSpawnNpc",                                   0x821C, {}],
    ["Weapon.FireRejected",                                         0x821D, {}],
    ["Weapon.MultiWeapon",                                          0x821E, {
        fields: [
            { name: "packets",                      type: "custom", parser: parseMultiWeaponPacket, packer: packMultiWeaponPacket }
        ]
    }],
    ["Weapon.WeaponFireHint",                                       0x821F, {}],
    ["Weapon.ProjectileContactReport",                              0x8220, {}],
    ["Weapon.MeleeHitMaterial",                                     0x8221, {}],
    ["Weapon.ProjectileSpawnAttachedNp",                            0x8222, {}],
    ["Weapon.AddDebugLogEntry",                                     0x8223, {}]

];

var weaponPacketTypes = {},
    weaponPacketDescriptors = {};

PacketTable.build(weaponPackets, weaponPacketTypes, weaponPacketDescriptors);


function parseMultiWeaponPacket(data, offset) {
    var startOffset = offset,
        packets = [];
    var n = data.readUInt32LE(offset);
    offset += 4;

    for (var i=0;i<n;i++) {
        var size = data.readUInt32LE(offset);
        offset += 4;

        var subData = data.slice(offset, offset + size);
        offset += size;

        packets.push(parseWeaponPacket(subData, 2).value);
    }
    return {
        value: packets,
        length: startOffset - offset
    };
}

function packMultiWeaponPacket(obj) {
}

function parseWeaponPacket(data, offset) {
    var obj = {};

    obj.gameTime = data.readUInt32LE(offset);
    var tmpData = data.slice(offset + 4);
   
    var weaponPacketData = new Buffer(tmpData.length + 1);
    weaponPacketData.writeUInt8(0x85, 0);
    tmpData.copy(weaponPacketData, 1);

    var weaponPacket = readPacketType(weaponPacketData, weaponPacketDescriptors);
    if (weaponPacket.packet) {
        obj.packetType = weaponPacket.packetType;
        obj.packetName = weaponPacket.packet.name;
        if (weaponPacket.packet.schema) {
            obj.packet = DataSchema.parse(weaponPacket.packet.schema, weaponPacketData, weaponPacket.length, null).result
        }
    } else {
        obj.packetType = weaponPacket.packetType;
        obj.packetData = data;
    }
    return {
        value: obj,
        length: data.length - offset
    };
}

function packWeaponPacket(obj) {
    var subObj = obj.packet,
        subName = obj.packetName,
        subType = weaponPacketTypes[subName],
        data;
    if (weaponPacketDescriptors[subType]) {
        var subPacket = weaponPacketDescriptors[subType],
            subTypeData = writePacketType(subType),
            subData = DataSchema.pack(subPacket.schema, subObj).data;
        subData = Buffer.concat([subTypeData.slice(1), subData]);
        data = new Buffer(subData.length + 4);
        data.writeUInt32LE((obj.gameTime & 0xFFFFFFFF) >>> 0, 0);
        subData.copy(data, 4);
    } else {
        throw "Unknown weapon packet type: " + subType;
    }
    return data;
}

function parseItemData(data, offset, referenceData) {
    var startOffset = offset,
        detailItem, detailSchema;
    var baseItem = DataSchema.parse(itemBaseSchema, data, offset);
    offset += baseItem.length;

    if (referenceData.itemTypes[baseItem.result.itemId] == "Weapon") {
        detailSchema = itemWeaponDetailSchema;
    } else {
        detailSchema = itemDetailSchema;
    }

    detailItem = DataSchema.parse(detailSchema, data, offset);

    offset += detailItem.length;

    return {
        value: {
            baseItem: baseItem.result,
            detail: detailItem.result
        },
        length: offset - startOffset
    };
}

function packItemData(obj, referenceData) {
    var baseData = DataSchema.pack(itemBaseSchema, obj.baseItem),
        detailData, detailSchema;

    if (referenceData.itemTypes[obj.baseItem.itemId] == "Weapon") {
        detailSchema = itemWeaponDetailSchema;
    } else {
        detailSchema = itemDetailSchema;
    }

    detailData = DataSchema.pack(detailSchema, obj.detail);
    return Buffer.concat([baseData.data, detailData.data]);
}


var resourceEventDataSubSchema = [
    { name: "resourceData",         type: "schema", fields: [
        { name: "resourceId",           type: "uint32" },
        { name: "resourceType",         type: "uint32" },
    ]},
    { name: "unknownArray1",        type: "array", fields: [
        { name: "unknownDword1",        type: "uint32" },
        { name: "unknownData1",         type: "schema", fields: [
            { name: "unknownDword1",        type: "uint32" },
            { name: "unknownFloat1",        type: "float" },
            { name: "unknownFloat2",        type: "float" }
        ]}
    ]},
    { name: "unknownData2",         type: "schema", fields: [
        { name: "max_value",            type: "uint32" },
        { name: "initial_value",        type: "uint32" },
        { name: "unknownFloat1",        type: "float" },
        { name: "unknownFloat2",        type: "float" },
        { name: "unknownFloat3",        type: "float" },
        { name: "unknownDword3",        type: "uint32" },
        { name: "unknownDword4",        type: "uint32" },
        { name: "unknownDword5",        type: "uint32" }
    ]},
    { name: "unknownByte1",         type: "uint8" },
    { name: "unknownByte2",         type: "uint8" },
    { name: "unknownTime1",         type: "uint64" },
    { name: "unknownTime2",         type: "uint64" },
    { name: "unknownTime3",         type: "uint64" },
    { name: "unknownDword1",        type: "uint32" },
    { name: "unknownDword2",        type: "uint32" },
    { name: "unknownDword3",        type: "uint32" }
];

var rewardBundleDataSchema = [
    { name: "unknownByte1",                type: "boolean" },
    { name: "currency",                     type: "array", fields: [
        { name: "currencyId",                   type: "uint32" },
        { name: "quantity",                     type: "uint32" }
    ]},
    { name: "unknownDword1",                type: "uint32" },
    { name: "unknownByte2",                 type: "uint8" },
    { name: "unknownDword2",                type: "uint32" },
    { name: "unknownDword3",                type: "uint32" },
    { name: "unknownDword4",                type: "uint32" },
    { name: "unknownDword5",                type: "uint32" },
    { name: "unknownDword6",                type: "uint32" },
    { name: "time",                         type: "uint64" },
    { name: "characterId",                  type: "uint64" },
    { name: "nameId",                       type: "uint32" },
    { name: "unknownDword8",                type: "uint32" },
    { name: "imageSetId",                   type: "uint32" },
    { name: "entries",                      type: "array", fields: [
        { name: "entryData",                    type: "variabletype8", 
            types: {
                1: [
                    { name: "unknownData1",                 type: "schema", fields: [
                        { name: "unknownBoolean1",              type: "boolean" },
                        { name: "imageSetId",                   type: "uint32" },
                        { name: "unknownDword2",                type: "uint32" },
                        { name: "nameId",                       type: "uint32" },
                        { name: "quantity",                     type: "uint32" },
                        { name: "itemId",                       type: "uint32" },
                        { name: "unknownDword6",                type: "uint32" },
                        { name: "unknownString1",               type: "string" },
                        { name: "unknownDword7",                type: "uint32" },
                        { name: "unknownDword8",                type: "uint32" }
                    ]}
                ]
            }
        } // RewardBundleBase_GetEntryFromType
    ]},
    { name: "unknownDword10",               type: "uint32" }
];

var objectiveDataSchema = [
    { name: "objectiveId",                  type: "uint32" },
    { name: "nameId",                       type: "uint32" },
    { name: "descriptionId",                type: "uint32" },
    { name: "rewardData",                   type: "schema", fields: rewardBundleDataSchema },
    { name: "unknownByte1",                 type: "uint8" },
    { name: "unknownDword3",                type: "uint32" },
    { name: "unknownDword4",                type: "uint32" },
    { name: "unknownByte2",                 type: "uint8" },
    { name: "unknownByte3",                 type: "uint8" },
    { name: "unknownData1",                 type: "schema", fields: [
        { name: "unknownDword1",                type: "uint32" },
        { name: "unknownDword2",                type: "uint32" },
        { name: "unknownDword3",                type: "uint32" },
        { name: "unknownDword4",                type: "uint32" }
    ]},
    { name: "unknownByte4",                 type: "uint8" }
];

var achievementDataSchema = [
    { name: "achievementId",                type: "uint32" },
    { name: "unknownBoolean1",              type: "uint32" },
    { name: "nameId",                       type: "uint32" },
    { name: "descriptionId",                type: "uint32" },
    { name: "timeStarted",                  type: "uint64" },
    { name: "timeFinished",                 type: "uint64" },
    { name: "progress",                     type: "float" },
    { name: "objectives",                   type: "array", fields: [
        { name: "index",                        type: "uint32" },
        { name: "objectiveData",                type: "schema", fields: objectiveDataSchema }
    ]},
    { name: "iconId",                       type: "uint32" },
    { name: "unknownDword5",                type: "uint32" },
    { name: "unknownDword6",                type: "uint32" },
    { name: "points",                       type: "uint32" },
    { name: "unknownDword8",                type: "uint32" },
    { name: "unknownBoolean2",              type: "boolean" },
    { name: "unknownDword9",                type: "uint32" }
];


var loadoutDataSubSchema1 = [
    { name: "loadoutId",                    type: "uint32" },
    { name: "unknownData1",                 type: "schema", fields: [
        { name: "unknownDword1",                type: "uint32" },
        { name: "unknownByte1",                 type: "uint8" }
    ]},
    { name: "unknownDword2",                type: "uint32" },
    { name: "unknownData2",                 type: "schema", fields: [
        { name: "unknownDword1",                type: "uint32" },
        { name: "loadoutName",                  type: "string" }
    ]},
    { name: "tintItemId",                   type: "uint32" },
    { name: "unknownDword4",                type: "uint32" },
    { name: "decalItemId",                  type: "uint32" },
    { name: "loadoutSlots",                 type: "array", fields: [
        { name: "loadoutSlotId",                type: "uint32" },
        { name: "loadoutSlotData",              type: "schema", fields: [
            { name: "index",                        type: "uint32" },
            { name: "loadoutSlotItem",              type: "schema", fields: [
                { name: "itemLineId",                   type: "uint32" },
                { name: "flags",                        type: "uint8" },
                { name: "attachments",                  type: "array", fields: [
                    { name: "attachmentId",                 type: "uint32" }
                ]},
                { name: "attachmentClasses",            type: "array", fields: [
                    { name: "classId",                      type: "uint32" },
                    { name: "attachmentId",                 type: "uint32" }
                ]}
            ]},
            { name: "tintItemId",                   type: "uint32" },
            { name: "itemSlot",                     type: "uint32" }
        ]}
    ]}
];

var loadoutDataSubSchema2 = [
    { name: "unknownDword1",           type: "uint32" },
    { name: "unknownData1",            type: "schema", fields: [
        { name: "unknownDword1",           type: "uint32" },
        { name: "unknownByte1",            type: "uint8" }
    ]},
    { name: "unknownString1",          type: "string" },
    { name: "unknownDword2",           type: "uint32" },
    { name: "unknownDword3",           type: "uint32" },
    { name: "unknownDword4",           type: "uint32" },
    { name: "unknownDword5",           type: "uint32" },
    { name: "unknownArray1",              type: "array", fields: [
        { name: "unknownDword1",           type: "uint32" },
        { name: "unknownData1",            type: "schema", fields: [
            { name: "unknownDword1",           type: "uint32" },

            { name: "unknownData1",            type: "schema", fields: [
                { name: "unknownDword1",           type: "uint32" },
                { name: "unknownByte1",            type: "uint8" },
                { name: "unknownArray1",           type: "array", fields: [
                    { name: "unknownDword1",           type: "uint32" }
                ]},
                { name: "unknownArray2",           type: "array", fields: [
                    { name: "unknownDword1",           type: "uint32" },
                    { name: "unknownDword2",           type: "uint32" }
                ]}
            ]},

            { name: "unknownDword2",           type: "uint32" },
            { name: "unknownDword3",           type: "uint32" }
        ]}
    ]}
];


var fullNpcDataSchema = [
    { name: "transient_id",             type: "custom", parser: readUnsignedIntWith2bitLengthValue, packer: packUnsignedIntWith2bitLengthValue },
    { name: "unknownDword1",            type: "uint32" },
    { name: "unknownDword2",            type: "uint32" },
    { name: "unknownDword3",            type: "uint32" },
    { name: "attachments",              type: "array", fields: [
        { name: "unknownString1",           type: "string" },
        { name: "unknownString2",           type: "string" },
        { name: "unknownString3",           type: "string" },
        { name: "unknownString4",           type: "string" },
        { name: "unknownDword1",            type: "uint32" },
        { name: "unknownDword2",            type: "uint32" },
        { name: "unknownDword3",            type: "uint32" }
    ]},
    { name: "unknownString1",           type: "string" },
    { name: "unknownString2",           type: "string" },
    { name: "unknownDword4",            type: "uint32" },
    { name: "unknownFloat1",            type: "float" },
    { name: "unknownDword5",            type: "uint32" },
    { name: "unknownVector1",           type: "floatvector3" },
    { name: "unknownVector2",           type: "floatvector3" },
    { name: "unknownFloat2",            type: "float" },
    { name: "unknownDword6",            type: "uint32" },
    { name: "unknownDword7",            type: "uint32" },
    { name: "unknownDword8",            type: "uint32" },
    { name: "effectTags",            type: "array", fields: [
        { name: "unknownDword1",            type: "uint32" },
        { name: "unknownDword2",            type: "uint32" },
        { name: "unknownDword3",            type: "uint32" },
        { name: "unknownDword4",            type: "uint32" },
        { name: "unknownDword5",            type: "uint32" },
        { name: "unknownDword6",            type: "uint32" },
        { name: "unknownDword7",            type: "uint32" },
        { name: "unknownDword8",            type: "uint32" },
        { name: "unknownDword9",            type: "uint32" },
        { name: "unknownFloat1",            type: "float" },
        { name: "unknownDword10",           type: "uint32" },
        { name: "unknownQword1",            type: "uint64" },
        { name: "unknownQword2",            type: "uint64" },
        { name: "unknownQword3",            type: "uint64" },
        { name: "unknownGuid1",             type: "uint64" },
        { name: "unknownDword11",           type: "uint32" },
        { name: "unknownDword12",           type: "uint32" },
        { name: "unknownDword13",           type: "uint32" },
        { name: "unknownDword14",           type: "uint32" },
        { name: "unknownDword15",           type: "uint32" },
        { name: "unknownDword16",           type: "uint32" },
        { name: "unknownDword17",           type: "uint32" },
        { name: "unknownGuid2",             type: "uint64" },
        { name: "unknownDword18",           type: "uint32" },
        { name: "unknownDword19",           type: "uint32" },
        { name: "unknownDword20",           type: "uint32" },
        { name: "unknownDword21",           type: "uint32" },
        { name: "unknownGuid3",             type: "uint64" },
        { name: "unknownGuid4",             type: "uint64" },
        { name: "unknownDword22",           type: "uint32" },
        { name: "unknownQword4",            type: "uint64" },
        { name: "unknownDword23",           type: "uint32" }
    ]},
    { name: "unknownData1",             type: "schema", fields: [
        { name: "unknownDword1",            type: "uint32" },
        { name: "unknownString1",           type: "string" },
        { name: "unknownString2",           type: "string" },
        { name: "unknownDword2",            type: "uint32" },
        { name: "unknownString3",           type: "string" }
    ]},
    { name: "unknownVector4",           type: "floatvector4" },
    { name: "unknownDword9",            type: "uint32" },
    { name: "unknownDword10",           type: "uint32" },
    { name: "unknownDword11",           type: "uint32" },
    { name: "characterId",              type: "uint64" },
    { name: "unknownFloat3",            type: "float" },
    { name: "targetData",               type: "schema", fields: targetDataSchema },
    { name: "characterVariables",       type: "array", fields: [
        { name: "unknownString1",           type: "string" },
        { name: "unknownDword1",            type: "uint32" }
    ]},
    { name: "unknownDword12",           type: "uint32" },
    { name: "unknownFloat4",            type: "float" },
    { name: "unknownVector5",           type: "floatvector4" },
    { name: "unknownDword13",           type: "uint32" },
    { name: "unknownFloat5",            type: "float" },
    { name: "unknownFloat6",            type: "float" },
    { name: "unknownData2",             type: "schema", fields: [
        { name: "unknownFloat1",            type: "float" }
    ]},
    { name: "unknownDword14",           type: "uint32" },
    { name: "unknownDword15",           type: "uint32" },
    { name: "unknownDword16",           type: "uint32" },
    { name: "unknownDword17",           type: "uint32" },
    { name: "unknownDword18",           type: "uint32" },
    { name: "unknownByte1",             type: "uint8" },
    { name: "unknownByte2",             type: "uint8" },
    { name: "unknownDword19",           type: "uint32" },
    { name: "unknownDword20",           type: "uint32" },
    { name: "unknownDword21",           type: "uint32" },
    { name: "resources",                type: "array", fields: resourceEventDataSubSchema },
    { name: "unknownGuid1",             type: "uint64" },
    { name: "unknownData3",             type: "schema", fields: [
        { name: "unknownDword1",            type: "uint32" }
    ]},
    { name: "unknownDword22",           type: "uint32" },
    { name: "unknownBytes1",            type: "byteswithlength" },
    { name: "unknownBytes2",            type: "byteswithlength" }
];

var respawnLocationDataSchema = [
    { name: "guid",                     type: "uint64" },
    { name: "respawnType",              type: "uint8" },
    { name: "position",                 type: "floatvector4" },
    { name: "unknownDword1",            type: "uint32" },
    { name: "unknownDword2",            type: "uint32" },
    { name: "iconId1",                  type: "uint32" },
    { name: "iconId2",                  type: "uint32" },
    { name: "respawnTotalTime",         type: "uint32" },
    { name: "unknownDword3",            type: "uint32" },
    { name: "nameId",                   type: "uint32" },
    { name: "distance",                 type: "float" },
    { name: "unknownByte1",             type: "uint8" },
    { name: "unknownByte2",             type: "uint8" },
    { name: "unknownData1",             type: "schema", fields: [
        { name: "unknownByte1",             type: "uint8" },
        { name: "unknownByte2",             type: "uint8" },
        { name: "unknownByte3",             type: "uint8" },
        { name: "unknownByte4",             type: "uint8" },
        { name: "unknownByte5",             type: "uint8" }
    ]},
    { name: "unknownDword4",            type: "uint32" },
    { name: "unknownByte3",             type: "uint8" },
    { name: "unknownByte4",             type: "uint8" }  
]


var packets = [
    ["Server",                                          0x01, {}],
    ["ClientFinishedLoading",                           0x02, {}],
    ["SendSelfToClient",                                0x03, {
        fields: [
            { name: "data",                 type: "byteswithlength", fields: [
                { name: "guid",                 type: "uint64" },
                { name: "characterId",          type: "uint64" },
                { name: "unknownUint1",         type: "custom", parser: readUnsignedIntWith2bitLengthValue, packer: packUnsignedIntWith2bitLengthValue },
                { name: "lastLoginDate",        type: "uint64" },
                { name: "actorModelId",         type: "uint32" },
                { name: "headActor",            type: "string" },
                { name: "unknownString1",       type: "string" },
                { name: "unknownDword4",        type: "uint32" },
                { name: "unknownDword5",        type: "uint32" },
                { name: "unknownString2",       type: "string" },
                { name: "unknownString3",       type: "string" },
                { name: "unknownString4",       type: "string" },
                { name: "headId",               type: "uint32" },
                { name: "unknownDword6",        type: "uint32" },
                { name: "factionId",            type: "uint32" },
                { name: "unknownDword9",        type: "uint32" },
                { name: "unknownDword10",       type: "uint32" },
                { name: "position",             type: "floatvector4" },
                { name: "unknownVector2",       type: "floatvector4" },
                { name: "identity",             type: "schema", fields: [
                    { name: "unknownDword1",       type: "uint32" },
                    { name: "unknownDword2",       type: "uint32" },
                    { name: "unknownDword3",       type: "uint32" },
                    { name: "characterName",        type: "string" },
                    { name: "unknownString1",       type: "string" }
                ]},
                { name: "unknownDword14",       type: "uint32" },
                { name: "currency",             type: "array", fields: [
                    { name: "currencyId",           type: "uint32" },
                    { name: "quantity",             type: "uint32" }
                ]},
                { name: "creationDate",         type: "uint64" },
                { name: "unknownDword15",       type: "uint32" },
                { name: "unknownDword16",       type: "uint32" },
                { name: "unknownBoolean1",      type: "boolean" },
                { name: "unknownBoolean2",      type: "boolean" },
                { name: "unknownDword17",       type: "uint32" },
                { name: "unknownDword18",       type: "uint32" },
                { name: "unknownBoolean3",      type: "boolean" },
                { name: "unknownDword19",       type: "uint32" },
                { name: "gender",               type: "uint32" },
                { name: "unknownDword21",       type: "uint32" },
                { name: "unknownDword22",       type: "uint32" },
                { name: "unknownDword23",       type: "uint32" },
                { name: "unknownBoolean4",      type: "boolean" },
                { name: "unknownTime1",         type: "uint64" },
                { name: "unknownTime2",         type: "uint64" },
                { name: "unknownTime3",         type: "uint64" },
                { name: "unknownDword24",       type: "uint32" },
                { name: "unknownBoolean5",      type: "boolean" },
                { name: "unknownDword25",       type: "uint32" },
                { name: "profiles",             type: "array", fields: profileDataSchema },
                { name: "currentProfile",       type: "uint32" },
                { name: "unknownArray2",        type: "array",  fields: [
                    { name: "unknownDword1",        type: "int32" },
                    { name: "unknownDword2",        type: "int32" }
                ]},
                { name: "collections",        type: "array",  fields: [
                    { name: "unknownDword1",        type: "uint32" },
                    { name: "unknownDword2",        type: "uint32" },
                    { name: "unknownDword3",        type: "uint32" },
                    { name: "unknownDword4",        type: "uint32" },
                    { name: "unknownDword5",        type: "uint32" },
                    { name: "unknownDword6",        type: "uint32" },
                    { name: "unknownDword7",        type: "uint32" },

                    { name: "unknownData1",         type: "schema", fields: rewardBundleDataSchema },                    

                    { name: "unknownArray2",        type: "array", fields: [
                        { name: "unknownDword1",        type: "uint32" },
                        { name: "unknownData1",         type: "schema", fields: [
                            { name: "unknownDword1",        type: "uint32" },
                            { name: "unknownDword2",        type: "uint32" },
                            { name: "unknownDword3",        type: "uint32" },
                            { name: "unknownDword4",        type: "uint32" },
                            { name: "unknownDword5",        type: "uint32" },
                            { name: "unknownDword6",        type: "uint32" },
                            { name: "unknownDword7",        type: "uint32" },
                            { name: "unknownBoolean1",      type: "boolean" }
                        ]}
                    ]}
                ]},
                { name: "inventory",            type: "schema", fields: [
                    { name: "items",                type: "array", fields: [
                        { name: "itemData",             type: "custom", parser: parseItemData, packer: packItemData }
                    ]},
                    { name: "unknownDword1",        type: "uint32" }
                ]},
                { name: "unknownDword28",           type: "uint32" },
                { name: "characterQuests",          type: "schema", fields: [
                    { name: "quests",                   type: "array", fields: [
                        { name: "unknownDword1",            type: "uint32" },
                        { name: "unknownDword2",            type: "uint32" },
                        { name: "unknownDword3",            type: "uint32" },
                        { name: "unknownDword4",            type: "uint32" },
                        { name: "unknownBoolean1",          type: "boolean" },
                        { name: "unknownGuid1",             type: "uint64" },
                        { name: "unknownDword5",            type: "uint32" },
                        { name: "unknownBoolean2",          type: "boolean" },
                        { name: "unknownFloat1",            type: "float" },

                        { name: "reward",                   type: "schema", fields: rewardBundleDataSchema },                    

                        { name: "unknownArray2",            type: "array", fields: [
                            { name: "unknownDword1",            type: "uint32" },
                            { name: "unknownDword2",            type: "uint32" },
                            { name: "unknownDword3",            type: "uint32" },
                            { name: "unknownBoolean1",          type: "boolean" },

                            { name: "reward",               type: "schema", fields: rewardBundleDataSchema },                    

                            { name: "unknownDword14",           type: "uint32" },
                            { name: "unknownDword15",           type: "uint32" },
                            { name: "unknownDword16",           type: "uint32" },
                            { name: "unknownDword17",           type: "uint32" },
                            { name: "unknownBoolean4",          type: "boolean" },

                            { name: "unknownDword18",           type: "uint32" },
                            { name: "unknownDword19",           type: "uint32" },
                            { name: "unknownDword20",           type: "uint32" },
                            { name: "unknownDword21",           type: "uint32" }
                        ]},
                        { name: "unknownDword6",            type: "uint32" },
                        { name: "unknownBoolean3",          type: "boolean" },
                        { name: "unknownBoolean4",          type: "boolean" }
                    ]},
                    { name: "unknownDword1",            type: "uint32" },
                    { name: "unknownDword2",            type: "uint32" },
                    { name: "unknownBoolean1",          type: "boolean" },
                    { name: "unknownDword3",            type: "uint32" },
                    { name: "unknownDword4",            type: "uint32" }
                ]},
                { name: "characterAchievements",    type: "array", fields: achievementDataSchema },
                { name: "acquaintances",            type: "array", fields: [
                    { name: "unknownGuid1",             type: "uint64" },
                    { name: "unknownString1",           type: "string" },
                    { name: "unknownDword1",            type: "uint32" },
                    { name: "unknownGuid2",             type: "uint64" },
                    { name: "unknownBoolean1",          type: "boolean" }
                ]},
                { name: "recipes",                  type: "array", fields: [
                    { name: "unknownDword1",            type: "uint32" },
                    { name: "unknownDword2",            type: "uint32" },
                    { name: "unknownDword3",            type: "uint32" },
                    { name: "unknownDword4",            type: "uint32" },
                    { name: "unknownDword5",            type: "uint32" },
                    { name: "unknownDword6",            type: "uint32" },
                    { name: "unknownBoolean1",          type: "boolean" },
                    { name: "unknownDword7",            type: "uint32" },
                    { name: "components",               type: "array", fields: [
                        { name: "unknownDword1",            type: "uint32" },
                        { name: "unknownDword2",            type: "uint32" },
                        { name: "unknownDword3",            type: "uint32" },
                        { name: "unknownDword4",            type: "uint32" },
                        { name: "unknownDword5",            type: "uint32" },
                        { name: "unknownQword1",            type: "uint64" },
                        { name: "unknownDword6",            type: "uint32" },
                        { name: "unknownDword7",            type: "uint32" }
                    ]},                    
                    { name: "unknownDword8",            type: "uint32" }
                ]},
                { name: "mounts",            type: "array", fields: [
                    { name: "unknownDword1",            type: "uint32" },
                    { name: "unknownDword2",            type: "uint32" },
                    { name: "unknownDword3",            type: "uint32" },
                    { name: "unknownQword1",            type: "uint64" },
                    { name: "unknownBoolean1",          type: "boolean" },
                    { name: "unknownDword4",            type: "uint32" },
                    { name: "unknownString1",            type: "string" }
                ]},
                { name: "unknownCoinStoreData",     type: "schema", fields: [
                    { name: "unknownBoolean1",          type: "boolean" },
                    { name: "unknownArray1",            type: "array", fields: [
                        { name: "unknownDword1",            type: "uint32" }
                    ]}
                ]},
                { name: "unknownArray10",           type: "array", fields: [
                    { name: "unknownDword1",            type: "uint32" }
                ]},
                { name: "unknownEffectArray",       type: "array", fields: [
                    { name: "unknownDword1",            type: "uint32" },
                    { name: "unknownData1",             type: "schema", fields: [
                        { name: "unknownData1",             type: "schema", fields: [
                            { name: "unknownDword1",            type: "uint32" },
                            { name: "unknownDword2",            type: "uint32" },
                            { name: "unknownDword3",            type: "uint32" },
                            { name: "unknownDword4",            type: "uint32" },
                            { name: "unknownDword5",            type: "uint32" },
                            { name: "unknownDword6",            type: "uint32" },
                            { name: "unknownDword7",            type: "uint32" },
                            { name: "unknownDword8",            type: "uint32" },
                            { name: "unknownDword9",            type: "uint32" },
                            { name: "unknownFloat1",            type: "float" },
                            { name: "unknownDword10",           type: "uint32" },
                            { name: "unknownQword1",            type: "uint64" },
                            { name: "unknownQword2",            type: "uint64" },
                            { name: "unknownQword3",            type: "uint64" },
                            { name: "unknownGuid1",             type: "uint64" },
                            { name: "unknownDword11",           type: "uint32" },
                            { name: "unknownDword12",           type: "uint32" },
                            { name: "unknownDword13",           type: "uint32" },
                            { name: "unknownDword14",           type: "uint32" },
                            { name: "unknownDword15",           type: "uint32" },
                            { name: "unknownDword16",           type: "uint32" },
                            { name: "unknownDword17",           type: "uint32" },
                            { name: "unknownGuid2",             type: "uint64" },
                            { name: "unknownDword18",           type: "uint32" },
                            { name: "unknownDword19",           type: "uint32" },
                            { name: "unknownByte1",             type: "uint8" },
                            { name: "unknownDword20",           type: "uint32" },
                            { name: "unknownGuid3",             type: "uint64" },
                            { name: "unknownGuid4",             type: "uint64" },
                            { name: "unknownDword21",           type: "uint32" },
                            { name: "unknownQword4",            type: "uint64" },
                            { name: "unknownDword22",           type: "uint32" }
                        ]},
                        { name: "unknownDword1",            type: "uint32" },
                        { name: "unknownBoolean1",          type: "boolean" },
                        { name: "unknownDword2",            type: "uint32" },
                        { name: "unknownDword3",            type: "uint32" },
                        { name: "unknownArray1",            type: "array", fields: [
                            { name: "unknownDword1",            type: "uint32" }
                        ]}
                    ]}
                ]},
                { name: "stats",                    type: "array", fields: [
                    { name: "statId",                   type: "uint32" },
                    { name: "statData",                 type: "schema", fields: [
                        { name: "statId",                   type: "uint32" },
                        { name: "statValue",                type: "variabletype8",
                            types: {
                                0: [
                                    { name: "base",             type: "uint32" },
                                    { name: "modifier",         type: "uint32" }
                                ],
                                1: [
                                    { name: "base",             type: "float" },
                                    { name: "modifier",         type: "float" }
                                ]
                            }
                        }
                    ]}
                ]},
                { name: "playerTitles",             type: "array", fields: [
                    { name: "titleId",                  type: "uint32" },
                    { name: "titleType",                type: "uint32" },
                    { name: "stringId",                 type: "uint32" }
                ]},
                { name: "currentPlayerTitle",       type: "uint32" },
                { name: "unknownArray13",             type: "array", fields: [
                    { name: "unknownDword1",            type: "uint32" },
                    { name: "unknownDword2",            type: "uint32" }
                ]},
                { name: "unknownArray14",             type: "array", fields: [
                    { name: "unknownDword1",            type: "uint32" }
                ]},
                { name: "unknownDword33",           type: "uint32" },
                { name: "unknownArray15",             type: "array", fields: [
                    { name: "unknownDword1",            type: "uint32" }
                ]},
                { name: "unknownArray16",             type: "array", fields: [
                    { name: "unknownDword1",            type: "uint32" }
                ]},
                { name: "unknownArray17",             type: "array", fields: [
                    { name: "unknownBoolean1",            type: "boolean" }
                ]},
                // { name: "unknownDword34",           type: "uint32" },
                // { name: "unknownDword35",           type: "uint32" },
                // { name: "unknownDword36",           type: "uint32" },
                { name: "unknownArray18",             type: "array", fields: [
                    { name: "unknownDword1",           type: "uint32" },
                    { name: "unknownDword2",           type: "uint32" },
                    { name: "unknownDword3",           type: "uint32" },
                    { name: "unknownDword4",           type: "uint32" },
                    { name: "unknownDword5",           type: "uint32" },
                    { name: "unknownDword6",           type: "uint32" },
                    { name: "unknownDword7",           type: "uint32" },
                    { name: "unknownByte1",            type: "uint8" }
                ]},
                { name: "unknownArray19",             type: "array", fields: [
                    { name: "unknownDword1",           type: "uint32" },
                    { name: "unknownDword2",           type: "uint32" },
                    { name: "unknownDword3",           type: "uint32" },
                    { name: "unknownDword4",           type: "uint32" },
                    { name: "unknownDword5",           type: "uint32" },
                    { name: "unknownDword6",           type: "uint32" },
                    { name: "unknownDword7",           type: "uint32" },
                    { name: "unknownByte1",            type: "uint8" }
                ]},
                { name: "unknownArray20",             type: "array", fields: [
                    { name: "unknownDword1",           type: "uint32" },
                    { name: "unknownDword2",           type: "uint32" }
                ]},
                { name: "unknownData1",             type: "schema", fields: [
                    { name: "abilityLines",             type: "array", fields: [
                        { name: "abilityLineId",            type: "uint32" },
                        { name: "abilityLineData",          type: "schema", fields: [
                            { name: "abilityLineId",            type: "uint32" },
                            { name: "abilityId",                type: "uint32" },
                            { name: "abilityLineIndex",         type: "uint32" }
                        ]}
                    ]},
                    { name: "unknownArray2",             type: "array", fields: [
                        { name: "unknownDword1",           type: "uint32" },
                        { name: "unknownDword2",           type: "uint32" },
                        { name: "unknownDword3",           type: "uint32" },
                        { name: "unknownDword4",           type: "uint32" }
                    ]},
                    { name: "unknownArray3",             type: "array", fields: [
                        { name: "unknownDword1",           type: "uint32" },
                        { name: "unknownDword2",           type: "uint32" },
                        { name: "unknownDword3",           type: "uint32" },
                        { name: "unknownDword4",           type: "uint32" }
                    ]},
                    { name: "unknownArray4",             type: "array", fields: [
                        { name: "unknownDword1",           type: "uint32" },
                        { name: "unknownDword2",           type: "uint32" },
                        { name: "unknownDword3",           type: "uint32" },
                        { name: "unknownDword4",           type: "uint32" }
                    ]},
                    { name: "unknownDword1",           type: "uint32" },
                    { name: "unknownDword2",           type: "uint32" },
                    { name: "unknownArray5",             type: "array", fields: [
                        { name: "unknownDword1",           type: "uint32" },
                        { name: "unknownData1",            type: "schema", fields: [
                            { name: "unknownDword1",           type: "uint32" },
                            { name: "unknownDword2",           type: "uint32" },
                            { name: "unknownDword3",           type: "uint32" },
                            { name: "unknownGuid1",            type: "uint64" },
                            { name: "unknownGuid2",            type: "uint64" }
                        ]}
                    ]},
                    { name: "unknownArray6",             type: "array", fields: [
                        { name: "unknownDword1",           type: "uint32" },
                        { name: "unknownData1",            type: "schema", fields: [
                            { name: "unknownDword1",           type: "uint32" },
                            { name: "unknownDword2",           type: "uint32" },
                            { name: "unknownDword3",           type: "uint32" },
                            { name: "unknownGuid1",            type: "uint64" }
                        ]}
                    ]},
                    { name: "unknownArray7",             type: "array", fields: [
                        { name: "unknownDword1",           type: "uint32" },
                        { name: "unknownDword2",           type: "uint32" }
                    ]}
                ]},
                { name: "unknownArray21",             type: "array", fields: [
                    { name: "unknownDword1",           type: "uint32" },
                    { name: "unknownDword2",           type: "uint32" },
                    { name: "unknownDword3",           type: "uint32" }
                ]},
                { name: "unknownArray22",             type: "array", fields: [
                    { name: "unknownDword1",           type: "uint32" },

                    { name: "unknownDword2",           type: "uint32" },
                    { name: "unknownGuid1",            type: "uint64" },
                    { name: "unknownFloat1",           type: "float" },

                    { name: "unknownDword3",           type: "uint32" }
                ]},
                { name: "unknownArray23",             type: "array", fields: [
                    { name: "unknownDword1",           type: "uint32" },
                    { name: "unknownByte1",            type: "uint8" },

                    { name: "unknownDword2",           type: "uint32" },
                    { name: "unknownGuid1",            type: "uint64" },
                    { name: "unknownFloat1",           type: "float" },

                    { name: "unknownDword3",           type: "uint32" },
                    { name: "unknownByte2",            type: "uint8" }
                ]},
                { name: "unknownByte1",            type: "uint8" },

                { name: "unknownData2",             type: "schema", fields: [
                    { name: "unknownDword1",           type: "uint32" },
                    { name: "unknownData1",             type: "schema", fields: [
                        { name: "unknownDword1",           type: "uint32" },
                        { name: "unknownDword2",           type: "uint32" },
                        { name: "unknownDword3",           type: "uint32" }
                    ]},
                    { name: "unknownData2",             type: "schema", fields: [
                        { name: "unknownDword1",           type: "uint32" },
                        { name: "unknownDword2",           type: "uint32" },
                        { name: "unknownDword3",           type: "uint32" }
                    ]},
                    { name: "unknownDword2",           type: "uint32" }
                ]},
                { name: "unknownDword37",           type: "uint32" },
                { name: "unknownArray24",             type: "array", fields: [
                    { name: "unknownDword1",           type: "uint32" },
                    { name: "unknownFloat1",           type: "float" }
                ]},

                { name: "unknownData3",             type: "schema", fields: [
                    { name: "unknownDword1",           type: "uint32" },
                    { name: "unknownDword2",           type: "uint32" },
                    { name: "unknownDword3",           type: "uint32" },
                    { name: "unknownDword4",           type: "uint32" },
                    { name: "unknownDword5",           type: "uint32" }
                ]},

                { name: "unknownArray25",             type: "array", fields: [
                    { name: "unknownDword1",           type: "uint32" },
                    { name: "unknownGuid1",            type: "uint64" },
                    { name: "unknownFloat1",           type: "float" },
                    { name: "unknownFloat2",           type: "float" }
                ]},

                { name: "unknownArray26",             type: "array", fields: [
                    { name: "unknownDword1",           type: "uint32" },
                    { name: "unknownGuid1",            type: "uint64" },
                    { name: "unknownArray1",             type: "array", fields: [
                        { name: "unknownDword1",           type: "uint32" },
                        { name: "unknownDword2",           type: "uint32" }
                    ]}
                ]},
                
                { name: "unknownArray27",               type: "array", fields: [
                    { name: "unknownData1",                 type: "schema", fields: [
                        { name: "unknownDword1",                type: "uint32" },
                        { name: "unknownGuid1",                 type: "uint64" },
                        { name: "unknownGuid2",                 type: "uint64" }
                    ]},
                    { name: "effectTagData",                type: "schema", fields: effectTagDataSchema }
                ]},

                { name: "unknownArray28",               type: "array", fields: [
                    { name: "unknownDword1",                type: "uint32" },
                    { name: "unknownDword2",                type: "uint32" },
                    { name: "unknownData1",                 type: "schema", fields: [
                        { name: "unknownString1",               type: "string" },
                        { name: "unknownString2",               type: "string" }
                    ]},
                    { name: "unknownArray1",            type: "array", fields: [
                        { name: "unknownDword1",            type: "uint32" },
                        { name: "unknownData1",             type: "schema", fields: [
                            { name: "unknownDword1",            type: "uint32" },
                            { name: "unknownGuid1",             type: "uint64" },
                            { name: "unknownString1",           type: "string" },
                            { name: "unknownString2",           type: "string" }
                        ]}
                    ]}
                ]},
                
                { name: "playerRanks",             type: "array", fields: [
                    { name: "rankId",           type: "uint32" },
                    { name: "rankData",            type: "schema", fields: [
                        { name: "rankId",                  type: "uint32" },
                        { name: "score",                   type: "uint32" },
                        { name: "unknownDword3",           type: "uint32" },
                        { name: "rank",                    type: "uint32" },
                        { name: "rankProgress",            type: "uint32" }
                    ]}
                ]},

                { name: "unknownData4",             type: "schema", fields: [
                    { name: "unknownDword1",           type: "uint32" },
                    { name: "unknownDword2",           type: "uint32" },
                    { name: "unknownDword3",           type: "uint32" },
                    { name: "unknownDword4",           type: "uint32" },
                    { name: "unknownDword5",           type: "uint32" }
                ]},

                { name: "unknownData5",             type: "schema", fields: [
                    { name: "unknownDword1",           type: "uint32" },
                    { name: "unknownDword2",           type: "uint32" },
                    { name: "unknownDword3",           type: "uint32" }
                ]},

                { name: "implantSlots",             type: "array", fields: [
                    { name: "unknownDword1",           type: "uint32" },
                    { name: "unknownData1",            type: "schema", fields: [
                        { name: "unknownDword1",           type: "uint32" },
                        { name: "unknownDword2",           type: "uint32" },
                        { name: "unknownDword3",           type: "uint32" },
                        { name: "unknownDword4",           type: "uint32" }
                    ]}
                ]},

                { name: "itemTimerData",             type: "schema", fields: [
                    { name: "unknownData1",            type: "schema", fields: [
                        { name: "unknownDword1",           type: "uint32" },
                        { name: "unknownFloat1",           type: "float" },
                        { name: "unknownTime1",            type: "uint64" },
                        { name: "unknownTime2",            type: "uint64" }
                    ]},
                    { name: "unknownArray1",              type: "array", fields: [
                        { name: "unknownDword1",           type: "uint32" },
                        { name: "unknownData1",            type: "schema", fields: [
                            { name: "unknownDword1",           type: "uint32" },
                            { name: "unknownFloat1",           type: "float" },
                            { name: "unknownTime1",            type: "uint64" },
                            { name: "unknownTime2",            type: "uint64" }
                        ]},
                        { name: "unknownDword2",           type: "uint32" }
                    ]},
                    { name: "unknownData2",            type: "schema", fields: [
                        { name: "unknownDword1",           type: "uint32" },
                        { name: "unknownFloat1",           type: "float" },
                        { name: "unknownTime1",            type: "uint64" }
                    ]},
                    { name: "unknownArray2",              type: "array", fields: [
                        { name: "unknownDword1",           type: "uint32" },
                        { name: "unknownData1",            type: "schema", fields: [
                            { name: "unknownDword1",           type: "uint32" },
                            { name: "unknownFloat1",           type: "float" },
                            { name: "unknownTime1",            type: "uint64" },
                            { name: "unknownDword2",           type: "uint32" },
                            { name: "unknownDword3",           type: "uint32" },
                            { name: "unknownDword4",           type: "uint32" }
                        ]}
                    ]},
                    { name: "unknownArray3",              type: "array", fields: [
                        { name: "unknownDword1",           type: "uint32" },
                        { name: "unknownData1",            type: "schema", fields: [
                            { name: "unknownDword1",           type: "uint32" },
                            { name: "unknownFloat1",           type: "float" },
                            { name: "unknownTime1",            type: "uint64" },
                            { name: "unknownDword2",           type: "uint32" },
                            { name: "unknownDword3",           type: "uint32" },
                            { name: "unknownByte1",            type: "uint8" }
                        ]}
                    ]},
                    { name: "unknownArray4",              type: "array", fields: [
                        { name: "unknownDword1",           type: "uint32" },
                        { name: "unknownData1",            type: "schema", fields: [
                            { name: "unknownDword1",           type: "uint32" },
                            { name: "unknownFloat1",           type: "float" },
                            { name: "unknownTime1",            type: "uint64" },
                            { name: "unknownDword2",           type: "uint32" },
                            { name: "unknownDword3",           type: "uint32" },
                            { name: "unknownDword4",           type: "uint32" },
                            { name: "unknownByte1",            type: "uint8" }
                        ]}
                    ]},
                    { name: "unknownByte1",            type: "uint8" }
                ]},


                { name: "characterLoadoutData",     type: "schema", fields: [
                    { name: "loadouts",                 type: "array", fields: [
                        { name: "loadoutId",                type: "uint32" },
                        { name: "unknownDword2",            type: "uint32" },
                        { name: "loadoutData",              type: "schema", fields: loadoutDataSubSchema1}
                    ]},
                    { name: "unknownArray2",              type: "array", fields: [
                        { name: "unknownDword1",           type: "uint32" },
                        { name: "unknownDword2",           type: "uint32" },
                        { name: "unknownData1",            type: "schema", fields: loadoutDataSubSchema2}
                    ]},
                    { name: "unknownArray3",              type: "array", fields: [
                        { name: "unknownDword1",           type: "uint32" },

                        { name: "unknownData1",            type: "schema", fields: [
                            { name: "unknownDword1",           type: "uint32" },
                            { name: "unknownByte1",            type: "uint8" },
                            { name: "unknownArray1",           type: "array", fields: [
                                { name: "unknownDword1",           type: "uint32" }
                            ]},
                            { name: "unknownArray2",           type: "array", fields: [
                                { name: "unknownDword1",           type: "uint32" },
                                { name: "unknownDword2",           type: "uint32" }
                            ]}
                        ]}
                    ]},
                    { name: "unknownData1",            type: "schema", fields: loadoutDataSubSchema1 },
                    { name: "unknownData2",            type: "schema", fields: loadoutDataSubSchema2 },
                    { name: "unknownDword1",           type: "uint32" },
                    { name: "unknownDword2",           type: "uint32" },
                    { name: "unknownDword3",           type: "uint32" },
                    { name: "unknownDword4",           type: "uint32" }
                ]},

                { name: "missionData",             type: "schema", fields: [
                    { name: "unknownArray1",              type: "array", fields: [
                        { name: "unknownData1",            type: "schema", fields: [
                            { name: "unknownDword1",           type: "uint32" },
                            { name: "unknownTime1",            type: "uint64" },
                            { name: "unknownByte1",            type: "uint8" },
                            { name: "unknownDword2",           type: "uint32" },
                            { name: "unknownDword3",           type: "uint32" }
                        ]},
                        { name: "unknownDword1",           type: "uint32" }
                    ]},
                    { name: "unknownArray2",              type: "array", fields: [
                        { name: "unknownData1",            type: "schema", fields: [
                            { name: "unknownDword1",           type: "uint32" },
                            { name: "unknownTime1",            type: "uint64" },
                            { name: "unknownByte1",            type: "uint8" },
                            { name: "unknownDword2",           type: "uint32" },
                            { name: "unknownDword3",           type: "uint32" }
                        ]},
                        { name: "unknownFloat1",           type: "float" }
                    ]},
                    { name: "unknownArray3",              type: "array", fields: [
                        { name: "unknownData1",            type: "schema", fields: [
                            { name: "unknownDword1",           type: "uint32" },
                            { name: "unknownTime1",            type: "uint64" },
                            { name: "unknownByte1",            type: "uint8" },
                            { name: "unknownDword2",           type: "uint32" },
                            { name: "unknownDword3",           type: "uint32" }
                        ]},
                        { name: "unknownGuid1",            type: "uint64" }
                    ]},
                    { name: "unknownArray4",              type: "array", fields: [
                        { name: "unknownData1",            type: "schema", fields: [
                            { name: "unknownData1",            type: "schema", fields: [
                                { name: "unknownDword1",           type: "uint32" },
                                { name: "unknownTime1",            type: "uint64" },
                                { name: "unknownByte1",            type: "uint8" }
                            ]},
                            { name: "unknownData2",            type: "schema", fields: [
                                { name: "unknownDword1",           type: "uint32" },
                                { name: "unknownTime1",            type: "uint64" },
                                { name: "unknownByte1",            type: "uint8" }
                            ]},
                            { name: "unknownData3",            type: "schema", fields: [
                                { name: "unknownDword1",           type: "uint32" },
                                { name: "unknownDword2",           type: "uint32" },
                                { name: "unknownDword3",           type: "uint32" }
                            ]},
                            { name: "unknownDword1",           type: "uint32" },
                            { name: "unknownData4",            type: "schema", fields: [
                                { name: "unknownDword1",           type: "uint32" },
                                { name: "unknownDword2",           type: "uint32" },
                                { name: "unknownDword3",           type: "uint32" },
                                { name: "unknownDword4",           type: "uint32" },
                                { name: "unknownVector1",          type: "floatvector4" }
                            ]}
                        ]}
                    ]},
                    { name: "unknownArray5",              type: "array", fields: [
                        { name: "unknownData1",            type: "schema", fields: [
                            { name: "unknownData1",            type: "schema", fields: [
                                { name: "unknownDword1",           type: "uint32" },
                                { name: "unknownTime1",            type: "uint64" },
                                { name: "unknownByte1",            type: "uint8" }
                            ]},
                            { name: "unknownData2",            type: "schema", fields: [
                                { name: "unknownDword1",           type: "uint32" },
                                { name: "unknownTime1",            type: "uint64" },
                                { name: "unknownByte1",            type: "uint8" }
                            ]},
                            { name: "unknownData3",            type: "schema", fields: [
                                { name: "unknownDword1",           type: "uint32" },
                                { name: "unknownDword2",           type: "uint32" },
                                { name: "unknownDword3",           type: "uint32" }
                            ]},
                            { name: "unknownDword1",           type: "uint32" },
                            { name: "unknownData4",            type: "schema", fields: [
                                { name: "unknownDword1",           type: "uint32" },
                                { name: "unknownDword2",           type: "uint32" },
                                { name: "unknownDword3",           type: "uint32" },
                                { name: "unknownDword4",           type: "uint32" },
                                { name: "unknownVector1",          type: "floatvector4" }
                            ]}
                        ]}
                    ]},
                ]},


                { name: "characterResources",           type: "array", fields: [
                    { name: "resourceType",                 type: "uint32" },
                    { name: "resourceData",                 type: "schema", fields: resourceEventDataSubSchema }
                ]},
                
                { name: "characterResourceChargers",    type: "array", fields: [
                    { name: "resourceChargerId",            type: "uint32" },
                    { name: "resourceChargerData",          type: "schema", fields: [
                        { name: "resourceChargerId",            type: "uint32" },
                        { name: "unknownDword2",                type: "uint32" },
                        { name: "itemData",                     type: "schema", fields: [
                            { name: "itemId",                       type: "uint32" },
                            { name: "itemClass",                    type: "uint32" },
                        ]}
                    ]},
                    { name: "unknownByte1",           type: "uint8" }
                ]},

                { name: "skillPointData",               type: "schema", fields: [
                    { name: "skillPointsGranted",           type: "uint64" },
                    { name: "skillPointsTotal",             type: "uint64" },
                    { name: "skillPointsSpent",             type: "uint64" },
                    { name: "nextSkillPointPct",            type: "double" },
                    { name: "unknownTime1",                 type: "uint64" },
                    { name: "unknownDword1",                type: "uint32" }
                ]},

                { name: "skills",                       type: "array", fields: [
                    { name: "skillLineId",                  type: "uint32" },
                    { name: "skillId",                      type: "uint32" }
                ]},
                { name: "unknownBoolean8",              type: "boolean" },
                { name: "unknownQword1",                type: "uint64" },
                { name: "unknownDword38",               type: "uint32" },
                { name: "unknownQword2",                type: "uint64" },
                { name: "unknownQword3",                type: "uint64" },
                { name: "unknownDword39",               type: "uint32" },
                { name: "unknownDword40",               type: "uint32" },
                { name: "unknownBoolean9",              type: "boolean" }

            ]}
        ]
    }],
    ["ClientIsReady",                                   0x04, {
        fields: []
    }],
    ["ZoneDoneSendingInitialData",                      0x05, {
        fields: []
    }],
    ["Chat.Chat",                                       0x060100, {
        fields: [
            { name: "unknown2",             type: "uint16" },
            { name: "channel",              type: "uint16" },
            { name: "characterId1",         type: "uint64" },
            { name: "characterId2",         type: "uint64" },
            { name: "unknown5_0",           type: "uint32" },
            { name: "unknown5_1",           type: "uint32" },
            { name: "unknown5_2",           type: "uint32" },
            { name: "characterName1",       type: "string" },
            { name: "unknown5_3",           type: "string" },
            { name: "unknown6_0",           type: "uint32" },
            { name: "unknown6_1",           type: "uint32" },
            { name: "unknown6_2",           type: "uint32" },
            { name: "characterName2",       type: "string" },
            { name: "unknown6_3",           type: "string" },
            { name: "message",              type: "string" },
            { name: "position",             type: "floatvector4" },
            { name: "unknownGuid",          type: "uint64" },
            { name: "unknown13",            type: "uint32" },
            { name: "color1",               type: "uint32" },
            { name: "color2",               type: "uint32" },
            { name: "unknown15",            type: "uint8" },
            { name: "unknown16",            type: "boolean" }
        ]
    }],
    ["Chat.EnterArea",                                  0x060200, {}],
    ["Chat.DebugChat",                                  0x060300, {}],
    ["Chat.FromStringId",                               0x060400, {}],
    ["Chat.TellEcho",                                   0x060500, {}],
    ["Chat.ChatText",                                   0x060600, {
        fields: [
            { name: "message",              type: "string" },
            { name: "unknownDword1",        type: "uint32" },
            { name: "color",                type: "bytes",  length: 4 },
            { name: "unknownDword2",        type: "uint32" },
            { name: "unknownByte3",         type: "uint8" },
            { name: "unknownByte4",         type: "uint8" }
        ]
    }],
    ["ClientLogout",                                    0x07, {}],
    ["TargetClientNotOnline",                           0x08, {}],
    ["Command.ShowDialog",                                               0x090100, {}],
    ["AdminCommand.ShowDialog",                                          0x0A0100, {}],
    ["Command.EndDialog",                                                0x090200, {}],
    ["AdminCommand.EndDialog",                                           0x0A0200, {}],
    ["Command.StartDialog",                                              0x090300, {}],
    ["AdminCommand.StartDialog",                                         0x0A0300, {}],
    ["Command.PlayerPlaySpeech",                                         0x090400, {}],
    ["AdminCommand.PlayerPlaySpeech",                                    0x0A0400, {}],
    ["Command.DialogResponse",                                           0x090500, {}],
    ["AdminCommand.DialogResponse",                                      0x0A0500, {}],
    ["Command.PlaySoundAtLocation",                                      0x090600, {}],
    ["AdminCommand.PlaySoundAtLocation",                                 0x0A0600, {}],
    ["Command.InteractRequest",                                          0x090700, {
        fields: [
            { name: "guid",                 type: "uint64" }
        ]
    }],
    ["AdminCommand.InteractRequest",                                     0x0A0700, {
        fields: [
            { name: "guid",                 type: "uint64" }
        ]
    }],
    ["Command.InteractCancel",                                           0x090800, {
        fields: []
    }],
    ["AdminCommand.InteractCancel",                                      0x0A0800, {
        fields: []
    }],
    ["Command.InteractionList",                                          0x090900, {
        fields: [
            { name: "guid",                 type: "uint64" },
            { name: "unknownBoolean1",      type: "boolean" },
            { name: "unknownArray1",        type: "array", fields: [
                { name: "unknownDword1",        type: "uint32" },
                { name: "unknownDword2",        type: "uint32" },
                { name: "unknownDword3",        type: "uint32" },
                { name: "unknownDword4",        type: "uint32" },
                { name: "unknownDword5",        type: "uint32" },
                { name: "unknownDword6",        type: "uint32" },
                { name: "unknownDword7",        type: "uint32" }
            ]},
            { name: "unknownString1",       type: "string" },
            { name: "unknownBoolean2",      type: "boolean" },
            { name: "unknownArray2",        type: "array", fields: [
                { name: "unknownString1",       type: "uint32" },
                { name: "unknownFloat2",        type: "uint32" },
                { name: "unknownDword1",        type: "uint32" },
                { name: "unknownDword2",        type: "uint32" },
                { name: "unknownDword3",        type: "uint32" },
                { name: "unknownDword4",        type: "uint32" },
                { name: "unknownDword5",        type: "uint32" },
                { name: "unknownDword6",        type: "uint32" },
                { name: "unknownDword7",        type: "uint32" }
            ]},
            { name: "unknownBoolean3",      type: "boolean" }
        ]
    }],
    ["AdminCommand.InteractionList",                                     0x0A0900, {
        fields: [
            { name: "guid",                 type: "uint64" },
            { name: "unknownBoolean1",      type: "boolean" },
            { name: "unknownArray1",        type: "array", fields: [
                { name: "unknownDword1",        type: "uint32" },
                { name: "unknownDword2",        type: "uint32" },
                { name: "unknownDword3",        type: "uint32" },
                { name: "unknownDword4",        type: "uint32" },
                { name: "unknownDword5",        type: "uint32" },
                { name: "unknownDword6",        type: "uint32" },
                { name: "unknownDword7",        type: "uint32" }
            ]},
            { name: "unknownString1",       type: "string" },
            { name: "unknownBoolean2",      type: "boolean" },
            { name: "unknownArray2",        type: "array", fields: [
                { name: "unknownString1",       type: "uint32" },
                { name: "unknownFloat2",        type: "uint32" },
                { name: "unknownDword1",        type: "uint32" },
                { name: "unknownDword2",        type: "uint32" },
                { name: "unknownDword3",        type: "uint32" },
                { name: "unknownDword4",        type: "uint32" },
                { name: "unknownDword5",        type: "uint32" },
                { name: "unknownDword6",        type: "uint32" },
                { name: "unknownDword7",        type: "uint32" }
            ]},
            { name: "unknownBoolean3",      type: "boolean" }
        ]
    }],
    ["Command.InteractionSelect",                                        0x090A00, {
        fields: [
            { name: "guid",                 type: "uint64" },
            { name: "interactionId",        type: "uint32" }
        ]
    }],
    ["AdminCommand.InteractionSelect",                                   0x0A0A00, {
        fields: [
            { name: "guid",                 type: "uint64" },
            { name: "interactionId",        type: "uint32" }
        ]
    }],
    ["Command.InteractionStartWheel",                                    0x090B00, {}],
    ["AdminCommand.InteractionStartWheel",                               0x0A0B00, {}],
    ["Command.StartFlashGame",                                           0x090C00, {}],
    ["AdminCommand.StartFlashGame",                                      0x0A0C00, {}],
    ["Command.SetProfile",                                               0x090D00, {
        fields: [
            { name: "profileId",            type: "uint32" },
            { name: "tab",                  type: "uint32" }
        ]
    }],
    ["AdminCommand.SetProfile",                                          0x0A0D00, {
        fields: [
            { name: "profileId",            type: "uint32" },
            { name: "tab",                  type: "uint32" }
        ]
    }],
    ["Command.AddFriendRequest",                                         0x090E00, {}],
    ["AdminCommand.AddFriendRequest",                                    0x0A0E00, {}],
    ["Command.RemoveFriendRequest",                                      0x090F00, {}],
    ["AdminCommand.RemoveFriendRequest",                                 0x0A0F00, {}],
    ["Command.ConfirmFriendRequest",                                     0x091000, {}],
    ["AdminCommand.ConfirmFriendRequest",                                0x0A1000, {}],
    ["Command.ConfirmFriendResponse",                                    0x091100, {}],
    ["AdminCommand.ConfirmFriendResponse",                               0x0A1100, {}],
    ["Command.SetChatBubbleColor",                                       0x091200, {}],
    ["AdminCommand.SetChatBubbleColor",                                  0x0A1200, {}],
    ["Command.PlayerSelect",                                             0x091300, {
        fields: [
            { name: "characterId",              type: "uint64" },
            { name: "guid",                 type: "uint64" }
        ]
    }],
    ["AdminCommand.PlayerSelect",                                        0x0A1300, {
        fields: [
            { name: "characterId",              type: "uint64" },
            { name: "guid",                 type: "uint64" }
        ]
    }],
    ["Command.FreeInteractionNpc",                                       0x091400, {
        fields: []
    }],
    ["AdminCommand.FreeInteractionNpc",                                  0x0A1400, {
        fields: []
    }],
    ["Command.FriendsPositionRequest",                                   0x091500, {}],
    ["AdminCommand.FriendsPositionRequest",                              0x0A1500, {}],
    ["Command.MoveAndInteract",                                          0x091600, {}],
    ["AdminCommand.MoveAndInteract",                                     0x0A1600, {}],
    ["Command.QuestAbandon",                                             0x091700, {}],
    ["AdminCommand.QuestAbandon",                                        0x0A1700, {}],
    ["Command.RecipeStart",                                              0x091800, {}],
    ["AdminCommand.RecipeStart",                                         0x0A1800, {}],
    ["Command.ShowRecipeWindow",                                         0x091900, {}],
    ["AdminCommand.ShowRecipeWindow",                                    0x0A1900, {}],
    ["Command.ActivateProfileFailed",                                    0x091A00, {}],
    ["AdminCommand.ActivateProfileFailed",                               0x0A1A00, {}],
    ["Command.PlayDialogEffect",                                         0x091B00, {}],
    ["AdminCommand.PlayDialogEffect",                                    0x0A1B00, {}],
    ["Command.ForceClearDialog",                                         0x091C00, {}],
    ["AdminCommand.ForceClearDialog",                                    0x0A1C00, {}],
    ["Command.IgnoreRequest",                                            0x091D00, {}],
    ["AdminCommand.IgnoreRequest",                                       0x0A1D00, {}],
    ["Command.SetActiveVehicleGuid",                                     0x091E00, {}],
    ["AdminCommand.SetActiveVehicleGuid",                                0x0A1E00, {}],
    ["Command.ChatChannelOn",                                            0x091F00, {}],
    ["AdminCommand.ChatChannelOn",                                       0x0A1F00, {}],
    ["Command.ChatChannelOff",                                           0x092000, {}],
    ["AdminCommand.ChatChannelOff",                                      0x0A2000, {}],
    ["Command.RequestPlayerPositions",                                   0x092100, {}],
    ["AdminCommand.RequestPlayerPositions",                              0x0A2100, {}],
    ["Command.RequestPlayerPositionsReply",                              0x092200, {}],
    ["AdminCommand.RequestPlayerPositionsReply",                         0x0A2200, {}],
    ["Command.SetProfileByItemDefinitionId",                             0x092300, {}],
    ["AdminCommand.SetProfileByItemDefinitionId",                        0x0A2300, {}],
    ["Command.RequestRewardPreviewUpdate",                               0x092400, {}],
    ["AdminCommand.RequestRewardPreviewUpdate",                          0x0A2400, {}],
    ["Command.RequestRewardPreviewUpdateReply",                          0x092500, {}],
    ["AdminCommand.RequestRewardPreviewUpdateReply",                     0x0A2500, {}],
    ["Command.PlaySoundIdOnTarget",                                      0x092600, {}],
    ["AdminCommand.PlaySoundIdOnTarget",                                 0x0A2600, {}],
    ["Command.RequestPlayIntroEncounter",                                0x092700, {}],
    ["AdminCommand.RequestPlayIntroEncounter",                           0x0A2700, {}],
    ["Command.SpotPlayer",                                               0x092800, {}],
    ["AdminCommand.SpotPlayer",                                          0x0A2800, {}],
    ["Command.SpotPlayerReply",                                          0x092900, {}],
    ["AdminCommand.SpotPlayerReply",                                     0x0A2900, {}],
    ["Command.SpotPrimaryTarget",                                        0x092A00, {}],
    ["AdminCommand.SpotPrimaryTarget",                                   0x0A2A00, {}],
    ["Command.InteractionString",                                        0x092B00, {
        fields: [
            { name: "guid",                 type: "uint64" },
            { name: "stringId",             type: "uint32" },
            { name: "unknown4",             type: "uint32" }
        ]
    }],
    ["AdminCommand.InteractionString",                                   0x0A2B00, {
        fields: [
            { name: "guid",                 type: "uint64" },
            { name: "stringId",             type: "uint32" },
            { name: "unknown4",             type: "uint32" }
        ]
    }],
    ["Command.GiveCurrency",                                             0x092C00, {}],
    ["AdminCommand.GiveCurrency",                                        0x0A2C00, {}],
    ["Command.HoldBreath",                                               0x092D00, {}],
    ["AdminCommand.HoldBreath",                                          0x0A2D00, {}],
    ["Command.ChargeCollision",                                          0x092E00, {}],
    ["AdminCommand.ChargeCollision",                                     0x0A2E00, {}],
    ["Command.DebrisLaunch",                                             0x092F00, {}],
    ["AdminCommand.DebrisLaunch",                                        0x0A2F00, {}],
    ["Command.Suicide",                                                  0x093000, {}],
    ["AdminCommand.Suicide",                                             0x0A3000, {}],
    ["Command.RequestHelp",                                              0x093100, {}],
    ["AdminCommand.RequestHelp",                                         0x0A3100, {}],
    ["Command.OfferHelp",                                                0x093200, {}],
    ["AdminCommand.OfferHelp",                                           0x0A3200, {}],
    ["Command.Redeploy",                                                 0x093300, {}],
    ["AdminCommand.Redeploy",                                            0x0A3300, {}],
    ["Command.PlayersInRadius",                                          0x093400, {}],
    ["AdminCommand.PlayersInRadius",                                     0x0A3400, {}],
    ["Command.AFK",                                                      0x093500, {}],
    ["AdminCommand.AFK",                                                 0x0A3500, {}],
    ["Command.ReportPlayerReply",                                        0x093600, {}],
    ["AdminCommand.ReportPlayerReply",                                   0x0A3600, {}],
    ["Command.ReportPlayerCheckNameRequest",                             0x093700, {}],
    ["AdminCommand.ReportPlayerCheckNameRequest",                        0x0A3700, {}],
    ["Command.ReportPlayerCheckNameReply",                               0x093800, {}],
    ["AdminCommand.ReportPlayerCheckNameReply",                          0x0A3800, {}],
    ["Command.ReportRendererDump",                                       0x093900, {}],
    ["AdminCommand.ReportRendererDump",                                  0x0A3900, {}],
    ["Command.ChangeName",                                               0x093A00, {}],
    ["AdminCommand.ChangeName",                                          0x0A3A00, {}],
    ["Command.NameValidation",                                           0x093B00, {}],
    ["AdminCommand.NameValidation",                                      0x0A3B00, {}],
    ["Command.PlayerFileDistribution",                                   0x093C00, {}],
    ["AdminCommand.PlayerFileDistribution",                              0x0A3C00, {}],
    ["Command.ZoneFileDistribution",                                     0x093D00, {}],
    ["AdminCommand.ZoneFileDistribution",                                0x0A3D00, {}],
    ["Command.AddWorldCommand",                                          0x093E00, {
        fields: [
            { name: "command",                      type: "string" }
        ]
    }],
    ["AdminCommand.AddWorldCommand",                                     0x0A3E00, {
        fields: [
            { name: "command",                      type: "string" }
        ]
    }],
    ["Command.AddZoneCommand",                                           0x093F00, {
        fields: [
            { name: "command",                      type: "string" }
        ]
    }],
    ["AdminCommand.AddZoneCommand",                                      0x0A3F00, {
        fields: [
            { name: "command",                      type: "string" }
        ]
    }],
    ["Command.ExecuteCommand",                                           0x094000, {
        fields: [
            { name: "commandHash",                  type: "uint32" },
            { name: "arguments",                    type: "string" }
        ]
    }],
    ["AdminCommand.ExecuteCommand",                                      0x0A4000, {
        fields: [
            { name: "commandHash",                  type: "uint32" },
            { name: "arguments",                    type: "string" }
        ]
    }],
    ["Command.ZoneExecuteCommand",                                       0x094100, {
        fields: [
            { name: "commandHash",                  type: "uint32" },
            { name: "arguments",                    type: "string" }
        ]
    }],
    ["AdminCommand.ZoneExecuteCommand",                                  0x0A4100, {
        fields: [
            { name: "commandHash",                  type: "uint32" },
            { name: "arguments",                    type: "string" }
        ]
    }],
    ["Command.RequestStripEffect",                                       0x094200, {}],
    ["AdminCommand.RequestStripEffect",                                  0x0A4200, {}],
    ["Command.ItemDefinitionRequest",                                    0x094300, {}],
    ["AdminCommand.ItemDefinitionRequest",                               0x0A4300, {}],
    ["Command.ItemDefinitionReply",                                      0x094400, {}],
    ["AdminCommand.ItemDefinitionReply",                                 0x0A4400, {}],
    ["Command.ItemDefinitions",                                          0x094500, {}],
    ["AdminCommand.ItemDefinitions",                                     0x0A4500, {}],
    ["Command.EnableCompositeEffects",                                   0x094600, {
        fields: [
            { name: "enabled",                      type: "boolean" }
        ]
    }],
    ["AdminCommand.EnableCompositeEffects",                              0x0A4600, {
        fields: [
            { name: "enabled",                      type: "boolean" }
        ]
    }],
    ["Command.StartRentalUpsell",                                        0x094700, {}],
    ["AdminCommand.StartRentalUpsell",                                   0x0A4700, {}],
    ["Command.SafeEject",                                                0x094800, {}],
    ["AdminCommand.SafeEject",                                           0x0A4800, {}],
    ["Command.ValidateDataForZoneOwnedTiles",                            0x096C04, {}],
    ["AdminCommand.ValidateDataForZoneOwnedTiles",                       0x0A6C04, {}],
    ["Command.RequestWeaponFireStateUpdate",                             0x094900, {
        fields: [
            { name: "characterId",                  type: "uint64" }
        ]
    }],
    ["AdminCommand.RequestWeaponFireStateUpdate",                        0x0A4900, {
        fields: [
            { name: "characterId",                  type: "uint64" }
        ]
    }],
    ["Command.SetInWater",                                               0x094A00, {}],
    ["AdminCommand.SetInWater",                                          0x0A4A00, {}],
    ["Command.ClearInWater",                                             0x094B00, {}],
    ["AdminCommand.ClearInWater",                                        0x0A4B00, {}],
    ["Command.StartLogoutRequest",                                       0x094C00, {}],
    ["AdminCommand.StartLogoutRequest",                                  0x0A4C00, {}],
    ["Command.Delivery",                                                 0x094D00, {}],
    ["AdminCommand.Delivery",                                            0x0A4D00, {}],
    ["Command.DeliveryDisplayInfo",                                      0x094E00, {}],
    ["AdminCommand.DeliveryDisplayInfo",                                 0x0A4E00, {}],
    ["Command.DeliveryManagerStatus",                                    0x094F00, {}],
    ["AdminCommand.DeliveryManagerStatus",                               0x0A4F00, {}],
    ["Command.DeliveryManagerShowNotification",                          0x095000, {}],
    ["AdminCommand.DeliveryManagerShowNotification",                     0x0A5000, {}],
    ["Command.AddItem",                                                  0x09EA03, {}],
    ["AdminCommand.AddItem",                                             0x0AEA03, {}],
    ["Command.DeleteItem",                                               0x09EB03, {}],
    ["AdminCommand.DeleteItem",                                          0x0AEB03, {}],
    ["Command.AbilityReply",                                             0x09EC03, {}],
    ["AdminCommand.AbilityReply",                                        0x0AEC03, {}],
    ["Command.AbilityList",                                              0x09ED03, {}],
    ["AdminCommand.AbilityList",                                         0x0AED03, {}],
    ["Command.AbilityAdd",                                               0x09EE03, {}],
    ["AdminCommand.AbilityAdd",                                          0x0AEE03, {}],
    ["Command.ServerInformation",                                        0x09EF03, {}],
    ["AdminCommand.ServerInformation",                                   0x0AEF03, {}],
    ["Command.SpawnNpcRequest",                                          0x09F003, {}],
    ["AdminCommand.SpawnNpcRequest",                                     0x0AF003, {}],
    ["Command.NpcSpawn",                                                 0x09F103, {}],
    ["AdminCommand.NpcSpawn",                                            0x0AF103, {}],
    ["Command.NpcList",                                                  0x09F203, {}],
    ["AdminCommand.NpcList",                                             0x0AF203, {}],
    ["Command.NpcDisableSpawners",                                       0x09F303, {}],
    ["AdminCommand.NpcDisableSpawners",                                  0x0AF303, {}],
    ["Command.NpcDespawn",                                               0x09F403, {}],
    ["AdminCommand.NpcDespawn",                                          0x0AF403, {}],
    ["Command.NpcCreateSpawn",                                           0x09F503, {}],
    ["AdminCommand.NpcCreateSpawn",                                      0x0AF503, {}],
    ["Command.NpcInfoRequest",                                           0x09F603, {}],
    ["AdminCommand.NpcInfoRequest",                                      0x0AF603, {}],
    ["Command.ZonePacketLogging",                                        0x09F703, {}],
    ["AdminCommand.ZonePacketLogging",                                   0x0AF703, {}],
    ["Command.ZoneListRequest",                                          0x09F803, {}],
    ["AdminCommand.ZoneListRequest",                                     0x0AF803, {}],
    ["Command.ZoneListReply",                                            0x09F903, {}],
    ["AdminCommand.ZoneListReply",                                       0x0AF903, {}],
    ["Command.TeleportToLocation",                                       0x09FA03, {}],
    ["AdminCommand.TeleportToLocation",                                  0x0AFA03, {}],
    ["Command.TeleportToLocationEx",                                     0x09FB03, {}],
    ["AdminCommand.TeleportToLocationEx",                                0x0AFB03, {}],
    ["Command.TeleportManagedToLocation",                                0x09FC03, {}],
    ["AdminCommand.TeleportManagedToLocation",                           0x0AFC03, {}],
    ["Command.CollectionStart",                                          0x09FD03, {}],
    ["AdminCommand.CollectionStart",                                     0x0AFD03, {}],
    ["Command.CollectionClear",                                          0x09FE03, {}],
    ["AdminCommand.CollectionClear",                                     0x0AFE03, {}],
    ["Command.CollectionRemove",                                         0x09FF03, {}],
    ["AdminCommand.CollectionRemove",                                    0x0AFF03, {}],
    ["Command.CollectionAddEntry",                                       0x090004, {}],
    ["AdminCommand.CollectionAddEntry",                                  0x0A0004, {}],
    ["Command.CollectionRemoveEntry",                                    0x090104, {}],
    ["AdminCommand.CollectionRemoveEntry",                               0x0A0104, {}],
    ["Command.CollectionRefresh",                                        0x090204, {}],
    ["AdminCommand.CollectionRefresh",                                   0x0A0204, {}],
    ["Command.CollectionFill",                                           0x090304, {}],
    ["AdminCommand.CollectionFill",                                      0x0A0304, {}],
    ["Command.ReloadData",                                               0x090404, {}],
    ["AdminCommand.ReloadData",                                          0x0A0404, {}],
    ["Command.OnlineStatusRequest",                                      0x090504, {}],
    ["AdminCommand.OnlineStatusRequest",                                 0x0A0504, {}],
    ["Command.OnlineStatusReply",                                        0x090604, {}],
    ["AdminCommand.OnlineStatusReply",                                   0x0A0604, {}],
    ["Command.MovePlayerToWorldLocation",                                0x090704, {}],
    ["AdminCommand.MovePlayerToWorldLocation",                           0x0A0704, {}],
    ["Command.MovePlayerToTargetPlayer",                                 0x090804, {}],
    ["AdminCommand.MovePlayerToTargetPlayer",                            0x0A0804, {}],
    ["Command.LaunchAbilityId",                                          0x090904, {}],
    ["AdminCommand.LaunchAbilityId",                                     0x0A0904, {}],
    ["Command.Kill",                                                     0x090A04, {}],
    ["AdminCommand.Kill",                                                0x0A0A04, {}],
    ["Command.FindEnemy",                                                0x090B04, {}],
    ["AdminCommand.FindEnemy",                                           0x0A0B04, {}],
    ["Command.FindEnemyReply",                                           0x090C04, {}],
    ["AdminCommand.FindEnemyReply",                                      0x0A0C04, {}],
    ["Command.FollowPlayer",                                             0x090D04, {}],
    ["AdminCommand.FollowPlayer",                                        0x0A0D04, {}],
    ["Command.SetClientDebugFlag",                                       0x090E04, {}],
    ["AdminCommand.SetClientDebugFlag",                                  0x0A0E04, {}],
    ["Command.RunZoneScript",                                            0x090F04, {}],
    ["AdminCommand.RunZoneScript",                                       0x0A0F04, {}],
    ["Command.RequestAggroDist",                                         0x091004, {}],
    ["AdminCommand.RequestAggroDist",                                    0x0A1004, {}],
    ["Command.AggroDist",                                                0x091104, {}],
    ["AdminCommand.AggroDist",                                           0x0A1104, {}],
    ["Command.TestRequirement",                                          0x091204, {}],
    ["AdminCommand.TestRequirement",                                     0x0A1204, {}],
    ["Command.UITest",                                                   0x091304, {}],
    ["AdminCommand.UITest",                                              0x0A1304, {}],
    ["Command.EncounterComplete",                                        0x091404, {}],
    ["AdminCommand.EncounterComplete",                                   0x0A1404, {}],
    ["Command.AddRewardBonus",                                           0x091504, {}],
    ["AdminCommand.AddRewardBonus",                                      0x0A1504, {}],
    ["Command.SetClientBehaviorFlag",                                    0x091604, {}],
    ["AdminCommand.SetClientBehaviorFlag",                               0x0A1604, {}],
    ["Command.SetVipRank",                                               0x091704, {}],
    ["AdminCommand.SetVipRank",                                          0x0A1704, {}],
    ["Command.ToggleDebugNpc",                                           0x091804, {}],
    ["AdminCommand.ToggleDebugNpc",                                      0x0A1804, {}],
    ["Command.QuestStart",                                               0x091904, {}],
    ["AdminCommand.QuestStart",                                          0x0A1904, {}],
    ["Command.SummonRequest",                                            0x091A04, {}],
    ["AdminCommand.SummonRequest",                                       0x0A1A04, {}],
    ["Command.QuestList",                                                0x091B04, {}],
    ["AdminCommand.QuestList",                                           0x0A1B04, {}],
    ["Command.EncounterStart",                                           0x091C04, {}],
    ["AdminCommand.EncounterStart",                                      0x0A1C04, {}],
    ["Command.RewardSetGive",                                            0x091D04, {}],
    ["AdminCommand.RewardSetGive",                                       0x0A1D04, {}],
    ["Command.RewardSetList",                                            0x091E04, {}],
    ["AdminCommand.RewardSetList",                                       0x0A1E04, {}],
    ["Command.RewardSetFind",                                            0x091F04, {}],
    ["AdminCommand.RewardSetFind",                                       0x0A1F04, {}],
    ["Command.QuestComplete",                                            0x092004, {}],
    ["AdminCommand.QuestComplete",                                       0x0A2004, {}],
    ["Command.QuestStatus",                                              0x092104, {}],
    ["AdminCommand.QuestStatus",                                         0x0A2104, {}],
    ["Command.CoinsSet",                                                 0x092204, {}],
    ["AdminCommand.CoinsSet",                                            0x0A2204, {}],
    ["Command.CoinsAdd",                                                 0x092304, {}],
    ["AdminCommand.CoinsAdd",                                            0x0A2304, {}],
    ["Command.CoinsGet",                                                 0x092404, {}],
    ["AdminCommand.CoinsGet",                                            0x0A2404, {}],
    ["Command.AddCurrency",                                              0x092504, {}],
    ["AdminCommand.AddCurrency",                                         0x0A2504, {}],
    ["Command.SetCurrency",                                              0x092604, {}],
    ["AdminCommand.SetCurrency",                                         0x0A2604, {}],
    ["Command.ClearCurrency",                                            0x092704, {}],
    ["AdminCommand.ClearCurrency",                                       0x0A2704, {}],
    ["Command.RewardCurrency",                                           0x092804, {}],
    ["AdminCommand.RewardCurrency",                                      0x0A2804, {}],
    ["Command.ListCurrencyRequest",                                      0x092904, {}],
    ["AdminCommand.ListCurrencyRequest",                                 0x0A2904, {}],
    ["Command.ListCurrencyReply",                                        0x092A04, {}],
    ["AdminCommand.ListCurrencyReply",                                   0x0A2A04, {}],
    ["Command.RewardSetGiveRadius",                                      0x092B04, {}],
    ["AdminCommand.RewardSetGiveRadius",                                 0x0A2B04, {}],
    ["Command.InGamePurchaseRequest",                                    0x092C04, {}],
    ["AdminCommand.InGamePurchaseRequest",                               0x0A2C04, {}],
    ["Command.InGamePurchaseReply",                                      0x092D04, {}],
    ["AdminCommand.InGamePurchaseReply",                                 0x0A2D04, {}],
    ["Command.TestNpcRelevance",                                         0x092E04, {}],
    ["AdminCommand.TestNpcRelevance",                                    0x0A2E04, {}],
    ["Command.GameTime",                                                 0x092F04, {}],
    ["AdminCommand.GameTime",                                            0x0A2F04, {}],
    ["Command.ClientTime",                                               0x093004, {}],
    ["AdminCommand.ClientTime",                                          0x0A3004, {}],
    ["Command.QuestObjectiveComplete",                                   0x093104, {}],
    ["AdminCommand.QuestObjectiveComplete",                              0x0A3104, {}],
    ["Command.QuestObjectiveIncrement",                                  0x093204, {}],
    ["AdminCommand.QuestObjectiveIncrement",                             0x0A3204, {}],
    ["Command.EncounterStatus",                                          0x093304, {}],
    ["AdminCommand.EncounterStatus",                                     0x0A3304, {}],
    ["Command.GotoRequest",                                              0x093404, {}],
    ["AdminCommand.GotoRequest",                                         0x0A3404, {}],
    ["Command.GotoReply",                                                0x093504, {}],
    ["AdminCommand.GotoReply",                                           0x0A3504, {}],
    ["Command.GotoWapointRequest",                                       0x093604, {}],
    ["AdminCommand.GotoWapointRequest",                                  0x0A3604, {}],
    ["Command.ServerVersion",                                            0x093704, {}],
    ["AdminCommand.ServerVersion",                                       0x0A3704, {}],
    ["Command.ServerUptime",                                             0x093804, {}],
    ["AdminCommand.ServerUptime",                                        0x0A3804, {}],
    ["Command.DeleteItemById",                                           0x093904, {}],
    ["AdminCommand.DeleteItemById",                                      0x0A3904, {}],
    ["Command.GetItemList",                                              0x093A04, {}],
    ["AdminCommand.GetItemList",                                         0x0A3A04, {}],
    ["Command.GetItemListReply",                                         0x093B04, {}],
    ["AdminCommand.GetItemListReply",                                    0x0A3B04, {}],
    ["Command.QuestHistory",                                             0x093C04, {}],
    ["AdminCommand.QuestHistory",                                        0x0A3C04, {}],
    ["Command.QuestHistoryClear",                                        0x093D04, {}],
    ["AdminCommand.QuestHistoryClear",                                   0x0A3D04, {}],
    ["Command.TradeStatus",                                              0x093E04, {}],
    ["AdminCommand.TradeStatus",                                         0x0A3E04, {}],
    ["Command.PathDataRequest",                                          0x093F04, {}],
    ["AdminCommand.PathDataRequest",                                     0x0A3F04, {}],
    ["Command.SummonReply",                                              0x094004, {}],
    ["AdminCommand.SummonReply",                                         0x0A4004, {}],
    ["Command.Broadcast",                                                0x094104, {}],
    ["AdminCommand.Broadcast",                                           0x0A4104, {}],
    ["Command.BroadcastZone",                                            0x094204, {}],
    ["AdminCommand.BroadcastZone",                                       0x0A4204, {}],
    ["Command.BroadcastWorld",                                           0x094304, {}],
    ["AdminCommand.BroadcastWorld",                                      0x0A4304, {}],
    ["Command.ListPets",                                                 0x094404, {}],
    ["AdminCommand.ListPets",                                            0x0A4404, {}],
    ["Command.PetSetUtility",                                            0x094504, {}],
    ["AdminCommand.PetSetUtility",                                       0x0A4504, {}],
    ["Command.PetTrick",                                                 0x094604, {}],
    ["AdminCommand.PetTrick",                                            0x0A4604, {}],
    ["Command.RecipeAction",                                             0x094704, {}],
    ["AdminCommand.RecipeAction",                                        0x0A4704, {}],
    ["Command.WorldKick",                                                0x094804, {}],
    ["AdminCommand.WorldKick",                                           0x0A4804, {}],
    ["Command.EncounterRunTimerDisable",                                 0x094904, {}],
    ["AdminCommand.EncounterRunTimerDisable",                            0x0A4904, {}],
    ["Command.ReloadPermissions",                                        0x094A04, {}],
    ["AdminCommand.ReloadPermissions",                                   0x0A4A04, {}],
    ["Command.CharacterFlags",                                           0x094B04, {}],
    ["AdminCommand.CharacterFlags",                                      0x0A4B04, {}],
    ["Command.SetEncounterPartySizeOverride",                            0x094C04, {}],
    ["AdminCommand.SetEncounterPartySizeOverride",                       0x0A4C04, {}],
    ["Command.BuildTime",                                                0x094D04, {}],
    ["AdminCommand.BuildTime",                                           0x0A4D04, {}],
    ["Command.SelectiveSpawnEnable",                                     0x094E04, {}],
    ["AdminCommand.SelectiveSpawnEnable",                                0x0A4E04, {}],
    ["Command.SelectiveSpawnAdd",                                        0x094F04, {}],
    ["AdminCommand.SelectiveSpawnAdd",                                   0x0A4F04, {}],
    ["Command.SelectiveSpawnAddById",                                    0x095004, {}],
    ["AdminCommand.SelectiveSpawnAddById",                               0x0A5004, {}],
    ["Command.SelectiveSpawnClear",                                      0x095104, {}],
    ["AdminCommand.SelectiveSpawnClear",                                 0x0A5104, {}],
    ["Command.BecomeEnforcer",                                           0x095204, {}],
    ["AdminCommand.BecomeEnforcer",                                      0x0A5204, {}],
    ["Command.BecomeReferee",                                            0x095304, {}],
    ["AdminCommand.BecomeReferee",                                       0x0A5304, {}],
    ["Command.Profiler",                                                 0x095404, {}],
    ["AdminCommand.Profiler",                                            0x0A5404, {}],
    ["Command.WorldKickPending",                                         0x095504, {}],
    ["AdminCommand.WorldKickPending",                                    0x0A5504, {}],
    ["Command.ActivateMembership",                                       0x095604, {}],
    ["AdminCommand.ActivateMembership",                                  0x0A5604, {}],
    ["Command.JoinLobby",                                                0x095704, {}],
    ["AdminCommand.JoinLobby",                                           0x0A5704, {}],
    ["Command.LeaveLobby",                                               0x095804, {}],
    ["AdminCommand.LeaveLobby",                                          0x0A5804, {}],
    ["Command.SetMOTD",                                                  0x095904, {}],
    ["AdminCommand.SetMOTD",                                             0x0A5904, {}],
    ["Command.Snoop",                                                    0x095A04, {}],
    ["AdminCommand.Snoop",                                               0x0A5A04, {}],
    ["Command.JoinScheduledActivityRequest",                             0x095B04, {}],
    ["AdminCommand.JoinScheduledActivityRequest",                        0x0A5B04, {}],
    ["Command.JoinScheduledActivityReply",                               0x095C04, {}],
    ["AdminCommand.JoinScheduledActivityReply",                          0x0A5C04, {}],
    ["Command.BecomeAmbassador",                                         0x095D04, {}],
    ["AdminCommand.BecomeAmbassador",                                    0x0A5D04, {}],
    ["Command.CollectionsShow",                                          0x095E04, {}],
    ["AdminCommand.CollectionsShow",                                     0x0A5E04, {}],
    ["Command.GetZoneDrawData",                                          0x095F04, {}],
    ["AdminCommand.GetZoneDrawData",                                     0x0A5F04, {}],
    ["Command.ZoneDrawData",                                             0x096004, {}],
    ["AdminCommand.ZoneDrawData",                                        0x0A6004, {}],
    ["Command.QuestAbandon",                                             0x096104, {}],
    ["AdminCommand.QuestAbandon",                                        0x0A6104, {}],
    ["Command.SetVehicleDefault",                                        0x096204, {}],
    ["AdminCommand.SetVehicleDefault",                                   0x0A6204, {}],
    ["Command.Freeze",                                                   0x096304, {}],
    ["AdminCommand.Freeze",                                              0x0A6304, {}],
    ["Command.ObjectiveAction",                                          0x096404, {}],
    ["AdminCommand.ObjectiveAction",                                     0x0A6404, {}],
    ["Command.EquipAdd",                                                 0x096504, {}],
    ["AdminCommand.EquipAdd",                                            0x0A6504, {}],
    ["Command.Info",                                                     0x096604, {}],
    ["AdminCommand.Info",                                                0x0A6604, {}],
    ["Command.Silence",                                                  0x096704, {}],
    ["AdminCommand.Silence",                                             0x0A6704, {}],
    ["Command.SpawnerStatus",                                            0x096804, {}],
    ["AdminCommand.SpawnerStatus",                                       0x0A6804, {}],
    ["Command.Behavior",                                                 0x096904, {}],
    ["AdminCommand.Behavior",                                            0x0A6904, {}],
    ["Command.DebugFirstTimeEvents",                                     0x096A04, {}],
    ["AdminCommand.DebugFirstTimeEvents",                                0x0A6A04, {}],
    ["Command.SetWorldWebEventAggregationPeriod",                        0x096B04, {}],
    ["AdminCommand.SetWorldWebEventAggregationPeriod",                   0x0A6B04, {}],
    ["Command.GivePet",                                                  0x096D04, {}],
    ["AdminCommand.GivePet",                                             0x0A6D04, {}],
    ["Command.NpcLocationRequest",                                       0x096E04, {}],
    ["AdminCommand.NpcLocationRequest",                                  0x0A6E04, {}],
    ["Command.BroadcastUniverse",                                        0x096F04, {}],
    ["AdminCommand.BroadcastUniverse",                                   0x0A6F04, {}],
    ["Command.TrackedEventLogToFile",                                    0x097004, {}],
    ["AdminCommand.TrackedEventLogToFile",                               0x0A7004, {}],
    ["Command.TrackedEventEnable",                                       0x097104, {}],
    ["AdminCommand.TrackedEventEnable",                                  0x0A7104, {}],
    ["Command.TrackedEventEnableAll",                                    0x097204, {}],
    ["AdminCommand.TrackedEventEnableAll",                               0x0A7204, {}],
    ["Command.Event",                                                    0x097304, {}],
    ["AdminCommand.Event",                                               0x0A7304, {}],
    ["Command.PerformAction",                                            0x097404, {}],
    ["AdminCommand.PerformAction",                                       0x0A7404, {}],
    ["Command.CountrySet",                                               0x097504, {}],
    ["AdminCommand.CountrySet",                                          0x0A7504, {}],
    ["Command.TrackedEventReloadConfig",                                 0x097604, {}],
    ["AdminCommand.TrackedEventReloadConfig",                            0x0A7604, {}],
    ["Command.SummonNPC",                                                0x097704, {}],
    ["AdminCommand.SummonNPC",                                           0x0A7704, {}],
    ["Command.AchievementComplete",                                      0x097804, {}],
    ["AdminCommand.AchievementComplete",                                 0x0A7804, {}],
    ["Command.AchievementList",                                          0x097904, {}],
    ["AdminCommand.AchievementList",                                     0x0A7904, {}],
    ["Command.AchievementStatus",                                        0x097A04, {}],
    ["AdminCommand.AchievementStatus",                                   0x0A7A04, {}],
    ["Command.AchievementObjectiveComplete",                             0x097B04, {}],
    ["AdminCommand.AchievementObjectiveComplete",                        0x0A7B04, {}],
    ["Command.AchievementObjectiveIncrement",                            0x097C04, {}],
    ["AdminCommand.AchievementObjectiveIncrement",                       0x0A7C04, {}],
    ["Command.AchievementEnable",                                        0x097D04, {}],
    ["AdminCommand.AchievementEnable",                                   0x0A7D04, {}],
    ["Command.AchievementReset",                                         0x097E04, {}],
    ["AdminCommand.AchievementReset",                                    0x0A7E04, {}],
    ["Command.SetAffiliate",                                             0x097F04, {}],
    ["AdminCommand.SetAffiliate",                                        0x0A7F04, {}],
    ["Command.HousingInstanceEdit",                                      0x098004, {}],
    ["AdminCommand.HousingInstanceEdit",                                 0x0A8004, {}],
    ["Command.WorldRequest",                                             0x098104, {}],
    ["AdminCommand.WorldRequest",                                        0x0A8104, {}],
    ["Command.EnableNpcRelevanceBypass",                                 0x098204, {}],
    ["AdminCommand.EnableNpcRelevanceBypass",                            0x0A8204, {}],
    ["Command.GrantPromotionalBundle",                                   0x098304, {}],
    ["AdminCommand.GrantPromotionalBundle",                              0x0A8304, {}],
    ["Command.ResetItemCooldowns",                                       0x098404, {}],
    ["AdminCommand.ResetItemCooldowns",                                  0x0A8404, {}],
    ["Command.MountAdd",                                                 0x098504, {}],
    ["AdminCommand.MountAdd",                                            0x0A8504, {}],
    ["Command.MountDelete",                                              0x098604, {}],
    ["AdminCommand.MountDelete",                                         0x0A8604, {}],
    ["Command.MountList",                                                0x098704, {}],
    ["AdminCommand.MountList",                                           0x0A8704, {}],
    ["Command.GetItemInfo",                                              0x098804, {}],
    ["AdminCommand.GetItemInfo",                                         0x0A8804, {}],
    ["Command.RequestZoneComprehensiveDataDump",                         0x098904, {}],
    ["AdminCommand.RequestZoneComprehensiveDataDump",                    0x0A8904, {}],
    ["Command.RequestZoneComprehensiveDataDumpReply",                    0x098A04, {}],
    ["AdminCommand.RequestZoneComprehensiveDataDumpReply",                0x0A8A04, {}],
    ["Command.NpcDamage",                                                0x098B04, {}],
    ["AdminCommand.NpcDamage",                                           0x0A8B04, {}],
    ["Command.HousingAddTrophy",                                         0x098C04, {}],
    ["AdminCommand.HousingAddTrophy",                                    0x0A8C04, {}],
    ["Command.TargetOfTarget",                                           0x098D04, {}],
    ["AdminCommand.TargetOfTarget",                                      0x0A8D04, {}],
    ["Command.AddAbilityEntry",                                          0x098E04, {}],
    ["AdminCommand.AddAbilityEntry",                                     0x0A8E04, {}],
    ["Command.RemoveAbilityEntry",                                       0x098F04, {}],
    ["AdminCommand.RemoveAbilityEntry",                                  0x0A8F04, {}],
    ["Command.PhaseList",                                                0x099004, {}],
    ["AdminCommand.PhaseList",                                           0x0A9004, {}],
    ["Command.PhaseAdd",                                                 0x099104, {}],
    ["AdminCommand.PhaseAdd",                                            0x0A9104, {}],
    ["Command.PhaseRemove",                                              0x099204, {}],
    ["AdminCommand.PhaseRemove",                                         0x0A9204, {}],
    ["Command.AdventureAdd",                                             0x099304, {}],
    ["AdminCommand.AdventureAdd",                                        0x0A9304, {}],
    ["Command.AdventureSetPhase",                                        0x099404, {}],
    ["AdminCommand.AdventureSetPhase",                                   0x0A9404, {}],
    ["Command.SetFactionId",                                             0x099504, {}],
    ["AdminCommand.SetFactionId",                                        0x0A9504, {}],
    ["Command.FacilitySpawnSetCollisionState",                           0x099604, {}],
    ["AdminCommand.FacilitySpawnSetCollisionState",                      0x0A9604, {}],
    ["Command.SkillBase",                                                0x099704, {}],
    ["AdminCommand.SkillBase",                                           0x0A9704, {}],
    ["Command.VehicleBase",                                              0x099804, {}],
    ["AdminCommand.VehicleBase",                                         0x0A9804, {}],
    ["Command.SpawnVehicle",                                             0x099904, {
        fields: [
            { name: "vehicleId",                    type: "uint32" },
            { name: "factionId",                    type: "uint8" },
            { name: "position",                     type: "floatvector3" },
            { name: "heading",                      type: "float" },
            { name: "unknownDword1",                type: "uint32" },
            { name: "autoMount",                    type: "boolean" }
        ]
    }],
    ["AdminCommand.SpawnVehicle",                                        0x0A9904, {
        fields: [
            { name: "vehicleId",                    type: "uint32" },
            { name: "factionId",                    type: "uint8" },
            { name: "position",                     type: "floatvector3" },
            { name: "heading",                      type: "float" },
            { name: "unknownDword1",                type: "uint32" },
            { name: "autoMount",                    type: "boolean" }
        ]
    }],
    ["Command.SpawnVehicleReply",                                        0x099A04, {}],
    ["AdminCommand.SpawnVehicleReply",                                   0x0A9A04, {}],
    ["Command.DespawnVehicle",                                           0x099B04, {}],
    ["AdminCommand.DespawnVehicle",                                      0x0A9B04, {}],
    ["Command.WeaponStat",                                               0x099C04, {}],
    ["AdminCommand.WeaponStat",                                          0x0A9C04, {}],
    ["Command.GuildBase",                                                0x099D04, {}],
    ["AdminCommand.GuildBase",                                           0x0A9D04, {}],
    ["Command.VisualizePhysics",                                         0x099E04, {}],
    ["AdminCommand.VisualizePhysics",                                    0x0A9E04, {}],
    ["Command.PlayerHealthSetRequest",                                   0x099F04, {}],
    ["AdminCommand.PlayerHealthSetRequest",                              0x0A9F04, {}],
    ["Command.PlayerForceRespawnRequest",                                0x09A004, {}],
    ["AdminCommand.PlayerForceRespawnRequest",                           0x0AA004, {}],
    ["Command.ResourceRequest",                                          0x09A104, {}],
    ["AdminCommand.ResourceRequest",                                     0x0AA104, {}],
    ["Command.ZoneDebugMessage",                                         0x09A204, {}],
    ["AdminCommand.ZoneDebugMessage",                                    0x0AA204, {}],
    ["Command.VerifyAdminTarget",                                        0x09A304, {}],
    ["AdminCommand.VerifyAdminTarget",                                   0x0AA304, {}],
    ["Command.SetAllZoneFacilitiesToFactionRequest",                     0x09A404, {}],
    ["AdminCommand.SetAllZoneFacilitiesToFactionRequest",                0x0AA404, {}],
    ["Command.FacilityResetMapRequest",                                  0x09A504, {}],
    ["AdminCommand.FacilityResetMapRequest",                             0x0AA504, {}],
    ["Command.DesignDataChanges",                                        0x09A604, {}],
    ["AdminCommand.DesignDataChanges",                                   0x0AA604, {}],
    ["Command.GiveXp",                                                   0x09A704, {}],
    ["AdminCommand.GiveXp",                                              0x0AA704, {}],
    ["Command.GiveRank",                                                 0x09A804, {}],
    ["AdminCommand.GiveRank",                                            0x0AA804, {}],
    ["Command.PlayerExperienceRequest",                                  0x09A904, {}],
    ["AdminCommand.PlayerExperienceRequest",                             0x0AA904, {}],
    ["Command.Noclip",                                                   0x09AA04, {}],
    ["AdminCommand.Noclip",                                              0x0AAA04, {}],
    ["Command.VerifyAdminPermission",                                    0x09AB04, {}],
    ["AdminCommand.VerifyAdminPermission",                               0x0AAB04, {}],
    ["Command.RegionRequest",                                            0x09AC04, {}],
    ["AdminCommand.RegionRequest",                                       0x0AAC04, {}],
    ["Command.RegionReply",                                              0x09AD04, {}],
    ["AdminCommand.RegionReply",                                         0x0AAD04, {}],
    ["Command.RegionRewardsReply",                                       0x09AE04, {}],
    ["AdminCommand.RegionRewardsReply",                                  0x0AAE04, {}],
    ["Command.RegionFactionRewardsReply",                                0x09AF04, {}],
    ["AdminCommand.RegionFactionRewardsReply",                           0x0AAF04, {}],
    ["Command.FacilityListNpcReply",                                     0x09B004, {}],
    ["AdminCommand.FacilityListNpcReply",                                0x0AB004, {}],
    ["Command.FacilityListReply",                                        0x09B104, {}],
    ["AdminCommand.FacilityListReply",                                   0x0AB104, {}],
    ["Command.PingServer",                                               0x09B204, {}],
    ["AdminCommand.PingServer",                                          0x0AB204, {}],
    ["Command.AnimDebug",                                                0x09B304, {}],
    ["AdminCommand.AnimDebug",                                           0x0AB304, {}],
    ["Command.RemoteClientAnimDebugRequest",                             0x09B404, {}],
    ["AdminCommand.RemoteClientAnimDebugRequest",                        0x0AB404, {}],
    ["Command.RemoteClientAnimDebugReply",                               0x09B504, {}],
    ["AdminCommand.RemoteClientAnimDebugReply",                          0x0AB504, {}],
    ["Command.RewardBuffManagerGiveReward",                              0x09B604, {}],
    ["AdminCommand.RewardBuffManagerGiveReward",                         0x0AB604, {}],
    ["Command.RewardBuffManagerAddPlayers",                              0x09B704, {}],
    ["AdminCommand.RewardBuffManagerAddPlayers",                         0x0AB704, {}],
    ["Command.RewardBuffManagerRemovePlayers",                           0x09B804, {}],
    ["AdminCommand.RewardBuffManagerRemovePlayers",                      0x0AB804, {}],
    ["Command.RewardBuffManagerClearAllPlayers",                         0x09B904, {}],
    ["AdminCommand.RewardBuffManagerClearAllPlayers",                    0x0AB904, {}],
    ["Command.RewardBuffManagerListAll",                                 0x09BA04, {}],
    ["AdminCommand.RewardBuffManagerListAll",                            0x0ABA04, {}],
    ["Command.QueryNpcRequest",                                          0x09BB04, {}],
    ["AdminCommand.QueryNpcRequest",                                     0x0ABB04, {}],
    ["Command.QueryNpcReply",                                            0x09BC04, {}],
    ["AdminCommand.QueryNpcReply",                                       0x0ABC04, {}],
    ["Command.ZonePlayerCount",                                          0x09BD04, {}],
    ["AdminCommand.ZonePlayerCount",                                     0x0ABD04, {}],
    ["Command.GriefRequest",                                             0x09BE04, {}],
    ["AdminCommand.GriefRequest",                                        0x0ABE04, {}],
    ["Command.TeleportToObjectTag",                                      0x09BF04, {}],
    ["AdminCommand.TeleportToObjectTag",                                 0x0ABF04, {}],
    ["Command.DamagePlayer",                                             0x09C004, {}],
    ["AdminCommand.DamagePlayer",                                        0x0AC004, {}],
    ["Command.HexPermissions",                                           0x09C104, {}],
    ["AdminCommand.HexPermissions",                                      0x0AC104, {}],
    ["Command.SpyRequest",                                               0x09C204, {}],
    ["AdminCommand.SpyRequest",                                          0x0AC204, {}],
    ["Command.SpyReply",                                                 0x09C304, {}],
    ["AdminCommand.SpyReply",                                            0x0AC304, {}],
    ["Command.GatewayProfilerRegistration",                              0x09C404, {}],
    ["AdminCommand.GatewayProfilerRegistration",                         0x0AC404, {}],
    ["Command.RunSpeed",                                                 0x09C504, {
        fields: [
            { name: "runSpeed",                     type: "float" }
        ]
    }],
    ["AdminCommand.RunSpeed",                                            0x0AC504, {
        fields: [
            { name: "runSpeed",                     type: "float" }
        ]
    }],
    ["Command.LocationRequest",                                          0x09C604, {}],
    ["AdminCommand.LocationRequest",                                     0x0AC604, {}],
    ["Command.GriefBase",                                                0x09C704, {}],
    ["AdminCommand.GriefBase",                                           0x0AC704, {}],
    ["Command.PlayerRenameRequest",                                      0x09C804, {}],
    ["AdminCommand.PlayerRenameRequest",                                 0x0AC804, {}],
    ["Command.EffectBase",                                               0x09C904, {}],
    ["AdminCommand.EffectBase",                                          0x0AC904, {}],
    ["Command.AbilityBase",                                              0x09CA04, {}],
    ["AdminCommand.AbilityBase",                                         0x0ACA04, {}],
    ["Command.AcquireTimerBase",                                         0x09CB04, {}],
    ["AdminCommand.AcquireTimerBase",                                    0x0ACB04, {}],
    ["Command.ReserveNameRequest",                                       0x09CC04, {}],
    ["AdminCommand.ReserveNameRequest",                                  0x0ACC04, {}],
    ["Command.InternalConnectionBypass",                                 0x09CD04, {}],
    ["AdminCommand.InternalConnectionBypass",                            0x0ACD04, {}],
    ["Command.Queue",                                                    0x09CE04, {}],
    ["AdminCommand.Queue",                                               0x0ACE04, {}],
    ["Command.CharacterStatQuery",                                       0x09CF04, {}],
    ["AdminCommand.CharacterStatQuery",                                  0x0ACF04, {}],
    ["Command.CharacterStatReply",                                       0x09D004, {}],
    ["AdminCommand.CharacterStatReply",                                  0x0AD004, {}],
    ["Command.LockStatusReply",                                          0x09D104, {}],
    ["AdminCommand.LockStatusReply",                                     0x0AD104, {}],
    ["Command.StatTracker",                                              0x09D204, {}],
    ["AdminCommand.StatTracker",                                         0x0AD204, {}],
    ["Command.ItemBase",                                                 0x09D304, {}],
    ["AdminCommand.Items.ListAccountItems",                              0x0AD30401, {}],
    ["AdminCommand.Items.ListItemRentalTerms",                           0x0AD30402, {}],
    ["AdminCommand.Items.ListItemUseOptions",                            0x0AD30403, {}],
    ["AdminCommand.Items.ListItemTimers",                                0x0AD30404, {}],
    ["AdminCommand.Items.ExpireItemTrialTimers",                         0x0AD30405, {}],
    ["AdminCommand.Items.ExpireItemRentalTimers",                        0x0AD30406, {}],
    ["AdminCommand.Items.ClearItemTrialTimers",                          0x0AD30407, {}],
    ["AdminCommand.Items.ClearItemRentalTimers",                         0x0AD30408, {}],
    ["AdminCommand.Items.TestAddItem",                                   0x0AD30409, {}],
    ["AdminCommand.Items.AddAccountItem",                                0x0AD3040A, {}],
    ["AdminCommand.Items.RemoveAccountItem",                             0x0AD3040B, {}],
    ["AdminCommand.Items.ClearAccountItems",                             0x0AD3040C, {}],
    ["AdminCommand.Items.ConvertAccountItem",                            0x0AD3040D, {}],
    ["Command.CurrencyBase",                                             0x09D404, {}],
    ["AdminCommand.Currency.ListCurrencyDiscounts",                      0x0AD40401, {}],
    ["AdminCommand.Currency.RequestSetCurrencyDiscount",                 0x0AD40402, {}],
    ["Command.ImplantBase",                                              0x09D504, {}],
    ["AdminCommand.ImplantBase",                                         0x0AD504, {}],
    ["Command.FileDistribution",                                         0x09D604, {}],
    ["AdminCommand.FileDistribution",                                    0x0AD604, {}],
    ["Command.TopReports",                                               0x09D704, {}],
    ["AdminCommand.TopReports",                                          0x0AD704, {}],
    ["Command.ClearAllReports",                                          0x09D804, {}],
    ["AdminCommand.ClearAllReports",                                     0x0AD804, {}],
    ["Command.GetReport",                                                0x09D904, {}],
    ["AdminCommand.GetReport",                                           0x0AD904, {}],
    ["Command.DeleteReport",                                             0x09DA04, {}],
    ["AdminCommand.DeleteReport",                                        0x0ADA04, {}],
    ["Command.UserReports",                                              0x09DB04, {}],
    ["AdminCommand.UserReports",                                         0x0ADB04, {}],
    ["Command.ClearUserReports",                                         0x09DC04, {}],
    ["AdminCommand.ClearUserReports",                                    0x0ADC04, {}],
    ["Command.WhoRequest",                                               0x09DD04, {}],
    ["AdminCommand.WhoRequest",                                          0x0ADD04, {}],
    ["Command.WhoReply",                                                 0x09DE04, {}],
    ["AdminCommand.WhoReply",                                            0x0ADE04, {}],
    ["Command.FindRequest",                                              0x09DF04, {}],
    ["AdminCommand.FindRequest",                                         0x0ADF04, {}],
    ["Command.FindReply",                                                0x09E004, {}],
    ["AdminCommand.FindReply",                                           0x0AE004, {}],
    ["Command.CaisBase",                                                 0x09E104, {}],
    ["AdminCommand.CaisBase",                                            0x0AE104, {}],
    ["Command.MyRealtimeGatewayMovement",                                0x09E204, {}],
    ["AdminCommand.MyRealtimeGatewayMovement",                           0x0AE204, {}],
    ["Command.ObserverCam",                                              0x09E304, {}],
    ["AdminCommand.ObserverCam",                                         0x0AE304, {}],
    ["Command.AddItemContentPack",                                       0x09E404, {}],
    ["AdminCommand.AddItemContentPack",                                  0x0AE404, {}],
    ["Command.CharacterSlotBase",                                        0x09E504, {}],
    ["AdminCommand.CharacterSlotBase",                                   0x0AE504, {}],
    ["Command.ResourceBase",                                             0x09E804, {}],
    ["AdminCommand.ResourceBase",                                        0x0AE804, {}],
    ["Command.CharacterStateBase",                                       0x09E904, {}],
    ["AdminCommand.CharacterStateBase",                                  0x0AE904, {}],
    ["Command.ResistsBase",                                              0x09EA04, {}],
    ["AdminCommand.ResistsBase",                                         0x0AEA04, {}],
    ["Command.LoadoutBase",                                              0x09EB04, {}],
    ["AdminCommand.LoadoutBase",                                         0x0AEB04, {}],
    ["Command.GiveBotOrders",                                            0x09F104, {}],
    ["AdminCommand.GiveBotOrders",                                       0x0AF104, {}],
    ["Command.ReceiveBotOrders",                                         0x09F204, {}],
    ["AdminCommand.ReceiveBotOrders",                                    0x0AF204, {}],
    ["Command.SetIgnoreMaxTrackables",                                   0x09EC04, {}],
    ["AdminCommand.SetIgnoreMaxTrackables",                              0x0AEC04, {}],
    ["Command.ToggleNavigationLab",                                      0x09ED04, {}],
    ["AdminCommand.ToggleNavigationLab",                                 0x0AED04, {}],
    ["Command.RequirementDebug",                                         0x09EE04, {}],
    ["AdminCommand.RequirementDebug",                                    0x0AEE04, {}],
    ["Command.ConsolePrint",                                             0x09EF04, {}],
    ["AdminCommand.ConsolePrint",                                        0x0AEF04, {}],
    ["Command.ReconcileItemList",                                        0x09F304, {}],
    ["AdminCommand.ReconcileItemList",                                   0x0AF304, {}],
    ["Command.ReconcileItemListReply",                                   0x09F404, {}],
    ["AdminCommand.ReconcileItemListReply",                              0x0AF404, {}],
    ["Command.FillItem",                                                 0x09F504, {}],
    ["AdminCommand.FillItem",                                            0x0AF504, {}],
    ["Command.HeatMapList",                                              0x09F604, {}],
    ["AdminCommand.HeatMapList",                                         0x0AF604, {}],
    ["Command.HeatMapResponse",                                          0x09F704, {}],
    ["AdminCommand.HeatMapResponse",                                     0x0AF704, {}],
    ["Command.Weather",                                                  0x09F904, {}],
    ["AdminCommand.Weather",                                             0x0AF904, {}],
    ["Command.LockBase",                                                 0x09FA04, {}],
    ["AdminCommand.LockBase",                                            0x0AFA04, {}],
    ["Command.AbandonedItemsStats",                                      0x09FB04, {}],
    ["AdminCommand.AbandonedItemsStats",                                 0x0AFB04, {}],
    ["Command.DatabaseBase",                                             0x09FD04, {}],
    ["AdminCommand.DatabaseBase",                                        0x0AFD04, {}],
    ["Command.ModifyEntitlement",                                        0x09FE04, {}],
    ["AdminCommand.ModifyEntitlement",                                   0x0AFE04, {}],

    ["ClientBeginZoning",                                           0x0B, {}],
    ["Combat.AutoAttackTarget",                                     0x0C01, {}],
    ["Combat.AutoAttackOff",                                        0x0C02, {}],
    ["Combat.SingleAttackTarget",                                   0x0C03, {}],
    ["Combat.AttackTargetDamage",                                   0x0C04, {}],
    ["Combat.AttackAttackerMissed",                                 0x0C05, {}],
    ["Combat.AttackTargetDodged",                                   0x0C06, {}],
    ["Combat.AttackProcessed",                                      0x0C07, {}],
    ["Combat.EnableBossDisplay",                                    0x0C09, {}],
    ["Combat.AttackTargetBlocked",                                  0x0C0A, {}],
    ["Combat.AttackTargetParried",                                  0x0C0B, {}],
    ["Mail",                                                        0x0E, {}],
    ["PlayerUpdate.None",                                           0x0F00, {}],
    ["PlayerUpdate.RemovePlayer",                                   0x0F010000, {
        fields: [
            { name: "guid",                         type: "uint64" }
        ]
    }],
    ["PlayerUpdate.RemovePlayerGracefully",                         0x0F010100, {
        fields: [
            { name: "guid",                         type: "uint64" },
            { name: "unknown5",                     type: "boolean" },
            { name: "unknown6",                     type: "uint32" },
            { name: "unknown7",                     type: "uint32" },
            { name: "unknown8",                     type: "uint32" },
            { name: "unknown9",                     type: "uint32" },
            { name: "unknown10",                    type: "uint32" }
        ]
    }],
    ["PlayerUpdate.Knockback",                                      0x0F02, {}],
    ["PlayerUpdate.UpdateHitpoints",                                0x0F03, {}],
    ["PlayerUpdate.PlayAnimation",                                  0x0F04, {}],
    ["PlayerUpdate.AddNotifications",                               0x0F05, {}],
    ["PlayerUpdate.RemoveNotifications",                            0x0F06, {}],
    ["PlayerUpdate.NpcRelevance",                                   0x0F07, {
        fields: [
            { name: "npcs",       type: "array",
                fields: [
                    { name: "guid",                 type: "uint64" },
                    { name: "unknownBoolean1",      type: "boolean" },
                    { name: "unknownByte1",         type: "uint8" }
                ]
            }
        ]
    }],
    ["PlayerUpdate.UpdateScale",                                    0x0F08, {}],
    ["PlayerUpdate.UpdateTemporaryAppearance",                      0x0F09, {}],
    ["PlayerUpdate.RemoveTemporaryAppearance",                      0x0F0A, {}],
    ["PlayerUpdate.PlayCompositeEffect",                            0x0F0B, {}],
    ["PlayerUpdate.SetLookAt",                                      0x0F0C, {}],
    ["PlayerUpdate.RenamePlayer",                                   0x0F0D, {}],
    ["PlayerUpdate.UpdateCharacterState",                           0x0F0E, {
        fields: [
            { name: "characterId",                  type: "uint64" },
            { name: "unknownDword1",                type: "uint32" },
            { name: "unknownDword2",                type: "uint32" },
            { name: "gameTime",                     type: "uint32" }
        ]
    }],
    ["PlayerUpdate.QueueAnimation",                                 0x0F0F, {}],
    ["PlayerUpdate.ExpectedSpeed",                                  0x0F10, {}],
    ["PlayerUpdate.ScriptedAnimation",                              0x0F11, {}],
    ["PlayerUpdate.ThoughtBubble",                                  0x0F12, {}],
    ["PlayerUpdate.SetDisposition",                                 0x0F13, {}],
    ["PlayerUpdate.LootEvent",                                      0x0F14, {}],
    ["PlayerUpdate.SlotCompositeEffectOverride",                    0x0F15, {}],
    ["PlayerUpdate.EffectPackage",                                  0x0F16, {}],
    ["PlayerUpdate.PreferredLanguages",                             0x0F17, {}],
    ["PlayerUpdate.CustomizationChange",                            0x0F18, {}],
    ["PlayerUpdate.PlayerTitle",                                    0x0F19, {}],
    ["PlayerUpdate.AddEffectTagCompositeEffect",                    0x0F1A, {}],
    ["PlayerUpdate.RemoveEffectTagCompositeEffect",                 0x0F1B, {}],
    ["PlayerUpdate.SetSpawnAnimation",                              0x0F1C, {}],
    ["PlayerUpdate.CustomizeNpc",                                   0x0F1D, {}],
    ["PlayerUpdate.SetSpawnerActivationEffect",                     0x0F1E, {}],
    ["PlayerUpdate.SetComboState",                                  0x0F1F, {}],
    ["PlayerUpdate.SetSurpriseState",                               0x0F20, {}],
    ["PlayerUpdate.RemoveNpcCustomization",                         0x0F21, {}],
    ["PlayerUpdate.ReplaceBaseModel",                               0x0F22, {}],
    ["PlayerUpdate.SetCollidable",                                  0x0F23, {}],
    ["PlayerUpdate.UpdateOwner",                                    0x0F24, {}],
    ["PlayerUpdate.WeaponStance",                                   0x0F25, {}],
    ["PlayerUpdate.UpdateTintAlias",                                0x0F26, {}],
    ["PlayerUpdate.MoveOnRail",                                     0x0F27, {}],
    ["PlayerUpdate.ClearMovementRail",                              0x0F28, {}],
    ["PlayerUpdate.MoveOnRelativeRail",                             0x0F29, {}],
    ["PlayerUpdate.Destroyed",                                      0x0F2A, {
        fields: [
            { name: "guid",                 type: "uint64" },
            { name: "unknown1",             type: "uint32" },
            { name: "unknown2",             type: "uint32" },
            { name: "unknown3",             type: "uint32" },
            { name: "unknown4",             type: "uint8" }
        ]
    }],
    ["PlayerUpdate.SeekTarget",                                     0x0F2B, {}],
    ["PlayerUpdate.SeekTargetUpdate",                               0x0F2C, {}],
    ["PlayerUpdate.UpdateActiveWieldType",                          0x0F2D, {
        fields: [
            { name: "characterId",          type: "uint64" },
            { name: "unknownDword1",        type: "uint32" }
        ]
    }],
    ["PlayerUpdate.LaunchProjectile",                               0x0F2E, {}],
    ["PlayerUpdate.SetSynchronizedAnimations",                      0x0F2F, {}],
    ["PlayerUpdate.HudMessage",                                     0x0F30, {}],
    ["PlayerUpdate.CustomizationData",                              0x0F31, {
        fields: [
            { name: "customizationData",       type: "array",
                fields: [
                    { name: "unknown1",         type: "uint32" },
                    { name: "modelName",        type: "string" },
                    { name: "unknown3",         type: "uint32" },
                    { name: "unknown4",         type: "uint32" }
                ]
            }
        ]
    }],
    ["PlayerUpdate.MemberStatus",                                   0x0F32, {}],
    ["PlayerUpdate.SetCurrentAdventure",                            0x0F33, {}],
    ["PlayerUpdate.StartHarvest",                                   0x0F34, {}],
    ["PlayerUpdate.StopHarvest",                                    0x0F35, {}],
    ["PlayerUpdate.KnockedOut",                                     0x0F36, {
        fields: [
            { name: "guid",      type: "uint64" }
        ]
    }],
    ["PlayerUpdate.KnockedOutDamageReport",                         0x0F37, {}],
    ["PlayerUpdate.Respawn",                                        0x0F38, {
        fields: [
            { name: "respawnType",              type: "uint8" },
            { name: "respawnGuid",              type: "uint64" },
            { name: "profileId",                type: "uint32" },
            { name: "profileId2",               type: "uint32" }
        ]
    }],
    ["PlayerUpdate.RespawnReply",                                   0x0F39, {
        fields: [
            { name: "characterId",              type: "uint64" },
            { name: "status",                   type: "boolean" }
        ]
    }],
    ["PlayerUpdate.ReadyToReviveResponse",                          0x0F3A, {}],
    ["PlayerUpdate.ActivateProfile",                                0x0F3B, {}],
    ["PlayerUpdate.SetSpotted",                                     0x0F3C, {}],
    ["PlayerUpdate.Jet",                                            0x0F3D, {
        fields: [
            { name: "characterId",              type: "uint64" },
            { name: "state",                    type: "uint8" }
        ]
    }],
    ["PlayerUpdate.Turbo",                                          0x0F3E, {}],
    ["PlayerUpdate.StartRevive",                                    0x0F3F, {}],
    ["PlayerUpdate.StopRevive",                                     0x0F40, {}],
    ["PlayerUpdate.ReadyToRevive",                                  0x0F41, {}],
    ["PlayerUpdate.SetFaction",                                     0x0F42, {
        fields: [
            { name: "guid",                     type: "uint64" },
            { name: "factionId",                type: "uint8" }
        ]
    }],
    ["PlayerUpdate.SetBattleRank",                                  0x0F43, {
        fields: [
            { name: "characterId",          type: "uint64" },
            { name: "battleRank",           type: "uint32" }
        ]
    }],
    ["PlayerUpdate.StartHeal",                                      0x0F44, {}],
    ["PlayerUpdate.StopHeal",                                       0x0F45, {}],
    ["PlayerUpdate.Currency",                                       0x0F46, {}],
    ["PlayerUpdate.RewardCurrency",                                 0x0F47, {}],
    ["PlayerUpdate.ManagedObject",                                  0x0F48, {
        fields: [
            { name: "guid",                     type: "uint64" },
            { name: "guid2",                    type: "uint64" },
            { name: "characterId",              type: "uint64" }
        ]
    }],
    ["PlayerUpdate.ManagedObjectRequestControl",                    0x0F49, {}],
    ["PlayerUpdate.ManagedObjectResponseControl",                   0x0F4A, {}],
    ["PlayerUpdate.ManagedObjectReleaseControl",                    0x0F4B, {}],
    ["PlayerUpdate.MaterialTypeOverride",                           0x0F4C, {}],
    ["PlayerUpdate.DebrisLaunch",                                   0x0F4D, {}],
    ["PlayerUpdate.HideCorpse",                                     0x0F4E, {}],
    ["PlayerUpdate.CharacterStateDelta",                            0x0F4F, {
        fields: [
            { name: "guid1",                        type: "uint64" },
            { name: "guid2",                        type: "uint64" },
            { name: "guid3",                        type: "uint64" },
            { name: "guid4",                        type: "uint64" },
            { name: "gameTime",                     type: "uint32" }
        ]
    }],
    ["PlayerUpdate.UpdateStat",                                     0x0F50, {}],
    ["PlayerUpdate.AnimationRequest",                               0x0F51, {}],
    ["PlayerUpdate.NonPriorityCharacters",                          0x0F53, {}],
    ["PlayerUpdate.PlayWorldCompositeEffect",                       0x0F54, {}],
    ["PlayerUpdate.AFK",                                            0x0F55, {}],
    ["PlayerUpdate.AddLightweightPc",                               0x0F56, {
        fields: [
            { name: "characterId",      type: "uint64" },
            { name: "transientId",      type: "custom", parser: readUnsignedIntWith2bitLengthValue, packer: packUnsignedIntWith2bitLengthValue },
            { name: "unknownDword1",    type: "uint32" },
            { name: "unknownDword2",    type: "uint32" },
            { name: "unknownDword3",    type: "uint32" },
            { name: "name",             type: "string" },
            { name: "unknownString1",   type: "string" },
            { name: "unknownByte1",     type: "uint8" },
            { name: "unknownDword4",    type: "uint32" },
            { name: "unknownDword5",    type: "uint32" },
            { name: "position",         type: "floatvector3" },
            { name: "rotation",         type: "floatvector4" },
            { name: "unknownFloat1",    type: "float" },
            { name: "unknownGuid1",     type: "uint64" },
            { name: "unknownDword6",    type: "uint32" },
            { name: "unknownDword7",    type: "uint32" },
            { name: "unknownByte2",     type: "uint8" },
            { name: "unknownDword8",    type: "uint32" },
            { name: "unknownDword9",    type: "uint32" },
            { name: "unknownGuid2",     type: "uint64" },
            { name: "unknownByte3",     type: "uint8" }
        ]
    }],
    ["PlayerUpdate.AddLightweightNpc",                              0x0F57, { 
        fields: lightWeightNpcSchema
    }],
    ["PlayerUpdate.AddLightweightVehicle",                          0x0F58, {
        fields: [
            { name: "npcData",                      type: "schema", fields: lightWeightNpcSchema },
            { name: "unknownGuid1",                 type: "uint64" },
            { name: "unknownDword1",                type: "uint32" },
            { name: "unknownDword2",                type: "uint32" },
            { name: "positionUpdate",               type: "custom", parser: readPositionUpdateData, packer: packPositionUpdateData },
            { name: "unknownString1",               type: "string" }
        ]
    }],
    ["PlayerUpdate.AddProxiedObject",                               0x0F59, {}],
    ["PlayerUpdate.LightweightToFullPc",                            0x0F5A, {}],
    ["PlayerUpdate.LightweightToFullNpc",                           0x0F5B, {
        fields: fullNpcDataSchema
    }],
    ["PlayerUpdate.LightweightToFullVehicle",                       0x0F5C, {
        fields: [
            { name: "npcData",                  type: "schema", fields: fullNpcDataSchema },
            { name: "unknownByte1",             type: "uint8" },
            { name: "unknownDword1",            type: "uint32" },
            { name: "unknownArray1",            type: "array", fields: [
                { name: "unknownDword1",            type: "uint32" },
                { name: "unknownBoolean1",          type: "boolean" }
            ]},
            { name: "unknownArray2",            type: "array", fields: [
                { name: "unknownDword1",            type: "uint32" },
                { name: "unknownByte1",             type: "boolean" }
            ]},
            { name: "unknownVector1",           type: "floatvector4" },
            { name: "unknownVector2",           type: "floatvector4" },
            { name: "unknownByte3",             type: "uint8" },
            { name: "unknownArray3",            type: "array", fields: [
                { name: "unknownDword1",            type: "uint32" },
                { name: "unknownQword1",            type: "uint64" }
            ]},
            { name: "unknownArray4",            type: "array", fields: [
                { name: "unknownDword1",            type: "uint32" },
                { name: "unknownQword1",            type: "uint64" }
            ]},
            { name: "unknownArray5",            type: "array", fields: [
                { name: "unknownData1",             type: "schema", fields: [
                    { name: "unknownQword1",            type: "uint64" },
                    { name: "unknownData1",             type: "schema", fields: [
                        { name: "unknownDword1",            type: "uint32" },
                        { name: "unknownDword2",            type: "uint32" },
                        { name: "unknownDword3",            type: "uint32" },
                        { name: "unknownString1",           type: "string" },
                        { name: "unknownString2",           type: "string" }
                    ]},
                    { name: "unknownDword1",            type: "uint32" },
                    { name: "unknownString1",           type: "string" }
                ]},
                { name: "unknownByte1",             type: "uint8" }
            ]},
            { name: "unknownArray6",            type: "array", fields: [
                { name: "unknownString1",           type: "string" }
            ]},
            { name: "unknownArray7",            type: "array", fields: itemWeaponDetailSubSchema1 },
            { name: "unknownArray8",            type: "array", fields: itemWeaponDetailSubSchema2 },
            { name: "unknownFloat1",            type: "float" }
        ]
    }],
    ["PlayerUpdate.FullCharacterDataRequest",                       0x0F5D, {
        fields: [
            { name: "guid",        type: "uint64" }
        ]
    }],
    ["PlayerUpdate.InitiateNameChange",                             0x0F5E, {}],
    ["PlayerUpdate.NameChangeResult",                               0x0F5F, {}],
    ["PlayerUpdate.NameValidationResult",                           0x0F60, {}],
    ["PlayerUpdate.Deploy",                                         0x0F61, {}],
    ["PlayerUpdate.LowAmmoUpdate",                                  0x0F62, {}],
    ["PlayerUpdate.KilledBy",                                       0x0F63, {}],
    ["PlayerUpdate.MotorRunning",                                   0x0F64, {}],
    ["PlayerUpdate.DroppedIemNotification",                         0x0F65, {}],
    ["PlayerUpdate.NoSpaceNotification",                            0x0F66, {}],
    ["PlayerUpdate.StartMultiStateDeath",                           0x0F68, {}],
    ["PlayerUpdate.AggroLevel",                                     0x0F69, {}],
    ["PlayerUpdate.DoorState",                                      0x0F6A, {}],
    ["PlayerUpdate.RequestToggleDoorState",                         0x0F6B, {}],
    ["PlayerUpdate.BeginCharacterAccess",                           0x0F6C, {}],
    ["PlayerUpdate.EndCharacterAccess",                             0x0F6D, {}],
    ["PlayerUpdate.UpdateMutateRights",                             0x0F6E, {}],
    ["PlayerUpdate.UpdateFogOfWar",                                 0x0F70, {}],
    ["PlayerUpdate.SetAllowRespawn",                                0x0F71, {}],
    ["Ability.ClientRequestStartAbility",                           0x1001, {}],
    ["Ability.ClientRequestStopAbility",                            0x1002, {}],
    ["Ability.ClientMoveAndCast",                                   0x1003, {}],
    ["Ability.Failed",                                              0x1004, {}],
    ["Ability.StartCasting",                                        0x1005, {}],
    ["Ability.Launch",                                              0x1006, {}],
    ["Ability.Land",                                                0x1007, {}],
    ["Ability.StartChanneling",                                     0x1008, {}],
    ["Ability.StopCasting",                                         0x1009, {}],
    ["Ability.StopAura",                                            0x100A, {}],
    ["Ability.MeleeRefresh",                                        0x100B, {}],
    ["Ability.AbilityDetails",                                      0x100C, {}],
    ["Ability.PurchaseAbility",                                     0x100D, {}],
    ["Ability.UpdateAbilityExperience",                             0x100E, {}],
    ["Ability.SetDefinition",                                       0x100F, {}],
    ["Ability.RequestAbilityDefinition",                            0x1010, {}],
    ["Ability.AddAbilityDefinition",                                0x1011, {}],
    ["Ability.PulseLocationTargeting",                              0x1012, {}],
    ["Ability.ReceivePulseLocation",                                0x1013, {}],
    ["Ability.ActivateItemAbility",                                 0x1014, {}],
    ["Ability.ActivateVehicleAbility",                              0x1015, {}],
    ["Ability.DeactivateItemAbility",                               0x1016, {}],
    ["Ability.DeactivateVehicleAbility",                            0x1017, {}],
    ["ClientUpdate.Hitpoints",                                      0x110100, {}],
    ["ClientUpdate.ItemAdd",                                        0x110200, {
        fields: [
            { name: "itemAddData",                  type: "custom", parser: parseItemAddData, packer: packItemAddData }
        ]
    }],
    ["ClientUpdate.ItemUpdate",                                     0x110300, {}],
    ["ClientUpdate.ItemDelete",                                     0x110400, {}],
    ["ClientUpdate.UpdateStat",                                     0x110500, {
        fields: [
            { name: "stats",                        type: "array", fields: statDataSchema }
        ]
    }],
    ["ClientUpdate.CollectionStart",                                0x110600, {}],
    ["ClientUpdate.CollectionRemove",                               0x110700, {}],
    ["ClientUpdate.CollectionAddEntry",                             0x110800, {}],
    ["ClientUpdate.CollectionRemoveEntry",                          0x110900, {}],
    ["ClientUpdate.UpdateLocation",                                 0x110A00, {}],
    ["ClientUpdate.Mana",                                           0x110B00, {}],
    ["ClientUpdate.UpdateProfileExperience",                        0x110C00, {}],
    ["ClientUpdate.AddProfileAbilitySetApl",                        0x110D00, {}],
    ["ClientUpdate.AddEffectTag",                                   0x110E00, {}],
    ["ClientUpdate.RemoveEffectTag",                                0x110F00, {}],
    ["ClientUpdate.UpdateProfileRank",                              0x111000, {}],
    ["ClientUpdate.CoinCount",                                      0x111100, {}],
    ["ClientUpdate.DeleteProfile",                                  0x111200, {}],
    ["ClientUpdate.ActivateProfile",                                0x111300, {
        fields: [
            { name: "profileData",                  type: "byteswithlength", fields: profileDataSchema },
            { name: "attachmentData",               type: "array", fields: [
                { name: "modelName",                    type: "string" },
                { name: "unknownString1",               type: "string" },
                { name: "tintAlias",                    type: "string" },
                { name: "unknownString2",               type: "string" },
                { name: "unknownDword1",                type: "uint32" },
                { name: "unknownDword2",                type: "uint32" },
                { name: "slotId",                       type: "uint32" }
            ]},
            { name: "unknownDword1",                type: "uint32" },
            { name: "unknownDword2",                type: "uint32" },
            { name: "unknownDword3",                type: "uint32" },
            { name: "unknownDword4",                type: "uint32" },
            { name: "unknownString1",               type: "string" },
            { name: "unknownString2",               type: "string" },
        ]
    }],
    ["ClientUpdate.AddAbility",                                     0x111400, {}],
    ["ClientUpdate.NotifyPlayer",                                   0x111500, {}],
    ["ClientUpdate.UpdateProfileAbilitySetApl",                     0x111600, {}],
    ["ClientUpdate.RemoveActionBars",                               0x111700, {}],
    ["ClientUpdate.UpdateActionBarSlot",                            0x111800, {}],
    ["ClientUpdate.DoneSendingPreloadCharacters",                   0x111900, {
        fields: [
            { name: "unknownBoolean1",              type: "uint8" }
        ]
    }],
    ["ClientUpdate.SetGrandfatheredStatus",                         0x111A00, {}],
    ["ClientUpdate.UpdateActionBarSlotUsed",                        0x111B00, {}],
    ["ClientUpdate.PhaseChange",                                    0x111C00, {}],
    ["ClientUpdate.UpdateKingdomExperience",                        0x111D00, {}],
    ["ClientUpdate.DamageInfo",                                     0x111E00, {}],
    ["ClientUpdate.ZonePopulation",                                 0x111F00, {
        fields: [
            // { name: "populations",                  type: "array",     elementType: "uint8" }
        ]
    }],
    ["ClientUpdate.RespawnLocations",                               0x112000, {
        // fields: [
        //     { name: "unknownFlags",                 type: "uint8" },
        //     { name: "locations",                    type: "array",  fields: respawnLocationDataSchema },
        //     { name: "unknownDword1",                type: "uint32" },
        //     { name: "unknownDword2",                type: "uint32" },
        //     { name: "locations2",                   type: "array",  fields: respawnLocationDataSchema }
        // ]
    }],
    ["ClientUpdate.ModifyMovementSpeed",                            0x112100, {}],
    ["ClientUpdate.ModifyTurnRate",                                 0x112200, {}],
    ["ClientUpdate.ModifyStrafeSpeed",                              0x112300, {}],
    ["ClientUpdate.UpdateManagedLocation",                          0x112400, {}],
    ["ClientUpdate.ScreenEffect",                                   0x112500, {}],
    ["ClientUpdate.MovementVersion",                                0x112600, {
        fields: [
            { name: "version",       type: "uint8" }
        ]
    }],
    ["ClientUpdate.ManagedMovementVersion",                         0x112700, {
        fields: [
            { name: "version",       type: "custom", parser: readUnsignedIntWith2bitLengthValue, packer: packUnsignedIntWith2bitLengthValue }
        ]
    }],
    ["ClientUpdate.UpdateWeaponAddClips",                           0x112800, {
        fields: [
            { name: "unknownDword1",                type: "uint32" },
            { name: "unknownByte1",                 type: "uint8" },
            { name: "unknownFloat1",                type: "float" }
        ]
    }],
    ["ClientUpdate.SpotProbation",                                  0x112900, {}],
    ["ClientUpdate.DailyRibbonCount",                               0x112A00, {}],
    ["ClientUpdate.DespawnNpcUpdate",                               0x112B00, {}],
    ["ClientUpdate.LoyaltyPoints",                                  0x112C00, {}],
    ["ClientUpdate.Membership",                                     0x112D00, {}],
    ["ClientUpdate.ResetMissionRespawnTimer",                       0x112E00, {}],
    ["ClientUpdate.Freeze",                                         0x112F00, {}],
    ["ClientUpdate.InGamePurchaseResult",                           0x113000, {}],
    ["ClientUpdate.QuizComplete",                                   0x113100, {}],
    ["ClientUpdate.StartTimer",                                     0x113200, []],
    ["ClientUpdate.CompleteLogoutProcess",                          0x113300, []],
    ["ClientUpdate.ProximateItems",                                 0x113400, []],
    ["ClientUpdate.TextAlert",                                      0x113500, []],
    ["ClientUpdate.ClearEntitlementValues",                         0x113600, []],
    ["ClientUpdate.AddEntitlementValue",                            0x113700, []],
    ["MiniGame",                                                    0x12, {}],
    ["Group",                                                       0x13, {}],
    ["Encounter",                                                   0x14, {}],
    ["Inventory",                                                   0x15, {}],
    ["SendZoneDetails",                                             0x16, {
        fields: [
            { name: "zoneName",                     type: "string" },
            { name: "unknownDword1",                type: "uint32" },
            { name: "unknownBoolean1",              type: "boolean" },
            { name: "unknownFloat1",                type: "float" },
            { name: "skyData",                      type: "schema", fields: [
                { name: "name",                         type: "string" },
                { name: "unknownDword1",                type: "int32" },
                { name: "unknownDword2",                type: "int32" },
                { name: "unknownDword3",                type: "int32" },
                { name: "unknownDword4",                type: "int32" },
                { name: "unknownDword5",                type: "int32" },
                { name: "unknownDword6",                type: "int32" },
                { name: "unknownDword7",                type: "int32" },
                { name: "unknownDword8",                type: "int32" },
                { name: "unknownDword9",                type: "int32" },
                { name: "unknownDword10",               type: "int32" },
                { name: "unknownDword11",               type: "int32" },
                { name: "unknownDword12",               type: "int32" },
                { name: "unknownDword13",               type: "int32" },
                { name: "unknownDword14",               type: "int32" },
                { name: "unknownDword15",               type: "int32" },
                { name: "unknownDword16",               type: "int32" },
                { name: "unknownDword17",               type: "int32" },
                { name: "unknownDword18",               type: "int32" },
                { name: "unknownDword19",               type: "int32" },
                { name: "unknownDword20",               type: "int32" },
                { name: "unknownDword21",               type: "int32" },
                { name: "unknownDword22",               type: "int32" },
                { name: "unknownDword23",               type: "int32" },
                { name: "unknownDword24",               type: "int32" },
                { name: "unknownDword25",               type: "int32" },
                { name: "unknownArray",                 type: "array", length: 50, fields: [
                    { name: "unknownDword1",                type: "int32" },
                    { name: "unknownDword2",                type: "int32" },
                    { name: "unknownDword3",                type: "int32" },
                    { name: "unknownDword4",                type: "int32" },
                    { name: "unknownDword5",                type: "int32" },
                    { name: "unknownDword6",                type: "int32" },
                    { name: "unknownDword7",                type: "int32" }                  
                ]}
            ]},
            { name: "zoneId1",                      type: "uint32" },
            { name: "zoneId2",                      type: "uint32" },
            { name: "nameId",                       type: "uint32" },
            { name: "unknownBoolean7",              type: "boolean" }
        ]
    }],
    ["ReferenceData.ItemClassDefinitions",                          0x1701, {}],
    ["ReferenceData.ItemCategoryDefinitions",                       0x1702, {}],
    ["ReferenceData.ClientProfileData",                             0x1703, {
        fields: [
            { name: "profiles",                     type: "array", fields: [
                { name: "profileId",                    type: "uint32" },
                { name: "profileData",                  type: "schema", fields: [
                    { name: "profileId",                    type: "uint32" },
                    { name: "nameId",                       type: "uint32" },
                    { name: "descriptionId",                type: "uint32" },
                    { name: "profileType",                  type: "uint32" },
                    { name: "iconId",                       type: "uint32" },
                    { name: "unknownDword6",                type: "uint32" },
                    { name: "unknownDword7",                type: "uint32" },
                    { name: "unknownDword8",                type: "uint32" },
                    { name: "unknownDword9",                type: "uint32" },
                    { name: "unknownBoolean1",              type: "boolean" },
                    { name: "unknownBoolean2",              type: "boolean" },
                    { name: "unknownDword10",               type: "uint32" },
                    { name: "unknownDword11",               type: "uint32" },
                    { name: "unknownArray1",                type: "array", fields: [
                        { name: "unknownDword1",                type: "uint32" },
                        { name: "unknownDword2",                type: "uint32" }
                    ]},
                    { name: "firstPersonArms1",             type: "uint32" },
                    { name: "firstPersonArms2",             type: "uint32" },
                    { name: "unknownDword14",               type: "uint32" },
                    { name: "unknownArray2",                type: "array", fields: [
                        { name: "unknownDword1",                type: "uint32" }
                    ]},
                    { name: "unknownFloat1",                type: "float" },
                    { name: "unknownFloat2",                type: "float" },
                    { name: "unknownFloat3",                type: "float" },
                    { name: "unknownFloat4",                type: "float" },
                    { name: "unknownDword15",               type: "uint32" },
                    { name: "unknownDword16",               type: "uint32" },
                    { name: "unknownDword17",               type: "uint32" },
                    { name: "imageSetId1",                  type: "uint32" },
                    { name: "imageSetId2",                  type: "uint32" }
                ]}
            ]}
        ]
    }],
    ["ReferenceData.WeaponDefinitions",                             0x1704, {
        fields: [
            { name: "data",                         type: "byteswithlength" }
        ]
    }],
    ["ReferenceData.ProjectileDefinitions",                         0x1705, {}],
    ["ReferenceData.VehicleDefinitions",                            0x1706, {
        fields: [
            { name: "data",                         type: "custom", parser: parseVehicleReferenceData, packer: packVehicleReferenceData }
        ]
    }],
    ["Objective",                                                   0x18, {}],
    ["Debug",                                                       0x19, {}],
    ["Ui.TaskAdd",                                                  0x1A01, {}],
    ["Ui.TaskUpdate",                                               0x1A02, {}],
    ["Ui.TaskComplete",                                             0x1A03, {}],
    ["Ui.TaskFail",                                                 0x1A04, {}],
    ["Ui.Unknown",                                                  0x1A05, {}],
    ["Ui.ExecuteScript",                                            0x1A07, {}],
    ["Ui.StartTimer",                                               0x1A09, {}],
    ["Ui.ResetTimer",                                               0x1A0A, {}],
    ["Ui.ObjectiveTargetUpdate",                                    0x1A0D, {}],
    ["Ui.Message",                                                  0x1A0E, {}],
    ["Ui.CinematicStartLookAt",                                     0x1A0F, {}],
    ["Ui.WeaponHitFeedback",                                        0x1A10, {}],
    ["Ui.HeadShotFeedback",                                         0x1A11, {}],
    ["Ui.WaypointCooldown",                                         0x1A14, {}],
    ["Ui.ZoneWaypoint",                                             0x1A15, {}],
    ["Ui.WaypointNotify",                                           0x1A16, {}],
    ["Ui.ContinentDominationNotification",                          0x1A17, {}],
    ["Ui.InteractStart",                                            0x1A18, {}],
    ["Ui.SomeInteractionThing",                                     0x1A19, {}],
    ["Ui.RewardNotification",                                       0x1A1A, {}],
    ["Ui.WarpgateRotateWarning",                                    0x1A1B, {}],
    ["Ui.SystemBroadcast",                                          0x1A1C, {}],
    ["Quest",                                                       0x1B, {}],
    ["Reward",                                                      0x1C, {}],
    ["GameTimeSync",                                                0x1D, {
        fields: [
            { name: "time",                         type: "uint64" },
            { name: "unknownFloat1",                type: "float" },
            { name: "unknownBoolean1",              type: "boolean" }
        ]
    }],
    ["Pet",                                                         0x1E, {}],
    ["PointOfInterestDefinitionRequest",                            0x1F, {}],
    ["PointOfInterestDefinitionReply",                              0x20, {}],
    ["WorldTeleportRequest",                                        0x21, {}],
    ["Trade",                                                       0x22, {}],
    ["EscrowGivePackage",                                           0x23, {}],
    ["EscrowGotPackage",                                            0x24, {}],
    ["UpdateEncounterDataCommon",                                   0x25, {}],
    ["Recipe.Add",                                                  0x2601, {}],
    ["Recipe.ComponentUpdate",                                      0x2602, {}],
    ["Recipe.Remove",                                               0x2603, {}],
    ["Recipe.List",                                                 0x2605, {
        fields: [
            { name: "recipes",                type: "array", fields: [
                { name: "recipeId",                      type: "uint32" },
                { name: "recipeData",                      type: "schema", fields: [
                    { name: "recipeId",                      type: "uint32" },
                    { name: "nameId",                      type: "uint32" },
                    { name: "iconId",                      type: "uint32" },
                    { name: "unknownDword1",                      type: "uint32" },
                    { name: "descriptionId",                      type: "uint32" },
                    { name: "rewardCount",                      type: "uint32" },
                    { name: "membersOnly",                      type: "boolean" },
                    { name: "discovered",                      type: "uint32" },
                    { name: "components",                      type: "array", fields: [
                        { name: "componentId",                      type: "uint32" },
                        { name: "componentData",                      type: "schema", fields: [
                            { name: "nameId",                      type: "uint32" },
                            { name: "iconId",                      type: "uint32" },
                            { name: "unknownDword1",                      type: "uint32" },
                            { name: "descriptionId",                      type: "uint32" },
                            { name: "requiredCount",                      type: "uint32" },
                            { name: "unknownDword2",                      type: "uint32" },
                            { name: "unknownDword3",                      type: "uint32" },
                            { name: "unknownDword4",                      type: "uint32" },
                            { name: "itemId",                      type: "uint32" },

                        ]}
                    ]},
                    { name: "rewardItemId",                      type: "uint32" }
                ]},
            ]}
        ]
    }],
    ["InGamePurchase.PreviewOrderRequest",                          0x270100, {}],
    ["InGamePurchase.PreviewOrderResponse",                         0x270200, {}],
    ["InGamePurchase.PlaceOrderRequest",                            0x270300, {}],
    ["InGamePurchase.PlaceOrderResponse",                           0x270400, {}],
    ["InGamePurchase.StoreBundles",                                 0x27050000, {
        fields: [
            { name: "unknownDword1",                type: "uint32" },
            { name: "unknownDword2",                type: "uint32" },
            { name: "storeId",                      type: "uint32" },
            { name: "unknownDword3",                type: "uint32" },
            { name: "unknownDword4",                type: "uint32" },
            { name: "imageData",                    type: "schema", fields: [
                { name: "imageSetId",                   type: "string" },
                { name: "imageTintValue",               type: "string" },
            ]},
            { name: "storeBundles",                 type: "array", fields : [
                { name: "bundleId",                     type: "uint32" },
                { name: "appStoreBundle",               type: "schema", fields: [
                    { name: "storeBundle",                  type: "schema", fields: [
                        { name: "marketingBundle",                  type: "schema", fields: [
                            { name: "bundleId",                     type: "uint32" },
                            { name: "nameId",                       type: "uint32" },
                            { name: "descriptionId",                type: "uint32" },
                            { name: "unknownDword4",                type: "uint32" },
                            { name: "imageData",                    type: "schema", fields: [
                                { name: "imageSetId",                   type: "string" },
                                { name: "imageTintValue",               type: "string" },
                            ]},
                            { name: "unknownBoolean1",              type: "boolean" },
                            { name: "unknownString1",               type: "string" },
                            { name: "stationCurrencyId",            type: "uint32" },
                            { name: "price",                        type: "uint32" },
                            { name: "currencyId",                   type: "uint32" },
                            { name: "currencyPrice",                type: "uint32" },
                            { name: "unknownDword9",                type: "uint32" },
                            { name: "unknownTime1",                 type: "uint64" },
                            { name: "unknownTime2",                 type: "uint64" },
                            { name: "unknownDword10",               type: "uint32" },
                            { name: "unknownBoolean2",              type: "boolean" },
                            { name: "itemListDetails",              type: "array", fields: [
                                { name: "unknownDword1",                type: "uint32" },
                                { name: "imageSetId",                   type: "uint32" },
                                { name: "itemId",                       type: "uint32" },
                                { name: "unknownString1",               type: "string" }
                            ]},
                        ]},
                        { name: "storeId",                      type: "uint32" },
                        { name: "categoryId",                   type: "uint32" },
                        { name: "unknownBoolean1",              type: "boolean" },
                        { name: "unknownDword3",                type: "uint32" },
                        { name: "unknownDword4",                type: "uint32" },
                        { name: "unknownDword5",                type: "uint32" },
                        { name: "unknownDword6",                type: "uint32" },
                        { name: "unknownDword7",                type: "uint32" },
                        { name: "unknownDword8",                type: "uint32" },
                        { name: "unknownDword9",                type: "uint32" },
                        { name: "unknownDword10",               type: "uint32" },
                        { name: "unknownBoolean2",              type: "boolean" },
                        { name: "unknownBoolean3",              type: "boolean" },
                        { name: "unknownBoolean4",              type: "boolean" }
                    ]},
                    { name: "unknownDword1",                type: "uint32" },
                    { name: "unknownDword2",                type: "uint32" },
                    { name: "unknownDword3",                type: "uint32" },
                    { name: "unknownDword4",                type: "uint32" },
                    { name: "unknownDword5",                type: "uint32" },
                    { name: "unknownDword6",                type: "uint32" },
                    { name: "unknownString1",               type: "string" },
                    { name: "unknownDword7",                type: "uint32" },
                    { name: "unknownDword8",                type: "uint32" },
                    { name: "unknownDword9",                type: "uint32" },
                    { name: "memberSalePrice",              type: "uint32" },
                    { name: "unknownDword11",               type: "uint32" },
                    { name: "unknownString2",               type: "string" },
                    { name: "unknownDword12",               type: "uint32" },
                    { name: "unknownBoolean1",              type: "boolean" }
                ]}
            ]},
            { name: "offset",               type: "debugoffset" }
        ]
    }],
    ["InGamePurchase.StoreBundleStoreUpdate",                       0x27050001, {}],
    ["InGamePurchase.StoreBundleStoreBundleUpdate",                 0x27050002, {}],
    ["InGamePurchase.StoreBundleCategoryGroups",                    0x270600, {}],
    ["InGamePurchase.StoreBundleCategories",                        0x270700, {
        fields: [
            { name: "categories", type: "array", fields : [
                { name: "categoryId",               type: "uint32" },
                { name: "categoryData",             type: "schema", fields: [
                    { name: "categoryId",               type: "uint32" },
                    { name: "unknownDword1",            type: "uint32" },
                    { name: "unknownString1",           type: "string" },
                    { name: "unknownString2",           type: "string" },
                    { name: "unknownBoolean1",          type: "boolean" },
                    { name: "unknownDword2",            type: "uint32" },
                    { name: "unknownArray1",            type: "array", fields: [
                        { name: "unknownDword1",            type: "uint32" },
                        { name: "unknownDword2",            type: "uint32" },
                        { name: "unknownDword3",            type: "uint32" }
                    ]},
                    { name: "unknownDword3",            type: "uint32" }
                ]}
            ]}
        ]
    }],
    ["InGamePurchase.ExclusivePartnerStoreBundles",                 0x270800, {}],
    ["InGamePurchase.StoreBundleGroups",                            0x270900, {}],
    ["InGamePurchase.WalletInfoRequest",                            0x270A00, {}],
    ["InGamePurchase.WalletInfoResponse",                           0x270B00, {
        fields: [
            { name: "unknownDword1",                type: "uint32" },
            { name: "unknownBoolean1",              type: "boolean" },
            { name: "unknownDword2",                type: "uint32" },
            { name: "unknownDword3",                type: "uint32" },
            { name: "unknownString1",               type: "string" },
            { name: "unknownString2",               type: "string" },
            { name: "unknownBoolean2",              type: "boolean" }
        ]
    }],
    ["InGamePurchase.ServerStatusRequest",                          0x270C00, {}],
    ["InGamePurchase.ServerStatusResponse",                         0x270D00, {}],
    ["InGamePurchase.StationCashProductsRequest",                   0x270E00, {}],
    ["InGamePurchase.StationCashProductsResponse",                  0x270F00, {}],
    ["InGamePurchase.CurrencyCodesRequest",                         0x271000, {}],
    ["InGamePurchase.CurrencyCodesResponse",                        0x271100, {}],
    ["InGamePurchase.StateCodesRequest",                            0x271200, {}],
    ["InGamePurchase.StateCodesResponse",                           0x271300, {}],
    ["InGamePurchase.CountryCodesRequest",                          0x271400, {}],
    ["InGamePurchase.CountryCodesResponse",                         0x271500, {}],
    ["InGamePurchase.SubscriptionProductsRequest",                  0x271600, {}],
    ["InGamePurchase.SubscriptionProductsResponse",                 0x271700, {}],
    ["InGamePurchase.EnableMarketplace",                            0x271800, {
        fields: [
            { name: "unknownBoolean1",     type: "boolean" },
            { name: "unknownBoolean2",     type: "boolean" }
        ]
    }],
    ["InGamePurchase.AcccountInfoRequest",                          0x271900, {
        fields: [
            { name: "locale",     type: "string" }
        ]
    }],
    ["InGamePurchase.AcccountInfoResponse",                         0x271A00, {}],
    ["InGamePurchase.StoreBundleContentRequest",                    0x271B00, {}],
    ["InGamePurchase.StoreBundleContentResponse",                   0x271C00, {}],
    ["InGamePurchase.ClientStatistics",                             0x271D00, {}],
    ["InGamePurchase.SendMannequinStoreBundlesToClient",            0x271E00, {}],
    ["InGamePurchase.DisplayMannequinStoreBundles",                 0x271F00, {}],
    ["InGamePurchase.ItemOfTheDay",                                 0x272000, {
        fields: [
            { name: "bundleId",     type: "uint32" }
        ]
    }],
    ["InGamePurchase.EnablePaymentSources",                         0x272100, {}],
    ["InGamePurchase.SetMembershipFreeItemInfo",                    0x272200, {}],
    ["InGamePurchase.WishListAddBundle",                            0x272300, {}],
    ["InGamePurchase.WishListRemoveBundle",                         0x272400, {}],
    ["InGamePurchase.PlaceOrderRequestClientTicket",                0x272500, {}],
    ["InGamePurchase.GiftOrderNotification",                        0x272600, {}],
    ["InGamePurchase.ActiveSchedules",                              0x272700, {
        fields: [
            { name: "unknown1",         type: "array", fields : [
                { name: "id",                   type: "uint32" }
            ]},
            { name: "unknown2",         type: "uint32" },
            { name: "unknown3",         type: "array", fields : [
                { name: "scheduleId",           type: "uint32" },
                { name: "time",                 type: "uint32" },
                { name: "unknown1",             type: "uint32" },
                { name: "unknown2",             type: "uint8" },
                { name: "unknown3",             type: "uint8" },
                { name: "unknown4",             type: "uint8" },
                { name: "unknown5",             type: "uint8" }
            ]}
        ]
    }],
    ["InGamePurchase.LoyaltyInfoAndStoreRequest",                   0x272800, {}],
    ["InGamePurchase.NudgeOfferNotification",                       0x272900, {}],
    ["InGamePurchase.NudgeRequestStationCashProducts",              0x272A00, {}],
    ["InGamePurchase.SpiceWebAuthUrlRequest",                       0x272B00, {}],
    ["InGamePurchase.SpiceWebAuthUrlResponse",                      0x272C00, {}],
    ["InGamePurchase.BundlePriceUpdate",                            0x272D00, {}],
    ["InGamePurchase.WalletBalanceUpdate",                          0x272E00, {}],
    ["InGamePurchase.MemberFreeItemCount",                          0x272F00, {}],
    ["QuickChat.SendData",                                          0x280100, {
        fields: [
            { name: "commands",                     type: "array", fields: [
                { name: "commandId",                    type: "uint32" },
                { name: "commandData",                  type: "schema", fields: [
                    { name: "commandId",                type: "uint32" },
                    { name: "menuStringId",             type: "uint32" },
                    { name: "chatStringId",             type: "uint32" },
                    { name: "unknownDword1",            type: "uint32" },
                    { name: "unknownDword2",            type: "uint32" },
                    { name: "unknownDword3",            type: "uint32" },
                    { name: "unknownDword4",            type: "uint32" },
                    { name: "unknownDword5",            type: "uint32" },
                    { name: "unknownDword6",            type: "uint32" },
                    { name: "unknownDword7",            type: "uint32" }
                ]},
            ]}
        ]
    }],
    ["QuickChat.SendTell",                                          0x2802, {}],
    ["QuickChat.SendChatToChannel",                                 0x2803, {}],
    ["Report",                                                      0x29, {}],
    ["LiveGamer",                                                   0x2A, {}],
    ["Acquaintance",                                                0x2B, {}],
    ["ClientServerShuttingDown",                                    0x2C, {}],
    ["Friend.List",                                                 0x2D01, {
        fields: [
            { name: "friends",         type: "array", fields: [
                { name: "unknown1",                type: "uint32" },
                { name: "unknown2",                type: "uint32" },
                { name: "unknown3",                type: "uint32" },
                { name: "characterName",           type: "string" },
                { name: "unknown4",                type: "uint32" },
                { name: "characterId",             type: "uint64" },
                { name: "is_online_data",          type: "variabletype8",
                    types: {
                        0: [
                            { name: "unknown5",                type: "uint32" },
                            { name: "unknown6",                type: "uint32" }
                        ],
                        1: [
                            { name: "unknown5",                type: "uint32" },
                            { name: "unknown6",                type: "uint32" },
                            { name: "unknown7",                type: "uint32" },
                            { name: "unknown8",                type: "uint32" },
                            { name: "unknown9",                type: "uint8" },
                            { name: "location_x",              type: "float" },
                            { name: "location_y",              type: "float" },
                            { name: "unknown10",               type: "uint32" },
                            { name: "unknown11",               type: "uint32" },
                            { name: "unknown12",               type: "uint32" },
                            { name: "unknown13",               type: "uint32" },
                            { name: "unknown14",               type: "uint8" }
                        ]
                    }
                }
            ]}
        ]
    }],
    ["Friend.Online",                                      0x2D02, {} ],
    ["Friend.Offline",                                     0x2D03, {} ],
    ["Friend.UpdateProfileInfo",                           0x2D04, {} ],
    ["Friend.UpdatePositions",                             0x2D05, {} ],
    ["Friend.Add",                                         0x2D06, {} ],
    ["Friend.Remove",                                      0x2D07, {} ],
    ["Friend.Message",                                     0x2D08, {
        fields: [
            { name: "messageType",                  type: "uint8" },
            { name: "messageTime",                  type: "uint64" },
            { name: "messageData1",                 type: "schema", fields: [
                { name: "unknowndDword1",               type: "uint32" },
                { name: "unknowndDword2",               type: "uint32" },
                { name: "unknowndDword3",               type: "uint32" },
                { name: "characterName",                type: "string" },
                { name: "unknownString1",               type: "string" }
            ]},
            { name: "messageData2",                 type: "schema", fields: [
                { name: "unknowndDword1",               type: "uint32" },
                { name: "unknowndDword2",               type: "uint32" },
                { name: "unknowndDword3",               type: "uint32" },
                { name: "characterName",                type: "string" },
                { name: "unknownString1",               type: "string" }
            ]}
        ]
    }],
    ["Friend.Status",                                               0x2D09, {} ],
    ["Friend.Rename",                                               0x2D0A, {} ],
    ["Broadcast",                                                   0x2E, {}],
    ["ClientKickedFromServer",                                      0x2F, {}],
    ["UpdateClientSessionData",                                     0x30, {
        fields: [
            { name: "sessionId",                type: "string" },
            { name: "stationName",              type: "string" },
            { name: "unknownBoolean1",          type: "boolean" },
            { name: "unknownString1",           type: "string" },
            { name: "unknownString2",           type: "string" },
            { name: "stationCode",              type: "string" },
            { name: "unknownString3",           type: "string" }
        ]
    }],
    ["BugSubmission",                                               0x31, {}],
    ["WorldDisplayInfo",                                            0x32, {
        fields: [
            { name: "worldId",        type: "uint32" }
        ]
    }],
    ["MOTD",                                                        0x33, {}],
    ["SetLocale",                                                   0x34, {
        fields: [
            { name: "locale",        type: "string" }
        ]
    }],
    ["SetClientArea",                                               0x35, {}],
    ["ZoneTeleportRequest",                                         0x36, {}],
    ["TradingCard",                                                 0x37, {}],
    ["WorldShutdownNotice",                                         0x38, {}],
    ["LoadWelcomeScreen",                                           0x39, {}],
    ["ShipCombat",                                                  0x3A, {}],
    ["AdminMiniGame",                                               0x3B, {}],
    ["KeepAlive",                                                   0x3C, {
        fields: [
            { name: "gameTime",        type: "uint32" }
        ]
    }],
    ["ClientExitLaunchUrl",                                         0x3D, {}],
    ["ClientPath",                                                  0x3E, {}],
    ["ClientPendingKickFromServer",                                 0x3F, {}],
    ["MembershipActivation",                                        0x40, {
        fields: [
            { name: "unknown",        type: "uint32" }
        ]
    }],
    ["Lobby.JoinLobbyGame",                                         0x4101, {}],
    ["Lobby.LeaveLobbyGame",                                        0x4102, {}],
    ["Lobby.StartLobbyGame",                                        0x4103, {}],
    ["Lobby.UpdateLobbyGame",                                       0x4104, {}],
    ["Lobby.SendLobbyToClient",                                     0x4106, {}],
    ["Lobby.SendLeaveLobbyToClient",                                0x4107, {}],
    ["Lobby.RemoveLobbyGame",                                       0x4108, {}],
    ["Lobby.LobbyErrorMessage",                                     0x410B, {}],
    ["Lobby.ShowLobbyUi",                                           0x410C, {}],
    ["LobbyGameDefinition.DefinitionsRequest",                      0x420100, {
        fields: []
    }],
    ["LobbyGameDefinition.DefinitionsResponse",                     0x420200, {
        fields: [
            { name: "definitionsData",              type: "byteswithlength" }
        ] 
    }],
    ["ShowSystemMessage",                                           0x43, {}],
    ["POIChangeMessage",                                            0x44, {}],
    ["ClientMetrics",                                               0x45, {}],
    ["FirstTimeEvent",                                              0x46, {}],
    ["Claim",                                                       0x47, {}],
    ["ClientLog",                                                   0x48, {
        fields: [
            { name: "file",        type: "string" },
            { name: "message",        type: "string" }
        ]
    }],
    ["Ignore",                                                      0x49, {}],
    ["SnoopedPlayer",                                               0x4A, {}],
    ["Promotional",                                                 0x4B, {}],
    ["AddClientPortraitCrc",                                        0x4C, {}],
    ["ObjectiveTarget",                                             0x4D, {}],
    ["CommerceSessionRequest",                                      0x4E, {}],
    ["CommerceSessionResponse",                                     0x4F, {}],
    ["TrackedEvent",                                                0x50, {}],
    ["LoginFailed",                                                 0x51, {}],
    ["LoginToUChat",                                                0x52, {}],
    ["ZoneSafeTeleportRequest",                                     0x53, {}],
    ["RemoteInteractionRequest",                                    0x54, {}],
    ["UpdateCamera",                                                0x57, {}],
    ["Guild.Disband",                                               0x5802, {}],
    ["Guild.Rename",                                                0x5803, {}],
    ["Guild.ChangeMemberRank",                                      0x580A, {}],
    ["Guild.MotdUpdate",                                            0x580B, {}],
    ["Guild.UpdateRank",                                            0x580E, {}],
    ["Guild.DataFull",                                              0x580F, {}],
    ["Guild.Data",                                                  0x5810, {}],
    ["Guild.Invitations",                                           0x5811, {}],
    ["Guild.AddMember",                                             0x5812, {}],
    ["Guild.RemoveMember",                                          0x5813, {}],
    ["Guild.UpdateInvitation",                                      0x5814, {}],
    ["Guild.MemberOnlineStatus",                                    0x5815, {}],
    ["Guild.TagsUpdated",                                           0x5816, {}],
    ["Guild.Notification",                                          0x5817, {}],
    ["Guild.UpdateAppData",                                         0x5820, {}],
    ["Guild.RecruitingGuildsForBrowserReply",                       0x5826, {}],
    ["AdminGuild",                                                  0x59, {}],
    ["BattleMages",                                                 0x5A, {}],
    ["WorldToWorld",                                                0x5B, {}],
    ["PerformAction",                                               0x5C, {}],
    ["EncounterMatchmaking",                                        0x5D, {}],
    ["ClientLuaMetrics",                                            0x5E, {}],
    ["RepeatingActivity",                                           0x5F, {}],
    ["ClientGameSettings",                                          0x60, {
        fields: [
            { name: "unknownDword1",                type: "uint32" },
            { name: "unknownDword2",                type: "uint32" },
            { name: "unknownBoolean1",              type: "boolean" },
            { name: "unknownFloat1",                type: "float" },
            { name: "unknownDword3",                type: "uint32" },
            { name: "unknownDword4",                type: "uint32" },
            { name: "unknownDword5",                type: "uint32" },
            { name: "unknownFloat2",                type: "float" },
            { name: "unknownFloat3",                type: "float" }
        ]
    }],
    ["ClientTrialProfileUpsell",                                    0x61, {}],
    ["ActivityManager.ProfileActivityList",                         0x6201, {}],
    ["ActivityManager.JoinErrorString",                             0x6202, {}],
    ["RequestSendItemDefinitionsToClient",                          0x63, {}],
    ["Inspect",                                                     0x64, {}],
    ["Achievement.Add",                                             0x6502, {
        fields: [
            { name: "achievementId",                type: "uint32" },
            { name: "achievementData",              type: "schema", fields: objectiveDataSchema }
        ]
    }],
    ["Achievement.Initialize",                                      0x6503, {
        fields: [
            { name: "clientAchievements",           type: "array", fields: achievementDataSchema },
            { name: "achievementData",                  type: "byteswithlength", fields: [
                { name: "achievements",                 type: "array", fields: achievementDataSchema }
            ]}
        ]
    }],
    ["Achievement.Complete",                                        0x6504, {}],
    ["Achievement.ObjectiveAdded",                                  0x6505, {}],
    ["Achievement.ObjectiveActivated",                              0x6506, {}],
    ["Achievement.ObjectiveUpdate",                                 0x6507, {}],
    ["Achievement.ObjectiveComplete",                               0x6508, {}],
    ["PlayerTitle",                                                 0x66, {
        fields: [
            { name: "unknown1",                     type: "uint8" },
            { name: "titleId",                      type: "uint32" }
        ]
    }],
    ["Fotomat",                                                     0x67, {}],
    ["UpdateUserAge",                                               0x68, {}],
    ["Loot",                                                        0x69, {}],
    ["ActionBarManager",                                            0x6A, {}],
    ["ClientTrialProfileUpsellRequest",                             0x6B, {}],
    ["PlayerUpdateJump",                                            0x6C, {}],
    ["CoinStore.ItemList",                                          0x6D0100, {
        fields: [
            { name: "items",                        type: "array", fields: [
                { name: "itemId",                       type: "uint32" },
                { name: "itemData",                     type: "schema", fields: [
                    { name: "itemId2",                      type: "uint32" },
                    { name: "unknownDword1",                type: "uint32" },
                    { name: "unknownBoolean1",              type: "boolean" },
                    { name: "unknownBoolean2",              type: "boolean" }
                ]}
            ]},
            { name: "unknown1",                     type: "uint32" }
        ]
    }],
    ["CoinStore.ItemDefinitionsRequest",                            0x6D0200, {}],
    ["CoinStore.ItemDefinitionsResponse",                           0x6D0300, {}],
    ["CoinStore.SellToClientRequest",                               0x6D0400, {
        fields: [
            { name: "unknown1",         type: "uint32" },
            { name: "unknown2",         type: "uint32" },
            { name: "itemId",           type: "uint32" },
            { name: "unknown4",         type: "uint32" },
            { name: "quantity",         type: "uint32" },
            { name: "unknown6",         type: "uint32" }
        ]
    }],
    ["CoinStore.BuyFromClientRequest",                              0x6D0500, {}],
    ["CoinStore.TransactionComplete",                               0x6D0600, {
        fields: [
            { name: "unknown1",         type: "uint32" },
            { name: "unknown2",         type: "uint32" },
            { name: "unknown3",         type: "uint32" },
            { name: "unknown4",         type: "uint32" },
            { name: "unknown5",         type: "uint32" },
            { name: "unknown6",         type: "uint32" },
            { name: "unknown7",         type: "uint32" },
            { name: "unknown8",         type: "uint32" },
            { name: "timestamp",        type: "uint32" },
            { name: "unknown9",         type: "uint32" },
            { name: "itemId",           type: "uint32" },
            { name: "unknown10",        type: "uint32" },
            { name: "quantity",         type: "uint32" },
            { name: "unknown11",        type: "uint32" },
            { name: "unknown12",        type: "uint8" }
        ]
    }],
    ["CoinStore.Open",                                              0x6D0700, {}],
    ["CoinStore.ItemDynamicListUpdateRequest",                      0x6D0800, {}],
    ["CoinStore.ItemDynamicListUpdateResponse",                     0x6D0900, {}],
    ["CoinStore.MerchantList",                                      0x6D0A00, {}],
    ["CoinStore.ClearTransactionHistory",                           0x6D0B00, {}],
    ["CoinStore.BuyBackRequest",                                    0x6D0C00, {}],
    ["CoinStore.BuyBackResponse",                                   0x6D0D00, {}],
    ["CoinStore.SellToClientAndGiftRequest",                        0x6D0E00, {}],
    ["CoinStore.ReceiveGiftItem",                                   0x6D1100, {}],
    ["CoinStore.GiftTransactionComplete",                           0x6D1200, {}],
    ["InitializationParameters",                                    0x6E, {
        fields: [
            { name: "environment",     type: "string" },
            { name: "serverId",        type: "uint32" }
        ]
    }],
    ["ActivityService.Activity.ListOfActivities",                   0x6F0101, {}],
    ["ActivityService.Activity.UpdateActivityFeaturedStatus",       0x6F0105, {}],
    ["ActivityService.ScheduledActivity.ListOfActivities",          0x6F0201, {}],
    ["Mount.MountRequest",                                          0x7001, {}],
    ["Mount.MountResponse",                                         0x7002, {
        fields: [
            { name: "characterId",              type: "uint64" },
            { name: "guid",                     type: "uint64" },
            { name: "unknownDword1",            type: "uint32" },
            { name: "unknownDword2",            type: "uint32" },
            { name: "unknownDword3",            type: "uint32" },
            { name: "unknownDword4",            type: "uint32" },
            { name: "characterData",            type: "schema", fields: [
                { name: "unknownDword1",            type: "uint32" },
                { name: "unknownDword2",            type: "uint32" },
                { name: "unknownDword3",            type: "uint32" },
                { name: "characterName",            type: "string" },
                { name: "unknownString1",           type: "string" },
            ]},
            { name: "tagString",                type: "string" },
            { name: "unknownDword5",            type: "uint32" }

        ]
    }],
    ["Mount.DismountRequest",                                       0x7003, {
        fields: [
            { name: "unknownByte1",                 type: "uint8" }
        ]
    }],
    ["Mount.DismountResponse",                                      0x7004, {
        fields: [
            { name: "characterId",                  type: "uint64" },
            { name: "guid",                         type: "uint64" },
            { name: "unknownDword1",                type: "uint32" },
            { name: "unknownBoolean1",              type: "boolean" },
            { name: "unknownByte1",                 type: "uint8" }
        ]
    }],
    ["Mount.List",                                                  0x7005, {}],
    ["Mount.Spawn",                                                 0x7006, {}],
    ["Mount.Despawn",                                               0x7007, {}],
    ["Mount.SpawnByItemDefinitionId",                               0x7008, {}],
    ["Mount.OfferUpsell",                                           0x7009, {}],
    ["Mount.SeatChangeRequest",                                     0x700A, {}],
    ["Mount.SeatChangeResponse",                                    0x700B, {}],
    ["Mount.SeatSwapRequest",                                       0x700C, {}],
    ["Mount.SeatSwapResponse",                                      0x700D, {}],
    ["Mount.TypeCount",                                             0x700E, {}],
    ["ClientInitializationDetails",                                 0x71, {
        fields: [
            { name: "unknownDword1",                type: "uint32" }
        ]
    }],
    ["ClientAreaTimer",                                             0x72, {}],
    ["LoyaltyReward.GiveLoyaltyReward",                             0x7301, {}],
    ["Rating",                                                      0x74, {}],
    ["ClientActivityLaunch",                                        0x75, {}],
    ["ServerActivityLaunch",                                        0x76, {}],
    ["ClientFlashTimer",                                            0x77, {}],
    ["PlayerUpdate.UpdatePosition",                                 0x78, {
        fields: [
            { name: "unknown1",                     type: "uint32" }
        ]
    }],
    ["InviteAndStartMiniGame",                                      0x79, {}],
    ["PlayerUpdate.Flourish",                                       0x7A, {}],
    ["Quiz",                                                        0x7B, {}],
    ["PlayerUpdate.PositionOnPlatform",                             0x7C, {}],
    ["ClientMembershipVipInfo",                                     0x7D, {}],
    ["Target",                                                      0x7E, {}],
    ["GuideStone",                                                  0x7F, {}],
    ["Raid",                                                        0x80, {}],
    ["Voice.Login",                                                 0x8100, {
        fields: [
            { name: "clientName",                   type: "string" },
            { name: "sessionId",                    type: "string" },
            { name: "url",                          type: "string" },
            { name: "characterName",                type: "string" }
        ]
    }],
    ["Voice.JoinChannel",                                           0x8101, {
        fields: [
            { name: "roomType",                     type: "uint8" },
            { name: "uri",                          type: "string" },
            { name: "unknown1",                     type: "uint32" }
        ]
    }],
    ["Voice.LeaveChannel",                                          0x8102, {}],
    ["Weapon.Weapon",                                               0x8200, {
        fields: [
            { name: "weaponPacket",                         type: "custom", parser: parseWeaponPacket, packer: packWeaponPacket }
        ]
    }],
    ["Facility.ReferenceData",                                      0x8401, {
        fields: [
            { name: "data",               type: "byteswithlength" }
        ]
    }],
    ["Facility.FacilityData",                                       0x8402, {
        fields: [
            { name: "facilities",               type: "array", fields: [
                { name: "facilityId",               type: "uint32" },
                { name: "facilityType",             type: "uint8" },
                { name: "unknown2_uint8",           type: "uint8" },
                { name: "regionId",                 type: "uint32" },
                { name: "nameId",                   type: "uint32" },
                { name: "locationX",                type: "float" },
                { name: "locationY",                type: "float" },
                { name: "locationZ",                type: "float" },
                { name: "unknown3_float",           type: "float" },
                { name: "imageSetId",               type: "uint32" },
                { name: "unknown5_uint32",          type: "uint32" },
                { name: "unknown6_uint8",           type: "uint8" },
                { name: "unknown7_uint8",           type: "uint8" },
                { name: "unknown8_bytes",           type: "bytes", length: 36 }
            ]}
        ]
    }],
    ["Facility.CurrentFacilityUpdate",                              0x8403, {}],
    ["Facility.SpawnDataRequest",                                   0x8404, {}],
    ["Facility.FacilitySpawnData",                                  0x8405, {}],
    ["Facility.FacilityUpdate",                                     0x8406, {
        fn: function(data, offset) {
            var result = {},
                startOffset = offset,
                n, i, values, flags;

            result["facilityId"] = data.readUInt32LE(offset);
            flags = data.readUInt16LE(offset+4);
            result["flags"] = flags;
            offset += 6;
            if (flags & 1) {
                result["unknown1"] = data.readUInt8(offset);
                offset += 1;
            }
            if ((flags >> 1) & 1) {
                n = data.readUInt32LE(offset);
                values = [];
                for (i=0;i<n;i++) {
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
                for (i=0;i<n;i++) {
                    values[i] = data.readUInt8(offset + 4 + i);
                }
                result["unknown4"] = values;
                offset += 4 + n;
            }
            if ((flags >> 4) & 1) {
                n = data.readUInt32LE(offset);
                values = [];
                for (i=0;i<n;i++) {
                    values[i] = data.readUInt8(offset + 4 + i);
                }
                result["unknown5"] = values;
                offset += 4 + n;
            }
            if ((flags >> 5) & 1) {
                values = [];
                for (i=0;i<4;i++) {
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
                    data.readUInt32LE(offset+4)
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
                length: offset - startOffset
            };
        }
    }],
    ["Facility.FacilitySpawnStatus",                                0x8407, {}],
    ["Facility.FacilitySpawnStatusTracked",                         0x8408, {}],
    ["Facility.NotificationFacilityCaptured",                       0x8409, {}],
    ["Facility.NotificationFacilitySignificantCaptureProgress",     0x840A, {}],
    ["Facility.NotificationFacilityCloseToCapture",                 0x840B, {}],
    ["Facility.NotificationFacilitySpawnBeginCapture",              0x840C, {}],
    ["Facility.NotificationFacilitySpawnFinishCapture",             0x840D, {}],
    ["Facility.NotificationLeavingFacilityDuringContention",        0x840E, {}],
    ["Facility.ProximitySpawnCaptureUpdate",                        0x840F, {}],
    ["Facility.ClearProximitySpawn",                                0x8410, {}],
    ["Facility.GridStabilizeTimerUpdated",                          0x8411, {}],
    ["Facility.SpawnCollisionChanged",                              0x8412, {
        fields: [
            { name: "unknown1",                 type: "uint32" },
            { name: "unknown2",                 type: "boolean" },
            { name: "unknown3",                 type: "uint32" }
        ]
    }],
    ["Facility.NotificationFacilitySecondaryObjectiveEventPacket",  0x8413, {}],
    ["Facility.PenetrateShieldEffect",                              0x8414, {}],
    ["Facility.SpawnUpdateGuid",                                    0x8415, {}],
    ["Facility.FacilityUpdateRequest",                              0x8416, {}],
    ["Facility.EmpireScoreValueUpdate",                             0x8417, {}],
    ["Skill.Echo",                                                  0x8501, {}],
    ["Skill.SelectSkillSet",                                        0x8502, {}],
    ["Skill.SelectSkill",                                           0x8503, {}],
    ["Skill.GetSkillPointManager",                                  0x8504, {}],
    ["Skill.SetLoyaltyPoints",                                      0x8505, {}],
    ["Skill.LoadSkillDefinitionManager",                            0x8506, {}],
    ["Skill.SetSkillPointManager",                                  0x8507, {}],
    ["Skill.SetSkillPointProgress",                                 0x8508, {
        fields: [
            { name: "unknown1",                 type: "uint32" },
            { name: "unknown2",                 type: "float" },
            { name: "unknown3",                 type: "float" }
        ]
    }],
    ["Skill.AddSkill",                                              0x8509, {}],
    ["Skill.ReportSkillGrant",                                      0x850A, {}],
    ["Skill.ReportOfflineEarnedSkillPoints",                        0x850B, {}],
    ["Skill.ReportDeprecatedSkillLine",                             0x850C, {}],
    ["Loadout.LoadLoadoutDefinitionManager",                        0x8601, {}],
    ["Loadout.SelectLoadout",                                       0x8602, {}],
    ["Loadout.SetCurrentLoadout",                                   0x8603, {
        fields: [
            { name: "guid",                     type: "uint64" },
            { name: "loadoutId",                type: "uint32" }
        ]
    }],
    ["Loadout.SelectSlot",                                          0x8604, {
        fields: [
            { name: "type",                         type: "uint8" },
            { name: "unknownByte1",                 type: "uint8" },
            { name: "unknownByte2",                 type: "uint8" },
            { name: "loadoutSlotId",                type: "uint32" },
            { name: "gameTime",                     type: "uint32" }
        ]
    }],
    ["Loadout.SelectClientSlot",                                    0x8605, {}],
    ["Loadout.SetCurrentSlot",                                      0x8606, {
        fields: [
            { name: "type",                     type: "uint8" },
            { name: "unknownByte1",             type: "uint8" },
            { name: "slotId",                   type: "uint32" }
        ]
    }],
    ["Loadout.CreateCustomLoadout",                                 0x8607, {}],
    ["Loadout.SelectSlotItem",                                      0x8608, {}],
    ["Loadout.UnselectSlotItem",                                    0x8609, {}],
    ["Loadout.SelectSlotTintItem",                                  0x860A, {}],
    ["Loadout.UnselectSlotTintItem",                                0x860B, {}],
    ["Loadout.SelectAllSlotTintItems",                              0x860C, {}],
    ["Loadout.UnselectAllSlotTintItems",                            0x860D, {}],
    ["Loadout.SelectBodyTintItem",                                  0x860E, {}],
    ["Loadout.UnselectBodyTintItem",                                0x860F, {}],
    ["Loadout.SelectAllBodyTintItems",                              0x8610, {}],
    ["Loadout.UnselectAllBodyTintItems",                            0x8611, {}],
    ["Loadout.SelectGuildTintItem",                                 0x8612, {}],
    ["Loadout.UnselectGuildTintItem",                               0x8613, {}],
    ["Loadout.SelectDecalItem",                                     0x8614, {}],
    ["Loadout.UnselectDecalItem",                                   0x8615, {}],
    ["Loadout.SelectAttachmentItem",                                0x8616, {}],
    ["Loadout.UnselectAttachmentItem",                              0x8617, {}],
    ["Loadout.SelectCustomName",                                    0x8618, {}],
    ["Loadout.ActivateLoadoutTerminal",                             0x8619, {}],
    ["Loadout.ActivateVehicleLoadoutTerminal",                      0x861A, {
        fields: [
            { name: "type",                     type: "uint8" },
            { name: "guid",                     type: "uint64" },
        ]
    }],
    ["Loadout.SetLoadouts",                                         0x861B, {
        fields: [
            { name: "type",                     type: "uint8" },
            { name: "guid",                     type: "uint64" },
            { name: "unknownDword1",            type: "uint32" }
        ]
    }],
    ["Loadout.AddLoadout",                                          0x861C, {}],
    ["Loadout.UpdateCurrentLoadout",                                0x861D, {}],
    ["Loadout.UpdateLoadoutSlot",                                   0x861E, {}],
    ["Loadout.SetVehicleLoadouts",                                  0x861F, {}],
    ["Loadout.AddVehicleLoadout",                                   0x8620, {}],
    ["Loadout.ClearCurrentVehicleLoadout",                          0x8621, {}],
    ["Loadout.UpdateVehicleLoadoutSlot",                            0x8622, {}],
    ["Loadout.SetSlotTintItem",                                     0x8623, {}],
    ["Loadout.UnsetSlotTintItem",                                   0x8624, {}],
    ["Loadout.SetBodyTintItem",                                     0x8625, {}],
    ["Loadout.UnsetBodyTintItem",                                   0x8626, {}],
    ["Loadout.SetGuildTintItem",                                    0x8627, {}],
    ["Loadout.UnsetGuildTintItem",                                  0x8628, {}],
    ["Loadout.SetDecalItem",                                        0x8629, {}],
    ["Loadout.UnsetDecalItem",                                      0x862A, {}],
    ["Loadout.SetCustomName",                                       0x862B, {}],
    ["Loadout.UnsetCustomName",                                     0x862C, {}],
    ["Loadout.UpdateLoadoutSlotItemLineConfig",                     0x862D, {}],
    ["Experience.SetExperience",                                    0x8701, {}],
    ["Experience.SetExperienceRanks",                               0x8702, {
        fields: [
            { name: "experienceRanks",              type: "array", fields: [
                { name: "unknownDword1",                type: "uint32" },
                { name: "experienceRankData",           type: "array", fields: [
                    { name: "experienceRequired",           type: "uint32" },
                    { name: "factionRanks",                 type: "array", length: 4, fields: [
                        { name: "nameId",                       type: "uint32" },
                        { name: "unknownDword2",                type: "uint32" },
                        { name: "imageSetId",                   type: "uint32" },
                        { name: "rewards",                      type: "array", fields: [
                            { name: "itemId",                       type: "uint32" },
                            { name: "nameId",                       type: "uint32" },
                            { name: "imageSetId",                   type: "uint32" },
                            { name: "itemCountMin",                 type: "uint32" },
                            { name: "itemCountMax",                 type: "uint32" },
                            { name: "itemType",                     type: "uint32" }
                        ]}
                    ]}
                ]}
            ]}
        ]
    }],
    ["Experience.SetExperienceRateTier",                            0x8703, {
        fields: [
            { name: "unknownDword1",                type: "uint32" },
            { name: "unknownDword2",                type: "uint32" },
            { name: "unknownDword3",                type: "uint32" },
            { name: "unknownDword4",                type: "uint32" },
            { name: "unknownDword5",                type: "uint32" }
        ]
    }],
    ["Vehicle.Owner",                                               0x8801, {
        fields: [
            { name: "guid",                     type: "uint64" },
            { name: "characterId",              type: "uint64" },
            { name: "unknownDword1",            type: "uint32" },
            { name: "vehicleId",                type: "uint32" },
            { name: "passengers",               type: "array", fields: [
                { name: "passengerData",            type: "schema", fields: [
                    { name: "characterId",              type: "uint64" },
                    { name: "characterData",            type: "schema", fields: [
                        { name: "unknownDword1",            type: "uint32" },
                        { name: "unknownDword2",            type: "uint32" },
                        { name: "unknownDword3",            type: "uint32" },
                        { name: "characterName",            type: "string" },
                        { name: "unknownString1",           type: "string" },
                    ]},
                    { name: "unknownDword1",            type: "uint32" },
                    { name: "unknownString1",           type: "string" }
                ]},
                { name: "unknownByte1",             type: "uint8" }
            ]}
        ]
    }],
    ["Vehicle.Occupy",                                              0x8802, {
        fields: [
            { name: "guid",                     type: "uint64" },
            { name: "characterId",              type: "uint64" },
            { name: "vehicleId",                type: "uint32" },
            { name: "unknownDword1",            type: "uint32" },
            { name: "unknownArray1",            type: "array", fields: [
                { name: "unknownDword1",            type: "uint32" },
                { name: "unknownBoolean1",          type: "boolean" }
            ]},
            { name: "passengers",               type: "array", fields: [
                { name: "passengerData",            type: "schema", fields: [
                    { name: "characterId",              type: "uint64" },
                    { name: "characterData",            type: "schema", fields: [
                        { name: "unknownDword1",            type: "uint32" },
                        { name: "unknownDword2",            type: "uint32" },
                        { name: "unknownDword3",            type: "uint32" },
                        { name: "characterName",            type: "string" },
                        { name: "unknownString1",           type: "string" }
                    ]},
                    { name: "unknownDword1",            type: "uint32" },
                    { name: "unknownString1",           type: "string" }
                ]},
                { name: "unknownByte1",             type: "uint8" }
            ]},
            { name: "unknownArray2",            type: "array", fields: [
                { name: "unknownQword1",            type: "uint64" }
            ]},
            { name: "unknownData1",             type: "schema", fields: [
                { name: "unknownDword1",            type: "uint32" },
                { name: "unknownData1",             type: "schema", fields: [
                    { name: "unknownDword1",            type: "uint32" },
                    { name: "unknownByte1",             type: "uint8" }
                ]},
                { name: "unknownString1",           type: "string" },
                { name: "unknownDword2",            type: "uint32" },
                { name: "unknownDword3",            type: "uint32" },
                { name: "unknownDword4",            type: "uint32" },
                { name: "unknownDword5",            type: "uint32" },
                { name: "unknownArray3",            type: "array", fields: [
                    { name: "unknownDword1",            type: "uint32" },
                    { name: "unknownData1",             type: "schema", fields: [
                        { name: "unknownDword1",            type: "uint32" },
                        { name: "unknownData1",             type: "schema", fields: [
                            { name: "unknownDword1",            type: "uint32" },
                            { name: "unknownByte1",             type: "uint8" },
                            { name: "unknownArray1",            type: "array", fields: [
                                { name: "unknownDword1",            type: "uint32" }
                            ]},
                            { name: "unknownArray2",            type: "array", fields: [
                                { name: "unknownDword1",            type: "uint32" },
                                { name: "unknownDword2",            type: "uint32" }
                            ]}
                        ]},
                        { name: "unknownDword2",            type: "uint32" },
                        { name: "unknownDword3",            type: "uint32" }
                    ]}
                ]}
            ]},
            { name: "unknownBytes1",                type: "byteswithlength", defaultValue: null, fields: [
                { name: "itemData",                     type: "custom", parser: parseItemData, packer: packItemData }
            ]},
            { name: "unknownBytes2",                type: "byteswithlength", defaultValue: null }
        ]
    }],
    ["Vehicle.StateData",                                           0x8803, {
        fields: [
            { name: "guid",                     type: "uint64" },
            { name: "unknown3",                     type: "float" },
            { name: "unknown4",                     type: "array", fields: [
                { name: "unknown1",                     type: "uint32" },
                { name: "unknown2",                     type: "uint8" },
            ]},
            { name: "unknown5",                     type: "array", fields: [
                { name: "unknown1",                     type: "uint32" },
                { name: "unknown2",                     type: "uint8" },
            ]}
        ]
    }],
    ["Vehicle.StateDamage",                                         0x8804, {}],
    ["Vehicle.PlayerManager",                                       0x8805, {}],
    ["Vehicle.Spawn",                                               0x8806, {
        fields: [
            { name: "vehicleId",                type: "uint32" },
            { name: "loadoutTab",               type: "uint32" }
        ]
    }],
    ["Vehicle.Tint",                                                0x8807, {}],
    ["Vehicle.LoadVehicleTerminalDefinitionManager",                0x8808, {}],
    ["Vehicle.ActiveWeapon",                                        0x8809, {}],
    ["Vehicle.Stats",                                               0x880A, {}],
    ["Vehicle.DamageInfo",                                          0x880B, {}],
    ["Vehicle.StatUpdate",                                          0x880C, {}],
    ["Vehicle.UpdateWeapon",                                        0x880D, {}],
    ["Vehicle.RemovedFromQueue",                                    0x880E, {}],
    ["Vehicle.UpdateQueuePosition",                                 0x880F, {
        fields: [
            { name: "queuePosition",                type: "uint32" }
        ]
    }],
    ["Vehicle.PadDestroyNotify",                                    0x8810, {}],
    ["Vehicle.SetAutoDrive",                                        0x8811, {
        fields: [
            { name: "guid",                         type: "uint64" }
        ]
    }],
    ["Vehicle.LockOnInfo",                                          0x8812, {}],
    ["Vehicle.LockOnState",                                         0x8813, {}],
    ["Vehicle.TrackingState",                                       0x8814, {}],
    ["Vehicle.CounterMeasureState",                                 0x8815, {}],
    ["Vehicle.LoadVehicleDefinitionManager",                        0x8816, {
        fields: [
            { name: "vehicleDefinitions",           type: "array", fields: [
                { name: "vehicleId",                    type: "uint32" },
                { name: "modelId",                      type: "uint32" }
            ]}
        ]
    }],
    ["Vehicle.AcquireState",                                        0x8817, {}],
    ["Vehicle.Dismiss",                                             0x8818, {}],
    ["Vehicle.AutoMount",                                           0x8819, {
        fields: [
            { name: "guid",                         type: "uint64" },
            { name: "unknownBoolean1",              type: "boolean" },
            { name: "unknownDword1",                type: "uint32" }
        ]
    }],
    ["Vehicle.Deploy",                                              0x881A, {}],
    ["Vehicle.Engine",                                              0x881B, {}],
    ["Vehicle.AccessType",                                          0x881C, {}],
    ["Vehicle.KickPlayer",                                          0x881D, {}],
    ["Vehicle.HealthUpdateOwner",                                   0x881E, {}],
    ["Vehicle.OwnerPassengerList",                                  0x881F, {}],
    ["Vehicle.Kick",                                                0x8820, {}],
    ["Vehicle.NoAccess",                                            0x8821, {}],
    ["Vehicle.Expiration",                                          0x8822, {
        fields: [
            { name: "expireTime",                   type: "uint32" }
        ]
    }],
    ["Vehicle.Group",                                               0x8823, {}],
    ["Vehicle.DeployResponse",                                      0x8824, {}],
    ["Vehicle.ExitPoints",                                          0x8825, {}],
    ["Vehicle.ControllerLogOut",                                    0x8826, {}],
    ["Vehicle.CurrentMoveMode",                                     0x8827, {}],
    ["Vehicle.ItemDefinitionRequest",                               0x8828, {}],
    ["Vehicle.ItemDefinitionReply",                                 0x8829, {}],
    ["Vehicle.InventoryItems",                                      0x882A, {}],
    ["Grief",                                                       0x89, {}],
    ["SpotPlayer",                                                  0x8A, {}],
    ["Faction",                                                     0x8B, {}],
    ["Synchronization",                                             0x8C, {
        fields: [
            { name: "time1",                          type: "uint64" },
            { name: "time2",                          type: "uint64" },
            { name: "clientTime",                     type: "uint64" },
            { name: "serverTime",                     type: "uint64" },
            { name: "serverTime2",                    type: "uint64" },
            { name: "time3",                          type: "uint64" }
        ]
    }],
    ["ResourceEvent",                                               0x8D00, {
        fields: [
            { name: "gameTime",                         type: "uint32" },
            { name: "eventData",                        type: "variabletype8",
                types: {
                    1: [ // SetCharacterResources
                        { name: "characterId",         type: "uint64" },
                        { name: "unknownArray1",       type: "array", fields: [
                            { name: "unknownDword1",        type: "uint32" },
                            { name: "unknownData1",         type: "schema", fields: resourceEventDataSubSchema }
                        ]}
                    ],
                    2: [ // SetCharacterResource
                        { name: "characterId",         type: "uint64" },
                        { name: "unknownDword1",       type: "uint32" },
                        { name: "unknownDword2",       type: "uint32" },
                        { name: "unknownArray1",       type: "array", fields: [
                            { name: "unknownDword1",       type: "float" },
                            { name: "unknownDword2",       type: "float" },
                            { name: "unknownDword3",       type: "float" },
                            { name: "unknownDword4",       type: "float" }
                        ]},
                        { name: "unknownDword3",       type: "uint32" },
                        { name: "unknownDword4",       type: "uint32" },
                        { name: "unknownFloat5",       type: "float" },
                        { name: "unknownFloat6",       type: "float" },
                        { name: "unknownFloat7",       type: "float" },
                        { name: "unknownDword8",       type: "uint32" },
                        { name: "unknownDword9",       type: "uint32" },
                        { name: "unknownDword10",      type: "uint32" },

                        { name: "unknownByte1",        type: "uint8" },
                        { name: "unknownByte2",        type: "uint8" },
                        { name: "unknownGuid3",        type: "uint64" },
                        { name: "unknownGuid4",        type: "uint64" },
                        { name: "unknownGuid5",        type: "uint64" }


                    ],
                    3: [ // UpdateCharacterResource
                        { name: "characterId",         type: "uint64" },
                        { name: "unknownDword1",       type: "uint32" },
                        { name: "unknownDword2",       type: "uint32" },

                        { name: "unknownDword3",       type: "uint32" },
                        { name: "unknownDword4",       type: "uint32" },
                        { name: "unknownFloat5",       type: "float" },
                        { name: "unknownFloat6",       type: "float" },
                        { name: "unknownFloat7",       type: "float" },
                        { name: "unknownDword8",       type: "uint32" },
                        { name: "unknownDword9",       type: "uint32" },
                        { name: "unknownDword10",      type: "uint32" },

                        { name: "unknownByte1",        type: "uint8" },
                        { name: "unknownByte2",        type: "uint8" },
                        { name: "unknownGuid3",        type: "uint64" },
                        { name: "unknownGuid4",        type: "uint64" },
                        { name: "unknownGuid5",        type: "uint64" },

                        { name: "unknownBoolean",      type: "boolean" }
                    ],
                    4: [ // RemoveCharacterResource
                    ]
                } 
            },
        ]
    }],
    ["Collision.Damage",                                            0x8E01, {}],
    ["Leaderboard",                                                 0x8F, {}],
    ["PlayerUpdateManagedPosition",                                 0x90, {}],
    ["PlayerUpdateNetworkObjectComponents",                         0x91, {}],
    ["PlayerUpdateUpdateVehicleWeapon",                             0x92, {}],
    ["ProfileStats.GetPlayerProfileStats",                          0x930000, {
        fields: [
            { name: "characterId",         type: "uint64" }
        ]
    }],
    ["ProfileStats.GetZonePlayerProfileStats",                      0x930100, {}],
    ["ProfileStats.PlayerProfileStats",                             0x930200, {
        fields: [
            { name: "unknownData1",             type: "schema", fields: [
                { name: "unknownData1",             type: "schema", fields: profileStatsSubSchema1 },
                { name: "unknownDword1",            type: "uint32" },
                { name: "unknownArray1",            type: "array", elementType: "uint32" },
                { name: "unknownDword2",            type: "uint32" },
                { name: "characterName",            type: "string" },
                { name: "characterId",              type: "uint64" },
                { name: "battleRank",               type: "uint32" },
                { name: "unknownDword4",            type: "uint32" },
                { name: "unknownDword6",            type: "uint32" },
                { name: "unknownDword7",            type: "uint32" },
                { name: "unknownByte1",             type: "uint8" },
                { name: "unknownArray2",            type: "array", elementType: "uint32" },
                { name: "unknownDword8",            type: "uint32" },
                { name: "unknownDword9",            type: "uint32" },
                { name: "unknownDword10",           type: "uint32" },
                { name: "unknownDword11",           type: "uint32" },
                { name: "unknownDword12",           type: "uint32" },
                { name: "unknownArray3",            type: "array", elementType: "uint32" },
                { name: "unknownDword13",           type: "uint32" },
                { name: "unknownArray4",            type: "array", elementType: "uint32" },
                { name: "unknownArray5",            type: "array", length: 10, fields: [
                    { name: "unknownDword1",            type: "uint32" },
                    { name: "unknownArray1",            type: "array", elementType: "uint32" },
                    { name: "unknownArray2",            type: "array", elementType: "uint32" },
                    { name: "unknownArray3",            type: "array", elementType: "uint32" }
                ]},
            ]},
            { name: "weaponStats1",                 type: "array", fields: weaponStatsDataSchema },
            { name: "weaponStats2",                 type: "array", fields: weaponStatsDataSchema },
            { name: "vehicleStats",                 type: "array", fields: vehicleStatsDataSchema },
            { name: "facilityStats1",               type: "array", fields: facilityStatsDataSchema },
            { name: "facilityStats2",               type: "array", fields: facilityStatsDataSchema }
        ]
    }],
    ["ProfileStats.ZonePlayerProfileStats",                             0x930300, {}],
    ["ProfileStats.UpdatePlayerLeaderboards",                           0x930400, {}],
    ["ProfileStats.UpdatePlayerLeaderboardsReply",                      0x930500, {}],
    ["ProfileStats.GetLeaderboard",                                     0x930600, {}],
    ["ProfileStats.Leaderboard",                                        0x930700, {}],
    ["ProfileStats.GetZoneCharacterStats",                              0x930800, {}],
    ["ProfileStats.ZoneCharacterStats",                                 0x930900, {}],
    ["Equipment.SetCharacterEquipment",                                 0x9401, {
        fields: [
            { name: "profileId",                    type: "uint32" },
            { name: "characterId",                  type: "uint64" },
            { name: "unknownDword1",                type: "uint32" },
            { name: "unknownString1",               type: "string" },
            { name: "unknownString2",               type: "string" },
            { name: "equipmentSlots",               type: "array", fields: [
                { name: "equipmentSlotId",              type: "uint32" },
                { name: "equipmentSlotData",            type: "schema", fields: [
                    { name: "equipmentSlotId",              type: "uint32" },
                    { name: "guid",                         type: "uint64" },
                    { name: "unknownString1",               type: "string" },
                    { name: "unknownString2",               type: "string" }
                ]}
            ]},
            { name: "attachmentData",               type: "array", fields: [
                { name: "modelName",                    type: "string" },
                { name: "unknownString1",               type: "string" },
                { name: "tintAlias",                    type: "string" },
                { name: "unknownString2",               type: "string" },
                { name: "unknownDword1",                type: "uint32" },
                { name: "unknownDword2",                type: "uint32" },
                { name: "slotId",                       type: "uint32" }
            ]}
        ]
    }],
    ["Equipment.SetCharacterEquipmentSlot",                         0x9402, {}],
    ["Equipment.UnsetCharacterEquipmentSlot",                       0x9403, {}],
    ["Equipment.SetCharacterEquipmentSlots",                        0x9404, {
        fields: [
            { name: "profileId",         type: "uint32" },
            { name: "characterId",         type: "uint64" },
            { name: "gameTime",         type: "uint32" },
            { name: "slots",         type: "array",     fields: [
                { name: "index",                    type: "uint32" },
                { name: "slotId",                   type: "uint32" },
            ]},
            { name: "unknown1",         type: "uint32" },
            { name: "unknown2",         type: "uint32" },
            { name: "unknown3",         type: "uint32" },
            { name: "textures",         type: "array",     fields: [
                { name: "index",                    type: "uint32" },
                { name: "slotId",                   type: "uint32" },
                { name: "itemId",                   type: "uint32" },
                { name: "unknown1",                 type: "uint32" },
                { name: "textureAlias",             type: "string" },
                { name: "unknown2",             type: "string" }
            ]},
            { name: "models",         type: "array",     fields: [
                { name: "modelName",             type: "string" },
                { name: "unknown1",             type: "string" },
                { name: "textureAlias",             type: "string" },
                { name: "unknown3",             type: "string" },
                { name: "unknown4",             type: "uint32" },
                { name: "unknown5",             type: "uint32" },
                { name: "slotId",             type: "uint32" }
            ]}
        ]
    }],
    ["DefinitionFilter.ListDefinitionVariables",                         0x9501, {}],
    ["DefinitionFilter.SetDefinitionVariable",                           0x9502, {
        fields: [
            { name: "unknownDword1",                type: "uint32" },
            { name: "unknownQword1",                type: "uint64" },
            { name: "unknownData1",                 type: "schema", fields: [
                { name: "unknownFloat1",                type: "float" },
                { name: "unknownFloat2",                type: "float" }
            ]}
        ]
    }],
    ["DefinitionFilter.SetDefinitionIntSet",                             0x9503, {
        fields: [
            { name: "unknownDword1",                type: "uint32" },
            { name: "unknownQword1",                type: "uint64" },
            { name: "unknownData1",                 type: "array", fields: [
                { name: "unknownDword1",                type: "uint32" },
                { name: "unknownDword2",                type: "uint32" }
            ]}
        ]
    }],
    ["DefinitionFilter.UnknownWithVariable1",                            0x9504, {
        fields: [
            { name: "unknownDword1",                type: "uint32" },
            { name: "unknownQword1",                type: "uint64" }
        ]
    }],
    ["DefinitionFilter.UnknownWithVariable2",                            0x9505, {
        fields: [
            { name: "unknownDword1",                type: "uint32" },
            { name: "unknownQword1",                type: "uint64" }
        ]
    }],
    ["ContinentBattleInfo",                                             0x96, {
        fields: [
            { name: "zones",         type: "array",     fields: [
                { name: "id",                       type: "uint32" },
                { name: "nameId",                   type: "uint32" },
                { name: "descriptionId",            type: "uint32" },
                { name: "population",               type: "array", elementType: "uint8" },
                { name: "regionPercent",            type: "array", elementType: "uint8" },
                { name: "populationBuff",           type: "array", elementType: "uint8" },
                { name: "populationTargetPercent",  type: "array", elementType: "uint8" },
                { name: "name",                     type: "string" },
                { name: "hexSize",                  type: "float" },
                { name: "isProductionZone",         type: "uint8" }
            ]}
        ]
    }],
    ["GetContinentBattleInfo",                                          0x97, {
        fields: []
    }],
    ["GetRespawnLocations",                                             0x98, {
        fields: []
    }],
    ["WallOfData.PlayerKeyboard",                                       0x9903, {}],
    ["WallOfData.UIEvent",                                              0x9905, {
        fields: [
            { name: "object",                       type: "string" },
            { name: "function",                     type: "string" },
            { name: "argument",                     type: "string" }
        ]
    }],
    ["WallOfData.ClientSystemInfo",                                     0x9906, {}],
    ["WallOfData.VoiceChatEvent",                                       0x9907, {}],
    ["WallOfData.NudgeEvent",                                           0x9909, {}],
    ["WallOfData.LaunchPadFingerprint",                                 0x990A, {}],
    ["WallOfData.VideoCapture",                                         0x990B, {}],
    ["WallOfData.ClientTransition",                                     0x990C, {
        fields: [
            { name: "oldState",                     type: "uint32" },
            { name: "newState",                     type: "uint32" },
            { name: "msElapsed",                    type: "uint32" }
        ]
    }],
    ["ThrustPad.Data",                                              0x9A01, {}],
    ["ThrustPad.Update",                                            0x9A02, {}],
    ["ThrustPad.PlayerEntered",                                     0x9A03, {}],
    ["Implant.SelectImplant",                                       0x9B01, {}],
    ["Implant.UnselectImplant",                                     0x9B02, {}],
    ["Implant.LoadImplantDefinitionManager",                        0x9B03, {}],
    ["Implant.SetImplants",                                         0x9B04, {}],
    ["Implant.UpdateImplantSlot",                                   0x9B05, {}],
    ["ClientInGamePurchase",                                        0x9C, {}],
    ["Missions.ListMissions",                                        0x9D01, {}],
    ["Missions.ConquerZone",                                         0x9D02, {}],
    ["Missions.SelectMission",                                       0x9D03, {}],
    ["Missions.UnselectMission",                                     0x9D04, {}],
    ["Missions.SetMissionInstanceManager",                           0x9D05, {}],
    ["Missions.SetMissionManager",                                   0x9D06, {}],
    ["Missions.AddGlobalAvailableMission",                           0x9D07, {}],
    ["Missions.RemoveGlobalAvailableMission",                        0x9D08, {}],
    ["Missions.AddAvailableMission",                                 0x9D09, {}],
    ["Missions.RemoveAvailableMission",                              0x9D0A, {}],
    ["Missions.AddActiveMission",                                    0x9D0B, {}],
    ["Missions.RemoveActiveMission",                                 0x9D0C, {}],
    ["Missions.ReportCompletedMission",                              0x9D0D, {}],
    ["Missions.AddAvailableMissions",                                0x9D0E, {}],
    ["Missions.SetMissionChangeList",                                0x9D0F, {}],
    ["Missions.SetConqueredZone",                                    0x9D10, {}],
    ["Missions.UnsetConqueredZone",                                  0x9D11, {}],
    ["Missions.SetConqueredZones",                                   0x9D12, {}],
    ["Effect.AddEffect",                                            0x9E01, {
        fields: [
            { name: "unknownData1",             type: "schema", fields: [
                { name: "unknownDword1",            type: "uint32" },
                { name: "unknownDword2",            type: "uint32" },
                { name: "unknownDword3",            type: "uint32" }
            ]},
            { name: "unknownData2",             type: "schema", fields: [
                { name: "unknownQword1",            type: "uint64" },
                { name: "unknownQword2",            type: "uint64" }
            ]},
            { name: "unknownData3",             type: "schema", fields: [
                { name: "unknownQword1",            type: "uint64" },
                { name: "unknownQword2",            type: "uint64" },
                { name: "unknownVector1",           type: "floatvector4" }
            ]}
        ]
    }],
    ["Effect.UpdateEffect",                                         0x9E02, {
        fields: [
            { name: "unknownData1",             type: "schema", fields: [
                { name: "unknownDword1",            type: "uint32" },
                { name: "unknownDword2",            type: "uint32" },
                { name: "unknownDword3",            type: "uint32" }
            ]},
            { name: "unknownData2",             type: "schema", fields: [
                { name: "unknownDword1",            type: "uint32" },
                { name: "unknownQword1",            type: "uint64" }
            ]},
            { name: "unknownData3",             type: "schema", fields: [
                { name: "unknownQword1",            type: "uint64" },
                { name: "unknownQword2",            type: "uint64" },
                { name: "unknownVector1",           type: "floatvector4" }
            ]}
        ]
    }],
    ["Effect.RemoveEffect",                                         0x9E03, {
        fields: [
            { name: "unknownData1",             type: "schema", fields: [
                { name: "unknownDword1",            type: "uint32" },
                { name: "unknownDword2",            type: "uint32" },
                { name: "unknownDword3",            type: "uint32" }
            ]},
            { name: "unknownData2",             type: "schema", fields: [
                { name: "unknownQword1",            type: "uint64" }
            ]},
            { name: "unknownData3",             type: "schema", fields: [
                { name: "unknownQword1",            type: "uint64" },
                { name: "unknownQword2",            type: "uint64" },
                { name: "unknownVector1",           type: "floatvector4" }
            ]}
        ]
    }],
    ["Effect.AddEffectTag",                                         0x9E04, {
        fields: effectTagDataSchema
    }],
    ["Effect.RemoveEffectTag",                                      0x9E05, {
        fields: [
            { name: "unknownData1",             type: "schema", fields: [
                { name: "unknownQword1",            type: "uint64" }
            ]},
            { name: "unknownData2",             type: "schema", fields: [
                { name: "unknownDword1",            type: "uint32" },
                { name: "unknownQword1",            type: "uint64" },
                { name: "unknownQword2",            type: "uint64" }
            ]}
        ]
    }],
    ["Effect.TargetBlockedEffect",                                  0x9E06, {
        fields: [
            { name: "unknownData1",             type: "schema", fields: [
                { name: "unknownQword1",            type: "uint64" }
            ]}
        ]
    }],
    ["RewardBuffs.ReceivedBundlePacket",                            0x9F01, {}],
    ["RewardBuffs.NonBundledItem",                                  0x9F02, {}],
    ["RewardBuffs.AddBonus",                                        0x9F03, {}],
    ["RewardBuffs.RemoveBonus",                                     0x9F04, {}],
    ["RewardBuffs.GiveRewardToPlayer",                              0x9F05, {}],
    ["Abilities.InitAbility",                                       0xA001, {}],
    ["Abilities.UpdateAbility",                                     0xA002, {}],
    ["Abilities.UninitAbility",                                     0xA003, {}],
    ["Abilities.SetAbilityActivationManager",                       0xA004, {}],
    ["Abilities.SetActivatableAbilityManager",                      0xA005, {
        fields: [
            { name: "unknownArray1",                    type: "array", fields: [
                { name: "unknownQword1",                    type: "uint64" },
                { name: "unknownData1",                     type: "schema", fields: [
                    { name: "unknownQword1",                    type: "uint64" },
                    { name: "unknownDword1",                    type: "uint32" },
                    { name: "unknownDword2",                    type: "uint32" }
                ]},
                { name: "unknownDword1",                    type: "uint32" },
                { name: "unknownByte1",                     type: "uint8" }
            ]}
        ]
    }],
    ["Abilities.SetVehicleActivatableAbilityManager",               0xA006, {}],
    ["Abilities.SetAbilityTimerManager",                            0xA007, {}],
    ["Abilities.AddAbilityTimer",                                   0xA008, {}],
    ["Abilities.RemoveAbilityTimer",                                0xA009, {}],
    ["Abilities.UpdateAbilityTimer",                                0xA00A, {}],
    ["Abilities.SetAbilityLockTimer",                               0xA00B, {}],
    ["Abilities.ActivateAbility",                                   0xA00C, {}],
    ["Abilities.VehicleActivateAbility",                            0xA00D, {}],
    ["Abilities.DeactivateAbility",                                 0xA00E, {}],
    ["Abilities.VehicleDeactivateAbility",                          0xA00F, {}],
    ["Abilities.ActivateAbilityFailed",                             0xA010, {}],
    ["Abilities.VehicleActivateAbilityFailed",                      0xA011, {}],
    ["Abilities.ClearAbilityLineManager",                           0xA012, {}],
    ["Abilities.SetAbilityLineManager",                             0xA013, {}],
    ["Abilities.SetProfileAbilityLineMembers",                      0xA014, {}],
    ["Abilities.SetProfileAbilityLineMember",                       0xA015, {}],
    ["Abilities.RemoveProfileAbilityLineMember",                    0xA016, {}],
    ["Abilities.SetVehicleAbilityLineMembers",                      0xA017, {}],
    ["Abilities.SetVehicleAbilityLineMember",                       0xA018, {}],
    ["Abilities.RemoveVehicleAbilityLineMember",                    0xA019, {}],
    ["Abilities.SetFacilityAbilityLineMembers",                     0xA01A, {}],
    ["Abilities.SetFacilityAbilityLineMember",                      0xA01B, {}],
    ["Abilities.RemoveFacilityAbilityLineMember",                   0xA01C, {}],
    ["Abilities.SetEmpireAbilityLineMembers",                       0xA01D, {}],
    ["Abilities.SetEmpireAbilityLineMember",                        0xA01E, {}],
    ["Abilities.RemoveEmpireAbilityLineMember",                     0xA01F, {}],
    ["Abilities.SetLoadoutAbilities",                               0xA020, {
        fields: [
            { name: "abilities",                    type: "array", fields: [
                { name: "abilitySlotId",                type: "uint32" },
                { name: "abilityData",                  type: "schema", fields: [
                    { name: "abilitySlotId",                type: "uint32" },
                    { name: "abilityId",                    type: "uint32" },
                    { name: "unknownDword1",                type: "uint32" },
                    { name: "guid1",                        type: "uint64" },
                    { name: "guid2",                        type: "uint64" }
                ]}
            ]}
        ]
    }],
    ["Abilities.AddLoadoutAbility",                                 0xA021, {}],
    ["Abilities.RemoveLoadoutAbility",                              0xA022, {}],
    ["Abilities.SetImplantAbilities",                               0xA023, {}],
    ["Abilities.AddImplantAbility",                                 0xA024, {}],
    ["Abilities.RemoveImplantAbility",                              0xA025, {}],
    ["Abilities.SetPersistentAbilities",                            0xA026, {}],
    ["Abilities.AddPersistentAbility",                              0xA027, {}],
    ["Abilities.RemovePersistentAbility",                           0xA028, {}],
    ["Abilities.SetProfileRankAbilities",                           0xA029, {}],
    ["Abilities.AddProfileRankAbility",                             0xA02A, {}],
    ["Abilities.RemoveProfileRankAbility",                          0xA02B, {}],
    ["Deployable.Place",                                            0xA101, {}],
    ["Deployable.Remove",                                           0xA102, {}],
    ["Deployable.Pickup",                                           0xA103, {}],
    ["Deployable.ActionResponse",                                   0xA104, {}],
    ["Security",                                                    0xA2, {
        fields: [
            { name: "code",                         type: "uint32" }
        ]
    }],
    ["MapRegion.GlobalData",                                        0xA301, {
        fields: [
            { name: "unknown1",         type: "float" },
            { name: "unknown2",         type: "float" }
        ]
    }],
    ["MapRegion.Data",                                              0xA302, {
        fields: [
            { name: "unknown1",         type: "float" },
            { name: "unknown2",         type: "uint32" },
            { name: "regions",          type: "array", fields: [
                { name: "regionId",                     type: "uint32" },
                { name: "regionId2",                    type: "uint32" },
                { name: "nameId",                       type: "uint32" },
                { name: "facilityId",                   type: "uint32" },
                { name: "facilityType",                 type: "uint8" },
                { name: "currencyId",                   type: "uint8" },
                { name: "ownerFactionId",               type: "uint8" },
                { name: "hexes",                        type: "array", fields: [
                    { name: "x",                    type: "int32" },
                    { name: "y",                    type: "int32" },
                    { name: "type",                 type: "uint32" }
                ]},
                { name: "flags",                        type: "uint8" },
                { name: "unknown4",                     type: "array", elementType: "uint8" },
                { name: "unknown5",                     type: "array", elementType: "uint8" },
                { name: "unknown6",                     type: "array", elementType: "uint8" },
                { name: "connectionFacilityId",         type: "uint32" }
            ]}
        ]
    }],
    ["MapRegion.ExternalData",                                      0xA303, {}],
    ["MapRegion.Update",                                            0xA304, {}],
    ["MapRegion.UpdateAll",                                         0xA305, {}],
    ["MapRegion.MapOutOfBounds",                                    0xA306, {
        fields: [
            { name: "characterId",                  type: "uint64" },
            { name: "unknownDword1",                type: "uint32" },
            { name: "unknownByte2",                 type: "uint8" }
        ]
    }],
    ["MapRegion.Population",                                        0xA307, {}],
    ["MapRegion.RequestContinentData",                              0xA308, {
        fields: [
            { name: "zoneId",                       type: "uint32" }
        ]
    }],
    ["MapRegion.InfoRequest",                                       0xA309, {}],
    ["MapRegion.InfoReply",                                         0xA30A, {}],
    ["MapRegion.ExternalFacilityData",                              0xA30B, {}],
    ["MapRegion.ExternalFacilityUpdate",                            0xA30C, {}],
    ["MapRegion.ExternalFacilityUpdateAll",                         0xA30D, {}],
    ["MapRegion.ExternalFacilityEmpireScoreUpdate",                 0xA30E, {}],
    ["MapRegion.NextTick",                                          0xA30F, {}],
    ["MapRegion.HexActivityUpdate",                                 0xA310, {}],
    ["MapRegion.ConquerFactionUpdate",                              0xA311, {}],
    ["Hud",                                                         0xA4, {}],
    ["ClientPcData.SetSpeechPack",                                  0xA501, {}],
    ["ClientPcData.SpeechPackList",                                 0xA503, {
        fields: [
            { name: "speechPacks",          type: "array", fields: [
                { name: "speechPackId",                     type: "uint32" }
            ]}
        ]
    }],
    ["AcquireTimer",                                                0xA6, {}],
    ["PlayerUpdateGuildTag",                                        0xA7, {}],
    ["Warpgate.ActivateTerminal",                                   0xA801, {}],
    ["Warpgate.ZoneRequest",                                        0xA802, {}],
    ["Warpgate.PostQueueNotify",                                    0xA803, {}],
    ["Warpgate.QueueForZone",                                       0xA804, {}],
    ["Warpgate.CancelQueue",                                        0xA805, {}],
    ["Warpgate.WarpToQueuedZone",                                   0xA806, {}],
    ["Warpgate.WarpToSocialZone",                                   0xA807, {}],
    ["LoginQueueStatus",                                            0xA9, {}],
    ["ServerPopulationInfo",                                        0xAA, {
        fields: [
            { name: "population",           type: "array", elementType: "uint16" },
            { name: "populationPercent",    type: "array", elementType: "uint8" },
            { name: "populationBuff",       type: "array", elementType: "uint8" }
        ]
    }],
    ["GetServerPopulationInfo",                                     0xAB, {
        fields: []
    }],
    ["PlayerUpdate.VehicleCollision",                               0xAC, {}],
    ["PlayerUpdate.Stop",                                           0xAD, {
        fields: [
            { name: "unknownUint",       type: "custom", parser: readUnsignedIntWith2bitLengthValue, packer: packUnsignedIntWith2bitLengthValue }
        ]
    }],
    ["Currency.SetCurrencyDiscount",                                0xAE01, {
        fields: [
            { name: "currencyId",           type: "uint32" },
            { name: "discount",             type: "float" }
        ]
    }],
    ["Currency.SetCurrencyRateTier",                                0xAE02, {}],
    ["Items.LoadItemRentalDefinitionManager",                       0xAF01, {}],
    ["Items.SetItemTimerManager",                                   0xAF02, {}],
    ["Items.SetItemLockTimer",                                      0xAF03, {}],
    ["Items.SetItemTimers",                                         0xAF04, {}],
    ["Items.SetItemTrialLockTimer",                                 0xAF05, {}],
    ["Items.SetItemTrialTimers",                                    0xAF06, {}],
    ["Items.AddItemTrialTimer",                                     0xAF07, {}],
    ["Items.RemoveItemTrialTimer",                                  0xAF08, {}],
    ["Items.ExpireItemTrialTimer",                                  0xAF09, {}],
    ["Items.UpdateItemTrialTimer",                                  0xAF0A, {}],
    ["Items.SetItemRentalTimers",                                   0xAF0B, {}],
    ["Items.AddItemRentalTimer",                                    0xAF0C, {}],
    ["Items.RemoveItemRentalTimer",                                 0xAF0D, {}],
    ["Items.ExpireItemRentalTimer",                                 0xAF0E, {}],
    ["Items.SetAccountItemManager",                                 0xAF0F, {}],
    ["Items.AddAccountItem",                                        0xAF10, {}],
    ["Items.RemoveAccountItem",                                     0xAF11, {}],
    ["Items.UpdateAccountItem",                                     0xAF12, {}],
    ["Items.RequestAddItemTimer",                                   0xAF13, {}],
    ["Items.RequestTrialItem",                                      0xAF14, {}],
    ["Items.RequestRentalItem",                                     0xAF15, {}],
    ["Items.RequestUseItem",                                        0xAF16, {}],
    ["Items.RequestUseAccountItem",                                 0xAF17, {}],
    
    ["PlayerUpdate.AttachObject",                                   0xB0, {}],
    ["PlayerUpdate.DetachObject",                                   0xB1, {}],
    ["ClientSettings",                                              0xB2, {
        fields: [
            { name: "helpUrl",         type: "string" },
            { name: "shopUrl",         type: "string" },
            { name: "shop2Url",        type: "string" }
        ]
    }],
    ["RewardBuffInfo",                                              0xB3, {
        fields: [
            { name: "unknownFloat1",            type: "float" },
            { name: "unknownFloat2",            type: "float" },
            { name: "unknownFloat3",            type: "float" },
            { name: "unknownFloat4",            type: "float" },
            { name: "unknownFloat5",            type: "float" },
            { name: "unknownFloat6",            type: "float" },
            { name: "unknownFloat7",            type: "float" },
            { name: "unknownFloat8",            type: "float" },
            { name: "unknownFloat9",            type: "float" },
            { name: "unknownFloat10",           type: "float" },
            { name: "unknownFloat11",           type: "float" },
            { name: "unknownFloat12",           type: "float" }
        ]
    }],
    ["GetRewardBuffInfo",                                           0xB4, {
        fields: []
    }],
    ["Cais",                                                        0xB5, {}],
    ["ZoneSetting.Data",                                            0xB601, {
        fields: [
            { name: "settings",                     type: "array",  fields: [
                { name: "hash",                         type: "uint32" },
                { name: "unknown1",                     type: "uint32", defaultValue: 0 },
                { name: "unknown2",                     type: "uint32", defaultValue: 0 },
                { name: "value",                        type: "uint32" },
                { name: "settingType",                  type: "uint32" }
            ]}
        ]
    }],
    ["RequestPromoEligibilityUpdate",                               0xB7, {}],
    ["PromoEligibilityReply",                                       0xB8, {}],
    ["MetaGameEvent.StartWarning",                                  0xB901, {}],
    ["MetaGameEvent.Start",                                         0xB902, {}],
    ["MetaGameEvent.Update",                                        0xB903, {}],
    ["MetaGameEvent.CompleteDominating",                            0xB904, {}],
    ["MetaGameEvent.CompleteStandard",                              0xB905, {}],
    ["MetaGameEvent.CompleteCancel",                                0xB906, {}],
    ["MetaGameEvent.ExperienceBonusUpdate",                         0xB907, {}],
    ["MetaGameEvent.ClearExperienceBonus",                          0xB908, {}],
    ["RequestWalletTopupUpdate",                                    0xBA, {}],
    ["RequestStationCashActivePromoUpdate",                         0xBB, {}],
    ["CharacterSlot",                                               0xBC, {}],
    ["Operation.RequestCreate",                                     0xBF01, {}],
    ["Operation.RequestDestroy",                                    0xBF02, {}],
    ["Operation.RequestJoin",                                       0xBF03, {}],
    ["Operation.RequestJoinByName",                                 0xBF04, {}],
    ["Operation.RequestLeave",                                      0xBF05, {}],
    ["Operation.ClientJoined",                                      0xBF06, {}],
    ["Operation.ClientLeft",                                        0xBF07, {}],
    ["Operation.BecomeListener",                                    0xBF08, {}],
    ["Operation.AvailableData",                                     0xBF09, {}],
    ["Operation.Created",                                           0xBF0A, {}],
    ["Operation.Destroyed",                                         0xBF0B, {}],
    ["Operation.ClientClearMissions",                               0xBF0C, {
        fields: []
    }],
    ["Operation.InstanceAreaUpdate",                                0xBF0D, {}],
    ["Operation.ClientInArea",                                      0xBF0E, {}],
    ["Operation.InstanceLocationUpdate",                            0xBF0F, {}],
    ["Operation.GroupOperationListRequest",                         0xBF10, {}],
    ["Operation.GroupOperationListReply",                           0xBF11, {}],
    ["Operation.GroupOperationSelect",                              0xBF12, {}],
    ["WordFilter.Data",                                             0xC001, {
        fields: [
            { name: "wordFilterData",       type: "byteswithlength" }
        ]
    }],
    ["StaticFacilityInfo.Request",                                  0xC101, {}],
    ["StaticFacilityInfo.Reply",                                    0xC102, {}],
    ["StaticFacilityInfo.AllZones",                                 0xC103, {
        fields: [
            { name: "facilities",           type: "array",  fields: [
                { name: "zoneId",               type: "uint32" },
                { name: "facilityId",           type: "uint32" },
                { name: "nameId",               type: "uint32" },
                { name: "facilityType",         type: "uint8" },
                { name: "locationX",            type: "float" },
                { name: "locationY",            type: "float" },
                { name: "locationZ",            type: "float" }
            ]}
        ]
    }],
    ["StaticFacilityInfo.ReplyWarpgate",                            0xC104, {}],
    ["StaticFacilityInfo.AllWarpgateRespawns",                      0xC105, {}],
    ["ProxiedPlayer",                                               0xC2, {}],
    ["Resist",                                                      0xC3, {}],
    ["InGamePurchasing",                                            0xC4, {}],
    ["BusinessEnvironments",                                        0xC5, {}],
    ["EmpireScore",                                                 0xC6, {}],
    ["CharacterSelectSessionRequest",                               0xC7, {
        fields: []
    }],
    ["CharacterSelectSessionResponse",                              0xC8, {
        fields: [
            { name: "status",               type: "uint8" },
            { name: "sessionId",            type: "string" }
        ]
    }],
    ["Stats",                                                       0xC9, {}],
    ["Resource",                                                    0xCA, {}],
    ["Construction",                                                0xCC, {}],
    ["SkyChanged",                                                  0xCD, {}],
    ["NavGen",                                                      0xCE, {}],
    ["Locks",                                                       0xCF, {}],
    ["Ragdoll",                                                     0xD0, {}]
];


var packetTypes = {},
    packetDescriptors = {};

PacketTable.build(packets, packetTypes, packetDescriptors);

exports.PacketTypes = packetTypes;
exports.Packets = packetDescriptors;
