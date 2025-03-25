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

import { randomInt } from "node:crypto";
import { ZoneServer2016 } from "../zoneserver";
import { getCellName } from "../../../utils/utils";

export class RandomEventsManager {
  interval?: NodeJS.Timeout;
  // managed by config
  // TODO:
  enabled: boolean = true;
  constructor(public server: ZoneServer2016) {}
  start() {
    if (this.enabled) {
      this.interval = setInterval(() => this.run(), 600_000);
    }
  }
  stop() {
    clearInterval(this.interval);
  }

  spawnRandomAirdrop() {
    const cellIndex = randomInt(100);
    const spg = this.server._spawnGrid[cellIndex];
    const rnd_index = randomInt(spg.spawnPoints.length);
    const pos = spg.spawnPoints[rnd_index];
    this.server.spawnAirdrop(pos, false);
    const cellName = getCellName(cellIndex, 10);
    this.server.sendAlertToAll(`Random airdrop on ${cellName}`);
    if (!this.server._soloMode) {
      this.server._db.collection("random_aidrops_logs").insertOne({
        position: pos,
        serverId: this.server._worldId
      });
    }
  }

  run() {
    if (!this.server._airdrop && randomInt(10) === 0) {
      this.spawnRandomAirdrop();
    }
  }
}
