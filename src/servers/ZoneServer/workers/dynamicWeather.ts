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

import { _, randomIntFromInterval } from "../../../utils/utils";
import { parentPort, workerData } from "worker_threads";
import { H1Z1Protocol } from "../../../protocols/h1z1protocol";
const debug = require("debug")("dynamicWeather");

const protocol = new H1Z1Protocol("ClientProtocol_860");
let weatherChoosen = false;
let fogChecked = false;
let fog = 45; // density
let foggradient = 40;
let fogEnabled = true;
let fchancemin = 15;
let fchancemax = 70;
let currentSeason = "summer";
let rainChecked = false;
let rainIncoming = false;
let rainEnabled = 0;
let cloudsAccumulating = -1;
let cloudsValue = 15;
let rainCloudsMin = 0;
let windStrength = 0;
let sunPositionX = 0;
let sunPositionY = 0;
let sunPositionZ = 0;
let c1 = 0;
let c2 = 0;
let c3 = 0;
let c4 = 0;
let temperature = 80;
let rainchanceReq = 20;

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
      c1 = randomIntFromInterval(0, 5);
      c1 = randomIntFromInterval(0, 5);
      c3 = randomIntFromInterval(0, 10);
      c4 = randomIntFromInterval(0, 5);
      switch (currentSeason) {
        case "summer":
          temperature = 80;
          rainCloudsMin = 0;
          windStrength = randomIntFromInterval(0, 15);
          sunPositionX = 15;
          sunPositionY = 90;
          sunPositionZ = 0;
          rainchanceReq = 20;
          break;
        case "autumn":
          temperature = 80;
          rainCloudsMin = 40;
          windStrength = randomIntFromInterval(10, 30);
          sunPositionX = 30;
          sunPositionY = 110;
          sunPositionZ = 20;
          rainchanceReq = 50;
          break;
        case "winter":
          temperature = 0;
          rainCloudsMin = 40;
          windStrength = randomIntFromInterval(20, 40);
          sunPositionX = 90;
          sunPositionY = 130;
          sunPositionZ = 60;
          rainchanceReq = 50;
          break;
        case "spring":
          temperature = 80;
          rainCloudsMin = 10;
          windStrength = randomIntFromInterval(5, 25);
          sunPositionX = 20;
          sunPositionY = 110;
          sunPositionZ = 10;
          rainchanceReq = 30;
          break;
        default:
          break;
      }
      if (cloudsAccumulating != 1 && rainEnabled != 50) {
        cloudsValue = 0;
      }
      break;
    case 2: // cloudy
      c1 = randomIntFromInterval(31, 100);
      c1 = randomIntFromInterval(31, 100);
      c3 = randomIntFromInterval(31, 100);
      c4 = randomIntFromInterval(31, 100);
      switch (currentSeason) {
        case "summer":
          temperature = 80;
          rainCloudsMin = 20;
          windStrength = randomIntFromInterval(15, 30);
          sunPositionX = 15;
          sunPositionY = 90;
          sunPositionZ = 0;
          rainchanceReq = 20;
          break;
        case "autumn":
          temperature = 80;
          rainCloudsMin = 65;
          windStrength = randomIntFromInterval(30, 60);
          sunPositionX = 30;
          sunPositionY = 110;
          sunPositionZ = 20;
          rainchanceReq = 50;
          break;
        case "winter":
          temperature = 0;
          rainCloudsMin = 65;
          windStrength = randomIntFromInterval(50, 150);
          sunPositionX = 90;
          sunPositionY = 130;
          sunPositionZ = 60;
          rainchanceReq = 50;
          break;
        case "spring":
          temperature = 80;
          rainCloudsMin = 40;
          windStrength = randomIntFromInterval(25, 40);
          sunPositionX = 20;
          sunPositionY = 110;
          sunPositionZ = 10;
          rainchanceReq = 30;
          break;
        default:
          break;
      }
      if (cloudsAccumulating != 1 && rainEnabled != 50) {
        cloudsValue = 20;
      }
      break;
    case 3: // middle cloudy
      c1 = randomIntFromInterval(6, 30);
      c1 = randomIntFromInterval(6, 30);
      c3 = randomIntFromInterval(6, 30);
      c4 = randomIntFromInterval(6, 30);
      switch (currentSeason) {
        case "summer":
          temperature = 80;
          rainCloudsMin = 10;
          windStrength = randomIntFromInterval(5, 25);
          sunPositionX = 15;
          sunPositionY = 90;
          sunPositionZ = 0;
          rainchanceReq = 20;
          break;
        case "autumn":
          temperature = 80;
          rainCloudsMin = 50;
          windStrength = randomIntFromInterval(15, 45);
          sunPositionX = 30;
          sunPositionY = 110;
          sunPositionZ = 20;
          rainchanceReq = 50;
          break;
        case "winter":
          temperature = 0;
          rainCloudsMin = 50;
          windStrength = randomIntFromInterval(25, 100);
          sunPositionX = 90;
          sunPositionY = 130;
          sunPositionZ = 60;
          rainchanceReq = 50;
          break;
        case "spring":
          temperature = 80;
          rainCloudsMin = 30;
          windStrength = randomIntFromInterval(10, 35);
          sunPositionX = 20;
          sunPositionY = 110;
          sunPositionZ = 10;
          rainchanceReq = 30;
          break;
        default:
          break;
      }
      if (cloudsAccumulating != 1 && rainEnabled != 50) {
        cloudsValue = 10;
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
      fogEnabled = false;
      weatherChoosen = false;
      fogChecked = false;
      break;
    case 2: // Determine weather for next day cycle (sunny,cloudy etc)
      if (!weatherChoosen) {
        chooseWeather();
      }
      break;
    case 3: //
      weatherChoosen = false;
      rainChecked = false;
      break;
    case 4: // start accumulating rain clouds and start rain with a random delay (after clouds accululated) if matched %chance
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
      break;
    case 19: // start accumulating fog if matching %chance
      const fogtogglechance = randomIntFromInterval(0, 100);
      if (!fogChecked) {
        if (fogtogglechance <= 30) {
          fogEnabled = true;
          foggradient = randomIntFromInterval(21, 31);
        }
        fogChecked = true;
      }
      break;
    default:
      break;
  }

  seasonstart();

  switch (
    fogEnabled // increase/dicrease fog values with each tick
  ) {
    case true:
      fchancemin = 1;
      fchancemax = 1;
      break;
    case false:
      fchancemin = -1;
      fchancemax = -1;
      break;
    default:
      break;
  }

  cloudsValue = cloudsValue + cloudsAccumulating; // skycolor and cloud1 modifier (looks nice setting it with rain) bigger = darker,
  if (cloudsValue < rainCloudsMin) {
    cloudsValue = rainCloudsMin + 1;
  } else if (cloudsValue > 66) {
    cloudsValue = 65;
  }

  const fogchance = randomIntFromInterval(fchancemin, fchancemax);
  fog = fog + fogchance;
  if (fog < -1) {
    fog = 0;
  }
  if (fog > 51) {
    fog = 50;
  }

  const foggchance = randomIntFromInterval(fchancemin, fchancemax);
  foggradient = foggradient + foggchance;
  if (foggradient < -1) {
    foggradient = 0;
  }
  if (foggradient > 21) {
    foggradient = 20;
  }
  const rnd_weather = {
    name: "sky",
    unknownDword1: 91,
    unknownDword2: 68,
    unknownDword3: 89,
    unknownDword4: 48,
    fogDensity: fog,
    fogGradient: foggradient,
    fogFloor: 1200,
    unknownDword7: 73,
    rain: rainEnabled,
    temp: temperature,
    skyColor: cloudsValue,
    cloudWeight0: c1,
    cloudWeight1: cloudsValue, // do not change it in other weather effects than rain
    cloudWeight2: c3,
    cloudWeight3: c4,
    sunAxisX: sunPositionX,
    sunAxisY: sunPositionY,
    sunAxisZ: sunPositionZ,
    unknownDword18: 76,
    unknownDword19: 74,
    unknownDword20: 59,
    wind: windStrength,
    unknownDword22: 46,
    unknownDword23: 53,
    unknownDword24: 65,
    unknownDword25: 0,
    unknownArray: _.fill(Array(50), {
      unknownDword1: 0,
      unknownDword2: 0,
      unknownDword3: 0,
      unknownDword4: 0,
      unknownDword5: 0,
      unknownDword6: 0,
      unknownDword7: 0,
    }),
  };

  const data: Buffer = protocol.pack("SkyChanged", rnd_weather);
  parentPort?.postMessage(data);
}

const { startTime, timeMultiplier } = workerData;
let { serverTime } = workerData;
dynamicWeather(serverTime, startTime, timeMultiplier);
setInterval(() => {
  dynamicWeather(serverTime, startTime, timeMultiplier);
}, 360000 / timeMultiplier);
