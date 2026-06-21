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
import type { Sound } from "../../../types/zoneserver";
import { NavManager } from "../../../utils/recast";
const debug = require("debug")("ai");
import { getDistance2d, getDistance } from "../../../utils/utils";
import { ZombieWalker } from "../entities/zombiewalker";
import { MovementModifiers, NpcIds } from "../models/enums";

export const enum ScreamerAnimations {
  Flinch = "Flinch",
  Death = "Death",
  DeathRagdoll = "DeathRagdoll",
  KnifeSlash = "KnifeSlash",
  MeleeFlinch = "MeleeFlinch",
  TurnLeft90 = "TurnLeft90",
  TurnRight90 = "TurnRight90",
  GrappleTell = "GrappleTell",
  TurnLeft45 = "TurnLeft45",
  TurnRight45 = "TurnRight45",
  Idle = "idle",
  TurnRight180 = "TurnRight180",
  TurnLeft180 = "TurnLeft180",
  PushbackNorthMedium = "PushbackNorthMedium",
  PushbackEastMedium = "PushbackEastMedium",
  PushbackWestMedium = "PushbackWestMedium",
  PushbackSouthMedium = "PushbackSouthMedium",
  Stun = "Stun",
  DeathPose = "DeathPose",
  Alive = "Alive",
  DeathRagdollAnywhere = "DeathRagdollAnywhere",
  StopPhysics = "StopPhysics",
  Scream = "Scream",
  Untie = "Untie",
  ScreamerRise = "ScreamerRise",
  ScreamerReset = "ScreamerReset"
}

export const enum Transitions {
  Sleep = "sleep",
  Rising = "rising",
  Wander = "wander",
  Screaming = "Screaming",
  Chase = "chase",
  Attack = "attack",
  Attacking = "attacking"
}

export const enum Events {
  ReachPlayer = "reachPlayer",
  LostPlayer = "lostPlayer",
  PlayerBacked = "playerBacked",
  PlayerKilled = "playerKilled",
  DoneFeeding = "doneFeeding",
  IdleTimeout = "idleTimeout",
  Destroyed = "destroyed",
  StartAttacking = "startAttacking",
  DoneAttacking = "doneAttacking",
  StartScreaming = "startScreaming",
  DoneScreaming = "doneScreaming",
  StartRising = "startRising"
}

export interface ScreamerInstance extends JSM<Events> {
  id: string;
  state: Transitions;
  agitation: number;
  targetPos: Float32Array | null;
  lastNoisePos: Float32Array | null;
  stateTimer: number;
  targetCharacterId: string | null;
  wanderOrigin: Float32Array;
  npc: Npc;
  server: ZoneServer2016;
}

const BASE_SPEED = 1.5;
const MAX_SPEED = 5.0;
const AGITATION_DECAY_RATE = 1;
const AGITATION_INITIAL = 50;
const SCREAM_DURATION = 3;
const RISE_DURATION = 4;
const SCREAM_RADIUS = 50;
const PLAYER_DETECT_RADIUS = 20;

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

function tryDetectPlayer(screamer: ScreamerInstance): boolean {
  const sz = 50;
  const pos = screamer.npc.state.position;
  const cx = Math.floor(pos[0] / sz);
  const cz = Math.floor(pos[2] / sz);
  for (let dx = -1; dx <= 1; dx++) {
    for (let dz = -1; dz <= 1; dz++) {
      const bucket = screamer.server.aiTargetSpatialMap.get(
        `${cx + dx},${cz + dz}`
      );
      if (!bucket) continue;
      for (const entry of bucket) {
        if (entry.npcId !== NpcIds.SURVIVOR) continue;
        if (getDistance2d(pos, entry.position) < PLAYER_DETECT_RADIUS) {
          screamer.targetCharacterId = entry.id;
          screamer.event(Events.StartScreaming);
          return true;
        }
      }
    }
  }
  return false;
}

function getChaseTarget(screamer: ScreamerInstance) {
  return screamer.targetCharacterId
    ? screamer.server._characters[screamer.targetCharacterId]
    : null;
}

function applyAgitation(screamer: ScreamerInstance): void {
  const speed =
    BASE_SPEED + (screamer.agitation / 100) * (MAX_SPEED - BASE_SPEED);
  screamer.npc.setSpeed(speed);
}

function decayAgitation(screamer: ScreamerInstance, dt: number): void {
  screamer.agitation = Math.max(
    0,
    screamer.agitation - AGITATION_DECAY_RATE * dt
  );
}

function enterWander(screamer: ScreamerInstance): void {
  screamer.stateTimer = 0;
  screamer.agitation = AGITATION_INITIAL;
  screamer.targetCharacterId = null;
  screamer.npc.lookAtTarget = null;
  screamer.lastNoisePos = null;
  screamer.wanderOrigin = screamer.npc.state.position.slice() as Float32Array;
  const pt = pickPatrolPoint(screamer.server, screamer.wanderOrigin);
  if (pt) {
    screamer.targetPos = pt;
    moveToward(screamer.npc, pt, screamer.server);
  }
}

