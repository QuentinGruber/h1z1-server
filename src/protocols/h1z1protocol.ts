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

const debug = require("debug")("H1Z1Protocol");
import DataSchema from "h1z1-dataschema";
import { lz4_decompress } from "../utils/utils";
import eul2quat from "eul2quat";
import { packUnsignedIntWith2bitLengthValue } from "../packets/ClientProtocol/ClientProtocol_860/h1z1packets";

interface UpdatePositionObject {
  raw: Buffer;
  flags: any;
  unknown2_int32: any;
  unknown3_int8: any;
  unknown4: any;
  position: any;
  unknown6_int32: any;
  unknown7_float: any;
  unknown8_float: any;
  unknown9_float: any;
  unknown10_float: any;
  unknown11_float: any;
  unknown12_float: any;
  lookAt: any;
  rotation: any;
  unknown14_float: any;
  unknown15_float: any;
}

interface PositionZoneToClient {
  unknown1_uint: number;
  positionData: UpdatePositionObject;
}

export class H1Z1Protocol {
  H1Z1Packets: any;
  protocolName: string;

  constructor(protocolName = "ClientProtocol_860") {
    this.protocolName = protocolName;
    // Maybe will remove this switch later
    switch (this.protocolName) {
      case "ClientProtocol_860": // normal client from 15 january 2015
        this.H1Z1Packets = require("../packets/ClientProtocol/ClientProtocol_860/h1z1packets");
        break;
      case "ClientProtocol_1080": // normal client from 22 december 2016
        this.H1Z1Packets = require("../packets/ClientProtocol/ClientProtocol_1080/h1z1packets");
        break;
      default:
        debug(`Protocol ${this.protocolName} unsupported !`);
        process.exit();
    }
  }

  createPositionBroadcast(rawData: Buffer, transientId: number): Buffer {
    const tId = packUnsignedIntWith2bitLengthValue(transientId);
    return Buffer.concat([new Uint8Array([120]), tId, rawData]); // why 120 ? i don't remember
  }

  createVehiclePositionBroadcast(rawData: Buffer): Buffer {
    return Buffer.concat([new Uint8Array([120]), rawData]);
  }

  parseFacilityReferenceData(data: Buffer) {
    const inSize = data.readUInt32LE(0),
      outSize = data.readUInt32LE(4),
      compData = data.slice(8);
    data = lz4_decompress(compData, inSize, outSize);
    const schema = {
      fields: [
        {
          name: "facilityTypes",
          type: "array",
          elementSchema: {
            fields: [
              { name: "facilityTypeId", type: "uint8" },
              { name: "facilityString", type: "uint32" },
              { name: "facilityIconId", type: "uint32" },
              { name: "unknown1", type: "uint32" },
            ],
          },
        },
        {
          name: "facilityBenefits",
          type: "array",
          elementSchema: {
            fields: [
              { name: "benefitGroupId", type: "uint32" },
              { name: "benefitIconId", type: "uint32" },
              { name: "benefitString", type: "uint32" },
              { name: "facilityIconId", type: "uint32" },
              { name: "facilityString", type: "uint32" },
            ],
          },
        },
      ],
    };
    const result = DataSchema.parse(schema, data, 0, null).result;
    return result;
  }

