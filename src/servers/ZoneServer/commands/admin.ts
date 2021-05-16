const debug = require("debug")("zonepacketHandlers");
import { Client } from "types/zoneserver";
import { ZoneServer } from "../zoneserver";
const admin: any = {
  shutdown: async function (server: ZoneServer, client: Client, args: any[]) {
    server.sendDataToAll("WorldShutdownNotice", {
      timeLeft: 0,
      message: " ",
    });
    if (!server._soloMode) {
      server.sendDataToAll("CharacterSelectSessionResponse", {
        status: 1,
        sessionId: "placeholder", // TODO: get sessionId from client object
      });
      await server.saveWorld();
      process.exit(0);
    }
  },
};

export default admin;
