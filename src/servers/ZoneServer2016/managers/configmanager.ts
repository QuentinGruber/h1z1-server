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

const d = yaml.load(fs.readFileSync('../../../../data/2016/sampleData/defaultconfig.yaml', 'utf8')) as any as ServerConfig;

export class ConfigManager {
  config = d;

  constructor(configPath?: string) {
    if(configPath) {
      // attempt to load config, or load default
    }
  }

  getConfig() {
    return this.config;
  }

  // TODO: handle actual config file loading
  loadConfig(config: any) {
    this.config = {
      fairplay: {
        useFairplay: config.useFairplay ?? d.fairplay.useFairplay,
        maxPing: config.maxPing ?? d.fairplay.maxPing
      },
      weather: {
        cycleSpeed: 100,
        frozeCycle: false,
        defaultTemplate: "z1br",
      }
    }
  }
}