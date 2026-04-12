//
//   GNU GENERAL PUBLIC LICENSE
//   Version 3, 29 June 2007
//   copyright (C) 2020 - 2021 Quentin Gruber
//   copyright (C) 2021 - 2026 H1emu community
//
//   https://github.com/QuentinGruber/h1z1-server
//   https://www.npmjs.com/package/h1z1-server
//
//   Based on https://github.com/psemu/soe-network
// ======================================================================

import { ZoneServer2016 } from "../zoneserver";
import { Items, ResourceIds, ResourceTypes } from "../models/enums";
import { LootableConstructionEntity } from "../entities/lootableconstructionentity";
import { ConstructionDoor } from "../entities/constructiondoor";
import { ConstructionChildEntity } from "../entities/constructionchildentity";
import { getDistance } from "../../../utils/utils";
import { ConstructionParentEntity } from "../entities/constructionparententity";
import { dailyRepairMaterial } from "types/zoneserver";
import { BaseItem } from "../classes/baseItem";
import {
  ConstructionDecayWorker,
  EntityDecaySnapshot
} from "./constructiondecayworker";

/** Returns true if an object has no own enumerable keys (avoids array allocation). */
function hasNoEntries(obj: object): boolean {
  for (const _ in obj) return false;
  return true;
}
/** Returns true if an object has at least one own enumerable key. */
function hasEntries(obj: object): boolean {
  for (const _ in obj) return true;
  return false;
}
/** Counts keys up to max, returning early once max is reached. */
function countKeysUpTo(obj: object, max: number): number {
  let n = 0;
  for (const _ in obj) { if (++n >= max) return n; }
  return n;
}

export class DecayManager {
  /** MANAGED BY CONFIGMANAGER — offloads decay damage computation to a worker thread */
  useDecayWorker: boolean = false;
  private _decayWorker?: ConstructionDecayWorker;

  /** Used for tracking the tick amount needed before decay damage occurs on the construction */
  constructionDamageTickCount = 0;

  /** Used for tracking the tick amount needed before decay damage occurs on the vehicle */
  vehicleDamageTickCount = 0; // used to run vehicle damaging once every x loops

  /** Timer used for determining the interval for decay ticks */
  runTimer?: NodeJS.Timeout;

  /** MANAGED BY CONFIGMANAGER - See defaultConfig.yaml for more information */
  decayTickInterval!: number;
  constructionDamageTicks!: number;
  ticksToFullDecay!: number;
  worldFreeplaceDecayMultiplier!: number;
  vehicleDamageTicks!: number;
  vacantFoundationTicks!: number;
  griefFoundationTimer!: number;
  griefCheckSlotAmount!: number;
  baseVehicleDamage!: number;
  maxVehiclesPerArea!: number;
  vehicleDamageRange!: number;
  dailyRepairMaterials!: dailyRepairMaterial[];

  public clearTimers() {
    if (this.runTimer) clearTimeout(this.runTimer);
    this._decayWorker?.stop();
  }

  private getOrCreateWorker(): ConstructionDecayWorker {
    if (!this._decayWorker) {
      this._decayWorker = new ConstructionDecayWorker();
    }
    return this._decayWorker;
  }

  public run(server: ZoneServer2016) {
    this.contructionExpirationCheck(server);
    if (this.constructionDamageTickCount >= this.constructionDamageTicks) {
      this.contructionDecayDamage(server);
      this.constructionDamageTickCount = -1;
    }
    this.constructionDamageTickCount++;

    if (this.vehicleDamageTickCount >= this.vehicleDamageTicks) {
      this.vehicleDecayDamage(server);
      this.vehicleDamageTickCount = -1;
    }
    this.vehicleDamageTickCount++;

    this.runTimer = setTimeout(() => {
      this.run(server);
    }, this.decayTickInterval);
  }

