// ======================================================================
//
//   GNU GENERAL PUBLIC LICENSE
//   Version 3, 29 June 2007
//   copyright (C) 2020 - 2021 Quentin Gruber
//   copyright (C) 2021 - 2025 H1emu community
//
//   https://github.com/QuentinGruber/h1z1-server
//   https://www.npmjs.com/package/h1z1-server
//
//   Based on https://github.com/psemu/soe-network
// ======================================================================

import { ZoneServer2016 } from "../zoneserver";

export class PlayTimeManager {
  interval!: NodeJS.Timeout;
  server!: ZoneServer2016;

  updatePlaytime() {
    const chars = Object.values(this.server._characters);
    for (const char of chars) {
      char.playTime += 1;
    }
  }

  init(server: ZoneServer2016) {
    this.server = server;
    this.start();
  }

  start() {
    // if somehow it was already running
    if (this.interval) {
      this.stop();
    }
    this.interval = setInterval(this.updatePlaytime.bind(this), 60_000);
  }
  stop() {
    clearInterval(this.interval);
  }
}
