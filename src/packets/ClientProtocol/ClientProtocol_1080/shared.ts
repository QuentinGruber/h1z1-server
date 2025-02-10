// ======================================================================
//
//   GNU GENERAL PUBLIC LICENSE
//   Version 3, 29 June 2007
//   copyright (C) 2020 - 2021 Quentin Gruber
//   copyright (C) 2021 - 2024 H1emu community
//
//   https://github.com/QuentinGruber/h1z1-server
//   https://www.npmjs.com/package/h1z1-server
//
//   Based on https://github.com/psemu/soe-network
// ======================================================================

import { PacketFields } from "types/packetStructure";
import {
  eul2quat,
  getPacketTypeBytes,
  LZ4,
  lz4_decompress
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
    length: length
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
    length: n + 1
  };
}

export function packUnsignedIntWith2bitLengthValue(value: number) {
  value = value << 2;
  let n: number;

  if (value > 0xffffff) {
    n = 3;
  } else if (value > 0xffff) {
    n = 2;
  } else if (value > 0xff) {
    n = 1;
  } else {
    n = 0;
  }

  value |= n;

  const buffer = Buffer.allocUnsafe(n + 1);

  for (let i = 0; i < n + 1; i++) {
    buffer[i] = value & 0xff;
    value >>= 8;
  }

  return buffer;
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
    length: n + 1
  };
}

