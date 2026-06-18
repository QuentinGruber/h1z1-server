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
import { getDistance2d, getDistance } from "../../../utils/utils";
import { NpcIds } from "../models/enums";
import { AnimalsAnimation } from "./wolf.jsm";

export const enum BearTransitions {
  Wander = "wander",
  StandingUp = "standingUp",
  Chase = "chase",
  Attack = "attack",
  Attacking = "attacking"
}

export const enum BearEvents {
  SpottedTarget = "spottedTarget",
  StandUpDone = "standUpDone",
  ReachTarget = "reachTarget",
  TargetBacked = "targetBacked",
  StartAttacking = "startAttacking",
  DoneAttacking = "doneAttacking",
  TargetKilled = "targetKilled",
  LostTarget = "lostTarget"
}

export interface BearInstance extends JSM<BearEvents> {
  id: string;
  state: BearTransitions;
  targetPos: Float32Array | null;
  wanderOrigin: Float32Array;
  patrolTimer: number;
  stateTimer: number;
  standUpTimer: number;
  isStandingUp: boolean;
  threatPos: Float32Array | null;
  targetCharacterId: string | null;
  npc: Npc;
  server: ZoneServer2016;
}

const DETECT_RADIUS = 25;
const CHASE_LOSE_DIST = 60;
const ATTACK_RANGE = 2.5;
const STANDUP_DURATION = 2;
const WANDER_SPEED = 4;
const CHASE_SPEED = 5;

