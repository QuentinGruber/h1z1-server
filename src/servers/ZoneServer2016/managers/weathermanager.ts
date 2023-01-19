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

import { randomIntFromInterval } from "../../../utils/utils";
//const debug = require("debug")("dynamicWeather");

export class WeatherManager {
  fogValue = 2;
  skyColorValue = 0;
  windStrengthValue = 0;
  weatherChoosen = false;
  fogChecked = false;
  fog = 0; // density
  currentSeason = "summer";
  skyColor = 0;
  windStrength = 0;
  temperature = 80;
  fogEnabled = 1;
  seasonStarted = false;
  constructor() {
    this.seasonstart();
  }

  seasonstart() {
    if (!this.seasonStarted) {
      this.seasonStarted = true;
      this.chooseWeather();
    }
  }

  chooseWeather() {
    const weatherType = randomIntFromInterval(1, 3);
    switch (weatherType) {
      case 1: // sunny
        this.skyColor = randomIntFromInterval(0, 60);
        switch (this.currentSeason) {
          case "summer":
            this.temperature = 80;
            this.windStrength = randomIntFromInterval(0, 60);
            this.fog = 0;
            break;
          case "autumn":
            this.temperature = 80;
            this.windStrength = randomIntFromInterval(0, 120);
            this.fog = 0;
            break;
          case "winter":
            this.temperature = 0;
            this.windStrength = randomIntFromInterval(0, 160);
            this.fog = 0;
            break;
          case "spring":
            this.temperature = 80;
            this.windStrength = randomIntFromInterval(0, 100);
            this.fog = 0;
            break;
          default:
            break;
        }
        break;
      case 2: // cloudy
        this.skyColor = randomIntFromInterval(280, 400);
        switch (this.currentSeason) {
          case "summer":
            this.temperature = 80;
            this.windStrength = randomIntFromInterval(0, 120);
            this.fog = randomIntFromInterval(0, 80);
            break;
          case "autumn":
            this.temperature = 80;
            this.windStrength = randomIntFromInterval(0, 240);
            this.fog = randomIntFromInterval(140, 200);
            break;
          case "winter":
            this.temperature = 0;
            this.windStrength = randomIntFromInterval(0, 600);
            this.fog = randomIntFromInterval(140, 200);
            break;
          case "spring":
            this.temperature = 80;
            this.windStrength = randomIntFromInterval(0, 160);
            this.fog = randomIntFromInterval(0, 100);
            break;
          default:
            break;
        }
        break;
      case 3: // middle cloudy
        this.skyColor = randomIntFromInterval(200, 280);
        switch (this.currentSeason) {
          case "summer":
            this.temperature = 80;
            this.windStrength = randomIntFromInterval(0, 100);
            this.fog = randomIntFromInterval(0, 40);
            break;
          case "autumn":
            this.temperature = 80;
            this.windStrength = randomIntFromInterval(0, 180);
            this.fog = randomIntFromInterval(38, 100);
            break;
          case "winter":
            this.temperature = 0;
            this.windStrength = randomIntFromInterval(0, 400);
            this.fog = randomIntFromInterval(38, 100);
            break;
          case "spring":
            this.temperature = 80;
            this.windStrength = randomIntFromInterval(0, 140);
            this.fog = randomIntFromInterval(0, 48);
            break;
          default:
            break;
        }
        break;
      default:
        break;
    }
    this.weatherChoosen = true;
  }

  changeFog() {
    this.fogEnabled = this.fogEnabled ? 0 : 1;
    return this.fogEnabled;
  }

