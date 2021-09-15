const debug = require("debug")("zonepacketHandlers");
import { generateCommandList, zoneShutdown } from "../../../utils/utils";
import { ZoneClient } from "../zoneclient";
import { ZoneServer } from "../zoneserver";

const admin: any = {
  list: function (server: ZoneServer, client: ZoneClient, args: any[]) {
    const commandObject = this; // necessary tricks
    const commandList = generateCommandList(commandObject,"admin");
    commandList
          .sort((a: string, b: string) => a.localeCompare(b))
          .forEach((command: string) => {
            server.sendChatText(client, `${command}`);
          });
  },
  shutdown: async function (server: ZoneServer, client: ZoneClient, args: any[]) {
    const timeLeft = args[1] ? args[1] : 0;
    const message = args[2] ? args[2] : " ";
    const startedTime = Date.now();
    zoneShutdown(server, startedTime, timeLeft, message);
  },
};

export default admin;
