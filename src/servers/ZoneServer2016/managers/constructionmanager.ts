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

import {
  ConstructionEntity,
  DamageInfo,
  SlottedConstructionEntity,
} from "types/zoneserver";
import {
  eul2quat,
  fixEulerOrder,
  getConstructionSlotId,
  getDistance,
  isInsideSquare,
  isPosInRadius,
  isPosInRadiusWithY,
  movePoint,
} from "../../../utils/utils";
import { BaseItem } from "../classes/baseItem";
import { LoadoutItem } from "../classes/loadoutItem";
import { SpawnCell } from "../classes/spawncell";
import { ZoneClient2016 as Client } from "../classes/zoneclient";
import { BaseEntity } from "../entities/baseentity";
import { ConstructionChildEntity } from "../entities/constructionchildentity";
import { ConstructionDoor } from "../entities/constructiondoor";
import { ConstructionParentEntity } from "../entities/constructionparententity";
import { ExplosiveEntity } from "../entities/explosiveentity";
import { LootableConstructionEntity } from "../entities/lootableconstructionentity";
import { Plant } from "../entities/plant";
import { PlantingDiameter } from "../entities/plantingdiameter";
import { TemporaryEntity } from "../entities/temporaryentity";
import { TrapEntity } from "../entities/trapentity";
import {
  ConstructionErrors,
  ConstructionPermissionIds,
  Items,
  ResourceIds,
  ResourceTypes,
  StringIds,
} from "../models/enums";
import { ZoneServer2016 } from "../zoneserver";

export class ConstructionManager {
  overridePlacementItems: Array<number> = [
    Items.IED,
    Items.LANDMINE,
    Items.SNARE,
  ];

  /* MANAGED BY CONFIGMANAGER */
  allowPOIPlacement!: boolean;
  allowStackedPlacement!: boolean;
  allowOutOfBoundsPlacement!: boolean;
  placementRange!: number;
  spawnPointBlockedPlacementRange!: number;
  vehicleSpawnPointBlockedPlacementRange!: number;
  playerFoundationBlockedPlacementRange!: number;
  playerShackBlockedPlacementRange!: number;

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

  placementError(
    server: ZoneServer2016,
    client: Client,
    error: ConstructionErrors
  ) {
    server.sendAlert(client, `Construction Error: ${error}`);
  }

