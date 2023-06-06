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
import { PacketStructures } from "types/packetStructure";

export const facilityPackets: PacketStructures = [
  [
    "Facility.ReferenceData",
    0x8501,
    {
      fields: [{ name: "data", type: "byteswithlength" }]
    }
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
            { name: "unknown8_bytes", type: "bytes", length: 36 }
          ]
        }
      ]
    }
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
        let n, i, values;

        result["facilityId"] = data.readUInt32LE(offset);
        const flags = data.readUInt16LE(offset + 4);
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
            data.readUInt32LE(offset + 4)
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
    }
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
        { name: "unknown3", type: "uint32", defaultValue: 0 }
      ]
    }
  ],
  ["Facility.NotificationFacilitySecondaryObjectiveEventPacket", 0x8513, {}],
  ["Facility.PenetrateShieldEffect", 0x8514, {}],
  ["Facility.SpawnUpdateGuid", 0x8515, {}],
  ["Facility.FacilityUpdateRequest", 0x8516, {}],
  ["Facility.EmpireScoreValueUpdate", 0x8517, {}]
];
