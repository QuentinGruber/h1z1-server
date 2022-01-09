export const targetPackets: any = [
  // 01 -> 07 are client sided
  [
    "Target.CharacterGuid",
    0x7e01,
    {
      fields: [],
    },
  ],
  [
    "Target.Location",
    0x7e02,
    {
      fields: [],
    },
  ],
  [
    "Target.CharacterBone",
    0x7e03,
    {
      fields: [],
    },
  ],
  [
    "Target.CharacterBoneId",
    0x7e04,
    {
      fields: [],
    },
  ],
  [
    "Target.ActorBone",
    0x7e05,
    {
      fields: [
        { name: "Unk1", type: "uint32", defaultValue: "10" },
        {
          name: "unk2",
          type: "uint64string",
          defaultValue: "0x0000000000000010",
        },
      ],
    },
  ],
  [
    "Target.ActorBoneId",
    0x7e06,
    {
      fields: [],
    },
  ],
  [
    "Target.Facility",
    0x7e07,
    {
      fields: [],
    },
  ],

  // for some reason the opcode of a Target packet is 0x{BasePacketOpcode byte}{SubPacketOpcode byte}{emptyByte}
  [
    "Target.AddTarget",
    0x7e0700,
    {
      fields: [
        {
          name: "Unk1",
          type: "uint64string",
          defaultValue: "0x0000000000000010",
        },
        { name: "Unk2", type: "string", defaultValue: "10" },
        { name: "Unk3", type: "boolean", defaultValue: true }, // the packet is ignored if falsy
      ],
    },
  ],
  [
    "Target.SetTarget",
    0x7e0800,
    {
      fields: [
        {
          name: "Unk1",
          type: "uint64string",
          defaultValue: "0x0000000000000010",
        },
        { name: "Unk2", type: "string", defaultValue: "10" },
        { name: "Unk3", type: "boolean", defaultValue: true }, // the packet is ignored if falsy
      ],
    },
  ],
  [
    "Target.RemoveTarget",
    0x7e0900,
    {
      fields: [
        { name: "Unk2", type: "string", defaultValue: "10" },
        { name: "Unk3", type: "boolean", defaultValue: true }, // the packet is ignored if falsy
      ],
    },
  ],
  [
    "Target.ClearTarget",
    0x7eb000,
    {
      fields: [
        { name: "Unk2", type: "string", defaultValue: "10" },
        { name: "Unk3", type: "boolean", defaultValue: true }, // the packet is ignored if falsy
      ],
    },
  ],
];
