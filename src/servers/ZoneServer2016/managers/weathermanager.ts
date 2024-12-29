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

import fs from "node:fs";

import { Weather2016, WeatherTemplate } from "types/zoneserver";
import {
  _
  //isChristmasSeason
} from "../../../utils/utils";
import { ZoneClient2016 as Client } from "../classes/zoneclient";
import { ZoneServer2016 } from "../zoneserver";
//const debug = require("debug")("dynamicWeather");

const localWeatherTemplates = require("../../../../data/2016/dataSources/weather.json");

function rnd_number(
  max: number,
  min: number = 0,
  fixed: boolean = false
): number {
  const num = Math.random() * (max - min) + min;
  return fixed ? Math.round(num) : num;
}

/*function getContinuousRange(max: number, length: number): number[] {
    if (length > max + 1) {
        throw new Error("Length cannot be greater than the range size.");
    }

    const start = Math.floor(Math.random() * (max - length + 2)); // Random start point ensuring it fits within the range
    const range = Array.from({ length }, (_, i) => start + i); // Create continuous range [start, start + 1, ..., start + length - 1]

    return range;
}*/

function getOrderedNumbersInRange(
  min: number,
  max: number,
  length: number
): number[] {
  if (length > max - min + 1) {
    console.log("Length cannot be greater than the range of numbers.");
    return [];
  }

  // Calculate the starting point
  const start = Math.floor(Math.random() * (max - min + 1 - length)) + min;

  // Generate the sequence of numbers
  const sequence = Array.from({ length }, (_, i) => start + i);

  return sequence;
}

export class WeatherManager {
  weatherChoosen = false;
  fog = 0; // density
  currentSeason = "summer";
  skyColor = 0;
  windStrength = 0;
  cloudWeight0 = 0;
  cloudWeight1 = 0;
  cloudWeight2 = 0;
  cloudWeight3 = 0;
  temperature = 80;
  rain = 0;
  rainRampupTime = 0;
  globalPrecipation = 0;
  fogDensity = 0.00001;
  fogFloor = 34;
  fogGradient = 0.00001;
  rainAllowed = false;
  fogAllowed = false;
  rainingHours: number[] = [];
  seasonStarted = false;

  weather!: Weather2016;
  templates: { [name: string]: WeatherTemplate } = localWeatherTemplates;
  dynamicWorker: any;

  // setup by config file
  dynamicEnabled = true;
  defaultTemplate = "donotusethat";

  init() {
    /*const defaultTemplate = isChristmasSeason()
      ? "winter"
      : this.defaultTemplate;
    this.weather = this.templates[defaultTemplate];*/
    this.weather = this.chooseWeather();
    this.seasonstart();
  }

  handleWeatherCommand(
    server: ZoneServer2016,
    client: Client,
    args: Array<string>
  ) {
    const templateName = args[0];

    if (!templateName) {
      server.sendChatText(
        client,
        "Please define a weather template to use (data/2016/dataSources/weather.json)."
      );
    }

    if (this.dynamicEnabled) {
      this.dynamicEnabled = false;
      server.sendChatText(client, "Dynamic weather removed!");
    }

    const weatherTemplate = this.templates[templateName];

    if (!weatherTemplate) {
      if (templateName === "list") {
        server.sendChatText(client, `Weather templates :`);
        _.forEach(this.templates, (element: { templateName: any }) => {
          server.sendChatText(client, `- ${element.templateName}`);
        });
        return;
      }
      server.sendChatText(
        client,
        `"${templateName}" isn't a validweather template.`
      );
      server.sendChatText(
        client,
        `Use "/weather list" to know all available templates.`
      );
      return;
    }

    this.weather = weatherTemplate;
    server.weatherManager.sendUpdateToAll(server, client, true);
    server.sendChatText(client, `Applied weather template: "${args[0]}"`);
  }

  async handleSaveCommand(
    server: ZoneServer2016,
    client: Client,
    args: Array<string>
  ) {
    if (!args[0]) {
      server.sendChatText(
        client,
        "Please define a name for your weather template '/savecurrentweather {name}'"
      );
    } else if (this.templates[args[0]]) {
      server.sendChatText(client, `"${args[0]}" already exists !`);
    } else {
      const template = {
        templateName: args[0],
        ...this.weather
      };
      if (server._soloMode) {
        this.templates[template.templateName] = template;
        fs.writeFileSync(
          `${__dirname}/../../../../data/2016/dataSources/weather.json`,
          JSON.stringify(this.templates, null, "\t")
        );
        delete require.cache[
          require.resolve("../../../../data/2016/dataSources/weather.json")
        ];
        this.templates = require("../../../../data/2016/dataSources/weather.json");
      } else {
        await server._db?.collection("weathers").insertOne(template);
        this.templates = await (server._db as any)
          .collection("weathers")
          .find()
          .toArray();
      }
      server.sendChatText(client, `template "${args[0]}" saved !`);
    }
  }

