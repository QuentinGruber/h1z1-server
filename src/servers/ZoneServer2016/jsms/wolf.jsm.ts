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

export const enum AnimalsAnimation {
  Idle = "Idle",
  KnifeSlash = "KnifeSlash",
  Flinch = "Flinch",
  Death = "Death",
  WolfHowl = "WolfHowl",
  StandUp = "StandUp",
  Eating = "Eating",
  DeathRagdoll = "DeathRagdoll",
  DeathRagdollAnywhere = "DeathRagdollAnywhere",
  DeathPose = "DeathPose",
  Roar = "Roar",
  MeleeFlinch = "MeleeFlinch"
}

export const enum WolfTransitions {
  Wander = "wander",
  Howling = "howling",
  Chase = "chase",
  Attack = "attack",
  Attacking = "attacking"
}

export const enum WolfEvents {
  SpottedTarget = "spottedTarget",
  HowlDone = "howlDone",
  AlertedByHowl = "alertedByHowl",
  ReachTarget = "reachTarget",
  TargetBacked = "targetBacked",
  StartAttacking = "startAttacking",
  DoneAttacking = "doneAttacking",
  TargetKilled = "targetKilled",
  LostTarget = "lostTarget"
}

export interface WolfInstance extends JSM<WolfEvents> {
  id: string;
  state: WolfTransitions;
  targetPos: Float32Array | null;
  wanderOrigin: Float32Array;
  patrolTimer: number;
  stateTimer: number;
  howlTimer: number;
  isHowling: boolean;
  threatPos: Float32Array | null;
  targetCharacterId: string | null;
  npc: Npc;
  server: ZoneServer2016;
}

const DETECT_RADIUS = 20;
const CHASE_LOSE_DIST = 50;
const ATTACK_RANGE = 2;
const HOWL_DURATION = 3;
const HOWL_ALERT_RADIUS = 40;
const WANDER_SPEED = 6;
const CHASE_SPEED = 9;

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

function findTarget(wolf: WolfInstance): string | null {
  for (const characterId in wolf.server._characters) {
    const character = wolf.server._characters[characterId];
    if (
      !character.isAlive ||
      character.isVanished ||
      character.isHidden ||
      character.isSpectator
    )
      continue;
    if (
      getDistance2d(wolf.npc.state.position, character.state.position) <
      DETECT_RADIUS
    ) {
      return characterId;
    }
  }
  for (const npcId in wolf.server._npcs) {
    const npc = wolf.server._npcs[npcId];
    if (!npc.isAlive) continue;
    if (npc.characterId === wolf.npc.characterId) continue;
    if (npc.npcId === NpcIds.WOLF || npc.npcId === NpcIds.BEAR) continue;
    if (
      getDistance2d(wolf.npc.state.position, npc.state.position) < DETECT_RADIUS
    ) {
      return npcId;
    }
  }
  return null;
}

function getTarget(
  wolf: WolfInstance
): { position: Float32Array; isAlive: boolean } | null {
  if (!wolf.targetCharacterId) return null;
  const player = wolf.server._characters[wolf.targetCharacterId];
  if (player) {
    if (player.isVanished || player.isHidden) return null;
    return { position: player.state.position, isAlive: player.isAlive };
  }
  const npc = wolf.server._npcs[wolf.targetCharacterId];
  if (npc) return { position: npc.state.position, isAlive: npc.isAlive };
  return null;
}

function alertNearbyWolves(wolf: WolfInstance): void {
  for (const k in wolf.server._npcs) {
    const npc = wolf.server._npcs[k];
    if (!npc.isAlive || !npc.fsm) continue;
    if (npc.npcId !== NpcIds.WOLF) continue;
    if (npc.characterId === wolf.npc.characterId) continue;
    if (
      getDistance2d(wolf.npc.state.position, npc.state.position) >
      HOWL_ALERT_RADIUS
    )
      continue;
    const packWolf = npc.fsm as unknown as WolfInstance;
    packWolf.threatPos = wolf.threatPos;
    packWolf.targetCharacterId = wolf.targetCharacterId;
    npc.fsm.event(WolfEvents.AlertedByHowl);
  }
}

