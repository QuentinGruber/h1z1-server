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

import fs from "fs";
import { ZoneClient2016 as Client } from "../classes/zoneclient";
import { Vehicle2016 as Vehicle, Vehicle2016 } from "../classes/vehicle";
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
      return `ZombieFemale_Head_0${Math.floor(Math.random() * 3) + 1}.adr`;
    case 9634:
      return `ZombieMale_Head_0${Math.floor(Math.random() * 4) + 1}.adr`;
    default:
      return "";
  }
}

function getDriveModel(model: string) {
  switch (model) {
    case "offroader":
      return 7225;
    case "pickup":
      return 9258;
    case "policecar":
      return 9301;
    case "atv":
      return 9588;
    default:
      // offroader default
      return 7225;
  }
}

const hax: any = {
  list: function (server: ZoneServer2016, client: Client, args: any[]) {
    server.sendChatText(
      client,
      `/hax commands list: \n/hax ${Object.keys(this).join("\n/hax ")}`
    );
  },
  parachute: function (server: ZoneServer2016, client: Client, args: any[]) {
    const characterId = server.generateGuid();
    const vehicle = new Vehicle(
      server._worldId,
      characterId,
      999999,
      9374,
      new Float32Array([
        client.character.state.position[0],
        client.character.state.position[1] + 700,
        client.character.state.position[2],
        client.character.state.position[3],
      ]),
      client.character.state.lookAt,
      server.getGameTime()
    );
    server._vehicles[characterId] = vehicle;
    server.worldRoutine();
    server.sendData(client, "Mount.MountResponse", {
      characterId: client.character.characterId,
      vehicleGuid: characterId,
      identity: {},
    });
    client.vehicle.mountedVehicle = characterId;
    client.vehicle.mountedVehicleType = "parachute";
  },
  drive: function (server: ZoneServer2016, client: Client, args: any[]) {
    if (!args[1]) {
      server.sendChatText(
        client,
        "[ERROR] Usage /hax drive offroader/pickup/policecar/atv"
      );
      return;
    }
    let wasAlreadyGod = client.character.godMode;
    client.character.godMode = true;
    const characterId = server.generateGuid();
    const vehicleData = new Vehicle2016(
      server._worldId,
      characterId,
      server.getTransientId(characterId),
      getDriveModel(args[1]),
      client.character.state.position,
      client.character.state.lookAt,
      server.getServerTime()
    );
    vehicleData.isManaged = true;
    server._vehicles[characterId] = vehicleData; // save vehicle
    //@ts-ignore
    (vehicleData.onReadyCallback = () => {
      // doing anything with vehicle before client gets fullvehicle packet breaks it
      server.mountVehicle(client, characterId);
      // todo: when vehicle takeover function works, delete assignManagedObject call
      server.assignManagedObject(client, vehicleData);
      client.vehicle.mountedVehicle = characterId;
      setTimeout(() => {
        client.character.godMode = wasAlreadyGod;
      }, 1000);
    })
  },
  titan: function (server: ZoneServer2016, client: Client, args: any[]) {
    server.sendDataToAll("Character.UpdateScale", {
      characterId: client.character.characterId,
      scale: [20, 20, 20, 1],
    });
    server.sendChatText(client, "TITAN size");
  },
  poutine: function (server: ZoneServer2016, client: Client, args: any[]) {
    server.sendDataToAll("Character.UpdateScale", {
      characterId: client.character.characterId,
      scale: [20, 5, 20, 1],
    });
    server.sendChatText(client, "The meme become a reality.....");
  },
  rat: function (server: ZoneServer2016, client: Client, args: any[]) {
    server.sendDataToAll("Character.UpdateScale", {
      characterId: client.character.characterId,
      scale: [0.2, 0.2, 0.2, 1],
    });
    server.sendChatText(client, "Rat size");
  },
  normalsize: function (server: ZoneServer2016, client: Client, args: any[]) {
    server.sendDataToAll("Character.UpdateScale", {
      characterId: client.character.characterId,
      scale: [1, 1, 1, 1],
    });
    server.sendChatText(client, "Back to normal size");
  },
  spamoffroader: function (
    server: ZoneServer2016,
    client: Client,
    args: any[]
  ) {
    for (let index = 0; index < 50; index++) {
      const guid = server.generateGuid();
      const transientId = server.getTransientId(guid);
      const characterId = server.generateGuid();
      const vehicle = new Vehicle(
        server._worldId,
        characterId,
        transientId,
        7225,
        client.character.state.position,
        client.character.state.lookAt,
        server.getGameTime()
      );
      server._vehicles[characterId] = vehicle; // save vehicle
    }
  },
  spampolicecar: function (
    server: ZoneServer2016,
    client: Client,
    args: any[]
  ) {
    for (let index = 0; index < 50; index++) {
      const guid = server.generateGuid();
      const transientId = server.getTransientId(guid);
      const characterId = server.generateGuid();
      const vehicle = new Vehicle(
        server._worldId,
        characterId,
        transientId,
        9301,
        client.character.state.position,
        client.character.state.lookAt,
        server.getGameTime()
      );
      server._vehicles[characterId] = vehicle; // save vehicle
    }
  },
  despawnobjects: function (
    server: ZoneServer2016,
    client: Client,
    args: any[]
  ) {
    client.spawnedEntities.forEach((object) => {
      server.despawnEntity(
        object.characterId ? object.characterId : object.npcData.characterId
      );
    });
    client.spawnedEntities = [];
    server._props = {};
    server._npcs = {};
    server._objects = {};
    server._vehicles = {};
    server._doors = {};
    server.sendChatText(client, "Objects removed from the game.", true);
  },
  tp: function (server: ZoneServer2016, client: Client, args: any[]) {
    client.isLoading = true;
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
    server.sendWeatherUpdatePacket(client, server._weather2016);
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
  realtime: function (server: ZoneServer2016, client: Client, args: any[]) {
    server.removeForcedTime();
    server.sendChatText(client, "Game time is now based on real time", true);
  },
  spamatv: function (server: ZoneServer2016, client: Client, args: any[]) {
    for (let index = 0; index < 50; index++) {
      const guid = server.generateGuid();
      const transientId = server.getTransientId(guid);
      const characterId = server.generateGuid();
      const vehicle = new Vehicle(
        server._worldId,
        characterId,
        transientId,
        9588,
        client.character.state.position,
        client.character.state.lookAt,
        server.getGameTime()
      );
      server._vehicles[characterId] = vehicle; // save vehicle
    }
  },
  spawnnpc: function (
    server: ZoneServer2016,
    client: Client,
    args: any[]
  ) {
    const guid = server.generateGuid();
    const transientId = server.getTransientId(guid);
    if (!args[1]) {
      server.sendChatText(client, "[ERROR] You need to specify a model id !");
      return;
    }
    const choosenModelId = Number(args[1]);
    const characterId = server.generateGuid();
    const headactor = getHeadActor(choosenModelId);
    console.log(headactor);
    const npc = {
      characterId: characterId,
      guid: guid,
      transientId: transientId,
      modelId: choosenModelId,
      position: client.character.state.position,
      rotation: client.character.state.lookAt,
      color: {},
      unknownData1: { unknownData1: {} },
      headActor: headactor,
      attachedObject: {},
      npcRenderDistance: 80,
    };
    server._npcs[characterId] = npc; // save npc
  },
  spawnvehicle: function (server: ZoneServer2016, client: Client, args: any[]) {
    if (!args[1]) {
      server.sendChatText(
        client,
        "[ERROR] Usage /hax spawnVehicle offroader/pickup/policecar/atv"
      );
      return;
    }
    const characterId = server.generateGuid();
    const vehicle = new Vehicle(
      server._worldId,
      characterId,
      server.getTransientId(characterId),
      getDriveModel(args[1]),
      client.character.state.position,
      client.character.state.lookAt,
      server.getGameTime()
    );
    server._vehicles[characterId] = vehicle; // save vehicle
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
        "Please define a weather template to use (data/2016/dataSources/weather.json)"
      );
    } else if (weatherTemplate) {
      server._weather2016 = weatherTemplate;
      server.sendWeatherUpdatePacket(client, server._weather2016, true);
      server.sendChatText(client, `Applied weather template: "${args[1]}"`);
    } else {
      if (args[1] === "list") {
        server.sendChatText(client, `Weather templates :`);
        _.forEach(
          server._weatherTemplates,
          function (element: { templateName: any }) {
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
  savecurrentweather: async function (
    server: ZoneServer2016,
    client: Client,
    args: any[]
  ) {
    if (!args[1]) {
      server.sendChatText(
        client,
        "Please define a name for your weather template '/hax saveCurrentWeather {name}'"
      );
    } else if (server._weatherTemplates[args[1]]) {
      server.sendChatText(client, `"${args[1]}" already exists !`);
    } else {
      const currentWeather = server._weather2016;
      if (currentWeather) {
        currentWeather.templateName = args[1];
        if (server._soloMode) {
          server._weatherTemplates[currentWeather.templateName as string] =
            currentWeather;
          fs.writeFileSync(
            `${__dirname}/../../../../data/2016/dataSources/weather.json`,
            JSON.stringify(server._weatherTemplates, null, "\t")
          );
          delete require.cache[
            require.resolve("../../../../data/2016/dataSources/weather.json")
          ];
          server._weatherTemplates = require("../../../../data/2016/dataSources/weather.json");
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
    server.sendData(client, "Command.RunSpeed", {
      runSpeed: Number(args[1]),
    });
  },
  randomweather: function (
    server: ZoneServer2016,
    client: Client,
    args: any[]
  ) {
    server.sendChatText(client, `Randomized weather`);

    function rnd_number(max: any, fixed: Boolean = false) {
      const num = Math.random() * max;
      return Number(fixed ? num.toFixed(0) : num);
    }

    server._weather2016 = {
      ...server._weather2016,
      //name: "sky_dome_600.dds", todo: use random template from a list
      /*
            unknownDword1: 0,
            unknownDword2: 0,
            skyBrightness1: 1,
            skyBrightness2: 1,
            */
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
    server.sendWeatherUpdatePacket(client, server._weather2016, true);
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
    const vehicle = new Vehicle(
      server._worldId,
      characterId,
      server.getTransientId(characterId),
      9371,
      client.character.state.position,
      client.character.state.lookAt,
      server.getGameTime()
    );
    vehicle.isManaged = true;
    server._vehicles[characterId] = vehicle;
    //@ts-ignore
    (vehicle.onReadyCallback = () => {
      // doing anything with vehicle before client gets fullvehicle packet breaks it
      server.mountVehicle(client, characterId);
      // todo: when vehicle takeover function works, delete assignManagedObject call
      server.assignManagedObject(client, vehicle);
    })
  },
  additem: function (server: ZoneServer2016, client: Client, args: any[]) {
    const itemDefId = Number(args[1]),
      count = Number(args[2]) || 1;
    if (!args[1]) {
      server.sendChatText(
        client,
        "[ERROR] Usage /hax additem {itemDefinitionId} {count}"
      );
      return;
    }
    server.sendChatText(
      client,
      `Adding ${count}x item${count == 1 ? "" : "s"} with id ${itemDefId}.`
    );
    server.lootItem(client, server.generateItem(itemDefId), count);
  },
  hood: function (server: ZoneServer2016, client: Client) {
    const equipment = client.character._equipment[3] || {},
      equipmentModel = equipment.modelName || "";

    if (
      !client.character._equipment[3] ||
      !client.character._equipment[3].modelName.includes("Hoodie")
    ) {
      server.sendChatText(client, "[ERROR] You aren't wearing a hoodie.");
    } else {
      equipmentModel.includes("Up")
        ? (client.character._equipment[3].modelName = equipmentModel.replace(
            "Up",
            "Down"
          ))
        : (client.character._equipment[3].modelName = equipmentModel.replace(
            "Down",
            "Up"
          ));
      server.updateEquipmentSlot(client, 3);
    }
  },
  addallitems: function (server: ZoneServer2016, client: Client, args: any[]) {
    server.sendChatText(client, "Adding 1x of all items to inventory.");
    for(const id in server._itemDefinitionIds) {
      server.lootItem(client, server.generateItem(id), 1);
    }
  },
};

export default hax;
