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

import * as fs from "fs";
import * as yaml from "js-yaml";
import { Config } from "../models/config";
import { ZoneServer2016 } from "../zoneserver";
import * as path from "node:path";
import { copyFile } from "../../../utils/utils";

process.env.isBin &&
  require("js-yaml") &&
  path.join(__dirname, "../../../../data/2016/sampleData/defaultconfig.yaml");

function fileExists(filePath: string): boolean {
  try {
    fs.accessSync(filePath);
    return true;
  } catch (error) {
    return false;
  }
}

export class ConfigManager {
  private defaultConfig: Config;
  private config: Config;

  constructor(
    server: ZoneServer2016,
    configPath: string = `${process.cwd()}/config.yaml`
  ) {
    this.defaultConfig = this.loadYaml(
      "/../../../../data/2016/sampleData/defaultconfig.yaml"
    ) as Config;

    if (!configPath || !fileExists(configPath)) {
      if (!fileExists(configPath))
        console.error("Config path is invalid! Using default.");

      console.log(
        "Config file not found, creating it in base directory using default values."
      );
      copyFile(
        `${__dirname}/../../../../data/2016/sampleData/defaultconfig.yaml`,
        `${process.cwd()}/config.yaml`
      );

      this.config = this.defaultConfig;
      this.applyConfig(server);
      console.log("Default config loaded!");
      return;
    }

    const config = this.loadYaml(configPath, false);
    if (config) {
      this.config = this.loadConfig(config);
      this.applyConfig(server);
      console.log("Config Loaded!");
      return;
    }

    console.error("Config failed to load! Using default.");
    this.config = this.defaultConfig;
    this.applyConfig(server);
  }

  public loadYaml(path: string, relative = true): Config | undefined {
    return yaml.load(
      fs.readFileSync(`${relative ? __dirname : ""}${path}`, "utf8")
    ) as unknown as Config;
  }

  loadConfig(config: Config): Config {
    // in case new config file is missing certain values / out of date,
    // fill with default values
    const {
      server,
      fairplay,
      weather,
      worldobjects,
      speedtree,
      construction,
      decay,
      smelting
    } = this.defaultConfig;
    return {
      ...this.defaultConfig,
      ...config,
      server: {
        ...server,
        ...config.server
      },
      fairplay: {
        ...fairplay,
        ...config.fairplay
      },
      weather: {
        ...weather,
        ...config.weather
      },
      worldobjects: {
        ...worldobjects,
        ...config.worldobjects
      },
      speedtree: {
        ...speedtree,
        ...config.speedtree
      },
      construction: {
        ...construction,
        ...config.construction
      },
      decay: {
        ...decay,
        ...config.decay
      },
      smelting: {
        ...smelting,
        ...config.smelting
      }
    };
  }

