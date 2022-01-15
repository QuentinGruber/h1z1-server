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

export const wallOfDataPackets: any = [
  ["WallOfData.PlayerKeyboard", 0x9903, {}],
  [
    "WallOfData.UIEvent",
    0x9905,
    {
      fields: [
        { name: "object", type: "string", defaultValue: "" },
        { name: "function", type: "string", defaultValue: "" },
        { name: "argument", type: "string", defaultValue: "" },
      ],
    },
  ],
  [
    "WallOfData.ClientSystemInfo",
    0x9906,
    {
      fields: [{ name: "ClientSystemInfo", type: "string", defaultValue: "" }],
    },
  ],
  ["WallOfData.VoiceChatEvent", 0x9907, {}],
  ["WallOfData.NudgeEvent", 0x9909, {}],
  [
    "WallOfData.LaunchPadFingerprint",
    0x990a,
    {
      fields: [
        {
          name: "LaunchPadFingerprint",
          type: "uint64string",
          defaultValue: "0",
        },
      ],
    },
  ],
  ["WallOfData.VideoCapture", 0x990b, {}],
  [
    "WallOfData.ClientTransition",
    0x990c,
    {
      fields: [
        { name: "oldState", type: "uint32", defaultValue: 0 },
        { name: "newState", type: "uint32", defaultValue: 0 },
        { name: "msElapsed", type: "uint32", defaultValue: 0 },
      ],
    },
  ],
];