function screamAtNearbyZombies(screamer: ScreamerInstance): void {
  const sz = 50;
  const pos = screamer.npc.state.position;
  const cx = Math.floor(pos[0] / sz);
  const cz = Math.floor(pos[2] / sz);
  for (let dx = -1; dx <= 1; dx++) {
    for (let dz = -1; dz <= 1; dz++) {
      const bucket = screamer.server.aiTargetSpatialMap.get(
        `${cx + dx},${cz + dz}`
      );
      if (!bucket) continue;
      for (const entry of bucket) {
        if (entry.npcId !== NpcIds.ZOMBIE) continue;
        if (getDistance2d(pos, entry.position) > SCREAM_RADIUS) continue;
        const npc = screamer.server._npcs[entry.id];
        if (!npc?.fsm || !(npc instanceof ZombieWalker)) continue;
        npc.fsm.event("coverEars");
      }
    }
  }
}

function screamAtNearbyPlayers(screamer: ScreamerInstance): void {
  for (const k in screamer.server._clients) {
    const client = screamer.server._clients[k];
    if (
      !client.character.isAlive ||
      client.character.isVanished ||
      client.character.isHidden
    )
      continue;
    if (
      getDistance2d(
        screamer.npc.state.position,
        client.character.state.position
      ) <= SCREAM_RADIUS
    ) {
      screamer.server.addScreenEffect(
        client,
        screamer.server._screenEffects["SCREAM"]
      );
      screamer.server.applyMovementModifier(client, MovementModifiers.SCREAM);
    }
  }
}

