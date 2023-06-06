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

export const spectatorPackets: PacketStructures = [
  [
    "Spectator.Enable",
    0xe30100,
    {
      fields: []
    }
  ],
  [
    "Spectator.Unknown2",
    0xe30200,
    {
      fields: [
        { name: "unknownDword1", type: "uint32", defaultValue: 0 }
        // requires pack func
      ]
    }
  ],
  [
    "Spectator.Unknown3",
    0xe30300,
    {
      fields: []
    }
  ],
  [
    "Spectator.Teleport",
    0xe30400,
    {
      fields: [
        { name: "x", type: "float", defaultValue: 0 },
        { name: "y", type: "float", defaultValue: 0 }
      ]
    }
  ],
  [
    "Spectator.Unknown5",
    0xe30500,
    {
      fields: [
        {
          name: "unknownArray1",
          type: "array",
          defaultValue: [],
          fields: [
            { name: "unknownQword1", type: "uint64string", defaultValue: "" },
            { name: "unknownString1", type: "string", defaultValue: "" },
            { name: "unknownString2", type: "string", defaultValue: "" },
            { name: "unknownQword2", type: "uint64string", defaultValue: "" },
            { name: "unknownString3", type: "string", defaultValue: "" },
            { name: "unknownString4", type: "string", defaultValue: "" },
            { name: "unknownByte1", type: "uint16", defaultValue: 0 },
            { name: "unknownWord1", type: "uint16", defaultValue: 0 },
            { name: "unknownWord2", type: "uint16", defaultValue: 0 },
            { name: "unknownWord3", type: "uint16", defaultValue: 0 },
            { name: "unknownWord4", type: "uint16", defaultValue: 0 },
            { name: "unknownWord5", type: "uint16", defaultValue: 0 },
            { name: "unknownDword1", type: "uint32", defaultValue: 0 },
            { name: "unknownDword2", type: "uint32", defaultValue: 0 }
          ]
        }
      ]
    }
  ],
  [
    "Spectator.SetUnknownFlag1",
    0xe30600,
    {
      fields: []
    }
  ],
  [
    "Spectator.SetUnknownFlag2",
    0xe30700,
    {
      fields: []
    }
  ],
  [
    "Spectator.MatchResults",
    0xe30800,
    {
      fields: [
        { name: "unknownQword1", type: "uint64string", defaultValue: "" },
        { name: "unknownString1", type: "string", defaultValue: "" },
        { name: "unknownDword1", type: "uint32", defaultValue: 0 }
      ]
    }
  ]
];
