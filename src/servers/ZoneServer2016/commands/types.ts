import { ZoneClient2016 as Client } from "../classes/zoneclient";
import { ZoneServer2016 } from "../zoneserver";

export enum PermissionLevels {
  DEFAULT = 0,
  MODERATOR = 1,
  ADMIN = 2,
  DEV = 3,
}

export interface Command {
  name: string;
  permissionLevel: PermissionLevels;
  execute: (server: ZoneServer2016, client: Client, packet: any) => void;
}