export function createScreamer(
  npc: Npc,
  server: ZoneServer2016
): ScreamerInstance {
  const screamer = new JSM(
    {
      [Transitions.Sleep]: (_dt: number) => {
        const sz = 50;
        const pos = screamer.npc.state.position;
        const cx = Math.floor(pos[0] / sz);
        const cz = Math.floor(pos[2] / sz);
        for (let dx = -1; dx <= 1; dx++) {
          for (let dz = -1; dz <= 1; dz++) {
            const bucket = screamer.server.aiTargetSpatialMap.get(
              `${cx + dx},${cz + dz}`
            );
            if (!bucket) continue;
            for (const entry of bucket) {
              if (entry.npcId !== NpcIds.SURVIVOR) continue;
              if (getDistance2d(pos, entry.position) < PLAYER_DETECT_RADIUS) {
                screamer.targetCharacterId = entry.id;
                screamer.event(Events.StartRising);
                return;
              }
            }
          }
        }
      },

      [Transitions.Rising]: (dt: number) => {
        screamer.stateTimer += dt;
        if (tryDetectPlayer(screamer)) return;
      },

      [Transitions.Wander]: (dt: number) => {
        screamer.stateTimer += dt;
        applyAgitation(screamer);

        if (tryDetectPlayer(screamer)) return;

        decayAgitation(screamer, dt);

        if (screamer.agitation === 0) {
          screamer.event(Events.IdleTimeout);
          return;
        }

        const arrived =
          screamer.targetPos != null &&
          getDistance2d(screamer.npc.state.position, screamer.targetPos) < 3;

        if (arrived || screamer.targetPos == null) {
          const pt = pickPatrolPoint(screamer.server, screamer.wanderOrigin);
          if (pt) {
            screamer.targetPos = pt;
            moveToward(screamer.npc, pt, screamer.server);
          }
        }
      },
      [Transitions.Screaming]: (dt: number) => {
        screamer.stateTimer += dt;
        const chaseTarget = getChaseTarget(screamer);
        if (
          !chaseTarget ||
          !chaseTarget.isAlive ||
          chaseTarget.isVanished ||
          chaseTarget.isHidden
        ) {
          screamer.event(Events.LostPlayer);
          return;
        }

        if (screamer.stateTimer >= SCREAM_DURATION) {
          screamer.event(Events.DoneScreaming);
        }
      },

      [Transitions.Chase]: (dt: number) => {
        screamer.stateTimer += dt;
        applyAgitation(screamer);

        const chaseTarget = getChaseTarget(screamer);
        if (
          !chaseTarget ||
          !chaseTarget.isAlive ||
          chaseTarget.isVanished ||
          chaseTarget.isHidden
        ) {
          screamer.event(Events.LostPlayer);
          return;
        }

        screamer.npc.lookAtTarget = chaseTarget.state.position;
        const chaseDist = getDistance2d(
          screamer.npc.state.position,
          chaseTarget.state.position
        );
        if (chaseDist > 80) {
          screamer.event(Events.LostPlayer);
        } else if (chaseDist < 2) {
          screamer.event(Events.ReachPlayer);
        } else {
          moveToward(screamer.npc, chaseTarget.state.position, screamer.server);
        }
      },

      [Transitions.Attack]: (dt: number) => {
        screamer.stateTimer += dt;
        applyAgitation(screamer);

        const attackTarget = getChaseTarget(screamer);
        if (!attackTarget || !attackTarget.isAlive) {
          screamer.event(Events.PlayerKilled);
          return;
        }
        if (attackTarget.isVanished || attackTarget.isHidden) {
          screamer.event(Events.LostPlayer);
          return;
        }
        screamer.npc.lookAtTarget = attackTarget.state.position;
        moveToward(screamer.npc, attackTarget.state.position, screamer.server);
        const attackDist = getDistance(
          screamer.npc.state.position,
          attackTarget.state.position
        );
        if (attackDist >= 2) {
          screamer.event(Events.PlayerBacked);
        } else if (screamer.stateTimer > 2) {
          screamer.event(Events.StartAttacking);
        }
      },

      [Transitions.Attacking]: (dt: number) => {
        screamer.stateTimer += dt * 2;

        const attackTarget = getChaseTarget(screamer);
        if (attackTarget) {
          screamer.npc.lookAt(attackTarget.state.position);
        }

        if (screamer.stateTimer >= 2) {
          if (attackTarget) {
            const attackDist = getDistance(
              screamer.npc.state.position,
              attackTarget.state.position
            );
            if (attackDist <= 2) {
              screamer.npc.applyDamage(screamer.targetCharacterId!);
            }
          }
          screamer.event(Events.DoneAttacking);
        }
      }
    },
    [
      {
        eventId: Events.StartRising,
        from: [Transitions.Sleep],
        to: Transitions.Rising,
        EnterTransition: () => {
          screamer.stateTimer = 0;
          screamer.npc.playAnimation(ScreamerAnimations.ScreamerRise);
        }
      },
      {
        eventId: Events.StartScreaming,
        from: [Transitions.Wander, Transitions.Chase, Transitions.Rising],
        to: Transitions.Screaming,
        EnterTransition: () => {
          screamer.npc.stopMovement();
          screamer.npc.playAnimation(ScreamerAnimations.Scream);
          screamer.stateTimer = 0;
          screamAtNearbyZombies(screamer);
          screamAtNearbyPlayers(screamer);
        }
      },
      {
        eventId: Events.DoneScreaming,
        from: [Transitions.Screaming],
        to: Transitions.Chase,
        EnterTransition: () => {
          screamer.stateTimer = 0;
          applyAgitation(screamer);
          const target = getChaseTarget(screamer);
          if (target)
            moveToward(screamer.npc, target.state.position, screamer.server);
        }
      },
      {
        eventId: Events.ReachPlayer,
        from: [Transitions.Chase],
        to: Transitions.Attack,
        EnterTransition: () => {
          screamer.stateTimer = 2;
        }
      },
      {
        eventId: Events.LostPlayer,
        from: [
          Transitions.Chase,
          Transitions.Attack,
          Transitions.Attacking,
          Transitions.Screaming
        ],
        to: Transitions.Wander,
        EnterTransition: () => enterWander(screamer)
      },
      {
        eventId: Events.PlayerBacked,
        from: [Transitions.Attack],
        to: Transitions.Chase,
        EnterTransition: undefined
      },
      {
        eventId: Events.StartAttacking,
        from: [Transitions.Attack],
        to: Transitions.Attacking,
        EnterTransition: () => {
          screamer.npc.playAnimation(ScreamerAnimations.KnifeSlash);
          screamer.stateTimer = 0;
        }
      },
      {
        eventId: Events.DoneAttacking,
        from: [Transitions.Attacking],
        to: Transitions.Attack,
        EnterTransition: () => {
          screamer.stateTimer = 2;
        }
      },
      {
        eventId: Events.PlayerKilled,
        from: [Transitions.Attack],
        to: Transitions.Wander,
        EnterTransition: () => enterWander(screamer)
      },
      {
        eventId: Events.IdleTimeout,
        from: [Transitions.Wander],
        to: Transitions.Sleep,
        EnterTransition: () => {
          screamer.stateTimer = 0;
          screamer.npc.stopMovement();
          screamer.npc.setAnimation(ScreamerAnimations.ScreamerReset);
        }
      }
    ],
    Transitions.Sleep
  ) as unknown as ScreamerInstance;

  screamer.onTransition = (from: string, to: string, eventId: string) => {
    debug(`[screamer:${screamer.id}] ${from} → ${to} (${eventId})`);
  };
  screamer.id = npc.characterId;
  screamer.npc = npc;
  screamer.server = server;
  screamer.agitation = AGITATION_INITIAL;
  screamer.wanderOrigin = npc.state.position.slice() as Float32Array;
  screamer.targetPos = null;
  screamer.lastNoisePos = null;
  screamer.stateTimer = 0;
  screamer.targetCharacterId = null;

  npc.setAnimation(ScreamerAnimations.ScreamerReset);

  return screamer;
}
