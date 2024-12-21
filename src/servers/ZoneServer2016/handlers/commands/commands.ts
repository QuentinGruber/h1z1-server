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

/* eslint-disable @typescript-eslint/no-unused-vars */
import {
  ClientBan,
  ClientMute,
  DamageInfo,
  EntityDictionary
} from "types/zoneserver";

import {
  zoneShutdown,
  _,
  getDifference,
  isPosInRadius,
  toHex,
  randomIntFromInterval,
  getCurrentServerTimeWrapper,
  getDateString
} from "../../../../utils/utils";
import { ExplosiveEntity } from "../../entities/explosiveentity";
import { Npc } from "../../entities/npc";
import { ZoneClient2016 as Client } from "../../classes/zoneclient";
import {
  characterBuildKitLoadout,
  characterTestKitLoadout,
  characterSkinsLoadout,
  characterKitLoadout,
  characterVehicleKit
} from "../../data/loadouts";
import {
  Effects,
  EquipSlots,
  Items,
  ResourceIds,
  ResourceTypes,
  VehicleIds
} from "../../models/enums";
import { ZoneServer2016 } from "../../zoneserver";
import { Command, PermissionLevels } from "./types";
import { ConstructionPermissions } from "types/zoneserver";
import { ConstructionParentEntity } from "../../entities/constructionparententity";
import { LoadoutItem } from "../../classes/loadoutItem";
import { LoadoutContainer } from "../../classes/loadoutcontainer";
import { BaseItem } from "../../classes/baseItem";
import { DB_COLLECTIONS } from "../../../../utils/enums";
import { WorldDataManager } from "../../managers/worlddatamanager";
import { BaseEntity } from "../../entities/baseentity";
import { MAX_UINT32 } from "../../../../utils/constants";
import { WithId } from "mongodb";
import { FullCharacterSaveData } from "types/savedata";
import { scheduler } from "node:timers/promises";
import { Vehicle2016 } from "../../entities/vehicle";
import { AddSimpleNpc } from "types/zone2016packets";
import { writeFileSync } from "node:fs";
const itemDefinitions = require("./../../../../../data/2016/dataSources/ServerItemDefinitions.json");