  private contructionExpirationCheck(server: ZoneServer2016) {
    let destroyedGriefFoundations = 0;
    for (const a in server._constructionFoundations) {
      const foundation = server._constructionFoundations[a];
      if (
        foundation.itemDefinitionId == Items.FOUNDATION ||
        foundation.itemDefinitionId == Items.GROUND_TAMPER
      ) {
        if (
          Date.now() - foundation.placementTime >=
          this.griefFoundationTimer * 3600000
        ) {
          if (
            countKeysUpTo(foundation.occupiedWallSlots, this.griefCheckSlotAmount) < this.griefCheckSlotAmount &&
            hasNoEntries(foundation.occupiedShelterSlots) &&
            hasNoEntries(foundation.occupiedExpansionSlots)
          ) {
            for (const a in foundation.occupiedWallSlots) {
              foundation.occupiedWallSlots[a].destroy(server);
            }
            // clear floating entities
            for (const a in foundation.freeplaceEntities) {
              foundation.freeplaceEntities[a].destroy(server);
            }
            foundation.destroy(server);
            destroyedGriefFoundations++;
          }
        }
      }

      if (
        foundation.itemDefinitionId != Items.FOUNDATION &&
        foundation.itemDefinitionId != Items.GROUND_TAMPER
      ) {
        continue;
      }
      let expansionsEmpty = true;
      for (const exp of Object.values(foundation.occupiedExpansionSlots)) {
        if (
          hasEntries(exp.occupiedWallSlots) ||
          hasEntries(exp.occupiedShelterSlots) ||
          hasEntries(exp.occupiedUpperWallSlots)
        ) {
          expansionsEmpty = false;
          break;
        }
      }
      if (!expansionsEmpty) continue;
      if (
        hasNoEntries(foundation.occupiedWallSlots) &&
        hasNoEntries(foundation.occupiedShelterSlots) &&
        hasNoEntries(foundation.occupiedUpperWallSlots)
      ) {
        if (foundation.ticksWithoutObjects >= this.vacantFoundationTicks) {
          for (const a in foundation.occupiedExpansionSlots) {
            const expansion = foundation.occupiedExpansionSlots[a];
            for (const a in expansion.occupiedRampSlots) {
              expansion.occupiedRampSlots[a].destroy(server);
            }
            // clear floating shelters / other entities on expansion
            for (const a in expansion.freeplaceEntities) {
              expansion.freeplaceEntities[a].destroy(server);
            }
            expansion.destroy(server);
          }
          for (const a in foundation.occupiedRampSlots) {
            foundation.occupiedRampSlots[a].destroy(server);
          }
          // clear floating shelters / other entities
          for (const a in foundation.freeplaceEntities) {
            foundation.freeplaceEntities[a].destroy(server);
          }
          Object.values(foundation.freeplaceEntities).forEach(
            (
              entity:
                | LootableConstructionEntity
                | ConstructionDoor
                | ConstructionChildEntity
            ) => {
              entity.destroy(server);
            }
          );
          foundation.destroy(server);
        }
        foundation.ticksWithoutObjects++;
      } else {
        foundation.ticksWithoutObjects = 0;
      }
    }
    if (destroyedGriefFoundations > 0) {
      console.log(`Destroyed ${destroyedGriefFoundations} grief foundations`);
    }
  }

  private decayDamage(
    server: ZoneServer2016,
    entity:
      | LootableConstructionEntity
      | ConstructionDoor
      | ConstructionChildEntity,
    freeplaceDecayMultiplier: number = 1
  ) {
    if (entity.isDecayProtected) {
      entity.isDecayProtected = false;
      return;
    }

    entity.damage(server, {
      entity: "Server.DecayManager",
      damage:
        entity.maxHealth / (this.ticksToFullDecay / freeplaceDecayMultiplier)
    });
  }

