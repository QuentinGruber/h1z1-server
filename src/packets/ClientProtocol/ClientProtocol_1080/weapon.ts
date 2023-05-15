// ======================================================================
//
//   GNU GENERAL PUBLIC LICENSE
//   Version 3, 29 June 2007
//   copyright (C) 2020 - 2021 Quentin Gruber
//   copyright (C) 2021 - 2023 H1emu community
//
//   https://github.com/QuentinGruber/h1z1-server
//   https://www.npmjs.com/package/h1z1-server
//
//   Based on https://github.com/psemu/soe-network
// ======================================================================

import DataSchema from "h1z1-dataschema";
import PacketTableBuild from "../../packettable";
import {
  packUnsignedIntWith2bitLengthValue,
  readPacketType,
  readUnsignedIntWith2bitLengthValue,
  remoteWeaponExtraSchema,
  remoteWeaponSchema,
  writePacketType
} from "./shared";
import { itemWeaponDetailSubSchema1 } from "./shared";
import { PacketStructures } from "types/packetStructure";

const weaponPackets: PacketStructures = [
  [
    "Weapon.FireStateUpdate",
    0x8301,
    {
      fields: [
        { name: "guid", type: "uint64string", length: "" },
        { name: "firestate", type: "uint8", length: 0 },
        { name: "unknownByte2", type: "uint8", length: 0 }
      ]
    }
  ],
  ["Weapon.FireStateTargetedUpdate", 0x8302, {}],
  [
    "Weapon.Fire",
    0x8303,
    {
      fields: [
        { name: "guid", type: "uint64string", defaultValue: "0" },
        { name: "position", type: "floatvector3", defaultValue: [0, 0, 0] },
        { name: "weaponProjectileCount", type: "uint32", defaultValue: 0 },
        { name: "sessionProjectileCount", type: "uint32", defaultValue: 0 },
        { name: "unknownDword3", type: "uint32", defaultValue: 0 }
      ]
    }
  ],
  ["Weapon.FireWithDefinitionMapping", 0x8304, {}],
  ["Weapon.FireNoProjectile", 0x8305, {}],
  [
    "Weapon.ProjectileHitReport",
    0x8306,
    {
      fields: [
        { name: "hitReport", type: "custom", parser: parseHitReportPacket }
      ]
    }
  ],
  [
    "Weapon.ReloadRequest",
    0x8307,
    {
      fields: [{ name: "characterId", type: "uint64string", defaultValue: "0" }]
    }
  ],
  [
    "Weapon.Reload",
    0x8308,
    {
      fields: [
        { name: "weaponGuid", type: "uint64string", defaultValue: "0" },
        { name: "weaponProjectileCount", type: "uint32", defaultValue: 0 },
        { name: "ammoCount", type: "uint32", defaultValue: 0 },
        { name: "unknownDword3", type: "uint32", defaultValue: 0 },
        { name: "currentReloadCount", type: "uint64string", defaultValue: "0" }
      ]
    }
  ],
  ["Weapon.ReloadInterrupt", 0x8309, {}],
  ["Weapon.ReloadRejected", 0x830b, {}],
  [
    "Weapon.SwitchFireModeRequest",
    0x830c,
    {
      fields: [
        { name: "guid", type: "uint64string", defaultValue: "0" },
        { name: "firegroupIndex", type: "uint8", defaultValue: 0 },
        { name: "firemodeIndex", type: "uint8", defaultValue: 0 },
        { name: "unknownByte3", type: "uint8", defaultValue: 0 }
      ]
    }
  ],
  ["Weapon.LockOnGuidUpdate", 0x830d, {}],
  ["Weapon.LockOnLocationUpdate", 0x830e, {}],
  [
    "Weapon.StatUpdate",
    0x830f,
    {
      fields: [
        {
          name: "statData",
          type: "array",
          defaultValue: [],
          fields: [
            { name: "guid", type: "uint64string", defaultValue: "0" },
            { name: "unknownBoolean1", type: "boolean", defaultValue: false },
            {
              name: "statUpdates",
              type: "array",
              defaultValue: [],
              fields: [
                { name: "statCategory", type: "uint8", defaultValue: 0 },
                {
                  name: "statUpdateData",
                  type: "schema",
                  fields: itemWeaponDetailSubSchema1
                }
              ]
            }
          ]
        }
      ]
    }
  ],
  ["Weapon.DebugProjectile", 0x8310, {}],
  ["Weapon.AddFireGroup", 0x8311, {}],
  ["Weapon.RemoveFireGroup", 0x8312, {}],
  ["Weapon.ReplaceFireGroup", 0x8313, {}],
  ["Weapon.GuidedUpdate", 0x8314, {}],
  [
    "Weapon.RemoteWeapon",
    0x8315,
    {
      fields: [
        {
          name: "weaponPacket",
          type: "custom",
          packer: packRemoteWeaponPacket
        }
      ]
    }
  ],
  ["Weapon.ChamberRound", 0x8316, {}],
  ["Weapon.GuidedSetNonSeeking", 0x8317, {}],
  ["Weapon.ChamberInterrupt", 0x8318, {}],
  ["Weapon.GuidedExplode", 0x8319, {}],
  [
    "Weapon.DestroyNpcProjectile",
    0x831a,
    {
      fields: [
        { name: "unknownDword1", type: "uint32", defaultValue: 0 },
        { name: "unknownDword2", type: "uint32", defaultValue: 0 },
        { name: "unknownDword3", type: "uint32", defaultValue: 0 },
        { name: "position", type: "floatvector4", defaultValue: [0, 0, 0, 0] }
      ]
    }
  ],
  ["Weapon.WeaponToggleEffects", 0x831b, {}],
  [
    "Weapon.Reset",
    0x831c,
    {
      fields: [
        { name: "guid", type: "uint64string", defaultValue: "0" },
        { name: "unknownBoolean1", type: "boolean", defaultValue: true },
        { name: "unknownByte1", type: "uint8", defaultValue: 1 }
      ]
    }
  ],
  [
    "Weapon.ProjectileSpawnNpc",
    0x831d,
    {
      fields: [
        { name: "projectileId", type: "uint32", defaultValue: 0 },
        { name: "position", type: "floatvector4", defaultValue: [0, 0, 0, 0] },
        { name: "rotation", type: "floatvector4", defaultValue: [0, 0, 0, 0] },
        { name: "unknownDword1", type: "uint32", defaultValue: 0 },
        { name: "unknownDword2", type: "uint32", defaultValue: 0 }
      ]
    }
  ],
  ["Weapon.FireRejected", 0x831e, {}],
  [
    "Weapon.MultiWeapon",
    0x831f,
    {
      fields: [
        {
          name: "packets",
          type: "custom",
          parser: parseMultiWeaponPacket
        }
      ]
    }
  ],
  [
    "Weapon.WeaponFireHint",
    0x8320,
    {
      fields: [
        { name: "characterId", type: "uint64string", defaultValue: "0" },
        { name: "unknownByte1", type: "uint8", defaultValue: 0 },
        { name: "position", type: "floatvector3", defaultValue: [0, 0, 0] },
        { name: "weaponProjectileCount", type: "uint32", defaultValue: 0 },
        { name: "sessionProjectileCount", type: "uint32", defaultValue: 0 },
        { name: "rotation", type: "floatvector3", defaultValue: [0, 0, 0] },
        { name: "unknownDword3", type: "uint32", defaultValue: 0 }
      ]
    }
  ],
  [
    "Weapon.ProjectileContactReport",
    0x8321,
    {
      fields: [
        { name: "unknownDword1", type: "uint32", defaultValue: 0 },
        { name: "unknownDword2", type: "uint32", defaultValue: 0 },
        { name: "unknownDword3", type: "uint32", defaultValue: 0 },
        { name: "rotation", type: "floatvector3", defaultValue: [0, 0, 0] },
        { name: "unknownDword4", type: "uint32", defaultValue: 0 },
        { name: "position", type: "floatvector3", defaultValue: [0, 0, 0] },
        { name: "unknownDword5", type: "uint32", defaultValue: 0 },
        { name: "unknownFloat1", type: "float", defaultValue: 0 },
        { name: "unknownDword6", type: "uint32", defaultValue: 0 },
        {
          name: "unknownFloatVector1",
          type: "floatvector3",
          defaultValue: [0, 0, 0]
        },
        { name: "unknownDword7", type: "int32", defaultValue: 0 },
        { name: "unknownWord1", type: "uint16", defaultValue: 0 },
        { name: "unknownDword8", type: "uint32", defaultValue: 0 },
        { name: "unknownByte1", type: "uint8", defaultValue: 0 }
      ]
    }
  ],
  [
    "Weapon.MeleeHitMaterial",
    0x8322,
    {
      fields: [{ name: "materialType", type: "uint32", defaultValue: 0 }]
    }
  ],
  [
    "Weapon.ProjectileSpawnAttachedNpc",
    0x8323,
    {
      fields: [
        { name: "sessionProjectileCount", type: "uint32", defaultValue: 0 },
        { name: "position", type: "floatvector4", defaultValue: [0, 0, 0, 0] },
        { name: "rotation", type: "floatvector4", defaultValue: [0, 0, 0, 0] },
        { name: "characterId", type: "uint64string", defaultValue: "" }
        // some more unk data
      ]
    }
  ],
  ["Weapon.AddDebugLogEntry", 0x8324, {}],
  ["Weapon.DebugZoneState", 0x8325, {}],
  ["Weapon.GrenadeBounceReport", 0x8326, {}],
  [
    "Weapon.AimBlockedNotify",
    0x8327,
    {
      fields: [
        { name: "guid", type: "uint64string", defaultValue: "0" },
        { name: "aimBlocked", type: "boolean", defaultValue: false }
      ]
    }
  ]
];

