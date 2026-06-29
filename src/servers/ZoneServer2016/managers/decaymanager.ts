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

import { scheduler } from "timers/promises";
import { ZoneServer2016 } from "../zoneserver";
import { Items, ResourceIds, ResourceTypes } from "../models/enums";
import { LootableConstructionEntity } from "../entities/lootableconstructionentity";
import { ConstructionDoor } from "../entities/constructiondoor";
import { ConstructionChildEntity } from "../entities/constructionchildentity";
import { getDistance } from "../../../utils/utils";
import { Vehicle2016 as Vehicle } from "../entities/vehicle";
import { ConstructionParentEntity } from "../entities/constructionparententity";
import { dailyRepairMaterial } from "types/zoneserver";
import { BaseItem } from "../classes/baseItem";
import {
  ConstructionDecayWorker,
  EntityDecaySnapshot
} from "./constructiondecayworker";

export class DecayManager {
  /** MANAGED BY CONFIGMANAGER — offloads decay damage computation to a worker thread */
  useDecayWorker: boolean = true;
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

  public async run(server: ZoneServer2016) {
    await this.contructionExpirationCheck(server);
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
      void this.run(server);
    }, this.decayTickInterval);
  }

  private async contructionExpirationCheck(server: ZoneServer2016) {
    let destroyedGriefFoundations = 0;
    let i = 0;
    for (const a in server._constructionFoundations) {
      if (++i % 100 === 0) await scheduler.yield();
      const foundation = server._constructionFoundations[a];
      if (!foundation) continue;
      if (
        foundation.itemDefinitionId == Items.FOUNDATION ||
        foundation.itemDefinitionId == Items.GROUND_TAMPER
      ) {
        if (
          Date.now() - foundation.placementTime >=
          this.griefFoundationTimer * 3600000
        ) {
          if (
            Object.keys(foundation.occupiedWallSlots).length <
              this.griefCheckSlotAmount &&
            Object.keys(foundation.occupiedShelterSlots).length == 0 &&
            Object.keys(foundation.occupiedExpansionSlots).length == 0 &&
            // #1467: don't grief-wipe a deck that still holds re-homed
            // structures / loot as freeplace entities or ramps
            Object.keys(foundation.occupiedRampSlots).length == 0 &&
            Object.keys(foundation.freeplaceEntities).length == 0
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
      Object.values(foundation.occupiedExpansionSlots).forEach(
        (exp: ConstructionParentEntity) => {
          if (
            Object.keys(exp.occupiedWallSlots).length != 0 ||
            Object.keys(exp.occupiedShelterSlots).length != 0 ||
            Object.keys(exp.occupiedUpperWallSlots).length != 0 ||
            // #1467: freeplace structures / loot and ramps keep an expansion non-empty
            Object.keys(exp.freeplaceEntities).length != 0 ||
            Object.keys(exp.occupiedRampSlots).length != 0
          ) {
            expansionsEmpty = false;
          }
        }
      );
      if (!expansionsEmpty) continue;
      // #1467: a foundation is only "vacant" when nothing remains on it —
      // re-homed shelters / gates / loot live in freeplaceEntities (and ramps),
      // and must not be treated as empty or they get wiped on decay
      if (
        Object.keys(foundation.occupiedWallSlots).length == 0 &&
        Object.keys(foundation.occupiedShelterSlots).length == 0 &&
        Object.keys(foundation.occupiedUpperWallSlots).length == 0 &&
        Object.keys(foundation.freeplaceEntities).length == 0 &&
        Object.keys(foundation.occupiedRampSlots).length == 0
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

    // Build a spatial hash to avoid comparing every entity against every other one.
    // Each cell is sized to twice the damage range, so checking the surrounding
    // 3×3 cells is enough to find all nearby candidates.
    const cellSize = this.vehicleDamageRange * 2 || 100;
    const spatialHash = new Map<string, Vehicle[]>();
    for (const v of vehicleEntries) {
      const pos = v.state.position;
      const key = `${Math.floor(pos[0] / cellSize)},${Math.floor(pos[2] / cellSize)}`;
      let bucket = spatialHash.get(key);
      if (!bucket) {
        bucket = [];
        spatialHash.set(key, bucket);
      }
      bucket.push(v);
    }

    for (const vehicle of vehicleEntries) {
      const pos = vehicle.state.position;
      const cx = Math.floor(pos[0] / cellSize);
      const cz = Math.floor(pos[2] / cellSize);
      let neighbors = 0;
      for (let dx = -1; dx <= 1; dx++) {
        for (let dz = -1; dz <= 1; dz++) {
          const bucket = spatialHash.get(`${cx + dx},${cz + dz}`);
          if (!bucket) continue;
          for (const other of bucket) {
            if (other === vehicle) continue;
            if (
              getDistance(pos, other.state.position) <= this.vehicleDamageRange
            )
              neighbors++;
          }
        }
      }

      let damage = this.baseVehicleDamage;
      if (neighbors >= this.maxVehiclesPerArea)
        damage *= neighbors - this.maxVehiclesPerArea + 1;

      vehicle.damage(server, { entity: "Server.DecayManager", damage });
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
