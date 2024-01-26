// ======================================================================
//
//   GNU GENERAL PUBLIC LICENSE
//   Version 3, 29 June 2007
//   copyright (C) 2020 - 2021 Quentin Gruber
//   copyright (C) 2021 - 2024 H1emu community
//
//   https://github.com/QuentinGruber/h1z1-server
//   https://www.npmjs.com/package/h1z1-server
//
//   Based on https://github.com/psemu/soe-network
// ======================================================================

import { PacketStructures } from "types/packetStructure";

export const voicePackets: PacketStructures = [
  [
    "Voice.Login",
    0x8200,
    {
      fields: [
        { name: "clientName", type: "string", defaultValue: "" },
        { name: "sessionId", type: "string", defaultValue: "" },
        { name: "url", type: "string", defaultValue: "" },
        { name: "characterName", type: "string", defaultValue: "" }
      ]
    }
  ],
  [
    "Voice.JoinChannel",
    0x8201,
    {
      fields: [
        { name: "roomType", type: "uint8", defaultValue: 0 },
        { name: "uri", type: "string", defaultValue: "" },
        { name: "unknown1", type: "uint32", defaultValue: 0 }
      ]
    }
  ],
  ["Voice.LeaveChannel", 0x8202, { fields: [] }],
  ["Voice.RadioChannel", 0x8207, { fields: [] }],
  ["Voice.LeaveRadio", 0x8208, { fields: [] }]
];
