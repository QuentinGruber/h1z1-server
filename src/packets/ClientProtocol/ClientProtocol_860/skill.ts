export const skillPackets: any = [
  ["Skill.Echo", 0x8501, {}],
  ["Skill.SelectSkillSet", 0x8502, {}],
  [
    "Skill.SelectSkill",
    0x8503,
    {
      fields: [
        { name: "unknownDword1", type: "uint32", defaultValue: 0 },
        { name: "unknownWord1", type: "uint8", defaultValue: 0 },
        { name: "unknownDword2", type: "uint32", defaultValue: 0 },
      ],
    },
  ],
  ["Skill.GetSkillPointManager", 0x8504, {}],
  ["Skill.SetLoyaltyPoints", 0x8505, {}],
  ["Skill.LoadSkillDefinitionManager", 0x8506, {}],
  [
    "Skill.SetSkillPointManager",
    0x8507,
    {
      fields: [
        { name: "unknownDword1", type: "uint32", defaultValue: 0 },

        {
          name: "unknownSchema1",
          type: "schema",
          defaultValue: [],
          fields: [
            {
              name: "unknownQword1",
              type: "uint64string",
              defaultValue: "0x000",
            },
            {
              name: "unknownQword2",
              type: "uint64string",
              defaultValue: "0x000",
            },
            {
              name: "unknownQword3",
              type: "uint64string",
              defaultValue: "0x000",
            },
            {
              name: "unknownQword4",
              type: "uint64string",
              defaultValue: "0x000",
            },
            {
              name: "unknownQword5",
              type: "uint64string",
              defaultValue: "0x000",
            },
            { name: "unknownDword2", type: "uint32", defaultValue: 0 },
          ],
        },
      ],
    },
  ],
  [
    "Skill.SetSkillPointProgress",
    0x8508,
    {
      fields: [
        { name: "unknown1", type: "uint32", defaultValue: 0 },
        { name: "unknown2", type: "float", defaultValue: 0.0 },
        { name: "unknown3", type: "float", defaultValue: 0.0 },
      ],
    },
  ],
  ["Skill.AddSkill", 0x8509, {}],
  ["Skill.ReportSkillGrant", 0x850a, {}],
  ["Skill.ReportOfflineEarnedSkillPoints", 0x850b, {}],
  ["Skill.ReportDeprecatedSkillLine", 0x850c, {}],
];
