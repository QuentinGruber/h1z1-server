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

import { PacketFields, PacketStructures } from "types/packetStructure";

export const leaderboardSchema: PacketFields = [
  {
    name: "data",
    type: "array",
    defaultValue: [],
    fields: [
      {
        name: "description",
        type: "string",
        defaultValue: "PSTATS_104_4_0_0"
      },
      {
        name: "description2",
        type: "string",
        defaultValue: "PSTATS_104_4_0_0"
      },
      { name: "gameModeId", type: "uint32", defaultValue: 104 },
      { name: "playerStatId", type: "uint32", defaultValue: 4 },
      { name: "unknownQword1", type: "uint64string", defaultValue: "0" },
      { name: "unknownQword2", type: "uint64string", defaultValue: "0" },
      {
        name: "playerStatsData",
        type: "array",
        defaultValue: [],
        fields: [
          {
            name: "characterId",
            type: "uint64string",
            defaultValue: "0"
          },
          {
            name: "statValue",
            type: "uint64string",
            defaultValue: "0x0000000000000004"
          },
          { name: "playerRank", type: "uint32", defaultValue: 0 },
          {
            name: "playerOobData",
            type: "string",
            defaultValue:
              '<OobData characterName="JSON" playerName="" twitchName="" twitchId="0"/>'
          },
          { name: "characterName", type: "string", defaultValue: "JSON" },
          { name: "playerName", type: "string", defaultValue: "" },
          { name: "twitchName", type: "string", defaultValue: "" },
          {
            name: "twitchId",
            type: "uint64string",
            defaultValue: "0"
          }
        ]
      }
    ]
  }
];

export const unknownDataSchema: PacketFields = [
  // sub_140665C40
  { name: "unknownDword1", type: "uint32", defaultValue: 0 },
  { name: "unknownQword1", type: "uint64string", defaultValue: "0" },
  { name: "unknownQword2", type: "uint64string", defaultValue: "0" }
];

export const unknownArraySchema: PacketFields = [
  // sub_140666DC0
  {
    name: "unknownArray1",
    type: "array",
    defaultValue: [],
    fields: [
      { name: "unknownData1", type: "schema", fields: unknownDataSchema },
      { name: "unknownDword2", type: "uint32", defaultValue: 0 },
      { name: "unknownData2", type: "schema", fields: unknownDataSchema },
      { name: "unknownQword3", type: "uint64string", defaultValue: "0" }
    ]
  }
];

export const unknownData24Schema: PacketFields = [
  { name: "unknownDword1", type: "uint32", defaultValue: 0 },
  { name: "unknownQword1", type: "uint64string", defaultValue: "0" },
  { name: "unknownQword2", type: "uint64string", defaultValue: "0" },
  { name: "unknownData1", type: "schema", fields: unknownDataSchema },
  { name: "unknownQword3", type: "uint64string", defaultValue: "0" },
  { name: "unknownDword2", type: "uint32", defaultValue: 0 },
  { name: "unknownDword3", type: "uint32", defaultValue: 0 },
  { name: "unknownDword4", type: "uint32", defaultValue: 0 },
  { name: "unknownDword5", type: "uint32", defaultValue: 0 },
  { name: "unknownDword6", type: "uint32", defaultValue: 0 },
  { name: "unknownDword7", type: "uint32", defaultValue: 0 },
  { name: "unknownDword8", type: "uint32", defaultValue: 0 }
];

export const statsPackets: PacketStructures = [
  ["Stats", 0xc6, {}],
  [
    "Stats.Unk2",
    0xc602,
    {
      fields: [...unknownData24Schema]
    }
  ],
  [
    "Stats.Unk3",
    0xc603,
    {
      fields: [
        { name: "unknownDword1", type: "uint32", defaultValue: 0 },
        { name: "unknownQword1", type: "uint64string", defaultValue: "0" },
        { name: "unknownQword2", type: "uint64string", defaultValue: "0" },
        { name: "unknownDword2", type: "uint32", defaultValue: 0 },
        { name: "unknownData1", type: "schema", fields: unknownDataSchema },
        { name: "unknownQword3", type: "uint64string", defaultValue: "0" }
      ]
    }
  ],
  [
    "Stats.Unk4",
    0xc604,
    {
      fields: [...unknownData24Schema]
    }
  ],
  [
    "Stats.AllPlayerStatLeaderboard",
    0xc605,
    {
      fields: [...leaderboardSchema]
    }
  ],
  [
    "Stats.PlayersLeaderboard",
    0xc606,
    {
      fields: [...leaderboardSchema]
    }
  ]
];
