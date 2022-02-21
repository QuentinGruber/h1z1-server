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

import { loadoutSlotsSchema } from "./shared";

export const loadoutPackets: any = [
  [
    "Loadout.SelectLoadout",
    0x8702,
    {
      fields: [{ name: "loadoutSlotId", type: "uint32", defaultValue: 0 }],
    },
  ],

  [
    "Loadout.SetCurrentLoadout",
    0x8703,
    {
      fields: [
        { name: "characterId", type: "uint64string", defaultValue: "0" },
        { name: "loadoutSlotId", type: "uint32", defaultValue: 0 },
      ],
    },
  ],
  [
    "Loadout.SetLoadoutSlots",
    0x8704,
    {
      fields: [
        { name: "characterId", type: "uint64string", defaultValue: "0" },
        ...loadoutSlotsSchema,
      ],
    },
  ],
  [
    "Loadout.SetLoadoutSlot",
    0x8705,
    {
      fields: [
        { name: "characterId", type: "uint64string", defaultValue: "0" },
        {
          name: "loadoutSlot",
          type: "schema",
          defaultValue: {},
          fields: [
            { name: "itemDefinitionId", type: "uint32", defaultValue: 0 },
            { name: "slotId", type: "uint32", defaultValue: 0 },
            {
              name: "unknownData1",
              type: "schema",
              fields: [
                { name: "itemDefinitionId", type: "uint32", defaultValue: 0 },
                {
                  name: "loadoutItemGuid",
                  type: "uint64string",
                  defaultValue: "0",
                },
                { name: "unknownByte1", type: "uint8", defaultValue: 0 },
              ],
            },
            { name: "unknownDword1", type: "uint32", defaultValue: 0 },
          ],
        },
        { name: "unknownDword1", type: "uint32", defaultValue: 0 },
      ],
    },
  ],
  [
    "Loadout.CreateCustomLoadout",
    0x8707,
    {
      fields: [
        { name: "slotId", type: "uint32", defaultValue: 0 },
        { name: "loadoutId", type: "uint32", defaultValue: 0 },
      ],
    },
  ],
];
