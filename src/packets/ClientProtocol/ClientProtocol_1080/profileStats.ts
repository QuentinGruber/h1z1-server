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

export const profileStatsPackets: PacketStructures = [
  [
    "ProfileStats.GetPlayerProfileStats",
    0x940000,
    {
      fields: [{ name: "characterId", type: "uint64string", defaultValue: "0" }]
    }
  ],
  ["ProfileStats.GetZonePlayerProfileStats", 0x940100, {}],
  ["ProfileStats.PlayerProfileStats", 0x940200, {}],
  ["ProfileStats.ZonePlayerProfileStats", 0x940300, {}],
  ["ProfileStats.UpdatePlayerLeaderboards", 0x940400, {}],
  ["ProfileStats.UpdatePlayerLeaderboardsReply", 0x940500, {}],
  ["ProfileStats.GetLeaderboard", 0x940600, {}],
  ["ProfileStats.Leaderboard", 0x940700, {}],
  ["ProfileStats.GetZoneCharacterStats", 0x940800, {}],
  ["ProfileStats.ZoneCharacterStats", 0x940900, {}]
];
