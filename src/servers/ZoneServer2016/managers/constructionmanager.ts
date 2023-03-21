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

import { ConstructionEntity } from "types/zoneserver";
import { eul2quat, getConstructionSlotId, isInsideSquare, isPosInRadius, isPosInRadiusWithY } from "../../../utils/utils";
import { BaseItem } from "../classes/baseItem";
import { SpawnCell } from "../classes/spawncell";
import { ZoneClient2016 as Client } from "../classes/zoneclient";
import { ConstructionChildEntity } from "../entities/constructionchildentity";
import { ConstructionDoor } from "../entities/constructiondoor";
import { ConstructionParentEntity } from "../entities/constructionparententity";
import { ExplosiveEntity } from "../entities/explosiveentity";
import { LootableConstructionEntity } from "../entities/lootableconstructionentity";
import { Plant } from "../entities/plant";
import { PlantingDiameter } from "../entities/plantingdiameter";
import { TemporaryEntity } from "../entities/temporaryentity";
import { TrapEntity } from "../entities/trapentity";
import { ConstructionErrors, ConstructionPermissionIds, Items, StringIds } from "../models/enums";
import { ZoneServer2016 } from "../zoneserver";

export class ConstructionManager {
  allowPOIPlacement!: boolean;
  allowStackedPlacement!: boolean;
  allowOutOfBoundsPlacement!: boolean;
  placementRange!: number;
  spawnPointBlockedPlacementRange!: number;
  vehicleSpawnPointBlockedPlacementRange!: number;
  playerFoundationBlockedPlacementRange!: number;
  playerShackBlockedPlacementRange!: number;
  overridePlacementItems: Array<number> = [Items.IED, Items.LANDMINE, Items.SNARE];

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

  sendPlacementFinalize(server: ZoneServer2016, client: Client, status: 0 | 1) {
    server.sendData(client, "Construction.PlacementFinalizeResponse", {
      status: status,
      unknownString1: "",
    });
  }

  placementError(server: ZoneServer2016, client: Client, error: ConstructionErrors) {
    server.sendAlert(client, `Construction Error: ${error}`);
  }

  detectStackedPlacement(server: ZoneServer2016, client: Client, parentObjectCharacterId: string, position: Float32Array, itemDefinitionId: number): boolean {
    if(this.allowStackedPlacement) return false;
    if (
      !Number(parentObjectCharacterId) &&
      !this.overridePlacementItems.includes(itemDefinitionId)
    ) {
      for (const a in server._worldSimpleConstruction) {
        const c = server._worldSimpleConstruction[a];
        const diff = Math.abs(c.state.position[1] - position[1]);
        if (
          isPosInRadiusWithY(1, c.state.position, position, 1.5) &&
          diff > 0.3
        ) {
          return true;
        }
      }
      for (const a in server._constructionSimple) {
        const c = server._constructionSimple[a];
        const diff = Math.abs(c.state.position[1] - position[1]);
        if (
          isPosInRadiusWithY(1, c.state.position, position, 1.5) &&
          diff > 0.3
        ) {
          return true;
        }
      }

      for (const a in server._lootableConstruction) {
        const c = server._lootableConstruction[a];
        const diff = Math.abs(c.state.position[1] - position[1]);
        if (
          isPosInRadiusWithY(1, c.state.position, position, 1.5) &&
          diff > 0.3
        ) {
          return true;
        }
      }
      for (const a in server._worldLootableConstruction) {
        const c = server._worldLootableConstruction[a];
        const diff = Math.abs(c.state.position[1] - position[1]);
        if (
          isPosInRadiusWithY(1, c.state.position, position, 1.5) &&
          diff > 0.3
        ) {
          return true;
        }
      }
    }
    return false;
  }

