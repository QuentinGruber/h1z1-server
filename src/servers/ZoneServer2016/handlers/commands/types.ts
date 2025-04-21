// ======================================================================
//
//   GNU GENERAL PUBLIC LICENSE
//   Version 3, 29 June 2007
//   copyright (C) 2020 - 2021 Quentin Gruber
//   copyright (C) 2021 - 2025 H1emu community
//
//   https://github.com/QuentinGruber/h1z1-server
//   https://www.npmjs.com/package/h1z1-server
//
//   Based on https://github.com/psemu/soe-network
// ======================================================================

import { ZoneClient2016 as Client } from "../../classes/zoneclient";
import { ZoneServer2016 } from "../../zoneserver";

export enum PermissionLevels {
  DEFAULT = 0,
  MODERATOR = 1,
  ADMIN = 2,
  DEV = 3
}

export interface Command {
  name: string;
  description?: string;
  permissionLevel: PermissionLevels;
  keepCase?: boolean;
  execute: (
    server: ZoneServer2016,
    client: Client,
    args: Array<string>
  ) => void;
}

export interface InternalCommand {
  name: string;
  description?: string;
  permissionLevel: PermissionLevels;
  keepCase?: boolean;
  execute: (server: ZoneServer2016, client: Client, packetData: object) => void;
}
