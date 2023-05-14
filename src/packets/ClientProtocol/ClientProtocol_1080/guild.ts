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

export const guildPackets: PacketStructures = [
  ["Guild.Disband", 0x5902, {}],
  ["Guild.Rename", 0x5903, {}],
  ["Guild.ChangeMemberRank", 0x590a, {}],
  ["Guild.MotdUpdate", 0x590b, {}],
  ["Guild.UpdateRank", 0x590e, {}],
  ["Guild.DataFull", 0x590f, {}],
  ["Guild.Data", 0x5910, {}],
  ["Guild.Invitations", 0x5911, {}],
  ["Guild.AddMember", 0x5912, {}],
  ["Guild.RemoveMember", 0x5913, {}],
  ["Guild.UpdateInvitation", 0x5914, {}],
  ["Guild.MemberOnlineStatus", 0x5915, {}],
  ["Guild.TagsUpdated", 0x5916, {}],
  ["Guild.Notification", 0x5917, {}],
  ["Guild.UpdateAppData", 0x5920, {}],
  ["Guild.RecruitingGuildsForBrowserReply", 0x5926, {}]
];
