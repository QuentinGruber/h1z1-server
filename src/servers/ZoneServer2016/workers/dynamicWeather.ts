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

// import { _ } from "../../../utils/utils";
import { ZoneClient2016 as Client } from "../classes/zoneclient";
// import { randomIntFromInterval } from "../../../utils/utils";
import { ZoneServer2016 } from "../zoneserver";
// const debug = require("debug")("dynamicWeather");

/*
let fog = -10;
let foggradient = 50;
let rain = 50; // increasing value for rain to start
let raintimehalf = 0;
let raintoggle = 0; // not really a toggle, anables rain and specifies its strength
let raintimems = 0;
let raintimemin = 0;
let rainIncMin = 0;
let rainIncMax = 0;
let wintertoggle = 0;
let winter = 53;
let raincheck = "OFF";
*/
let sunposx = 0; // sun position at server start
let sunposy = 0; // sun position at server start
let sunposXInc = 1;
let sunposYInc = 1;
let sunposXmax = 360;
let sunposYmax = 360;
//let sunposXmin = 0;
//let sunposYmin = 0; // max values of sun axis, changed for every season
/*
let cloud1 = 1;
let cloud2 = 1;
let cloud3 = 1;
let cloud4 = 1;
let cchancemin = 0;
let cchancemax = 0;
let cloudmax = 6; // maximum value of clouds at game start
let fchancemin = 0;
let fchancemax = 0;
let rchancemin = 0;
let rchancemax = 0;
let rreqval = 0; // required value "rain" has to reach to enable it
let wind = 20;
let windmax = 30;
let wchancemin = 0;
let wchancemax = 0;
*/

/*
function summer() {
  sunposInc = -0.3;
  sunposXmin = 15;
  sunposYmin = 90;
  sunposZmin = 0;
  fchancemin = -1;
  fchancemax = 0;
  rchancemin = -1;
  rchancemax = 2;
  cchancemin = -1;
  cchancemax = 1;
  cloudmax = 7;
  rreqval = 150;
  wintertoggle = 0;
  windmax = 30;
  wchancemin = -2;
  wchancemax = 1;
  setTimeout(autumn, 900000);
  setInterval(summer, 3600000);
}
function autumn() {
  wintertoggle = 0;
  sunposInc = 0.3;
  sunposXmax = 30;
  sunposYmax = 110;
  sunposZmax = 20;
  fchancemin = -1;
  fchancemax = 2;
  rchancemin = -1;
  rchancemax = 2;
  cchancemin = -1;
  cchancemax = 2;
  cloudmax = 100;
  rreqval = 80;
  windmax = 100;
  wchancemin = -1;
  wchancemax = 2;
  setTimeout(function () {
    sunposXmax = 90;
    sunposYmax = 130;
    sunposZmax = 60;
    wchancemin = -1;
    wchancemax = 3;
  }, 450000);
  setTimeout(winterr, 900000);
}
function winterr() {
  sunposInc = 0.3;
  sunposXmax = 90;
  sunposYmax = 130;
  sunposZmax = 60;
  wintertoggle = 1;
  fchancemin = -1;
  fchancemax = 1;
  rchancemin = 0;
  rchancemax = 1;
  cchancemin = -1;
  cchancemax = 2;
  cloudmax = 100;
  rreqval = 100;
  windmax = 200;
  wchancemin = -1;
  wchancemax = 3;
  setTimeout(function () {
    wchancemin = -3;
    wchancemax = 1;
  }, 450000);
  setTimeout(spring, 900000);
}
function spring() {
  wintertoggle = 0;
  sunposInc = -0.3;
  sunposXmin = 20;
  sunposYmin = 110;
  sunposZmin = 10;
  fchancemin = -3;
  fchancemax = 1;
  rchancemin = -1;
  rchancemax = 2;
  cchancemin = -3;
  cchancemax = 0;
  cloudmax = 100;
  rreqval = 120;
  windmax = 150;
  wchancemin = -3;
  wchancemax = 1;
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
*/

