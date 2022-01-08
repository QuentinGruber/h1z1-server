import DataSchema from "h1z1-dataschema"
import PacketTableBuild from "../../packettable";
import { packUnsignedIntWith2bitLengthValue, readPacketType, readUnsignedIntWith2bitLengthValue, writePacketType } from "./shared";
import { itemWeaponDetailSubSchema1 } from "./shared";

const weaponPackets:any = [
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
          { name: "characterId", type: "uint64string", defaultValue: "0" },
          { name: "unknownBoolean1", type: "boolean", defaultValue: true },
          { name: "unknownByte1", type: "uint8", defaultValue: 1 },
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