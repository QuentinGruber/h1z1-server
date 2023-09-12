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

export const staticFacilityInfoPackets: PacketStructures = [
  ["StaticFacilityInfo.Request", 0xbe01, {}],
  ["StaticFacilityInfo.Reply", 0xbe02, {}],
  [
    "StaticFacilityInfo.AllZones",
    0xbe03,
    {
      fields: [
        {
          name: "facilities",
          type: "array",
          defaultValue: [{}],
          fields: [
            { name: "zoneId", type: "uint32", defaultValue: 0 },
            { name: "facilityId", type: "uint32", defaultValue: 0 },
            { name: "nameId", type: "uint32", defaultValue: 0 },
            { name: "facilityType", type: "uint8", defaultValue: 0 },
            { name: "locationX", type: "float", defaultValue: 0.0 },
            { name: "locationY", type: "float", defaultValue: 0.0 },
            { name: "locationZ", type: "float", defaultValue: 0.0 }
          ]
        }
      ]
    }
  ],
  ["StaticFacilityInfo.ReplyWarpgate", 0xbe04, {}],
  ["StaticFacilityInfo.AllWarpgateRespawns", 0xbe05, {}]
];
