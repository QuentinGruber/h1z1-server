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
import { Vehicle2016 as Vehicle} from "../classes/vehicle";
import { ZoneClient2016 as Client} from "../classes/zoneclient";
import { ZoneServer2016 } from "../zoneserver";
import { Command, PermissionLevels } from "./types";

export const internalCommands: Array<Command> = [
  //#region DEFAULT PERMISSIONS
  {
    name: "respawn",
    permissionLevel: PermissionLevels.DEFAULT,
    execute: (
      server: ZoneServer2016, 
      client: Client, 
      packetData: any
    ) => {
      server.respawnPlayer(client);
    }
  },
  {
    name: "spectate",
    permissionLevel: PermissionLevels.ADMIN,
    execute: (
      server: ZoneServer2016, 
      client: Client, 
      packetData: any
    ) => {
      const characterId = server.generateGuid();
      const vehicle = new Vehicle(
        characterId,
        server.getTransientId(characterId),
        9371,
        client.character.state.position,
        client.character.state.lookAt,
        server.getGameTime()
      );
      server.worldObjectManager.createVehicle(server, vehicle);
      server.sendData(client, "AddLightweightVehicle", {
        ...vehicle,
        npcData: {
          ...vehicle,
          ...vehicle.state,
          actorModelId: vehicle.actorModelId,
        },
      });
      server.sendData(
        client,
        "LightweightToFullVehicle",
        vehicle.pGetFullVehicle()
      );
      server.mountVehicle(client, characterId);
      server.assignManagedObject(client, vehicle);
    }
  },
  {
    name: "run",
    permissionLevel: PermissionLevels.ADMIN,
    execute: (
      server: ZoneServer2016, 
      client: Client, 
      packetData: any
    ) => {
      server.sendData(client, "Command.RunSpeed", {
        runSpeed: packetData.runSpeed,
      });
    }
  },
]