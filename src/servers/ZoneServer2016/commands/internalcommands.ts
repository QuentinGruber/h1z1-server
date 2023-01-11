// ======================================================================
//
//   GNU GENERAL PUBLIC LICENSE
//   Version 3, 29 June 2007
//   copyright (C) 2020 - 2021 Quentin Gruber
//   copyright (C) 2021 - 2023 H1emu community
//
//   https://github.com/QuentinGruber/h1z1-server
//   https://www.npmjs.com/package/h1z1-server
//
//   Based on https://github.com/psemu/soe-network
// ======================================================================

/* eslint-disable @typescript-eslint/no-unused-vars */
import { Vehicle2016 as Vehicle } from "../classes/vehicle";
import { ZoneClient2016 as Client } from "../classes/zoneclient";
import { ZoneServer2016 } from "../zoneserver";
import { Command, PermissionLevels } from "./types";

export const internalCommands: Array<Command> = [
  //#region DEFAULT PERMISSIONS
  {
    name: "respawn",
    permissionLevel: PermissionLevels.DEFAULT,
    execute: (server: ZoneServer2016, client: Client, packetData: any) => {
      server.respawnPlayer(client);
    },
  },
  {
    name: "spectate",
    permissionLevel: PermissionLevels.ADMIN,
    execute: (server: ZoneServer2016, client: Client, packetData: any) => {
      client.character.isSpectator = true;
      const characterId = server.generateGuid();
      const vehicle = new Vehicle(
        characterId,
        server.getTransientId(characterId),
        9371,
        client.character.state.position,
        client.character.state.lookAt,
        server.getGameTime()
      );
      for (const a in server._clients) {
        const iteratedClient = server._clients[a];
        if (iteratedClient.spawnedEntities.includes(client.character)) {
          server.sendData(iteratedClient, "Character.RemovePlayer", {
            characterId: client.character.characterId,
          });
          iteratedClient.spawnedEntities.splice(
            iteratedClient.spawnedEntities.indexOf(client.character),
            1
          );
        }
      }
      server.sendData(client, "SpectatorBase", {});
      server.sendData(client, "AddLightweightVehicle", {
        ...vehicle,
        npcData: {
          ...vehicle,
          ...vehicle.state,
          actorModelId: vehicle.actorModelId,
        },
      });
      server.sendData(client, "Mount.MountResponse", {
        characterId: client.character.characterId,
        vehicleGuid: vehicle.characterId,
        seatId: 0,
        isDriver: 1,
        identity: {},
      });
      server.sendData(client, "Character.ManagedObject", {
        objectCharacterId: vehicle.characterId,
        characterId: client.character.characterId,
      });
      server.sendData(client, "ClientUpdate.ManagedObjectResponseControl", {
        control: true,
        objectCharacterId: vehicle.characterId,
      });
    },
  },
  {
    name: "run",
    permissionLevel: PermissionLevels.ADMIN,
    execute: (server: ZoneServer2016, client: Client, packetData: any) => {
      server.sendData(client, "Command.RunSpeed", {
        runSpeed: packetData.runSpeed,
      });
    },
  },
];
