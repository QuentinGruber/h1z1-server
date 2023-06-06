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

export const mapRegionPackets: PacketStructures = [
  [
    "MapRegion.GlobalData",
    0xa401,
    {
      fields: [
        { name: "unknown1", type: "float", defaultValue: 0.0 },
        { name: "unknown2", type: "float", defaultValue: 0.0 }
      ]
    }
  ],
  [
    "MapRegion.Data",
    0xa402,
    {
      fields: [
        { name: "unknown1", type: "float", defaultValue: 0.0 },
        { name: "unknown2", type: "uint32", defaultValue: 0 },
        {
          name: "regions",
          type: "array",
          defaultValue: [{}],
          fields: [
            { name: "regionId", type: "uint32", defaultValue: 0 },
            { name: "regionId2", type: "uint32", defaultValue: 0 },
            { name: "nameId", type: "uint32", defaultValue: 0 },
            { name: "facilityId", type: "uint32", defaultValue: 0 },
            { name: "facilityType", type: "uint8", defaultValue: 0 },
            { name: "currencyId", type: "uint8", defaultValue: 0 },
            { name: "ownerFactionId", type: "uint8", defaultValue: 0 },
            {
              name: "hexes",
              type: "array",
              defaultValue: [{}],
              fields: [
                { name: "x", type: "int32", defaultValue: 0 },
                { name: "y", type: "int32", defaultValue: 0 },
                { name: "type", type: "uint32", defaultValue: 0 }
              ]
            },
            { name: "flags", type: "uint8", defaultValue: 0 },
            {
              name: "unknown4",
              type: "array",
              defaultValue: [{}],
              elementType: "uint8"
            },
            {
              name: "unknown5",
              type: "array",
              defaultValue: [{}],
              elementType: "uint8"
            },
            {
              name: "unknown6",
              type: "array",
              defaultValue: [{}],
              elementType: "uint8"
            },
            { name: "connectionFacilityId", type: "uint32", defaultValue: 0 }
          ]
        }
      ]
    }
  ],
  ["MapRegion.ExternalData", 0xa403, {}],
  ["MapRegion.Update", 0xa404, {}],
  ["MapRegion.UpdateAll", 0xa405, {}],
  [
    "MapRegion.MapOutOfBounds",
    0xa406,
    {
      fields: [
        { name: "characterId", type: "uint64string", defaultValue: "0" },
        { name: "unknownDword1", type: "uint32", defaultValue: 0 },
        { name: "unknownByte2", type: "uint8", defaultValue: 0 }
      ]
    }
  ],
  ["MapRegion.Population", 0xa407, {}],
  [
    "MapRegion.RequestContinentData",
    0xa408,
    {
      fields: [{ name: "zoneId", type: "uint32", defaultValue: 0 }]
    }
  ],
  ["MapRegion.InfoRequest", 0xa409, {}],
  ["MapRegion.InfoReply", 0xa40a, {}],
  ["MapRegion.ExternalFacilityData", 0xa40b, {}],
  ["MapRegion.ExternalFacilityUpdate", 0xa40c, {}],
  ["MapRegion.ExternalFacilityUpdateAll", 0xa40d, {}],
  ["MapRegion.ExternalFacilityEmpireScoreUpdate", 0xa40e, {}],
  ["MapRegion.NextTick", 0xa40f, {}],
  ["MapRegion.HexActivityUpdate", 0xa410, {}],
  ["MapRegion.ConquerFactionUpdate", 0xa411, {}]
];
