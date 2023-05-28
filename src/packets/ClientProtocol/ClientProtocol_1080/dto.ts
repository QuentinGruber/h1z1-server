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

export const dtoPackets: PacketStructures = [
  [
    "DtoHitReportPacket",
    0xbb0100,
    {
      fields: []
    }
  ],
  [
    "DtoStateChange",
    0xbb0200,
    {
      fields: [
        { name: "objectId", type: "uint32" },
        { name: "modelName", type: "string" },
        { name: "effectId", type: "uint32" },
        { name: "unk3", type: "float", defaultValue: 0 },
        { name: "unk4", type: "boolean" }, // changing this boolean change how the packet is processed
        { name: "unkDword1", type: "uint32", defaultValue: 0 },
        { name: "unk5", type: "boolean", defaultValue: true },
        { name: "unk6", type: "boolean", defaultValue: true },
        { name: "unk7", type: "boolean", defaultValue: true },
        { name: "unk8", type: "boolean", defaultValue: true }
      ]
    }
  ],
  [
    "DtoObjectInitialData",
    0xbb0300,
    {
      fields: [
        { name: "unknownDword1", type: "uint32" },
        {
          name: "unknownArray1",
          type: "array",
          defaultValue: [],
          fields: [
            { name: "objectId", type: "uint32", defaultValue: 0 },
            { name: "unknownString1", type: "string", defaultValue: "0" },
            { name: "unknownDword1", type: "uint32", defaultValue: 0 },
            { name: "unknownBool1", type: "boolean", defaultValue: true },
            { name: "unknownBool2", type: "boolean", defaultValue: true },
            { name: "unknownBool3", type: "boolean", defaultValue: true }
          ]
        },
        {
          name: "unknownArray2",
          type: "array",
          defaultValue: [],
          fields: [
            { name: "unknownDword1", type: "uint32", defaultValue: 0 },
            { name: "unknownDword2", type: "uint32", defaultValue: 0 }
          ]
        }
      ]
    }
  ],
  [
    "DtoHitSpeedTreeReport",
    0xbb0400,
    {
      fields: [
        { name: "id", type: "uint32" },
        { name: "treeId", type: "uint32" },
        { name: "name", type: "string" }
      ]
    }
  ]
];
