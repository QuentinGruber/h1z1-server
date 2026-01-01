// ======================================================================
//
//   GNU GENERAL PUBLIC LICENSE
//   Version 3, 29 June 2007
//   copyright (C) 2020 - 2021 Quentin Gruber
//   copyright (C) 2021 - 2026 H1emu community
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
    "Spectator.AllSpectators",
    0xe30200,
    {
      fields: [
        { name: "unknownDword1", type: "uint32", defaultValue: 0 },
        {
          name: "unknownArray1",
          type: "array",
          defaultValue: [],
          fields: [
            { name: "characterId", type: "uint64string", defaultValue: "" },
            { name: "characterName", type: "string", defaultValue: "" },
            { name: "twitchName", type: "string", defaultValue: "" },
            { name: "unknownByte1", type: "uint8", defaultValue: 0 },
            { name: "unknownByte2", type: "uint8", defaultValue: 0 },
            { name: "unknownDword1", type: "uint32", defaultValue: 0 },
            { name: "unknownWord1", type: "int16", defaultValue: 0 },
            { name: "playerHeading", type: "uint8", defaultValue: 0 },
            { name: "unknownByte4", type: "uint8", defaultValue: 0 },
            { name: "playerX", type: "int16", defaultValue: 0 },
            { name: "playerY", type: "int16", defaultValue: 0 },
            { name: "playerZ", type: "int16", defaultValue: 0 },
            { name: "unknownByte5", type: "uint8", defaultValue: 0 },
            { name: "unknownByte6", type: "uint8", defaultValue: 0 },
            {
              name: "unknownArray2",
              type: "array",
              defaultValue: [],
              fields: [
                {
                  name: "unknownQword1",
                  type: "uint64string",
                  defaultValue: ""
                },
                {
                  name: "unknownQword2",
                  type: "uint64string",
                  defaultValue: ""
                },
                {
                  name: "unknownQword3",
                  type: "uint64string",
                  defaultValue: ""
                }
              ]
            }
          ]
        },
        {
          name: "unknownArray2",
          type: "array",
          defaultValue: [],
          fields: [
            { name: "unknownQword1", type: "uint64string", defaultValue: "" },
            { name: "unknownDword1", type: "uint32", defaultValue: 0 }
          ]
        }
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
    "Spectator.DeathList",
    0xe30500,
    {
      fields: [
        {
          name: "data",
          type: "array",
          defaultValue: [],
          fields: [
            { name: "characterId", type: "uint64string", defaultValue: "" },
            { name: "playerName", type: "string", defaultValue: "" },
            { name: "twitchName", type: "string", defaultValue: "" },
            {
              name: "otherCharacterId",
              type: "uint64string",
              defaultValue: ""
            },
            { name: "otherName", type: "string", defaultValue: "" },
            { name: "otherTwitchName", type: "string", defaultValue: "" },
            { name: "causeOfDeath", type: "uint8", defaultValue: 0 }, // 0 = weapon, 1 = vehicle, 2 = toxic gas, 3 = bombs, 4 = falling
            { name: "playerX", type: "uint16", defaultValue: 0 },
            { name: "playerY", type: "uint16", defaultValue: 0 },
            { name: "playerZ", type: "uint16", defaultValue: 0 },
            { name: "playersRemaining", type: "uint16", defaultValue: 0 },
            { name: "teamsRemaining", type: "uint16", defaultValue: 0 },
            { name: "vehicleOrWeaponId", type: "uint32", defaultValue: 0 },
            { name: "kills", type: "uint32", defaultValue: 0 }
          ]
        }
      ]
    }
  ],
  [
    "Spectator.SetModerator",
    0xe30600,
    {
      fields: []
    }
  ],
  [
    "Spectator.SetOwner",
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
  ],
  [
    "Spectator.Unknown12",
    0xe30c00,
    {
      fields: [
        { name: "unknownQword1", type: "uint64string", defaultValue: "0" }
      ]
    }
  ]
];
