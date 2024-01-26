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

export const abilityPackets: any = [
  ["Ability.ClientRequestStartAbility", 0x1001, {}],
  ["Ability.ClientRequestStopAbility", 0x1002, {}],
  [
    "Ability.ClientMoveAndCast",
    0x1003,
    {
      fields: [
        { name: "position", type: "floatvector4", defaultValue: [0, 50, 0, 1] },
        { name: "unk1", type: "uint32", defaultValue: 0 },
        { name: "unk2", type: "uint32", defaultValue: 0 }
        // maybe also an uint16
      ]
    }
  ],
  [
    "Ability.Failed",
    0x1004,
    {
      fields: []
    }
  ],
  [
    "Ability.StartCasting",
    0x1005,
    {
      fields: [
        { name: "characterId", type: "uint64string", defaultValue: "0" },
        { name: "unkGuid", type: "uint64string", defaultValue: "0" },
        { name: "unk1", type: "uint32", defaultValue: 0 },
        { name: "unk2", type: "uint32", defaultValue: 0 },
        { name: "unk3", type: "uint32", defaultValue: 0 },
        {
          name: "unkArray1",
          type: "array",
          defaultValue: [],
          fields: []
        },
        { name: "unk4", type: "uint32", defaultValue: 0 },
        { name: "unk5", type: "uint32", defaultValue: 0 },
        { name: "unk6", type: "uint32", defaultValue: 0 }
      ]
    }
  ],
  [
    "Ability.Launch",
    0x1006,
    {
      fields: [
        { name: "characterId", type: "uint64string", defaultValue: "0" },
        { name: "unkGuid", type: "uint64string", defaultValue: "0" },
        { name: "unk1", type: "uint32", defaultValue: 0 },
        { name: "weirdAskedByte", type: "uint8", defaultValue: 0 }, // linked to targets i'm not sure about this one
        { name: "position", type: "floatvector4", defaultValue: [0, 50, 0, 1] },
        {
          name: "unkArray1",
          type: "array",
          defaultValue: [],
          fields: []
        },
        { name: "unk2", type: "uint32", defaultValue: 0 },
        { name: "unk3", type: "uint32", defaultValue: 0 },
        { name: "unk4", type: "uint32", defaultValue: 0 },
        { name: "unk5", type: "uint32", defaultValue: 0 },
        { name: "unk6", type: "uint32", defaultValue: 0 },
        { name: "unk7", type: "uint32", defaultValue: 0 },
        { name: "unk8", type: "uint32", defaultValue: 0 },
        { name: "unk9", type: "uint32", defaultValue: 0 },
        { name: "unk10", type: "uint32", defaultValue: 0 },
        { name: "unk11", type: "uint32", defaultValue: 0 },
        { name: "unkstring", type: "string", defaultValue: "" },
        { name: "unk12", type: "uint32", defaultValue: 0 },
        { name: "unk13", type: "uint32", defaultValue: 0 },
        { name: "unk14", type: "uint32", defaultValue: 0 },
        { name: "unk15", type: "uint8", defaultValue: 0 },
        { name: "unk16", type: "uint8", defaultValue: 0 },
        { name: "unk17", type: "uint32", defaultValue: 0 },
        { name: "unk18", type: "uint8", defaultValue: 0 },
        { name: "unk19", type: "uint8", defaultValue: 0 },
        { name: "unk20", type: "uint32", defaultValue: 0 },
        { name: "unkGuid2", type: "uint64string", defaultValue: "0" },
        { name: "unk21", type: "boolean", defaultValue: 0 },
        { name: "unk22", type: "boolean", defaultValue: 0 }
      ]
    }
  ],
  [
    "Ability.Land",
    0x1007,
    {
      fields: [
        {
          name: "unknown3",
          type: "uint64",
          defaultValue: "0x0000000000000000"
        },
        { name: "unknown4", type: "uint8", defaultValue: 0 },
        { name: "weirdAskedByte", type: "uint8", defaultValue: 0 }, // linked to targets i'm not sure about this one
        { name: "position", type: "floatvector4", defaultValue: [0, 50, 0, 1] },
        { name: "unknown7", type: "uint32", defaultValue: 0 },
        {
          name: "position2",
          type: "floatvector4",
          defaultValue: [0, 50, 0, 1]
        },
        { name: "unknown9", type: "uint8", defaultValue: 0 },
        { name: "unknown10", type: "uint8", defaultValue: 0 },
        { name: "unknown11", type: "uint8", defaultValue: 0 },
        { name: "unknown12", type: "uint8", defaultValue: 0 },
        { name: "unknown13", type: "uint8", defaultValue: 0 },
        { name: "unknown14", type: "uint8", defaultValue: 0 }
      ]
    }
  ],
  [
    "Ability.StartChanneling",
    0x1008,
    {
      fields: [
        {
          name: "unknown3",
          type: "uint64",
          defaultValue: "0x0000000000000000"
        },
        {
          name: "unknown4",
          type: "uint64",
          defaultValue: "0x0000000000000000"
        },
        { name: "unknown5", type: "uint32", defaultValue: 0 },
        { name: "unknown6", type: "uint32", defaultValue: 0 },
        { name: "unknown7", type: "uint32", defaultValue: 0 },
        { name: "position", type: "floatvector4", defaultValue: [0, 50, 0, 1] },
        { name: "unknown9", type: "uint32", defaultValue: 0 },
        { name: "unknown10", type: "uint32", defaultValue: 0 }
      ]
    }
  ],
  [
    "Ability.StopCasting",
    0x1009,
    {
      fields: [
        { name: "characterId", type: "uint64string", defaultValue: "0" },
        { name: "unkGuid", type: "uint64string", defaultValue: "0" },
        { name: "unk1", type: "uint32", defaultValue: 0 },
        { name: "unk2", type: "uint32", defaultValue: 0 },
        { name: "unk3", type: "uint32", defaultValue: 0 }
      ]
    }
  ],
  [
    "Ability.StopAura",
    0x100a,
    {
      fields: [
        { name: "unknown1", type: "uint32", defaultValue: 0 },
        { name: "unknown2", type: "uint32", defaultValue: 0 }
      ]
    }
  ],
  ["Ability.MeleeRefresh", 0x100b, {}],
  [
    "Ability.AbilityDetails",
    0x100c,
    {
      fields: [
        { name: "characterId", type: "uint64string", defaultValue: "0" },
        { name: "unkGuid", type: "uint64string", defaultValue: "0" },
        { name: "unkGuid2", type: "uint64string", defaultValue: "0" },
        { name: "unk1", type: "uint32", defaultValue: 0 },
        { name: "unk2", type: "uint32", defaultValue: 0 },
        { name: "unk3", type: "uint32", defaultValue: 0 },
        { name: "unk4", type: "boolean", defaultValue: 0 },
        { name: "unk5", type: "boolean", defaultValue: 0 },
        { name: "unk6", type: "uint32", defaultValue: 0 }
      ]
    }
  ],
  ["Ability.PurchaseAbility", 0x100d, {}],
  ["Ability.UpdateAbilityExperience", 0x100e, {}],
  [
    "Ability.SetDefinition",
    0x100f,
    {
      fields: [
        { name: "unknown1", type: "uint32", defaultValue: 0 },
        { name: "unknown2", type: "boolean", defaultValue: 0 },
        { name: "unknown3", type: "uint32", defaultValue: 0 },
        { name: "unknown4", type: "uint32", defaultValue: 0 },
        { name: "unknown5", type: "boolean", defaultValue: 0 },
        {
          name: "unknown6",
          type: "uint64",
          defaultValue: "0x0000000000000000"
        },
        { name: "unknown7", type: "uint32", defaultValue: 0 },
        { name: "unknown8", type: "uint32", defaultValue: 0 },
        { name: "unknown9", type: "uint32", defaultValue: 0 },
        { name: "unknown10", type: "uint32", defaultValue: 0 },
        { name: "unknown11", type: "uint32", defaultValue: 0 },
        { name: "unknown12", type: "uint32", defaultValue: 0 }
      ]
    }
  ],
  ["Ability.RequestAbilityDefinition", 0x1010, {}],
  [
    "Ability.AddAbilityDefinition",
    0x1011,
    {
      // auto-reversed using an homemade tool , so some fields are missing
      fields: [
        { name: "unknown1", type: "uint32", defaultValue: 0 },
        {
          name: "array1",
          type: "array",
          fields: [{ name: "unknown2", type: "boolean", defaultValue: 0 }]
        },
        { name: "unknown3", type: "uint32", defaultValue: 0 },
        { name: "unknown4", type: "uint32", defaultValue: 0 },
        { name: "unknown5", type: "uint32", defaultValue: 0 },
        { name: "unknown6", type: "uint32", defaultValue: 0 },
        { name: "unknown7", type: "uint32", defaultValue: 0 },
        { name: "unknown8", type: "uint32", defaultValue: 0 },
        { name: "unknown9", type: "uint32", defaultValue: 0 },
        { name: "unknown10", type: "uint32", defaultValue: 0 },
        { name: "unknown11", type: "uint32", defaultValue: 0 },
        { name: "unknown12", type: "uint32", defaultValue: 0 },
        { name: "unknown13", type: "uint32", defaultValue: 0 },
        { name: "unknown14", type: "uint32", defaultValue: 0 },
        { name: "unknown15", type: "uint32", defaultValue: 0 },
        { name: "unknown16", type: "uint32", defaultValue: 0 },
        { name: "unknown17", type: "uint32", defaultValue: 0 },
        { name: "unknown18", type: "uint32", defaultValue: 0 },
        { name: "unknown19", type: "uint32", defaultValue: 0 },
        { name: "unknown20", type: "uint32", defaultValue: 0 },
        { name: "unknown21", type: "uint32", defaultValue: 0 },
        { name: "unknown22", type: "uint32", defaultValue: 0 },
        { name: "unknown23", type: "uint32", defaultValue: 0 },
        { name: "unknown24", type: "uint32", defaultValue: 0 },
        { name: "unknown25", type: "uint32", defaultValue: 0 },
        { name: "unknown26", type: "uint32", defaultValue: 0 },
        { name: "unknown27", type: "uint32", defaultValue: 0 },
        { name: "unknown28", type: "uint32", defaultValue: 0 },
        { name: "unknown29", type: "uint32", defaultValue: 0 },
        { name: "unknown30", type: "uint32", defaultValue: 0 },
        { name: "unknown31", type: "uint32", defaultValue: 0 },
        { name: "unknown32", type: "uint32", defaultValue: 0 },
        { name: "unknown33", type: "uint32", defaultValue: 0 },
        { name: "unknown34", type: "uint32", defaultValue: 0 },
        { name: "unknown35", type: "uint32", defaultValue: 0 },
        { name: "unknown36", type: "uint32", defaultValue: 0 },
        { name: "unknown37", type: "uint32", defaultValue: 0 },
        { name: "unknown38", type: "uint32", defaultValue: 0 },
        { name: "unknown39", type: "uint32", defaultValue: 0 },
        { name: "unknown40", type: "uint32", defaultValue: 0 },
        { name: "unknown41", type: "uint32", defaultValue: 0 },
        { name: "unknown42", type: "uint32", defaultValue: 0 },
        { name: "unknown43", type: "uint32", defaultValue: 0 },
        { name: "unknown44", type: "uint32", defaultValue: 0 },
        { name: "unknown45", type: "uint32", defaultValue: 0 },
        { name: "unknown46", type: "uint32", defaultValue: 0 },
        { name: "unknown47", type: "uint32", defaultValue: 0 },
        { name: "unknown48", type: "uint32", defaultValue: 0 },
        { name: "unknown49", type: "uint32", defaultValue: 0 },
        { name: "unknown50", type: "uint32", defaultValue: 0 },
        { name: "unknown51", type: "uint32", defaultValue: 0 },
        { name: "unknown52", type: "uint32", defaultValue: 0 },
        { name: "unknown53", type: "uint32", defaultValue: 0 },
        { name: "unknown54", type: "uint32", defaultValue: 0 },
        { name: "unknown55", type: "uint32", defaultValue: 0 },
        { name: "unknown56", type: "uint32", defaultValue: 0 },
        { name: "unknown57", type: "uint32", defaultValue: 0 },
        { name: "string19", type: "string", defaultValue: "unknownString" },
        {
          name: "array4",
          type: "array",
          fields: [
            { name: "unknown1", type: "uint32", defaultValue: 0 },
            { name: "unknown2", type: "boolean", defaultValue: 0 },
            { name: "unknown3", type: "uint32", defaultValue: 0 },
            { name: "unknown4", type: "uint32", defaultValue: 0 },
            { name: "unknown5", type: "uint32", defaultValue: 0 },
            { name: "unknown6", type: "uint32", defaultValue: 0 },
            { name: "unknown7", type: "uint32", defaultValue: 0 },
            { name: "unknown8", type: "uint32", defaultValue: 0 },
            { name: "unknown9", type: "uint32", defaultValue: 0 },
            { name: "unknown10", type: "uint32", defaultValue: 0 },
            { name: "unknown11", type: "uint32", defaultValue: 0 },
            { name: "unknown12", type: "uint32", defaultValue: 0 },
            { name: "unknown13", type: "uint32", defaultValue: 0 },
            { name: "unknown14", type: "uint32", defaultValue: 0 },
            { name: "unknown15", type: "uint32", defaultValue: 0 },
            { name: "unknown16", type: "uint32", defaultValue: 0 },
            { name: "unknown17", type: "uint32", defaultValue: 0 },
            { name: "unknown18", type: "uint32", defaultValue: 0 },
            { name: "unknown20", type: "uint32", defaultValue: 0 },
            { name: "unknown21", type: "uint32", defaultValue: 0 },
            { name: "unknown22", type: "uint32", defaultValue: 0 },
            { name: "unknown23", type: "uint32", defaultValue: 0 },
            { name: "unknown24", type: "uint32", defaultValue: 0 },
            { name: "unknown25", type: "uint32", defaultValue: 0 },
            { name: "unknown26", type: "uint32", defaultValue: 0 },
            { name: "unknown27", type: "uint32", defaultValue: 0 },
            { name: "unknown28", type: "uint32", defaultValue: 0 },
            { name: "unknown29", type: "uint32", defaultValue: 0 },
            { name: "unknown30", type: "uint32", defaultValue: 0 },
            { name: "unknown31", type: "uint32", defaultValue: 0 },
            { name: "unknown32", type: "uint32", defaultValue: 0 },
            { name: "unknown33", type: "uint32", defaultValue: 0 },
            { name: "unknown34", type: "uint32", defaultValue: 0 },
            { name: "unknown35", type: "uint32", defaultValue: 0 },
            { name: "unknown36", type: "uint32", defaultValue: 0 },
            { name: "unknown37", type: "uint32", defaultValue: 0 },
            { name: "unknown38", type: "uint32", defaultValue: 0 },
            { name: "unknown39", type: "uint32", defaultValue: 0 },
            { name: "unknown40", type: "uint32", defaultValue: 0 },
            { name: "unknown41", type: "uint32", defaultValue: 0 },
            { name: "unknown42", type: "uint32", defaultValue: 0 },
            { name: "unknown43", type: "uint32", defaultValue: 0 },
            { name: "unknown44", type: "uint32", defaultValue: 0 },
            { name: "unknown45", type: "uint32", defaultValue: 0 },
            { name: "unknown46", type: "uint32", defaultValue: 0 },
            { name: "unknown47", type: "uint32", defaultValue: 0 },
            { name: "unknown48", type: "uint32", defaultValue: 0 }
          ]
        },
        {
          name: "array7",
          type: "array",
          fields: [
            { name: "unknown1", type: "uint32", defaultValue: 0 },
            { name: "unknown2", type: "uint32", defaultValue: 0 },
            { name: "unknown3", type: "uint32", defaultValue: 0 },
            { name: "unknown4", type: "uint32", defaultValue: 0 },
            { name: "unknown5", type: "uint32", defaultValue: 0 }
          ]
        }
      ]
    }
  ],
  ["Ability.PulseLocationTargeting", 0x1012, {}],
  ["Ability.ReceivePulseLocation", 0x1013, {}],
  ["Ability.ActivateItemAbility", 0x1014, {}],
  ["Ability.ActivateVehicleAbility", 0x1015, {}],
  ["Ability.DeactivateItemAbility", 0x1016, {}],
  ["Ability.DeactivateVehicleAbility", 0x1017, {}]
];