export default function dynamicWeather(server: ZoneServer2016) {
  // sun axis
  sunposx += sunposXInc;
  if (sunposx === sunposXmax) {
    sunposx = 0;
  }
  /*
    if (sunposx < sunposXmin) {
      sunposx = sunposXmax;
    }
  */

  sunposy += sunposYInc;
  if (sunposy === sunposYmax) {
    sunposy = 0;
  }
  /*
    if (sunposy < sunposYmin) {
      sunposy = sunposYmin;
    }
  */

  let weather = {
    name: "",

    unknownDword1: 0, // breaks the game
    unknownDword2: 0, // breaks the game
    skyBrightness1: 1, // breaks the game
    skyBrightness2: 1, // breaks the game

    snow: 0,
    snowMap: 0, // 32 - 35 snow starts thinning, dissapears over 35
    colorGradient: 0,
    unknownDword8: 0, // AOGamma? sky gets more yellow - test during night
    unknownDword9: 0, // related to previous value - both do same/similar thing
    unknownDword10: 0, // related to previous values - both do same/similar thing

    unknownDword11: 0,
    unknownDword12: 0,
    sunAxisX: 0, // 0 - 360
    sunAxisY: 0, // 0 - 360
    unknownDword15: 0,
    disableTrees: 0,
    disableTrees1: 0,
    disableTrees2: 0,
    wind: 0,
    // below variables do nothing ig
    unknownDword20: 0,
    unknownDword21: 0,
    unknownDword22: 0,
    unknownDword23: 0,
    unknownDword24: 0,
    unknownDword25: 0,
    unknownDword26: 0,
    unknownDword27: 0,
    unknownDword28: 0,
    unknownDword29: 0,
    unknownDword30: 0,
    unknownDword31: 0,
    unknownDword32: 0,
    unknownDword33: 0,
  };
  /*
    //rain strength
    const rainchancestr = randomIntFromInterval(rainIncMin, rainIncMax); // rain strength increase
    raintoggle = raintoggle + rainchancestr;
    if (raintoggle > 101) {
      raintoggle = 100;
    }
    // wind
    const windchance = randomIntFromInterval(wchancemin, wchancemax);
    wind = wind + windchance;
    if (wind < -3) {
      wind = -2;
    }
    if (wind > windmax) {
      cloud1 = cloudmax - 1;
    }
    // clouds
    const c1chance = randomIntFromInterval(cchancemin, cchancemax);
    cloud1 = cloud1 + c1chance;
    if (cloud1 < -3) {
      cloud1 = -2;
    }
    if (cloud1 > cloudmax) {
      cloud1 = cloudmax - 1;
    }
    const c2chance = randomIntFromInterval(cchancemin, cchancemax);
    cloud2 = cloud2 + c2chance;
    if (cloud2 < -3) {
      cloud2 = -2;
    }
    if (cloud2 > cloudmax) {
      cloud2 = cloudmax - 1;
    }
    const c3chance = randomIntFromInterval(cchancemin, cchancemax);
    cloud3 = cloud3 + c3chance;
    if (cloud3 < -3) {
      cloud3 = -2;
    }
    if (cloud3 > cloudmax) {
      cloud3 = cloudmax - 1;
    }
    const c4chance = randomIntFromInterval(cchancemin, cchancemax);
    cloud4 = cloud4 + c4chance;
    if (cloud4 < -3) {
      cloud4 = -2;
    }
    if (cloud4 > cloudmax) {
      cloud4 = cloudmax - 1;
    }
    // fog
    const fogchance = randomIntFromInterval(fchancemin, fchancemax);
    fog = fog + fogchance;
    if (fog < -10) {
      fog = -9;
    }
    if (fog > 90) {
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
    // rain
    const rainchance = randomIntFromInterval(rchancemin, rchancemax);
    rain = rain + rainchance;
    if (rain < 0) {
      rain = 0;
    }
    if (rain >= rreqval) {
      raintoggle = 1;
      raincheck = "ON";
      rain = 0;
      rainIncMin = 2;
      rainIncMax = 2;
      const raintime = randomIntFromInterval(180000, 300000);
      raintimehalf = raintime / 2;
      raintimems = raintime / 60000;
      raintimemin = Math.floor(raintimems);
      debug("Rain will last for " + raintimemin + " min");
      setTimeout(function () {
        rainIncMin = -2;
        rainIncMax = -2;
      }, raintimehalf);
      setTimeout(function () {
        rainIncMin = 0;
        rainIncMax = 0;
        rain = 0;
        raincheck = "OFF";
        raintoggle = 0;
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
      cloudWeight0: cloud1,
      cloudWeight1: cloud2,
      cloudWeight2: cloud3,
      cloudWeight3: cloud4,
      sunAxisX: sunposx,
      sunAxisY: sunposy,
      sunAxisZ: sunposz,
      unknownDword18: 76,
      unknownDword19: 74,
      unknownDword20: 59,
      wind: wind,
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
    */
  server.sendWeatherUpdatePacket({} as Client, server._weather2016);
}
