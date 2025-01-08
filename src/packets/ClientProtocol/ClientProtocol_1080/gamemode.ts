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

export const gamemodePackets: PacketStructures = [
  [
    "GameMode.UpdateToxicGas",
    0xcf0100,
    {
      fields: [
        { name: "position", type: "floatvector4", defaultValue: [0, 0, 0, 0] },
        { name: "radius", type: "float", defaultValue: 1000 },
        { name: "unknownDword3", type: "uint32", defaultValue: 1000 },
        { name: "unknownDword4", type: "float", defaultValue: 1 }
      ]
    }
  ],
  [
    "GameMode.UpdateSafeZone",
    0xcf0200,
    {
      fields: [
        { name: "position", type: "floatvector4", defaultValue: [0, 0, 0, 0] },
        { name: "radius", type: "float", defaultValue: 1000 }
      ]
    }
  ],
  [
    "GameMode.DeathInfo",
    0xcf0400,
    {
      fields: [
        { name: "endingPositionIndex", type: "uint32", defaultValue: 0 },
        { name: "endsInDraw", type: "boolean", defaultValue: false },
        { name: "playerName", type: "string", defaultValue: "" },
        { name: "remainingHealth", type: "uint32", defaultValue: 0 },
        { name: "weapon", type: "uint32", defaultValue: 0 },
        { name: "unknownDword4", type: "uint32", defaultValue: 0 }
      ]
    }
  ],
  [
    "GameMode.StartLogout",
    0xcf0600,
    {
      fields: [
        { name: "unknownBoolean1", type: "boolean", defaultValue: false }
      ]
    }
  ],
  [
    "GameMode.Unk9",
    0xcf0900,
    {
      fields: [{ name: "unknownDword1", type: "uint32", defaultValue: 0 }]
    }
  ],
  [
    "GameMode.Unk10",
    0xcf0a00,
    {
      fields: [
        { name: "unknownDword1", type: "uint32", defaultValue: 0 },
        { name: "unknownDword2", type: "uint32", defaultValue: 0 }
      ]
    }
  ],
  [
    "GameMode.Unk11",
    0xcf0b00,
    {
      fields: [
        { name: "unknownBoolean1", type: "boolean", defaultValue: false }
      ]
    }
  ],
  [
    "GameMode.Unk13",
    0xcf0d00,
    {
      fields: [
        {
          name: "unknownArray1",
          type: "array",
          defaultValue: [],
          fields: [
            {
              name: "unknownFloatArray1",
              type: "floatvector4",
              defaultValue: [0, 0, 0, 0]
            },
            { name: "unknownDword1", type: "uint32", defaultValue: 0 },
            { name: "unknownDword2", type: "uint32", defaultValue: 0 },
            { name: "unknownDword3", type: "uint32", defaultValue: 0 },
            { name: "unknownDword4", type: "uint32", defaultValue: 0 },
            { name: "unknownDword5", type: "uint32", defaultValue: 0 },
            { name: "unknownDword6", type: "uint32", defaultValue: 0 }
          ]
        }
      ]
    }
  ],
  [
    "GameMode.Unk15",
    0xcf0f00,
    {
      fields: [
        { name: "unknownDword1", type: "uint32", defaultValue: 0 },
        { name: "unknownDword2", type: "uint32", defaultValue: 0 },
        { name: "unknownDword3", type: "uint32", defaultValue: 0 },
        { name: "unknownString1", type: "string", defaultValue: "" }
      ]
    }
  ],
  [
    "GameMode.Unk16",
    0xcf1000,
    {
      fields: [
        { name: "unknownDword1", type: "uint32", defaultValue: 0 },
        { name: "unknownDword2", type: "uint32", defaultValue: 0 }
      ]
    }
  ],
  [
    "GameMode.Unk18",
    0xcf1200,
    {
      fields: [{ name: "unknownDword1", type: "uint32", defaultValue: 0 }]
    }
  ],
  [
    "GameMode.Unk19",
    0xcf1300,
    {
      fields: [
        { name: "unknownBoolean1", type: "boolean", defaultValue: false }
      ]
    }
  ],
  [
    "GameMode.Unk20",
    0xcf1400,
    {
      fields: [
        { name: "unknownString1", type: "string", defaultValue: "" },
        { name: "unknownString2", type: "string", defaultValue: "" },
        { name: "unknownDword1", type: "uint32", defaultValue: 0 }
      ]
    }
  ],
  [
    "GameMode.Unk21",
    0xcf1500,
    {
      fields: [
        { name: "unknownBoolean1", type: "boolean", defaultValue: false }
      ]
    }
  ],
  [
    "GameMode.StartMatch",
    0xcf1600,
    {
      fields: [{ name: "remainingSeconds", type: "uint32", defaultValue: 300 }]
    }
  ],
  [
    "GameMode.Unk23",
    0xcf1700,
    {
      fields: [
        { name: "unknownBoolean1", type: "boolean", defaultValue: false }
      ]
    }
  ],
  [
    "GameMode.ShowVictoryScreen",
    0xcf1800,
    {
      fields: [{ name: "unknownDword1", type: "uint32", defaultValue: 0 }]
    }
  ]
];