  detectStackedTamperPlacement(server: ZoneServer2016, item: BaseItem, position: Float32Array): boolean {
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
        return true;
      }
    }
    return false;
  }

  detectOutOfRange(client: Client, item: BaseItem, position: Float32Array): boolean {
    if(!this.placementRange) return false;
    if (
      item.itemDefinitionId != Items.GROUND_TAMPER &&
      item.itemDefinitionId != Items.FOUNDATION &&
      item.itemDefinitionId != Items.FOUNDATION_EXPANSION &&
      !isPosInRadius(this.placementRange, client.character.state.position, position)
    ) {
      return true;
    }
    return false;
  }

  detectSpawnPointPlacement(itemDefinitionId: number, position: Float32Array, isInsidePermissionedFoundation: boolean): boolean {
    if(!this.spawnPointBlockedPlacementRange) return false;
    let isInSpawnPoint = false;
    spawnLocations2.forEach((point: Float32Array) => {
      if (isPosInRadius(this.spawnPointBlockedPlacementRange, position, point)) isInSpawnPoint = true;
    });
    if (
      isInSpawnPoint &&
      !isInsidePermissionedFoundation &&
      !this.overridePlacementItems.includes(itemDefinitionId)
    ) {
      return true;
    }
    return false;
  }

  detectVehicleSpawnPointPlacement(itemDefinitionId: number, position: Float32Array, isInsidePermissionedFoundation: boolean): boolean {
    if(!this.vehicleSpawnPointBlockedPlacementRange) return false;
    let isInVehicleSpawnPoint = false;
    Z1_vehicles.forEach((vehicleSpawn: any) => {
      if (isPosInRadius(this.vehicleSpawnPointBlockedPlacementRange, position, vehicleSpawn.position))
        isInVehicleSpawnPoint = true;
    });
    if (
      isInVehicleSpawnPoint &&
      !isInsidePermissionedFoundation &&
      !this.overridePlacementItems.includes(itemDefinitionId)
    ) {
      
      return true;
    }
    return false;
  }

  detectOutOfBoundsPlacement(server: ZoneServer2016, position: Float32Array): boolean {
    if(this.allowOutOfBoundsPlacement) return false;
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
      return true;
    }
    return false;
  }

  detectPOIPlacement(itemDefinitionId: number, position: Float32Array, isInsidePermissionedFoundation: boolean): boolean {
    if(this.allowPOIPlacement) return false;
    if (this.overridePlacementItems.includes(itemDefinitionId)) return false;
    let isInPoi = false,
    useRange = true;
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
      return true;
    }
    return false;
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
      this.sendPlacementFinalize(server, client, 1);
      return;
    }

    // disallow construction stacking
    // world constructions may not be placed within 1 radius, this problem wont affect stuff inside any foundation
    if(this.detectStackedPlacement(server, client, parentObjectCharacterId, position, itemDefinitionId)) {
      this.sendPlacementFinalize(server, client, 0);
      this.placementError(server, client, ConstructionErrors.STACKED);
      return;
    }

    if(this.detectStackedTamperPlacement(server, item, position)) {
      this.sendPlacementFinalize(server, client, 0);
      this.placementError(server, client, ConstructionErrors.STACKED);
      return;
    }

    if(this.detectOutOfRange(client, item, position)) {
      this.sendPlacementFinalize(server, client, 0);
      this.placementError(server, client, ConstructionErrors.OUT_OF_RANGE);
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
            ? this.playerFoundationBlockedPlacementRange
            : this.playerShackBlockedPlacementRange,
          position,
          foundation.state.position
        ) &&
        allowBuild === false &&
        !this.overridePlacementItems.includes(itemDefinitionId) &&
        !isInsidePermissionedFoundation
      ) {
        server.sendAlert(
          client,
          "You may not place this object this close to another players foundation"
        );
        this.sendPlacementFinalize(server, client, 0);
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

    if(this.detectSpawnPointPlacement(itemDefinitionId, position, isInsidePermissionedFoundation)) {
      this.sendPlacementFinalize(server, client, 0);
      server.sendAlert(
        client,
        "You may not place this object this close to a spawn point"
      );
      return;
    }

    if(this.detectVehicleSpawnPointPlacement(itemDefinitionId, position, isInsidePermissionedFoundation)) {
      this.sendPlacementFinalize(server, client, 0);
      server.sendAlert(
        client,
        "You may not place this object this close to a vehicle spawn point"
      );
      return;
    }

    if(this.detectOutOfBoundsPlacement(server, position)) {
      this.sendPlacementFinalize(server, client, 0);
      server.sendAlert(
        client,
        "You may not place this object this close to edge of the map"
      );
      return;
    }

    if(this.detectPOIPlacement(itemDefinitionId, position, isInsidePermissionedFoundation)) {
      this.sendPlacementFinalize(server, client, 0);
      server.sendAlert(
        client,
        "You may not place this object this close to a town or point of interest."
      );
      return;
    }

    if (
      !this.handleConstructionPlacement(
        server,
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
      this.sendPlacementFinalize(server, client, 0);
      return;
    }

    server.removeInventoryItem(client, item);
    this.sendPlacementFinalize(server, client, 1);
    server.constructionPermissionsManager(client);
  }

  handleConstructionPlacement(
    server: ZoneServer2016,
    client: Client,
    itemDefinitionId: number,
    modelId: number,
    position: Float32Array,
    rotation: Float32Array,
    parentObjectCharacterId: string,
    BuildingSlot: string,
    freeplaceParentCharacterId?: string
  ): boolean {
    switch (itemDefinitionId) {
      case Items.SNARE:
      case Items.PUNJI_STICKS:
        return this.placeTrap(server, itemDefinitionId, modelId, position, rotation);
      case Items.FLARE:
        return this.placeTemporaryEntity(
          server,
          modelId,
          position,
          eul2quat(rotation),
          900000
        );
      case Items.IED:
      case Items.LANDMINE:
        return this.placeExplosiveEntity(
          server,
          itemDefinitionId,
          modelId,
          position,
          eul2quat(rotation)
        );
      case Items.METAL_GATE:
      case Items.DOOR_BASIC:
      case Items.DOOR_WOOD:
      case Items.DOOR_METAL:
        return this.placeConstructionDoor(
          server,
          client,
          itemDefinitionId,
          modelId,
          parentObjectCharacterId,
          BuildingSlot
        );
      case Items.SHACK_SMALL:
        return false;
      case Items.GROUND_TAMPER:
      case Items.SHACK_BASIC:
      case Items.SHACK:
      case Items.FOUNDATION:
      case Items.FOUNDATION_EXPANSION:
        return this.placeConstructionFoundation(
          server,
          client,
          itemDefinitionId,
          modelId,
          position,
          rotation,
          parentObjectCharacterId,
          BuildingSlot
        );
      case Items.FOUNDATION_RAMP:
        return this.placeConstructionRamp(
          server,
          client,
          itemDefinitionId,
          modelId,
          parentObjectCharacterId,
          BuildingSlot
        );
      case Items.FOUNDATION_STAIRS:
        return this.placeConstructionStairs(
          server,
          client,
          itemDefinitionId,
          modelId,
          rotation,
          parentObjectCharacterId,
          BuildingSlot
        );
      case Items.STORAGE_BOX:
        return this.placeLootableConstruction(
          server,
          itemDefinitionId,
          modelId,
          position,
          eul2quat(rotation),
          freeplaceParentCharacterId
        );
      case Items.FURNACE:
      case Items.BARBEQUE:
      case Items.CAMPFIRE:
        return this.placeSmeltingEntity(
          server,
          itemDefinitionId,
          modelId,
          position,
          eul2quat(rotation),
          freeplaceParentCharacterId
        );
      case Items.BEE_BOX:
      case Items.DEW_COLLECTOR:
      case Items.ANIMAL_TRAP:
        return this.placeCollectingEntity(
          server,
          itemDefinitionId,
          modelId,
          position,
          eul2quat(rotation),
          freeplaceParentCharacterId
        );
      case Items.METAL_WALL:
      case Items.METAL_WALL_UPPER:
      case Items.METAL_DOORWAY:
        return this.placeConstructionWall(
          server,
          client,
          itemDefinitionId,
          modelId,
          parentObjectCharacterId,
          BuildingSlot
        );
      case Items.SHELTER:
      case Items.SHELTER_LARGE:
      case Items.SHELTER_UPPER:
      case Items.SHELTER_UPPER_LARGE:
      case Items.STRUCTURE_STAIRS:
      case Items.STRUCTURE_STAIRS_UPPER:
      case Items.LOOKOUT_TOWER:
        return this.placeConstructionShelter(
          server,
          client,
          itemDefinitionId,
          modelId,
          rotation,
          parentObjectCharacterId,
          BuildingSlot
        );
      case Items.GROUND_TILLER:
        return this.placePlantingDiameter(server, modelId, position, rotation);
      case Items.SEED_WHEAT:
      case Items.SEED_CORN:
        return this.placePlantOnDiameter(
          server,
          modelId,
          position,
          rotation,
          BuildingSlot,
          parentObjectCharacterId,
          itemDefinitionId
        );
      default:
        //this.placementError(client, ConstructionErrors.UNKNOWN_CONSTRUCTION);

        // need to add all valid construction eventually
        const characterId = server.generateGuid(),
          transientId = 1, // dont think its needed
          construction = new ConstructionChildEntity(
            characterId,
            transientId,
            modelId,
            position,
            rotation,
            server,
            itemDefinitionId,
            freeplaceParentCharacterId || "",
            ""
          );

        const parent = construction.getParent(server);
        if (parent) {
          server._constructionSimple[characterId] = construction;
          parent.addFreeplaceConstruction(construction);
        } else {
          server._worldSimpleConstruction[characterId] = construction;
        }
        server.executeFuncForAllReadyClientsInRange((client) => {
          server.spawnSimpleConstruction(client, construction);
        }, construction);
        return true;
    }
  }

  placeConstructionShelter(
    server: ZoneServer2016,
    client: Client,
    itemDefinitionId: number,
    modelId: number,
    rotation: Float32Array,
    parentObjectCharacterId: string,
    BuildingSlot: string
  ): boolean {
    const parent =
      server._constructionFoundations[parentObjectCharacterId] ||
      server._constructionSimple[parentObjectCharacterId];
    if (!Number(parentObjectCharacterId) || !parent) {
      this.placementError(server, client, ConstructionErrors.UNKNOWN_PARENT);
      return false;
    }

    if (parent instanceof ConstructionParentEntity) {
      BuildingSlot = parent.getAdjustedShelterSlotId(BuildingSlot);
    }

    if (
      parent &&
      parent.isSlotOccupied(
        parent.occupiedShelterSlots,
        getConstructionSlotId(BuildingSlot)
      )
    ) {
      this.placementError(server, client, ConstructionErrors.OVERLAP);
      return false;
    }

    if (!parent.isShelterSlotValid(BuildingSlot, itemDefinitionId)) {
      this.placementError(server, client, ConstructionErrors.UNKNOWN_SLOT);
      return false;
    }

    const position = parent.getSlotPosition(BuildingSlot, parent.shelterSlots);
    if (!position) {
      this.placementError(server, client, ConstructionErrors.UNKNOWN_SLOT);
      return false;
    }

    const characterId = server.generateGuid(),
      transientId = 1, // dont think its needed
      shelter = new ConstructionChildEntity(
        characterId,
        transientId,
        modelId,
        position,
        rotation,
        server,
        itemDefinitionId,
        parentObjectCharacterId,
        BuildingSlot
      );

      server._constructionSimple[characterId] = shelter;
    parent.setShelterSlot(server, shelter);
    server.executeFuncForAllReadyClientsInRange((client) => {
      server.spawnSimpleConstruction(client, shelter);
    }, shelter);
    return true;
  }

  placeConstructionWall(
    server: ZoneServer2016,
    client: Client,
    itemDefinitionId: number,
    modelId: number,
    parentObjectCharacterId: string,
    BuildingSlot: string
  ): boolean {
    const parent =
      server._constructionFoundations[parentObjectCharacterId] ||
      server._constructionSimple[parentObjectCharacterId];
    if (!Number(parentObjectCharacterId) || !parent) {
      this.placementError(server, client, ConstructionErrors.UNKNOWN_PARENT);
      return false;
    }

    if (!parent.isWallSlotValid(BuildingSlot, itemDefinitionId)) {
      this.placementError(server, client, ConstructionErrors.UNKNOWN_SLOT);
      return false;
    }

    let position, rotation;
    if (itemDefinitionId == Items.METAL_WALL_UPPER) {
      if (
        parent &&
        parent.isSlotOccupied(
          parent.occupiedUpperWallSlots,
          getConstructionSlotId(BuildingSlot)
        )
      ) {
        this.placementError(server, client, ConstructionErrors.OVERLAP);
        return false;
      }
      (position = parent.getSlotPosition(BuildingSlot, parent.upperWallSlots)),
        (rotation = parent.getSlotRotation(
          BuildingSlot,
          parent.upperWallSlots
        ));
    } else {
      if (
        parent &&
        parent.isSlotOccupied(
          parent.occupiedWallSlots,
          getConstructionSlotId(BuildingSlot)
        )
      ) {
        this.placementError(server, client, ConstructionErrors.OVERLAP);
        return false;
      }
      (position = parent.getSlotPosition(BuildingSlot, parent.wallSlots)),
        (rotation = parent.getSlotRotation(BuildingSlot, parent.wallSlots));
    }
    if (!position || !rotation) {
      this.placementError(server, client, ConstructionErrors.UNKNOWN_SLOT);
      return false;
    }

    const characterId = server.generateGuid(),
      transientId = 1, // dont think its needed
      wall = new ConstructionChildEntity(
        characterId,
        transientId,
        modelId,
        position,
        rotation,
        server,
        itemDefinitionId,
        parentObjectCharacterId,
        BuildingSlot
      );

    parent.setWallSlot(server, wall);

    server._constructionSimple[characterId] = wall;
    server.executeFuncForAllReadyClientsInRange((client) => {
      server.spawnSimpleConstruction(client, wall);
    }, wall);
    return true;
  }

  placeConstructionRamp(
    server: ZoneServer2016,
    client: Client,
    itemDefinitionId: number,
    modelId: number,
    parentObjectCharacterId: string,
    BuildingSlot: string
  ): boolean {
    const parentFoundation =
      server._constructionFoundations[parentObjectCharacterId];
    if (!Number(parentObjectCharacterId) || !parentFoundation) {
      this.placementError(server, client, ConstructionErrors.UNKNOWN_PARENT);
      return false;
    }

    if (
      parentFoundation &&
      parentFoundation.isSlotOccupied(
        parentFoundation.occupiedRampSlots,
        getConstructionSlotId(BuildingSlot)
      )
    ) {
      this.placementError(server, client, ConstructionErrors.OVERLAP);
      return false;
    }

    if (!parentFoundation.isRampSlotValid(BuildingSlot, itemDefinitionId)) {
      this.placementError(server, client, ConstructionErrors.UNKNOWN_SLOT);
      return false;
    }

    const position = parentFoundation.getSlotPosition(
        BuildingSlot,
        parentFoundation.rampSlots
      ),
      rotation = parentFoundation.getSlotRotation(
        BuildingSlot,
        parentFoundation.rampSlots
      );
    if (!position || !rotation) {
      this.placementError(server, client, ConstructionErrors.UNKNOWN_SLOT);
      return false;
    }

    const characterId = server.generateGuid(),
      transientId = 1, // dont think its needed
      ramp = new ConstructionChildEntity(
        characterId,
        transientId,
        modelId,
        position,
        rotation,
        server,
        itemDefinitionId,
        parentObjectCharacterId,
        BuildingSlot
      );

    parentFoundation.setRampSlot(ramp);
    server._constructionSimple[characterId] = ramp;
    server.executeFuncForAllReadyClientsInRange((client) => {
      server.spawnSimpleConstruction(client, ramp);
    }, ramp);
    return true;
  }

  placeConstructionStairs(
    server: ZoneServer2016,
    client: Client,
    itemDefinitionId: number,
    modelId: number,
    rotation: Float32Array,
    parentObjectCharacterId: string,
    BuildingSlot: string
  ): boolean {
    const parentFoundation =
      server._constructionFoundations[parentObjectCharacterId];
    if (!Number(parentObjectCharacterId) || !parentFoundation) {
      this.placementError(server, client, ConstructionErrors.UNKNOWN_PARENT);
      return false;
    }

    if (
      parentFoundation &&
      parentFoundation.isSlotOccupied(
        parentFoundation.occupiedRampSlots,
        getConstructionSlotId(BuildingSlot)
      )
    ) {
      this.placementError(server, client, ConstructionErrors.OVERLAP);
      return false;
    }

    if (!parentFoundation.isRampSlotValid(BuildingSlot, itemDefinitionId)) {
      this.placementError(server, client, ConstructionErrors.UNKNOWN_SLOT);
      return false;
    }

    const position = parentFoundation.getSlotPosition(
      BuildingSlot,
      parentFoundation.rampSlots
    );
    if (!position) {
      this.placementError(server, client, ConstructionErrors.UNKNOWN_SLOT);
      return false;
    }

    // rotation is not slot-locked yet
    const characterId = server.generateGuid(),
      transientId = 1, // dont think its needed
      stairs = new ConstructionChildEntity(
        characterId,
        transientId,
        modelId,
        position,
        new Float32Array([rotation[0], 0, 0]),
        server,
        itemDefinitionId,
        parentObjectCharacterId,
        BuildingSlot
      );

    parentFoundation.setRampSlot(stairs);
    server._constructionSimple[characterId] = stairs;
    server.executeFuncForAllReadyClientsInRange((client) => {
      server.spawnSimpleConstruction(client, stairs);
    }, stairs);
    return true;
  }

  placeConstructionDoor(
    server: ZoneServer2016,
    client: Client,
    itemDefinitionId: number,
    modelId: number,
    parentObjectCharacterId: string,
    BuildingSlot: string
  ): boolean {
    const parent =
      server._constructionFoundations[parentObjectCharacterId] ||
      server._constructionSimple[parentObjectCharacterId];
    if (!Number(parentObjectCharacterId) || !parent) {
      this.placementError(server, client, ConstructionErrors.UNKNOWN_PARENT);
      return false;
    }

    if (
      parent &&
      parent.isSlotOccupied(
        parent.occupiedWallSlots,
        getConstructionSlotId(BuildingSlot)
      )
    ) {
      this.placementError(server, client, ConstructionErrors.OVERLAP);
      return false;
    }

    if (!parent.isWallSlotValid(BuildingSlot, itemDefinitionId)) {
      this.placementError(server, client, ConstructionErrors.UNKNOWN_SLOT);
      return false;
    }

    const position = parent.getSlotPosition(BuildingSlot, parent.wallSlots),
      rotation = parent.getSlotRotation(BuildingSlot, parent.wallSlots);
    if (!position || !rotation) {
      this.placementError(server, client, ConstructionErrors.UNKNOWN_SLOT);
      return false;
    }

    const characterId = server.generateGuid(),
      transientId = server.getTransientId(characterId),
      door = new ConstructionDoor(
        characterId,
        transientId,
        modelId,
        position,
        rotation,
        server,
        itemDefinitionId,
        client.character.characterId,
        parentObjectCharacterId,
        BuildingSlot
      );

    parent.setWallSlot(server, door);

    server._constructionDoors[characterId] = door;
    server.executeFuncForAllReadyClientsInRange((client) => {
      server.spawnConstructionDoor(client, door);
    }, door);
    return true;
  }

  placeConstructionFoundation(
    server: ZoneServer2016,
    client: Client,
    itemDefinitionId: number,
    modelId: number,
    position: Float32Array,
    rotation: Float32Array,
    parentObjectCharacterId: string,
    BuildingSlot?: string
  ): boolean {
    if (
      itemDefinitionId == Items.FOUNDATION_EXPANSION &&
      (!parentObjectCharacterId || !BuildingSlot)
    ) {
      // prevent expansions from being placed without a deck if client check is bypassed
      return false;
    }
    if (
      BuildingSlot &&
      server._constructionFoundations[parentObjectCharacterId]
        ?.occupiedExpansionSlots[getConstructionSlotId(BuildingSlot)]
    ) {
      this.placementError(server, client, ConstructionErrors.OVERLAP);
      return false;
    }

    const parentFoundation =
    server._constructionFoundations[parentObjectCharacterId];
    if (Number(parentObjectCharacterId) && !parentFoundation) {
      this.placementError(server, client, ConstructionErrors.UNKNOWN_PARENT);
      return false;
    }

    if (parentFoundation && BuildingSlot) {
      if (
        parentFoundation &&
        parentFoundation.isSlotOccupied(
          parentFoundation.occupiedExpansionSlots,
          getConstructionSlotId(BuildingSlot)
        )
      ) {
        this.placementError(server, client, ConstructionErrors.OVERLAP);
        return false;
      }

      if (
        !parentFoundation.isExpansionSlotValid(BuildingSlot, itemDefinitionId)
      ) {
        this.placementError(server, client, ConstructionErrors.UNKNOWN_SLOT);
        return false;
      }
      const pos = parentFoundation.getSlotPosition(
          BuildingSlot || "",
          parentFoundation.expansionSlots
        ),
        rot = parentFoundation.getSlotRotation(
          BuildingSlot || "",
          parentFoundation.expansionSlots
        );
      if (!pos || !rot) {
        this.placementError(server, client, ConstructionErrors.UNKNOWN_SLOT);
        return false;
      }
      position = pos;
      rotation = rot;
    }

    let ownerCharacterId = client.character.characterId,
      ownerName = client.character.name;
    if (itemDefinitionId == Items.FOUNDATION_EXPANSION) {
      ownerCharacterId = parentFoundation.ownerCharacterId;
      ownerName = "";
    }

    const characterId = server.generateGuid(),
      transientId = server.getTransientId(characterId),
      npc = new ConstructionParentEntity(
        characterId,
        transientId,
        modelId,
        position,
        rotation,
        server,
        itemDefinitionId,
        ownerCharacterId,
        ownerName,
        parentObjectCharacterId,
        BuildingSlot
      );
    if (parentFoundation && BuildingSlot) {
      parentFoundation.setExpansionSlot(npc);
      npc.permissions = parentFoundation.permissions;
    }
    server._constructionFoundations[characterId] = npc;
    server.executeFuncForAllReadyClientsInRange((client) => {
      server.spawnConstructionParent(client, npc);
    }, npc);
    return true;
  }

  placeTemporaryEntity(
    server: ZoneServer2016,
    modelId: number,
    position: Float32Array,
    rotation: Float32Array,
    time: number
  ): boolean {
    const characterId = server.generateGuid(),
      transientId = 1, // dont think its needed
      npc = new TemporaryEntity(
        characterId,
        transientId,
        modelId,
        position,
        rotation,
        server
      );
    npc.setDespawnTimer(server, time);
    server._temporaryObjects[characterId] = npc;
    return true;
  }

  placeTrap(
    server: ZoneServer2016,
    itemDefinitionId: number,
    modelId: number,
    position: Float32Array,
    rotation: Float32Array
  ): boolean {
    const characterId = server.generateGuid(),
      transientId = 1, // dont think its needed here
      npc = new TrapEntity(
        characterId,
        transientId,
        modelId,
        position,
        new Float32Array([0, rotation[0], 0]),
        server,
        itemDefinitionId
      );
    npc.arm(server);
    server._traps[characterId] = npc;
    return true;
  }

  placeExplosiveEntity(
    server: ZoneServer2016,
    itemDefinitionId: Items,
    modelId: number,
    position: Float32Array,
    rotation: Float32Array
  ): boolean {
    const characterId = server.generateGuid(),
      transientId = 1, // dont think its needed
      npc = new ExplosiveEntity(
        characterId,
        transientId,
        modelId,
        position,
        rotation,
        server,
        itemDefinitionId
      );
    if (npc.isLandmine()) {
      npc.arm(server);
    }
    server._explosives[characterId] = npc;
    return true;
  }

  // used by multiple construction classes that don't extend each other
  undoPlacementInteractionString(server: ZoneServer2016, entity: ConstructionEntity, client: Client) {
    server.sendData(client, "Command.InteractionString", {
      guid: entity.characterId,
      stringId: StringIds.UNDO_PLACEMENT,
    });
  }

  placeLootableConstruction(
    server: ZoneServer2016,
    itemDefinitionId: number,
    modelId: number,
    position: Float32Array,
    rotation: Float32Array,
    parentObjectCharacterId?: string
  ): boolean {
    const characterId = server.generateGuid(),
      transientId = server.getTransientId(characterId);
    const obj = new LootableConstructionEntity(
      characterId,
      transientId,
      modelId,
      position,
      rotation,
      server,
      itemDefinitionId,
      parentObjectCharacterId || "",
      ""
    );

    const parent = obj.getParent(server);
    if (parent) {
      server._lootableConstruction[characterId] = obj;
      parent.addFreeplaceConstruction(obj);
    } else {
      server._worldLootableConstruction[characterId] = obj;
    }
    obj.equipLoadout(server);

    server.executeFuncForAllReadyClientsInRange((client) => {
      server.spawnLootableConstruction(client, obj);
    }, obj);

    return true;
  }

  placeSmeltingEntity(
    server: ZoneServer2016,
    itemDefinitionId: number,
    modelId: number,
    position: Float32Array,
    rotation: Float32Array,
    parentObjectCharacterId?: string
  ): boolean {
    const characterId = server.generateGuid(),
      transientId = server.getTransientId(characterId);
    const obj = new LootableConstructionEntity(
      characterId,
      transientId,
      modelId,
      position,
      rotation,
      server,
      itemDefinitionId,
      parentObjectCharacterId || "",
      "SmeltingEntity"
    );

    const parent = obj.getParent(server);
    if (parent) {
      server._lootableConstruction[characterId] = obj;
      parent.addFreeplaceConstruction(obj);
    } else {
      server._worldLootableConstruction[characterId] = obj;
    }

    obj.equipLoadout(server);

    server.executeFuncForAllReadyClientsInRange((client) => {
      server.spawnLootableConstruction(client, obj);
    }, obj);

    return true;
  }

  placeCollectingEntity(
    server: ZoneServer2016,
    itemDefinitionId: number,
    modelId: number,
    position: Float32Array,
    rotation: Float32Array,
    parentObjectCharacterId?: string
  ): boolean {
    const characterId = server.generateGuid(),
      transientId = server.getTransientId(characterId);
    const obj = new LootableConstructionEntity(
      characterId,
      transientId,
      modelId,
      position,
      rotation,
      server,
      itemDefinitionId,
      parentObjectCharacterId || "",
      "CollectingEntity"
    );

    const parent = obj.getParent(server);
    if (parent) {
      server._lootableConstruction[characterId] = obj;
      parent.addFreeplaceConstruction(obj);
    } else {
      server._worldLootableConstruction[characterId] = obj;
    }

    obj.equipLoadout(server);
    const container = obj.getContainer();
    if (container) {
      switch (obj.itemDefinitionId) {
        case Items.ANIMAL_TRAP:
          container.canAcceptItems = false;
          break;
        case Items.DEW_COLLECTOR:
        case Items.BEE_BOX:
          container.acceptedItems = [Items.WATER_EMPTY];
      }
    }
    server.executeFuncForAllReadyClientsInRange((client) => {
      server.spawnLootableConstruction(client, obj);
    }, obj);
    server.smeltingManager._collectingEntities[characterId] = characterId;
    return true;
  }

  placePlantingDiameter(
    server: ZoneServer2016,
    modelId: number,
    position: Float32Array,
    rotation: Float32Array
  ): boolean {
    const characterId = server.generateGuid(),
      transientId = 1;
    const obj = new PlantingDiameter(
      characterId,
      transientId,
      modelId,
      position,
      eul2quat(rotation),
      server
    );
    server._temporaryObjects[characterId] = obj;

    return true;
  }
  placePlantOnDiameter(
    server: ZoneServer2016,
    modelId: number,
    position: Float32Array,
    rotation: Float32Array,
    slot: string,
    parentObjectCharacterId: string,
    itemDefinitionId: number
  ): boolean {
    const item = server.generateItem(itemDefinitionId);
    if (!item) return false;
    const characterId = server.generateGuid(),
      transientId = server.getTransientId(characterId);
    if (!server._temporaryObjects[parentObjectCharacterId]) return false;
    const parent = server._temporaryObjects[
      parentObjectCharacterId
    ] as PlantingDiameter;
    if (parent.seedSlots[slot]) {
      return false;
    }

    const obj = new Plant(
      characterId,
      transientId,
      modelId,
      position,
      eul2quat(rotation),
      server,
      0,
      item,
      parentObjectCharacterId,
      slot
    );
    parent.seedSlots[slot] = obj;
    server._plants[characterId] = obj;
    return true;
  }









}