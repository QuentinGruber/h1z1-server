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
    { name: "unknownString3",   type: "string" },
    { name: "position",         type: "floatvector3" },
    { name: "unknownVector1",   type: "floatvector4" },
    { name: "rotation",         type: "floatvector4" },
    { name: "unknownDword7",    type: "uint32" },
    { name: "unknownFloat1",    type: "float" },
    { name: "unknownString4",   type: "string" },
    { name: "unknownString5",   type: "string" },
    { name: "unknownString6",   type: "string" },
    { name: "vehicleId",        type: "uint32" },
    { name: "unknownDword9",    type: "uint32" },
    { name: "npcDefinitionId",  type: "uint32" },
    { name: "unknownByte2",     type: "uint8" },
    { name: "profileId",        type: "uint32" },
    { name: "unknownBoolean1",  type: "boolean" },
    { name: "unknownData1",     type: "schema", fields: [
        { name: "unknownByte1",     type: "uint8" },
        { name: "unknownByte2",     type: "uint8" },
        { name: "unknownByte3",     type: "uint8" }
    ]},
    { name: "unknownByte6",     type: "uint8" },
    { name: "unknownDword11",   type: "uint32" },
    { name: "unknownGuid1",     type: "uint64" },
    { name: "unknownData2",     type: "schema", fields: [
        { name: "unknownGuid1",     type: "uint64" }
    ]},
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
    ["Weapon.FireStateUpdate",                                      0x8501, {
        fields: [
            { name: "guid",                         type: "uint64" },
            { name: "unknownByte1",                 type: "uint8" },
            { name: "unknownByte2",                 type: "uint8" }
        ]
    }],
    ["Weapon.FireStateTargetedUpdate",                              0x8502, {}],
    ["Weapon.Fire",                                                 0x8503, {
        fields: [
            { name: "guid",                         type: "uint64" },
            { name: "position",                     type: "floatvector3" },
            { name: "unknownDword1",                type: "uint32" },
            { name: "unknownDword2",                type: "uint32" },
            { name: "unknownDword3",                type: "uint32" }
        ]
    }],
    ["Weapon.FireWithDefinitionMapping",                            0x8504, {}],
    ["Weapon.FireNoProjectile",                                     0x8505, {}],
    ["Weapon.ProjectileHitReport",                                  0x8506, {}],
    ["Weapon.ReloadRequest",                                        0x8507, {
        fields: [
            { name: "guid",                         type: "uint64" }
        ]
    }],
    ["Weapon.Reload",                                               0x8508, {}],
    ["Weapon.ReloadInterrupt",                                      0x8509, {}],
    ["Weapon.ReloadComplete",                                       0x850A, {}],
    ["Weapon.AddAmmo",                                              0x850B, {
        fields: [
            { name: "guid",                         type: "uint64" },
            { name: "unknownByte1",                 type: "uint8" },
            { name: "unknownDword1",                type: "uint32" },
            { name: "unknownBoolean1",              type: "boolean" },
            { name: "unknownBoolean2",              type: "boolean" }
        ]
    }],
    ["Weapon.SetAmmo",                                              0x850C, {}],
    ["Weapon.SwitchFireModeRequest",                                0x850D, {
        fields: [
            { name: "guid",                         type: "uint64" },
            { name: "unknownByte1",                 type: "uint8" },
            { name: "unknownByte2",                 type: "uint8" },
            { name: "unknownByte3",                 type: "uint8" }
        ]
    }],
    ["Weapon.LockOnGuidUpdate",                                     0x850E, {}],
    ["Weapon.LockOnLocationUpdate",                                 0x850F, {}],
    ["Weapon.MeleeSlash",                                           0x8510, {}],
    ["Weapon.MeleeStabStart",                                       0x8511, {}],
    ["Weapon.MeleeStabFinish",                                      0x8512, {}],
    ["Weapon.StatUpdate",                                           0x8513, {
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
    ["Weapon.DebugProjectile",                                      0x8514, {}],
    ["Weapon.AddFireGroup",                                         0x8515, {}],
    ["Weapon.RemoveFireGroup",                                      0x8516, {}],
    ["Weapon.ReplaceFireGroup",                                     0x8517, {}],
    ["Weapon.GuidedUpdate",                                         0x8518, {}],
    ["Weapon.RemoteWeapon.Reset",                                   0x851901, {}],
    ["Weapon.RemoteWeapon.AddWeapon",                               0x851902, {}],
    ["Weapon.RemoteWeapon.RemoveWeapon",                            0x851903, {}],
    ["Weapon.RemoteWeapon.Update",                                  0x851904, {
        fields: [
            { name: "unknownUint1",                 type: "custom", parser: readUnsignedIntWith2bitLengthValue, packer: packUnsignedIntWith2bitLengthValue },
            { name: "unknownByte1",                 type: "uint8" },
            { name: "unknownQword1",                type: "uint64" },
            { name: "unknownByte2",                 type: "uint8" },
            { name: "unknownUint2",                 type: "custom", parser: readUnsignedIntWith2bitLengthValue, packer: packUnsignedIntWith2bitLengthValue }
        ]
    }],
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
    ["Weapon.RemoteWeapon.MeleeSlash",                              0x851905, {}],
    ["Weapon.RemoteWeapon.MeleeStabStart",                          0x851906, {}],
    ["Weapon.RemoteWeapon.MeleeStabFinish",                         0x851907, {}],
    ["Weapon.RemoteWeapon.QuickUse",                                0x851908, {}],
    ["Weapon.RemoteWeapon.ProjectileLaunchHint",                    0x851909, {}],
    ["Weapon.RemoteWeapon.ProjectileDetonateHint",                  0x85190A, {}],
    ["Weapon.RemoteWeapon.ProjectileRemoteContactReport",           0x85190B, {}],
    ["Weapon.ChamberRound",                                         0x851A, {}],
    ["Weapon.QuickUse",                                             0x851B, {}],
    ["Weapon.GuidedSetNonSeeking",                                  0x851C, {}],
    ["Weapon.ChamberInterrupt",                                     0x851D, {}],
    ["Weapon.GuidedExplode",                                        0x851E, {}],
    ["Weapon.DestroyNpcProjectile",                                 0x851F, {}],
    ["Weapon.WeaponToggleEffects",                                  0x8520, {}],
    ["Weapon.Reset",                                                0x8521, {
        fields: [
            { name: "unknownQword1",                type: "uint64" },
            { name: "unknownBoolean1",              type: "boolean" },
            { name: "unknownByte1",                 type: "uint8" }
        ]
    }],
    ["Weapon.ProjectileSpawnNpc",                                   0x8522, {}],
    ["Weapon.FireRejected",                                         0x8523, {}],
    ["Weapon.MultiWeapon",                                          0x8524, {
        fields: [
            { name: "packets",                      type: "custom", parser: parseMultiWeaponPacket, packer: packMultiWeaponPacket }
        ]
    }],
    ["Weapon.WeaponFireHint",                                       0x8525, {}],
    ["Weapon.ProjectileContactReport",                              0x8526, {}]
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
    { name: "unknownTime3",         type: "uint64" }
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
    { name: "unknownBoolean1",              type: "boolean" },
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
    ["Command.ShowDialog",                              0x090100, {}],
    ["Command.EndDialog",                               0x090200, {}],
    ["Command.StartDialog",                             0x090300, {}],
    ["Command.PlayerPlaySpeech",                        0x090400, {}],
    ["Command.DialogResponse",                          0x090500, {}],
    ["Command.PlaySoundAtLocation",                     0x090600, {}],
    ["Command.InteractRequest",                         0x090700, {
        fields: [
            { name: "guid",                 type: "uint64" }
        ]
    }],
    ["Command.InteractCancel",                          0x090800, {        fields: []
    }],
    ["Command.InteractionList",                         0x090900, {
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
    ["Command.InteractionSelect",                       0x090A00, {
        fields: [
            { name: "guid",                 type: "uint64" },
            { name: "interactionId",        type: "uint32" }
        ]
    }],
    ["Command.InteractionStartWheel",                   0x090B00, {}],
    ["Command.StartFlashGame",                          0x090C00, {}],
    ["Command.SetProfile",                              0x090D00, {
        fields: [
            { name: "profileId",            type: "uint32" },
            { name: "tab",                  type: "uint32" }
        ]
    }],
    ["Command.AddFriendRequest",                        0x090E00, {}],
    ["Command.RemoveFriendRequest",                     0x090F00, {}],
    ["Command.ConfirmFriendRequest",                    0x091000, {}],
    ["Command.ConfirmFriendResponse",                   0x091100, {}],
    ["Command.SetChatBubbleColor",                      0x091200, {}],
    ["Command.PlayerSelect",                            0x091300, {
        fields: [
            { name: "characterId",              type: "uint64" },
            { name: "guid",                 type: "uint64" }
        ]
    }],
    ["Command.FreeInteractionNpc",                      0x091400, {
        fields: []
    }],
    ["Command.FriendsPositionRequest",                  0x091500, {}],
    ["Command.MoveAndInteract",                         0x091600, {}],
    ["Command.QuestAbandon",                            0x091700, {}],
    ["Command.RecipeStart",                             0x091800, {}],
    ["Command.ShowRecipeWindow",                        0x091900, {}],
    ["Command.ActivateProfileFailed",                   0x091A00, {}],
    ["Command.PlayDialogEffect",                        0x091B00, {}],
    ["Command.ForceClearDialog",                        0x091C00, {}],
    ["Command.IgnoreRequest",                           0x091D00, {}],
    ["Command.SetActiveVehicleGuid",                    0x091E00, {}],
    ["Command.ChatChannelOn",                           0x091F00, {}],
    ["Command.ChatChannelOff",                          0x092000, {}],
    ["Command.RequestPlayerPositions",                  0x092100, {}],
    ["Command.RequestPlayerPositionsReply",             0x092200, {}],
    ["Command.SetProfileByItemDefinitionId",            0x092300, {}],
    ["Command.RequestRewardPreviewUpdate",              0x092400, {}],
    ["Command.RequestRewardPreviewUpdateReply",         0x092500, {}],
    ["Command.PlaySoundIdOnTarget",                     0x092600, {}],
    ["Command.RequestPlayIntroEncounter",               0x092700, {}],
    ["Command.SpotPlayer",                              0x092800, {}],
    ["Command.SpotPlayerReply",                         0x092900, {}],
    ["Command.SpotPrimaryTarget",                       0x092A00, {}],
    ["Command.InteractionString",                       0x092B00, {
        fields: [
            { name: "guid",                 type: "uint64" },
            { name: "stringId",             type: "uint32" },
            { name: "unknown4",             type: "uint32" }
        ]
    }],
    ["Command.GiveCurrency",                            0x092C00, {}],
    ["Command.HoldBreath",                              0x092D00, {}],
    ["Command.ChargeCollision",                         0x092E00, {}],
    ["Command.DebrisLaunch",                            0x092F00, {}],
    ["Command.Suicide",                                 0x093000, {}],
    ["Command.RequestHelp",                             0x093100, {}],
    ["Command.OfferHelp",                               0x093200, {}],
    ["Command.Redeploy",                                0x093300, {}],
    ["Command.PlayersInRadius",                         0x093400, {}],
    ["Command.AFK",                                     0x093500, {}],
    ["Command.ReportPlayerReply",                       0x093600, {}],
    ["Command.ReportPlayerCheckNameRequest",            0x093700, {}],
    ["Command.ReportPlayerCheckNameReply",              0x093800, {}],
    ["Command.ReportRendererDump",                      0x093900, {}],
    ["Command.ChangeName",                              0x093A00, {}],
    ["Command.NameValidation",                          0x093B00, {}],
    ["Command.PlayerFileDistribution",                  0x093C00, {}],
    ["Command.ZoneFileDistribution",                    0x093D00, {}],
    ["Command.AddWorldCommand",                         0x093E00, {
        fields: [
            { name: "command",                  type: "string" }
        ]
    }],
    ["Command.AddZoneCommand",                                      0x093F00, {
        fields: [
            { name: "command",                  type: "string" }
        ]
    }],
    ["Command.ExecuteCommand",                                      0x094000, {
        fields: [
            { name: "commandHash",              type: "uint32" },
            { name: "arguments",                type: "string" }
        ]
    }],
    ["Command.ZoneExecuteCommand",                                  0x094100, {}],
    ["Command.RequestStripEffect",                                  0x094200, {}],
    ["Command.ItemDefinitionRequest",                               0x094300, {}],
    ["Command.ItemDefinitionReply",                                 0x094400, {}],
    ["Command.ItemDefinitions",                                     0x094500, {
        fields: [
            { name: "data",                     type: "custom", parser: parseItemDefinitions, packer: packItemDefinitions }
        ]
    }],
    ["Command.EnableCompositeEffects",                              0x094600, {
        fields: [
            { name: "enabled",                  type: "boolean" }
        ]
    }],
    ["Command.StartRentalUpsell",                       0x094700, {}],
    ["Command.SafeEject",                               0x094800, {}],
    ["Command.WeaponFireStateUpdate",                   0x094900, {
        fields: [
            { name: "characterId",                  type: "uint64" }
        ]
    }],
    ["Command.ForceBlacklist",                                      0x094A00, {}],
    ["Command.ValidateDataForZoneOwnedTiles",                       0x0946B0, {}],
    ["Command.AddItem",                                             0x09EA03, {}],
    ["Command.DeleteItem",                                          0x093EB0, {}],
    ["Command.AbilityReply",                                        0x093EC0, {}],
    ["Command.AbilityList",                                         0x093ED0, {}],
    ["Command.AbilityAdd",                                          0x093EE0, {}],
    ["Command.ServerInformation",                                   0x093EF0, {}],
    ["AdminCommand.RunSpeed",                                       0x09C404, {
        fields: [
            { name: "runSpeed",                     type: "float" }
        ]
    }],
    ["AdminCommand.SpawnVehicle",                                   0x099904, {
        fields: [
            { name: "vehicleId",                    type: "uint32" },
            { name: "factionId",                    type: "uint8" },
            { name: "position",                     type: "floatvector3" },
            { name: "heading",                      type: "float" },
            { name: "unknownDword1",                type: "uint32" },
            { name: "autoMount",                    type: "boolean" }
        ]
    }],
    ["ClientBeginZoning",                               0x0B, {}],
    ["Combat.AutoAttackTarget",                         0x0C01, {}],
    ["Combat.AutoAttackOff",                            0x0C02, {}],
    ["Combat.SingleAttackTarget",                       0x0C03, {}],
    ["Combat.AttackTargetDamage",                       0x0C04, {}],
    ["Combat.AttackAttackerMissed",                     0x0C05, {}],
    ["Combat.AttackTargetDodged",                       0x0C06, {}],
    ["Combat.AttackProcessed",                          0x0C07, {}],
    ["Combat.EnableBossDisplay",                        0x0C09, {}],
    ["Combat.AttackTargetBlocked",                      0x0C0A, {}],
    ["Combat.AttackTargetParried",                      0x0C0B, {}],
    ["Mail",                                            0x0E, {}],
    ["PlayerUpdate.None",                               0x0F00, {}],
    ["PlayerUpdate.RemovePlayer",                       0x0F010000, {
        fields: [
            { name: "guid",       type: "uint64" }
        ]
    }],
    ["PlayerUpdate.RemovePlayerGracefully",             0x0F010100, {
        fields: [
            { name: "guid",             type: "uint64" },
            { name: "unknown5",         type: "boolean" },
            { name: "unknown6",         type: "uint32" },
            { name: "unknown7",         type: "uint32" },
            { name: "unknown8",         type: "uint32" },
            { name: "unknown9",         type: "uint32" },
            { name: "unknown10",        type: "uint32" }
        ]
    }],
    ["PlayerUpdate.Knockback",                          0x0F02, {}],
    ["PlayerUpdate.UpdateHitpoints",                    0x0F03, {}],
    ["PlayerUpdate.SetAnimation",                       0x0F04, {}],
    ["PlayerUpdate.AddNotifications",                   0x0F05, {}],
    ["PlayerUpdate.RemoveNotifications",                0x0F06, {}],
    ["PlayerUpdate.NpcRelevance",                       0x0F07, {
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
    ["PlayerUpdate.QueueAnimation",                     0x0F0F, {}],
    ["PlayerUpdate.ExpectedSpeed",                      0x0F10, {}],
    ["PlayerUpdate.ScriptedAnimation",                  0x0F11, {}],
    ["PlayerUpdate.ThoughtBubble",                      0x0F12, {}],
    ["PlayerUpdate.SetDisposition",                     0x0F13, {}],
    ["PlayerUpdate.LootEvent",                          0x0F14, {}],
    ["PlayerUpdate.SlotCompositeEffectOverride",        0x0F15, {}],
    ["PlayerUpdate.EffectPackage",                      0x0F16, {}],
    ["PlayerUpdate.PreferredLanguages",                 0x0F17, {}],
    ["PlayerUpdate.CustomizationChange",                0x0F18, {}],
    ["PlayerUpdate.PlayerTitle",                        0x0F19, {}],
    ["PlayerUpdate.AddEffectTagCompositeEffect",        0x0F1A, {}],
    ["PlayerUpdate.RemoveEffectTagCompositeEffect",     0x0F1B, {}],
    ["PlayerUpdate.SetSpawnAnimation",                  0x0F1C, {}],
    ["PlayerUpdate.CustomizeNpc",                       0x0F1D, {}],
    ["PlayerUpdate.SetSpawnerActivationEffect",         0x0F1E, {}],
    ["PlayerUpdate.SetComboState",                      0x0F1F, {}],
    ["PlayerUpdate.SetSurpriseState",                   0x0F20, {}],
    ["PlayerUpdate.RemoveNpcCustomization",             0x0F21, {}],
    ["PlayerUpdate.ReplaceBaseModel",                   0x0F22, {}],
    ["PlayerUpdate.SetCollidable",                      0x0F23, {}],
    ["PlayerUpdate.UpdateOwner",                        0x0F24, {}],
    ["PlayerUpdate.UpdateTintAlias",                    0x0F25, {}],
    ["PlayerUpdate.MoveOnRail",                         0x0F26, {}],
    ["PlayerUpdate.ClearMovementRail",                  0x0F27, {}],
    ["PlayerUpdate.MoveOnRelativeRail",                 0x0F28, {}],
    ["PlayerUpdate.Destroyed",                          0x0F29, {
        fields: [
            { name: "guid",                 type: "uint64" },
            { name: "unknown1",             type: "uint32" },
            { name: "unknown2",             type: "uint32" },
            { name: "unknown3",             type: "uint32" },
            { name: "unknown4",             type: "uint8" }
        ]
    }],
    ["PlayerUpdate.SeekTarget",                         0x0F2A, {}],
    ["PlayerUpdate.SeekTargetUpdate",                   0x0F2B, {}],
    ["PlayerUpdate.UpdateActiveWieldType",              0x0F2C, {
        fields: [
            { name: "characterId",          type: "uint64" },
            { name: "unknownDword1",        type: "uint32" }
        ]
    }],
    ["PlayerUpdate.LaunchProjectile",                   0x0F2D, {}],
    ["PlayerUpdate.SetSynchronizedAnimations",          0x0F2E, {}],
    ["PlayerUpdate.HudMessage",                         0x0F2F, {}],
    ["PlayerUpdate.CustomizationData",                  0x0F30, {
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
    ["PlayerUpdate.MemberStatus",                       0x0F31, {}],
    ["PlayerUpdate.SetCurrentAdventure",                0x0F32, {}],
    ["PlayerUpdate.StartHarvest",                       0x0F33, {}],
    ["PlayerUpdate.StopHarvest",                        0x0F34, {}],
    ["PlayerUpdate.KnockedOut",                         0x0F35, {
        fields: [
            { name: "guid",      type: "uint64" }
        ]
    }],
    ["PlayerUpdate.KnockedOutDamageReport",             0x0F36, {}],
    ["PlayerUpdate.Respawn",                            0x0F37, {
        fields: [
            { name: "respawnType",              type: "uint8" },
            { name: "respawnGuid",              type: "uint64" },
            { name: "profileId",                type: "uint32" },
            { name: "profileId2",               type: "uint32" }
        ]
    }],
    ["PlayerUpdate.RespawnReply",                       0x0F38, {
        fields: [
            { name: "characterId",              type: "uint64" },
            { name: "status",                   type: "boolean" }
        ]
    }],
    ["PlayerUpdate.ReadyToReviveResponse",              0x0F39, {}],
    ["PlayerUpdate.ActivateProfile",                    0x0F3A, {}],
    ["PlayerUpdate.SetSpotted",                         0x0F3B, {}],
    ["PlayerUpdate.Jet",                                0x0F3C, {
        fields: [
            { name: "characterId",              type: "uint64" },
            { name: "state",                    type: "uint8" }
        ]
    }],
    ["PlayerUpdate.Turbo",                              0x0F3D, {}],
    ["PlayerUpdate.StartRevive",                        0x0F3E, {}],
    ["PlayerUpdate.StopRevive",                         0x0F3F, {}],
    ["PlayerUpdate.ReadyToRevive",                      0x0F40, {}],
    ["PlayerUpdate.SetFaction",                         0x0F41, {
        fields: [
            { name: "guid",                     type: "uint64" },
            { name: "factionId",                type: "uint8" }
        ]
    }],
    ["PlayerUpdate.SetBattleRank",                      0x0F42, {
        fields: [
            { name: "characterId",          type: "uint64" },
            { name: "battleRank",           type: "uint32" }
        ]
    }],
    ["PlayerUpdate.StartHeal",                          0x0F43, {}],
    ["PlayerUpdate.StopHeal",                           0x0F44, {}],
    ["PlayerUpdate.Currency",                           0x0F45, {}],
    ["PlayerUpdate.RewardCurrency",                     0x0F46, {}],
    ["PlayerUpdate.ManagedObject",                      0x0F47, {
        fields: [
            { name: "guid",                     type: "uint64" },
            { name: "guid2",                    type: "uint64" },
            { name: "characterId",              type: "uint64" }
        ]
    }],
    ["PlayerUpdate.MaterialTypeOverride",               0x0F48, {}],
    ["PlayerUpdate.DebrisLaunch",                       0x0F49, {}],
    ["PlayerUpdate.HideCorpse",                         0x0F4A, {}],
    ["PlayerUpdate.CharacterStateDelta",                0x0F4B, {
        fields: [
            { name: "guid1",                        type: "uint64" },
            { name: "guid2",                        type: "uint64" },
            { name: "guid3",                        type: "uint64" },
            { name: "guid4",                        type: "uint64" },
            { name: "gameTime",                     type: "uint32" }
        ]
    }],
    ["PlayerUpdate.UpdateStat",                         0x0F4C, {}],
    ["PlayerUpdate.AnimationRequest",                   0x0F4D, {}],
    ["PlayerUpdate.NonPriorityCharacters",              0x0F4E, {}],
    ["PlayerUpdate.PlayWorldCompositeEffect",           0x0F4F, {}],
    ["PlayerUpdate.AFK",                                0x0F50, {}],
    ["PlayerUpdate.AddLightweightPc",                   0x0F51, {
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
    ["PlayerUpdate.AddLightweightNpc",                  0x0F52, { 
        fields: lightWeightNpcSchema
    }],
    ["PlayerUpdate.AddLightweightVehicle",                          0x0F53, {
        fields: [
            { name: "npcData",                      type: "schema", fields: lightWeightNpcSchema },
            { name: "unknownGuid1",                 type: "uint64" },
            { name: "unknownDword1",                type: "uint32" },
            { name: "unknownDword2",                type: "uint32" },
            { name: "positionUpdate",               type: "custom", parser: readPositionUpdateData, packer: packPositionUpdateData },
            { name: "unknownString1",               type: "string" }
        ]
    }],
    ["PlayerUpdate.AddProxiedObject",                   0x0F54, {}],
    ["PlayerUpdate.LightweightToFullPc",                0x0F55, {}],
    ["PlayerUpdate.LightweightToFullNpc",               0x0F56, {
        fields: fullNpcDataSchema
    }],
    ["PlayerUpdate.LightweightToFullVehicle",           0x0F57, {
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
    ["PlayerUpdate.FullCharacterDataRequest",           0x0F58, {
        fields: [
            { name: "guid",        type: "uint64" }
        ]
    }],
    ["PlayerUpdate.InitiateNameChange",                 0x0F59, {}],
    ["PlayerUpdate.NameChangeResult",                   0x0F5A, {}],
    ["PlayerUpdate.NameValidationResult",               0x0F5B, {}],
    ["PlayerUpdate.Deploy",                             0x0F5C, {}],
    ["PlayerUpdate.LowAmmoUpdate",                      0x0F5D, {}],
    ["PlayerUpdate.EnterCache",                         0x0F5E, {}],
    ["PlayerUpdate.ExitCache",                          0x0F5F, {}],
    ["Ability.ClientRequestStartAbility",               0x1001, {}],
    ["Ability.ClientRequestStopAbility",                0x1002, {}],
    ["Ability.ClientMoveAndCast",                       0x1003, {}],
    ["Ability.Failed",                                  0x1004, {}],
    ["Ability.StartCasting",                            0x1005, {}],
    ["Ability.Launch",                                  0x1006, {}],
    ["Ability.Land",                                    0x1007, {}],
    ["Ability.StartChanneling",                         0x1008, {}],
    ["Ability.StopCasting",                             0x1009, {}],
    ["Ability.StopAura",                                0x100A, {}],
    ["Ability.MeleeRefresh",                            0x100B, {}],
    ["Ability.AbilityDetails",                          0x100C, {}],
    ["Ability.PurchaseAbility",                         0x100D, {}],
    ["Ability.UpdateAbilityExperience",                 0x100E, {}],
    ["Ability.SetDefinition",                           0x100F, {}],
    ["Ability.RequestAbilityDefinition",                0x1010, {}],
    ["Ability.AddAbilityDefinition",                    0x1011, {}],
    ["Ability.PulseLocationTargeting",                  0x1012, {}],
    ["Ability.ReceivePulseLocation",                    0x1013, {}],
    ["Ability.ActivateItemAbility",                     0x1014, {}],
    ["Ability.ActivateVehicleAbility",                  0x1015, {}],
    ["Ability.DeactivateItemAbility",                   0x1016, {}],
    ["Ability.DeactivateVehicleAbility",                0x1017, {}],
    ["ClientUpdate.Hitpoints",                          0x110100, {}],
    ["ClientUpdate.ItemAdd",                            0x110200, {
        fields: [
            { name: "itemAddData",                  type: "custom", parser: parseItemAddData, packer: packItemAddData }
        ]
    }],
    ["ClientUpdate.ItemUpdate",                         0x110300, {}],
    ["ClientUpdate.ItemDelete",                         0x110400, {}],
    ["ClientUpdate.AddItems",                           0x110500, {}],
    ["ClientUpdate.RemoveItems",                        0x110600, {
        fields: [
            { name: "itemData",                     type: "byteswithlength", fields: [
                { name: "items",                        type: "array", fields: [
                    { name: "guid",                         type: "uint64" }
                ]}
            ]}
        ]
    }],
    ["ClientUpdate.UpdateStat",                         0x110700, {
        fields: [
            { name: "stats",                        type: "array", fields: statDataSchema }
        ]
    }],
    ["ClientUpdate.CollectionStart",                                0x110800, {}],
    ["ClientUpdate.CollectionRemove",                               0x110900, {}],
    ["ClientUpdate.CollectionAddEntry",                             0x110A00, {}],
    ["ClientUpdate.CollectionRemoveEntry",                          0x110B00, {}],
    ["ClientUpdate.UpdateLocation",                                 0x110C00, {}],
    ["ClientUpdate.Mana",                                           0x110D00, {}],
    ["ClientUpdate.UpdateProfileExperience",                        0x110E00, {}],
    ["ClientUpdate.AddProfileAbilitySetApl",                        0x110F00, {}],
    ["ClientUpdate.AddEffectTag",                                   0x111000, {}],
    ["ClientUpdate.RemoveEffectTag",                                0x111100, {}],
    ["ClientUpdate.UpdateProfileRank",                              0x111200, {}],
    ["ClientUpdate.CoinCount",                                      0x111300, {}],
    ["ClientUpdate.DeleteProfile",                                  0x111400, {}],
    ["ClientUpdate.ActivateProfile",                                0x111500, {
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
    ["ClientUpdate.AddAbility",                                     0x111600, {}],
    ["ClientUpdate.NotifyPlayer",                                   0x111700, {}],
    ["ClientUpdate.UpdateProfileAbilitySetApl",                     0x111800, {}],
    ["ClientUpdate.RemoveActionBars",                               0x111900, {}],
    ["ClientUpdate.UpdateActionBarSlot",                            0x111A00, {}],
    ["ClientUpdate.DoneSendingPreloadCharacters",                   0x111B00, {
        fields: [
            { name: "unknownBoolean1",              type: "uint8" }
        ]
    }],
    ["ClientUpdate.SetGrandfatheredStatus",                         0x111C00, {}],
    ["ClientUpdate.UpdateActionBarSlotUsed",                        0x111D00, {}],
    ["ClientUpdate.PhaseChange",                                    0x111E00, {}],
    ["ClientUpdate.UpdateKingdomExperience",                        0x111F00, {}],
    ["ClientUpdate.DamageInfo",                                     0x112000, {}],
    ["ClientUpdate.ZonePopulation",                                 0x112200, {
        fields: [
            // { name: "populations",                  type: "array",     elementType: "uint8" }
        ]
    }],
    ["ClientUpdate.RespawnLocations",                               0x112100, {
        // fields: [
        //     { name: "unknownFlags",                 type: "uint8" },
        //     { name: "locations",                    type: "array",  fields: respawnLocationDataSchema },
        //     { name: "unknownDword1",                type: "uint32" },
        //     { name: "unknownDword2",                type: "uint32" },
        //     { name: "locations2",                   type: "array",  fields: respawnLocationDataSchema }
        // ]
    }],
    ["ClientUpdate.ModifyMovementSpeed",            0x112300, {}],
    ["ClientUpdate.ModifyTurnRate",                 0x112400, {}],
    ["ClientUpdate.ModifyStrafeSpeed",              0x112500, {}],
    ["ClientUpdate.UpdateManagedLocation",          0x112600, {}],
    ["ClientUpdate.ScreenEffect",                   0x112700, {}],
    ["ClientUpdate.MovementVersion",                0x112800, {
        fields: [
            { name: "version",       type: "uint8" }
        ]
    }],
    ["ClientUpdate.ManagedMovementVersion",         0x112900, {
        fields: [
            { name: "version",       type: "custom", parser: readUnsignedIntWith2bitLengthValue, packer: packUnsignedIntWith2bitLengthValue }
        ]
    }],
    ["ClientUpdate.UpdateWeaponAddClips",                           0x112A00, {
        fields: [
            { name: "unknownDword1",                type: "uint32" },
            { name: "unknownByte1",                 type: "uint8" },
            { name: "unknownFloat1",                type: "float" }
        ]
    }],
    ["ClientUpdate.SpotProbation",                  0x112B00, {}],
    ["ClientUpdate.DailyRibbonCount",               0x112C00, {}],
    ["ClientUpdate.DespawnNpcUpdate",               0x112D00, {}],
    ["ClientUpdate.LoyaltyPoints",                  0x112E00, {}],
    ["ClientUpdate.Membership",                     0x112F00, {}],
    ["ClientUpdate.ResetMissionRespawnTimer",       0x113000, {}],
    ["ClientUpdate.ResetSquadDeployTimer",          0x113100, {}],
    ["ClientUpdate.Freeze",                         0x113200, {}],
    ["ClientUpdate.InGamePurchaseResult",           0x113300, {}],
    ["ClientUpdate.QuizComplete",                   0x113400, {}],
    ["ClientUpdate.AutoMountComplete",              0x113500, []],
    ["MiniGame",                                 0x12, {}],
    ["Group",                                    0x13, {}],
    ["Encounter",                                0x14, {}],
    ["Inventory",                                0x15, {}],
    ["SendZoneDetails",                                             0x16, {
        fields: [
            { name: "zoneName",                     type: "string" },
            { name: "unknownDword1",                type: "uint32" },
            { name: "unknownBoolean1",              type: "boolean" },
            { name: "unknownString2",               type: "string" },
            { name: "unknownByte3",                 type: "uint8" },
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
    ["Recipe",                                                      0x26, {}],
    ["InGamePurchase.PreviewOrderRequest",                          0x270100, {}],
    ["InGamePurchase.PreviewOrderResponse",                         0x270200, {}],
    ["InGamePurchase.PlaceOrderRequest",                            0x270300, {}],
    ["InGamePurchase.PlaceOrderResponse",                           0x270400, {}],
    ["InGamePurchase.StoreBundles",                                 0x270500, {
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
    ["InGamePurchase.StoreBundleStoreUpdate",                       0x270501, {}],
    ["InGamePurchase.StoreBundleStoreBundleUpdate",                 0x270502, {}],
    ["InGamePurchase.StoreBundleCategoryGroups",                    0x270600, {}],
    ["InGamePurchase.StoreBundleCategories",                        0x270700, {
        fields: [
            { name: "categories", type: "array", fields : [
                { name: "categoryId",               type: "uint32" },
                { name: "categoryData",             type: "schema", fields: [
                    { name: "categoryId",               type: "uint32" },
                    { name: "unknownDword1",            type: "uint32" },
                    { name: "name",                     type: "string" },
                    { name: "unknownDword2",            type: "uint32" },
                    { name: "unknownDword3",            type: "uint32" },
                    { name: "unknownDword4",            type: "uint32" },
                    { name: "unknownBoolean1",          type: "boolean" },
                    { name: "unknownDword5",            type: "uint32" }
                ]}
            ]}
        ]
    }],
    ["InGamePurchase.ExclusivePartnerStoreBundles",       0x270800, {}],
    ["InGamePurchase.StoreBundleGroups",                  0x270900, {}],
    ["InGamePurchase.WalletInfoRequest",                  0x270A00, {}],
    ["InGamePurchase.WalletInfoResponse",                 0x270B00, {
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
    ["InGamePurchase.ServerStatusRequest",                0x270C00, {}],
    ["InGamePurchase.ServerStatusResponse",               0x270D00, {}],
    ["InGamePurchase.StationCashProductsRequest",         0x270E00, {}],
    ["InGamePurchase.StationCashProductsResponse",        0x270F00, {}],
    ["InGamePurchase.CurrencyCodesRequest",               0x271000, {}],
    ["InGamePurchase.CurrencyCodesResponse",              0x271100, {}],
    ["InGamePurchase.StateCodesRequest",                  0x271200, {}],
    ["InGamePurchase.StateCodesResponse",                 0x271300, {}],
    ["InGamePurchase.CountryCodesRequest",                0x271400, {}],
    ["InGamePurchase.CountryCodesResponse",               0x271500, {}],
    ["InGamePurchase.SubscriptionProductsRequest",        0x271600, {}],
    ["InGamePurchase.SubscriptionProductsResponse",       0x271700, {}],
    ["InGamePurchase.EnableMarketplace",                  0x271800, {
        fields: [
            { name: "unknownBoolean1",     type: "boolean" },
            { name: "unknownBoolean2",     type: "boolean" }
        ]
    }],
    ["InGamePurchase.AcccountInfoRequest",                0x271900, {
        fields: [
            { name: "locale",     type: "string" }
        ]
    }],
    ["InGamePurchase.AcccountInfoResponse",               0x271A00, {}],
    ["InGamePurchase.StoreBundleContentRequest",          0x271B00, {}],
    ["InGamePurchase.StoreBundleContentResponse",         0x271C00, {}],
    ["InGamePurchase.ClientStatistics",                   0x271D00, {}],
    ["InGamePurchase.SendMannequinStoreBundlesToClient",  0x271E00, {}],
    ["InGamePurchase.DisplayMannequinStoreBundles",       0x271F00, {}],
    ["InGamePurchase.ItemOfTheDay",                       0x272000, {
        fields: [
            { name: "bundleId",     type: "uint32" }
        ]
    }],
    ["InGamePurchase.EnablePaymentSources",               0x272100, {}],
    ["InGamePurchase.SetMembershipFreeItemInfo",          0x272200, {}],
    ["InGamePurchase.WishListAddBundle",                  0x272300, {}],
    ["InGamePurchase.WishListRemoveBundle",               0x272400, {}],
    ["InGamePurchase.PlaceOrderRequestClientTicket",      0x272500, {}],
    ["InGamePurchase.GiftOrderNotification",              0x272600, {}],
    ["InGamePurchase.ActiveSchedules",                    0x272700, {
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
    ["Friend.Status",                                      0x2D09, {} ],
    ["Friend.Rename",                                      0x2D0A, {} ],
    ["Broadcast",                                0x2E, {}],
    ["ClientKickedFromServer",                       0x2F, {}],
    ["UpdateClientSessionData",                      0x30, {
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
    ["BugSubmission",                            0x31, {}],
    ["WorldDisplayInfo",                             0x32, {
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
    ["UpdateCamera",                                                0x55, {}],
    ["Housing",                                                     0x56, {}],
    ["Guild.Disband",                                               0x5702, {}],
    ["Guild.Rename",                                                0x5703, {}],
    ["Guild.ChangeMemberRank",                                      0x570A, {}],
    ["Guild.MotdUpdate",                                            0x570B, {}],
    ["Guild.UpdateRank",                                            0x570E, {}],
    ["Guild.DataFull",                                              0x570F, {}],
    ["Guild.Data",                                                  0x5710, {}],
    ["Guild.Invitations",                                           0x5711, {}],
    ["Guild.AddMember",                                             0x5712, {}],
    ["Guild.RemoveMember",                                          0x5713, {}],
    ["Guild.UpdateInvitation",                                      0x5714, {}],
    ["Guild.MemberOnlineStatus",                                    0x5715, {}],
    ["Guild.TagsUpdated",                                           0x5716, {}],
    ["Guild.Notification",                                          0x5717, {}],
    ["Guild.UpdateAppData",                                         0x5720, {}],
    ["Guild.RecruitingGuildsForBrowserReply",                       0x5726, {}],
    ["Broker",                                                      0x58, {}],
    ["GuildAdmin",                                                  0x59, {}],
    ["AdminBroker",                                                 0x5A, {}],
    ["BattleMages",                                                 0x5B, {}],
    ["WorldToWorld",                                                0x5C, {}],
    ["PerformAction",                                               0x5D, {}],
    ["EncounterMatchmaking",                                        0x5E, {}],
    ["ClientLuaMetrics",                                            0x5F, {}],
    ["RepeatingActivity",                                           0x60, {}],
    ["ClientGameSettings",                                          0x61, {
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
    ["ClientTrialProfileUpsell",                                    0x62, {}],
    ["ActivityManager.ProfileList",                                 0x6301, {}],
    ["ActivityManager.JoinError",                                   0x6302, {}],
    ["RequestSendItemDefinitionsToClient",                          0x64, {}],
    ["Inspect",                                                     0x65, {}],
    ["Achievement.Add",                                             0x6602, {
        fields: [
            { name: "achievementId",                type: "uint32" },
            { name: "achievementData",              type: "schema", fields: objectiveDataSchema }
        ]
    }],
    ["Achievement.Initialize",                                      0x6603, {
        fields: [
            { name: "clientAchievements",           type: "array", fields: achievementDataSchema },
            { name: "achievementData",                  type: "byteswithlength", fields: [
                { name: "achievements",                 type: "array", fields: achievementDataSchema }
            ]}
        ]
    }],
    ["Achievement.Complete",                                        0x6604, {}],
    ["Achievement.ObjectiveAdded",                                  0x6605, {}],
    ["Achievement.ObjectiveActivated",                              0x6606, {}],
    ["Achievement.ObjectiveUpdate",                                 0x6607, {}],
    ["Achievement.ObjectiveComplete",                               0x6608, {}],
    ["PlayerTitle",                                                 0x67, {
        fields: [
            { name: "unknown1",                     type: "uint8" },
            { name: "titleId",                      type: "uint32" }
        ]
    }],
    ["Fotomat",                                                     0x68, {}],
    ["UpdateUserAge",                                               0x69, {}],
    ["Loot",                                                        0x6A, {}],
    ["ActionBarManager",                                            0x6B, {}],
    ["ClientTrialProfileUpsellRequest",                             0x6C, {}],
    ["AdminSocialProfile",                                          0x6D, {}],
    ["SocialProfile",                                               0x6E, {}],
    ["PlayerUpdateJump",                                            0x6F, {}],
    ["CoinStore.ItemList",                                          0x700100, {
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
    ["CoinStore.ItemDefinitionsRequest",                            0x700200, {}],
    ["CoinStore.ItemDefinitionsResponse",                           0x700300, {}],
    ["CoinStore.SellToClientRequest",                               0x700400, {
        fields: [
            { name: "unknown1",         type: "uint32" },
            { name: "unknown2",         type: "uint32" },
            { name: "itemId",           type: "uint32" },
            { name: "unknown4",         type: "uint32" },
            { name: "quantity",         type: "uint32" },
            { name: "unknown6",         type: "uint32" }
        ]
    }],
    ["CoinStore.BuyFromClientRequest",                              0x700500, {}],
    ["CoinStore.TransactionComplete",                               0x700600, {
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
    ["CoinStore.Open",                                              0x700700, {}],
    ["CoinStore.ItemDynamicListUpdateRequest",                      0x700800, {}],
    ["CoinStore.ItemDynamicListUpdateResponse",                     0x700900, {}],
    ["CoinStore.MerchantList",                                      0x700A00, {}],
    ["CoinStore.ClearTransactionHistory",                           0x700B00, {}],
    ["CoinStore.BuyBackRequest",                                    0x700C00, {}],
    ["CoinStore.BuyBackResponse",                                   0x700D00, {}],
    ["CoinStore.SellToClientAndGiftRequest",                        0x700E00, {}],
    ["CoinStore.ReceiveGiftItem",                                   0x701100, {}],
    ["CoinStore.GiftTransactionComplete",                           0x701200, {}],
    ["InitializationParameters",                                    0x71, {
        fields: [
            { name: "environment",     type: "string" },
            { name: "serverId",        type: "uint32" }
        ]
    }],
    ["ActivityService.Activity.ListOfActivities",                   0x720101, {}],
    ["ActivityService.Activity.UpdateActivityFeaturedStatus",       0x720105, {}],
    ["ActivityService.ScheduledActivity.ListOfActivities",          0x720201, {}],
    ["Mount.MountRequest",                                          0x7301, {}],
    ["Mount.MountResponse",                                         0x7302, {
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
    ["Mount.DismountRequest",                                       0x7303, {
        fields: [
            { name: "unknownByte1",                 type: "uint8" }
        ]
    }],
    ["Mount.DismountResponse",                                      0x7304, {
        fields: [
            { name: "characterId",                  type: "uint64" },
            { name: "guid",                         type: "uint64" },
            { name: "unknownDword1",                type: "uint32" },
            { name: "unknownBoolean1",              type: "boolean" },
            { name: "unknownByte1",                 type: "uint8" }
        ]
    }],
    ["Mount.List",                                                  0x7305, {}],
    ["Mount.Spawn",                                                 0x7306, {}],
    ["Mount.Despawn",                                               0x7307, {}],
    ["Mount.SpawnByItemDefinitionId",                               0x7308, {}],
    ["Mount.OfferUpsell",                                           0x7309, {}],
    ["Mount.SeatChangeRequest",                                     0x730A, {}],
    ["Mount.SeatChangeResponse",                                    0x730B, {}],
    ["Mount.SeatSwapRequest",                                       0x730C, {}],
    ["Mount.SeatSwapResponse",                                      0x730D, {}],
    ["Mount.TypeCount",                                             0x730E, {}],
    ["ClientInitializationDetails",                                 0x74, {
        fields: [
            { name: "unknownDword1",                type: "uint32" }
        ]
    }],
    ["ClientAreaTimer",                                             0x75, {}],
    ["LoyaltyReward",                                               0x76, {}],
    ["Rating",                                                      0x77, {}],
    ["ClientActivityLaunch",                                        0x78, {}],
    ["ServerActivityLaunch",                                        0x79, {}],
    ["ClientFlashTimer",                                            0x7A, {}],
    ["InviteAndStartMiniGame",                                      0x7B, {}],
    ["PlayerUpdate.UpdatePositionZoneToClient",                     0x7C, {
        fields: [
            { name: "unknown1",                     type: "uint32" }
        ]
    }],
    ["PlayerUpdate.Flourish",                                       0x7D, {}],
    ["Quiz",                                                        0x7E, {}],
    ["PlayerUpdate.PositionOnPlatform",                             0x7F, {}],
    ["ClientMembershipVipInfo",                                     0x80, {}],
    ["Target",                                                      0x81, {}],
    ["GuideStone",                                                  0x82, {}],
    ["Raid",                                                        0x83, {}],
    ["Voice.Login",                                                 0x8400, {
        fields: [
            { name: "clientName",                   type: "string" },
            { name: "sessionId",                    type: "string" },
            { name: "url",                          type: "string" },
            { name: "characterName",                type: "string" }
        ]
    }],
    ["Voice.JoinChannel",                                           0x8401, {
        fields: [
            { name: "roomType",                     type: "uint8" },
            { name: "uri",                          type: "string" },
            { name: "unknown1",                     type: "uint32" }
        ]
    }],
    ["Voice.LeaveChannel",                                          0x8402, {}],
    ["Weapon.Weapon",                                               0x8500, {
        // fields: [
        //     { name: "weaponPacket",                         type: "custom", parser: parseWeaponPacket, packer: packWeaponPacket }
        // ]
    }],
    ["Facility.ReferenceData",                                      0x8701, {
        fields: [
            { name: "data",               type: "byteswithlength" }
        ]
    }],
    ["Facility.FacilityData",                                       0x8702, {
        fields: [
            { name: "unknown1_uint32",          type: "uint32" },
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
                { name: "unknown7_uint8",           type: "uint8" }
            ]}
        ]
    }],
    ["Facility.CurrentFacilityUpdate",                              0x8703, {}],
    ["Facility.SpawnDataRequest",                                   0x8704, {}],
    ["Facility.FacilitySpawnData",                                  0x8705, {}],
    ["Facility.FacilityUpdate",                                     0x8706, {
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
    ["Facility.FacilitySpawnStatus",                                0x8707, {}],
    ["Facility.FacilitySpawnStatusTracked",                         0x8708, {}],
    ["Facility.NotificationFacilityCaptured",                       0x8709, {}],
    ["Facility.NotificationFacilitySignificantCaptureProgress",     0x870A, {}],
    ["Facility.NotificationFacilityCloseToCapture",                 0x870B, {}],
    ["Facility.NotificationFacilitySpawnBeginCapture",              0x870C, {}],
    ["Facility.NotificationFacilitySpawnFinishCapture",             0x870D, {}],
    ["Facility.NotificationLeavingFacilityDuringContention",        0x870E, {}],
    ["Facility.ProximitySpawnCaptureUpdate",                        0x870F, {}],
    ["Facility.ClearProximitySpawn",                                0x8710, {}],
    ["Facility.GridStabilizeTimerUpdated",                          0x8711, {}],
    ["Facility.SpawnCollisionChanged",                              0x8712, {
        fields: [
            { name: "unknown1",                 type: "uint32" },
            { name: "unknown2",                 type: "boolean" },
            { name: "unknown3",                 type: "uint32" }
        ]
    }],
    ["Facility.NotificationFacilitySecondaryObjectiveEventPacket",  0x8713, {}],
    ["Facility.PenetrateShieldEffect",                              0x8714, {}],
    ["Facility.SpawnUpdateGuid",                                    0x8715, {}],
    ["Facility.FacilityUpdateRequest",                              0x8716, {}],
    ["Facility.EmpireScoreValueUpdate",                             0x8717, {}],
    ["Facility.FacilityTypePropertyUpdate",                         0x8718, {}],
    ["Skill.Echo",                                        0x8801, {}],
    ["Skill.SelectSkillSet",                              0x8802, {}],
    ["Skill.SelectSkill",                                 0x8803, {}],
    ["Skill.GetSkillPointManager",                        0x8804, {}],
    ["Skill.SetLoyaltyPoints",                            0x8805, {}],
    ["Skill.LoadSkillDefinitionManager",                  0x8806, {}],
    ["Skill.SetSkillPointManager",                        0x8807, {}],
    ["Skill.SetSkillPointProgress",                       0x8808, {
        fields: [
            { name: "unknown1",                 type: "uint32" },
            { name: "unknown2",                 type: "float" },
            { name: "unknown3",                 type: "float" }
        ]
    }],
    ["Skill.AddSkill",                                    0x8809, {}],
    ["Skill.ReportSkillGrant",                            0x880A, {}],
    ["Skill.ReportOfflineEarnedSkillPoints",              0x880B, {}],
    ["Skill.ReportDeprecatedSkillLine",                   0x880C, {}],
    ["Loadout.LoadLoadoutDefinitionManager",                0x8901, {}],
    ["Loadout.SelectLoadout",                               0x8902, {}],
    ["Loadout.SetCurrentLoadout",                           0x8903, {
        fields: [
            { name: "type",                     type: "uint8" },
            { name: "unknown1",                 type: "uint8" },
            { name: "loadoutId",                type: "uint32" },
            { name: "tabId",                    type: "uint32" },
            { name: "unknown2",                 type: "uint32" }
        ]
    }],
    ["Loadout.SelectSlot",                                          0x8904, {
        fields: [
            { name: "type",                         type: "uint8" },
            { name: "unknownByte1",                 type: "uint8" },
            { name: "unknownByte2",                 type: "uint8" },
            { name: "loadoutSlotId",                type: "uint32" },
            { name: "gameTime",                     type: "uint32" }
        ]
    }],
    ["Loadout.SelectClientSlot",                                    0x8905, {}],
    ["Loadout.SetCurrentSlot",                                      0x8906, {
        fields: [
            { name: "type",                     type: "uint8" },
            { name: "unknownByte1",             type: "uint8" },
            { name: "slotId",                   type: "uint32" }
        ]
    }],
    ["Loadout.CreateCustomLoadout",                         0x8907, {}],
    ["Loadout.SelectSlotItem",                              0x8908, {}],
    ["Loadout.UnselectSlotItem",                            0x8909, {}],
    ["Loadout.SelectSlotTintItem",                          0x890A, {}],
    ["Loadout.UnselectSlotTintItem",                        0x890B, {}],
    ["Loadout.SelectAllSlotTintItems",                      0x890C, {}],
    ["Loadout.UnselectAllSlotTintItems",                    0x890D, {}],
    ["Loadout.SelectBodyTintItem",                          0x890E, {}],
    ["Loadout.UnselectBodyTintItem",                        0x890F, {}],
    ["Loadout.SelectAllBodyTintItems",                      0x8910, {}],
    ["Loadout.UnselectAllBodyTintItems",                    0x8911, {}],
    ["Loadout.SelectGuildTintItem",                         0x8912, {}],
    ["Loadout.UnselectGuildTintItem",                       0x8913, {}],
    ["Loadout.SelectDecalItem",                             0x8914, {}],
    ["Loadout.UnselectDecalItem",                           0x8915, {}],
    ["Loadout.SelectAttachmentItem",                        0x8916, {}],
    ["Loadout.UnselectAttachmentItem",                      0x8917, {}],
    ["Loadout.SelectCustomName",                            0x8918, {}],
    ["Loadout.ActivateLoadoutTerminal",                     0x8919, {}],
    ["Loadout.ActivateVehicleLoadoutTerminal",              0x891A, {
        fields: [
            { name: "type",                     type: "uint8" },
            { name: "guid",                     type: "uint64" },
        ]
    }],
    ["Loadout.SetLoadouts",                             0x891B, {
        fields: [
            { name: "type",                     type: "uint8" },
            { name: "guid",                     type: "uint64" },
            { name: "unknownDword1",            type: "uint32" }
        ]
    }],
    ["Loadout.AddLoadout",                              0x891C, {}],
    ["Loadout.UpdateCurrentLoadout",                    0x891D, {}],
    ["Loadout.UpdateLoadoutSlot",                       0x891E, {}],
    ["Loadout.SetVehicleLoadouts",                      0x891F, {}],
    ["Loadout.AddVehicleLoadout",                       0x8920, {}],
    ["Loadout.ClearCurrentVehicleLoadout",              0x8921, {}],
    ["Loadout.UpdateVehicleLoadoutSlot",                0x8922, {}],
    ["Loadout.SetSlotTintItem",                         0x8923, {}],
    ["Loadout.UnsetSlotTintItem",                       0x8924, {}],
    ["Loadout.SetBodyTintItem",                         0x8925, {}],
    ["Loadout.UnsetBodyTintItem",                       0x8926, {}],
    ["Loadout.SetGuildTintItem",                        0x8927, {}],
    ["Loadout.UnsetGuildTintItem",                      0x8928, {}],
    ["Loadout.SetDecalItem",                            0x8929, {}],
    ["Loadout.UnsetDecalItem",                          0x892A, {}],
    ["Loadout.SetCustomName",                           0x892B, {}],
    ["Loadout.UnsetCustomName",                         0x892C, {}],
    ["Loadout.UpdateLoadoutSlotItemLineConfig",         0x892D, {}],
    ["Experience.SetExperience",                        0x8A01, {}],
    ["Experience.SetExperienceRanks",                   0x8A02, {
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
    ["Experience.SetExperienceRateTier",                0x8A03, {
        fields: [
            { name: "unknownDword1",                type: "uint32" },
            { name: "unknownDword2",                type: "uint32" },
            { name: "unknownDword3",                type: "uint32" },
            { name: "unknownDword4",                type: "uint32" },
            { name: "unknownDword5",                type: "uint32" }
        ]
    }],
    ["Vehicle.Owner",                                   0x8B01, {
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
    ["Vehicle.Occupy",                                  0x8B02, {
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
    ["Vehicle.StateData",                               0x8B03, {
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
    ["Vehicle.StateDamage",                                         0x8B04, {}],
    ["Vehicle.PlayerManager",                                       0x8B05, {}],
    ["Vehicle.Spawn",                                               0x8B06, {
        fields: [
            { name: "vehicleId",                type: "uint32" },
            { name: "loadoutTab",               type: "uint32" }
        ]
    }],
    ["Vehicle.Tint",                                                0x8B07, {}],
    ["Vehicle.LoadVehicleTerminalDefinitionManager",                0x8B08, {}],
    ["Vehicle.ActiveWeapon",                                        0x8B09, {}],
    ["Vehicle.Stats",                                               0x8B0A, {}],
    ["Vehicle.DamageInfo",                                          0x8B0B, {}],
    ["Vehicle.StatUpdate",                                          0x8B0C, {}],
    ["Vehicle.UpdateWeapon",                                        0x8B0D, {}],
    ["Vehicle.RemovedFromQueue",                                    0x8B0E, {}],
    ["Vehicle.UpdateQueuePosition",                                 0x8B0F, {
        fields: [
            { name: "queuePosition",                type: "uint32" }
        ]
    }],
    ["Vehicle.PadDestroyNotify",                                    0x8B10, {}],
    ["Vehicle.SetAutoDrive",                                        0x8B11, {
        fields: [
            { name: "guid",                         type: "uint64" }
        ]
    }],
    ["Vehicle.LockOnInfo",                                          0x8B12, {}],
    ["Vehicle.LockOnState",                                         0x8B13, {}],
    ["Vehicle.TrackingState",                                       0x8B14, {}],
    ["Vehicle.CounterMeasureState",                                 0x8B15, {}],
    ["Vehicle.LoadVehicleDefinitionManager",                        0x8B16, {
        fields: [
            { name: "vehicleDefinitions",           type: "array", fields: [
                { name: "vehicleId",                    type: "uint32" },
                { name: "modelId",                      type: "uint32" }
            ]}
        ]
    }],
    ["Vehicle.AcquireState",                                        0x8B17, {}],
    ["Vehicle.Dismiss",                                             0x8B18, {}],
    ["Vehicle.AutoMount",                                           0x8B19, {
        fields: [
            { name: "guid",                         type: "uint64" },
            { name: "unknownBoolean1",              type: "boolean" },
            { name: "unknownDword1",                type: "uint32" }
        ]
    }],
    ["Vehicle.WeaponSlots",                                         0x8B1A, {}],
    ["Vehicle.Deploy",                                              0x8B1B, {}],
    ["Vehicle.HeadLight",                                           0x8B1C, {}],
    ["Vehicle.AccessType",                                          0x8B1D, {}],
    ["Vehicle.KickPlayer",                                          0x8B1E, {}],
    ["Vehicle.HealthUpdateOwner",                                   0x8B1F, {}],
    ["Vehicle.OwnerPassengerList",                                  0x8B20, {}],
    ["Vehicle.Kick",                                                0x8B21, {}],
    ["Vehicle.NoAccess",                                            0x8B22, {}],
    ["Vehicle.Expiration",                                          0x8B23, {
        fields: [
            { name: "expireTime",                   type: "uint32" }
        ]
    }],
    ["Vehicle.Group",                                               0x8B24, {}],
    ["Vehicle.DeployResponse",                                      0x8B25, {}],
    ["Vehicle.ExitPoints",                                          0x8B26, {}],
    ["Vehicle.ControllerLogOut",                                    0x8B27, {}],
    ["Vehicle.CurrentMoveMode",                                     0x8B28, {}],
    ["Vehicle.ItemDefinitionRequest",                               0x8B29, {}],
    ["Vehicle.ItemDefinitionReply",                                 0x8B2A, {}],
    ["Vehicle.AirToAirRadar",                                       0x8B2B, {}],
    ["Grief",                                                       0x8C, {}],
    ["SpotPlayer",                                                  0x8D, {}],
    ["Faction",                                                     0x8E, {}],
    ["Synchronization",                                             0x8F, {
        fields: [
            { name: "time1",                          type: "uint64" },
            { name: "time2",                          type: "uint64" },
            { name: "clientTime",                     type: "uint64" },
            { name: "serverTime",                     type: "uint64" },
            { name: "serverTime2",                    type: "uint64" },
            { name: "time3",                          type: "uint64" }
        ]
    }],
    ["ResourceEvent",                           0x9000, {
        fields: [
            { name: "gameTime",                         type: "uint32" },
            { name: "eventData",                        type: "variabletype8",
                types: {
                    1: [
                        { name: "characterId",         type: "uint64" },
                        { name: "unknownArray1",       type: "array", fields: [
                            { name: "unknownDword1",       type: "uint32" },
                            { name: "unknownData1",       type: "schema", fields: resourceEventDataSubSchema }
                        ]}
                    ],
                    2: [
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
                    3: [
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
                    ]
                } 
            },
        ]
    }],
    ["Collision.Damage",                       0x9101, {}],
    ["Leaderboard",                              0x92, {}],
    ["PlayerUpdateManagedPosition",                  0x93, {}],
    ["PlayerUpdateNetworkObjectComponents",          0x94, {}],
    ["PlayerUpdateUpdateVehicleWeapon",              0x95, {}],
    ["ProfileStats.GetPlayerProfileStats",                       0x960000, {
        fields: [
            { name: "characterId",         type: "uint64" }
        ]
    }],
    ["ProfileStats.GetZonePlayerProfileStats",                   0x960100, {}],
    ["ProfileStats.PlayerProfileStats",                          0x960200, {
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
    ["ProfileStats.ZonePlayerProfileStats",                         0x960300, {}],
    ["ProfileStats.UpdatePlayerLeaderboards",                       0x960400, {}],
    ["ProfileStats.UpdatePlayerLeaderboardsReply",                  0x960500, {}],
    ["ProfileStats.GetLeaderboard",                                 0x960600, {}],
    ["ProfileStats.Leaderboard",                                    0x960700, {}],
    ["ProfileStats.GetZoneCharacterStats",                          0x960800, {}],
    ["ProfileStats.ZoneCharacterStats",                             0x960900, {}],
    ["Equipment.SetCharacterEquipment",                             0x9701, {
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
    ["Equipment.SetCharacterEquipmentSlot",                   0x9702, {}],
    ["Equipment.UnsetCharacterEquipmentSlot",                 0x9703, {}],
    ["Equipment.SetCharacterEquipmentSlots",                  0x9704, {
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
    ["DefinitionFilter.ListDefinitionVariables",                         0x9801, {}],
    ["DefinitionFilter.SetDefinitionVariable",                           0x9802, {
        fields: [
            { name: "unknownDword1",                type: "uint32" },
            { name: "unknownQword1",                type: "uint64" },
            { name: "unknownData1",                 type: "schema", fields: [
                { name: "unknownFloat1",                type: "float" },
                { name: "unknownFloat2",                type: "float" }
            ]}
        ]
    }],
    ["DefinitionFilter.SetDefinitionIntSet",                             0x9803, {
        fields: [
            { name: "unknownDword1",                type: "uint32" },
            { name: "unknownQword1",                type: "uint64" },
            { name: "unknownData1",                 type: "array", fields: [
                { name: "unknownDword1",                type: "uint32" },
                { name: "unknownDword2",                type: "uint32" }
            ]}
        ]
    }],
    ["DefinitionFilter.UnknownWithVariable1",                            0x9804, {
        fields: [
            { name: "unknownDword1",                type: "uint32" },
            { name: "unknownQword1",                type: "uint64" }
        ]
    }],
    ["DefinitionFilter.UnknownWithVariable2",                            0x9805, {
        fields: [
            { name: "unknownDword1",                type: "uint32" },
            { name: "unknownQword1",                type: "uint64" }
        ]
    }],
    ["ContinentBattleInfo",                          0x99, {
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
    ["GetContinentBattleInfo",                                      0x9A, {
        fields: []
    }],
    ["GetRespawnLocations",                                         0x9B, {
        fields: []
    }],
    ["WallOfData.PlayerKeyboard",                                   0x9C03, {}],
    ["WallOfData.UIEvent",                                          0x9C05, {
        fields: [
            { name: "object",                       type: "string" },
            { name: "function",                     type: "string" },
            { name: "argument",                     type: "string" }
        ]
    }],
    ["WallOfData.ClientSystemInfo",                                 0x9C06, {}],
    ["WallOfData.VoiceChatEvent",                                   0x9C07, {}],
    ["WallOfData.NudgeEvent",                                       0x9C09, {}],
    ["WallOfData.LaunchPadFingerprint",                             0x9C0A, {}],
    ["WallOfData.VideoCapture",                                     0x9C0B, {}],
    ["WallOfData.ClientTransition",                                 0x9C0C, {
        fields: [
            { name: "oldState",                     type: "uint32" },
            { name: "newState",                     type: "uint32" },
            { name: "msElapsed",                    type: "uint32" }
        ]
    }],
    ["ThrustPad.Data",                                              0x9D01, {}],
    ["ThrustPad.Update",                                            0x9D02, {}],
    ["ThrustPad.PlayerEntered",                                     0x9D03, {}],
    ["Implant.SelectImplant",                                       0x9E01, {}],
    ["Implant.UnselectImplant",                                     0x9E02, {}],
    ["Implant.LoadImplantDefinitionManager",                        0x9E03, {}],
    ["Implant.SetImplants",                                         0x9E04, {}],
    ["Implant.UpdateImplantSlot",                                   0x9E05, {}],
    ["ClientInGamePurchase",                                        0x9F, {}],
    ["Mission.ListMissions",                                        0xA001, {}],
    ["Mission.ConquerZone",                                         0xA002, {}],
    ["Mission.SelectMission",                                       0xA003, {}],
    ["Mission.UnselectMission",                                     0xA004, {}],
    ["Mission.SetMissionInstanceManager",                           0xA005, {}],
    ["Mission.SetMissionManager",                                   0xA006, {}],
    ["Mission.AddGlobalAvailableMission",                           0xA007, {}],
    ["Mission.RemoveGlobalAvailableMission",                        0xA008, {}],
    ["Mission.AddAvailableMission",                                 0xA009, {}],
    ["Mission.RemoveAvailableMission",                              0xA00A, {}],
    ["Mission.AddActiveMission",                                    0xA00B, {}],
    ["Mission.RemoveActiveMission",                                 0xA00C, {}],
    ["Mission.ReportCompletedMission",                              0xA00D, {}],
    ["Mission.AddAvailableMissions",                                0xA00E, {}],
    ["Mission.SetMissionChangeList",                                0xA00F, {}],
    ["Mission.SetConqueredZone",                                    0xA010, {}],
    ["Mission.UnsetConqueredZone",                                  0xA011, {}],
    ["Mission.SetConqueredZones",                                   0xA012, {}],
    ["Effect.AddEffect",                                            0xA101, {
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
    ["Effect.UpdateEffect",                                 0xA102, {
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
    ["Effect.RemoveEffect",                                 0xA103, {
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
    ["Effect.AddEffectTag",                                 0xA104, {
        fields: effectTagDataSchema
    }],
    ["Effect.RemoveEffectTag",                              0xA105, {
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
    ["Effect.TargetBlockedEffect",                          0xA106, {
        fields: [
            { name: "unknownData1",             type: "schema", fields: [
                { name: "unknownQword1",            type: "uint64" }
            ]}
        ]
    }],
    ["RewardBuffs.RewardBuffs",                             0xA201, {}],
    ["RewardBuffs.WorldToZoneRewardBuffs",                  0xA202, {}],
    ["RewardBuffs.ReceivedBundlePacket",                    0xA203, {}],
    ["RewardBuffs.NonBundledItem",                          0xA204, {}],
    ["RewardBuffs.AddBonus",                                0xA205, {}],
    ["RewardBuffs.RemoveBonus",                             0xA206, {}],
    ["RewardBuffs.GiveRewardToPlayer",                      0xA207, {}],
    ["RewardBuffs.GiveLoyaltyReward",                       0xA208, {}],
    ["Abilities.InitAbility",                                       0xA301, {}],
    ["Abilities.UpdateAbility",                                     0xA302, {}],
    ["Abilities.UninitAbility",                                     0xA303, {}],
    ["Abilities.SetAbilityActivationManager",                       0xA304, {}],
    ["Abilities.SetActivatableAbilityManager",                      0xA305, {
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
    ["Abilities.SetVehicleActivatableAbilityManager",               0xA306, {}],
    ["Abilities.SetAbilityTimerManager",                            0xA307, {}],
    ["Abilities.AddAbilityTimer",                                   0xA308, {}],
    ["Abilities.RemoveAbilityTimer",                                0xA309, {}],
    ["Abilities.UpdateAbilityTimer",                                0xA30A, {}],
    ["Abilities.SetAbilityLockTimer",                               0xA30B, {}],
    ["Abilities.ActivateAbility",                                   0xA30C, {}],
    ["Abilities.VehicleActivateAbility",                            0xA30D, {}],
    ["Abilities.DeactivateAbility",                                 0xA30E, {}],
    ["Abilities.VehicleDeactivateAbility",                          0xA30F, {}],
    ["Abilities.ActivateAbilityFailed",                             0xA310, {}],
    ["Abilities.VehicleActivateAbilityFailed",                      0xA311, {}],
    ["Abilities.ClearAbilityLineManager",                           0xA312, {}],
    ["Abilities.SetAbilityLineManager",                             0xA313, {}],
    ["Abilities.SetProfileAbilityLineMembers",                      0xA314, {}],
    ["Abilities.SetProfileAbilityLineMember",                       0xA315, {}],
    ["Abilities.RemoveProfileAbilityLineMember",                    0xA316, {}],
    ["Abilities.SetVehicleAbilityLineMembers",                      0xA317, {}],
    ["Abilities.SetVehicleAbilityLineMember",                       0xA318, {}],
    ["Abilities.RemoveVehicleAbilityLineMember",                    0xA319, {}],
    ["Abilities.SetFacilityAbilityLineMembers",                     0xA31A, {}],
    ["Abilities.SetFacilityAbilityLineMember",                      0xA31B, {}],
    ["Abilities.RemoveFacilityAbilityLineMember",                   0xA31C, {}],
    ["Abilities.SetEmpireAbilityLineMembers",                       0xA31D, {}],
    ["Abilities.SetEmpireAbilityLineMember",                        0xA31E, {}],
    ["Abilities.RemoveEmpireAbilityLineMember",                     0xA31F, {}],
    ["Abilities.SetLoadoutAbilities",                               0xA320, {
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
    ["Abilities.AddLoadoutAbility",                                 0xA321, {}],
    ["Abilities.RemoveLoadoutAbility",                              0xA322, {}],
    ["Abilities.SetImplantAbilities",                               0xA323, {}],
    ["Abilities.AddImplantAbility",                                 0xA324, {}],
    ["Abilities.RemoveImplantAbility",                              0xA325, {}],
    ["Abilities.SetPersistentAbilities",                            0xA326, {}],
    ["Abilities.AddPersistentAbility",                              0xA327, {}],
    ["Abilities.RemovePersistentAbility",                           0xA328, {}],
    ["Deployable.Place",                                            0xA401, {}],
    ["Deployable.Remove",                                           0xA402, {}],
    ["Deployable.Pickup",                                           0xA403, {}],
    ["Deployable.ActionResponse",                                   0xA404, {}],
    ["Security",                                                    0xA5, {
        fields: [
            { name: "code",                         type: "uint32" }
        ]
    }],
    ["MapRegion.GlobalData",                                        0xA601, {
        fields: [
            { name: "unknown1",         type: "float" },
            { name: "unknown2",         type: "float" }
        ]
    }],
    ["MapRegion.Data",                                    0xA602, {
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
    ["MapRegion.ExternalData",                            0xA603, {}],
    ["MapRegion.Update",                                  0xA604, {}],
    ["MapRegion.UpdateAll",                               0xA605, {}],
    ["MapRegion.MapOutOfBounds",                          0xA606, {
        fields: [
            { name: "characterId",                  type: "uint64" },
            { name: "unknownDword1",                type: "uint32" },
            { name: "unknownByte2",                 type: "uint8" }
        ]
    }],
    ["MapRegion.Population",                              0xA607, {}],
    ["MapRegion.RequestContinentData",                    0xA608, {
        fields: [
            { name: "zoneId",                       type: "uint32" }
        ]
    }],
    ["MapRegion.InfoRequest",                             0xA609, {}],
    ["MapRegion.InfoReply",                               0xA60A, {}],
    ["MapRegion.ExternalFacilityData",                    0xA60B, {}],
    ["MapRegion.ExternalFacilityUpdate",                  0xA60C, {}],
    ["MapRegion.ExternalFacilityUpdateAll",               0xA60D, {}],
    ["MapRegion.ExternalFacilityEmpireScoreUpdate",       0xA60E, {}],
    ["MapRegion.NextTick",                                0xA60F, {}],
    ["MapRegion.HexActivityUpdate",                       0xA610, {}],
    ["MapRegion.ConquerFactionUpdate",                    0xA611, {}],
    ["Hud",                                      0xA7, {}],
    ["ClientPcData.SetSpeechPack",                               0xA801, {}],
    ["ClientPcData.SpeechPackList",                              0xA803, {
        fields: [
            { name: "speechPacks",          type: "array", fields: [
                { name: "speechPackId",                     type: "uint32" }
            ]}
        ]
    }],
    ["AcquireTimer",                             0xA9, {}],
    ["PlayerUpdateGuildTag",                         0xAA, {}],
    ["Warpgate.ActivateTerminal",                        0xAB01, {}],
    ["Warpgate.ZoneRequest",                             0xAB02, {}],
    ["Warpgate.PostQueueNotify",                         0xAB03, {}],
    ["Warpgate.QueueForZone",                            0xAB04, {}],
    ["Warpgate.CancelQueue",                             0xAB05, {}],
    ["Warpgate.WarpToQueuedZone",                        0xAB06, {}],
    ["Warpgate.WarpToSocialZone",                        0xAB07, {}],
    ["LoginQueueStatus",                             0xAC, {}],
    ["ServerPopulationInfo",                         0xAD, {
        fields: [
            { name: "population",           type: "array", elementType: "uint16" },
            { name: "populationPercent",    type: "array", elementType: "uint8" },
            { name: "populationBuff",       type: "array", elementType: "uint8" }
        ]
    }],
    ["GetServerPopulationInfo",                      0xAE, {
        fields: []
    }],
    ["PlayerUpdate.VehicleCollision",                 0xAF, {}],
    ["PlayerUpdate.Stop",                             0xB0, {
        fields: [
            { name: "unknownUint",       type: "custom", parser: readUnsignedIntWith2bitLengthValue, packer: packUnsignedIntWith2bitLengthValue }
        ]
    }],
    ["Currency.SetCurrencyDiscount",                     0xB101, {
        fields: [
            { name: "currencyId",           type: "uint32" },
            { name: "discount",             type: "float" }
        ]
    }],
    ["Currency.SetCurrencyRateTier",                     0xB102, {}],
    ["Currency.ListCurrencyDiscounts",                   0xB103, {}],
    ["Currency.RequestSetCurrencyDiscount",              0xB104, {}],
    ["Items.LoadItemRentalDefinitionManager",         0xB201, {}],
    ["Items.SetItemTimerManager",         0xB201, {}],
    ["Items.SetItemLockTimer",         0xB201, {}],
    ["Items.SetItemLineTimers",         0xB201, {}],
    ["Items.SetItemTrialLockTimer",         0xB201, {}],
    ["Items.SetItemLineTrialTimers",         0xB201, {}],
    ["Items.AddItemLineTrialTimer",         0xB201, {}],
    ["Items.RemoveItemLineTrialTimer",         0xB201, {}],
    ["Items.ExpireItemLineTrialTimer",         0xB201, {}],
    ["Items.UpdateItemLineTrialTimer",         0xB201, {}],
    ["Items.SetItemLineRentalTimers",         0xB201, {}],
    ["Items.AddItemLineRentalTimer",         0xB201, {}],
    ["Items.RemoveItemLineRentalTimer",         0xB201, {}],
    ["Items.ExpireItemLineRentalTimer",         0xB201, {}],
    ["Items.SetImplantTimers",         0xB201, {}],
    ["Items.AddImplantTimer",         0xB201, {}],
    ["Items.RemoveImplantTimer",         0xB201, {}],
    ["Items.UpdateImplantTimer",         0xB201, {}],
    ["Items.ExpireImplantTimer",         0xB201, {}],
    ["Items.RequestAddItemLineTimer",         0xB201, {}],
    ["Items.RequestTrialItemLine",         0xB201, {}],
    ["Items.RequestRentalItemLine",         0xB201, {}],
    ["Items.ListItemRentalTerms",         0xB201, {}],
    ["Items.ListItemLineTimers",         0xB201, {}],
    ["Items.ExpireItemLineTrialTimers",         0xB201, {}],
    ["Items.ExpireItemLineRentalTimers",         0xB201, {}],
    ["Items.ExpireImplantTimers",         0xB201, {}],
    ["Items.ClearItemLineTrialTimers",         0xB201, {}],
    ["Items.ClearItemLineRentalTimers",         0xB201, {}],
    ["Items.ClearImplantTimers",         0xB201, {}],
    ["Items.LoadItemRentalDefinitionManager",         0xB201, {}],
    ["PlayerUpdate.AttachObject",                     0xB3, {}],
    ["PlayerUpdate.DetachObject",                     0xB4, {}],
    ["ClientSettings",                               0xB5, {
        fields: [
            { name: "helpUrl",         type: "string" },
            { name: "shopUrl",         type: "string" },
            { name: "shop2Url",        type: "string" }
        ]
    }],
    ["RewardBuffInfo",                                              0xB6, {
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
            { name: "unknownFloat12",           type: "float" },
            { name: "unknownDword1",            type: "uint32" },
            { name: "unknownDword2",            type: "uint32" }
        ]
    }],
    ["GetRewardBuffInfo",                                           0xB7, {
        fields: []
    }],
    ["Cais",                                                        0xB8, {}],
    ["ZoneSetting.Data",                                            0xB901, {
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
    ["RequestPromoEligibilityUpdate",                               0xBA, {}],
    ["PromoEligibilityReply",                                       0xBB, {}],
    ["MetaGameEvent.StartWarning",                                  0xBC01, {}],
    ["MetaGameEvent.Start",                                         0xBC02, {}],
    ["MetaGameEvent.Update",                                        0xBC03, {}],
    ["MetaGameEvent.CompleteDominating",                            0xBC04, {}],
    ["MetaGameEvent.CompleteStandard",                              0xBC05, {}],
    ["MetaGameEvent.CompleteCancel",                                0xBC06, {}],
    ["MetaGameEvent.ExperienceBonusUpdate",                         0xBC07, {}],
    ["MetaGameEvent.ClearExperienceBonus",                          0xBC08, {}],
    ["RequestWalletTopupUpdate",                                    0xBD, {}],
    ["RequestStationCashActivePromoUpdate",                         0xBE, {}],
    ["CharacterSlot",                                               0xBF, {}],
    ["Operation.RequestCreate",                                     0xC001, {}],
    ["Operation.RequestDestroy",                                    0xC002, {}],
    ["Operation.RequestJoin",                                       0xC003, {}],
    ["Operation.RequestJoinByName",                                 0xC004, {}],
    ["Operation.RequestLeave",                                      0xC005, {}],
    ["Operation.ClientJoined",                                      0xC006, {}],
    ["Operation.ClientLeft",                                        0xC007, {}],
    ["Operation.BecomeListener",                                    0xC008, {}],
    ["Operation.AvailableData",                                     0xC009, {}],
    ["Operation.Created",                                           0xC00A, {}],
    ["Operation.Destroyed",                                         0xC00B, {}],
    ["Operation.ClientClearMissions",                               0xC00C, {
        fields: []
    }],
    ["Operation.InstanceAreaUpdate",                                0xC00D, {}],
    ["Operation.ClientInArea",                                      0xC00E, {}],
    ["Operation.InstanceLocationUpdate",                            0xC00F, {}],
    ["Operation.GroupOperationListRequest",                         0xC010, {}],
    ["Operation.GroupOperationListReply",                           0xC011, {}],
    ["Operation.GroupOperationSelect",                              0xC012, {}],
    ["Operation.InstanceLockUpdate",                                0xC013, {}],
    ["WordFilter.Data",                                             0xC101, {
        fields: [
            { name: "wordFilterData",       type: "byteswithlength" }
        ]
    }],
    ["StaticFacilityInfo.Request",                                  0xC201, {}],
    ["StaticFacilityInfo.Reply",                                    0xC202, {}],
    ["StaticFacilityInfo.AllZones",                                 0xC203, {
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
    ["StaticFacilityInfo.ReplyWarpgate",                            0xC204, {}],
    ["StaticFacilityInfo.AllWarpgateRespawns",                      0xC205, {}],
    ["ProxiedPlayer",                                               0xC3, {}],
    ["Resist",                                                      0xC4, {}],
    ["InGamePurchasing",                                            0xC5, {}],
    ["BusinessEnvironments",                                        0xC6, {}],
    ["EmpireScore",                                                 0xC7, {}],
    ["CharacterSelectSessionRequest",                               0xC8, {
        fields: []
    }],
    ["CharacterSelectSessionResponse",                              0xC9, {
        fields: [
            { name: "status",               type: "uint8" },
            { name: "sessionId",            type: "string" }
        ]
    }],
    ["Stats",                                                       0xCA, {}],
    ["DeathReport",                                                 0xCB, {}],
    ["Crafting",                                                    0xCC, {}],
    ["ExperienceScheduledEvent",                                    0xCD, {}],
    ["NudgeNotification",                                           0xCE, {}],
    ["Resource",                                                    0xCF, {}],
    ["Directive.Initialize",                                        0xD001, {
        fields: [
            { name: "directivesData",               type: "byteswithlength", fields: [
                { name: "unknownDword1",                type: "uint32" },
                { name: "treeCategories",               type: "array", fields: [
                    { name: "categoryId",                   type: "uint32" },
                    { name: "categoryData",                 type: "schema", fields: [
                        { name: "nameId",                       type: "uint32" },
                        { name: "locked",                       type: "boolean" },
                        { name: "completion",                   type: "float" },
                        { name: "unknownByte1",                 type: "uint8" }
                    ]}
                ]},
                { name: "trees",                    type: "array", fields: [
                    { name: "treeId",                   type: "uint32" },
                    { name: "treeData",                 type: "schema", fields: [
                        { name: "treeId",                   type: "uint32" },
                        { name: "imageSet",                 type: "uint32" },
                        { name: "categoryId",               type: "uint32" },
                        { name: "detailData",               type: "variabletype8",
                            types: {
                                0: [
                                    { name: "nameId",                       type: "uint32" },
                                    { name: "descriptionId",                type: "uint32" },
                                    { name: "unknownDword3",                type: "uint32" },
                                    { name: "unknownQword1",                type: "uint64" },
                                    { name: "tiers",                        type: "array", fields: [
                                        { name: "tierId",                type: "uint32" },
                                        { name: "nameId",                       type: "uint32" },
                                        { name: "unknownDword3",                type: "uint32" },
                                        { name: "imageSetId",                   type: "uint32" },
                                        { name: "rewardBundle",                 type: "schema", fields: rewardBundleDataSchema },
                                        { name: "unknownDword5",                type: "uint32" },
                                        { name: "unknownBoolean1",              type: "boolean" },
                                        { name: "unknownQword1",                type: "uint64" },
                                        { name: "unknownDword6",                type: "uint32" },
                                        { name: "objectives",                   type: "array", fields: [
                                            { name: "objectiveId",                  type: "uint32" },
                                            { name: "objectiveData",                type: "schema", fields: [
                                                { name: "objectiveId",                  type: "uint32" },
                                                { name: "unknownDword2",                type: "uint32" },
                                                { name: "unknownByte1",                 type: "uint8" },
                                                { name: "unknownByte2",                 type: "uint8" },
                                                { name: "nameId",                       type: "uint32" },
                                                { name: "imageSetId",                   type: "uint32" },    
                                                { name: "unknownDword5",                type: "uint32" },
                                                { name: "unknownWord1",                 type: "uint16" },
                                                { name: "unknownByte3",                 type: "uint8" },
                                                { name: "unknownWord2",                 type: "uint16" },
                                                { name: "time",                         type: "uint64" }
                                            ]}
                                        ]}
                                        
                                    ]},
                                    { name: "unknownArray2",                type: "array", fields: [
                                        { name: "unknownDword1",                type: "uint32" },
                                        { name: "unknownDword2",                type: "uint32" },
                                        { name: "unknownDword3",                type: "uint32" },
                                        { name: "unknownDword4",                type: "uint32" }
                                    ]}
                                ],
                                1: [
                                    { name: "unlockHintStringId",           type: "uint32" }
                                ]
                            }
                        },
                    ]}
                ]},
                { name: "scoreLevels",                  type: "array", fields: [
                    { name: "nameId",                       type: "uint32" },
                    { name: "points",                       type: "uint32" },
                    { name: "rewardStringId",               type: "uint32" },
                    { name: "rewardImageSetId",             type: "uint32" }
                ]}

            ]}
        ]
    }]
];


var packetTypes = {},
    packetDescriptors = {};

PacketTable.build(packets, packetTypes, packetDescriptors);

exports.PacketTypes = packetTypes;
exports.Packets = packetDescriptors;
