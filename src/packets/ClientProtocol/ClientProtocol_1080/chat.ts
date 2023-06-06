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

import { identitySchema } from "./shared";
import { PacketStructures } from "types/packetStructure";

export const chatPackets: PacketStructures = [
  [
    "Chat.Chat",
    0x060100,
    {
      fields: [
        { name: "unknownWord1", type: "uint16", defaultValue: 0 },
        { name: "channel", type: "uint16", defaultValue: 0 },
        { name: "characterId1", type: "uint64string", defaultValue: "0" },
        { name: "characterId2", type: "uint64string", defaultValue: "0" },
        { name: "identity1", type: "schema", fields: identitySchema },
        { name: "identity2", type: "schema", fields: identitySchema },
        { name: "message", type: "string", defaultValue: "" },
        { name: "position", type: "floatvector4", defaultValue: [0, 0, 0, 0] },
        { name: "unknownGuid1", type: "uint64string", defaultValue: "0" },
        { name: "unknownDword1", type: "uint32", defaultValue: 0 },
        { name: "color1", type: "uint32", defaultValue: 0 },
        { name: "color2", type: "uint32", defaultValue: 0 },
        { name: "unknownByte1", type: "uint8", defaultValue: 0 },
        { name: "unknownBoolean1", type: "boolean", defaultValue: false }
      ]
    }
  ],
  ["Chat.EnterArea", 0x060200, {}],
  ["Chat.DebugChat", 0x060300, {}],
  ["Chat.FromStringId", 0x060400, {}],
  //["Chat.TellEcho", 0x060500, {}],
  [
    "Chat.ChatText",
    0x060500,
    {
      fields: [
        { name: "message", type: "string", defaultValue: "" },
        { name: "unknownDword1", type: "uint32", defaultValue: 0 },
        { name: "color", type: "bytes", length: 4 },
        { name: "unknownDword2", type: "uint32", defaultValue: 0 },
        { name: "unknownByte3", type: "uint8", defaultValue: 0 },
        { name: "unknownByte4", type: "uint8", defaultValue: 0 }
      ]
    }
  ]
];
