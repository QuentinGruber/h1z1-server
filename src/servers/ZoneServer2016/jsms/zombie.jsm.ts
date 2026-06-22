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
import { isHostile } from "./factions";

export const enum ZombieLoopingAnim {
  Idle = "Idle",
  idle = "idle",
  Eating = "Eating",
  FakeRagdoll = "FakeRagdoll",
  Alive = "Alive",
  DeathPose = "DeathPose",
  StopPhysics = "StopPhysics",
  TrueAnimation = "TrueAnimation",
  FalseAnimation = "FalseAnimation",
  StuckBehindFence = "StuckBehindFence",
  StuckBehindFenceReaching = "StuckBehindFenceReaching",
  StuckBehindObjectTall = "StuckBehindObjectTall",
  StuckBehindObjectShort = "StuckBehindObjectShort"
}

export const enum ZombieOneshotAnim {
  Flinch = "Flinch",
  Death = "Death",
  EatingDone = "EatingDone",
  DeathRagdoll = "DeathRagdoll",
  KnifeSlash = "KnifeSlash",
  MeleeFlinch = "MeleeFlinch",
  TurnLeft90 = "TurnLeft90",
  TurnRight90 = "TurnRight90",
  LostTarget = "LostTarget",
  GrappleTell = "GrappleTell",
  TurnLeft45 = "TurnLeft45",
  TurnRight45 = "TurnRight45",
  TurnRight180 = "TurnRight180",
  TurnLeft180 = "TurnLeft180",
  PushbackNorthMedium = "PushbackNorthMedium",
  PushbackEastMedium = "PushbackEastMedium",
  PushbackWestMedium = "PushbackWestMedium",
  PushbackSouthMedium = "PushbackSouthMedium",
  BlowbackNorth = "BlowbackNorth",
  FallOverFence = "FallOverFence",
  GetUp = "GetUp",
  Stun = "Stun",
  DeathRagdollAnywhere = "DeathRagdollAnywhere",
  StumbleA = "StumbleA",
  StumbleB = "StumbleB",
  StumbleC = "StumbleC",
  ExplodeContract = "ExplodeContract",
  ExplodeExpand = "ExplodeExpand",
  GasConvulse = "GasConvulse",
  Spawn = "Spawn",
  SpawnFromGround = "SpawnFromGround",
  Spit = "Spit",
  CoverEars = "CoverEars",
  CoverEarsDone = "CoverEarsDone",
  Stagger_Light = "Stagger_Light",
  Stagger_Medium = "Stagger_Medium",
  Stagger_Heavy = "Stagger_Heavy"
}

export const enum ZombieTransitions {
  Idle = "idle",
  Wander = "wander",
  Investigate = "investigate",
  Chase = "chase",
  Stumble = "stumble",
  Attack = "attack",
  Attacking = "attacking",
  Feed = "feed"
}

export const enum ZombieEvents {
  HearNoise = "hearNoise",
  SeePlayer = "seePlayer",
  SmellCorpse = "smellCorpse",
  NoiseTimeout = "noiseTimeout",
  ReachPlayer = "reachPlayer",
  LostPlayer = "lostPlayer",
  PlayerBacked = "playerBacked",
  PlayerKilled = "playerKilled",
  DoneFeeding = "doneFeeding",
  IdleTimeout = "idleTimeout",
  StartAttacking = "startAttacking",
  DoneAttacking = "doneAttacking",
  StartStumble = "startStumble",
  StumbleTimeout = "stumbleTimeout",
  CoverEars = "coverEars"
}

export interface ZombieInstance extends JSM<ZombieEvents> {
  id: string;
  state: ZombieTransitions;
  hunger: number;
  agitation: number;
  targetPos: Float32Array | null;
  lastNoisePos: Float32Array | null;
  stateTimer: number;
  targetCharacterId: string | null;
  corpseTargetId: string | null;
  isEatingCorpse: boolean;
  lastAttackTime: number;
  wanderOrigin: Float32Array;
  isCoveringEars: boolean;
  coverEarsTimer: number;
  npc: Npc;
  server: ZoneServer2016;
}

const BASE_SPEED = 1.0;
const MAX_SPEED = 4.0;
const AGITATION_DECAY_RATE = 1;
const AGITATION_INITIAL = 50;
const INVESTIGATE_TIMEOUT = 120;
const STUMBLE_CHANCE = 0.001;

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

