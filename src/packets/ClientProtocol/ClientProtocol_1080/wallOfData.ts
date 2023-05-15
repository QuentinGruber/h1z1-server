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

export const wallOfDataPackets: PacketStructures = [
  ["WallOfData.PlayerKeyboard", 0x9b03, {}],
  [
    "WallOfData.UIEvent",
    0x9b05,
    {
      fields: [
        { name: "object", type: "string", defaultValue: "" },
        { name: "function", type: "string", defaultValue: "" },
        { name: "argument", type: "string", defaultValue: "" }
      ]
    }
  ],
  [
    "WallOfData.ClientSystemInfo",
    0x9b06,
    {
      fields: [{ name: "info", type: "string", defaultValue: "" }]
    }
  ],
  ["WallOfData.VoiceChatEvent", 0x9b07, {}],
  ["WallOfData.NudgeEvent", 0x9b09, {}],
  ["WallOfData.LaunchPadFingerprint", 0x9b0a, {}],
  ["WallOfData.VideoCapture", 0x9b0b, {}],
  [
    "WallOfData.ClientTransition",
    0x9b0c,
    {
      fields: [
        { name: "oldState", type: "uint32", defaultValue: 0 },
        { name: "newState", type: "uint32", defaultValue: 0 },
        { name: "msElapsed", type: "uint32", defaultValue: 0 }
      ]
    }
  ]
];
