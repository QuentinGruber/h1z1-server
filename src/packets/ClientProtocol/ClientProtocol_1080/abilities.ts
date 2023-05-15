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

export const abilitiesPackets: PacketStructures = [
  ["Abilities.InitAbility", 0xa101, {}],
  ["Abilities.UpdateAbility", 0xa102, {}],
  ["Abilities.UninitAbility", 0xa103, {}],
  ["Abilities.SetAbilityActivationManager", 0xa104, {}],
  [
    "Abilities.SetActivatableAbilityManager",
    0xa105,
    {
      fields: [
        {
          name: "unknownArray1",
          type: "array",
          defaultValue: [{}],
          fields: [
            { name: "unknownQword1", type: "uint64string", defaultValue: "0" },
            {
              name: "unknownData1",
              type: "schema",
              fields: [
                {
                  name: "unknownQword1",
                  type: "uint64string",
                  defaultValue: "0"
                },
                { name: "unknownDword1", type: "uint32", defaultValue: 0 },
                { name: "unknownDword2", type: "uint32", defaultValue: 0 }
              ]
            },
            { name: "unknownDword1", type: "uint32", defaultValue: 0 },
            { name: "unknownByte1", type: "uint8", defaultValue: 0 }
          ]
        }
      ]
    }
  ],
  ["Abilities.SetVehicleActivatableAbilityManager", 0xa106, {}],
  ["Abilities.SetAbilityTimerManager", 0xa107, {}],
  ["Abilities.AddAbilityTimer", 0xa108, {}],
  ["Abilities.RemoveAbilityTimer", 0xa109, {}],
  ["Abilities.UpdateAbilityTimer", 0xa10a, {}],
  ["Abilities.SetAbilityLockTimer", 0xa10b, {}],
  ["Abilities.ActivateAbility", 0xa10c, {}],
  ["Abilities.VehicleActivateAbility", 0xa10d, {}],
  ["Abilities.DeactivateAbility", 0xa10e, {}],
  ["Abilities.VehicleDeactivateAbility", 0xa10f, {}],
  ["Abilities.ActivateAbilityFailed", 0xa110, {}],
  ["Abilities.VehicleActivateAbilityFailed", 0xa111, {}],
  ["Abilities.ClearAbilityLineManager", 0xa112, {}],
  ["Abilities.SetAbilityLineManager", 0xa113, {}],
  ["Abilities.SetProfileAbilityLineMembers", 0xa114, {}],
  ["Abilities.SetProfileAbilityLineMember", 0xa115, {}],
  ["Abilities.RemoveProfileAbilityLineMember", 0xa116, {}],
  ["Abilities.SetVehicleAbilityLineMembers", 0xa117, {}],
  ["Abilities.SetVehicleAbilityLineMember", 0xa118, {}],
  ["Abilities.RemoveVehicleAbilityLineMember", 0xa119, {}],
  ["Abilities.SetFacilityAbilityLineMembers", 0xa11a, {}],
  ["Abilities.SetFacilityAbilityLineMember", 0xa11b, {}],
  ["Abilities.RemoveFacilityAbilityLineMember", 0xa11c, {}],
  ["Abilities.SetEmpireAbilityLineMembers", 0xa11d, {}],
  ["Abilities.SetEmpireAbilityLineMember", 0xa11e, {}],
  ["Abilities.RemoveEmpireAbilityLineMember", 0xa11f, {}],
  [
    "Abilities.SetLoadoutAbilities",
    0xa120,
    {
      fields: [
        {
          name: "abilities",
          type: "array",
          defaultValue: [{}],
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
                { name: "guid2", type: "uint64string", defaultValue: "0" }
              ]
            }
          ]
        }
      ]
    }
  ],
  ["Abilities.AddLoadoutAbility", 0xa121, {}],
  ["Abilities.RemoveLoadoutAbility", 0xa122, {}],
  ["Abilities.SetImplantAbilities", 0xa123, {}],
  ["Abilities.AddImplantAbility", 0xa124, {}],
  ["Abilities.RemoveImplantAbility", 0xa125, {}],
  ["Abilities.SetPersistentAbilities", 0xa126, {}],
  ["Abilities.AddPersistentAbility", 0xa127, {}],
  ["Abilities.RemovePersistentAbility", 0xa128, {}],
  ["Abilities.SetProfileRankAbilities", 0xa129, {}],
  ["Abilities.AddProfileRankAbility", 0xa12a, {}],
  ["Abilities.RemoveProfileRankAbility", 0xa12b, {}]
];