  parseWeaponDefinitionReferenceData(data: Buffer) {
    const inSize = data.readUInt32LE(0),
      outSize = data.readUInt32LE(4),
      compData = data.slice(8);
    data = lz4_decompress(compData, inSize, outSize);
    //fs.writeFileSync("weapondefinitions.dat", data);
    const schema = [
      {
        name: "weaponDefinitions",
        type: "array",
        fields: [
          { name: "weaponId", type: "uint32" },
          { name: "weaponGroupId", type: "uint32" },
          { name: "flags", type: "uint8" },
          { name: "equipTime", type: "uint16" },
          { name: "unequipTime", type: "uint16" },
          { name: "toIronSightsTime", type: "uint16" },
          { name: "fromIronSightsTime", type: "uint16" },
          { name: "toIronSightsAnimTime", type: "uint16" },
          { name: "fromIronSightsAnimTime", type: "uint16" },
          { name: "sprintRecoveryTime", type: "uint16" },
          { name: "nextUseDelayTime", type: "uint32" },
          { name: "turnRateModifier", type: "float" },
          { name: "movementSpeedModifier", type: "float" },
          { name: "heatBleedOffRate", type: "uint16" },
          { name: "overheatPenaltyTime", type: "uint16" },
          { name: "rangeStringId", type: "uint32" },
          { name: "meleeDetectWidth", type: "float" },
          { name: "meleeDetectHeight", type: "float" },
          { name: "animationSetName", type: "string" },
          { name: "vehicleFirstPersonCameraId", type: "uint16" },
          { name: "vehicleThirdPersonCameraId", type: "uint16" },
          { name: "overheatEffectId", type: "uint32" },
          { name: "minPitch", type: "float" },
          { name: "maxPitch", type: "float" },
          { name: "audioGameObjectHash", type: "uint32" },
          {
            name: "ammoSlots",
            type: "array",
            fields: [
              { name: "ammoId", type: "uint32" },
              { name: "clipSize", type: "uint16" },
              { name: "capacity", type: "uint32" },
              { name: "clipAttachmentSlot", type: "uint16" },
              { name: "clipModelName", type: "string" },
              { name: "reloadWeaponBone", type: "string" },
              { name: "reloadCharacterBone", type: "string" },
            ],
          },
          { name: "fireGroups", type: "array", elementType: "uint32" },
          { name: "unknown", type: "uint16" },
        ],
      },
      {
        name: "fireGroups",
        type: "array",
        fields: [
          { name: "fireGroupId", type: "uint32" },
          { name: "fireModes", type: "array", elementType: "uint32" },
          { name: "flags", type: "uint8" },
          { name: "chamberDurationTime", type: "uint16" },
          { name: "imageSetOverride", type: "uint32" },
          { name: "transitionDurationTime", type: "uint16" },
          { name: "animActorSlotOverride", type: "uint8" },
          { name: "deployableId", type: "uint8" },
          { name: "spinUpTime", type: "uint16" },
          { name: "spoolUpTime", type: "uint16" },
          { name: "spoolUpInitialRefireTime", type: "uint16" },
        ],
      },
      {
        name: "fireModes",
        type: "array",
        fields: [
          { name: "fireModeId", type: "uint32" },
          { name: "flags1", type: "uint8" },
          { name: "flags2", type: "uint8" },
          { name: "flags3", type: "uint8" },
          { name: "type", type: "uint8" },
          { name: "ammoItemId", type: "uint32" },
          { name: "ammoSlot", type: "uint8" },
          { name: "burstCount", type: "uint8" },
          { name: "fireDurationTime", type: "uint16" },
          { name: "fireCooldownDurationTime", type: "uint16" },
          { name: "refireTime", type: "uint16" },
          { name: "fireDelayTime", type: "uint16" },
          { name: "autoFireTime", type: "uint16" },
          { name: "chargeUpTime", type: "uint16" },
          { name: "range", type: "float" },
          { name: "ammoPerShot", type: "uint8" },
          { name: "reloadTime", type: "uint16" },
          { name: "reloadChamber", type: "uint16" },
          { name: "reloadAmmoFillTime", type: "uint16" },
          { name: "reloadLoopStartTime", type: "uint16" },
          { name: "reloadLoopEndTime", type: "uint16" },
          { name: "pelletsPerShot", type: "uint8" },
          { name: "pelletSpread", type: "float" },
          { name: "cofRecoil", type: "float" },
          { name: "cofScalar", type: "float" },
          { name: "cofScalarMoving", type: "float" },
          { name: "cofOverride", type: "float" },
          { name: "recoilAngleMin", type: "float" },
          { name: "recoilAngleMax", type: "float" },
          { name: "recoilHorizontalTolerance", type: "float" },
          { name: "recoilHorizontalMin", type: "float" },
          { name: "recoilHorizontalMax", type: "float" },
          { name: "recoilMagnitudeMin", type: "float" },
          { name: "recoilMagnitudeMax", type: "float" },
          { name: "recoilRecoveryDelayTime", type: "uint16" },
          { name: "recoilRecoveryRate", type: "float" },
          { name: "recoilRecoveryAcceleration", type: "float" },
          { name: "recoilShotsAtMinMagnitude", type: "uint8" },
          { name: "recoilMaxTotalMagnitude", type: "float" },
          { name: "recoilIncrease", type: "float" },
          { name: "recoilIncreaseCrouch", type: "float" },
          { name: "recoilFirstShotModifier", type: "float" },
          { name: "unknown19", type: "float" },
          { name: "unknown20", type: "float" },
          { name: "fireDetectRange", type: "uint16" },
          { name: "effectGroup", type: "uint32" },
          { name: "playerStateGroupId", type: "uint32" },
          { name: "movementModifier", type: "float" },
          { name: "turnModifier", type: "float" },
          { name: "unknown23", type: "uint32" },
          { name: "unknown24", type: "uint32" },
          { name: "lockOnAngle", type: "float" },
          { name: "lockOnRadius", type: "float" },
          { name: "lockOnRange", type: "float" },
          { name: "lockOnRangeClose", type: "float" },
          { name: "lockOnRangeFar", type: "float" },
          { name: "lockOnAcquireTime", type: "uint16" },
          { name: "lockOnAcquireTimeClose", type: "uint16" },
          { name: "lockOnAcquireTimeFar", type: "uint16" },
          { name: "lockOnLoseTime", type: "uint16" },
          { name: "defaultZoom", type: "float" },
          { name: "firstPersonOffsetX", type: "float" },
          { name: "firstPersonOffsetY", type: "float" },
          { name: "firstPersonOffsetZ", type: "float" },
          { name: "reticleId", type: "uint32" },
          { name: "unknown36", type: "uint16" },
          { name: "heatThreshold", type: "uint16" },
          { name: "unknown37", type: "uint16" },
          { name: "heatRecoveryDelayTime", type: "uint16" },
          { name: "swayAmplitudeX", type: "float" },
          { name: "swayAmplitudeY", type: "float" },
          { name: "swayPeriodX", type: "float" },
          { name: "swayPeriodY", type: "float" },
          { name: "swayInitialYOffset", type: "float" },
          { name: "armsFovScalar", type: "float" },
          { name: "animKickMagnitude", type: "float" },
          { name: "animRecoilMagnitude", type: "float" },
          { name: "descriptionId", type: "uint32" },
          { name: "indirectEffectId", type: "uint32" },
          { name: "bulletArcKickAngle", type: "float" },
          { name: "projectileSpeedOverride", type: "float" },
          { name: "inheritFromId", type: "uint32" },
          { name: "inheritFromChargePower", type: "float" },
          { name: "unknown49", type: "uint32" },
          { name: "targetRequirement", type: "uint32" },
          { name: "fireAnimDurationTime", type: "uint16" },
          { name: "unknown52", type: "uint8" },
          { name: "unknown53", type: "uint8" },
          { name: "unknown54", type: "uint8" },
          { name: "sequentialFireAnimCount", type: "uint8" },
          { name: "unknown55", type: "uint32" },
        ],
      },
    ];
    try {
      const result = DataSchema.parse(schema, data, 0, null).result;
      return result;
    } catch (e) {}
  }

