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
    server.sendChatText(
      client,
      `Respawned loot`
    );
  },
  respawnnpcs: function (server: ZoneServer2016, client: Client, args: any[]) {
    server.worldObjectManager.createNpcs(server);
    server.sendChatText(
      client,
      `Respawned npcs`
    );
  },
  respawnvehicles: function (server: ZoneServer2016, client: Client, args: any[]) {
    server.worldObjectManager.createVehicles(server);
    server.sendChatText(
      client,
      `Respawned vehicles`
    );
  }
};

export default admin;