const remoteWeaponPackets: any = [
  [
    "RemoteWeapon.Reset",
    0x01,
    {
      fields: [
        {
          name: "data",
          type: "byteswithlength",
          defaultValue: {},
          fields: [
            {
              name: "remoteWeapons",
              type: "array",
              defaultValue: [],
              fields: [
                { name: "guid", type: "uint64string", defaultValue: "" },
                ...remoteWeaponSchema
              ]
            },
            {
              name: "remoteWeaponsExtra",
              type: "array",
              defaultValue: {},
              fields: [
                { name: "guid", type: "uint64string", defaultValue: "" },
                ...remoteWeaponExtraSchema
              ]
            }
          ]
        }
      ]
    }
  ],
  [
    "RemoteWeapon.AddWeapon",
    0x02,
    {
      fields: [
        { name: "guid", type: "uint64string", defaultValue: "" },
        {
          name: "data",
          type: "byteswithlength",
          fields: remoteWeaponSchema
        }
      ]
    }
  ],
  [
    "RemoteWeapon.RemoveWeapon",
    0x03,
    {
      fields: [{ name: "guid", type: "uint64string", defaultValue: "" }]
    }
  ],
  [
    "RemoteWeapon.Update",
    0x04,
    {
      fields: [
        {
          name: "weaponPacket",
          type: "custom",
          packer: packRemoteWeaponUpdatePacket
        }
      ]
    }
  ],
  ["RemoteWeapon.ProjectileLaunchHint", 0x05, {}],
  ["RemoteWeapon.ProjectileDetonateHint", 0x06, {}],
  ["RemoteWeapon.ProjectileRemoteContactReport", 0x07, {}]
];