function pickPatrolPoint(
  server: ZoneServer2016,
  center: Float32Array
): Float32Array | null {
  const navCenter = NavManager.gameToNav(center);
  const { success, randomPoint } =
    server.navManager.navMeshQuery.findRandomPointAroundCircle(navCenter, 60);
  return success ? NavManager.navToGame(randomPoint) : null;
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

function findTarget(bear: BearInstance): string | null {
  const sz = 50;
  const pos = bear.npc.state.position;
  const cx = Math.floor(pos[0] / sz);
  const cz = Math.floor(pos[2] / sz);
  for (let dx = -1; dx <= 1; dx++) {
    for (let dz = -1; dz <= 1; dz++) {
      const bucket = bear.server.aiTargetSpatialMap.get(
        `${cx + dx},${cz + dz}`
      );
      if (!bucket) continue;
      for (const entry of bucket) {
        if (entry.npcId !== NpcIds.SURVIVOR) {
          if (entry.npcId !== NpcIds.ZOMBIE) continue;
          if (entry.id === bear.npc.characterId) continue;
        }
        if (getDistance2d(pos, entry.position) < DETECT_RADIUS) {
          return entry.id;
        }
      }
    }
  }
  return null;
}

function getTarget(
  bear: BearInstance
): { position: Float32Array; isAlive: boolean } | null {
  if (!bear.targetCharacterId) return null;
  const player = bear.server._characters[bear.targetCharacterId];
  if (player) {
    if (player.isVanished || player.isHidden) return null;
    return { position: player.state.position, isAlive: player.isAlive };
  }
  const npc = bear.server._npcs[bear.targetCharacterId];
  if (npc) return { position: npc.state.position, isAlive: npc.isAlive };
  return null;
}

function applyDamageToTarget(bear: BearInstance): void {
  if (!bear.targetCharacterId) return;
  const character = bear.server._characters[bear.targetCharacterId];
  if (character) {
    bear.npc.applyDamage(bear.targetCharacterId);
    return;
  }
  const targetNpc = bear.server._npcs[bear.targetCharacterId];
  if (targetNpc && targetNpc.isAlive) {
    targetNpc.damage(bear.server, {
      entity: bear.npc.characterId,
      damage: bear.npc.npcMeleeDamage
    });
  }
}

function enterWander(bear: BearInstance): void {
  bear.stateTimer = 0;
  bear.patrolTimer = 0;
  bear.targetCharacterId = null;
  bear.threatPos = null;
  bear.npc.lookAtTarget = null;
  bear.npc.setAnimation(AnimalsAnimation.Idle);
  bear.wanderOrigin = bear.npc.state.position.slice() as Float32Array;
  bear.npc.setSpeed(WANDER_SPEED);
  const pt = pickPatrolPoint(bear.server, bear.wanderOrigin);
  if (pt) {
    bear.targetPos = pt;
    moveToward(bear.npc, pt, bear.server);
  }
}

export function createBear(npc: Npc, server: ZoneServer2016): BearInstance {
  const bear = new JSM(
    {
      [BearTransitions.Wander]: (dt: number) => {
        bear.stateTimer += dt;
        bear.patrolTimer += dt;

        const targetId = findTarget(bear);
        if (targetId !== null) {
          const target =
            bear.server._characters[targetId] ?? bear.server._npcs[targetId];
          bear.targetCharacterId = targetId;
          bear.threatPos = target.state.position.slice() as Float32Array;
          bear.event(BearEvents.SpottedTarget);
          return;
        }

        const arrived =
          bear.targetPos != null &&
          getDistance2d(bear.npc.state.position, bear.targetPos) < 3;

        if (arrived || bear.targetPos == null) {
          bear.patrolTimer = 0;
          const pt = pickPatrolPoint(bear.server, bear.wanderOrigin);
          if (pt) {
            bear.targetPos = pt;
            moveToward(bear.npc, pt, bear.server);
          }
        }
      },

      [BearTransitions.StandingUp]: (dt: number) => {
        bear.npc.stopMovement();

        if (!bear.targetCharacterId) {
          bear.event(BearEvents.LostTarget);
          return;
        }
        const target = getTarget(bear);
        if (!target || !target.isAlive) {
          bear.event(BearEvents.LostTarget);
          return;
        }

        if (!bear.isStandingUp) {
          const vel = bear.npc.navAgent?.velocity();
          const speed = vel ? Math.sqrt(vel.x * vel.x + vel.z * vel.z) : 0;
          if (speed > 0.0) return;
          bear.npc.playAnimation(AnimalsAnimation.StandUp);
          bear.isStandingUp = true;
          bear.standUpTimer = 0;
          return;
        }

        bear.standUpTimer += dt;
        if (bear.standUpTimer >= STANDUP_DURATION) {
          bear.event(BearEvents.StandUpDone);
        }
      },

      [BearTransitions.Chase]: (dt: number) => {
        bear.stateTimer += dt;

        const target = getTarget(bear);
        if (!target || !target.isAlive) {
          bear.event(BearEvents.LostTarget);
          return;
        }

        bear.npc.lookAtTarget = target.position;
        const dist = getDistance2d(bear.npc.state.position, target.position);

        if (dist > CHASE_LOSE_DIST) {
          bear.event(BearEvents.LostTarget);
        } else if (dist < ATTACK_RANGE) {
          bear.event(BearEvents.ReachTarget);
        } else {
          moveToward(bear.npc, target.position, bear.server);
        }
      },

      [BearTransitions.Attack]: (dt: number) => {
        bear.stateTimer += dt;

        const target = getTarget(bear);
        if (!target) {
          bear.event(BearEvents.LostTarget);
          return;
        }
        if (!target.isAlive) {
          bear.event(BearEvents.TargetKilled);
          return;
        }

        bear.npc.lookAtTarget = target.position;
        moveToward(bear.npc, target.position, bear.server);

        const dist = getDistance(bear.npc.state.position, target.position);
        if (dist >= ATTACK_RANGE) {
          bear.event(BearEvents.TargetBacked);
        } else if (bear.stateTimer > 2) {
          bear.event(BearEvents.StartAttacking);
        }
      },

      [BearTransitions.Attacking]: (dt: number) => {
        bear.stateTimer += dt * 2;

        const target = getTarget(bear);
        if (target) {
          bear.npc.lookAt(target.position);
        }

        if (bear.stateTimer >= 2) {
          if (target) {
            const dist = getDistance(bear.npc.state.position, target.position);
            if (dist <= ATTACK_RANGE) {
              applyDamageToTarget(bear);
            }
          }
          bear.event(BearEvents.DoneAttacking);
        }
      }
    },
    [
      {
        eventId: BearEvents.SpottedTarget,
        from: [BearTransitions.Wander],
        to: BearTransitions.StandingUp,
        EnterTransition: () => {
          bear.npc.stopMovement();
          bear.isStandingUp = false;
          bear.standUpTimer = 0;
        }
      },
      {
        eventId: BearEvents.StandUpDone,
        from: [BearTransitions.StandingUp],
        to: BearTransitions.Chase,
        EnterTransition: () => {
          bear.npc.setAnimation(AnimalsAnimation.Idle);
          bear.stateTimer = 0;
          bear.npc.setSpeed(CHASE_SPEED);
          const target = getTarget(bear);
          if (target) moveToward(bear.npc, target.position, bear.server);
        }
      },
      {
        eventId: BearEvents.ReachTarget,
        from: [BearTransitions.Chase],
        to: BearTransitions.Attack,
        EnterTransition: () => {
          bear.stateTimer = 2;
        }
      },
      {
        eventId: BearEvents.TargetBacked,
        from: [BearTransitions.Attack],
        to: BearTransitions.Chase,
        EnterTransition: undefined
      },
      {
        eventId: BearEvents.StartAttacking,
        from: [BearTransitions.Attack],
        to: BearTransitions.Attacking,
        EnterTransition: () => {
          bear.npc.playAnimation(AnimalsAnimation.KnifeSlash);
          bear.stateTimer = 0;
        }
      },
      {
        eventId: BearEvents.DoneAttacking,
        from: [BearTransitions.Attacking],
        to: BearTransitions.Attack,
        EnterTransition: () => {
          bear.stateTimer = 2;
        }
      },
      {
        eventId: BearEvents.TargetKilled,
        from: [BearTransitions.Attack],
        to: BearTransitions.Wander,
        EnterTransition: () => enterWander(bear)
      },
      {
        eventId: BearEvents.LostTarget,
        from: [
          BearTransitions.StandingUp,
          BearTransitions.Chase,
          BearTransitions.Attack,
          BearTransitions.Attacking
        ],
        to: BearTransitions.Wander,
        EnterTransition: () => enterWander(bear)
      }
    ],
    BearTransitions.Wander
  ) as unknown as BearInstance;

  bear.onTransition = (from: string, to: string, eventId: string) => {
    debug(`[bear:${bear.id}] ${from} → ${to} (${eventId})`);
  };
  bear.id = npc.characterId;
  bear.npc = npc;
  bear.server = server;
  bear.wanderOrigin = npc.state.position.slice() as Float32Array;
  bear.patrolTimer = 0;
  bear.stateTimer = 0;
  bear.standUpTimer = 0;
  bear.isStandingUp = false;
  bear.threatPos = null;
  bear.targetCharacterId = null;
  npc.setSpeed(WANDER_SPEED);
  return bear;
}