  dynamicWeather(
    serverTime: number,
    startTime: number,
    timeMultiplier: number
  ) {
    const delta = Date.now() - startTime;
    const currentDate = new Date((serverTime + delta) * timeMultiplier);
    const currentHour = currentDate.getUTCHours();
    const currentMonth = currentDate.getUTCMonth();

    switch (
      currentMonth // switch seasons 1-12 months
    ) {
      case 5:
      case 6:
      case 7:
        this.currentSeason = "summer";
        break;
      case 8:
      case 9:
      case 10:
        this.currentSeason = "autumn";
        break;
      case 11:
      case 0:
      case 1:
        this.currentSeason = "winter";
        break;
      case 2:
      case 3:
      case 4:
        this.currentSeason = "spring";
        break;
      default:
        break;
    }

    switch (
      currentHour // switch for enabling weather effects based by in-game time
    ) {
      case 1: // start deteriorating fog (fog values wont go below 0 so no need for check if fog was turned on)
        break;
      case 2: // Determine weather for next day cycle (sunny,cloudy etc)
        if (!this.weatherChoosen) {
          this.chooseWeather();
        }
        const fogtogglechance = randomIntFromInterval(0, 100);
        if (!this.fogChecked) {
          if (fogtogglechance <= 75) {
            this.fog = 0;
          }
          this.fogChecked = true;
        }
        break;
      case 3: //
        this.fogChecked = false;
        this.weatherChoosen = false;
        break;
      /*case 4: // start accumulating rain clouds and start rain with a random delay (after clouds accululated) if matched %chance
            if (!rainChecked && !rainIncoming) {
              rainChecked = true;
              const rainchance = randomIntFromInterval(0, 100);
              if (rainchance <= rainchanceReq) {
                rainIncoming = true;
                const rainDelay = randomIntFromInterval(
                  18720072 / timeMultiplier,
                  86400000 / timeMultiplier
                );
                const rainTime = randomIntFromInterval(
                  14200000 / timeMultiplier,
                  41600000 / timeMultiplier
                );
                const accumulateCloudsDelay = rainDelay - 18720000 / timeMultiplier;
                setTimeout(function () {
                  cloudsAccumulating = 1;
                }, accumulateCloudsDelay);
                setTimeout(function () {
                  rainEnabled = 50;
                  cloudsAccumulating = 0;
                }, rainDelay);
                setTimeout(function () {
                  rainEnabled = 0;
                  cloudsAccumulating = -1;
                }, rainDelay + rainTime);
                setTimeout(function () {
                  rainIncoming = false;
                }, rainDelay + rainTime + 187200 / timeMultiplier);
              }
            }
            break;*/
      case 19: // start accumulating fog if matching %chance
        break;
      default:
        break;
    }
    if (this.fogValue == this.fog) {
      // do nothing
    } else if (this.fogValue > this.fog) {
      this.fogValue--;
    } else {
      this.fogValue++;
    }
    if (this.skyColorValue == this.skyColor) {
      // do nothing
    } else if (this.skyColorValue > this.skyColor) {
      this.skyColorValue--;
    } else {
      this.skyColorValue++;
    }
    if (this.windStrengthValue == this.windStrength) {
      // do nothing
    } else if (this.windStrengthValue > this.windStrength) {
      this.windStrengthValue--;
    } else {
      this.windStrengthValue++;
    }
    this.seasonstart();
    const weather = {
      name: "sky_Z_clouds.dds",
      unknownDword1: 1,
      fogDensity: this.fogEnabled
        ? Number((this.fogValue / 40000).toFixed(5))
        : 0,
      fogFloor: 71,
      fogGradient: 0.008,
      rain: 0, //broken
      temp: this.temperature, // does almost nothing
      colorGradient: Number((this.skyColor / 400).toFixed(5)),
      unknownDword8: 0, //clouds cause the screen flickering
      unknownDword9: 0,
      unknownDword10: 0,
      unknownDword11: 0,
      unknownDword12: 0.25,
      sunAxisX: 140,
      sunAxisY: 90,
      unknownDword15: 0,
      windDirectionX: -1,
      windDirectionY: -0.5,
      windDirectionZ: -1,
      wind: Number((this.windStrength / 8).toFixed(5)),
      unknownDword20: 0,
      unknownDword21: 1,
      unknownDword22: 0.3,
      unknownDword23: -0.002,
      unknownDword24: 0,
      unknownDword25: 1000,
      unknownDword26: 0.2,
      unknownDword27: 0,
      unknownDword28: 0.002,
      unknownDword29: 8000,
      AOSize: 0.1,
      AOGamma: 0.8,
      AOBlackpoint: 0.2,
      unknownDword33: 0.5,
    };
    return weather;
  }
}
