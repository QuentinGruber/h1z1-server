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

import * as fs from 'fs';
import * as yaml from 'js-yaml';
import { Config } from '../models/config';
import { ZoneServer2016 } from '../zoneserver';

export class ConfigManager {
  private defaultConfig: Config;
  private config: Config;

  constructor(server: ZoneServer2016, configPath?: string) {
    this.defaultConfig = this.loadYaml("/../../../../data/2016/sampleData/defaultconfig.yaml") as Config;
    if(configPath) {
      // todo: check if the path exists first

      const config = this.loadYaml(configPath, false);
      if(config) {
        this.config = this.loadConfig(config);
        this.applyConfig(server);
        return;
      }
    }
    this.config = this.defaultConfig;
    this.applyConfig(server);
  }

  private loadYaml(path: string, relative = true): Config | undefined {
    return yaml.load(fs.readFileSync(`${relative?__dirname:""}${path}`, 'utf8')) as any as Config;
  }

  loadConfig(config: Config): Config {
    // in case new config file is missing certain values / out of date, 
    // fill with default values
    const { server, fairplay, weather, worldobjects, speedtree } = this.defaultConfig;
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
      }
    }
  }

  applyConfig(server: ZoneServer2016) {
    //#region server
    const { proximityItemsDistance, interactionDistance , charactersRenderDistance, tickRate, worldRoutineRate, welcomeMessage } = this.config.server;
    server.proximityItemsDistance = proximityItemsDistance;
    server.interactionDistance = interactionDistance;
    server.charactersRenderDistance = charactersRenderDistance;
    server.tickRate = tickRate;
    server.worldRoutineRate = worldRoutineRate;
    server.welcomeMessage = welcomeMessage;
    //#endregion

    //#region fairplay
    // to be moved to FairplayManager
    const { useFairplay, maxPing, pingTimeoutTime } = this.config.fairplay;
    server.useFairPlay = useFairplay;
    server.maxPing = maxPing;
    server.pingTimeoutTime = pingTimeoutTime;
    //#endregion

    //#region weather
    const { cycleSpeed, frozeCycle, defaultTemplate } = this.config.weather;
    server.weatherManager.cycleSpeed = cycleSpeed;
    server.weatherManager.frozeCycle = frozeCycle;
    server.weatherManager.defaultTemplate = defaultTemplate;
    //#endregion

    //#region worldobjects
    const { vehicleSpawnCap, lootRespawnTimer, vehicleRespawnTimer, npcRespawnTimer, itemDespawnTimer, lootDespawnTimer, deadNpcDespawnTimer, vehicleSpawnRadius, npcSpawnRadius, chanceNpc, chanceScreamer } = this.config.worldobjects;
    server.worldObjectManager.vehicleSpawnCap = vehicleSpawnCap;
    server.worldObjectManager.lootRespawnTimer = lootRespawnTimer;
    server.worldObjectManager.vehicleRespawnTimer = vehicleRespawnTimer;
    server.worldObjectManager.npcRespawnTimer = npcRespawnTimer;

    server.worldObjectManager.itemDespawnTimer = itemDespawnTimer;
    server.worldObjectManager.lootDespawnTimer = lootDespawnTimer;
    server.worldObjectManager.deadNpcDespawnTimer = deadNpcDespawnTimer;

    server.worldObjectManager.vehicleSpawnRadius = vehicleSpawnRadius;
    server.worldObjectManager.npcSpawnRadius = npcSpawnRadius;
    server.worldObjectManager.chanceNpc = chanceNpc;
    server.worldObjectManager.chanceScreamer = chanceScreamer;
    //#endregion

    //#region speedtree
    const { minBlackberryHarvest, maxBlackberryHarvest, branchHarvestChance, minStickHarvest, maxStickHarvest, treeRespawnTimeMS, minWoodLogHarvest, maxWoodLogHarvest, minTreeHits, maxTreeHits } = this.config.speedtree;
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
  }
}