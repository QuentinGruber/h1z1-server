// ======================================================================
//
//   GNU GENERAL PUBLIC LICENSE
//   Version 3, 29 June 2007
//   copyright (C) 2020 - 2021 Quentin Gruber
//   copyright (C) 2021 - 2025 H1emu community
//
//   https://github.com/QuentinGruber/h1z1-server
//   https://www.npmjs.com/package/h1z1-server
//
//   Based on https://github.com/psemu/soe-network
// ======================================================================

import { effectTagsSchema } from "./shared";
import { PacketStructures } from "types/packetStructure";

export const effectsPackets: PacketStructures = [
  [
    "Effect.AddEffect",
    0x9f01,
    {
      fields: [
        {
          name: "effectData",
          type: "schema",
          fields: [
            { name: "unknownDword1", type: "uint32", defaultValue: 0 },
            { name: "abilityEffectId1", type: "uint32", defaultValue: 0 },
            { name: "abilityEffectId2", type: "uint32", defaultValue: 0 }
          ]
        },
        {
          name: "unknownData2",
          type: "schema",
          fields: [
            { name: "unknownQword1", type: "uint64string", defaultValue: "0" },
            { name: "unknownQword2", type: "uint64string", defaultValue: "0" }
          ]
        },
        {
          name: "targetData",
          type: "schema",
          fields: [
            { name: "unknownQword1", type: "uint64string", defaultValue: "0" },
            {
              name: "targetCharacterId",
              type: "uint64string",
              defaultValue: "0"
            },
            {
              name: "position",
              type: "floatvector4",
              defaultValue: [0, 0, 0, 0]
            }
          ]
        }
      ]
    }
  ],
  [
    "Effect.UpdateEffect",
    0x9f02,
    {
      fields: [
        {
          name: "effectData",
          type: "schema",
          fields: [
            { name: "unknownDword1", type: "uint32", defaultValue: 0 },
            { name: "abilityEffectId1", type: "uint32", defaultValue: 0 },
            { name: "abilityEffectId2", type: "uint32", defaultValue: 0 }
          ]
        },
        {
          name: "unknownData2",
          type: "schema",
          fields: [
            { name: "unknownDword1", type: "uint32", defaultValue: 0 },
            { name: "unknownQword1", type: "uint64string", defaultValue: "0" }
          ]
        },
        {
          name: "targetData",
          type: "schema",
          fields: [
            { name: "unknownQword1", type: "uint64string", defaultValue: "0" },
            {
              name: "targetCharacterId",
              type: "uint64string",
              defaultValue: "0"
            },
            {
              name: "position",
              type: "floatvector4",
              defaultValue: [0, 0, 0, 0]
            }
          ]
        }
      ]
    }
  ],
  [
    "Effect.RemoveEffect",
    0x9f03,
    {
      fields: [
        {
          name: "abilityEffectData",
          type: "schema",
          fields: [
            { name: "unknownDword1", type: "uint32", defaultValue: 0 },
            { name: "abilityEffectId1", type: "uint32", defaultValue: 0 },
            { name: "abilityEffectId2", type: "uint32", defaultValue: 0 }
          ]
        },
        {
          name: "targetCharacterData",
          type: "schema",
          fields: [
            { name: "characterId", type: "uint64string", defaultValue: "0" }
          ]
        },
        {
          name: "targetCharacterId",
          type: "uint64string",
          defaultValue: "0"
        },
        {
          name: "guid2",
          type: "uint64string",
          defaultValue: "0"
        },
        {
          name: "unknownVector1",
          type: "floatvector4",
          defaultValue: [0, 0, 0, 0]
        }
      ]
    }
  ],
  [
    "Effect.AddEffectTag",
    0x9f04,
    {
      fields: effectTagsSchema
    }
  ],
  [
    "Effect.RemoveUiIndicators",
    0x9f05,
    {
      fields: [
        {
          name: "unknownData1",
          type: "schema",
          fields: [
            { name: "unknownQword1", type: "uint64string", defaultValue: "0" }
          ]
        },
        {
          name: "unknownData2",
          type: "schema",
          fields: [
            { name: "unknownDword1", type: "uint32", defaultValue: 0 },
            { name: "unknownQword1", type: "uint64string", defaultValue: "0" },
            { name: "unknownQword2", type: "uint64string", defaultValue: "0" }
          ]
        }
      ]
    }
  ],
  [
    "Effect.AddUiIndicator",
    0x9f06,
    {
      fields: [
        { name: "characterId", type: "uint64string", defaultValue: "0x0" },
        { name: "hudElementGuid", type: "uint64string", defaultValue: "0x0" },
        { name: "unknownDword1", type: "uint32", defaultValue: 1 },
        {
          name: "unknownData1",
          type: "schema",
          fields: [
            { name: "hudElementId", type: "uint32", defaultValue: 0 },
            { name: "unknownDword2", type: "uint32", defaultValue: 0 },
            { name: "unknownDword3", type: "uint32", defaultValue: 0 }
          ]
        },
        {
          name: "hudElementData",
          type: "schema",
          fields: [
            { name: "nameId", type: "uint32", defaultValue: 5 },
            { name: "descriptionId", type: "uint32", defaultValue: 6 },
            { name: "imageSetId", type: "uint32", defaultValue: 7 }
          ]
        },
        {
          name: "unknownData3",
          type: "schema",
          fields: [
            { name: "unknownGuid1", type: "uint64string", defaultValue: "0x0" },
            { name: "unknownDword1", type: "uint32", defaultValue: 0 },
            { name: "unknownGuid2", type: "uint64string", defaultValue: "0x0" }
          ]
        },
        {
          name: "unknownData4",
          type: "schema",
          fields: [
            {
              name: "targetCharacterId",
              type: "uint64string",
              defaultValue: "0"
            },
            {
              name: "unknownQword2",
              type: "uint64string",
              defaultValue: "0x0"
            },
            {
              name: "unknownVector1",
              type: "floatvector4",
              defaultValue: [0, 0, 0, 0]
            }
          ]
        },
        {
          name: "unknownData5",
          type: "schema",
          fields: [
            { name: "unknownDword1", type: "uint32", defaultValue: 1 },
            { name: "unknownDword2", type: "uint32", defaultValue: 2 },
            { name: "unknownDword3", type: "uint32", defaultValue: 3 }
          ]
        },
        { name: "unknownDword2", type: "uint32", defaultValue: 4 },
        { name: "unknownByte1", type: "uint8", defaultValue: 128 }
      ]
    }
  ]
];
