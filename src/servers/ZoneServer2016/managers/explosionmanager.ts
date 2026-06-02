// ======================================================================
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
import { BaseEntity } from "../entities/baseentity";
import { ExplosiveEntity } from "../entities/explosiveentity";
import { ProjectileEntity } from "../entities/projectileentity";
import { ConstructionChildEntity } from "../entities/constructionchildentity";
import { ConstructionParentEntity } from "../entities/constructionparententity";
import { ConstructionDoor } from "../entities/constructiondoor";
import { ZoneClient2016 } from "../classes/zoneclient";
import { isChristmasSeason } from "../../../utils/utils";
import { Effects, Items } from "../models/enums";
import { ExplosionWorker } from "./explosionworker";
import type {
  ChunkSnapshot,
  ExplosionPlan,
  ConstructionSnapshot
} from "./explosion.worker";

/** Max grid search radius covering all construction damageRange values (max ~9.75m with 1.5x) */
const EXPLOSION_GRID_RADIUS = 15;
const EXPLOSION_CHARACTER_RADIUS = 5;
const EXPLOSION_CHARACTER_Y_RADIUS = 3;
/** Number of explosions to process per event-loop tick.
 *  Kept moderate so the event loop stays responsive under extreme load. */
const CHUNK_SIZE = 200;

/** Item IDs whose construction damage is not divided (IED / landmine = full base damage) */
const FULL_DAMAGE_IDS = new Set([Items.IED, Items.LANDMINE]);
/** Shack foundations that can receive direct explosion damage */
const SHACK_IDS = new Set([Items.SHACK, Items.SHACK_SMALL, Items.SHACK_BASIC]);
/** Ramp/stairs construction that is immune to explosion damage */
const IMMUNE_IDS = new Set([Items.FOUNDATION_RAMP, Items.FOUNDATION_STAIRS]);

interface PendingExplosion {
  entity: BaseEntity;
  client?: ZoneClient2016;
}

function charBaseDamage(entity: BaseEntity): number {
  if (entity instanceof ExplosiveEntity) return 50000;
  if (entity instanceof ProjectileEntity) {
    return entity.actorModelId === 0 ? 8000 : 10000;
  }
  return 10000;
}

function vehicleBaseDamage(entity: BaseEntity): number {
  if (entity instanceof ExplosiveEntity) return 100000;
  if (entity instanceof ProjectileEntity) {
    return entity.actorModelId === 0 ? 50000 : 100000;
  }
  return 100000;
}

function constructionBaseDamage(
  entity: BaseEntity,
  serverBase: number
): number {
  if (entity instanceof ExplosiveEntity) {
    if (FULL_DAMAGE_IDS.has(entity.itemDefinitionId)) return serverBase;
    if (entity.itemDefinitionId === Items.FUEL_ETHANOL) return serverBase / 2.7;
    if (entity.itemDefinitionId === Items.FUEL_BIOFUEL) return serverBase / 3;
    return serverBase / 12;
  }
  return serverBase / 12;
}

function attackerId(entity: BaseEntity): string {
  if (entity instanceof ProjectileEntity) return entity.managerCharacterId;
  return entity.characterId;
}

function weaponId(entity: BaseEntity): number | undefined {
  if (entity instanceof ExplosiveEntity) return entity.itemDefinitionId;
  if (entity instanceof ProjectileEntity) return entity.itemDefinitionId;
  return undefined;
}

/**
 * Batches all queued explosion events so that large simultaneous blasts
 * are processed without blocking the main thread.
 *
 * Key optimisations vs. the previous implementation:
 *  1. Worker thread — character, vehicle, and construction damage math runs
 *     off the main thread; the main thread only applies the resulting plan.
 *  2. Construction deduplication — nearby construction entities are collected
 *     once per chunk (not once per explosion), so the grid lookup cost is
 *     O(unique_positions) rather than O(chunk_size).
 *  3. Character AABB pre-filter — a bounding box covering all explosion
 *     positions in the chunk prunes distant characters before sending to
 *     the worker, keeping the postMessage payload small.
 *  4. setImmediate chunking — yields the event loop between CHUNK_SIZE
 *     batches so network I/O can interleave.
 *  5. Deduplication — each entity is queued at most once per flush cycle.
 */
export class ExplosionManager {
  private readonly _server: ZoneServer2016;
  private readonly _worker: ExplosionWorker;
  /** Explosions waiting to be processed */
  private _pending: PendingExplosion[] = [];
  /** characterIds already enqueued this cycle */
  private _queued = new Set<string>();
  private _scheduled = false;

  constructor(server: ZoneServer2016) {
    this._server = server;
    this._worker = new ExplosionWorker();
  }