  detectStackedPlacement(
    server: ZoneServer2016,
    client: Client,
    parentObjectCharacterId: string,
    position: Float32Array,
    itemDefinitionId: number
  ): boolean {
    if (this.allowStackedPlacement) return false;
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
        if (
          c.itemDefinitionId == Items.STORAGE_BOX &&
          (itemDefinitionId == Items.BEE_BOX ||
            itemDefinitionId == Items.FURNACE)
        ) {
          if (
            isPosInRadiusWithY(0.5, c.state.position, position, 1.5) &&
            diff < 0.5
          ) {
            return true;
          }
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
        if (
          c.itemDefinitionId == Items.STORAGE_BOX &&
          (itemDefinitionId == Items.BEE_BOX ||
            itemDefinitionId == Items.FURNACE)
        ) {
          if (
            isPosInRadiusWithY(0.5, c.state.position, position, 1.5) &&
            diff < 0.5
          ) {
            return true;
          }
        }
      }
    }
    return false;
  }

  detectStackedTamperPlacement(
    server: ZoneServer2016,
    item: BaseItem,
    position: Float32Array
  ): boolean {
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

  detectOutOfRange(
    client: Client,
    item: BaseItem,
    position: Float32Array
  ): boolean {
    if (!this.placementRange) return false;
    if (
      item.itemDefinitionId != Items.GROUND_TAMPER &&
      item.itemDefinitionId != Items.FOUNDATION &&
      item.itemDefinitionId != Items.FOUNDATION_EXPANSION &&
      !isPosInRadius(
        this.placementRange,
        client.character.state.position,
        position
      )
    ) {
      return true;
    }
    return false;
  }

  detectSpawnPointPlacement(
    itemDefinitionId: number,
    position: Float32Array,
    isInsidePermissionedFoundation: boolean
  ): boolean {
    if (!this.spawnPointBlockedPlacementRange) return false;
    let isInSpawnPoint = false;
    spawnLocations2.forEach((point: Float32Array) => {
      if (isPosInRadius(this.spawnPointBlockedPlacementRange, position, point))
        isInSpawnPoint = true;
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

  detectVehicleSpawnPointPlacement(
    itemDefinitionId: number,
    position: Float32Array,
    isInsidePermissionedFoundation: boolean
  ): boolean {
    if (!this.vehicleSpawnPointBlockedPlacementRange) return false;
    let isInVehicleSpawnPoint = false;
    Z1_vehicles.forEach((vehicleSpawn: any) => {
      if (
        isPosInRadius(
          this.vehicleSpawnPointBlockedPlacementRange,
          position,
          vehicleSpawn.position
        )
      )
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

  detectOutOfBoundsPlacement(
    server: ZoneServer2016,
    position: Float32Array
  ): boolean {
    if (this.allowOutOfBoundsPlacement) return false;
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
  detectPOIPlacement(itemDefinitionId: number,position: Float32Array,client: Client,isInsidePermissionedFoundation: boolean): boolean {
      if (client.isAdmin)  return false 
      if (this.allowPOIPlacement) return false;
      if (this.overridePlacementItems.includes(itemDefinitionId)) return false;
      let useRange = true;
      let isInPoi = false;
      Z1_POIs.forEach((point: any) => {
        if (point.bounds) {
          useRange = false;
          point.bounds.forEach((bound: any) => {
            if (isInsideSquare([position[0], position[2]], bound)) {
              isInPoi = true;
              return;
            }
          })
        }
        if (useRange && isPosInRadius(point.range, position, point.position)) {
          isInPoi = true;
        }
      });
      // allow placement in poi if object is parented to a foundation
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
     {
      if (client.isAdmin) {
        // Handle admin placement logic here
      } else {
        const item = client.character.getItemById(itemDefinitionId);
        if (!item) {
          this.sendPlacementFinalize(server, client, 1);
          return;
        }
      }
    }
    const item = client.character.getItemById(itemDefinitionId);
    if (!item) {
      this.sendPlacementFinalize(server, client, 1);
      return;
    }

    // disallow construction stacking
    // world constructions may not be placed within 1 radius, this problem wont affect stuff inside any foundation
    if (
      this.detectStackedPlacement(
        server,
        client,
        parentObjectCharacterId,
        position,
        itemDefinitionId
      )
    ) {
      this.sendPlacementFinalize(server, client, 0);
      this.placementError(server, client, ConstructionErrors.STACKED);
      return;
    }

    if (this.detectStackedTamperPlacement(server, item, position)) {
      this.sendPlacementFinalize(server, client, 0);
      this.placementError(server, client, ConstructionErrors.STACKED);
      return;
    }

    if (this.detectOutOfRange(client, item, position)) {
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

          // check upper shelters if its not in lower ones
          Object.values(shelter.occupiedShelterSlots).forEach(
            (upperShelter) => {
              if (upperShelter.isInside(position)) {
                freeplaceParentCharacterId = upperShelter.characterId;
              }
            }
          );
        });
      }
    }
    if (server._constructionSimple[parentObjectCharacterId]) {
      const simple = server._constructionSimple[parentObjectCharacterId];
      if (
        !simple.getHasPermission(
          server,
          client.character.characterId,
          ConstructionPermissionIds.BUILD
        )
      ) {
        this.placementError(
          server,
          client,
          ConstructionErrors.BUILD_PERMISSION
        );
        this.sendPlacementFinalize(server, client, 0);
        return;
      }
    }

    if (
      this.detectSpawnPointPlacement(
        itemDefinitionId,
        position,
        isInsidePermissionedFoundation
      )
    ) {
      this.sendPlacementFinalize(server, client, 0);
      server.sendAlert(
        client,
        "You may not place this object this close to a spawn point"
      );
      return;
    }

    if (
      this.detectVehicleSpawnPointPlacement(
        itemDefinitionId,
        position,
        isInsidePermissionedFoundation
      )
    ) {
      this.sendPlacementFinalize(server, client, 0);
      server.sendAlert(
        client,
        "You may not place this object this close to a vehicle spawn point"
      );
      return;
    }

    if (this.detectOutOfBoundsPlacement(server, position)) {
      this.sendPlacementFinalize(server, client, 0);
      server.sendAlert(
        client,
        "You may not place this object this close to edge of the map"
      );
      return;
    }

    if (
      this.detectPOIPlacement(
        itemDefinitionId,
        position,
        client,
        isInsidePermissionedFoundation
      )
    ) {
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
    this.constructionPermissionsManager(server, client);
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
        return this.placeTrap(
          server,
          itemDefinitionId,
          modelId,
          position,
          fixEulerOrder(rotation)
        );
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
          fixEulerOrder(rotation),
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
          fixEulerOrder(rotation),
          parentObjectCharacterId,
          BuildingSlot
        );
      case Items.STORAGE_BOX:
        return this.placeLootableConstruction(
          server,
          itemDefinitionId,
          modelId,
          position,
          fixEulerOrder(rotation),
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
          fixEulerOrder(rotation),
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
          fixEulerOrder(rotation),
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
          fixEulerOrder(rotation),
          parentObjectCharacterId,
          BuildingSlot
        );
      case Items.GROUND_TILLER:
        return this.placePlantingDiameter(
          server,
          modelId,
          position,
          fixEulerOrder(rotation)
        );
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
            fixEulerOrder(rotation),
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
          this.spawnSimpleConstruction(server, client, construction);
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
      this.spawnSimpleConstruction(server, client, shelter);
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
      this.spawnSimpleConstruction(server, client, wall);
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
      this.spawnSimpleConstruction(server, client, ramp);
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
        rotation,
        server,
        itemDefinitionId,
        parentObjectCharacterId,
        BuildingSlot
      );

    parentFoundation.setRampSlot(stairs);
    server._constructionSimple[characterId] = stairs;
    server.executeFuncForAllReadyClientsInRange((client) => {
      this.spawnSimpleConstruction(server, client, stairs);
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
        new Float32Array([rotation[1], 0, 0, 0]),
        server,
        itemDefinitionId,
        client.character.characterId,
        parentObjectCharacterId,
        BuildingSlot
      );

    parent.setWallSlot(server, door);

    server._constructionDoors[characterId] = door;
    server.executeFuncForAllReadyClientsInRange((client) => {
      this.spawnConstructionDoor(server, client, door);
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
      this.spawnConstructionParent(server, client, npc);
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
        rotation,
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
  undoPlacementInteractionString(
    server: ZoneServer2016,
    entity: ConstructionEntity,
    client: Client
  ) {
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
      this.spawnLootableConstruction(server, client, obj);
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
      this.spawnLootableConstruction(server, client, obj);
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
      this.spawnLootableConstruction(server, client, obj);
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
      rotation,
      server
    );
    server.executeFuncForAllReadyClientsInRange((client) => {
      server.addSimpleNpc(client, obj);
      client.spawnedEntities.push(obj);
    }, obj);
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

  checkFoundationPermission(
    server: ZoneServer2016,
    client: Client,
    foundation: ConstructionParentEntity
  ): boolean {
    // under foundation check
    const permissions = foundation.permissions[client.character.characterId];
    if (
      foundation.itemDefinitionId == Items.FOUNDATION ||
      foundation.itemDefinitionId == Items.FOUNDATION_EXPANSION
    ) {
      if (foundation.isUnder(client.character.state.position))
        if (permissions && permissions.visit) {
          this.tpPlayerOutsideFoundation(server, client, foundation, true);
        } else {
          this.tpPlayerOutsideFoundation(server, client, foundation, false);
        }
    }
    if (!foundation.isSecured) return false;
    let allowed = false;
    if (permissions && permissions.visit) allowed = true;
    if (
      foundation.itemDefinitionId == Items.SHACK ||
      foundation.itemDefinitionId == Items.SHACK_SMALL ||
      foundation.itemDefinitionId == Items.SHACK_BASIC
    ) {
      if (foundation.isInside(client.character.state.position)) {
        if (allowed) {
          this.constructionHidePlayer(
            server,
            client,
            foundation.characterId,
            true
          );
          return true;
        } else if (!client.isAdmin || !client.isDebugMode) {
          this.tpPlayerOutsideFoundation(server, client, foundation);
        }
      }
    }
    if (allowed) return false;
    if (
      foundation.isInside(client.character.state.position) &&
      (!client.isAdmin || !client.isDebugMode)
    ) {
      this.tpPlayerOutsideFoundation(server, client, foundation);
      return false;
    }

    return false;
  }

  checkConstructionChildEntityPermission(
    server: ZoneServer2016,
    client: Client,
    construction: ConstructionChildEntity
  ): boolean {
    const allowedIds = [
      Items.SHELTER,
      Items.SHELTER_LARGE,
      Items.SHELTER_UPPER,
      Items.SHELTER_UPPER_LARGE,
    ];
    if (!allowedIds.includes(construction.itemDefinitionId)) return false;
    let allowed = false;
    if (!construction.isSecured) return false;
    let foundation: ConstructionParentEntity | undefined;
    if (server._constructionFoundations[construction.parentObjectCharacterId]) {
      foundation =
        server._constructionFoundations[construction.parentObjectCharacterId];
    } else if (
      server._constructionSimple[construction.parentObjectCharacterId] &&
      server._constructionFoundations[
        server._constructionSimple[construction.parentObjectCharacterId]
          .parentObjectCharacterId
      ]
    ) {
      foundation =
        server._constructionFoundations[
          server._constructionSimple[construction.parentObjectCharacterId]
            .parentObjectCharacterId
        ];
    } else {
      for (const a in server._constructionFoundations) {
        const b = server._constructionFoundations[a];
        if (!b.isInside(construction.state.position)) continue;
        foundation = b;
      }
    }
    if (!foundation) return false;
    const permissions = foundation.permissions[client.character.characterId];
    if (permissions && permissions.visit) allowed = true;
    if (construction.isInside(client.character.state.position)) {
      if (allowed) {
        this.constructionHidePlayer(
          server,
          client,
          construction.characterId,
          true
        );
        return true;
      } else if (!client.isAdmin || !client.isDebugMode) {
        const damageInfo: DamageInfo = {
          entity: "Server.Permissions",
          damage: 99999,
        };
        server.killCharacter(client, damageInfo);
        return false;
      }
    }

    return false;
  }

  constructionHidePlayer(
    server: ZoneServer2016,
    client: Client,
    constructionGuid: string,
    state: boolean
  ) {
    if (state) {
      if (!client.character.isHidden) {
        client.character.isHidden = constructionGuid;
        for (const a in server._clients) {
          const iteratedClient = server._clients[a];
          if (
            iteratedClient.spawnedEntities.includes(client.character) &&
            iteratedClient.character.isHidden != client.character.isHidden
          ) {
            server.sendData(iteratedClient, "Character.RemovePlayer", {
              characterId: client.character.characterId,
            });
            iteratedClient.spawnedEntities.splice(
              iteratedClient.spawnedEntities.indexOf(client.character),
              1
            );
          }
        }
      } else return;
    } else if (client.character.isHidden) client.character.isHidden = "";
  }

  tpPlayerOutsideFoundation(
    server: ZoneServer2016,
    client: Client,
    foundation: ConstructionParentEntity,
    tpUp: boolean = false
  ) {
    const currentAngle = Math.atan2(
      client.character.state.position[2] - foundation.state.position[2],
      client.character.state.position[0] - foundation.state.position[0]
    );
    if (tpUp) {
      server.sendChatText(client, "Construction: Stuck under foundation");
      const foundationY = foundation.state.position[1],
        yOffset = foundation.itemDefinitionId == Items.FOUNDATION ? 2.2 : 0.1;
      client.startLoc = foundationY + yOffset;
      server.sendData(client, "ClientUpdate.UpdateLocation", {
        position: [
          client.character.state.position[0],
          foundationY + yOffset,
          client.character.state.position[2],
          1,
        ],
        triggerLoadingScreen: false,
      });
      client.enableChecks = false;
      client.isInAir = false;
      setTimeout(() => {
        client.enableChecks = true;
      }, 500);
      return;
    }
    const newPos = movePoint(
      client.character.state.position,
      currentAngle,
      2.5
    );
    server.sendChatText(client, "Construction: no visitor permission");
    if (client.vehicle.mountedVehicle) {
      server.dismountVehicle(client);
    }
    client.character.state.position = new Float32Array([
      newPos[0],
      client.character.state.position[1],
      newPos[2],
      1,
    ]);
    server.sendData(client, "ClientUpdate.UpdateLocation", {
      position: client.character.state.position,
      triggerLoadingScreen: false,
    });
    client.enableChecks = false;

    setTimeout(() => {
      client.enableChecks = true;
    }, 500);
    setTimeout(() => {
      if (
        foundation.isSecured &&
        foundation.isInside(client.character.state.position)
      ) {
        const damageInfo: DamageInfo = {
          entity: "Server.Permissions",
          damage: 99999,
        };
        client.character.damage(server, damageInfo);
      }
    }, 2000);
    this.recheckClientInsideShelter(client, server, currentAngle);
    this.checkFoundationPermission(server, client, foundation);
  }

  recheckClientInsideShelter(
    client: Client,
    server: ZoneServer2016,
    tpDirection: number
  ) {
    for (const a in server._constructionSimple) {
      const simple = server._constructionSimple[a];
      const shelters = [
        Items.SHELTER,
        Items.SHELTER_LARGE,
        Items.SHELTER_UPPER,
        Items.SHELTER_UPPER_LARGE,
      ];
      if (!shelters.includes(simple.itemDefinitionId)) continue;
      if (simple.isInside(client.character.state.position)) {
        const newPos = movePoint(
          client.character.state.position,
          tpDirection,
          2.5
        );
        client.character.state.position = new Float32Array([
          newPos[0],
          client.character.state.position[1],
          newPos[2],
          1,
        ]);
        server.sendData(client, "ClientUpdate.UpdateLocation", {
          position: client.character.state.position,
          triggerLoadingScreen: false,
        });
        this.recheckClientInsideShelter(client, server, tpDirection);
        return;
      }
    }
  }

  plantManager(server: ZoneServer2016) {
    const date = new Date().getTime();
    for (const characterId in server._temporaryObjects) {
      const object = server._temporaryObjects[characterId] as PlantingDiameter;
      if (object instanceof PlantingDiameter) {
        if (
          object.disappearTimestamp < date &&
          Object.values(object.seedSlots).length === 0
        ) {
          server.deleteEntity(object.characterId, server._temporaryObjects);
        } else if (object.disappearTimestamp < date)
          object.disappearTimestamp = date + 86400000;
        if (object.fertilizedTimestamp < date) object.isFertilized = false;
        Object.values(object.seedSlots).forEach((plant) => {
          if (plant.nextStateTime < date) plant.grow(server);
        });
      }
    }
  }

  constructionShouldHideEntity(
    server: ZoneServer2016,
    client: Client,
    entity: BaseEntity
  ): boolean {
    if (!(entity instanceof LootableConstructionEntity)) {
      return false;
    }
    const parent = entity.getParent(server);
    if (!parent) return false;
    const parentSecured = parent.isSecured,
      hasVisitPermission = parent.getHasPermission(
        server,
        client.character.characterId,
        ConstructionPermissionIds.VISIT
      ),
      isInside = parent.isInside(entity.state.position);

    return parentSecured && isInside && !hasVisitPermission;
    // TODO: check if character is in secured shelter / shack
  }

  private spawnConstructionFreeplace(
    server: ZoneServer2016,
    client: Client,
    parentEntity: ConstructionParentEntity | ConstructionChildEntity
  ) {
    for (const entity of Object.values(parentEntity.freeplaceEntities)) {
      if (
        !isPosInRadius(
          entity.npcRenderDistance || server.charactersRenderDistance,
          entity.state.position,
          client.character.state.position
        )
      )
        continue;
      if (entity instanceof ConstructionChildEntity) {
        this.spawnSimpleConstruction(server, client, entity);
      } else if (entity instanceof ConstructionDoor) {
        this.spawnConstructionDoor(server, client, entity);
      } else if (
        entity instanceof LootableConstructionEntity &&
        !this.constructionShouldHideEntity(server, client, entity)
      ) {
        this.spawnLootableConstruction(server, client, entity);
      }
    }
  }

  spawnConstructionParent(
    server: ZoneServer2016,
    client: Client,
    entity: ConstructionParentEntity
  ) {
    if (!client.spawnedEntities.includes(entity)) {
      server.addSimpleNpc(client, entity);
      client.spawnedEntities.push(entity);
    }
    // slotted construction spawning
    this.spawnConstructionTree(server, client, entity);

    // freeplace construction spawning
    this.spawnConstructionFreeplace(server, client, entity);
  }

  spawnConstructionDoor(
    server: ZoneServer2016,
    client: Client,
    entity: ConstructionDoor
  ) {
    if (client.spawnedEntities.includes(entity) || !client.isSynced) return;
    server.addLightweightNpc(
      client,
      entity,
      server.getItemDefinition(entity.itemDefinitionId)?.NAME_ID
    );
    client.spawnedEntities.push(entity);
    server.updateResource(
      client,
      entity.characterId,
      entity.health,
      ResourceIds.CONSTRUCTION_CONDITION,
      ResourceTypes.CONDITION
    );
    if (entity.isOpen) {
      server.sendData(client, "PlayerUpdatePosition", {
        transientId: entity.transientId,
        positionUpdate: {
          sequenceTime: 0,
          unknown3_int8: 0,
          position: entity.state.position,
          orientation: entity.openAngle,
        },
      });
    }
  }

  spawnSimpleConstruction(
    server: ZoneServer2016,
    client: Client,
    entity: ConstructionChildEntity,
    spawnTree = true
  ) {
    if (!client.spawnedEntities.includes(entity)) {
      server.addSimpleNpc(client, entity);
      client.spawnedEntities.push(entity);
    }

    if (!spawnTree) return;
    // slotted construction spawning
    this.spawnConstructionTree(server, client, entity);

    // freeplace construction spawning
    this.spawnConstructionFreeplace(server, client, entity);
  }

  spawnLootableConstruction(
    server: ZoneServer2016,
    client: Client,
    entity: LootableConstructionEntity
  ) {
    if (client.spawnedEntities.includes(entity)) return;
    server.addSimpleNpc(client, entity);
    client.spawnedEntities.push(entity);
  }

  private spawnConstructionTree(
    server: ZoneServer2016,
    client: Client,
    parentEntity: ConstructionParentEntity | ConstructionChildEntity
  ) {
    for (const slotMap of parentEntity.getOccupiedSlotMaps()) {
      for (const entity of Object.values(slotMap)) {
        if (
          isPosInRadius(
            entity.npcRenderDistance
              ? entity.npcRenderDistance
              : server.charactersRenderDistance,
            client.character.state.position,
            entity.state.position
          )
        ) {
          if (entity instanceof ConstructionChildEntity) {
            this.spawnSimpleConstruction(server, client, entity);
          } else if (entity instanceof ConstructionDoor) {
            this.spawnConstructionDoor(server, client, entity);
          }
        }
      }
    }
  }

  spawnConstructionParentsInRange(server: ZoneServer2016, client: Client) {
    for (const a in server._constructionFoundations) {
      const foundation = server._constructionFoundations[a];
      if (
        isPosInRadius(
          foundation.npcRenderDistance || server.charactersRenderDistance,
          client.character.state.position,
          foundation.state.position
        )
      ) {
        this.spawnConstructionParent(server, client, foundation);
      }
    }
  }

  public constructionPermissionsManager(
    server: ZoneServer2016,
    client: Client
  ) {
    let hide = false;
    for (const characterId in server._constructionFoundations) {
      const npc = server._constructionFoundations[characterId];
      if (
        server.constructionManager.checkFoundationPermission(
          server,
          client,
          npc
        )
      )
        hide = true;
    }
    for (const characterId in server._constructionSimple) {
      const npc = server._constructionSimple[characterId];
      if (
        server.constructionManager.checkConstructionChildEntityPermission(
          server,
          client,
          npc
        )
      )
        hide = true;
    }
    if (!hide && client.character.isHidden) {
      client.character.isHidden = "";
      server.spawnCharacterToOtherClients(client.character, client.isAdmin);
    }
  }

  public repairChildEntity(
    server: ZoneServer2016,
    entity: ConstructionChildEntity | ConstructionDoor,
    hammerHit: number
  ): number {
    if (entity instanceof ConstructionChildEntity) {
      Object.values(entity.occupiedShelterSlots).forEach(
        (slot: ConstructionChildEntity) => {
          hammerHit = this.repairChildEntity(server, slot, hammerHit);
        }
      );
      Object.values(entity.occupiedWallSlots).forEach(
        (wall: ConstructionDoor | ConstructionChildEntity) => {
          hammerHit = this.repairChildEntity(server, wall, hammerHit);
        }
      );
      Object.values(entity.occupiedUpperWallSlots).forEach(
        (slot: ConstructionDoor | ConstructionChildEntity) => {
          hammerHit = this.repairChildEntity(server, slot, hammerHit);
        }
      );
    }
    if (entity.health >= 1000000) return hammerHit;
    this.repairConstruction(server, entity, 50000);
    hammerHit += 15;
    return hammerHit;
  }

  public repairConstruction(
    server: ZoneServer2016,
    entity:
      | ConstructionChildEntity
      | ConstructionDoor
      | LootableConstructionEntity,
    amount: number
  ) {
    const damageInfo = {
      entity: "",
      damage: (amount *= -1),
    };
    entity.damage(server, damageInfo);
    if (entity.useSimpleStruct) {
      server.sendDataToAllWithSpawnedEntity(
        server.getConstructionDictionary(entity.characterId),
        entity.characterId,
        "Character.UpdateSimpleProxyHealth",
        entity.pGetSimpleProxyHealth()
      );
    } else {
      server.updateResourceToAllWithSpawnedEntity(
        entity.characterId,
        entity.health,
        ResourceIds.CONSTRUCTION_CONDITION,
        ResourceTypes.CONDITION,
        server.getConstructionDictionary(entity.characterId)
      );
    }
  }

  /**
   * Manages the spawning of WORLD parented free-place construction entities, such as storage containers placed directly on the ground.
   *
   */
  worldConstructionManager(server: ZoneServer2016, client: Client) {
    for (const characterId in server._worldSimpleConstruction) {
      const entity = server._worldSimpleConstruction[characterId];
      if (
        isPosInRadius(
          (entity.npcRenderDistance as number) ||
            server.charactersRenderDistance,
          client.character.state.position,
          entity.state.position
        )
      ) {
        this.spawnSimpleConstruction(server, client, entity, false);
      }
    }
    for (const characterId in server._worldLootableConstruction) {
      const entity = server._worldLootableConstruction[characterId];
      if (
        isPosInRadius(
          (entity.npcRenderDistance as number) ||
            server.charactersRenderDistance,
          client.character.state.position,
          entity.state.position
        )
      ) {
        this.spawnLootableConstruction(server, client, entity);
      }
    }
  }

  hammerConstructionEntity(
    server: ZoneServer2016,
    client: Client,
    weaponItem: LoadoutItem
  ) {
    const entity = server.getConstructionEntity(
      client.character.currentInteractionGuid || ""
    );
    if (!entity) return;
    if (!client.character.temporaryScrapSoundTimeout) {
      let accumulatedItemDamage = 0;
      server.sendCompositeEffectToAllInRange(
        15,
        client.character.characterId,
        entity.state.position,
        1605
      );
      if (entity instanceof ConstructionParentEntity) {
        Object.values(entity.occupiedExpansionSlots).forEach(
          (expansion: ConstructionParentEntity) => {
            // repair every object on each expansion
            Object.values(expansion.occupiedShelterSlots).forEach(
              (child: ConstructionChildEntity) => {
                accumulatedItemDamage =
                  server.constructionManager.repairChildEntity(
                    server,
                    child,
                    accumulatedItemDamage
                  );
              }
            );
            Object.values(expansion.occupiedWallSlots).forEach(
              (child: ConstructionChildEntity | ConstructionDoor) => {
                accumulatedItemDamage =
                  server.constructionManager.repairChildEntity(
                    server,
                    child,
                    accumulatedItemDamage
                  );
              }
            );
            Object.values(expansion.freeplaceEntities).forEach(
              (
                child:
                  | ConstructionChildEntity
                  | ConstructionDoor
                  | LootableConstructionEntity
              ) => {
                if (child.health >= 1000000) return;
                server.constructionManager.repairConstruction(
                  server,
                  child,
                  50000
                );
                accumulatedItemDamage += 15;
              }
            );
          }
        );
        // repair every object on main foundation
        Object.values(entity.occupiedShelterSlots).forEach(
          (child: ConstructionChildEntity) => {
            accumulatedItemDamage =
              server.constructionManager.repairChildEntity(
                server,
                child,
                accumulatedItemDamage
              );
          }
        );
        Object.values(entity.occupiedWallSlots).forEach(
          (child: ConstructionChildEntity | ConstructionDoor) => {
            accumulatedItemDamage = this.repairChildEntity(
              server,
              child,
              accumulatedItemDamage
            );
          }
        );
        Object.values(entity.freeplaceEntities).forEach(
          (
            child:
              | ConstructionChildEntity
              | ConstructionDoor
              | LootableConstructionEntity
          ) => {
            if (child.health >= 1000000) return;
            this.repairConstruction(server, child, 50000);
            accumulatedItemDamage += 15;
          }
        );
        if (entity.health < 1000000) {
          this.repairConstruction(server, entity, 50000);
          accumulatedItemDamage += 15;
        }
        server.damageItem(client, weaponItem, accumulatedItemDamage);
        client.character.temporaryScrapSoundTimeout = setTimeout(() => {
          delete client.character.temporaryScrapSoundTimeout;
        }, 1000);
        return;
      }
      accumulatedItemDamage = 50;
      this.repairConstruction(server, entity, 50000);
      accumulatedItemDamage += 15;
      client.character.temporaryScrapSoundTimeout = setTimeout(() => {
        delete client.character.temporaryScrapSoundTimeout;
      }, 1000);
    }
  }
  isConstructionInSecuredArea(
    server: ZoneServer2016,
    construction: SlottedConstructionEntity
  ) {
    /*switch (type) {
      case "simple":
        for (const a in this._constructionFoundations) {
          const foundation = this._constructionFoundations[a];
          // Linked to #1160
          if (!foundation) {
            return;
          }
          if (
            this._constructionFoundations[foundation.parentObjectCharacterId]
          ) {
            if (
              foundation.isSecured &&
              foundation.isInside(construction.state.position)
            )
              return true;
            else return false;
          }
          if (
            foundation.isSecured &&
            foundation.isInside(construction.state.position)
          )
            return true;
        }
      case "door":
        if (construction.itemDefinitionId == Items.METAL_GATE) return false;
        for (const a in this._constructionFoundations) {
          const foundation = this._constructionFoundations[a];
          if (
            this._constructionFoundations[foundation.parentObjectCharacterId]
          ) {
            if (
              foundation.isSecured &&
              foundation.isInside(construction.state.position)
            )
              return true;
            else return false;
          }
          if (
            foundation.isSecured &&
            foundation.isInside(construction.state.position)
          )
            return true;
        }
    }
    return false;*/
    const gates: number[] = [
      Items.METAL_GATE,
      Items.METAL_WALL,
      Items.METAL_WALL_UPPER,
      Items.METAL_DOORWAY,
    ];
    const doors: number[] = [
      Items.DOOR_BASIC,
      Items.DOOR_METAL,
      Items.DOOR_WOOD,
    ];
    const parent = construction.getParent(server);
    const parentFoundation = construction.getParentFoundation(server);
    if (!parent && !parentFoundation) return false;
    if (parent?.isSecured || parentFoundation?.isSecured) {
      if (
        gates.includes(construction.itemDefinitionId) ||
        doors.includes(construction.itemDefinitionId)
      ) {
        if (
          ((parentFoundation?.itemDefinitionId == Items.FOUNDATION_EXPANSION ||
            parentFoundation?.itemDefinitionId == Items.GROUND_TAMPER) &&
            !doors.includes(construction.itemDefinitionId)) ||
          parentFoundation?.itemDefinitionId == Items.SHACK ||
          parentFoundation?.itemDefinitionId == Items.SHACK_BASIC ||
          parentFoundation?.itemDefinitionId == Items.SHACK_SMALL
        )
          return false;
        if (
          parentFoundation?.itemDefinitionId == Items.FOUNDATION ||
          parentFoundation?.itemDefinitionId == Items.GROUND_TAMPER
        ) {
          if (
            doors.includes(construction.itemDefinitionId) &&
            parent &&
            (parent.itemDefinitionId == Items.SHELTER || Items.SHELTER_LARGE)
          ) {
            if (parentFoundation.isSecured) {
              return true;
            } else {
              return false;
            }
          }
          switch (construction.getSlotNumber()) {
            case 4:
            case 5:
            case 6:
              if (
                parentFoundation.occupiedExpansionSlots["1"] &&
                parentFoundation.occupiedExpansionSlots["1"].isSecured
              )
                return true;
              break;
            case 1:
            case 2:
            case 3:
              if (
                parentFoundation.occupiedExpansionSlots["2"] &&
                parentFoundation.occupiedExpansionSlots["2"].isSecured
              )
                return true;
              break;
            case 10:
            case 11:
            case 12:
              if (
                parentFoundation.occupiedExpansionSlots["3"] &&
                parentFoundation.occupiedExpansionSlots["3"].isSecured
              )
                return true;
              break;
            case 7:
            case 8:
            case 9:
              if (
                parentFoundation.occupiedExpansionSlots["4"] &&
                parentFoundation.occupiedExpansionSlots["4"].isSecured
              )
                return true;
              break;
          }
          return false;
        } else if (
          parentFoundation?.itemDefinitionId == Items.FOUNDATION_EXPANSION
        ) {
          if (
            doors.includes(construction.itemDefinitionId) &&
            parent &&
            (parent.itemDefinitionId == Items.SHELTER || Items.SHELTER_LARGE)
          ) {
            if (parentFoundation.isSecured) {
              return true;
            } else {
              return false;
            }
          }
        }
      }
      return true;
    } else return false;
  }

  sendBaseSecuredMessage(server: ZoneServer2016, client: Client) {
    server.sendAlert(
      client,
      "You must destroy the base's gate before affecting interior structures."
    );
  }

  checkConstructionDamage(
    server: ZoneServer2016,
    constructionCharId: string,
    damage: number,
    dictionary: any,
    position: Float32Array,
    entityPosition: Float32Array,
    source: string
  ) {
    switch (source) {
      case "vehicle":
        damage /= 12;
        break;
      case "ethanol":
        damage /= 3.2;
        break;
      case "fuel":
        damage /= 6;
        break;
    }
    const constructionObject: ConstructionEntity =
      dictionary[constructionCharId];
    switch (constructionObject.itemDefinitionId) {
      case Items.DOOR_METAL:
        damage *= 1.45;
        break;
      case Items.DOOR_WOOD:
        damage *= 2;
        break;
      case Items.SHACK_BASIC:
      case Items.DOOR_BASIC:
        damage *= 4;
        break;
      default:
        damage *= 0.8;
        break;
    }
    const distance = getDistance(entityPosition, position);
    if (constructionObject.useSimpleStruct) {
      constructionObject.damageSimpleNpc(
        server,
        {
          entity: "",
          damage:
            distance < constructionObject.damageRange
              ? damage
              : damage / Math.sqrt(distance),
        },
        dictionary
      );
    } else {
      constructionObject.damage(server, {
        entity: "",
        damage:
          distance < constructionObject.damageRange
            ? damage
            : damage / Math.sqrt(distance),
      });
      server.updateResourceToAllWithSpawnedEntity(
        constructionObject.characterId,
        constructionObject.health,
        ResourceIds.CONSTRUCTION_CONDITION,
        ResourceTypes.CONDITION,
        dictionary
      );
    }
    if (constructionObject.health > 0) return;

    constructionObject.destroy(server, 3000);
  }
}
