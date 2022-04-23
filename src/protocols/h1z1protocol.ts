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

const debug = require("debug")("H1Z1Protocol");
import DataSchema from "h1z1-dataschema";
import { H1z1ProtocolReadingFormat } from "../types/protocols";
import { packUnsignedIntWith2bitLengthValue } from "../packets/ClientProtocol/ClientProtocol_860/shared";
import {
  clearFolderCache,
  eul2quat,
  getPacketTypeBytes,
  lz4_decompress,
} from "../utils/utils";

export interface UpdatePositionObject {
  raw: Buffer;
  flags: any;
  sequenceTime: any; // similar to simestamp, allows us to delay/synchronize this packet
  unknown3_int8: any;
  stance: any; // crouch, stand, and more
  position: any;
  orientation: any; // For PC i believe its related to torso rotation, usefull for rotating all objects like doors
  frontTilt: any;
  sideTilt: any;
  angleChange: any; // sometimes send by PC, but mostly by vehicles
  verticalSpeed: any;
  horizontalSpeed: any;
  unknown12_float: any;
  rotationRaw: any;
  lookAt: any;
  rotation: any;
  direction: any; // send when pressing of the WSAD keys to provide direction for movement
  engineRPM: any;
}

interface PositionZoneToClient {
  unknown1_uint: number;
  positionData: UpdatePositionObject;
}

export class H1Z1Protocol {
  H1Z1Packets: any;
  protocolName: string;
  PlayerUpdateManagedPositionOpcode: number;
  VehicleCollisionOpcode: number;
  VehicleDimissOpcode: any;

  constructor(protocolName = "ClientProtocol_860") {
    this.protocolName = protocolName;
    // Maybe will remove this switch later
    switch (this.protocolName) {
      case "ClientProtocol_860": // normal client from 15 january 2015
        this.H1Z1Packets = require("../packets/ClientProtocol/ClientProtocol_860/h1z1packets");
        this.PlayerUpdateManagedPositionOpcode = 0x90;
        this.VehicleCollisionOpcode = 0xac;
        this.VehicleDimissOpcode = 0x8818;
        break;
      case "ClientProtocol_1080": // normal client from 22 december 2016
        this.H1Z1Packets = require("../packets/ClientProtocol/ClientProtocol_1080/h1z1packets");
        this.PlayerUpdateManagedPositionOpcode = 0x91;
        this.VehicleCollisionOpcode = 0xaa;
        this.VehicleDimissOpcode = 0x8918;
        break;
      default:
        debug(`Protocol ${this.protocolName} unsupported !`);
        process.exit();
    }
  }

  createPositionBroadcast(rawData: Buffer, transientId: number): Buffer {
    const tId = packUnsignedIntWith2bitLengthValue(transientId);
    return Buffer.concat([new Uint8Array([120]), tId, rawData]);
  }

  createPositionBroadcast2016(rawData: Buffer, transientId: number): Buffer {
    const tId = packUnsignedIntWith2bitLengthValue(transientId);
    return Buffer.concat([Buffer.from([0x79]), tId, rawData]); //0x79 = opcode
  }

  createVehiclePositionBroadcast(rawData: Buffer): Buffer {
    return Buffer.concat([new Uint8Array([120]), rawData]);
  }

