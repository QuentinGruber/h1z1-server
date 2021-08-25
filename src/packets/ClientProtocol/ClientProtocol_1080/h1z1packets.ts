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
import PacketTableBuild from "../../packettable";
import DataSchema from "h1z1-dataschema";
import { lz4_decompress } from "../../../utils/utils";

function readPacketType(data: Buffer, packets: any) {
  let opCode = data[0] >>> 0,
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
function writePacketType(packetType: number) {
  const packetTypeBytes = [];
  while (packetType) {
    packetTypeBytes.unshift(packetType & 0xff);
    packetType = packetType >> 8;
  }
  const data = new (Buffer.alloc as any)(packetTypeBytes.length);
  for (let i = 0; i < packetTypeBytes.length; i++) {
    data.writeUInt8(packetTypeBytes[i], i);
  }
  return data;
}
function readUnsignedIntWith2bitLengthValue(data: Buffer, offset: number) {
  let value = data.readUInt8(offset);
  const n = value & 3;
  for (let i = 0; i < n; i++) {
    value += data.readUInt8(offset + i + 1) << ((i + 1) * 8);
  }
  value = value >>> 2;
  return {
    value: value,
    length: n + 1,
  };
}
function packUnsignedIntWith2bitLengthValue(value: number) {
  value = Math.round(value);
  value = value << 2;
  let n = 0;
  if (value > 0xffffff) {
    n = 3;
  } else if (value > 0xffff) {
    n = 2;
  } else if (value > 0xff) {
    n = 1;
  }
  value |= n;
  const data = new (Buffer.alloc as any)(4);
  data.writeUInt32LE(value, 0);
  return data.slice(0, n + 1);
}
function readSignedIntWith2bitLengthValue(data: Buffer, offset: number) {
  let value = data.readUInt8(offset);
  const sign = value & 1;
  const n = (value >> 1) & 3;
  for (let i = 0; i < n; i++) {
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
function packSignedIntWith2bitLengthValue(value: number): void {
  value = Math.round(value);
  const sign = value < 0 ? 1 : 0;
  value = sign ? -value : value;
  value = value << 3;
  let n = 0;
  if (value > 0xffffff) {
    n = 3;
  } else if (value > 0xffff) {
    n = 2;
  } else if (value > 0xff) {
    n = 1;
  }
  value |= n << 1;
  value |= sign;
  const data = new (Buffer.alloc as any)(4);
  data.writeUInt32LE(value, 0);
  return data.slice(0, n + 1);
}
function readPositionUpdateData(data: Buffer, offset: number) {
  const obj: any = {},
    startOffset = offset;
  let v: any;
  obj["flags"] = data.readUInt16LE(offset);
  offset += 2;
  obj["unknown2_int32"] = data.readUInt32LE(offset);
  offset += 4;
  obj["unknown3_int8"] = data.readUInt8(offset);
  offset += 1;
  if (obj.flags && 1) {
    v = readUnsignedIntWith2bitLengthValue(data, offset);
    obj["unknown4"] = v.value;
    offset += v.length;
  }
  if (obj.flags && 2) {
    obj["position"] = [];
    v = readSignedIntWith2bitLengthValue(data, offset);
    obj["position"][0] = v.value / 100;
    offset += v.length;
    v = readSignedIntWith2bitLengthValue(data, offset);
    obj["position"][1] = v.value / 100;
    offset += v.length;
    v = readSignedIntWith2bitLengthValue(data, offset);
    obj["position"][2] = v.value / 100;
    offset += v.length;
  }
  if (obj.flags && 0x20) {
    obj["unknown6_int32"] = data.readUInt32LE(offset);
    offset += 4;
  }
  if (obj.flags && 0x40) {
    v = readSignedIntWith2bitLengthValue(data, offset);
    obj["unknown7_float"] = v.value / 100;
    offset += v.length;
  }
  if (obj.flags && 0x80) {
    v = readSignedIntWith2bitLengthValue(data, offset);
    obj["unknown8_float"] = v.value / 100;
    offset += v.length;
  }
  if (obj.flags && 4) {
    v = readSignedIntWith2bitLengthValue(data, offset);
    obj["unknown9_float"] = v.value / 100;
    offset += v.length;
  }
  if (obj.flags && 0x8) {
    v = readSignedIntWith2bitLengthValue(data, offset);
    obj["unknown10_float"] = v.value / 100;
    offset += v.length;
  }
  if (obj.flags && 0x10) {
    v = readSignedIntWith2bitLengthValue(data, offset);
    obj["unknown11_float"] = v.value / 10;
    offset += v.length;
  }
  if (obj.flags && 0x100) {
    obj["unknown12_float"] = [];
    v = readSignedIntWith2bitLengthValue(data, offset);
    obj["unknown12_float"][0] = v.value / 100;
    offset += v.length;
    v = readSignedIntWith2bitLengthValue(data, offset);
    obj["unknown12_float"][1] = v.value / 100;
    offset += v.length;
    v = readSignedIntWith2bitLengthValue(data, offset);
    obj["unknown12_float"][2] = v.value / 100;
    offset += v.length;
  }
  if (obj.flags && 0x200) {
    obj["unknown13_float"] = [];
    v = readSignedIntWith2bitLengthValue(data, offset);
    obj["unknown13_float"][0] = v.value / 100;
    offset += v.length;
    v = readSignedIntWith2bitLengthValue(data, offset);
    obj["unknown13_float"][1] = v.value / 100;
    offset += v.length;
    v = readSignedIntWith2bitLengthValue(data, offset);
    obj["unknown13_float"][2] = v.value / 100;
    offset += v.length;
    v = readSignedIntWith2bitLengthValue(data, offset);
    obj["unknown13_float"][3] = v.value / 100;
    offset += v.length;
  }
  if (obj.flags && 0x400) {
    v = readSignedIntWith2bitLengthValue(data, offset);
    obj["unknown14_float"] = v.value / 10;
    offset += v.length;
  }
  if (obj.flags && 0x800) {
    v = readSignedIntWith2bitLengthValue(data, offset);
    obj["unknown15_float"] = v.value / 10;
    offset += v.length;
  }
  /*
  if (obj.flags && 0xe0) {
  }
  */
  return {
    value: obj,
    length: offset - startOffset,
  };
}
function packPositionUpdateData(obj: any) {
  let data = new (Buffer.alloc as any)(7),
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
    v = new (Buffer.alloc as any)(4);
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
const vehicleReferenceDataSchema = [
  {
    name: "move_info",
    type: "array",
    defaultValue: [{}],
    fields: [
      { name: "id", type: "uint32", defaultValue: 0 },
      {
        name: "data",
        type: "schema",
        fields: [
          { name: "id", type: "uint32", defaultValue: 0 },
          { name: "unknownByte1", type: "uint8", defaultValue: 0 },
          { name: "unknownByte2", type: "uint8", defaultValue: 0 },
          { name: "unknownDword2", type: "uint32", defaultValue: 0 },
          { name: "unknownByte3", type: "uint8", defaultValue: 0 },
          { name: "unknownFloat1", type: "float", defaultValue: 0.0 },
          { name: "unknownFloat2", type: "float", defaultValue: 0.0 },
          { name: "max_forward", type: "float", defaultValue: 0.0 },
          { name: "max_reverse", type: "float", defaultValue: 0.0 },
          { name: "max_dive", type: "float", defaultValue: 0.0 },
          { name: "max_rise", type: "float", defaultValue: 0.0 },
          { name: "max_strafe", type: "float", defaultValue: 0.0 },
          { name: "accel_forward", type: "float", defaultValue: 0.0 },
          { name: "accel_reverse", type: "float", defaultValue: 0.0 },
          { name: "accel_dive", type: "float", defaultValue: 0.0 },
          { name: "accel_rise", type: "float", defaultValue: 0.0 },
          { name: "accel_strafe", type: "float", defaultValue: 0.0 },
          { name: "brake_forward", type: "float", defaultValue: 0.0 },
          { name: "brake_reverse", type: "float", defaultValue: 0.0 },
          { name: "brake_dive", type: "float", defaultValue: 0.0 },
          { name: "brake_rise", type: "float", defaultValue: 0.0 },
          { name: "brake_strafe", type: "float", defaultValue: 0.0 },
          { name: "move_pitch_rate", type: "float", defaultValue: 0.0 },
          { name: "move_yaw_rate", type: "float", defaultValue: 0.0 },
          { name: "move_roll_rate", type: "float", defaultValue: 0.0 },
          { name: "still_pitch_rate", type: "float", defaultValue: 0.0 },
          { name: "still_yaw_rate", type: "float", defaultValue: 0.0 },
          { name: "still_roll_rate", type: "float", defaultValue: 0.0 },
          { name: "unknownDword3", type: "uint32", defaultValue: 0 },
          { name: "unknownDword4", type: "uint32", defaultValue: 0 },
          { name: "landing_gear_height", type: "uint32", defaultValue: 0 },
          { name: "vehicle_archetype", type: "uint8", defaultValue: 0 },
          { name: "movement_mode", type: "uint8", defaultValue: 0 },
          {
            name: "change_mode_speed_percent",
            type: "float",
            defaultValue: 0.0,
          },
          { name: "unknownFloat25", type: "float", defaultValue: 0.0 },
          { name: "unknownFloat26", type: "float", defaultValue: 0.0 },
          { name: "min_traction", type: "float", defaultValue: 0.0 },
          { name: "linear_redirect", type: "float", defaultValue: 0.0 },
          { name: "linear_dampening", type: "float", defaultValue: 0.0 },
          { name: "hover_power", type: "float", defaultValue: 0.0 },
          { name: "hover_length", type: "float", defaultValue: 0.0 },
          { name: "unknownFloat32", type: "float", defaultValue: 0.0 },
          { name: "unknownFloat33", type: "float", defaultValue: 0.0 },
          { name: "unknownFloat34", type: "float", defaultValue: 0.0 },
          { name: "unknownFloat35", type: "float", defaultValue: 0.0 },
          { name: "unknownFloat36", type: "float", defaultValue: 0.0 },
          { name: "dead_zone_size", type: "float", defaultValue: 0.0 },
          { name: "dead_zone_rate", type: "float", defaultValue: 0.0 },
          { name: "dead_zone_sensitivity", type: "float", defaultValue: 0.0 },
          { name: "unknownFloat40", type: "float", defaultValue: 0.0 },
          { name: "unknownFloat41", type: "float", defaultValue: 0.0 },
          { name: "auto_level_roll_rate", type: "float", defaultValue: 0.0 },
          { name: "camera_shake_intensity", type: "float", defaultValue: 0.0 },
          { name: "camera_shake_speed", type: "float", defaultValue: 0.0 },
          {
            name: "camera_shake_change_speed",
            type: "float",
            defaultValue: 0.0,
          },
          { name: "unknownFloat46", type: "float", defaultValue: 0.0 },
          { name: "inward_yaw_mod", type: "float", defaultValue: 0.0 },
          { name: "unknownFloat48", type: "float", defaultValue: 0.0 },
          { name: "vehicle_strafe_lift", type: "float", defaultValue: 0.0 },
          {
            name: "dead_zone_influence_exponent",
            type: "float",
            defaultValue: 0.0,
          },
          {
            name: "camera_shake_initial_intensity",
            type: "float",
            defaultValue: 0.0,
          },
          { name: "unknownFloat52", type: "float", defaultValue: 0.0 },
          { name: "dampening", type: "floatvector3", defaultValue: [0, 0, 0] },
          { name: "unknownFloat53", type: "float", defaultValue: 0.0 },
          { name: "unknownFloat54", type: "float", defaultValue: 0.0 },
          { name: "sprint_lift_sub", type: "float", defaultValue: 0.0 },
          { name: "sprint_lift_factor", type: "float", defaultValue: 0.0 },
          { name: "lift_factor", type: "float", defaultValue: 0.0 },
          { name: "unknownFloat58", type: "float", defaultValue: 0.0 },
          {
            name: "steer_burst_factor",
            type: "floatvector3",
            defaultValue: [0, 0, 0],
          },
          { name: "steer_burst_speed", type: "float", defaultValue: 0.0 },
          { name: "steer_factor", type: "float", defaultValue: 0.0 },
          { name: "steer_exponent", type: "float", defaultValue: 0.0 },
          { name: "steer_spin_factor", type: "float", defaultValue: 0.0 },
          { name: "steer_spin_exponent", type: "float", defaultValue: 0.0 },
          { name: "steer_lean_factor", type: "float", defaultValue: 0.0 },
          { name: "steer_lean_turn_factor", type: "float", defaultValue: 0.0 },
          { name: "steer_compensate_factor", type: "float", defaultValue: 0.0 },
          { name: "unknownFloat67", type: "float", defaultValue: 0.0 },
          { name: "unknownFloat68", type: "float", defaultValue: 0.0 },
          {
            name: "angular_dampening_scalar",
            type: "float",
            defaultValue: 0.0,
          },
          {
            name: "angular_dampening",
            type: "floatvector3",
            defaultValue: [0, 0, 0],
          },
          { name: "estimated_max_speed", type: "uint32", defaultValue: 0 },
          { name: "hill_climb", type: "float", defaultValue: 0.0 },
          { name: "hill_climb_decay_range", type: "float", defaultValue: 0.0 },
          { name: "hill_climb_min_power", type: "float", defaultValue: 0.0 },
          { name: "unknownFloat73", type: "float", defaultValue: 0.0 },
          { name: "unknownDword7", type: "uint32", defaultValue: 0 },
          { name: "unknownDword8", type: "uint32", defaultValue: 0 },
          { name: "unknownDword9", type: "uint32", defaultValue: 0 },
          { name: "unknownDword10", type: "uint32", defaultValue: 0 },
          { name: "unknownDword11", type: "uint32", defaultValue: 0 },
          { name: "unknownDword12", type: "uint32", defaultValue: 0 },
          { name: "unknownDword13", type: "uint32", defaultValue: 0 },
          { name: "unknownDword14", type: "uint32", defaultValue: 0 },
          { name: "unknownDword15", type: "uint32", defaultValue: 0 },
          { name: "unknownDword16", type: "uint32", defaultValue: 0 },
          { name: "unknownDword17", type: "uint32", defaultValue: 0 },
          { name: "wake_effect", type: "uint32", defaultValue: 0 },
          { name: "debris_effect", type: "uint32", defaultValue: 0 },
        ],
      },
    ],
  },
  {
    name: "dynamics_info",
    type: "array",
    defaultValue: [{}],
    fields: [
      { name: "id", type: "uint32", defaultValue: 0 },
      {
        name: "data",
        type: "schema",
        fields: [
          { name: "id", type: "uint32", defaultValue: 0 },
          { name: "max_velocity", type: "float", defaultValue: 0.0 },
          { name: "turn_torque", type: "float", defaultValue: 0.0 },
          { name: "turn_rate", type: "float", defaultValue: 0.0 },
          { name: "center_of_gravity_y", type: "float", defaultValue: 0.0 },
        ],
      },
    ],
  },
  {
    name: "engine_info",
    type: "array",
    defaultValue: [{}],
    fields: [
      { name: "id", type: "uint32", defaultValue: 0 },
      {
        name: "data",
        type: "schema",
        fields: [
          { name: "id", type: "uint32", defaultValue: 0 },
          { name: "peak_torque", type: "float", defaultValue: 0.0 },
          { name: "torque_curve_y", type: "float", defaultValue: 0.0 },
          { name: "engaged_clutch_damp", type: "float", defaultValue: 0.0 },
          { name: "disengaged_clutch_damp", type: "float", defaultValue: 0.0 },
          { name: "clutch_strength", type: "float", defaultValue: 0.0 },
          { name: "reverse_gear", type: "float", defaultValue: 0.0 },
          { name: "first_gear", type: "float", defaultValue: 0.0 },
          { name: "second_gear", type: "float", defaultValue: 0.0 },
          { name: "third_gear", type: "float", defaultValue: 0.0 },
          { name: "fourth_gear", type: "float", defaultValue: 0.0 },
          { name: "switch_gear_time", type: "float", defaultValue: 0.0 },
        ],
      },
    ],
  },
  {
    name: "suspension_info",
    type: "array",
    defaultValue: [{}],
    fields: [
      { name: "id", type: "uint32", defaultValue: 0 },
      {
        name: "data",
        type: "schema",
        fields: [
          { name: "id", type: "uint32", defaultValue: 0 },
          { name: "spring_frequency", type: "float", defaultValue: 0.0 },
          { name: "spring_damper_ratio", type: "float", defaultValue: 0.0 },
          {
            name: "hashes",
            type: "array",
            defaultValue: [{}],
            fields: [
              { name: "hash_1", type: "uint32", defaultValue: 0 },
              { name: "hash_2", type: "uint32", defaultValue: 0 },
            ],
          },
        ],
      },
    ],
  },
  {
    name: "vehicle_model_mappings",
    type: "array",
    defaultValue: [{}],
    fields: [
      { name: "vehicle_id", type: "uint32", defaultValue: 0 },
      { name: "model_id", type: "uint32", defaultValue: 0 },
    ],
  },
  {
    name: "wheel_info",
    type: "array",
    defaultValue: [{}],
    fields: [
      { name: "id", type: "uint32", defaultValue: 0 },
      {
        name: "data",
        type: "schema",
        fields: [
          { name: "id", type: "uint32", defaultValue: 0 },
          { name: "max_brake", type: "float", defaultValue: 0.0 },
          { name: "max_hand_brake", type: "float", defaultValue: 0.0 },
          { name: "max_steer", type: "float", defaultValue: 0.0 },
          {
            name: "hashes",
            type: "array",
            defaultValue: [{}],
            fields: [
              { name: "hash_1", type: "uint32", defaultValue: 0 },
              { name: "hash_2", type: "uint32", defaultValue: 0 },
            ],
          },
        ],
      },
    ],
  },
  {
    name: "tire_info",
    type: "array",
    defaultValue: [{}],
    fields: [
      { name: "id", type: "uint32", defaultValue: 0 },
      {
        name: "data",
        type: "schema",
        fields: [
          { name: "id", type: "uint32", defaultValue: 0 },
          { name: "long_stiff", type: "float", defaultValue: 0.0 },
          { name: "tire_second", type: "float", defaultValue: 0.0 },
          {
            name: "hashes",
            type: "array",
            defaultValue: [{}],
            fields: [
              { name: "hash_1", type: "uint32", defaultValue: 0 },
              { name: "hash_2", type: "uint32", defaultValue: 0 },
            ],
          },
        ],
      },
    ],
  },
  {
    name: "vehicle_move_info_mappings",
    type: "array",
    defaultValue: [{}],
    fields: [
      { name: "vehicle_id", type: "uint32", defaultValue: 0 },
      {
        name: "move_info",
        type: "array",
        defaultValue: [{}],
        elementType: "uint32",
      },
    ],
  },
];
function parseVehicleReferenceData(data: Buffer, offset: number) {
  const dataLength = data.readUInt32LE(offset);
  offset += 4;
  data = data.slice(offset, offset + dataLength);
  const inSize = data.readUInt32LE(0),
    outSize = data.readUInt32LE(4),
    compData = data.slice(8);
  data = lz4_decompress(compData, inSize, outSize);
  const result = DataSchema.parse(vehicleReferenceDataSchema, data, 0).result;
  return {
    value: result,
    length: dataLength + 4,
  };
}
function packVehicleReferenceData(obj: any) {
  const data = DataSchema.pack(vehicleReferenceDataSchema, obj);
  return data;
}
function parseItemAddData(data: Buffer, offset: number, referenceData: any) {
  const itemDataLength = data.readUInt32LE(offset);
  offset += 4;
  let itemData: any = data.slice(offset, offset + itemDataLength);
  const inSize = itemData.readUInt16LE(0),
    outSize = itemData.readUInt16LE(2),
    compData = itemData.slice(4, 4 + inSize),
    decompData = lz4_decompress(compData, inSize, outSize),
    itemDefinition = DataSchema.parse(
      baseItemDefinitionSchema,
      decompData,
      0
    ).result;
  itemData = parseItemData(itemData, 4 + inSize, referenceData).value;
  return {
    value: {
      itemDefinition: itemDefinition,
      itemData: itemData,
    },
    length: itemDataLength + 4,
  };
}
function packItemAddData() {}
const profileDataSchema = [
  { name: "profileId", type: "uint32", defaultValue: 0 },
  { name: "nameId", type: "uint32", defaultValue: 0 },
  { name: "descriptionId", type: "uint32", defaultValue: 0 },
  { name: "type", type: "uint8", defaultValue: 0 },
  { name: "unknownDword1", type: "uint32", defaultValue: 0 },
  { name: "abilityBgImageSet", type: "uint32", defaultValue: 0 },
  { name: "badgeImageSet", type: "uint32", defaultValue: 0 },
  { name: "buttonImageSet", type: "uint32", defaultValue: 0 },
  { name: "unknownByte1", type: "uint8", defaultValue: 0 },
  { name: "unknownByte2", type: "uint8", defaultValue: 0 },
  { name: "unknownDword4", type: "uint32", defaultValue: 0 },
  {
    name: "unknownArray1",
    type: "array",
    defaultValue: [{}],
    fields: [
      { name: "unknownDword1", type: "uint32", defaultValue: 0 },
      { name: "unknownDword2", type: "uint32", defaultValue: 0 },
      { name: "unknownDword3", type: "uint32", defaultValue: 0 },
    ],
  },
  { name: "unknownDword5", type: "uint32", defaultValue: 0 },
  { name: "unknownDword6", type: "uint32", defaultValue: 0 },
  { name: "unknownByte3", type: "uint8", defaultValue: 0 },
  { name: "unknownDword7", type: "uint32", defaultValue: 0 },
  { name: "unknownDword8", type: "uint32", defaultValue: 0 },
  { name: "unknownDword9", type: "uint32", defaultValue: 0 },
  { name: "unknownDword10", type: "uint32", defaultValue: 0 },
  { name: "unknownDword11", type: "uint32", defaultValue: 0 },
  { name: "unknownDword12", type: "uint32", defaultValue: 0 },
  { name: "unknownDword13", type: "uint32", defaultValue: 0 },
  { name: "unknownDword14", type: "uint32", defaultValue: 0 },
  { name: "unknownDword15", type: "uint32", defaultValue: 0 },
  { name: "unknownDword16", type: "uint32", defaultValue: 0 },
];
const baseItemDefinitionSchema = [
  { name: "itemId", type: "uint32", defaultValue: 0 },
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
  { name: "flags3", type: "uint8", defaultValue: 0 },
  { name: "nameId", type: "uint32", defaultValue: 0 },
  { name: "descriptionId", type: "uint32", defaultValue: 0 },
  { name: "contentId", type: "uint32", defaultValue: 0 },
  { name: "imageSetId", type: "uint32", defaultValue: 0 },
  { name: "unknown4", type: "uint32", defaultValue: 0 },
  { name: "hudImageSetId", type: "uint32", defaultValue: 0 },
  { name: "unknown6", type: "uint32", defaultValue: 0 },
  { name: "unknown7", type: "uint32", defaultValue: 0 },
  { name: "cost", type: "uint32", defaultValue: 0 },
  { name: "itemClass", type: "uint32", defaultValue: 0 },
  { name: "profileOverride", type: "uint32", defaultValue: 0 },
  { name: "slot", type: "uint32", defaultValue: 0 },
  { name: "unknownDword1", type: "uint32", defaultValue: 0 },
  { name: "modelName", type: "string", defaultValue: "" },
  { name: "textureAlias", type: "string", defaultValue: "" },
  { name: "unknown13", type: "uint8", defaultValue: 0 },
  { name: "unknown14", type: "uint32", defaultValue: 0 },
  { name: "categoryId", type: "uint32", defaultValue: 0 },
  { name: "unknown16", type: "uint32", defaultValue: 0 },
  { name: "unknown17", type: "uint32", defaultValue: 0 },
  { name: "unknown18", type: "uint32", defaultValue: 0 },
  { name: "minProfileRank", type: "uint32", defaultValue: 0 },
  { name: "unknown19", type: "uint32", defaultValue: 0 },
  { name: "activatableAbililtyId", type: "uint32", defaultValue: 0 },
  { name: "passiveAbilityId", type: "uint32", defaultValue: 0 },
  { name: "passiveAbilitySetId", type: "uint32", defaultValue: 0 },
  { name: "maxStackable", type: "uint32", defaultValue: 0 },
  { name: "tintAlias", type: "string", defaultValue: "" },
  { name: "unknown23", type: "uint32", defaultValue: 0 },
  { name: "unknown24", type: "uint32", defaultValue: 0 },
  { name: "unknown25", type: "uint32", defaultValue: 0 },
  { name: "unknown26", type: "uint32", defaultValue: 0 },
  { name: "uiModelCameraId", type: "uint32", defaultValue: 0 },
  { name: "equipCountMax", type: "uint32", defaultValue: 0 },
  { name: "currencyType", type: "uint32", defaultValue: 0 },
  { name: "dataSheetId", type: "uint32", defaultValue: 0 },
  { name: "itemType", type: "uint32", defaultValue: 0 },
  { name: "skillSetId", type: "uint32", defaultValue: 0 },
  { name: "overlayTexture", type: "string", defaultValue: "" },
  { name: "decalSlot", type: "string", defaultValue: "" },
  { name: "overlayAdjustment", type: "uint32", defaultValue: 0 },
  { name: "trialDurationSec", type: "uint32", defaultValue: 0 },
  { name: "nextTrialDelaySec", type: "uint32", defaultValue: 0 },
  { name: "clientUseRequirementId", type: "uint32", defaultValue: 0 },
  { name: "overrideAppearance", type: "string", defaultValue: "" },
  { name: "unknown35", type: "uint32", defaultValue: 0 },
  { name: "unknown36", type: "uint32", defaultValue: 0 },
  { name: "param1", type: "uint32", defaultValue: 0 },
  { name: "param2", type: "uint32", defaultValue: 0 },
  { name: "param3", type: "uint32", defaultValue: 0 },
  { name: "uiModelCameraId2", type: "uint32", defaultValue: 0 },
  { name: "unknown41", type: "uint32", defaultValue: 0 },
];

const identitySchema = [
  { name: "unknownDword1", type: "uint32", defaultValue: 0 },
  { name: "unknownDword2", type: "uint32", defaultValue: 0 },
  { name: "unknownDword3", type: "uint32", defaultValue: 0 },
  { name: "characterFirstName", type: "string", defaultValue: "" },
  { name: "characterLastName", type: "string", defaultValue: "" },
  { name: "unknownString1", type: "string", defaultValue: "" },
  { name: "characterName", type: "string", defaultValue: "unnamed" },
  { name: "unknownQword1", type: "uint64string", defaultValue: "0" },
];

const lightWeightPcSchema = [
  { name: "guid", type: "uint64string", defaultValue: "0" },
  {
    name: "transientId",
    type: "custom",
    parser: readUnsignedIntWith2bitLengthValue,
    packer: packUnsignedIntWith2bitLengthValue,
  },
  {
    name: "identity",
    type: "schema",
    fields: identitySchema,
  },
  { name: "unknownByte2", type: "uint8", defaultValue: 0 },
  { name: "modelId", type: "uint32", defaultValue: 9240 },
  { name: "unknownDword2", type: "uint32", defaultValue: 0 },
  { name: "position", type: "floatvector3", defaultValue: [0, 80, 0] },
  { name: "rotation", type: "floatvector4", defaultValue: [0, 80, 0, 1] },
  { name: "unknownDword3", type: "uint32", defaultValue: 0 },
  { name: "mountGuid", type: "uint64string", defaultValue: "0x0000000000000000" },
  { name: "mountRelatedDword1", type: "uint32", defaultValue: 0 },
  { name: "mountRelatedDword2", type: "uint32", defaultValue: 0 },
  { name: "unknownByte3", type: "uint8", defaultValue: 0 },
  { name: "unknownDword6", type: "uint32", defaultValue: 0 },
  { name: "unknownDword7", type: "uint32", defaultValue: 0 },
  { name: "unknownQword2", type: "uint64string", defaultValue: "0x0000000000000000" },
  { name: "unknownDword8", type: "uint32", defaultValue: 0 },
  { name: "unknownByte4", type: "uint8", defaultValue: 0 },
];

const lightWeightNpcSchema = [
  { name: "characterId", type: "uint64string", defaultValue: "0x0000000000000000" },
  {
    name: "transientId",
    type: "custom",
    parser: readUnsignedIntWith2bitLengthValue,
    packer: packUnsignedIntWith2bitLengthValue,
  },
  { name: "unknownString1", type: "string", defaultValue: "" },
  { name: "nameId", type: "uint32", defaultValue: 0 },
  { name: "unknownByte1", type: "uint8", defaultValue: 0 },
  { name: "modelId", type: "uint32", defaultValue: 0 },
  { name: "scale", type: "floatvector4", defaultValue: [1, 1, 1, 1] },
  { name: "texture", type: "string", defaultValue: "" },
  { name: "unknownString2", type: "string", defaultValue: "" },
  { name: "unknownDword1", type: "uint32", defaultValue: 0 },
  { name: "position", type: "floatvector3", defaultValue: [1, 1, 1] },
  { name: "rotation", type: "floatvector4", defaultValue: [0, 50, 0, 1] },
  {
    name: "unknownFloatVector4",
    type: "floatvector4",
    defaultValue: [1, 1, 1, 1],
  },
  { name: "unknownDword2", type: "uint32", defaultValue: 0 },
  { name: "unknownDword3", type: "uint32", defaultValue: 0 },
  { name: "headActor", type: "string", defaultValue: "" },
  { name: "unknownString3", type: "string", defaultValue: "" },
  { name: "unknownString4", type: "string", defaultValue: "" },
  { name: "vehicleId", type: "uint32", defaultValue: 0 },
  { name: "unknownDword5", type: "uint32", defaultValue: 0 },
  { name: "npcDefinitionId", type: "uint32", defaultValue: 0 },
  { name: "unknownByte2", type: "uint8", defaultValue: 0 },
  { name: "unknownDword7", type: "uint32", defaultValue: 0 },
  { name: "unknownBoolean1", type: "boolean", defaultValue: 0 },
  {
    name: "color",
    type: "schema",
    fields: [
      { name: "r", type: "uint8", defaultValue: 0 },
      { name: "g", type: "uint8", defaultValue: 0 },
      { name: "b", type: "uint8", defaultValue: 0 },
    ],
  },
  { name: "unknownByte3", type: "uint8", defaultValue: 0 },
  { name: "unknownDword8", type: "uint32", defaultValue: 0 },
  { name: "unknownQword1", type: "uint64string", defaultValue: "0x0000000000000000" },
  {
    name: "attachedObject",
    type: "schema",
    fields: [
      {
        name: "targetObjectId",
        type: "uint64string",
        defaultValue: "0x0000000000000000",
      },
      /*{ name: "unknownFloatVector41", type: "floatvector4", defaultValue: [0, 0, 0, 1] },
            { name: "unknownFloatVector42", type: "floatvector4", defaultValue: [0, 0, 0, 1] },
            { name: "unknownDword1", type: "uint32", defaultValue: 0 },
            {
                name: "unknownData1",
                type: "schema",
                fields: [
                    { name: "unknownWord1", type: "uint16", defaultValue: 0 },
                    //{ name: "unknownDword1", type: "uint32", defaultValue: 0 }, // this value is read only if (unknownWord1 & 0x4000) == true
                ]
            },
            { name: "unknownDword2", type: "uint32", defaultValue: 0 },*/
    ],
  },
  { name: "unknownDword9", type: "uint32", defaultValue: 0 },
  { name: "unknownDword10", type: "uint32", defaultValue: 0 },
  { name: "unknownQword2", type: "uint64string", defaultValue: "0x0000000000000000" },
  { name: "unknownDword11", type: "uint32", defaultValue: 0 },
  { name: "unknownDword12", type: "uint32", defaultValue: 0 },
  { name: "unknownDword13", type: "uint32", defaultValue: 0 },
  { name: "unknownDword14", type: "uint32", defaultValue: 0 },
  { name: "unknownDword15", type: "uint32", defaultValue: 0 },
];

const itemBaseSchema = [
  { name: "itemId", type: "uint32", defaultValue: 0 },
  { name: "unknownDword2", type: "uint32", defaultValue: 0 },
  { name: "unknownGuid1", type: "uint64string", defaultValue: "0" },
  { name: "unknownDword3", type: "uint32", defaultValue: 0 },
  { name: "unknownDword4", type: "uint32", defaultValue: 0 },
  { name: "unknownDword5", type: "uint32", defaultValue: 0 },
  { name: "unknownDword6", type: "uint32", defaultValue: 0 },
  { name: "unknownBoolean1", type: "boolean", defaultValue: false },
  { name: "unknownDword7", type: "uint32", defaultValue: 0 },
  { name: "unknownByte1", type: "uint8", defaultValue: 0 },
  {
    name: "unknownData",
    type: "variabletype8",
    types: {
      0: [],
      1: [
        { name: "unknownDword1", type: "uint32", defaultValue: 0 },
        { name: "unknownDword2", type: "uint32", defaultValue: 0 },
        { name: "unknownDword3", type: "uint32", defaultValue: 0 },
      ],
    },
  },
];
const effectTagsSchema = [
  { name: "unknownDword1", type: "uint32", defaultValue: 0 },
  { name: "unknownDword2", type: "uint32", defaultValue: 0 },
  { name: "unknownDword3", type: "uint32", defaultValue: 0 },
  { name: "unknownDword4", type: "uint32", defaultValue: 0 },
  { name: "unknownDword5", type: "uint32", defaultValue: 0 },
  { name: "unknownDword6", type: "uint32", defaultValue: 0 },
  { name: "unknownDword7", type: "uint32", defaultValue: 0 },
  { name: "unknownDword8", type: "uint32", defaultValue: 0 },
  { name: "unknownDword9", type: "uint32", defaultValue: 0 },
  { name: "unknownDword10", type: "uint32", defaultValue: 0 },
  { name: "unknownDword11", type: "uint32", defaultValue: 0 },
  { name: "unknownQword1", type: "uint64string", defaultValue: "0" },
  { name: "unknownQword2", type: "uint64string", defaultValue: "0" },
  { name: "unknownQword3", type: "uint64string", defaultValue: "0" },
  { name: "unknownQword4", type: "uint64string", defaultValue: "0" },
  { name: "unknownDword12", type: "uint32", defaultValue: 0 },
  { name: "unknownDword13", type: "uint32", defaultValue: 0 },
  { name: "unknownDword14", type: "uint32", defaultValue: 0 },
  { name: "unknownDword15", type: "uint32", defaultValue: 0 },
  { name: "unknownDword16", type: "uint32", defaultValue: 0 },
  { name: "unknownDword17", type: "uint32", defaultValue: 0 },
  { name: "unknownDword18", type: "uint32", defaultValue: 0 },
  { name: "unknownQword5", type: "uint64string", defaultValue: "0" },
  { name: "unknownDword19", type: "uint32", defaultValue: 0 },
  { name: "unknownDword20", type: "uint32", defaultValue: 0 },
  { name: "unknownByte1", type: "uint8", defaultValue: 0 },
  { name: "unknownDword21", type: "uint32", defaultValue: 0 },
  { name: "unknownQword6", type: "uint64string", defaultValue: "0" },
  { name: "unknownQword7", type: "uint64string", defaultValue: "0" },
  { name: "unknownDword22", type: "uint32", defaultValue: 0 },
  { name: "unknownQword8", type: "uint64string", defaultValue: "0" },
  { name: "unknownDword23", type: "uint32", defaultValue: 0 },
];

const itemDetailSchema = [
  { name: "unknownBoolean1", type: "boolean", defaultValue: false },
];
const statDataSchema = [
  { name: "statId", type: "uint32", defaultValue: 0 },
  {
    name: "statValue",
    type: "variabletype8",
    types: {
      0: [
        { name: "baseValue", type: "uint32", defaultValue: 0 },
        { name: "modifierValue", type: "uint32", defaultValue: 0 },
      ],
      1: [
        { name: "baseValue", type: "float", defaultValue: 0.0 },
        { name: "modifierValue", type: "float", defaultValue: 0.0 },
      ],
    },
  },
];
const itemWeaponDetailSubSchema1 = [
  { name: "statOwnerId", type: "uint32", defaultValue: 0 },
  { name: "statData", type: "schema", fields: statDataSchema },
];
const itemWeaponDetailSubSchema2 = [
  { name: "unknownDword1", type: "uint32", defaultValue: 0 },
  {
    name: "unknownArray1",
    type: "array",
    defaultValue: [{}],
    fields: [
      { name: "unknownDword1", type: "uint32", defaultValue: 0 },
      {
        name: "unknownArray1",
        type: "array",
        defaultValue: [{}],
        fields: itemWeaponDetailSubSchema1,
      },
    ],
  },
];
const itemWeaponDetailSchema = [
  { name: "unknownBoolean1", type: "boolean", defaultValue: false },
  {
    name: "unknownArray1",
    type: "array",
    defaultValue: [{}],
    fields: [
      { name: "unknownDword1", type: "uint32", defaultValue: 0 },
      { name: "unknownDword2", type: "uint32", defaultValue: 0 },
    ],
  },
  {
    name: "unknownArray2",
    type: "array8",
    fields: [
      { name: "unknownDword1", type: "uint32", defaultValue: 0 },
      {
        name: "unknownArray1",
        type: "array8",
        fields: [
          { name: "unknownByte1", type: "uint8", defaultValue: 0 },
          { name: "unknownDword1", type: "uint32", defaultValue: 0 },
          { name: "unknownDword2", type: "uint32", defaultValue: 0 },
          { name: "unknownDword3", type: "uint32", defaultValue: 0 },
        ],
      },
    ],
  },
  { name: "unknownByte1", type: "uint8", defaultValue: 0 },
  { name: "unknownByte2", type: "uint8", defaultValue: 0 },
  { name: "unknownDword1", type: "uint32", defaultValue: 0 },
  { name: "unknownByte3", type: "uint8", defaultValue: 0 },
  { name: "unknownFloat1", type: "float", defaultValue: 0.0 },
  { name: "unknownByte4", type: "uint8", defaultValue: 0 },
  { name: "unknownDword2", type: "uint32", defaultValue: 0 },
  {
    name: "unknownArray3",
    type: "array",
    defaultValue: [{}],
    fields: itemWeaponDetailSubSchema1,
  },
  {
    name: "unknownArray4",
    type: "array",
    defaultValue: [{}],
    fields: itemWeaponDetailSubSchema2,
  },
];
const weaponPackets = [
  [
    "Weapon.FireStateUpdate",
    0x8201,
    {
      fields: [
        { name: "guid", type: "uint64string", defaultValue: "0" },
        { name: "unknownByte1", type: "uint8", defaultValue: 0 },
        { name: "unknownByte2", type: "uint8", defaultValue: 0 },
      ],
    },
  ],
  ["Weapon.FireStateTargetedUpdate", 0x8202, {}],
  [
    "Weapon.Fire",
    0x8203,
    {
      fields: [
        { name: "guid", type: "uint64string", defaultValue: "0" },
        { name: "position", type: "floatvector3", defaultValue: [0, 0, 0] },
        { name: "unknownDword1", type: "uint32", defaultValue: 0 },
        { name: "unknownDword2", type: "uint32", defaultValue: 0 },
        { name: "unknownDword3", type: "uint32", defaultValue: 0 },
      ],
    },
  ],
  ["Weapon.FireWithDefinitionMapping", 0x8204, {}],
  ["Weapon.FireNoProjectile", 0x8205, {}],
  ["Weapon.ProjectileHitReport", 0x8206, {}],
  [
    "Weapon.ReloadRequest",
    0x8207,
    {
      fields: [{ name: "guid", type: "uint64string", defaultValue: "0" }],
    },
  ],
  ["Weapon.Reload", 0x8208, {}],
  ["Weapon.ReloadInterrupt", 0x8209, {}],
  ["Weapon.ReloadComplete", 0x820a, {}],
  [
    "Weapon.SwitchFireModeRequest",
    0x820b,
    {
      fields: [
        { name: "guid", type: "uint64string", defaultValue: "0" },
        { name: "unknownByte1", type: "uint8", defaultValue: 0 },
        { name: "unknownByte2", type: "uint8", defaultValue: 0 },
        { name: "unknownByte3", type: "uint8", defaultValue: 0 },
      ],
    },
  ],
  ["Weapon.LockOnGuidUpdate", 0x820c, {}],
  ["Weapon.LockOnLocationUpdate", 0x820d, {}],
  [
    "Weapon.StatUpdate",
    0x820e,
    {
      fields: [
        {
          name: "statData",
          type: "array",
          defaultValue: [{}],
          fields: [
            { name: "guid", type: "uint64string", defaultValue: "0" },
            { name: "unknownBoolean1", type: "boolean", defaultValue: false },
            {
              name: "statUpdates",
              type: "array",
              defaultValue: [{}],
              fields: [
                { name: "statCategory", type: "uint8", defaultValue: 0 },
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
  ["Weapon.DebugProjectile", 0x820f, {}],
  ["Weapon.AddFireGroup", 0x8210, {}],
  ["Weapon.RemoveFireGroup", 0x8211, {}],
  ["Weapon.ReplaceFireGroup", 0x8212, {}],
  ["Weapon.GuidedUpdate", 0x8213, {}],
  ["Weapon.RemoteWeapon.Reset", 0x821401, {}],
  ["Weapon.RemoteWeapon.AddWeapon", 0x821402, {}],
  ["Weapon.RemoteWeapon.RemoveWeapon", 0x821403, {}],
  [
    "Weapon.RemoteWeapon.Update",
    0x821404,
    {
      fields: [
        {
          name: "unknownUint1",
          type: "custom",
          parser: readUnsignedIntWith2bitLengthValue,
          packer: packUnsignedIntWith2bitLengthValue,
        },
        { name: "unknownByte1", type: "uint8", defaultValue: 0 },
        { name: "unknownQword1", type: "uint64string", defaultValue: "0" },
        { name: "unknownByte2", type: "uint8", defaultValue: 0 },
        {
          name: "unknownUint2",
          type: "custom",
          parser: readUnsignedIntWith2bitLengthValue,
          packer: packUnsignedIntWith2bitLengthValue,
        },
      ],
    },
  ],
  ["Weapon.RemoteWeapon.Update.FireState", 0x82140401, {}],
  ["Weapon.RemoteWeapon.Update.Empty", 0x82140402, {}],
  ["Weapon.RemoteWeapon.Update.Reload", 0x82140403, {}],
  ["Weapon.RemoteWeapon.Update.ReloadLoopEnd", 0x82140404, {}],
  ["Weapon.RemoteWeapon.Update.ReloadInterrupt", 0x82140405, {}],
  ["Weapon.RemoteWeapon.Update.SwitchFireMode", 0x82140406, {}],
  ["Weapon.RemoteWeapon.Update.StatUpdate", 0x82140407, {}],
  ["Weapon.RemoteWeapon.Update.AddFireGroup", 0x82140408, {}],
  ["Weapon.RemoteWeapon.Update.RemoveFireGroup", 0x82140409, {}],
  ["Weapon.RemoteWeapon.Update.ReplaceFireGroup", 0x8214040a, {}],
  ["Weapon.RemoteWeapon.Update.ProjectileLaunch", 0x8214040b, {}],
  ["Weapon.RemoteWeapon.Update.Chamber", 0x8214040c, {}],
  ["Weapon.RemoteWeapon.Update.Throw", 0x8214040d, {}],
  ["Weapon.RemoteWeapon.Update.Trigger", 0x8214040e, {}],
  ["Weapon.RemoteWeapon.Update.ChamberInterrupt", 0x8214040f, {}],
  ["Weapon.RemoteWeapon.ProjectileLaunchHint", 0x821405, {}],
  ["Weapon.RemoteWeapon.ProjectileDetonateHint", 0x821406, {}],
  ["Weapon.RemoteWeapon.ProjectileRemoteContactReport", 0x821407, {}],
  ["Weapon.ChamberRound", 0x8215, {}],
  ["Weapon.GuidedSetNonSeeking", 0x8216, {}],
  ["Weapon.ChamberInterrupt", 0x8217, {}],
  ["Weapon.GuidedExplode", 0x8218, {}],
  ["Weapon.DestroyNpcProjectile", 0x8219, {}],
  ["Weapon.WeaponToggleEffects", 0x821a, {}],
  [
    "Weapon.Reset",
    0x821b,
    {
      fields: [
        { name: "unknownQword1", type: "uint64string", defaultValue: "0" },
        { name: "unknownBoolean1", type: "boolean", defaultValue: false },
        { name: "unknownByte1", type: "uint8", defaultValue: 0 },
      ],
    },
  ],
  ["Weapon.ProjectileSpawnNpc", 0x821c, {}],
  ["Weapon.FireRejected", 0x821d, {}],
  [
    "Weapon.MultiWeapon",
    0x821e,
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
  ["Weapon.WeaponFireHint", 0x821f, {}],
  ["Weapon.ProjectileContactReport", 0x8220, {}],
  ["Weapon.MeleeHitMaterial", 0x8221, {}],
  ["Weapon.ProjectileSpawnAttachedNp", 0x8222, {}],
  ["Weapon.AddDebugLogEntry", 0x8223, {}],
];
const [weaponPacketTypes, weaponPacketDescriptors] =
  PacketTableBuild(weaponPackets);
function parseMultiWeaponPacket(data: Buffer, offset: number) {
  const startOffset = offset,
    packets = [];
  const n = data.readUInt32LE(offset);
  offset += 4;
  for (let i = 0; i < n; i++) {
    const size = data.readUInt32LE(offset);
    offset += 4;
    const subData = data.slice(offset, offset + size);
    offset += size;
    packets.push(parseWeaponPacket(subData, 2).value);
  }
  return {
    value: packets,
    length: startOffset - offset,
  };
}
function packMultiWeaponPacket() {}
function parseWeaponPacket(data: Buffer, offset: number) {
  const obj: any = {};
  obj.gameTime = data.readUInt32LE(offset);
  const tmpData = data.slice(offset + 4);
  const weaponPacketData = new (Buffer.alloc as any)(tmpData.length + 1);
  weaponPacketData.writeUInt8(0x85, 0);
  tmpData.copy(weaponPacketData, 1);
  const weaponPacket = readPacketType(
    weaponPacketData,
    weaponPacketDescriptors
  );
  if (weaponPacket.packet) {
    obj.packetType = weaponPacket.packetType;
    obj.packetName = weaponPacket.packet.name;
    if (weaponPacket.packet.schema) {
      obj.packet = DataSchema.parse(
        weaponPacket.packet.schema,
        weaponPacketData,
        weaponPacket.length,
        null
      ).result;
    }
  } else {
    obj.packetType = weaponPacket.packetType;
    obj.packetData = data;
  }
  return {
    value: obj,
    length: data.length - offset,
  };
}
function packWeaponPacket(obj: any) {
  const subObj = obj.packet,
    subName = obj.packetName,
    subType = weaponPacketTypes[subName];
  let data;
  if (weaponPacketDescriptors[subType]) {
    const subPacket = weaponPacketDescriptors[subType],
      subTypeData = writePacketType(subType);
    let subData = DataSchema.pack(subPacket.schema, subObj).data;
    subData = Buffer.concat([subTypeData.slice(1), subData]);
    data = new (Buffer.alloc as any)(subData.length + 4);
    data.writeUInt32LE((obj.gameTime & 0xffffffff) >>> 0, 0);
    subData.copy(data, 4);
  } else {
    throw "Unknown weapon packet type: " + subType;
  }
  return data;
}
function parseItemData(data: Buffer, offset: number, referenceData: any) {
  const startOffset = offset;
  let detailItem, detailSchema;
  const baseItem = DataSchema.parse(itemBaseSchema, data, offset);
  offset += baseItem.length;
  if (
    referenceData &&
    referenceData.itemTypes[baseItem.result.itemId] === "Weapon"
  ) {
    detailSchema = itemWeaponDetailSchema;
  } else {
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
function packItemData(obj: any, referenceData: any) {
  const baseData = DataSchema.pack(itemBaseSchema, obj.baseItem);
  let detailData, detailSchema;
  if (
    referenceData &&
    referenceData.itemTypes[obj.baseItem.itemId] === "Weapon"
  ) {
    detailSchema = itemWeaponDetailSchema;
  } else {
    detailSchema = itemDetailSchema;
  }
  detailData = DataSchema.pack(detailSchema, obj.detail);
  return Buffer.concat([baseData.data, detailData.data]);
}

const rewardBundleDataSchema = [
  { name: "unknownBoolean1", type: "boolean", defaultValue: false },
  {
    name: "currency",
    type: "array",
    fields: [
      { name: "currencyId", type: "uint32", defaultValue: 0 },
      { name: "quantity", type: "uint32", defaultValue: 0 },
    ],
    defaultValue: [{}],
  },
  { name: "unknownDword1", type: "uint32", defaultValue: 0 },
  { name: "unknownDword2", type: "uint32", defaultValue: 0 },
  { name: "unknownDword3", type: "uint32", defaultValue: 0 },
  { name: "unknownDword4", type: "uint32", defaultValue: 0 },
  { name: "unknownDword5", type: "uint32", defaultValue: 0 },
  { name: "unknownDword6", type: "uint32", defaultValue: 0 },
  { name: "time", type: "uint64string", defaultValue: "0" },
  { name: "characterId", type: "uint64string", defaultValue: "0" },
  { name: "nameId", type: "uint32", defaultValue: 0 },
  { name: "unknownDword7", type: "uint32", defaultValue: 0 },
  { name: "imageSetId", type: "uint32", defaultValue: 0 },
  { name: "entriesArrLength", type: "uint32", defaultValue: 0 },
  /* INGORE THIS FOR NOW, CAN'T FIND READ FUNCTION (length set to 0 for now)
  {
      name: "entries",
      type: "array",
      defaultValue: [{}],
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
                              {
                                  name: "unknownBoolean1",
                                  type: "boolean",
                                  defaultValue: false,
                              },
                              { name: "imageSetId", type: "uint32", defaultValue: 0 },
                              { name: "unknownDword1", type: "uint32", defaultValue: 0 },
                              { name: "nameId", type: "uint32", defaultValue: 0 },
                              { name: "quantity", type: "uint32", defaultValue: 0 },
                              { name: "itemId", type: "uint32", defaultValue: 0 },
                              { name: "unknownDword2", type: "uint32", defaultValue: 0 },
                              { name: "unknownString1", type: "string", defaultValue: "" },
                              { name: "unknownDword3", type: "uint32", defaultValue: 0 },
                              { name: "unknownDword4", type: "uint32", defaultValue: 0 },
                          ],
                      },
                  ],
              },
          },
      ],
  },
  */
  { name: "unknownDword8", type: "uint32", defaultValue: 0 },
];
const collectionsSchema = [
  { name: "unknownDword1", type: "uint32", defaultValue: 0 },
  { name: "unknownDword2", type: "uint32", defaultValue: 0 },
  { name: "unknownDword3", type: "uint32", defaultValue: 0 },
  { name: "unknownDword4", type: "uint32", defaultValue: 0 },
  { name: "unknownDword5", type: "uint32", defaultValue: 0 },
  { name: "unknownDword6", type: "uint32", defaultValue: 0 },
  { name: "unknownDword7", type: "uint32", defaultValue: 0 },
  { name: "reward", type: "schema", fields: rewardBundleDataSchema },
  {
    name: "unknownArray2",
    type: "array",
    defaultValue: [{}],
    fields: [
      { name: "unknownDword1", type: "uint32", defaultValue: 1 },
      {
        name: "unknownData1",
        type: "schema",
        fields: [
          { name: "unknownDword1", type: "uint32", defaultValue: 0 },
          { name: "unknownDword2", type: "uint32", defaultValue: 0 },
          { name: "unknownDword3", type: "uint32", defaultValue: 0 },
          { name: "unknownDword4", type: "uint32", defaultValue: 0 },
          { name: "unknownDword5", type: "uint32", defaultValue: 0 },
          { name: "unknownDword6", type: "uint32", defaultValue: 0 },
          { name: "unknownDword7", type: "uint32", defaultValue: 0 },
          { name: "unknownBoolean1", type: "boolean", defaultValue: true },
        ],
      },
    ],
  },
];

const objectiveDataSchema = [
  { name: "objectiveId", type: "uint32", defaultValue: 0 },
  { name: "nameId", type: "uint32", defaultValue: 0 },
  { name: "descriptionId", type: "uint32", defaultValue: 0 },
  { name: "rewardData", type: "schema", fields: rewardBundleDataSchema },
  { name: "unknownByte1", type: "uint8", defaultValue: 0 },
  { name: "unknownDword3", type: "uint32", defaultValue: 0 },
  { name: "unknownDword4", type: "uint32", defaultValue: 0 },
  { name: "unknownByte2", type: "uint8", defaultValue: 0 },
  { name: "unknownByte3", type: "uint8", defaultValue: 0 },
  {
    name: "unknownData1",
    type: "schema",
    fields: [
      { name: "unknownDword1", type: "uint32", defaultValue: 0 },
      { name: "unknownDword2", type: "uint32", defaultValue: 0 },
      { name: "unknownDword3", type: "uint32", defaultValue: 0 },
      { name: "unknownDword4", type: "uint32", defaultValue: 0 },
    ],
  },
  { name: "unknownByte4", type: "uint8", defaultValue: 0 },
];
const achievementDataSchema = [
  { name: "achievementId", type: "uint32", defaultValue: 0 },
  { name: "unknownBoolean1", type: "uint32", defaultValue: 0 },
  { name: "nameId", type: "uint32", defaultValue: 0 },
  { name: "descriptionId", type: "uint32", defaultValue: 0 },
  { name: "timeStarted", type: "uint64string", defaultValue: "0" },
  { name: "timeFinished", type: "uint64string", defaultValue: "0" },
  { name: "progress", type: "float", defaultValue: 0.0 },
  {
    name: "objectives",
    type: "array",
    defaultValue: [{}],
    fields: [
      { name: "index", type: "uint32", defaultValue: 0 },
      { name: "objectiveData", type: "schema", fields: objectiveDataSchema },
    ],
  },
  { name: "iconId", type: "uint32", defaultValue: 0 },
  { name: "unknownDword5", type: "uint32", defaultValue: 0 },
  { name: "unknownDword6", type: "uint32", defaultValue: 0 },
  { name: "points", type: "uint32", defaultValue: 0 },
  { name: "unknownDword8", type: "uint32", defaultValue: 0 },
  { name: "unknownBoolean2", type: "boolean", defaultValue: false },
  { name: "unknownDword9", type: "uint32", defaultValue: 0 },
];
/*
const loadoutDataSubSchema1 = [
  { name: "loadoutId", type: "uint32", defaultValue: 0 },
  {
    name: "unknownData1",
    type: "schema",
    fields: [
      { name: "unknownDword1", type: "uint32", defaultValue: 0 },
      { name: "unknownByte1", type: "uint8", defaultValue: 0 },
    ],
  },
  { name: "unknownDword2", type: "uint32", defaultValue: 0 },
  {
    name: "unknownData2",
    type: "schema",
    fields: [
      { name: "unknownDword1", type: "uint32", defaultValue: 0 },
      { name: "loadoutName", type: "string", defaultValue: "" },
    ],
  },
  { name: "tintItemId", type: "uint32", defaultValue: 0 },
  { name: "unknownDword4", type: "uint32", defaultValue: 0 },
  { name: "decalItemId", type: "uint32", defaultValue: 0 },
  {
    name: "loadoutSlots",
    type: "array",
    defaultValue: [{}],
    fields: [
      { name: "loadoutSlotId", type: "uint32", defaultValue: 0 },
      {
        name: "loadoutSlotData",
        type: "schema",
        fields: [
          { name: "index", type: "uint32", defaultValue: 0 },
          {
            name: "loadoutSlotItem",
            type: "schema",
            fields: [
              { name: "itemLineId", type: "uint32", defaultValue: 0 },
              { name: "flags", type: "uint8", defaultValue: 0 },
              {
                name: "attachments",
                type: "array",
                defaultValue: [{}],
                fields: [
                  { name: "attachmentId", type: "uint32", defaultValue: 0 },
                ],
              },
              {
                name: "attachmentClasses",
                type: "array",
                defaultValue: [{}],
                fields: [
                  { name: "classId", type: "uint32", defaultValue: 0 },
                  { name: "attachmentId", type: "uint32", defaultValue: 0 },
                ],
              },
            ],
          },
          { name: "tintItemId", type: "uint32", defaultValue: 0 },
          { name: "itemSlot", type: "uint32", defaultValue: 0 },
        ],
      },
    ],
  },
];
const loadoutDataSubSchema2 = [
  { name: "unknownDword1", type: "uint32", defaultValue: 0 },
  {
    name: "unknownData1",
    type: "schema",
    fields: [
      { name: "unknownDword1", type: "uint32", defaultValue: 0 },
      { name: "unknownByte1", type: "uint8", defaultValue: 0 },
    ],
  },
  { name: "unknownString1", type: "string", defaultValue: "" },
  { name: "unknownDword2", type: "uint32", defaultValue: 0 },
  { name: "unknownDword3", type: "uint32", defaultValue: 0 },
  { name: "unknownDword4", type: "uint32", defaultValue: 0 },
  { name: "unknownDword5", type: "uint32", defaultValue: 0 },
  {
    name: "unknownArray1",
    type: "array",
    defaultValue: [{}],
    fields: [
      { name: "unknownDword1", type: "uint32", defaultValue: 0 },
      {
        name: "unknownData1",
        type: "schema",
        fields: [
          { name: "unknownDword1", type: "uint32", defaultValue: 0 },
          {
            name: "unknownData1",
            type: "schema",
            fields: [
              { name: "unknownDword1", type: "uint32", defaultValue: 0 },
              { name: "unknownByte1", type: "uint8", defaultValue: 0 },
              {
                name: "unknownArray1",
                type: "array",
                defaultValue: [{}],
                fields: [
                  { name: "unknownDword1", type: "uint32", defaultValue: 0 },
                ],
              },
              {
                name: "unknownArray2",
                type: "array",
                defaultValue: [{}],
                fields: [
                  { name: "unknownDword1", type: "uint32", defaultValue: 0 },
                  { name: "unknownDword2", type: "uint32", defaultValue: 0 },
                ],
              },
            ],
          },
          { name: "unknownDword2", type: "uint32", defaultValue: 0 },
          { name: "unknownDword3", type: "uint32", defaultValue: 0 },
        ],
      },
    ],
  },
];
*/

const equipmentModelSchema = [
  { name: "modelName", type: "string", defaultValue: "" },
  { name: "defaultTextureAlias", type: "string", defaultValue: "#" },
  { name: "unknownString3", type: "string", defaultValue: "" },
  { name: "unknownString4", type: "string", defaultValue: "#" },
  { name: "unknownDword1", type: "uint32", defaultValue: 0 },
  { name: "unknownDword2", type: "uint32", defaultValue: 0 },
  { name: "effectId", type: "uint32", defaultValue: 0 },
  { name: "slotId", type: "uint32", defaultValue: 0 },
  { name: "unknownDword4", type: "uint32", defaultValue: 0 },
  {
    name: "unknownArray1",
    type: "array",
    defaultValue: [],
    fields: [{ name: "unknownDword1", type: "uint32", defaultValue: 252 }],
  },
  { name: "unknownBool1", type: "boolean", defaultValue: false },
];

const fullNpcDataSchema = [
  {
    name: "transient_id",
    type: "custom",
    parser: readUnsignedIntWith2bitLengthValue,
    packer: packUnsignedIntWith2bitLengthValue,
    defaultValue: 115,
  },
  { name: "unknownDword1", type: "uint32", defaultValue: 0 },
  { name: "unknownDword2", type: "uint32", defaultValue: 0 },
  { name: "unknownDword3", type: "uint32", defaultValue: 0 },
  {
    name: "equipmentModels",
    type: "array",
    defaultValue: [{}],
    fields: equipmentModelSchema,
  },
  { name: "unknownString1", type: "string", defaultValue: "" },
  { name: "unknownString2", type: "string", defaultValue: "" },
  { name: "unknownDword4", type: "uint32", defaultValue: 0 },
  { name: "unknownFloat1", type: "float", defaultValue: 0.0 },
  { name: "unknownDword5", type: "uint32", defaultValue: 0 },
  { name: "unknownVector1", type: "floatvector3", defaultValue: [0, 0, 0] },
  { name: "unknownVector2", type: "floatvector3", defaultValue: [0, 0, 0] },
  { name: "unknownFloat2", type: "float", defaultValue: 0.0 },
  { name: "unknownDword6", type: "uint32", defaultValue: 0 },
  { name: "unknownDword7", type: "uint32", defaultValue: 0 },
  {
    name: "effectTags",
    type: "array",
    defaultValue: [{}],
    fields: effectTagsSchema,
  },
  {
    name: "unknownData1",
    type: "schema",
    fields: [
      { name: "unknownDword1", type: "uint32", defaultValue: 0 },
      { name: "unknownString1", type: "string", defaultValue: "" },
      { name: "unknownString2", type: "string", defaultValue: "" },
      { name: "unknownDword2", type: "uint32", defaultValue: 0 },
      { name: "unknownString3", type: "string", defaultValue: "" },
    ],
  },
  { name: "unknownVector4", type: "floatvector4", defaultValue: [0, 0, 0, 0] },
  { name: "unknownDword8", type: "uint32", defaultValue: 0 },
  { name: "characterId", type: "uint64string", defaultValue: "0" },
  {
    name: "targetData",
    type: "schema",
    fields: [
      { name: "unknownByte1", type: "uint32", defaultValue: 0 },
      {
        name: "unknownVector4",
        type: "floatvector4",
        defaultValue: [0, 0, 0, 0],
      },
      { name: "unknownQword1", type: "uint64string", defaultValue: "0" },
    ],
  },
  {
    name: "unknownArray1",
    type: "array",
    defaultValue: [{}],
    fields: [
      { name: "unknownDword1", type: "uint32", defaultValue: 0 },
      { name: "unknownString1", type: "string", defaultValue: "" },
      { name: "unknownDword2", type: "uint32", defaultValue: 0 },
    ],
  },
  {
    name: "unknownArray2",
    type: "array",
    defaultValue: [{}],
    fields: [
      { name: "unknownDword1", type: "uint32", defaultValue: 0 },
      { name: "unknownString1", type: "string", defaultValue: "" },
      { name: "unknownString2", type: "string", defaultValue: "" },
    ],
  },
  { name: "unknownDword9", type: "uint32", defaultValue: 0 },
  { name: "unknownDword10", type: "uint32", defaultValue: 0 },
  { name: "unknownVector5", type: "floatvector4", defaultValue: [0, 0, 0, 0] },
  { name: "unknownDword11", type: "uint32", defaultValue: 0 },
  { name: "unknownDword12", type: "uint32", defaultValue: 0 },
  { name: "unknownDword13", type: "uint32", defaultValue: 0 },
  { name: "unknownDword14", type: "uint32", defaultValue: 0 },
  { name: "unknownDword15", type: "uint32", defaultValue: 0 },
  { name: "unknownDword16", type: "uint32", defaultValue: 0 },
  { name: "unknownDword17", type: "uint32", defaultValue: 0 },
  { name: "unknownByte1", type: "uint8", defaultValue: 0 },
  { name: "unknownByte2", type: "uint8", defaultValue: 0 },
  { name: "unknownDword18", type: "uint32", defaultValue: 0 },
  { name: "unknownDword19", type: "uint32", defaultValue: 0 },
  { name: "unknownDword20", type: "uint32", defaultValue: 0 },
  { name: "unknownQword1", type: "uint64string", defaultValue: "0" },
  { name: "unknownBytes1", type: "byteswithlength", defaultValue: null },
  { name: "unknownBytes2", type: "byteswithlength", defaultValue: null },
  { name: "unknownBytes3", type: "byteswithlength", defaultValue: null },
  { name: "unknownBytes4", type: "byteswithlength", defaultValue: null },
  { name: "unknownBytes5", type: "byteswithlength", defaultValue: null },
  { name: "unknownBytes6", type: "byteswithlength", defaultValue: null },
  { name: "unknownDword21", type: "uint32", defaultValue: 0 },
];

const fullPcDataSchema = [
  // NOT FINISHED
  { name: "unknownBool1", type: "boolean", defaultValue: false },
  { name: "unknownByte1", type: "uint8", defaultValue: 0 },
  {
    name: "positionUpdate",
    type: "custom",
    parser: readPositionUpdateData,
    packer: packPositionUpdateData,
  },
  { name: "unknownByte2", type: "uint8", defaultValue: 0 },
  { name: "unknownByte3", type: "uint8", defaultValue: 0 },
  { name: "unknownQword1", type: "uint64string", defaultValue: "0" },
  {
    name: "array1",
    type: "array",
    defaultValue: [{}],
    fields: [
      { name: "unknownDword1", type: "uint32", defaultValue: 0 },
      { name: "unknownByte1", type: "uint8", defaultValue: 0 },
      { name: "unknownDword2", type: "uint32", defaultValue: 0 },
      { name: "unknownDword3", type: "uint32", defaultValue: 0 },
    ],
  },
  {
    name: "unknownData1",
    type: "schema",
    fields: [
      {
        name: "transientId",
        type: "custom",
        parser: readUnsignedIntWith2bitLengthValue,
        packer: packUnsignedIntWith2bitLengthValue,
        defaultValue: 0,
      },
      { name: "unknownDword1", type: "uint32", defaultValue: 0 },
      { name: "unknownDword2", type: "uint32", defaultValue: 0 },
      { name: "unknownDword3", type: "uint32", defaultValue: 0 },
      { name: "unknownDword4", type: "uint32", defaultValue: 0 },
      {
        name: "equipmentModels",
        type: "array",
        defaultValue: [{}],
        fields: equipmentModelSchema,
      },
      { name: "unknownString1", type: "string", defaultValue: "" },
      { name: "unknownString2", type: "string", defaultValue: "" },
      { name: "unknownDword5", type: "uint32", defaultValue: 0 },
      { name: "unknownDword6", type: "uint32", defaultValue: 0 },
      { name: "unknownDword7", type: "uint32", defaultValue: 0 },
      { name: "unknownString3", type: "string", defaultValue: "" },
      { name: "unknownString4", type: "string", defaultValue: "" },
      { name: "unknownString5", type: "string", defaultValue: "" },
      { name: "unknownString6", type: "string", defaultValue: "" },
      { name: "unknownString7", type: "string", defaultValue: "" },
      { name: "unknownString8", type: "string", defaultValue: "" },
      { name: "unknownDword8", type: "uint32", defaultValue: 0 },
      {
        name: "unknownData1",
        type: "schema",
        fields: [
          { name: "unknownDword1", type: "uint32", defaultValue: 0 },
          { name: "unknownDword2", type: "uint32", defaultValue: 0 },
          { name: "unknownDword3", type: "uint32", defaultValue: 0 },
        ],
      },
      {
        name: "effectTags",
        type: "array",
        defaultValue: [{}],
        fields: effectTagsSchema,
      },
      { name: "unknownDword9", type: "uint32", defaultValue: 0 },
      { name: "unknownDword10", type: "uint32", defaultValue: 0 },
      { name: "unknownDword11", type: "uint32", defaultValue: 0 },
      { name: "unknownDword12", type: "uint32", defaultValue: 0 },
      { name: "unknownDword13", type: "uint32", defaultValue: 0 },
      { name: "unknownDword14", type: "uint32", defaultValue: 0 },
      { name: "unknownBool1", type: "boolean", defaultValue: 0 },
      { name: "unknownBool2", type: "boolean", defaultValue: 0 },
      { name: "unknownBool3", type: "boolean", defaultValue: 0 },
      { name: "unknownDword15", type: "uint32", defaultValue: 0 },
      { name: "unknownDword16", type: "uint32", defaultValue: 0 },
      { name: "unknownBytes1", type: "byteswithlength", defaultValue: null },
      { name: "unknownBytes2", type: "byteswithlength", defaultValue: null },
      { name: "unknownBytes3", type: "byteswithlength", defaultValue: null },
      { name: "unknownBytes4", type: "byteswithlength", defaultValue: null },
    ],
  },
  // CONTINUED
];

const respawnLocationDataSchema = [
  { name: "guid", type: "uint64string", defaultValue: "0" },
  { name: "respawnType", type: "uint8", defaultValue: 0 },
  { name: "position", type: "floatvector4", defaultValue: [0, 0, 0, 0] },
  { name: "unknownDword1", type: "uint32", defaultValue: 0 },
  { name: "unknownDword2", type: "uint32", defaultValue: 0 },
  { name: "iconId1", type: "uint32", defaultValue: 0 },
  { name: "iconId2", type: "uint32", defaultValue: 0 },
  { name: "respawnTotalTime", type: "uint32", defaultValue: 0 },
  { name: "respawnTimeMs", type: "uint32", defaultValue: 0 },
  { name: "nameId", type: "uint32", defaultValue: 0 },
  { name: "distance", type: "float", defaultValue: 0.0 },
  { name: "unknownByte1", type: "uint8", defaultValue: 0 },
  { name: "unknownByte2", type: "uint8", defaultValue: 0 },
  {
    name: "unknownData1",
    type: "schema",
    fields: [
      { name: "unknownByte1", type: "uint8", defaultValue: 0 },
      { name: "unknownByte2", type: "uint8", defaultValue: 0 },
      { name: "unknownByte3", type: "uint8", defaultValue: 0 },
      { name: "unknownByte4", type: "uint8", defaultValue: 0 },
      { name: "unknownByte5", type: "uint8", defaultValue: 0 },
    ],
  },
  { name: "unknownDword4", type: "uint32", defaultValue: 0 },
  { name: "unknownByte3", type: "uint8", defaultValue: 0 },
  { name: "unknownByte4", type: "uint8", defaultValue: 0 },
];

const itemData = [
  { name: "unknownDword1", type: "uint32", defaultValue: 0 },
  { name: "unknownDword2", type: "uint32", defaultValue: 0 },
  { name: "unknownQword1", type: "uint64string", defaultValue: "0" },
  { name: "unknownDword3", type: "uint32", defaultValue: 0 },
  {
    name: "itemSubData",
    type: "schema",
    fields: [
      { name: "unknownBoolean1", type: "boolean", defaultValue: false },
      { name: "unknownDword1", type: "uint32", defaultValue: 1 },
      {
        name: "unknownData1",
        type: "schema",
        fields: [
          { name: "unknownQword1", type: "uint64string", defaultValue: "0" },
          { name: "unknownDword1", type: "uint32", defaultValue: 0 },
          { name: "unknownDword2", type: "uint32", defaultValue: 0 },
        ],
      },
    ],
  },
  { name: "unknownQword2", type: "uint64string", defaultValue: "0" },
  { name: "unknownDword4", type: "uint32", defaultValue: 0 },
  { name: "unknownDword5", type: "uint32", defaultValue: 0 },
  { name: "unknownDword6", type: "uint32", defaultValue: 0 },
  { name: "unknownDword7", type: "uint32", defaultValue: 0 },
  { name: "unknownDword8", type: "uint32", defaultValue: 0 },
  { name: "unknownBoolean1", type: "boolean", defaultValue: false },
  { name: "unknownQword3", type: "uint64string", defaultValue: "0" },
  { name: "unknownDword9", type: "uint32", defaultValue: 0 },
];

const containerData = [
  { name: "guid", type: "uint64string", defaultValue: "0" },
  { name: "unknownDword1", type: "uint32", defaultValue: 0 },
  { name: "unknownQword1", type: "uint64string", defaultValue: "0" },
  { name: "unknownDword2", type: "uint32", defaultValue: 0 },
  {
    name: "containerItems",
    type: "schema",
    fields: [
      // todo
      {
        name: "items",
        type: "array",
        defaultValue: [{}],
        fields: [
          { name: "unknownDword1", type: "uint32", defaultValue: 0 },
          { name: "itemData", type: "schema", fields: itemData },
        ],
      },
    ],
  },
  { name: "unknownBoolean1", type: "boolean", defaultValue: false },
  { name: "unknownDword3", type: "uint32", defaultValue: 0 },
  { name: "unknownDword4", type: "uint32", defaultValue: 0 },
  { name: "unknownDword5", type: "uint32", defaultValue: 0 },
  { name: "unknownBoolean2", type: "boolean", defaultValue: false },
];

const skyData = [
  { name: "unknownDword1", type: "float", defaultValue: 0 },
  { name: "unknownDword2", type: "float", defaultValue: 0 },
  { name: "skyBrightness1", type: "float", defaultValue: 1 },
  { name: "skyBrightness2", type: "float", defaultValue: 1 },
  { name: "snow", type: "uint32", defaultValue: 0 },
  { name: "snowMap", type: "float", defaultValue: 0 },
  { name: "colorGradient", type: "float", defaultValue: 0 },
  { name: "unknownDword8", type: "float", defaultValue: 0 },
  { name: "unknownDword9", type: "float", defaultValue: 0 },
  { name: "unknownDword10", type: "float", defaultValue: 0 },
  { name: "unknownDword11", type: "float", defaultValue: 0 },
  { name: "unknownDword12", type: "float", defaultValue: 0 },
  { name: "sunAxisX", type: "float", defaultValue: 0 },
  { name: "sunAxisY", type: "float", defaultValue: 0 },
  { name: "unknownDword15", type: "float", defaultValue: 0 },
  { name: "disableTrees", type: "float", defaultValue: 0 },
  { name: "disableTrees1", type: "float", defaultValue: 0 },
  { name: "disableTrees2", type: "float", defaultValue: 0 },
  { name: "wind", type: "float", defaultValue: 0 },
  { name: "unknownDword20", type: "float", defaultValue: 0 },
  { name: "unknownDword21", type: "float", defaultValue: 0 },
  { name: "name", type: "string", defaultValue: "" },
  { name: "unknownDword22", type: "float", defaultValue: 0 },
  { name: "unknownDword23", type: "float", defaultValue: 0 },
  { name: "unknownDword24", type: "float", defaultValue: 0 },
  { name: "unknownDword25", type: "float", defaultValue: 0 },
  { name: "unknownDword26", type: "float", defaultValue: 0 },
  { name: "unknownDword27", type: "float", defaultValue: 0 },
  { name: "unknownDword28", type: "float", defaultValue: 0 },
  { name: "unknownDword29", type: "float", defaultValue: 0 },
  { name: "unknownDword30", type: "float", defaultValue: 0 },
  { name: "unknownDword31", type: "float", defaultValue: 0 },
  { name: "unknownDword32", type: "float", defaultValue: 0 },
  { name: "unknownDword33", type: "float", defaultValue: 0 },
];

const recipeData = [
  { name: "recipeId", type: "uint32", defaultValue: 0 },
  { name: "nameId", type: "uint32", defaultValue: 0 },
  { name: "iconId", type: "uint32", defaultValue: 0 },
  { name: "unknownDword1", type: "uint32", defaultValue: 0 },
  { name: "descriptionId", type: "uint32", defaultValue: 0 },
  { name: "unknownDword2", type: "uint32", defaultValue: 0 },
  { name: "bundleCount", type: "uint32", defaultValue: 0 },
  { name: "memberOnly", type: "boolean", defaultValue: false },
  { name: "filterId", type: "uint32", defaultValue: 0 },
  {
    name: "components",
    type: "array",
    defaultValue: [{}],
    fields: [
      { name: "unknownDword1", type: "uint32", defaultValue: 0 },
      { name: "nameId", type: "uint32", defaultValue: 0 },
      { name: "iconId", type: "uint32", defaultValue: 0 },
      { name: "unknownDword2", type: "uint32", defaultValue: 0 },
      { name: "descriptionId", type: "uint32", defaultValue: 0 },
      { name: "requiredAmount", type: "uint32", defaultValue: 0 },
      { name: "unknownQword1", type: "uint64string", defaultValue: "0" },
      { name: "unknownDword3", type: "uint32", defaultValue: 0 },
      { name: "itemDefinitionId", type: "uint32", defaultValue: 0 },
    ],
  },
  { name: "itemDefinitionId", type: "uint32", defaultValue: 0 },
];

const equipmentCharacterDataSchema = [
  { name: "profileId", type: "uint32", defaultValue: 1 },
  { name: "characterId", type: "uint64string", defaultValue: "0" },
];

const equipmentTextureSchema = [
  { name: "index", type: "uint32", defaultValue: 1 },
  { name: "slotId", type: "uint32", defaultValue: 1 },
  { name: "unknownQword1", type: "uint64string", defaultValue: "0" },
  { name: "textureAlias", type: "string", defaultValue: "" },
  { name: "unknownString1", type: "string", defaultValue: "" },
];

const characterResourceData = [
  { name: "resourceId", type: "uint32", defaultValue: 0 },
  { name: "resourceType", type: "uint32", defaultValue: 0 },
  {
    name: "unknownArray1",
    type: "array",
    defaultValue: [{}],
    fields: [
      { name: "unknownDword1", type: "uint32", defaultValue: 0 },
      { name: "unknownDword2", type: "uint32", defaultValue: 0 },
      { name: "unknownDword3", type: "uint32", defaultValue: 0 },
      { name: "unknownDword4", type: "uint32", defaultValue: 0 },
    ],
  },
  { name: "value", type: "uint32", defaultValue: 1000 },
  { name: "unknownDword1", type: "uint32", defaultValue: 0 },
  { name: "unknownDword2", type: "uint32", defaultValue: 0 },
  { name: "unknownDword3", type: "uint32", defaultValue: 0 },
  { name: "unknownDword4", type: "uint32", defaultValue: 0 },
  { name: "unknownDword5", type: "uint32", defaultValue: 0 },
  { name: "unknownDword6", type: "uint32", defaultValue: 0 },
  { name: "unknownDword7", type: "uint32", defaultValue: 0 },
  { name: "unknownDword8", type: "uint32", defaultValue: 0 },
  { name: "unknownQword1", type: "uint64string", defaultValue: "0x0000000000000000" },
  { name: "unknownQword2", type: "uint64string", defaultValue: "0x0000000000000000" },
  { name: "unknownQword3", type: "uint64string", defaultValue: "0x0000000000000000" },
  { name: "unknownQword4", type: "uint64string", defaultValue: "0x0000000000000000" },
  { name: "unknownQword5", type: "uint64string", defaultValue: "0x0000000000000000" },
  { name: "unknownByte1", type: "uint8", defaultValue: 0 },
  { name: "unknownByte2", type: "uint8", defaultValue: 0 },
];

const packets = [
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
            { name: "guid", type: "uint64string", defaultValue: "" },
            { name: "characterId", type: "uint64string", defaultValue: "" },
            {
              name: "transientId",
              type: "custom",
              parser: readUnsignedIntWith2bitLengthValue,
              packer: packUnsignedIntWith2bitLengthValue,
            },
            { name: "lastLoginDate", type: "uint64string", defaultValue: "" },
            { name: "actorModelId", type: "uint32", defaultValue: 0 },
            { name: "headActor", type: "string", defaultValue: "" },
            { name: "unknownString1", type: "string", defaultValue: "" },
            { name: "unknownDword4", type: "uint32", defaultValue: 0 },
            { name: "unknownDword5", type: "uint32", defaultValue: 0 },
            { name: "emptyTexture", type: "string", defaultValue: "" },
            { name: "unknownString3", type: "string", defaultValue: "" },
            { name: "unknownString4", type: "string", defaultValue: "" },
            { name: "headId", type: "uint32", defaultValue: 0 },
            { name: "unknownDword6", type: "uint32", defaultValue: 0 },
            { name: "factionId", type: "uint32", defaultValue: 0 },
            { name: "unknownDword9", type: "uint32", defaultValue: 0 },
            { name: "unknownDword10", type: "uint32", defaultValue: 0 },
            { name: "position", type: "floatvector4", defaultValue: 0 },
            { name: "rotation", type: "floatvector4", defaultValue: 0 },
            { name: "identity", type: "schema", fields: identitySchema },
            { name: "unknownDword11", type: "uint32", defaultValue: 0 },
            {
              name: "currency",
              type: "array",
              defaultValue: [],
              fields: [
                { name: "currencyId", type: "uint32", defaultValue: 0 },
                { name: "quantity", type: "uint32", defaultValue: 0 },
              ],
            },
            { name: "creationDate", type: "uint64string", defaultValue: "" },
            { name: "unknownDword15", type: "uint32", defaultValue: 0 },
            { name: "unknownDword16", type: "uint32", defaultValue: 0 },
            { name: "unknownBoolean1", type: "boolean", defaultValue: false },
            { name: "isRespawning", type: "boolean", defaultValue: false },
            { name: "isMember", type: "uint32", defaultValue: 0 },
            { name: "unknownDword18", type: "uint32", defaultValue: 0 },
            { name: "unknownBoolean3", type: "boolean", defaultValue: false },
            { name: "unknownDword19", type: "uint32", defaultValue: 0 },
            { name: "gender", type: "uint32", defaultValue: 0 },
            { name: "unknownDword21", type: "uint32", defaultValue: 0 },
            { name: "unknownDword22", type: "uint32", defaultValue: 0 },
            { name: "unknownDword23", type: "uint32", defaultValue: 0 },
            { name: "unknownTime1", type: "uint64string", defaultValue: "" },
            { name: "unknownTime2", type: "uint64string", defaultValue: "" },
            { name: "unknownDword24", type: "uint32", defaultValue: 0 },
            { name: "unknownBoolean5", type: "boolean", defaultValue: false },
            { name: "unknownDword25", type: "uint32", defaultValue: 0 },
            {
              name: "profiles",
              type: "array",
              defaultValue: [],
              fields: profileDataSchema,
            },
            { name: "currentProfile", type: "uint32", defaultValue: 0 },

            {
              name: "unknownArray1",
              type: "array",
              defaultValue: [],
              fields: [
                { name: "unknownDword1", type: "int32", defaultValue: 0 },
                { name: "unknownDword2", type: "int32", defaultValue: 0 },
              ],
            },
            {
              name: "collections",
              type: "array",
              defaultValue: [],
              fields: collectionsSchema,
            },
            {
              // READ FUNCTION NOT UPDATED, CAN'T FIND READ FUNCTION (length set to 0 for now)
              name: "inventory",
              type: "schema",
              defaultValue: {},
              fields: [
                {
                  name: "items",
                  type: "array",
                  defaultValue: [],
                  fields: [
                    {
                      name: "itemData",
                      type: "custom",
                      parser: parseItemData,
                      packer: packItemData,
                      defaultValue: 0,
                    },
                  ],
                },
                { name: "unknownDword1", type: "uint32", defaultValue: 0 },
              ],
            },
            { name: "unknownDword26", type: "uint32", defaultValue: 0 },
            {
              name: "characterQuests",
              type: "schema",
              defaultValue: {},
              fields: [
                {
                  name: "quests",
                  type: "array",
                  defaultValue: [],
                  fields: [
                    { name: "unknownDword1", type: "uint32", defaultValue: 0 },
                    { name: "unknownDword2", type: "uint32", defaultValue: 0 },
                    { name: "unknownDword3", type: "uint32", defaultValue: 0 },
                    { name: "unknownDword4", type: "uint32", defaultValue: 0 },
                    { name: "unknownBoolean1", type: "boolean", defaultValue: true },
                    { name: "unknownGuid1", type: "uint64string", defaultValue: "" },
                    { name: "unknownDword5", type: "uint32", defaultValue: 0 },
                    { name: "unknownBoolean2", type: "boolean", defaultValue: true },
                    { name: "unknownDword6", type: "uint32", defaultValue: 0 },
                    { 
                      name: "reward", 
                      type: "schema", 
                      defaultValue: {}, 
                      fields: rewardBundleDataSchema
                    },
                    {
                      name: "unknownArray1",
                      type: "array",
                      defaultValue: [],
                      fields: [
                        { name: "unknownDword1", type: "uint32", defaultValue: 0 },
                        {
                          name: "unknownData1",
                          type: "schema",
                          defaultValue: {},
                          fields: [
                            { name: "unknownDword1", type: "uint32", defaultValue: 0 },
                            { name: "unknownDword2", type: "uint32", defaultValue: 0 },
                            { name: "unknownDword3", type: "uint32", defaultValue: 0 },
                            { name: "unknownBoolean1", type: "boolean", defaultValue: true },
                            { 
                              name: "reward", 
                              type: "schema", 
                              defaultValue: {}, 
                              fields: rewardBundleDataSchema 
                            },
                            { name: "unknownDword4", type: "uint32", defaultValue: 0 },
                            { name: "unknownDword5", type: "uint32", defaultValue: 0 },
                            { name: "unknownDword6", type: "uint32", defaultValue: 0 },
                            { name: "unknownDword7", type: "uint32", defaultValue: 0 },
                            { name: "unknownBoolean2", type: "boolean", defaultValue: true },
                            { name: "unknownDword8", type: "uint32", defaultValue: 0 },
                            { name: "unknownDword9", type: "uint32", defaultValue: 0 },
                            {
                              name: "unknownData1",
                              type: "schema",
                              defaultValue: {},
                              fields: [
                                { name: "unknownDword1", type: "uint32", defaultValue: 0 },
                                { name: "unknownDword2", type: "uint32", defaultValue: 0 },
                                { name: "unknownDword3", type: "uint32", defaultValue: 0 },
                                { name: "unknownDword4", type: "uint32", defaultValue: 0 },
                              ],
                            },
                          ],
                        },
                      ],
                    },
                    { name: "unknownDword7", type: "uint32", defaultValue: 0 },
                    { name: "unknownBoolean3", type: "boolean", defaultValue: true },
                    { name: "unknownBoolean4", type: "boolean", defaultValue: true },
                  ],
                },
                { name: "unknownDword1", type: "uint32", defaultValue: 0 },
                { name: "unknownDword2", type: "uint32", defaultValue: 0 },
                { name: "unknownBoolean1", type: "boolean", defaultValue: true },
                { name: "unknownDword3", type: "uint32", defaultValue: 0 },
                { name: "unknownDword4", type: "uint32", defaultValue: 0 },
              ],
            },
            { 
              name: "characterAchievements", 
              type: "array", 
              defaultValue: [], 
              fields: achievementDataSchema 
            },
            {
              name: "acquaintances",
              type: "array",
              defaultValue: [],
              fields: [
                { name: "unknownGuid1", type: "uint64string", defaultValue: "" },
                { name: "unknownString1", type: "string", defaultValue: "" },
                { name: "unknownDword1", type: "uint32", defaultValue: 0 },
                { name: "unknownGuid2", type: "uint64string", defaultValue: "" },
                { name: "unknownBoolean1", type: "boolean", defaultValue: true },
              ],
            },
            { 
              name: "recipes", 
              type: "array", 
              defaultValue: [], 
              fields: recipeData 
            },
            {
              name: "mounts",
              type: "array",
              defaultValue: [],
              fields: [
                { name: "unknownDword1", type: "uint32", defaultValue: 0 },
                { name: "unknownDword2", type: "uint32", defaultValue: 0 },
                { name: "unknownDword3", type: "uint32", defaultValue: 0 },
                { name: "unknownQword1", type: "uint64string", defaultValue: "" },
                { name: "unknownBoolean1", type: "boolean", defaultValue: true },
                { name: "unknownDword4", type: "uint32", defaultValue: 0 },
                { name: "unknownString1", type: "string", defaultValue: "" },
              ],
            },
            {
              name: "unknownCoinStoreData",
              type: "schema",
              defaultValue: {},
              fields: [
                { name: "unknownBoolean1", type: "boolean", defaultValue: true },
                { 
                  name: "unknownArray1", 
                  type: "array", 
                  defaultValue: [],
                  fields: [
                    { name: "unknownDword1", type: "uint32", defaultValue: 0 },
                  ],
                },
              ],
            },
            {
              name: "unknownArray2",
              type: "array",
              defaultValue: [],
              fields: [
                { name: "unknownDword1", type: "uint32", defaultValue: 0 },
              ],
            },
            {
              name: "unknownEffectArray",
              type: "array",
              defaultValue: [],
              fields: [
                { 
                  name: "effectTag", 
                  type: "schema", 
                  defaultValue: {}, 
                  fields: effectTagsSchema 
                },
                { name: "unknownDword1", type: "uint32", defaultValue: 0 },
                { name: "unknownBoolean1", type: "boolean", defaultValue: true },
                { name: "unknownDword2", type: "uint32", defaultValue: 0 },
                { name: "unknownDword3", type: "uint32", defaultValue: 0 },
                {
                  name: "unknownArray1",
                  type: "array",
                  defaultValue: [],
                  fields: [
                    { name: "unknownDword1", type: "uint32", defaultValue: 0 },
                  ],
                },
              ],
            },
            { 
              name: "stats", 
              type: "array", 
              defaultValue: [], 
              fields: statDataSchema 
            },
            /*
            {
              name: "playerTitles",
              type: "array",
              defaultValue: [{}],
              fields: [
                { name: "titleId", type: "uint32", defaultValue: 0 },
                { name: "titleType", type: "uint32", defaultValue: 0 },
                { name: "stringId", type: "uint32", defaultValue: 0 },
              ],
            },
            { name: "currentPlayerTitle", type: "uint32", defaultValue: 0 },
            {
              name: "unknownArray13",
              type: "array",
              defaultValue: [{}],
              fields: [
                { name: "unknownDword1", type: "uint32", defaultValue: 0 },
                { name: "unknownDword2", type: "uint32", defaultValue: 0 },
              ],
            },
            {
              name: "unknownArray14",
              type: "array",
              defaultValue: [{}],
              fields: [
                { name: "unknownDword1", type: "uint32", defaultValue: 0 },
              ],
            },
            { name: "unknownDword33", type: "uint32", defaultValue: 0 },
            {
              name: "unknownArray15",
              type: "array",
              defaultValue: [{}],
              fields: [
                { name: "unknownDword1", type: "uint32", defaultValue: 0 },
              ],
            },
            {
              name: "unknownArray16",
              type: "array",
              defaultValue: [{}],
              fields: [
                { name: "unknownDword1", type: "uint32", defaultValue: 0 },
              ],
            },
            {
              name: "unknownArray17",
              type: "array",
              defaultValue: [{}],
              fields: [
                {
                  name: "unknownBoolean1",
                  type: "boolean",
                  defaultValue: true,
                },
              ],
            },
            // { name: "unknownDword34",           type: "uint32" , defaultValue: 0 },
            // { name: "unknownDword35",           type: "uint32" , defaultValue: 0 },
            // { name: "unknownDword36",           type: "uint32" , defaultValue: 0 },
            {
              name: "unknownArray18",
              type: "array",
              defaultValue: [{}],
              fields: [
                { name: "unknownDword1", type: "uint32", defaultValue: 0 },
                { name: "unknownDword2", type: "uint32", defaultValue: 0 },
                { name: "unknownDword3", type: "uint32", defaultValue: 0 },
                { name: "unknownDword4", type: "uint32", defaultValue: 0 },
                { name: "unknownDword5", type: "uint32", defaultValue: 0 },
                { name: "unknownDword6", type: "uint32", defaultValue: 0 },
                { name: "unknownDword7", type: "uint32", defaultValue: 0 },
                { name: "unknownByte1", type: "uint8", defaultValue: 0 },
              ],
            },
            {
              name: "unknownArray19",
              type: "array",
              defaultValue: [{}],
              fields: [
                { name: "unknownDword1", type: "uint32", defaultValue: 0 },
                { name: "unknownDword2", type: "uint32", defaultValue: 0 },
                { name: "unknownDword3", type: "uint32", defaultValue: 0 },
                { name: "unknownDword4", type: "uint32", defaultValue: 0 },
                { name: "unknownDword5", type: "uint32", defaultValue: 0 },
                { name: "unknownDword6", type: "uint32", defaultValue: 0 },
                { name: "unknownDword7", type: "uint32", defaultValue: 0 },
                { name: "unknownByte1", type: "uint8", defaultValue: 0 },
              ],
            },
            {
              name: "unknownArray20",
              type: "array",
              defaultValue: [{}],
              fields: [
                { name: "unknownDword1", type: "uint32", defaultValue: 0 },
                { name: "unknownDword2", type: "uint32", defaultValue: 0 },
              ],
            },
            {
              name: "unknownData1",
              type: "schema",
              fields: [
                {
                  name: "abilityLines",
                  type: "array",
                  defaultValue: [{}],
                  fields: [
                    { name: "abilityLineId", type: "uint32", defaultValue: 0 },
                    {
                      name: "abilityLineData",
                      type: "schema",
                      fields: [
                        {
                          name: "abilityLineId",
                          type: "uint32",
                          defaultValue: 0,
                        },
                        { name: "abilityId", type: "uint32", defaultValue: 0 },
                        {
                          name: "abilityLineIndex",
                          type: "uint32",
                          defaultValue: 0,
                        },
                      ],
                    },
                  ],
                },
                {
                  name: "unknownArray2",
                  type: "array",
                  defaultValue: [{}],
                  fields: [
                    { name: "unknownDword1", type: "uint32", defaultValue: 0 },
                    { name: "unknownDword2", type: "uint32", defaultValue: 0 },
                    { name: "unknownDword3", type: "uint32", defaultValue: 0 },
                    { name: "unknownDword4", type: "uint32", defaultValue: 0 },
                  ],
                },
                {
                  name: "unknownArray3",
                  type: "array",
                  defaultValue: [{}],
                  fields: [
                    { name: "unknownDword1", type: "uint32", defaultValue: 0 },
                    { name: "unknownDword2", type: "uint32", defaultValue: 0 },
                    { name: "unknownDword3", type: "uint32", defaultValue: 0 },
                    { name: "unknownDword4", type: "uint32", defaultValue: 0 },
                  ],
                },
                {
                  name: "unknownArray4",
                  type: "array",
                  defaultValue: [{}],
                  fields: [
                    { name: "unknownDword1", type: "uint32", defaultValue: 0 },
                    { name: "unknownDword2", type: "uint32", defaultValue: 0 },
                    { name: "unknownDword3", type: "uint32", defaultValue: 0 },
                    { name: "unknownDword4", type: "uint32", defaultValue: 0 },
                  ],
                },
                { name: "unknownDword1", type: "uint32", defaultValue: 0 },
                { name: "unknownDword2", type: "uint32", defaultValue: 0 },
                {
                  name: "unknownArray5",
                  type: "array",
                  defaultValue: [{}],
                  fields: [
                    { name: "unknownDword1", type: "uint32", defaultValue: 0 },
                    {
                      name: "unknownData1",
                      type: "schema",
                      fields: [
                        {
                          name: "unknownDword1",
                          type: "uint32",
                          defaultValue: 0,
                        },
                        {
                          name: "unknownDword2",
                          type: "uint32",
                          defaultValue: 0,
                        },
                        {
                          name: "unknownDword3",
                          type: "uint32",
                          defaultValue: 0,
                        },
                        {
                          name: "unknownGuid1",
                          type: "uint64string",
                          defaultValue: 0,
                        },
                        {
                          name: "unknownGuid2",
                          type: "uint64string",
                          defaultValue: 0,
                        },
                      ],
                    },
                  ],
                },
                {
                  name: "unknownArray6",
                  type: "array",
                  defaultValue: [{}],
                  fields: [
                    { name: "unknownDword1", type: "uint32", defaultValue: 0 },
                    {
                      name: "unknownData1",
                      type: "schema",
                      fields: [
                        {
                          name: "unknownDword1",
                          type: "uint32",
                          defaultValue: 0,
                        },
                        {
                          name: "unknownDword2",
                          type: "uint32",
                          defaultValue: 0,
                        },
                        {
                          name: "unknownDword3",
                          type: "uint32",
                          defaultValue: 0,
                        },
                        {
                          name: "unknownGuid1",
                          type: "uint64string",
                          defaultValue: 0,
                        },
                      ],
                    },
                  ],
                },
                {
                  name: "unknownArray7",
                  type: "array",
                  defaultValue: [{}],
                  fields: [
                    { name: "unknownDword1", type: "uint32", defaultValue: 0 },
                    { name: "unknownDword2", type: "uint32", defaultValue: 0 },
                  ],
                },
              ],
            },
            {
              name: "unknownArray21",
              type: "array",
              defaultValue: [{}],
              fields: [
                { name: "unknownDword1", type: "uint32", defaultValue: 0 },
                { name: "unknownDword2", type: "uint32", defaultValue: 0 },
                { name: "unknownDword3", type: "uint32", defaultValue: 0 },
              ],
            },
            {
              name: "unknownArray22",
              type: "array",
              defaultValue: [{}],
              fields: [
                { name: "unknownDword1", type: "uint32", defaultValue: 0 },
                { name: "unknownDword2", type: "uint32", defaultValue: 0 },
                { name: "unknownGuid1", type: "uint64string", defaultValue: "" },
                { name: "unknownFloat1", type: "float", defaultValue: 0 },
                { name: "unknownDword3", type: "uint32", defaultValue: 0 },
              ],
            },
            {
              name: "unknownArray23",
              type: "array",
              defaultValue: [{}],
              fields: [
                { name: "unknownDword1", type: "uint32", defaultValue: 0 },
                { name: "unknownByte1", type: "uint8", defaultValue: 0 },
                { name: "unknownDword2", type: "uint32", defaultValue: 0 },
                { name: "unknownGuid1", type: "uint64string", defaultValue: "" },
                { name: "unknownFloat1", type: "float", defaultValue: 0 },
                { name: "unknownDword3", type: "uint32", defaultValue: 0 },
                { name: "unknownByte2", type: "uint8", defaultValue: 0 },
              ],
            },
            { name: "unknownByte1", type: "uint8", defaultValue: 0 },
            {
              name: "unknownData2",
              type: "schema",
              fields: [
                { name: "unknownDword1", type: "uint32", defaultValue: 0 },
                {
                  name: "unknownData1",
                  type: "schema",
                  fields: [
                    { name: "unknownDword1", type: "uint32", defaultValue: 0 },
                    { name: "unknownDword2", type: "uint32", defaultValue: 0 },
                    { name: "unknownDword3", type: "uint32", defaultValue: 0 },
                  ],
                },
                {
                  name: "unknownData2",
                  type: "schema",
                  fields: [
                    { name: "unknownDword1", type: "uint32", defaultValue: 0 },
                    { name: "unknownDword2", type: "uint32", defaultValue: 0 },
                    { name: "unknownDword3", type: "uint32", defaultValue: 0 },
                  ],
                },
                { name: "unknownDword2", type: "uint32", defaultValue: 0 },
              ],
            },
            { name: "unknownDword37", type: "uint32", defaultValue: 0 },
            {
              name: "unknownArray24",
              type: "array",
              defaultValue: [{}],
              fields: [
                { name: "unknownDword1", type: "uint32", defaultValue: 0 },
                { name: "unknownFloat1", type: "float", defaultValue: 0 },
              ],
            },
            {
              name: "unknownData3",
              type: "schema",
              fields: [
                { name: "unknownDword1", type: "uint32", defaultValue: 0 },
                { name: "unknownDword2", type: "uint32", defaultValue: 0 },
                { name: "unknownDword3", type: "uint32", defaultValue: 0 },
                { name: "unknownDword4", type: "uint32", defaultValue: 0 },
                { name: "unknownDword5", type: "uint32", defaultValue: 0 },
              ],
            },
            {
              name: "unknownArray25",
              type: "array",
              defaultValue: [{}],
              fields: [
                { name: "unknownDword1", type: "uint32", defaultValue: 0 },
                { name: "unknownGuid1", type: "uint64string", defaultValue: "" },
                { name: "unknownFloat1", type: "float", defaultValue: 0 },
                { name: "unknownFloat2", type: "float", defaultValue: 0 },
              ],
            },
            {
              name: "unknownArray26",
              type: "array",
              defaultValue: [{}],
              fields: [
                { name: "unknownDword1", type: "uint32", defaultValue: 0 },
                { name: "unknownGuid1", type: "uint64string", defaultValue: "" },
                {
                  name: "unknownArray1",
                  type: "array",
                  defaultValue: [{}],
                  fields: [
                    { name: "unknownDword1", type: "uint32", defaultValue: 0 },
                    { name: "unknownDword2", type: "uint32", defaultValue: 0 },
                  ],
                },
              ],
            },
            {
              name: "unknownArray27",
              type: "array",
              defaultValue: [{}],
              fields: [
                {
                  name: "unknownData1",
                  type: "schema",
                  fields: [
                    { name: "unknownDword1", type: "uint32", defaultValue: 0 },
                    { name: "unknownGuid1", type: "uint64string", defaultValue: "" },
                    { name: "unknownGuid2", type: "uint64string", defaultValue: "" },
                  ],
                },
                {
                  name: "effectTags",
                  type: "schema",
                  fields: effectTagsSchema,
                },
              ],
            },
            {
              name: "unknownArray28",
              type: "array",
              defaultValue: [{}],
              fields: [
                { name: "unknownDword1", type: "uint32", defaultValue: 0 },
                { name: "unknownDword2", type: "uint32", defaultValue: 0 },
                {
                  name: "unknownData1",
                  type: "schema",
                  fields: [
                    {
                      name: "unknownString1",
                      type: "string",
                      defaultValue: "",
                    },
                    {
                      name: "unknownString2",
                      type: "string",
                      defaultValue: "",
                    },
                  ],
                },
                {
                  name: "unknownArray1",
                  type: "array",
                  defaultValue: [{}],
                  fields: [
                    { name: "unknownDword1", type: "uint32", defaultValue: 0 },
                    {
                      name: "unknownData1",
                      type: "schema",
                      fields: [
                        {
                          name: "unknownDword1",
                          type: "uint32",
                          defaultValue: 0,
                        },
                        {
                          name: "unknownGuid1",
                          type: "uint64string",
                          defaultValue: 0,
                        },
                        {
                          name: "unknownString1",
                          type: "string",
                          defaultValue: "",
                        },
                        {
                          name: "unknownString2",
                          type: "string",
                          defaultValue: "",
                        },
                      ],
                    },
                  ],
                },
              ],
            },
            {
              name: "playerRanks",
              type: "array",
              defaultValue: [{}],
              fields: [
                { name: "rankId", type: "uint32", defaultValue: 0 },
                {
                  name: "rankData",
                  type: "schema",
                  fields: [
                    { name: "rankId", type: "uint32", defaultValue: 0 },
                    { name: "score", type: "uint32", defaultValue: 0 },
                    { name: "unknownDword3", type: "uint32", defaultValue: 0 },
                    { name: "rank", type: "uint32", defaultValue: 0 },
                    { name: "rankProgress", type: "uint32", defaultValue: 0 },
                  ],
                },
              ],
            },
            {
              name: "unknownData4",
              type: "schema",
              fields: [
                { name: "unknownDword1", type: "uint32", defaultValue: 0 },
                { name: "unknownDword2", type: "uint32", defaultValue: 0 },
                { name: "unknownDword3", type: "uint32", defaultValue: 0 },
                { name: "unknownDword4", type: "uint32", defaultValue: 0 },
                { name: "unknownDword5", type: "uint32", defaultValue: 0 },
              ],
            },
            {
              name: "unknownData5",
              type: "schema",
              fields: [
                { name: "unknownDword1", type: "uint32", defaultValue: 0 },
                { name: "unknownDword2", type: "uint32", defaultValue: 0 },
                { name: "unknownDword3", type: "uint32", defaultValue: 0 },
              ],
            },
            {
              name: "implantSlots",
              type: "array",
              defaultValue: [{}],
              fields: [
                { name: "unknownDword1", type: "uint32", defaultValue: 0 },
                {
                  name: "unknownData1",
                  type: "schema",
                  fields: [
                    { name: "unknownDword1", type: "uint32", defaultValue: 0 },
                    { name: "unknownDword2", type: "uint32", defaultValue: 0 },
                    { name: "unknownDword3", type: "uint32", defaultValue: 0 },
                    { name: "unknownDword4", type: "uint32", defaultValue: 0 },
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
                    { name: "unknownDword1", type: "uint32", defaultValue: 0 },
                    { name: "unknownFloat1", type: "float", defaultValue: 0 },
                    { name: "unknownTime1", type: "uint64string", defaultValue: "" },
                    { name: "unknownTime2", type: "uint64string", defaultValue: "" },
                  ],
                },
                {
                  name: "unknownArray1",
                  type: "array",
                  defaultValue: [{}],
                  fields: [
                    { name: "unknownDword1", type: "uint32", defaultValue: 0 },
                    {
                      name: "unknownData1",
                      type: "schema",
                      fields: [
                        {
                          name: "unknownDword1",
                          type: "uint32",
                          defaultValue: 0,
                        },
                        {
                          name: "unknownFloat1",
                          type: "float",
                          defaultValue: 0,
                        },
                        {
                          name: "unknownTime1",
                          type: "uint64string",
                          defaultValue: 0,
                        },
                        {
                          name: "unknownTime2",
                          type: "uint64string",
                          defaultValue: 0,
                        },
                      ],
                    },
                    { name: "unknownDword2", type: "uint32", defaultValue: 0 },
                  ],
                },
                {
                  name: "unknownData2",
                  type: "schema",
                  fields: [
                    { name: "unknownDword1", type: "uint32", defaultValue: 0 },
                    { name: "unknownFloat1", type: "float", defaultValue: 0 },
                    { name: "unknownTime1", type: "uint64string", defaultValue: "" },
                  ],
                },
                {
                  name: "unknownArray2",
                  type: "array",
                  defaultValue: [{}],
                  fields: [
                    { name: "unknownDword1", type: "uint32", defaultValue: 0 },
                    {
                      name: "unknownData1",
                      type: "schema",
                      fields: [
                        {
                          name: "unknownDword1",
                          type: "uint32",
                          defaultValue: 0,
                        },
                        {
                          name: "unknownFloat1",
                          type: "float",
                          defaultValue: 0,
                        },
                        {
                          name: "unknownTime1",
                          type: "uint64string",
                          defaultValue: 0,
                        },
                        {
                          name: "unknownDword2",
                          type: "uint32",
                          defaultValue: 0,
                        },
                        {
                          name: "unknownDword3",
                          type: "uint32",
                          defaultValue: 0,
                        },
                        {
                          name: "unknownDword4",
                          type: "uint32",
                          defaultValue: 0,
                        },
                      ],
                    },
                  ],
                },
                {
                  name: "unknownArray3",
                  type: "array",
                  defaultValue: [{}],
                  fields: [
                    { name: "unknownDword1", type: "uint32", defaultValue: 0 },
                    {
                      name: "unknownData1",
                      type: "schema",
                      fields: [
                        {
                          name: "unknownDword1",
                          type: "uint32",
                          defaultValue: 0,
                        },
                        {
                          name: "unknownFloat1",
                          type: "float",
                          defaultValue: 0,
                        },
                        {
                          name: "unknownTime1",
                          type: "uint64string",
                          defaultValue: 0,
                        },
                        {
                          name: "unknownDword2",
                          type: "uint32",
                          defaultValue: 0,
                        },
                        {
                          name: "unknownDword3",
                          type: "uint32",
                          defaultValue: 0,
                        },
                        {
                          name: "unknownByte1",
                          type: "uint8",
                          defaultValue: 0,
                        },
                      ],
                    },
                  ],
                },
                {
                  name: "unknownArray4",
                  type: "array",
                  defaultValue: [{}],
                  fields: [
                    { name: "unknownDword1", type: "uint32", defaultValue: 0 },
                    {
                      name: "unknownData1",
                      type: "schema",
                      fields: [
                        {
                          name: "unknownDword1",
                          type: "uint32",
                          defaultValue: 0,
                        },
                        {
                          name: "unknownFloat1",
                          type: "float",
                          defaultValue: 0,
                        },
                        {
                          name: "unknownTime1",
                          type: "uint64string",
                          defaultValue: 0,
                        },
                        {
                          name: "unknownDword2",
                          type: "uint32",
                          defaultValue: 0,
                        },
                        {
                          name: "unknownDword3",
                          type: "uint32",
                          defaultValue: 0,
                        },
                        {
                          name: "unknownDword4",
                          type: "uint32",
                          defaultValue: 0,
                        },
                        {
                          name: "unknownByte1",
                          type: "uint8",
                          defaultValue: 0,
                        },
                      ],
                    },
                  ],
                },
                { name: "unknownByte1", type: "uint8", defaultValue: 0 },
              ],
            },
            {
              name: "characterLoadoutData",
              type: "schema",
              fields: [
                {
                  name: "loadouts",
                  type: "array",
                  defaultValue: [{}],
                  fields: [
                    { name: "loadoutId", type: "uint32", defaultValue: 0 },
                    { name: "unknownDword2", type: "uint32", defaultValue: 0 },
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
                  defaultValue: [{}],
                  fields: [
                    { name: "unknownDword1", type: "uint32", defaultValue: 0 },
                    { name: "unknownDword2", type: "uint32", defaultValue: 0 },
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
                  defaultValue: [{}],
                  fields: [
                    { name: "unknownDword1", type: "uint32", defaultValue: 0 },
                    {
                      name: "unknownData1",
                      type: "schema",
                      fields: [
                        {
                          name: "unknownDword1",
                          type: "uint32",
                          defaultValue: 0,
                        },
                        {
                          name: "unknownByte1",
                          type: "uint8",
                          defaultValue: 0,
                        },
                        {
                          name: "unknownArray1",
                          type: "array",
                          defaultValue: [{}],
                          fields: [
                            {
                              name: "unknownDword1",
                              type: "uint32",
                              defaultValue: 0,
                            },
                          ],
                        },
                        {
                          name: "unknownArray2",
                          type: "array",
                          defaultValue: [{}],
                          fields: [
                            {
                              name: "unknownDword1",
                              type: "uint32",
                              defaultValue: 0,
                            },
                            {
                              name: "unknownDword2",
                              type: "uint32",
                              defaultValue: 0,
                            },
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
                { name: "unknownDword1", type: "uint32", defaultValue: 0 },
                { name: "unknownDword2", type: "uint32", defaultValue: 0 },
                { name: "unknownDword3", type: "uint32", defaultValue: 0 },
                { name: "unknownDword4", type: "uint32", defaultValue: 0 },
              ],
            },
            {
              name: "missionData",
              type: "schema",
              fields: [
                {
                  name: "unknownArray1",
                  type: "array",
                  defaultValue: [{}],
                  fields: [
                    {
                      name: "unknownData1",
                      type: "schema",
                      fields: [
                        {
                          name: "unknownDword1",
                          type: "uint32",
                          defaultValue: 0,
                        },
                        {
                          name: "unknownTime1",
                          type: "uint64string",
                          defaultValue: 0,
                        },
                        {
                          name: "unknownByte1",
                          type: "uint8",
                          defaultValue: 0,
                        },
                        {
                          name: "unknownDword2",
                          type: "uint32",
                          defaultValue: 0,
                        },
                        {
                          name: "unknownDword3",
                          type: "uint32",
                          defaultValue: 0,
                        },
                      ],
                    },
                    { name: "unknownDword1", type: "uint32", defaultValue: 0 },
                  ],
                },
                {
                  name: "unknownArray2",
                  type: "array",
                  defaultValue: [{}],
                  fields: [
                    {
                      name: "unknownData1",
                      type: "schema",
                      fields: [
                        {
                          name: "unknownDword1",
                          type: "uint32",
                          defaultValue: 0,
                        },
                        {
                          name: "unknownTime1",
                          type: "uint64string",
                          defaultValue: 0,
                        },
                        {
                          name: "unknownByte1",
                          type: "uint8",
                          defaultValue: 0,
                        },
                        {
                          name: "unknownDword2",
                          type: "uint32",
                          defaultValue: 0,
                        },
                        {
                          name: "unknownDword3",
                          type: "uint32",
                          defaultValue: 0,
                        },
                      ],
                    },
                    { name: "unknownFloat1", type: "float", defaultValue: 0 },
                  ],
                },
                {
                  name: "unknownArray3",
                  type: "array",
                  defaultValue: [{}],
                  fields: [
                    {
                      name: "unknownData1",
                      type: "schema",
                      fields: [
                        {
                          name: "unknownDword1",
                          type: "uint32",
                          defaultValue: 0,
                        },
                        {
                          name: "unknownTime1",
                          type: "uint64string",
                          defaultValue: 0,
                        },
                        {
                          name: "unknownByte1",
                          type: "uint8",
                          defaultValue: 0,
                        },
                        {
                          name: "unknownDword2",
                          type: "uint32",
                          defaultValue: 0,
                        },
                        {
                          name: "unknownDword3",
                          type: "uint32",
                          defaultValue: 0,
                        },
                      ],
                    },
                    { name: "unknownGuid1", type: "uint64string", defaultValue: "" },
                  ],
                },
                {
                  name: "unknownArray4",
                  type: "array",
                  defaultValue: [{}],
                  fields: [
                    {
                      name: "unknownData1",
                      type: "schema",
                      fields: [
                        {
                          name: "unknownData1",
                          type: "schema",
                          fields: [
                            {
                              name: "unknownDword1",
                              type: "uint32",
                              defaultValue: 0,
                            },
                            {
                              name: "unknownTime1",
                              type: "uint64string",
                              defaultValue: 0,
                            },
                            {
                              name: "unknownByte1",
                              type: "uint8",
                              defaultValue: 0,
                            },
                          ],
                        },
                        {
                          name: "unknownData2",
                          type: "schema",
                          fields: [
                            {
                              name: "unknownDword1",
                              type: "uint32",
                              defaultValue: 0,
                            },
                            {
                              name: "unknownTime1",
                              type: "uint64string",
                              defaultValue: 0,
                            },
                            {
                              name: "unknownByte1",
                              type: "uint8",
                              defaultValue: 0,
                            },
                          ],
                        },
                        {
                          name: "unknownData3",
                          type: "schema",
                          fields: [
                            {
                              name: "unknownDword1",
                              type: "uint32",
                              defaultValue: 0,
                            },
                            {
                              name: "unknownDword2",
                              type: "uint32",
                              defaultValue: 0,
                            },
                            {
                              name: "unknownDword3",
                              type: "uint32",
                              defaultValue: 0,
                            },
                          ],
                        },
                        {
                          name: "unknownDword1",
                          type: "uint32",
                          defaultValue: 0,
                        },
                        {
                          name: "unknownData4",
                          type: "schema",
                          fields: [
                            {
                              name: "unknownDword1",
                              type: "uint32",
                              defaultValue: 0,
                            },
                            {
                              name: "unknownDword2",
                              type: "uint32",
                              defaultValue: 0,
                            },
                            {
                              name: "unknownDword3",
                              type: "uint32",
                              defaultValue: 0,
                            },
                            {
                              name: "unknownDword4",
                              type: "uint32",
                              defaultValue: 0,
                            },
                            {
                              name: "unknownVector1",
                              type: "floatvector4",
                              defaultValue: 0,
                            },
                          ],
                        },
                      ],
                    },
                  ],
                },
                {
                  name: "unknownArray5",
                  type: "array",
                  defaultValue: [{}],
                  fields: [
                    {
                      name: "unknownData1",
                      type: "schema",
                      fields: [
                        {
                          name: "unknownData1",
                          type: "schema",
                          fields: [
                            {
                              name: "unknownDword1",
                              type: "uint32",
                              defaultValue: 0,
                            },
                            {
                              name: "unknownTime1",
                              type: "uint64string",
                              defaultValue: 0,
                            },
                            {
                              name: "unknownByte1",
                              type: "uint8",
                              defaultValue: 0,
                            },
                          ],
                        },
                        {
                          name: "unknownData2",
                          type: "schema",
                          fields: [
                            {
                              name: "unknownDword1",
                              type: "uint32",
                              defaultValue: 0,
                            },
                            {
                              name: "unknownTime1",
                              type: "uint64string",
                              defaultValue: 0,
                            },
                            {
                              name: "unknownByte1",
                              type: "uint8",
                              defaultValue: 0,
                            },
                          ],
                        },
                        {
                          name: "unknownData3",
                          type: "schema",
                          fields: [
                            {
                              name: "unknownDword1",
                              type: "uint32",
                              defaultValue: 0,
                            },
                            {
                              name: "unknownDword2",
                              type: "uint32",
                              defaultValue: 0,
                            },
                            {
                              name: "unknownDword3",
                              type: "uint32",
                              defaultValue: 0,
                            },
                          ],
                        },
                        {
                          name: "unknownDword1",
                          type: "uint32",
                          defaultValue: 0,
                        },
                        {
                          name: "unknownData4",
                          type: "schema",
                          fields: [
                            {
                              name: "unknownDword1",
                              type: "uint32",
                              defaultValue: 0,
                            },
                            {
                              name: "unknownDword2",
                              type: "uint32",
                              defaultValue: 0,
                            },
                            {
                              name: "unknownDword3",
                              type: "uint32",
                              defaultValue: 0,
                            },
                            {
                              name: "unknownDword4",
                              type: "uint32",
                              defaultValue: 0,
                            },
                            {
                              name: "unknownVector1",
                              type: "floatvector4",
                              defaultValue: 0,
                            },
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
              defaultValue: [{}],
              fields: [
                { name: "resourceType", type: "uint32", defaultValue: 0 },
                {
                  name: "resourceData",
                  type: "schema",
                  fields: characterResourceData,
                },
              ],
            },
            {
              name: "characterResourceChargers",
              type: "array",
              defaultValue: [{}],
              fields: [
                { name: "resourceChargerId", type: "uint32", defaultValue: 0 },
                {
                  name: "resourceChargerData",
                  type: "schema",
                  fields: [
                    {
                      name: "resourceChargerId",
                      type: "uint32",
                      defaultValue: 0,
                    },
                    { name: "unknownDword2", type: "uint32", defaultValue: 0 },
                    {
                      name: "itemData",
                      type: "schema",
                      fields: [
                        { name: "itemId", type: "uint32", defaultValue: 0 },
                        { name: "itemClass", type: "uint32", defaultValue: 0 },
                      ],
                    },
                  ],
                },
                { name: "unknownByte1", type: "uint8", defaultValue: 0 },
              ],
            },
            {
              name: "skillPointData",
              type: "schema",
              fields: [
                { name: "skillPointsGranted", type: "uint64string", defaultValue: "" },
                { name: "skillPointsTotal", type: "uint64string", defaultValue: "" },
                { name: "skillPointsSpent", type: "uint64string", defaultValue: "" },
                { name: "nextSkillPointPct", type: "double" },
                { name: "unknownTime1", type: "uint64string", defaultValue: "" },
                { name: "unknownDword1", type: "uint32", defaultValue: 0 },
              ],
            },
            {
              name: "skills",
              type: "array",
              defaultValue: [{}],
              fields: [
                { name: "skillLineId", type: "uint32", defaultValue: 0 },
                { name: "skillId", type: "uint32", defaultValue: 0 },
              ],
            },
            { name: "unknownBoolean8", type: "boolean", defaultValue: true },
            { name: "unknownQword1", type: "uint64string", defaultValue: "" },
            { name: "unknownDword38", type: "uint32", defaultValue: 0 },
            { name: "unknownQword2", type: "uint64string", defaultValue: "" },
            { name: "unknownQword3", type: "uint64string", defaultValue: "" },
            { name: "unknownDword39", type: "uint32", defaultValue: 0 },
            { name: "unknownDword40", type: "uint32", defaultValue: 0 },
            { name: "unknownBoolean9", type: "boolean", defaultValue: true },
            */
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
        { name: "unknownWord1", type: "uint16", defaultValue: 0 },
        { name: "channel", type: "uint16", defaultValue: 0 },
        { name: "characterId1", type: "uint64string", defaultValue: "0" },
        { name: "characterId2", type: "uint64string", defaultValue: "0" },
        { name: "identity1", type: "schema", fields: identitySchema },
        { name: "identity2", type: "schema", fields: identitySchema },
        { name: "message", type: "string", defaultValue: "" },
        { name: "position", type: "floatvector4", defaultValue: [0, 0, 0, 0] },
        { name: "unknownGuid1", type: "uint64string", defaultValue: "0" },
        { name: "unknownDword1", type: "uint32", defaultValue: 0 },
        { name: "color1", type: "uint32", defaultValue: 0 },
        { name: "color2", type: "uint32", defaultValue: 0 },
        { name: "unknownByte1", type: "uint8", defaultValue: 0 },
        { name: "unknownBoolean1", type: "boolean", defaultValue: false },
      ],
    },
  ],
  ["Chat.EnterArea", 0x060200, {}],
  ["Chat.DebugChat", 0x060300, {}],
  ["Chat.FromStringId", 0x060400, {}],
  //["Chat.TellEcho", 0x060500, {}],
  [
    "Chat.ChatText",
    0x060500,
    {
      fields: [
        { name: "message", type: "string", defaultValue: "" },
        { name: "unknownDword1", type: "uint32", defaultValue: 0 },
        { name: "color", type: "bytes", length: 4 },
        { name: "unknownDword2", type: "uint32", defaultValue: 0 },
        { name: "unknownByte3", type: "uint8", defaultValue: 0 },
        { name: "unknownByte4", type: "uint8", defaultValue: 0 },
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
      fields: [{ name: "guid", type: "uint64string", defaultValue: "0" }],
    },
  ],
  [
    "Command.InteractCancel",
    0x090800,
    {
      fields: [],
    },
  ],
  [
    "Command.InteractDebug",
    0x090900,
    {
      fields: [],
    },
  ],
  [
    "Command.InteractionList",
    0x090a00,
    {
      fields: [
        { name: "guid", type: "uint64string", defaultValue: "0" },
        { name: "unknownBoolean1", type: "boolean", defaultValue: false },
        {
          name: "unknownArray1",
          type: "array",
          defaultValue: [{}],
          fields: [
            { name: "unknownDword1", type: "uint32", defaultValue: 0 },
            { name: "unknownDword2", type: "uint32", defaultValue: 0 },
            { name: "unknownDword3", type: "uint32", defaultValue: 0 },
            { name: "unknownDword4", type: "uint32", defaultValue: 0 },
            { name: "unknownDword5", type: "uint32", defaultValue: 0 },
            { name: "unknownDword6", type: "uint32", defaultValue: 0 },
            { name: "unknownDword7", type: "uint32", defaultValue: 0 },
          ],
        },
        { name: "unknownString1", type: "string", defaultValue: "" },
        { name: "unknownBoolean2", type: "boolean", defaultValue: false },
        {
          name: "unknownArray2",
          type: "array",
          defaultValue: [{}],
          fields: [
            { name: "unknownString1", type: "uint32", defaultValue: 0 },
            { name: "unknownFloat2", type: "uint32", defaultValue: 0 },
            { name: "unknownDword1", type: "uint32", defaultValue: 0 },
            { name: "unknownDword2", type: "uint32", defaultValue: 0 },
            { name: "unknownDword3", type: "uint32", defaultValue: 0 },
            { name: "unknownDword4", type: "uint32", defaultValue: 0 },
            { name: "unknownDword5", type: "uint32", defaultValue: 0 },
            { name: "unknownDword6", type: "uint32", defaultValue: 0 },
            { name: "unknownDword7", type: "uint32", defaultValue: 0 },
          ],
        },
        { name: "unknownBoolean3", type: "boolean", defaultValue: false },
      ],
    },
  ],
  [
    "Command.InteractionSelect",
    0x090b00,
    {
      fields: [
        { name: "guid", type: "uint64string", defaultValue: "0" },
        { name: "interactionId", type: "uint32", defaultValue: 0 },
      ],
    },
  ],
  ["Command.InteractionStartWheel", 0x090c00, {}],
  ["Command.InteractionComplete", 0x090d00, {}],
  ["Command.StartFlashGame", 0x090e00, {}],
  [
    "Command.SetProfile",
    0x090f00,
    {
      fields: [
        { name: "profileId", type: "uint32", defaultValue: 0 },
        { name: "tab", type: "uint32", defaultValue: 0 },
      ],
    },
  ],
  ["Command.AddFriendRequest", 0x091000, {}],
  ["Command.RemoveFriendRequest", 0x091100, {}],
  ["Command.ConfirmFriendRequest", 0x091200, {}],
  ["Command.ConfirmFriendResponse", 0x091300, {}],
  ["Command.SetChatBubbleColor", 0x091400, {}],
  [
    "Command.PlayerSelect",
    0x091500,
    {
      fields: [
        { name: "characterId", type: "uint64string", defaultValue: "0" },
        { name: "guid", type: "uint64string", defaultValue: "0" },
      ],
    },
  ],
  [
    "Command.FreeInteractionNpc",
    0x091600,
    {
      fields: [],
    },
  ],
  ["Command.FriendsPositionRequest", 0x091700, {}],
  ["Command.MoveAndInteract", 0x091800, {}],
  ["Command.QuestAbandon", 0x091900, {}],
  ["Command.RecipeStart", 0x091a00, {}],
  ["Command.ShowRecipeWindow", 0x091b00, {}],
  ["Command.ActivateProfileFailed", 0x091c00, {}],
  ["Command.PlayDialogEffect", 0x091d00, {}],
  ["Command.ForceClearDialog", 0x091e00, {}],
  ["Command.IgnoreRequest", 0x091f00, {}],
  ["Command.SetActiveVehicleGuid", 0x092000, {}],
  ["Command.ChatChannelOn", 0x092100, {}],
  ["Command.ChatChannelOff", 0x092200, {}],
  ["Command.RequestPlayerPositions", 0x092300, {}],
  ["Command.RequestPlayerPositionsReply", 0x092400, {}],
  ["Command.SetProfileByItemDefinitionId", 0x092500, {}],
  ["Command.RequestRewardPreviewUpdate", 0x092600, {}],
  ["Command.RequestRewardPreviewUpdateReply", 0x092700, {}],
  ["Command.PlaySoundIdOnTarget", 0x092800, {}],
  ["Command.RequestPlayIntroEncounter", 0x092900, {}],
  ["Command.SpotPlayer", 0x092a00, {}],
  ["Command.SpotPlayerReply", 0x092b00, {}],
  ["Command.SpotPrimaryTarget", 0x092c00, {}],
  [
    "Command.InteractionString",
    0x092d00,
    {
      fields: [
        { name: "guid", type: "uint64string", defaultValue: "0" },
        { name: "stringId", type: "uint32", defaultValue: 0 },
        { name: "unknown4", type: "uint32", defaultValue: 0 },
      ],
    },
  ],
  ["Command.GiveCurrency", 0x092e00, {}],
  ["Command.HoldBreath", 0x092f00, {}],
  ["Command.ChargeCollision", 0x093000, {}],
  ["Command.DebrisLaunch", 0x093100, {}],
  ["Command.Suicide", 0x093200, {}],
  ["Command.RequestHelp", 0x093300, {}],
  ["Command.OfferHelp", 0x093400, {}],
  ["Command.Redeploy", 0x093500, {}],
  ["Command.PlayersInRadius", 0x093600, {}],
  ["Command.AFK", 0x093700, {}],
  ["Command.ReportPlayerReply", 0x093800, {}],
  ["Command.ReportPlayerCheckNameRequest", 0x093900, {}],
  ["Command.ReportPlayerCheckNameReply", 0x093a00, {}],
  ["Command.ReportRendererDump", 0x093b00, {}],
  ["Command.ChangeName", 0x093c00, {}],
  ["Command.NameValidation", 0x093d00, {}],
  ["Command.PlayerFileDistribution", 0x093e00, {}],
  ["Command.ZoneFileDistribution", 0x093f00, {}],
  [
    "Command.AddWorldCommand",
    0x094000,
    {
      fields: [{ name: "command", type: "string", defaultValue: "" }],
    },
  ],
  [
    "Command.AddZoneCommand",
    0x094100,
    {
      fields: [{ name: "command", type: "string", defaultValue: "" }],
    },
  ],
  [
    "Command.ExecuteCommand",
    0x094200,
    {
      fields: [
        { name: "commandHash", type: "uint32", defaultValue: 0 },
        { name: "arguments", type: "string", defaultValue: "" },
      ],
    },
  ],
  [
    "Command.ZoneExecuteCommand",
    0x094300,
    {
      fields: [
        { name: "commandHash", type: "uint32", defaultValue: 0 },
        { name: "arguments", type: "string", defaultValue: "" },
      ],
    },
  ],
  ["Command.RequestStripEffect", 0x094400, {}],
  [
    "Command.ItemDefinitionRequest",
    0x094500,
    {
      fields: [{ name: "ID", type: "uint32", defaultValue: "0" }],
    },
  ],
  [
    "Command.ItemDefinitionReply",
    0x094600,
    {
      fields: [
        {
          name: "data",
          type: "byteswithlength",
          fields: [
            { name: "ID", type: "uint32", defaultValue: 0 },
            { name: "unknownWord1", type: "uint16", defaultValue: 1 },
            { name: "unknownWord2", type: "uint16", defaultValue: 2 },
            { name: "unknownDword1", type: "uint32", defaultValue: 3 },
            { name: "unknownByte1", type: "uint8", defaultValue: 4 },
            { name: "unknownByte2", type: "uint8", defaultValue: 5 },
            { name: "unknownDword2", type: "uint32", defaultValue: 6 },
            { name: "unknownDword3", type: "uint32", defaultValue: 7 },
            { name: "unknownDword4", type: "uint32", defaultValue: 8 },
            { name: "unknownDword5", type: "uint32", defaultValue: 9 },
            { name: "unknownDword6", type: "uint32", defaultValue: 10 },
            { name: "unknownDword7", type: "uint32", defaultValue: 11 },
            { name: "unknownDword8", type: "uint32", defaultValue: 12 },
            { name: "unknownDword9", type: "uint32", defaultValue: 13 },
            { name: "unknownDword10", type: "uint32", defaultValue: 14 },
            { name: "unknownDword11", type: "uint32", defaultValue: 15 },
            { name: "unknownDword12", type: "uint32", defaultValue: 16 },
            { name: "unknownString1", type: "string", defaultValue: "string1" },
            { name: "unknownString2", type: "string", defaultValue: "string2" },
            { name: "unknownDword13", type: "uint32", defaultValue: 17 },
            { name: "unknownDword14", type: "uint32", defaultValue: 18 },
            { name: "unknownDword15", type: "uint32", defaultValue: 19 },
            { name: "unknownDword16", type: "uint32", defaultValue: 20 },
            { name: "unknownDword17", type: "uint32", defaultValue: 21 },
            { name: "unknownDword18", type: "uint32", defaultValue: 22 },
            { name: "unknownDword19", type: "uint32", defaultValue: 23 },
            { name: "unknownDword20", type: "uint32", defaultValue: 24 },
            { name: "unknownDword21", type: "uint32", defaultValue: 25 },
            { name: "unknownDword22", type: "uint32", defaultValue: 26 },
            { name: "unknownDword23", type: "uint32", defaultValue: 27 },
            { name: "unknownDword24", type: "uint32", defaultValue: 28 },
            { name: "unknownDword25", type: "uint32", defaultValue: 29 },
            { name: "unknownDword26", type: "uint32", defaultValue: 30 },
            { name: "unknownString3", type: "string", defaultValue: "string3" },
            { name: "unknownDword27", type: "uint32", defaultValue: 31 },
            { name: "unknownDword28", type: "uint32", defaultValue: 32 },
            { name: "unknownDword29", type: "uint32", defaultValue: 33 },
            { name: "unknownDword30", type: "uint32", defaultValue: 34 },
            { name: "unknownDword31", type: "uint32", defaultValue: 35 },
            { name: "unknownDword32", type: "uint32", defaultValue: 36 },
            { name: "unknownDword33", type: "uint32", defaultValue: 37 },
            { name: "unknownDword34", type: "uint32", defaultValue: 38 },
            { name: "unknownDword35", type: "uint32", defaultValue: 39 },
            { name: "unknownDword36", type: "uint32", defaultValue: 40 },
            { name: "unknownString4", type: "string", defaultValue: "string4" },
            { name: "unknownString5", type: "string", defaultValue: "string5" },
            { name: "unknownDword37", type: "uint32", defaultValue: 41 },
            { name: "unknownDword38", type: "uint32", defaultValue: 42 },
            { name: "unknownDword39", type: "uint32", defaultValue: 43 },
            { name: "unknownDword40", type: "uint32", defaultValue: 44 },
            { name: "unknownString6", type: "string", defaultValue: "string6" },
            { name: "unknownDword41", type: "uint32", defaultValue: 45 },
            { name: "unknownDword42", type: "uint32", defaultValue: 46 },
            { name: "unknownDword43", type: "uint32", defaultValue: 47 },
            { name: "unknownDword44", type: "uint32", defaultValue: 48 },
            { name: "unknownDword45", type: "uint32", defaultValue: 49 },
            { name: "unknownDword46", type: "uint32", defaultValue: 50 },
            { name: "unknownDword47", type: "uint32", defaultValue: 51 },
            { name: "unknownDword48", type: "uint32", defaultValue: 52 },
            { name: "unknownDword49", type: "uint32", defaultValue: 53 },
            { name: "unknownDword50", type: "uint32", defaultValue: 54 },
            { name: "unknownDword51", type: "uint32", defaultValue: 55 },
            { name: "unknownString7", type: "string", defaultValue: "string7" },
            { name: "unknownBoolean1", type: "boolean", defaultValue: false },
            { name: "unknownBoolean2", type: "boolean", defaultValue: false },
            { name: "unknownDword52", type: "uint32", defaultValue: 56 },
            { name: "unknownDword53", type: "uint32", defaultValue: 57 },
            { name: "unknownDword54", type: "uint32", defaultValue: 58 },
            { name: "unknownDword55", type: "uint32", defaultValue: 59 },
            { name: "unknownString8", type: "string", defaultValue: "string8" },
            { name: "unknownDword56", type: "uint32", defaultValue: 60 },
            { name: "unknownDword57", type: "uint32", defaultValue: 61 },
            { name: "unknownDword58", type: "uint32", defaultValue: 62 },
            {
              name: "unknownArray1",
              type: "array",
              defaultValue: [{}],
              fields: [
                { name: "unknownDword1", type: "uint32", defaultValue: 0 },
                {
                  name: "unknownData1",
                  type: "schema",
                  fields: [
                    { name: "unknownDword1", type: "uint32", defaultValue: 0 },
                    { name: "unknownByte1", type: "uint8", defaultValue: 0 },
                    { name: "unknownDword2", type: "uint32", defaultValue: 0 },
                    { name: "unknownDword3", type: "uint32", defaultValue: 0 },
                  ],
                },
                { name: "unknownDword2", type: "uint32", defaultValue: 0 },
              ],
            },
          ],
        },
      ],
    },
  ],
  [
    "Command.ItemDefinitions",
    0x094700,
    {
      fields: [
        {
          name: "data",
          type: "byteswithlength",
          fields: [
            {
              name: "itemDefinitions",
              type: "array",
              fields: [
                { name: "ID", type: "uint32", defaultValue: 0 },
                { name: "unknownWord1", type: "uint16", defaultValue: 1 },
                { name: "unknownWord2", type: "uint16", defaultValue: 2 },
                { name: "unknownDword1", type: "uint32", defaultValue: 3 },
                { name: "unknownByte1", type: "uint8", defaultValue: 4 },
                { name: "unknownByte2", type: "uint8", defaultValue: 5 },
                { name: "unknownDword2", type: "uint32", defaultValue: 6 },
                { name: "unknownDword3", type: "uint32", defaultValue: 7 },
                { name: "unknownDword4", type: "uint32", defaultValue: 8 },
                { name: "unknownDword5", type: "uint32", defaultValue: 9 },
                { name: "unknownDword6", type: "uint32", defaultValue: 10 },
                { name: "unknownDword7", type: "uint32", defaultValue: 11 },
                { name: "unknownDword8", type: "uint32", defaultValue: 12 },
                { name: "unknownDword9", type: "uint32", defaultValue: 13 },
                { name: "unknownDword10", type: "uint32", defaultValue: 14 },
                { name: "unknownDword11", type: "uint32", defaultValue: 15 },
                { name: "unknownDword12", type: "uint32", defaultValue: 16 },
                {
                  name: "unknownString1",
                  type: "string",
                  defaultValue: "string1",
                },
                {
                  name: "unknownString2",
                  type: "string",
                  defaultValue: "string2",
                },
                { name: "unknownDword13", type: "uint32", defaultValue: 17 },
                { name: "unknownDword14", type: "uint32", defaultValue: 18 },
                { name: "unknownDword15", type: "uint32", defaultValue: 19 },
                { name: "unknownDword16", type: "uint32", defaultValue: 20 },
                { name: "unknownDword17", type: "uint32", defaultValue: 21 },
                { name: "unknownDword18", type: "uint32", defaultValue: 22 },
                { name: "unknownDword19", type: "uint32", defaultValue: 23 },
                { name: "unknownDword20", type: "uint32", defaultValue: 24 },
                { name: "unknownDword21", type: "uint32", defaultValue: 25 },
                { name: "unknownDword22", type: "uint32", defaultValue: 26 },
                { name: "unknownDword23", type: "uint32", defaultValue: 27 },
                { name: "unknownDword24", type: "uint32", defaultValue: 28 },
                { name: "unknownDword25", type: "uint32", defaultValue: 29 },
                { name: "unknownDword26", type: "uint32", defaultValue: 30 },
                {
                  name: "unknownString3",
                  type: "string",
                  defaultValue: "string3",
                },
                { name: "unknownDword27", type: "uint32", defaultValue: 31 },
                { name: "unknownDword28", type: "uint32", defaultValue: 32 },
                { name: "unknownDword29", type: "uint32", defaultValue: 33 },
                { name: "unknownDword30", type: "uint32", defaultValue: 34 },
                { name: "unknownDword31", type: "uint32", defaultValue: 35 },
                { name: "unknownDword32", type: "uint32", defaultValue: 36 },
                { name: "unknownDword33", type: "uint32", defaultValue: 37 },
                { name: "unknownDword34", type: "uint32", defaultValue: 38 },
                { name: "unknownDword35", type: "uint32", defaultValue: 39 },
                { name: "unknownDword36", type: "uint32", defaultValue: 40 },
                {
                  name: "unknownString4",
                  type: "string",
                  defaultValue: "string4",
                },
                {
                  name: "unknownString5",
                  type: "string",
                  defaultValue: "string5",
                },
                { name: "unknownDword37", type: "uint32", defaultValue: 41 },
                { name: "unknownDword38", type: "uint32", defaultValue: 42 },
                { name: "unknownDword39", type: "uint32", defaultValue: 43 },
                { name: "unknownDword40", type: "uint32", defaultValue: 44 },
                {
                  name: "unknownString6",
                  type: "string",
                  defaultValue: "string6",
                },
                { name: "unknownDword41", type: "uint32", defaultValue: 45 },
                { name: "unknownDword42", type: "uint32", defaultValue: 46 },
                { name: "unknownDword43", type: "uint32", defaultValue: 47 },
                { name: "unknownDword44", type: "uint32", defaultValue: 48 },
                { name: "unknownDword45", type: "uint32", defaultValue: 49 },
                { name: "unknownDword46", type: "uint32", defaultValue: 50 },
                { name: "unknownDword47", type: "uint32", defaultValue: 51 },
                { name: "unknownDword48", type: "uint32", defaultValue: 52 },
                { name: "unknownDword49", type: "uint32", defaultValue: 53 },
                { name: "unknownDword50", type: "uint32", defaultValue: 54 },
                { name: "unknownDword51", type: "uint32", defaultValue: 55 },
                {
                  name: "unknownString7",
                  type: "string",
                  defaultValue: "string7",
                },
                {
                  name: "unknownBoolean1",
                  type: "boolean",
                  defaultValue: false,
                },
                {
                  name: "unknownBoolean2",
                  type: "boolean",
                  defaultValue: false,
                },
                { name: "unknownDword52", type: "uint32", defaultValue: 56 },
                { name: "unknownDword53", type: "uint32", defaultValue: 57 },
                { name: "unknownDword54", type: "uint32", defaultValue: 58 },
                { name: "unknownDword55", type: "uint32", defaultValue: 59 },
                {
                  name: "unknownString8",
                  type: "string",
                  defaultValue: "string8",
                },
                { name: "unknownDword56", type: "uint32", defaultValue: 60 },
                { name: "unknownDword57", type: "uint32", defaultValue: 61 },
                { name: "unknownDword58", type: "uint32", defaultValue: 62 },
                {
                  name: "unknownArray1",
                  type: "array",
                  defaultValue: [{}],
                  fields: [
                    { name: "unknownDword1", type: "uint32", defaultValue: 0 },
                    {
                      name: "unknownData1",
                      type: "schema",
                      fields: [
                        {
                          name: "unknownDword1",
                          type: "uint32",
                          defaultValue: 0,
                        },
                        {
                          name: "unknownByte1",
                          type: "uint8",
                          defaultValue: 0,
                        },
                        {
                          name: "unknownDword2",
                          type: "uint32",
                          defaultValue: 0,
                        },
                        {
                          name: "unknownDword3",
                          type: "uint32",
                          defaultValue: 0,
                        },
                      ],
                    },
                    { name: "unknownDword2", type: "uint32", defaultValue: 0 },
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
    "Command.EnableCompositeEffects",
    0x094800,
    {
      fields: [{ name: "enabled", type: "boolean", defaultValue: false }],
    },
  ],
  ["Command.StartRentalUpsell", 0x094900, {}],
  ["Command.SafeEject", 0x094a00, {}],
  // ["Command.ValidateDataForZoneOwnedTiles", 0x096e04, {}],
  [
    "Command.RequestWeaponFireStateUpdate",
    0x094b00,
    {
      fields: [{ name: "characterId", type: "uint64string", defaultValue: "0" }],
    },
  ],
  ["Command.SetInWater", 0x094c00, {}],
  ["Command.ClearInWater", 0x094d00, {}],
  ["Command.StartLogoutRequest", 0x094e00, {}],
  ["Command.Delivery", 0x094f00, {}],
  ["Command.DeliveryDisplayInfo", 0x095000, {}],
  ["Command.DeliveryManagerStatus", 0x095100, {}],
  ["Command.DeliveryManagerShowNotification", 0x095200, {}],

  /* GAP */

  [
    "Command.AddItem",
    0x09ea03,
    {
      fields: [
        { name: "itemId", type: "uint32", defaultValue: "0" },
        { name: "stackCount", type: "uint32", defaultValue: "0" },
        { name: "imageSetId", type: "uint32", defaultValue: "0" },
        { name: "imageTintValue", type: "uint32", defaultValue: "0" },
        { name: "NameId", type: "uint32", defaultValue: "0" },
        { name: "DescriptionId", type: "uint32", defaultValue: "0" },
      ],
    },
  ],
  ["Command.DeleteItem", 0x09eb03, {}],
  ["Command.AbilityReply", 0x09ec03, {}],
  ["Command.AbilityList", 0x09ed03, {}],
  ["Command.AbilityAdd", 0x09ee03, {}],
  ["Command.ServerInformation", 0x09ef03, {}],
  ["Command.SpawnNpcRequest", 0x09f003, {}],
  ["Command.NpcSpawn", 0x09f103, {}],
  ["Command.NpcFind", 0x09f203, {}],
  ["Command.NpcDisableSpawners", 0x09f303, {}],
  ["Command.NpcDespawn", 0x09f403, {}],
  ["Command.NpcCreateSpawn", 0x09f503, {}],
  ["Command.NpcInfoRequest", 0x09f603, {}],
  ["Command.NpcLocsRequest", 0x09f703, {}],
  ["Command.ZonePacketLogging", 0x09f803, {}],
  ["Command.ZoneListRequest", 0x09f903, {}],
  ["Command.ZoneListReply", 0x09fa03, {}],
  ["Command.TeleportToLocation", 0x09fb03, {}],
  ["Command.TeleportToLocationEx", 0x09fc03, {}],
  ["Command.TeleportManagedToLocation", 0x09fd03, {}],
  ["Command.CollectionStart", 0x09fe03, {}],
  ["Command.CollectionClear", 0x09ff03, {}],
  ["Command.CollectionRemove", 0x090004, {}],
  ["Command.CollectionAddEntry", 0x090104, {}],
  ["Command.CollectionRemoveEntry", 0x090204, {}],
  ["Command.CollectionRefresh", 0x090304, {}],
  ["Command.CollectionFill", 0x090404, {}],
  ["Command.ReloadData", 0x090504, {}],
  ["Command.OnlineStatusRequest", 0x090604, {}],
  ["Command.OnlineStatusReply", 0x090704, {}],
  ["Command.MovePlayerToWorldLocation", 0x090804, {}],
  ["Command.MovePlayerToTargetPlayer", 0x090904, {}],
  ["Command.LaunchAbilityId", 0x090a04, {}],
  ["Command.Kill", 0x090b04, {}],
  ["Command.FindEnemy", 0x090c04, {}],
  ["Command.FindEnemyReply", 0x090d04, {}],
  ["Command.FollowPlayer", 0x090e04, {}],
  ["Command.SetClientDebugFlag", 0x090f04, {}],
  ["Command.RunZoneScript", 0x091004, {}],
  ["Command.RequestAggroDist", 0x091104, {}],
  ["Command.AggroDist", 0x091204, {}],
  ["Command.TestRequirement", 0x091304, {}],
  ["Command.UITest", 0x091404, {}],
  ["Command.EncounterComplete", 0x091504, {}],
  ["Command.AddRewardBonus", 0x091604, {}],
  ["Command.SetClientBehaviorFlag", 0x091704, {}],
  ["Command.SetVipRank", 0x091804, {}],
  ["Command.ToggleDebugNpc", 0x091904, {}],
  ["Command.QuestStart", 0x091a04, {}],
  ["Command.SummonRequest", 0x091b04, {}],
  ["Command.QuestList", 0x091c04, {}],
  ["Command.EncounterStart", 0x091d04, {}],
  ["Command.RewardSetGive", 0x091e04, {}],
  ["Command.RewardSetList", 0x091f04, {}],
  ["Command.RewardHistory", 0x092004, {}],
  ["Command.RewardSetFind", 0x092104, {}],
  ["Command.QuestComplete", 0x092204, {}],
  ["Command.QuestStatus", 0x092304, {}],
  ["Command.CoinsSet", 0x092404, {}],
  ["Command.CoinsAdd", 0x092504, {}],
  ["Command.CoinsGet", 0x092604, {}],
  ["Command.AddCurrency", 0x092704, {}],
  ["Command.SetCurrency", 0x092804, {}],
  ["Command.ClearCurrency", 0x092904, {}],
  ["Command.RewardCurrency", 0x092a04, {}],
  ["Command.ListCurrencyRequest", 0x092b04, {}],
  ["Command.ListCurrencyReply", 0x092c04, {}],
  ["Command.RewardSetGiveRadius", 0x092d04, {}],
  ["Command.InGamePurchaseRequest", 0x092e04, {}],
  ["Command.InGamePurchaseReply", 0x092f04, {}],
  ["Command.TestNpcRelevance", 0x093004, {}],
  ["Command.GameTime", 0x093104, {}],
  ["Command.ClientTime", 0x093204, {}],
  ["Command.QuestObjectiveComplete", 0x093304, {}],
  ["Command.QuestObjectiveIncrement", 0x093404, {}],
  ["Command.EncounterStatus", 0x093504, {}],
  ["Command.GotoRequest", 0x093604, {}],
  ["Command.GotoReply", 0x093704, {}],
  ["Command.GotoWapointRequest", 0x093804, {}],
  ["Command.ServerVersion", 0x093904, {}],
  ["Command.ServerUptime", 0x093a04, {}],
  ["Command.DeleteItemById", 0x093b04, {}],
  ["Command.GetItemList", 0x093c04, {}],
  ["Command.GetItemListReply", 0x093d04, {}],
  ["Command.QuestHistory", 0x093e04, {}],
  ["Command.QuestHistoryClear", 0x093f04, {}],
  ["Command.TradeStatus", 0x094004, {}],
  ["Command.PathDataRequest", 0x094104, {}],
  ["Command.SummonReply", 0x094204, {}],
  ["Command.Broadcast", 0x094304, {}],
  ["Command.BroadcastZone", 0x0944404, {}],
  ["Command.BroadcastWorld", 0x094504, {}],
  ["Command.ListPets", 0x094604, {}],
  ["Command.PetSetUtility", 0x094704, {}],
  ["Command.PetTrick", 0x094804, {}],
  ["Command.RecipeAction", 0x094904, {}],
  ["Command.WorldKick", 0x094a04, {}],
  ["Command.EncounterRunTimerDisable", 0x094b04, {}],
  ["Command.ReloadPermissions", 0x094c04, {}],
  ["Command.CharacterFlags", 0x094d04, {}],
  ["Command.SetEncounterPartySizeOverride", 0x094e04, {}],
  ["Command.BuildTime", 0x094f04, {}],
  ["Command.SelectiveSpawnEnable", 0x095004, {}],
  ["Command.SelectiveSpawnAdd", 0x095104, {}],
  ["Command.SelectiveSpawnAddById", 0x095204, {}],
  ["Command.SelectiveSpawnClear", 0x095304, {}],
  ["Command.BecomeEnforcer", 0x095404, {}],
  ["Command.BecomeReferee", 0x095504, {}],
  ["Command.Profiler", 0x095604, {}],
  ["Command.WorldKickPending", 0x095704, {}],
  ["Command.ActivateMembership", 0x095804, {}],
  ["Command.JoinLobby", 0x095904, {}],
  ["Command.LeaveLobby", 0x095a04, {}],
  ["Command.SetMOTD", 0x095b04, {}],
  ["Command.Snoop", 0x095c04, {}],
  ["Command.JoinScheduledActivityRequest", 0x095d04, {}],
  ["Command.JoinScheduledActivityReply", 0x095e04, {}],
  ["Command.BecomeAmbassador", 0x095f04, {}],
  ["Command.CollectionsShow", 0x096004, {}],
  ["Command.GetZoneDrawData", 0x096104, {}],
  ["Command.ZoneDrawData", 0x096204, {}],
  ["Command.QuestAbandon", 0x096304, {}],
  ["Command.SetVehicleDefault", 0x096404, {}],
  ["Command.Freeze", 0x096504, {}],
  ["Command.ObjectiveAction", 0x096604, {}],
  ["Command.EquipAdd", 0x096704, {}],
  ["Command.Info", 0x096684, {}],
  ["Command.Silence", 0x096904, {}],
  ["Command.SpawnerStatus", 0x096a04, {}],
  ["Command.Behavior", 0x096b04, {}],
  ["Command.DebugFirstTimeEvents", 0x096c04, {}],
  ["Command.SetWorldWebEventAggregationPeriod", 0x096d04, {}],
  ["Command.GivePet", 0x096f04, {}],
  ["Command.NpcLocationRequest", 0x097004, {}],
  ["Command.BroadcastUniverse", 0x097104, {}],
  ["Command.TrackedEventLogToFile", 0x097204, {}],
  ["Command.TrackedEventEnable", 0x097304, {}],
  ["Command.TrackedEventEnableAll", 0x097404, {}],
  ["Command.Event", 0x097504, {}],
  ["Command.PerformAction", 0x097604, {}],
  ["Command.CountrySet", 0x097704, {}],
  ["Command.TrackedEventReloadConfig", 0x097804, {}],
  ["Command.SummonNPC", 0x097904, {}],
  ["Command.AchievementComplete", 0x097a04, {}],
  ["Command.AchievementList", 0x097b04, {}],
  ["Command.AchievementStatus", 0x097c04, {}],
  ["Command.AchievementObjectiveComplete", 0x097d04, {}],
  ["Command.AchievementObjectiveIncrement", 0x097e04, {}],
  ["Command.AchievementEnable", 0x097f04, {}],
  ["Command.AchievementReset", 0x098004, {}],
  ["Command.SetAffiliate", 0x098104, {}],
  ["Command.HousingInstanceEdit", 0x098204, {}],
  ["Command.WorldRequest", 0x098304, {}],
  ["Command.EnableNpcRelevanceBypass", 0x098404, {}],
  ["Command.GrantPromotionalBundle", 0x098504, {}],
  ["Command.ResetItemCooldowns", 0x098604, {}],
  ["Command.MountAdd", 0x098704, {}],
  ["Command.MountDelete", 0x098804, {}],
  ["Command.MountList", 0x098904, {}],
  ["Command.GetItemInfo", 0x098a04, {}],
  ["Command.RequestZoneComprehensiveDataDump", 0x098b04, {}],
  ["Command.RequestZoneComprehensiveDataDumpReply", 0x098c04, {}],
  ["Command.NpcDamage", 0x098d04, {}],
  ["Command.HousingAddTrophy", 0x098e04, {}],
  ["Command.TargetOfTarget", 0x098f04, {}],
  ["Command.AddAbilityEntry", 0x099004, {}],
  ["Command.RemoveAbilityEntry", 0x099104, {}],
  ["Command.PhaseList", 0x099204, {}],
  ["Command.PhaseAdd", 0x099304, {}],
  ["Command.PhaseRemove", 0x099404, {}],
  ["Command.AdventureAdd", 0x099504, {}],
  ["Command.AdventureSetPhase", 0x099604, {}],
  ["Command.SetFactionId", 0x099704, {}],
  ["Command.FacilitySpawnSetCollisionState", 0x099804, {}],
  ["Command.SkillBase", 0x099904, {}],
  ["Command.VehicleBase", 0x099a04, {}],
  [
    "Command.SpawnVehicle",
    0x099b04,
    {
      fields: [
        { name: "vehicleId", type: "uint32", defaultValue: 0 },
        { name: "factionId", type: "uint8", defaultValue: 0 },
        { name: "position", type: "floatvector3", defaultValue: [0, 0, 0] },
        { name: "heading", type: "float", defaultValue: 0.0 },
        { name: "unknownDword1", type: "uint32", defaultValue: 0 },
        { name: "autoMount", type: "boolean", defaultValue: false },
      ],
    },
  ],
  ["Command.SpawnVehicleReply", 0x099c04, {}],
  ["Command.DespawnVehicle", 0x099d04, {}],
  ["Command.WeaponStat", 0x099e04, {}],
  ["Command.GuildBase", 0x099f04, {}],
  ["Command.VisualizePhysics", 0x09a004, {}],
  ["Command.PlayerHealthSetRequest", 0x09a104, {}],
  ["Command.PlayerForceRespawnRequest", 0x09a204, {}],
  ["Command.ResourceRequest", 0x09a304, {}],
  ["Command.ZoneDebugMessage", 0x09a404, {}],
  ["Command.VerifyAdminTarget", 0x09a504, {}],
  ["Command.SetAllZoneFacilitiesToFactionRequest", 0x09a604, {}],
  ["Command.FacilityResetMapRequest", 0x09a704, {}],
  ["Command.DesignDataChanges", 0x09a804, {}],
  ["Command.GiveXp", 0x09a904, {}],
  ["Command.GiveRank", 0x09aa04, {}],
  ["Command.PlayerExperienceRequest", 0x09ab04, {}],
  ["Command.Noclip", 0x09ac04, {}],
  ["Command.VerifyAdminPermission", 0x09ad04, {}],
  ["Command.RegionRequest", 0x09ae04, {}],
  ["Command.RegionReply", 0x09af04, {}],
  ["Command.RegionRewardsReply", 0x09b004, {}],
  ["Command.RegionFactionRewardsReply", 0x09b104, {}],
  ["Command.FacilityListNpcReply", 0x09b204, {}],
  ["Command.FacilityListReply", 0x09b304, {}],
  ["Command.PingServer", 0x09b404, {}],
  ["Command.AnimationBase", 0x09b504, {}],
  ["Command.RewardBuffManagerGiveReward", 0x09b604, {}],
  ["Command.RewardBuffManagerAddPlayers", 0x09b704, {}],
  ["Command.RewardBuffManagerRemovePlayers", 0x09b804, {}],
  ["Command.RewardBuffManagerClearAllPlayers", 0x09b904, {}],
  ["Command.RewardBuffManagerListAll", 0x09ba04, {}],
  ["Command.QueryNpcRequest", 0x09bb04, {}],
  ["Command.QueryNpcReply", 0x09bc04, {}],
  ["Command.ZonePlayerCount", 0x09bd04, {}],
  ["Command.GriefRequest", 0x09be04, {}],
  ["Command.TeleportToObjectTag", 0x09bf04, {}],
  ["Command.DamagePlayer", 0x09c004, {}],
  ["Command.HexPermissions", 0x09c104, {}],
  ["Command.SpyRequest", 0x09c204, {}],
  ["Command.IncrementPersistenceVersion", 0x09c304, {}],
  ["Command.SpyReply", 0x09c404, {}],
  ["Command.GatewayProfilerRegistration", 0x09c504, {}],
  [
    "Command.RunSpeed",
    0x09c604,
    {
      fields: [{ name: "runSpeed", type: "float", defaultValue: 0.0 }],
    },
  ],
  ["Command.LocationRequest", 0x09c704, {}],
  ["Command.GriefBase", 0x09c804, {}],
  ["Command.PlayerRenameRequest", 0x09c904, {}],
  ["Command.EffectBase", 0x09ca04, {}],
  ["Command.AbilityBase", 0x09cb04, {}],
  ["Command.AcquireTimerBase", 0x09cc04, {}],
  ["Command.ReserveNameRequest", 0x09cd04, {}],
  ["Command.InternalConnectionBypass", 0x09ce04, {}],
  ["Command.Queue", 0x09cf04, {}],
  ["Command.CharacterStatQuery", 0x09d004, {}],
  ["Command.CharacterStatReply", 0x09d104, {}],
  ["Command.LockStatusReply", 0x09d204, {}],
  ["Command.StatTracker", 0x09d304, {}],
  ["Command.ItemBase", 0x09d404, {}],
  ["Command.CurrencyBase", 0x09d504, {}],
  ["Command.ImplantBase", 0x09d604, {}],
  ["Command.FileDistribution", 0x09d704, {}],
  ["Command.TopReports", 0x09d804, {}],
  ["Command.ClearAllReports", 0x09d904, {}],
  ["Command.GetReport", 0x09da04, {}],
  ["Command.DeleteReport", 0x09db04, {}],
  ["Command.UserReports", 0x09dc04, {}],
  ["Command.ClearUserReports", 0x09dd04, {}],
  ["Command.WhoRequest", 0x09de04, {}],
  ["Command.WhoReply", 0x09df04, {}],
  ["Command.FindRequest", 0x09e004, {}],
  ["Command.FindReply", 0x09e104, {}],
  ["Command.CaisBase", 0x09e204, {}],
  ["Command.MyRealtimeGatewayMovement", 0x09e304, {}],
  ["Command.ObserverCam", 0x09e404, {}],
  ["Command.AddItemContentPack", 0x09e504, {}],
  ["Command.CharacterSlotBase", 0x09e604, {}],
  ["Command.ResourceBase", 0x09e904, {}],
  ["Command.CharacterStateBase", 0x09ea04, {}],
  ["Command.ResistsBase", 0x09eb04, {}],
  ["Command.LoadoutBase", 0x09ec04, {}],
  ["Command.SetIgnoreMaxTrackables", 0x09ed04, {}],
  ["Command.ToggleNavigationLab", 0x09ee04, {}],
  ["Command.RequirementDebug", 0x09ef04, {}],
  ["Command.ConsolePrint", 0x09f004, {}],
  ["Command.GiveBotOrders", 0x09f204, {}],
  ["Command.ReceiveBotOrders", 0x09f304, {}],
  ["Command.ReconcileItemList", 0x09f404, {}],
  ["Command.ReconcileItemListReply", 0x09f504, {}],
  ["Command.FillItem", 0x09f604, {}],
  ["Command.HeatMapList", 0x09f704, {}],
  ["Command.HeatMapResponse", 0x09f804, {}],
  ["Command.Weather", 0x09fa04, {}],
  ["Command.LockBase", 0x09fb04, {}],
  ["Command.AbandonedItemsStats", 0x09fc04, {}],
  ["Command.DatabaseBase", 0x09fe04, {}],
  ["Command.ModifyEntitlement", 0x09ff04, {}],
  ["Command.EquipmentBase", 0x090105, {}],
  ["Command.ProfileBase", 0x090105, {}],
  ["Command.CountSpawnedItems", 0x090205, {}],
  ["Command.AddHeat", 0x090305, {}],
  ["Command.ReportHeat", 0x090405, {}],
  ["Command.FailTally", 0x090505, {}],
  ["Command.FailTallyReply", 0x090605, {}],
  ["Command.WeatherBase", 0x090705, {}],
  ["Command.EditSecurableArea", 0x090805, {}],
  ["Command.TestClearLocation", 0x090905, {}],
  ["Command.StatsBase", 0x090a05, {}],
  ["Command.FindItem", 0x090b05, {}],
  ["Command.SetOwnership", 0x090c05, {}],
  ["Command.InGamePurchasingBase", 0x090d05, {}],
  ["Command.Spectate", 0x090e05, {}],
  ["Command.ReportResponse", 0x090f05, {}],
  ["Command.ReportGameModeStatus", 0x091005, {}],
  ["Command.RegisterWithBattlEye", 0x091105, {}],
  ["Command.ListZoneAreas", 0x091205, {}],
  ["Command.DumpItemSpawnerStats", 0x091305, {}],
  ["Command.DatasheetsBase", 0x091405, {}],
  ["Command.VehicleAutoMount", 0x091505, {}],
  ["Command.EndGameMode", 0x091805, {}],
  ["Command.HeatControl", 0x091905, {}],
  ["Command.GameModeBase", 0x091a05, {}],
  ["Command.AddMatchScore", 0x091b05, {}],
  ["Command.NpcReport", 0x091c05, {}],
  [
    "ClientBeginZoning",
    0x0b,
    {
      fields: [
        { name: "zoneName", type: "string", defaultValue: "Z1" },
        { name: "zoneType", type: "int32", defaultValue: 4 },
        { name: "position", type: "floatvector4", defaultValue: [0, 0, 0, 1] },
        { name: "rotation", type: "floatvector4", defaultValue: [0, 0, 0, 1] },
        { name: "skyData", type: "schema", fields: skyData },
        // this byte breaks it for some reason (TODO)
        //{ name: "unknownByte1", type: "uint8", defaultValue: 0 },
        { name: "zoneId1", type: "uint32", defaultValue: 0 },
        { name: "zoneId2", type: "uint32", defaultValue: 0 },
        { name: "nameId", type: "uint32", defaultValue: 0 },
        { name: "unknownDword10", type: "uint32", defaultValue: 0 },
        { name: "unknownBoolean1", type: "boolean", defaultValue: false },
        { name: "unknownBoolean2", type: "boolean", defaultValue: false },
        { name: "unknownBoolean3", type: "boolean", defaultValue: false },
      ],
    },
  ],
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
  ["Character.None", 0x0f00, {}],
  [
    "Character.RemovePlayer",
    0x0f01,
    {
      fields: [
        { name: "characterId", type: "uint64string", defaultValue: "0" },
        { name: "unknownWord1", type: "uint16", defaultValue: 0 },
        { name: "unknownBool1", type: "boolean", defaultValue: 0 },
        { name: "unknownDword1", type: "uint32", defaultValue: 0 },
        { name: "unknownDword2", type: "uint32", defaultValue: 0 },
        { name: "unknownDword3", type: "uint32", defaultValue: 0 },
        { name: "unknownDword4", type: "uint32", defaultValue: 0 },
        { name: "unknownDword5", type: "uint32", defaultValue: 0 },
      ],
    },
  ],
  ["Character.Knockback", 0x0f02, {}],
  ["Character.UpdateHitpoints", 0x0f03, {}],
  ["Character.PlayAnimation", 0x0f04, {}],
  [
    "Character.UpdateScale",
    0x0f05,
    {
      fields: [
        {
          name: "characterId",
          type: "uint64string",
          defaultValue: "0x0000000000000000",
        },
        { name: "scale", type: "floatvector4", defaultValue: [20, 5, 20, 1] },
      ],
    },
  ],
  ["Character.UpdateTemporaryAppearance", 0x0f06, {}],
  ["Character.RemoveTemporaryAppearance", 0x0f07, {}],
  ["Character.SetLookAt", 0x0f08, {}],
  ["Character.RenamePlayer", 0x0f09, {}],
  [
    "Character.UpdateCharacterState",
    0x0f0a,
    {
      fields: [
        { name: "characterId", type: "uint64string", defaultValue: "0" },
        { name: "unknownDword1", type: "uint32", defaultValue: 0 },
        { name: "unknownDword2", type: "uint32", defaultValue: 0 },
        { name: "gameTime", type: "uint32", defaultValue: 0 },
      ],
    },
  ],
  ["Character.ExpectedSpeed", 0x0f0b, {}],
  ["Character.ScriptedAnimation", 0x0f0c, {}],
  ["Character.ThoughtBubble", 0x0f0d, {}],
  ["Character._REUSE_14", 0x0f0e, {}],
  ["Character.LootEvent", 0x0f0f, {}],
  ["Character.SlotCompositeEffectOverride", 0x0f10, {}],
  ["Character.EffectPackage", 0x0f11, {}],
  ["Character.PreferredLanguages", 0x0f12, {}],
  ["Character.CustomizationChange", 0x0f13, {}],
  ["Character.PlayerTitle", 0x0f14, {}],
  ["Character.AddEffectTagCompositeEffect", 0x0f15, {}],
  ["Character.RemoveEffectTagCompositeEffect", 0x0f16, {}],
  ["Character.SetSpawnAnimation", 0x0f17, {}],
  ["Character.CustomizeNpc", 0x0f18, {}],
  ["Character.SetSpawnerActivationEffect", 0x0f19, {}],
  ["Character.SetComboState", 0x0f1a, {}],
  ["Character.SetSurpriseState", 0x0f1b, {}],
  ["Character.RemoveNpcCustomization", 0x0f1c, {}],
  ["Character.ReplaceBaseModel", 0x0f1d, {}],
  ["Character.SetCollidable", 0x0f1e, {}],
  ["Character.UpdateOwner", 0x0f1f, {}],
  ["Character.WeaponStance", 0x0f20, {}],
  ["Character.UpdateTintAlias", 0x0f21, {}],
  ["Character.MoveOnRail", 0x0f22, {}],
  ["Character.ClearMovementRail", 0x0f23, {}],
  ["Character.MoveOnRelativeRail", 0x0f24, {}],
  [
    "Character.Destroyed",
    0x0f25,
    {
      fields: [
        { name: "guid", type: "uint64string", defaultValue: "0" },
        { name: "unknown1", type: "uint32", defaultValue: 0 },
        { name: "unknown2", type: "uint32", defaultValue: 0 },
        { name: "unknown3", type: "uint32", defaultValue: 0 },
        { name: "unknown4", type: "uint8", defaultValue: 0 },
      ],
    },
  ],
  ["Character.SeekTarget", 0x0f26, {}],
  ["Character.SeekTargetUpdate", 0x0f27, {}],
  [
    "Character.UpdateActiveWieldType",
    0x0f28,
    {
      fields: [
        { name: "characterId", type: "uint64string", defaultValue: "0" },
        { name: "unknownDword1", type: "uint32", defaultValue: 0 },
      ],
    },
  ],
  ["Character.LaunchProjectile", 0x0f29, {}],
  ["Character.SetSynchronizedAnimations", 0x0f2a, {}],
  ["Character.MemberStatus", 0x0f2b, {}],
  [
    "Character.KnockedOut",
    0x0f2c,
    {
      fields: [{ name: "guid", type: "uint64string", defaultValue: "0" }],
    },
  ],
  ["Character.KnockedOutDamageReport", 0x0f2d, {}],
  [
    "Character.Respawn",
    0x0f2e,
    {
      fields: [
        { name: "respawnType", type: "uint8", defaultValue: 0 },
        { name: "respawnGuid", type: "uint64string", defaultValue: "0" },
        { name: "profileId", type: "uint32", defaultValue: 0 },
        { name: "profileId2", type: "uint32", defaultValue: 0 },
      ],
    },
  ],
  [
    "Character.RespawnReply",
    0x0f2f,
    {
      fields: [
        { name: "characterId", type: "uint64string", defaultValue: "0" },
        { name: "status", type: "boolean", defaultValue: false },
      ],
    },
  ],
  ["Character.ActivateProfile", 0x0f31, {}],
  [
    "Character.Jet",
    0x0f32,
    {
      fields: [
        { name: "characterId", type: "uint64string", defaultValue: "0" },
        { name: "state", type: "uint8", defaultValue: 0 },
      ],
    },
  ],
  ["Character.Turbo", 0x0f33, {}],
  ["Character.StartRevive", 0x0f34, {}],
  ["Character.StopRevive", 0x0f35, {}],
  ["Character.ReadyToRevive", 0x0f36, {}],
  [
    "Character.SetFaction",
    0x0f37,
    {
      fields: [
        { name: "guid", type: "uint64string", defaultValue: "0" },
        { name: "factionId", type: "uint8", defaultValue: 0 },
      ],
    },
  ],
  [
    "Character.SetBattleRank",
    0x0f38,
    {
      fields: [
        { name: "characterId", type: "uint64string", defaultValue: "0" },
        { name: "battleRank", type: "uint32", defaultValue: 0 },
      ],
    },
  ],
  ["Character.StartHeal", 0x0f39, {}],
  ["Character.StopHeal", 0x0f3a, {}],
  [
    "Character.ManagedObject",
    0x0f3b,
    {
      fields: [
        { name: "objectCharacterId", type: "uint64string", defaultValue: "0" },
        { name: "guid2", type: "uint64string", defaultValue: "0" },
        { name: "characterId", type: "uint64string", defaultValue: "0" },
      ],
    },
  ],
  ["Character.MaterialTypeOverride", 0x0f3c, {}],
  ["Character.DebrisLaunch", 0x0f3d, {}],
  ["Character.HideCorpse", 0x0f3e, {}],
  [
    "Character.CharacterStateDelta",
    0x0f3f,
    {
      fields: [
        { name: "guid1", type: "uint64string", defaultValue: "0" },
        { name: "guid2", type: "uint64string", defaultValue: "0" },
        { name: "guid3", type: "uint64string", defaultValue: "0" },
        { name: "guid4", type: "uint64string", defaultValue: "0" },
        { name: "gameTime", type: "uint32", defaultValue: 0 },
      ],
    },
  ],
  ["Character.UpdateStat", 0x0f40, {}],
  ["Character.NonPriorityCharacters", 0x0f42, {}],
  ["Character.PlayWorldCompositeEffect", 0x0f43, {}],
  ["Character.AFK", 0x0f44, {}],
  [
    "Character.FullCharacterDataRequest",
    0x0f45,
    {
      fields: [{ name: "guid", type: "uint64string", defaultValue: "0" }],
    },
  ],
  ["Character.Deploy", 0x0f46, {}],
  ["Character.LowAmmoUpdate", 0x0f47, {}],
  ["Character.KilledBy", 0x0f48, {}],
  [
    "Character.MotorRunning",
    0x0f49,
    {
      fields: [
        { name: "characterId", type: "uint64string", defaultValue: "0" },
        { name: "unknownBool1", type: "boolean", defaultValue: false },
      ],
    },
  ],
  ["Character.DroppedIemNotification", 0x0f4a, {}],
  ["Character.NoSpaceNotification", 0x0f4b, {}],
  ["Character.ReloadNotification", 0x0f4c, {}],
  ["Character.MountBlockedNotification", 0x0f4d, {}],
  ["Character.StartMultiStateDeath", 0x0f4f, {}],
  ["Character.AggroLevel", 0x0f50, {}],
  ["Character.DoorState", 0x0f51, {}],
  ["Character.RequestToggleDoorState", 0x0f52, {}],
  ["Character.SetAllowRespawn", 0x0f54, {}],
  ["Character.UpdateGuildTag", 0x0f55, {}],
  ["Character.MovementVersion", 0x0f56, {}],
  ["Character.RequestMovementVersion", 0x0f57, {}],
  ["Character.DailyRepairMaterials", 0x0f58, {}],
  ["Character.BeginPreviewInteraction", 0x0f59, {}],
  ["Character.TransportPlayerToFactionHub", 0x0f5a, {}],
  ["Character.EnterCache", 0x0f5b, {}],
  ["Character.ExitCache", 0x0f5c, {}],
  ["Character.TransportPlayerToGatheringZone", 0x0f5d, {}],
  ["Character.UpdateTwitchInfo", 0x0f5e, {}],
  ["Character.UpdateSimpleProxyHealth", 0x0f5f, {}],
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
  [
    "ClientUpdate.UpdateStat",
    0x110500,
    {
      fields: [
        {
          name: "stats",
          type: "array",
          defaultValue: [{}],
          fields: statDataSchema,
        },
      ],
    },
  ],
  ["ClientUpdate.CollectionStart", 0x110600, {}],
  ["ClientUpdate.CollectionRemove", 0x110700, {}],
  ["ClientUpdate.CollectionAddEntry", 0x110800, {}],
  ["ClientUpdate.CollectionRemoveEntry", 0x110900, {}],
  [
    "ClientUpdate.UpdateLocation",
    0x110a00,
    {
      fields: [
        { name: "position", type: "floatvector4", defaultValue: [0, 0, 0, 1] },
        { name: "rotation", type: "floatvector4", defaultValue: [0, 0, 0, 1] },
        { name: "triggerLoadingScreen", type: "boolean", defaultValue: false },
        { name: "unknownByte1", type: "uint8", defaultValue: 0 },
        { name: "unknownBool2", type: "boolean", defaultValue: false },
      ],
    },
  ],
  ["ClientUpdate.Mana", 0x110b00, {}],
  ["ClientUpdate.UpdateProfileExperience", 0x110c00, {}],
  ["ClientUpdate.AddProfileAbilitySetApl", 0x110d00, {}],
  ["ClientUpdate.AddEffectTag", 0x110e00, {}],
  ["ClientUpdate.RemoveEffectTag", 0x110f00, {}],
  ["ClientUpdate.UpdateProfileRank", 0x111000, {}],
  ["ClientUpdate.CoinCount", 0x111100, {}],
  ["ClientUpdate.DeleteProfile", 0x111200, {}],
  [
    "ClientUpdate.ActivateProfile",
    0x111300,
    {
      fields: [
        {
          name: "profileData",
          type: "byteswithlength",
          fields: profileDataSchema,
        },
        {
          name: "equipmentModels",
          type: "array",
          defaultValue: [{}],
          fields: equipmentModelSchema,
        },
        { name: "unknownDword1", type: "uint32", defaultValue: 0 },
        { name: "unknownDword2", type: "uint32", defaultValue: 0 },
        { name: "actorModelId", type: "uint32", defaultValue: 0 },
        { name: "tintAlias", type: "string", defaultValue: "" },
        { name: "decalAlias", type: "string", defaultValue: "" },
      ],
    },
  ],
  ["ClientUpdate.AddAbility", 0x111400, {}],
  ["ClientUpdate.NotifyPlayer", 0x111500, {}],
  ["ClientUpdate.UpdateProfileAbilitySetApl", 0x111600, {}],
  ["ClientUpdate.RemoveActionBars", 0x111700, {}],
  ["ClientUpdate.UpdateActionBarSlot", 0x111800, {}],
  [
    "ClientUpdate.DoneSendingPreloadCharacters",
    0x111900,
    {
      fields: [{ name: "done", type: "boolean", defaultValue: false }],
    },
  ],
  ["ClientUpdate.SetGrandfatheredStatus", 0x111a00, {}],
  ["ClientUpdate.UpdateActionBarSlotUsed", 0x111b00, {}],
  ["ClientUpdate.PhaseChange", 0x111c00, {}],
  ["ClientUpdate.UpdateKingdomExperience", 0x111d00, {}],
  ["ClientUpdate.DamageInfo", 0x111e00, {}],
  [
    "ClientUpdate.ZonePopulation",
    0x112f00,
    {
      fields: [
        {
          name: "populations",
          type: "array",
          defaultValue: [{}],
          elementType: "uint8",
        },
      ],
    },
  ],
  [
    // 2016
    "ClientUpdate.RespawnLocations",
    0x111f00,
    {
      fields: [
        { name: "unknownFlags", type: "uint8", defaultValue: 0 },
        {
          name: "locations",
          type: "array",
          defaultValue: [{}],
          fields: respawnLocationDataSchema,
        },
        { name: "unknownDword1", type: "uint32", defaultValue: 0 },
        { name: "unknownDword2", type: "uint32", defaultValue: 0 },
        {
          name: "locations2",
          type: "array",
          defaultValue: [{}],
          fields: respawnLocationDataSchema,
        },
      ],
    },
  ],
  [
    // 2016
    "ClientUpdate.ModifyMovementSpeed",
    0x112000,
    {
      fields: [
        { name: "speed", type: "float", defaultValue: 10 },
        { name: "version?", type: "uint8", defaultValue: 1 },
      ],
    },
  ],
  [
    "ClientUpdate.ModifyTurnRate",
    0x112100,
    {
      fields: [
        { name: "speed", type: "float", defaultValue: 10 },
        { name: "version?", type: "uint8", defaultValue: 1 },
      ],
    },
  ],
  [
    "ClientUpdate.ModifyStrafeSpeed",
    0x112200,
    {
      fields: [
        { name: "speed", type: "float", defaultValue: 10 },
        { name: "version?", type: "uint8", defaultValue: 1 },
      ],
    },
  ],
  ["ClientUpdate.UpdateManagedLocation", 0x112300, {}],
  [
    "ClientUpdate.ManagedMovementVersion",
    0x112400,
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
    0x112500,
    {
      fields: [
        { name: "unknownDword1", type: "uint32", defaultValue: 0 },
        { name: "unknownByte1", type: "uint8", defaultValue: 0 },
        { name: "unknownFloat1", type: "float", defaultValue: 0.0 },
      ],
    },
  ],
  ["ClientUpdate.SpotProbation", 0x112600, {}],
  ["ClientUpdate.DailyRibbonCount", 0x112700, {}],
  ["ClientUpdate.DespawnNpcUpdate", 0x112900, {}],
  ["ClientUpdate.LoyaltyPoints", 0x112a00, {}],
  ["ClientUpdate.ResetMissionRespawnTimer", 0x112b00, {}],
  ["ClientUpdate.Freeze", 0x112c00, {}],
  ["ClientUpdate.InGamePurchaseResult", 0x112d00, {}],
  ["ClientUpdate.QuizComplete", 0x112e00, {}],
  [
    "ClientUpdate.StartTimer",
    0x112f00,
    {
      fields: [
        { name: "stringId", type: "uint32", defaultValue: 0 },
        { name: "time", type: "uint32", defaultValue: 10000 },
        { name: "message", type: "string", defaultValue: "hello" },
      ],
    },
  ],
  [
    "ClientUpdate.CompleteLogoutProcess",
    0x113000,
    {
      fields: [],
    },
  ],
  ["ClientUpdate.ProximateItems", 0x113100, {}],
  [
    "ClientUpdate.TextAlert",
    0x113200,
    {
      fields: [{ name: "message", type: "string", defaultValue: "hello" }],
    },
  ],
  ["ClientUpdate.ClearEntitlementValues", 0x113300, {}],
  ["ClientUpdate.AddEntitlementValue", 0x113400, {}],
  [
    "ClientUpdate.NetworkProximityUpdatesComplete",
    0x113500,
    {
      fields: [{ name: "done", type: "boolean", defaultValue: false }],
    },
  ],
  ["ClientUpdate.FileValidationRequest", 0x113600, {}],
  ["ClientUpdate.FileValidationResponse", 0x113700, {}],
  ["ClientUpdate.DeathMetrics", 0x113800, {}],
  ["ClientUpdate.ManagedObjectRequestControl", 0x113900, {}],
  ["ClientUpdate.ManagedObjectResponseControl", 0x113a00, {}],
  ["ClientUpdate.ManagedObjectReleaseControl", 0x113b00, {}],
  ["ClientUpdate.SetCurrentAdventure", 0x113c00, {}],
  ["ClientUpdate.CharacterSlot", 0x113d00, {}],
  ["ClientUpdate.CustomizationData", 0x113e00, {}],
  ["ClientUpdate.UpdateCurrency", 0x113f00, {}],
  ["ClientUpdate.AddNotifications", 0x114000, {}],
  ["ClientUpdate.RemoveNotifications", 0x114100, {}],
  ["ClientUpdate.NpcRelevance", 0x114200, {}],
  ["ClientUpdate.InitiateNameChange", 0x114300, {}],
  ["ClientUpdate.NameChangeResult", 0x114400, {}],
  ["ClientUpdate.MonitorTimeDrift", 0x114500, {}],
  ["ClientUpdate.NotifyServerOfStalledEvent", 0x114600, {}],
  ["ClientUpdate.UpdateSights", 0x114700, {}],
  ["ClientUpdate.UpdateRewardAndGrinderState", 0x114900, {}],
  ["ClientUpdate.UpdateActivityMetrics", 0x114b00, {}],
  ["ClientUpdate.StopWithError", 0x114c00, {}],
  ["ClientUpdate.SetWorldWipeTimer", 0x114d00, {}],
  ["ClientUpdate.UpdateLockoutTimes", 0x114e00, {}],
  ["ClientUpdate.ZoneStatus", 0x114f00, {}],
  ["ClientUpdate.SetDataCenter", 0x115000, {}],
  ["ClientUpdate.UpdateBattlEyeRegistration", 0x115100, {}],
  ["MiniGame", 0x12, {}],
  ["Group", 0x13, {}],
  ["Encounter", 0x14, {}],
  ["Inventory", 0x15, {}],
  [
    "SendZoneDetails",
    0x16,
    {
      fields: [
        { name: "zoneName", type: "string", defaultValue: "" },
        { name: "zoneType", type: "uint32", defaultValue: 0 },
        { name: "unknownBoolean1", type: "boolean", defaultValue: false },
        { name: "skyData", type: "schema", fields: skyData },
        { name: "zoneId1", type: "uint32", defaultValue: 0 },
        { name: "zoneId2", type: "uint32", defaultValue: 0 },
        { name: "nameId", type: "uint32", defaultValue: 0 },
        { name: "unknownBoolean2", type: "boolean", defaultValue: false },
        { name: "unknownString1", type: "string", defaultValue: "" },
        { name: "unknownBoolean3", type: "boolean", defaultValue: false },
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
          defaultValue: [{}],
          fields: [
            { name: "profileId", type: "uint32", defaultValue: 0 },
            {
              name: "profileData",
              type: "schema",
              fields: [
                { name: "profileId", type: "uint32", defaultValue: 0 },
                { name: "nameId", type: "uint32", defaultValue: 0 },
                { name: "descriptionId", type: "uint32", defaultValue: 0 },
                { name: "profileType", type: "uint32", defaultValue: 0 },
                { name: "iconId", type: "uint32", defaultValue: 0 },
                { name: "unknownDword6", type: "uint32", defaultValue: 0 },
                { name: "unknownDword7", type: "uint32", defaultValue: 0 },
                { name: "unknownDword8", type: "uint32", defaultValue: 0 },
                { name: "unknownDword9", type: "uint32", defaultValue: 0 },
                {
                  name: "unknownBoolean1",
                  type: "boolean",
                  defaultValue: false,
                },
                {
                  name: "unknownBoolean2",
                  type: "boolean",
                  defaultValue: false,
                },
                { name: "unknownDword10", type: "uint32", defaultValue: 0 },
                { name: "unknownDword11", type: "uint32", defaultValue: 0 },
                {
                  name: "unknownArray1",
                  type: "array",
                  defaultValue: [{}],
                  fields: [
                    { name: "unknownDword1", type: "uint32", defaultValue: 0 },
                    { name: "unknownDword2", type: "uint32", defaultValue: 0 },
                  ],
                },
                { name: "firstPersonArms1", type: "uint32", defaultValue: 0 },
                { name: "firstPersonArms2", type: "uint32", defaultValue: 0 },
                { name: "unknownDword14", type: "uint32", defaultValue: 0 },
                {
                  name: "unknownArray2",
                  type: "array",
                  defaultValue: [{}],
                  fields: [
                    { name: "unknownDword1", type: "uint32", defaultValue: 0 },
                  ],
                },
                { name: "unknownFloat1", type: "float", defaultValue: 0.0 },
                { name: "unknownFloat2", type: "float", defaultValue: 0.0 },
                { name: "unknownFloat3", type: "float", defaultValue: 0.0 },
                { name: "unknownFloat4", type: "float", defaultValue: 0.0 },
                { name: "unknownDword15", type: "uint32", defaultValue: 0 },
                { name: "unknownDword16", type: "uint32", defaultValue: 0 },
                { name: "unknownDword17", type: "uint32", defaultValue: 0 },
                { name: "imageSetId1", type: "uint32", defaultValue: 0 },
                { name: "imageSetId2", type: "uint32", defaultValue: 0 },
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
        { name: "time", type: "uint64string", defaultValue: "0" },
        { name: "cycleSpeed", type: "float", defaultValue: 0.0 },
        { name: "unknownBoolean1", type: "boolean", defaultValue: false },
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
  ["Recipe.Add", 0x2601, { fields: recipeData }],
  ["Recipe.ComponentUpdate", 0x2602, {}],
  ["Recipe.Remove", 0x2603, {}],
  ["Recipe.Discovery", 0x2604, { fields: [] }],
  [
    "Recipe.List",
    0x2609,
    {
      fields: [
        {
          name: "recipes",
          type: "array",
          defaultValue: [{}],
          fields: recipeData,
        },
      ],
    },
  ],
  ["InGamePurchase.PreviewOrderRequest", 0x270100, {}],
  ["InGamePurchase.PreviewOrderResponse", 0x270200, {}],
  ["InGamePurchase.PlaceOrderRequest", 0x270300, {}],
  ["InGamePurchase.PlaceOrderResponse", 0x270400, {}],
  [
    "InGamePurchase.StoreBundles",
    0x27050000,
    {
      fields: [
        { name: "unknownDword1", type: "uint32", defaultValue: 0 },
        { name: "unknownDword2", type: "uint32", defaultValue: 0 },
        { name: "storeId", type: "uint32", defaultValue: 0 },
        { name: "unknownDword3", type: "uint32", defaultValue: 0 },
        { name: "unknownDword4", type: "uint32", defaultValue: 0 },
        {
          name: "imageData",
          type: "schema",
          fields: [
            { name: "imageSetId", type: "string", defaultValue: "" },
            { name: "imageTintValue", type: "string", defaultValue: "" },
          ],
        },
        {
          name: "storeBundles",
          type: "array",
          defaultValue: [{}],
          fields: [
            { name: "bundleId", type: "uint32", defaultValue: 0 },
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
                        { name: "bundleId", type: "uint32", defaultValue: 0 },
                        { name: "nameId", type: "uint32", defaultValue: 0 },
                        {
                          name: "descriptionId",
                          type: "uint32",
                          defaultValue: 0,
                        },
                        {
                          name: "unknownDword4",
                          type: "uint32",
                          defaultValue: 0,
                        },
                        {
                          name: "imageData",
                          type: "schema",
                          fields: [
                            {
                              name: "imageSetId",
                              type: "string",
                              defaultValue: "",
                            },
                            {
                              name: "imageTintValue",
                              type: "string",
                              defaultValue: "",
                            },
                          ],
                        },
                        {
                          name: "unknownBoolean1",
                          type: "boolean",
                          defaultValue: false,
                        },
                        {
                          name: "unknownString1",
                          type: "string",
                          defaultValue: "",
                        },
                        {
                          name: "stationCurrencyId",
                          type: "uint32",
                          defaultValue: 0,
                        },
                        { name: "price", type: "uint32", defaultValue: 0 },
                        { name: "currencyId", type: "uint32", defaultValue: 0 },
                        {
                          name: "currencyPrice",
                          type: "uint32",
                          defaultValue: 0,
                        },
                        {
                          name: "unknownDword9",
                          type: "uint32",
                          defaultValue: 0,
                        },
                        {
                          name: "unknownTime1",
                          type: "uint64string",
                          defaultValue: "0",
                        },
                        {
                          name: "unknownTime2",
                          type: "uint64string",
                          defaultValue: "0",
                        },
                        {
                          name: "unknownDword10",
                          type: "uint32",
                          defaultValue: 0,
                        },
                        {
                          name: "unknownBoolean2",
                          type: "boolean",
                          defaultValue: false,
                        },
                        {
                          name: "itemListDetails",
                          type: "array",
                          defaultValue: [{}],
                          fields: [
                            {
                              name: "unknownDword1",
                              type: "uint32",
                              defaultValue: 0,
                            },
                            {
                              name: "imageSetId",
                              type: "uint32",
                              defaultValue: 0,
                            },
                            { name: "itemId", type: "uint32", defaultValue: 0 },
                            {
                              name: "unknownString1",
                              type: "string",
                              defaultValue: "",
                            },
                          ],
                        },
                      ],
                    },
                    { name: "storeId", type: "uint32", defaultValue: 0 },
                    { name: "categoryId", type: "uint32", defaultValue: 0 },
                    {
                      name: "unknownBoolean1",
                      type: "boolean",
                      defaultValue: false,
                    },
                    { name: "unknownDword3", type: "uint32", defaultValue: 0 },
                    { name: "unknownDword4", type: "uint32", defaultValue: 0 },
                    { name: "unknownDword5", type: "uint32", defaultValue: 0 },
                    { name: "unknownDword6", type: "uint32", defaultValue: 0 },
                    { name: "unknownDword7", type: "uint32", defaultValue: 0 },
                    { name: "unknownDword8", type: "uint32", defaultValue: 0 },
                    { name: "unknownDword9", type: "uint32", defaultValue: 0 },
                    { name: "unknownDword10", type: "uint32", defaultValue: 0 },
                    {
                      name: "unknownBoolean2",
                      type: "boolean",
                      defaultValue: false,
                    },
                    {
                      name: "unknownBoolean3",
                      type: "boolean",
                      defaultValue: false,
                    },
                    {
                      name: "unknownBoolean4",
                      type: "boolean",
                      defaultValue: false,
                    },
                  ],
                },
                { name: "unknownDword1", type: "uint32", defaultValue: 0 },
                { name: "unknownDword2", type: "uint32", defaultValue: 0 },
                { name: "unknownDword3", type: "uint32", defaultValue: 0 },
                { name: "unknownDword4", type: "uint32", defaultValue: 0 },
                { name: "unknownDword5", type: "uint32", defaultValue: 0 },
                { name: "unknownDword6", type: "uint32", defaultValue: 0 },
                { name: "unknownString1", type: "string", defaultValue: "" },
                { name: "unknownDword7", type: "uint32", defaultValue: 0 },
                { name: "unknownDword8", type: "uint32", defaultValue: 0 },
                { name: "unknownDword9", type: "uint32", defaultValue: 0 },
                { name: "memberSalePrice", type: "uint32", defaultValue: 0 },
                { name: "unknownDword11", type: "uint32", defaultValue: 0 },
                { name: "unknownString2", type: "string", defaultValue: "" },
                { name: "unknownDword12", type: "uint32", defaultValue: 0 },
                {
                  name: "unknownBoolean1",
                  type: "boolean",
                  defaultValue: false,
                },
              ],
            },
          ],
        },
        { name: "offset", type: "debugoffset" },
      ],
    },
  ],
  ["InGamePurchase.StoreBundleStoreUpdate", 0x27050001, {}],
  ["InGamePurchase.StoreBundleStoreBundleUpdate", 0x27050002, {}],
  ["InGamePurchase.StoreBundleCategoryGroups", 0x270600, {}],
  [
    "InGamePurchase.StoreBundleCategories",
    0x270700,
    {
      fields: [
        {
          name: "categories",
          type: "array",
          defaultValue: [{}],
          fields: [
            { name: "categoryId", type: "uint32", defaultValue: 0 },
            {
              name: "categoryData",
              type: "schema",
              fields: [
                { name: "categoryId", type: "uint32", defaultValue: 0 },
                { name: "unknownDword1", type: "uint32", defaultValue: 0 },
                { name: "unknownString1", type: "string", defaultValue: "" },
                { name: "unknownString2", type: "string", defaultValue: "" },
                {
                  name: "unknownBoolean1",
                  type: "boolean",
                  defaultValue: false,
                },
                { name: "unknownDword2", type: "uint32", defaultValue: 0 },
                {
                  name: "unknownArray1",
                  type: "array",
                  defaultValue: [{}],
                  fields: [
                    { name: "unknownDword1", type: "uint32", defaultValue: 0 },
                    { name: "unknownDword2", type: "uint32", defaultValue: 0 },
                    { name: "unknownDword3", type: "uint32", defaultValue: 0 },
                  ],
                },
                { name: "unknownDword3", type: "uint32", defaultValue: 0 },
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
        { name: "unknownDword1", type: "uint32", defaultValue: 0 },
        { name: "unknownBoolean1", type: "boolean", defaultValue: false },
        { name: "unknownDword2", type: "uint32", defaultValue: 0 },
        { name: "unknownDword3", type: "uint32", defaultValue: 0 },
        { name: "unknownString1", type: "string", defaultValue: "" },
        { name: "unknownString2", type: "string", defaultValue: "" },
        { name: "unknownBoolean2", type: "boolean", defaultValue: false },
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
        { name: "unknownBoolean1", type: "boolean", defaultValue: false },
        { name: "unknownBoolean2", type: "boolean", defaultValue: false },
      ],
    },
  ],
  [
    "InGamePurchase.AcccountInfoRequest",
    0x271900,
    {
      fields: [{ name: "locale", type: "string", defaultValue: "" }],
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
      fields: [{ name: "bundleId", type: "uint32", defaultValue: 0 }],
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
          defaultValue: [{}],
          fields: [{ name: "id", type: "uint32", defaultValue: 0 }],
        },
        { name: "unknown2", type: "uint32", defaultValue: 0 },
        {
          name: "unknown3",
          type: "array",
          defaultValue: [{}],
          fields: [
            { name: "scheduleId", type: "uint32", defaultValue: 0 },
            { name: "time", type: "uint32", defaultValue: 0 },
            { name: "unknown1", type: "uint32", defaultValue: 0 },
            { name: "unknown2", type: "uint8", defaultValue: 0 },
            { name: "unknown3", type: "uint8", defaultValue: 0 },
            { name: "unknown4", type: "uint8", defaultValue: 0 },
            { name: "unknown5", type: "uint8", defaultValue: 0 },
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
          defaultValue: [{}],
          fields: [
            { name: "commandId", type: "uint32", defaultValue: 0 },
            {
              name: "commandData",
              type: "schema",
              fields: [
                { name: "commandId", type: "uint32", defaultValue: 0 },
                { name: "menuStringId", type: "uint32", defaultValue: 0 },
                { name: "chatStringId", type: "uint32", defaultValue: 0 },
                { name: "unknownDword1", type: "uint32", defaultValue: 0 },
                { name: "unknownDword2", type: "uint32", defaultValue: 0 },
                { name: "unknownDword3", type: "uint32", defaultValue: 0 },
                { name: "unknownDword4", type: "uint32", defaultValue: 0 },
                { name: "unknownDword5", type: "uint32", defaultValue: 0 },
                { name: "unknownDword6", type: "uint32", defaultValue: 0 },
                { name: "unknownDword7", type: "uint32", defaultValue: 0 },
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
          defaultValue: [{}],
          fields: [
            { name: "unknown1", type: "uint32", defaultValue: 0 },
            { name: "unknown2", type: "uint32", defaultValue: 0 },
            { name: "unknown3", type: "uint32", defaultValue: 0 },
            { name: "characterName", type: "string", defaultValue: "" },
            { name: "unknown4", type: "uint32", defaultValue: 0 },
            { name: "characterId", type: "uint64string", defaultValue: "0" },
            {
              name: "is_online_data",
              type: "variabletype8",
              types: {
                0: [
                  { name: "unknown5", type: "uint32", defaultValue: 0 },
                  { name: "unknown6", type: "uint32", defaultValue: 0 },
                ],
                1: [
                  { name: "unknown5", type: "uint32", defaultValue: 0 },
                  { name: "unknown6", type: "uint32", defaultValue: 0 },
                  { name: "unknown7", type: "uint32", defaultValue: 0 },
                  { name: "unknown8", type: "uint32", defaultValue: 0 },
                  { name: "unknown9", type: "uint8", defaultValue: 0 },
                  { name: "location_x", type: "float", defaultValue: 0.0 },
                  { name: "location_y", type: "float", defaultValue: 0.0 },
                  { name: "unknown10", type: "uint32", defaultValue: 0 },
                  { name: "unknown11", type: "uint32", defaultValue: 0 },
                  { name: "unknown12", type: "uint32", defaultValue: 0 },
                  { name: "unknown13", type: "uint32", defaultValue: 0 },
                  { name: "unknown14", type: "uint8", defaultValue: 0 },
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
        { name: "messageType", type: "uint8", defaultValue: 0 },
        { name: "messageTime", type: "uint64string", defaultValue: "0" },
        {
          name: "messageData1",
          type: "schema",
          fields: [
            { name: "unknowndDword1", type: "uint32", defaultValue: 0 },
            { name: "unknowndDword2", type: "uint32", defaultValue: 0 },
            { name: "unknowndDword3", type: "uint32", defaultValue: 0 },
            { name: "characterName", type: "string", defaultValue: "" },
            { name: "unknownString1", type: "string", defaultValue: "" },
          ],
        },
        {
          name: "messageData2",
          type: "schema",
          fields: [
            { name: "unknowndDword1", type: "uint32", defaultValue: 0 },
            { name: "unknowndDword2", type: "uint32", defaultValue: 0 },
            { name: "unknowndDword3", type: "uint32", defaultValue: 0 },
            { name: "characterName", type: "string", defaultValue: "" },
            { name: "unknownString1", type: "string", defaultValue: "" },
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
        { name: "sessionId", type: "string", defaultValue: "" },
        { name: "stationName", type: "string", defaultValue: "" },
        { name: "unknownBoolean1", type: "boolean", defaultValue: false },
        { name: "unknownString1", type: "string", defaultValue: "" },
        { name: "unknownString2", type: "string", defaultValue: "" },
        { name: "stationCode", type: "string", defaultValue: "" },
        { name: "unknownString3", type: "string", defaultValue: "" },
      ],
    },
  ],
  ["BugSubmission", 0x31, {}],
  [
    "WorldDisplayInfo",
    0x32,
    {
      fields: [{ name: "worldId", type: "uint32", defaultValue: 0 }],
    },
  ],
  ["MOTD", 0x33, {}],
  [
    "SetLocale",
    0x34,
    {
      fields: [{ name: "locale", type: "string", defaultValue: "" }],
    },
  ],
  ["SetClientArea", 0x35, {}],
  ["ZoneTeleportRequest", 0x36, {}],
  ["TradingCard", 0x37, {}],
  [
    "WorldShutdownNotice",
    0x38,
    {
      fields: [
        {
          name: "timeBeforeShutdown",
          type: "uint64string",
          defaultValue: "600EB251",
        },
        { name: "message", type: "string", defaultValue: "" },
      ],
    },
  ],
  ["LoadWelcomeScreen", 0x39, {}],
  ["ShipCombat", 0x3a, {}],
  ["AdminMiniGame", 0x3b, {}],
  [
    "KeepAlive",
    0x3c,
    {
      fields: [{ name: "gameTime", type: "uint32", defaultValue: 0 }],
    },
  ],
  ["ClientExitLaunchUrl", 0x3d, {}],
  ["ClientPath", 0x3e, {}],
  ["ClientPendingKickFromServer", 0x3f, {}],
  [
    "MembershipActivation",
    0x40,
    {
      fields: [{ name: "unknown", type: "uint32", defaultValue: 0 }],
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
      fields: [
        {
          name: "definitionsData",
          type: "byteswithlength",
          fields: [{ name: "data", type: "string", defaultValue: "" }],
        },
      ],
    },
  ],
  [
    "ShowSystemMessage",
    0x43,
    {
      fields: [
        { name: "unknownDword1", type: "uint32", defaultValue: 0 },
        { name: "message", type: "string", defaultValue: "" },
        { name: "unknownDword2", type: "uint32", defaultValue: 0 },
        { name: "color", type: "uint32", defaultValue: 0 },
      ],
    },
  ],
  [
    "POIChangeMessage",
    0x44,
    {
      fields: [
        { name: "messageStringId", type: "uint32", defaultValue: 0 },
        { name: "id", type: "uint32", defaultValue: 0 },
        { name: "unknownDword1", type: "uint32", defaultValue: 0 },
      ],
    },
  ],
  ["ClientMetrics", 0x45, {}],
  ["FirstTimeEvent", 0x46, {}],
  ["Claim", 0x47, {}],
  [
    "ClientLog",
    0x48,
    {
      fields: [
        { name: "file", type: "string", defaultValue: "" },
        { name: "message", type: "string", defaultValue: "" },
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
  ["UpdateCamera", 0x57, {}],

  [
    "UnknownPacketName", // unknown name, sent from client, same dword value every time ?
    0x58,
    {
      fields: [{ name: "unknownDword1", type: "uint32", defaultValue: 0 }],
    },
  ],

  ["Guild.Disband", 0x5902, {}],
  ["Guild.Rename", 0x5903, {}],
  ["Guild.ChangeMemberRank", 0x590a, {}],
  ["Guild.MotdUpdate", 0x590b, {}],
  ["Guild.UpdateRank", 0x590e, {}],
  ["Guild.DataFull", 0x590f, {}],
  ["Guild.Data", 0x5910, {}],
  ["Guild.Invitations", 0x5911, {}],
  ["Guild.AddMember", 0x5912, {}],
  ["Guild.RemoveMember", 0x5913, {}],
  ["Guild.UpdateInvitation", 0x5914, {}],
  ["Guild.MemberOnlineStatus", 0x5915, {}],
  ["Guild.TagsUpdated", 0x5916, {}],
  ["Guild.Notification", 0x5917, {}],
  ["Guild.UpdateAppData", 0x5920, {}],
  ["Guild.RecruitingGuildsForBrowserReply", 0x5926, {}],
  ["AdminGuild", 0x5a, {}],
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
        { name: "unknownQword1", type: "uint64string", defaultValue: "" },
        { name: "unknownBoolean1", type: "boolean", defaultValue: 0 },
        { name: "timescale", type: "float", defaultValue: 1.0 },
        { name: "unknownQword2", type: "uint64string", defaultValue: "" },
        { name: "unknownFloat1", type: "float", defaultValue: 0.0 },
        { name: "unknownFloat2", type: "float", defaultValue: 0.0 },
        { name: "unknownFloat3", type: "float", defaultValue: 0.0 },
      ],
    },
  ],
  ["ClientTrialProfileUpsell", 0x62, {}],
  ["ActivityManager.ProfileActivityList", 0x6301, {}],
  ["ActivityManager.JoinErrorString", 0x6302, {}],
  ["RequestSendItemDefinitionsToClient", 0x64, {}],
  ["Inspect", 0x65, {}],
  [
    "Achievement.Add",
    0x6602,
    {
      fields: [
        { name: "achievementId", type: "uint32", defaultValue: 0 },
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
          defaultValue: [{}],
          fields: achievementDataSchema,
        },
        {
          name: "achievementData",
          type: "byteswithlength",
          fields: [
            {
              name: "achievements",
              type: "array",
              defaultValue: [{}],
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
        { name: "unknown1", type: "uint8", defaultValue: 0 },
        { name: "titleId", type: "uint32", defaultValue: 0 },
      ],
    },
  ],
  ["MatchHistory", 0x68, {}],
  ["UpdateUserAge", 0x69, {}],
  ["Loot", 0x6a, {}],
  ["ActionBarManager", 0x6b, {}],
  ["ClientTrialProfileUpsellRequest", 0x6c, {}],
  ["PlayerUpdateJump", 0x6d, {}],
  [
    "CoinStore.ItemList",
    0x6e0100,
    {
      fields: [
        {
          name: "items",
          type: "array",
          defaultValue: [{}],
          fields: [
            { name: "itemId", type: "uint32", defaultValue: 0 },
            {
              name: "itemData",
              type: "schema",
              fields: [
                { name: "itemId2", type: "uint32", defaultValue: 0 },
                { name: "unknownDword1", type: "uint32", defaultValue: 0 },
                {
                  name: "unknownBoolean1",
                  type: "boolean",
                  defaultValue: false,
                },
                {
                  name: "unknownBoolean2",
                  type: "boolean",
                  defaultValue: false,
                },
              ],
            },
          ],
        },
        { name: "unknown1", type: "uint32", defaultValue: 0 },
      ],
    },
  ],
  ["CoinStore.ItemDefinitionsRequest", 0x6e0200, {}],
  ["CoinStore.ItemDefinitionsResponse", 0x6e0300, {}],
  [
    "CoinStore.SellToClientRequest",
    0x6e0400,
    {
      fields: [
        { name: "unknown1", type: "uint32", defaultValue: 0 },
        { name: "unknown2", type: "uint32", defaultValue: 0 },
        { name: "itemId", type: "uint32", defaultValue: 0 },
        { name: "unknown4", type: "uint32", defaultValue: 0 },
        { name: "quantity", type: "uint32", defaultValue: 0 },
        { name: "unknown6", type: "uint32", defaultValue: 0 },
      ],
    },
  ],
  ["CoinStore.BuyFromClientRequest", 0x6e0500, {}],
  [
    "CoinStore.TransactionComplete",
    0x6e0600,
    {
      fields: [
        { name: "unknown1", type: "uint32", defaultValue: 0 },
        { name: "unknown2", type: "uint32", defaultValue: 0 },
        { name: "unknown3", type: "uint32", defaultValue: 0 },
        { name: "unknown4", type: "uint32", defaultValue: 0 },
        { name: "unknown5", type: "uint32", defaultValue: 0 },
        { name: "unknown6", type: "uint32", defaultValue: 0 },
        { name: "unknown7", type: "uint32", defaultValue: 0 },
        { name: "unknown8", type: "uint32", defaultValue: 0 },
        { name: "timestamp", type: "uint32", defaultValue: 0 },
        { name: "unknown9", type: "uint32", defaultValue: 0 },
        { name: "itemId", type: "uint32", defaultValue: 0 },
        { name: "unknown10", type: "uint32", defaultValue: 0 },
        { name: "quantity", type: "uint32", defaultValue: 0 },
        { name: "unknown11", type: "uint32", defaultValue: 0 },
        { name: "unknown12", type: "uint8", defaultValue: 0 },
      ],
    },
  ],
  ["CoinStore.Open", 0x6e0700, {}],
  ["CoinStore.ItemDynamicListUpdateRequest", 0x6e0800, {}],
  ["CoinStore.ItemDynamicListUpdateResponse", 0x6e0900, {}],
  ["CoinStore.MerchantList", 0x6e0a00, {}],
  ["CoinStore.ClearTransactionHistory", 0x6e0b00, {}],
  ["CoinStore.BuyBackRequest", 0x6e0c00, {}],
  ["CoinStore.BuyBackResponse", 0x6e0d00, {}],
  ["CoinStore.SellToClientAndGiftRequest", 0x6e0e00, {}],
  ["CoinStore.ReceiveGiftItem", 0x6e1100, {}],
  ["CoinStore.GiftTransactionComplete", 0x6e1200, {}],
  [
    "InitializationParameters",
    0x6f,
    {
      fields: [
        { name: "environment", type: "string", defaultValue: "" },
        { name: "serverId", type: "uint32", defaultValue: 0 },
      ],
    },
  ],
  ["Activity.Activity.ListOfActivities", 0x700101, {}],
  ["Activity.Activity.UpdateActivityFeaturedStatus", 0x700105, {}],
  ["Activity.ScheduledActivity.ListOfActivities", 0x700201, {}],
  ["Mount.MountRequest", 0x7101, {}],
  [
    "Mount.MountResponse",
    0x7102,
    {
      fields: [
        { name: "characterId", type: "uint64string", defaultValue: "0" },
        { name: "vehicleGuid", type: "uint64string", defaultValue: "0" },
        { name: "unknownDword1", type: "uint32", defaultValue: 0 }, // seat 0-3
        { name: "unknownDword2", type: "uint32", defaultValue: 1 }, // must be 1 or we dont get into vehicle?
        { name: "unknownDword3", type: "uint32", defaultValue: 1 }, // is driver? (you can be on seat 3 and still have control)
        { name: "unknownDword4", type: "uint32", defaultValue: 0 }, // colored lines on screen
        { name: "identity", type: "schema", fields: identitySchema },
        { name: "tagString", type: "string", defaultValue: "" },
      ],
    },
  ],
  [
    "Mount.DismountRequest",
    0x7103,
    {
      fields: [{ name: "unknownByte1", type: "uint8", defaultValue: 0 }],
    },
  ],
  [
    "Mount.DismountResponse",
    0x7104,
    {
      fields: [
        { name: "characterId", type: "uint64string", defaultValue: "0" },
        { name: "vehicleGuid", type: "uint64string", defaultValue: "0" },
        { name: "unknownDword1", type: "uint32", defaultValue: 0 },
        { name: "unknownBoolean1", type: "boolean", defaultValue: false },
        { name: "unknownByte1", type: "uint8", defaultValue: 0 },
      ],
    },
  ],
  ["Mount.List", 0x7105, {}],
  ["Mount.Spawn", 0x7106, {}],
  ["Mount.Despawn", 0x7107, {}],
  ["Mount.SpawnByItemDefinitionId", 0x7108, {}],
  ["Mount.OfferUpsell", 0x7109, {}],
  [
    "Mount.SeatChangeRequest",
    0x710a,
    {
      fields: [
        { name: "seatId", type: "uint32", defaultValue: 0 },
        { name: "unknownByte1", type: "uint8", defaultValue: 0 },
      ],
    },
  ],
  [
    "Mount.SeatChangeResponse",
    0x710b,
    {
      fields: [
        { name: "characterId", type: "uint64string", defaultValue: "0" },
        { name: "vehicleGuid", type: "uint64string", defaultValue: "0" },
        { name: "identity", type: "schema", fields: identitySchema },
        { name: "seatId", type: "uint32", defaultValue: 0 },
        { name: "unknownDword1", type: "uint32", defaultValue: 1 }, // needs to be 1
        { name: "unknownDword2", type: "uint32", defaultValue: 1 }, // needs to be 1
      ],
    },
  ],
  ["Mount.SeatSwapRequest", 0x710c, {}],
  ["Mount.SeatSwapResponse", 0x710d, {}],
  ["Mount.TypeCount", 0x710e, {}],
  [
    "ClientInitializationDetails",
    0x72,
    {
      fields: [{ name: "unknownDword1", type: "uint32", defaultValue: 0 }],
    },
  ],
  ["ClientAreaTimer", 0x73, {}],
  ["LoyaltyReward.GiveLoyaltyReward", 0x7401, {}],
  ["Rating", 0x75, {}],
  ["ClientActivityLaunch", 0x76, {}],
  ["ServerActivityLaunch", 0x77, {}],
  ["ClientFlashTimer", 0x78, {}],
  [
    "PlayerUpdatePosition",
    0x79,
    {
      fields: [
        {
          name: "transientId",
          type: "custom",
          parser: readUnsignedIntWith2bitLengthValue,
          packer: packUnsignedIntWith2bitLengthValue,
        },
        {
          name: "positionUpdate",
          type: "custom",
          parser: readPositionUpdateData,
          packer: packPositionUpdateData,
        },
      ],
    },
  ],
  ["InviteAndStartMiniGame", 0x7a, {}],
  ["Quiz", 0x7b, {}],
  ["PlayerUpdate.PositionOnPlatform", 0x7c, {}],
  ["ClientMembershipVipInfo", 0x7d, {}],
  ["Target", 0x7e, {}],
  ["GuideStone", 0x80, {}],
  ["Raid", 0x81, {}],
  [
    "Voice.Login",
    0x8200,
    {
      fields: [
        { name: "clientName", type: "string", defaultValue: "" },
        { name: "sessionId", type: "string", defaultValue: "" },
        { name: "url", type: "string", defaultValue: "" },
        { name: "characterName", type: "string", defaultValue: "" },
      ],
    },
  ],
  [
    "Voice.JoinChannel",
    0x8201,
    {
      fields: [
        { name: "roomType", type: "uint8", defaultValue: 0 },
        { name: "uri", type: "string", defaultValue: "" },
        { name: "unknown1", type: "uint32", defaultValue: 0 },
      ],
    },
  ],
  ["Voice.LeaveChannel", 0x8202, {}],
  [
    "Weapon.Weapon",
    0x8300,
    {
      fields: [
        {
          name: "weaponPacket",
          type: "custom",
          parser: parseWeaponPacket,
          packer: packWeaponPacket,
        },
      ],
    },
  ],
  ["MatchSchedule", 0x84, {}],
  [
    "Facility.ReferenceData",
    0x8501,
    {
      fields: [{ name: "data", type: "byteswithlength" }],
    },
  ],
  [
    "Facility.FacilityData",
    0x8502,
    {
      fields: [
        {
          name: "facilities",
          type: "array",
          defaultValue: [{}],
          fields: [
            { name: "facilityId", type: "uint32", defaultValue: 0 },
            { name: "facilityType", type: "uint8", defaultValue: 0 },
            { name: "unknown2_uint8", type: "uint8", defaultValue: 0 },
            { name: "regionId", type: "uint32", defaultValue: 0 },
            { name: "nameId", type: "uint32", defaultValue: 0 },
            { name: "locationX", type: "float", defaultValue: 0.0 },
            { name: "locationY", type: "float", defaultValue: 0.0 },
            { name: "locationZ", type: "float", defaultValue: 0.0 },
            { name: "unknown3_float", type: "float", defaultValue: 0.0 },
            { name: "imageSetId", type: "uint32", defaultValue: 0 },
            { name: "unknown5_uint32", type: "uint32", defaultValue: 0 },
            { name: "unknown6_uint8", type: "uint8", defaultValue: 0 },
            { name: "unknown7_uint8", type: "uint8", defaultValue: 0 },
            { name: "unknown8_bytes", type: "bytes", length: 36 },
          ],
        },
      ],
    },
  ],
  ["Facility.CurrentFacilityUpdate", 0x8503, {}],
  ["Facility.SpawnDataRequest", 0x8504, {}],
  ["Facility.FacilitySpawnData", 0x8505, {}],
  [
    "Facility.FacilityUpdate",
    0x8506,
    {
      fn: function (data: Buffer, offset: number) {
        const result: any = {},
          startOffset = offset;
        let n, i, values, flags;

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
  ["Facility.FacilitySpawnStatus", 0x8507, {}],
  ["Facility.FacilitySpawnStatusTracked", 0x8508, {}],
  ["Facility.NotificationFacilityCaptured", 0x8509, {}],
  ["Facility.NotificationFacilitySignificantCaptureProgress", 0x850a, {}],
  ["Facility.NotificationFacilityCloseToCapture", 0x850b, {}],
  ["Facility.NotificationFacilitySpawnBeginCapture", 0x850c, {}],
  ["Facility.NotificationFacilitySpawnFinishCapture", 0x850d, {}],
  ["Facility.NotificationLeavingFacilityDuringContention", 0x850e, {}],
  ["Facility.ProximitySpawnCaptureUpdate", 0x850f, {}],
  ["Facility.ClearProximitySpawn", 0x8510, {}],
  ["Facility.GridStabilizeTimerUpdated", 0x8511, {}],
  [
    "Facility.SpawnCollisionChanged",
    0x8512,
    {
      fields: [
        { name: "unknown1", type: "uint32", defaultValue: 0 },
        { name: "unknown2", type: "boolean", defaultValue: false },
        { name: "unknown3", type: "uint32", defaultValue: 0 },
      ],
    },
  ],
  ["Facility.NotificationFacilitySecondaryObjectiveEventPacket", 0x8513, {}],
  ["Facility.PenetrateShieldEffect", 0x8514, {}],
  ["Facility.SpawnUpdateGuid", 0x8515, {}],
  ["Facility.FacilityUpdateRequest", 0x8516, {}],
  ["Facility.EmpireScoreValueUpdate", 0x8517, {}],
  ["Skill.Echo", 0x8601, {}],
  ["Skill.SelectSkillSet", 0x8602, {}],
  ["Skill.SelectSkill", 0x8603, {}],
  ["Skill.GetSkillPointManager", 0x8604, {}],
  ["Skill.SetLoyaltyPoints", 0x8605, {}],
  ["Skill.LoadSkillDefinitionManager", 0x8606, {}],
  ["Skill.SetSkillPointManager", 0x8607, {}],
  [
    "Skill.SetSkillPointProgress",
    0x8608,
    {
      fields: [
        { name: "unknown1", type: "uint32", defaultValue: 0 },
        { name: "unknown2", type: "float", defaultValue: 0.0 },
        { name: "unknown3", type: "float", defaultValue: 0.0 },
      ],
    },
  ],
  ["Skill.AddSkill", 0x8609, {}],
  ["Skill.ReportSkillGrant", 0x860a, {}],
  ["Skill.ReportOfflineEarnedSkillPoints", 0x860b, {}],
  ["Skill.ReportDeprecatedSkillLine", 0x860c, {}],

  //["Loadout.LoadLoadoutDefinitionManager", 0x8701, {}],
  [
    "Loadout.SelectLoadout",
    0x8702,
    {
      fields: [{ name: "unknownDword1", type: "uint32", defaultValue: 0 }],
    },
  ],

  [
    "Loadout.SetCurrentLoadout",
    0x8703,
    {
      fields: [
        { name: "characterId", type: "uint64string", defaultValue: "0" },
        { name: "loadoutId", type: "uint32", defaultValue: 0 },
      ],
    },
  ],
  [
    "Loadout.SelectSlot",
    0x8704,
    {
      fields: [
        { name: "characterId", type: "uint64string", defaultValue: "0" },
        { name: "loadoutItemLoadoutId", type: "uint32", defaultValue: 0 },
        {
          name: "loadoutData",
          type: "schema",
          fields: [
            {
              name: "loadoutSlots",
              type: "array",
              defaultValue: [{}],
              fields: [
                { name: "loadoutItemSlotId", type: "uint32", defaultValue: 0 },
                { name: "itemDefinitionId", type: "uint32", defaultValue: 0 },
                { name: "unknownDword1", type: "uint32", defaultValue: 0 },
                {
                  name: "unknownData1",
                  type: "schema",
                  fields: [
                    {
                      name: "itemDefinitionId",
                      type: "uint32",
                      defaultValue: 0,
                    },
                    {
                      name: "loadoutItemOwnerGuid",
                      type: "uint64string",
                      defaultValue: "0",
                    },
                    { name: "unknownByte1", type: "uint8", defaultValue: 0 },
                  ],
                },
                { name: "unknownDword4", type: "uint32", defaultValue: 0 },
              ],
            },
          ],
        },
        { name: "unknownDword2", type: "uint32", defaultValue: 0 },
      ],
    },
  ],
  ["Loadout.SelectClientSlot", 0x8705, {}],
  /*
    [
        "Loadout.SetCurrentSlot",
        0x8706,
        {
            fields: [
                { name: "type", type: "uint8", defaultValue: 0 },
                { name: "unknownByte1", type: "uint8", defaultValue: 0 },
                { name: "slotId", type: "uint32", defaultValue: 0 },
            ],
        },
    ],
    */
  ["Loadout.CreateCustomLoadout", 0x8707, {}],
  /*
    ["Loadout.SelectSlotItem", 0x8708, {}],
    ["Loadout.UnselectSlotItem", 0x8709, {}],
    ["Loadout.SelectSlotTintItem", 0x870a, {}],
    ["Loadout.UnselectSlotTintItem", 0x870b, {}],
    ["Loadout.SelectAllSlotTintItems", 0x870c, {}],
    ["Loadout.UnselectAllSlotTintItems", 0x870d, {}],
    ["Loadout.SelectBodyTintItem", 0x870e, {}],
    ["Loadout.UnselectBodyTintItem", 0x870f, {}],
    ["Loadout.SelectAllBodyTintItems", 0x8710, {}],
    ["Loadout.UnselectAllBodyTintItems", 0x8711, {}],
    ["Loadout.SelectGuildTintItem", 0x8712, {}],
    ["Loadout.UnselectGuildTintItem", 0x8713, {}],
    ["Loadout.SelectDecalItem", 0x8714, {}],
    ["Loadout.UnselectDecalItem", 0x8715, {}],
    ["Loadout.SelectAttachmentItem", 0x8716, {}],
    ["Loadout.UnselectAttachmentItem", 0x8717, {}],
    ["Loadout.SelectCustomName", 0x8718, {}],
    ["Loadout.ActivateLoadoutTerminal", 0x8719, {}],
    [
        "Loadout.ActivateVehicleLoadoutTerminal",
        0x871a,
        {
            fields: [
                { name: "type", type: "uint8", defaultValue: 0 },
                { name: "guid", type: "uint64string", defaultValue: "0" },
            ],
        },
    ],
    [
        "Loadout.SetLoadouts",
        0x871b,
        {
            fields: [
                { name: "type", type: "uint8", defaultValue: 0 },
                { name: "guid", type: "uint64string", defaultValue: "0" },
                { name: "unknownDword1", type: "uint32", defaultValue: 0 },
            ],
        },
    ],
    ["Loadout.AddLoadout", 0x871c, {}],
    ["Loadout.UpdateCurrentLoadout", 0x871d, {}],
    ["Loadout.UpdateLoadoutSlot", 0x871e, {}],
    ["Loadout.SetVehicleLoadouts", 0x871f, {}],
    ["Loadout.AddVehicleLoadout", 0x8720, {}],
    ["Loadout.ClearCurrentVehicleLoadout", 0x8721, {}],
    ["Loadout.UpdateVehicleLoadoutSlot", 0x8722, {}],
    ["Loadout.SetSlotTintItem", 0x8723, {}],
    ["Loadout.UnsetSlotTintItem", 0x8724, {}],
    ["Loadout.SetBodyTintItem", 0x8725, {}],
    ["Loadout.UnsetBodyTintItem", 0x8726, {}],
    ["Loadout.SetGuildTintItem", 0x8727, {}],
    ["Loadout.UnsetGuildTintItem", 0x8728, {}],
    ["Loadout.SetDecalItem", 0x8729, {}],
    ["Loadout.UnsetDecalItem", 0x872a, {}],
    ["Loadout.SetCustomName", 0x872b, {}],
    ["Loadout.UnsetCustomName", 0x872c, {}],
    ["Loadout.UpdateLoadoutSlotItemLineConfig", 0x872d, {}],
    */
  ["Experience.SetExperience", 0x8801, {}],
  [
    "Experience.SetExperienceRanks",
    0x8802,
    {
      fields: [
        {
          name: "experienceRanks",
          type: "array",
          defaultValue: [{}],
          fields: [
            { name: "unknownDword1", type: "uint32", defaultValue: 0 },
            {
              name: "experienceRankData",
              type: "array",
              defaultValue: [{}],
              fields: [
                { name: "experienceRequired", type: "uint32", defaultValue: 0 },
                {
                  name: "factionRanks",
                  type: "array",
                  defaultValue: [{}],
                  length: 4,
                  fields: [
                    { name: "nameId", type: "uint32", defaultValue: 0 },
                    { name: "unknownDword2", type: "uint32", defaultValue: 0 },
                    { name: "imageSetId", type: "uint32", defaultValue: 0 },
                    {
                      name: "rewards",
                      type: "array",
                      defaultValue: [{}],
                      fields: [
                        { name: "itemId", type: "uint32", defaultValue: 0 },
                        { name: "nameId", type: "uint32", defaultValue: 0 },
                        { name: "imageSetId", type: "uint32", defaultValue: 0 },
                        {
                          name: "itemCountMin",
                          type: "uint32",
                          defaultValue: 0,
                        },
                        {
                          name: "itemCountMax",
                          type: "uint32",
                          defaultValue: 0,
                        },
                        { name: "itemType", type: "uint32", defaultValue: 0 },
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
    0x8803,
    {
      fields: [
        { name: "unknownDword1", type: "uint32", defaultValue: 0 },
        { name: "unknownDword2", type: "uint32", defaultValue: 0 },
        { name: "unknownDword3", type: "uint32", defaultValue: 0 },
        { name: "unknownDword4", type: "uint32", defaultValue: 0 },
        { name: "unknownDword5", type: "uint32", defaultValue: 0 },
      ],
    },
  ],
  [
    "Vehicle.Owner",
    0x8901,
    {
      fields: [
        { name: "guid", type: "uint64string", defaultValue: "0" },
        { name: "characterId", type: "uint64string", defaultValue: "0" },
        { name: "unknownDword1", type: "uint32", defaultValue: 0 },
        { name: "vehicleId", type: "uint32", defaultValue: 0 },
        {
          name: "passengers",
          type: "array",
          defaultValue: [{}],
          fields: [
            {
              name: "passengerData",
              type: "schema",
              fields: [
                { name: "characterId", type: "uint64string", defaultValue: "0" },
                {
                  name: "characterData",
                  type: "schema",
                  fields: [
                    { name: "unknownDword1", type: "uint32", defaultValue: 0 },
                    { name: "unknownDword2", type: "uint32", defaultValue: 0 },
                    { name: "unknownDword3", type: "uint32", defaultValue: 0 },
                    { name: "characterName", type: "string", defaultValue: "" },
                    {
                      name: "unknownString1",
                      type: "string",
                      defaultValue: "",
                    },
                  ],
                },
                { name: "unknownDword1", type: "uint32", defaultValue: 0 },
                { name: "unknownString1", type: "string", defaultValue: "" },
              ],
            },
            { name: "unknownByte1", type: "uint8", defaultValue: 0 },
          ],
        },
      ],
    },
  ],
  [
    "Vehicle.Occupy",
    0x8902,
    {
      fields: [
        { name: "guid", type: "uint64string", defaultValue: "0" },
        { name: "characterId", type: "uint64string", defaultValue: "0" },
        { name: "vehicleId", type: "uint32", defaultValue: 0 },
        { name: "unknownDword1", type: "uint32", defaultValue: 0 },
        {
          name: "unknownArray1",
          type: "array",
          defaultValue: [{}],
          fields: [
            { name: "unknownDword1", type: "uint32", defaultValue: 0 },
            { name: "unknownBoolean1", type: "boolean", defaultValue: false },
          ],
        },
        {
          name: "passengers",
          type: "array",
          defaultValue: [{}],
          fields: [
            {
              name: "passengerData",
              type: "schema",
              fields: [
                { name: "characterId", type: "uint64string", defaultValue: "0" },
                {
                  name: "characterData",
                  type: "schema",
                  fields: [
                    { name: "unknownDword1", type: "uint32", defaultValue: 0 },
                    { name: "unknownDword2", type: "uint32", defaultValue: 0 },
                    { name: "unknownDword3", type: "uint32", defaultValue: 0 },
                    { name: "characterName", type: "string", defaultValue: "" },
                    {
                      name: "unknownString1",
                      type: "string",
                      defaultValue: "",
                    },
                  ],
                },
                { name: "unknownDword1", type: "uint32", defaultValue: 0 },
                { name: "unknownString1", type: "string", defaultValue: "" },
              ],
            },
            { name: "unknownByte1", type: "uint8", defaultValue: 0 },
          ],
        },
        {
          name: "unknownArray2",
          type: "array",
          defaultValue: [{}],
          fields: [
            { name: "unknownQword1", type: "uint64string", defaultValue: "0" },
          ],
        },
        {
          name: "unknownData1",
          type: "schema",
          fields: [
            { name: "unknownDword1", type: "uint32", defaultValue: 0 },
            {
              name: "unknownData1",
              type: "schema",
              fields: [
                { name: "unknownDword1", type: "uint32", defaultValue: 0 },
                { name: "unknownByte1", type: "uint8", defaultValue: 0 },
              ],
            },
            { name: "unknownString1", type: "string", defaultValue: "" },
            { name: "unknownDword2", type: "uint32", defaultValue: 0 },
            { name: "unknownDword3", type: "uint32", defaultValue: 0 },
            { name: "unknownDword4", type: "uint32", defaultValue: 0 },
            { name: "unknownDword5", type: "uint32", defaultValue: 0 },
            {
              name: "unknownArray3",
              type: "array",
              defaultValue: [{}],
              fields: [
                { name: "unknownDword1", type: "uint32", defaultValue: 0 },
                {
                  name: "unknownData1",
                  type: "schema",
                  fields: [
                    { name: "unknownDword1", type: "uint32", defaultValue: 0 },
                    {
                      name: "unknownData1",
                      type: "schema",
                      fields: [
                        {
                          name: "unknownDword1",
                          type: "uint32",
                          defaultValue: 0,
                        },
                        {
                          name: "unknownByte1",
                          type: "uint8",
                          defaultValue: 0,
                        },
                        {
                          name: "unknownArray1",
                          type: "array",
                          defaultValue: [{}],
                          fields: [
                            {
                              name: "unknownDword1",
                              type: "uint32",
                              defaultValue: 0,
                            },
                          ],
                        },
                        {
                          name: "unknownArray2",
                          type: "array",
                          defaultValue: [{}],
                          fields: [
                            {
                              name: "unknownDword1",
                              type: "uint32",
                              defaultValue: 0,
                            },
                            {
                              name: "unknownDword2",
                              type: "uint32",
                              defaultValue: 0,
                            },
                          ],
                        },
                      ],
                    },
                    { name: "unknownDword2", type: "uint32", defaultValue: 0 },
                    { name: "unknownDword3", type: "uint32", defaultValue: 0 },
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
    0x8903,
    {
      fields: [
        { name: "guid", type: "uint64string", defaultValue: "0" },
        { name: "unknown3", type: "float", defaultValue: 0.0 },
        {
          name: "unknown4",
          type: "array",
          defaultValue: [{}],
          fields: [
            { name: "unknown1", type: "uint32", defaultValue: 0 },
            { name: "unknown2", type: "uint8", defaultValue: 0 },
          ],
        },
        {
          name: "unknown5",
          type: "array",
          defaultValue: [{}],
          fields: [
            { name: "unknown1", type: "uint32", defaultValue: 0 },
            { name: "unknown2", type: "uint8", defaultValue: 0 },
          ],
        },
      ],
    },
  ],
  ["Vehicle.StateDamage", 0x8904, {}],
  ["Vehicle.PlayerManager", 0x8905, {}],
  [
    "Vehicle.Spawn",
    0x8906,
    {
      fields: [
        { name: "vehicleId", type: "uint32", defaultValue: 0 },
        { name: "loadoutTab", type: "uint32", defaultValue: 0 },
      ],
    },
  ],
  ["Vehicle.Tint", 0x8907, {}],
  ["Vehicle.LoadVehicleTerminalDefinitionManager", 0x8908, {}],
  ["Vehicle.ActiveWeapon", 0x8909, {}],
  ["Vehicle.Stats", 0x890a, {}],
  ["Vehicle.DamageInfo", 0x890b, {}],
  ["Vehicle.StatUpdate", 0x890c, {}],
  ["Vehicle.UpdateWeapon", 0x890d, {}],
  ["Vehicle.RemovedFromQueue", 0x890e, {}],
  [
    "Vehicle.UpdateQueuePosition",
    0x890f,
    {
      fields: [{ name: "queuePosition", type: "uint32", defaultValue: 0 }],
    },
  ],
  ["Vehicle.PadDestroyNotify", 0x8910, {}],
  [
    "Vehicle.SetAutoDrive",
    0x8911,
    {
      fields: [{ name: "guid", type: "uint64string", defaultValue: "0" }],
    },
  ],
  ["Vehicle.LockOnInfo", 0x8912, {}],
  ["Vehicle.LockOnState", 0x8913, {}],
  ["Vehicle.TrackingState", 0x8914, {}],
  ["Vehicle.CounterMeasureState", 0x8915, {}],
  [
    "Vehicle.LoadVehicleDefinitionManager",
    0x8916,
    {
      fields: [
        {
          name: "vehicleDefinitions",
          type: "array",
          defaultValue: [{}],
          fields: [
            { name: "vehicleId", type: "uint32", defaultValue: 0 },
            { name: "modelId", type: "uint32", defaultValue: 0 },
          ],
        },
      ],
    },
  ],
  ["Vehicle.AcquireState", 0x8917, {}],
  ["Vehicle.Dismiss", 0x8918, {}],
  [
    "Vehicle.AutoMount",
    0x8919,
    {
      fields: [
        { name: "guid", type: "uint64string", defaultValue: "0" },
        { name: "unknownBoolean1", type: "boolean", defaultValue: false },
        { name: "unknownDword1", type: "uint32", defaultValue: 0 },
      ],
    },
  ],
  ["Vehicle.Deploy", 0x891a, {}],
  [
    "Vehicle.Engine",
    0x891b,
    {
      fields: [
        { name: "guid1", type: "uint64string", defaultValue: "0" },
        { name: "guid2", type: "uint64string", defaultValue: "0" },
        { name: "engineOn", type: "boolean", defaultValue: false },
      ],
    },
  ],
  ["Vehicle.AccessType", 0x891c, {}],
  ["Vehicle.KickPlayer", 0x891d, {}],
  ["Vehicle.HealthUpdateOwner", 0x891e, {}],
  ["Vehicle.OwnerPassengerList", 0x891f, {}],
  ["Vehicle.Kick", 0x8920, {}],
  ["Vehicle.NoAccess", 0x8921, {}],
  [
    "Vehicle.Expiration",
    0x8922,
    {
      fields: [{ name: "expireTime", type: "uint32", defaultValue: 0 }],
    },
  ],
  ["Vehicle.Group", 0x8923, {}],
  ["Vehicle.DeployResponse", 0x8924, {}],
  ["Vehicle.ExitPoints", 0x8925, {}],
  ["Vehicle.ControllerLogOut", 0x8926, {}],
  ["Vehicle.CurrentMoveMode", 0x8927, {}],
  ["Vehicle.ItemDefinitionRequest", 0x8928, {}],
  ["Vehicle.ItemDefinitionReply", 0x8929, {}],
  ["Vehicle.InventoryItems", 0x892a, {}],
  ["Grief", 0x8a, {}],
  ["SpotPlayer", 0x8b, {}],
  ["Faction", 0x8c, {}],
  [
    "Synchronization",
    0x8d,
    {
      fields: [
        { name: "time1", type: "uint64string", defaultValue: "0" },
        { name: "time2", type: "uint64string", defaultValue: "0" },
        { name: "clientTime", type: "uint64string", defaultValue: "0" },
        { name: "serverTime", type: "uint64string", defaultValue: "0" },
        { name: "serverTime2", type: "uint64string", defaultValue: "0" },
        { name: "time3", type: "uint64string", defaultValue: "0" },
      ],
    },
  ],
  [
    "ResourceEvent",
    0x8e00,
    {
      fields: [
        { name: "gameTime", type: "uint32", defaultValue: 0 },
        {
          name: "eventData",
          type: "variabletype8",
          types: {
            1: [
              // SetCharacterResources
              { name: "characterId", type: "uint64string", defaultValue: "0" },
              {
                name: "characterResources",
                type: "array",
                defaultValue: [{}],
                fields: [
                  { name: "resourceId", type: "uint32", defaultValue: 0 },
                  {
                    name: "resourceData",
                    type: "schema",
                    fields: characterResourceData,
                  },
                ],
              },
            ],
            2: [
              // SetCharacterResource
              { name: "characterId", type: "uint64string", defaultValue: "0" },
              {
                name: "resourceData",
                type: "schema",
                fields: characterResourceData,
              },
            ],
            3: [
              // UpdateCharacterResource
              { name: "characterId", type: "uint64string", defaultValue: "0" },
              { name: "unknownDword1", type: "uint32", defaultValue: 0 },
              { name: "unknownDword2", type: "uint32", defaultValue: 0 },
              { name: "unknownDword3", type: "uint32", defaultValue: 0 },
              { name: "unknownDword4", type: "uint32", defaultValue: 0 },
              { name: "unknownFloat5", type: "float", defaultValue: 0.0 },
              { name: "unknownFloat6", type: "float", defaultValue: 0.0 },
              { name: "unknownFloat7", type: "float", defaultValue: 0.0 },
              { name: "unknownDword8", type: "uint32", defaultValue: 0 },
              { name: "unknownDword9", type: "uint32", defaultValue: 0 },
              { name: "unknownDword10", type: "uint32", defaultValue: 0 },
              { name: "unknownByte1", type: "uint8", defaultValue: 0 },
              { name: "unknownByte2", type: "uint8", defaultValue: 0 },
              { name: "unknownGuid3", type: "uint64string", defaultValue: "0" },
              { name: "unknownGuid4", type: "uint64string", defaultValue: "0" },
              { name: "unknownGuid5", type: "uint64string", defaultValue: "0" },
              { name: "unknownBoolean", type: "boolean", defaultValue: false },
            ],
            4: [
              // RemoveCharacterResource
            ],
          },
        },
      ],
    },
  ],
  [
    "Collision.Damage",
    0x8f01,
    {
      fields: [
        { name: "guid", type: "uint64string", defaultValue: "0" },
        { name: "unknownBoolean1", type: "boolean", defaultValue: false },
        { name: "unknownDword1", type: "uint32", defaultValue: 0 },
      ],
    },
  ],
  ["Leaderboard", 0x90, {}],
  [
    "PlayerUpdateManagedPosition", // *NOT* full packet schema
    0x91,
    {
      fields: [
        {
          name: "transientId",
          type: "custom",
          parser: readUnsignedIntWith2bitLengthValue,
          packer: packUnsignedIntWith2bitLengthValue,
        },
      ],
    },
  ],
  [
    "AddSimpleNpc",
    0x92,
    {
      fields: [
        { name: "characterId", type: "uint64string", defaultValue: "0" },
        {
          name: "transientId",
          type: "custom",
          parser: readUnsignedIntWith2bitLengthValue,
          packer: packUnsignedIntWith2bitLengthValue,
        },
        { name: "unknownByte1", type: "uint8", defaultValue: 50 },
        { name: "position", type: "floatvector3", defaultValue: [0, 0, 0] },
        { name: "rotation", type: "floatvector3", defaultValue: [0, 0, 0] },
        { name: "unknownDword1", type: "uint32", defaultValue: 9000 },
        { name: "unknownDword2", type: "uint32", defaultValue: 9000 },
        { name: "modelId", type: "uint32", defaultValue: 0 },
        { name: "scale", type: "floatvector4", defaultValue: [1, 1, 1, 1] },
        { name: "unknownDword3", type: "uint32", defaultValue: 9000 },
        { name: "showHealth", type: "boolean", defaultValue: false },
        { name: "unknownDword4", type: "uint32", defaultValue: 9000 },
      ],
    },
  ],
  ["PlayerUpdateUpdateVehicleWeapon", 0x93, {}],
  [
    "ProfileStats.GetPlayerProfileStats",
    0x940000,
    {
      fields: [{ name: "characterId", type: "uint64string", defaultValue: "0" }],
    },
  ],
  ["ProfileStats.GetZonePlayerProfileStats", 0x940100, {}],
  ["ProfileStats.PlayerProfileStats", 0x940200, {}],
  ["ProfileStats.ZonePlayerProfileStats", 0x940300, {}],
  ["ProfileStats.UpdatePlayerLeaderboards", 0x940400, {}],
  ["ProfileStats.UpdatePlayerLeaderboardsReply", 0x940500, {}],
  ["ProfileStats.GetLeaderboard", 0x940600, {}],
  ["ProfileStats.Leaderboard", 0x940700, {}],
  ["ProfileStats.GetZoneCharacterStats", 0x940800, {}],
  ["ProfileStats.ZoneCharacterStats", 0x940900, {}],
  [
    "Equipment.SetCharacterEquipment",
    0x9501,
    {
      fields: [
        { name: "profileId", type: "uint32", defaultValue: 0 },
        { name: "characterId", type: "uint64string", defaultValue: "0" },
        { name: "unknownDword1", type: "uint32", defaultValue: 0 },
        { name: "unknownString1", type: "string", defaultValue: "" },
        { name: "unknownString2", type: "string", defaultValue: "" },
        {
          name: "equipmentSlots",
          type: "array",
          defaultValue: [{}],
          fields: [
            { name: "equipmentSlotId", type: "uint32", defaultValue: 0 },
            {
              name: "equipmentSlotData",
              type: "schema",
              fields: [
                { name: "equipmentSlotId", type: "uint32", defaultValue: 0 },
                { name: "guid", type: "uint64string", defaultValue: "0" },
                { name: "unknownString1", type: "string", defaultValue: "" },
                { name: "unknownString2", type: "string", defaultValue: "" },
              ],
            },
          ],
        },
        {
          name: "attachmentData",
          type: "array",
          defaultValue: [{}],
          fields: [
            { name: "modelName", type: "string", defaultValue: "" },
            { name: "unknownString1", type: "string", defaultValue: "" },
            { name: "tintAlias", type: "string", defaultValue: "" },
            { name: "unknownString2", type: "string", defaultValue: "" },
            { name: "unknownDword1", type: "uint32", defaultValue: 0 },
            { name: "unknownDword2", type: "uint32", defaultValue: 0 },
            { name: "slotId", type: "uint32", defaultValue: 0 },
          ],
        },
      ],
    },
  ],
  [
    "Equipment.SetCharacterEquipmentSlot",
    0x9502,
    {
      fields: [
        {
          name: "characterData",
          type: "schema",
          fields: equipmentCharacterDataSchema,
        },
        {
          name: "equipmentTexture",
          type: "schema",
          fields: equipmentTextureSchema,
        },
        {
          name: "equipmentModel",
          type: "schema",
          fields: equipmentModelSchema,
        },
      ],
    },
  ],
  ["Equipment.UnsetCharacterEquipmentSlot", 0x9503, {}],
  [
    "Equipment.SetCharacterEquipmentSlots",
    0x9504,
    {
      fields: [
        {
          name: "characterData",
          type: "schema",
          fields: equipmentCharacterDataSchema,
        },
        { name: "gameTime", type: "uint32", defaultValue: 0 },
        {
          name: "slots",
          type: "array",
          defaultValue: [{}],
          fields: [
            { name: "index", type: "uint32", defaultValue: 0 },
            { name: "slotId", type: "uint32", defaultValue: 0 },
          ],
        },
        { name: "unknownDword1", type: "uint32", defaultValue: 1 },
        { name: "unknownString1", type: "string", defaultValue: "string1" },
        { name: "unknownString2", type: "string", defaultValue: "string2" },
        {
          name: "equipmentTextures",
          type: "array",
          defaultValue: [{}],
          fields: equipmentTextureSchema,
        },
        {
          name: "equipmentModels",
          type: "array",
          defaultValue: [{}],
          fields: equipmentModelSchema,
        },
      ],
    },
  ],
  ["DefinitionFilter.ListDefinitionVariables", 0x9601, {}],
  [
    "DefinitionFilter.SetDefinitionVariable",
    0x9602,
    {
      fields: [
        { name: "unknownDword1", type: "uint32", defaultValue: 0 },
        { name: "unknownQword1", type: "uint64string", defaultValue: "0" },
        {
          name: "unknownData1",
          type: "schema",
          fields: [
            { name: "unknownFloat1", type: "float", defaultValue: 0.0 },
            { name: "unknownFloat2", type: "float", defaultValue: 0.0 },
          ],
        },
      ],
    },
  ],
  [
    "DefinitionFilter.SetDefinitionIntSet",
    0x9603,
    {
      fields: [
        { name: "unknownDword1", type: "uint32", defaultValue: 0 },
        { name: "unknownQword1", type: "uint64string", defaultValue: "0" },
        {
          name: "unknownData1",
          type: "array",
          defaultValue: [{}],
          fields: [
            { name: "unknownDword1", type: "uint32", defaultValue: 0 },
            { name: "unknownDword2", type: "uint32", defaultValue: 0 },
          ],
        },
      ],
    },
  ],
  [
    "DefinitionFilter.UnknownWithVariable1",
    0x9604,
    {
      fields: [
        { name: "unknownDword1", type: "uint32", defaultValue: 0 },
        { name: "unknownQword1", type: "uint64string", defaultValue: "0" },
      ],
    },
  ],
  [
    "DefinitionFilter.UnknownWithVariable2",
    0x9605,
    {
      fields: [
        { name: "unknownDword1", type: "uint32", defaultValue: 0 },
        { name: "unknownQword1", type: "uint64string", defaultValue: "0" },
      ],
    },
  ],
  [
    "ContinentBattleInfo",
    0x97,
    {
      fields: [
        {
          name: "zones",
          type: "array",
          defaultValue: [{}],
          fields: [
            { name: "id", type: "uint32", defaultValue: 0 },
            { name: "nameId", type: "uint32", defaultValue: 0 },
            { name: "descriptionId", type: "uint32", defaultValue: 0 },
            {
              name: "population",
              type: "array",
              defaultValue: [{}],
              elementType: "uint8",
            },
            {
              name: "regionPercent",
              type: "array",
              defaultValue: [{}],
              elementType: "uint8",
            },
            {
              name: "populationBuff",
              type: "array",
              defaultValue: [{}],
              elementType: "uint8",
            },
            {
              name: "populationTargetPercent",
              type: "array",
              defaultValue: [{}],
              elementType: "uint8",
            },
            { name: "name", type: "string", defaultValue: "" },
            { name: "hexSize", type: "float", defaultValue: 0.0 },
            { name: "isProductionZone", type: "uint8", defaultValue: 0 },
          ],
        },
      ],
    },
  ],
  [
    "GetContinentBattleInfo",
    0x98,
    {
      fields: [],
    },
  ],
  [
    "SendSecurityPacketAndSelfDestruct",
    0x99,
    {
      fields: [],
    },
  ],
  [
    "GetRespawnLocations",
    0x9a,
    {
      fields: [],
    },
  ],

  ["WallOfData.PlayerKeyboard", 0x9b03, {}],
  [
    "WallOfData.UIEvent",
    0x9b05,
    {
      fields: [
        { name: "object", type: "string", defaultValue: "" },
        { name: "function", type: "string", defaultValue: "" },
        { name: "argument", type: "string", defaultValue: "" },
      ],
    },
  ],
  ["WallOfData.ClientSystemInfo", 0x9b06, {}],
  ["WallOfData.VoiceChatEvent", 0x9b07, {}],
  ["WallOfData.NudgeEvent", 0x9b09, {}],
  ["WallOfData.LaunchPadFingerprint", 0x9b0a, {}],
  ["WallOfData.VideoCapture", 0x9b0b, {}],
  [
    "WallOfData.ClientTransition",
    0x9b0c,
    {
      fields: [
        { name: "oldState", type: "uint32", defaultValue: 0 },
        { name: "newState", type: "uint32", defaultValue: 0 },
        { name: "msElapsed", type: "uint32", defaultValue: 0 },
      ],
    },
  ],
  ["Implant.SelectImplant", 0x9c01, {}],
  ["Implant.UnselectImplant", 0x9c02, {}],
  ["Implant.LoadImplantDefinitionManager", 0x9c03, {}],
  ["Implant.SetImplants", 0x9c04, {}],
  ["Implant.UpdateImplantSlot", 0x9c05, {}],
  ["ClientInGamePurchase", 0x9d, {}],
  ["Missions.ListMissions", 0x9e01, {}],
  ["Missions.ConquerZone", 0x9e02, {}],
  ["Missions.SelectMission", 0x9e03, {}],
  ["Missions.UnselectMission", 0x9e04, {}],
  ["Missions.SetMissionInstanceManager", 0x9e05, {}],
  ["Missions.SetMissionManager", 0x9e06, {}],
  ["Missions.AddGlobalAvailableMission", 0x9e07, {}],
  ["Missions.RemoveGlobalAvailableMission", 0x9e08, {}],
  ["Missions.AddAvailableMission", 0x9e09, {}],
  ["Missions.RemoveAvailableMission", 0x9e0a, {}],
  ["Missions.AddActiveMission", 0x9e0b, {}],
  ["Missions.RemoveActiveMission", 0x9e0c, {}],
  ["Missions.ReportCompletedMission", 0x9e0d, {}],
  ["Missions.AddAvailableMissions", 0x9e0e, {}],
  ["Missions.SetMissionChangeList", 0x9e0f, {}],
  ["Missions.SetConqueredZone", 0x9e10, {}],
  ["Missions.UnsetConqueredZone", 0x9e11, {}],
  ["Missions.SetConqueredZones", 0x9e12, {}],
  [
    "Effect.AddEffect",
    0x9f01,
    {
      fields: [
        {
          name: "unknownData1",
          type: "schema",
          fields: [
            { name: "unknownDword1", type: "uint32", defaultValue: 0 },
            { name: "unknownDword2", type: "uint32", defaultValue: 0 },
            { name: "unknownDword3", type: "uint32", defaultValue: 0 },
          ],
        },
        {
          name: "unknownData2",
          type: "schema",
          fields: [
            { name: "unknownQword1", type: "uint64string", defaultValue: "0" },
            { name: "unknownQword2", type: "uint64string", defaultValue: "0" },
          ],
        },
        {
          name: "unknownData3",
          type: "schema",
          fields: [
            { name: "unknownQword1", type: "uint64string", defaultValue: "0" },
            { name: "unknownQword2", type: "uint64string", defaultValue: "0" },
            {
              name: "unknownVector1",
              type: "floatvector4",
              defaultValue: [0, 0, 0, 0],
            },
          ],
        },
      ],
    },
  ],
  [
    "Effect.UpdateEffect",
    0x9f02,
    {
      fields: [
        {
          name: "unknownData1",
          type: "schema",
          fields: [
            { name: "unknownDword1", type: "uint32", defaultValue: 0 },
            { name: "unknownDword2", type: "uint32", defaultValue: 0 },
            { name: "unknownDword3", type: "uint32", defaultValue: 0 },
          ],
        },
        {
          name: "unknownData2",
          type: "schema",
          fields: [
            { name: "unknownDword1", type: "uint32", defaultValue: 0 },
            { name: "unknownQword1", type: "uint64string", defaultValue: "0" },
          ],
        },
        {
          name: "unknownData3",
          type: "schema",
          fields: [
            { name: "unknownQword1", type: "uint64string", defaultValue: "0" },
            { name: "unknownQword2", type: "uint64string", defaultValue: "0" },
            {
              name: "unknownVector1",
              type: "floatvector4",
              defaultValue: [0, 0, 0, 0],
            },
          ],
        },
      ],
    },
  ],
  [
    "Effect.RemoveEffect",
    0x9f03,
    {
      fields: [
        {
          name: "unknownData1",
          type: "schema",
          fields: [
            { name: "unknownDword1", type: "uint32", defaultValue: 0 },
            { name: "unknownDword2", type: "uint32", defaultValue: 0 },
            { name: "unknownDword3", type: "uint32", defaultValue: 0 },
          ],
        },
        {
          name: "unknownData2",
          type: "schema",
          fields: [
            { name: "unknownQword1", type: "uint64string", defaultValue: "0" },
          ],
        },
        {
          name: "unknownData3",
          type: "schema",
          fields: [
            { name: "unknownQword1", type: "uint64string", defaultValue: "0" },
            { name: "unknownQword2", type: "uint64string", defaultValue: "0" },
            {
              name: "unknownVector1",
              type: "floatvector4",
              defaultValue: [0, 0, 0, 0],
            },
          ],
        },
      ],
    },
  ],
  [
    "Effect.AddEffectTag",
    0x9f04,
    {
      fields: effectTagsSchema,
    },
  ],
  [
    "Effect.RemoveEffectTag",
    0x9f05,
    {
      fields: [
        {
          name: "unknownData1",
          type: "schema",
          fields: [
            { name: "unknownQword1", type: "uint64string", defaultValue: "0" },
          ],
        },
        {
          name: "unknownData2",
          type: "schema",
          fields: [
            { name: "unknownDword1", type: "uint32", defaultValue: 0 },
            { name: "unknownQword1", type: "uint64string", defaultValue: "0" },
            { name: "unknownQword2", type: "uint64string", defaultValue: "0" },
          ],
        },
      ],
    },
  ],
  [
    "Effect.TargetBlockedEffect",
    0x9f06,
    {
      fields: [
        {
          name: "unknownData1",
          type: "schema",
          fields: [
            { name: "unknownQword1", type: "uint64string", defaultValue: "0" },
          ],
        },
      ],
    },
  ],
  ["RewardBuffs.ReceivedBundlePacket", 0xa001, {}],
  ["RewardBuffs.NonBundledItem", 0xa002, {}],
  ["RewardBuffs.AddBonus", 0xa003, {}],
  ["RewardBuffs.RemoveBonus", 0xa004, {}],
  ["RewardBuffs.GiveRewardToPlayer", 0xa005, {}],
  ["Abilities.InitAbility", 0xa101, {}],
  ["Abilities.UpdateAbility", 0xa102, {}],
  ["Abilities.UninitAbility", 0xa103, {}],
  ["Abilities.SetAbilityActivationManager", 0xa104, {}],
  [
    "Abilities.SetActivatableAbilityManager",
    0xa105,
    {
      fields: [
        {
          name: "unknownArray1",
          type: "array",
          defaultValue: [{}],
          fields: [
            { name: "unknownQword1", type: "uint64string", defaultValue: "0" },
            {
              name: "unknownData1",
              type: "schema",
              fields: [
                { name: "unknownQword1", type: "uint64string", defaultValue: "0" },
                { name: "unknownDword1", type: "uint32", defaultValue: 0 },
                { name: "unknownDword2", type: "uint32", defaultValue: 0 },
              ],
            },
            { name: "unknownDword1", type: "uint32", defaultValue: 0 },
            { name: "unknownByte1", type: "uint8", defaultValue: 0 },
          ],
        },
      ],
    },
  ],
  ["Abilities.SetVehicleActivatableAbilityManager", 0xa106, {}],
  ["Abilities.SetAbilityTimerManager", 0xa107, {}],
  ["Abilities.AddAbilityTimer", 0xa108, {}],
  ["Abilities.RemoveAbilityTimer", 0xa109, {}],
  ["Abilities.UpdateAbilityTimer", 0xa10a, {}],
  ["Abilities.SetAbilityLockTimer", 0xa10b, {}],
  ["Abilities.ActivateAbility", 0xa10c, {}],
  ["Abilities.VehicleActivateAbility", 0xa10d, {}],
  ["Abilities.DeactivateAbility", 0xa10e, {}],
  ["Abilities.VehicleDeactivateAbility", 0xa10f, {}],
  ["Abilities.ActivateAbilityFailed", 0xa110, {}],
  ["Abilities.VehicleActivateAbilityFailed", 0xa111, {}],
  ["Abilities.ClearAbilityLineManager", 0xa112, {}],
  ["Abilities.SetAbilityLineManager", 0xa113, {}],
  ["Abilities.SetProfileAbilityLineMembers", 0xa114, {}],
  ["Abilities.SetProfileAbilityLineMember", 0xa115, {}],
  ["Abilities.RemoveProfileAbilityLineMember", 0xa116, {}],
  ["Abilities.SetVehicleAbilityLineMembers", 0xa117, {}],
  ["Abilities.SetVehicleAbilityLineMember", 0xa118, {}],
  ["Abilities.RemoveVehicleAbilityLineMember", 0xa119, {}],
  ["Abilities.SetFacilityAbilityLineMembers", 0xa11a, {}],
  ["Abilities.SetFacilityAbilityLineMember", 0xa11b, {}],
  ["Abilities.RemoveFacilityAbilityLineMember", 0xa11c, {}],
  ["Abilities.SetEmpireAbilityLineMembers", 0xa11d, {}],
  ["Abilities.SetEmpireAbilityLineMember", 0xa11e, {}],
  ["Abilities.RemoveEmpireAbilityLineMember", 0xa11f, {}],
  [
    "Abilities.SetLoadoutAbilities",
    0xa120,
    {
      fields: [
        {
          name: "abilities",
          type: "array",
          defaultValue: [{}],
          fields: [
            { name: "abilitySlotId", type: "uint32", defaultValue: 0 },
            {
              name: "abilityData",
              type: "schema",
              fields: [
                { name: "abilitySlotId", type: "uint32", defaultValue: 0 },
                { name: "abilityId", type: "uint32", defaultValue: 0 },
                { name: "unknownDword1", type: "uint32", defaultValue: 0 },
                { name: "guid1", type: "uint64string", defaultValue: "0" },
                { name: "guid2", type: "uint64string", defaultValue: "0" },
              ],
            },
          ],
        },
      ],
    },
  ],
  ["Abilities.AddLoadoutAbility", 0xa121, {}],
  ["Abilities.RemoveLoadoutAbility", 0xa122, {}],
  ["Abilities.SetImplantAbilities", 0xa123, {}],
  ["Abilities.AddImplantAbility", 0xa124, {}],
  ["Abilities.RemoveImplantAbility", 0xa125, {}],
  ["Abilities.SetPersistentAbilities", 0xa126, {}],
  ["Abilities.AddPersistentAbility", 0xa127, {}],
  ["Abilities.RemovePersistentAbility", 0xa128, {}],
  ["Abilities.SetProfileRankAbilities", 0xa129, {}],
  ["Abilities.AddProfileRankAbility", 0xa12a, {}],
  ["Abilities.RemoveProfileRankAbility", 0xa12b, {}],
  ["Deployable.Place", 0xa201, {}],
  ["Deployable.Remove", 0xa202, {}],
  ["Deployable.Pickup", 0xa203, {}],
  ["Deployable.ActionResponse", 0xa204, {}],
  [
    "Security",
    0xa3,
    {
      fields: [{ name: "code", type: "uint32", defaultValue: 0 }],
    },
  ],
  [
    "MapRegion.GlobalData",
    0xa401,
    {
      fields: [
        { name: "unknown1", type: "float", defaultValue: 0.0 },
        { name: "unknown2", type: "float", defaultValue: 0.0 },
      ],
    },
  ],
  [
    "MapRegion.Data",
    0xa402,
    {
      fields: [
        { name: "unknown1", type: "float", defaultValue: 0.0 },
        { name: "unknown2", type: "uint32", defaultValue: 0 },
        {
          name: "regions",
          type: "array",
          defaultValue: [{}],
          fields: [
            { name: "regionId", type: "uint32", defaultValue: 0 },
            { name: "regionId2", type: "uint32", defaultValue: 0 },
            { name: "nameId", type: "uint32", defaultValue: 0 },
            { name: "facilityId", type: "uint32", defaultValue: 0 },
            { name: "facilityType", type: "uint8", defaultValue: 0 },
            { name: "currencyId", type: "uint8", defaultValue: 0 },
            { name: "ownerFactionId", type: "uint8", defaultValue: 0 },
            {
              name: "hexes",
              type: "array",
              defaultValue: [{}],
              fields: [
                { name: "x", type: "int32", defaultValue: 0 },
                { name: "y", type: "int32", defaultValue: 0 },
                { name: "type", type: "uint32", defaultValue: 0 },
              ],
            },
            { name: "flags", type: "uint8", defaultValue: 0 },
            {
              name: "unknown4",
              type: "array",
              defaultValue: [{}],
              elementType: "uint8",
            },
            {
              name: "unknown5",
              type: "array",
              defaultValue: [{}],
              elementType: "uint8",
            },
            {
              name: "unknown6",
              type: "array",
              defaultValue: [{}],
              elementType: "uint8",
            },
            { name: "connectionFacilityId", type: "uint32", defaultValue: 0 },
          ],
        },
      ],
    },
  ],
  ["MapRegion.ExternalData", 0xa403, {}],
  ["MapRegion.Update", 0xa404, {}],
  ["MapRegion.UpdateAll", 0xa405, {}],
  [
    "MapRegion.MapOutOfBounds",
    0xa406,
    {
      fields: [
        { name: "characterId", type: "uint64string", defaultValue: "0" },
        { name: "unknownDword1", type: "uint32", defaultValue: 0 },
        { name: "unknownByte2", type: "uint8", defaultValue: 0 },
      ],
    },
  ],
  ["MapRegion.Population", 0xa407, {}],
  [
    "MapRegion.RequestContinentData",
    0xa408,
    {
      fields: [{ name: "zoneId", type: "uint32", defaultValue: 0 }],
    },
  ],
  ["MapRegion.InfoRequest", 0xa409, {}],
  ["MapRegion.InfoReply", 0xa40a, {}],
  ["MapRegion.ExternalFacilityData", 0xa40b, {}],
  ["MapRegion.ExternalFacilityUpdate", 0xa40c, {}],
  ["MapRegion.ExternalFacilityUpdateAll", 0xa40d, {}],
  ["MapRegion.ExternalFacilityEmpireScoreUpdate", 0xa40e, {}],
  ["MapRegion.NextTick", 0xa40f, {}],
  ["MapRegion.HexActivityUpdate", 0xa410, {}],
  ["MapRegion.ConquerFactionUpdate", 0xa411, {}],
  ["HudManager", 0xa5, {}],
  ["AcquireTimers", 0xa6, {}],
  ["LoginBase", 0xa7, {}],
  [
    "ServerPopulationInfo",
    0xa8,
    {
      fields: [
        {
          name: "population",
          type: "array",
          defaultValue: [{}],
          elementtype: "uint16",
        },
        {
          name: "populationPercent",
          type: "array",
          defaultValue: [{}],
          elementType: "uint8",
        },
        {
          name: "populationBuff",
          type: "array",
          defaultValue: [{}],
          elementType: "uint8",
        },
      ],
    },
  ],
  [
    "GetServerPopulationInfo",
    0xa9,
    {
      fields: [],
    },
  ],
  ["PlayerUpdate.VehicleCollision", 0xaa, {}],
  [
    "PlayerStop",
    0xab,
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
    0xac01,
    {
      fields: [
        { name: "currencyId", type: "uint32", defaultValue: 0 },
        { name: "discount", type: "float", defaultValue: 0.0 },
      ],
    },
  ],
  ["Currency.SetCurrencyRateTier", 0xac02, {}],
  ["Items.LoadItemRentalDefinitionManager", 0xad01, {}],
  ["Items.SetItemTimerManager", 0xad02, {}],
  ["Items.SetItemLockTimer", 0xad03, {}],
  ["Items.SetItemTimers", 0xad04, {}],
  ["Items.SetItemTrialLockTimer", 0xad05, {}],
  ["Items.SetItemTrialTimers", 0xad06, {}],
  ["Items.AddItemTrialTimer", 0xad07, {}],
  ["Items.RemoveItemTrialTimer", 0xad08, {}],
  ["Items.ExpireItemTrialTimer", 0xad09, {}],
  ["Items.UpdateItemTrialTimer", 0xad0a, {}],
  ["Items.SetItemRentalTimers", 0xad0b, {}],
  ["Items.AddItemRentalTimer", 0xad0c, {}],
  ["Items.RemoveItemRentalTimer", 0xad0d, {}],
  ["Items.ExpireItemRentalTimer", 0xad0e, {}],
  ["Items.SetAccountItemManager", 0xad0f, {}],
  ["Items.AddAccountItem", 0xad10, {}],
  ["Items.RemoveAccountItem", 0xad11, {}],
  ["Items.UpdateAccountItem", 0xad12, {}],
  ["Items.RequestAddItemTimer", 0xad13, {}],
  ["Items.RequestTrialItem", 0xad14, {}],
  ["Items.RequestRentalItem", 0xad15, {}],
  ["Items.RequestUseItem", 0xad16, {}],
  ["Items.RequestUseAccountItem", 0xad17, {}],
  ["PlayerUpdate.AttachObject", 0xae, {}],
  ["PlayerUpdate.DetachObject", 0xaf, {}],
  [
    "ClientSettings",
    0xb0,
    {
      fields: [
        { name: "helpUrl", type: "string", defaultValue: "" },
        { name: "shopUrl", type: "string", defaultValue: "" },
        { name: "shop2Url", type: "string", defaultValue: "" },
      ],
    },
  ],
  [
    "RewardBuffInfo",
    0xb1,
    {
      fields: [
        { name: "unknownFloat1", type: "float", defaultValue: 0.0 },
        { name: "unknownFloat2", type: "float", defaultValue: 0.0 },
        { name: "unknownFloat3", type: "float", defaultValue: 0.0 },
        { name: "unknownFloat4", type: "float", defaultValue: 0.0 },
        { name: "unknownFloat5", type: "float", defaultValue: 0.0 },
        { name: "unknownFloat6", type: "float", defaultValue: 0.0 },
        { name: "unknownFloat7", type: "float", defaultValue: 0.0 },
        { name: "unknownFloat8", type: "float", defaultValue: 0.0 },
        { name: "unknownFloat9", type: "float", defaultValue: 0.0 },
        { name: "unknownFloat10", type: "float", defaultValue: 0.0 },
        { name: "unknownFloat11", type: "float", defaultValue: 0.0 },
        { name: "unknownFloat12", type: "float", defaultValue: 0.0 },
      ],
    },
  ],
  [
    "GetRewardBuffInfo",
    0xb2,
    {
      fields: [],
    },
  ],
  ["Cais", 0xb3, {}],
  [
    "ZoneSetting.Data",
    0xb401,
    {
      fields: [
        {
          name: "settings",
          type: "array",
          defaultValue: [{}],
          fields: [
            { name: "hash", type: "uint32", defaultValue: 0 },
            { name: "unknown1", type: "uint32", defaultValue: 0 },
            { name: "unknown2", type: "uint32", defaultValue: 0 },
            { name: "value", type: "uint32", defaultValue: 0 },
            { name: "settingType", type: "uint32", defaultValue: 0 },
          ],
        },
      ],
    },
  ],
  ["RequestPromoEligibilityUpdate", 0xb5, {}],
  ["PromoEligibilityReply", 0xb6, {}],
  ["MetaGameEvent.StartWarning", 0xb701, {}],
  ["MetaGameEvent.Start", 0xb702, {}],
  ["MetaGameEvent.Update", 0xb703, {}],
  ["MetaGameEvent.CompleteDominating", 0xb704, {}],
  ["MetaGameEvent.CompleteStandard", 0xb705, {}],
  ["MetaGameEvent.CompleteCancel", 0xb706, {}],
  ["MetaGameEvent.ExperienceBonusUpdate", 0xb707, {}],
  ["MetaGameEvent.ClearExperienceBonus", 0xb708, {}],
  ["RequestWalletTopupUpdate", 0xb8, {}],
  ["StationCashActivePromoRequestUpdate", 0xb9, {}],
  [
    "Pickup",
    0xbb,
    {
      fields: [
        { name: "type?", type: "uint16" },
        { name: "id", type: "uint32" },
        { name: "treeId", type: "uint32" },
        { name: "name", type: "string" },
      ],
    },
  ],
  ["Operation.ClientJoined", 0xbc06, {}],
  ["Operation.ClientLeft", 0xbc07, {}],
  ["Operation.AvailableData", 0xbc09, {}],
  ["Operation.Created", 0xbc0a, {}],
  ["Operation.Destroyed", 0xbc0b, {}],
  ["Operation.ClientClearMissions", 0xbf0c, { fields: [] }],
  ["Operation.InstanceAreaUpdate", 0xbc0d, {}],
  ["Operation.ClientInArea", 0xbc0e, {}],
  ["Operation.InstanceLocationUpdate", 0xbc0f, {}],
  ["Operation.GroupOperationListReply", 0xbc11, {}],

  [
    "WordFilter.Data",
    0xbd01,
    {
      fields: [{ name: "wordFilterData", type: "byteswithlength" }],
    },
  ],
  ["StaticFacilityInfo.Request", 0xbe01, {}],
  ["StaticFacilityInfo.Reply", 0xbe02, {}],
  [
    "StaticFacilityInfo.AllZones",
    0xbe03,
    {
      fields: [
        {
          name: "facilities",
          type: "array",
          defaultValue: [{}],
          fields: [
            { name: "zoneId", type: "uint32", defaultValue: 0 },
            { name: "facilityId", type: "uint32", defaultValue: 0 },
            { name: "nameId", type: "uint32", defaultValue: 0 },
            { name: "facilityType", type: "uint8", defaultValue: 0 },
            { name: "locationX", type: "float", defaultValue: 0.0 },
            { name: "locationY", type: "float", defaultValue: 0.0 },
            { name: "locationZ", type: "float", defaultValue: 0.0 },
          ],
        },
      ],
    },
  ],
  ["StaticFacilityInfo.ReplyWarpgate", 0xbe04, {}],
  ["StaticFacilityInfo.AllWarpgateRespawns", 0xbe05, {}],
  ["ProxiedPlayer", 0xbf, {}],
  ["Resists", 0xc0, {}],
  ["InGamePurchasing", 0xc1, {}],
  ["BusinessEnvironments", 0xc2, {}],
  ["EmpireScore", 0xc3, {}],
  ["CharacterSelectSessionRequest", 0xc4, {}],
  [
    "CharacterSelectSessionResponse",
    0xc5,
    {
      fields: [
        { name: "status", type: "uint8", defaultValue: 0 },
        { name: "sessionId", type: "string", defaultValue: "" },
      ],
    },
  ],
  ["Stats", 0xc6, {}],
  ["Score", 0xc7, {}],
  ["Resources", 0xc8, {}],
  [
    "Container.unknown1",
    0xc90200,
    {
      fields: [
        { name: "ignore", type: "uint64string", defaultValue: "0" },
        { name: "characterId", type: "uint64string", defaultValue: "0" },
        {
          name: "array1",
          type: "array",
          defaultValue: [{}],
          fields: [
            { name: "unknownDword1", type: "uint32", defaultValue: 0 },
            { name: "itemData", type: "schema", fields: itemData },
            // not done
          ],
        },
      ],
    },
  ],
  [
    "Container.Error",
    0xc90300,
    {
      fields: [
        { name: "ignore", type: "uint64string", defaultValue: "0" },
        { name: "containerError", type: "uint32", defaultValue: 0 },
      ],
    },
  ],
  [
    "Container.unknown2",
    0xc90500,
    {
      fields: [
        { name: "ignore", type: "uint64string", defaultValue: "0" },
        {
          name: "containers",
          type: "array",
          defaultValue: [{}],
          fields: containerData,
        },
        {
          name: "array1",
          type: "array",
          defaultValue: [{}],
          fields: [
            { name: "unknownQword1", type: "uint64string", defaultValue: "0" },
            { name: "unknownDword1", type: "uint32", defaultValue: 0 },
          ],
        },
        { name: "unknownDword1", type: "uint32", defaultValue: 1 },
      ],
    },
  ],
  ["Construction", 0xca, {}],
  [
    "UpdateWeatherData",
    0xcb,
    {
      fields: skyData,
    },
  ],
  ["NavGen", 0xcc, {}],
  ["Locks", 0xcd, {}],
  ["Ragdoll", 0xce, {}],
  ["CharacterState", 0xd0, {}],
  [
    "AddLightweightPc",
    0xd6,
    {
      fields: lightWeightPcSchema,
    },
  ],
  [
    "AddLightweightNpc",
    0xd7,
    {
      fields: lightWeightNpcSchema,
    },
  ],
  [
    "AddLightweightVehicle",
    0xd8,
    {
      fields: [
        { name: "npcData", type: "schema", fields: lightWeightNpcSchema },
        { name: "unknownGuid1", type: "uint64string", defaultValue: "0" },
        { name: "unknownDword1", type: "uint32", defaultValue: 0 },
        { name: "unknownDword2", type: "uint32", defaultValue: 0 },
        {
          name: "positionUpdate",
          type: "custom",
          parser: readPositionUpdateData,
          packer: packPositionUpdateData,
        },
        { name: "unknownString1", type: "string", defaultValue: "" },
      ],
    },
  ],
  [
    "AddProxiedObject",
    0xd9,
    {
      fields: [
        { name: "guid", type: "uint64string", defaultValue: "0" },
        {
          name: "transientId",
          type: "custom",
          parser: readUnsignedIntWith2bitLengthValue,
          packer: packUnsignedIntWith2bitLengthValue,
        },
        { name: "unknownByte1", type: "uint8", defaultValue: 0 },
        { name: "position", type: "floatvector3", defaultValue: [0, 0, 0] },
        { name: "rotation", type: "floatvector3", defaultValue: [0, 0, 0] },
      ],
    },
  ],
  ["LightweightToFullPc", 0xda, { fields: fullPcDataSchema }],
  [
    "LightweightToFullNpc",
    0xdb,
    {
      fields: fullNpcDataSchema,
    },
  ],
  [
    "LightweightToFullVehicle",
    0xdc,
    {
      fields: [
        { name: "npcData", type: "schema", fields: fullNpcDataSchema },
        { name: "unknownByte1", type: "uint8", defaultValue: 0 },
        { name: "unknownDword1", type: "uint32", defaultValue: 0 },
        {
          name: "unknownArray1",
          type: "array",
          defaultValue: [{}],
          fields: [
            { name: "unknownDword1", type: "uint32", defaultValue: 0 },
            { name: "unknownBoolean1", type: "boolean", defaultValue: false },
          ],
        },
        {
          name: "unknownArray2",
          type: "array",
          defaultValue: [{}],
          fields: [
            { name: "unknownDword1", type: "uint32", defaultValue: 0 },
            { name: "unknownByte1", type: "boolean", defaultValue: false },
          ],
        },
        {
          name: "unknownVector1",
          type: "floatvector4",
          defaultValue: [0, 0, 0, 0],
        },
        {
          name: "unknownVector2",
          type: "floatvector4",
          defaultValue: [0, 0, 0, 0],
        },
        { name: "unknownByte3", type: "uint8", defaultValue: 0 },
        {
          name: "unknownArray3",
          type: "array",
          defaultValue: [{}],
          fields: [
            { name: "unknownDword1", type: "uint32", defaultValue: 0 },
            { name: "unknownQword1", type: "uint64string", defaultValue: "0" },
          ],
        },
        {
          name: "unknownArray4",
          type: "array",
          defaultValue: [{}],
          fields: [
            { name: "unknownDword1", type: "uint32", defaultValue: 0 },
            { name: "unknownQword1", type: "uint64string", defaultValue: "0" },
          ],
        },
        {
          name: "unknownArray5",
          type: "array",
          defaultValue: [{}],
          fields: [
            {
              name: "unknownData1",
              type: "schema",
              fields: [
                { name: "unknownQword1", type: "uint64string", defaultValue: "0" },
                {
                  name: "unknownData1",
                  type: "schema",
                  fields: [
                    { name: "unknownDword1", type: "uint32", defaultValue: 0 },
                    { name: "unknownDword2", type: "uint32", defaultValue: 0 },
                    { name: "unknownDword3", type: "uint32", defaultValue: 0 },
                    {
                      name: "unknownString1",
                      type: "string",
                      defaultValue: "",
                    },
                    {
                      name: "unknownString2",
                      type: "string",
                      defaultValue: "",
                    },
                  ],
                },
                { name: "unknownDword1", type: "uint32", defaultValue: 0 },
                { name: "unknownString1", type: "string", defaultValue: "" },
              ],
            },
            { name: "unknownByte1", type: "uint8", defaultValue: 0 },
          ],
        },
        {
          name: "unknownArray6",
          type: "array",
          defaultValue: [{}],
          fields: [
            { name: "unknownString1", type: "string", defaultValue: "" },
          ],
        },
        {
          name: "unknownArray7",
          type: "array",
          defaultValue: [{}],
          fields: itemWeaponDetailSubSchema1,
        },
        {
          name: "unknownArray8",
          type: "array",
          defaultValue: [{}],
          fields: itemWeaponDetailSubSchema2,
        },
        { name: "unknownFloat1", type: "float", defaultValue: 0.0 },
      ],
    },
  ],
  ["CheckLocalValues", 0xde, {}],
  ["ChronicleBase", 0xdf, {}],
  ["GrinderBase", 0xe0, {}],
  ["RequestObject", 0xe1, {}],
  ["ScreenEffectBase", 0xe2, {}],
  ["SpectatorBase", 0xe3, {}],
  ["WhitelistBase", 0xe4, {}],
  ["NpcFoundationPermissionsManagerBase", 0xe5, {}],
  ["BattlEyeData", 0xe6, {}],
  ["OnlineIdBase", 0xe7, {}],
  ["Ps4PlayGoBase", 0xe8, {}],
  ["SynchronizedTeleportBase", 0xe9, {}],
  ["StaticViewBase", 0xea, {}],
  ["ReplicationBase", 0xeb, {}],
  ["DatasheetsBase", 0xec, {}],
  ["PlayerWorldTransferRequest", 0xed, {}],
  ["PlayerWorldTransferReply", 0xee, {}],
  ["CancelQueueOnWorld", 0xef, {}],
  ["DeclineEnterGameOnWorld", 0xf0, {}],
  ["AccessedCharacterBase", 0xf1, {}],
  ["ShaderParameterOverrideBase", 0xf2, {}],
  ["VehicleSkinBase", 0xf3, {}],
  ["WeaponLagLockParameters", 0xf5, {}],
  ["CrateOpeningBase", 0xf6, {}],
  ["PlayerHeatWarning", 0xf7, {}],
  ["AnimationBase", 0xf8, {}],
];

const [packetTypes, packetDescriptors] = PacketTableBuild(packets);

exports.PacketTypes = packetTypes;
exports.Packets = packetDescriptors;
