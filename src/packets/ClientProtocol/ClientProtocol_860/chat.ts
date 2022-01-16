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

export const chatPackets: any = [
  [
    "Chat.Chat",
    0x060100,
    {
      fields: [
        { name: "unknown2", type: "uint16", defaultValue: 0 },
        { name: "channel", type: "uint16", defaultValue: 0 },
        { name: "characterId1", type: "uint64string", defaultValue: "0" },
        { name: "characterId2", type: "uint64string", defaultValue: "0" },
        { name: "unknown5_0", type: "uint32", defaultValue: 0 },
        { name: "unknown5_1", type: "uint32", defaultValue: 0 },
        { name: "unknown5_2", type: "uint32", defaultValue: 0 },
        { name: "characterName1", type: "string", defaultValue: "" },
        { name: "unknown5_3", type: "string", defaultValue: "" },
        { name: "unknown6_0", type: "uint32", defaultValue: 0 },
        { name: "unknown6_1", type: "uint32", defaultValue: 0 },
        { name: "unknown6_2", type: "uint32", defaultValue: 0 },
        { name: "characterName2", type: "string", defaultValue: "" },
        { name: "unknown6_3", type: "string", defaultValue: "" },
        { name: "message", type: "string", defaultValue: "" },
        { name: "position", type: "floatvector4", defaultValue: [0, 0, 0, 0] },
        { name: "unknownGuid", type: "uint64string", defaultValue: "0" },
        { name: "unknown13", type: "uint32", defaultValue: 0 },
        { name: "color1", type: "uint32", defaultValue: 0 },
        { name: "color2", type: "uint32", defaultValue: 0 },
        { name: "unknown15", type: "uint8", defaultValue: 0 },
        { name: "unknown16", type: "boolean", defaultValue: false },
      ],
    },
  ],
  ["Chat.EnterArea", 0x060200, {}],
  ["Chat.DebugChat", 0x060300, {}],
  ["Chat.FromStringId", 0x060400, {}],
  ["Chat.TellEcho", 0x060500, {}],
  [
    "Chat.ChatText",
    0x060600,
    {
      fields: [
        { name: "message", type: "string", defaultValue: "" },
        { name: "unknownDword1", type: "uint32", defaultValue: 0 },
        { name: "color", type: "bytes", length: 4 },
        { name: "unknownDword2", type: "uint32", defaultValue: 0 },
        { name: "unknownByte3", type: "uint8", defaultValue: 0 },
        { name: "unknownByte4", type: "uint8", defaultValue: 0 },
      ],
    },
  ],
];