function listenToSounds(zombie: ZombieInstance, sounds: Sound[]): Sound | null {
  let nearest: Sound | null = null;
  let nearestDist = Infinity;
  for (const sound of sounds) {
    const dist = getDistance2d(zombie.npc.state.position, sound.position);
    if (dist < sound.radius) {
      zombie.agitation = Math.min(100, zombie.agitation + sound.agitation);
      if (dist < nearestDist) {
        nearest = sound;
        nearestDist = dist;
      }
    }
  }
  return nearest;
}

function trySeePlayer(zombie: ZombieInstance): boolean {
  const sz = 50;
  const pos = zombie.npc.state.position;
  const cx = Math.floor(pos[0] / sz);
  const cz = Math.floor(pos[2] / sz);
  for (let dx = -1; dx <= 1; dx++) {
    for (let dz = -1; dz <= 1; dz++) {
      const bucket = zombie.server.aiTargetSpatialMap.get(
        `${cx + dx},${cz + dz}`
      );
      if (!bucket) continue;
      for (const entry of bucket) {
        if (entry.id === zombie.npc.characterId) continue;
        if (!isHostile(zombie.npc.faction, entry.faction)) continue;
        if (getDistance2d(pos, entry.position) < 10) {
          zombie.targetCharacterId = entry.id;
          zombie.event(ZombieEvents.SeePlayer);
          return true;
        }
      }
    }
  }
  return false;
}

function trySmellCorpse(zombie: ZombieInstance): boolean {
  if (zombie.hunger < 60) return false;
  for (const characterId in zombie.server._characters) {
    const character = zombie.server._characters[characterId];
    if (character.isAlive) continue;
    if (
      getDistance2d(zombie.npc.state.position, character.state.position) < 30
    ) {
      zombie.corpseTargetId = characterId;
      zombie.event(ZombieEvents.SmellCorpse);
      return true;
    }
  }
  return false;
}

function getChaseTarget(zombie: ZombieInstance): {
  position: Float32Array;
  isAlive: boolean;
  isVanished: boolean;
  isHidden: boolean;
} | null {
  if (!zombie.targetCharacterId) return null;
  const player = zombie.server._characters[zombie.targetCharacterId];
  if (player)
    return {
      position: player.state.position,
      isAlive: player.isAlive,
      isVanished: !!player.isVanished,
      isHidden: !!player.isHidden
    };
  const npc = zombie.server._npcs[zombie.targetCharacterId];
  if (npc)
    return {
      position: npc.state.position,
      isAlive: npc.isAlive,
      isVanished: false,
      isHidden: false
    };
  return null;
}

function applyDamageToTarget(zombie: ZombieInstance): void {
  if (!zombie.targetCharacterId) return;
  const character = zombie.server._characters[zombie.targetCharacterId];
  if (character) {
    zombie.npc.applyDamage(zombie.targetCharacterId);
    return;
  }
  const targetNpc = zombie.server._npcs[zombie.targetCharacterId];
  if (targetNpc && targetNpc.isAlive) {
    targetNpc.damage(zombie.server, {
      entity: zombie.npc.characterId,
      damage: zombie.npc.npcMeleeDamage
    });
  }
}

function tickTimers(zombie: ZombieInstance, dt: number): void {
  zombie.hunger = Math.min(100, zombie.hunger + dt * 2);
  zombie.stateTimer += dt;
  zombie.lastAttackTime += dt;
}

function enterWander(zombie: ZombieInstance): void {
  zombie.stateTimer = 0;
  zombie.agitation = AGITATION_INITIAL;
  zombie.targetCharacterId = null;
  zombie.npc.lookAtTarget = null;
  zombie.wanderOrigin = zombie.npc.state.position.slice() as Float32Array;
  const pt = pickPatrolPoint(zombie.server, zombie.wanderOrigin);
  if (pt) {
    zombie.targetPos = pt;
    moveToward(zombie.npc, pt, zombie.server);
  }
}

function enterFeed(zombie: ZombieInstance): void {
  zombie.npc.stopMovement();
  zombie.stateTimer = 0;
  zombie.targetCharacterId = null;
  zombie.npc.lookAtTarget = null;
  zombie.isEatingCorpse = false;
}

function applyAgitation(zombie: ZombieInstance) {
  const speed =
    BASE_SPEED + (zombie.agitation / 100) * (MAX_SPEED - BASE_SPEED);
  zombie.npc.setSpeed(speed);
}
function decayAgitation(zombie: ZombieInstance, dt: number) {
  zombie.agitation = Math.max(0, zombie.agitation - AGITATION_DECAY_RATE * dt);
}

