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

import * as fs from "fs";
import * as yaml from "js-yaml";
import { Config } from "../models/config";
import { ZoneServer2016 } from "../zoneserver";
import * as path from "node:path";

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

function copyFile(originalFilePath: string, newFilePath: string) {
  const readStream = fs.createReadStream(originalFilePath),
    writeStream = fs.createWriteStream(newFilePath);

  readStream.pipe(writeStream);
  writeStream.on("finish", () => {
    console.log("Config copied successfully!");
    readStream.close();
    writeStream.close();
  });

  writeStream.on("error", (err) => {
    console.error("Error copying config file:", err);
    readStream.close();
    writeStream.close();
  });
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

  private loadYaml(path: string, relative = true): Config | undefined {
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
    } = this.defaultConfig;
    return {
      ...this.defaultConfig,
      ...config,
      server: {
        ...server,
        ...config.server,
      },
      fairplay: {
        ...fairplay,
        ...config.fairplay,
      },
      weather: {
        ...weather,
        ...config.weather,
      },
      worldobjects: {
        ...worldobjects,
        ...config.worldobjects,
      },
      speedtree: {
        ...speedtree,
        ...config.speedtree,
      },
      construction: {
        ...construction,
        ...config.construction,
      },
      decay: {
        ...decay,
        ...config.decay,
      },
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
    } = this.config.server;
    server.proximityItemsDistance = proximityItemsDistance;
    server.interactionDistance = interactionDistance;
    server.charactersRenderDistance = charactersRenderDistance;
    server.tickRate = tickRate;
    server.worldRoutineRate = worldRoutineRate;
    server.welcomeMessage = welcomeMessage;
    server.adminMessage = adminMessage;
    //#endregion

    //#region fairplay
    // to be moved to FairplayManager
    const { useFairplay, maxPing, pingTimeoutTime } = this.config.fairplay;
    server.fairPlayManager.useFairPlay = useFairplay;
    server.fairPlayManager.maxPing = maxPing;
    server.fairPlayManager.pingTimeoutTime = pingTimeoutTime;
    //#endregion

    //#region weather
    const { cycleSpeed, frozeCycle, defaultTemplate } = this.config.weather;
    server.weatherManager.cycleSpeed = cycleSpeed;
    server.weatherManager.frozeCycle = frozeCycle;
    server.weatherManager.defaultTemplate = defaultTemplate;
    //#endregion

    //#region worldobjects
    const {
      vehicleSpawnCap,
      minAirdropSurvivors,
      hasCustomLootRespawnTime,
      lootRespawnTimer,
      vehicleRespawnTimer,
      npcRespawnTimer,
      itemDespawnTimer,
      lootDespawnTimer,
      deadNpcDespawnTimer,
      vehicleSpawnRadius,
      npcSpawnRadius,
      chanceNpc,
      chanceScreamer,
      lootbagDespawnTimer,
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
      maxTreeHits,
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
      playerShackBlockedPlacementRange,
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
      baseConstructionDamage,
      vehicleDamageTicks,
      baseVehicleDamage,
      maxVehiclesPerArea,
      vehicleDamageRange,
    } = this.config.decay;
    server.decayManager.decayTickInterval = decayTickInterval;
    server.decayManager.constructionDamageTicks = constructionDamageTicks;
    server.decayManager.baseConstructionDamage = baseConstructionDamage;
    server.decayManager.vehicleDamageTicks = vehicleDamageTicks;
    server.decayManager.baseVehicleDamage = baseVehicleDamage;
    server.decayManager.maxVehiclesPerArea = maxVehiclesPerArea;
    server.decayManager.vehicleDamageRange = vehicleDamageRange;
    //#endregion

    //#region smelting
    const { burnTime, smeltTime } = this.config.smelting;
    server.smeltingManager.burnTime = burnTime;
    server.smeltingManager.smeltTime = smeltTime;
    //#endregion
  }
}
