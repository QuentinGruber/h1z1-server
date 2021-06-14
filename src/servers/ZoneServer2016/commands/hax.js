//import { generateCharacterId } from "../../../utils/utils";
const _ = require("lodash");
const debug = require("debug")("zonepacketHandlers");
import fs from "fs";

const hax = {
  parachute: function (server, client, args) {
    const characterId = server.generateGuid();
    const guid = server.generateGuid();
    let posY = client.character.state.position[1] + 700;
    const vehicleData = {
      npcData: {
        guid: guid,
        transientId: 999999,
        characterId: characterId,
        modelId: 9374,
        scale: [1, 1, 1, 1],
        position: [
          client.character.state.position[0],
          posY,
          client.character.state.position[2],
          client.character.state.position[3],
        ],
        rotation: client.character.state.lookAt,
        vehicleId: 13,
        attachedObject: {},
        color: {},
      },
      unknownDword1: 10,
      unknownDword2: 10,
      positionUpdate: server.createPositionUpdate(
        new Float32Array([0, 0, 0, 0]),
        [0, 0, 0, 0]
      ),
      unknownString1: "",
    };
    server.sendData(client, "AddLightweightVehicle", vehicleData);
    server._vehicles[characterId] = vehicleData;
    server.worldRoutine(client);
    server.sendData(client, "Mount.MountResponse", {
      characterId: client.character.characterId,
      guid: characterId,
      identity: {},
    });
    client.isMounted = true;
  },

  tp: function(server, client, args) {
    if(args.length < 4){
      server.sendChatText(client, "Need 3 args: position x, y, z", false);
      return;
    }
    const location = {
      position: [args[1], args[2], args[3], 1],
      rotation: [10, 20, 30, 1],
      unknownBool1: true,
      unknownByte1: 100,
      unknownBool2: true,
    };
    server.sendData(client, "ClientUpdate.UpdateLocation", location);
    const SendZoneDetails_packet = {
      zoneName: "Z1",
      unknownBoolean1: true,
      zoneType: 4,
      //skyData: weather,
      skyData: {},
      zoneId1: 3905829720,
      zoneId2: 3905829720,
      nameId: 7699,
      unknownBoolean2: true,
      unknownBoolean3: true,
    };
    server.sendData(client, "SendZoneDetails", SendZoneDetails_packet); // needed or screen is black, maybe use skyChanged instead?
    server.sendData(client, "ClientBeginZoning", {}); // needed or no trees / foliage spawned on tp
  },

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
  spamAtv: function (server, client, args) {
    for (let index = 0; index < 50; index++) {
      const guid = server.generateGuid();
      const transientId = server.getTransientId(client, guid);
      const characterId = server.generateGuid();
      const vehicle = {
        npcData: {
          guid: guid,
          characterId: characterId,
          transientId: transientId,
          modelId: 9588,
          scale: [1, 1, 1, 1],
          position: [client.character.state.position[0], client.character.state.position[1], client.character.state.position[2]],
          rotation: client.character.state.lookAt,
          attachedObject: {},
          vehicleId: 5,
          color: {},
          attachedObject: {}
        },
        unknownGuid1:server.generateGuid(),
        positionUpdate: [0, 0, 0, 0],
      };
      server.sendData( client, "AddLightweightVehicle", vehicle );
      server.sendData(client, "PlayerUpdate.ManagedObject", {
        guid: characterId,
        characterId: client.character.characterId,
      });
      server._vehicles[characterId] = vehicle; // save vehicle
    }
  },
  spawnSimpleNpc: function (server, client, args) {
    const characterId = server.generateGuid();
    const transientId = server.getTransientId(client, characterId);
    if (!args[1]) {
      server.sendChatText(client, "[ERROR] You need to specify a model id !");
      return;
    }
    const choosenModelId = Number(args[1]);
      const obj = {
        characterId: characterId,
        transientId: transientId,
        position: [client.character.state.position[0], client.character.state.position[1], client.character.state.position[2]],
        rotation: [client.character.state.rotation[0], client.character.state.rotation[1], client.character.state.rotation[2]],
        modelId: choosenModelId,
        showHealth: false
      };
    server.sendData(client, "AddSimpleNpc", obj);
    
    server.obj[characterId] = obj; // save npc
  },
  spawnNpcModel: function (server, client, args) {
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
      position: [client.character.state.position[0], client.character.state.position[1], client.character.state.position[2]],
      rotation: [client.character.state.rotation[0], client.character.state.rotation[1], client.character.state.rotation[2]],
      color: {},
      unknownData1: {unknownData1: {}},
      extraModel: "SurvivorMale_Head_01.adr",
      attachedObject: {},
    };
    server.sendData(client, "AddLightweightNpc", npc);
    server._npcs[characterId] = npc; // save npc
  },
  spawnVehicle: function (server, client, args) {
    const guid = server.generateGuid();
    const transientId = server.getTransientId(client, guid);
    if (!args[1]) {
      server.sendChatText(
        client,
        "[ERROR] Usage /hax drive offroader/pickup/policecar/atv"
      );
      return;
    }
    let vehicleId, driveModel;
    switch (args[1]) {
      case "offroader":
        vehicleId = 1;
        driveModel = 7225;
        break;
      case "pickup":
        vehicleId = 2;
        driveModel = 9258;
        break;
      case "policecar":
        vehicleId = 3;
        driveModel = 9301;
        break;
      case "atv":
        vehicleId = 5;
        driveModel = 9588;
        break;
      default: // offroader default
        vehicleId = 1;
        driveModel = 7225;
        break;
    }
    const characterId = server.generateGuid();
    const vehicle = {
      npcData: {
        guid: guid,
        characterId: characterId,
        transientId: transientId,
        modelId: driveModel,
        scale: [1, 1, 1, 1],
        position: [client.character.state.position[0], client.character.state.position[1], client.character.state.position[2]],
        rotation: client.character.state.lookAt,
        attachedObject: {},
        vehicleId: vehicleId,
        color: {},
        attachedObject: {}
      },
      unknownGuid1:server.generateGuid(),
      positionUpdate: [0, 0, 0, 0],
    };
    server.sendData(client, "AddLightweightVehicle", vehicle);
    server.sendData(client, "PlayerUpdate.ManagedObject", {
      guid: characterId,
      characterId: client.character.characterId,
    });
    server._vehicles[characterId] = vehicle; // save vehicle
  },
  
  spawnPcModel: function (server, client, args) {
    const guid = server.generateGuid();
    const transientId = server.getTransientId(client, guid);
    debug("spawnPcModel called");
    /*
    if (!args[1]) {
      server.sendChatText(client, "[ERROR] You need to specify a model id !");
      return;
    }
    */
    //const choosenModelId = Number(args[1]);

    const pc = {
      guid: guid,
      transientId: transientId,
      //modelId: choosenModelId,
      position: [client.character.state.position[0], client.character.state.position[1], client.character.state.position[2]],
      roation: client.character.state.rotation,
      identity: {}
    };
    server.sendData(client, "AddLightweightPc", pc);
    // server._characters[guid] = pc; // save pc (disabled for now)
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
  shutdown: function (server, client, args) {
    server.sendData(client, "WorldShutdownNotice", {
      timeLeft: 0,
      message: " ",
    });
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
    };
    debug(JSON.stringify(rnd_weather));
    server.changeWeather(client, rnd_weather);
  },
};

export default hax;
