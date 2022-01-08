import {
    eul2quat, getPacketTypeBytes, lz4_decompress,
  } from "../../../../utils/utils";
import DataSchema from "h1z1-dataschema";
import { baseItemDefinitionSchema, itemBaseSchema, itemDetailSchema, itemWeaponDetailSchema, vehicleReferenceDataSchema } from "./schemas";



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


export function readUnsignedIntWith2bitLengthValue(data: Buffer, offset: number) {
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

export function parseItemAddData(data: Buffer, offset: number, referenceData: any) {
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







export function parseItemData(data: Buffer, offset: number, referenceData: any) {
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