  /**
   * Enqueue an explosion for batched processing.
   * Returns false if the entity was already queued this cycle.
   */
  queueExplosion(entity: BaseEntity, client?: ZoneClient2016): boolean {
    if (this._queued.has(entity.characterId)) return false;
    this._queued.add(entity.characterId);
    this._pending.push({ entity, client });
    if (!this._scheduled) {
      this._scheduled = true;
      setImmediate(() => void this._flush());
    }
    return true;
  }

  async stop(): Promise<void> {
    await this._worker.stop();
  }

  // ---- Private --------------------------------------------------------

  private _registerSounds(chunk: PendingExplosion[]) {
    for (let index = 0; index < chunk.length; index++) {
      const e = chunk[index];
      let position = e.entity.state.position;
      this._server.sounds.push({ position, radius: 300, agitation: 50 });
    }
  }

  private async _flush(): Promise<void> {
    this._scheduled = false;
    const batch = this._pending.splice(0);
    this._queued.clear();
    if (batch.length === 0) return;

    for (let i = 0; i < batch.length; i += CHUNK_SIZE) {
      const chunk = batch.slice(i, i + CHUNK_SIZE);

      // Visual effects — stays on main thread (just packet sends, cheap).
      this._sendEffects(chunk);

      // TODO: idk if it's the right place
      this._registerSounds(chunk);

      // Single combined grid scan: triggers chain reactions AND builds the
      // construction snapshot in one pass, deduplicating by explosion position
      // so same-location blasts only scan the grid once.
      const snapshot = this._scanAndBuildSnapshot(chunk);
      let plan: ExplosionPlan;
      try {
        plan = await this._worker.processChunk(snapshot);
      } catch {
        // Worker failure: fall back to synchronous processing for this chunk.
        plan = this._processChunkSync(snapshot);
      }

      // Apply the plan — only fast O(plan_entries) work on the main thread.
      this._applyPlan(plan);

      // Batch-delete ExplosiveEntity instances from this chunk.
      const explosiveIds = chunk
        .filter(({ entity }) => entity instanceof ExplosiveEntity)
        .map(({ entity }) => entity.characterId);
      if (explosiveIds.length > 0) {
        this._server.batchDeleteEntities(
          explosiveIds,
          this._server._explosives
        );
      }

      if (i + CHUNK_SIZE < batch.length) {
        await new Promise<void>((resolve) => setImmediate(resolve));
      }
    }

    // Chain reactions may have queued new explosions during _handleGridObjects.
    if (this._pending.length > 0 && !this._scheduled) {
      this._scheduled = true;
      setImmediate(() => void this._flush());
    }
  }

  /** Send particle effects for ExplosiveEntity blasts. Deduplicates on a 5m grid. */
  private _sendEffects(chunk: PendingExplosion[]): void {
    const christmas = isChristmasSeason();
    const effectCells = new Set<string>();
    for (const { entity } of chunk) {
      if (!(entity instanceof ExplosiveEntity)) continue;
      const pos = entity.state.position;
      const key = `${Math.floor(pos[0] / 5)},${Math.floor(pos[2] / 5)}`;
      if (effectCells.has(key)) continue;
      effectCells.add(key);
      this._server.sendCompositeEffectToAllInRange(
        600,
        "",
        pos,
        Effects.PFX_Impact_Explosion_Landmine_Dirt_10m
      );
      if (christmas) {
        this._server.sendCompositeEffectToAllInRange(
          600,
          "",
          pos,
          Effects.PFX_Seasonal_Holiday_Snow_skel
        );
      }
    }
  }

