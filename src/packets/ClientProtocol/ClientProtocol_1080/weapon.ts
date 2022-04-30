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

import DataSchema from "h1z1-dataschema";
import PacketTableBuild from "../../packettable";
import {
  packUnsignedIntWith2bitLengthValue,
  readPacketType,
  readUnsignedIntWith2bitLengthValue,
  writePacketType,
} from "./shared";
import { itemWeaponDetailSubSchema1 } from "./shared";

const weaponPackets: any = [
  [
    "Weapon.FireStateUpdate",
    0x8301,
    {
      fields: [
        { name: "guid", type: "uint64string", defaultValue: "0" },
        { name: "unknownByte1", type: "uint8", defaultValue: 0 },
        { name: "unknownByte2", type: "uint8", defaultValue: 0 },
      ],
    },
  ],
  ["Weapon.FireStateTargetedUpdate", 0x8302, {}],
  [
    "Weapon.Fire",
    0x8303,
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
  ["Weapon.FireWithDefinitionMapping", 0x8304, {}],
  ["Weapon.FireNoProjectile", 0x8305, {}],
  ["Weapon.ProjectileHitReport", 0x8306, {}],
  [
    "Weapon.ReloadRequest",
    0x8307,
    {
      fields: [{ name: "guid", type: "uint64string", defaultValue: "0" }],
    },
  ],
  ["Weapon.Reload", 0x8308, {}],
  ["Weapon.ReloadInterrupt", 0x8309, {}],
  ["Weapon.ReloadComplete", 0x830a, {}],
  [
    "Weapon.SwitchFireModeRequest",
    0x830b,
    {
      fields: [
        { name: "guid", type: "uint64string", defaultValue: "0" },
        { name: "unknownByte1", type: "uint8", defaultValue: 0 },
        { name: "unknownByte2", type: "uint8", defaultValue: 0 },
        { name: "unknownByte3", type: "uint8", defaultValue: 0 },
      ],
    },
  ],
  ["Weapon.LockOnGuidUpdate", 0x830c, {}],
  ["Weapon.LockOnLocationUpdate", 0x830d, {}],
  [
    "Weapon.StatUpdate",
    0x830e,
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
                  fields: itemWeaponDetailSubSchema1,
                },
              ],
            },
          ],
        },
      ],
    },
  ],
  ["Weapon.DebugProjectile", 0x830f, {}],
  ["Weapon.AddFireGroup", 0x8310, {}],
  ["Weapon.RemoveFireGroup", 0x8311, {}],
  ["Weapon.ReplaceFireGroup", 0x8312, {}],
  ["Weapon.GuidedUpdate", 0x8313, {}],
  ["Weapon.RemoteWeapon.Reset", 0x831401, {}],
  ["Weapon.RemoteWeapon.AddWeapon", 0x831402, {}],
  ["Weapon.RemoteWeapon.RemoveWeapon", 0x831403, {}],
  [
    "Weapon.RemoteWeapon.Update",
    0x831404,
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
  ["Weapon.RemoteWeapon.Update.FireState", 0x83140401, {}],
  ["Weapon.RemoteWeapon.Update.Empty", 0x83140402, {}],
  ["Weapon.RemoteWeapon.Update.Reload", 0x83140403, {}],
  ["Weapon.RemoteWeapon.Update.ReloadLoopEnd", 0x83140404, {}],
  ["Weapon.RemoteWeapon.Update.ReloadInterrupt", 0x83140405, {}],
  ["Weapon.RemoteWeapon.Update.SwitchFireMode", 0x83140406, {}],
  ["Weapon.RemoteWeapon.Update.StatUpdate", 0x83140407, {}],
  ["Weapon.RemoteWeapon.Update.AddFireGroup", 0x83140408, {}],
  ["Weapon.RemoteWeapon.Update.RemoveFireGroup", 0x83140409, {}],
  ["Weapon.RemoteWeapon.Update.ReplaceFireGroup", 0x8314040a, {}],
  ["Weapon.RemoteWeapon.Update.ProjectileLaunch", 0x8314040b, {}],
  ["Weapon.RemoteWeapon.Update.Chamber", 0x8314040c, {}],
  ["Weapon.RemoteWeapon.Update.Throw", 0x8314040d, {}],
  ["Weapon.RemoteWeapon.Update.Trigger", 0x8314040e, {}],
  ["Weapon.RemoteWeapon.Update.ChamberInterrupt", 0x8314040f, {}],
  ["Weapon.RemoteWeapon.ProjectileLaunchHint", 0x831405, {}],
  ["Weapon.RemoteWeapon.ProjectileDetonateHint", 0x831406, {}],
  ["Weapon.RemoteWeapon.ProjectileRemoteContactReport", 0x831407, {}],
  ["Weapon.ChamberRound", 0x8315, {}],
  ["Weapon.GuidedSetNonSeeking", 0x8316, {}],
  ["Weapon.ChamberInterrupt", 0x8317, {}],
  ["Weapon.GuidedExplode", 0x8318, {}],
  ["Weapon.DestroyNpcProjectile", 0x8319, {}],
  ["Weapon.WeaponToggleEffects", 0x831a, {}],
  [
    "Weapon.Reset",
    0x831b,
    {
      fields: [
        { name: "characterId", type: "uint64string", defaultValue: "0" },
        { name: "unknownBoolean1", type: "boolean", defaultValue: true },
        { name: "unknownByte1", type: "uint8", defaultValue: 1 },
      ],
    },
  ],
  ["Weapon.ProjectileSpawnNpc", 0x831c, {}],
  ["Weapon.FireRejected", 0x831d, {}],
  [
    "Weapon.MultiWeapon",
    0x831e,
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
  ["Weapon.WeaponFireHint", 0x831f, {}],
  ["Weapon.ProjectileContactReport", 0x8320, {}],
  ["Weapon.MeleeHitMaterial", 0x8321, {}],
  ["Weapon.ProjectileSpawnAttachedNp", 0x8322, {}],
  ["Weapon.AddDebugLogEntry", 0x8323, {}],
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

function packMultiWeaponPacket() {
  throw new Error("Not implemented");
}

export function parseWeaponPacket(data: Buffer, offset: number) {
  const obj: any = {};

  obj.gameTime = data.readUInt32LE(offset);
  const tmpData = data.slice(offset + 4);

  const weaponPacketData = Buffer.allocUnsafe(tmpData.length + 1);
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

export function packWeaponPacket(obj: any) {
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
