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

import { recipeData } from "./shared";

export const recipePackets: any = [
  ["Recipe.Add", 0x2601, { fields: recipeData }],
  ["Recipe.ComponentUpdate", 0x2602, {}],
  ["Recipe.Remove", 0x2603, {}],
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
          fields: recipeData,
        },
      ],
    },
  ],
];
