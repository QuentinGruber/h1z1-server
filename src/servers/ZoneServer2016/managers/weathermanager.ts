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

import fs from "node:fs";

import { Weather2016 } from "types/zoneserver";
import { randomIntFromInterval, _ } from "../../../utils/utils";
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
  templates = localWeatherTemplates;
  dynamicWorker: any;
  dynamicEnabled = true;
  
  cycleSpeed = 100;
  frozeCycle = false;
  defaultTemplate = "z1br";

  handleWeatherCommand(server: ZoneServer2016, client: Client, args: Array<string>) {
    if (this.dynamicEnabled) {
      this.dynamicEnabled = false;
      server.sendChatText(client, "Dynamic weather removed !");
    }
    const weatherTemplate = server._soloMode
      ? this.templates[args[0] || ""]
      : _.find(
          this.templates,
          (template: { templateName: any }) => {
            return template.templateName === args[0];
          }
        );
    if (!args[0]) {
      server.sendChatText(
        client,
        "Please define a weather template to use (data/2016/dataSources/weather.json)"
      );
    } else if (weatherTemplate) {
      this.weather = weatherTemplate;
      server.weatherManager.sendUpdateToAll(server, client, true);
      server.sendChatText(client, `Applied weather template: "${args[0]}"`);
    } else {
      if (args[0] === "list") {
        server.sendChatText(client, `Weather templates :`);
        _.forEach(
          this.templates,
          (element: { templateName: any }) => {
            server.sendChatText(client, `- ${element.templateName}`);
          }
        );
      } else {
        server.sendChatText(client, `"${args[0]}" isn't a weather template`);
        server.sendChatText(
          client,
          `Use "/weather list" to know all available templates`
        );
      }
    }
  }

  async handleSaveCommand(server: ZoneServer2016, client: Client, args: Array<string>) {
    if (!args[0]) {
      server.sendChatText(
        client,
        "Please define a name for your weather template '/savecurrentweather {name}'"
      );
    } else if (this.templates[args[0]]) {
      server.sendChatText(client, `"${args[0]}" already exists !`);
    } else {
      const currentWeather = this.weather;
      if (currentWeather) {
        currentWeather.templateName = args[0];
        if (server._soloMode) {
          this.templates[currentWeather.templateName as string] =
            currentWeather;
          fs.writeFileSync(
            `${__dirname}/../../../../data/2016/dataSources/weather.json`,
            JSON.stringify(this.templates, null, "\t")
          );
          delete require.cache[
            require.resolve("../../../../data/2016/dataSources/weather.json")
          ];
          this.templates = require("../../../../data/2016/dataSources/weather.json");
        } else {
          await server._db?.collection("weathers").insertOne(currentWeather);
          this.templates = await (server._db as any)
            .collection("weathers")
            .find()
            .toArray();
        }
        server.sendChatText(client, `template "${args[0]}" saved !`);
      } else {
        server.sendChatText(client, `Saving current weather failed...`);
        server.sendChatText(client, `plz report this`);
      }
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
      ...this.weather,
      //name: "sky_dome_600.dds", todo: use random template from a list
      /*
            unknownDword1: 0,
            unknownDword2: 0,
            skyBrightness1: 1,
            skyBrightness2: 1,
            */
      rain: rnd_number(200, true),
      temp: rnd_number(80, true),
      colorGradient: rnd_number(1),
      unknownDword8: rnd_number(1),
      unknownDword9: rnd_number(1),
      unknownDword10: rnd_number(1),
      unknownDword11: 0,
      unknownDword12: 0,
      sunAxisX: rnd_number(360, true),
      sunAxisY: rnd_number(360, true),
      unknownDword15: 0,
      windDirectionX: rnd_number(360, true),
      windDirectionY: rnd_number(360, true),
      windDirectionZ: rnd_number(360, true),
      wind: rnd_number(100, true),
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

      AOSize: rnd_number(0.5),
      AOGamma: rnd_number(0.2),
      AOBlackpoint: rnd_number(2),

      unknownDword33: 0,
    };
    this.sendUpdateToAll(server, client, true);
  }

  startWeatherWorker(server: ZoneServer2016) {
    if (this.dynamicEnabled) {
      this.dynamicWorker = setTimeout(() => {
        if (!this.dynamicEnabled) return;
        this.weather = this.dynamicWeather(
          server._serverTime,
          server._startTime,
          server._timeMultiplier
        );
        this.sendUpdateToAll(server);
        this.sendUpdateToAll(server);
        this.dynamicWorker.refresh();
      }, 360000 / server._timeMultiplier);
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

  forceTime(server: ZoneServer2016, time: number) {
    this.cycleSpeed = 0.1;
    this.frozeCycle = true;
    server._gameTime = time;
  }

  removeForcedTime(server: ZoneServer2016) {
    this.cycleSpeed = 100;
    this.frozeCycle = false;
    server._gameTime = Date.now();
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
      sunAxisX: 0,
      sunAxisY: 0,
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
