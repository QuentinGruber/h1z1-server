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

import {
  TimeWrapper,
  getCurrentServerTimeWrapper,
  toInt
} from "../../../utils/utils";

const SECONDS_IN_A_DAY = 60 * 60 * 24;
const FIVE_AM = 5 * 60 * 60;
const SEVEN_PM = 19 * 60 * 60;

export class IngameTimeManager {
  private _updtTimeTimer!: NodeJS.Timeout;
  lastIngameTimeUpdate: TimeWrapper | null = null;
  nightTimeMultiplier = 1;
  timeFrozen = true;

  /** MANAGED BY CONFIGMANAGER - See defaultConfig.yaml for more information */
  timeFrozenByConfig!: boolean;
  time!: number;
  baseTimeMultiplier!: number;
  nightTimeMultiplierValue!: number;

  constructor() {}

  start() {
    if (this.timeFrozenByConfig) {
      this.timeFrozen = true;
      return;
    }
    this.timeFrozen = false;
    this._updtTimeTimer = setTimeout(() => {
      this.updateTime();
      this._updtTimeTimer.refresh();
      // Update time can't be less than 1 second since ingametime is in seconds
    }, 1000);
  }

  getCycleSpeed() {
    if (this.timeFrozen) return 0;
    return this.baseTimeMultiplier * this.nightTimeMultiplier * 0.97222;
  }

  updateTime() {
    const currentTime = getCurrentServerTimeWrapper();
    if (!this.lastIngameTimeUpdate) {
      this.lastIngameTimeUpdate = currentTime;
    }
    const currentSeconds = this.time;
    // change nightMultiplier when it's night
    if (
      currentSeconds >= FIVE_AM &&
      currentSeconds < SEVEN_PM &&
      this.nightTimeMultiplier !== 1
    ) {
      this.nightTimeMultiplier = 1;
    } else if (
      (currentSeconds < FIVE_AM || currentSeconds >= SEVEN_PM) &&
      this.nightTimeMultiplier !== this.nightTimeMultiplierValue
    ) {
      this.nightTimeMultiplier = this.nightTimeMultiplierValue;
    }
    const timeDifference =
      currentTime.getSeconds() - this.lastIngameTimeUpdate.getSeconds();

    this.time =
      (this.time +
        toInt(
          timeDifference * this.baseTimeMultiplier * this.nightTimeMultiplier
        )) %
      SECONDS_IN_A_DAY;
    this.lastIngameTimeUpdate = currentTime;
  }
  stop() {
    this.lastIngameTimeUpdate = null;
    clearTimeout(this._updtTimeTimer);
    this.timeFrozen = true;
  }
}
