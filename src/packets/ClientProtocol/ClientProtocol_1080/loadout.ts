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
import { loadoutSlotData, loadoutSlotsSchema } from "./shared";

export const loadoutPackets: PacketStructures = [
  [
    "Loadout.SelectLoadout",
    0x8702,
    {
      fields: [{ name: "loadoutId", type: "uint32", defaultValue: 0 }]
    }
  ],

  [
    "Loadout.Unk1",
    0x8703,
    {
      fields: [
        { name: "characterId", type: "uint64string", defaultValue: "0" },
        { name: "loadoutSlotId", type: "uint32", defaultValue: 0 }
      ]
    }
  ],
  [
    "Loadout.SetLoadoutSlots",
    0x8704,
    {
      fields: [
        { name: "characterId", type: "uint64string", defaultValue: "0" },
        ...loadoutSlotsSchema
      ]
    }
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
          fields: loadoutSlotData
        },
        { name: "currentSlotId", type: "uint32", defaultValue: 0 }
      ]
    }
  ],
  [
    "Loadout.SelectSlot",
    0x8706,
    {
      fields: [
        { name: "unknownDword1", type: "uint32", defaultValue: 0 },
        { name: "slotId", type: "uint32", defaultValue: 0 },
        { name: "unknownDword2", type: "uint32", defaultValue: 0 }
      ]
    }
  ],
  [
    "Loadout.CreateCustomLoadout",
    0x8707,
    {
      fields: [
        { name: "slotId", type: "uint32", defaultValue: 0 },
        { name: "loadoutId", type: "uint32", defaultValue: 0 }
      ]
    }
  ]
];
