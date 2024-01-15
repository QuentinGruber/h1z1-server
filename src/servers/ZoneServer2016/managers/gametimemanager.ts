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
const FIVE_AM = 5 * 60 * 60;
const SEVEN_PM = 19 * 60 * 60;

export class IngameTimeManager {
  private _updtTimeTimer!: NodeJS.Timeout;
  lastIngameTimeUpdate: TimeWrapper | null = null;
  timeMultiplier = 36; // 1 hour IRL = 36 hours ingame, so 20 min a day
  timeFrozen = true;
  nightMultiplier = 1;
  constructor(public time: number) {}

  start() {
    this.timeFrozen = false;
    this._updtTimeTimer = setTimeout(() => {
      this.updateTime();
      this._updtTimeTimer.refresh();
      // Update time can't be less than 1 second since ingametime is in seconds
    }, 1000);
  }

  getCycleSpeed() {
    if (this.timeFrozen) return 0;
    return this.timeMultiplier * this.nightMultiplier * 0.97222;
  }

  updateTime() {
    const currentTime = getCurrentTimeWrapper();
    if (!this.lastIngameTimeUpdate) {
      this.lastIngameTimeUpdate = currentTime;
    }
    const currentSeconds = this.time;
    // change nightMultiplier when it's night
    if (
      currentSeconds >= FIVE_AM &&
      currentSeconds < SEVEN_PM &&
      this.nightMultiplier !== 1
    ) {
      this.nightMultiplier = 1;
    } else if (
      (currentSeconds < FIVE_AM || currentSeconds >= SEVEN_PM) &&
      this.nightMultiplier !== 2
    ) {
      this.nightMultiplier = 2;
    }
    const timeDifference =
      currentTime.getSeconds() - this.lastIngameTimeUpdate.getSeconds();

    this.time =
      (this.time +
        toInt(timeDifference * this.timeMultiplier * this.nightMultiplier)) %
      SECONDS_IN_A_DAY;
    this.lastIngameTimeUpdate = currentTime;
  }
  stop() {
    this.lastIngameTimeUpdate = null;
    clearTimeout(this._updtTimeTimer);
    this.timeFrozen = true;
  }
}
