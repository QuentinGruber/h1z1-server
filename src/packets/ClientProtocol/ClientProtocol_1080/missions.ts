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

export const missionsPackets: PacketStructures = [
  ["Missions.ListMissions", 0x9e01, {}],
  ["Missions.ConquerZone", 0x9e02, {}],
  ["Missions.SelectMission", 0x9e03, {}],
  ["Missions.UnselectMission", 0x9e04, {}],
  ["Missions.SetMissionInstanceManager", 0x9e05, {}],
  ["Missions.SetMissionManager", 0x9e06, {}],
  ["Missions.AddGlobalAvailableMission", 0x9e07, {}],
  ["Missions.RemoveGlobalAvailableMission", 0x9e08, {}],
  ["Missions.AddAvailableMission", 0x9e09, {}],
  ["Missions.RemoveAvailableMission", 0x9e0a, {}],
  ["Missions.AddActiveMission", 0x9e0b, {}],
  ["Missions.RemoveActiveMission", 0x9e0c, {}],
  ["Missions.ReportCompletedMission", 0x9e0d, {}],
  ["Missions.AddAvailableMissions", 0x9e0e, {}],
  ["Missions.SetMissionChangeList", 0x9e0f, {}],
  ["Missions.SetConqueredZone", 0x9e10, {}],
  ["Missions.UnsetConqueredZone", 0x9e11, {}],
  ["Missions.SetConqueredZones", 0x9e12, {}]
];
