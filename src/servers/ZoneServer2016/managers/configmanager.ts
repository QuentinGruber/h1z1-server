// ======================================================================
//
//   GNU GENERAL PUBLIC LICENSE
//   Version 3, 29 June 2007
//   copyright (C) 2020 - 2021 Quentin Gruber
//   copyright (C) 2021 - 2026 H1emu community
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
import { copyFile } from "../../../utils/utils";
import { GameModes } from "../models/enums";

function fileExists(filePath: string): boolean {
  try {
    fs.accessSync(filePath);
    return true;
    /* eslint-disable @typescript-eslint/no-unused-vars */
  } catch (error) {
    return false;
  }
}

export class ConfigManager {
  private defaultConfig: Config;
  private config: Config;
  private configPath: string;

  constructor(
    server: ZoneServer2016,
    configPath: string = `${process.cwd()}/config.yaml`
  ) {
    this.configPath = configPath;
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
      this.applyEnvOverrides();
      this.applyConfig(server);
      console.log("Default config loaded!");
      return;
    }

    const config = this.loadYaml(configPath, false);
    if (config) {
      this.config = this.loadConfig(config);
      this.applyEnvOverrides();
      this.applyConfig(server);
      console.log("Config Loaded!");
      return;
    }

    console.error("Config failed to load! Using default.");
    this.config = this.defaultConfig;
    this.applyEnvOverrides();
    this.applyConfig(server);
  }

  reload(server: ZoneServer2016): boolean {
    if (!this.configPath || !fileExists(this.configPath)) {
      console.error("Config path is invalid! Cannot reload.");
      return false;
    }

    const config = this.loadYaml(this.configPath, false);
    if (!config) {
      console.error("Config failed to reload!");
      return false;
    }

    this.config = this.loadConfig(config);
    this.applyEnvOverrides();
    this.applyConfig(server);
    console.log("Config reloaded!");
    return true;
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
      rcon,
      challenges: challenge,
      fairplay,
      voicechat,
      weather,
      airdrop,
      worldobjects,
      speedtree,
      construction,
      decay,
      smelting,
      randomevents,
      groups,
      ai
    } = this.defaultConfig;
    return {
      ...this.defaultConfig,
      ...config,
      server: {
        ...server,
        ...config.server
      },
      rcon: {
        ...rcon,
        ...config.rcon
      },
      challenges: {
        ...challenge,
        ...config.challenges
      },
      voicechat: {
        ...voicechat,
        ...config.voicechat
      },
      fairplay: {
        ...fairplay,
        ...config.fairplay
      },
      weather: {
        ...weather,
        ...config.weather
      },
      airdrop: {
        ...airdrop,
        ...config.airdrop
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
      },
      randomevents: {
        ...randomevents,
        ...config.randomevents
      },
      groups: {
        ...groups,
        ...config.groups
      },
      ai: {
        ...ai,
        ...config.ai
      }
    };
  }

  /**
   * Applies environment variable overrides to this.config.
   *
   * Naming convention: <SECTION>_<FIELD_NAME>
   * where FIELD_NAME is the camelCase field converted to SCREAMING_SNAKE_CASE.
   *
   * Examples:
   *   SERVER_GAME_MODE, SERVER_IS_PVE, RCON_PORT, RCON_PASSWORD,
   *   WORLDOBJECTS_GRID_SCRAP_LIMIT, VOICECHAT_SERVER_ADDRESS, ...
   *
   * Backward-compat aliases (old names still work):
   *   GRID_SCRAP_LIMIT           -> WORLDOBJECTS_GRID_SCRAP_LIMIT
   *   GRID_SCRAP_LIMIT_ENABLED   -> WORLDOBJECTS_GRID_SCRAP_LIMIT_ENABLED
   *   VOICE_CHAT_SERVER_ADDRESS  -> VOICECHAT_SERVER_ADDRESS
   *
   * Array/object fields (e.g. fairplay.acceptedRejectionTypes,
   * decay.dailyRepairMaterials) are not overridable via env vars.
   */
  private applyEnvOverrides(): void {
    const normalizedEnv = new Map<string, string>(
      Object.entries(process.env)
        .filter((entry): entry is [string, string] => entry[1] !== undefined)
        .map(([k, v]) => [k.toLowerCase(), v])
    );

    this.applyEnvToSection(
      "SERVER",
      this.config.server as unknown as Record<string, unknown>,
      normalizedEnv
    );
    this.applyEnvToSection(
      "RCON",
      this.config.rcon as unknown as Record<string, unknown>,
      normalizedEnv
    );
    this.applyEnvToSection(
      "CHALLENGES",
      this.config.challenges as unknown as Record<string, unknown>,
      normalizedEnv
    );
    this.applyEnvToSection(
      "VOICECHAT",
      this.config.voicechat as unknown as Record<string, unknown>,
      normalizedEnv
    );
    this.applyEnvToSection(
      "FAIRPLAY",
      this.config.fairplay as unknown as Record<string, unknown>,
      normalizedEnv
    );
    this.applyEnvToSection(
      "WEATHER",
      this.config.weather as unknown as Record<string, unknown>,
      normalizedEnv
    );
    this.applyEnvToSection(
      "AIRDROP",
      this.config.airdrop as unknown as Record<string, unknown>,
      normalizedEnv
    );
    this.applyEnvToSection(
      "GAMETIME",
      this.config.gametime as unknown as Record<string, unknown>,
      normalizedEnv
    );
    this.applyEnvToSection(
      "WORLDOBJECTS",
      this.config.worldobjects as unknown as Record<string, unknown>,
      normalizedEnv
    );
    this.applyEnvToSection(
      "SPEEDTREE",
      this.config.speedtree as unknown as Record<string, unknown>,
      normalizedEnv
    );
    this.applyEnvToSection(
      "CONSTRUCTION",
      this.config.construction as unknown as Record<string, unknown>,
      normalizedEnv
    );
    this.applyEnvToSection(
      "DECAY",
      this.config.decay as unknown as Record<string, unknown>,
      normalizedEnv
    );
    this.applyEnvToSection(
      "SMELTING",
      this.config.smelting as unknown as Record<string, unknown>,
      normalizedEnv
    );
    this.applyEnvToSection(
      "RANDOMEVENTS",
      this.config.randomevents as unknown as Record<string, unknown>,
      normalizedEnv
    );
    this.applyEnvToSection(
      "GROUPS",
      this.config.groups as unknown as Record<string, unknown>,
      normalizedEnv
    );
    this.applyEnvToSection(
      "AI",
      this.config.ai as unknown as Record<string, unknown>,
      normalizedEnv
    );

    // Backward-compat aliases
    const gridScrapLimit = normalizedEnv.get("grid_scrap_limit");
    if (gridScrapLimit !== undefined) {
      const n = parseInt(gridScrapLimit, 10);
      if (!isNaN(n)) this.config.worldobjects.gridScrapLimit = n;
    }
    const gridScrapLimitEnabled = normalizedEnv.get("grid_scrap_limit_enabled");
    if (gridScrapLimitEnabled !== undefined) {
      this.config.worldobjects.gridScrapLimitEnabled =
        gridScrapLimitEnabled.toLowerCase() === "true";
    }
    const voiceChatServerAddress = normalizedEnv.get(
      "voice_chat_server_address"
    );
    if (voiceChatServerAddress !== undefined) {
      this.config.voicechat.serverAddress = voiceChatServerAddress;
    }
  }

  // Overrides for fields where the automatic camelCase→SCREAMING_SNAKE
  // conversion produces an unintuitive name (e.g. isPvE → IS_PVE, not IS_PV_E).
  private static readonly fieldKeyOverrides: Record<string, string> = {
    isPvE: "IS_PVE"
  };

  /**
   * Iterates all primitive (non-array, non-object) fields in a config section
   * and applies matching environment variables using the naming convention
   * `${prefix}_${SCREAMING_SNAKE_CASE_FIELD}`.
   * Lookup is case-insensitive.
   */
  private applyEnvToSection(
    prefix: string,
    section: Record<string, unknown>,
    normalizedEnv: Map<string, string>
  ): void {
    for (const [field, currentValue] of Object.entries(section)) {
      if (currentValue === null || typeof currentValue === "object") continue;

      const fieldKey =
        ConfigManager.fieldKeyOverrides[field] ??
        field.replace(/([a-z])([A-Z])/g, "$1_$2").toUpperCase();
      const envKey = `${prefix}_${fieldKey}`.toLowerCase();
      const raw = normalizedEnv.get(envKey);
      if (raw === undefined) continue;

      if (typeof currentValue === "number") {
        const n = parseFloat(raw);
        if (!isNaN(n)) section[field] = n;
      } else if (typeof currentValue === "boolean") {
        section[field] = raw.toLowerCase() === "true";
      } else {
        section[field] = raw;
      }
    }
  }

  applyConfig(server: ZoneServer2016) {
    //#region server
    const {
      gameMode,
      proximityItemsDistance,
      interactionDistance,
      charactersRenderDistance,
      worldRoutineRate,
      welcomeMessage,
      adminMessage,
      enableLoginServerKickRequests,
      rebootTime,
      rebootWarnTime,
      isPvE,
      isHeadshotOnly,
      isFirstPersonOnly,
      isNoBuildInPois,
      baseConstructionDamage,
      damageWeapons,
      disablePOIManager,
      disableMapBoundsCheck,
      disableBaseCheck
    } = this.config.server;
    server.gameMode =
      GameModes[gameMode.trim().toUpperCase() as keyof typeof GameModes] ??
      GameModes.SURVIVAL;
    server.proximityItemsDistance = proximityItemsDistance;
    server.interactionDistance = interactionDistance;
    server.charactersRenderDistance = charactersRenderDistance;
    server.worldRoutineRate = worldRoutineRate;
    server.welcomeMessage = welcomeMessage;
    server.adminMessage = adminMessage;
    server.enableLoginServerKickRequests = enableLoginServerKickRequests;
    server.rebootTime = rebootTime;
    server.rebootWarnTime = rebootWarnTime;
    server.isPvE = isPvE;
    server.isHeadshotOnly = isHeadshotOnly;
    server.isFirstPersonOnly = isFirstPersonOnly;
    server.isNoBuildInPois = isNoBuildInPois;
    server.baseConstructionDamage = baseConstructionDamage;
    server.damageWeapons = damageWeapons;
    server.disablePOIManager = disablePOIManager;
    server.disableMapBoundsCheck = disableMapBoundsCheck;
    server.disableBaseCheck = disableBaseCheck;
    //#endregion

    //#region Rcon
    const { port, password } = this.config.rcon;
    server.rconManager.wssPort = port;
    server.rconManager.password = password;

    //#region Challenges
    const { enabled: challengeEnabled, challengePerDay } =
      this.config.challenges;
    server.challengeManager.enabled = challengeEnabled;
    server.challengeManager.challengesPerDay = challengePerDay;
    //#endregion
    //#region RandomEvents
    const { enabled: randomEventsEnabled } = this.config.randomevents;
    server.randomEventsManager.enabled = randomEventsEnabled;
    //#endregion
    //
    //#region voicechat
    const {
      useVoiceChatV2,
      joinVoiceChatOnConnect,
      serverAccessToken,
      serverAddress
    } = this.config.voicechat;
    server.voiceChatManager.useVoiceChatV2 = useVoiceChatV2;
    server.voiceChatManager.joinVoiceChatOnConnect = joinVoiceChatOnConnect;
    server.voiceChatManager.serverAccessToken = serverAccessToken;
    server.voiceChatManager.serverAddress = serverAddress;
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

    //#region airdrops
    const { planeMovementSpeed, crateDropSpeed, minimumPlayers } =
      this.config.airdrop;
    server.airdropManager.minimumPlayers = minimumPlayers;
    server.airdropManager.planeMovementSpeed = planeMovementSpeed;
    server.airdropManager.crateDropSpeed = crateDropSpeed;
    //#endregion

    //#region worldobjects
    const {
      vehicleSpawnCap,
      hasCustomLootRespawnTime,
      lootRespawnTimer,
      vehicleRespawnTimer,
      waterSourceRefillAmount,
      waterSourceReplenishTimer,
      npcRespawnTimer,
      itemDespawnTimer,
      lootDespawnTimer,
      deadNpcDespawnTimer,
      maxNpcDespawnsPerRun,
      maxLootbagDespawnsPerRun,
      maxItemDespawnsPerRun,
      chanceWornLetter,
      vehicleSpawnRadius,
      npcSpawnCap,
      npcSpawnRadius,
      chanceNpc,
      chanceScreamer,
      chanceGazer,
      chanceExploder,
      lootbagDespawnTimer,
      crowbarHitRewardChance,
      crowbarHitDamage,
      gridScrapLimit,
      gridScrapLimitEnabled
    } = this.config.worldobjects;
    server.worldObjectManager.vehicleSpawnCap = vehicleSpawnCap;
    server.worldObjectManager.npcSpawnCap = npcSpawnCap;
    server.worldObjectManager.hasCustomLootRespawnTime =
      hasCustomLootRespawnTime;
    server.worldObjectManager.lootRespawnTimer = lootRespawnTimer;
    server.worldObjectManager.vehicleRespawnTimer = vehicleRespawnTimer;
    server.worldObjectManager.npcRespawnTimer = npcRespawnTimer;

    server.worldObjectManager.itemDespawnTimer = itemDespawnTimer;
    server.worldObjectManager.lootDespawnTimer = lootDespawnTimer;
    server.worldObjectManager.deadNpcDespawnTimer = deadNpcDespawnTimer;
    server.worldObjectManager.lootbagDespawnTimer = lootbagDespawnTimer;
    server.worldObjectManager.maxNpcDespawnsPerRun = maxNpcDespawnsPerRun;
    server.worldObjectManager.maxLootbagDespawnsPerRun =
      maxLootbagDespawnsPerRun;
    server.worldObjectManager.maxItemDespawnsPerRun = maxItemDespawnsPerRun;

    server.worldObjectManager.vehicleSpawnRadius = vehicleSpawnRadius;
    server.worldObjectManager.npcSpawnRadius = npcSpawnRadius;
    server.worldObjectManager.chanceNpc = chanceNpc;
    server.worldObjectManager.chanceScreamer = chanceScreamer;
    server.worldObjectManager.chanceGazer = chanceGazer;
    server.worldObjectManager.chanceExploder = chanceExploder;

    server.worldObjectManager.chanceWornLetter = chanceWornLetter;

    server.worldObjectManager.waterSourceReplenishTimer =
      waterSourceReplenishTimer;
    server.worldObjectManager.waterSourceRefillAmount = waterSourceRefillAmount;

    server.crowbarHitRewardChance = crowbarHitRewardChance;
    server.crowbarHitDamage = crowbarHitDamage;

    server.worldObjectManager.gridScrapLimit = gridScrapLimit;
    server.worldObjectManager.gridScrapLimitEnabled = gridScrapLimitEnabled;
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
      allowStackedPlacement,
      allowOutOfBoundsPlacement,
      placementRange,
      spawnPointBlockedPlacementRange,
      vehicleSpawnPointBlockedPlacementRange,
      playerFoundationBlockedPlacementRange,
      playerShackBlockedPlacementRange,
      lowerStrongholdDefenses
    } = this.config.construction;
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
    server.constructionManager.lowerStrongholdDefenses =
      lowerStrongholdDefenses;
    //#endregion

    //#region decay
    const {
      decayTickInterval,
      constructionDamageTicks,
      ticksToFullDecay,
      worldFreeplaceDecayMultiplier,
      vehicleDamageTicks,
      vacantFoundationTicks,
      griefFoundationTimer,
      griefCheckSlotAmount,
      baseVehicleDamage,
      maxVehiclesPerArea,
      vehicleDamageRange,
      dailyRepairMaterials
    } = this.config.decay;
    server.decayManager.decayTickInterval = decayTickInterval;
    server.decayManager.constructionDamageTicks = constructionDamageTicks;
    server.decayManager.ticksToFullDecay = ticksToFullDecay;
    server.decayManager.worldFreeplaceDecayMultiplier =
      worldFreeplaceDecayMultiplier;
    server.decayManager.vehicleDamageTicks = vehicleDamageTicks;
    server.decayManager.vacantFoundationTicks = vacantFoundationTicks;
    server.decayManager.griefFoundationTimer = griefFoundationTimer;
    server.decayManager.griefCheckSlotAmount = griefCheckSlotAmount;
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
    //
    //#region gameTime
    const { timeFrozen, timeMultiplier, nightTimeMultiplier, baseTime } =
      this.config.gametime;
    server.inGameTimeManager.time = baseTime * 3600;
    server.inGameTimeManager.timeFrozenByConfig = timeFrozen;
    server.inGameTimeManager.baseTimeMultiplier = timeMultiplier;
    server.inGameTimeManager.nightTimeMultiplierValue = nightTimeMultiplier;
    //#endregion

    //#region groups
    const { enabled, player_limit, foundation_player_limit } =
      this.config.groups;
    server.groupManager.playerLimit = player_limit;
    server.groupManager.foundationPlayerLimit = foundation_player_limit;
    server.groupManager.enabled = enabled;
    //#endregion

    //#region ai
    const {
      enabled: aiEnabled,
      aiTickRate,
      pathfindingUpdateRate,
      infection
    } = this.config.ai;
    server.aiEnabled = aiEnabled;
    server.aiTickRate = aiTickRate;
    server.pathfindingUpdateRate = pathfindingUpdateRate;
    server.infectionEnabled = infection;
    // TODO: add to config
    server.navManager.updateFrequency = 1 / 60;
    //#endregion
  }
}
