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

export const rewardBuffsPackets: any = [
  ["RewardBuffs.ReceivedBundlePacket", 0x9f01, {}],
  ["RewardBuffs.NonBundledItem", 0x9f02, {}],
  ["RewardBuffs.AddBonus", 0x9f03, {}],
  ["RewardBuffs.RemoveBonus", 0x9f04, {}],
  ["RewardBuffs.GiveRewardToPlayer", 0x9f05, {}],
];