export function packSignedIntWith2bitLengthValue(value: number): Buffer {
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

export function readAbilityInitData(data: Buffer, offset: number) {
  const obj: any = {},
    startOffset = offset;
  obj["unknownByte1"] = data.readUint8(offset);
  offset += 1;
  obj["unknownByte2"] = data.readUint8(offset);
  offset += 1;

  if (obj["unknownByte1"] == 128) {
    obj["unknownDword8"] = data.readUInt32LE(offset);
    offset += 4;
    obj["unknownDword9"] = data.readUInt32LE(offset);
    offset += 4;
    obj["unknownDword10"] = data.readUInt32LE(offset);
    offset += 4;
    obj["unknownDword11"] = data.readUInt32LE(offset);
    offset += 4;
    obj["unknownDword12"] = data.readUInt32LE(offset);
    offset += 4;
    obj["unknownDword13"] = data.readUInt32LE(offset);
    offset += 4;
    obj["unknownDword14"] = data.readUInt32LE(offset);
    offset += 4;
    obj["targetPosition"] = [];
    obj["targetPosition"][0] = data.readFloatLE(offset);
    offset += 4;
    obj["targetPosition"][1] = data.readFloatLE(offset);
    offset += 4;
    obj["targetPosition"][2] = data.readFloatLE(offset);
    offset += 4;
    obj["targetPosition"][3] = data.readFloatLE(offset);
    offset += 4;
    obj["unknownDword15"] = data.readUInt32LE(offset);
    offset += 4;
    obj["unknownDword16"] = data.readUInt32LE(offset);
    offset += 4;
    obj["stringLength"] = data.readUInt32LE(offset);
    offset += 4;
    obj["hitLocation"] = data.toString(
      "utf8",
      offset,
      offset + obj["stringLength"]
    );
    offset += obj["stringLength"];
    return {
      value: obj,
      length: offset - startOffset
    };
  } else {
    return {
      value: obj,
      length: offset - startOffset
    };
  }
}

export function packAbilityInitData(obj: any) {
  let data =
    obj["unknownByte1"] == 128 ? Buffer.allocUnsafe(62) : Buffer.allocUnsafe(2);
  let offset = 0;
  data.writeUint8(obj["unknownByte1"], offset);
  offset += 1;
  data.writeUint8(obj["unknownByte2"], offset);
  offset += 1;

  if (obj["unknownByte1"] == 128) {
    data.writeUint32LE(obj["unknownDword8"], offset);
    offset += 4;
    data.writeUInt32LE(obj["unknownDword9"], offset);
    offset += 4;
    data.writeUInt32LE(obj["unknownDword10"], offset);
    offset += 4;
    data.writeUInt32LE(obj["unknownDword11"], offset);
    offset += 4;
    data.writeUInt32LE(obj["unknownDword12"], offset);
    offset += 4;
    data.writeUInt32LE(obj["unknownDword13"], offset);
    offset += 4;
    data.writeUInt32LE(obj["unknownDword14"], offset);
    offset += 4;
    data.writeFloatLE(obj["targetPosition"][0], offset);
    offset += 4;
    data.writeFloatLE(obj["targetPosition"][1], offset);
    offset += 4;
    data.writeFloatLE(obj["targetPosition"][2], offset);
    offset += 4;
    data.writeFloatLE(obj["targetPosition"][3], offset);
    offset += 4;
    data.writeUInt32LE(obj["unknownDword15"], offset);
    offset += 4;
    data.writeUInt32LE(obj["unknownDword16"], offset);
    offset += 4;
    data.writeUInt32LE(obj["stringLength"], offset);
    offset += 4;
    const stringBytes = Buffer.from(obj["hitLocation"], "utf-8");
    data = Buffer.concat([data, stringBytes]);
    offset += obj["stringLength"];
    return data;
  } else {
    return data;
  }
}

export function readAbilityUpdateData(data: Buffer, offset: number) {
  const obj: any = {},
    startOffset = offset;
  obj["unknownDword11"] = data.readUInt32LE(offset);
  offset += 4;

  if (obj["unknownDword11"] == 16) {
    obj["unknownDword12"] = data.readUInt32LE(offset);
    offset += 4;
    obj["unknownDword13"] = data.readUInt32LE(offset);
    offset += 4;
    obj["unknownDword14"] = data.readUInt32LE(offset);
    offset += 4;
    obj["unknownDword15"] = data.readUInt32LE(offset);
    offset += 4;
    obj["unknownDword16"] = data.readUInt32LE(offset);
    offset += 4;
    obj["targetPosition"] = [];
    obj["targetPosition"][0] = data.readFloatLE(offset);
    offset += 4;
    obj["targetPosition"][1] = data.readFloatLE(offset);
    offset += 4;
    obj["targetPosition"][2] = data.readFloatLE(offset);
    offset += 4;
    obj["targetPosition"][3] = data.readFloatLE(offset);
    offset += 4;
    obj["unknownDword17"] = data.readUInt32LE(offset);
    offset += 4;
    obj["unknownDword18"] = data.readUInt32LE(offset);
    offset += 4;
    obj["stringLength"] = data.readUInt32LE(offset);
    offset += 4;
    obj["hitLocation"] = data.toString(
      "utf8",
      offset,
      offset + obj["stringLength"]
    );
    offset += obj["stringLength"];
    return {
      value: obj,
      length: offset - startOffset
    };
  } else {
    obj["unknownDword12"] = data.readUInt32LE(offset);
    offset += 4;
    obj["unknownDword13"] = data.readUInt32LE(offset);
    offset += 4;
    obj["unknownDword14"] = data.readUInt32LE(offset);
    offset += 4;
    obj["unknownDword15"] = data.readUInt32LE(offset);
    offset += 4;
    obj["unknownDword16"] = data.readUInt32LE(offset);
    offset += 4;
    obj["unknownDword17"] = data.readUInt32LE(offset);
    offset += 4;
    obj["unknownDword18"] = data.readUInt32LE(offset);
    offset += 4;
    obj["targetPosition"] = [];
    obj["targetPosition"][0] = data.readFloatLE(offset);
    offset += 4;
    obj["targetPosition"][1] = data.readFloatLE(offset);
    offset += 4;
    obj["targetPosition"][2] = data.readFloatLE(offset);
    offset += 4;
    obj["targetPosition"][3] = data.readFloatLE(offset);
    offset += 4;
    obj["unknownDword19"] = data.readUInt32LE(offset);
    offset += 4;

    return {
      value: obj,
      length: offset - startOffset
    };
  }
}

export function readPositionUpdateData(data: Buffer, offset: number) {
  const obj: any = {},
    startOffset = offset;
  obj.raw = data.slice(1);
  obj["flags"] = data.readUInt16LE(offset);
  offset += 2;

  obj["sequenceTime"] = data.readUInt32LE(offset);
  offset += 4;

  obj["unknown3_int8"] = data.readUInt8(offset);
  offset += 1;
  let v;
  if (obj.flags & 1) {
    v = readUnsignedIntWith2bitLengthValue(data, offset);
    obj["stance"] = v.value;
    offset += v.length;
  }

  if (obj.flags & 2) {
    const position = [];
    v = readSignedIntWith2bitLengthValue(data, offset);
    position[0] = v.value / 100;
    offset += v.length;
    v = readSignedIntWith2bitLengthValue(data, offset);
    position[1] = v.value / 100;
    offset += v.length;
    v = readSignedIntWith2bitLengthValue(data, offset);
    position[2] = v.value / 100;
    offset += v.length;
    position[3] = 1;
    obj["position"] = position;
  }

  if (obj.flags & 0x20) {
    obj["orientation"] = data.readFloatLE(offset);
    offset += 4;
  }

  if (obj.flags & 0x40) {
    v = readSignedIntWith2bitLengthValue(data, offset);
    obj["frontTilt"] = v.value / 100; // not 100% sure about name
    offset += v.length;
  }

  if (obj.flags & 0x80) {
    v = readSignedIntWith2bitLengthValue(data, offset);
    obj["sideTilt"] = v.value / 100; // not 100% sure
    offset += v.length;
  }

  if (obj.flags & 4) {
    v = readSignedIntWith2bitLengthValue(data, offset);
    obj["angleChange"] = v.value / 100; // maybe
    offset += v.length;
  }

  if (obj.flags & 0x8) {
    v = readSignedIntWith2bitLengthValue(data, offset);
    obj["verticalSpeed"] = v.value / 100;
    offset += v.length;
  }

  if (obj.flags & 0x10) {
    v = readSignedIntWith2bitLengthValue(data, offset);
    obj["horizontalSpeed"] = v.value / 10;
    offset += v.length;
  }

  if (obj.flags & 0x100) {
    // either the previous one i meantioned is rotation delta or this one cause rotation is almost neved sent by client
    const unknown12_float = [];
    v = readSignedIntWith2bitLengthValue(data, offset);
    unknown12_float[0] = v.value / 100;
    offset += v.length;
    v = readSignedIntWith2bitLengthValue(data, offset);
    unknown12_float[1] = v.value / 100;
    offset += v.length;
    v = readSignedIntWith2bitLengthValue(data, offset);
    unknown12_float[2] = v.value / 100;
    obj["unknown12_float"] = unknown12_float;
    offset += v.length;
  }

  if (obj.flags & 0x200) {
    const rotationEul = [];
    v = readSignedIntWith2bitLengthValue(data, offset);
    rotationEul[0] = v.value / 100;
    offset += v.length;
    v = readSignedIntWith2bitLengthValue(data, offset);
    rotationEul[1] = v.value / 100;
    offset += v.length;
    v = readSignedIntWith2bitLengthValue(data, offset);
    rotationEul[2] = v.value / 100;
    offset += v.length;
    v = readSignedIntWith2bitLengthValue(data, offset);
    rotationEul[3] = v.value / 100;
    obj["rotation"] = eul2quat(new Float32Array(rotationEul));
    obj["rotationRaw"] = rotationEul;
    obj["lookAt"] = eul2quat(new Float32Array([rotationEul[0], 0, 0, 0]));
    offset += v.length;
  }

  if (obj.flags & 0x400) {
    v = readSignedIntWith2bitLengthValue(data, offset);
    obj["direction"] = v.value / 10;
    offset += v.length;
  }

  if (obj.flags & 0x800) {
    v = readSignedIntWith2bitLengthValue(data, offset);
    obj["engineRPM"] = v.value / 10;
    offset += v.length;
  }
  if (obj.flags & 0x1000) {
    const rotationEul = [];
    v = readSignedIntWith2bitLengthValue(data, offset);
    rotationEul[0] = v.value / 10000;
    offset += v.length;
    v = readSignedIntWith2bitLengthValue(data, offset);
    rotationEul[1] = v.value / 10000;
    offset += v.length;
    v = readSignedIntWith2bitLengthValue(data, offset);
    rotationEul[2] = v.value / 10000;
    offset += v.length;
    v = readSignedIntWith2bitLengthValue(data, offset);
    rotationEul[3] = v.value / 10000;

    v = readSignedIntWith2bitLengthValue(data, offset);
    rotationEul[4] = v.value / 10000;
    offset += v.length;
    v = readSignedIntWith2bitLengthValue(data, offset);
    rotationEul[5] = v.value / 10000;
    offset += v.length;
    v = readSignedIntWith2bitLengthValue(data, offset);
    rotationEul[6] = v.value / 10000;
    offset += v.length;
    v = readSignedIntWith2bitLengthValue(data, offset);
    rotationEul[7] = v.value / 10000;
    offset += v.length;
    obj["PosAndRot"] = rotationEul;
  }
  return {
    value: obj,
    length: offset - startOffset
  };
}
const generateDummyPosUpdate = function () {
  const dummyObj: any = {};
  dummyObj.flags = 0;
  dummyObj.sequenceTime = 0;
  dummyObj.unknown3_int8 = 0;
  return dummyObj;
};

export function readPositionUpdateDataAndCheckLength(
  data: Buffer,
  offset: number
) {
  const obj: any = {},
    startOffset = offset;
  obj.raw = data.slice(1);
  obj["flags"] = data.readUInt16LE(offset);
  offset += 2;

  obj["sequenceTime"] = data.readUInt32LE(offset);
  offset += 4;

  obj["unknown3_int8"] = data.readUInt8(offset);
  offset += 1;
  let v;
  if (obj.flags & 1) {
    v = readUnsignedIntWith2bitLengthValue(data, offset);
    obj["stance"] = v.value;
    offset += v.length;
  }

  if (obj.flags & 2) {
    const position = [];
    v = readSignedIntWith2bitLengthValue(data, offset);
    position[0] = v.value / 100;
    offset += v.length;
    v = readSignedIntWith2bitLengthValue(data, offset);
    position[1] = v.value / 100;
    offset += v.length;
    v = readSignedIntWith2bitLengthValue(data, offset);
    position[2] = v.value / 100;
    offset += v.length;
    position[3] = 1;
    obj["position"] = position;
  }

  if (obj.flags & 0x20) {
    obj["orientation"] = data.readFloatLE(offset);
    offset += 4;
  }

  if (obj.flags & 0x40) {
    v = readSignedIntWith2bitLengthValue(data, offset);
    obj["frontTilt"] = v.value / 100; // not 100% sure about name
    offset += v.length;
  }

  if (obj.flags & 0x80) {
    v = readSignedIntWith2bitLengthValue(data, offset);
    obj["sideTilt"] = v.value / 100; // not 100% sure
    offset += v.length;
  }

  if (obj.flags & 4) {
    v = readSignedIntWith2bitLengthValue(data, offset);
    obj["angleChange"] = v.value / 100; // maybe
    offset += v.length;
  }

  if (obj.flags & 0x8) {
    v = readSignedIntWith2bitLengthValue(data, offset);
    obj["verticalSpeed"] = v.value / 100;
    offset += v.length;
  }

  if (obj.flags & 0x10) {
    v = readSignedIntWith2bitLengthValue(data, offset);
    obj["horizontalSpeed"] = v.value / 10;
    offset += v.length;
  }

  if (obj.flags & 0x100) {
    // either the previous one i meantioned is rotation delta or this one cause rotation is almost neved sent by client
    const unknown12_float = [];
    v = readSignedIntWith2bitLengthValue(data, offset);
    unknown12_float[0] = v.value / 100;
    offset += v.length;
    v = readSignedIntWith2bitLengthValue(data, offset);
    unknown12_float[1] = v.value / 100;
    offset += v.length;
    v = readSignedIntWith2bitLengthValue(data, offset);
    unknown12_float[2] = v.value / 100;
    obj["unknown12_float"] = unknown12_float;
    offset += v.length;
  }

  if (obj.flags & 0x200) {
    const rotationEul = [];
    v = readSignedIntWith2bitLengthValue(data, offset);
    rotationEul[0] = v.value / 100;
    offset += v.length;
    v = readSignedIntWith2bitLengthValue(data, offset);
    rotationEul[1] = v.value / 100;
    offset += v.length;
    v = readSignedIntWith2bitLengthValue(data, offset);
    rotationEul[2] = v.value / 100;
    offset += v.length;
    v = readSignedIntWith2bitLengthValue(data, offset);
    rotationEul[3] = v.value / 100;
    obj["rotation"] = eul2quat(new Float32Array(rotationEul));
    obj["rotationRaw"] = rotationEul;
    obj["lookAt"] = eul2quat(new Float32Array([rotationEul[0], 0, 0, 0]));
    offset += v.length;
  }

  if (obj.flags & 0x400) {
    v = readSignedIntWith2bitLengthValue(data, offset);
    obj["direction"] = v.value / 10;
    offset += v.length;
  }

  if (obj.flags & 0x800) {
    v = readSignedIntWith2bitLengthValue(data, offset);
    obj["engineRPM"] = v.value / 10;
    offset += v.length;
  }
  if (obj.flags & 0x1000) {
    const rotationEul = [];
    v = readSignedIntWith2bitLengthValue(data, offset);
    rotationEul[0] = v.value / 10000;
    offset += v.length;
    v = readSignedIntWith2bitLengthValue(data, offset);
    rotationEul[1] = v.value / 10000;
    offset += v.length;
    v = readSignedIntWith2bitLengthValue(data, offset);
    rotationEul[2] = v.value / 10000;
    offset += v.length;
    v = readSignedIntWith2bitLengthValue(data, offset);
    rotationEul[3] = v.value / 10000;

    v = readSignedIntWith2bitLengthValue(data, offset);
    rotationEul[4] = v.value / 10000;
    offset += v.length;
    v = readSignedIntWith2bitLengthValue(data, offset);
    rotationEul[5] = v.value / 10000;
    offset += v.length;
    v = readSignedIntWith2bitLengthValue(data, offset);
    rotationEul[6] = v.value / 10000;
    offset += v.length;
    v = readSignedIntWith2bitLengthValue(data, offset);
    rotationEul[7] = v.value / 10000;
    offset += v.length;
    rotationEul[8] = data.readUint8(offset);
    offset += 1;
    obj["PosAndRot"] = rotationEul;
  }
  if (offset != data.length) {
    console.error("Wrong positionUpdate buffer", obj);
    return {
      value: generateDummyPosUpdate(),
      length: offset - startOffset
    };
  }
  return {
    value: obj,
    length: offset - startOffset
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

  if ("PosAndRot" in obj) {
    flags |= 0x1000;
    v = packSignedIntWith2bitLengthValue(obj["PosAndRot"][0] * 10000);
    data = Buffer.concat([data, v]);
    v = packSignedIntWith2bitLengthValue(obj["PosAndRot"][1] * 10000);
    data = Buffer.concat([data, v]);
    v = packSignedIntWith2bitLengthValue(obj["PosAndRot"][2] * 10000);
    data = Buffer.concat([data, v]);
    v = packSignedIntWith2bitLengthValue(obj["PosAndRot"][3] * 10000);
    data = Buffer.concat([data, v]);
    v = packSignedIntWith2bitLengthValue(obj["PosAndRot"][4] * 10000);
    data = Buffer.concat([data, v]);
    v = packSignedIntWith2bitLengthValue(obj["PosAndRot"][5] * 10000);
    data = Buffer.concat([data, v]);
    v = packSignedIntWith2bitLengthValue(obj["PosAndRot"][6] * 10000);
    data = Buffer.concat([data, v]);
    v = packSignedIntWith2bitLengthValue(obj["PosAndRot"][7] * 10000);
    data = Buffer.concat([data, v]);
  }

  data.writeUInt16LE(flags, 0);

  return data;
}

export interface MultiDeathData {
  characterId: string;
  unknown4: number;
  unknown5: number;
  flag: number;
  managerCharacterId: string;
}

export function packMultiStateDeathData(obj: MultiDeathData) {
  const isRagdoll = obj.flag && obj.flag > 0;
  let offset = 0;
  const data = Buffer.allocUnsafe(isRagdoll ? 19 : 11);
  const characterIdBI = BigInt(obj.characterId);
  data.writeBigUInt64LE(characterIdBI, offset);
  offset += 8;
  data.writeUInt8(obj["unknown4"], offset);
  offset += 1;
  data.writeUInt8(obj["unknown5"], offset);
  offset += 1;
  data.writeUInt8(obj.flag, offset);
  offset += 1;

  if (isRagdoll) {
    const managerCharacterIdBI = BigInt(obj.managerCharacterId);
    data.writeBigUInt64LE(managerCharacterIdBI, offset);
    offset += 8;
  }
  return data;
}

/*
export const profileSchema = [
  { name: "profileId", type: "uint32", defaultValue: 5 },
  { name: "nameId", type: "uint32", defaultValue: 66 },
  { name: "descriptionId", type: "uint32", defaultValue: 66 },
  { name: "type", type: "uint8", defaultValue: 3 },
  { name: "unknownDword1", type: "uint32", defaultValue: 199 },
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
      { name: "unknownDword1", type: "uint32", defaultValue: 1 },
      { name: "unknownDword2", type: "uint32", defaultValue: 1 },
      { name: "unknownDword3", type: "uint32", defaultValue: 1 },
    ],
  },
  { name: "unknownDword5", type: "uint32", defaultValue: 9469 },
  { name: "unknownDword6", type: "uint32", defaultValue: 9474 },
  { name: "unknownByte3", type: "uint8", defaultValue: 1 },
  { name: "unknownDword7", type: "float", defaultValue: 1.7000000476837158 },
  { name: "unknownDword8", type: "float", defaultValue: 0.949999988079071 },
  { name: "unknownDword9", type: "float", defaultValue: 1 },
  { name: "unknownDword10", type: "uint32", defaultValue: 1 },
  { name: "unknownDword11", type: "float", defaultValue: 1 },
  { name: "unknownDword12", type: "uint32", defaultValue: 1 },
  { name: "unknownDword13", type: "uint32", defaultValue: 1 },
  { name: "unknownDword14", type: "uint32", defaultValue: 1 },
  { name: "unknownDword15", type: "uint32", defaultValue: 1 },
  { name: "unknownDword16", type: "uint32", defaultValue: 1 },
];
*/
export const profileSchema: PacketFields = [
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
    defaultValue: [],
    fields: [
      { name: "unknownDword1", type: "uint32", defaultValue: 0 },
      { name: "unknownDword2", type: "uint32", defaultValue: 0 },
      { name: "unknownDword3", type: "uint32", defaultValue: 0 }
    ]
  },
  { name: "unknownDword5", type: "uint32", defaultValue: 0 },
  { name: "unknownDword6", type: "uint32", defaultValue: 0 },
  { name: "unknownByte3", type: "uint8", defaultValue: 0 },
  { name: "unknownDword7", type: "float", defaultValue: 0 },
  { name: "unknownDword8", type: "float", defaultValue: 0 },
  { name: "unknownDword9", type: "float", defaultValue: 0 },
  { name: "unknownDword10", type: "uint32", defaultValue: 0 },
  { name: "unknownDword11", type: "float", defaultValue: 0 },
  { name: "unknownDword12", type: "uint32", defaultValue: 0 },
  { name: "unknownDword13", type: "uint32", defaultValue: 0 },
  { name: "unknownDword14", type: "uint32", defaultValue: 0 },
  { name: "unknownDword15", type: "uint32", defaultValue: 0 },
  { name: "unknownDword16", type: "uint32", defaultValue: 0 }
];

export function packItemDefinitionData(obj: any) {
  const compressionData = Buffer.allocUnsafe(4);
  let data = Buffer.allocUnsafe(4);
  data.writeUInt32LE(obj["ID"], 0); // could be the actual item id idk
  const itemDefinitionData = DataSchema.pack(itemDefinitionSchema, obj).data;
  data = Buffer.concat([data, itemDefinitionData]);
  const input = data;
  let output = Buffer.alloc(LZ4.encodeBound(input.length));
  output = output.slice(0, LZ4.encodeBlock(input, output));
  compressionData.writeUInt16LE(output.length, 0);
  compressionData.writeUInt16LE(data.length, 2);
  return Buffer.concat([compressionData, output]);
}

export const vehicleReferenceSchema = [
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
            defaultValue: 0.0
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
            defaultValue: 0.0
          },
          { name: "unknownFloat46", type: "float", defaultValue: 0.0 },
          { name: "inward_yaw_mod", type: "float", defaultValue: 0.0 },
          { name: "unknownFloat48", type: "float", defaultValue: 0.0 },
          { name: "vehicle_strafe_lift", type: "float", defaultValue: 0.0 },
          {
            name: "dead_zone_influence_exponent",
            type: "float",
            defaultValue: 0.0
          },
          {
            name: "camera_shake_initial_intensity",
            type: "float",
            defaultValue: 0.0
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
            defaultValue: [0, 0, 0]
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
            defaultValue: 0.0
          },
          {
            name: "angular_dampening",
            type: "floatvector3",
            defaultValue: [0, 0, 0]
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
          { name: "debris_effect", type: "uint32", defaultValue: 0 }
        ]
      }
    ]
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
          { name: "center_of_gravity_y", type: "float", defaultValue: 0.0 }
        ]
      }
    ]
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
          { name: "switch_gear_time", type: "float", defaultValue: 0.0 }
        ]
      }
    ]
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
              { name: "hash_2", type: "uint32", defaultValue: 0 }
            ]
          }
        ]
      }
    ]
  },
  {
    name: "vehicle_model_mappings",
    type: "array",
    defaultValue: [{}],
    fields: [
      { name: "vehicle_id", type: "uint32", defaultValue: 0 },
      { name: "model_id", type: "uint32", defaultValue: 0 }
    ]
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
              { name: "hash_2", type: "uint32", defaultValue: 0 }
            ]
          }
        ]
      }
    ]
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
              { name: "hash_2", type: "uint32", defaultValue: 0 }
            ]
          }
        ]
      }
    ]
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
        elementType: "uint32"
      }
    ]
  }
];

