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

export const skillPackets: PacketStructures = [
  ["Skill.Echo", 0x8601, {}],
  ["Skill.SelectSkillSet", 0x8602, {}],
  ["Skill.SelectSkill", 0x8603, {}],
  ["Skill.GetSkillPointManager", 0x8604, {}],
  ["Skill.SetLoyaltyPoints", 0x8605, {}],
  ["Skill.LoadSkillDefinitionManager", 0x8606, {}],
  ["Skill.SetSkillPointManager", 0x8607, {}],
  [
    "Skill.SetSkillPointProgress",
    0x8608,
    {
      fields: [
        { name: "unknown1", type: "uint32", defaultValue: 0 },
        { name: "unknown2", type: "float", defaultValue: 0.0 },
        { name: "unknown3", type: "float", defaultValue: 0.0 }
      ]
    }
  ],
  ["Skill.AddSkill", 0x8609, {}],
  ["Skill.ReportSkillGrant", 0x860a, {}],
  ["Skill.ReportOfflineEarnedSkillPoints", 0x860b, {}],
  ["Skill.ReportDeprecatedSkillLine", 0x860c, {}]
];