  createVehiclePositionBroadcast2016(
    rawData: Buffer,
    transientId: number
  ): Buffer {
    const tId = packUnsignedIntWith2bitLengthValue(transientId);
    return Buffer.concat([Buffer.from([0x91]), tId, rawData]); //0x91 = opcode
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
    } catch (e) {
      console.error(e)
    }
  }

  parseUpdatePositionClientToZone(data: Buffer, offset: number) {
    return {
      result: parseUpdatePositionData(data, offset),
    };
  }

  parseUpdatePositionRaw(data: Buffer) {
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

  pack(packetName: string, object?: any, referenceData?: any): Buffer | null {
    const H1Z1Packets = this.H1Z1Packets;
    const packetType: number = H1Z1Packets.PacketTypes[packetName]
    const packet = H1Z1Packets.Packets[packetType]
     let packetData,
      data;
    if (packet) {
      const packetTypeBytes = getPacketTypeBytes(packetType);
      if (packet.schema) {
        try {
          packetData = DataSchema.pack(
            packet.schema,
            object,
            null,
            null,
            referenceData
          );
        } catch (error) {
          console.error(`${packetName} : ${error}`);
        }
        if (packetData) {
          data = new (Buffer as any).alloc(
            packetTypeBytes.length + packetData.length
          );
          for (let i = 0; i < packetTypeBytes.length; i++) {
            data.writeUInt8(packetTypeBytes[i], i);
          }
          packetData.data.copy(data, packetTypeBytes.length);
        } else {
          console.error("Could not pack data schema for " + packet.name);
          return null;
        }
      } else {
        debug(packet);
        console.error("pack()", "No schema for packet " + packet.name);
        return null;
      }
    } else {
      console.error(
        "pack()",
        "Unknown or unhandled zone packet type: " + packetType
      );
      return null;
    }
    return data;
  }

  resolveOpcode(opCode: number, data: Buffer) {
    const H1Z1Packets = this.H1Z1Packets;
    let packet, offset;
    if (H1Z1Packets.Packets[opCode]) {
      packet = H1Z1Packets.Packets[opCode];
      offset = 1;
    } else if (data.length > 1) {
      opCode = (data[0] << 8) + data[1];
      if (H1Z1Packets.Packets[opCode]) {
        packet = H1Z1Packets.Packets[opCode];
        offset = 2;
      } else if (data.length > 2) {
        opCode = (data[0] << 16) + (data[1] << 8) + data[2];
        if (H1Z1Packets.Packets[opCode]) {
          packet = H1Z1Packets.Packets[opCode];
          offset = 3;
        } else if (data.length > 3) {
          opCode = (data[0] << 24) + (data[1] << 16) + (data[2] << 8) + data[3];
          if (H1Z1Packets.Packets[opCode]) {
            packet = H1Z1Packets.Packets[opCode];
            offset = 4;
          }
        }
      }
    }
    return [packet, offset];
  }

  parse(data: Buffer, flag: number, fromClient: boolean, referenceData?: any): H1z1ProtocolReadingFormat | null {
    const H1Z1Packets = this.H1Z1Packets;
    const opCode = data[0]
    let offset = 0,
      packet,
      result;
    switch (flag) {
      case 1: // don't know the purpose of that flag, is used for some logs and exec command
      case 0: {
        {
          [packet, offset] = this.resolveOpcode(opCode, data);
          break;
        }
      }
      case 2: {
        try {
          packet = {
            name: "PlayerUpdateUpdatePositionClientToZone",
            fn: this.parseUpdatePositionClientToZone,
          };
        } catch (e) {
          console.error(e);
        }
        break;
      }
      case 3: {
        switch (opCode) {
          case this.PlayerUpdateManagedPositionOpcode: {
            packet =
              H1Z1Packets.Packets[this.PlayerUpdateManagedPositionOpcode];
            offset = 1;
            break;
          }
          case this.VehicleCollisionOpcode: {
            packet = H1Z1Packets.Packets[this.VehicleCollisionOpcode];
            offset = 1;
            break;
          }
          default: {
            console.error(`unknown packet use flag 3 : ${opCode}`);
            [packet, offset] = this.resolveOpcode(opCode, data);
            break;
          }
        }
        break;
      }
      case 5: {
        packet = H1Z1Packets.Packets[this.VehicleDimissOpcode];
        offset = 2;
        break;
      }
      default:
        console.error(`unknown flag used : ${flag} for packet : ${opCode}`);
        break;
    }
    if (packet) {
      if (packet.schema) {
        if (packet.name != "KeepAlive") {
          debug(packet.name);
        }
        try {
          result = DataSchema.parse(
            packet.schema,
            data,
            offset,
            referenceData
          ).result;
        } catch (e) {
          console.error(`${packet.name} : ${e}`);
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
      return null
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
    const protocolPacketsFolderPath = `../packets/ClientProtocol/${this.protocolName}`;
    clearFolderCache(__dirname, protocolPacketsFolderPath);
    this.H1Z1Packets = require(`${protocolPacketsFolderPath}/h1z1packets.js`);
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

    if (obj.flags & 0x20) {
      obj["orientation"] = data.readFloatLE(offset);
      offset += 4;
    }

    if (obj.flags & 0x40) {
      v = readSignedIntWith2bitLengthValue(data, offset);
      obj["frontTilt"] = v.value / 100;
      offset += v.length;
    }

    if (obj.flags & 0x80) {
      v = readSignedIntWith2bitLengthValue(data, offset);
      obj["sideTilt"] = v.value / 100;
      offset += v.length;
    }

    if (obj.flags & 4) {
      v = readSignedIntWith2bitLengthValue(data, offset);
      obj["angleChange"] = v.value / 100;
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
      obj["rotation"] = eul2quat(rotationEul);
      obj["rotationRaw"] = rotationEul;
      obj["lookAt"] = eul2quat([rotationEul[0], 0, 0, 0]);
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
    /*
            if (obj.flags & 0xe0) {

            }
            */
  } catch (e) {
    debug(e);
  }
  return obj;
};