export function parseVehicleReferenceData(data: Buffer, offset: number) {
  const dataLength = data.readUInt32LE(offset);
  offset += 4;
  data = data.slice(offset, offset + dataLength);
  const inSize = data.readUInt32LE(0),
    outSize = data.readUInt32LE(4),
    compData = data.slice(8);
  data = lz4_decompress(compData, inSize, outSize);
  const result = DataSchema.parse(vehicleReferenceSchema, data, 0).result;
  return {
    value: result,
    length: dataLength + 4
  };
}

export function packVehicleReferenceData(obj: any) {
  const data = DataSchema.pack(vehicleReferenceSchema, obj);
  return data;
}

export function packInteractionComponent() {
  const raw = [
    0x17, 0x00, 0x43, 0x6c, 0x69, 0x65, 0x6e, 0x74, 0x49, 0x6e, 0x74, 0x65,
    0x72, 0x61, 0x63, 0x74, 0x43, 0x6f, 0x6d, 0x70, 0x6f, 0x6e, 0x65, 0x6e,
    0x74, 0x00, 0x00, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x6e, 0x2e,
    0x00, 0x00, 0x9d, 0x1c, 0xd5, 0x50, 0x00, 0x0b, 0x00, 0x00, 0x00, 0x00,
    0x00, 0xa0, 0x40, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00
  ];
  return Buffer.from(raw);
}

export function packNpcComponent() {
  /*const raw = [
        0x12, 0x00, 0x43, 0x6C, 0x69, 0x65, 0x6E, 0x74, 0x4E, 0x70, 0x63, 0x43, 0x6F,
        0x6D, 0x70, 0x6F, 0x6E, 0x65, 0x6E, 0x74, 0x00, 0x00, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00,
        0x00, 0x7D, 0x00, 0x00, 0x00, 0x09, 0xB7, 0x8B, 0xF6, 0x00, 0x52, 0x00, 0x00, 0x00, 0x4E,
        0x08, 0x00, 0x00, 0xCE, 0x02, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0xE4, 0x22, 0x00, 0x00,
        0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
        0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
        0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x00,
        0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
        0x00, 0x00, 0x00, 0x00, 0x00, 0x00
    ];*/

  const raw = [
    0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
    0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
    0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
    0x00, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
    0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
    0x00, 0x00, 0x00, 0x00, 0x00, 0x00
  ];
  return Buffer.from(raw);
}

export const itemSchema: PacketFields = [
  { name: "itemDefinitionId", type: "uint32", defaultValue: 0 },
  { name: "tintId", type: "uint32", defaultValue: 0 },
  { name: "guid", type: "uint64string", defaultValue: "" },
  { name: "count", type: "uint32", defaultValue: 1 },
  {
    name: "itemSubData",
    type: "custom",
    defaultValue: {},
    packer: packItemSubData
  },
  { name: "containerGuid", type: "uint64string", defaultValue: "" },
  { name: "containerDefinitionId", type: "uint32", defaultValue: 0 },
  { name: "containerSlotId", type: "uint32", defaultValue: 0 },
  { name: "baseDurability", type: "uint32", defaultValue: 0 },
  { name: "currentDurability", type: "uint32", defaultValue: 0 },
  { name: "maxDurabilityFromDefinition", type: "uint32", defaultValue: 0 },
  { name: "unknownBoolean1", type: "boolean", defaultValue: false },
  { name: "ownerCharacterId", type: "uint64string", defaultValue: "" },
  { name: "effectId", type: "uint32", defaultValue: 0 } // same as equipment effectId, only works with weapons
];

export const identitySchema: PacketFields = [
  { name: "unknownDword1", type: "uint32", defaultValue: 0 },
  { name: "unknownDword2", type: "uint32", defaultValue: 0 },
  { name: "unknownDword3", type: "uint32", defaultValue: 0 },
  { name: "characterFirstName", type: "string", defaultValue: "" },
  { name: "characterLastName", type: "string", defaultValue: "" },
  { name: "unknownString1", type: "string", defaultValue: "" },
  { name: "characterName", type: "string", defaultValue: "" }, // steamId
  { name: "unknownQword1", type: "uint64string", defaultValue: "0" }
];

export const lightWeightPcSchema: PacketFields = [
  { name: "characterId", type: "uint64string", defaultValue: "0" },
  {
    name: "transientId",
    type: "custom",
    parser: readUnsignedIntWith2bitLengthValue,
    packer: packUnsignedIntWith2bitLengthValue
  },
  {
    name: "identity",
    type: "schema",
    fields: identitySchema
  },
  { name: "unknownByte1", type: "uint8", defaultValue: /*2*/ 2 }, // one of these messes with fullcharacter packet
  { name: "actorModelId", type: "uint32", defaultValue: 9469 },
  { name: "unknownDword1", type: "uint32", defaultValue: /*270*/ 270 }, // one of these messes with fullcharacter packet
  { name: "position", type: "floatvector3", defaultValue: [0, 80, 0] },
  { name: "rotation", type: "floatvector4", defaultValue: [0, 80, 0, 1] },
  { name: "unknownFloat1", type: "float", defaultValue: /*4.7*/ 4.7 }, // one of these messes with fullcharacter packet
  {
    name: "mountGuid",
    type: "uint64string",
    defaultValue: "0x0000000000000000"
  },
  { name: "mountSeatId", type: "uint32", defaultValue: 0xffffffff },
  { name: "mountRelatedDword1", type: "uint32", defaultValue: 0xffffffff },
  { name: "movementVersion", type: "uint8", defaultValue: /*7*/ 0 },
  { name: "effectId", type: "uint32", defaultValue: 0 },
  { name: "unknownDword4", type: "uint32", defaultValue: 0 },
  {
    name: "unknownQword1", // characterstate?
    type: "uint64string",
    defaultValue: "0x0100000000100000"
  },
  { name: "shaderGroupId", type: "uint32", defaultValue: 0 }, //
  {
    name: "flags1",
    type: "bitflags",
    defaultValue: {},
    flags: [
      { bit: 0, name: "flag0", defaultValue: 0 },
      { bit: 1, name: "knockedOut", defaultValue: 0 },
      { bit: 2, name: "disableEquipment", defaultValue: 0 },
      { bit: 3, name: "useEffect", defaultValue: 0 },
      { bit: 4, name: "flag4", defaultValue: 0 },
      { bit: 5, name: "isAdmin", defaultValue: 0 },
      { bit: 6, name: "flag6", defaultValue: 0 },
      { bit: 7, name: "flag7", defaultValue: 0 }
    ]
  }
];

