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

import { JSM } from "./jsm";
import type { Npc } from "../entities/npc";
import type { ZoneServer2016 } from "../zoneserver";
import { NavManager } from "../../../utils/recast";
const debug = require("debug")("ai");
import { getDistance2d } from "../../../utils/utils";
import { isHostile } from "./factions";

export const enum AnimalsAnimation {
  Flinch = "Raven_Flinch",
  FlyBack = "Raven_FlyBack",
  Idle_Preen = "Raven_Idle_Preen",
  Idle_Look = "Raven_Idle_Look",
  Idle_B = "Raven_Idle_B",
  Idle_A = "Raven_Idle_A",
  FlyB = "Raven_FlyB",
  FlyA = "Raven_FlyA",
  Death = "Raven_Death"
}

export enum groundIdleAnimations {
  Idle_Eat = "Raven_Idle_EatA",
  Idle_Preen = "Raven_Idle_Preen",
  Idle_Look = "Raven_Idle_Look",
  Idle_B = "Raven_Idle_B",
  Idle_A = "Raven_Idle_A"
}

export enum GroundAnimation {
  Run = "Raven_Run",
  Sprint = "Raven_Sprint",
  Walk = "Raven_Walk"
}

export const enum RavenTransitions {
  Idle = "idle",
  Wander = "wander",
  Flee = "flee",
  Flying = "flying",
  Landing = "landing"
}

export const enum RavenEvents {
  SpottedPlayer = "spottedPlayer",
  Wander = "wander",
  Idle = "idle",
  Flying = "flying",
  Flee = "flee",
  Landing = "landing"
}

export interface RavenInstance extends JSM<RavenEvents> {
  id: string;
  state: RavenTransitions;
  targetPos: Float32Array | null;
  wanderOrigin: Float32Array;
  stateTimer: number;
  fleeCooldown: number;
  targetCharacterId: string | null;
  isFlying: boolean;
  patrolTimer: number;
  threatPos: Float32Array | null;
  npc: Npc;
  server: ZoneServer2016;
}

function trySeePlayer(raven: RavenInstance): boolean {
  const sz = 50;
  const pos = raven.npc.state.position;
  const cx = Math.floor(pos[0] / sz);
  const cz = Math.floor(pos[2] / sz);
  for (let dx = -1; dx <= 1; dx++) {
    for (let dz = -1; dz <= 1; dz++) {
      const bucket = raven.server.aiTargetSpatialMap.get(
        `${cx + dx},${cz + dz}`
      );
      if (!bucket) continue;
      for (const entry of bucket) {
        if (entry.id === raven.npc.characterId) continue;
        if (!isHostile(raven.npc.faction, entry.faction)) continue;
        if (getDistance2d(pos, entry.position) < 10) {
          raven.targetCharacterId = entry.id;
          raven.event(RavenEvents.SpottedPlayer);
          return true;
        }
      }
    }
  }
  return false;
}

function pickPatrolPoint(
  server: ZoneServer2016,
  center: Float32Array
): Float32Array | null {
  const navCenter = NavManager.gameToNav(center);
  const { success, randomPoint } =
    server.navManager.navMeshQuery.findRandomPointAroundCircle(navCenter, 60);
  return success ? NavManager.navToGame(randomPoint) : null;
}

function pickFleePoint(
  npc: Npc,
  server: ZoneServer2016,
  threatPos: Float32Array
): Float32Array | null {
  const dx = npc.state.position[0] - threatPos[0];
  const dz = npc.state.position[2] - threatPos[2];
  const len = Math.sqrt(dx * dx + dz * dz) || 1;
  const fleeCenter = new Float32Array([
    npc.state.position[0] + (dx / len) * 50,
    npc.state.position[1],
    npc.state.position[2] + (dz / len) * 50,
    0
  ]);
  const navCenter = NavManager.gameToNav(fleeCenter);
  const { success, randomPoint } =
    server.navManager.navMeshQuery.findRandomPointAroundCircle(navCenter, 15);
  return success ? NavManager.navToGame(randomPoint) : fleeCenter;
}

function moveToward(
  npc: Npc,
  target: Float32Array,
  server: ZoneServer2016
): void {
  if (!npc.navAgent) return;
  const navTarget = server.navManager.getClosestNavPointVec3(target);
  npc.navAgent.requestMoveTarget(navTarget);
}

function findThreat(raven: RavenInstance, radius: number): Float32Array | null {
  const sz = 50;
  const pos = raven.npc.state.position;
  const cx = Math.floor(pos[0] / sz);
  const cz = Math.floor(pos[2] / sz);
  for (let dx = -1; dx <= 1; dx++) {
    for (let dz = -1; dz <= 1; dz++) {
      const bucket = raven.server.aiTargetSpatialMap.get(
        `${cx + dx},${cz + dz}`
      );
      if (!bucket) continue;
      for (const entry of bucket) {
        if (entry.faction === raven.npc.faction) continue;
        if (getDistance2d(pos, entry.position) < radius) {
          return entry.position;
        }
      }
    }
  }
  return null;
}

