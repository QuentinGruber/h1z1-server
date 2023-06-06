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

export const constructionPackets: PacketStructures = [
  [
    "Construction.PlacementRequest",
    0xca0100,
    {
      fields: [{ name: "itemDefinitionId", type: "uint32", defaultValue: 0 }]
    }
  ],
  [
    "Construction.PlacementResponse",
    0xca0200,
    {
      fields: [
        { name: "itemDefinitionId", type: "uint32", defaultValue: 0 },
        { name: "model", type: "uint32", defaultValue: 55 }
      ]
    }
  ],
  [
    "Construction.PlacementFinalizeRequest",
    0xca0300,
    {
      fields: [
        { name: "itemDefinitionId", type: "uint32", defaultValue: 0 },
        { name: "position", type: "floatvector4", defaultValue: [0, 0, 0, 0] },
        { name: "scale", type: "floatvector4", defaultValue: [0, 0, 0, 0] },
        {
          name: "parentObjectCharacterId",
          type: "uint64string",
          defaultValue: ""
        },
        { name: "BuildingSlot", type: "string", defaultValue: "" },
        { name: "unkByte1", type: "uint8", defaultValue: 0 },
        { name: "unk1", type: "float", defaultValue: 0 },
        { name: "rotation1", type: "floatvector4", defaultValue: [0, 0, 0, 0] },
        { name: "rotation2", type: "floatvector4", defaultValue: [0, 0, 0, 0] },
        { name: "rotation3", type: "floatvector4", defaultValue: [0, 0, 0, 0] },
        { name: "unk6", type: "float", defaultValue: 0 },
        { name: "position2", type: "floatvector4", defaultValue: [0, 0, 0, 0] }
      ]
    }
  ],
  [
    "Construction.PlacementFinalizeResponse",
    0xca0400,
    {
      fields: [
        { name: "status", type: "boolean", defaultValue: 1 },
        { name: "unknownString1", type: "string", defaultValue: "" }
      ]
    }
  ],
  [
    "Construction.Unknown",
    0xca0500,
    {
      fields: [
        {
          name: "unknownArray1",
          type: "array",
          defaultValue: [],
          fields: [{ name: "unknownDword1", type: "uint32", defaultValue: 0 }]
        },
        {
          name: "unknownArray2",
          type: "array",
          defaultValue: [],
          fields: [{ name: "unknownDword1", type: "uint32", defaultValue: 0 }]
        }
      ]
    }
  ]
];