  // uses repair box if one is detected on the base and it has the required materials
  useRepairBox(server: ZoneServer2016, foundation: ConstructionParentEntity) {
    for (const b in foundation.freeplaceEntities) {
      const freePlace = foundation.freeplaceEntities[b];
      if (
        freePlace.itemDefinitionId != Items.REPAIR_BOX ||
        !(freePlace instanceof LootableConstructionEntity)
      ) {
        continue;
      }

      const container = freePlace.getContainer();
      if (!container) continue;
      let hasMaterials = true;
      const itemsToRemove: { item: BaseItem; count: number }[] = [];
      this.dailyRepairMaterials.forEach((material: dailyRepairMaterial) => {
        let materialPresent = false;
        for (const c in container.items) {
          const item = container.items[c];
          if (
            item.itemDefinitionId == material.itemDefinitionId &&
            item.stackCount >= material.requiredCount
          ) {
            materialPresent = true;
            itemsToRemove.push({
              item: item,
              count: material.requiredCount
            });
          }
        }
        if (!materialPresent) hasMaterials = false;
      });

      if (!hasMaterials) continue;

      itemsToRemove.forEach(
        (itemToRemove: { item: BaseItem; count: number }) => {
          server.removeContainerItem(
            freePlace,
            itemToRemove.item,
            container,
            itemToRemove.count
          );
        }
      );
      server.constructionManager.fullyRepairFoundation(server, foundation);
      return;
    }
  }

  contructionDecayDamage(server: ZoneServer2016) {
    // Run repair boxes first (needs live server refs, stays on main thread)
    for (const a in server._constructionFoundations) {
      this.useRepairBox(server, server._constructionFoundations[a]);
    }

    if (this.useDecayWorker) {
      this._contructionDecayDamageWorker(server);
    } else {
      this._contructionDecayDamageSync(server);
    }
  }

  /** Synchronous fallback — original logic */
  private _contructionDecayDamageSync(server: ZoneServer2016) {
    for (const a in server._constructionFoundations) {
      const foundation = server._constructionFoundations[a];
      if (
        foundation.itemDefinitionId != Items.FOUNDATION &&
        foundation.itemDefinitionId != Items.GROUND_TAMPER &&
        foundation.itemDefinitionId != Items.FOUNDATION_EXPANSION
      ) {
        this.decayDamage(server, foundation);
      }
    }
    for (const a in server._worldLootableConstruction) {
      this.decayDamage(
        server,
        server._worldLootableConstruction[a],
        this.worldFreeplaceDecayMultiplier
      );
    }
    for (const a in server._worldSimpleConstruction) {
      this.decayDamage(
        server,
        server._worldSimpleConstruction[a],
        this.worldFreeplaceDecayMultiplier
      );
    }
    for (const a in server._constructionSimple) {
      const simple = server._constructionSimple[a];
      if (
        simple.itemDefinitionId == Items.FOUNDATION_RAMP ||
        simple.itemDefinitionId == Items.FOUNDATION_STAIRS
      ) {
        continue;
      }
      this.decayDamage(server, simple);
    }
    for (const a in server._lootableConstruction) {
      this.decayDamage(server, server._lootableConstruction[a]);
    }
    for (const a in server._constructionDoors) {
      this.decayDamage(server, server._constructionDoors[a]);
    }
  }

