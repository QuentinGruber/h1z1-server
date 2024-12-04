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
  randomIntFromInterval,
  _,
  getCurrentServerTimeWrapper,
  isChristmasSeason
} from "../../../utils/utils";
import { ZoneClient2016 as Client } from "../classes/zoneclient";
import { ZoneServer2016 } from "../zoneserver";
//const debug = require("debug")("dynamicWeather");

const localWeatherTemplates = require("../../../../data/2016/dataSources/weather.json");

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
  fogAllowed = false;
  seasonStarted = false;

  weather!: Weather2016;
  templates: { [name: string]: WeatherTemplate } = localWeatherTemplates;
  dynamicWorker: any;

  // setup by config file
  dynamicEnabled = false;
  defaultTemplate = "donotusethat";

  init() {
    const defaultTemplate = isChristmasSeason()
      ? "winter"
      : this.defaultTemplate;
    this.weather = this.templates[defaultTemplate];
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

    function rnd_number(max: any, fixed: boolean = false) {
      const num = Math.random() * max;
      return Number(fixed ? num.toFixed(0) : num);
    }

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
        this.weather = this.dynamicWeather(
          getCurrentServerTimeWrapper().getFull(),
          server._serverStartTime.getFull(),
          server.inGameTimeManager.baseTimeMultiplier
        );
        this.sendUpdateToAll(server);
        // Needed to avoid black screen issue ? Why ? No idea.
        this.sendUpdateToAll(server);
        this.dynamicWorker.refresh();
      }, 360000 / server.inGameTimeManager.baseTimeMultiplier);
    }
  }

  toggleFog() {
    return this.changeFog();
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
  ): Weather2016 {
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
        this.fog = 0;
        this.fogAllowed = false;
        break;
      case 2: // Determine weather for next day cycle (sunny,cloudy etc)
        if (!this.weatherChoosen) {
          this.chooseWeather();
        }
        break;
      case 3: //
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
        const fogtogglechance = randomIntFromInterval(0, 100);
        if (!this.fogChecked) {
          if (fogtogglechance <= 65) {
            this.fog = 0;
            this.fogAllowed = false;
          } else {
            this.fogAllowed = true;
          }
          this.fogChecked = true;
        }
        break;
      case 20:
        this.fogChecked = false;
        break;
      default:
        break;
    }
    if (this.fogValue == this.fog) {
      // do nothing
    } else if (this.fogValue > this.fog) {
      this.fogValue--;
    } else if (this.fogAllowed) {
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

    return {
      overcast: 1,
      fogDensity: this.fogEnabled
        ? Number((this.fogValue / 40000).toFixed(5))
        : 0,
      fogFloor: 71,
      fogGradient: 0.008,
      globalPrecipitation: 0, //broken
      temperature: this.temperature, // does almost nothing
      skyClarity: Number((this.skyColor / 400).toFixed(5)),
      cloudWeight0: 0, //clouds cause the screen flickering
      cloudWeight1: 0,
      cloudWeight2: 0,
      cloudWeight3: 0,
      transitionTime: 0.25,
      sunAxisX: 0,
      sunAxisY: 0,
      sunAxisZ: 0,
      windDirectionX: -1,
      windDirectionY: -0.5,
      windDirectionZ: -1,
      wind: Number((this.windStrength / 25).toFixed(5)),
      rainMinStrength: 0,
      rainRampupTimeSeconds: 1,
      cloudFile: "sky_Z_clouds.dds",
      stratusCloudTiling: 0.3,
      stratusCloudScrollU: -0.002,
      stratusCloudScrollV: 0,
      stratusCloudHeight: 1000,
      cumulusCloudTiling: 0.2,
      cumulusCloudScrollU: 0,
      cumulusCloudScrollV: 0.002,
      cumulusCloudHeight: 8000,
      cloudAnimationSpeed: 0.1,
      cloudSilverLiningThickness: 0.8,
      cloudSilverLiningBrightness: 0.2,
      cloudShadows: 0.5
    };
  }
}
