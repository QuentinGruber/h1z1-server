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
import { VehicleIds } from "../models/enums";
import { Vehicle2016 as Vehicle, Vehicle2016 } from "../entities/vehicle";
import { SpawnCell } from "../classes/spawncell";
import { ZoneClient2016 as Client } from "../classes/zoneclient";
import { ZoneServer2016 } from "../zoneserver";
import { Command, PermissionLevels } from "./types";
import { getAngle, isPosInRadius } from "../../../utils/utils";
import { OBSERVER_GUID } from "../../../utils/constants";

export const internalCommands: Array<Command> = [
  //#region DEFAULT PERMISSIONS
  {
    name: "respawn",
    permissionLevel: PermissionLevels.DEFAULT,
    execute: (server: ZoneServer2016, client: Client, packetData: any) => {
      let doReturn = false;
      server._spawnGrid.forEach((cell: SpawnCell) => {
        if (doReturn) return;
        if (isPosInRadius(50, cell.position, packetData.gridPosition)) {
          server.respawnPlayer(client, cell);
          doReturn = true;
        }
      });
    },
  },
  {
    name: "spectate",
    permissionLevel: PermissionLevels.MODERATOR,
    execute: (server: ZoneServer2016, client: Client, packetData: any) => {
      client.character.isSpectator = !client.character.isSpectator;
      if (client.character.isSpectator) {
        const vehicle = new Vehicle(
          OBSERVER_GUID,
          1,
          9371,
          client.character.state.position,
          client.character.state.lookAt,
          server,
          server.getGameTime(),
          VehicleIds.SPECTATE
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
        server.sendData(client, "Spectator.Enable", {});
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
      } else {
        server.sendData(client, "Mount.DismountResponse", {
          characterId: client.character.characterId,
        });
        server.sendData(client, "Character.RemovePlayer", {
          characterId: OBSERVER_GUID,
        });
        for (const a in server._decoys) {
          const decoy = server._decoys[a];
          if (decoy.transientId == client.character.transientId) {
            server.sendDataToAll("Character.RemovePlayer", {
              characterId: decoy.characterId,
            });
            client.isDecoy = false;
            server.sendChatText(client, `Decoy removed`, false);
          }
        }
        return;
      }
      server.sendAlert(
        client,
        `Set spectate/vanish state to ${client.character.isSpectator}`
      );
    },
  },
  {
    name: "run",
    permissionLevel: PermissionLevels.MODERATOR,
    execute: (server: ZoneServer2016, client: Client, packetData: any) => {
      server.sendData(client, "Command.RunSpeed", {
        runSpeed: packetData.runSpeed,
      });
    },
  },
  {
    name: "vehicle",
    permissionLevel: PermissionLevels.ADMIN,
    execute: (server: ZoneServer2016, client: Client, packetData: any) => {
      const allowedIds = [
        VehicleIds.POLICECAR,
        VehicleIds.PICKUP,
        VehicleIds.ATV,
        VehicleIds.OFFROADER,
      ];
      if (!allowedIds.includes(packetData.vehicleId)) {
        server.sendChatText(
          client,
          "[ERROR] Invalid vehicleId, please choose one of listed below:"
        );
        server.sendChatText(
          client,
          `OFFROADER: ${VehicleIds.OFFROADER}, PICKUP: ${VehicleIds.PICKUP}, POLICECAR: ${VehicleIds.POLICECAR}, ATV: ${VehicleIds.ATV}`
        );
        return;
      }
      const characterId = server.generateGuid();
      const vehicle = new Vehicle2016(
        characterId,
        server.getTransientId(characterId),
        0,
        packetData.position,
        client.character.state.lookAt,
        server,
        server.getGameTime(),
        packetData.vehicleId
      );
      server.worldObjectManager.createVehicle(server, vehicle);
      client.character.ownedVehicle = vehicle.characterId;
    },
  },
];