const remoteWeaponUpdatePackets: any = [
  [
    "Update.FireState",
    0x01,
    {
      fields: [
        {
          name: "state",
          type: "custom",
          packer: packFirestateUpdate
        }
      ]
    }
  ],
  [
    "Update.Empty",
    0x02,
    {
      fields: [{ name: "unknownDword1", type: "uint32", defaultValue: 0 }]
    }
  ],
  ["Update.Reload", 0x03, {}],
  [
    "Update.ReloadLoopEnd",
    0x04,
    {
      fields: [{ name: "endLoop", type: "boolean", defaultValue: false }]
    }
  ],
  ["Update.ReloadInterrupt", 0x05, {}],
  [
    "Update.SwitchFireMode",
    0x06,
    {
      fields: [
        { name: "firegroupIndex", type: "uint8", defaultValue: 0 },
        { name: "firemodeIndex", type: "uint8", defaultValue: 0 }
      ]
    }
  ],
  ["Update.StatUpdate", 0x07, {}],
  [
    "Update.AddFireGroup",
    0x08,
    {
      fields: [{ name: "firegroupId", type: "uint32", defaultValue: 0 }]
    }
  ],
  ["Update.RemoveFireGroup", 0x09, {}],
  ["Update.ReplaceFireGroup", 0x0a, {}],
  [
    "Update.ProjectileLaunch",
    0x0b,
    {
      fields: [
        { name: "unknownDword1", type: "uint32", defaultValue: 0 },
        { name: "unknownQword1", type: "uint64string", defaultValue: "0" }
      ]
    }
  ],
  ["Update.Chamber", 0x0c, {}],
  ["Update.Throw", 0x0d, {}],
  ["Update.Trigger", 0x0e, {}],
  ["Update.ChamberInterrupt", 0x0f, {}],
  [
    "Update.AimBlocked",
    0x010,
    {
      fields: [{ name: "aimBlocked", type: "boolean", defaultValue: false }]
    }
  ]
];

