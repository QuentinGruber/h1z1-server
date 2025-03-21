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
  ],
  [
    "H1emu.RequestAssetHashes",
    0x9903,
    {
      fields: []
    }
  ],
  [
    "H1emu.VoiceInit",
    0x9904,
    {
      fields: [{ name: "args", type: "string", defaultValue: "" }]
    }
  ],
  [
    "H1emu.RequestModules",
    0x9905,
    {
      fields: []
    }
  ],
  [
    "H1emu.RequestWindows",
    0x9906,
    {
      fields: []
    }
  ],
  [
    "H1emu.VoiceState",
    0x9907,
    {
      fields: [{ name: "message", type: "string", defaultValue: "" }]
    }
  ],
  [
    "H1emu.FairPlay",
    0x990801,
    {
      fields: [
        { name: "name", type: "string", defaultValue: "" },
        { name: "data1", type: "string", defaultValue: "" },
        { name: "data2", type: "string", defaultValue: "" },
        { name: "data3", type: "string", defaultValue: "" }
      ]
    }
  ],
  [
    "H1emu.HeartBeat",
    0x990802,
    {
      fields: [
        { name: "data", type: "string", defaultValue: 0 },
        { name: "name", type: "string", defaultValue: "" },
        { name: "data2", type: "string", defaultValue: "" },
        { name: "data3", type: "string", defaultValue: "" },
        { name: "data4", type: "string", defaultValue: "" },
        { name: "data5", type: "string", defaultValue: "" }
      ]
    }
  ],
  [
    "FairPlay.Internal",
    0xff,
    {
      fields: []
    }
  ]
];
