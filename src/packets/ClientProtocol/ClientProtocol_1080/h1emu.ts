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

export const h1emuPackets: PacketStructures = [
  [
    "H1emu.PrintToConsole",
    0x9901,
    {
      fields: [
        { name: "message", type: "string", defaultValue: "" },
        { name: "showConsole", type: "boolean", defaultValue: false },
        { name: "clearOutput", type: "boolean", defaultValue: false }
      ]
    }
  ],
  [
    "H1emu.MessageBox",
    0x9902,
    {
      fields: [
        { name: "title", type: "string", defaultValue: "" },
        { name: "message", type: "string", defaultValue: "" }
      ]
    }
  ]
];