export const lightWeightNpcSchema: PacketFields = [
  {
    name: "characterId",
    type: "uint64string",
    defaultValue: "0x0"
  },
  {
    name: "transientId",
    type: "custom",
    parser: readUnsignedIntWith2bitLengthValue,
    packer: packUnsignedIntWith2bitLengthValue
  },
  { name: "petName", type: "string", defaultValue: "" },
  { name: "nameId", type: "uint32", defaultValue: 0 },
  { name: "unknownByte1", type: "uint8", defaultValue: 0 },
  { name: "actorModelId", type: "uint32", defaultValue: 0 },
  { name: "scale", type: "floatvector4", defaultValue: [1, 1, 1, 1] },
  { name: "texture", type: "string", defaultValue: "" },
  { name: "unknownString2", type: "string", defaultValue: "" },
  { name: "unknownDword1", type: "uint32", defaultValue: 0 },
  { name: "position", type: "floatvector3", defaultValue: [1, 1, 1] },
  { name: "rotation", type: "floatvector4", defaultValue: [0, 50, 0, 1] },
  {
    name: "unknownFloatVector4",
    type: "floatvector4",
    defaultValue: [1, 1, 1, 1]
  },
  { name: "unknownDword2", type: "uint32", defaultValue: 0 },
  { name: "unknownDword3", type: "uint32", defaultValue: 0 },
  { name: "headActor", type: "string", defaultValue: "" },
  { name: "unknownString3", type: "string", defaultValue: "" },
  { name: "unknownString4", type: "string", defaultValue: "" },
  { name: "vehicleId", type: "uint32", defaultValue: 0 },
  { name: "projectileUniqueId", type: "uint32", defaultValue: 0 },
  { name: "npcDefinitionId", type: "uint32", defaultValue: 0 },
  { name: "positionUpdateType", type: "uint8", defaultValue: 0 }, // determine if npc is moving with positionUpdate - Avcio
  { name: "profileId", type: "uint32", defaultValue: 0 },
  { name: "isLightweight", type: "boolean", defaultValue: false },
  {
    name: "flags",
    type: "schema",
    fields: [
      {
        name: "flags1",
        type: "bitflags",
        defaultValue: [],
        flags: [
          { bit: 0, name: "bit0", defaultValue: 0 },
          { bit: 1, name: "bit1", defaultValue: 0 },
          { bit: 2, name: "bit2", defaultValue: 0 },
          { bit: 3, name: "bit3", defaultValue: 0 },
          { bit: 4, name: "bit4", defaultValue: 0 },
          { bit: 5, name: "bit5", defaultValue: 0 },
          { bit: 6, name: "bit6", defaultValue: 0 },
          { bit: 7, name: "bit7", defaultValue: 0 }
        ]
      },
      {
        name: "flags2",
        type: "bitflags",
        defaultValue: [],
        flags: [
          { bit: 0, name: "nonAttackable", defaultValue: 0 },
          { bit: 1, name: "bit9", defaultValue: 0 },
          { bit: 2, name: "bit10", defaultValue: 0 },
          { bit: 3, name: "bit11", defaultValue: 0 },
          { bit: 4, name: "projectileCollision", defaultValue: 0 },
          { bit: 5, name: "bit13", defaultValue: 0 },
          { bit: 6, name: "bit14", defaultValue: 0 },
          { bit: 7, name: "bit15", defaultValue: 0 }
        ]
      },
      {
        name: "flags3",
        type: "bitflags",
        defaultValue: [],
        flags: [
          { bit: 0, name: "bit16", defaultValue: 0 },
          { bit: 1, name: "bit17", defaultValue: 0 },
          { bit: 2, name: "bit18", defaultValue: 0 },
          { bit: 3, name: "bit19", defaultValue: 0 },
          { bit: 4, name: "noCollide", defaultValue: 0 },
          { bit: 5, name: "knockedOut", defaultValue: 0 },
          { bit: 6, name: "bit22", defaultValue: 0 },
          { bit: 7, name: "bit23", defaultValue: 0 }
        ]
      }
    ],
    defaultValue: {}
  },
  { name: "movementVersion", type: "uint8", defaultValue: 0 },
  { name: "unknownDword8", type: "uint32", defaultValue: 0 },
  {
    name: "managerCharacterId",
    type: "uint64string",
    defaultValue: "0x0"
  },
  {
    name: "attachedObject",
    type: "schema",
    fields: [
      {
        name: "targetObjectId",
        type: "uint64string",
        defaultValue: "0x0"
      }
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
    defaultValue: {}
  },
  { name: "unknownDword9", type: "uint32", defaultValue: 0 },
  { name: "unknownDword10", type: "uint32", defaultValue: 0 },
  { name: "unknownQword2", type: "uint64string", defaultValue: "0x0" },
  { name: "unknownDword11", type: "uint32", defaultValue: 0 },
  { name: "useCollision", type: "uint32", defaultValue: 0 },
  { name: "unknownDword13", type: "uint32", defaultValue: 0 },
  { name: "shaderGroupId", type: "uint32", defaultValue: 0 },
  { name: "unknownDword15", type: "uint32", defaultValue: 0 }
];

export const effectTagsSchema: PacketFields = [
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
  { name: "unknownDword23", type: "uint32", defaultValue: 0 }
];

export const statSchema: PacketFields = [
  { name: "statId", type: "uint32", defaultValue: 0 },
  {
    name: "statValue",
    type: "variabletype8",
    types: {
      0: [
        { name: "base", type: "uint32", defaultValue: 0 },
        { name: "modifier", type: "uint32", defaultValue: 0 }
      ],
      1: [
        { name: "base", type: "float", defaultValue: 0.0 },
        { name: "modifier", type: "float", defaultValue: 0.0 }
      ]
    }
  }
];
export const itemWeaponDetailSubSchema1: PacketFields = [
  { name: "statOwnerId", type: "uint32", defaultValue: 0 },
  { name: "statData", type: "schema", fields: statSchema }
];
export const itemWeaponDetailSubSchema2: PacketFields = [
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
        fields: itemWeaponDetailSubSchema1
      }
    ]
  }
];

export function packItemSubData(obj: any) {
  const unknownData1Schema = [
    { name: "unknownQword1", type: "uint64string", defaultValue: "" },
    { name: "unknownDword1", type: "uint32", defaultValue: 0 },
    { name: "unknownDword2", type: "uint32", defaultValue: 0 }
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

export function packItemWeaponData(obj: any) {
  const unknownData1Schema = [
    {
      name: "unknownData1",
      type: "schema",
      defaultValue: {},
      fields: [
        { name: "unknownBoolean1", type: "boolean", defaultValue: false }
      ]
    },
    {
      name: "unknownData2",
      type: "schema",
      defaultValue: {},
      fields: [
        {
          name: "ammoSlots",
          type: "array",
          defaultValue: [],
          fields: [{ name: "ammoSlot", type: "uint32", defaultValue: 0 }]
        },
        {
          name: "firegroups",
          type: "array8",
          defaultValue: [],
          fields: [
            { name: "firegroupId", type: "uint32", defaultValue: 0 },
            {
              name: "unknownArray1",
              type: "array8",
              defaultValue: [],
              fields: [
                { name: "unknownByte1", type: "uint8", defaultValue: 0 },
                { name: "unknownDword1", type: "uint32", defaultValue: 0 },
                { name: "unknownDword2", type: "uint32", defaultValue: 0 },
                { name: "unknownDword3", type: "uint32", defaultValue: 0 }
              ]
            }
          ]
        },
        { name: "equipmentSlotId", type: "uint8", defaultValue: 0 },
        { name: "unknownByte2", type: "uint8", defaultValue: 0 },
        { name: "unknownDword1", type: "uint32", defaultValue: 0 },
        { name: "unknownByte3", type: "uint8", defaultValue: 0 },
        { name: "unknownByte4", type: "int8", defaultValue: 0 },
        { name: "unknownByte5", type: "int8", defaultValue: 0 },
        { name: "unknownFloat1", type: "float", defaultValue: 0 },
        { name: "unknownByte6", type: "uint8", defaultValue: 0 },
        { name: "unknownDword2", type: "uint32", defaultValue: 0 },
        { name: "unknownByte7", type: "uint8", defaultValue: 0 },
        { name: "unknownDword3", type: "int32", defaultValue: 0 }
      ]
    },
    {
      name: "characterStats",
      type: "array",
      defaultValue: [],
      fields: [
        { name: "statId", type: "uint32", defaultValue: 0 },
        {
          name: "statData",
          type: "schema",
          defaultValue: {},
          fields: statSchema
        }
      ]
    },
    {
      name: "unknownArray1",
      type: "array",
      defaultValue: [],
      fields: [
        { name: "unknownDword1", type: "int32", defaultValue: 0 },
        {
          name: "unknownArray1",
          type: "schema",
          fields: [
            {
              name: "unknownArray1",
              type: "array",
              fields: [
                { name: "unknownDword1", type: "int32", defaultValue: 0 },
                {
                  name: "stats",
                  type: "array",
                  defaultValue: [],
                  fields: [
                    { name: "statId", type: "uint32", defaultValue: 0 },
                    {
                      name: "statData",
                      type: "schema",
                      defaultValue: {},
                      fields: statSchema
                    }
                  ]
                }
              ]
            }
          ]
        }
      ]
    }
  ];

  if (!obj["isWeapon"]) {
    return DataSchema.pack(
      [{ name: "unknownBoolean1", type: "boolean", defaultValue: false }],
      obj
    ).data;
  }
  return DataSchema.pack(unknownData1Schema, obj).data;
}

function packFullNPCRemoteWeaponsData(obj: any) {
  const remoteWeaponsSchema = [
    {
      name: "remoteWeapons",
      type: "byteswithlength",
      defaultValue: {},
      fields: [
        {
          name: "data",
          type: "array",
          defaultValue: [],
          fields: [
            { name: "guid", type: "uint64string", defaultValue: "" },
            ...remoteWeaponSchema
          ]
        },
        {
          name: "remoteWeaponExtra",
          type: "array",
          defaultValue: {},
          fields: [
            { name: "guid", type: "uint64string", defaultValue: "" },
            ...remoteWeaponExtraSchema
          ]
        }
      ]
    }
  ];

  if (!obj.isVehicle) {
    return DataSchema.pack([], {}).data;
  }
  return DataSchema.pack(remoteWeaponsSchema, { remoteWeapons: obj }).data;
}

export const currencySchema: PacketFields = [
  { name: "currencyId", type: "uint32", defaultValue: 0 },
  { name: "quantity", type: "uint32", defaultValue: 0 }
];

export const rewardBundleSchema: PacketFields = [
  { name: "unknownBoolean1", type: "boolean", defaultValue: true },
  {
    name: "currency",
    type: "array",
    defaultValue: [],
    fields: currencySchema
  },
  { name: "unknownDword1", type: "uint32", defaultValue: 0 },
  { name: "unknownDword2", type: "uint32", defaultValue: 19 },
  { name: "unknownDword3", type: "uint32", defaultValue: 0 },
  { name: "unknownDword4", type: "uint32", defaultValue: 0 },
  { name: "unknownDword5", type: "uint32", defaultValue: 0 },
  { name: "unknownDword6", type: "uint32", defaultValue: 0 },
  { name: "time", type: "uint64string", defaultValue: "0" },
  { name: "characterId", type: "uint64string", defaultValue: "0" },
  { name: "nameId", type: "uint32", defaultValue: 22 },
  { name: "unknownDword7", type: "uint32", defaultValue: 49 },
  {
    name: "entries",
    type: "array",
    defaultValue: [{}],
    fields: [
      { name: "itemType", type: "uint8", defaultValue: 1 },
      { name: "unknownDword1", type: "uint32", defaultValue: 0 },
      { name: "imageSetId", type: "uint32", defaultValue: 0 },
      { name: "unknownDword3", type: "uint32", defaultValue: 1 },
      { name: "nameId", type: "uint32", defaultValue: 0 },
      { name: "quantity", type: "uint32", defaultValue: 0 },
      { name: "itemDefId", type: "uint32", defaultValue: 0 },
      { name: "itemGuid", type: "uint64string", defaultValue: "0" },
      { name: "itemTextColor", type: "uint32", defaultValue: 0 },
      { name: "membersOnly", type: "uint8", defaultValue: 0 },
      { name: "tint", type: "int32", defaultValue: -1 },
      { name: "unknownDword5", type: "uint32", defaultValue: 0 },
      { name: "unknownDword6", type: "uint32", defaultValue: 0 },
      { name: "unknownDword7", type: "uint32", defaultValue: 0 }
    ]
  },
  { name: "unknownDword8", type: "uint32", defaultValue: 0 }
];
export const collectionsSchema: PacketFields = [
  { name: "unknownDword1", type: "uint32", defaultValue: 0 },
  { name: "unknownDword2", type: "uint32", defaultValue: 0 },
  { name: "unknownDword3", type: "uint32", defaultValue: 0 },
  { name: "unknownDword4", type: "uint32", defaultValue: 0 },
  { name: "unknownDword5", type: "uint32", defaultValue: 0 },
  { name: "unknownDword6", type: "uint32", defaultValue: 0 },
  { name: "unknownDword7", type: "uint32", defaultValue: 0 },
  { name: "reward", type: "schema", fields: rewardBundleSchema },
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
          { name: "unknownBoolean1", type: "boolean", defaultValue: true }
        ]
      }
    ]
  }
];