  handleRandomCommand(server: ZoneServer2016, client: Client) {
    if (this.dynamicEnabled) {
      this.dynamicEnabled = false;
      server.sendChatText(client, "Dynamic weather removed !");
    }
    server.sendChatText(client, `Randomized weather`);

    this.weather = {
      overcast: 50.0,
      fogDensity: rnd_number(0.001),
      fogFloor: rnd_number(100),
      fogGradient: rnd_number(0.014),
      globalPrecipitation: 1.0,
      temperature: rnd_number(50),
      skyClarity: rnd_number(1.0),
      cloudWeight0: rnd_number(0.02),
      cloudWeight1: rnd_number(40),
      cloudWeight2: rnd_number(0.02),
      cloudWeight3: rnd_number(0.02),
      transitionTime: rnd_number(0.02),
      sunAxisX: rnd_number(100),
      sunAxisY: rnd_number(100),
      sunAxisZ: rnd_number(10),
      windDirectionX: rnd_number(40),
      windDirectionY: rnd_number(20),
      windDirectionZ: rnd_number(10),
      wind: rnd_number(6),
      rainMinStrength: rnd_number(2),
      rainRampupTimeSeconds: rnd_number(0.02),
      cloudFile: "sky_Z_clouds.dds",
      stratusCloudTiling: 0.3,
      stratusCloudScrollU: -0.002,
      stratusCloudScrollV: 0,
      stratusCloudHeight: 1000,
      cumulusCloudTiling: 0.2,
      cumulusCloudScrollU: 0,
      cumulusCloudScrollV: 0.002,
      cumulusCloudHeight: 8000,
      cloudAnimationSpeed: rnd_number(0.1),
      cloudSilverLiningThickness: 0.25,
      cloudSilverLiningBrightness: 0,
      cloudShadows: rnd_number(0.02)
    };
    this.sendUpdateToAll(server, client, true);
  }

  startWeatherWorker(server: ZoneServer2016) {
    if (this.dynamicEnabled) {
      this.dynamicWorker = setTimeout(() => {
        if (!this.dynamicEnabled) return;
        this.weather = this.dynamicWeather(server.inGameTimeManager.time);
        this.sendUpdateToAll(server);
        // Needed to avoid black screen issue ? Why ? No idea.
        this.sendUpdateToAll(server);
        this.dynamicWorker.refresh();
      }, 360000 / server.inGameTimeManager.baseTimeMultiplier);
    }
  }

  sendUpdateToAll(server: ZoneServer2016, client?: Client, broadcast = false) {
    server.sendDataToAll("UpdateWeatherData", this.weather);
    if (client && broadcast) {
      server.sendGlobalChatText(
        `User "${client.character.name}" has changed weather.`
      );
    }
  }

  seasonstart() {
    if (!this.seasonStarted) {
      this.seasonStarted = true;
      this.chooseWeather();
    }
  }

