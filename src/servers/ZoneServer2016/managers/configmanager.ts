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

import { defaultServerConfig as d } from "../data/defaultconfig";

export class ConfigManager {
  config = d;
  getConfig() {
    return this.config;
  }

  // TODO: handle actual config file loading
  loadConfig(config: any) {
    this.config = {
      useFairplay: config.useFairplay ?? d.useFairplay,
      maxPing: config.maxPing ?? d.maxPing
    }
  }
}