export const objectiveSchema: PacketFields = [
  { name: "objectiveId", type: "uint32", defaultValue: 0 },
  { name: "nameId", type: "uint32", defaultValue: 0 },
  { name: "descriptionId", type: "uint32", defaultValue: 0 },
  { name: "rewardData", type: "schema", fields: rewardBundleSchema },
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
      { name: "unknownDword4", type: "uint32", defaultValue: 0 }
    ]
  },
  { name: "unknownByte4", type: "uint8", defaultValue: 0 }
];
export const achievementSchema: PacketFields = [
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
      { name: "objectiveData", type: "schema", fields: objectiveSchema }
    ]
  },
  { name: "iconId", type: "uint32", defaultValue: 0 },
  { name: "unknownDword5", type: "uint32", defaultValue: 0 },
  { name: "unknownDword6", type: "uint32", defaultValue: 0 },
  { name: "points", type: "uint32", defaultValue: 0 },
  { name: "unknownDword8", type: "uint32", defaultValue: 0 },
  { name: "unknownBoolean2", type: "boolean", defaultValue: false },
  { name: "unknownDword9", type: "uint32", defaultValue: 0 }
];

export const characterResourceData: PacketFields = [
  { name: "resourceId", type: "uint32", defaultValue: 0 },
  { name: "resourceType", type: "uint32", defaultValue: 0 },
  {
    name: "unknownArray1",
    type: "array",
    defaultValue: [],
    fields: [
      { name: "unknownDword1", type: "uint32", defaultValue: 0 },
      { name: "unknownDword2", type: "uint32", defaultValue: 0 },
      { name: "unknownDword3", type: "uint32", defaultValue: 0 },
      { name: "unknownDword4", type: "uint32", defaultValue: 0 }
    ]
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
  {
    name: "unknownQword1",
    type: "uint64string",
    defaultValue: "0x0000000000000000"
  },
  {
    name: "unknownQword2",
    type: "uint64string",
    defaultValue: "0x0000000000000000"
  },
  {
    name: "unknownQword3",
    type: "uint64string",
    defaultValue: "0x0000000000000000"
  },
  {
    name: "unknownQword4",
    type: "uint64string",
    defaultValue: "0x0000000000000000"
  },
  {
    name: "unknownQword5",
    type: "uint64string",
    defaultValue: "0x0000000000000000"
  },
  { name: "unknownByte1", type: "uint8", defaultValue: 0 },
  { name: "unknownByte2", type: "uint8", defaultValue: 0 }
];

export const attachmentSchema: PacketFields = [
  { name: "modelName", type: "string", defaultValue: "" },
  { name: "textureAlias", type: "string", defaultValue: "" },
  { name: "tintAlias", type: "string", defaultValue: "Default" },
  { name: "decalAlias", type: "string", defaultValue: "#" },
  { name: "tintId", type: "uint32", defaultValue: 0 }, // confirmed in client dump
  { name: "compositeEffectId", type: "uint32", defaultValue: 0 },
  { name: "effectId", type: "uint32", defaultValue: 0 },
  { name: "slotId", type: "uint32", defaultValue: 0 },
  { name: "unknownDword4", type: "uint32", defaultValue: 0 },
  {
    name: "SHADER_PARAMETER_GROUP",
    type: "array",
    defaultValue: [],
    fields: [{ name: "SHADER_SEMANTIC_ID", type: "uint32", defaultValue: 0 }]
  },
  { name: "unknownBool1", type: "boolean", defaultValue: false }
];

export const remoteWeaponSchema: PacketFields = [
  { name: "weaponDefinitionId", type: "uint32", defaultValue: 0 },
  { name: "equipmentSlotId", type: "uint8", defaultValue: 0 },
  {
    name: "firegroups",
    type: "array8",
    defaultValue: [],
    fields: [
      { name: "firegroupId", type: "uint32", defaultValue: 0 },
      {
        name: "unknownArray1",
        type: "array8",
        defaultValue: [],
        fields: [
          {
            name: "unknownDword1",
            type: "uint32",
            defaultValue: 0
          },
          {
            name: "unknownDword2",
            type: "uint32",
            defaultValue: 0
          }
        ]
      }
    ]
  },
  {
    name: "weaponStats",
    type: "array",
    defaultValue: [],
    fields: [
      { name: "statId", type: "uint32", defaultValue: 0 },
      {
        name: "statData",
        type: "schema",
        defaultValue: {},
        fields: statSchema
      }
    ]
  },
  {
    name: "unknownArray2",
    type: "array",
    defaultValue: [],
    fields: [
      { name: "unknownDword1", type: "uint32", defaultValue: 0 },
      {
        name: "unknownArray1",
        type: "array",
        defaultValue: [],
        fields: [
          {
            name: "unknownDword1",
            type: "uint32",
            defaultValue: 0
          },
          {
            name: "stats",
            type: "array",
            defaultValue: [],
            fields: [
              { name: "statId", type: "uint32", defaultValue: 0 },
              {
                name: "statData",
                type: "schema",
                defaultValue: {},
                fields: statSchema
              }
            ]
          }
        ]
      }
    ]
  }
];

export const remoteWeaponExtraSchema: PacketFields = [
  { name: "unknownByte1", type: "int8", defaultValue: 0 },
  { name: "unknownByte2", type: "int8", defaultValue: 0 },
  { name: "unknownByte3", type: "int8", defaultValue: 0 },
  { name: "unknownByte4", type: "int8", defaultValue: 0 },
  { name: "unknownByte5", type: "uint8", defaultValue: 0 },
  { name: "unknownDword1", type: "uint32", defaultValue: 0 },
  { name: "unknownByte6", type: "uint8", defaultValue: 0 },
  { name: "unknownDword2", type: "uint32", defaultValue: 0 },
  {
    name: "unknownArray1",
    type: "array",
    defaultValue: [],
    fields: [
      { name: "unknownDword1", type: "uint32", defaultValue: 0 },
      { name: "unknownBoolean1", type: "boolean", defaultValue: false },
      { name: "unknownBoolean2", type: "boolean", defaultValue: false }
    ]
  }
];

export const fullNpcSchema: PacketFields = [
  {
    name: "transientId",
    type: "custom",
    parser: readUnsignedIntWith2bitLengthValue,
    packer: packUnsignedIntWith2bitLengthValue
  },
  { name: "unknownDword1", type: "uint32", defaultValue: 1 },
  { name: "unknownDword2", type: "uint32", defaultValue: 1 },
  { name: "unknownDword3", type: "uint32", defaultValue: 1 },
  {
    name: "attachmentData",
    type: "array",
    defaultValue: [],
    fields: attachmentSchema
  },
  { name: "unknownString1", type: "string", defaultValue: "" },
  { name: "unknownString2", type: "string", defaultValue: "" },
  { name: "unknownDword4", type: "uint32", defaultValue: 1 },
  { name: "unknownFloat1", type: "float", defaultValue: 1.0 },
  { name: "unknownDword5", type: "uint32", defaultValue: 1 },
  { name: "unknownDword6", type: "uint32", defaultValue: 1 },
  { name: "unknownDword7", type: "uint32", defaultValue: 1 },
  {
    name: "effectTags",
    type: "array",
    defaultValue: [],
    fields: effectTagsSchema
  },
  {
    name: "unknownData1",
    type: "schema",
    defaultValue: {},
    fields: [
      { name: "unknownDword1", type: "uint32", defaultValue: 1 },
      { name: "unknownString1", type: "string", defaultValue: "" },
      { name: "unknownString2", type: "string", defaultValue: "" },
      { name: "unknownDword2", type: "uint32", defaultValue: 1 },
      { name: "unknownString3", type: "string", defaultValue: "" }
    ]
  },
  { name: "unknownVector4", type: "floatvector4", defaultValue: [0, 0, 0, 0] },
  { name: "unknownDword8", type: "uint32", defaultValue: 1 },
  { name: "characterId", type: "uint64string", defaultValue: "1" },
  { name: "targetData", type: "custom", packer: packTargetData },
  {
    name: "unknownArray1",
    type: "array",
    defaultValue: [],
    fields: [
      { name: "unknownDword1", type: "uint32", defaultValue: 0 },
      { name: "unknownString1", type: "string", defaultValue: "" },
      { name: "unknownDword2", type: "uint32", defaultValue: 0 }
    ]
  },
  {
    name: "unknownArray2",
    type: "array",
    defaultValue: [],
    fields: [
      { name: "unknownDword1", type: "uint32", defaultValue: 0 },
      { name: "unknownString1", type: "string", defaultValue: "" },
      { name: "unknownString2", type: "string", defaultValue: "" }
    ]
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
  { name: "materialType", type: "uint32", defaultValue: 58 }, // MATERIAL_TYPE
  { name: "unknownQword1", type: "uint64string", defaultValue: "0x0" },
  {
    name: "unknownArray3",
    type: "byteswithlength",
    defaultValue: {},
    fields: [
      {
        name: "data", // locksBaseRelated
        type: "array",
        defaultValue: [],
        fields: [
          { name: "unknownDword1", type: "uint32", defaultValue: 0 },
          { name: "unknownDword2", type: "uint32", defaultValue: 0 }
        ]
      }
    ]
  },
  {
    name: "resources",
    type: "byteswithlength",
    defaultValue: {},
    fields: [
      {
        name: "data",
        type: "array",
        defaultValue: [],
        fields: [
          { name: "resourceId", type: "uint32", defaultValue: 0 },
          {
            name: "resourceData",
            type: "schema",
            defaultValue: {},
            fields: characterResourceData
          }
        ]
      }
    ]
  },
  {
    name: "unknownArray4",
    type: "byteswithlength",
    defaultValue: {},
    fields: [
      {
        name: "unknownArray1",
        type: "array",
        defaultValue: [],
        fields: [
          {
            name: "unknownQword1",
            type: "uint64string",
            defaultValue: ""
          },
          {
            name: "unknownEffectData",
            type: "schema",
            defaultValue: {},
            fields: [
              {
                name: "unknownQword1",
                type: "uint64string",
                defaultValue: ""
              },
              { name: "unknownDword1", type: "uint32", defaultValue: 0 },
              {
                name: "unknownData1",
                type: "schema",
                defaultValue: {},
                fields: [
                  {
                    name: "unknownDword1",
                    type: "uint32",
                    defaultValue: 0
                  },
                  {
                    name: "unknownDword2",
                    type: "uint32",
                    defaultValue: 0
                  },
                  {
                    name: "unknownDword3",
                    type: "uint32",
                    defaultValue: 0
                  }
                ]
              },
              {
                name: "unknownData2",
                type: "schema",
                defaultValue: {},
                fields: [
                  {
                    name: "unknownDword1",
                    type: "uint32",
                    defaultValue: 0
                  },
                  {
                    name: "unknownDword2",
                    type: "uint32",
                    defaultValue: 0
                  },
                  {
                    name: "unknownDword3",
                    type: "uint32",
                    defaultValue: 0
                  }
                ]
              },
              {
                name: "unknownData3",
                type: "schema",
                defaultValue: {},
                fields: [
                  {
                    name: "unknownQword1",
                    type: "uint64string",
                    defaultValue: ""
                  },
                  {
                    name: "unknownDword1",
                    type: "uint32",
                    defaultValue: 0
                  },
                  {
                    name: "unknownQword2",
                    type: "uint64string",
                    defaultValue: ""
                  }
                ]
              },
              {
                name: "unknownData4",
                type: "schema",
                defaultValue: {},
                fields: [
                  {
                    name: "unknownQword1",
                    type: "uint64string",
                    defaultValue: ""
                  },
                  {
                    name: "unknownQword2",
                    type: "uint64string",
                    defaultValue: ""
                  },
                  {
                    name: "unknownFloatVector4",
                    type: "floatvector4",
                    defaultValue: [0, 0, 0, 0]
                  }
                ]
              },
              {
                name: "unknownData5",
                type: "schema",
                defaultValue: {},
                fields: [
                  {
                    name: "unknownDword1",
                    type: "uint32",
                    defaultValue: 0
                  },
                  {
                    name: "unknownDword2",
                    type: "uint32",
                    defaultValue: 0
                  },
                  {
                    name: "unknownDword3",
                    type: "uint32",
                    defaultValue: 0
                  }
                ]
              },
              { name: "unknownDword2", type: "uint32", defaultValue: 0 },
              { name: "unknownByte1", type: "uint8", defaultValue: 0 }
            ]
          },
          {
            name: "unknownArray2",
            type: "array",
            defaultValue: [],
            fields: [
              {
                name: "unknownQword1",
                type: "uint64string",
                defaultValue: ""
              },
              {
                name: "unknownData1",
                type: "schema",
                defaultValue: {},
                fields: [
                  {
                    name: "unknownQword1",
                    type: "uint64string",
                    defaultValue: ""
                  },
                  { name: "unknownDword1", type: "uint32", defaultValue: 0 },
                  { name: "unknownDword2", type: "uint32", defaultValue: 0 },
                  { name: "unknownDword3", type: "uint32", defaultValue: 0 },
                  {
                    name: "unknownQword2",
                    type: "uint64string",
                    defaultValue: ""
                  },
                  { name: "unknownDword4", type: "uint32", defaultValue: 0 }
                ]
              }
            ]
          }
        ]
      }
    ]
  },
  {
    name: "unknownArray5",
    type: "byteswithlength",
    defaultValue: {},
    fields: [
      {
        name: "data",
        type: "array",
        defaultValue: [],
        fields: [
          {
            name: "unknownDword1",
            type: "uint32",
            defaultValue: 0
          },
          {
            name: "unknownData1",
            type: "schema",
            defaultValue: {},
            fields: [
              { name: "unknownDword1", type: "uint32", defaultValue: 0 },
              { name: "unknownDword2", type: "uint32", defaultValue: 0 },
              { name: "unknownDword3", type: "uint32", defaultValue: 0 }
            ]
          }
        ]
      }
    ]
  },
  {
    name: "remoteWeapons",
    type: "custom",
    defaultValue: {},
    packer: packFullNPCRemoteWeaponsData
  },
  {
    name: "itemsData",
    type: "byteswithlength",
    defaultValue: {},
    fields: [
      {
        name: "items",
        type: "array",
        defaultValue: [],
        fields: [
          {
            name: "item",
            type: "schema",
            defaultValue: {},
            fields: itemSchema
          },
          { name: "unknownBool2", type: "boolean", defaultValue: false }
        ]
      },
      { name: "unknownDword1", type: "uint32", defaultValue: 0 }
    ]
  },
  { name: "unknownDword21", type: "uint32", defaultValue: 0 }
];

export const fullPcSchema: PacketFields = [
  { name: "useCompression", type: "boolean", defaultValue: false },
  {
    name: "fullPcData",
    type: "byteswithlength",
    fields: [
      {
        name: "transientId",
        type: "custom",
        parser: readUnsignedIntWith2bitLengthValue,
        packer: packUnsignedIntWith2bitLengthValue,
        defaultValue: 0
      },
      { name: "unknownDword1", type: "uint32", defaultValue: 0 },
      { name: "unknownDword2", type: "uint32", defaultValue: 0 },
      { name: "unknownDword3", type: "uint32", defaultValue: 0 },
      { name: "unknownDword4", type: "uint32", defaultValue: 1 },
      {
        name: "attachmentData",
        type: "array",
        defaultValue: [],
        fields: attachmentSchema
      },
      { name: "headActor", type: "string", defaultValue: "" },
      { name: "hairModel", type: "string", defaultValue: "" },
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
        defaultValue: {},
        fields: [
          { name: "unknownDword1", type: "uint32", defaultValue: 0 },
          { name: "unknownDword2", type: "uint32", defaultValue: 0 },
          { name: "unknownDword3", type: "uint32", defaultValue: 0 }
        ]
      },
      {
        name: "effectTags",
        type: "array",
        defaultValue: [],
        fields: effectTagsSchema
      },
      { name: "unknownDword9", type: "uint32", defaultValue: 0 },
      { name: "unknownDword10", type: "uint32", defaultValue: 0 },
      { name: "unknownDword11", type: "uint32", defaultValue: 0 },
      { name: "unknownDword12", type: "uint32", defaultValue: 0 },
      { name: "unknownDword13", type: "uint32", defaultValue: 0 },
      { name: "materialType", type: "uint32", defaultValue: 3 },
      { name: "unknownBool1", type: "boolean", defaultValue: false },
      { name: "unknownBool2", type: "boolean", defaultValue: false },
      { name: "unknownBool3", type: "boolean", defaultValue: false },
      { name: "unknownDword15", type: "uint32", defaultValue: 0 },
      {
        name: "unknownArray1",
        type: "byteswithlength",
        defaultValue: {},
        fields: [
          {
            name: "data", // locksBaseRelated
            type: "array",
            defaultValue: [],
            fields: [
              { name: "unknownDword1", type: "uint32", defaultValue: 0 },
              { name: "unknownDword2", type: "uint32", defaultValue: 0 }
            ]
          }
        ]
      },
      {
        name: "resources",
        type: "byteswithlength",
        defaultValue: {},
        fields: [
          {
            name: "data",
            type: "array",
            defaultValue: [],
            fields: [
              { name: "resourceId", type: "uint32", defaultValue: 0 },
              {
                name: "resourceData",
                type: "schema",
                defaultValue: {},
                fields: characterResourceData
              }
            ]
          }
        ]
      },
      {
        name: "unknownArray2",
        type: "byteswithlength",
        defaultValue: {},
        fields: [
          {
            name: "unknownArray1",
            type: "array",
            defaultValue: [],
            fields: [
              {
                name: "unknownQword1",
                type: "uint64string",
                defaultValue: ""
              },
              {
                name: "unknownEffectData",
                type: "schema",
                defaultValue: {},
                fields: [
                  {
                    name: "unknownQword1",
                    type: "uint64string",
                    defaultValue: ""
                  },
                  { name: "unknownDword1", type: "uint32", defaultValue: 0 },
                  {
                    name: "unknownData1",
                    type: "schema",
                    defaultValue: {},
                    fields: [
                      {
                        name: "unknownDword1",
                        type: "uint32",
                        defaultValue: 0
                      },
                      {
                        name: "unknownDword2",
                        type: "uint32",
                        defaultValue: 0
                      },
                      {
                        name: "unknownDword3",
                        type: "uint32",
                        defaultValue: 0
                      }
                    ]
                  },
                  {
                    name: "unknownData2",
                    type: "schema",
                    defaultValue: {},
                    fields: [
                      {
                        name: "unknownDword1",
                        type: "uint32",
                        defaultValue: 0
                      },
                      {
                        name: "unknownDword2",
                        type: "uint32",
                        defaultValue: 0
                      },
                      {
                        name: "unknownDword3",
                        type: "uint32",
                        defaultValue: 0
                      }
                    ]
                  },
                  {
                    name: "unknownData3",
                    type: "schema",
                    defaultValue: {},
                    fields: [
                      {
                        name: "unknownQword1",
                        type: "uint64string",
                        defaultValue: ""
                      },
                      {
                        name: "unknownDword1",
                        type: "uint32",
                        defaultValue: 0
                      },
                      {
                        name: "unknownQword2",
                        type: "uint64string",
                        defaultValue: ""
                      }
                    ]
                  },
                  {
                    name: "unknownData4",
                    type: "schema",
                    defaultValue: {},
                    fields: [
                      {
                        name: "unknownQword1",
                        type: "uint64string",
                        defaultValue: ""
                      },
                      {
                        name: "unknownQword2",
                        type: "uint64string",
                        defaultValue: ""
                      },
                      {
                        name: "unknownFloatVector4",
                        type: "floatvector4",
                        defaultValue: [0, 0, 0, 0]
                      }
                    ]
                  },
                  {
                    name: "unknownData5",
                    type: "schema",
                    defaultValue: {},
                    fields: [
                      {
                        name: "unknownDword1",
                        type: "uint32",
                        defaultValue: 0
                      },
                      {
                        name: "unknownDword2",
                        type: "uint32",
                        defaultValue: 0
                      },
                      {
                        name: "unknownDword3",
                        type: "uint32",
                        defaultValue: 0
                      }
                    ]
                  },
                  { name: "unknownDword2", type: "uint32", defaultValue: 0 },
                  { name: "unknownByte1", type: "uint8", defaultValue: 0 }
                ]
              },
              {
                name: "unknownArray2",
                type: "array",
                defaultValue: [],
                fields: [
                  {
                    name: "unknownQword1",
                    type: "uint64string",
                    defaultValue: ""
                  },
                  {
                    name: "unknownData1",
                    type: "schema",
                    defaultValue: {},
                    fields: [
                      {
                        name: "unknownQword1",
                        type: "uint64string",
                        defaultValue: ""
                      },
                      {
                        name: "unknownDword1",
                        type: "uint32",
                        defaultValue: 0
                      },
                      {
                        name: "unknownDword2",
                        type: "uint32",
                        defaultValue: 0
                      },
                      {
                        name: "unknownDword3",
                        type: "uint32",
                        defaultValue: 0
                      },
                      {
                        name: "unknownQword2",
                        type: "uint64string",
                        defaultValue: ""
                      },
                      {
                        name: "unknownDword4",
                        type: "uint32",
                        defaultValue: 0
                      }
                    ]
                  }
                ]
              }
            ]
          }
        ]
      },
      {
        name: "unknownArray3",
        type: "byteswithlength",
        defaultValue: {},
        fields: [
          {
            name: "data",
            type: "array",
            defaultValue: [],
            fields: [
              {
                name: "unknownDword1",
                type: "uint32",
                defaultValue: 0
              },
              {
                name: "unknownData1",
                type: "schema",
                defaultValue: {},
                fields: [
                  { name: "unknownDword1", type: "uint32", defaultValue: 0 },
                  { name: "unknownDword2", type: "uint32", defaultValue: 0 },
                  { name: "unknownDword3", type: "uint32", defaultValue: 0 }
                ]
              }
            ]
          }
        ]
      },
      {
        name: "remoteWeapons",
        type: "byteswithlength",
        defaultValue: {},
        fields: [
          {
            name: "data",
            type: "array",
            defaultValue: [],
            fields: [
              { name: "guid", type: "uint64string", defaultValue: "" },
              ...remoteWeaponSchema
            ]
          }
        ]
      }
    ]
  },
  {
    name: "positionUpdate",
    type: "custom",
    parser: readPositionUpdateData,
    packer: packPositionUpdateData
  },
  { name: "unknownByte1", type: "uint8", defaultValue: 0 },
  { name: "unknownByte2", type: "uint8", defaultValue: 0 },
  { name: "unknownQword1", type: "uint64string", defaultValue: "0" },
  {
    name: "stats",
    type: "array",
    defaultValue: [],
    fields: statSchema
  },
  {
    name: "remoteWeaponExtra",
    type: "array",
    defaultValue: {},
    fields: [
      { name: "guid", type: "uint64string", defaultValue: "" },
      ...remoteWeaponExtraSchema
    ]
  }
];

export const respawnLocationSchema: PacketFields = [
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
      { name: "unknownByte5", type: "uint8", defaultValue: 0 }
    ]
  },
  { name: "unknownDword4", type: "uint32", defaultValue: 0 },
  { name: "unknownByte3", type: "uint8", defaultValue: 0 },
  { name: "unknownByte4", type: "uint8", defaultValue: 0 }
];

