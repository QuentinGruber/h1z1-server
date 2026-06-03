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

import { JSM, Transition } from "./jsm";
import type { Npc } from "../entities/npc";
import type { ZoneServer2016 } from "../zoneserver";
import { NavManager } from "../../../utils/recast";
const debug = require("debug")("ai");
import { getDistance2d } from "../../../utils/utils";

export const enum DeerTransitions {
  Wander = "wander",
  Flee = "flee",
  Dead = "dead"
}

export const enum DeerEvents {
  SpottedPlayer = "spottedPlayer",
  CalmedDown = "calmedDown",
  Destroyed = "destroyed"
}

export interface DeerInstance extends JSM {
  id: string;
  state: DeerTransitions;
  targetPos: Float32Array | null;
  wanderOrigin: Float32Array;
  patrolTimer: number;
  stateTimer: number;
  threatPos: Float32Array | null;
  npc: Npc;
  server: ZoneServer2016;
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

export function createDeer(npc: Npc, server: ZoneServer2016): DeerInstance {
  const deer = new JSM(
    {
      [DeerTransitions.Wander]: (dt: number) => {
        deer.stateTimer += dt;

        for (const characterId in deer.server._characters) {
          const character = deer.server._characters[characterId];
          if (!character.isAlive) continue;
          if (
            getDistance2d(deer.npc.state.position, character.state.position) <
            20
          ) {
            deer.threatPos = character.state.position.slice() as Float32Array;
            deer.event(DeerEvents.SpottedPlayer);
            return;
          }
        }

        deer.patrolTimer += dt;
        const arrived =
          deer.targetPos != null &&
          getDistance2d(deer.npc.state.position, deer.targetPos) < 3;

        if (arrived || deer.targetPos == null) {
          deer.patrolTimer = 0;
          const pt = pickPatrolPoint(deer.server, deer.wanderOrigin);
          if (pt) {
            deer.targetPos = pt;
            moveToward(deer.npc, pt, deer.server);
          }
        }
      },

      [DeerTransitions.Flee]: (dt: number) => {
        deer.stateTimer += dt;

        let playerNear = false;
        for (const characterId in deer.server._characters) {
          const character = deer.server._characters[characterId];
          if (!character.isAlive) continue;
          if (
            getDistance2d(deer.npc.state.position, character.state.position) <
            35
          ) {
            playerNear = true;
            deer.threatPos = character.state.position.slice() as Float32Array;
            break;
          }
        }

        if (!playerNear || deer.stateTimer >= 8) {
          deer.event(DeerEvents.CalmedDown);
          return;
        }

        const arrivedAtFlee =
          deer.targetPos != null &&
          getDistance2d(deer.npc.state.position, deer.targetPos) < 3;
        if (arrivedAtFlee && deer.threatPos) {
          const fleeTarget = pickFleePoint(
            deer.npc,
            deer.server,
            deer.threatPos
          );
          if (fleeTarget) {
            deer.targetPos = fleeTarget;
            moveToward(deer.npc, fleeTarget, deer.server);
          }
        }
      },

      [DeerTransitions.Dead]: (_dt: number) => {}
    },
    [
      {
        eventId: DeerEvents.SpottedPlayer,
        from: [DeerTransitions.Wander],
        to: DeerTransitions.Flee,
        EnterTransition: () => {
          deer.stateTimer = 0;
          if (deer.threatPos) {
            const fleeTarget = pickFleePoint(
              deer.npc,
              deer.server,
              deer.threatPos
            );
            if (fleeTarget) {
              deer.targetPos = fleeTarget;
              moveToward(deer.npc, fleeTarget, deer.server);
            }
          }
        }
      },
      {
        eventId: DeerEvents.CalmedDown,
        from: [DeerTransitions.Flee],
        to: DeerTransitions.Wander,
        EnterTransition: () => {
          deer.patrolTimer = 0;
          deer.stateTimer = 0;
          deer.threatPos = null;
          deer.wanderOrigin = deer.npc.state.position.slice() as Float32Array;
          const pt = pickPatrolPoint(deer.server, deer.wanderOrigin);
          if (pt) {
            deer.targetPos = pt;
            moveToward(deer.npc, pt, deer.server);
          }
        }
      },
      {
        eventId: DeerEvents.Destroyed,
        from: [DeerTransitions.Wander, DeerTransitions.Flee],
        to: DeerTransitions.Dead,
        EnterTransition: undefined
      }
    ] as Transition[],
    DeerTransitions.Wander
  ) as unknown as DeerInstance;

  deer.onTransition = (from: string, to: string, eventId: string) => {
    debug(`[${deer.id}] ${from} → ${to} (${eventId})`);
  };
  deer.id = npc.characterId;
  deer.npc = npc;
  deer.server = server;
  deer.wanderOrigin = npc.state.position.slice() as Float32Array;
  const initialPatrol = pickPatrolPoint(server, npc.state.position);
  deer.targetPos = initialPatrol;
  if (initialPatrol) {
    moveToward(npc, initialPatrol, server);
  }
  deer.patrolTimer = 0;
  deer.stateTimer = 0;
  deer.threatPos = null;

  return deer;
}
