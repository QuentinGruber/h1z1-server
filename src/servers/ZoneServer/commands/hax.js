import { generateCharacterId } from "../../../utils/utils";
const _ = require("lodash");
const debug = require("debug")("zonepacketHandlers");
import fs from "fs";

const hax = {
  forceNight: function (server, client, args) {
    server.forceTime(1615062252322);
    server.sendChatText(
      client,
      "[Deprecated] This command will be removed in futher updates",
      true
    );
    server.sendChatText(
      client,
      "Use /hax time {choosen hour as float} instead",
      false
    );
    server.sendChatText(client, "Will force Night time on next sync...", false);
  },
  forceDay: function (server, client, args) {
    server.forceTime(971172000000);
    server.sendChatText(
      client,
      "[Deprecated] This command will be removed in futher updates",
      true
    );
    server.sendChatText(
      client,
      "Use /hax time {choosen hour as float} instead",
      false
    );
    server.sendChatText(client, "Will force Day time on next sync...", false);
  },
  time: function (server, client, args) {
    const choosenHour = Number(args[1]);
    if (choosenHour < 0) {
      server.sendChatText(client, "You need to specify an hour to set !");
      return;
    }
    server.forceTime(choosenHour * 3600 * 1000);
    server.sendChatText(
      client,
      `Will force time to be ${
        choosenHour % 1 >= 0.5
          ? choosenHour.toFixed(0) - 1
          : choosenHour.toFixed(0)
      }:${
        choosenHour % 1 === 0
          ? "00"
          : (((choosenHour % 1) * 100 * 60) / 100).toFixed(0)
      } on next sync...`,
      true
    );
  },
  realTime: function (server, client, args) {
    server.removeForcedTime();
    server.sendChatText(client, "Game time is now based on real time", true);
  },
  spamOffroader: function (server, client, args) {
    for (let index = 0; index < 150; index++) {
      const vehicleData = {
        npcData: {
          guid: generateCharacterId(),
          transientId: 1,
          modelId: 7225,
          scale: [1, 1, 1, 1],
          position: client.character.state.position,
          unknownArray1: [],
          array5: [{ unknown1: 0 }],
          array17: [{ unknown1: 0 }],
          array18: [{ unknown1: 0 }],
        },
        unknownGuid1: generateCharacterId(),
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
  spamPoliceCar: function (server, client, args) {
    for (let index = 0; index < 150; index++) {
      const vehicleData = {
        npcData: {
          guid: generateCharacterId(),
          transientId: 1,
          modelId: 9301,
          scale: [0.1, 0.1, 0.1, 0.1],
          position: client.character.state.position,
          unknownArray1: [],
          array5: [{ unknown1: 0 }],
          array17: [{ unknown1: 0 }],
          array18: [{ unknown1: 0 }],
        },
        unknownGuid1: generateCharacterId(),
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
  spawnNpcModel: function (server, client, args) {
    const guid = server.generateGuid();
    const transientId = server.getTransientId(client, guid);
    if (!args[1]) {
      server.sendChatText(client, "[ERROR] You need to specify a model id !");
      return;
    }
    const choosenModelId = Number(args[1]);
    const characterId = generateCharacterId();
    const npc = {
      characterId: characterId,
      guid: guid,
      transientId: transientId,
      modelId: choosenModelId,
      position: client.character.state.position,
      array5: [{ unknown1: 0 }],
      array17: [{ unknown1: 0 }],
      array18: [{ unknown1: 0 }],
    };
    server.sendData(client, "PlayerUpdate.AddLightweightNpc", npc);
    server._npcs[characterId] = npc; // save npc
  },
  sonic: function (server, client, args) {
    server.sendData(client, "ClientGameSettings", {
      unknownQword1: "0x0000000000000000",
      unknownBoolean1: true,
      timescale: 3.0,
      unknownQword2: "0x0000000000000000",
      unknownFloat1: 0.0,
      unknownFloat2: 12.0,
      unknownFloat3: 110.0,
    });
    server.sendData(client, "Command.RunSpeed", {
      runSpeed: -100,
    });
    server.sendChatText(client, "Welcome MR.Hedgehog");
  },
  observer: function (server, client, args) {
    server.sendData(client, "PlayerUpdate.RemovePlayer", {
      characterId: client.character.characterId,
    });
    delete server._characters[client.character.characterId];
    debug(server._characters);
    server.sendChatText(client, "Delete player, back in observer mode");
  },
  shutdown: function (server, client, args) {
    server.sendData(client, "WorldShutdownNotice", {
      timeLeft: 0,
      message: " ",
    });
  },
  changeModel: function (server, client, args) {
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
  weather: function (server, client, args) {
    const weatherTemplate = server._soloMode
      ? server._weatherTemplates[args[1]]
      : _.find(server._weatherTemplates, (template) => {
          return template.templateName === args[1];
        });
    if (!args[1]) {
      server.sendChatText(
        client,
        "Please define a weather template to use (data/weather.json)"
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
  saveCurrentWeather: async function (server, client, args) {
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
          server._weatherTemplates[
            currentWeather.templateName
          ] = currentWeather;
          fs.writeFileSync(
            `${__dirname}/../../../../data/weather.json`,
            JSON.stringify(server._weatherTemplates)
          );
          delete require.cache[
            require.resolve("../../../../data/weather.json")
          ];
          server._weatherTemplates = require("../../../../data/weather.json");
        } else {
          await server._db.collection("weathers").insertOne(currentWeather);
          server._weatherTemplates = await server._db
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
  run: function (server, client, args) {
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
  hell: function (server, client, args) {
    server.sendChatText(
      client,
      "[DEPRECATED] use '/hax randomWeather' instead",
      true
    );
  },
  randomWeather: function (server, client, args) {
    debug("Randomized weather");
    server.sendChatText(client, `Randomized weather`);
    function rnd_number() {
      return Number((Math.random() * 100).toFixed(0));
    }

    const rnd_weather = {
      name: "sky",
      unknownDword1: rnd_number(),
      unknownDword2: rnd_number(),
      unknownDword3: rnd_number(),
      unknownDword4: rnd_number(),
      fogDensity: rnd_number(), // fog intensity
      fogGradient: rnd_number(),
      fogFloor: rnd_number(),
      unknownDword7: rnd_number(),
      rain: rnd_number(),
      temp: rnd_number(), // 0 : snow map , 40+ : spring map
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
  titan: function (server, client, args) {
    server.sendData(client, "PlayerUpdate.UpdateScale", {
      characterId: client.character.characterId,
      scale: [20, 20, 20, 1],
    });
    server.sendChatText(client, "TITAN size");
  },
  poutine: function (server, client, args) {
    server.sendData(client, "PlayerUpdate.UpdateScale", {
      characterId: client.character.characterId,
      scale: [20, 5, 20, 1],
    });
    server.sendChatText(client, "The meme become a reality.....");
  },
  rat: function (server, client, args) {
    server.sendData(client, "PlayerUpdate.UpdateScale", {
      characterId: client.character.characterId,
      scale: [0.2, 0.2, 0.2, 1],
    });
    server.sendChatText(client, "Rat size");
  },
  normalSize: function (server, client, args) {
    server.sendData(client, "PlayerUpdate.UpdateScale", {
      characterId: client.character.characterId,
      scale: [1, 1, 1, 1],
    });
    server.sendChatText(client, "Back to normal size");
  },
};

export default hax;
