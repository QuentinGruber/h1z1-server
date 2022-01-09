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

export const abilitiesPackets: any = [
  [
    "Abilities.InitAbility",
    0xa001,
    {
      fields: [
        { name: "unknownDword1", type: "uint32", defaultValue: 0 },
        { name: "unknownDword2", type: "uint32", defaultValue: 0 },
        { name: "unknownDword3", type: "uint32", defaultValue: 0 },
        { name: "unknownDword4", type: "uint32", defaultValue: 0 },
        { name: "unknownQword1", type: "uint64string", defaultValue: "0x000" },
        { name: "unknownQword2", type: "uint64string", defaultValue: "0x000" },
        {
          name: "unknownSchema1",
          type: "schema",
          defaultValue: [],
          fields: [
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
              name: "unknownFloatVector1",
              type: "floatvector4",
              defaultValue: 0,
            },
          ],
        },
        { name: "unknownWord1", type: "uint8", defaultValue: 0 },
        {
          name: "unknownArray6",
          type: "schema",
          defaultValue: [],
          fields: [
            { name: "unknownWord2", type: "uint8", defaultValue: 0 },
            {
              name: "unknownArray1",
              type: "array",
              defaultValue: [],
              fields: [
                { name: "unknownDword6", type: "uint32", defaultValue: 0 },
                { name: "unknownDword7", type: "uint32", defaultValue: 0 },
              ],
            },
            {
              name: "unknownArray2",
              type: "array",
              defaultValue: [],
              fields: [
                { name: "unknownDword8", type: "uint32", defaultValue: 0 },
                { name: "unknownDword9", type: "uint32", defaultValue: 0 },
              ],
            },
            {
              name: "unknownArray3",
              type: "array",
              defaultValue: [],
              fields: [
                { name: "unknownDword10", type: "uint32", defaultValue: 0 },
                { name: "unknownWord1", type: "uint8", defaultValue: 0 },
              ],
            },
            {
              name: "unknownArray4",
              type: "array",
              defaultValue: [],
              fields: [
                { name: "unknownDword11", type: "uint32", defaultValue: 0 },
                {
                  name: "unknownFloatVector2",
                  type: "floatvector4",
                  defaultValue: 0,
                },
              ],
            },
            {
              name: "unknownArray5",
              type: "array",
              defaultValue: [],
              fields: [
                { name: "unknownDword13", type: "uint32", defaultValue: 0 },
                { name: "unknownString1", type: "string", defaultValue: "0" },
              ],
            },
          ],
        },
      ],
    },
  ],
  ["Abilities.UpdateAbility", 0xa002, {}],
  ["Abilities.UninitAbility", 0xa003, {}],
  ["Abilities.SetAbilityActivationManager", 0xa004, {}],
  [
    "Abilities.SetActivatableAbilityManager",
    0xa005,
    {
      fields: [
        {
          name: "unknownArray1",
          type: "array",
          defaultValue: [],
          fields: [
            { name: "unknownQword1", type: "uint64string", defaultValue: "0" },
            {
              name: "unknownData1",
              type: "schema",
              fields: [
                {
                  name: "unknownQword1",
                  type: "uint64string",
                  defaultValue: "0",
                },
                { name: "unknownDword1", type: "uint32", defaultValue: 0 },
                { name: "unknownDword2", type: "uint32", defaultValue: 0 },
              ],
            },
            { name: "unknownDword1", type: "uint32", defaultValue: 0 },
            { name: "unknownByte1", type: "uint8", defaultValue: 0 },
          ],
        },
      ],
    },
  ],
  ["Abilities.SetVehicleActivatableAbilityManager", 0xa006, {}],
  ["Abilities.SetAbilityTimerManager", 0xa007, {}],
  ["Abilities.AddAbilityTimer", 0xa008, {}],
  ["Abilities.RemoveAbilityTimer", 0xa009, {}],
  ["Abilities.UpdateAbilityTimer", 0xa00a, {}],
  ["Abilities.SetAbilityLockTimer", 0xa00b, {}],
  ["Abilities.ActivateAbility", 0xa00c, {}],
  ["Abilities.VehicleActivateAbility", 0xa00d, {}],
  ["Abilities.DeactivateAbility", 0xa00e, {}],
  ["Abilities.VehicleDeactivateAbility", 0xa00f, {}],
  ["Abilities.ActivateAbilityFailed", 0xa010, {}],
  ["Abilities.VehicleActivateAbilityFailed", 0xa011, {}],
  ["Abilities.ClearAbilityLineManager", 0xa012, {}],
  ["Abilities.SetAbilityLineManager", 0xa013, {}],
  ["Abilities.SetProfileAbilityLineMembers", 0xa014, {}],
  ["Abilities.SetProfileAbilityLineMember", 0xa015, {}],
  ["Abilities.RemoveProfileAbilityLineMember", 0xa016, {}],
  ["Abilities.SetVehicleAbilityLineMembers", 0xa017, {}],
  ["Abilities.SetVehicleAbilityLineMember", 0xa018, {}],
  ["Abilities.RemoveVehicleAbilityLineMember", 0xa019, {}],
  ["Abilities.SetFacilityAbilityLineMembers", 0xa01a, {}],
  ["Abilities.SetFacilityAbilityLineMember", 0xa01b, {}],
  ["Abilities.RemoveFacilityAbilityLineMember", 0xa01c, {}],
  ["Abilities.SetEmpireAbilityLineMembers", 0xa01d, {}],
  ["Abilities.SetEmpireAbilityLineMember", 0xa01e, {}],
  ["Abilities.RemoveEmpireAbilityLineMember", 0xa01f, {}],
  [
    "Abilities.SetLoadoutAbilities",
    0xa020,
    {
      fields: [
        {
          name: "abilities",
          type: "array",
          defaultValue: [],
          fields: [
            { name: "abilitySlotId", type: "uint32", defaultValue: 0 },
            {
              name: "abilityData",
              type: "schema",
              fields: [
                { name: "abilitySlotId", type: "uint32", defaultValue: 0 },
                { name: "abilityId", type: "uint32", defaultValue: 0 },
                { name: "unknownDword1", type: "uint32", defaultValue: 0 },
                { name: "guid1", type: "uint64string", defaultValue: "0" },
                { name: "guid2", type: "uint64string", defaultValue: "0" },
              ],
            },
          ],
        },
      ],
    },
  ],
  ["Abilities.AddLoadoutAbility", 0xa021, {}],
  ["Abilities.RemoveLoadoutAbility", 0xa022, {}],
  ["Abilities.SetImplantAbilities", 0xa023, {}],
  ["Abilities.AddImplantAbility", 0xa024, {}],
  ["Abilities.RemoveImplantAbility", 0xa025, {}],
  ["Abilities.SetPersistentAbilities", 0xa026, {}],
  ["Abilities.AddPersistentAbility", 0xa027, {}],
  ["Abilities.RemovePersistentAbility", 0xa028, {}],
  ["Abilities.SetProfileRankAbilities", 0xa029, {}],
  ["Abilities.AddProfileRankAbility", 0xa02a, {}],
  ["Abilities.RemoveProfileRankAbility", 0xa02b, {}],
];
