


export const mapRegionPackets:any = [

    [
        "MapRegion.GlobalData",
        0xa301,
        {
          fields: [
            { name: "unknown1", type: "float", defaultValue: 0.0 },
            { name: "unknown2", type: "float", defaultValue: 0.0 },
          ],
        },
      ],
      [
        "MapRegion.Data",
        0xa302,
        {
          fields: [
            { name: "unknown1", type: "float", defaultValue: 0.0 },
            { name: "unknown2", type: "uint32", defaultValue: 0 },
            {
              name: "regions",
              type: "array",
              defaultValue: [],
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
                  defaultValue: [],
                  fields: [
                    { name: "x", type: "int32", defaultValue: 0 },
                    { name: "y", type: "int32", defaultValue: 0 },
                    { name: "type", type: "uint32", defaultValue: 0 },
                  ],
                },
                { name: "flags", type: "uint8", defaultValue: 0 },
                {
                  name: "unknown4",
                  type: "array",
                  defaultValue: [],
                  elementType: "uint8",
                },
                {
                  name: "unknown5",
                  type: "array",
                  defaultValue: [],
                  elementType: "uint8",
                },
                {
                  name: "unknown6",
                  type: "array",
                  defaultValue: [],
                  elementType: "uint8",
                },
                { name: "connectionFacilityId", type: "uint32", defaultValue: 0 },
              ],
            },
          ],
        },
      ],
      ["MapRegion.ExternalData", 0xa303, {}],
      ["MapRegion.Update", 0xa304, {}],
      ["MapRegion.UpdateAll", 0xa305, {}],
      [
        "MapRegion.MapOutOfBounds",
        0xa306,
        {
          fields: [
            { name: "characterId", type: "uint64string", defaultValue: "0" },
            { name: "unknownDword1", type: "uint32", defaultValue: 0 },
            { name: "unknownByte2", type: "uint8", defaultValue: 0 },
          ],
        },
      ],
      ["MapRegion.Population", 0xa307, {}],
      [
        "MapRegion.RequestContinentData",
        0xa308,
        {
          fields: [{ name: "zoneId", type: "uint32", defaultValue: 0 }],
        },
      ],
      ["MapRegion.InfoRequest", 0xa309, {}],
      ["MapRegion.InfoReply", 0xa30a, {}],
      ["MapRegion.ExternalFacilityData", 0xa30b, {}],
      ["MapRegion.ExternalFacilityUpdate", 0xa30c, {}],
      ["MapRegion.ExternalFacilityUpdateAll", 0xa30d, {}],
      ["MapRegion.ExternalFacilityEmpireScoreUpdate", 0xa30e, {}],
      ["MapRegion.NextTick", 0xa30f, {}],
      ["MapRegion.HexActivityUpdate", 0xa310, {}],
      ["MapRegion.ConquerFactionUpdate", 0xa311, {}],
]