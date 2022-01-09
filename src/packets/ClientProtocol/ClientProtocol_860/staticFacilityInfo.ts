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

export const staticFacilityInfoPackets: any = [
  ["StaticFacilityInfo.Request", 0xc101, {}],
  ["StaticFacilityInfo.Reply", 0xc102, {}],
  [
    "StaticFacilityInfo.AllZones",
    0xc103,
    {
      fields: [
        {
          name: "facilities",
          type: "array",
          defaultValue: [],
          fields: [
            { name: "zoneId", type: "uint32", defaultValue: 0 },
            { name: "facilityId", type: "uint32", defaultValue: 0 },
            { name: "nameId", type: "uint32", defaultValue: 0 },
            { name: "facilityType", type: "uint8", defaultValue: 0 },
            { name: "locationX", type: "float", defaultValue: 0.0 },
            { name: "locationY", type: "float", defaultValue: 0.0 },
            { name: "locationZ", type: "float", defaultValue: 0.0 },
          ],
        },
      ],
    },
  ],
  ["StaticFacilityInfo.ReplyWarpgate", 0xc104, {}],
  ["StaticFacilityInfo.AllWarpgateRespawns", 0xc105, {}],
];
