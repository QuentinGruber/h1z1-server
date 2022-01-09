export const combatPackets: any = [
  ["Combat.AutoAttackTarget", 0x0c01, {}],
  ["Combat.AutoAttackOff", 0x0c02, {}],
  ["Combat.SingleAttackTarget", 0x0c03, {}],
  [
    "Combat.AttackTargetDamage",
    0x0c04,
    {
      fields: [
        { name: "unknown1", type: "boolean", defaultValue: true },
        { name: "unknown2", type: "uint16", defaultValue: 1 },
        {
          name: "characterId",
          type: "uint64string",
          defaultValue: "0x0000000000000000",
        },
        {
          name: "targetId",
          type: "uint64string",
          defaultValue: "0x0000000000000000",
        },
        { name: "unknown5", type: "uint32", defaultValue: 100 },
        { name: "unknown6", type: "boolean", defaultValue: true },
      ],
    },
  ],
  [
    "Combat.AttackAttackerMissed",
    0x0c05,
    {
      fields: [
        { name: "unknown1", type: "boolean", defaultValue: true },
        { name: "unknown2", type: "uint16", defaultValue: 1 },
        {
          name: "characterId",
          type: "uint64string",
          defaultValue: "0x0000000000000000",
        },
        {
          name: "targetId",
          type: "uint64string",
          defaultValue: "0x0000000000000000",
        },
      ],
    },
  ],
  [
    "Combat.AttackTargetDodged",
    0x0c06,
    {
      fields: [
        { name: "unknown1", type: "boolean", defaultValue: true },
        { name: "unknown2", type: "uint16", defaultValue: 1 },
        {
          name: "characterId",
          type: "uint64string",
          defaultValue: "0x0000000000000000",
        },
        {
          name: "targetId",
          type: "uint64string",
          defaultValue: "0x0000000000000000",
        },
      ],
    },
  ],
  [
    "Combat.AttackProcessed",
    0x0c0700,
    {
      fields: [
        { name: "unknownQword1", type: "uint64string", defaultValue: "0x000" },
        { name: "unknownQword2", type: "uint64string", defaultValue: "0x000" },
        { name: "unknownQword3", type: "uint64string", defaultValue: "0x000" },
        { name: "unknownDword1", type: "uint32", defaultValue: 0 },
        { name: "unknownDword2", type: "uint32", defaultValue: 0 },
        { name: "unknownDword3", type: "uint32", defaultValue: 0 },
        { name: "unknownBoolean1", type: "boolean", defaultValue: false },
        { name: "unknownBoolean2", type: "boolean", defaultValue: false },
        { name: "unknownDword4", type: "uint32", defaultValue: 0 },
        { name: "unknownDword5", type: "uint32", defaultValue: 0 },
      ],
    },
  ],
  [
    "Combat.EnableBossDisplay",
    0x0c09,
    {
      fields: [
        { name: "unknown2", type: "uint16", defaultValue: 1 },
        {
          name: "characterId",
          type: "uint64string",
          defaultValue: "0x0000000000000000",
        },
        { name: "unknown6", type: "boolean", defaultValue: true },
      ],
    },
  ],
  [
    "Combat.AttackTargetBlocked",
    0x0c0a,
    {
      fields: [
        { name: "unknown2", type: "uint16", defaultValue: 1 },
        {
          name: "characterId",
          type: "uint64string",
          defaultValue: "0x0000000000000000",
        },
        {
          name: "targetId",
          type: "uint64string",
          defaultValue: "0x0000000000000000",
        },
      ],
    },
  ],
  [
    "Combat.AttackTargetParried",
    0x0c0b,
    {
      fields: [
        { name: "unknown2", type: "uint16", defaultValue: 1 },
        {
          name: "characterId",
          type: "uint64string",
          defaultValue: "0x0000000000000000",
        },
        {
          name: "targetId",
          type: "uint64string",
          defaultValue: "0x0000000000000000",
        },
      ],
    },
  ],
  [
    "Combat.UpdateGrappling",
    0x0c0b,
    {
      fields: [
        { name: "unknown1", type: "boolean", defaultValue: true },
        { name: "unknown2", type: "uint16", defaultValue: 1 },
        {
          name: "unknown3",
          type: "uint64string",
          defaultValue: "0x0000000000000000",
        },
        { name: "unknown4", type: "uint32", defaultValue: 0 },
        {
          name: "unknown5",
          type: "uint64string",
          defaultValue: "0x0000000000000000",
        },
        { name: "unknown6", type: "uint32", defaultValue: 0 },
      ],
    },
  ],
];