function applyDamageToTarget(wolf: WolfInstance): void {
  if (!wolf.targetCharacterId) return;
  const character = wolf.server._characters[wolf.targetCharacterId];
  if (character) {
    wolf.npc.applyDamage(wolf.targetCharacterId);
    return;
  }
  const targetNpc = wolf.server._npcs[wolf.targetCharacterId];
  if (targetNpc && targetNpc.isAlive) {
    targetNpc.damage(wolf.server, {
      entity: wolf.npc.characterId,
      damage: wolf.npc.npcMeleeDamage
    });
  }
}

function enterWander(wolf: WolfInstance): void {
  wolf.stateTimer = 0;
  wolf.patrolTimer = 0;
  wolf.targetCharacterId = null;
  wolf.threatPos = null;
  wolf.npc.lookAtTarget = null;
  wolf.npc.setAnimation(AnimalsAnimation.Idle);
  wolf.wanderOrigin = wolf.npc.state.position.slice() as Float32Array;
  wolf.npc.setSpeed(WANDER_SPEED);
  const pt = pickPatrolPoint(wolf.server, wolf.wanderOrigin);
  if (pt) {
    wolf.targetPos = pt;
    moveToward(wolf.npc, pt, wolf.server);
  }
}

export function createWolf(npc: Npc, server: ZoneServer2016): WolfInstance {
  const wolf = new JSM(
    {
      [WolfTransitions.Wander]: (dt: number) => {
        wolf.stateTimer += dt;
        wolf.patrolTimer += dt;

        const targetId = findTarget(wolf);
        if (targetId !== null) {
          const target =
            wolf.server._characters[targetId] ?? wolf.server._npcs[targetId];
          wolf.targetCharacterId = targetId;
          wolf.threatPos = target.state.position.slice() as Float32Array;
          wolf.event(WolfEvents.SpottedTarget);
          return;
        }

        const arrived =
          wolf.targetPos != null &&
          getDistance2d(wolf.npc.state.position, wolf.targetPos) < 3;

        if (arrived || wolf.targetPos == null) {
          wolf.patrolTimer = 0;
          const pt = pickPatrolPoint(wolf.server, wolf.wanderOrigin);
          if (pt) {
            wolf.targetPos = pt;
            moveToward(wolf.npc, pt, wolf.server);
          }
        }
      },

      [WolfTransitions.Howling]: (dt: number) => {
        wolf.npc.stopMovement();

        if (!wolf.targetCharacterId) {
          wolf.event(WolfEvents.LostTarget);
          return;
        }
        const target = getTarget(wolf);
        if (!target || !target.isAlive) {
          wolf.event(WolfEvents.LostTarget);
          return;
        }

        if (!wolf.isHowling) {
          // wait for the nav agent to fully decelerate before starting the anim
          const vel = wolf.npc.navAgent?.velocity();
          const speed = vel ? Math.sqrt(vel.x * vel.x + vel.z * vel.z) : 0;
          if (speed > 0.0) return;
          wolf.npc.playAnimation(AnimalsAnimation.WolfHowl);
          wolf.isHowling = true;
          wolf.howlTimer = 0;
          return;
        }

        wolf.howlTimer += dt;
        if (wolf.howlTimer >= HOWL_DURATION) {
          wolf.event(WolfEvents.HowlDone);
        }
      },

      [WolfTransitions.Chase]: (dt: number) => {
        wolf.stateTimer += dt;

        const target = getTarget(wolf);
        if (!target || !target.isAlive) {
          wolf.event(WolfEvents.LostTarget);
          return;
        }

        wolf.npc.lookAtTarget = target.position;
        const dist = getDistance2d(wolf.npc.state.position, target.position);

        if (dist > CHASE_LOSE_DIST) {
          wolf.event(WolfEvents.LostTarget);
        } else if (dist < ATTACK_RANGE) {
          wolf.event(WolfEvents.ReachTarget);
        } else {
          moveToward(wolf.npc, target.position, wolf.server);
        }
      },

      [WolfTransitions.Attack]: (dt: number) => {
        wolf.stateTimer += dt;

        const target = getTarget(wolf);
        if (!target) {
          wolf.event(WolfEvents.LostTarget);
          return;
        }
        if (!target.isAlive) {
          wolf.event(WolfEvents.TargetKilled);
          return;
        }

        wolf.npc.lookAtTarget = target.position;
        moveToward(wolf.npc, target.position, wolf.server);

        const dist = getDistance(wolf.npc.state.position, target.position);
        if (dist >= ATTACK_RANGE) {
          wolf.event(WolfEvents.TargetBacked);
        } else if (wolf.stateTimer > 2) {
          wolf.event(WolfEvents.StartAttacking);
        }
      },

      [WolfTransitions.Attacking]: (dt: number) => {
        wolf.stateTimer += dt * 2;

        const target = getTarget(wolf);
        if (target) {
          wolf.npc.lookAt(target.position);
        }

        if (wolf.stateTimer >= 2) {
          if (target) {
            const dist = getDistance(wolf.npc.state.position, target.position);
            if (dist <= ATTACK_RANGE) {
              applyDamageToTarget(wolf);
            }
          }
          wolf.event(WolfEvents.DoneAttacking);
        }
      }
    },
    [
      {
        eventId: WolfEvents.SpottedTarget,
        from: [WolfTransitions.Wander],
        to: WolfTransitions.Howling,
        EnterTransition: () => {
          wolf.npc.stopMovement();
          wolf.isHowling = false;
          wolf.howlTimer = 0;
          alertNearbyWolves(wolf);
        }
      },
      {
        eventId: WolfEvents.HowlDone,
        from: [WolfTransitions.Howling],
        to: WolfTransitions.Chase,
        EnterTransition: () => {
          wolf.npc.setAnimation(AnimalsAnimation.Idle);
          wolf.stateTimer = 0;
          wolf.npc.setSpeed(CHASE_SPEED);
          const target = getTarget(wolf);
          if (target) moveToward(wolf.npc, target.position, wolf.server);
        }
      },
      {
        eventId: WolfEvents.AlertedByHowl,
        from: [WolfTransitions.Wander],
        to: WolfTransitions.Chase,
        EnterTransition: () => {
          wolf.stateTimer = 0;
          wolf.npc.setSpeed(CHASE_SPEED);
          if (wolf.threatPos) moveToward(wolf.npc, wolf.threatPos, wolf.server);
        }
      },
      {
        eventId: WolfEvents.ReachTarget,
        from: [WolfTransitions.Chase],
        to: WolfTransitions.Attack,
        EnterTransition: () => {
          wolf.stateTimer = 2;
        }
      },
      {
        eventId: WolfEvents.TargetBacked,
        from: [WolfTransitions.Attack],
        to: WolfTransitions.Chase,
        EnterTransition: undefined
      },
      {
        eventId: WolfEvents.StartAttacking,
        from: [WolfTransitions.Attack],
        to: WolfTransitions.Attacking,
        EnterTransition: () => {
          wolf.npc.playAnimation(AnimalsAnimation.KnifeSlash);
          wolf.stateTimer = 0;
        }
      },
      {
        eventId: WolfEvents.DoneAttacking,
        from: [WolfTransitions.Attacking],
        to: WolfTransitions.Attack,
        EnterTransition: () => {
          wolf.stateTimer = 2;
        }
      },
      {
        eventId: WolfEvents.TargetKilled,
        from: [WolfTransitions.Attack],
        to: WolfTransitions.Wander,
        EnterTransition: () => enterWander(wolf)
      },
      {
        eventId: WolfEvents.LostTarget,
        from: [
          WolfTransitions.Howling,
          WolfTransitions.Chase,
          WolfTransitions.Attack,
          WolfTransitions.Attacking
        ],
        to: WolfTransitions.Wander,
        EnterTransition: () => enterWander(wolf)
      }
    ],
    WolfTransitions.Wander
  ) as unknown as WolfInstance;

  wolf.onTransition = (from: string, to: string, eventId: string) => {
    debug(`[wolf:${wolf.id}] ${from} → ${to} (${eventId})`);
  };
  wolf.id = npc.characterId;
  wolf.npc = npc;
  wolf.server = server;
  wolf.wanderOrigin = npc.state.position.slice() as Float32Array;
  wolf.patrolTimer = 0;
  wolf.stateTimer = 0;
  wolf.howlTimer = 0;
  wolf.isHowling = false;
  wolf.threatPos = null;
  wolf.targetCharacterId = null;
  npc.setSpeed(WANDER_SPEED);
  return wolf;
}
