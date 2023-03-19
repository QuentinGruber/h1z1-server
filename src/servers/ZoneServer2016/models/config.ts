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

interface FairplayConfig {
  useFairplay: boolean;
  maxPing: number;
}

interface WeatherConfig {
  cycleSpeed: number;
  frozeCycle: boolean;
  defaultTemplate: string;
}

interface WorldObjectsConfig {
  vehicleSpawnCap: number;
  lootRespawnTimer: number;
  vehicleRespawnTimer: number;
  npcRespawnTimer: number;

  itemDespawnTimer: number;
  lootDespawnTimer: number;
  deadNpcDespawnTimer: number;

  vehicleSpawnRadius: number;
  npcSpawnRadius: number;
  chanceNpc: number;
  chanceScreamer: number;
}

export interface ServerConfig {
  fairplay: FairplayConfig;
  weather: WeatherConfig;
  worldobjects: WorldObjectsConfig;
}