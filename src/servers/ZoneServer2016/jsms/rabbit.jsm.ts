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

export const enum RabbitTransitions {
  Idle = "idle",
  Wander = "wander",
  Flee = "flee"
}

export const enum RabbitEvents {
  FinishedIdle = "finishedIdle",
  Arrived = "arrived",
  SpottedPlayer = "spottedPlayer",
  CalmedDown = "calmedDown",
  Destroyed = "destroyed"
}

export interface RabbitInstance extends JSM<RabbitEvents> {
  id: string;
  state: RabbitTransitions;
  targetPos: Float32Array | null;
  wanderOrigin: Float32Array;
  stateTimer: number;
  idleDuration: number;
  fleeCooldown: number;
  threatPos: Float32Array | null;
  npc: Npc;
  server: ZoneServer2016;
}

function pickIdleDuration(): number {
  // brief idle between wanders
  return 2 + Math.random() * 3;
}

function pickWanderPoint(
  server: ZoneServer2016,
  center: Float32Array
): Float32Array | null {
  const navCenter = NavManager.gameToNav(center);
  const { success, randomPoint } =
    server.navManager.navMeshQuery.findRandomPointAroundCircle(navCenter, 30);
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

function findThreat(
  rabbit: RabbitInstance,
  radius: number
): Float32Array | null {
  const sz = 50;
  const pos = rabbit.npc.state.position;
  const cx = Math.floor(pos[0] / sz);
  const cz = Math.floor(pos[2] / sz);
  for (let dx = -1; dx <= 1; dx++) {
    for (let dz = -1; dz <= 1; dz++) {
      const bucket = rabbit.server.aiTargetSpatialMap.get(
        `${cx + dx},${cz + dz}`
      );
      if (!bucket) continue;
      for (const entry of bucket) {
        if (entry.faction === rabbit.npc.faction) continue;
        if (getDistance2d(pos, entry.position) < radius) {
          return entry.position;
        }
      }
    }
  }
  return null;
}

export function createRabbit(npc: Npc, server: ZoneServer2016): RabbitInstance {
  const rabbit = new JSM(
    {
      [RabbitTransitions.Idle]: (dt: number) => {
        rabbit.stateTimer += dt;
        if (rabbit.fleeCooldown > 0) rabbit.fleeCooldown -= dt;

        const idleThreat = findThreat(rabbit, 10);
        if (idleThreat && rabbit.fleeCooldown <= 0) {
          rabbit.threatPos = idleThreat.slice() as Float32Array;
          rabbit.event(RabbitEvents.SpottedPlayer);
          return;
        }

        if (rabbit.stateTimer >= rabbit.idleDuration) {
          rabbit.event(RabbitEvents.FinishedIdle);
        }
      },

      [RabbitTransitions.Wander]: (dt: number) => {
        rabbit.stateTimer += dt;
        if (rabbit.fleeCooldown > 0) rabbit.fleeCooldown -= dt;

        const wanderThreat = findThreat(rabbit, 20);
        if (wanderThreat && rabbit.fleeCooldown <= 0) {
          rabbit.threatPos = wanderThreat.slice() as Float32Array;
          rabbit.event(RabbitEvents.SpottedPlayer);
          return;
        }

        const arrived =
          rabbit.targetPos != null &&
          getDistance2d(rabbit.npc.state.position, rabbit.targetPos) < 3;
        if (arrived || rabbit.targetPos == null || rabbit.stateTimer >= 8) {
          rabbit.event(RabbitEvents.Arrived);
        }
      },

      [RabbitTransitions.Flee]: (dt: number) => {
        rabbit.stateTimer += dt;

        const fleeThreat = findThreat(rabbit, 35);
        if (fleeThreat) {
          rabbit.threatPos = fleeThreat.slice() as Float32Array;
        }

        if (!fleeThreat || rabbit.stateTimer >= 10) {
          rabbit.event(RabbitEvents.CalmedDown);
          return;
        }

        const arrivedAtFlee =
          rabbit.targetPos != null &&
          getDistance2d(rabbit.npc.state.position, rabbit.targetPos) < 3;
        if (arrivedAtFlee && rabbit.threatPos) {
          const fleeTarget = pickFleePoint(
            rabbit.npc,
            rabbit.server,
            rabbit.threatPos
          );
          if (fleeTarget) {
            rabbit.targetPos = fleeTarget;
            moveToward(rabbit.npc, fleeTarget, rabbit.server);
          }
        }
      }
    },
    [
      {
        eventId: RabbitEvents.FinishedIdle,
        from: [RabbitTransitions.Idle],
        to: RabbitTransitions.Wander,
        EnterTransition: () => {
          rabbit.stateTimer = 0;
          const pt = pickWanderPoint(rabbit.server, rabbit.wanderOrigin);
          if (pt) {
            rabbit.targetPos = pt;
            moveToward(rabbit.npc, pt, rabbit.server);
          }
        }
      },
      {
        eventId: RabbitEvents.Arrived,
        from: [RabbitTransitions.Wander],
        to: RabbitTransitions.Idle,
        EnterTransition: () => {
          rabbit.stateTimer = 0;
          rabbit.idleDuration = pickIdleDuration();
          rabbit.targetPos = null;
          rabbit.wanderOrigin =
            rabbit.npc.state.position.slice() as Float32Array;
        }
      },
      {
        eventId: RabbitEvents.SpottedPlayer,
        from: [RabbitTransitions.Idle, RabbitTransitions.Wander],
        to: RabbitTransitions.Flee,
        EnterTransition: () => {
          rabbit.stateTimer = 0;
          if (rabbit.threatPos) {
            const fleeTarget = pickFleePoint(
              rabbit.npc,
              rabbit.server,
              rabbit.threatPos
            );
            if (fleeTarget) {
              rabbit.targetPos = fleeTarget;
              moveToward(rabbit.npc, fleeTarget, rabbit.server);
            }
          }
        }
      },
      {
        eventId: RabbitEvents.CalmedDown,
        from: [RabbitTransitions.Flee],
        to: RabbitTransitions.Idle,
        EnterTransition: () => {
          rabbit.stateTimer = 0;
          rabbit.idleDuration = pickIdleDuration();
          rabbit.fleeCooldown = 4;
          rabbit.threatPos = null;
          rabbit.targetPos = null;
          rabbit.wanderOrigin =
            rabbit.npc.state.position.slice() as Float32Array;
        }
      }
    ],
    RabbitTransitions.Idle
  ) as unknown as RabbitInstance;

  rabbit.onTransition = (from: string, to: string, eventId: string) => {
    debug(`[${rabbit.id}] ${from} → ${to} (${eventId})`);
  };
  rabbit.id = npc.characterId;
  rabbit.npc = npc;
  rabbit.server = server;
  rabbit.wanderOrigin = npc.state.position.slice() as Float32Array;
  rabbit.stateTimer = 0;
  rabbit.idleDuration = pickIdleDuration();
  rabbit.fleeCooldown = 0;
  rabbit.threatPos = null;
  npc.setSpeed(5.0);
  return rabbit;
}
