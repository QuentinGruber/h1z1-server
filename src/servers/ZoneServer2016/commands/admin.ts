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
    zoneShutdown(server, startedTime, timeLeft, message);
  },
};

export default admin;
