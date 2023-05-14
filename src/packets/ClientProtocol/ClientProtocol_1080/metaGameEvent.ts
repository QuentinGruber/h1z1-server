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

export const MetaGameEventPackets: PacketStructures = [
  ["MetaGameEvent.StartWarning", 0xb701, {}],
  ["MetaGameEvent.Start", 0xb702, {}],
  ["MetaGameEvent.Update", 0xb703, {}],
  ["MetaGameEvent.CompleteDominating", 0xb704, {}],
  ["MetaGameEvent.CompleteStandard", 0xb705, {}],
  ["MetaGameEvent.CompleteCancel", 0xb706, {}],
  ["MetaGameEvent.ExperienceBonusUpdate", 0xb707, {}],
  ["MetaGameEvent.ClearExperienceBonus", 0xb708, {}]
];