const [weaponPacketTypes, weaponPacketDescriptors] =
    PacketTableBuild(weaponPackets),
  [remoteWeaponPacketTypes, remoteWeaponPacketDescriptors] =
    PacketTableBuild(remoteWeaponPackets),
  [remoteWeaponUpdatePacketTypes, remoteWeaponUpdatePacketDescriptors] =
    PacketTableBuild(remoteWeaponUpdatePackets);

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
    length: startOffset - offset
  };
}

export function parseWeaponPacket(data: Buffer, offset: number) {
  const obj: any = {};

  obj.gameTime = data.readUInt32LE(offset);

  const tmpData = data.slice(offset + 4);

  const weaponPacketData = Buffer.allocUnsafe(tmpData.length + 1);
  weaponPacketData.writeUInt8(0x83, 0);
  tmpData.copy(weaponPacketData, 1);

  const weaponPacket = readPacketType(
      weaponPacketData,
      weaponPacketDescriptors
    ),
    packetType = `0x${weaponPacket.packetType.toString(16).slice(2)}`;
  if (weaponPacket.packet) {
    obj.packetType = packetType;
    obj.packetName = weaponPacket.packet.name;
    if (weaponPacket.packet.schema) {
      obj.packet = DataSchema.parse(
        weaponPacket.packet.schema,
        weaponPacketData,
        weaponPacket.length
      ).result;
    }
  } else {
    obj.packetType = packetType;
    obj.packetData = data;
  }
  return {
    value: obj,
    length: data.length - offset
  };
}

export function packWeaponPacket(obj: any): Buffer {
  if (obj.packetName == "Weapon.RemoteWeapon")
    return packRemoteWeaponPacket(obj);
  const subObj = obj.packet,
    subName = obj.packetName,
    subType = weaponPacketTypes[subName];
  let data;
  if (weaponPacketDescriptors[subType]) {
    const subPacket = weaponPacketDescriptors[subType],
      subTypeData = writePacketType(subType);
    let subData = DataSchema.pack(subPacket.schema, subObj).data;
    subData = Buffer.concat([subTypeData.slice(1), subData]);
    data = Buffer.allocUnsafe(subData.length + 4);
    data.writeUInt32LE((obj.gameTime & 0xffffffff) >>> 0, 0);
    subData.copy(data, 4);
  } else {
    throw "Unknown weapon packet type: " + subType;
  }
  return data;
}

function packFirestateUpdate(obj: any): Buffer {
  let data = Buffer.alloc(1);
  data.writeUInt8(obj.firestate);
  if ((obj.firestate & 2) == 0) {
    // transientId
    data = Buffer.concat([
      data,
      DataSchema.pack(
        [
          {
            name: "transientId",
            type: "custom",
            parser: readUnsignedIntWith2bitLengthValue,
            packer: packUnsignedIntWith2bitLengthValue
          }
        ],
        obj
      ).data
    ]);
  } else {
    // floatvector4
    data = Buffer.concat([
      data,
      DataSchema.pack(
        [
          {
            name: "position",
            type: "floatvector4",
            defaultValue: [1, 1, 1, 1]
          }
        ],
        obj
      ).data
    ]);
  }
  return data;
}

