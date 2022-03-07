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
import { ZoneClient as Client } from "../classes/zoneclient";
import { ZoneServer2015 } from "../zoneserver";

const admin: any = {
  list: function (server: ZoneServer2015, client: Client, args: any[]) {
    server.sendChatText(
      client,
      `/admin commands list: \n/admin ${Object.keys(this).join("\n/admin ")}`
    );
  },
  shutdown: async function (server: ZoneServer2015, client: Client, args: any[]) {
    const timeLeft = args[1] ? args[1] : 0;
    const message = args[2] ? args[2] : " ";
    const startedTime = Date.now();
    await zoneShutdown(server, startedTime, timeLeft, message);
  },
};

export default admin;
