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
import { _ } from "../../../utils/utils";
import { joaat } from "h1emu-core";

const debug = require("debug")("zonepacketHandlers");


const commands: any = {// PERMISSIONLEVEL 0 = ANYONE, 1 = ADMIN FOR NOW
  list: {
    permissionLevel: 0,
    function: function (server: ZoneServer2016, client: Client, args: any[]) {
      server.sendChatText(
        client,
        `/hax commands list: \n/hax ${Object.keys(this).join("\n/hax ")}`
      );
    }
  },
  me: {
    permissionLevel: 0,
    function: function (server: ZoneServer2016, client: Client, args: any[]) {
      server.sendChatText(client, `ZoneClientId :${client.loginSessionId}`);
    }
  },
  respawn: {
    permissionLevel: 0,
    function: function (server: ZoneServer2016, client: Client, args: any[]) {
      server.killCharacter(client);
    }
  },
  location: {
    permissionLevel: 0,
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
    permissionLevel: 0,
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
    permissionLevel: 0,
    function: function (server: ZoneServer2016, client: Client, args: any[]) {
      server.sendChatText(
        client,
        `Spawned entities count : ${client.spawnedEntities.length}`
      );
    }
  },
  spawninfo: {
    permissionLevel: 0,
    function: function (server: ZoneServer2016, client: Client, args: any[]) {
      server.sendChatText(
        client,
        `You spawned at "${client.character.spawnLocation}"`,
        true
      );
    }
  },
  help: {
    permissionLevel: 0,
    function: function (server: ZoneServer2016, client: Client, args: any[]) {
      server.killCharacter(client);
    }
  },
  netstats: {
    permissionLevel: 0,
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
};

export default commands;
