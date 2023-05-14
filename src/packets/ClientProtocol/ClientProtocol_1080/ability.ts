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

export const abilityPackets: PacketStructures = [
  ["Ability.ClientRequestStartAbility", 0x1001, {}],
  ["Ability.ClientRequestStopAbility", 0x1002, {}],
  ["Ability.ClientMoveAndCast", 0x1003, {}],
  ["Ability.Failed", 0x1004, {}],
  ["Ability.StartCasting", 0x1005, {}],
  ["Ability.Launch", 0x1006, {}],
  ["Ability.Land", 0x1007, {}],
  ["Ability.StartChanneling", 0x1008, {}],
  ["Ability.StopCasting", 0x1009, {}],
  ["Ability.StopAura", 0x100a, {}],
  ["Ability.MeleeRefresh", 0x100b, {}],
  ["Ability.AbilityDetails", 0x100c, {}],
  ["Ability.PurchaseAbility", 0x100d, {}],
  ["Ability.UpdateAbilityExperience", 0x100e, {}],
  ["Ability.SetDefinition", 0x100f, {}],
  ["Ability.RequestAbilityDefinition", 0x1010, {}],
  ["Ability.AddAbilityDefinition", 0x1011, {}],
  ["Ability.PulseLocationTargeting", 0x1012, {}],
  ["Ability.ReceivePulseLocation", 0x1013, {}],
  ["Ability.ActivateItemAbility", 0x1014, {}],
  ["Ability.ActivateVehicleAbility", 0x1015, {}],
  ["Ability.DeactivateItemAbility", 0x1016, {}],
  ["Ability.DeactivateVehicleAbility", 0x1017, {}]
];