export const containerData: PacketFields = [
  { name: "guid", type: "uint64string", defaultValue: "0" },
  { name: "definitionId", type: "uint32", defaultValue: 0 },
  { name: "associatedCharacterId", type: "uint64string", defaultValue: "0" },
  { name: "slots", type: "uint32", defaultValue: 0 },
  {
    name: "items",
    type: "array",
    defaultValue: [],
    fields: [
      { name: "itemDefinitionId", type: "uint32", defaultValue: 0 },
      { name: "itemData", type: "schema", fields: itemSchema }
    ]
  },
  { name: "showBulk", type: "boolean", defaultValue: true },
  { name: "maxBulk", type: "uint32", defaultValue: 0 },
  { name: "unknownDword1", type: "uint32", defaultValue: 0 },
  { name: "bulkUsed", type: "uint32", defaultValue: 0 },
  { name: "hasBulkLimit", type: "boolean", defaultValue: true }
];

export const containers: PacketFields = [
  { name: "loadoutSlotId", type: "uint32", defaultValue: 0 },
  {
    name: "containerData",
    type: "schema",
    defaultValue: {},
    fields: containerData
  }
];

export const skyData: PacketFields = [
  { name: "overcast", type: "float", defaultValue: 0 },
  { name: "fogDensity", type: "float", defaultValue: 0 },
  { name: "fogFloor", type: "float", defaultValue: 1 },
  { name: "fogGradient", type: "float", defaultValue: 1 },
  { name: "globalPrecipitation", type: "float", defaultValue: 0 },
  { name: "temperature", type: "float", defaultValue: 0 },
  { name: "skyClarity", type: "float", defaultValue: 0 },
  { name: "cloudWeight0", type: "float", defaultValue: 0 },
  { name: "cloudWeight1", type: "float", defaultValue: 0 },
  { name: "cloudWeight2", type: "float", defaultValue: 0 },
  { name: "cloudWeight3", type: "float", defaultValue: 0 },
  { name: "transitionTime", type: "float", defaultValue: 0 },
  { name: "sunAxisX", type: "float", defaultValue: 0 },
  { name: "sunAxisY", type: "float", defaultValue: 0 },
  { name: "sunAxisZ", type: "float", defaultValue: 0 },
  { name: "windDirectionX", type: "float", defaultValue: 0 },
  { name: "windDirectionY", type: "float", defaultValue: 0 },
  { name: "windDirectionZ", type: "float", defaultValue: 0 },
  { name: "wind", type: "float", defaultValue: 0 },
  { name: "rainminStrength", type: "float", defaultValue: 0 },
  { name: "rainRampupTimeSeconds", type: "float", defaultValue: 0 },
  { name: "cloudFile", type: "string", defaultValue: "" },
  { name: "stratusCloudTiling", type: "float", defaultValue: 0 },
  { name: "stratusCloudScrollU", type: "float", defaultValue: 0 },
  { name: "stratusCloudScrollV", type: "float", defaultValue: 0 },
  { name: "stratusCloudHeight", type: "float", defaultValue: 0 },
  { name: "cumulusCloudTiling", type: "float", defaultValue: 0 },
  { name: "cumulusCloudScrollU", type: "float", defaultValue: 0 },
  { name: "cumulusCloudScrollV", type: "float", defaultValue: 0 },
  { name: "cumulusCloudHeight", type: "float", defaultValue: 0 },
  { name: "cloudAnimationSpeed", type: "float", defaultValue: 0 },
  { name: "cloudSilverLiningThickness", type: "float", defaultValue: 0 },
  { name: "cloudSilverLiningBrightness", type: "float", defaultValue: 0 },
  { name: "cloudShadows", type: "float", defaultValue: 0 }
];

