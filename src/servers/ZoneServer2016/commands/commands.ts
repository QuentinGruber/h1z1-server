import { _ } from "../../../utils/utils";
import { ZoneClient2016 as Client} from "../classes/zoneclient";
import { ZoneServer2016 } from "../zoneserver";
import admin from "./admin";
import hax from "./hax";
import { Command, PermissionLevels } from "./types";

export const commands: Array<Command> = [
  {
    name: "me",
    permissionLevel: PermissionLevels.DEFAULT,
    execute: (
      server: ZoneServer2016, 
      client: Client, 
      packet: any
    ) => {
      server.sendChatText(client, `ZoneClientId :${client.loginSessionId}`);
    }
  },
  {
    name: "respawn",
    permissionLevel: PermissionLevels.DEFAULT,
    execute: (
      server: ZoneServer2016, 
      client: Client, 
      packet: any
    ) => {
      server.respawnPlayer(client);
    }
  },
  {
    name: "clientinfo",
    permissionLevel: PermissionLevels.DEFAULT,
    execute: (
      server: ZoneServer2016, 
      client: Client, 
      packet: any
    ) => {
      server.sendChatText(
        client,
        `Spawned entities count : ${client.spawnedEntities.length}`
      );
    }
  },
  {
    name: "serverinfo",
    permissionLevel: PermissionLevels.DEFAULT,
    execute: (
      server: ZoneServer2016, 
      client: Client, 
      packet: any
    ) => {
      const args: string[] = packet.data.arguments.toLowerCase().split(" "),
      commandName = args[0];
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
          _props: props,
        } = server;
        const serverVersion = require("../../../package.json").version;
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
    }
  },
  {
    name: "spawninfo",
    permissionLevel: PermissionLevels.DEFAULT,
    execute: (
      server: ZoneServer2016, 
      client: Client, 
      packet: any
    ) => {
      server.sendChatText(
        client,
        `You spawned at "${client.character.spawnLocation}"`,
        true
      );
    }
  },
  {
    name: "netstats",
    permissionLevel: PermissionLevels.DEFAULT,
    execute: (
      server: ZoneServer2016, 
      client: Client, 
      packet: any
    ) => {
      const soeClient = server.getSoeClient(client.soeClientId);
      if (soeClient) {
        const stats = soeClient.getNetworkStats();
        stats.push(`Ping: ${client.avgPing}ms`);
        for (let index = 0; index < stats.length; index++) {
          const stat = stats[index];
          server.sendChatText(client, stat, index == 0);
        }
      }
    }
  },
  {
    name: "location",
    permissionLevel: PermissionLevels.DEFAULT,
    execute: (
      server: ZoneServer2016, 
      client: Client, 
      packet: any
    ) => {
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
  {
    name: "combatlog",
    permissionLevel: PermissionLevels.DEFAULT,
    execute: (
      server: ZoneServer2016, 
      client: Client, 
      packet: any
    ) => {
      server.combatLog(client);
    }
  },

  





  {
    name: "hax",
    permissionLevel: PermissionLevels.DEV,
    execute: (
      server: ZoneServer2016, 
      client: Client, 
      packet: any
    ) => {
      const args: string[] = packet.data.arguments.toLowerCase().split(" ");
      const commandName = args[0];
      if (!!hax[commandName]) {
        if (
          client.isAdmin ||
          commandName === "list" ||
          server._allowedCommands.length === 0 ||
          server._allowedCommands.includes(commandName)
        ) {
          hax[commandName](server, client, args);
        } else {
          server.sendChatText(client, "You don't have access to that.");
        }
      } else {
        server.sendChatText(
          client,
          `Unknown command: "/hax ${commandName}", display hax all commands by using "/hax list"`
        );
      }
    }
  },
  {
    name: "dev",
    permissionLevel: PermissionLevels.DEV,
    execute: (
      server: ZoneServer2016, 
      client: Client, 
      packet: any
    ) => {
      const args: string[] = packet.data.arguments.toLowerCase().split(" ");
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
    name: "admin",
    permissionLevel: PermissionLevels.ADMIN,
    execute: (
      server: ZoneServer2016, 
      client: Client, 
      packet: any
    ) => {
      const args: string[] = packet.data.arguments.toLowerCase().split(" ");
      const commandName = args[0];
      if (!!admin[commandName]) {
        if (
          client.isAdmin ||
          commandName === "list" ||
          server._allowedCommands.length === 0 ||
          server._allowedCommands.includes(commandName)
        ) {
          admin[commandName](server, client, args);
        } else {
          server.sendChatText(client, "You don't have access to that.");
        }
      } else {
        server.sendChatText(
          client,
          `Unknown command: "/admin ${commandName}", display admin all commands by using "/admin list"`
        );
      }
    }
  },
]