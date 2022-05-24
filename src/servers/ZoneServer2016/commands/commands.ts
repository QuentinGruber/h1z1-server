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
};

export default commands;
