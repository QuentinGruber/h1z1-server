import fs from "fs";
import {ZoneClient2016 as Client} from "../zoneclient";
import { ZoneServer2016 } from "../zoneserver";
import { _ } from "../../../utils/utils";
const debug = require("debug")("zonepacketHandlers");

function getHeadActor(modelId: number) {
  switch (modelId) {
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

const hax: any = {
  parachute: function (server: ZoneServer2016, client: Client, args: any[]) {
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
    server._vehicles[characterId] = vehicleData;
    server.worldRoutine2016();
    server.sendData(client, "Mount.MountResponse", {
      characterId: client.character.characterId,
      vehicleGuid: characterId,
      identity: {},
    });
    client.vehicle.mountedVehicle = characterId;
    client.vehicle.mountedVehicleType = "parachute";
  },

  tp: function (server: ZoneServer2016, client: Client, args: any[]) {
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
        if (args.length < 4) {
          server.sendChatText(
            client,
            "Unknown set location, need 3 args to tp to exact location: x, y, z",
            false
          );
          server.sendChatText(
            client,
            "Set location list: zimms, pv, br, ranchito, drylake, dam, cranberry, church, desoto, toxic, radiotower, villas, military, hospital",
            false
          );
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
    server.updateWeather2016(client);
  },
  time: function (server: ZoneServer2016, client: Client, args: any[]) {
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
  realTime: function (server: ZoneServer2016, client: Client, args: any[]) {
    server.removeForcedTime();
    server.sendChatText(client, "Game time is now based on real time", true);
  },
  spamAtv: function (server: ZoneServer2016, client: Client, args: any[]) {
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
      server._vehicles[characterId] = vehicle; // save vehicle
    }
  },
  spawnSimpleNpc: function (
    server: ZoneServer2016,
    client: Client,
    args: any[]
  ) {
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
      position: [
        client.character.state.position[0],
        client.character.state.position[1],
        client.character.state.position[2],
      ],
      modelId: choosenModelId,
      showHealth: Number(args[2]),
      unknownDword4: Number(args[3]),
    };
    server._objects[characterId] = obj; // save npc
  },
  spawnNpcModel: function (
    server: ZoneServer2016,
    client: Client,
    args: any[]
  ) {
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
      unknownData1: { unknownData1: {} },
      headActor: getHeadActor(choosenModelId),
      attachedObject: {},
    };
    server._npcs[characterId] = npc; // save npc
  },
  spawnVehicle: function (server: ZoneServer2016, client: Client, args: any[]) {
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
        position: [
          client.character.state.position[0],
          client.character.state.position[1],
          client.character.state.position[2],
        ],
        rotation: [0, 0, 0, 0],
        attachedObject: {},
        vehicleId: vehicleId,
        color: {},
      },
      unknownGuid1: server.generateGuid(),
      positionUpdate: [0, 0, 0, 0],
    };
    server._vehicles[characterId] = vehicle; // save vehicle
  },

  spawnPcModel: function (server: ZoneServer2016, client: Client, args: any[]) {
    const guid = server.generateGuid();
    const transientId = server.getTransientId(client, guid);
    debug("spawnPcModel called");
    if (!args[1]) {
      server.sendChatText(client, "[ERROR] You need to specify a name !");
      return;
    }

    const pc = {
      guid: guid,
      transientId: transientId,
      //modelId: choosenModelId,
      position: [
        client.character.state.position[0],
        client.character.state.position[1],
        client.character.state.position[2],
      ],
      rotation: client.character.state.rotation,
      identity: { characterName: args[1] },
      name: args[1],
      state: {
        position: [
          client.character.state.position[0],
          client.character.state.position[1],
          client.character.state.position[2],
        ],
        lookAt: [
          client.character.state.lookAt[0],
          client.character.state.lookAt[1],
          client.character.state.lookAt[2],
        ],
      },
    };
    server._characters[guid] = pc; // save pc
  },
  sonic: function (server: ZoneServer2016, client: Client, args: any[]) {
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
  shutdown: function (server: ZoneServer2016, client: Client, args: any[]) {
    server.sendData(client, "WorldShutdownNotice", {
      timeLeft: 0,
      message: " ",
    });
  },
  weather: async function (
    server: ZoneServer2016,
    client: Client,
    args: any[]
  ) {
    if (server._dynamicWeatherEnabled) {
      await server._dynamicWeatherWorker.terminate();
      server._dynamicWeatherWorker = null;
      server.sendChatText(client, "Dynamic weather removed !");
    }
    const weatherTemplate = server._soloMode
      ? server._weatherTemplates[args[1]]
      : _.find(server._weatherTemplates, (template: { templateName: any }) => {
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
        _.forEach(
          server._weatherTemplates,
          function (element: { templateName: any }) {
            console.log(element.templateName);
            server.sendChatText(client, `- ${element.templateName}`);
          }
        );
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
    server: ZoneServer2016,
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
      _.find(server._weatherTemplates, (template: { templateName: any }) => {
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
            currentWeather.templateName as string
          ] = currentWeather;
          fs.writeFileSync(
            `${__dirname}/../../../../data/sampleData/weather.json`,
            JSON.stringify(server._weatherTemplates)
          );
          delete require.cache[
            require.resolve("../../../../data/2015/sampleData/weather.json")
          ];
          server._weatherTemplates = require("../../../../data/2015/sampleData/weather.json");
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
  run: function (server: ZoneServer2016, client: Client, args: any[]) {
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
  randomWeather: function (
    server: ZoneServer2016,
    client: Client,
    args: any[]
  ) {
    server.sendChatText(client, `Randomized weather`);
    function rnd_number(max: any, fixed: Boolean = false) {
      const num = Math.random() * max;
      if (fixed) return Number(num.toFixed(0));
      return Number(num);
    }

    server._weather2016 = {
      name: "",
      unknownDword1: 0,
      unknownDword2: 0,
      skyBrightness1: 1,
      skyBrightness2: 1,
      snow: rnd_number(200, true),
      snowMap: rnd_number(80, true),
      colorGradient: rnd_number(1),
      unknownDword8: rnd_number(1),
      unknownDword9: rnd_number(1),
      unknownDword10: rnd_number(1),
      unknownDword11: 0,
      unknownDword12: 0,
      sunAxisX: rnd_number(360, true),
      sunAxisY: rnd_number(360, true),
      unknownDword15: 0,
      disableTrees: 0,
      disableTrees1: 0,
      disableTrees2: 0,
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
      unknownDword30: 0,
      unknownDword31: 0,
      unknownDword32: 0,
      unknownDword33: 0,
    };
    server.updateWeather2016(client);
  },
  equipment: function (server: ZoneServer2016, client: Client, args: any[]) {
    let effect, model, slot;
    if (!args[1]) {
      server.sendChatText(client, "[ERROR] Missing equipment name !");
      server.sendChatText(
        client,
        "Valid options: hoodie, shirt, pants, helmet, backpack, shoes, armor, gloves"
      );
      return;
    }
    if (!args[2]) {
      server.sendChatText(client, "No effect added.");
      effect = 0;
    } else {
      effect = args[2];
    }
    switch (args[1]) {
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
        model = "SurvivorMale_Back_Backpack_Military_Rasta.adr";
        slot = 10;
        break;
      case "shoes":
        model = "SurvivorMale_Feet_Conveys_Tintable.adr";
        slot = 5;
        break;
      case "armor":
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
        server.sendChatText(
          client,
          "Valid options: hoodie, shirt, pants, helmet, backpack, shoes, armor, gloves, bandana, ghillie"
        );
        return;
    }
    const equipmentSlot = {
      characterData: {
        characterId: client.character.characterId,
      },
      equipmentTexture: {
        index: 1,
        slotId: slot,
        unknownQword1: "0x1",
        textureAlias: "",
        unknownString1: "",
      },
      equipmentModel: {
        modelName: model,
        effectId: Number(effect), // 0 - 16
        slotId: slot,
      },
    };
    server.sendChatText(client, `Setting character equipment slot: ${args[1]}`);
    server.sendData(
      client,
      "Equipment.SetCharacterEquipmentSlot",
      equipmentSlot
    );
  },
  weapon: function (server: ZoneServer2016, client: Client, args: any[]) {
    let effect, model;
    if (!args[1]) {
      server.sendChatText(client, "[ERROR] Missing weapon name !");
      server.sendChatText(
        client,
        "Valid options: ar, ak, m9, 1911, 308, shotgun, torch, empty, brick"
      );
      return;
    }
    if (!args[2]) {
      server.sendChatText(client, "No effect added.");
      effect = 0;
    } else {
      effect = args[2];
    }
    switch (args[1]) {
      case "ar":
        model = "Weapon_M16A4_3P.adr";
        break;
      case "ak":
        model = "Weapon_AK47_3P.adr";
        break;
      case "m9":
        model = "Weapons_M9Auto_3P.adr";
        break;
      case "1911":
        model = "Weapon_Pistol_45Auto_3P.adr";
        break;
      case "308":
        model = "Weapon_M24_3P.adr";
        break;
      case "shotgun":
        model = "Weapons_PumpShotgun01_3P.adr";
        break;
      case "torch":
        model = "Weapon_Torch.adr";
        break;
      case "empty":
        model = "Weapon_Empty.adr";
        break;
      case "brick":
        model = "Weapons_RedBrick01.adr";
        break;
      default:
        server.sendChatText(
          client,
          "Valid options: ar, ak, m9, 1911, 308, shotgun, torch, empty, brick"
        );
        return;
    }
    const equipmentSlot = {
      characterData: {
        characterId: client.character.characterId,
      },
      equipmentTexture: {
        index: 1,
        slotId: 7,
        unknownQword1: "0x1",
        textureAlias: "",
        unknownString1: "",
      },
      equipmentModel: {
        modelName: model,
        effectId: Number(effect), // 0 - 16
        slotId: 7,
      },
    };
    server.sendChatText(client, `Setting weapon: ${args[1]}`);
    server.sendData(
      client,
      "Equipment.SetCharacterEquipmentSlot",
      equipmentSlot
    );
  },
  placement: function (server: ZoneServer2016, client: Client, args: any[]) {
    const modelChoosen = args[1];
    if (!modelChoosen) {
      server.sendChatText(client, "[ERROR] Usage /hax placement {modelId}");
      return;
    }
    server.sendData(client, "Construction.PlacementResponse", {
      model: modelChoosen,
    });
  },
  spectate: function (server: ZoneServer2016, client: Client, args: any[]) {
    const characterId = server.generateGuid();
    const vehicleData = {
      npcData: {
        guid: server.generateGuid(),
        transientId: server.getTransientId(client, characterId),
        characterId: characterId,
        modelId: 9371,
        scale: [1, 1, 1, 1],
        position: [
          client.character.state.position[0],
          client.character.state.position[1],
          client.character.state.position[2],
          client.character.state.position[3],
        ],
        rotation: client.character.state.lookAt,
        vehicleId: 1337,
        attachedObject: {},
        color: {},
      },
      positionUpdate: server.createPositionUpdate(
        new Float32Array([0, 0, 0, 0]),
        [0, 0, 0, 0]
      ),
    };
    server._vehicles[characterId] = vehicleData;
    server.worldRoutine2016();
    server.sendData(client, "Mount.MountResponse", {
      characterId: client.character.characterId,
      vehicleGuid: characterId,
      identity: {},
    });
    client.vehicle.mountedVehicle = characterId;
    client.vehicle.mountedVehicleType = "spectate";
  },
};

export default hax;