export const recipeData: PacketFields = [
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
      { name: "itemDefinitionId", type: "uint32", defaultValue: 0 }
    ]
  },
  { name: "itemDefinitionId", type: "uint32", defaultValue: 0 }
];

export const equipmentCharacterSchema: PacketFields = [
  { name: "profileId", type: "uint32", defaultValue: 3 },
  { name: "characterId", type: "uint64string", defaultValue: "0" }
];

export const equipmentSlotSchema: PacketFields = [
  { name: "equipmentSlotId", type: "uint32", defaultValue: 0 },
  {
    name: "equipmentSlotData",
    type: "schema",
    fields: [
      { name: "equipmentSlotId", type: "uint32", defaultValue: 0 },
      { name: "guid", type: "uint64string", defaultValue: "0" },
      { name: "tintAlias", type: "string", defaultValue: "" },
      { name: "decalAlias", type: "string", defaultValue: "#" }
    ]
  }
];

export const itemDefinitionSchema: PacketFields = [
  {
    name: "flags1", // 2 sets of 8 bits, the sets might be swapped though
    type: "bitflags",
    defaultValue: [],
    flags: [
      { bit: 0, name: "NO_TRADE", defaultValue: 0 }, // does nothing
      { bit: 1, name: "COMBAT_ONLY", defaultValue: 0 }, // does nothing
      { bit: 2, name: "NO_LIVE_GAMER", defaultValue: 0 }, // does nothing
      { bit: 3, name: "SINGLE_USE", defaultValue: 0 },
      { bit: 4, name: "NON_MINI_GAME", defaultValue: 0 }, // does nothing
      { bit: 5, name: "MEMBERS_ONLY", defaultValue: 0 },
      { bit: 6, name: "NO_SALE", defaultValue: 0 },
      { bit: 7, name: "FORCE_DISABLE_PREVIEW", defaultValue: 0 } // does nothing
    ]
  },
  {
    name: "flags2",
    type: "bitflags",
    defaultValue: [],
    flags: [
      { bit: 0, name: "PERSIST_PROFILE_SWITCH", defaultValue: 0 }, // does nothing
      { bit: 1, name: "FLAG_QUICK_USE", defaultValue: 0 }, // does nothing
      { bit: 2, name: "FLAG_NO_DRAG_DROP", defaultValue: 0 },
      { bit: 3, name: "FLAG_ACCOUNT_SCOPE", defaultValue: 0 }, // does nothing
      { bit: 4, name: "FLAG_CAN_EQUIP", defaultValue: 0 }, // does nothing
      { bit: 5, name: "bit5", defaultValue: 0 }, // does nothing
      { bit: 6, name: "bit6", defaultValue: 0 }, // does nothing
      { bit: 7, name: "bit7", defaultValue: 0 } // does nothing
    ]
  },
  { name: "NAME_ID", type: "uint32", defaultValue: 0 },
  { name: "DESCRIPTION_ID", type: "uint32", defaultValue: 0 },
  { name: "CONTENT_ID", type: "uint32", defaultValue: 0 },
  { name: "IMAGE_SET_ID", type: "uint32", defaultValue: 0 },
  { name: "TINT_ID", type: "uint32", defaultValue: 0 },
  { name: "HUD_IMAGE_SET_ID", type: "uint32", defaultValue: 0 },
  { name: "unknownDword8", type: "uint32", defaultValue: 921 },
  { name: "unknownDword9", type: "uint32", defaultValue: 922 },
  { name: "COST", type: "uint32", defaultValue: 0 },
  { name: "ITEM_CLASS", type: "uint32", defaultValue: 0 },
  { name: "PROFILE_OVERRIDE", type: "uint32", defaultValue: 0 },
  { name: "MODEL_NAME", type: "string", defaultValue: "" },
  { name: "TEXTURE_ALIAS", type: "string", defaultValue: "" },
  { name: "GENDER_USAGE", type: "uint32", defaultValue: 0 },
  { name: "ITEM_TYPE", type: "uint32", defaultValue: 0 },
  { name: "CATEGORY_ID", type: "uint32", defaultValue: 0 },
  { name: "WEAPON_TRAIL_EFFECT_ID", type: "uint32", defaultValue: 0 },
  { name: "COMPOSITE_EFFECT_ID", type: "uint32", defaultValue: 0 },
  { name: "POWER_RATING", type: "uint32", defaultValue: 0 },
  { name: "MIN_PROFILE_RANK", type: "uint32", defaultValue: 0 },
  { name: "RARITY", type: "uint32", defaultValue: 0 },
  { name: "ACTIVATABLE_ABILITY_ID", type: "uint32", defaultValue: 0 },
  { name: "ACTIVATABLE_ABILITY_SET_ID", type: "uint32", defaultValue: 0 },
  { name: "PASSIVE_ABILITY_ID", type: "uint32", defaultValue: 0 },
  { name: "PASSIVE_ABILITY_SET_ID", type: "uint32", defaultValue: 0 },
  { name: "MAX_STACK_SIZE", type: "uint32", defaultValue: 0 },
  { name: "MIN_STACK_SIZE", type: "uint32", defaultValue: 0 },
  { name: "TINT_ALIAS", type: "string", defaultValue: "" },
  { name: "TINT_GROUP_ID", type: "uint32", defaultValue: 0 },
  { name: "MEMBER_DISCOUNT", type: "uint32", defaultValue: 0 },
  { name: "VIP_RANK_REQUIRED", type: "uint32", defaultValue: 0 },
  { name: "RACE_SET_ID", type: "uint32", defaultValue: 0 },
  { name: "UI_MODEL_CAMERA_ID", type: "uint32", defaultValue: 0 },
  { name: "EQUIP_COUNT_MAX", type: "uint32", defaultValue: 0 },
  { name: "CURRENCY_TYPE", type: "int32", defaultValue: 0 }, // can be -1
  { name: "DATASHEET_ID", type: "uint32", defaultValue: 0 },
  { name: "ITEM_TYPE_1", type: "uint32", defaultValue: 0 }, // also ITEM_TYPE?
  { name: "SKILL_SET_ID", type: "uint32", defaultValue: 0 },
  { name: "OVERLAY_TEXTURE", type: "string", defaultValue: "" },
  { name: "DECAL_SLOT", type: "string", defaultValue: "" },
  { name: "OVERLAY_ADJUSTMENT", type: "uint32", defaultValue: 0 },
  { name: "TRIAL_DURATION_SEC", type: "uint32", defaultValue: 0 },
  { name: "NEXT_TRIAL_DELAY_SEC", type: "uint32", defaultValue: 0 },
  { name: "CLIENT_USE_REQUIREMENT_ID", type: "uint32", defaultValue: 0 },
  { name: "OVERRIDE_APPEARANCE", type: "string", defaultValue: "" },
  { name: "OVERRIDE_CAMERA_ID", type: "uint32", defaultValue: 0 },
  { name: "unknownDword42", type: "uint32", defaultValue: 28 },
  { name: "unknownDword43", type: "uint32", defaultValue: 28 },
  { name: "unknownDword44", type: "uint32", defaultValue: 28 },
  { name: "BULK", type: "uint32", defaultValue: 0 },
  { name: "ACTIVE_EQUIP_SLOT_ID", type: "uint32", defaultValue: 0 },
  { name: "PASSIVE_EQUIP_SLOT_ID", type: "uint32", defaultValue: 0 },
  { name: "PASSIVE_EQUIP_SLOT_GROUP_ID", type: "uint32", defaultValue: 0 },
  { name: "unknownDword49", type: "uint32", defaultValue: 927 },
  { name: "GRINDER_REWARD_SET_ID", type: "uint32", defaultValue: 0 },
  { name: "BUILD_BAR_GROUP_ID", type: "uint32", defaultValue: 0 },
  { name: "unknownString7", type: "string", defaultValue: "testStringAAA" },
  { name: "unknownBoolean1", type: "boolean", defaultValue: true },
  { name: "IS_ARMOR", type: "boolean", defaultValue: false },
  { name: "unknownDword52", type: "uint32", defaultValue: 28 },
  { name: "PARAM1", type: "uint32", defaultValue: 0 },
  { name: "PARAM2", type: "uint32", defaultValue: 0 },
  { name: "PARAM3", type: "uint32", defaultValue: 0 },
  { name: "STRING_PARAM1", type: "string", defaultValue: "" },
  { name: "UI_MODEL_CAMERA_ID", type: "uint32", defaultValue: 0 },
  { name: "unknownDword57", type: "uint32", defaultValue: 932 },
  { name: "SCRAP_VALUE_OVERRIDE", type: "int32", defaultValue: 0 }, // can be -1
  {
    name: "stats",
    type: "array",
    defaultValue: [],
    fields: [
      { name: "unknownDword1", type: "uint32", defaultValue: 0 },
      {
        name: "statData",
        type: "schema",
        defaultValue: {},
        fields: statSchema
      },
      { name: "unknownDword2", type: "uint32", defaultValue: 0 }
    ]
  }
];

