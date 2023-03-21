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

const Z1_vehicles = require("../../../../data/2016/zoneData/Z1_vehicleLocations.json"),
  Z1_POIs = require("../../../../data/2016/zoneData/Z1_POIs"),
  spawnLocations2 = require("../../../../data/2016/zoneData/Z1_gridSpawns.json");

import { isInsideSquare, isPosInRadius, isPosInRadiusWithY } from "utils/utils";
import { SpawnCell } from "../classes/spawncell";
import { ZoneClient2016 as Client } from "../classes/zoneclient";
import { ConstructionDoor } from "../entities/constructiondoor";
import { ConstructionPermissionIds, Items } from "../models/enums";
import { ZoneServer2016 } from "../zoneserver";

export class ConstructionManager {
  sendConstructionData(server: ZoneServer2016, client: Client) {
    const unknownArray1 = [46, 45, 47, 48, 49, 50, 12, 7, 15],
      unknownArray2 = [...unknownArray1, 5, 10, 44, 57, 27, 2, 55, 56];

    server.sendData(client, "Construction.Unknown", {
      unknownArray1: unknownArray1.map((value) => {
        return { unknownDword1: value };
      }),

      /* this array affects certain items placed on direct
      ground ex. punji sticks, furnace, flare, etc
      */
      unknownArray2: unknownArray2.map((value) => {
        return { unknownDword1: value };
      }),
    });
  }