export const commands: Array<Command> = [
  //#region DEFAULT PERMISSIONS
  {
    name: "console",
    permissionLevel: PermissionLevels.DEFAULT,
    execute: async (
      server: ZoneServer2016,
      client: Client,
      args: Array<string>
    ) => {
      /* handled clientside */
    }
  },
  {
    name: "group",
    permissionLevel: PermissionLevels.DEFAULT,
    execute: async (
      server: ZoneServer2016,
      client: Client,
      args: Array<string>
    ) => {
      server.groupManager.handleGroupCommand(server, client, args);
    }
  },
  {
    name: "me",
    permissionLevel: PermissionLevels.DEFAULT,
    execute: (server: ZoneServer2016, client: Client, args: Array<string>) => {
      server.sendChatText(client, `ZoneClientId :${client.loginSessionId}`);
    }
  },
  {
    name: "respawn",
    permissionLevel: PermissionLevels.DEFAULT,
    execute: (server: ZoneServer2016, client: Client, args: Array<string>) => {
      server.respawnPlayer(
        client,
        server._spawnGrid[randomIntFromInterval(0, 99)]
      );
    }
  },
  {
    name: "clientinfo",
    permissionLevel: PermissionLevels.DEFAULT,
    execute: (server: ZoneServer2016, client: Client, args: Array<string>) => {
      server.sendChatText(
        client,
        `Spawned entities count : ${client.spawnedEntities.size}`
      );
    }
  },
  {
    name: "serverinfo",
    permissionLevel: PermissionLevels.DEFAULT,
    execute: (server: ZoneServer2016, client: Client, args: Array<string>) => {
      if (args[0] === "mem") {
        const used = process.memoryUsage().rss / 1024 / 1024;
        server.sendChatText(
          client,
          `Used memory ${Math.round(used * 100) / 100} MB`
        );
      } else {
        const {
          _clients: clients,
          _npcs: npcs,
          _spawnedItems: objects,
          _vehicles: vehicles,
          _destroyables: dto
        } = server;
        const serverVersion = require("../../../../../package.json").version;
        server.sendChatText(client, `h1z1-server V${serverVersion}`, true);
        const uptimeMin = process.uptime() / 60;

        server.sendChatText(
          client,
          `Uptime: ${
            uptimeMin < 60
              ? `${uptimeMin.toFixed()}m`
              : `${(uptimeMin / 60).toFixed()}h `
          }`
        );
        if (client.isAdmin) {
          server.sendChatText(
            client,
            `clients : ${_.size(clients)} | npcs : ${_.size(npcs)}`
          );
        }
        server.sendChatText(
          client,
          `items : ${_.size(objects)} | vehicles : ${_.size(vehicles)}`
        );
        server.sendChatText(client, `dto: ${_.size(dto)}`);
      }
    }
  },
  {
    name: "pop",
    permissionLevel: PermissionLevels.ADMIN,
    execute: (server: ZoneServer2016, client: Client, args: Array<string>) => {
      const pop = _.size(server._clients);
      server.sendChatText(
        client,
        `There ${pop > 1 ? "are" : "is"} ${pop} player${
          pop > 1 ? "s" : ""
        } online.`
      );
    }
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
    }
  },
  {
    name: "findlog",
    permissionLevel: PermissionLevels.MODERATOR,
    execute: (server: ZoneServer2016, client: Client, args: Array<string>) => {
      if (!args[0]) {
        server.sendChatText(client, "[] No argument provided", true);
        return;
      }
      const listNames: string[] = [];
      for (const a in server._clients) {
        const c = server._clients[a];
        c.clientLogs.forEach((log: { log: string; isSuspicious: boolean }) => {
          if (
            log.log.toLowerCase().includes(args[0].toString().toLowerCase())
          ) {
            listNames.push(`${c.character.name}: ${log.log}`);
          }
        });
      }
      server.sendChatText(
        client,
        `Displaying list of players and logs matching criteria: ${listNames.join(
          ",\n"
        )}`,
        true
      );
    }
  },
  {
    name: "netstats",
    permissionLevel: PermissionLevels.DEFAULT,
    execute: async (
      server: ZoneServer2016,
      client: Client,
      args: Array<string>
    ) => {
      const stats = server._gatewayServer.getSoeClientNetworkStats(
        client.soeClientId
      );
      if (stats) {
        const serverStats = server._gatewayServer.getServerNetworkStats();
        stats.push(serverStats[0]);
        for (let index = 0; index < stats.length; index++) {
          const stat = stats[index];
          server.sendChatText(client, stat, index == 0);
        }
      }
    }
  },
  {
    name: "ping",
    permissionLevel: PermissionLevels.DEFAULT,
    execute: async (
      server: ZoneServer2016,
      client: Client,
      args: Array<string>
    ) => {
      const stats = server._gatewayServer.getSoeClientNetworkStats(
        client.soeClientId
      );
      const serverStats = server._gatewayServer.getServerNetworkStats();
      if (stats) {
        server.sendChatText(client, stats[2], true);
        server.sendChatText(client, serverStats[0], false);
      }
    }
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
        )},${position[2].toFixed(2)}`,
        true
      );
      server.sendChatText(
        client,
        `rotation: ${rotation[0].toFixed(2)},${rotation[1].toFixed(
          2
        )},${rotation[2].toFixed(2)}`
      );
    }
  },
  {
    name: "combatlog",
    permissionLevel: PermissionLevels.DEFAULT,
    execute: (server: ZoneServer2016, client: Client, args: Array<string>) => {
      server.combatLog(client);
    }
  },
  {
    name: "emote",
    permissionLevel: PermissionLevels.DEFAULT,
    execute: (server: ZoneServer2016, client: Client, args: Array<string>) => {
      server.sendChatText(
        client,
        "[ERROR] This emote has been disabled due to abuse."
      );
      return;
      const animationId = Number(args[0]);
      if (!animationId || animationId > MAX_UINT32) {
        server.sendChatText(client, "Usage /emote <id>");
        return;
      }

      // may need to disable more
      switch (animationId) {
        case 35:
        case 97:
          server.sendChatText(
            client,
            "[ERROR] This emote has been disabled due to abuse."
          );
          return;
      }

      server.sendDataToAllWithSpawnedEntity(
        server._characters,
        client.character.characterId,
        "AnimationBase",
        {
          characterId: client.character.characterId,
          animationId: animationId
        }
      );
    }
  },
  {
    name: "hood",
    permissionLevel: PermissionLevels.DEFAULT,
    execute: (server: ZoneServer2016, client: Client, args: Array<string>) => {
      const equipment = client.character._equipment[3];
      if (!equipment || !equipment.modelName.includes("Hoodie")) {
        server.sendChatText(client, "[ERROR] You aren't wearing a hoodie.");
        return;
      }
      client.character.hoodState =
        client.character.hoodState == "Up" ? "Down" : "Up";
      client.character.updateEquipmentSlot(server, EquipSlots.CHEST);
    }
  },
  {
    name: "whisper",
    permissionLevel: PermissionLevels.DEFAULT,
    keepCase: true,
    execute: async (
      server: ZoneServer2016,
      client: Client,
      args: Array<string>
    ) => {
      if (!args[0]) {
        server.sendChatText(
          client,
          "[Whisper] You must specify a player name and message!"
        );
        return;
      }
      if (!args[1]) {
        server.sendChatText(client, "[Whisper] The message may not be blank!");
        return;
      }

      let targetClient = server.getClientByNameOrLoginSession(args[0]);

      if (!targetClient) {
        targetClient = await server.getOfflineClientByName(args[0]);
      }

      if (server.playerNotFound(client, args[0].toString(), targetClient)) {
        return;
      }
      if (!targetClient || !(targetClient instanceof Client)) {
        server.sendChatText(client, "Player not found.");
        return;
      }
      if (
        targetClient?.character?.characterId == client.character.characterId
      ) {
        server.sendChatText(client, "Don't be ridiculous.");
        return;
      }

      if (await server.chatManager.checkMute(server, client)) {
        server.sendChatText(
          client,
          "[Whisper] Message blocked, you are globally muted!"
        );
        return;
      }
      if (
        targetClient?.character?.mutedCharacters?.includes(
          client.character.characterId
        )
      ) {
        server.sendChatText(
          client,
          `[Whisper] Message blocked, target player has you muted!`
        );
        return;
      }
      client.character.lastWhisperedPlayer = targetClient.character.name;
      targetClient.character.lastWhisperedPlayer = client.character.name;

      args.splice(0, 1);
      const message = args.join(" ");

      server.sendChatText(
        client,
        `[Whisper to ${targetClient.character.name}]: ${message}`
      );
      server.sendChatText(
        targetClient,
        `[Whisper from ${client.character.name}]: ${message}`
      );
    }
  },
  {
    name: "r",
    permissionLevel: PermissionLevels.DEFAULT,
    keepCase: true,
    execute: async (
      server: ZoneServer2016,
      client: Client,
      args: Array<string>
    ) => {
      if (!args[0]) {
        server.sendChatText(client, "[Reply] The message may not be blank!");
        return;
      }
      if (!client.character.lastWhisperedPlayer) {
        server.sendChatText(client, "[Reply] No one has whispered you yet.");
        return;
      }

      let targetClient = server.getClientByNameOrLoginSession(
        client.character.lastWhisperedPlayer
      );

      if (!targetClient) {
        targetClient = await server.getOfflineClientByName(
          client.character.lastWhisperedPlayer
        );
      }

      if (
        server.playerNotFound(
          client,
          client.character.lastWhisperedPlayer.toString(),
          targetClient
        )
      ) {
        return;
      }
      if (!targetClient || !(targetClient instanceof Client)) {
        server.sendChatText(client, "Player not found.");
        return;
      }
      if (
        targetClient?.character?.characterId == client.character.characterId
      ) {
        server.sendChatText(client, "Don't be ridiculous.");
        return;
      }

      if (await server.chatManager.checkMute(server, client)) {
        server.sendChatText(
          client,
          "[Reply] Message blocked, you are globally muted!"
        );
        return;
      }
      if (
        targetClient?.character?.mutedCharacters?.includes(
          client.character.characterId
        )
      ) {
        server.sendChatText(
          client,
          `[Reply] Message blocked, target player has you muted!`
        );
        return;
      }
      client.character.lastWhisperedPlayer = targetClient.character.name;
      targetClient.character.lastWhisperedPlayer = client.character.name;

      const message = args.join(" ");

      server.sendChatText(
        client,
        `[Reply to ${targetClient.character.name}]: ${message}`
      );
      server.sendChatText(
        targetClient,
        `[Reply from ${client.character.name}]: ${message}`
      );
    }
  },
  {
    name: "mute",
    permissionLevel: PermissionLevels.DEFAULT,
    execute: async (
      server: ZoneServer2016,
      client: Client,
      args: Array<string>
    ) => {
      if (!args[0]) {
        server.sendChatText(client, "You must specify a player name to mute!");
        return;
      }

      let targetClient = server.getClientByName(args[0]);

      if (!targetClient) {
        targetClient = await server.getOfflineClientByName(args[0]);
      }

      if (server.playerNotFound(client, args[0].toString(), targetClient)) {
        return;
      }
      if (!targetClient || !(targetClient instanceof Client)) {
        server.sendChatText(client, "Player not found.");
        return;
      }
      if (
        targetClient?.character?.characterId == client.character.characterId
      ) {
        server.sendChatText(client, "Don't be ridiculous.");
        return;
      }

      if (
        client?.character?.mutedCharacters?.includes(
          targetClient.character.characterId
        )
      ) {
        server.sendChatText(
          client,
          `${targetClient.character.name} is already muted.`
        );
        return;
      }

      client.character.mutedCharacters.push(targetClient.character.characterId);
      server.sendChatText(
        client,
        `You have muted ${targetClient.character.name}.`
      );
    }
  },
  {
    name: "unmute",
    permissionLevel: PermissionLevels.DEFAULT,
    execute: async (
      server: ZoneServer2016,
      client: Client,
      args: Array<string>
    ) => {
      if (!args[0]) {
        server.sendChatText(
          client,
          "You must specify a player name to unmute!"
        );
        return;
      }

      let targetClient = server.getClientByName(args[0]);

      if (!targetClient) {
        targetClient = await server.getOfflineClientByName(args[0]);
      }

      if (server.playerNotFound(client, args[0].toString(), targetClient)) {
        return;
      }
      if (!targetClient || !(targetClient instanceof Client)) {
        server.sendChatText(client, "Player not found.");
        return;
      }
      if (targetClient.character.characterId == client.character.characterId) {
        server.sendChatText(client, "Don't be ridiculous.");
        return;
      }

      if (
        !client?.character?.mutedCharacters?.includes(
          targetClient.character.characterId
        )
      ) {
        server.sendChatText(
          client,
          `${targetClient.character.name} is not muted.`
        );
        return;
      }

      client.character.mutedCharacters.splice(
        client.character.mutedCharacters.indexOf(
          targetClient.character.characterId
        ),
        1
      );
      server.sendChatText(
        client,
        `You have unmuted ${targetClient.character.name}.`
      );
    }
  },
  //#endregion

  //#region MODERATOR PERMISSIONS
  {
    name: "players",
    permissionLevel: PermissionLevels.MODERATOR,
    execute: async (
      server: ZoneServer2016,
      client: Client,
      args: Array<string>
    ) => {
      let msg: string = "Players:\n";
      for (const a in server._clients) {
        const c = server._clients[a];
        const clientStats =
          (await server._gatewayServer.getSoeClientNetworkStats(
            c.soeClientId
          )) ?? [];
        msg += `${c.character.name}: ${c.loginSessionId} | ${clientStats[2]} | ${clientStats[0]} | ${clientStats[1]}\n`;
      }
      server.sendChatText(client, msg);
    }
  },
  {
    name: "vanish",
    permissionLevel: PermissionLevels.MODERATOR,
    execute: (server: ZoneServer2016, client: Client) => {
      // Set the client's isVanished state
      client.character.isVanished = !client.character.isVanished;
      server.sendAlert(
        client,
        `Set vanish state to ${client.character.isVanished}`
      );
      if (!client.character.isVanished) {
        for (const a in server._decoys) {
          const decoy = server._decoys[a];
          if (decoy.transientId == client.character.transientId) {
            server.sendDataToAll("Character.RemovePlayer", {
              characterId: decoy.characterId
            });
            server.sendChatText(client, `Decoy removed`, false);
            client.isDecoy = false;
          }
        }
        return;
      }
      for (const a in server._clients) {
        const iteratedClient = server._clients[a];
        if (iteratedClient.spawnedEntities.has(client.character)) {
          server.sendData(iteratedClient, "Character.RemovePlayer", {
            characterId: client.character.characterId
          });
          iteratedClient.spawnedEntities.delete(client.character);
        }
      }
      server.sendData(client, "Spectator.Enable", {});
    }
  },
  {
    name: "getnetstats",
    permissionLevel: PermissionLevels.MODERATOR,
    execute: async (
      server: ZoneServer2016,
      client: Client,
      args: Array<string>
    ) => {
      if (!args[0]) {
        server.sendChatText(
          client,
          `[ERROR] Usage: /getnetstats {name || clientId}"`,
          true
        );
        return;
      }
      const targetClient = server.getClientByNameOrLoginSession(
        args[0].toString()
      );
      if (server.playerNotFound(client, args[0].toString(), targetClient)) {
        return;
      }
      if (!targetClient || !(targetClient instanceof Client)) {
        server.sendChatText(client, "Client not found.");
        return;
      }
      const stats = await server._gatewayServer.getSoeClientNetworkStats(
        targetClient.soeClientId
      );
      if (stats) {
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
    }
  },
  {
    name: "d",
    permissionLevel: PermissionLevels.MODERATOR,
    execute: (server: ZoneServer2016, client: Client, args: Array<string>) => {
      // Clear spectator on logout to prevent the client from crashing on the next login - Jason
      if (client.character.isSpectator) {
        server.commandHandler.executeInternalCommand(
          server,
          client,
          "spectate",
          []
        );
      }
      client.properlyLogout = true;
      server.sendData(client, "CharacterSelectSessionResponse", {
        status: 1,
        sessionId: client.loginSessionId
      });
    }
  },
  {
    name: "nv",
    permissionLevel: PermissionLevels.DEFAULT,
    execute: (server: ZoneServer2016, client: Client, args: Array<string>) => {
      const index = client.character.screenEffects.indexOf("NIGHTVISION");
      if (index <= -1) {
        if (
          client.character._loadout[29] &&
          client.character._loadout[29].itemDefinitionId == Items.NV_GOGGLES
        ) {
          client.character.screenEffects.push("NIGHTVISION");
          server.addScreenEffect(client, server._screenEffects["NIGHTVISION"]);
        } else {
          server.sendChatText(client, `You dont have a NV Goggles equipped!`);
        }
      } else {
        client.character.screenEffects.splice(index, 1);
        server.removeScreenEffect(client, server._screenEffects["NIGHTVISION"]);
      }
    }
  },
  {
    name: "tp",
    permissionLevel: PermissionLevels.MODERATOR,
    execute: (server: ZoneServer2016, client: Client, args: Array<string>) => {
      let position;
      switch (args[0]) {
        case "farm":
          position = new Float32Array([-696.48, 13.86, -1847.15, 1]);
          break;
        case "zimms":
          position = new Float32Array([2209.17, 47.42, -1011.48, 1]);
          break;
        case "pv":
          position = new Float32Array([-125.55, 23.41, -1131.71, 1]);
          break;
        case "br":
          position = new Float32Array([3824.41, 168.19, -4000.0, 1]);
          break;
        case "ranchito":
          position = new Float32Array([2185.32, 42.36, 2130.49, 1]);
          break;
        case "drylake":
          position = new Float32Array([479.46, 109.7, 2902.51, 1]);
          break;
        case "dam":
          position = new Float32Array([-685, 69.96, 1185.49, 1]);
          break;
        case "cranberry":
          position = new Float32Array([-1368.37, 71.29, 1837.61, 1]);
          break;
        case "church":
          position = new Float32Array([-1928.68, 62.77, 2880.1, 1]);
          break;
        case "desoto":
          position = new Float32Array([-2793.22, 140.77, 1035.8, 1]);
          break;
        case "toxic":
          position = new Float32Array([-3064.68, 42.98, -2160.06, 1]);
          break;
        case "radiotower":
          position = new Float32Array([-1499.21, 353.98, -840.52, 1]);
          break;
        case "villas":
          position = new Float32Array([489.02, 102, 2942.65, 1]);
          break;
        case "military":
          position = new Float32Array([696.53, 48.08, -2470.62, 1]);
          break;
        case "hospital":
          position = new Float32Array([1895.4, 93.69, -2914.39, 1]);
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

          const pos = client.character.state.position,
            x =
              args[0] == "~"
                ? pos[0]
                : Object.is(NaN, Number(args[0]))
                  ? pos[0]
                  : Number(args[0]),
            y =
              args[1] == "~"
                ? pos[1]
                : Object.is(NaN, Number(args[1]))
                  ? pos[1]
                  : Number(args[1]),
            z =
              args[2] == "~"
                ? pos[2]
                : Object.is(NaN, Number(args[2]))
                  ? pos[2]
                  : Number(args[2]);
          position = new Float32Array([x, y, z, 1]);
          break;
      }

      const triggerLoadingScreen = !isPosInRadius(
        250,
        client.character.state.position,
        position
      );
      client.character.state.position = position;
      client.managedObjects?.forEach((characterId) => {
        server.dropVehicleManager(client, characterId);
      });
      client.isLoading = true;
      client.characterReleased = false;
      client.character.lastLoginDate = toHex(Date.now());
      server.dropAllManagedObjects(client);
      server.sendData(client, "ClientUpdate.UpdateLocation", {
        position,
        triggerLoadingScreen
      });
    }
  },
  {
    name: "tphere",
    permissionLevel: PermissionLevels.MODERATOR,
    execute: (server: ZoneServer2016, client: Client, args: Array<string>) => {
      if (!args[0]) {
        server.sendChatText(client, `Correct usage: /tphere {name|playerId}`);
        return;
      }
      const targetClient = server.getClientByNameOrLoginSession(
        args[0].toString()
      );
      if (server.playerNotFound(client, args[0].toString(), targetClient)) {
        return;
      }
      if (!targetClient || !(targetClient instanceof Client)) {
        server.sendChatText(client, "Client not found.");
        return;
      }
      targetClient.character.state.position = client.character.state.position;
      targetClient.managedObjects?.forEach((characterId) => {
        server.dropVehicleManager(client, characterId);
      });
      targetClient.isLoading = true;
      targetClient.characterReleased = false;
      targetClient.character.lastLoginDate = toHex(Date.now());
      server.dropAllManagedObjects(targetClient);
      const triggerLoadingScreen = !isPosInRadius(
        250,
        client.character.state.position,
        targetClient.character.state.position
      );
      server.sendData(targetClient, "ClientUpdate.UpdateLocation", {
        position: client.character.state.position,
        triggerLoadingScreen
      });
      server.sendChatText(
        client,
        `Teleporting ${targetClient.character.name} to your location`
      );
    }
  },
  {
    name: "tpto",
    permissionLevel: PermissionLevels.MODERATOR,
    execute: (server: ZoneServer2016, client: Client, args: Array<string>) => {
      if (!args[0]) {
        server.sendChatText(client, `Correct usage: /tpto {name|playerId}`);
        return;
      }
      const targetClient = server.getClientByNameOrLoginSession(
        args[0].toString()
      );
      if (server.playerNotFound(client, args[0].toString(), targetClient)) {
        return;
      }
      if (!targetClient || !(targetClient instanceof Client)) {
        server.sendChatText(client, "Client not found.");
        return;
      }
      client.character.state.position = targetClient.character.state.position;
      client.managedObjects?.forEach((characterId) => {
        server.dropVehicleManager(client, characterId);
      });
      client.isLoading = true;
      client.characterReleased = false;
      client.character.lastLoginDate = toHex(Date.now());
      server.dropAllManagedObjects(client);
      const triggerLoadingScreen = !isPosInRadius(
        250,
        client.character.state.position,
        targetClient.character.state.position
      );
      server.sendData(client, "ClientUpdate.UpdateLocation", {
        position: targetClient.character.state.position,
        triggerLoadingScreen
      });
      server.sendChatText(
        client,
        `Teleporting to ${targetClient.character.name}'s location`
      );
    }
  },
  {
    name: "ban",
    permissionLevel: PermissionLevels.MODERATOR,
    keepCase: true,
    execute: async (
      server: ZoneServer2016,
      client: Client,
      args: Array<string>
    ) => {
      if (!args[0]) {
        server.sendChatText(
          client,
          `Correct usage: /ban {name} optional: {time (minutes)} {reason} {--silent}`
        );
        return;
      }

      // prevent banning yourself

      if (args[0] == client.character.name) {
        server.sendChatText(client, "You can't ban yourself!");
        return;
      }

      // check if client is already banned

      const bannedClient = (await server._db
        ?.collection(DB_COLLECTIONS.BANNED)
        .findOne({ name: args[0], active: true })) as
        | WithId<ClientBan>
        | undefined;

      if (bannedClient) {
        server.sendChatText(
          client,
          `${args[0]} (${bannedClient.loginSessionId}) is already banned!`
        );
        return;
      }

      const isSilent = args.includes("--silent");

      // check offline characters first for an exact match

      const collection = server._db.collection(DB_COLLECTIONS.CHARACTERS),
        character = (await collection.findOne({
          characterName: args[0],
          serverId: server._worldId,
          status: 1
        })) as WithId<FullCharacterSaveData> | undefined;

      let ownerId = character?.ownerId,
        characterName = character?.characterName;

      if (!character) {
        const banClient = server.getClientByName(args[0]);
        if (server.playerNotFound(client, args[0].toString(), banClient)) {
          return;
        }
        if (!banClient || !(banClient instanceof Client)) {
          server.sendChatText(
            client,
            `Character with name ${args[0]} not found!`
          );
          return;
        }
        ownerId = banClient.loginSessionId;
        characterName = banClient.character.name;
      }

      let time = Number(args[1]) ? Number(args[1]) * 60000 : 0;
      if (!isNaN(time) && time > 0) {
        time += Date.now();
        server.sendChatText(
          client,
          `You have ${
            isSilent ? "silently " : ""
          }banned ${character?.characterName} until ${getDateString(time)}`
        );
      } else {
        server.sendChatText(
          client,
          `You have ${
            isSilent ? "silently " : ""
          }banned ${character?.characterName} permanently`
        );
      }

      const reason = args.slice(2).join(" ");
      server.banClient(
        ownerId ?? "",
        characterName ?? "",
        reason,
        client.loginSessionId,
        time,
        isSilent
      );
    }
  },
  {
    name: "banid",
    permissionLevel: PermissionLevels.MODERATOR,
    execute: async (
      server: ZoneServer2016,
      client: Client,
      args: Array<string>
    ) => {
      if (!args[0]) {
        server.sendChatText(
          client,
          `Correct usage: /banid {loginSessionId} optional: {time (minutes)} {reason} {--silent}`
        );
        return;
      }

      // prevent banning yourself

      if (args[0] == client.loginSessionId) {
        server.sendChatText(client, "You can't ban yourself!");
        return;
      }

      // check if client is already banned

      const bannedClient = (await server._db
        ?.collection(DB_COLLECTIONS.BANNED)
        .findOne({ loginSessionId: args[0], active: true })) as
        | WithId<ClientBan>
        | undefined;

      if (bannedClient) {
        server.sendChatText(
          client,
          `${bannedClient.name} (${args[0]}) is already banned!`
        );
        return;
      }

      const isSilent = args.includes("--silent");

      const ownerId = args[0];

      const collection = server._db.collection(DB_COLLECTIONS.CHARACTERS),
        character = (await collection.findOne({
          ownerId,
          serverId: server._worldId,
          status: 1
        })) as WithId<FullCharacterSaveData> | undefined;

      const characterName = character?.characterName ?? "unknownCharacterName";

      let time = Number(args[1]) ? Number(args[1]) * 60000 : 0;
      if (!isNaN(time) && time > 0) {
        time += Date.now();
        server.sendChatText(
          client,
          `You have ${
            isSilent ? "silently " : ""
          }banned ${character?.characterName} until ${getDateString(time)}`
        );
      } else {
        server.sendChatText(
          client,
          `You have ${
            isSilent ? "silently " : ""
          }banned ${character?.characterName} permanently`
        );
      }

      const reason = args.slice(2).join(" ");
      server.banClient(
        ownerId ?? "",
        characterName ?? "",
        reason,
        client.loginSessionId,
        time,
        isSilent
      );
    }
  },
  {
    name: "unban",
    permissionLevel: PermissionLevels.MODERATOR,
    keepCase: true,
    execute: async (
      server: ZoneServer2016,
      client: Client,
      args: Array<string>
    ) => {
      if (!args[0]) {
        server.sendChatText(client, `Correct usage: /unban {name}`);
        return;
      }
      const name = args.join(" ").toString();
      const unBannedClient = await server.unbanClient(client, name);
      if (unBannedClient) {
        server.sendChatText(
          client,
          `Removed ban on user ${unBannedClient.name}`
        );
      } else {
        server.sendChatText(
          client,
          `Cannot find any banned user with name ${name}`
        );
      }
    }
  },
  {
    name: "unbanid",
    permissionLevel: PermissionLevels.MODERATOR,
    keepCase: true,
    execute: async (
      server: ZoneServer2016,
      client: Client,
      args: Array<string>
    ) => {
      if (!args[0]) {
        server.sendChatText(client, `Correct usage: /unbanid {loginSessionId}`);
        return;
      }
      const unBannedClient = await server.unbanClientId(client, args[0]);
      if (unBannedClient) {
        server.sendChatText(
          client,
          `Removed ban on user ${unBannedClient.name}`
        );
      } else {
        server.sendChatText(
          client,
          `Cannot find any banned user with id ${args[0]}`
        );
      }
    }
  },
  {
    name: "kick",
    permissionLevel: PermissionLevels.MODERATOR,
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
      if (server.playerNotFound(client, args[0].toString(), targetClient)) {
        return;
      }
      if (!targetClient || !(targetClient instanceof Client)) {
        server.sendChatText(client, "Client not found.");
        return;
      }
      const reason = args[1] ? args.slice(1).join(" ") : "Undefined";
      server.kickPlayerWithReason(targetClient, reason, true);
    }
  },
  {
    name: "gm", // "god" also works due to default client command mappings
    permissionLevel: PermissionLevels.MODERATOR,
    execute: (server: ZoneServer2016, client: Client, args: Array<string>) => {
      server.setGodMode(client, !client.character.godMode);
      server.sendAlert(client, `Set godmode to ${client.character.godMode}`);
      server.updateCharacterState(
        client,
        client.character.characterId,
        client.character.characterStates,
        true
      );
    }
  },
  {
    name: "superman",
    permissionLevel: PermissionLevels.MODERATOR,
    execute: async (
      server: ZoneServer2016,
      client: Client,
      args: Array<string>
    ) => {
      // Heal the character
      client.character.resetResources(server);
      server.sendChatText(client, "Set resources to maximum values.");
      // Toggle debug mode
      client.isDebugMode = !client.isDebugMode;
      server.sendAlert(client, `Set debug mode to ${client.isDebugMode}`);
      // Toggle vanish state
      client.character.isVanished = !client.character.isVanished;
      server.sendAlert(
        client,
        `Set vanish state to ${client.character.isVanished}`
      );
      if (!client.character.isVanished) {
        for (const decoy of Object.values(server._decoys)) {
          if (decoy.transientId === client.character.transientId) {
            server.sendDataToAll("Character.RemovePlayer", {
              characterId: decoy.characterId
            });
            server.sendChatText(client, "Decoy removed", false);
            client.isDecoy = false;
          }
        }
      } else {
        for (const iteratedClient of Object.values(server._clients)) {
          if (iteratedClient.spawnedEntities.has(client.character)) {
            server.sendData(iteratedClient, "Character.RemovePlayer", {
              characterId: client.character.characterId
            });
            iteratedClient.spawnedEntities.delete(client.character);
          }
        }
        server.sendData(client, "Spectator.Enable", {});
      }
      // Toggle god mode
      server.setGodMode(client, !client.character.godMode);
      server.sendAlert(client, `Set godmode to ${client.character.godMode}`);
      server.updateCharacterState(
        client,
        client.character.characterId,
        client.character.characterStates,
        true
      );
    }
  },
  {
    name: "move",
    permissionLevel: PermissionLevels.MODERATOR,
    execute: (server: ZoneServer2016, client: Client, args: Array<string>) => {
      const direction = (args[0] || "up").toLowerCase(); // Default direction is "up"
      const heightInput = args[1];
      const height = heightInput !== undefined ? parseFloat(heightInput) : 50;
      if (isNaN(height)) {
        server.sendChatText(
          client,
          "Error: Please enter a valid number for the height."
        );
        return;
      }
      const newPosition = new Float32Array(client.character.state.position);
      switch (direction) {
        case "up":
          newPosition[1] += height;
          break;
        case "down":
          newPosition[1] -= height;
          break;
        default:
          server.sendChatText(
            client,
            "Error: Invalid direction. Use 'up' or 'down'."
          );
          return;
      }
      server.sendData(client, "ClientUpdate.UpdateLocation", {
        position: newPosition,
        triggerLoadingScreen: false
      });
      server.sendChatText(client, `Moved ${direction} by ${height}`);
    }
  },
  {
    name: "listprocesses",
    permissionLevel: PermissionLevels.MODERATOR,
    execute: async (
      server: ZoneServer2016,
      client: Client,
      args: Array<string>
    ) => {
      if (!args[0]) {
        server.sendChatText(
          client,
          `Correct usage: /listprocesses {name | ZoneClientId}`
        );
        return;
      }
      const targetClient = server.getClientByNameOrLoginSession(
        args[0].toString()
      );
      if (server.playerNotFound(client, args[0].toString(), targetClient)) {
        return;
      }
      if (!targetClient || !(targetClient instanceof Client)) {
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
    }
  },
  {
    name: "listmodules",
    permissionLevel: PermissionLevels.MODERATOR,
    execute: async (
      server: ZoneServer2016,
      client: Client,
      args: Array<string>
    ) => {
      if (!args[0]) {
        server.sendChatText(
          client,
          `Correct usage: /listmodules {name | ZoneClientId}`
        );
        return;
      }
      const targetClient = server.getClientByNameOrLoginSession(
        args[0].toString()
      );
      if (server.playerNotFound(client, args[0].toString(), targetClient)) {
        return;
      }
      if (!targetClient || !(targetClient instanceof Client)) {
        server.sendChatText(client, "Client not found.");
        return;
      }

      if (targetClient.isAdmin) {
        server.sendChatText(
          client,
          `${targetClient.character.name} is an admin!`
        );
      }

      server.sendChatText(
        client,
        `Requesting modules from: ${targetClient.character.name}`
      );
      server.sendData(targetClient, "H1emu.RequestModules", {});
      server.sendData(
        targetClient,
        "UpdateWeatherData",
        server.weatherManager.weather
      );
    }
  },
  {
    name: "listwindows",
    permissionLevel: PermissionLevels.MODERATOR,
    execute: async (
      server: ZoneServer2016,
      client: Client,
      args: Array<string>
    ) => {
      if (!args[0]) {
        server.sendChatText(
          client,
          `Correct usage: /listwindows {name | ZoneClientId}`
        );
        return;
      }
      const targetClient = server.getClientByNameOrLoginSession(
        args[0].toString()
      );
      if (server.playerNotFound(client, args[0].toString(), targetClient)) {
        return;
      }
      if (!targetClient || !(targetClient instanceof Client)) {
        server.sendChatText(client, "Client not found.");
        return;
      }
      server.sendChatText(
        client,
        `Requesting windows from: ${targetClient.character.name}`
      );
      server.sendData(targetClient, "H1emu.RequestWindows", {});
      server.sendData(
        targetClient,
        "UpdateWeatherData",
        server.weatherManager.weather
      );
    }
  },
  {
    name: "globalmute",
    permissionLevel: PermissionLevels.MODERATOR,
    execute: async (
      server: ZoneServer2016,
      client: Client,
      args: Array<string>
    ) => {
      if (!args[0]) {
        server.sendChatText(
          client,
          `Correct usage: /globalmute {name|playerId} optional: {time} {reason}`
        );
        return;
      }
      const targetClient = server.getClientByNameOrLoginSession(
        args[0].toString()
      );
      if (server.playerNotFound(client, args[0].toString(), targetClient)) {
        return;
      }
      if (!targetClient || !(targetClient instanceof Client)) {
        server.sendChatText(client, "Client not found.");
        return;
      }

      const mutedClient = (await server._db
        ?.collection(DB_COLLECTIONS.MUTED)
        .findOne({
          name: client.character.name.toLowerCase(),
          active: true
        })) as unknown as ClientMute;
      if (mutedClient) {
        server.sendChatText(client, "Client is already muted!");
        return;
      }

      let time = Number(args[1]) ? Number(args[1]) * 60000 : 0;
      if (time > 0) {
        time += Date.now();
        server.sendChatText(
          client,
          `You have muted ${
            targetClient.character.name
          } until ${getDateString(time)}`
        );
      } else {
        server.sendChatText(
          client,
          `You have muted ${targetClient.character.name} permanently`
        );
      }
      const reason = args.slice(2).join(" ");
      server.chatManager.muteClient(
        server,
        targetClient,
        reason,
        client.character.name ? client.character.name : "",
        time
      );
    }
  },
  {
    name: "globalunmute",
    permissionLevel: PermissionLevels.MODERATOR,
    execute: async (
      server: ZoneServer2016,
      client: Client,
      args: Array<string>
    ) => {
      if (!args[0]) {
        server.sendChatText(
          client,
          `Correct usage: /globalunmute {name|playerId}`
        );
        return;
      }
      const name = args.join(" ").toString(),
        mutedClient = (
          await server._db?.collection(DB_COLLECTIONS.MUTED).findOneAndUpdate(
            { name, active: true },
            {
              $set: { active: false, unmuteAdminName: client.character.name }
            }
          )
        )?.value as unknown as ClientMute;
      if (mutedClient) {
        server.sendChatText(client, `Removed mute on user ${mutedClient.name}`);
        const targetClient = server.getClientByNameOrLoginSession(
          mutedClient.loginSessionId
        );
        if (targetClient && targetClient instanceof Client) {
          server.sendAlert(targetClient, "You have been unmuted!");
        }
      } else {
        server.sendChatText(
          client,
          `Cannot find any muted user with name ${name}`
        );
      }
    }
  },
  {
    name: "debug",
    permissionLevel: PermissionLevels.MODERATOR,
    execute: async (server: ZoneServer2016, client: Client) => {
      client.isDebugMode = !client.isDebugMode;
      server.sendAlert(client, `Set debug mode to ${client.isDebugMode}`);
    }
  },
  {
    name: "heal",
    permissionLevel: PermissionLevels.MODERATOR,
    execute: async (
      server: ZoneServer2016,
      client: Client,
      args: Array<string>
    ) => {
      client.character.resetResources(server);
      server.sendChatText(client, `Set resources to maximum values.`);
    }
  },
  //#endregion

  //#region ADMIN PERMISSIONS
  {
    name: "parachute",
    permissionLevel: PermissionLevels.ADMIN,
    execute: (server: ZoneServer2016, client: Client, args: Array<string>) => {
      const player = args[0];
      const targetClient = player && server.getClientByName(player);

      if (typeof targetClient === "string") {
        server.sendChatText(
          client,
          `Player not found, did you mean ${targetClient}?`
        );
        return;
      }

      const actingClient = targetClient ?? client;
      const characterId = server.generateGuid(),
        loc = new Float32Array([
          actingClient.character.state.position[0],
          actingClient.character.state.position[1] + 700,
          actingClient.character.state.position[2],
          actingClient.character.state.position[3]
        ]),
        vehicle = new Vehicle2016(
          characterId,
          server.getTransientId(characterId),
          9374,
          loc,
          actingClient.character.state.rotation,
          server,
          getCurrentServerTimeWrapper().getTruncatedU32(),
          VehicleIds.PARACHUTE
        );
      server.sendData(actingClient, "ClientUpdate.UpdateLocation", {
        position: loc,
        triggerLoadingScreen: true
      });
      vehicle.onReadyCallback = (clientTriggered: Client) => {
        // doing anything with vehicle before client gets fullvehicle packet breaks it
        server.mountVehicle(clientTriggered, characterId);
        // todo: when vehicle takeover function works, delete assignManagedObject call
        server.assignManagedObject(clientTriggered, vehicle);
        clientTriggered.vehicle.mountedVehicle = characterId;
      };
      server.worldObjectManager.createVehicle(server, vehicle, true);
    }
  },
  {
    name: "changemodel",
    permissionLevel: PermissionLevels.ADMIN,
    execute: async (
      server: ZoneServer2016,
      client: Client,
      args: Array<string>
    ) => {
      if (args.length < 1) {
        server.sendChatText(client, "Please specify a valid model ID.");
        return;
      }

      const modelMap: { [key: string]: number } = {
        deer: 9002,
        buck: 9253,
        wolf: 9003,
        bear: 9187,
        rabbit: 9212,
        screamer: 9667,
        zombie: 9510,
        raven: 9230
      };

      let newModelId: number;
      const input = args[0];

      if (!isNaN(Number(input))) {
        newModelId = Number(input);
      } else if (Object.prototype.hasOwnProperty.call(modelMap, input)) {
        newModelId = modelMap[input];
      } else {
        server.sendChatText(client, "Specify a valid model ID!");
        return;
      }

      server.sendDataToAllWithSpawnedEntity(
        server._characters,
        client.character.characterId,
        "Character.ReplaceBaseModel",
        {
          characterId: client.character.characterId,
          modelId: newModelId
        }
      );

      server.sendChatText(client, `Model changed to ID ${newModelId}`);
    }
  },
  {
    name: "titan",
    permissionLevel: PermissionLevels.ADMIN,
    execute: (server: ZoneServer2016, client: Client, args: Array<string>) => {
      server.sendDataToAll("Character.UpdateScale", {
        characterId: client.character.characterId,
        scale: [20, 20, 20, 1]
      });
      server.sendChatText(client, "TITAN size");
    }
  },
  {
    name: "poutine",
    permissionLevel: PermissionLevels.ADMIN,
    execute: (server: ZoneServer2016, client: Client, args: Array<string>) => {
      server.sendDataToAll("Character.UpdateScale", {
        characterId: client.character.characterId,
        scale: [20, 5, 20, 1]
      });
      server.sendChatText(client, "The meme become a reality.....");
    }
  },
  {
    name: "rat",
    permissionLevel: PermissionLevels.ADMIN,
    execute: (server: ZoneServer2016, client: Client, args: Array<string>) => {
      server.sendDataToAll("Character.UpdateScale", {
        characterId: client.character.characterId,
        scale: [0.2, 0.2, 0.2, 1]
      });
      server.sendChatText(client, "Rat size");
    }
  },
  {
    name: "normalsize",
    permissionLevel: PermissionLevels.ADMIN,
    execute: (server: ZoneServer2016, client: Client, args: Array<string>) => {
      server.sendDataToAll("Character.UpdateScale", {
        characterId: client.character.characterId,
        scale: [1, 1, 1, 1]
      });
      server.sendChatText(client, "Back to normal size");
    }
  },
  {
    name: "despawnobjects",
    permissionLevel: PermissionLevels.ADMIN,
    execute: (server: ZoneServer2016, client: Client, args: Array<string>) => {
      client.spawnedEntities.forEach((object) => {
        if (object.characterId == client.character.characterId) return;
        server.despawnEntity(object.characterId);
      });
      client.spawnedEntities = new Set();
      server._lootableProps = {};
      server._npcs = {};
      server._spawnedItems = {};
      server._vehicles = {};
      server._doors = {};
      server.sendChatText(client, "Objects removed from the game.", true);
    }
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
      const time = choosenHour * 3600;
      server.inGameTimeManager.time = time;
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
    }
  },
  {
    name: "speedtime",
    permissionLevel: PermissionLevels.ADMIN,
    execute: (server: ZoneServer2016, client: Client, args: Array<string>) => {
      server.inGameTimeManager.baseTimeMultiplier = Number(args[0]);
      server.sendChatText(
        client,
        `Will force time to be ${server.inGameTimeManager.baseTimeMultiplier}x faster on next sync...`,
        true
      );
    }
  },
  {
    name: "freezetime",
    permissionLevel: PermissionLevels.ADMIN,
    execute: (server: ZoneServer2016, client: Client, args: Array<string>) => {
      if (server.inGameTimeManager.timeFrozen) {
        server.inGameTimeManager.start();
        server.sendChatText(client, "Game time is now unfroze", true);
      } else {
        server.inGameTimeManager.stop();
        server.sendChatText(client, "Game time is now froze", true);
      }
    }
  },
  {
    name: "sfog",
    permissionLevel: PermissionLevels.ADMIN,
    execute: (server: ZoneServer2016, client: Client, args: Array<string>) => {
      server.sendChatText(
        client,
        `Fog has been toggled ${
          server.weatherManager.toggleFog() ? "ON" : "OFF"
        } for the server`,
        true
      );
    }
  },
  {
    name: "spamzombies",
    permissionLevel: PermissionLevels.ADMIN,
    execute: (server: ZoneServer2016, client: Client, args: Array<string>) => {
      if (!args[1]) {
        server.sendChatText(
          client,
          "[ERROR] Usage /spamzombies [RANGE] [POINTS]"
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
      points.forEach((obj) => {
        server.worldObjectManager.createNpc(
          server,
          9634,
          new Float32Array([
            obj[0],
            client.character.state.position[1],
            obj[1],
            1
          ]),
          client.character.state.lookAt
        );
      });
    }
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
      points.forEach((obj) => {
        const characterId = server.generateGuid();
        server._explosives[characterId] = new ExplosiveEntity(
          characterId,
          server.getTransientId(characterId),
          9176,
          new Float32Array([
            obj[0],
            client.character.state.position[1],
            obj[1],
            1
          ]),
          client.character.state.lookAt,
          server,
          Items.IED,
          client.character.characterId
        ); // save explosive
      });
    }
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
    }
  },
  {
    name: "decoy",
    permissionLevel: PermissionLevels.ADMIN,
    execute: (server: ZoneServer2016, client: Client, args: Array<string>) => {
      if (!args[0] && !server._decoys[client.character.transientId]) {
        server.sendChatText(client, "usage /decoy {name}");
        return;
      }
      if (server._decoys[client.character.transientId]) {
        if (client.isDecoy) {
          server.sendChatText(client, "Decoy replication disabled");
          client.isDecoy = false;
        } else {
          server.sendChatText(client, "Decoy replication enabled");
          client.isDecoy = true;
        }
        return;
      }
      if (!client.character.isVanished) {
        server.sendChatText(client, "You must be in vanish mode to use this");
        return;
      }
      const mimic = client.character.pGetLightweight();
      const characterId = server.generateGuid();
      const decoy = {
        characterId: characterId,
        transientId: client.character.transientId,
        position: mimic.position as Float32Array,
        action: ""
      };
      server._decoys[client.character.transientId] = decoy;
      mimic.identity.characterName = args[0]
        .split("")
        .map((letter) =>
          Math.random() < 0.7 || !/[a-z]/.test(letter)
            ? letter
            : letter.toUpperCase()
        )
        .join("");
      mimic.characterId = characterId;
      mimic.transientId = client.character.transientId;
      for (const a in server._clients) {
        const c = server._clients[a];
        if (
          isPosInRadius(
            c.character.npcRenderDistance || 250,
            client.character.state.position,
            c.character.state.position
          )
        ) {
          server.sendData(c, "AddLightweightPc", {
            ...mimic,
            mountGuid: "",
            mountSeatId: 0,
            mountRelatedDword1: 0
          });
          const equipment = client.character.pGetEquipment();
          equipment.characterData.characterId = characterId;
          server.sendData(c, "Equipment.SetCharacterEquipment", equipment);
          server.sendData(c, "LightweightToFullPc", {
            useCompression: false,
            fullPcData: {
              transientId: client.character.transientId,
              attachmentData: client.character.pGetAttachmentSlots(),
              headActor: client.character.headActor,
              hairModel: client.character.hairModel,
              resources: { data: client.character.pGetResources() },
              remoteWeapons: {
                data: client.character.pGetRemoteWeaponsData(server)
              }
            },
            positionUpdate: {
              ...client.character.positionUpdate,
              sequenceTime: getCurrentServerTimeWrapper().getTruncatedU32(),
              position: client.character.state.position,
              stance: client.character.stance
            },
            stats: client.character.getStats().map((stat: any) => {
              return stat.statData;
            }),
            remoteWeaponsExtra:
              client.character.pGetRemoteWeaponsExtraData(server)
          });
        }
      }
      client.isDecoy = true;
      server.sendChatText(client, "Decoy replication enabled");
    }
  },
  {
    name: "deletedecoys",
    permissionLevel: PermissionLevels.ADMIN,
    execute: (server: ZoneServer2016, client: Client, args: Array<string>) => {
      for (const a in server._decoys) {
        server.sendDataToAll("Character.RemovePlayer", {
          characterId: server._decoys[a].characterId
        });
        delete server._decoys[a];
      }
      for (const a in server._clients) {
        if (server._clients[a].isDecoy) {
          server._clients[a].isDecoy = false;
        }
      }
      server.sendChatText(client, `Removed all decoys`, false);
    }
  },
  {
    name: "dynamicweather",
    permissionLevel: PermissionLevels.ADMIN,
    execute: (server: ZoneServer2016, client: Client, args: Array<string>) => {
      if (!server.weatherManager.dynamicEnabled) {
        server.weatherManager.dynamicEnabled = true;
        server.sendChatText(client, "Dynamic weather enabled !");
      } else {
        server.sendChatText(client, "Dynamic weather already enabled !");
      }
    }
  },
  {
    name: "weather",
    permissionLevel: PermissionLevels.ADMIN,
    execute: (server: ZoneServer2016, client: Client, args: Array<string>) => {
      server.weatherManager.handleWeatherCommand(server, client, args);
    }
  },
  {
    name: "savecurrentweather",
    permissionLevel: PermissionLevels.ADMIN,
    execute: async (
      server: ZoneServer2016,
      client: Client,
      args: Array<string>
    ) => {
      server.weatherManager.handleSaveCommand(server, client, args);
    }
  },
  {
    name: "randomweather",
    permissionLevel: PermissionLevels.ADMIN,
    execute: (server: ZoneServer2016, client: Client, args: Array<string>) => {
      server.weatherManager.handleRandomCommand(server, client);
    }
  },
  {
    name: "addBuilding",
    permissionLevel: PermissionLevels.DEV,
    execute: (server: ZoneServer2016, client: Client, args: Array<string>) => {
      const modelId = Number(args[0]);
      const { position, rotation } = client.character.state;
      const characterId = server.generateGuid();
      const transientId = server.getTransientId(characterId);
      const s: AddSimpleNpc = {
        characterId,
        modelId,
        position,
        rotation,
        transientId,
        scale: new Float32Array([1, 1, 1, 1]),
        health: 10000
      };
      server.staticBuildings.push(s);
      server.sendData(client, "AddSimpleNpc", s);
    }
  },
  {
    name: "saveBuildings",
    permissionLevel: PermissionLevels.DEV,
    execute: (server: ZoneServer2016, client: Client, args: Array<string>) => {
      writeFileSync(
        __dirname + "/../../../../../data/2016/sampleData/staticbuildings.json",
        JSON.stringify(server.staticBuildings)
      );
    }
  },
  {
    name: "addcontaineritem",
    permissionLevel: PermissionLevels.ADMIN,
    execute: (server: ZoneServer2016, client: Client, args: Array<string>) => {
      if (!args[0]) {
        server.sendChatText(
          client,
          "[ERROR] Usage /addcontaineritem {itemDefinitionId/item name} optional: {count}"
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
      const item = server.generateItem(itemDefId, count, true);
      if (!item) {
        server.sendChatText(
          client,
          similar
            ? `[ERROR] Cannot find item "${args[0].toUpperCase()}", did you mean "${similar}"`
            : `[ERROR] Cannot find item "${args[0]}"`
        );
        return;
      }

      if (!client.character.mountedContainer) return;
      client.character.mountedContainer.lootItem(server, item);
    }
  },
  {
    name: "giverewardtoall",
    permissionLevel: PermissionLevels.ADMIN,
    execute: (server: ZoneServer2016, client: Client, args: Array<string>) => {
      if (!args[0]) {
        server.sendChatText(
          client,
          "[ERROR] Usage /giverewardtoall {itemDefinitionId}"
        );
        return;
      }
      const rewardId = Number(args[0]);
      const validRewardItem = server.rewardManager.rewards.some(
        (v) => v.itemId === rewardId
      );
      if (!validRewardItem) {
        server.sendChatText(
          client,
          `[ERROR] ${rewardId} isn't a valid reward item`
        );
        return;
      }
      server.sendAlertToAll(
        `Admin ${client.character.name} rewarded all connected players with ${Items[rewardId]}`
      );
      for (const key in server._clients) {
        const c = server._clients[key];
        server.rewardManager.addRewardToPlayer(c, rewardId);
      }
    }
  },
  {
    name: "givereward",
    permissionLevel: PermissionLevels.ADMIN,
    execute: (server: ZoneServer2016, client: Client, args: Array<string>) => {
      if (!args[1]) {
        server.sendChatText(
          client,
          "[ERROR] Usage /givereward {itemDefinitionId} {playerName|playerId}"
        );
        return;
      }
      const rewardId = Number(args[0]);
      const validRewardItem = server.rewardManager.rewards.some(
        (v) => v.itemId === rewardId
      );
      if (!validRewardItem) {
        server.sendChatText(
          client,
          `[ERROR] ${rewardId} isn't a valid reward item`
        );
        return;
      }
      const targetClient = server.getClientByNameOrLoginSession(
        args[1].toString()
      );
      if (typeof targetClient == "string") {
        server.sendChatText(
          client,
          `Could not find player ${args[1]
            .toString()
            .toUpperCase()}, did you mean ${targetClient.toUpperCase()}`
        );
        return;
      }
      if (!targetClient) {
        server.sendChatText(client, "Client not found.");
        return;
      }
      server.sendAlertToAll(
        `Admin ${client.character.name} rewarded ${targetClient.character.name} with ${Items[rewardId]}`
      );
      server.rewardManager.addRewardToPlayer(targetClient, rewardId);
    }
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
      const item = server.generateItem(itemDefId, count, true);
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
    }
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
        skyData: server.weatherManager.weather,
        zoneId1: 5,
        zoneId2: 5,
        nameId: 7699,
        unknownBoolean2: true,
        lighting: args[0],
        unknownBoolean3: false
      });
    }
  },
  {
    name: "kit",
    permissionLevel: PermissionLevels.ADMIN,
    execute: (server, client, args) => {
      if (!args[0]) {
        client.character.equipLoadout(server, characterKitLoadout, true);
        return;
      }

      switch (args[0]) {
        case "pvp":
          client.character.equipLoadout(server, characterKitLoadout, true);
          break;
        case "parts":
          client.character.equipItem(
            server,
            server.generateItem(Items.FANNY_PACK_DEV)
          );
          client.character.equipLoadout(server, characterVehicleKit, true);
          break;
        case "skins":
          client.character.equipItem(
            server,
            server.generateItem(Items.FANNY_PACK_DEV)
          );
          client.character.equipLoadout(server, characterSkinsLoadout, true);
          break;
        case "build":
          client.character.equipItem(
            server,
            server.generateItem(Items.FANNY_PACK_DEV)
          );
          client.character.equipLoadout(server, characterBuildKitLoadout, true);
          break;
        default:
          server.sendChatText(
            client,
            "Valid Kit Names Are pvp, parts, skins, build"
          );
          return;
      }
      server.sendChatText(client, `Equipped ${args[0]} kit`);
    }
  },
  {
    name: "testkit",
    permissionLevel: PermissionLevels.ADMIN,
    execute: (server, client, args) => {
      client.character.equipItem(
        server,
        server.generateItem(Items.FANNY_PACK_DEV)
      );
      client.character.equipLoadout(server, characterTestKitLoadout, true);
      server.sendChatText(client, `Equipped test kit`);
    }
  },
  {
    name: "addallitems",
    permissionLevel: PermissionLevels.DEV,
    execute: (server: ZoneServer2016, client: Client, args: Array<string>) => {
      server.sendChatText(client, "Disabled for now.");
      /*
      client.character.equipItem(
        server,
        server.generateItem(Items.FANNY_PACK_DEV)
      );
      server.sendChatText(client, "Adding 1x of all items to inventory.");
      for (const itemDef of Object.values(server._itemDefinitions)) {
        client.character.lootItem(server, server.generateItem(itemDef.ID));
        Scheduler.yield();
      }
      */
    }
  },
  {
    name: "spawnloot",
    permissionLevel: PermissionLevels.ADMIN,
    execute: (server: ZoneServer2016, client: Client, args: Array<string>) => {
      server.worldObjectManager.createLoot(server);
      server.sendChatText(client, `Spawned loot`);
    }
  },
  {
    name: "respawnnpcs",
    permissionLevel: PermissionLevels.ADMIN,
    execute: (server: ZoneServer2016, client: Client, args: Array<string>) => {
      server.worldObjectManager.createNpcs(server);
      server.sendChatText(client, `Respawned npcs`);
    }
  },
  {
    name: "respawnvehicles",
    permissionLevel: PermissionLevels.ADMIN,
    execute: (server: ZoneServer2016, client: Client, args: Array<string>) => {
      server.worldObjectManager.createVehicles(server);
      server.sendChatText(client, `Respawned vehicles`);
    }
  },
  {
    name: "lootrespawntimer",
    permissionLevel: PermissionLevels.ADMIN,
    execute: (server: ZoneServer2016, client: Client, args: Array<string>) => {
      if (!args[0]) {
        server.sendChatText(client, `Correct usage: /lootrespawntimer <time>`);
        server.sendChatText(client, `Set <time> to -1 to use default settings`);
        return;
      }
      server.worldObjectManager.hasCustomLootRespawnTime =
        Number(args[0]) != -1;

      if (server.worldObjectManager.hasCustomLootRespawnTime) {
        server.worldObjectManager.lootRespawnTimer = Number(args[0]);
        server.sendChatText(
          client,
          `Loot respawn timer set to ${Number(args[0])}`
        );
      } else {
        server.worldObjectManager.lootRespawnTimer = 1_200_000; // 30 min default
        server.sendChatText(client, `Loot respawn timer is no longer custom.`);
      }
    }
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
    }
  },
  {
    name: "vehiclerespawntimer",
    permissionLevel: PermissionLevels.ADMIN,
    execute: (server: ZoneServer2016, client: Client, args: Array<string>) => {
      if (!args[0]) {
        server.sendChatText(
          client,
          `Correct usage: /vehiclerespawntimer <time>`
        );
        return;
      }
      server.worldObjectManager.vehicleRespawnTimer = Number(args[0]);
      server.sendChatText(
        client,
        `Vehicle respawn timer set to ${Number(args[0])}`
      );
    }
  },
  {
    name: "alert",
    permissionLevel: PermissionLevels.ADMIN,
    keepCase: true,
    execute: (server: ZoneServer2016, client: Client, args: Array<string>) => {
      server.sendAlertToAll(args.join(" "));
    }
  },
  {
    name: "remover",
    permissionLevel: PermissionLevels.ADMIN,
    execute: (server: ZoneServer2016, client: Client, args: Array<string>) => {
      const wep = server.generateItem(Items.WEAPON_REMOVER);
      if (wep?.weapon) wep.weapon.ammoCount = 1000;
      client.character.lootItem(server, wep);
    }
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
      if (server.playerNotFound(client, args[0].toString(), targetClient)) {
        return;
      }
      if (!targetClient || !(targetClient instanceof Client)) {
        server.sendChatText(client, "Client not found.");
        return;
      }
      server.sendGlobalChatText(
        `${targetClient.character.name} has been slain`
      );
      const damageInfo: DamageInfo = {
        entity: client.character.characterId,
        damage: 999999999
      };
      server.killCharacter(targetClient, damageInfo);
    }
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
      const characters = WorldDataManager.convertCharactersToSaveData(
        Object.values(server._characters),
        server._worldId
      );
      await server.worldDataManager.saveCharacters(characters);
      server.sendChatText(client, "Character data has been saved!");
    }
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
      // await server.worldDataManager.saveVehicles(server);
      server.sendChatText(client, "Vehicles have been saved!");
    }
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

      await server.saveWorld();
    }
  },
  {
    name: "nextsave",
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
      server.sendChatText(
        client,
        `Next save at ${new Date(server.worldDataManager.nextSaveTime)}`
      );
    }
  },
  {
    name: "disablesave",
    permissionLevel: PermissionLevels.ADMIN,
    execute: async (
      server: ZoneServer2016,
      client: Client,
      args: Array<string>
    ) => {
      if (!server.enableWorldSaves) {
        server.sendChatText(client, "Server saving is already disabled.");
        return;
      }

      server.enableWorldSaves = false;
      server.sendAlertToAll("World saving has been disabled");
    }
  },
  {
    name: "enablesave",
    permissionLevel: PermissionLevels.ADMIN,
    execute: async (
      server: ZoneServer2016,
      client: Client,
      args: Array<string>
    ) => {
      if (server.enableWorldSaves) {
        server.sendChatText(client, "Server saving is already enabled.");
        return;
      }

      server.enableWorldSaves = true;
      server.sendAlertToAll("World saving has been enabled");
    }
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
      const entitiesToDelete: {
        characterId: string;
        dictionary: EntityDictionary<BaseEntity>;
      }[] = [];
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
            dictionary: server._temporaryObjects
          });
        }
      }

      for (const a in server._traps) {
        const construction = server._traps[a];
        if (
          isPosInRadius(
            Number(args[0]),
            client.character.state.position,
            construction.state.position
          )
        ) {
          entitiesToDelete.push({
            characterId: construction.characterId,
            dictionary: server._traps
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
            dictionary: server._plants
          });
        }
      }

      entitiesToDelete.forEach(
        (entity: {
          characterId: string;
          dictionary: EntityDictionary<BaseEntity>;
        }) => {
          server.deleteEntity(
            entity.characterId,
            entity.dictionary,
            Effects.PFX_Impact_Explosion_Landmine_Dirt_10m,
            500
          );
        }
      );
      server.sendChatText(
        client,
        `Removed all constructions in range of ${Number(args[0])}`
      );
    }
  },

  // to be removed in later version
  {
    name: "vehicleparts",
    permissionLevel: PermissionLevels.ADMIN,
    execute: async (
      server: ZoneServer2016,
      client: Client,
      args: Array<string>
    ) => {
      server.sendChatText(client, "Usage: /kit parts");
    }
  },
  // to be removed in later version
  {
    name: "build",
    permissionLevel: PermissionLevels.ADMIN,
    execute: async (
      server: ZoneServer2016,
      client: Client,
      args: Array<string>
    ) => {
      server.sendChatText(client, "Usage: /kit build");
    }
  },
  // to be removed in later version
  {
    name: "skins",
    permissionLevel: PermissionLevels.ADMIN,
    execute: async (
      server: ZoneServer2016,
      client: Client,
      args: Array<string>
    ) => {
      server.sendChatText(client, "Usage: /kit skins");
    }
  },

  {
    name: "listbases",
    permissionLevel: PermissionLevels.MODERATOR,
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
      if (server.playerNotFound(client, args[0].toString(), targetClient)) {
        return;
      }
      if (!targetClient || !(targetClient instanceof Client)) {
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
        const name = server.getItemDefinition(
          foundation.itemDefinitionId
        )?.NAME;
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
    }
  },
  {
    name: "getinventory",
    permissionLevel: PermissionLevels.MODERATOR,
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
      if (server.playerNotFound(client, args[0].toString(), targetClient)) {
        return;
      }
      if (!targetClient || !(targetClient instanceof Client)) {
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
          const name = server.getItemDefinition(item?.itemDefinitionId)?.NAME;
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
          )?.NAME;
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
              item?.itemDefinitionId
            )?.NAME;
            server.sendChatText(
              client,
              `${counter}. ${
                itemName ? itemName : item.itemDefinitionId
              }, count: ${item.stackCount}`
            );
          });
        }
      );
    }
  },
  {
    name: "listpermissions",
    permissionLevel: PermissionLevels.MODERATOR,
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
      Object.values(foundation.permissions).forEach((permission) => {
        server.sendChatText(client, JSON.stringify(permission));
      });
    }
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
          delete server.worldObjectManager.spawnedLootObjects[item.spawnerId];
        }
      }

      for (const characterId in server._lootableProps) {
        const item = server._lootableProps[characterId];
        if (item.spawnerId > 0) {
          const container = item.getContainer();
          if (container) container.items = {};
        }
      }

      delete require.cache[require.resolve("../../data/lootspawns")];
      const loottables = require("../../data/lootspawns").lootTables;
      server.worldObjectManager.createLoot(server, loottables);
      server.worldObjectManager.createContainerLoot(server);
      server.sendChatText(client, `Respawned loot`);
    }
  },
  {
    name: "deepcover",
    permissionLevel: PermissionLevels.ADMIN,
    execute: async (
      server: ZoneServer2016,
      client: Client,
      args: Array<string>
    ) => {
      const newCharacterName = args[0];

      // Validate the input to ensure that it is a single word without special characters
      const isValidInput = /^[a-zA-Z0-9_]+$/.test(newCharacterName);
      if (!isValidInput) {
        server.sendChatText(
          client,
          "Invalid input. Please enter a single word without special characters."
        );
        return;
      }
      // Send a chat message to confirm the name change
      server.sendChatText(client, `Name changed to ${newCharacterName}`);
      // Update the client's character name
      client.character.name = newCharacterName;

      // Wait for one second before running vanish command
      await scheduler.wait(1000);

      client.character.isVanished = !client.character.isVanished;

      // Remove the client's character from the game if in spectate mode
      if (client.character.isVanished) {
        for (const a in server._clients) {
          const iteratedClient = server._clients[a];
          if (iteratedClient.spawnedEntities.has(client.character)) {
            server.sendData(iteratedClient, "Character.RemovePlayer", {
              characterId: client.character.characterId
            });
            iteratedClient.spawnedEntities.delete(client.character);
          }
        }
        server.sendData(client, "Spectator.Enable", {});
      }

      // Wait for an additional second before running the second vanish command
      await scheduler.wait(1000);

      // Set the client's isVanished state again
      client.character.isVanished = !client.character.isVanished;
    }
  },
  {
    name: "reboot",
    permissionLevel: PermissionLevels.ADMIN,
    keepCase: true,
    execute: async (
      server: ZoneServer2016,
      client: Client,
      args: Array<string>
    ) => {
      if (args.length < 2) {
        server.sendChatText(
          client,
          "Usage: /reboot <time in seconds> <message>"
        );
        return;
      }

      const time = Number(args[0]),
        message = args.slice(1, args.length).join(" ");

      if (isNaN(time)) {
        server.sendChatText(client, "Invalid time.");
        server.sendChatText(
          client,
          "Usage: /reboot <time in seconds> <message>"
        );
        return;
      }

      server.shutdown(time, message);
    }
  },
  {
    name: "rebootcancel",
    permissionLevel: PermissionLevels.ADMIN,
    keepCase: true,
    execute: async (
      server: ZoneServer2016,
      client: Client,
      args: Array<string>
    ) => {
      if (!server.shutdownStarted) {
        server.sendChatText(client, "Server is not currently rebooting.");
        return;
      }

      server.abortShutdown = true;
      server.sendChatText(client, "Aborted server shutdown.");
    }
  },
  {
    name: "console",
    permissionLevel: PermissionLevels.DEFAULT,
    execute: async (
      server: ZoneServer2016,
      client: Client,
      args: Array<string>
    ) => {
      /* handled clientside */
    }
  },
  {
    name: "!!h1custom!!",
    permissionLevel: PermissionLevels.DEV,
    execute: async (
      server: ZoneServer2016,
      client: Client,
      args: Array<string>
    ) => {
      /* DO NOT REMOVE THIS */
      /* handled clientside, used to send custom packets from client to zone */
      /* DO NOT REMOVE THIS */
    }
  },
  {
    name: "deepcover",
    permissionLevel: PermissionLevels.ADMIN,
    execute: async (
      server: ZoneServer2016,
      client: Client,
      args: Array<string>
    ) => {
      const newCharacterName = args[0];

      // Validate the input to ensure that it is a single word without special characters
      const isValidInput = /^[a-zA-Z0-9_]+$/.test(newCharacterName);
      if (!isValidInput) {
        server.sendChatText(
          client,
          "Invalid input. Please enter a single word without special characters."
        );
        return;
      }
      // Send a chat message to confirm the name change
      server.sendChatText(client, `Name changed to ${newCharacterName}`);
      // Update the client's character name
      client.character.name = newCharacterName;

      // Wait for one second before running vanish command
      await scheduler.wait(1000);

      // Set the client's isVanished state
      client.character.isVanished = !client.character.isVanished;

      // Remove the client's character from the game if in spectate mode
      if (client.character.isVanished) {
        for (const a in server._clients) {
          const iteratedClient = server._clients[a];
          if (iteratedClient.spawnedEntities.has(client.character)) {
            server.sendData(iteratedClient, "Character.RemovePlayer", {
              characterId: client.character.characterId
            });
            iteratedClient.spawnedEntities.delete(client.character);
          }
        }
        server.sendData(client, "Spectator.Enable", {});
      }

      // Wait for an additional second before running the second vanish command
      await scheduler.wait(1000);

      // Set the client's isVanished state again
      client.character.isVanished = !client.character.isVanished;
    }
  },
  {
    name: "serverlock",
    permissionLevel: PermissionLevels.ADMIN,
    execute: async (
      server: ZoneServer2016,
      client: Client,
      args: Array<string>
    ) => {
      server.isLocked = !server.isLocked;
      server.sendChatText(
        client,
        `Server ${server.isLocked ? "Locked" : "Unlocked"}`
      );
    }
  },
  //#endregion

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
    }
  },
  {
    name: "weathervalue",
    permissionLevel: PermissionLevels.DEV,
    keepCase: true,
    execute: (server: ZoneServer2016, client: Client, args: Array<string>) => {
      if (!args[1]) {
        server.sendChatText(client, "Missing 2 args");
        return;
      }

      if (Object.is(NaN, Number(args[1]))) {
        server.sendChatText(client, "args[1] is not a number");
        return;
      }

      switch (args[0]) {
        case "overcast":
        case "fogDensity":
        case "fogFloor":
        case "fogGradient":
        case "globalPrecipitation":
        case "temperature":
        case "skyClarity":
        case "cloudWeight0":
        case "cloudWeight1":
        case "cloudWeight2":
        case "cloudWeight3":
        case "transitionTime":
        case "sunAxisX":
        case "sunAxisY":
        case "sunAxisZ":
        case "windDirectionX":
        case "windDirectionY":
        case "windDirectionZ":
        case "wind":
        case "rainMinStrength":
        case "rainRampupTimeSeconds":
        case "stratusCloudTiling":
        case "stratusCloudScrollU":
        case "stratusCloudScrollV":
        case "stratusCloudHeight":
        case "cumulusCloudTiling":
        case "cumulusCloudScrollU":
        case "cumulusCloudScrollV":
        case "cumulusCloudHeight":
        case "cloudAnimationSpeed":
        case "cloudSilverLiningThickness":
        case "cloudSilverLiningBrightness":
        case "cloudShadows":
          break;
        default:
          server.sendChatText(client, "Invalid args[0]");
          return;
      }

      server.weatherManager.weather[args[0]] = Number(args[1]);
      server.weatherManager.sendUpdateToAll(server, client, false);
      server.sendChatText(client, `Set weather ${args[0]} to ${args[1]}`);
      console.log(server.weatherManager.weather);
      server.weatherManager.sendUpdateToAll(server, client, false);
    }
  }

  //#endregion
];
