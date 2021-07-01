const _ = require("lodash");
const debug = require("debug")("zonepacketHandlers");
import fs from "fs";

function getHeadActor(modelId) {
  switch(modelId) {
    case 9240:
      return "SurvivorMale_Head_01.adr";
    case 9474:
      return "SurvivorFemale_Head_01.adr";
    case 9510:
      return "ZombieFemale_Head_01.adr";
    case 9634:
      return "ZombieMale_Head_01.adr";
    default:
      return "";
  }
}

const hax = {
  parachute: function (server, client, args) {
    const characterId = server.generateGuid();
    const vehicleData = {
      npcData: {
        guid: server.generateGuid(),
        transientId: 999999,
        characterId: characterId,
        modelId: 9374,
        scale: [1, 1, 1, 1],
        position: [
          client.character.state.position[0],
          client.character.state.position[1] + 700,
          client.character.state.position[2],
          client.character.state.position[3],
        ],
        rotation: client.character.state.lookAt,
        vehicleId: 13,
        attachedObject: {},
        color: {},
      },
      positionUpdate: server.createPositionUpdate(
        new Float32Array([0, 0, 0, 0]),
        [0, 0, 0, 0]
      ),
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
    let locationPosition;
    switch (args[1]) {
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
      case "villas":
        locationPosition = new Float32Array([489.02, 102, 2942.65, 1]);
        break;
      case "military":
        locationPosition = new Float32Array([696.53, 48.08, -2470.62, 1]);
        break;
      case "hospital":
        locationPosition = new Float32Array([1895.4, 93.69, -2914.39, 1]);
        break;
      default:
        if(args.length < 4){
          server.sendChatText(client, "Unknown set location, need 3 args to tp to exact location: x, y, z", false);
          server.sendChatText(client, "Set location list: zimms, pv, br, ranchito, drylake, dam, cranberry, church, desoto, toxic, radiotower, villas, military, hospital", false);
          return;
        }
        locationPosition = new Float32Array([args[1], args[2], args[3], 1]);
        break;
    }

    client.character.state.position = locationPosition;
    server.sendData(client, "ClientUpdate.UpdateLocation", {
      position: locationPosition,
      triggerLoadingScreen: true,
    });
    
    server.sendData(client, "UpdateWeatherData", {});
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
          position: [
            client.character.state.position[0],
            client.character.state.position[1],
            client.character.state.position[2],
          ],
          rotation: client.character.state.lookAt,
          attachedObject: {},
          vehicleId: 5,
          color: {},
        },
        unknownGuid1: server.generateGuid(),
        positionUpdate: [0, 0, 0, 0],
      };
      server.sendData(client, "AddLightweightVehicle", vehicle);
      server.sendData(client, "PlayerUpdate.ManagedObject", {
        objectCharacterId: characterId,
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
    if (!args[3]) {
      server.sendChatText(client, "Missing 2 byte values");
      return;
    }
    const choosenModelId = Number(args[1]);
      const obj = {
        characterId: characterId,
        transientId: transientId,
        //unknownByte1: Number(args[2]),
        position: [client.character.state.position[0], client.character.state.position[1], client.character.state.position[2]],
        modelId: choosenModelId,
        showHealth: Number(args[2]),
        unknownDword4: Number(args[3])

      };
    server.sendData(client, "AddSimpleNpc", obj);

    // server.obj[characterId] = obj; // save npc
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
      position: [
        client.character.state.position[0],
        client.character.state.position[1],
        client.character.state.position[2],
      ],
      rotation: [
        client.character.state.rotation[0],
        client.character.state.rotation[1],
        client.character.state.rotation[2],
      ],
      color: {},
      unknownData1: {unknownData1: {}},
      headActor: getHeadActor(choosenModelId),
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
        "[ERROR] Usage /hax spawnVehicle offroader/pickup/policecar/atv"
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
      default:
        // offroader default
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
        rotation: [0, 0, 0, 0],
        attachedObject: {},
        vehicleId: vehicleId,
        color: {},
      },
      unknownGuid1: server.generateGuid(),
      positionUpdate: [0, 0, 0, 0],
    };
    server.sendData(client, "AddLightweightVehicle", vehicle);
    server.sendData(client, "PlayerUpdate.ManagedObject", {
      objectCharacterId: characterId,
      characterId: client.character.characterId,
    });
    server._vehicles[characterId] = vehicle; // save vehicle
  },

  spawnPcModel: function (server, client, args) {
    const guid = server.generateGuid();
    const transientId = server.getTransientId(client, guid);
    debug("spawnPcModel called");
    if (!args[1]) {
      server.sendChatText(client, "[ERROR] You need to specify a name !");
      return;
    }
    //const choosenModelId = Number(args[1]);

    const pc = {
      guid: guid,
      transientId: transientId,
      //modelId: choosenModelId,
      position: [
        client.character.state.position[0],
        client.character.state.position[1],
        client.character.state.position[2],
      ],
      roation: client.character.state.rotation,
      identity: {characterName: args[1]}
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
          server._weatherTemplates[currentWeather.templateName] =
            currentWeather;
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
  equipment: function(server, client, args) {
    let effect, model, slot;
    if(!args[1]) {
      server.sendChatText(client, "[ERROR] Missing equipment name !");
      server.sendChatText(client, "Valid options: hoodie, shirt, pants, helmet, backpack, shoes, armor, gloves");
      return;
    }
    if(!args[2]) {
      server.sendChatText(client, "No effect added.");
      effect = 0;
    } else {
      effect = args[2];
    }
    switch(args[1]) {
      case "hoodie":
        model = "SurvivorMale_Chest_Hoodie_Up_Tintable.adr";
        slot = 3;
        break;
      case "shirt":
        model = "SurvivorMale_Chest_Shirt_Henley.adr";
        slot = 3;
        break;
      case "pants":
        model = "SurvivorMale_Legs_Pants_StraightLeg.adr";
        slot = 4;
        break;
      case "helmet":
        model = "SurvivorMale_Head_Helmet_Motorcycle_Tintable.adr";
        slot = 15;
        break;
      case "backpack":
        //model = "SurvivorMale_Back_Backpack_Military.adr";
        model = "SurvivorMale_Back_Backpack_Military_Rasta.adr";
        slot = 10;
        break;
      case "shoes":
        model = "SurvivorMale_Feet_Conveys_Tintable.adr";
        slot = 5;
        break;
      case "armor":
        //model = "SurvivorMale_Armor_Kevlar_Military.adr";
        model = "SurvivorMale_Armor_Kevlar_Basic_Patches.adr";
        slot = 100;
        break;
      case "gloves":
        model = "SurvivorMale_Hands_Gloves_Padded.adr";
        slot = 2;
        break;
      case "bandana":
        model = "SurvivorMale_Face_Bandana.adr";
        slot = 28;
        break;
      case "ghillie":
        model = "SurvivorMale_Chest_GhillieSuit.adr";
        slot = 3;
        break;
      default:
        server.sendChatText(client, "Valid options: hoodie, shirt, pants, helmet, backpack, shoes, armor, gloves, bandana, ghillie");
        return;
    }
    const equipmentSlot = {
      characterData: {
        characterId: client.character.characterId
      },
      equipmentTexture: {
        index: 1,
        slotId: slot,
        unknownQword1: "0x1",
        textureAlias: "",
        unknownString1: ""
      },
      equipmentModel: {
        model: model,
        effectId: Number(effect), // 0 - 16
        equipmentSlotId: slot,
        unknownArray1: []
      }
    };
    server.sendChatText(client, `Setting character equipment slot: ${args[1]}`);
    server.sendData(client, "Equipment.SetCharacterEquipmentSlot", equipmentSlot);
  }
};

export default hax;
