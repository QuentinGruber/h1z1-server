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

export const guildPackets: any = [
  ["Guild.Disband", 0x5802, {}],
  ["Guild.Rename", 0x5803, {}],
  ["Guild.ChangeMemberRank", 0x580a, {}],
  ["Guild.MotdUpdate", 0x580b, {}],
  ["Guild.UpdateRank", 0x580e, {}],
  ["Guild.DataFull", 0x580f, {}],
  ["Guild.Data", 0x5810, {}],
  ["Guild.Invitations", 0x5811, {}],
  ["Guild.AddMember", 0x5812, {}],
  ["Guild.RemoveMember", 0x5813, {}],
  ["Guild.UpdateInvitation", 0x5814, {}],
  ["Guild.MemberOnlineStatus", 0x5815, {}],
  ["Guild.TagsUpdated", 0x5816, {}],
  ["Guild.Notification", 0x5817, {}],
  ["Guild.UpdateAppData", 0x5820, {}],
  ["Guild.RecruitingGuildsForBrowserReply", 0x5826, {}]
];