  chooseWeather() {
    const weatherType = rnd_number(4, 1, true);
    switch (weatherType) {
      case 1: // sunny
      case 2:
        this.rainAllowed = false;
        this.skyColor = rnd_number(0.1);
        this.cloudWeight0 = rnd_number(0.08);
        this.cloudWeight1 = rnd_number(0.03);
        this.cloudWeight2 = rnd_number(0.08);
        this.cloudWeight3 = rnd_number(0.08);
        switch (this.currentSeason) {
          case "summer":
            this.temperature = 80;
            this.windStrength = rnd_number(0.2);
            //this.fog = 0;
            break;
          case "autumn":
            this.temperature = 80;
            this.windStrength = rnd_number(0.8);
            //this.fog = 0;
            break;
          case "winter":
            this.temperature = 80;
            this.windStrength = rnd_number(0.8);
            //this.fog = 0;
            break;
          case "spring":
            this.temperature = 80;
            this.windStrength = rnd_number(0.4);
            //this.fog = 0;
            break;
          default:
            break;
        }
        break;
      case 3: // cloudy
        this.rainAllowed = true;
        this.skyColor = rnd_number(1);
        this.cloudWeight0 = rnd_number(0.1);
        this.cloudWeight1 = rnd_number(0.1);
        this.cloudWeight2 = rnd_number(0.1);
        this.cloudWeight3 = rnd_number(0.1);
        switch (this.currentSeason) {
          case "summer":
            this.temperature = 80;
            this.windStrength = rnd_number(0.2);
            //this.fog = randomIntFromInterval(0, 80);
            break;
          case "autumn":
            this.temperature = 80;
            this.windStrength = rnd_number(0.8);
            //this.fog = randomIntFromInterval(140, 200);
            break;
          case "winter":
            this.temperature = 80;
            this.windStrength = rnd_number(0.8);
            //this.fog = randomIntFromInterval(140, 200);
            break;
          case "spring":
            this.temperature = 80;
            this.windStrength = rnd_number(0.4);
            //this.fog = randomIntFromInterval(0, 100);
            break;
          default:
            break;
        }
        break;
      case 4: // middle cloudy
        this.rainAllowed = true;
        this.skyColor = rnd_number(0.3);
        this.cloudWeight0 = rnd_number(0.08);
        this.cloudWeight1 = rnd_number(0.08);
        this.cloudWeight2 = rnd_number(0.08);
        this.cloudWeight3 = rnd_number(0.08);
        switch (this.currentSeason) {
          case "summer":
            this.temperature = 80;
            this.windStrength = rnd_number(0.2);
            //this.fog = randomIntFromInterval(0, 40);
            break;
          case "autumn":
            this.temperature = 80;
            this.windStrength = rnd_number(0.8);
            //this.fog = randomIntFromInterval(38, 100);
            break;
          case "winter":
            this.temperature = 80;
            this.windStrength = rnd_number(0.8);
            //this.fog = randomIntFromInterval(38, 100);
            break;
          case "spring":
            this.temperature = 80;
            this.windStrength = rnd_number(0.4);
            //this.fog = randomIntFromInterval(0, 48);
            break;
          default:
            break;
        }
        break;
      default:
        break;
    }

    this.fogAllowed = Math.random() < 0.33; // 33% chance for fog
    if (this.fogAllowed) {
      const fogType = rnd_number(3, 1, true);
      switch (fogType) {
        case 1:
          this.fogDensity = 0.0028;
          this.fogFloor = 34;
          this.fogGradient = 0.0151;
          if (this.skyColor < 0.5) this.skyColor = 0.5;
          break;
        case 2:
          this.fogDensity = 0.0118;
          this.fogFloor = 10;
          this.fogGradient = 0.1451;
          break;
        case 3:
          this.fogDensity = 0.0028;
          this.fogFloor = 34;
          this.fogGradient = 0.0151;
          this.skyColor = 1;
          break;
      }
    } else {
      this.fogDensity = 0.00001;
      this.fogFloor = 34;
      this.fogGradient = 0.00001;
    }

    //simple 50% chance for rain during cloudy days
    if (this.rainAllowed && Math.random() <= 0.5) {
      this.rainingHours = getOrderedNumbersInRange(2, 23, 12);
      this.skyColor = 1;
    } else {
      this.rainingHours = [];
    }

    this.weatherChoosen = true;
    return {
      overcast: 25,
      fogDensity: this.fogDensity,
      fogFloor: this.fogFloor,
      fogGradient: this.fogGradient,
      globalPrecipitation: 0,
      temperature: this.temperature,
      skyClarity: this.skyColor,
      cloudWeight0: this.cloudWeight0,
      cloudWeight1: this.cloudWeight1,
      cloudWeight2: this.cloudWeight2,
      cloudWeight3: this.cloudWeight3,
      transitionTime: 3,
      sunAxisX: 38,
      sunAxisY: 15,
      sunAxisZ: 0,
      windDirectionX: 2,
      windDirectionY: 2,
      windDirectionZ: 0,
      wind: this.windStrength,
      rainMinStrength: 0,
      rainRampupTimeSeconds: 0,
      cloudFile: "sky_Z_clouds.dds",
      stratusCloudTiling: 0.3,
      stratusCloudScrollU: -0.002,
      stratusCloudScrollV: 0,
      stratusCloudHeight: 1000,
      cumulusCloudTiling: 0.3,
      cumulusCloudScrollU: 0.001,
      cumulusCloudScrollV: 0.004,
      cumulusCloudHeight: 8000,
      cloudAnimationSpeed: 0.09,
      cloudSilverLiningThickness: 0.15,
      cloudSilverLiningBrightness: 2,
      cloudShadows: 0.25
    };
  }

  dynamicWeather(serverTime: number): Weather2016 {
    const currentDate = new Date(serverTime * 1000);
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
      case 1:
        this.weatherChoosen = false;
        break;
      case 2: // Determine weather for next day cycle (sunny,cloudy etc)
        if (!this.weatherChoosen) {
          this.weather = this.chooseWeather();
        }
        break;
      case 3: //
        this.weatherChoosen = false;
        break;
      case 19:
        break;
      case 20:
        break;
      default:
        break;
    }
    this.seasonstart();
    if (this.rainingHours.includes(currentHour)) {
      this.rain = 1;
      this.rainRampupTime = 1;
      this.globalPrecipation = 1;
    } else {
      this.rain = 0;
      this.rainRampupTime = 0;
      this.globalPrecipation = 0;
    }
    this.weather.globalPrecipitation = this.globalPrecipation;
    this.weather.rainMinStrength = this.rain;
    this.weather.rainRampupTimeSeconds = this.rainRampupTime;
    return this.weather;
  }
}
