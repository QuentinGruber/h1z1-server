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

import { dailyRepairMaterial } from ".../../types/zoneserver";

interface ServerConfig {
  proximityItemsDistance: number;
  interactionDistance: number;
  charactersRenderDistance: number;
  tickRate: number;
  worldRoutineRate: number;
  welcomeMessage: string;
  adminMessage: string;
  enableLoginServerKickRequests: boolean;
}

interface FairplayConfig {
  useFairplay: boolean;
  maxPing: number;
  pingTimeoutTime: number;
}

interface WeatherConfig {
  cycleSpeed: number;
  frozeCycle: boolean;
  defaultTemplate: string;
}

interface WorldObjectsConfig {
  vehicleSpawnCap: number;
  minAirdropSurvivors: number;
  hasCustomLootRespawnTime: boolean;
  lootRespawnTimer: number;
  vehicleRespawnTimer: number;
  npcRespawnTimer: number;

  itemDespawnTimer: number;
  lootDespawnTimer: number;
  deadNpcDespawnTimer: number;
  lootbagDespawnTimer: number;

  vehicleSpawnRadius: number;
  npcSpawnRadius: number;
  chanceNpc: number;
  chanceScreamer: number;
}

interface SpeedTreeConfig {
  minBlackberryHarvest: number;
  maxBlackberryHarvest: number;
  branchHarvestChance: number;
  minStickHarvest: number;
  maxStickHarvest: number;
  treeRespawnTimeMS: number;
  minWoodLogHarvest: number;
  maxWoodLogHarvest: number;
  minTreeHits: number;
  maxTreeHits: number;
}

interface ConstructionConfig {
  allowPOIPlacement: boolean;
  allowStackedPlacement: boolean;
  allowOutOfBoundsPlacement: boolean;
  placementRange: number;
  spawnPointBlockedPlacementRange: number;
  vehicleSpawnPointBlockedPlacementRange: number;
  playerFoundationBlockedPlacementRange: number;
  playerShackBlockedPlacementRange: number;
}

interface DecayConfig {
  decayTickInterval: number;
  constructionDamageTicks: number;
  baseConstructionDamage: number;
  repairBoxHealValue: number;
  vehicleDamageTicks: number;
  vacantFoundationTicks: number;
  baseVehicleDamage: number;
  maxVehiclesPerArea: number;
  vehicleDamageRange: number;
  dailyRepairMaterials: dailyRepairMaterial[];
}

interface SmeltingConfig {
  burnTime: number;
  smeltTime: number;
}

export interface Config {
  server: ServerConfig;
  fairplay: FairplayConfig;
  weather: WeatherConfig;
  worldobjects: WorldObjectsConfig;
  speedtree: SpeedTreeConfig;
  construction: ConstructionConfig;
  decay: DecayConfig;
  smelting: SmeltingConfig;
}
