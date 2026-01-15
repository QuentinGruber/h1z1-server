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

import { PacketStructures } from "types/packetStructure";

export const targetPackets: PacketStructures = [
  ["Target", 0x7e, {}],
  [
    "Target.Unk7",
    0x7e07,
    {
      fields: [
        { name: "unknownQword1", type: "uint64string", defaultValue: "0" },
        { name: "unknownString1", type: "string", defaultValue: "" },
        { name: "unknownBoolean1", type: "boolean", defaultValue: false }
      ]
    }
  ],
  [
    "Target.Unk8",
    0x7e08,
    {
      fields: [
        { name: "unknownQword1", type: "uint64string", defaultValue: "0" },
        { name: "unknownString1", type: "string", defaultValue: "" },
        { name: "unknownBoolean1", type: "boolean", defaultValue: false }
      ]
    }
  ],
  [
    "Target.Unk9",
    0x7e09,
    {
      fields: [
        { name: "unknownString1", type: "string", defaultValue: "" },
        { name: "unknownBoolean1", type: "boolean", defaultValue: false }
      ]
    }
  ],
  [
    "Target.Unk10",
    0x7e0a,
    {
      fields: [
        { name: "unknownBoolean1", type: "boolean", defaultValue: false }
      ]
    }
  ],
  [
    "Target.Unk11",
    0x7e0b,
    {
      fields: [
        { name: "unknownString1", type: "string", defaultValue: "" },
        { name: "unknownBoolean1", type: "boolean", defaultValue: false }
      ]
    }
  ],
  [
    "Target.Unk12",
    0x7e0c,
    {
      fields: [
        { name: "unknownBoolean1", type: "boolean", defaultValue: false }
      ]
    }
  ]
];