  parseUpdatePositionClientToZone(data: Buffer, offset: number) {
    return {
      result: parseUpdatePositionData(data, offset),
    };
  }
  parseUpdatePositionRaw(data: Buffer, offset: number) {
    // Temp workaround
    const obj = {} as UpdatePositionObject;
    obj.raw = data;
    return {
      result: obj,
    };
  }

  parseUpdatePositionZoneToClient(data: Buffer, offset: number) {
    const obj = {} as PositionZoneToClient;

    const v = readUnsignedIntWith2bitLengthValue(data, offset);
    obj["unknown1_uint"] = v.value;
    offset += v.length;

    obj["positionData"] = parseUpdatePositionData(data, offset);

    return {
      result: obj,
    };
  }

  pack(packetName: string, object?: any, referenceData?: any) {
    const { H1Z1Packets } = this;
    let packetType: number = H1Z1Packets.PacketTypes[packetName],
      packet = H1Z1Packets.Packets[packetType],
      packetData,
      data,
      packetTypeBytes = [];
    if (packet) {
      while (packetType) {
        packetTypeBytes.unshift(packetType & 0xff);
        packetType = packetType >> 8;
      }
      if (packet.schema) {
        packetData = DataSchema.pack(
          packet.schema,
          object,
          null,
          null,
          referenceData
        );
        if (packetData) {
          data = new (Buffer as any).alloc(
            packetTypeBytes.length + packetData.length
          );
          for (let i = 0; i < packetTypeBytes.length; i++) {
            data.writeUInt8(packetTypeBytes[i], i);
          }
          packetData.data.copy(data, packetTypeBytes.length);
        } else {
          debug("Could not pack data schema for " + packet.name);
        }
      } else {
        debug(packet);
        debug("pack()", "No schema for packet " + packet.name);
      }
    } else {
      debug("pack()", "Unknown or unhandled zone packet type: " + packetType);
    }
    return data;
  }

