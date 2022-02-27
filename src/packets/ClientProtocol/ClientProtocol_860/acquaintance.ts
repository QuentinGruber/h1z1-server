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

export const acquaintancePackets: any = [
  [
    "Acquaintance.Add",
    0x2b01,
    {
      fields: [
        { name: "characterId", type: "uint64string", defaultValue: "0x000" },
        { name: "characterName", type: "string", defaultValue: "0" },
        { name: "type", type: "uint32", defaultValue: 0 },
        { name: "elapsedTime", type: "uint64string", defaultValue: "0x000" },
        { name: "isOnline", type: "uint8", defaultValue: 0 },
      ],
    },
  ],
  [
    "Acquaintance.Remove",
    0x2b02,
    {
      fields: [],
    },
  ],
  [
    "Acquaintance.Online",
    0x2b03,
    {
      fields: [
        { name: "characterId", type: "uint64string", defaultValue: "0x000" },
        { name: "isOnline", type: "boolean", defaultValue: 0 },
      ],
    },
  ],
];
