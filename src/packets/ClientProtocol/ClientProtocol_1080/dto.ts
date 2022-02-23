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

export const dtoPackets: any = [
  [
    "DtoHitReportPacket",
    0xbb0100,
    {
      fields: [],
    },
  ],
  [
    "DtoStateChange",
    0xbb0200,
    {
      fields: [
        { name: "objectId", type: "uint32" },
        { name: "modelName", type: "string" },
        { name: "effectId", type: "uint32" },
        { name: "unk3", type: "float" },
        { name: "unk4", type: "boolean" }, // changing this boolean change how the packet is processed
      ],
    },
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
          ],
        },
        {
          name: "unknownArray2",
          type: "array",
          defaultValue: [],
          fields: [
            { name: "unknownDword1", type: "uint32", defaultValue: 0 },
            { name: "unknownDword2", type: "uint32", defaultValue: 0 },
          ],
        },
      ],
    },
  ],
  [
    "DtoHitSpeedTreeReport",
    0xbb0400,
    {
      fields: [
        { name: "id", type: "uint32" },
        { name: "treeId", type: "uint32" },
        { name: "name", type: "string" },
      ],
    },
  ],
];