  applyConfig(server: ZoneServer2016) {
    //#region server
    const {
      proximityItemsDistance,
      interactionDistance,
      charactersRenderDistance,
      tickRate,
      worldRoutineRate,
      welcomeMessage,
      adminMessage,
      enableLoginServerKickRequests,
      rebootTime,
      rebootWarnTime,
      isPvE,
      isHeadshotOnly,
      isFirstPersonOnly,
      baseConstructionDamage
    } = this.config.server;
    server.proximityItemsDistance = proximityItemsDistance;
    server.interactionDistance = interactionDistance;
    server.charactersRenderDistance = charactersRenderDistance;
    server.tickRate = tickRate;
    server.worldRoutineRate = worldRoutineRate;
    server.welcomeMessage = welcomeMessage;
    server.adminMessage = adminMessage;
    server.enableLoginServerKickRequests = enableLoginServerKickRequests;
    server.rebootTime = rebootTime;
    server.rebootWarnTime = rebootWarnTime;
    server.isPvE = isPvE;
    server.isHeadshotOnly = isHeadshotOnly;
    server.isFirstPersonOnly = isFirstPersonOnly;
    server.baseConstructionDamage = baseConstructionDamage;
    //#endregion

    //#region fairplay
    // to be moved to FairplayManager
    const {
      useFairplay,
      maxPing,
      acceptedRejectionTypes,
      useAssetValidation,
      hashSubmissionTimeout,
      allowedPacks,
      requiredPacks
    } = this.config.fairplay;
    server.fairPlayManager.useFairPlay = useFairplay;
    server.fairPlayManager.maxPing = maxPing;
    server.fairPlayManager.acceptedRejectionTypes = acceptedRejectionTypes;
    server.fairPlayManager.useAssetValidation = useAssetValidation;
    server.fairPlayManager.hashSubmissionTimeout = hashSubmissionTimeout;
    server.fairPlayManager.allowedPacks = allowedPacks ?? [];
    server.fairPlayManager.requiredPacks = requiredPacks ?? [];
    //#endregion

    //#region weather
    const { defaultTemplate, dynamicEnabled } = this.config.weather;
    server.weatherManager.defaultTemplate = defaultTemplate;
    server.weatherManager.dynamicEnabled = dynamicEnabled;
    //#endregion

    //#region worldobjects
    const {
      vehicleSpawnCap,
      minAirdropSurvivors,
      hasCustomLootRespawnTime,
      lootRespawnTimer,
      vehicleRespawnTimer,
      waterSourceRefillAmount,
      waterSourceReplenishTimer,
      npcRespawnTimer,
      itemDespawnTimer,
      lootDespawnTimer,
      deadNpcDespawnTimer,
      chanceWornLetter,
      vehicleSpawnRadius,
      npcSpawnRadius,
      chanceNpc,
      chanceScreamer,
      lootbagDespawnTimer,
      crowbarHitRewardChance,
      crowbarHitDamage
    } = this.config.worldobjects;
    server.worldObjectManager.vehicleSpawnCap = vehicleSpawnCap;
    server.worldObjectManager.minAirdropSurvivors = minAirdropSurvivors;
    server.worldObjectManager.hasCustomLootRespawnTime =
      hasCustomLootRespawnTime;
    server.worldObjectManager.lootRespawnTimer = lootRespawnTimer;
    server.worldObjectManager.vehicleRespawnTimer = vehicleRespawnTimer;
    server.worldObjectManager.npcRespawnTimer = npcRespawnTimer;

    server.worldObjectManager.itemDespawnTimer = itemDespawnTimer;
    server.worldObjectManager.lootDespawnTimer = lootDespawnTimer;
    server.worldObjectManager.deadNpcDespawnTimer = deadNpcDespawnTimer;
    server.worldObjectManager.lootbagDespawnTimer = lootbagDespawnTimer;

    server.worldObjectManager.vehicleSpawnRadius = vehicleSpawnRadius;
    server.worldObjectManager.npcSpawnRadius = npcSpawnRadius;
    server.worldObjectManager.chanceNpc = chanceNpc;
    server.worldObjectManager.chanceScreamer = chanceScreamer;

    server.worldObjectManager.chanceWornLetter = chanceWornLetter;

    server.worldObjectManager.waterSourceReplenishTimer =
      waterSourceReplenishTimer;
    server.worldObjectManager.waterSourceRefillAmount = waterSourceRefillAmount;

    server.crowbarHitRewardChance = crowbarHitRewardChance;
    server.crowbarHitDamage = crowbarHitDamage;
    //#endregion

    //#region speedtree
    const {
      minBlackberryHarvest,
      maxBlackberryHarvest,
      branchHarvestChance,
      minStickHarvest,
      maxStickHarvest,
      treeRespawnTimeMS,
      minWoodLogHarvest,
      maxWoodLogHarvest,
      minTreeHits,
      maxTreeHits
    } = this.config.speedtree;
    server.speedtreeManager.minBlackberryHarvest = minBlackberryHarvest;
    server.speedtreeManager.maxBlackberryHarvest = maxBlackberryHarvest;
    server.speedtreeManager.branchHarvestChance = branchHarvestChance;
    server.speedtreeManager.minStickHarvest = minStickHarvest;
    server.speedtreeManager.maxStickHarvest = maxStickHarvest;
    server.speedtreeManager.treeRespawnTimeMS = treeRespawnTimeMS;
    server.speedtreeManager.minWoodLogHarvest = minWoodLogHarvest;
    server.speedtreeManager.maxWoodLogHarvest = maxWoodLogHarvest;
    server.speedtreeManager.minTreeHits = minTreeHits;
    server.speedtreeManager.maxTreeHits = maxTreeHits;
    //#endregion

    //#region construction
    const {
      allowPOIPlacement,
      allowStackedPlacement,
      allowOutOfBoundsPlacement,
      placementRange,
      spawnPointBlockedPlacementRange,
      vehicleSpawnPointBlockedPlacementRange,
      playerFoundationBlockedPlacementRange,
      playerShackBlockedPlacementRange
    } = this.config.construction;
    server.constructionManager.allowPOIPlacement = allowPOIPlacement;
    server.constructionManager.allowStackedPlacement = allowStackedPlacement;
    server.constructionManager.allowOutOfBoundsPlacement =
      allowOutOfBoundsPlacement;
    server.constructionManager.placementRange = placementRange;
    server.constructionManager.spawnPointBlockedPlacementRange =
      spawnPointBlockedPlacementRange;
    server.constructionManager.vehicleSpawnPointBlockedPlacementRange =
      vehicleSpawnPointBlockedPlacementRange;
    server.constructionManager.playerFoundationBlockedPlacementRange =
      playerFoundationBlockedPlacementRange;
    server.constructionManager.playerShackBlockedPlacementRange =
      playerShackBlockedPlacementRange;
    //#endregion

    //#region decay
    const {
      decayTickInterval,
      constructionDamageTicks,
      ticksToFullDecay,
      worldFreeplaceDecayMultiplier,
      vehicleDamageTicks,
      vacantFoundationTicks,
      baseVehicleDamage,
      maxVehiclesPerArea,
      vehicleDamageRange,
      dailyRepairMaterials
    } = this.config.decay;
    server.decayManager.decayTickInterval = decayTickInterval;
    server.decayManager.constructionDamageTicks = constructionDamageTicks;
    server.decayManager.ticksToFullDecay = ticksToFullDecay;
    (server.decayManager.worldFreeplaceDecayMultiplier =
      worldFreeplaceDecayMultiplier),
      (server.decayManager.vehicleDamageTicks = vehicleDamageTicks);
    server.decayManager.vacantFoundationTicks = vacantFoundationTicks;
    server.decayManager.baseVehicleDamage = baseVehicleDamage;
    server.decayManager.maxVehiclesPerArea = maxVehiclesPerArea;
    server.decayManager.vehicleDamageRange = vehicleDamageRange;
    server.decayManager.dailyRepairMaterials = dailyRepairMaterials;
    //#endregion

    //#region smelting
    const { burnTime, smeltTime } = this.config.smelting;
    server.smeltingManager.burnTime = burnTime;
    server.smeltingManager.smeltTime = smeltTime;
    //#endregion
  }
}
