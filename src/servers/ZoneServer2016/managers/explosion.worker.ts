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

import { parentPort } from "worker_threads";

// ---- Constants (must stay in sync with explosionmanager.ts) ----------
const EXPLOSION_CHARACTER_RADIUS = 5;
const EXPLOSION_CHARACTER_Y_RADIUS = 3;
const EXPLOSION_VEHICLE_RADIUS = 5;

// ---- Snapshot types sent from the main thread ------------------------

export interface ExplosionEntry {
  x: number;
  y: number;
  z: number;
  /** charBaseDamage(entity) — pre-computed on main thread */
  charBaseDamage: number;
  /** vehicleBaseDamage(entity) — pre-computed on main thread */
  vehicleBaseDamage: number;
  /** base construction damage after item-type multiplier — pre-computed */
  constructionDamage: number;
  attackerId: string;
  weaponId?: number;
}

export interface CharacterSnapshot {
  characterId: string;
  x: number;
  y: number;
  z: number;
}

export interface VehicleSnapshot {
  vehicleId: string;
  x: number;
  y: number;
  z: number;
}

export interface ConstructionSnapshot {
  entityId: string;
  /** Effective position — fixedPosition if present, else state.position */
  x: number;
  y: number;
  z: number;
  damageRange: number;
  /** Pre-computed hit radius — isSimple ? 4 : damageRange*1.5 (or damageRange for doors) */
  explosionRadius: number;
}

export interface ChunkSnapshot {
  explosions: ExplosionEntry[];
  characters: CharacterSnapshot[];
  vehicles: VehicleSnapshot[];
  construction: ConstructionSnapshot[];
}

// ---- Plan types returned to the main thread --------------------------

export interface CharacterDamageEntry {
  characterId: string;
  damage: number;
  attackerId: string;
  weapon?: number;
}

export interface VehicleDamageEntry {
  vehicleId: string;
  damage: number;
  attackerId: string;
}

export interface ConstructionDamageEntry {
  entityId: string;
  totalDamage: number;
  attackerId: string;
}

export interface ExplosionPlan {
  characterDamages: CharacterDamageEntry[];
  vehicleDamages: VehicleDamageEntry[];
  constructionDamages: ConstructionDamageEntry[];
}

// ---- Wire protocol ---------------------------------------------------

interface WorkerRequest {
  requestId: number;
  snapshot: ChunkSnapshot;
}

interface WorkerResponse {
  requestId: number;
  plan?: ExplosionPlan;
  error?: string;
}

// ---- Pure computation ------------------------------------------------

function sqDist(
  ax: number,
  ay: number,
  az: number,
  bx: number,
  by: number,
  bz: number
): number {
  const dx = ax - bx,
    dy = ay - by,
    dz = az - bz;
  return dx * dx + dy * dy + dz * dz;
}

function processChunk(snapshot: ChunkSnapshot): ExplosionPlan {
  const { explosions, characters, vehicles, construction } = snapshot;

  // ---- Characters -----------------------------------------------------
  const characterDamages: CharacterDamageEntry[] = [];
  for (const char of characters) {
    let totalDamage = 0;
    let lastAttacker = "";
    let lastWeapon: number | undefined;

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

    if (totalDamage >= 1 && lastAttacker) {
      characterDamages.push({
        characterId: char.characterId,
        damage: Math.floor(totalDamage),
        attackerId: lastAttacker,
        weapon: lastWeapon
      });
    }
  }

  // ---- Vehicles -------------------------------------------------------
  const vehicleDamages: VehicleDamageEntry[] = [];
  for (const veh of vehicles) {
    let totalDamage = 0;
    let lastAttacker = "";

    for (const exp of explosions) {
      const sq = sqDist(veh.x, veh.y, veh.z, exp.x, exp.y, exp.z);
      if (sq > EXPLOSION_VEHICLE_RADIUS * EXPLOSION_VEHICLE_RADIUS) continue;
      const d = Math.sqrt(sq);
      totalDamage += d > 1 ? exp.vehicleBaseDamage / d : exp.vehicleBaseDamage;
      lastAttacker = exp.attackerId;
    }

    if (totalDamage >= 1 && lastAttacker) {
      vehicleDamages.push({
        vehicleId: veh.vehicleId,
        damage: Math.floor(totalDamage),
        attackerId: lastAttacker
      });
    }
  }

  // ---- Construction ---------------------------------------------------
  // Accumulate total damage per entity across all explosions in the chunk
  // so the main thread can apply a single damage() call per piece.
  const constructionDamages: ConstructionDamageEntry[] = [];
  for (const cons of construction) {
    let totalDamage = 0;
    let lastAttacker = "";

    const rSq = cons.explosionRadius * cons.explosionRadius;
    for (const exp of explosions) {
      const dx = cons.x - exp.x,
        dy = cons.y - exp.y,
        dz = cons.z - exp.z;
      const sq = dx * dx + dy * dy + dz * dz;
      if (sq > rSq) continue;

      const d = Math.sqrt(sq);
      const dmg =
        d < cons.damageRange
          ? exp.constructionDamage
          : exp.constructionDamage / Math.sqrt(d);
      totalDamage += dmg;
      lastAttacker = exp.attackerId;
    }

    if (totalDamage >= 1 && lastAttacker) {
      constructionDamages.push({
        entityId: cons.entityId,
        totalDamage: Math.floor(totalDamage),
        attackerId: lastAttacker
      });
    }
  }

  return { characterDamages, vehicleDamages, constructionDamages };
}

// ---- Message loop ----------------------------------------------------

parentPort!.on("message", (req: WorkerRequest) => {
  try {
    const plan = processChunk(req.snapshot);
    const res: WorkerResponse = { requestId: req.requestId, plan };
    parentPort!.postMessage(res);
  } catch (e) {
    const res: WorkerResponse = { requestId: req.requestId, error: String(e) };
    parentPort!.postMessage(res);
  }
});
