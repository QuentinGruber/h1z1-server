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

export const rewardBuffsPackets: PacketStructures = [
  ["RewardBuffs.ReceivedBundlePacket", 0xa001, {}],
  ["RewardBuffs.NonBundledItem", 0xa002, {}],
  ["RewardBuffs.AddBonus", 0xa003, {}],
  ["RewardBuffs.RemoveBonus", 0xa004, {}],
  ["RewardBuffs.GiveRewardToPlayer", 0xa005, {}]
];