export function packRemoteWeaponPacket(obj: any): Buffer {
  if (obj.remoteWeaponPacket.packetName == "RemoteWeapon.Update")
    return packRemoteWeaponUpdatePacket(obj);
  const subObj = obj.remoteWeaponPacket.packet,
    subName = obj.remoteWeaponPacket.packetName,
    subType = remoteWeaponPacketTypes[subName];
  if (!remoteWeaponPacketDescriptors[subType]) {
    throw "Unknown weapon packet type: " + subType;
  }
  let subData = Buffer.allocUnsafe(6);
  const subTypeData = writePacketType(subType);
  subData.writeUInt32LE((obj.gameTime & 0xffffffff) >>> 0, 0),
    subData.writeUInt8(0x15, 4), // "Weapon.RemoteWeapon" opcode
    subData.writeUInt8(subTypeData[0], 5); // remoteweapon sub opcode
  const transientId = packUnsignedIntWith2bitLengthValue(
    obj["remoteWeaponPacket"]["transientId"]
  );
  subData = Buffer.concat([subData, transientId]);
  const packetData = DataSchema.pack(
    remoteWeaponPacketDescriptors[subType].schema,
    subObj
  ).data;
  return Buffer.concat([subData, packetData]);
}

export function packRemoteWeaponUpdatePacket(obj: any): Buffer {
  const subObj = obj.remoteWeaponPacket.remoteWeaponUpdatePacket.packet,
    subName = obj.remoteWeaponPacket.remoteWeaponUpdatePacket.packetName,
    subType = remoteWeaponUpdatePacketTypes[subName];
  if (!remoteWeaponUpdatePacketDescriptors[subType]) {
    throw "Unknown weapon packet type: " + subType;
  }
  let subData = Buffer.allocUnsafe(6);
  const subTypeData = writePacketType(subType);
  subData.writeUInt32LE((obj.gameTime & 0xffffffff) >>> 0, 0),
    subData.writeUInt8(0x15, 4), // "Weapon.RemoteWeapon" opcode
    subData.writeUInt8(0x04, 5); // "RemoteWeapon.Update" opcode
  const transientId = packUnsignedIntWith2bitLengthValue(
    obj["remoteWeaponPacket"]["transientId"]
  );
  subData = Buffer.concat([subData, transientId]);
  const updateData = Buffer.allocUnsafe(9);
  updateData.writeUInt8(subTypeData[0], 0);
  for (let j = 0; j < 8; j++) {
    updateData.writeUInt8(
      parseInt(
        obj["remoteWeaponPacket"]["remoteWeaponUpdatePacket"][
          "weaponGuid"
        ].substr(2 + (7 - j) * 2, 2),
        16
      ),
      1 + j
    );
  }
  subData = Buffer.concat([subData, updateData]);
  const packetData = DataSchema.pack(
    remoteWeaponUpdatePacketDescriptors[subType].schema,
    subObj
  ).data;
  return Buffer.concat([subData, packetData]);
}

const hitReportSchema = [
  { name: "sessionProjectileCount", type: "uint32", defaultValue: 0 },
  { name: "characterId", type: "uint64string", defaultValue: "0" },
  { name: "position", type: "floatvector3", defaultValue: [0, 0, 0] },
  { name: "hitLocationLen", type: "uint8", defaultValue: 0 },
  { name: "unknownFlag1", type: "uint8", defaultValue: 0 },
  { name: "hitLocation", type: "nullstring", defaultValue: "" }
];

function parseHitReportPacket(data: Buffer, offset: number) {
  const obj: any = DataSchema.parse(hitReportSchema, data, offset).result;
  offset += 26 + obj.hitLocationLen;
  let byteLen = 8;
  if (obj.hitLocationLen) {
    byteLen = 9;
  }
  obj.unknownBytes = DataSchema.parse(
    [{ name: "unknownBytes", type: "bytes", length: byteLen }],
    data,
    0
  ).result;
  offset += byteLen;

  obj.totalShotCount = data.readUInt8(offset);
  offset += 1;
  obj.unknownByte2 = data.readUInt8(offset);
  return {
    value: obj,
    length: data.length - offset
  };
}