  parse(data: Buffer, flags: any, fromClient: boolean, referenceData: any) {
    const { H1Z1Packets } = this;
    let opCode = data[0],
      offset = 0,
      packet,
      result;

    /* if (flags) {
      debug("Flags = " + flags);
    }*/

    if (flags === 2) {
      try {
        if (fromClient) {
          packet = {
            name: "PlayerUpdateUpdatePositionClientToZone",
            fn: this.parseUpdatePositionClientToZone,
          };
        } else {
          packet = {
            name: "PlayerUpdateUpdatePositionZoneToClient",
            fn: this.parseUpdatePositionZoneToClient,
          };
        }
      } catch (e) {
        debug(e);
      }
    } else if (flags === 3 && false) {
      // disabled
      try {
        packet = {
          name: "PlayerUpdateUpdatePositionClientToZone",
          fn: this.parseUpdatePositionClientToZone,
        };
      } catch (e) {
        debug(e);
      }
    } else {
      if ((H1Z1Packets as any).Packets[opCode]) {
        packet = (H1Z1Packets as any).Packets[opCode];
        offset = 1;
      } else if (data.length > 1) {
        opCode = (data[0] << 8) + data[1];
        if ((H1Z1Packets as any).Packets[opCode]) {
          packet = (H1Z1Packets as any).Packets[opCode];
          offset = 2;
        } else if (data.length > 2) {
          opCode = (data[0] << 16) + (data[1] << 8) + data[2];
          if ((H1Z1Packets as any).Packets[opCode]) {
            packet = (H1Z1Packets as any).Packets[opCode];
            offset = 3;
          } else if (data.length > 3) {
            opCode =
              (data[0] << 24) + (data[1] << 16) + (data[2] << 8) + data[3];
            if ((H1Z1Packets as any).Packets[opCode]) {
              packet = (H1Z1Packets as any).Packets[opCode];
              offset = 4;
            }
          }
        }
      }
    }

    if (packet) {
      if (packet.schema) {
        if (packet.name != "KeepAlive") {
          debug(packet.name);
        }
        try {
          result = DataSchema.parse(packet.schema, data, offset, referenceData)
            .result;
        } catch (e) {
          debug(e);
        }

        switch (packet.name) {
          case "FacilityBase.ReferenceData":
            result = this.parseFacilityReferenceData((result as any).data);
            break;
          case "ReferenceData.WeaponDefinitions":
            result = this.parseWeaponDefinitionReferenceData(
              (result as any).data
            );
            break;
        }
      } else if (packet.fn) {
        if (packet.name != "PlayerUpdateUpdatePositionClientToZone") {
          debug(packet.name);
        }
        result = packet.fn(data, offset).result;
      } else {
        debug("No schema for packet " + packet.name);
      }

      return {
        name: packet.name,
        data: result,
      };
    } else {
      debug("Unhandled zone packet:", data[0], data[1], data[2]);
      //fs.writeFileSync("zone_failed_" + Date.now() + "_" + Math.random() + ".dat", data);
    }
    /*
          var op =  BasePackets.getName(opCode);
          if (PacketHandlers[op]) {
              result = PacketHandlers[op](data);
          } else {
              debug("Unhandled zone packet:", data[1] & 0x1F, data[1] >> 5, opCode, op);
          }
      */
  }

  reloadPacketDefinitions() {
    const protocolPacketsPath = `../packets/ClientProtocol/${this.protocolName}/h1z1packets.js`;
    delete require.cache[require.resolve(protocolPacketsPath)];
    this.H1Z1Packets = require(protocolPacketsPath);
  }
}

const readSignedIntWith2bitLengthValue = function (
  data: Buffer,
  offset: number
) {
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
};
const readUnsignedIntWith2bitLengthValue = function (
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
};

const parseUpdatePositionData = function (data: Buffer, offset: number) {
  const obj = {} as UpdatePositionObject;
  obj.raw = data;
  try {
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
      obj["lookAt"] = eul2quat([rotationEul[0], 0, 0, 0]);
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
    /*
        if (obj.flags & 0xe0) {

        }
        */
  } catch (e) {
    debug(e);
  }
  return obj;
};
