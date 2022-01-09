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

import { lootItemSchema } from "./shared";

export const lootPackets: any = [
  [
    "Loot.Reply",
    0x6901,
    {
      fields: [
        {
          name: "items",
          type: "array",
          defaultValue: [],
          fields: [...lootItemSchema],
        },
      ],
    },
  ],
  ["Loot.Request", 0x6902, {}],
  ["Loot.DiscardRequest", 0x6903, {}],
  ["Loot.LootAllRequest", 0x6904, {}],
];