export const loadoutSlotData: PacketFields = [
  { name: "loadoutId", type: "uint32", defaultValue: 0 },
  { name: "slotId", type: "uint32", defaultValue: 0 },
  {
    name: "loadoutItemData",
    type: "schema",
    fields: [
      { name: "itemDefinitionId", type: "uint32", defaultValue: 0 },
      {
        name: "loadoutItemGuid",
        type: "uint64string",
        defaultValue: "0"
      },
      { name: "unknownByte1", type: "uint8", defaultValue: 0 }
    ]
  },
  { name: "unknownDword1", type: "uint32", defaultValue: 0 }
];

export const loadoutSlotsSchema: PacketFields = [
  { name: "loadoutId", type: "uint32", defaultValue: 3 },
  {
    name: "loadoutData",
    type: "schema",
    fields: [
      {
        name: "loadoutSlots",
        type: "array",
        defaultValue: [],
        fields: [
          { name: "hotbarSlotId", type: "uint32", defaultValue: 0 },
          ...loadoutSlotData
        ]
      }
    ]
  },
  { name: "currentSlotId", type: "uint32", defaultValue: 7 }
];

export const firemodesSchema: PacketFields = [
  { name: "FIRE_MODE_ID", type: "uint32", defaultValue: 0 }
];

export function packTargetData(obj: any) {
  const data = Buffer.alloc(1);
  data.writeUInt8(obj["useTargetData"] ? 1 : 0, 0);
  if (obj["useTargetData"]) {
    const targetData = DataSchema.pack(
      [
        {
          name: "position",
          type: "floatvector4",
          defaultValue: [0, 0, 0, 0]
        },
        { name: "unknownQword1", type: "uint64string", defaultValue: "0" }
      ],
      obj
    );
    return Buffer.concat([data, targetData.data]);
  }
  return data;
}

export const passengerSchema: PacketFields = [
  { name: "characterId", type: "uint64string", defaultValue: "0" },
  {
    name: "identity",
    type: "schema",
    defaultValue: {},
    fields: identitySchema
  },
  { name: "unknownString1", type: "string", defaultValue: "" },
  { name: "unknownByte1", type: "uint8", defaultValue: 0 }
];

export function pack2ByteLengthString(string: string) {
  const data = Buffer.alloc(string.length + 2);
  data.writeUInt16LE(string.length, 0);
  data.write(string, 2, string.length, "utf8");
  return data;
  /*
    {
      name: "string",
      type: "custom",
      defaultValue: "",
      packer: pack2ByteLengthString
    },
  */
}

export const accountItemSchema: PacketFields = [
  { name: "itemId", type: "uint64string", defaultValue: "0" },
  { name: "itemDefinitionId", type: "uint64", defaultValue: 0 },
  { name: "itemCount", type: "uint32", defaultValue: 0 },
  { name: "itemGuid", type: "uint64string", defaultValue: "0" },
  { name: "unknownDword4", type: "uint32", defaultValue: 0 }
];

export const storeBundleSchema: PacketFields = [
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
                defaultValue: 0
              },
              {
                name: "unknownDword4",
                type: "uint32",
                defaultValue: 0
              },
              {
                name: "imageData",
                type: "schema",
                fields: [
                  {
                    name: "imageSetId",
                    type: "string",
                    defaultValue: ""
                  },
                  {
                    name: "imageTintValue",
                    type: "string",
                    defaultValue: ""
                  }
                ]
              },
              {
                name: "unknownBoolean1",
                type: "boolean",
                defaultValue: false
              },
              {
                name: "unknownString1",
                type: "string",
                defaultValue: ""
              },
              {
                name: "stationCurrencyId",
                type: "uint32",
                defaultValue: 0
              },
              { name: "price", type: "uint32", defaultValue: 0 },
              { name: "currencyId", type: "uint32", defaultValue: 0 },
              {
                name: "currencyPrice",
                type: "uint32",
                defaultValue: 0
              },
              {
                name: "unknownDword9",
                type: "uint32",
                defaultValue: 0
              },
              {
                name: "unknownTime1",
                type: "uint64string",
                defaultValue: "0"
              },
              {
                name: "unknownTime2",
                type: "uint64string",
                defaultValue: "0"
              },
              {
                name: "unknownDword10",
                type: "uint32",
                defaultValue: 0
              },
              {
                name: "unknownBoolean2",
                type: "boolean",
                defaultValue: false
              },
              {
                name: "itemListDetails",
                type: "array",
                defaultValue: [{}],
                fields: [
                  {
                    name: "unknownDword1",
                    type: "uint32",
                    defaultValue: 0
                  },
                  {
                    name: "imageSetId",
                    type: "uint32",
                    defaultValue: 0
                  },
                  { name: "itemId", type: "uint32", defaultValue: 0 },
                  {
                    name: "unknownString1",
                    type: "string",
                    defaultValue: ""
                  },
                  {
                    name: "unknownString2",
                    type: "string",
                    defaultValue: ""
                  }
                ]
              },
              {
                name: "unknownArray2",
                type: "array",
                defaultValue: [{}],
                fields: [
                  {
                    name: "unknownDword1",
                    type: "uint32",
                    defaultValue: 0
                  },
                  {
                    name: "unknownDword2",
                    type: "uint32",
                    defaultValue: 0
                  }
                ]
              }
            ]
          },
          { name: "storeId", type: "uint32", defaultValue: 0 },
          { name: "categoryId", type: "uint32", defaultValue: 0 },
          {
            name: "unknownBoolean1",
            type: "boolean",
            defaultValue: false
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
            defaultValue: false
          },
          {
            name: "unknownBoolean3",
            type: "boolean",
            defaultValue: false
          },
          {
            name: "unknownBoolean4",
            type: "boolean",
            defaultValue: false
          }
        ]
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
      {
        name: "unknownQword3",
        type: "uint64string",
        defaultValue: "0"
      },
      { name: "unknownString2", type: "string", defaultValue: "" },
      { name: "unknownDword12", type: "uint32", defaultValue: 0 },
      { name: "unknownDword13", type: "uint32", defaultValue: 0 }
    ]
  }
];

export const damageReportPlayerInfoSchema: PacketFields = [
  { name: "flags1", type: "uint8", defaultValue: 0 },
  { name: "flags2", type: "uint8", defaultValue: 0 },
  { name: "unknownDword1", type: "uint32", defaultValue: 0 },
  { name: "unknownQword1", type: "uint64string", defaultValue: "0" },
  { name: "unknownQword2", type: "uint64string", defaultValue: "0" },
  { name: "unknownQword3", type: "uint64string", defaultValue: "0" },
  { name: "unknownDword2", type: "uint32", defaultValue: 0 },
  { name: "unknownDword3", type: "int32", defaultValue: 0 },
  { name: "unknownDword4", type: "uint32", defaultValue: 0 },
  { name: "unknownDword5", type: "uint32", defaultValue: 0 },
  { name: "unknownDword6", type: "uint32", defaultValue: 0 },
  { name: "unknownDword7", type: "uint32", defaultValue: 0 },
  { name: "unknownDword8", type: "uint32", defaultValue: 0 },
  {
    name: "unknownFloatVector1",
    type: "floatvector4",
    defaultValue: [0, 0, 0, 1]
  },
  { name: "unknownDword9", type: "uint32", defaultValue: 0 },
  { name: "unknownDword10", type: "uint32", defaultValue: 0 },
  { name: "unknownDword11", type: "uint32", defaultValue: 0 },
  { name: "unknownDword12", type: "uint32", defaultValue: 0 }
];
