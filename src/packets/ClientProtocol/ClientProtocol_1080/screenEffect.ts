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

export const screenEffectPackets: PacketStructures = [
  [
    "ScreenEffect.ApplyScreenEffect",
    0xe20100,
    {
      fields: [
        { name: "unknownDword1", type: "uint32", defaultValue: 1662315644 },
        { name: "effectId", type: "uint32", defaultValue: 25 },
        { name: "unknownDword3", type: "uint32", defaultValue: 1 },
        { name: "unknownDword4", type: "uint32", defaultValue: 4294967295 },
        { name: "unknownDword5", type: "uint32", defaultValue: 10 },
        { name: "unknownDword6", type: "float", defaultValue: 0 },
        { name: "unknownDword7", type: "uint32", defaultValue: 0 },
        { name: "string1", type: "string", defaultValue: "" },
        { name: "unknownDword8", type: "uint32", defaultValue: 0 },
        { name: "string2", type: "string", defaultValue: "" },
        { name: "unknownDword9", type: "uint32", defaultValue: 0 },
        {
          name: "colorGradingFilename",
          type: "string",
          defaultValue: "colorkey_blackandwhite.tga"
        },
        { name: "colorGrading", type: "float", defaultValue: 1 },
        { name: "unknownDword11", type: "uint32", defaultValue: 0 },
        { name: "unknownDword12", type: "uint32", defaultValue: 1 },
        { name: "unknownDword13", type: "float", defaultValue: 0 },
        { name: "unknownDword14", type: "float", defaultValue: 0 },
        { name: "unknownDword15", type: "uint32", defaultValue: 0 },
        { name: "unknownDword16", type: "uint32", defaultValue: 0 },
        { name: "unknownDword17", type: "float", defaultValue: 0 },
        { name: "unknownDword18", type: "float", defaultValue: 0 },
        { name: "unknownDword19", type: "uint32", defaultValue: 0 },
        { name: "unknownDword20", type: "uint32", defaultValue: 0 },
        { name: "unknownDword21", type: "uint32", defaultValue: 0 }
      ]
    }
  ],
  [
    "ScreenEffectBase.RemoveScreenEffect",
    0xe20200,
    {
      fields: [
        { name: "unknownDword1", type: "uint32", defaultValue: 1670000696 },
        { name: "effectId", type: "uint32", defaultValue: 25 },
        { name: "unknownDword3", type: "uint32", defaultValue: 1 }
      ]
    }
  ]
];