export function createZombie(npc: Npc, server: ZoneServer2016): ZombieInstance {
  const zombie = new JSM(
    {
      [ZombieTransitions.Wander]: (dt: number) => {
        if (zombie.isCoveringEars) {
          zombie.coverEarsTimer += dt;
          if (zombie.coverEarsTimer >= 3) {
            zombie.isCoveringEars = false;
            zombie.npc.playAnimation(ZombieOneshotAnim.CoverEarsDone);
            if (zombie.lastNoisePos) {
              // swarm toward where the scream came from
              zombie.stateTimer = 0;
              zombie.agitation = 100;
              zombie.targetPos = zombie.lastNoisePos;
              zombie.event(ZombieEvents.HearNoise);
            } else {
              enterWander(zombie);
            }
          }
          return;
        }

        tickTimers(zombie, dt);
        applyAgitation(zombie);

        if (trySeePlayer(zombie)) return;
        if (trySmellCorpse(zombie)) return;

        const nearestSound = listenToSounds(zombie, zombie.server.sounds);
        if (nearestSound) {
          zombie.lastNoisePos = nearestSound.position;
          zombie.event(ZombieEvents.HearNoise);
          return;
        }

        decayAgitation(zombie, dt);

        if (zombie.agitation === 0) {
          zombie.event(ZombieEvents.IdleTimeout);
          return;
        }

        const arrived =
          zombie.targetPos != null &&
          getDistance2d(zombie.npc.state.position, zombie.targetPos) < 3;

        if (arrived || zombie.targetPos == null) {
          const pt = pickPatrolPoint(zombie.server, zombie.wanderOrigin);
          if (pt) {
            zombie.targetPos = pt;
            moveToward(zombie.npc, pt, zombie.server);
          }
        }
      },

      [ZombieTransitions.Idle]: (dt: number) => {
        tickTimers(zombie, dt);

        if (trySeePlayer(zombie)) return;

        const nearestSound = listenToSounds(zombie, zombie.server.sounds);
        if (nearestSound) {
          zombie.lastNoisePos = nearestSound.position;
          zombie.event(ZombieEvents.HearNoise);
          return;
        }

        trySmellCorpse(zombie);
      },

      [ZombieTransitions.Investigate]: (dt: number) => {
        tickTimers(zombie, dt);
        applyAgitation(zombie);

        if (trySeePlayer(zombie)) return;
        if (trySmellCorpse(zombie)) return;

        if (zombie.stateTimer >= INVESTIGATE_TIMEOUT) {
          zombie.event(ZombieEvents.NoiseTimeout);
          return;
        }

        if (
          zombie.lastNoisePos != null &&
          getDistance2d(zombie.npc.state.position, zombie.lastNoisePos) < 3
        ) {
          zombie.event(ZombieEvents.NoiseTimeout);
          return;
        }

        const nearestSound = listenToSounds(zombie, zombie.server.sounds);
        if (nearestSound) {
          zombie.lastNoisePos = nearestSound.position;
          zombie.stateTimer = 0;
          moveToward(zombie.npc, nearestSound.position, zombie.server);
        }
      },

      [ZombieTransitions.Chase]: (dt: number) => {
        tickTimers(zombie, dt);
        listenToSounds(zombie, zombie.server.sounds);
        applyAgitation(zombie);

        const chaseTarget = getChaseTarget(zombie);
        if (
          !chaseTarget ||
          !chaseTarget.isAlive ||
          chaseTarget.isVanished ||
          chaseTarget.isHidden
        ) {
          zombie.event(ZombieEvents.LostPlayer);
          return;
        }

        const chaseDist = getDistance2d(
          zombie.npc.state.position,
          chaseTarget.position
        );
        if (chaseDist > 50) {
          zombie.event(ZombieEvents.LostPlayer);
        } else if (chaseDist < 2) {
          zombie.event(ZombieEvents.ReachPlayer);
        } else {
          if (trySmellCorpse(zombie)) return;
          if (Math.random() < STUMBLE_CHANCE) {
            zombie.event(ZombieEvents.StartStumble);
            return;
          }
          moveToward(zombie.npc, chaseTarget.position, zombie.server);
        }
      },

      [ZombieTransitions.Stumble]: (dt: number) => {
        zombie.stateTimer += dt;
        if (zombie.stateTimer >= 5) {
          zombie.event(ZombieEvents.StumbleTimeout);
        }
      },

      [ZombieTransitions.Attack]: (dt: number) => {
        tickTimers(zombie, dt);
        listenToSounds(zombie, zombie.server.sounds);
        applyAgitation(zombie);

        const attackTarget = getChaseTarget(zombie);
        if (!attackTarget || !attackTarget.isAlive) {
          if (zombie.hunger >= 30) {
            zombie.event(ZombieEvents.PlayerKilled);
          } else {
            zombie.event(ZombieEvents.LostPlayer);
          }
          return;
        }
        if (attackTarget.isVanished || attackTarget.isHidden) {
          zombie.event(ZombieEvents.LostPlayer);
          return;
        }
        zombie.npc.lookAtTarget = attackTarget.position;
        moveToward(zombie.npc, attackTarget.position, zombie.server);
        const attackDist = getDistance(
          zombie.npc.state.position,
          attackTarget.position
        );
        if (attackDist >= 2) {
          zombie.event(ZombieEvents.PlayerBacked);
        } else if (zombie.lastAttackTime > 2) {
          zombie.event(ZombieEvents.StartAttacking);
        }
      },

      [ZombieTransitions.Attacking]: (dt: number) => {
        zombie.hunger = Math.min(100, zombie.hunger + dt * 2);
        zombie.stateTimer += dt * 2;
        zombie.lastAttackTime += dt;
        listenToSounds(zombie, zombie.server.sounds);

        const attackTarget = getChaseTarget(zombie);
        if (attackTarget) {
          zombie.npc.lookAt(attackTarget.position);
        }

        if (zombie.stateTimer >= 2) {
          if (attackTarget) {
            const attackDist = getDistance(
              zombie.npc.state.position,
              attackTarget.position
            );
            if (attackDist <= 2) {
              applyDamageToTarget(zombie);
            }
          }
          zombie.event(ZombieEvents.DoneAttacking);
        }
      },

      [ZombieTransitions.Feed]: (dt: number) => {
        zombie.stateTimer += dt;
        zombie.lastAttackTime += dt;
        listenToSounds(zombie, zombie.server.sounds);
        applyAgitation(zombie);

        if (zombie.corpseTargetId) {
          const corpse = zombie.server._characters[zombie.corpseTargetId];
          if (!corpse || corpse.isAlive) {
            zombie.corpseTargetId = null;
            zombie.isEatingCorpse = false;
            zombie.event(ZombieEvents.DoneFeeding);
            return;
          }
          if (!zombie.isEatingCorpse) {
            const dist = getDistance2d(
              zombie.npc.state.position,
              corpse.state.position
            );
            if (dist > 2) {
              zombie.npc.lookAtTarget = corpse.state.position;
              moveToward(zombie.npc, corpse.state.position, zombie.server);
              return;
            }
            zombie.npc.lookAtTarget = null;
            zombie.npc.stopMovement();
          }
        }

        if (!zombie.isEatingCorpse) {
          // wait for the nav agent to fully decelerate before starting the anim
          const vel = zombie.npc.navAgent?.velocity();
          const speed = vel ? Math.sqrt(vel.x * vel.x + vel.z * vel.z) : 0;
          if (speed > 0.0) return;
          zombie.npc.setAnimation(ZombieLoopingAnim.Eating);
          zombie.isEatingCorpse = true;
          zombie.stateTimer = 0;
        }

        zombie.hunger = Math.max(0, zombie.hunger - dt * 15);
        if (zombie.hunger === 0) {
          zombie.npc.playAnimation(ZombieOneshotAnim.EatingDone);
          zombie.corpseTargetId = null;
          zombie.isEatingCorpse = false;
          zombie.event(ZombieEvents.DoneFeeding);
        }
      }
    },
    [
      {
        eventId: ZombieEvents.HearNoise,
        from: [ZombieTransitions.Wander, ZombieTransitions.Idle],
        to: ZombieTransitions.Investigate,
        EnterTransition: () => {
          zombie.stateTimer = 0;
          zombie.targetPos = zombie.lastNoisePos;
          if (zombie.targetPos)
            moveToward(zombie.npc, zombie.targetPos, zombie.server);
        }
      },
      {
        eventId: ZombieEvents.SeePlayer,
        from: [
          ZombieTransitions.Wander,
          ZombieTransitions.Investigate,
          ZombieTransitions.Idle
        ],
        to: ZombieTransitions.Chase,
        EnterTransition: () => {
          zombie.npc.lookAtTarget = null;
        }
      },
      {
        eventId: ZombieEvents.SmellCorpse,
        from: [
          ZombieTransitions.Wander,
          ZombieTransitions.Idle,
          ZombieTransitions.Investigate,
          ZombieTransitions.Chase
        ],
        to: ZombieTransitions.Feed,
        EnterTransition: () => enterFeed(zombie)
      },
      {
        eventId: ZombieEvents.NoiseTimeout,
        from: [ZombieTransitions.Investigate],
        to: ZombieTransitions.Wander,
        EnterTransition: () => enterWander(zombie)
      },
      {
        eventId: ZombieEvents.ReachPlayer,
        from: [ZombieTransitions.Chase],
        to: ZombieTransitions.Attack,
        EnterTransition: () => {
          zombie.lastAttackTime = 2;
        }
      },
      {
        eventId: ZombieEvents.StartStumble,
        from: [ZombieTransitions.Chase],
        to: ZombieTransitions.Stumble,
        EnterTransition: () => {
          zombie.npc.stopMovement();
          zombie.stateTimer = 0;
          const anims = [
            ZombieOneshotAnim.StumbleA,
            ZombieOneshotAnim.StumbleB,
            ZombieOneshotAnim.StumbleC
          ];
          zombie.npc.playAnimation(
            anims[Math.floor(Math.random() * anims.length)]
          );
        }
      },
      {
        eventId: ZombieEvents.StumbleTimeout,
        from: [ZombieTransitions.Stumble],
        to: ZombieTransitions.Chase,
        EnterTransition: () => {
          zombie.stateTimer = 0;
          const chaseTarget = getChaseTarget(zombie);
          if (chaseTarget) {
            moveToward(zombie.npc, chaseTarget.position, zombie.server);
          }
        }
      },
      {
        eventId: ZombieEvents.StartAttacking,
        from: [ZombieTransitions.Attack],
        to: ZombieTransitions.Attacking,
        EnterTransition: () => {
          zombie.npc.playAnimation(ZombieOneshotAnim.KnifeSlash);
          zombie.stateTimer = 0;
          zombie.lastAttackTime = 0;
        }
      },
      {
        eventId: ZombieEvents.DoneAttacking,
        from: [ZombieTransitions.Attacking],
        to: ZombieTransitions.Attack,
        EnterTransition: () => {
          zombie.lastAttackTime = 2;
        }
      },
      {
        eventId: ZombieEvents.LostPlayer,
        from: [
          ZombieTransitions.Chase,
          ZombieTransitions.Attack,
          ZombieTransitions.Stumble
        ],
        to: ZombieTransitions.Wander,
        EnterTransition: () => enterWander(zombie)
      },
      {
        eventId: ZombieEvents.PlayerBacked,
        from: [ZombieTransitions.Attack],
        to: ZombieTransitions.Chase,
        EnterTransition: () => {
          zombie.npc.lookAtTarget = null;
        }
      },
      {
        eventId: ZombieEvents.PlayerKilled,
        from: [ZombieTransitions.Attack],
        to: ZombieTransitions.Feed,
        EnterTransition: () => enterFeed(zombie)
      },
      {
        eventId: ZombieEvents.DoneFeeding,
        from: [ZombieTransitions.Feed],
        to: ZombieTransitions.Wander,
        EnterTransition: () => enterWander(zombie)
      },
      {
        eventId: ZombieEvents.IdleTimeout,
        from: [ZombieTransitions.Wander],
        to: ZombieTransitions.Idle,
        EnterTransition: () => {
          zombie.stateTimer = 0;
          zombie.npc.stopMovement();
          zombie.npc.setAnimation(ZombieLoopingAnim.Idle);
        }
      },
      {
        eventId: ZombieEvents.CoverEars,
        from: null,
        to: ZombieTransitions.Wander,
        EnterTransition: () => {
          zombie.npc.stopMovement();
          zombie.npc.playAnimation(ZombieOneshotAnim.CoverEars);
          zombie.isCoveringEars = true;
          zombie.coverEarsTimer = 0;
          zombie.targetCharacterId = null;
          zombie.npc.lookAtTarget = null;
          zombie.wanderOrigin =
            zombie.npc.state.position.slice() as Float32Array;
        }
      }
    ],
    ZombieTransitions.Wander
  ) as unknown as ZombieInstance;

  zombie.onTransition = (from: string, to: string, eventId: string) => {
    debug(`[${zombie.id}] ${from} → ${to} (${eventId})`);
  };
  zombie.id = npc.characterId;
  zombie.npc = npc;
  zombie.server = server;
  zombie.hunger = 0;
  zombie.agitation = AGITATION_INITIAL;
  zombie.wanderOrigin = npc.state.position.slice() as Float32Array;
  const initialPatrol = pickPatrolPoint(server, npc.state.position);
  zombie.targetPos = initialPatrol;
  if (initialPatrol) {
    moveToward(npc, initialPatrol, server);
  }
  zombie.lastNoisePos = null;
  zombie.targetCharacterId = null;
  zombie.corpseTargetId = null;
  zombie.isEatingCorpse = false;
  zombie.stateTimer = 0;
  zombie.lastAttackTime = 0;
  zombie.isCoveringEars = false;
  zombie.coverEarsTimer = 0;

  return zombie;
}
