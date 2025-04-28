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

export const characterStatePackets: PacketStructures = [
  [
    "CharacterState.InteractionStart",
    0xd002,
    {
      fields: [
        { name: "characterId", type: "uint64string", defaultValue: "0" },
        { name: "time", type: "uint32", defaultValue: 0 },
        { name: "unknownDword2", type: "uint32", defaultValue: 0 },
        { name: "unknownQword1", type: "uint64string", defaultValue: "0x0" },
        { name: "unknownQword2", type: "uint64string", defaultValue: "0x0" },
        { name: "unknownDword3", type: "uint32", defaultValue: 0 },
        { name: "stringId", type: "uint32", defaultValue: 0 },
        { name: "animationId", type: "uint32", defaultValue: 0 },
        { name: "unknownDword6", type: "uint32", defaultValue: 0 },
        { name: "unknownDword7", type: "uint32", defaultValue: 0 },
        { name: "unknownDword8", type: "uint32", defaultValue: 0 },
        { name: "unknownDword9", type: "uint32", defaultValue: 0 },
        { name: "UseOptionItemId", type: "string", defaultValue: "" },
        { name: "useOptionString", type: "string", defaultValue: "" }
      ]
    }
  ],
  [
    "CharacterState.InteractionStop",
    0xd003,
    {
      fields: [{ name: "characterId", type: "uint64string", defaultValue: "0" }]
    }
  ]
];
