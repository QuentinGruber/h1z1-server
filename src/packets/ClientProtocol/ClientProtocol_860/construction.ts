


export const constructionPackets:any = [
    ["Construction.PlacementRequest", 0xcc01, { fields: [] }],
    [
      "Construction.PlacementResponse",
      0xcc02,
      {
        fields: [
          { name: "Unknown2", type: "boolean", defaultValue: 0 },
          { name: "Unknown3", type: "uint32", defaultValue: 0 },
          { name: "model", type: "uint32", defaultValue: 55 },
        ],
      },
    ],
    [
      "Construction.PlacementFinalizeRequest",
      0xcc03,
      {
        fields: [
          { name: "position", type: "floatvector3", defaultValue: [0, 0, 0] },
          { name: "rotation", type: "floatvector3", defaultValue: [0, 0, 0] },
        ],
      },
    ],
    [
      "Construction.PlacementFinalizeResponse",
      0xcc04,
      { fields: [{ name: "status", type: "boolean", defaultValue: 1 }] },
    ],

]