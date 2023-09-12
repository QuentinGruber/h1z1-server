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

import { itemSchema } from "./shared";
import { PacketStructures } from "types/packetStructure";

export const accessedCharacterPackets: PacketStructures = [
  [
    "AccessedCharacter.BeginCharacterAccess",
    0xf10100,
    {
      fields: [
        { name: "objectCharacterId", type: "uint64string", defaultValue: "0" },
        { name: "mutatorCharacterId", type: "uint64string", defaultValue: "0" },
        { name: "dontOpenInventory", type: "boolean", defaultValue: false },
        {
          name: "itemsData",
          type: "byteswithlength",
          defaultValue: null,
          fields: [
            {
              name: "items",
              type: "array",
              defaultValue: [],
              fields: [
                {
                  name: "item",
                  type: "schema",
                  defaultValue: {},
                  fields: itemSchema
                },
                { name: "unknownBool1", type: "boolean", defaultValue: false }
              ]
            },
            { name: "unknownDword1", type: "uint32", defaultValue: 0 }
          ]
        }
      ]
    }
  ],
  [
    "AccessedCharacter.EndCharacterAccess",
    0xf10200,
    {
      fields: [{ name: "characterId", type: "uint64string", defaultValue: "0" }]
    }
  ],
  [
    "AccessedCharacter.Unknown1",
    0xf10400,
    {
      fields: [
        { name: "characterId", type: "uint64string", defaultValue: "0" },
        { name: "mutatorCharacterId", type: "uint64string", defaultValue: "0" }
      ]
    }
  ],
  [
    "AccessedCharacter.Unknown2",
    0xf10600,
    {
      fields: [
        { name: "characterId", type: "uint64string", defaultValue: "0" },
        {
          name: "itemsData",
          type: "byteswithlength",
          defaultValue: null,
          fields: [
            {
              name: "items",
              type: "array",
              defaultValue: [],
              fields: [
                {
                  name: "item",
                  type: "schema",
                  defaultValue: {},
                  fields: itemSchema
                },
                { name: "unknownBool1", type: "boolean", defaultValue: false }
              ]
            },
            { name: "unknownDword1", type: "uint32", defaultValue: 0 }
          ]
        }
      ]
    }
  ]
];
