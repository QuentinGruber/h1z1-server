const debug = require("debug")("zonepacketHandlers");
import { zoneShutdown } from "../../../utils/utils";
import { ZoneClient as Client} from "../zoneclient";
import { ZoneServer } from "../zoneserver";

const admin: any = {
  list: function (server: ZoneServer, client: Client, args: any[]) {
    server.sendChatText(
      client,
      `/admin commands list: \n/admin ${Object.keys(this).join("\n/admin ")}`
    );
  },
  shutdown: async function (server: ZoneServer, client: Client, args: any[]) {
    const timeLeft = args[1] ? args[1] : 0;
    const message = args[2] ? args[2] : " ";
    const startedTime = Date.now();
    zoneShutdown(server, startedTime, timeLeft, message);
  },
};

export default admin;
