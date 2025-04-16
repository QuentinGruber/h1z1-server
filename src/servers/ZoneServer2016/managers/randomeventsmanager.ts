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

interface WeightedItem {
  value: string;
  weight: number;
}

export class RandomEventsManager {
  interval?: NodeJS.Timeout;
  // managed by config
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

  weightedRandom(items: WeightedItem[]) {
    let random =
      Math.random() * items.reduce((sum: number, item) => sum + item.weight, 0);

    return (
      items.find((item) => (random -= item.weight) < 0) as unknown as {
        value: string;
        weight: number;
      }
    ).value;
  }

  spawnRandomAirdrop() {
    const cellIndex = randomInt(100);
    const spg = this.server._spawnGrid[cellIndex];
    const rnd_index = randomInt(spg.spawnPoints.length);
    const pos = spg.spawnPoints[rnd_index];
    const airdropTypes: WeightedItem[] = [
      { value: "Farmer", weight: 15 },
      { value: "Demolitioner", weight: 5 },
      { value: "Medic", weight: 25 },
      { value: "Builder", weight: 25 },
      { value: "Fighter", weight: 10 },
      { value: "Supplier", weight: 20 }
    ];
    const airdropType = this.weightedRandom(airdropTypes);
    this.server.spawnAirdrop(pos, airdropType);
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
