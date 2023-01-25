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

/* eslint-disable @typescript-eslint/no-unused-vars */
import fs from "fs";
import { Ban, DamageInfo } from "types/zoneserver";

import {
  zoneShutdown,
  _,
  getDifference,
  isPosInRadius,
} from "../../../utils/utils";
import { ExplosiveEntity } from "../entities/explosiveentity";
import { Npc } from "../entities/npc";
import { ZoneClient2016 as Client } from "../classes/zoneclient";
import {
  characterBuildKitLoadout,
  characterKitLoadout,
} from "../data/loadouts";
import { EquipSlots, Items } from "../models/enums";
import { ZoneServer2016 } from "../zoneserver";
import { Command, PermissionLevels } from "./types";
import { ConstructionPermissions } from "types/zoneserver";
import { ConstructionParentEntity } from "../entities/constructionparententity";
import { LoadoutItem } from "../classes/loadoutItem";
import { LoadoutContainer } from "../classes/loadoutcontainer";
import { BaseItem } from "../classes/baseItem";
import { DB_COLLECTIONS } from "../../../utils/enums";
const itemDefinitions = require("./../../../../data/2016/dataSources/ServerItemDefinitions.json");

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

export const commands: Array<Command> = [
  //#region DEFAULT PERMISSIONS
  {
    name: "me",
    permissionLevel: PermissionLevels.DEFAULT,
    execute: (server: ZoneServer2016, client: Client, args: Array<string>) => {
      server.sendChatText(client, `ZoneClientId :${client.loginSessionId}`);
    },
  },
  {
    name: "respawn",
    permissionLevel: PermissionLevels.DEFAULT,
    execute: (server: ZoneServer2016, client: Client, args: Array<string>) => {
      server.respawnPlayer(client);
    },
  },
  {
    name: "clientinfo",
    permissionLevel: PermissionLevels.DEFAULT,
    execute: (server: ZoneServer2016, client: Client, args: Array<string>) => {
      server.sendChatText(
        client,
        `Spawned entities count : ${client.spawnedEntities.length}`
      );
    },
  },
  {
    name: "vanish",
    permissionLevel: PermissionLevels.ADMIN,
    execute: (server: ZoneServer2016, client: Client) => {
      client.character.isSpectator = !client.character.isSpectator;
      server.sendAlert(
        client,
        `Set hidden state to ${client.character.isSpectator}`
      );
      if (!client.character.isSpectator) return;
      for (const a in server._clients) {
        const iteratedClient = server._clients[a];
        if (iteratedClient.spawnedEntities.includes(client.character)) {
          server.sendData(iteratedClient, "Character.RemovePlayer", {
            characterId: client.character.characterId,
          });
          iteratedClient.spawnedEntities.splice(
            iteratedClient.spawnedEntities.indexOf(client.character),
            1
          );
        }
      }
      server.sendData(client, "SpectatorBase", {});
    },
  },
  {
    name: "serverinfo",
    permissionLevel: PermissionLevels.DEFAULT,
    execute: (server: ZoneServer2016, client: Client, args: Array<string>) => {
      const commandName = args[0];
      if (commandName === "mem") {
        const used = process.memoryUsage().rss / 1024 / 1024;
        server.sendChatText(
          client,
          `Used memory ${Math.round(used * 100) / 100} MB`
        );
      } else {
        const {
          _clients: clients,
          _characters: characters,
          _npcs: npcs,
          _spawnedItems: objects,
          _vehicles: vehicles,
          _doors: doors,
          _lootableProps: props,
        } = server;
        const serverVersion = require("../../../../package.json").version;
        server.sendChatText(client, `h1z1-server V${serverVersion}`, true);
        server.sendChatText(
          client,
          `clients: ${_.size(clients)} characters : ${_.size(characters)}`
        );
        server.sendChatText(
          client,
          `npcs : ${_.size(npcs)} doors : ${_.size(doors)}`
        );
        server.sendChatText(
          client,
          `objects : ${_.size(objects)} props : ${_.size(
            props
          )} vehicles : ${_.size(vehicles)}`
        );
        const uptimeMin = (Date.now() - server._startTime) / 60000;
        server.sendChatText(
          client,
          `Uptime: ${
            uptimeMin < 60
              ? `${uptimeMin.toFixed()}m`
              : `${(uptimeMin / 60).toFixed()}h `
          }`
        );
      }
    },
  },
  {
    name: "spawninfo",
    permissionLevel: PermissionLevels.DEFAULT,
    execute: (server: ZoneServer2016, client: Client, args: Array<string>) => {
      server.sendChatText(
        client,
        `You spawned at "${client.character.spawnLocation}"`,
        true
      );
    },
  },
  {
    name: "netstats",
    permissionLevel: PermissionLevels.DEFAULT,
    execute: (server: ZoneServer2016, client: Client, args: Array<string>) => {
      const soeClient = server.getSoeClient(client.soeClientId);
      if (soeClient) {
        const stats = soeClient.getNetworkStats();
        for (let index = 0; index < stats.length; index++) {
          const stat = stats[index];
          server.sendChatText(client, stat, index == 0);
        }
      }
    },
  },
  {
    name: "getnetstats",
    permissionLevel: PermissionLevels.ADMIN,
    execute: (server: ZoneServer2016, client: Client, args: Array<string>) => {
      if (!args[0]) {
        server.sendChatText(
          client,
          `[ERROR] Usage: /getnetstats {name / clientId}"`,
          true
        );
        return;
      }
      const targetClient = server.getClientByNameOrLoginSession(
        args[0].toString()
      );
      if (typeof targetClient == "string") {
        server.sendChatText(
          client,
          `Could not find ${args[0].toString()}, did you mean ${targetClient}`
        );
        return;
      }
      if (!targetClient) {
        server.sendChatText(client, "Client not found.");
        return;
      }
      const soeClient = server.getSoeClient(targetClient.soeClientId);
      if (soeClient) {
        const stats = soeClient.getNetworkStats();
        server.sendChatText(
          client,
          `Displaying net statistics of player ${targetClient.character.name}`,
          true
        );
        for (let index = 0; index < stats.length; index++) {
          const stat = stats[index];
          server.sendChatText(client, stat);
        }
      }
    },
  },
  {
    name: "location",
    permissionLevel: PermissionLevels.DEFAULT,
    execute: (server: ZoneServer2016, client: Client, args: Array<string>) => {
      const { position, rotation } = client.character.state;
      server.sendChatText(
        client,
        `position: ${position[0].toFixed(2)},${position[1].toFixed(
          2
        )},${position[2].toFixed(2)}`
      );
      server.sendChatText(
        client,
        `rotation: ${rotation[0].toFixed(2)},${rotation[1].toFixed(
          2
        )},${rotation[2].toFixed(2)}`
      );
    },
  },
  {
    name: "combatlog",
    permissionLevel: PermissionLevels.DEFAULT,
    execute: (server: ZoneServer2016, client: Client, args: Array<string>) => {
      server.combatLog(client);
    },
  },
  {
    name: "hood",
    permissionLevel: PermissionLevels.DEFAULT,
    execute: (server: ZoneServer2016, client: Client, args: Array<string>) => {
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
        client.character.updateEquipmentSlot(server, EquipSlots.CHEST);
      }
    },
  },
  //#endregion

  //#region ADMIN PERMISSIONS
  {
    name: "parachute",
    permissionLevel: PermissionLevels.ADMIN,
    execute: (server: ZoneServer2016, client: Client, args: Array<string>) => {
      server.sendChatText(client, "Disabled for now");
      /*
      const characterId = server.generateGuid(),
      loc = new Float32Array([
        client.character.state.position[0],
        client.character.state.position[1] + 700,
        client.character.state.position[2],
        client.character.state.position[3],
      ]),
      vehicle = new Vehicle(
        characterId,
        999999,
        9374,
        loc,
        client.character.state.lookAt,
        server.getGameTime()
      );
      server.sendData(client, "ClientUpdate.UpdateLocation", {
        position: loc,
        triggerLoadingScreen: true,
      });
      vehicle.onReadyCallback = () => {
        // doing anything with vehicle before client gets fullvehicle packet breaks it
        server.mountVehicle(client, characterId);
        // todo: when vehicle takeover function works, delete assignManagedObject call
        server.assignManagedObject(client, vehicle);
        client.vehicle.mountedVehicle = characterId;
      };
      server.worldObjectManager.createVehicle(server, vehicle);
      */
    },
  },
  /*{
    name: "drive",
    permissionLevel: PermissionLevels.ADMIN,
    execute: (server: ZoneServer2016, client: Client, args: Array<string>) => {
      if (!args[0]) {
        server.sendChatText(
          client,
          "[ERROR] Usage /drive offroader/pickup/policecar/atv"
        );
        return;
      }
      const wasAlreadyGod = client.character.godMode;
      server.setGodMode(client, true);
      const characterId = server.generateGuid();
      const vehicleData = new Vehicle(
        characterId,
        server.getTransientId(characterId),
        getDriveModel(args[0]),
        client.character.state.position,
        client.character.state.lookAt,
        server.getServerTime()
      );
      vehicleData.isManaged = true;
      vehicleData.onReadyCallback = () => {
        // doing anything with vehicle before client gets fullvehicle packet breaks it
        server.mountVehicle(client, characterId);
        // todo: when vehicle takeover function works, delete assignManagedObject call
        server.assignManagedObject(client, vehicleData);
        client.vehicle.mountedVehicle = characterId;
        setTimeout(() => {
          server.setGodMode(client, wasAlreadyGod);
        }, 1000);
      };
      server.worldObjectManager.createVehicle(server, vehicleData);
      client.character.ownedVehicle = vehicleData.characterId;
    },
  },*/
  {
    name: "d",
    permissionLevel: PermissionLevels.ADMIN,
    execute: (server: ZoneServer2016, client: Client, args: Array<string>) => {
      server.sendData(client, "CharacterSelectSessionResponse", {
        status: 1,
        sessionId: client.loginSessionId,
      });
    },
  },
  {
    name: "titan",
    permissionLevel: PermissionLevels.ADMIN,
    execute: (server: ZoneServer2016, client: Client, args: Array<string>) => {
      server.sendDataToAll("Character.UpdateScale", {
        characterId: client.character.characterId,
        scale: [20, 20, 20, 1],
      });
      server.sendChatText(client, "TITAN size");
    },
  },
  {
    name: "poutine",
    permissionLevel: PermissionLevels.ADMIN,
    execute: (server: ZoneServer2016, client: Client, args: Array<string>) => {
      server.sendDataToAll("Character.UpdateScale", {
        characterId: client.character.characterId,
        scale: [20, 5, 20, 1],
      });
      server.sendChatText(client, "The meme become a reality.....");
    },
  },
  {
    name: "rat",
    permissionLevel: PermissionLevels.ADMIN,
    execute: (server: ZoneServer2016, client: Client, args: Array<string>) => {
      server.sendDataToAll("Character.UpdateScale", {
        characterId: client.character.characterId,
        scale: [0.2, 0.2, 0.2, 1],
      });
      server.sendChatText(client, "Rat size");
    },
  },
  {
    name: "normalsize",
    permissionLevel: PermissionLevels.ADMIN,
    execute: (server: ZoneServer2016, client: Client, args: Array<string>) => {
      server.sendDataToAll("Character.UpdateScale", {
        characterId: client.character.characterId,
        scale: [1, 1, 1, 1],
      });
      server.sendChatText(client, "Back to normal size");
    },
  },
  /*{
    name: "spamvehicle",
    permissionLevel: PermissionLevels.ADMIN,
    execute: (server: ZoneServer2016, client: Client, args: Array<string>) => {
      if (!args[0]) {
        server.sendChatText(
          client,
          "[ERROR] Usage /spamvehicle offroader/pickup/policecar/atv"
        );
        return;
      }
      for (let index = 0; index < 50; index++) {
        const guid = server.generateGuid();
        const transientId = server.getTransientId(guid);
        const characterId = server.generateGuid();
        const vehicle = new Vehicle(
          characterId,
          transientId,
          getDriveModel(args[0]),
          client.character.state.position,
          client.character.state.lookAt,
          server.getGameTime()
        );
        server.worldObjectManager.createVehicle(server, vehicle);
      }
    },
  },*/
  {
    name: "despawnobjects",
    permissionLevel: PermissionLevels.ADMIN,
    execute: (server: ZoneServer2016, client: Client, args: Array<string>) => {
      client.spawnedEntities.forEach((object) => {
        server.despawnEntity(object.characterId);
      });
      client.spawnedEntities = [];
      server._lootableProps = {};
      server._npcs = {};
      server._spawnedItems = {};
      server._vehicles = {};
      server._doors = {};
      server.sendChatText(client, "Objects removed from the game.", true);
    },
  },
  {
    name: "tp",
    permissionLevel: PermissionLevels.ADMIN,
    execute: (server: ZoneServer2016, client: Client, args: Array<string>) => {
      let locationPosition;
      switch (args[0]) {
        case "farm":
          locationPosition = new Float32Array([-696.48, 13.86, -1847.15, 1]);
          break;
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
          if (args.length < 3) {
            server.sendChatText(
              client,
              "Unknown set location, need 3 args to tp to exact location: x, y, z",
              false
            );
            server.sendChatText(
              client,
              "Set location list: farm, zimms, pv, br, ranchito, drylake, dam, cranberry, church, desoto, toxic, radiotower, villas, military, hospital",
              false
            );
            return;
          }
          locationPosition = new Float32Array([
            Number(args[0]),
            Number(args[1]),
            Number(args[2]),
            1,
          ]);
          break;
      }

      client.character.state.position = locationPosition;
      client.isLoading = true;
      client.characterReleased = false;
      server.sendData(client, "ClientUpdate.UpdateLocation", {
        position: locationPosition,
        triggerLoadingScreen: true,
      });
      server.sendWeatherUpdatePacket(client, server.weather);
    },
  },
  {
    name: "tphere",
    permissionLevel: PermissionLevels.ADMIN,
    execute: (server: ZoneServer2016, client: Client, args: Array<string>) => {
      if (!args[0]) {
        server.sendChatText(client, `Correct usage: /tphere {name|playerId}`);
        return;
      }
      const targetClient = server.getClientByNameOrLoginSession(
        args[0].toString()
      );
      if (typeof targetClient == "string") {
        server.sendChatText(
          client,
          `Could not find ${args[0].toString()}, did you mean ${targetClient}`
        );
        return;
      }
      if (!targetClient) {
        server.sendChatText(client, "Client not found.");
        return;
      }
      targetClient.character.state.position = client.character.state.position;
      targetClient.isLoading = true;
      targetClient.characterReleased = false;
      server.sendData(targetClient, "ClientUpdate.UpdateLocation", {
        position: client.character.state.position,
        triggerLoadingScreen: true,
      });
      server.sendChatText(
        client,
        `Teleporting ${targetClient.character.name} to your location`
      );
      server.sendWeatherUpdatePacket(client, server.weather);
    },
  },
  {
    name: "tpto",
    permissionLevel: PermissionLevels.ADMIN,
    execute: (server: ZoneServer2016, client: Client, args: Array<string>) => {
      if (!args[0]) {
        server.sendChatText(client, `Correct usage: /tpto {name|playerId}`);
        return;
      }
      const targetClient = server.getClientByNameOrLoginSession(
        args[0].toString()
      );
      if (typeof targetClient == "string") {
        server.sendChatText(
          client,
          `Could not find ${args[0].toString()}, did you mean ${targetClient}`
        );
        return;
      }
      if (!targetClient) {
        server.sendChatText(client, "Client not found.");
        return;
      }
      client.character.state.position = targetClient.character.state.position;
      client.isLoading = true;
      client.characterReleased = false;
      server.sendData(client, "ClientUpdate.UpdateLocation", {
        position: targetClient.character.state.position,
        triggerLoadingScreen: true,
      });
      server.sendChatText(
        client,
        `Teleporting to ${targetClient.character.name}'s location`
      );
      server.sendWeatherUpdatePacket(client, server.weather);
    },
  },
  {
    name: "time",
    permissionLevel: PermissionLevels.ADMIN,
    execute: (server: ZoneServer2016, client: Client, args: Array<string>) => {
      const choosenHour = Number(args[0]);
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
  },
  {
    name: "realtime",
    permissionLevel: PermissionLevels.ADMIN,
    execute: (server: ZoneServer2016, client: Client, args: Array<string>) => {
      server.removeForcedTime();
      server.sendChatText(client, "Game time is now based on real time", true);
    },
  },
  {
    name: "sfog",
    permissionLevel: PermissionLevels.ADMIN,
    execute: (server: ZoneServer2016, client: Client, args: Array<string>) => {
      server.sendChatText(
        client,
        `Fog has been toggled ${
          server.toggleFog() ? "ON" : "OFF"
        } for the server`,
        true
      );
    },
  },
  {
    name: "spamzombies",
    permissionLevel: PermissionLevels.ADMIN,
    execute: (server: ZoneServer2016, client: Client, args: Array<string>) => {
      if (!args[1]) {
        server.sendChatText(
          client,
          "[ERROR] Usage /hax spamzombies [RANGE] [POINTS]"
        );
        return;
      }
      const multiplied = Number(args[0]) * Number(args[1]);
      if (multiplied > 600) {
        server.sendChatText(
          client,
          `[ERROR]Maximum RANGE * POINTS value reached: ("${multiplied}"/600)`
        );
        return;
      }
      const range = Number(args[0]),
        lat = client.character.state.position[0],
        long = client.character.state.position[2];
      const points = [];
      let rangeFixed = range;
      const numberOfPoints = Number(args[1]);
      const degreesPerPoint = 360 / numberOfPoints;
      for (let j = 1; j < range; j++) {
        let currentAngle = 0,
          x2,
          y2;
        rangeFixed += -1;
        for (let i = 0; i < numberOfPoints; i++) {
          x2 = Math.cos(currentAngle) * rangeFixed;
          y2 = Math.sin(currentAngle) * rangeFixed;
          const p = [lat + x2, long + y2];
          points.push(p);
          currentAngle += degreesPerPoint;
        }
      }
      points.forEach((obj: any) => {
        server.worldObjectManager.createZombie(
          server,
          9634,
          new Float32Array([
            obj[0],
            client.character.state.position[1],
            obj[1],
            1,
          ]),
          client.character.state.lookAt
        );
      });
    },
  },
  {
    name: "spamied",
    permissionLevel: PermissionLevels.ADMIN,
    execute: (server: ZoneServer2016, client: Client, args: Array<string>) => {
      if (!args[1]) {
        server.sendChatText(client, "[ERROR] Usage /spamied <RANGE> <POINTS>");
        return;
      }
      const multiplied = Number(args[0]) * Number(args[1]);
      if (multiplied > 600) {
        server.sendChatText(
          client,
          `[ERROR]Maximum RANGE * POINTS value reached: ("${multiplied}"/600)`
        );
        return;
      }
      const range = Number(args[0]),
        lat = client.character.state.position[0],
        long = client.character.state.position[2];
      const points = [];
      let rangeFixed = range;
      const numberOfPoints = Number(args[1]);
      const degreesPerPoint = 360 / numberOfPoints;
      for (let j = 1; j < range; j++) {
        let currentAngle = 0,
          x2,
          y2;
        rangeFixed += -1;
        for (let i = 0; i < numberOfPoints; i++) {
          x2 = Math.cos(currentAngle) * rangeFixed;
          y2 = Math.sin(currentAngle) * rangeFixed;
          const p = [lat + x2, long + y2];
          points.push(p);
          currentAngle += degreesPerPoint;
        }
      }
      points.forEach((obj: any) => {
        const characterId = server.generateGuid();
        server._explosives[characterId] = new ExplosiveEntity(
          characterId,
          server.getTransientId(characterId),
          9176,
          new Float32Array([
            obj[0],
            client.character.state.position[1],
            obj[1],
            1,
          ]),
          client.character.state.lookAt,
          server,
          Items.IED
        ); // save explosive
      });
    },
  },
  {
    name: "spawnnpc",
    permissionLevel: PermissionLevels.ADMIN,
    execute: (server: ZoneServer2016, client: Client, args: Array<string>) => {
      const guid = server.generateGuid();
      const transientId = server.getTransientId(guid);
      if (!args[0]) {
        server.sendChatText(client, "[ERROR] You need to specify a model id !");
        return;
      }
      const characterId = server.generateGuid();
      const npc = new Npc(
        characterId,
        transientId,
        Number(args[0]),
        client.character.state.position,
        client.character.state.lookAt,
        server
      );
      server._npcs[characterId] = npc; // save npc
    },
  },
  {
    name: "dynamicweather",
    permissionLevel: PermissionLevels.ADMIN,
    execute: (server: ZoneServer2016, client: Client, args: Array<string>) => {
      if (!server._dynamicWeatherEnabled) {
        server._dynamicWeatherEnabled = true;
        server.sendChatText(client, "Dynamic weather enabled !");
      } else {
        server.sendChatText(client, "Dynamic weather already enabled !");
      }
    },
  },
  {
    name: "weather",
    permissionLevel: PermissionLevels.ADMIN,
    execute: (server: ZoneServer2016, client: Client, args: Array<string>) => {
      if (server._dynamicWeatherEnabled) {
        server._dynamicWeatherEnabled = false;
        server.sendChatText(client, "Dynamic weather removed !");
      }
      const weatherTemplate = server._soloMode
        ? server._weatherTemplates[args[0]]
        : _.find(
            server._weatherTemplates,
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
        server.weather = weatherTemplate;
        server.sendWeatherUpdatePacket(client, server.weather, true);
        server.sendChatText(client, `Applied weather template: "${args[0]}"`);
      } else {
        if (args[0] === "list") {
          server.sendChatText(client, `Weather templates :`);
          _.forEach(
            server._weatherTemplates,
            (element: { templateName: any }) => {
              server.sendChatText(client, `- ${element.templateName}`);
            }
          );
        } else {
          server.sendChatText(client, `"${args[0]}" isn't a weather template`);
          server.sendChatText(
            client,
            `Use "/hax weather list" to know all available templates`
          );
        }
      }
    },
  },
  {
    name: "savecurrentweather",
    permissionLevel: PermissionLevels.ADMIN,
    execute: async (
      server: ZoneServer2016,
      client: Client,
      args: Array<string>
    ) => {
      if (!args[0]) {
        server.sendChatText(
          client,
          "Please define a name for your weather template '/hax saveCurrentWeather {name}'"
        );
      } else if (server._weatherTemplates[args[0]]) {
        server.sendChatText(client, `"${args[0]}" already exists !`);
      } else {
        const currentWeather = server.weather;
        if (currentWeather) {
          currentWeather.templateName = args[0];
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
          server.sendChatText(client, `template "${args[0]}" saved !`);
        } else {
          server.sendChatText(client, `Saving current weather failed...`);
          server.sendChatText(client, `plz report this`);
        }
      }
    },
  },
  {
    name: "randomweather",
    permissionLevel: PermissionLevels.ADMIN,
    execute: (server: ZoneServer2016, client: Client, args: Array<string>) => {
      if (server._dynamicWeatherEnabled) {
        server._dynamicWeatherEnabled = false;
        server.sendChatText(client, "Dynamic weather removed !");
      }
      server.sendChatText(client, `Randomized weather`);

      function rnd_number(max: any, fixed: boolean = false) {
        const num = Math.random() * max;
        return Number(fixed ? num.toFixed(0) : num);
      }

      server.weather = {
        ...server.weather,
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
      server.sendWeatherUpdatePacket(client, server.weather, true);
    },
  },
  {
    name: "additem",
    permissionLevel: PermissionLevels.ADMIN,
    execute: (server: ZoneServer2016, client: Client, args: Array<string>) => {
      if (!args[0]) {
        server.sendChatText(
          client,
          "[ERROR] Usage /additem {itemDefinitionId/item name} optional: {count} {playerName|playerId}"
        );
        return;
      }
      const count = Number(args[1]) || 1;
      let itemDefId;
      let similar;

      for (const a in itemDefinitions) {
        const name = itemDefinitions[a].NAME;
        const argsName = args[0].toString().toUpperCase().replaceAll("_", " ");
        if (!name) continue;
        if (itemDefinitions[a].CODE_FACTORY_NAME == "AccountRecipe") continue;
        if (itemDefinitions[a].CODE_FACTORY_NAME == "EquippableContainer") {
          if (itemDefinitions[a].BULK == 0) continue; // skip account recipes and world containers
        }
        if (name.toUpperCase() == argsName) {
          itemDefId = itemDefinitions[a].ID;
          break;
        } else if (
          getDifference(name.toUpperCase(), argsName) <= 3 &&
          getDifference(name.toUpperCase(), argsName) != 0
        )
          similar = itemDefinitions[a].NAME.toUpperCase().replaceAll(" ", "_");
      }
      if (!itemDefId) itemDefId = Number(args[0]);
      const item = server.generateItem(itemDefId, count);
      if (!item) {
        server.sendChatText(
          client,
          similar
            ? `[ERROR] Cannot find item "${args[0].toUpperCase()}", did you mean "${similar}"`
            : `[ERROR] Cannot find item "${args[0]}"`
        );
        return;
      }
      if (args[2]) {
        const targetClient = server.getClientByNameOrLoginSession(
          args[2].toString()
        );
        if (typeof targetClient == "string") {
          server.sendChatText(
            client,
            `Could not find player ${args[2]
              .toString()
              .toUpperCase()}, did you mean ${targetClient.toUpperCase()}`
          );
          return;
        }
        if (args[2] && !targetClient) {
          server.sendChatText(client, "Client not found.");
          return;
        }
        server.sendChatText(
          client,
          `Adding ${count}x item${
            count == 1 ? "" : "s"
          } with id ${itemDefId} to player ${
            targetClient ? targetClient.character.name : client.character.name
          }`
        );
        (targetClient ? targetClient.character : client.character).lootItem(
          server,
          item
        );
      } else {
        server.sendChatText(
          client,
          `Adding ${count}x item${
            count == 1 ? "" : "s"
          } with id ${itemDefId} to player ${client.character.name}`
        );
        client.character.lootItem(server, item);
      }
    },
  },
  {
    name: "lighting",
    permissionLevel: PermissionLevels.ADMIN,
    execute: (server: ZoneServer2016, client: Client, args: Array<string>) => {
      if (!args[0]) {
        server.sendChatText(client, "[ERROR] Missing lighting file.");
        return;
      }

      server.sendData(client, "SendZoneDetails", {
        zoneName: "Z1",
        zoneType: 4,
        unknownBoolean1: false,
        skyData: server.weather,
        zoneId1: 5,
        zoneId2: 5,
        nameId: 7699,
        unknownBoolean2: true,
        lighting: args[0],
        unknownBoolean3: false,
      });
    },
  },
  {
    name: "kit",
    permissionLevel: PermissionLevels.ADMIN,
    execute: (server: ZoneServer2016, client: Client, args: Array<string>) => {
      client.character.equipLoadout(server, characterKitLoadout);
    },
  },
  {
    name: "addallitems",
    permissionLevel: PermissionLevels.ADMIN,
    execute: (server: ZoneServer2016, client: Client, args: Array<string>) => {
      server.sendChatText(client, "Disabled for now.");
      /*
      server.sendChatText(client, "Adding 1x of all items to inventory.");
      for (const itemDef of Object.values(server._itemDefinitions)) {
        server.lootItem(client, server.generateItem(itemDef.ID));
      }
      */
    },
  },
  {
    name: "shutdown",
    permissionLevel: PermissionLevels.ADMIN,
    execute: async (
      server: ZoneServer2016,
      client: Client,
      args: Array<string>
    ) => {
      const timeLeft = args[0] ? args[0] : 0;
      const message = args[1] ? args[1] : " ";
      const startedTime = Date.now();
      await zoneShutdown(server, startedTime, Number(timeLeft), message);
    },
  },
  {
    name: "spawnloot",
    permissionLevel: PermissionLevels.ADMIN,
    execute: (server: ZoneServer2016, client: Client, args: Array<string>) => {
      server.worldObjectManager.createLoot(server);
      server.sendChatText(client, `Respawned loot`);
    },
  },
  {
    name: "respawnnpcs",
    permissionLevel: PermissionLevels.ADMIN,
    execute: (server: ZoneServer2016, client: Client, args: Array<string>) => {
      server.worldObjectManager.createNpcs(server);
      server.sendChatText(client, `Respawned npcs`);
    },
  },
  {
    name: "respawnvehicles",
    permissionLevel: PermissionLevels.ADMIN,
    execute: (server: ZoneServer2016, client: Client, args: Array<string>) => {
      server.worldObjectManager.createVehicles(server);
      server.sendChatText(client, `Respawned vehicles`);
    },
  },
  {
    name: "lootrespawntimer",
    permissionLevel: PermissionLevels.ADMIN,
    execute: (server: ZoneServer2016, client: Client, args: Array<string>) => {
      if (!args[0]) {
        server.sendChatText(client, `Correct usage: /lootrespawntimer <time>`);
        return;
      }
      server.worldObjectManager.lootRespawnTimer = Number(args[0]);
      server.sendChatText(
        client,
        `Loot respawn timer set to ${Number(args[0])}`
      );
    },
  },
  {
    name: "npcrespawntimer",
    permissionLevel: PermissionLevels.ADMIN,
    execute: (server: ZoneServer2016, client: Client, args: Array<string>) => {
      if (!args[0]) {
        server.sendChatText(client, `Correct usage: /npcrespawntimer <time>`);
        return;
      }
      server.worldObjectManager.npcRespawnTimer = Number(args[0]);
      server.sendChatText(
        client,
        `Npc respawn timer set to ${Number(args[0])}`
      );
    },
  },
  {
    name: "vehiclerespawntimer",
    permissionLevel: PermissionLevels.ADMIN,
    execute: (server: ZoneServer2016, client: Client, args: Array<string>) => {
      if (!args[0]) {
        server.sendChatText(
          client,
          `Correct usage: /admin vehiclerespawntimer <time>`
        );
        return;
      }
      server.worldObjectManager.vehicleRespawnTimer = Number(args[0]);
      server.sendChatText(
        client,
        `Vehicle respawn timer set to ${Number(args[0])}`
      );
    },
  },
  {
    name: "gm", // "god" also works
    permissionLevel: PermissionLevels.ADMIN,
    execute: (server: ZoneServer2016, client: Client, args: Array<string>) => {
      server.setGodMode(client, !client.character.godMode);
      server.sendAlert(client, `Set godmode to ${client.character.godMode}`);
    },
  },
  {
    name: "alert",
    permissionLevel: PermissionLevels.ADMIN,
    execute: (server: ZoneServer2016, client: Client, args: Array<string>) => {
      server.sendAlertToAll(args.join(" "));
    },
  },
  {
    name: "remover",
    permissionLevel: PermissionLevels.ADMIN,
    execute: (server: ZoneServer2016, client: Client, args: Array<string>) => {
      const wep = server.generateItem(Items.WEAPON_REMOVER);
      if (wep && wep.weapon) wep.weapon.ammoCount = 1000;
      client.character.lootItem(server, wep);
    },
  },
  {
    name: "players",
    permissionLevel: PermissionLevels.ADMIN,
    execute: (server: ZoneServer2016, client: Client, args: Array<string>) => {
      server.sendChatText(
        client,
        `Players: ${Object.values(server._clients)
          .map((c) => {
            return `${c.character.name}: ${c.loginSessionId}`;
          })
          .join(", ")}`
      );
    },
  },
  {
    name: "slay",
    permissionLevel: PermissionLevels.ADMIN,
    execute: async (
      server: ZoneServer2016,
      client: Client,
      args: Array<string>
    ) => {
      if (!args[0]) {
        server.sendChatText(client, `Correct usage: /slay {name|playerId}`);
        return;
      }
      const targetClient = server.getClientByNameOrLoginSession(
        args[0].toString()
      );
      if (typeof targetClient == "string") {
        server.sendChatText(
          client,
          `Could not find ${args[0].toString()}, did you mean ${targetClient}`
        );
        return;
      }
      if (!targetClient) {
        server.sendChatText(client, "Client not found.");
        return;
      }
      server.sendGlobalChatText(
        `${targetClient.character.name} has been slain`
      );
      const damageInfo: DamageInfo = {
        entity: client.character.characterId,
        damage: 999999999,
      };
      server.killCharacter(targetClient, damageInfo);
    },
  },
  {
    name: "savecharacters",
    permissionLevel: PermissionLevels.ADMIN,
    execute: async (
      server: ZoneServer2016,
      client: Client,
      args: Array<string>
    ) => {
      if (!server.enableWorldSaves) {
        server.sendChatText(client, "Server saving is disabled.");
        return;
      }
      server.sendChatText(client, "CharacterData save started.");
      await server.worldDataManager.saveCharacters(server);
      server.sendChatText(client, "Character data has been saved!");
    },
  },
  {
    name: "savevehicles",
    permissionLevel: PermissionLevels.ADMIN,
    execute: async (
      server: ZoneServer2016,
      client: Client,
      args: Array<string>
    ) => {
      if (!server.enableWorldSaves) {
        server.sendChatText(client, "Server saving is disabled.");
        return;
      }
      server.sendChatText(client, "VehicleData save started.");
      await server.worldDataManager.saveVehicles(server);
      server.sendChatText(client, "Vehicles have been saved!");
    },
  },
  {
    name: "save",
    permissionLevel: PermissionLevels.ADMIN,
    execute: async (
      server: ZoneServer2016,
      client: Client,
      args: Array<string>
    ) => {
      if (!server.enableWorldSaves) {
        server.sendChatText(client, "Server saving is disabled.");
        return;
      }
      server.sendChatText(client, "World save started.");
      await server.worldDataManager.saveWorld(server);
      server.sendChatText(client, "World saved!");
    },
  },
  {
    name: "silentban",
    permissionLevel: PermissionLevels.ADMIN,
    execute: async (
      server: ZoneServer2016,
      client: Client,
      args: Array<string>
    ) => {
      if (!args[0] || !args[1]) {
        server.sendChatText(
          client,
          `Correct usage: /silentban {name|playerId} {type}  optional: {time} {reason}`
        );
        return;
      }
      const banTypes = ["nodamage", "hiddenplayers", "rick"];
      const banType = args[1].toString().toLowerCase();
      if (!banTypes.includes(banType)) {
        server.sendChatText(client, `valid ban types: ${banTypes.join(", ")}`);
        return;
      }
      const targetClient = server.getClientByNameOrLoginSession(
        args[0].toString()
      );
      if (typeof targetClient == "string") {
        server.sendChatText(
          client,
          `Could not find ${args[0].toString()}, did you mean ${targetClient}`
        );
        return;
      }
      if (!targetClient) {
        server.sendChatText(client, "Client not found.");
        return;
      }
      let time = Number(args[2]) ? Number(args[2]) * 60000 : 0;
      if (time > 0) {
        time += Date.now();
        server.sendChatText(
          client,
          `You have silently banned ${
            targetClient.character.name
          } until ${server.getDateString(time)}`
        );
      } else {
        server.sendChatText(
          client,
          `You have silently banned ${targetClient.character.name} permemently, banType: ${banType}`
        );
      }
      const reason = args.slice(3).join(" ");
      server.banClient(
        targetClient,
        reason,
        banType,
        client.character.name ? client.character.name : "",
        time
      );
    },
  },
  {
    name: "ban",
    permissionLevel: PermissionLevels.ADMIN,
    execute: async (
      server: ZoneServer2016,
      client: Client,
      args: Array<string>
    ) => {
      if (!args[0]) {
        server.sendChatText(
          client,
          `Correct usage: /ban {name|playerId} optional: {time} {reason}`
        );
        return;
      }
      const targetClient = server.getClientByNameOrLoginSession(
        args[0].toString()
      );
      if (typeof targetClient == "string") {
        server.sendChatText(
          client,
          `Could not find ${args[0].toString()}, did you mean ${targetClient}`
        );
        return;
      }
      if (!targetClient) {
        server.sendChatText(client, "Client not found.");
        return;
      }
      let time = Number(args[1]) ? Number(args[1]) * 60000 : 0;
      if (time > 0) {
        time += Date.now();
        server.sendChatText(
          client,
          `You have banned ${
            targetClient.character.name
          } until ${server.getDateString(time)}`
        );
      } else {
        server.sendChatText(
          client,
          `You have banned ${targetClient.character.name} permemently`
        );
      }
      const reason = args.slice(2).join(" ");
      server.banClient(
        targetClient,
        reason,
        "normal",
        client.character.name ? client.character.name : "",
        time
      );
    },
  },
  {
    name: "kick",
    permissionLevel: PermissionLevels.ADMIN,
    execute: (server: ZoneServer2016, client: Client, args: Array<string>) => {
      if (!args[0]) {
        server.sendChatText(
          client,
          `Correct usage: /kick {name|playerId} optional: {reason}`
        );
        return;
      }
      const targetClient = server.getClientByNameOrLoginSession(
        args[0].toString()
      );
      if (typeof targetClient == "string") {
        server.sendChatText(
          client,
          `Could not find ${args[0].toString()}, did you mean ${targetClient}`
        );
        return;
      }
      if (!targetClient) {
        server.sendChatText(client, "Client not found.");
        return;
      }
      const reason = args[1] ? args.slice(1).join(" ") : "Undefined";
      for (let i = 0; i < 5; i++) {
        server.sendAlert(
          targetClient,
          `You are being kicked from the server. Reason: ${reason}`
        );
      }

      setTimeout(() => {
        if (!targetClient) {
          return;
        }
        server.sendGlobalChatText(
          `${targetClient.character.name} has been kicked from the server!`
        );
        server.kickPlayer(targetClient);
      }, 2000);
    },
  },
  {
    name: "unban",
    permissionLevel: PermissionLevels.ADMIN,
    execute: async (
      server: ZoneServer2016,
      client: Client,
      args: Array<string>
    ) => {
      if (!args[0]) {
        server.sendChatText(
          client,
          `Correct usage: /admin unban {name|playerId}`
        );
        return;
      }
      const name = args[0].toString().toLowerCase();
      const bannedClient = (
        await server._db
          ?.collection(DB_COLLECTIONS.BANNED)
          .findOneAndUpdate(
            { name, active: true },
            { $set: { active: false, unBanAdminName: client.character.name } }
          )
      )?.value as unknown as Ban;
      if (bannedClient) {
        server.sendChatText(client, `Removed ban on user ${bannedClient.name}`);
      } else {
        server.sendChatText(
          client,
          `Cannot find any banned user with name ${args[0]}`
        );
      }
    },
  },
  {
    name: "listprocesses",
    permissionLevel: PermissionLevels.ADMIN,
    execute: async (
      server: ZoneServer2016,
      client: Client,
      args: Array<string>
    ) => {
      if (!args[0]) {
        server.sendChatText(
          client,
          `Correct usage: /admin listProcesses {name | ZoneClientId}`
        );
        return;
      }
      const targetClient = server.getClientByNameOrLoginSession(
        args[0].toString()
      );
      if (typeof targetClient == "string") {
        server.sendChatText(
          client,
          `Could not find ${args[0].toString()}, did you mean ${targetClient}`
        );
        return;
      }
      if (!targetClient) {
        server.sendChatText(client, "Client not found.");
        return;
      }
      server.sendChatText(
        client,
        `Showing process list of user: ${targetClient.character.name}`
      );
      for (let index = 0; index < targetClient.clientLogs.length; index++) {
        const element = targetClient.clientLogs[index];
        server.sendChatText(client, `${element.log}`);
      }
    },
  },
  {
    name: "deletebase",
    permissionLevel: PermissionLevels.ADMIN,
    execute: async (
      server: ZoneServer2016,
      client: Client,
      args: Array<string>
    ) => {
      if (!args[0]) {
        server.sendChatText(
          client,
          `Correct usage: /deleteBase {range(max 100)} `
        );
        return;
      }
      if (Number(args[0]) > 100) {
        server.sendChatText(client, `Maximum range is 100`);
        return;
      }
      const entitiesToDelete: { characterId: string; dictionary: any }[] = [];
      for (const a in server._constructionSimple) {
        const construction = server._constructionSimple[a];
        if (
          isPosInRadius(
            Number(args[0]),
            client.character.state.position,
            construction.state.position
          )
        ) {
          construction.destroy(server);
        }
      }
      for (const a in server._constructionDoors) {
        const construction = server._constructionDoors[a];
        if (
          isPosInRadius(
            Number(args[0]),
            client.character.state.position,
            construction.state.position
          )
        ) {
          construction.destroy(server);
        }
      }
      for (const a in server._constructionFoundations) {
        const construction = server._constructionFoundations[a];
        if (
          isPosInRadius(
            Number(args[0]),
            client.character.state.position,
            construction.state.position
          )
        ) {
          construction.destroy(server);
        }
      }
      for (const a in server._lootableConstruction) {
        const construction = server._lootableConstruction[a];
        if (
          isPosInRadius(
            Number(args[0]),
            client.character.state.position,
            construction.state.position
          )
        ) {
          construction.destroy(server);
        }
      }

      for (const a in server._worldLootableConstruction) {
        const construction = server._worldLootableConstruction[a];
        if (
          isPosInRadius(
            Number(args[0]),
            client.character.state.position,
            construction.state.position
          )
        ) {
          construction.destroy(server);
        }
      }

      for (const a in server._temporaryObjects) {
        const construction = server._temporaryObjects[a];
        if (
          isPosInRadius(
            Number(args[0]),
            client.character.state.position,
            construction.state.position
          )
        ) {
          entitiesToDelete.push({
            characterId: construction.characterId,
            dictionary: server._temporaryObjects,
          });
        }
      }

      for (const a in server._plants) {
        const construction = server._plants[a];
        if (
          isPosInRadius(
            Number(args[0]),
            client.character.state.position,
            construction.state.position
          )
        ) {
          entitiesToDelete.push({
            characterId: construction.characterId,
            dictionary: server._plants,
          });
        }
      }

      entitiesToDelete.forEach(
        (entity: { characterId: string; dictionary: any }) => {
          server.deleteEntity(entity.characterId, entity.dictionary, 1875, 500);
        }
      );
      server.sendChatText(
        client,
        `Removed all constructions in range of ${Number(args[0])}`
      );
    },
  },
  {
    name: "build",
    permissionLevel: PermissionLevels.ADMIN,
    execute: async (
      server: ZoneServer2016,
      client: Client,
      args: Array<string>
    ) => {
      client.character.equipItem(
        server,
        server.generateItem(Items.FANNY_PACK_DEV)
      );
      client.character.equipLoadout(server, characterBuildKitLoadout);
      server.sendChatText(client, `Build kit given`);
    },
  },
  {
    name: "debug",
    permissionLevel: PermissionLevels.ADMIN,
    execute: async (server: ZoneServer2016, client: Client) => {
      client.isDebugMode = !client.isDebugMode;
      server.sendAlert(client, `Set debug mode to ${client.isDebugMode}`);
    },
  },
  {
    name: "listbases",
    permissionLevel: PermissionLevels.ADMIN,
    execute: async (
      server: ZoneServer2016,
      client: Client,
      args: Array<string>
    ) => {
      if (!args[0]) {
        server.sendChatText(
          client,
          `"[ERROR] Usage /findbases {name / clientId}"`
        );
        return;
      }
      const targetClient = server.getClientByNameOrLoginSession(
        args[0].toString()
      );
      if (typeof targetClient == "string") {
        server.sendChatText(
          client,
          `Could not find ${args[0].toString()}, did you mean ${targetClient}`
        );
        return;
      }
      if (!targetClient) {
        server.sendChatText(client, "Client not found.");
        return;
      }
      server.sendChatText(
        client,
        `Listing all bases of ${targetClient.character.name}:`
      );
      let counter = 1;
      for (const a in server._constructionFoundations) {
        const foundation = server._constructionFoundations[a];
        const name = server.getItemDefinition(foundation.itemDefinitionId).NAME;
        if (
          foundation.ownerCharacterId === targetClient.character.characterId
        ) {
          const pos = `[${foundation.state.position[0]} ${foundation.state.position[1]} ${foundation.state.position[2]}]`;
          server.sendChatText(
            client,
            `${counter}. ${name}: position ${pos}, permissions: Owner`
          );
          counter++;
          continue;
        }
        Object.values(foundation.permissions).forEach(
          (permission: ConstructionPermissions) => {
            if (permission.characterId === targetClient.character.characterId) {
              const pos = `[${foundation.state.position[0]} ${foundation.state.position[1]} ${foundation.state.position[2]}]`;
              server.sendChatText(
                client,
                `${counter}. ${name}: position ${pos}, permissions: build: ${permission.build}, demolish: ${permission.demolish}, containers: ${permission.useContainers}, visitor: ${permission.visit}`
              );
              counter++;
            }
          }
        );
      }
    },
  },
  {
    name: "getinventory",
    permissionLevel: PermissionLevels.ADMIN,
    execute: async (
      server: ZoneServer2016,
      client: Client,
      args: Array<string>
    ) => {
      if (!args[0]) {
        server.sendChatText(
          client,
          `"[ERROR] Usage /getinventory {name / clientId}"`
        );
        return;
      }
      const targetClient = server.getClientByNameOrLoginSession(
        args[0].toString()
      );
      if (typeof targetClient == "string") {
        server.sendChatText(
          client,
          `Could not find ${args[0].toString()}, did you mean ${targetClient}`
        );
        return;
      }
      if (!targetClient) {
        server.sendChatText(client, "Client not found.");
        return;
      }
      server.sendChatText(
        client,
        `Listing all items of ${targetClient.character.name}:`
      );
      let counter = 0;
      server.sendChatText(client, `LOADOUT:`);
      Object.values(targetClient.character._loadout).forEach(
        (item: LoadoutItem) => {
          const name = server.getItemDefinition(item.itemDefinitionId).NAME;
          counter++;
          server.sendChatText(
            client,
            `${counter}. ${name ? name : item.itemDefinitionId}, count: ${
              item.stackCount
            }`
          );
        }
      );
      counter = 0;
      server.sendChatText(client, " ");
      server.sendChatText(client, `CONTAINERS:`);
      Object.values(targetClient.character._containers).forEach(
        (container: LoadoutContainer) => {
          server.sendChatText(client, " ");
          const containerName = server.getItemDefinition(
            container.itemDefinitionId
          ).NAME;
          server.sendChatText(
            client,
            `${
              containerName ? containerName : container.itemDefinitionId
            } [${container.getUsedBulk(server)}/${container.getMaxBulk(
              server
            )}]:`
          );
          Object.values(container.items).forEach((item: BaseItem) => {
            counter++;
            const itemName = server.getItemDefinition(
              item.itemDefinitionId
            ).NAME;
            server.sendChatText(
              client,
              `${counter}. ${
                itemName ? itemName : item.itemDefinitionId
              }, count: ${item.stackCount}`
            );
          });
        }
      );
    },
  },
  {
    name: "listpermissions",
    permissionLevel: PermissionLevels.ADMIN,
    execute: async (server: ZoneServer2016, client: Client) => {
      if (!client.character.currentInteractionGuid) {
        server.sendChatText(client, `[ERROR] No interaction target`);
        return;
      }
      const foundation = server._constructionFoundations[
        client.character.currentInteractionGuid
      ] as ConstructionParentEntity;
      if (!foundation) {
        server.sendChatText(client, `[ERROR] Target is not a foundation`);
        return;
      }
      server.sendChatText(
        client,
        `Displaying list of permissions for foundation: ${foundation.characterId}, owner: ${foundation.ownerCharacterId}`
      );
      Object.values(foundation.permissions).forEach((permission: any) => {
        server.sendChatText(client, JSON.stringify(permission));
      });
    },
  },
  {
    name: "respawnloot",
    permissionLevel: PermissionLevels.ADMIN,
    execute: async (
      server: ZoneServer2016,
      client: Client,
      args: Array<string>
    ) => {
      for (const characterId in server._spawnedItems) {
        const item = server._spawnedItems[characterId];
        if (item.spawnerId > 0) {
          if (
            item.item.itemDefinitionId === Items.FUEL_BIOFUEL ||
            item.item.itemDefinitionId === Items.FUEL_ETHANOL
          ) {
            server.deleteEntity(characterId, server._explosives);
          }
          server.deleteEntity(characterId, server._spawnedItems);
          delete server.worldObjectManager._spawnedLootObjects[item.spawnerId];
        }
      }

      delete require.cache[require.resolve("../data/lootspawns")];
      const loottables = require("../data/lootspawns").lootTables;
      console.log(loottables);
      server.worldObjectManager.createLoot(server, loottables);
      server.sendChatText(client, `Respawned loot`);
    },
  },
  //#endregion

  // depreciation messages
  {
    name: "hax",
    permissionLevel: PermissionLevels.DEV,
    execute: (server: ZoneServer2016, client: Client, args: Array<string>) => {
      server.sendChatText(
        client,
        "/hax and /admin are no longer used. Do /help for a list of commands."
      );
    },
  },
  {
    name: "admin",
    permissionLevel: PermissionLevels.DEV,
    execute: (server: ZoneServer2016, client: Client, args: Array<string>) => {
      server.sendChatText(
        client,
        "/hax and /admin are no longer used. Do /help for a list of commands."
      );
    },
  },

  //#region DEV PERMISSIONS
  {
    name: "dev",
    permissionLevel: PermissionLevels.DEV,
    execute: (server: ZoneServer2016, client: Client, args: Array<string>) => {
      const commandName = args[0];
      delete require.cache[require.resolve("./dev")];
      const dev = require("./dev").default;
      if (!!dev[commandName]) {
        if (
          client.isAdmin ||
          commandName === "list" ||
          server._allowedCommands.length === 0 ||
          server._allowedCommands.includes(commandName)
        ) {
          dev[commandName](server, client, args);
        } else {
          server.sendChatText(client, "You don't have access to that.");
        }
      } else {
        server.sendChatText(
          client,
          `Unknown command: "/dev ${commandName}", display dev all commands by using "/dev list"`
        );
      }
    },
  },
  //#endregion
];