export function createRaven(npc: Npc, server: ZoneServer2016): RavenInstance {
  const raven = new JSM(
    {
      [RavenTransitions.Flying]: (dt: number) => {},
      [RavenTransitions.Landing]: () => {},
      [RavenTransitions.Idle]: (dt: number) => {
        if (trySeePlayer(raven)) return;
      },
      [RavenTransitions.Wander]: (dt: number) => {
        raven.stateTimer += dt;
        if (raven.fleeCooldown > 0) raven.fleeCooldown -= dt;

        const wanderThreat = findThreat(raven, 20);
        if (wanderThreat && raven.fleeCooldown <= 0) {
          raven.threatPos = wanderThreat.slice() as Float32Array;
          raven.event(RavenEvents.SpottedPlayer);
          return;
        }

        raven.patrolTimer += dt;
        const arrived =
          raven.targetPos != null &&
          getDistance2d(raven.npc.state.position, raven.targetPos) < 3;

        if (arrived || raven.targetPos == null) {
          raven.patrolTimer = 0;
          const pt = pickPatrolPoint(raven.server, raven.wanderOrigin);
          if (pt) {
            raven.targetPos = pt;
            moveToward(raven.npc, pt, raven.server);
          }
        }
      },
      [RavenTransitions.Flee]: (dt: number) => {
        raven.stateTimer += dt;

        const fleeThreat = findThreat(raven, 35);
        if (fleeThreat) {
          raven.threatPos = fleeThreat.slice() as Float32Array;
        }

        if (!fleeThreat || raven.stateTimer >= 10) {
          raven.event(RavenEvents.Idle);
          return;
        }

        const arrivedAtFlee =
          raven.targetPos != null &&
          getDistance2d(raven.npc.state.position, raven.targetPos) < 3;
        if (arrivedAtFlee && raven.threatPos) {
          const fleeTarget = pickFleePoint(
            raven.npc,
            raven.server,
            raven.threatPos
          );
          if (fleeTarget) {
            raven.targetPos = fleeTarget;
            // speed up when close to player
            const dx = raven.npc.state.position[0] - raven.threatPos[0];
            const dz = raven.npc.state.position[2] - raven.threatPos[2];
            const dist = Math.hypot(dx, dz);
            if (dist < 3) {
              npc.setSpeed(4); // faster
              npc.playAnimation(GroundAnimation.Sprint); // look at player while fleeing
            }
            if (dist < 5) {
              npc.setSpeed(3); // normal
              npc.playAnimation(GroundAnimation.Run); // look at player while fleeing
            }
            if (dist < 7) {
              npc.setSpeed(2); // normal
              npc.playAnimation(GroundAnimation.Walk); // look at player while fleeing
            }
            moveToward(raven.npc, fleeTarget, raven.server);
          }
        }
      }
    },
    [
      {
        eventId: RavenEvents.Flying,
        from: [
          RavenTransitions.Flee,
          RavenTransitions.Idle,
          RavenTransitions.Wander
        ],
        to: RavenTransitions.Flying,
        EnterTransition: () => {
          raven.stateTimer = 0;
          raven.targetPos = null;
          raven.threatPos = null;
          raven.isFlying = true;
          const anims = [AnimalsAnimation.FlyA, AnimalsAnimation.FlyB];
          raven.npc.playAnimation(
            anims[Math.floor(Math.random() * anims.length)]
          );
        }
      },
      {
        eventId: RavenEvents.Landing,
        from: [RavenTransitions.Flying],
        to: RavenTransitions.Landing,
        EnterTransition: () => {
          raven.stateTimer = 0;
          raven.targetPos = null;
          raven.threatPos = null;
          raven.isFlying = false;
        }
      },
      {
        eventId: RavenEvents.Idle,
        from: [
          RavenTransitions.Landing,
          RavenTransitions.Wander,
          RavenTransitions.Flee
        ],
        to: RavenTransitions.Idle,
        EnterTransition: () => {
          raven.stateTimer = 0;
          raven.targetPos = null;
          raven.threatPos = null;
          raven.isFlying = false;

          const anims = [
            groundIdleAnimations.Idle_A,
            groundIdleAnimations.Idle_B,
            groundIdleAnimations.Idle_Look,
            groundIdleAnimations.Idle_Preen,
            groundIdleAnimations.Idle_Eat
          ];
          raven.npc.playAnimation(
            anims[Math.floor(Math.random() * anims.length)]
          );
        }
      },
      {
        eventId: RavenEvents.SpottedPlayer,
        from: [RavenTransitions.Idle, RavenTransitions.Wander],
        to: RavenTransitions.Flee,
        EnterTransition: () => {
          raven.stateTimer = 0;
          raven.targetPos = null;
          raven.threatPos = null;
          raven.isFlying = false;
        }
      }
    ],
    RavenTransitions.Idle
  ) as unknown as RavenInstance;

  raven.onTransition = (from: string, to: string, eventId: string) => {
    debug(`[raven:${raven.id}] ${from} → ${to} (${eventId})`);
  };
  raven.id = npc.characterId;
  raven.npc = npc;
  raven.server = server;
  raven.wanderOrigin = npc.state.position.slice() as Float32Array;
  raven.stateTimer = 0;
  raven.fleeCooldown = 0;
  raven.patrolTimer = 0;
  raven.isFlying = false;
  raven.threatPos = null;
  npc.setSpeed(2); // Default ground walking speed
  return raven;
}