  /**
   * Single combined grid scan + snapshot builder for the whole chunk.
   *
   * Two separate passes (_handleGridObjects + _buildSnapshot) each called
   * getGridCellsInRadius once per explosion — O(chunk_size) redundant lookups
   * for same-position blasts. This merges them into one pass and deduplicates
   * by rounding explosion positions to a 1m grid, so 200 IEDs at the same
   * spot only scan the grid once.
   */
  private _scanAndBuildSnapshot(chunk: PendingExplosion[]): ChunkSnapshot {
    const server = this._server;

    // ---- Explosions (serialised for worker) ------------------------
    const explosions = chunk.map(({ entity }) => ({
      x: entity.state.position[0],
      y: entity.state.position[1],
      z: entity.state.position[2],
      charBaseDamage: charBaseDamage(entity),
      vehicleBaseDamage: vehicleBaseDamage(entity),
      constructionDamage: constructionBaseDamage(
        entity,
        server.baseConstructionDamage
      ),
      attackerId: attackerId(entity),
      weaponId: weaponId(entity)
    }));

    // ---- Grid scan (one lookup per unique 1m position key) ---------
    // Multiple explosions at the same spot produce identical grid lookups.
    // Keep one representative (entity, client) per key so chain reactions
    // are still triggered exactly once per nearby un-detonated IED.
    const scannedKeys = new Map<string, PendingExplosion>();
    for (const pe of chunk) {
      const p = pe.entity.state.position;
      const key = `${Math.round(p[0])},${Math.round(p[2])}`;
      if (!scannedKeys.has(key)) scannedKeys.set(key, pe);
    }

    const constructionMap = new Map<string, ConstructionSnapshot>();
    for (const { entity, client } of scannedKeys.values()) {
      const cells = server.getGridCellsInRadius(
        entity.state.position,
        EXPLOSION_GRID_RADIUS
      );
      for (const cell of cells) {
        for (const obj of cell.objects) {
          if (obj instanceof ExplosiveEntity && obj.detonated) continue;

          if (obj instanceof ConstructionChildEntity) {
            if (constructionMap.has(obj.characterId)) continue;
            if (IMMUNE_IDS.has(obj.itemDefinitionId)) continue;
            if (
              server.constructionManager.isConstructionInSecuredArea(
                server,
                obj
              )
            )
              continue;
            const isSimple = !!server._worldSimpleConstruction[obj.characterId];
            const pos = obj.fixedPosition ?? obj.state.position;
            constructionMap.set(obj.characterId, {
              entityId: obj.characterId,
              x: pos[0],
              y: pos[1],
              z: pos[2],
              damageRange: obj.damageRange,
              explosionRadius: isSimple ? 4 : obj.damageRange * 1.5
            });
          } else if (obj instanceof ConstructionDoor) {
            if (constructionMap.has(obj.characterId)) continue;
            if (
              server.constructionManager.isConstructionInSecuredArea(
                server,
                obj
              )
            )
              continue;
            constructionMap.set(obj.characterId, {
              entityId: obj.characterId,
              x: obj.state.position[0],
              y: obj.state.position[1],
              z: obj.state.position[2],
              damageRange: obj.damageRange,
              explosionRadius: obj.damageRange
            });
          } else if (
            obj instanceof ConstructionParentEntity &&
            SHACK_IDS.has(obj.itemDefinitionId)
          ) {
            if (constructionMap.has(obj.characterId)) continue;
            constructionMap.set(obj.characterId, {
              entityId: obj.characterId,
              x: obj.state.position[0],
              y: obj.state.position[1],
              z: obj.state.position[2],
              damageRange: obj.damageRange,
              explosionRadius: obj.damageRange * 1.5
            });
          } else {
            // Chain reactions (ExplosiveEntity within 2m), traps, destroyables —
            // keep on main thread since they mutate live state directly.
            obj.OnExplosiveHit(server, entity, client);
          }
        }
      }
    }

    // ---- Characters (pre-filtered by extended AABB) ----------------
    let minX = Infinity,
      maxX = -Infinity,
      minY = Infinity,
      maxY = -Infinity,
      minZ = Infinity,
      maxZ = -Infinity;
    for (const { entity } of chunk) {
      const p = entity.state.position;
      if (p[0] < minX) minX = p[0];
      if (p[0] > maxX) maxX = p[0];
      if (p[1] < minY) minY = p[1];
      if (p[1] > maxY) maxY = p[1];
      if (p[2] < minZ) minZ = p[2];
      if (p[2] > maxZ) maxZ = p[2];
    }
    minX -= EXPLOSION_CHARACTER_RADIUS;
    maxX += EXPLOSION_CHARACTER_RADIUS;
    minY -= EXPLOSION_CHARACTER_Y_RADIUS;
    maxY += EXPLOSION_CHARACTER_Y_RADIUS;
    minZ -= EXPLOSION_CHARACTER_RADIUS;
    maxZ += EXPLOSION_CHARACTER_RADIUS;

    const characters = server.isPvE
      ? []
      : Object.entries(server._characters)
          .filter(([, char]) => {
            if (!char.isAlive) return false;
            const p = char.state.position;
            return (
              p[0] >= minX &&
              p[0] <= maxX &&
              p[1] >= minY &&
              p[1] <= maxY &&
              p[2] >= minZ &&
              p[2] <= maxZ
            );
          })
          .map(([characterId, char]) => ({
            characterId,
            x: char.state.position[0],
            y: char.state.position[1],
            z: char.state.position[2]
          }));

    // TODO: ask Jason if it's good
    for (const npc of Object.values(server._npcs)) {
      if (!npc.isAlive) continue;
      const p = npc.state.position;
      if (
        p[0] < minX ||
        p[0] > maxX ||
        p[1] < minY ||
        p[1] > maxY ||
        p[2] < minZ ||
        p[2] > maxZ
      )
        continue;
      for (const { entity } of scannedKeys.values()) {
        npc.OnExplosiveHit(server, entity);
      }
    }

    // ---- Vehicles --------------------------------------------------
    const vehicles = server.isPvE
      ? []
      : Object.entries(server._vehicles).map(([vehicleId, veh]) => ({
          vehicleId,
          x: veh.state.position[0],
          y: veh.state.position[1],
          z: veh.state.position[2]
        }));

    return {
      explosions,
      characters,
      vehicles,
      construction: Array.from(constructionMap.values())
    };
  }

