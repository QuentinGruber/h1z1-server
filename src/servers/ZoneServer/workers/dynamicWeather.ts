import _ from "lodash";
import { Client } from "types/zoneserver";
import { randomIntFromInterval } from "../../../utils/utils";
import { ZoneServer } from "../zoneserver";
const debug = require("debug")("dynamicWeather");

let fog = -10;
let foggradient = 50;
let rain = 50;
let raintoggle = 0;
let raintimems = 0;
let raintimemin = 0;
let wintertoggle = 0;
let winter = 53;
let raincheck = "OFF";
let sunposx = 10;
let sunposy = 10;
let sunposz = 10;
let fchancemin = 0;
let fchancemax = 0;
let rchancemin = 0;
let rchancemax = 0;
let rreqval = 0; // required value to reach for rain toggle

function summer() {
  sunposx = 15;
  sunposy = 90;
  sunposz = 0;
  fchancemin = -1;
  fchancemax = 0;
  rchancemin = -1;
  rchancemax = 2;
  rreqval = 150;
  wintertoggle = 0;
  setTimeout(autumn, 900000);
  setInterval(summer, 3600000);
}
function autumn() {
  wintertoggle = 0;
  sunposx = 30;
  sunposy = 110;
  sunposz = 20;
  fchancemin = -1;
  fchancemax = 2;
  rchancemin = -1;
  rchancemax = 2;
  rreqval = 80;
  setTimeout(winterr, 900000);
}
function winterr() {
  sunposx = 90;
  sunposy = 130;
  sunposz = 60;
  wintertoggle = 1;
  fchancemin = -1;
  fchancemax = 1;
  rchancemin = 0;
  rchancemax = 1;
  rreqval = 100;
  setTimeout(spring, 900000);
}
function spring() {
  wintertoggle = 0;
  sunposx = 20;
  sunposy = 110;
  sunposz = 10;
  fchancemin = -3;
  fchancemax = 1;
  rchancemin = -1;
  rchancemax = 2;
  rreqval = 120;
}

var seasonstart = (function () {
  var started = false;
  return function () {
    if (!started) {
      started = true;
      summer();
    }
  };
})();

export default function dynamicWeather(serverContext: ZoneServer) {
  seasonstart();

  const fogchance = randomIntFromInterval(fchancemin, fchancemax);
  fog = fog + fogchance;
  if (fog < -10) {
    fog = -9;
  }
  if (fog > 80) {
    fog = 79;
  }

  const foggchance = randomIntFromInterval(-3, 3);
  foggradient = foggradient + foggchance;
  if (foggradient < 0) {
    foggradient = 0;
  }
  if (foggradient > 100) {
    foggradient = 100;
  }
  const rainchance = randomIntFromInterval(rchancemin, rchancemax);
  rain = rain + rainchance;
  if (rain < 0) {
    rain = 0;
  }
  if (rain >= rreqval) {
    raintoggle = 1;
    raincheck = "ON";
    rain = 0;
    const raintime = randomIntFromInterval(180000, 300000);
    raintimems = raintime / 60000;
    raintimemin = Math.floor(raintimems);
    debug("Rain will last for " + raintimemin + " min");
    setTimeout(function () {
      raintoggle = 0;
      rain = 0;
      raincheck = "OFF";
      debug("Rain ended");
    }, raintime);
  }
  if (wintertoggle === 0) {
    winter = 53;
  }
  if (wintertoggle === 1) {
    winter = 20;
  }
  debug("[WEATHERSYSTEM] FogDensity: " + fog + "/100");
  debug("[WEATHERSYSTEM] FogGradient: " + foggradient + "/100");
  debug(
    "[WEATHERSYSTEM] Rain: " + raincheck + " - Conditions: " + rain + "/100"
  );
  const rnd_weather = {
    name: "sky",
    unknownDword1: 91,
    unknownDword2: 68,
    unknownDword3: 89,
    unknownDword4: 48,
    fogDensity: fog,
    fogGradient: foggradient,
    fogFloor: 14,
    unknownDword7: 73,
    rain: raintoggle,
    temp: winter,
    skyColor: 7,
    cloudWeight0: 32,
    cloudWeight1: 83,
    cloudWeight2: 93,
    cloudWeight3: 27,
    sunAxisX: sunposx,
    sunAxisY: sunposy,
    sunAxisZ: sunposz,
    unknownDword18: 76,
    unknownDword19: 74,
    unknownDword20: 59,
    wind: 25,
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
  serverContext.SendSkyChangedPacket({} as Client, rnd_weather, true);
}
