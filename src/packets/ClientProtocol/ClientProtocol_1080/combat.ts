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

export const combatPackets: PacketStructures = [
  ["Combat.AutoAttackTarget", 0x0c01, {}],
  ["Combat.AutoAttackOff", 0x0c02, {}],
  ["Combat.SingleAttackTarget", 0x0c03, {}],
  ["Combat.AttackTargetDamage", 0x0c04, {}],
  ["Combat.AttackAttackerMissed", 0x0c05, {}],
  ["Combat.AttackTargetDodged", 0x0c06, {}],
  ["Combat.AttackProcessed", 0x0c07, {}],
  ["Combat.EnableBossDisplay", 0x0c09, {}],
  ["Combat.AttackTargetBlocked", 0x0c0a, {}],
  ["Combat.AttackTargetParried", 0x0c0b, {}]
];
