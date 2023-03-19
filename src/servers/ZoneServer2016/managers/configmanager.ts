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
import { ServerConfig } from '../models/config';
import { ZoneServer2016 } from '../zoneserver';

function loadConfig(path: string, relative = true): ServerConfig | undefined {
  return yaml.load(fs.readFileSync(`${relative?__dirname:""}${path}`, 'utf8')) as any as ServerConfig;
}

const defaultConfig = loadConfig(".\\..\\..\\..\\..\\data\\2016\\sampleData\\defaultconfig.yaml") as ServerConfig;

export class ConfigManager {
  private config: ServerConfig;

  constructor(server: ZoneServer2016, configPath?: string) {
    if(configPath) {
      const config = loadConfig(configPath, false);
      if(config) {
        this.config = this.loadConfig(config);
        this.applyConfig(server);
        return;
      }
    }
    this.config = defaultConfig;
  }

  loadConfig(config: ServerConfig): ServerConfig {
    // in case new config file is missing certain values / out of date, 
    // fill with default values
    return {
      ...defaultConfig,
      ...config,
      fairplay: {
        ...defaultConfig.fairplay,
        ...config.fairplay,
      },
      weather: {
        ...defaultConfig.weather,
        ...config.weather,
      },
      worldobjects: {
        ...defaultConfig.worldobjects,
        ...config.worldobjects,
      }
    }
  }

  applyConfig(server: ZoneServer2016) {
    //#region fairplay
    // to be moved to FairplayManager
    server._useFairPlay = this.config.fairplay.useFairplay;
    server._maxPing = this.config.fairplay.maxPing;
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
  }
}