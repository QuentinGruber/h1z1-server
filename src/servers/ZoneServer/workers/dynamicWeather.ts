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
let temp = 73;
let tempfix = 0;
let wintertoggle = 0;
let winter = 53;
let raincheck = "OFF";
let wintercheck = "OFF";


export default function dynamicWeather(serverContext:ZoneServer) {
    const fogchance = randomIntFromInterval(-1, 1)
    fog = (fog + fogchance);
    if (fog < -20) {
        fog = 0
    }
    if (fog > 100) {
        fog = 100
    }
    const foggchance = randomIntFromInterval(-3, 3)
    foggradient = (foggradient + foggchance);
    if (foggradient < 0) {
        foggradient = 0
    }
    if (foggradient > 100) {
        foggradient = 100
    }
    const rainchance = randomIntFromInterval(-2, 3)
    rain = (rain + rainchance);
    if (rain < 0) {
        rain = 0
    }
    if (rain >= 100) {
        raintoggle = 1;
        raincheck = "ON";
        rain = 0;
        const raintime = randomIntFromInterval(300000, 900000)
        raintimems = (raintime / 60000)
        raintimemin = Math.floor(raintimems)
        debug("Rain will last for " + raintimemin + " min");
        setTimeout(function() {
            raintoggle = 0;
            rain = 0;
            raincheck = "OFF";
            debug("Rain ended");
        }, raintime);
    }
    const tempchance = randomIntFromInterval(-4, 3)
    temp = (temp + tempchance)
    tempfix = (temp - 33)
    if (temp <= 33) {
        temp = 31;
        wintertoggle = 1;
        wintercheck = "ON";
        setTimeout(function() {
            temp = 63;
            wintertoggle = 0;
            wintercheck = "OFF";
            debug("Winter ended");
        }, 900000);
    }
    if (temp > 78) {
        temp = 78;
    }
    if (wintertoggle === 0) {
        winter = 53;
    } else {
        winter = 20;
    }
    debug("[WEATHERSYSTEM] FogDensity: " + fog + "/100");
    debug("[WEATHERSYSTEM] FogGradient: " + foggradient + "/100");
    debug("[WEATHERSYSTEM] Winter: " + wintercheck + " - Temperature: " + tempfix + " C");
    debug("[WEATHERSYSTEM] Rain: " + raincheck + " - Conditions: " + rain + "/100");
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
        sunAxisX: 5,
        sunAxisY: 82,
        sunAxisZ: 94,
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
    serverContext.SendSkyChangedPacket({} as Client,rnd_weather,true);
}