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

import {
  eul2quat,
  getPacketTypeBytes,
  lz4_decompress,
} from "../../../utils/utils";
import DataSchema from "h1z1-dataschema";

export function readPacketType(data: Buffer, packets: any) {
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

export function writePacketType(packetType: number) {
  const packetTypeBytes = getPacketTypeBytes(packetType);

  const data = Buffer.allocUnsafe(packetTypeBytes.length);
  for (let i = 0; i < packetTypeBytes.length; i++) {
    data.writeUInt8(packetTypeBytes[i], i);
  }
  return data;
}

export function readUnsignedIntWith2bitLengthValue(
  data: Buffer,
  offset: number
) {
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

export function packUnsignedIntWith2bitLengthValue(value: number) {
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
  const data = Buffer.allocUnsafe(4);
  data.writeUInt32LE(value, 0);
  return data.slice(0, n + 1);
}

export function readSignedIntWith2bitLengthValue(data: Buffer, offset: number) {
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

export function packSignedIntWith2bitLengthValue(value: number) {
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
  const data = Buffer.allocUnsafe(4);
  data.writeUInt32LE(value, 0);
  return data.slice(0, n + 1);
}

export function readPositionUpdateData(data: Buffer, offset: number) {
  const obj: any = {},
    startOffset = offset;
  obj["flags"] = data.readUInt16LE(offset);
  offset += 2;

  obj["sequenceTime"] = data.readUInt32LE(offset);
  offset += 4;

  obj["unknown3_int8"] = data.readUInt8(offset);
  offset += 1;

  if (obj.flags & 1) {
    var v = readUnsignedIntWith2bitLengthValue(data, offset);
    obj["stance"] = v.value;
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
    obj["orientation"] = data.readFloatLE(offset);
    offset += 4;
  }

  if (obj.flags & 0x40) {
    var v = readSignedIntWith2bitLengthValue(data, offset);
    obj["frontTilt"] = v.value / 100; // not 100% sure about name
    offset += v.length;
  }

  if (obj.flags & 0x80) {
    var v = readSignedIntWith2bitLengthValue(data, offset);
    obj["sideTilt"] = v.value / 100; // not 100% sure
    offset += v.length;
  }

  if (obj.flags & 4) {
    var v = readSignedIntWith2bitLengthValue(data, offset);
    obj["angleChange"] = v.value / 100; // maybe
    offset += v.length;
  }

  if (obj.flags & 0x8) {
    var v = readSignedIntWith2bitLengthValue(data, offset);
    obj["verticalSpeed"] = v.value / 100;
    offset += v.length;
  }

  if (obj.flags & 0x10) {
    var v = readSignedIntWith2bitLengthValue(data, offset);
    obj["horizontalSpeed"] = v.value / 10;
    offset += v.length;
  }

  if (obj.flags & 0x100) {
    // either the previous one i meantioned is rotation delta or this one cause rotation is almost neved sent by client
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
    const rotationEul = [];
    var v = readSignedIntWith2bitLengthValue(data, offset);
    rotationEul[0] = v.value / 100;
    offset += v.length;
    var v = readSignedIntWith2bitLengthValue(data, offset);
    rotationEul[1] = v.value / 100;
    offset += v.length;
    var v = readSignedIntWith2bitLengthValue(data, offset);
    rotationEul[2] = v.value / 100;
    offset += v.length;
    var v = readSignedIntWith2bitLengthValue(data, offset);
    rotationEul[3] = v.value / 100;
    obj["rotation"] = eul2quat(rotationEul);
    obj["rotationRaw"] = rotationEul;
    obj["lookAt"] = eul2quat([rotationEul[0], 0, 0, 0]);
    offset += v.length;
  }

  if (obj.flags & 0x400) {
    var v = readSignedIntWith2bitLengthValue(data, offset);
    obj["direction"] = v.value / 10;
    offset += v.length;
  }

  if (obj.flags & 0x800) {
    var v = readSignedIntWith2bitLengthValue(data, offset);
    obj["engineRPM"] = v.value / 10;
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

export function packPositionUpdateData(obj: any) {
  let data = Buffer.allocUnsafe(7),
    flags = 0,
    v;

  data.writeUInt32LE(obj["sequenceTime"], 2);
  data.writeUInt8(obj["unknown3_int8"], 6);

  if ("stance" in obj) {
    flags |= 1;
    v = packUnsignedIntWith2bitLengthValue(obj["stance"]);
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

  if ("orientation" in obj) {
    flags |= 0x20;
    v = Buffer.allocUnsafe(4);
    v.writeFloatLE(obj["orientation"], 0);
    data = Buffer.concat([data, v]);
  }

  if ("frontTilt" in obj) {
    flags |= 0x40;
    v = packSignedIntWith2bitLengthValue(obj["frontTilt"] * 100);
    data = Buffer.concat([data, v]);
  }

  if ("sideTilt" in obj) {
    flags |= 0x80;
    v = packSignedIntWith2bitLengthValue(obj["sideTilt"] * 100);
    data = Buffer.concat([data, v]);
  }

  if ("angleChange" in obj) {
    flags |= 4;
    v = packSignedIntWith2bitLengthValue(obj["angleChange"] * 100);
    data = Buffer.concat([data, v]);
  }

  if ("verticalSpeed" in obj) {
    flags |= 8;
    v = packSignedIntWith2bitLengthValue(obj["verticalSpeed"] * 100);
    data = Buffer.concat([data, v]);
  }

  if ("horizontalSpeed" in obj) {
    flags |= 0x10;
    v = packSignedIntWith2bitLengthValue(obj["horizontalSpeed"] * 10);
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

  if ("rotationRaw" in obj) {
    flags |= 0x200;
    v = packSignedIntWith2bitLengthValue(obj["rotationRaw"][0] * 100);
    data = Buffer.concat([data, v]);
    v = packSignedIntWith2bitLengthValue(obj["rotationRaw"][1] * 100);
    data = Buffer.concat([data, v]);
    v = packSignedIntWith2bitLengthValue(obj["rotationRaw"][2] * 100);
    data = Buffer.concat([data, v]);
    v = packSignedIntWith2bitLengthValue(obj["rotationRaw"][3] * 100);
    data = Buffer.concat([data, v]);
  }

  if ("direction" in obj) {
    flags |= 0x400;
    v = packSignedIntWith2bitLengthValue(obj["direction"] * 10);
    data = Buffer.concat([data, v]);
  }

  if ("engineRPM" in obj) {
    flags |= 0x800;
    v = packSignedIntWith2bitLengthValue(obj["engineRPM"] * 10);
    data = Buffer.concat([data, v]);
  }

  data.writeUInt16LE(flags, 0);

  return data;
}

export function packItemSubData(obj: any) {
  const unknownData1Schema = [
    { name: "unknownQword1", type: "uint64string", defaultValue: "" },
    { name: "unknownDword1", type: "uint32", defaultValue: 0 },
    { name: "unknownDword2", type: "uint32", defaultValue: 0 },
  ];
  let data = Buffer.alloc(1);
  data.writeUInt8(obj["hasSubData"] ? 1 : 0, 0);
  if (!obj.hasSubData) return data;
  const v = Buffer.alloc(4);
  v.writeUInt32LE(obj["unknownDword1"], 0);
  data = Buffer.concat([data, v]);
  if (obj.unknownDword1 <= 0) return data;
  const unknownData1Obj = DataSchema.pack(
    unknownData1Schema,
    obj["unknownData1"]
  ).data;
  return Buffer.concat([data, unknownData1Obj]);
}

export function parseVehicleReferenceData(data: Buffer, offset: number) {
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

export function packVehicleReferenceData(obj: any) {
  const data = DataSchema.pack(vehicleReferenceDataSchema, obj);
  return data;
}

export function parseItemAddData(
  data: Buffer,
  offset: number,
  referenceData: any
) {
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

export function parseItemData(
  data: Buffer,
  offset: number,
  referenceData: any
) {
  const startOffset = offset;
  let detailItem, detailSchema;
  const baseItem: any = DataSchema.parse(itemBaseSchema, data, offset);
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

export function packItemData(obj: any, referenceData: any) {
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

  //detailData = DataSchema.pack(detailSchema, obj.detail);
  return baseData.data;
}

export const lightWeightPcSchema = [
  { name: "characterId", type: "uint64string", defaultValue: "0" },
  {
    name: "transientId",
    type: "custom",
    parser: readUnsignedIntWith2bitLengthValue,
    packer: packUnsignedIntWith2bitLengthValue,
    defaultValue: 1,
  },
  { name: "unknownDword1", type: "uint32", defaultValue: 9241 },
  { name: "unknownDword2", type: "uint32", defaultValue: 9242 },
  { name: "unknownDword3", type: "uint32", defaultValue: 9243 },
  {
    name: "characterFirstName",
    type: "string",
    defaultValue: "LocalPlayer",
  },
  { name: "characterLastName", type: "string", defaultValue: "" },
  { name: "unknownByte3", type: "uint8", defaultValue: 0 },
  { name: "modelId", type: "uint32", defaultValue: 9240 },
  { name: "unknownDword5", type: "uint32", defaultValue: 9001 },
  { name: "position", type: "floatvector3", defaultValue: [0, 200, 0] },
  { name: "rotation", type: "floatvector4", defaultValue: [0, 0, 0, 1] },
  { name: "unknownFloat1", type: "float", defaultValue: 0.0 },
  { name: "unknownGuid1", type: "uint64string", defaultValue: "0" },
  { name: "unknownDword6", type: "uint32", defaultValue: 0 },
  { name: "unknownDword7", type: "uint32", defaultValue: 0 },
  { name: "unknownByte4", type: "uint8", defaultValue: 0 },
  { name: "unknownDword8", type: "uint32", defaultValue: 0 },
  { name: "unknownDword9", type: "uint32", defaultValue: 0 },
  { name: "unknownGuid2", type: "uint64string", defaultValue: "0x0000" },
  { name: "unknownByte5", type: "uint8", defaultValue: 0 },
];

export const statDataSchema = [
  { name: "statId", type: "uint32", defaultValue: 0 },
  {
    name: "statData",
    type: "schema",
    fields: [
      { name: "statId", type: "uint32", defaultValue: 0 },
      {
        name: "statValue",
        type: "variabletype8",
        types: {
          0: [
            { name: "base", type: "uint32", defaultValue: 0 },
            { name: "modifier", type: "uint32", defaultValue: 0 },
          ],
          1: [
            { name: "base", type: "float", defaultValue: 0 },
            { name: "modifier", type: "float", defaultValue: 0 },
          ],
        },
      },
    ],
  },
];

export const lightWeightNpcSchema = [
  {
    name: "characterId",
    type: "uint64string",
    defaultValue: "0x0000000000000000",
  },
  {
    name: "transientId",
    type: "custom",
    parser: readUnsignedIntWith2bitLengthValue,
    packer: packUnsignedIntWith2bitLengthValue,
    defaultValue: 1,
  },
  { name: "string5", type: "string", defaultValue: "" },
  { name: "nameId", type: "uint32", defaultValue: 0 },
  { name: "spawnId", type: "uint32", defaultValue: 3 },
  { name: "facilityId", type: "uint32", defaultValue: 1 },
  { name: "factionId", type: "uint8", defaultValue: 0 },
  { name: "modelId", type: "uint32", defaultValue: 9001 },
  { name: "scale", type: "floatvector4", defaultValue: [1, 1, 1, 1] },
  { name: "texture", type: "string", defaultValue: "" },
  { name: "string13", type: "string", defaultValue: "" },
  { name: "unknown14", type: "uint32", defaultValue: 0 },
  { name: "position", type: "floatvector3", defaultValue: [0, 50, 0] },
  {
    name: "rotation",
    type: "floatvector4",
    defaultValue: [0, 0, 0, 1],
  },
  { name: "unknownVector", type: "floatvector4", defaultValue: [0, 0, 0, 1] },
  { name: "unknown18", type: "uint32", defaultValue: 0 },
  { name: "unknown19", type: "uint32", defaultValue: 0 },
  {
    name: "extraModel",
    type: "string",
    defaultValue: "",
  },
  { name: "string21", type: "string", defaultValue: "" },
  { name: "string22", type: "string", defaultValue: "" },
  { name: "vehicleId", type: "uint32", defaultValue: 0 },
  { name: "unknown24", type: "uint32", defaultValue: 0 },
  { name: "npcDefinitionId", type: "uint32", defaultValue: 3 },
  { name: "positionUpdateType", type: "uint8", defaultValue: 0 }, // determine if npc is moving with positionUpdate - Avcio
  { name: "profileId", type: "uint32", defaultValue: 0 },
  { name: "dontRequestFullData", type: "boolean", defaultValue: false },
  {
    name: "color",
    type: "rgb",
    defaultValue: {},
    fields: [
      { name: "r", type: "uint8", defaultValue: 0 },
      { name: "g", type: "uint8", defaultValue: 0 },
      { name: "b", type: "uint8", defaultValue: 0 },
    ],
  },
  { name: "MRversion", type: "uint8", defaultValue: 0 },
  { name: "unknown31", type: "uint32", defaultValue: 0 },
  {
    name: "unknown32",
    type: "uint64string",
    defaultValue: "0x0000000000000000",
  },
  {
    name: "attachedObject",
    type: "schema",
    defaultValue: {},
    fields: [
      {
        name: "targetObjectId",
        type: "uint64string",
        defaultValue: "0x0000000000000000",
      },
      /* Disable since it's not read if targetObjectID === 0
        {
          name: "unknownVector2",
          type: "floatvector4",
          defaultValue: [0, 0, 0, 0],
        },
        {
          name: "unknownVector3",
          type: "floatvector4",
          defaultValue: [0, 0, 0, 0],
        },
        { name: "unknown4", type: "uint32", defaultValue: 13 },
        { name: "unknown33", type: "uint32", defaultValue: 13},
        */
    ],
  },
  { name: "debugMode", type: "uint32", defaultValue: 0 },
  { name: "unknown35", type: "uint32", defaultValue: 0 },
  { name: "unknown37", type: "uint32", defaultValue: 0 },
  {
    name: "unknown36",
    type: "uint64string",
    defaultValue: "0x0000000000000000",
  },
  { name: "unknown38", type: "uint32", defaultValue: 0 },
  { name: "unknown39", type: "uint32", defaultValue: 0 },
  { name: "unknown40", type: "uint32", defaultValue: 0 },
];

export const fullPcDataSchema = [
  {
    name: "transientId",
    type: "custom",
    parser: readUnsignedIntWith2bitLengthValue,
    packer: packUnsignedIntWith2bitLengthValue,
    defaultValue: 1,
  },
  { name: "unknownDword1", type: "uint32", defaultValue: 0 },
  { name: "unknownDword2", type: "uint32", defaultValue: 0 },
  { name: "unknownDword3", type: "uint32", defaultValue: 0 },
  { name: "unknownDword4", type: "uint32", defaultValue: 0 },

  {
    name: "attachments",
    type: "array",
    defaultValue: [],
    fields: [
      { name: "unknownString1", type: "string", defaultValue: "" },
      { name: "unknownString2", type: "string", defaultValue: "" },
      { name: "unknownString3", type: "string", defaultValue: "" },
      { name: "unknownString4", type: "string", defaultValue: "" },
      { name: "unknownDword1", type: "uint32", defaultValue: 0 },
      { name: "unknownDword2", type: "uint32", defaultValue: 0 },
      { name: "unknownDword3", type: "uint32", defaultValue: 0 },
    ],
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
  { name: "unknownboolean1", type: "boolean", defaultValue: 0 },
  { name: "unknownboolean2", type: "boolean", defaultValue: 0 },
  { name: "unknownboolean3", type: "boolean", defaultValue: 0 },

  {
    name: "effectTags",
    type: "array8",
    defaultValue: [],
    fields: [
      { name: "unknownDword1", type: "uint32", defaultValue: 0 },
      { name: "unknownDword2", type: "uint32", defaultValue: 0 },
      { name: "unknownDword3", type: "uint32", defaultValue: 0 },
      { name: "unknownDword4", type: "uint32", defaultValue: 0 },
      { name: "unknownDword5", type: "uint32", defaultValue: 0 },
      { name: "unknownDword6", type: "uint32", defaultValue: 0 },
      { name: "unknownDword7", type: "uint32", defaultValue: 0 },
      { name: "unknownDword8", type: "uint32", defaultValue: 0 },
      { name: "unknownDword9", type: "uint32", defaultValue: 0 },
      { name: "unknownFloat1", type: "float", defaultValue: 0.0 },
      { name: "unknownDword10", type: "uint32", defaultValue: 0 },
      { name: "unknownQword1", type: "uint64string", defaultValue: "0" },
      { name: "unknownQword2", type: "uint64string", defaultValue: "0" },
      { name: "unknownQword3", type: "uint64string", defaultValue: "0" },
      { name: "unknownGuid1", type: "uint64string", defaultValue: "0" },
      { name: "unknownDword11", type: "uint32", defaultValue: 0 },
      { name: "unknownDword12", type: "uint32", defaultValue: 0 },
      { name: "unknownDword13", type: "uint32", defaultValue: 0 },
      { name: "unknownDword14", type: "uint32", defaultValue: 0 },
      { name: "unknownDword15", type: "uint32", defaultValue: 0 },
      { name: "unknownDword16", type: "uint32", defaultValue: 0 },
      { name: "unknownDword17", type: "uint32", defaultValue: 0 },
      { name: "unknownGuid2", type: "uint64string", defaultValue: "0" },
      { name: "unknownDword18", type: "uint32", defaultValue: 0 },
      { name: "unknownDword19", type: "uint32", defaultValue: 0 },
      { name: "unknownDword20", type: "uint32", defaultValue: 0 },
      { name: "unknownDword21", type: "uint32", defaultValue: 0 },
      { name: "unknownGuid3", type: "uint64string", defaultValue: "0" },
      { name: "unknownGuid4", type: "uint64string", defaultValue: "0" },
      { name: "unknownDword22", type: "uint32", defaultValue: 0 },
      { name: "unknownQword4", type: "uint64string", defaultValue: "0" },
      { name: "unknownDword23", type: "uint32", defaultValue: 0 },
    ],
  },

  { name: "unknownDword9", type: "uint32", defaultValue: 0 },
  { name: "unknownDword10", type: "uint32", defaultValue: 0 },
  { name: "unknownDword11", type: "uint32", defaultValue: 0 },
  { name: "unknownDword12", type: "uint32", defaultValue: 0 },
  { name: "unknownDword13", type: "uint32", defaultValue: 0 },
  { name: "unknownDword14", type: "uint32", defaultValue: 0 },

  { name: "unknownBoolean4", type: "boolean", defaultValue: 0 },
  { name: "unknownBoolean5", type: "boolean", defaultValue: 0 },
  { name: "unknownBoolean6", type: "boolean", defaultValue: 0 },

  { name: "unknownDword15", type: "uint32", defaultValue: 0 },
  { name: "unknownDword16", type: "uint32", defaultValue: 0 },
  { name: "unknownDword17", type: "uint32", defaultValue: 0 },

  { name: "unknownboolean5", type: "boolean", defaultValue: 0 },
  { name: "unknownboolean6", type: "boolean", defaultValue: 0 },
  { name: "unknownboolean7", type: "boolean", defaultValue: 0 },
  { name: "unknownboolean8", type: "boolean", defaultValue: 0 },
];

export const fullNpcDataSchema = [
  {
    name: "transientId",
    type: "custom",
    parser: readUnsignedIntWith2bitLengthValue,
    packer: packUnsignedIntWith2bitLengthValue,
    defaultValue: 1,
  },
  { name: "unknownDword1", type: "uint32", defaultValue: 0 },
  { name: "unknownDword2", type: "uint32", defaultValue: 0 },
  { name: "unknownDword3", type: "uint32", defaultValue: 0 },
  {
    name: "attachments",
    type: "array",
    defaultValue: [],
    fields: [
      { name: "unknownString1", type: "string", defaultValue: "" },
      { name: "unknownString2", type: "string", defaultValue: "" },
      { name: "unknownString3", type: "string", defaultValue: "" },
      { name: "unknownString4", type: "string", defaultValue: "" },
      { name: "unknownDword1", type: "uint32", defaultValue: 0 },
      { name: "unknownDword2", type: "uint32", defaultValue: 0 },
      { name: "unknownDword3", type: "uint32", defaultValue: 0 },
    ],
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
  { name: "unknownDword8", type: "uint32", defaultValue: 0 },
  {
    name: "effectTags",
    type: "array",
    defaultValue: [],
    fields: [
      { name: "unknownDword1", type: "uint32", defaultValue: 0 },
      { name: "unknownDword2", type: "uint32", defaultValue: 0 },
      { name: "unknownDword3", type: "uint32", defaultValue: 0 },
      { name: "unknownDword4", type: "uint32", defaultValue: 0 },
      { name: "unknownDword5", type: "uint32", defaultValue: 0 },
      { name: "unknownDword6", type: "uint32", defaultValue: 0 },
      { name: "unknownDword7", type: "uint32", defaultValue: 0 },
      { name: "unknownDword8", type: "uint32", defaultValue: 0 },
      { name: "unknownDword9", type: "uint32", defaultValue: 0 },
      { name: "unknownFloat1", type: "float", defaultValue: 0.0 },
      { name: "unknownDword10", type: "uint32", defaultValue: 0 },
      { name: "unknownQword1", type: "uint64string", defaultValue: "0" },
      { name: "unknownQword2", type: "uint64string", defaultValue: "0" },
      { name: "unknownQword3", type: "uint64string", defaultValue: "0" },
      { name: "unknownGuid1", type: "uint64string", defaultValue: "0" },
      { name: "unknownDword11", type: "uint32", defaultValue: 0 },
      { name: "unknownDword12", type: "uint32", defaultValue: 0 },
      { name: "unknownDword13", type: "uint32", defaultValue: 0 },
      { name: "unknownDword14", type: "uint32", defaultValue: 0 },
      { name: "unknownDword15", type: "uint32", defaultValue: 0 },
      { name: "unknownDword16", type: "uint32", defaultValue: 0 },
      { name: "unknownDword17", type: "uint32", defaultValue: 0 },
      { name: "unknownGuid2", type: "uint64string", defaultValue: "0" },
      { name: "unknownDword18", type: "uint32", defaultValue: 0 },
      { name: "unknownDword19", type: "uint32", defaultValue: 0 },
      { name: "unknownDword20", type: "uint32", defaultValue: 0 },
      { name: "unknownDword21", type: "uint32", defaultValue: 0 },
      { name: "unknownGuid3", type: "uint64string", defaultValue: "0" },
      { name: "unknownGuid4", type: "uint64string", defaultValue: "0" },
      { name: "unknownDword22", type: "uint32", defaultValue: 0 },
      { name: "unknownQword4", type: "uint64string", defaultValue: "0" },
      { name: "unknownDword23", type: "uint32", defaultValue: 0 },
    ],
  },
  { name: "unknownDword9", type: "uint32", defaultValue: 0 },
  { name: "unknownString3", type: "string", defaultValue: "" },
  { name: "unknownString4", type: "string", defaultValue: "" },
  { name: "unknownDword10", type: "uint32", defaultValue: 0 },
  { name: "unknownString5", type: "string", defaultValue: "" },
  { name: "unknownVector3", type: "floatvector4", defaultValue: [0, 0, 0, 0] },
  { name: "unknownDword11", type: "uint32", defaultValue: 0 },
  { name: "unknownDword12", type: "uint32", defaultValue: 0 },
  { name: "unknownDword13", type: "uint32", defaultValue: 0 },
  { name: "unknownGuid", type: "uint64string", defaultValue: "0" },
  { name: "unknownFloat3", type: "float", defaultValue: 0.0 },
  // { name: "targetData", type: "schema", fields: targetDataSchema }, removed
  {
    name: "characterVariables",
    type: "array",
    defaultValue: [],
    fields: [
      //  { name: "unknownDword1", type: "uint32", defaultValue: 0 }, false
      { name: "unknownString1", type: "string", defaultValue: "" },
      { name: "unknownDword2", type: "uint32", defaultValue: 0 },
    ],
  },
  { name: "unknownDword14", type: "uint32", defaultValue: 0 },
  { name: "unknownFloat4", type: "float", defaultValue: 0.0 },
  { name: "unknownVector5", type: "floatvector4", defaultValue: [0, 0, 0, 0] },
  { name: "unknownDword15", type: "uint32", defaultValue: 0 },
  { name: "unknownFloat5", type: "float", defaultValue: 0.0 },
  { name: "unknownFloat6", type: "float", defaultValue: 0.0 },
  { name: "unknownFloat7", type: "float", defaultValue: 0.0 },

  { name: "unknownDword16", type: "uint32", defaultValue: 0 },
  { name: "unknownDword17", type: "uint32", defaultValue: 0 },
  { name: "unknownDword18", type: "uint32", defaultValue: 0 },
  { name: "unknownDword19", type: "uint32", defaultValue: 0 },
  { name: "unknownDword21", type: "uint32", defaultValue: 0 },
  { name: "unknownByte1", type: "uint8", defaultValue: 0 },
  { name: "unknownByte2", type: "uint8", defaultValue: 0 },
  { name: "unknownDword22", type: "uint32", defaultValue: 0 },
  { name: "unknownDword23", type: "uint32", defaultValue: 0 },
  { name: "unknownDword24", type: "uint32", defaultValue: 0 },

  { name: "unknownGuid1", type: "uint64string", defaultValue: "0" },
  { name: "unknownDword25", type: "uint32", defaultValue: 0 },
  { name: "unknownGuid2", type: "uint64string", defaultValue: "0" },

  { name: "unknownDword26", type: "uint32", defaultValue: 0 },
  { name: "unknownDword27", type: "uint32", defaultValue: 0 },
  { name: "unknownDword28", type: "uint32", defaultValue: 0 },
  { name: "unknownDword29", type: "uint32", defaultValue: 0 },
  { name: "unknownDword30", type: "uint32", defaultValue: 0 },

  { name: "unknownDword31", type: "uint32", defaultValue: 0 },
  { name: "unknownDword32", type: "uint32", defaultValue: 0 },
  { name: "unk", type: "uint8", defaultValue: 0 },
];

export const resourceEventDataSubSchema = [
  {
    name: "subResourceData",
    type: "schema",
    fields: [
      { name: "resourceId", type: "uint32", defaultValue: 0 },
      { name: "resourceType", type: "uint32", defaultValue: 0 },
      {
        name: "unknownArray1",
        type: "array",
        defaultValue: [],
        fields: [
          { name: "unknownDword1", type: "uint32", defaultValue: 0 },
          {
            name: "unknownData1",
            type: "schema",
            fields: [
              { name: "unknownDword1", type: "uint32", defaultValue: 0 },
              { name: "unknownFloat1", type: "float", defaultValue: 0.0 },
              { name: "unknownFloat2", type: "float", defaultValue: 0.0 },
            ],
          },
        ],
      },
    ],
  },
  {
    name: "unknownData2",
    type: "schema",
    fields: [
      { name: "max_value", type: "uint32", defaultValue: 0 },
      { name: "initial_value", type: "uint32", defaultValue: 0 },
      { name: "unknownFloat1", type: "float", defaultValue: 0.0 },
      { name: "unknownFloat2", type: "float", defaultValue: 0.0 },
      { name: "unknownFloat3", type: "float", defaultValue: 0.0 },
      { name: "unknownDword3", type: "uint32", defaultValue: 0 },
      { name: "unknownDword4", type: "uint32", defaultValue: 0 },
      { name: "unknownDword5", type: "uint32", defaultValue: 0 },
      { name: "unknownDword6", type: "uint32", defaultValue: 0 },
    ],
  },
  // a loop that read 2 bytes
  { name: "unknownByte1", type: "uint8", defaultValue: 0 },
  { name: "unknownByte2", type: "uint8", defaultValue: 0 },
  // end of this loop
  { name: "unknownTime1", type: "uint64string", defaultValue: "0" },
  { name: "unknownTime2", type: "uint64string", defaultValue: "0" },
  { name: "unknownTime3", type: "uint64string", defaultValue: "0" },
  { name: "unknownTime4", type: "uint64string", defaultValue: "0" },
];

export const rewardBundleDataSchema = [
  { name: "unknownByte1", type: "boolean", defaultValue: false },
  {
    name: "currency",
    type: "array",
    fields: [
      { name: "currencyId", type: "uint32", defaultValue: 0 },
      { name: "quantity", type: "uint32", defaultValue: 0 },
    ],
    defaultValue: [{ currencyId: 0, quantity: 0 }],
  },
  { name: "unknownDword1", type: "uint32", defaultValue: 0 },
  { name: "unknownByte2", type: "uint8", defaultValue: 0 },
  { name: "unknownDword2", type: "uint32", defaultValue: 0 },
  { name: "unknownDword3", type: "uint32", defaultValue: 0 },
  { name: "unknownDword4", type: "uint32", defaultValue: 0 },
  { name: "unknownDword5", type: "uint32", defaultValue: 0 },
  { name: "unknownDword6", type: "uint32", defaultValue: 0 },
  { name: "time", type: "uint64string", defaultValue: "0" },
  { name: "characterId", type: "uint64string", defaultValue: "0" },
  { name: "nameId", type: "uint32", defaultValue: 0 },
  { name: "unknownDword8", type: "uint32", defaultValue: 0 },
  { name: "imageSetId", type: "uint32", defaultValue: 0 },
  {
    name: "entries",
    type: "array",
    defaultValue: [],
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
                { name: "unknownDword2", type: "uint32", defaultValue: 0 },
                { name: "nameId", type: "uint32", defaultValue: 0 },
                { name: "quantity", type: "uint32", defaultValue: 0 },
                { name: "itemId", type: "uint32", defaultValue: 0 },
                { name: "unknownDword6", type: "uint32", defaultValue: 0 },
                { name: "unknownString1", type: "string", defaultValue: "" },
                { name: "unknownDword7", type: "uint32", defaultValue: 0 },
                { name: "unknownDword8", type: "uint32", defaultValue: 0 },
              ],
            },
          ],
        },
      }, // RewardBundleBase_GetEntryFromType
    ],
  },
  { name: "unknownDword10", type: "uint32", defaultValue: 0 },
];

export const objectiveDataSchema = [
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

export const achievementDataSchema = [
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
    defaultValue: [],
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

export const loadoutDataSubSchema1 = [
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
    defaultValue: [],
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
                defaultValue: [],
                fields: [
                  { name: "attachmentId", type: "uint32", defaultValue: 0 },
                ],
              },
              {
                name: "attachmentClasses",
                type: "array",
                defaultValue: [],
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

export const loadoutDataSubSchema2 = [
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
    defaultValue: [],
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
                defaultValue: [],
                fields: [
                  { name: "unknownDword1", type: "uint32", defaultValue: 0 },
                ],
              },
              {
                name: "unknownArray2",
                type: "array",
                defaultValue: [],
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

export const respawnLocationDataSchema = [
  { name: "guid", type: "uint64string", defaultValue: "0" },
  { name: "respawnType", type: "uint8", defaultValue: 1 },
  { name: "position", type: "floatvector4", defaultValue: [0, 0, 0, 0] },
  { name: "iconId", type: "uint32", defaultValue: 2 },
  { name: "respawnTypeIconId", type: "uint32", defaultValue: 3 },
  { name: "respawnTotalTimeMS", type: "uint32", defaultValue: 4 },
  { name: "unknownDword1", type: "uint32", defaultValue: 5 },
  { name: "nameId", type: "uint32", defaultValue: 6 },
  { name: "distance", type: "float", defaultValue: 7 },
  { name: "unknownByte1", type: "uint8", defaultValue: 1 },
  { name: "isActive", type: "uint8", defaultValue: 1 },
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
  { name: "zoneId", type: "uint32", defaultValue: 1 },
  { name: "seatCount", type: "uint8", defaultValue: 0 },
  { name: "seatOccupiedCount", type: "uint8", defaultValue: 0 },
];

export const currencySchema = {
  name: "currency",
  type: "array",
  defaultValue: [],
  fields: [
    { name: "currencyId", type: "uint32", defaultValue: 0 },
    { name: "quantity", type: "uint32", defaultValue: 0 },
  ],
};

export const lootItemSchema = [
  currencySchema,
  { name: "unknown2", type: "uint32", defaultValue: 2 },
  { name: "unknown3", type: "uint32", defaultValue: 3 },
  { name: "unknown4", type: "uint32", defaultValue: 4 },
  { name: "unknown5", type: "uint32", defaultValue: 5 },
  { name: "unknown6", type: "uint32", defaultValue: 6 },
  { name: "unknown7", type: "uint32", defaultValue: 8 },
  { name: "unknown8", type: "uint8", defaultValue: 9 },
  { name: "unknown9", type: "uint8", defaultValue: 10 },
  { name: "unknown10", type: "uint32", defaultValue: 11 },
  { name: "unknown11", type: "uint32", defaultValue: 12 },
  {
    name: "array4",
    type: "array",
    fields: [{ name: "unknown1", type: "uint32", defaultValue: 13 }],
  },
  { name: "unknown12", type: "uint32", defaultValue: 14 },
];

export const profileDataSchema = [
  { name: "profileId", type: "uint32", defaultValue: 0 },
  { name: "nameId", type: "uint32", defaultValue: 0 },
  { name: "descriptionId", type: "uint32", defaultValue: 0 },
  { name: "type", type: "uint32", defaultValue: 0 },
  { name: "iconId", type: "uint32", defaultValue: 0 },
  { name: "unknownDword6", type: "uint32", defaultValue: 0 },
  { name: "unknownDword7", type: "uint32", defaultValue: 0 },
  { name: "unknownDword8", type: "uint32", defaultValue: 0 },
  { name: "unknownBoolean1", type: "boolean", defaultValue: false },
  { name: "unknownDword9", type: "uint32", defaultValue: 0 },
  {
    name: "unknownArray1",
    type: "array",
    defaultValue: [],
    fields: [
      { name: "unknownDword1", type: "uint32", defaultValue: 0 },
      { name: "unknownDword2", type: "uint32", defaultValue: 0 },
      { name: "unknownDword3", type: "uint32", defaultValue: 0 },
    ],
  },
  { name: "unknownDword10", type: "uint32", defaultValue: 0 },
  { name: "unknownDword11", type: "uint32", defaultValue: 0 },
  { name: "unknownBoolean3", type: "boolean", defaultValue: false },
  { name: "unknownFloat1", type: "uint32", defaultValue: 0.0 },
  { name: "unknownFloat2", type: "uint32", defaultValue: 0.0 },
  { name: "unknownFloat3", type: "uint32", defaultValue: 0.0 },
  { name: "unknownFloat4", type: "uint32", defaultValue: 0.0 },
  { name: "unknownDword13", type: "uint32", defaultValue: 0 },
  { name: "unknownFloat5", type: "uint32", defaultValue: 0.0 },
  { name: "unknownDword14", type: "uint32", defaultValue: 0 },
  { name: "unknownDword15", type: "uint32", defaultValue: 0 },
  { name: "unknownDword16", type: "uint32", defaultValue: 0 },
  { name: "unknownDword17", type: "uint32", defaultValue: 0 },
  { name: "unknownDword18", type: "uint32", defaultValue: 0 },
];

export const identitySchema: any = {
  name: "identity",
  type: "schema",
  fields: [
    { name: "CharacterId", type: "uint32", defaultValue: 0 },
    { name: "AccountId", type: "uint32", defaultValue: 0 },
    { name: "unknownDword3", type: "uint32", defaultValue: 0 },
    {
      name: "characterFirstName",
      type: "string",
      defaultValue: "",
    },
    { name: "characterLastName", type: "string", defaultValue: "" },
  ],
};
export const vehicleReferenceDataSchema = [
  {
    name: "move_info",
    type: "array",
    defaultValue: [],
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
    defaultValue: [],
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
    defaultValue: [],
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
    defaultValue: [],
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
            defaultValue: [],
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
    defaultValue: [],
    fields: [
      { name: "vehicle_id", type: "uint32", defaultValue: 0 },
      { name: "model_id", type: "uint32", defaultValue: 0 },
    ],
  },

  {
    name: "wheel_info",
    type: "array",
    defaultValue: [],
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
            defaultValue: [],
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
    defaultValue: [],
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
            defaultValue: [],
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
    defaultValue: [],
    fields: [
      { name: "vehicle_id", type: "uint32", defaultValue: 0 },
      {
        name: "move_info",
        type: "array",
        defaultValue: [],
        elementType: "uint32",
      },
    ],
  },
];

export const EquippedContainersSchema = {
  name: "EquippedContainers",
  type: "array",
  defaultValue: [],
  fields: [
    { name: "unknownWord1", type: "boolean", defaultValue: 0 },

    { name: "unknownQword1", type: "uint64string", defaultValue: "0" },
    { name: "unknownDword2", type: "uint32", defaultValue: 0 },
    { name: "unknownQword2", type: "uint64string", defaultValue: "0" },
    { name: "unknownDword3", type: "uint32", defaultValue: 0 },
    {
      name: "items",
      type: "array",
      defaultValue: [],
      fields: [],
    },
    { name: "unknownBoolean", type: "boolean", defaultValue: true },
    { name: "unknownDword4", type: "uint32", defaultValue: 0 },
    { name: "unknownDword5", type: "uint32", defaultValue: 0 },
    { name: "unknownDword6", type: "uint32", defaultValue: 0 },
  ],
};

export const itemDataSchema = [
  { name: "itemDefinitionId", type: "uint32", defaultValue: 145 },
  { name: "tintId", type: "uint32", defaultValue: 0 },
  { name: "guid", type: "uint64string", defaultValue: "" },
  { name: "count", type: "uint32", defaultValue: 1 },
  { name: "unknownDword5", type: "uint32", defaultValue: 1 },
  {
    name: "itemSubData",
    type: "custom",
    defaultValue: {},
    packer: packItemSubData,
  },
  { name: "containerGuid", type: "uint64string", defaultValue: "" },
  { name: "containerDefinitionId", type: "uint32", defaultValue: 3 },
  { name: "containerSlotId", type: "uint32", defaultValue: 1 },
  { name: "baseDurability", type: "uint32", defaultValue: 1 },
  { name: "currentDurability", type: "uint32", defaultValue: 1 },
  { name: "maxDurabilityFromDefinition", type: "uint32", defaultValue: 1 },
  { name: "unknownBoolean1", type: "boolean", defaultValue: true },
  { name: "unknownQword3", type: "uint64string", defaultValue: "0x0" }, // names from 2016 could be the same
];

export const baseItemDefinitionSchema = [
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

export const skyData = [
  { name: "unknownDword1", type: "int32", defaultValue: 0 },
  { name: "name", type: "string", defaultValue: "" },
  { name: "unknownDword2", type: "int32", defaultValue: 0 },
  { name: "unknownDword3", type: "int32", defaultValue: 0 },
  { name: "unknownDword4", type: "int32", defaultValue: 0 },
  { name: "fogDensity", type: "int32", defaultValue: 0 },
  { name: "fogGradient", type: "int32", defaultValue: 0 },
  { name: "fogFloor", type: "int32", defaultValue: 0 },
  { name: "unknownDword7", type: "int32", defaultValue: 0 },
  { name: "rain", type: "int32", defaultValue: 0 },
  { name: "temp", type: "int32", defaultValue: 0 },
  { name: "skyColor", type: "int32", defaultValue: 0 },
  { name: "cloudWeight0", type: "int32", defaultValue: 0 },
  { name: "cloudWeight1", type: "int32", defaultValue: 0 },
  { name: "cloudWeight2", type: "int32", defaultValue: 0 },
  { name: "cloudWeight3", type: "int32", defaultValue: 0 },
  { name: "sunAxisY", type: "int32", defaultValue: 0 },
  { name: "sunAxisX", type: "int32", defaultValue: 0 },
  { name: "sunAxisZ", type: "int32", defaultValue: 0 },
  { name: "unknownDword18", type: "int32", defaultValue: 0 },
  { name: "unknownDword19", type: "int32", defaultValue: 0 },
  { name: "unknownDword20", type: "int32", defaultValue: 0 },
  { name: "wind", type: "int32", defaultValue: 0 },
  { name: "unknownDword22", type: "int32", defaultValue: 0 },
  { name: "unknownDword23", type: "int32", defaultValue: 0 },
  { name: "unknownDword24", type: "int32", defaultValue: 0 },
  { name: "unknownDword25", type: "int32", defaultValue: 0 },
  {
    name: "unknownArray",
    type: "array",
    fixedLength: 50,
    defaultValue: [],
    fields: [
      { name: "unknownDword1", type: "int32", defaultValue: 0 },
      { name: "unknownDword2", type: "int32", defaultValue: 0 },
      { name: "unknownDword3", type: "int32", defaultValue: 0 },
      { name: "unknownDword4", type: "int32", defaultValue: 0 },
      { name: "unknownDword5", type: "int32", defaultValue: 0 },
      { name: "unknownDword6", type: "int32", defaultValue: 0 },
      { name: "unknownDword7", type: "int32", defaultValue: 0 },
    ],
  },
];

export const profileStatsSubSchema1 = [
  { name: "unknownDword1", type: "uint32", defaultValue: 0 },
  {
    name: "unknownArray1",
    type: "array",
    defaultValue: [],
    elementType: "uint32",
  },
  { name: "unknownDword2", type: "uint32", defaultValue: 0 },
  { name: "unknownDword3", type: "uint32", defaultValue: 0 },
  { name: "unknownDword4", type: "uint32", defaultValue: 0 },
  { name: "unknownDword5", type: "uint32", defaultValue: 0 },
  { name: "unknownDword6", type: "uint32", defaultValue: 0 },
  { name: "unknownDword7", type: "uint32", defaultValue: 0 },
  { name: "unknownDword8", type: "uint32", defaultValue: 0 },
];

export const weaponStatsDataSubSchema1 = [
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
  { name: "unknownDword12", type: "uint32", defaultValue: 0 },
  { name: "unknownDword13", type: "uint32", defaultValue: 0 },
  { name: "unknownBoolean1", type: "boolean", defaultValue: false },
  { name: "unknownDword14", type: "uint32", defaultValue: 0 },
];

export const weaponStatsDataSchema = [
  { name: "unknownData1", type: "schema", fields: profileStatsSubSchema1 },
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
  { name: "unknownData2", type: "schema", fields: weaponStatsDataSubSchema1 },
  { name: "unknownData3", type: "schema", fields: weaponStatsDataSubSchema1 },
];

export const vehicleStatsDataSchema = [
  { name: "unknownData1", type: "schema", fields: profileStatsSubSchema1 },
  { name: "unknownData2", type: "schema", fields: weaponStatsDataSubSchema1 },
];

export const facilityStatsDataSchema = [
  { name: "unknownData1", type: "schema", fields: weaponStatsDataSubSchema1 },
];

export const itemBaseSchema = [
  { name: "itemId", type: "uint32", defaultValue: 0 },
  { name: "unknownDword2", type: "uint32", defaultValue: 0 },
  {
    name: "unknownGuid1",
    type: "uint64string",
    defaultValue: "0x0000000000000000",
  },
  { name: "unknownDword3", type: "uint32", defaultValue: 0 },
  { name: "unknownDword4", type: "uint32", defaultValue: 0 },
  { name: "unknownDword5", type: "uint32", defaultValue: 0 },
  {
    name: "unknownQword6",
    type: "uint64string",
    defaultValue: "0x0000000000000000",
  }, // ici
  { name: "unknownDword7", type: "uint32", defaultValue: 0 },
  { name: "unknownDword8", type: "uint32", defaultValue: 0 },
  { name: "unknownDword9", type: "uint32", defaultValue: 0 },
  { name: "unknownDword10", type: "uint32", defaultValue: 0 },
  { name: "unknownDword11", type: "uint32", defaultValue: 0 },
  { name: "unknownByte1", type: "uint8", defaultValue: 0 },
  {
    name: "unknownQword7",
    type: "uint64string",
    defaultValue: "0x0000000000000000",
  },
];

export const effectTagDataSchema = [
  { name: "unknownDword1", type: "uint32", defaultValue: 0 },
  { name: "unknownDword2", type: "uint32", defaultValue: 0 },

  { name: "unknownDword3", type: "uint32", defaultValue: 0 },
  { name: "unknownDword4", type: "uint32", defaultValue: 0 },
  { name: "unknownDword5", type: "uint32", defaultValue: 0 },

  {
    name: "unknownData1",
    type: "schema",
    fields: [
      { name: "unknownGuid1", type: "uint64string", defaultValue: "0" },
      { name: "unknownGuid2", type: "uint64string", defaultValue: "0" },
    ],
  },

  {
    name: "unknownData2",
    type: "schema",
    fields: [
      { name: "unknownGuid1", type: "uint64string", defaultValue: "0" },
      { name: "unknownGuid2", type: "uint64string", defaultValue: "0" },
      {
        name: "unknownVector1",
        type: "floatvector4",
        defaultValue: [0, 0, 0, 0],
      },
    ],
  },

  {
    name: "unknownData3",
    type: "schema",
    fields: [
      { name: "unknownDword1", type: "uint32", defaultValue: 0 },
      { name: "unknownDword2", type: "uint32", defaultValue: 0 },
      { name: "unknownDword3", type: "uint32", defaultValue: 0 },
    ],
  },

  { name: "unknownDword6", type: "uint32", defaultValue: 0 },
  { name: "unknownByte1", type: "uint8", defaultValue: 0 },
];

export const targetDataSchema = [
  { name: "targetType", type: "uint8", defaultValue: 0 },
];

export const itemDetailSchema = [
  { name: "unknownBoolean1", type: "boolean", defaultValue: false },
];

export const itemWeaponDetailSubSchema1 = [
  { name: "statOwnerId", type: "uint32", defaultValue: 0 },
  { name: "statData", type: "schema", fields: statDataSchema },
];

export const itemWeaponDetailSubSchema2 = [
  { name: "unknownDword1", type: "uint32", defaultValue: 0 },
  {
    name: "unknownArray1",
    type: "array",
    defaultValue: [],
    fields: [
      { name: "unknownDword1", type: "uint32", defaultValue: 0 },
      {
        name: "unknownArray1",
        type: "array",
        defaultValue: [],
        fields: itemWeaponDetailSubSchema1,
      },
    ],
  },
];

export const itemWeaponDetailSchema = [
  { name: "unknownBoolean1", type: "boolean", defaultValue: false },
  {
    name: "unknownArray1",
    type: "array",
    defaultValue: [],
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
    defaultValue: [],
    fields: itemWeaponDetailSubSchema1,
  },
  {
    name: "unknownArray4",
    type: "array",
    defaultValue: [],
    fields: itemWeaponDetailSubSchema2,
  },
];
