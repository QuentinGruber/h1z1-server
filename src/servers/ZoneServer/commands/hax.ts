import fs from "fs";
import { Client, Weather } from "types/zoneserver";
import { ZoneServer } from "../zoneserver";

import _ from "lodash";
const debug = require("debug")("zonepacketHandlers");

let isSonic = false;

const hax: any = {
  time: function (server: ZoneServer, client: Client, args: any[]) {
    const choosenHour: number = Number(args[1]);
    if (choosenHour < 0) {
      server.sendChatText(client, "You need to specify an hour to set !");
      return;
    }
    server.forceTime(choosenHour * 3600 * 1000);
    server.sendChatText(
      client,
      `Will force time to be ${
        choosenHour % 1 >= 0.5
          ? Number(choosenHour.toFixed(0)) - 1
          : choosenHour.toFixed(0)
      }:${
        choosenHour % 1 === 0
          ? "00"
          : (((choosenHour % 1) * 100 * 60) / 100).toFixed(0)
      } on next sync...`,
      true
    );
  },
  realTime: function (server: ZoneServer, client: Client, args: any[]) {
    server.removeForcedTime();
    server.sendChatText(client, "Game time is now based on real time", true);
  },
  tp: function (server: ZoneServer, client: Client, args: any[]) {
    const choosenSpawnLocation = args[1];
    let locationPosition: Float32Array;
    switch (choosenSpawnLocation) {
      case "zimms":
        locationPosition = new Float32Array([2209.17, 47.42, -1011.48, 1]);
        break;
      case "pv":
        locationPosition = new Float32Array([-125.55, 23.41, -1131.71, 1]);
        break;
      case "br":
        locationPosition = new Float32Array([3824.41, 168.19, -4000.0, 1]);
        break;
      case "ranchito":
        locationPosition = new Float32Array([2185.32, 42.36, 2130.49, 1]);
        break;
      case "drylake":
        locationPosition = new Float32Array([479.46, 109.7, 2902.51, 1]);
        break;
      case "dam":
        locationPosition = new Float32Array([-629.49, 69.96, 1233.49, 1]);
        break;
      case "cranberry":
        locationPosition = new Float32Array([-1368.37, 71.29, 1837.61, 1]);
        break;
      case "church":
        locationPosition = new Float32Array([-1928.68, 62.77, 2880.1, 1]);
        break;
      case "desoto":
        locationPosition = new Float32Array([-2793.22, 140.77, 1035.8, 1]);
        break;
      case "toxic":
        locationPosition = new Float32Array([-3064.68, 42.98, -2160.06, 1]);
        break;
      case "radiotower":
        locationPosition = new Float32Array([-1499.21, 353.98, -840.52, 1]);
        break;
      default:
        locationPosition = new Float32Array([0, 50, 0, 1]);
        break;
    }
    client.character.state.position = locationPosition;
    server.sendData(client, "ClientUpdate.UpdateLocation", {
      position: locationPosition,
    });
  },
  despawnObjects: function (server: ZoneServer, client: Client, args: any[]) {
    client.spawnedEntities.forEach((object) => {
      server.despawnEntity(object.characterId);
    });
    client.spawnedEntities = [];
    server._npcs = {};
    server._objects = {};
    server.sendChatText(client, "Objects removed from the game.", true);
  },
  spamOffroader: function (server: ZoneServer, client: Client, args: any[]) {
    for (let index = 0; index < 150; index++) {
      const vehicleData = {
        npcData: {
          guid: server.generateGuid(),
          transientId: 1,
          modelId: 7225,
          scale: [1, 1, 1, 1],
          position: client.character.state.position,
          attachedObject: {},
          color: {},
          unknownArray1: [],
          array5: [{ unknown1: 0 }],
          array17: [{ unknown1: 0 }],
          array18: [{ unknown1: 0 }],
        },
        unknownGuid1: server.generateGuid(),
        positionUpdate: server.createPositionUpdate(
          client.character.state.position,
          [0, 0, 0, 0]
        ),
      };

      server.sendData(
        client,
        "PlayerUpdate.AddLightweightVehicle",
        vehicleData
      );
    }
  },
  spamPoliceCar: function (server: ZoneServer, client: Client, args: any[]) {
    for (let index = 0; index < 150; index++) {
      const vehicleData = {
        npcData: {
          guid: server.generateGuid(),
          transientId: 1,
          modelId: 9301,
          position: client.character.state.position,
          attachedObject: {},
          color: {},
          unknownArray1: [],
          array5: [{ unknown1: 0 }],
          array17: [{ unknown1: 0 }],
          array18: [{ unknown1: 0 }],
        },
        unknownGuid1: server.generateGuid(),
        positionUpdate: server.createPositionUpdate(
          client.character.state.position,
          [0, 0, 0, 0]
        ),
      };

      server.sendData(
        client,
        "PlayerUpdate.AddLightweightVehicle",
        vehicleData
      );
    }
  },
  spawnNpcModel: function (server: ZoneServer, client: Client, args: any[]) {
    const guid = server.generateGuid();
    const transientId = server.getTransientId(client, guid);
    if (!args[1]) {
      server.sendChatText(client, "[ERROR] You need to specify a model id !");
      return;
    }
    const choosenModelId = Number(args[1]);
    const characterId = server.generateGuid();
    const npc = {
      characterId: characterId,
      guid: guid,
      transientId: transientId,
      modelId: choosenModelId,
      position: client.character.state.position,
      attachedObject: {},
      color: {},
      array5: [{ unknown1: 0 }],
      array17: [{ unknown1: 0 }],
      array18: [{ unknown1: 0 }],
    };
    server.sendData(client, "PlayerUpdate.AddLightweightNpc", npc);
    server._npcs[characterId] = npc; // save npc
  },
  sonic: function (server: ZoneServer, client: Client, args: any[]) {
    server.sendData(client, "ClientGameSettings", {
      unknownQword1: "0x0000000000000000",
      unknownBoolean1: true,
      timescale: isSonic ? 1.0 : 3.0,
      unknownQword2: "0x0000000000000000",
      unknownFloat1: 0.0,
      unknownFloat2: 12.0,
      unknownFloat3: 110.0,
    });
    server.sendData(client, "Command.RunSpeed", {
      runSpeed: isSonic ? 0 : -100,
    });
    const messageToMrHedgehog = isSonic
      ? "Goodbye MR.Hedgehog"
      : "Welcome MR.Hedgehog";
    server.sendChatText(client, messageToMrHedgehog, true);
    isSonic = !isSonic;
  },
  observer: function (server: ZoneServer, client: Client, args: any[]) {
    server.sendData(client, "PlayerUpdate.RemovePlayer", {
      characterId: client.character.characterId,
    });
    delete server._characters[client.character.characterId];
    debug(server._characters);
    server.sendChatText(client, "Delete player, back in observer mode");
  },
  changeStat: function (server: ZoneServer, client: Client, args: any[]) {
    const stats = require("../../../../data/sampleData/stats.json");
    server.sendData(client, "PlayerUpdate.UpdateStat", {
      characterId: client.character.characterId,
      stats: stats,
    });
    server.sendChatText(client, "change stat");
  },
  changeModel: function (server: ZoneServer, client: Client, args: any[]) {
    const newModelId = args[1];
    if (newModelId) {
      server.sendData(client, "PlayerUpdate.ReplaceBaseModel", {
        characterId: client.character.characterId,
        modelId: newModelId,
      });
    } else {
      server.sendChatText(client, "Specify a model id !");
    }
  },
  removeDynamicWeather: async function (server: ZoneServer, client: Client, args: any[]) {
    clearInterval(server._dynamicWeatherInterval);
    server.changeWeather(client, server._weatherTemplates[server._defaultWeatherTemplate])
    server.sendChatText(client,"Dynamic weather removed !")
  },
  weather: function (server: ZoneServer, client: Client, args: any[]) {
    const weatherTemplate = server._soloMode
      ? server._weatherTemplates[args[1]]
      : _.find(server._weatherTemplates, (template) => {
          return template.templateName === args[1];
        });
    if (!args[1]) {
      server.sendChatText(
        client,
        "Please define a weather template to use (data/sampleData/weather.json)"
      );
    } else if (weatherTemplate) {
      server.changeWeather(client, weatherTemplate);
      server.sendChatText(client, `Use "${args[1]}" as a weather template`);
    } else {
      if (args[1] === "list") {
        server.sendChatText(client, `Weather templates :`);
        _.forEach(server._weatherTemplates, function (element, key) {
          console.log(element.templateName);
          server.sendChatText(client, `- ${element.templateName}`);
        });
      } else {
        server.sendChatText(client, `"${args[1]}" isn't a weather template`);
        server.sendChatText(
          client,
          `Use "/hax weather list" to know all available templates`
        );
      }
    }
  },
  saveCurrentWeather: async function (
    server: ZoneServer,
    client: Client,
    args: any[]
  ) {
    if (!args[1]) {
      server.sendChatText(
        client,
        "Please define a name for your weather template '/hax saveCurrentWeather {name}'"
      );
    } else if (
      server._weatherTemplates[args[1]] ||
      _.find(server._weatherTemplates, (template) => {
        return template.templateName === args[1];
      })
    ) {
      server.sendChatText(client, `"${args[1]}" already exist !`);
    } else {
      const { _weather: currentWeather } = server;
      if (currentWeather) {
        currentWeather.templateName = args[1];
        if (server._soloMode) {
          server._weatherTemplates[currentWeather.templateName as string] =
            currentWeather;
          fs.writeFileSync(
            `${__dirname}/../../../../data/sampleData/weather.json`,
            JSON.stringify(server._weatherTemplates)
          );
          delete require.cache[
            require.resolve("../../../../data/sampleData/weather.json")
          ];
          server._weatherTemplates = require("../../../../data/sampleData/weather.json");
        } else {
          await server._db?.collection("weathers").insertOne(currentWeather);
          server._weatherTemplates = await (server._db as any)
            .collection("weathers")
            .find()
            .toArray();
        }
        server.sendChatText(client, `template "${args[1]}" saved !`);
      } else {
        server.sendChatText(client, `Saving current weather failed...`);
        server.sendChatText(client, `plz report this`);
      }
    }
  },
  run: function (server: ZoneServer, client: Client, args: any[]) {
    const speedValue = args[1];
    let speed;
    if (speedValue > 10) {
      server.sendChatText(
        client,
        "To avoid security issue speed > 10 is set to 15",
        true
      );
      speed = 15;
    } else {
      speed = speedValue;
    }
    server.sendChatText(client, "Setting run speed: " + speed, true);
    server.sendData(client, "Command.RunSpeed", {
      runSpeed: speed,
    });
  },
  hell: function (server: ZoneServer, client: Client, args: any[]) {
    server.sendChatText(
      client,
      "[DEPRECATED] use '/hax randomWeather' instead",
      true
    );
  },
  randomWeather: function (server: ZoneServer, client: Client, args: any[]) {
    debug("Randomized weather");
    server.sendChatText(client, `Randomized weather`);

    function rnd_number() {
      return Number((Math.random() * 100).toFixed(0));
    }
    const fogEnabled = Math.random() * 3 < 1;
    const rainEnabled = Math.random() * 4 < 1;
    const winterEnabled = Math.random() * 4 < 1;
    const rnd_weather: Weather = {
      name: "sky",
      unknownDword1: rnd_number(),
      unknownDword2: rnd_number(),
      unknownDword3: rnd_number(),
      unknownDword4: rnd_number(),
      fogDensity: fogEnabled ? rnd_number() : 0, // fog intensity
      fogGradient: fogEnabled ? rnd_number() : 0,
      fogFloor: fogEnabled ? rnd_number() : 0,
      unknownDword7: 0,
      rain: rainEnabled ? rnd_number() : 0,
      temp: winterEnabled ? 0 : 40, // 0 : snow map , 40+ : spring map
      skyColor: rnd_number(),
      cloudWeight0: rnd_number(),
      cloudWeight1: rnd_number(),
      cloudWeight2: rnd_number(),
      cloudWeight3: rnd_number(),
      sunAxisX: rnd_number(),
      sunAxisY: rnd_number(),
      sunAxisZ: rnd_number(), // night when 100
      unknownDword18: rnd_number(),
      unknownDword19: rnd_number(),
      unknownDword20: rnd_number(),
      wind: rnd_number(),
      unknownDword22: rnd_number(),
      unknownDword23: rnd_number(),
      unknownDword24: rnd_number(),
      unknownDword25: rnd_number(),
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
    debug(JSON.stringify(rnd_weather));
    server.changeWeather(client, rnd_weather);
  },
  titan: function (server: ZoneServer, client: Client, args: any[]) {
    server.sendData(client, "PlayerUpdate.UpdateScale", {
      characterId: client.character.characterId,
      scale: [20, 20, 20, 1],
    });
    server.sendChatText(client, "TITAN size");
  },
  poutine: function (server: ZoneServer, client: Client, args: any[]) {
    server.sendData(client, "PlayerUpdate.UpdateScale", {
      characterId: client.character.characterId,
      scale: [20, 5, 20, 1],
    });
    server.sendChatText(client, "The meme become a reality.....");
  },
  rat: function (server: ZoneServer, client: Client, args: any[]) {
    server.sendData(client, "PlayerUpdate.UpdateScale", {
      characterId: client.character.characterId,
      scale: [0.2, 0.2, 0.2, 1],
    });
    server.sendChatText(client, "Rat size");
  },
  normalSize: function (server: ZoneServer, client: Client, args: any[]) {
    server.sendData(client, "PlayerUpdate.UpdateScale", {
      characterId: client.character.characterId,
      scale: [1, 1, 1, 1],
    });
    server.sendChatText(client, "Back to normal size");
  },
};

export default hax;
