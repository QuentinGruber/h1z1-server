// ======================================================================
//
//   GNU GENERAL PUBLIC LICENSE
//   Version 3, 29 June 2007
//   copyright (C) 2020 - 2021 Quentin Gruber
//   copyright (C) 2021 - 2022 H1emu community
//
//   https://github.com/QuentinGruber/h1z1-server
//   https://www.npmjs.com/package/h1z1-server
//
//   Based on https://github.com/psemu/soe-network
// ======================================================================

import { randomIntFromInterval } from "../../../utils/utils";
const debug = require("debug")("dynamicWeather");

let fogValue = 2;
let skyColorValue = 0;
let c1Value = 5;
let c2Value = 0;
let c3Value = 5;
let c4Value = 15;
let windStrengthValue = 0;
let weatherChoosen = false;
let fogChecked = false;
let fog = 0; // density
let currentSeason = "summer";
let skyColor = 0;
let windStrength = 0;
let c1 = 0;
let c2 = 0;
let c3 = 0;
let c4 = 0;
let temperature = 80;

const seasonstart = (function () {
  let started = false;
  return function () {
    if (!started) {
      started = true;
      chooseWeather();
    }
  };
})();

function chooseWeather() {
  const weatherType = randomIntFromInterval(1, 3);
  switch (weatherType) {
    case 1: // sunny
      c1 = randomIntFromInterval(0, 20);
      c1 = randomIntFromInterval(0, 20);
      c3 = randomIntFromInterval(0, 20);
      c4 = randomIntFromInterval(0, 20);
      skyColor = randomIntFromInterval(0, 60);
      switch (currentSeason) {
        case "summer":
          temperature = 80;
          windStrength = randomIntFromInterval(0, 60);
          fog = 0;
          break;
        case "autumn":
          temperature = 80;
          windStrength = randomIntFromInterval(0, 120);
          fog = 0;
          break;
        case "winter":
          temperature = 0;
          windStrength = randomIntFromInterval(0, 160);
          fog = 0;
          break;
        case "spring":
          temperature = 80;
          windStrength = randomIntFromInterval(0, 100);
          fog = 0;
          break;
        default:
          break;
      }
      break;
    case 2: // cloudy
      c1 = randomIntFromInterval(0, 240);
      c1 = randomIntFromInterval(0, 240);
      c3 = randomIntFromInterval(0, 240);
      c4 = randomIntFromInterval(0, 240);
      skyColor = randomIntFromInterval(280, 400);
      switch (currentSeason) {
        case "summer":
          temperature = 80;
          windStrength = randomIntFromInterval(0, 120);
          fog = randomIntFromInterval(0, 80);
          break;
        case "autumn":
          temperature = 80;
          windStrength = randomIntFromInterval(0, 240);
          fog = randomIntFromInterval(140, 200);
          break;
        case "winter":
          temperature = 0;
          windStrength = randomIntFromInterval(0, 600);
          fog = randomIntFromInterval(140, 200);
          break;
        case "spring":
          temperature = 80;
          windStrength = randomIntFromInterval(0, 160);
          fog = randomIntFromInterval(0, 100);
          break;
        default:
          break;
      }
      break;
    case 3: // middle cloudy
      c1 = randomIntFromInterval(0, 120);
      c1 = randomIntFromInterval(0, 120);
      c3 = randomIntFromInterval(0, 120);
      c4 = randomIntFromInterval(0, 120);
      skyColor = randomIntFromInterval(200, 280);
      switch (currentSeason) {
        case "summer":
          temperature = 80;
          windStrength = randomIntFromInterval(0, 100);
          fog = randomIntFromInterval(0, 40);
          break;
        case "autumn":
          temperature = 80;
          windStrength = randomIntFromInterval(0, 180);
          fog = randomIntFromInterval(38, 100);
          break;
        case "winter":
          temperature = 0;
          windStrength = randomIntFromInterval(0, 400);
          fog = randomIntFromInterval(38, 100);
          break;
        case "spring":
          temperature = 80;
          windStrength = randomIntFromInterval(0, 140);
          fog = randomIntFromInterval(0, 48);
          break;
        default:
          break;
      }
      break;
    default:
      break;
  }
  weatherChoosen = true;
}

export default function dynamicWeather(
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
      currentSeason = "summer";
      break;
    case 6:
      currentSeason = "summer";
      break;
    case 7:
      currentSeason = "summer";
      break;
    case 8:
      currentSeason = "autumn";
      break;
    case 9:
      currentSeason = "autumn";
      break;
    case 10:
      currentSeason = "autumn";
      break;
    case 11:
      currentSeason = "winter";
      break;
    case 0:
      currentSeason = "winter";
      break;
    case 1:
      currentSeason = "winter";
      break;
    case 2:
      currentSeason = "spring";
      break;
    case 3:
      currentSeason = "spring";
      break;
    case 4:
      currentSeason = "spring";
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
      if (!weatherChoosen) {
        chooseWeather();
      }
      const fogtogglechance = randomIntFromInterval(0, 100);
      if (!fogChecked) {
        if (fogtogglechance <= 75) {
          const fog = 0;
        }
        fogChecked = true;
      }
      break;
    case 3: //
      fogChecked = false;
      weatherChoosen = false;
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
  if (fogValue == fog) {
    // do nothing
  } else if (fogValue > fog) {
    fogValue--;
  } else {
    fogValue++;
  }
  if (skyColorValue == skyColor) {
    // do nothing
  } else if (skyColorValue > skyColor) {
    skyColorValue--;
  } else {
    skyColorValue++;
  }
  if (c1Value == c1) {
    // do nothing
  } else if (c1Value > c1) {
    c1Value--;
  } else {
    c1Value++;
  }
  if (c2Value == c2) {
    // do nothing
  } else if (c2Value > c2) {
    c2Value--;
  } else {
    c2Value++;
  }
  if (c3Value == c3) {
    // do nothing
  } else if (c3Value > c3) {
    c3Value--;
  } else {
    c3Value++;
  }
  if (c4Value == c4) {
    // do nothing
  } else if (c4Value > c4) {
    c4Value--;
  } else {
    c4Value++;
  }

  if (windStrengthValue == windStrength) {
    // do nothing
  } else if (windStrengthValue > windStrength) {
    windStrengthValue--;
  } else {
    windStrengthValue++;
  }
  seasonstart();
  const rnd_weather = {
    name: "sky_Z_clouds.dds",
    unknownDword1: 1,
    fogDensity: Number((fogValue / 40000).toFixed(5)),
    fogFloor: 71,
    fogGradient: 0.008,
    rain: 0, //broken
    temp: temperature, // does almost nothing
    colorGradient: Number((skyColor / 400).toFixed(5)),
    unknownDword8: Number((c1Value / 400).toFixed(5)),
    unknownDword9: Number((c2Value / 400).toFixed(5)),
    unknownDword10: Number((c3Value / 400).toFixed(5)),
    unknownDword11: Number((c4Value / 400).toFixed(5)),
    unknownDword12: 0.25,
    sunAxisX: 140,
    sunAxisY: 90,
    unknownDword15: 0,
    windDirectionX: -1,
    windDirectionY: -0.5,
    windDirectionZ: -1,
    wind: Number((windStrength / 8).toFixed(5)),
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

  return rnd_weather;
}
