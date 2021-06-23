const debug = require("debug")("zonepacketHandlers");
import { Client } from "types/zoneserver";
import { zoneShutdown } from "../../../utils/utils";
import { ZoneServer } from "../zoneserver";


const admin: any = {
  shutdown: async function (server: ZoneServer, client: Client, args: any[]) {
    const timeLeft = args[1] ? args[1] : 0;
    const message = args[2] ? args[2] : " ";
    const startedTime = Date.now();
    zoneShutdown(server, startedTime, timeLeft, message);
  },
};

export default admin;
