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

export const facilityPackets: any = [
  [
    "Facility.ReferenceData",
    0x8401,
    {
      fields: [{ name: "data", type: "byteswithlength" }],
    },
  ],
  [
    "Facility.FacilityData",
    0x8402,
    {
      fields: [
        {
          name: "facilities",
          type: "array",
          defaultValue: [],
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
  ["Facility.CurrentFacilityUpdate", 0x8403, {}],
  ["Facility.SpawnDataRequest", 0x8404, {}],
  ["Facility.FacilitySpawnData", 0x8405, {}],
  [
    "Facility.FacilityUpdate",
    0x8406,
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
  ["Facility.FacilitySpawnStatus", 0x8407, {}],
  ["Facility.FacilitySpawnStatusTracked", 0x8408, {}],
  ["Facility.NotificationFacilityCaptured", 0x8409, {}],
  ["Facility.NotificationFacilitySignificantCaptureProgress", 0x840a, {}],
  ["Facility.NotificationFacilityCloseToCapture", 0x840b, {}],
  ["Facility.NotificationFacilitySpawnBeginCapture", 0x840c, {}],
  ["Facility.NotificationFacilitySpawnFinishCapture", 0x840d, {}],
  ["Facility.NotificationLeavingFacilityDuringContention", 0x840e, {}],
  [
    "Facility.ProximitySpawnCaptureUpdate",
    0x840f,
    {
      fields: [
        { name: "unknownBoolean1", type: "boolean", defaultValue: false },
        { name: "unknownBoolean2", type: "boolean", defaultValue: false },
        { name: "unknown1", type: "uint16", defaultValue: 0 },
        { name: "unknownBoolean3", type: "boolean", defaultValue: false },
        { name: "unknownBoolean4", type: "boolean", defaultValue: false },
        { name: "unknownBoolean5", type: "boolean", defaultValue: false },
        { name: "unknownBoolean6", type: "boolean", defaultValue: false },
      ],
    },
  ],
  ["Facility.ClearProximitySpawn", 0x8410, {}],
  ["Facility.GridStabilizeTimerUpdated", 0x8411, {}],
  [
    "Facility.SpawnCollisionChanged",
    0x8412,
    {
      fields: [
        { name: "unknown1", type: "uint32", defaultValue: 0 },
        { name: "unknown2", type: "boolean", defaultValue: false },
        { name: "unknown3", type: "uint32", defaultValue: 0 },
      ],
    },
  ],
  ["Facility.NotificationFacilitySecondaryObjectiveEventPacket", 0x8413, {}],
  ["Facility.PenetrateShieldEffect", 0x8414, {}],
  ["Facility.SpawnUpdateGuid", 0x8415, {}],
  ["Facility.FacilityUpdateRequest", 0x8416, {}],
  ["Facility.EmpireScoreValueUpdate", 0x8417, {}],
];
