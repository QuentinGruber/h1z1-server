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
};

export default admin;
