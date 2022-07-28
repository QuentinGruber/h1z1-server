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
const debug = require("debug")("zonepacketHandlers");
import { zoneShutdown } from "../../../utils/utils";
import { ZoneClient2016 as Client } from "../classes/zoneclient";
import { ZoneServer2016 } from "../zoneserver";

const admin: any = {
  list: function (server: ZoneServer2016, client: Client, args: any[]) {
    server.sendChatText(
      client,
      `/admin commands list: \n${Object.keys(this).join("\n")}`
    );
  },
  shutdown: async function (
    server: ZoneServer2016,
    client: Client,
    args: any[]
  ) {
    const timeLeft = args[1] ? args[1] : 0;
    const message = args[2] ? args[2] : " ";
    const startedTime = Date.now();
    await zoneShutdown(server, startedTime, timeLeft, message);
  },
  // respawnloot, respawnnpcs, respawnvehicles
  // lootrespawntime, npcrespawntime, vehiclerespawntime
  respawnloot: function (server: ZoneServer2016, client: Client, args: any[]) {
    server.worldObjectManager.createLoot(server);
    server.sendChatText(client, `Respawned loot`);
  },
  respawnnpcs: function (server: ZoneServer2016, client: Client, args: any[]) {
    server.worldObjectManager.createNpcs(server);
    server.sendChatText(client, `Respawned npcs`);
  },
  respawnvehicles: function (
    server: ZoneServer2016,
    client: Client,
    args: any[]
  ) {
    server.worldObjectManager.createVehicles(server);
    server.sendChatText(client, `Respawned vehicles`);
  },
  lootrespawntimer: function (
    server: ZoneServer2016,
    client: Client,
    args: any[]
  ) {
    if (!args[1]) {
      server.sendChatText(
        client,
        `Correct usage: /admin lootrespawntimer <time>`
      );
      return;
    }
    server.worldObjectManager.lootRespawnTimer = Number(args[1]);
    server.sendChatText(client, `Loot respawn timer set to ${Number(args[1])}`);
  },
  npcrespawntimer: function (
    server: ZoneServer2016,
    client: Client,
    args: any[]
  ) {
    if (!args[1]) {
      server.sendChatText(
        client,
        `Correct usage: /admin npcrespawntimer <time>`
      );
      return;
    }
    server.worldObjectManager.npcRespawnTimer = Number(args[1]);
    server.sendChatText(client, `Npc respawn timer set to ${Number(args[1])}`);
  },
  vehiclerespawntimer: function (
    server: ZoneServer2016,
    client: Client,
    args: any[]
  ) {
    if (!args[1]) {
      server.sendChatText(
        client,
        `Correct usage: /admin vehiclerespawntimer <time>`
      );
      return;
    }
    server.worldObjectManager.vehicleRespawnTimer = Number(args[1]);
    server.sendChatText(
      client,
      `Vehicle respawn timer set to ${Number(args[1])}`
    );
  },
  god: function (server: ZoneServer2016, client: Client, args: any[]) {
    server.setGodMode(client, !client.character.godMode);
    server.sendAlert(client, `Set godmode to ${client.character.godMode}`);
  },
  alert: function (server: ZoneServer2016, client: Client, args: any[]) {
    args.shift();
    server.sendAlertToAll(args.join(" "));
  },
  remover: function (server: ZoneServer2016, client: Client, args: any[]) {
    server.lootItem(client, server.generateItem(1776));
  },
  players: function (server: ZoneServer2016, client: Client, args: any[]) {
    server.sendChatText(
      client,
      `Players: ${Object.values(server._clients)
        .map((c) => {
          return `${c.character.name}: ${c.loginSessionId}`;
        })
        .join(", ")}`
    );
  },
  kick: function (server: ZoneServer2016, client: Client, args: any[]) {
    if (!args[1]) {
      server.sendChatText(client, "Missing guid (use /admin players)");
      return;
    }
    const targetClient = Object.values(server._clients).find((c) => {
      if (c.loginSessionId == args[1] || c.loginSessionId == args[1].slice(2)) {
        // in case "0x" is included
        return c;
      }
    });
    if (!targetClient) {
      server.sendChatText(client, "Client not found.");
      return;
    }
    const reason = args[2] ? args.slice(2).join(" ") : "Undefined";
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
      server.sendData(targetClient, "CharacterSelectSessionResponse", {
        status: 1,
        sessionId: targetClient.loginSessionId,
      });
    }, 2000);
  },
  savecharacters: function (server: ZoneServer2016, client: Client, args: any[]) {
    server.executeFuncForAllReadyClients((client: Client)=>server.worldDataManager.saveCharacterData(server, client));
    server.sendChatText(client, "Character data has been saved!");
  }
};

export default admin;