  placement(
    server: ZoneServer2016,
    client: Client,
    itemDefinitionId: number,
    modelId: number,
    position: Float32Array,
    rotation: Float32Array,
    parentObjectCharacterId: string,
    BuildingSlot: string
  ) {
    const item = client.character.getItemById(itemDefinitionId);
    if (!item) {
      server.sendData(client, "Construction.PlacementFinalizeResponse", {
        status: 1,
        unknownString1: "",
      });
      return;
    }
    const allowedItems = [Items.IED, Items.LANDMINE, Items.SNARE];
    // disallow construction stacking
    // world constructions may not be placed within 1 radius, this problem wont affect stuff inside any foundation
    let stackedDectector = false;
    if (
      !Number(parentObjectCharacterId) &&
      !allowedItems.includes(itemDefinitionId)
    ) {
      for (const a in server._worldSimpleConstruction) {
        const c = server._worldSimpleConstruction[a];
        const diff = Math.abs(c.state.position[1] - position[1]);
        if (
          isPosInRadiusWithY(1, c.state.position, position, 1.5) &&
          diff > 0.3
        ) {
          stackedDectector = true;
          break;
        }
      }
      for (const a in server._constructionSimple) {
        const c = server._constructionSimple[a];
        const diff = Math.abs(c.state.position[1] - position[1]);
        if (
          isPosInRadiusWithY(1, c.state.position, position, 1.5) &&
          diff > 0.3
        ) {
          stackedDectector = true;
          break;
        }
      }

      for (const a in server._lootableConstruction) {
        const c = server._lootableConstruction[a];
        const diff = Math.abs(c.state.position[1] - position[1]);
        if (
          isPosInRadiusWithY(1, c.state.position, position, 1.5) &&
          diff > 0.3
        ) {
          stackedDectector = true;
          break;
        }
      }
      for (const a in server._worldLootableConstruction) {
        const c = server._worldLootableConstruction[a];
        const diff = Math.abs(c.state.position[1] - position[1]);
        if (
          isPosInRadiusWithY(1, c.state.position, position, 1.5) &&
          diff > 0.3
        ) {
          stackedDectector = true;
          break;
        }
      }
      if (stackedDectector) {
        server.sendData(client, "Construction.PlacementFinalizeResponse", {
          status: 0,
          unknownString1: "",
        });
        server.sendAlert(
          client,
          "You cant stack that many constructions in one place"
        );
        return;
      }
    }
    if (item.itemDefinitionId == Items.GROUND_TAMPER) {
      // fix for tamper stacking
      let tampersInRadius = 0;
      for (const a in server._constructionFoundations) {
        const foundation = server._constructionFoundations[a];
        if (foundation.itemDefinitionId != Items.GROUND_TAMPER) continue;
        if (isPosInRadius(22, foundation.state.position, position))
          tampersInRadius++;
      }
      if (tampersInRadius >= 3) {
        server.sendData(client, "Construction.PlacementFinalizeResponse", {
          status: 0,
          unknownString1: "",
        });
        server.sendAlert(client, "You cant place a ground tamper here");
        return;
      }
    }
    if (
      item.itemDefinitionId != Items.GROUND_TAMPER &&
      item.itemDefinitionId != Items.FOUNDATION &&
      item.itemDefinitionId != Items.FOUNDATION_EXPANSION &&
      !isPosInRadius(30, client.character.state.position, position)
    ) {
      server.sendData(client, "Construction.PlacementFinalizeResponse", {
        status: 0,
        unknownString1: "",
      });
      server.sendAlert(
        client,
        "You have to be in 30m radius of placed construction position"
      );
      return;
    }

    // for construction entities that don't have a parentObjectCharacterId from the client
    let freeplaceParentCharacterId = "";

    let isInFoundation = false;
    for (const a in server._constructionFoundations) {
      const iteratedFoundation = server._constructionFoundations[a];
      const permissions =
        iteratedFoundation.permissions[client.character.characterId];
      if (!permissions || !permissions.build) continue;
      if (iteratedFoundation.characterId == parentObjectCharacterId) {
        isInFoundation = true;
        break;
      }
      if (iteratedFoundation.bounds) {
        if (iteratedFoundation.isInside(position)) isInFoundation = true;
      }
    }
    let isInsidePermissionedFoundation = false;
    for (const a in server._constructionFoundations) {
      const iteratedFoundation = server._constructionFoundations[a];
      if (
        iteratedFoundation.bounds &&
        iteratedFoundation.getHasPermission(
          server,
          client.character.characterId,
          ConstructionPermissionIds.BUILD
        )
      ) {
        if (
          iteratedFoundation.isInside(position) ||
          (iteratedFoundation.characterId == parentObjectCharacterId &&
            isPosInRadius(20, iteratedFoundation.state.position, position))
        )
          isInsidePermissionedFoundation = true;
      }
      for (const c in iteratedFoundation.occupiedWallSlots) {
        const wall = iteratedFoundation.occupiedWallSlots[c];
        if (wall instanceof ConstructionDoor) continue;
        if (
          wall.characterId == parentObjectCharacterId &&
          isPosInRadius(
            1,
            wall.fixedPosition ? wall.fixedPosition : wall.state.position,
            position
          )
        ) {
          isInsidePermissionedFoundation = true;
        }
      }
      for (const b in iteratedFoundation.occupiedShelterSlots) {
        const shelter = iteratedFoundation.occupiedShelterSlots[b];
        if (
          (shelter.characterId == parentObjectCharacterId &&
            isPosInRadius(
              10,
              shelter.fixedPosition
                ? shelter.fixedPosition
                : shelter.state.position,
              position
            )) ||
          (shelter.bounds && shelter.isInside(position))
        ) {
          isInsidePermissionedFoundation = true;
        }
        for (const b in shelter.occupiedShelterSlots) {
          const upperShelter = shelter.occupiedShelterSlots[b];
          if (
            (upperShelter.characterId == parentObjectCharacterId &&
              isPosInRadius(10, upperShelter.state.position, position)) ||
            (upperShelter.bounds && upperShelter.isInside(position))
          ) {
            isInsidePermissionedFoundation = true;
          }
        }
      }
    }

    for (const a in server._constructionFoundations) {
      const foundation = server._constructionFoundations[a];
      let allowBuild = false;
      const permissions = foundation.permissions[client.character.characterId];
      if (permissions && permissions.build) allowBuild = true;
      if (
        !isInFoundation &&
        isPosInRadius(
          foundation.itemDefinitionId === Items.FOUNDATION ||
            foundation.itemDefinitionId === Items.GROUND_TAMPER
            ? 70
            : 20,
          position,
          foundation.state.position
        ) &&
        allowBuild === false &&
        !allowedItems.includes(itemDefinitionId) &&
        !isInsidePermissionedFoundation
      ) {
        server.sendAlert(
          client,
          "You may not place this object this close to another players foundation"
        );
        server.sendData(client, "Construction.PlacementFinalizeResponse", {
          status: 0,
          unknownString1: "",
        });
        return;
      }

      // for construction entities that don't have a parentObjectCharacterId from the client
      if (!Number(parentObjectCharacterId)) {
        if (foundation.isInside(position)) {
          freeplaceParentCharacterId = foundation.characterId;
        }
        // check if inside a shelter even if not inside foundation (large shelters can extend it)
        Object.values(foundation.occupiedShelterSlots).forEach((shelter) => {
          if (shelter.isInside(position)) {
            freeplaceParentCharacterId = shelter.characterId;
          }
          if (!Number(freeplaceParentCharacterId)) {
            // check upper shelters if its not in lower ones
            Object.values(shelter.occupiedShelterSlots).forEach(
              (upperShelter) => {
                if (upperShelter.isInside(position)) {
                  freeplaceParentCharacterId = upperShelter.characterId;
                }
              }
            );
          }
        });
      }
    }
    // block building around spawn points
    let isInSpawnPoint = false;
    spawnLocations2.forEach((point: Float32Array) => {
      if (isPosInRadius(25, position, point)) isInSpawnPoint = true;
    });
    if (
      isInSpawnPoint &&
      !isInsidePermissionedFoundation &&
      !allowedItems.includes(itemDefinitionId)
    ) {
      server.sendData(client, "Construction.PlacementFinalizeResponse", {
        status: 0,
        unknownString1: "",
      });
      server.sendAlert(
        client,
        "You may not place this object this close to a spawn point"
      );
      return;
    }
    // block building near vehicle spawn
    let isInVehicleSpawnPoint = false;
    Z1_vehicles.forEach((vehicleSpawn: any) => {
      if (isPosInRadius(30, position, vehicleSpawn.position))
        isInVehicleSpawnPoint = true;
    });
    if (
      isInVehicleSpawnPoint &&
      !isInsidePermissionedFoundation &&
      !allowedItems.includes(itemDefinitionId)
    ) {
      server.sendData(client, "Construction.PlacementFinalizeResponse", {
        status: 0,
        unknownString1: "",
      });
      server.sendAlert(
        client,
        "You may not place this object this close to a vehicle spawn point"
      );
      return;
    }
    // block building out of map bounds
    let inMapBounds: boolean = false;
    server._spawnGrid.forEach((cell: SpawnCell) => {
      if (
        position[0] >= cell.position[0] - cell.width / 2 &&
        position[0] <= cell.position[0] + cell.width / 2 &&
        position[2] >= cell.position[2] - cell.height / 2 &&
        position[2] <= cell.position[2] + cell.height / 2
      ) {
        inMapBounds = true;
      }
    });

    if (!inMapBounds) {
      server.sendData(client, "Construction.PlacementFinalizeResponse", {
        status: 0,
        unknownString1: "",
      });
      server.sendAlert(
        client,
        "You may not place this object this close to edge of the map"
      );
      return;
    }

    // block building in cities
    const allowedPoiPlacement = [Items.LANDMINE, Items.IED, Items.SNARE];
    if (!allowedPoiPlacement.includes(itemDefinitionId)) {
      let isInPoi = false;
      let useRange = true;
      Z1_POIs.forEach((point: any) => {
        if (point.bounds) {
          useRange = false;
          point.bounds.forEach((bound: any) => {
            if (isInsideSquare([position[0], position[2]], bound)) {
              isInPoi = true;
              return;
            }
          });
        }
        if (useRange && isPosInRadius(point.range, position, point.position))
          isInPoi = true;
      });
      // alow placement in poi if object is parented to a foundation
      if (isInPoi && !isInsidePermissionedFoundation) {
        server.sendData(client, "Construction.PlacementFinalizeResponse", {
          status: 0,
          unknownString1: "",
        });
        server.sendAlert(
          client,
          "You may not place this object this close to a town or point of interest."
        );
        return;
      }
    }
    if (
      !server.handleConstructionPlacement(
        client,
        itemDefinitionId,
        modelId,
        position,
        rotation,
        parentObjectCharacterId,
        BuildingSlot,
        freeplaceParentCharacterId
      )
    ) {
      server.sendData(client, "Construction.PlacementFinalizeResponse", {
        status: 0,
        unknownString1: "",
      });
      return;
    }

    server.removeInventoryItem(client, item);
    server.sendData(client, "Construction.PlacementFinalizeResponse", {
      status: 1,
      unknownString1: "",
    });
    server.constructionPermissionsManager(client);
  }










}