  /** Apply the worker's damage plan — O(plan entries), no heavy computation. */
  private _applyPlan(plan: ExplosionPlan): void {
    const server = this._server;

    for (const entry of plan.characterDamages) {
      const char = server._characters[entry.characterId];
      if (!char?.isAlive) continue;
      char.damage(server, {
        entity: entry.attackerId,
        weapon: entry.weapon,
        damage: entry.damage
      });
    }

    for (const entry of plan.vehicleDamages) {
      const veh = server._vehicles[entry.vehicleId];
      if (!veh) continue;
      veh.damage(server, { entity: entry.attackerId, damage: entry.damage });
    }

    for (const entry of plan.constructionDamages) {
      const obj =
        server._constructionSimple[entry.entityId] ??
        server._constructionFoundations[entry.entityId] ??
        server._constructionDoors[entry.entityId];
      if (!obj) continue;
      obj.damage(server, {
        entity: entry.attackerId,
        damage: entry.totalDamage,
        explosive: true
      });
    }
  }

  /**
   * Synchronous fallback used when the worker errors.
   * Mirrors the worker's processChunk logic but runs on the main thread.
   */
  private _processChunkSync(snapshot: ChunkSnapshot): ExplosionPlan {
    const { explosions, characters, vehicles, construction } = snapshot;

    const characterDamages = characters
      .map((char) => {
        let totalDamage = 0,
          lastAttacker = "",
          lastWeapon: number | undefined;
        for (const exp of explosions) {
          const dx = char.x - exp.x;
          if (Math.abs(dx) > EXPLOSION_CHARACTER_RADIUS) continue;
          const dz = char.z - exp.z;
          if (Math.abs(dz) > EXPLOSION_CHARACTER_RADIUS) continue;
          const dy = char.y - exp.y;
          if (Math.abs(dy) > EXPLOSION_CHARACTER_Y_RADIUS) continue;
          const d = Math.sqrt(dx * dx + dy * dy + dz * dz);
          totalDamage += d > 1 ? exp.charBaseDamage / d : exp.charBaseDamage;
          lastAttacker = exp.attackerId;
          lastWeapon = exp.weaponId;
        }
        return totalDamage >= 1 && lastAttacker
          ? {
              characterId: char.characterId,
              damage: Math.floor(totalDamage),
              attackerId: lastAttacker,
              weapon: lastWeapon
            }
          : null;
      })
      .filter(Boolean) as ExplosionPlan["characterDamages"];

    const vehicleDamages = vehicles
      .map((veh) => {
        let totalDamage = 0,
          lastAttacker = "";
        for (const exp of explosions) {
          const dx = veh.x - exp.x,
            dy = veh.y - exp.y,
            dz = veh.z - exp.z;
          const sq = dx * dx + dy * dy + dz * dz;
          if (sq > 25) continue;
          const d = Math.sqrt(sq);
          totalDamage +=
            d > 1 ? exp.vehicleBaseDamage / d : exp.vehicleBaseDamage;
          lastAttacker = exp.attackerId;
        }
        return totalDamage >= 1 && lastAttacker
          ? {
              vehicleId: veh.vehicleId,
              damage: Math.floor(totalDamage),
              attackerId: lastAttacker
            }
          : null;
      })
      .filter(Boolean) as ExplosionPlan["vehicleDamages"];

    const constructionDamages: ExplosionPlan["constructionDamages"] = [];
    for (const cons of construction) {
      let totalDamage = 0,
        lastAttacker = "";
      const rSq = cons.explosionRadius * cons.explosionRadius;
      for (const exp of explosions) {
        const dx = cons.x - exp.x,
          dy = cons.y - exp.y,
          dz = cons.z - exp.z;
        const sq = dx * dx + dy * dy + dz * dz;
        if (sq > rSq) continue;
        const d = Math.sqrt(sq);
        totalDamage +=
          d < cons.damageRange
            ? exp.constructionDamage
            : exp.constructionDamage / Math.sqrt(d);
        lastAttacker = exp.attackerId;
      }
      if (totalDamage >= 1 && lastAttacker)
        constructionDamages.push({
          entityId: cons.entityId,
          totalDamage: Math.floor(totalDamage),
          attackerId: lastAttacker
        });
    }

    return { characterDamages, vehicleDamages, constructionDamages };
  }
}