  /** Worker-based path — serializes snapshots, applies action list on main thread */
  private _contructionDecayDamageWorker(server: ZoneServer2016) {
    const toSnapshot = (
      entity:
        | LootableConstructionEntity
        | ConstructionDoor
        | ConstructionChildEntity
        | ConstructionParentEntity,
      skipDecay: boolean
    ): EntityDecaySnapshot => ({
      characterId: entity.characterId,
      isDecayProtected: entity.isDecayProtected,
      maxHealth: entity.maxHealth,
      skipDecay
    });

    const foundations: EntityDecaySnapshot[] = [];
    for (const a in server._constructionFoundations) {
      const f = server._constructionFoundations[a];
      const skip =
        f.itemDefinitionId === Items.FOUNDATION ||
        f.itemDefinitionId === Items.GROUND_TAMPER ||
        f.itemDefinitionId === Items.FOUNDATION_EXPANSION;
      foundations.push(toSnapshot(f, skip));
    }

    const worldLootable = Object.values(server._worldLootableConstruction).map(
      (e) => toSnapshot(e, false)
    );
    const worldSimple = Object.values(server._worldSimpleConstruction).map(
      (e) => toSnapshot(e, false)
    );
    const constructionSimple: EntityDecaySnapshot[] = [];
    for (const a in server._constructionSimple) {
      const s = server._constructionSimple[a];
      const skip =
        s.itemDefinitionId === Items.FOUNDATION_RAMP ||
        s.itemDefinitionId === Items.FOUNDATION_STAIRS;
      constructionSimple.push(toSnapshot(s, skip));
    }
    const lootableConstruction = Object.values(
      server._lootableConstruction
    ).map((e) => toSnapshot(e, false));
    const constructionDoors = Object.values(server._constructionDoors).map(
      (e) => toSnapshot(e, false)
    );

    this.getOrCreateWorker()
      .computeDecayDamage({
        ticksToFullDecay: this.ticksToFullDecay,
        worldFreeplaceDecayMultiplier: this.worldFreeplaceDecayMultiplier,
        foundations,
        worldLootable,
        worldSimple,
        constructionSimple,
        lootableConstruction,
        constructionDoors
      })
      .then(({ entitiesToDamage, decayProtectedResets }) => {
        // Reset isDecayProtected flags
        for (const charId of decayProtectedResets) {
          const entity = server.getConstructionEntity(charId);
          if (entity) entity.isDecayProtected = false;
        }
        // Apply damage
        for (const { characterId, damage } of entitiesToDamage) {
          const entity = server.getConstructionEntity(characterId);
          if (!entity) continue;
          entity.damage(server, { entity: "Server.DecayManager", damage });
        }
      })
      .catch((err) => {
        console.error("Construction decay worker error:", err);
      });
  }

  public vehicleDecayDamage(server: ZoneServer2016) {
    const vehicleEntries = Object.values(server._vehicles);
    const n = vehicleEntries.length;
    if (n === 0) return;

    // Build neighbor counts in a single O(n²/2) pass instead of O(n²) per vehicle
    const neighborCount = new Int32Array(n);
    for (let i = 0; i < n; i++) {
      for (let j = i + 1; j < n; j++) {
        if (
          getDistance(
            vehicleEntries[i].state.position,
            vehicleEntries[j].state.position
          ) <= this.vehicleDamageRange
        ) {
          neighborCount[i]++;
          neighborCount[j]++;
        }
      }
    }

    for (let i = 0; i < n; i++) {
      const vehicle = vehicleEntries[i];
      if (!vehicle) continue;
      let damage = this.baseVehicleDamage;
      if (neighborCount[i] >= this.maxVehiclesPerArea) {
        damage *= neighborCount[i] - this.maxVehiclesPerArea + 1;
      }
      vehicle.damage(server, {
        entity: "Server.DecayManager",
        damage: damage
      });
      server.updateResourceToAllWithSpawnedEntity(
        vehicle.characterId,
        vehicle._resources[ResourceIds.CONDITION],
        ResourceIds.CONDITION,
        ResourceTypes.CONDITION,
        server._vehicles
      );
      if (vehicle.getHealth() > 0) continue;
      vehicle.destroy(server);
    }
  }

  /*private decayChildEntity(
    server: ZoneServer2016,
    entity: ConstructionChildEntity | ConstructionDoor
  ) {
    if (entity instanceof ConstructionChildEntity) {
      Object.values(entity.occupiedShelterSlots).forEach(
        (slot: ConstructionChildEntity) => {
          this.decayChildEntity(server, slot);
        }
      );
      Object.values(entity.occupiedWallSlots).forEach(
        (wall: ConstructionDoor | ConstructionChildEntity) => {
          this.decayDamage(server, wall);
        }
      );
      Object.values(entity.occupiedUpperWallSlots).forEach(
        (slot: ConstructionDoor | ConstructionChildEntity) => {
          this.decayDamage(server, slot);
        }
      );
    }
    this.decayDamage(server, entity);
  }*/
}
