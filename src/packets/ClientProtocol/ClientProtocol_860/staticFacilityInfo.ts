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
