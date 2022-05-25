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

/* eslint-disable @typescript-eslint/no-unused-vars */
// TODO enable @typescript-eslint/no-unused-vars
import { ZoneClient2016 as Client } from "../classes/zoneclient";
import { ZoneServer2016 } from "../zoneserver";
import { zoneShutdown, _ } from "../../../utils/utils";

const debug = require("debug")("zonepacketHandlers");

enum PermissionLevel {
  DEFAULT = 0,
  ADMIN = 1
}

// IMPORTANT: The "hash" field only needs to be filled for commands that are 8 charaters+, hash comes from the game sending Command.ExecuteCommand

const commands: any = {// PERMISSIONLEVEL 0 = ANYONE, 1 = ADMIN FOR NOW
  list: {
    permissionLevel: PermissionLevel.DEFAULT,
    function: function (server: ZoneServer2016, client: Client, args: any[]) {
      server.sendChatText(
        client,
        `/hax commands list: \n/hax ${Object.keys(this).join("\n/hax ")}`
      );
    }
  },
  me: {
    permissionLevel: PermissionLevel.DEFAULT,
    function: function (server: ZoneServer2016, client: Client, args: any[]) {
      server.sendChatText(client, `ZoneClientId :${client.loginSessionId}`);
    }
  },
  respawn: {
    permissionLevel: PermissionLevel.DEFAULT,
    function: function (server: ZoneServer2016, client: Client, args: any[]) {
      server.killCharacter(client);
    }
  },
  location: {
    hash: 3270589520,
    permissionLevel: PermissionLevel.DEFAULT,
    function: function (server: ZoneServer2016, client: Client, args: any[]) {
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
    }
  },
  serverinfo: {
    hash: 2371122039,
    permissionLevel: PermissionLevel.DEFAULT,
    function: function (server: ZoneServer2016, client: Client, args: any[]) {
      if (args[0] === "mem") {
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
          _objects: objects,
          _vehicles: vehicles,
          _doors: doors,
          _props: props,
        } = server;
        const delta = Date.now() - server._startTime;
        const datakur = new Date(
          (server._serverTime + delta) * server._timeMultiplier
        );
        const monthNames = [
          "January",
          "February",
          "March",
          "April",
          "May",
          "June",
          "July",
          "August",
          "September",
          "October",
          "November",
          "December",
        ];
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
        server.sendChatText(
          client,
          "Gametime: " +
            datakur.getUTCDate() +
            " " +
            monthNames[datakur.getUTCMonth()] +
            " " +
            (datakur.getUTCFullYear() + 50) +
            ", " +
            datakur.getUTCHours() +
            ":" +
            datakur.getUTCMinutes()
        );
      }
    }
  },
  clientinfo: {
    hash: 3357274581,
    permissionLevel: PermissionLevel.DEFAULT,
    function: function (server: ZoneServer2016, client: Client, args: any[]) {
      server.sendChatText(
        client,
        `Spawned entities count : ${client.spawnedEntities.length}`
      );
    }
  },
  spawninfo: {
    hash: 1757604914,
    permissionLevel: PermissionLevel.DEFAULT,
    function: function (server: ZoneServer2016, client: Client, args: any[]) {
      server.sendChatText(
        client,
        `You spawned at "${client.character.spawnLocation}"`,
        true
      );
    }
  },
  help: {
    permissionLevel: PermissionLevel.DEFAULT,
    function: function (server: ZoneServer2016, client: Client, args: any[]) {
      server.killCharacter(client);
    }
  },
  netstats: {
    hash: 265037938,
    permissionLevel: PermissionLevel.DEFAULT,
    function: function (server: ZoneServer2016, client: Client, args: any[]) {
      const soeClient = server.getSoeClient(client.soeClientId);
      if (soeClient) {
        const stats = soeClient.getNetworkStats();
        for (let index = 0; index < stats.length; index++) {
          const stat = stats[index];
          server.sendChatText(client, stat, index == 0);
        }
      }
    }
  },
  shutdown: {
    hash: 1182168853,
    permissionLevel: PermissionLevel.ADMIN,
    function: async function (server: ZoneServer2016, client: Client, args: any[]) {
      const timeLeft = args[0] ? args[0] : 0;
    const message = args[1] ? args[1] : " ";
    const startedTime = Date.now();
    await zoneShutdown(server, startedTime, timeLeft, message);
    }
  },
  respawnloot: {
    hash: 2553813871,
    permissionLevel: PermissionLevel.ADMIN,
    function: function (server: ZoneServer2016, client: Client, args: any[]) {
      server.worldObjectManager.createLoot(server);
      server.sendChatText(client, `Respawned loot`);
    }
  },
  respawnnpcs: {
    hash: 975396366,
    permissionLevel: PermissionLevel.ADMIN,
    function: function (server: ZoneServer2016, client: Client, args: any[]) {
      server.worldObjectManager.createNpcs(server);
      server.sendChatText(client, `Respawned npcs`);
    }
  },
  respawnvehicles: {
    hash: 2985577403,
    permissionLevel: PermissionLevel.ADMIN,
    function: function (server: ZoneServer2016, client: Client, args: any[]) {
      server.worldObjectManager.createVehicles(server);
      server.sendChatText(client, `Respawned vehicles`);
    }
  },
  loottimer: {
    hash: 3372845901,
    permissionLevel: PermissionLevel.ADMIN,
    function: function (server: ZoneServer2016, client: Client, args: any[]) {
      if (!args[0]) {
        server.sendChatText(
          client,
          `Correct usage: /loottimer <time>`
        );
        return;
      }
      server.worldObjectManager.lootRespawnTimer = Number(args[0]);
      server.sendChatText(client, `Loot respawn timer set to ${Number(args[0])}`);
    }
  },
  npctimer: {
    hash: 2860822019,
    permissionLevel: PermissionLevel.ADMIN,
    function: function (server: ZoneServer2016, client: Client, args: any[]) {
      if (!args[0]) {
        server.sendChatText(
          client,
          `Correct usage: /npctimer <time>`
        );
        return;
      }
      server.worldObjectManager.npcRespawnTimer = Number(args[0]);
      server.sendChatText(client, `Npc respawn timer set to ${Number(args[0])}`);
    }
  },
  vehicletimer: {
    hash: 1076483743,
    permissionLevel: PermissionLevel.ADMIN,
    function: function (server: ZoneServer2016, client: Client, args: any[]) {
      if (!args[0]) {
        server.sendChatText(
          client,
          `Correct usage: /vehicletimer <time>`
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
};

export default commands;
