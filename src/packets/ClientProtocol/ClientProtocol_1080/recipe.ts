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
import { recipeData } from "./shared";

export const recipePackets: PacketStructures = [
  ["Recipe.Add", 0x2601, { fields: recipeData }],
  ["Recipe.ComponentUpdate", 0x2602, {}],
  [
    "Recipe.Remove",
    0x2603,
    {
      fields: [
        { name: "recipeId", type: "uint32", defaultValue: 1 },
        { name: "bool", type: "boolean", defaultValue: false }
      ]
    }
  ],
  ["Recipe.Discovery", 0x2604, { fields: [] }],
  [
    "Recipe.List",
    0x2609,
    {
      fields: [
        {
          name: "recipes",
          type: "array",
          defaultValue: [{}],
          fields: recipeData
        }
      ]
    }
  ],
  [
    "Recipe.Add",
    0x2601,
    {
      fields: [
        {
          name: "recipes",
          type: "array",
          defaultValue: [{}],
          fields: recipeData
        }
      ]
    }
  ],
  [
    "Recipe.Discoveries",
    0x2605,
    {
      fields: [
        {
          name: "recipes",
          type: "array",
          defaultValue: [{}],
          fields: [
            { name: "unk", type: "uint32", defaultValue: 0 },
            { name: "recipeId", type: "uint32", defaultValue: 0 },
            { name: "nameId", type: "uint32", defaultValue: 0 },
            { name: "iconId", type: "uint32", defaultValue: 0 },
            { name: "unknownDword1", type: "uint32", defaultValue: 0 },
            { name: "descriptionId", type: "uint32", defaultValue: 0 },
            { name: "unknownDword2", type: "uint32", defaultValue: 0 },
            { name: "bundleCount", type: "uint32", defaultValue: 0 },
            { name: "memberOnly", type: "boolean", defaultValue: false },
            { name: "filterId", type: "uint32", defaultValue: 0 },
            {
              name: "components",
              type: "array",
              defaultValue: [{}],
              fields: [
                { name: "itemDefinitionId", type: "uint32", defaultValue: 0 },
                { name: "nameId", type: "uint32", defaultValue: 0 },
                { name: "iconId", type: "uint32", defaultValue: 0 },
                { name: "unknownDword2", type: "uint32", defaultValue: 0 },
                { name: "descriptionId", type: "uint32", defaultValue: 0 },
                { name: "requiredAmount", type: "uint32", defaultValue: 0 },
                {
                  name: "unknownQword1",
                  type: "uint64string",
                  defaultValue: "0"
                },
                { name: "unknownDword3", type: "uint32", defaultValue: 0 },
                { name: "itemDefinitionId2", type: "uint32", defaultValue: 0 }
              ]
            },
            { name: "itemDefinitionId", type: "uint32", defaultValue: 0 }
          ]
        },
        {
          name: "unkArray1",
          type: "array",
          defaultValue: [{}],
          fields: []
        },
        {
          name: "unkArray2",
          type: "array",
          defaultValue: [{}],
          fields: []
        }
      ]
    }
  ]
];
