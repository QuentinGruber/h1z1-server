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

export const missionsPackets: any = [
  ["Missions.ListMissions", 0x9d01, {}],
  ["Missions.ConquerZone", 0x9d02, {}],
  ["Missions.SelectMission", 0x9d03, {}],
  ["Missions.UnselectMission", 0x9d04, {}],
  ["Missions.SetMissionInstanceManager", 0x9d05, {}],
  ["Missions.SetMissionManager", 0x9d06, {}],
  ["Missions.AddGlobalAvailableMission", 0x9d07, {}],
  ["Missions.RemoveGlobalAvailableMission", 0x9d08, {}],
  ["Missions.AddAvailableMission", 0x9d09, {}],
  ["Missions.RemoveAvailableMission", 0x9d0a, {}],
  ["Missions.AddActiveMission", 0x9d0b, {}],
  ["Missions.RemoveActiveMission", 0x9d0c, {}],
  ["Missions.ReportCompletedMission", 0x9d0d, {}],
  ["Missions.AddAvailableMissions", 0x9d0e, {}],
  ["Missions.SetMissionChangeList", 0x9d0f, {}],
  ["Missions.SetConqueredZone", 0x9d10, {}],
  ["Missions.UnsetConqueredZone", 0x9d11, {}],
  ["Missions.SetConqueredZones", 0x9d12, {}],
];
