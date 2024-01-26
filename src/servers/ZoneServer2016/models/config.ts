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

import { dailyRepairMaterial } from ".../../types/zoneserver";
import { FileHash } from ".../../types/shared";
import { CONNECTION_REJECTION_FLAGS } from "utils/enums";

interface ServerConfig {
  proximityItemsDistance: number;
  interactionDistance: number;
  charactersRenderDistance: number;
  tickRate: number;
  worldRoutineRate: number;
  welcomeMessage: string;
  adminMessage: string;
  enableLoginServerKickRequests: boolean;
  rebootTime: number;
  rebootWarnTime: number;
  isPvE: boolean;
  isHeadshotOnly: boolean;
  isFirstPersonOnly: boolean;
  baseConstructionDamage: number;
}

interface FairplayConfig {
  useFairplay: boolean;
  maxPing: number;
  pingTimeoutTime: number;
  acceptedRejectionTypes: Array<CONNECTION_REJECTION_FLAGS>;
  useAssetValidation: boolean;
  hashSubmissionTimeout: number;
  allowedPacks: Array<FileHash>;
  requiredPacks: Array<FileHash>;
}

interface WeatherConfig {
  defaultTemplate: string;
  dynamicEnabled: boolean;
}

interface WorldObjectsConfig {
  vehicleSpawnCap: number;
  minAirdropSurvivors: number;
  hasCustomLootRespawnTime: boolean;
  lootRespawnTimer: number;
  vehicleRespawnTimer: number;
  waterSourceReplenishTimer: number;
  waterSourceRefillAmount: number;
  npcRespawnTimer: number;

  itemDespawnTimer: number;
  lootDespawnTimer: number;
  deadNpcDespawnTimer: number;
  lootbagDespawnTimer: number;

  chanceWornLetter: number;

  vehicleSpawnRadius: number;
  npcSpawnRadius: number;
  chanceNpc: number;
  chanceScreamer: number;

  crowbarHitRewardChance: number;
  crowbarHitDamage: number;
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
  ticksToFullDecay: number;
  worldFreeplaceDecayMultiplier: number;
  vehicleDamageTicks: number;
  vacantFoundationTicks: number;
  griefFoundationTimer: number;
  griefCheckSlotAmount: number;
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
