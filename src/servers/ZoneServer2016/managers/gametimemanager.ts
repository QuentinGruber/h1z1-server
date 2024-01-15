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

import {
  TimeWrapper,
  getCurrentTimeWrapper,
  toInt
} from "../../../utils/utils";

const SECONDS_IN_A_DAY = 60 * 60 * 24;

export class IngameTimeManager {
  private _updtTimeTimer!: NodeJS.Timeout;
  lastIngameTimeUpdate: TimeWrapper | null = null;
  timeMultiplier = 72;
  timeFrozen = true;
  constructor(public time: number) {}

  start() {
    this.timeFrozen = false;
    this._updtTimeTimer = setTimeout(() => {
      this.updateTime();
      this._updtTimeTimer.refresh();
    }, 1000);
  }

  updateTime() {
    const currentTime = getCurrentTimeWrapper();
    if (!this.lastIngameTimeUpdate) {
      this.lastIngameTimeUpdate = currentTime;
    }
    const timeDifference =
      currentTime.getSeconds() - this.lastIngameTimeUpdate.getSeconds();
    this.time =
      (this.time + toInt(timeDifference * this.timeMultiplier)) %
      SECONDS_IN_A_DAY;
    this.lastIngameTimeUpdate = currentTime;
  }
  stop() {
    this.lastIngameTimeUpdate = null;
    clearTimeout(this._updtTimeTimer);
    this.timeFrozen = true;
  }
}
