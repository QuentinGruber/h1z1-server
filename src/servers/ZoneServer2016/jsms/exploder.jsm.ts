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
import {
  generateRandomGuid,
  getDistance2d,
  getDistance
} from "../../../utils/utils";
import { Items, NpcIds } from "../models/enums";
import { ExplosiveEntity } from "../entities/explosiveentity";
import {
  ZombieLoopingAnim,
  ZombieOneshotAnim,
  ZombieTransitions,
  ZombieEvents,
  type ZombieInstance
} from "./zombie.jsm";

const LANDMINE_MODEL_ID = 9176;
const EXPLODE_WINDUP = 2;

const BASE_SPEED = 1.0;
const MAX_SPEED = 5.0;
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

function listenToSounds(
  exploder: ZombieInstance,
  sounds: Sound[]
): Sound | null {
  let nearest: Sound | null = null;
  let nearestDist = Infinity;
  for (const sound of sounds) {
    const dist = getDistance2d(exploder.npc.state.position, sound.position);
    if (dist < sound.radius) {
      exploder.agitation = Math.min(100, exploder.agitation + sound.agitation);
      if (dist < nearestDist) {
        nearest = sound;
        nearestDist = dist;
      }
    }
  }
  return nearest;
}

function trySeePlayer(exploder: ZombieInstance): boolean {
  const sz = 50;
  const pos = exploder.npc.state.position;
  const cx = Math.floor(pos[0] / sz);
  const cz = Math.floor(pos[2] / sz);
  for (let dx = -1; dx <= 1; dx++) {
    for (let dz = -1; dz <= 1; dz++) {
      const bucket = exploder.server.aiTargetSpatialMap.get(
        `${cx + dx},${cz + dz}`
      );
      if (!bucket) continue;
      for (const entry of bucket) {
        if (entry.npcId !== NpcIds.SURVIVOR) {
          if (
            entry.npcId === NpcIds.ZOMBIE ||
            entry.npcId === NpcIds.GAZER ||
            entry.npcId === NpcIds.EXPLODER
          )
            continue;
          if (entry.id === exploder.npc.characterId) continue;
        }
        if (getDistance2d(pos, entry.position) < 10) {
          exploder.targetCharacterId = entry.id;
          exploder.event(ZombieEvents.SeePlayer);
          return true;
        }
      }
    }
  }
  return false;
}

function trySmellCorpse(exploder: ZombieInstance): boolean {
  if (exploder.hunger < 60) return false;
  for (const characterId in exploder.server._characters) {
    const character = exploder.server._characters[characterId];
    if (character.isAlive) continue;
    if (
      getDistance2d(exploder.npc.state.position, character.state.position) < 30
    ) {
      exploder.corpseTargetId = characterId;
      exploder.event(ZombieEvents.SmellCorpse);
      return true;
    }
  }
  return false;
}

function getChaseTarget(exploder: ZombieInstance): {
  position: Float32Array;
  isAlive: boolean;
  isVanished: boolean;
  isHidden: boolean;
} | null {
  if (!exploder.targetCharacterId) return null;
  const player = exploder.server._characters[exploder.targetCharacterId];
  if (player)
    return {
      position: player.state.position,
      isAlive: player.isAlive,
      isVanished: !!player.isVanished,
      isHidden: !!player.isHidden
    };
  const npc = exploder.server._npcs[exploder.targetCharacterId];
  if (npc)
    return {
      position: npc.state.position,
      isAlive: npc.isAlive,
      isVanished: false,
      isHidden: false
    };
  return null;
}

function explodeAndDie(exploder: ZombieInstance): void {
  const { npc, server } = exploder;
  const pos = npc.state.position;

  const characterId = generateRandomGuid();
  const transientId = server.getTransientId(characterId);
  // Boring hack
  const explosive = new ExplosiveEntity(
    characterId,
    transientId,
    LANDMINE_MODEL_ID,
    pos.slice() as Float32Array,
    new Float32Array([0, 0, 0, 0]),
    server,
    Items.LANDMINE,
    npc.characterId
  );
  server._explosives[characterId] = explosive;
  npc.playAnimation(ZombieOneshotAnim.ExplodeExpand);
  explosive.detonate(npc.characterId);

  // kill the exploder
  npc.damage(server, {
    entity: npc.characterId,
    damage: npc.health + 1
  });
}

function tickTimers(exploder: ZombieInstance, dt: number): void {
  exploder.hunger = Math.min(100, exploder.hunger + dt * 2);
  exploder.stateTimer += dt;
  exploder.lastAttackTime += dt;
}

function enterWander(exploder: ZombieInstance): void {
  exploder.stateTimer = 0;
  exploder.agitation = AGITATION_INITIAL;
  exploder.targetCharacterId = null;
  exploder.npc.lookAtTarget = null;
  exploder.wanderOrigin = exploder.npc.state.position.slice() as Float32Array;
  const pt = pickPatrolPoint(exploder.server, exploder.wanderOrigin);
  if (pt) {
    exploder.targetPos = pt;
    moveToward(exploder.npc, pt, exploder.server);
  }
}

function enterFeed(exploder: ZombieInstance): void {
  exploder.npc.stopMovement();
  exploder.stateTimer = 0;
  exploder.targetCharacterId = null;
  exploder.npc.lookAtTarget = null;
  exploder.isEatingCorpse = false;
}

function applyAgitation(exploder: ZombieInstance) {
  const speed =
    BASE_SPEED + (exploder.agitation / 100) * (MAX_SPEED - BASE_SPEED);
  exploder.npc.setSpeed(speed);
}
function decayAgitation(exploder: ZombieInstance, dt: number) {
  exploder.agitation = Math.max(
    0,
    exploder.agitation - AGITATION_DECAY_RATE * dt
  );
}

export function createExploder(
  npc: Npc,
  server: ZoneServer2016
): ZombieInstance {
  const exploder = new JSM(
    {
      [ZombieTransitions.Wander]: (dt: number) => {
        tickTimers(exploder, dt);
        applyAgitation(exploder);

        if (trySeePlayer(exploder)) return;
        if (trySmellCorpse(exploder)) return;

        const nearestSound = listenToSounds(exploder, exploder.server.sounds);
        if (nearestSound) {
          exploder.lastNoisePos = nearestSound.position;
          exploder.event(ZombieEvents.HearNoise);
          return;
        }

        decayAgitation(exploder, dt);

        if (exploder.agitation === 0) {
          exploder.event(ZombieEvents.IdleTimeout);
          return;
        }

        const arrived =
          exploder.targetPos != null &&
          getDistance2d(exploder.npc.state.position, exploder.targetPos) < 3;

        if (arrived || exploder.targetPos == null) {
          const pt = pickPatrolPoint(exploder.server, exploder.wanderOrigin);
          if (pt) {
            exploder.targetPos = pt;
            moveToward(exploder.npc, pt, exploder.server);
          }
        }
      },

      [ZombieTransitions.Idle]: (dt: number) => {
        tickTimers(exploder, dt);

        if (trySeePlayer(exploder)) return;

        const nearestSound = listenToSounds(exploder, exploder.server.sounds);
        if (nearestSound) {
          exploder.lastNoisePos = nearestSound.position;
          exploder.event(ZombieEvents.HearNoise);
          return;
        }

        trySmellCorpse(exploder);
      },

      [ZombieTransitions.Investigate]: (dt: number) => {
        tickTimers(exploder, dt);
        applyAgitation(exploder);

        if (trySeePlayer(exploder)) return;
        if (trySmellCorpse(exploder)) return;

        if (exploder.stateTimer >= INVESTIGATE_TIMEOUT) {
          exploder.event(ZombieEvents.NoiseTimeout);
          return;
        }

        if (
          exploder.lastNoisePos != null &&
          getDistance2d(exploder.npc.state.position, exploder.lastNoisePos) < 3
        ) {
          exploder.event(ZombieEvents.NoiseTimeout);
          return;
        }

        const nearestSound = listenToSounds(exploder, exploder.server.sounds);
        if (nearestSound) {
          exploder.lastNoisePos = nearestSound.position;
          exploder.stateTimer = 0;
          moveToward(exploder.npc, nearestSound.position, exploder.server);
        }
      },

      [ZombieTransitions.Chase]: (dt: number) => {
        tickTimers(exploder, dt);
        listenToSounds(exploder, exploder.server.sounds);
        applyAgitation(exploder);

        const chaseTarget = getChaseTarget(exploder);
        if (
          !chaseTarget ||
          !chaseTarget.isAlive ||
          chaseTarget.isVanished ||
          chaseTarget.isHidden
        ) {
          exploder.event(ZombieEvents.LostPlayer);
          return;
        }

        const chaseDist = getDistance2d(
          exploder.npc.state.position,
          chaseTarget.position
        );
        if (chaseDist > 50) {
          exploder.event(ZombieEvents.LostPlayer);
        } else if (chaseDist < 2) {
          exploder.event(ZombieEvents.ReachPlayer);
        } else {
          if (trySmellCorpse(exploder)) return;
          if (Math.random() < STUMBLE_CHANCE) {
            exploder.event(ZombieEvents.StartStumble);
            return;
          }
          moveToward(exploder.npc, chaseTarget.position, exploder.server);
        }
      },

      [ZombieTransitions.Stumble]: (dt: number) => {
        exploder.stateTimer += dt;
        if (exploder.stateTimer >= 5) {
          exploder.event(ZombieEvents.StumbleTimeout);
        }
      },

      [ZombieTransitions.Attack]: (dt: number) => {
        tickTimers(exploder, dt);
        listenToSounds(exploder, exploder.server.sounds);
        applyAgitation(exploder);

        const attackTarget = getChaseTarget(exploder);
        if (!attackTarget || !attackTarget.isAlive) {
          if (exploder.hunger >= 30) {
            exploder.event(ZombieEvents.PlayerKilled);
          } else {
            exploder.event(ZombieEvents.LostPlayer);
          }
          return;
        }
        if (attackTarget.isVanished || attackTarget.isHidden) {
          exploder.event(ZombieEvents.LostPlayer);
          return;
        }
        exploder.npc.lookAtTarget = attackTarget.position;
        moveToward(exploder.npc, attackTarget.position, exploder.server);
        const attackDist = getDistance(
          exploder.npc.state.position,
          attackTarget.position
        );
        if (attackDist >= 2) {
          exploder.event(ZombieEvents.PlayerBacked);
        } else if (exploder.lastAttackTime > 2) {
          exploder.event(ZombieEvents.StartAttacking);
        }
      },

      [ZombieTransitions.Attacking]: (dt: number) => {
        exploder.stateTimer += dt;
        if (exploder.stateTimer >= EXPLODE_WINDUP) {
          explodeAndDie(exploder);
        }
      },

      [ZombieTransitions.Feed]: (dt: number) => {
        exploder.stateTimer += dt;
        exploder.lastAttackTime += dt;
        listenToSounds(exploder, exploder.server.sounds);
        applyAgitation(exploder);

        if (exploder.corpseTargetId) {
          const corpse = exploder.server._characters[exploder.corpseTargetId];
          if (!corpse || corpse.isAlive) {
            exploder.corpseTargetId = null;
            exploder.isEatingCorpse = false;
            exploder.event(ZombieEvents.DoneFeeding);
            return;
          }
          if (!exploder.isEatingCorpse) {
            const dist = getDistance2d(
              exploder.npc.state.position,
              corpse.state.position
            );
            if (dist > 2) {
              exploder.npc.lookAtTarget = corpse.state.position;
              moveToward(exploder.npc, corpse.state.position, exploder.server);
              return;
            }
            exploder.npc.lookAtTarget = null;
            exploder.npc.stopMovement();
          }
        }

        if (!exploder.isEatingCorpse) {
          const vel = exploder.npc.navAgent?.velocity();
          const speed = vel ? Math.sqrt(vel.x * vel.x + vel.z * vel.z) : 0;
          if (speed > 0.0) return;
          exploder.npc.setAnimation(ZombieLoopingAnim.Eating);
          exploder.isEatingCorpse = true;
          exploder.stateTimer = 0;
        }

        exploder.hunger = Math.max(0, exploder.hunger - dt * 15);
        if (exploder.hunger === 0) {
          exploder.npc.playAnimation(ZombieOneshotAnim.EatingDone);
          exploder.corpseTargetId = null;
          exploder.isEatingCorpse = false;
          exploder.event(ZombieEvents.DoneFeeding);
        }
      }
    },
    [
      {
        eventId: ZombieEvents.HearNoise,
        from: [ZombieTransitions.Wander, ZombieTransitions.Idle],
        to: ZombieTransitions.Investigate,
        EnterTransition: () => {
          exploder.stateTimer = 0;
          exploder.targetPos = exploder.lastNoisePos;
          if (exploder.targetPos)
            moveToward(exploder.npc, exploder.targetPos, exploder.server);
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
          exploder.npc.lookAtTarget = null;
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
        EnterTransition: () => enterFeed(exploder)
      },
      {
        eventId: ZombieEvents.NoiseTimeout,
        from: [ZombieTransitions.Investigate],
        to: ZombieTransitions.Wander,
        EnterTransition: () => enterWander(exploder)
      },
      {
        eventId: ZombieEvents.ReachPlayer,
        from: [ZombieTransitions.Chase],
        to: ZombieTransitions.Attack,
        EnterTransition: () => {
          exploder.lastAttackTime = 2;
        }
      },
      {
        eventId: ZombieEvents.StartStumble,
        from: [ZombieTransitions.Chase],
        to: ZombieTransitions.Stumble,
        EnterTransition: () => {
          exploder.npc.stopMovement();
          exploder.stateTimer = 0;
          const anims = [
            ZombieOneshotAnim.StumbleA,
            ZombieOneshotAnim.StumbleB,
            ZombieOneshotAnim.StumbleC
          ];
          exploder.npc.playAnimation(
            anims[Math.floor(Math.random() * anims.length)]
          );
        }
      },
      {
        eventId: ZombieEvents.StumbleTimeout,
        from: [ZombieTransitions.Stumble],
        to: ZombieTransitions.Chase,
        EnterTransition: () => {
          exploder.stateTimer = 0;
          const chaseTarget = getChaseTarget(exploder);
          if (chaseTarget) {
            moveToward(exploder.npc, chaseTarget.position, exploder.server);
          }
        }
      },
      {
        eventId: ZombieEvents.StartAttacking,
        from: [ZombieTransitions.Attack],
        to: ZombieTransitions.Attacking,
        EnterTransition: () => {
          exploder.npc.stopMovement();
          exploder.npc.lookAtTarget = null;
          exploder.npc.playAnimation(ZombieOneshotAnim.ExplodeContract);
          exploder.stateTimer = 0;
          exploder.lastAttackTime = 0;
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
        EnterTransition: () => enterWander(exploder)
      },
      {
        eventId: ZombieEvents.PlayerBacked,
        from: [ZombieTransitions.Attack],
        to: ZombieTransitions.Chase,
        EnterTransition: () => {
          exploder.npc.lookAtTarget = null;
        }
      },
      {
        eventId: ZombieEvents.PlayerKilled,
        from: [ZombieTransitions.Attack],
        to: ZombieTransitions.Feed,
        EnterTransition: () => enterFeed(exploder)
      },
      {
        eventId: ZombieEvents.DoneFeeding,
        from: [ZombieTransitions.Feed],
        to: ZombieTransitions.Wander,
        EnterTransition: () => enterWander(exploder)
      },
      {
        eventId: ZombieEvents.IdleTimeout,
        from: [ZombieTransitions.Wander],
        to: ZombieTransitions.Idle,
        EnterTransition: () => {
          exploder.stateTimer = 0;
          exploder.npc.stopMovement();
          exploder.npc.setAnimation(ZombieLoopingAnim.Idle);
        }
      }
    ],
    ZombieTransitions.Wander
  ) as unknown as ZombieInstance;

  exploder.onTransition = (from: string, to: string, eventId: string) => {
    debug(`[${exploder.id}] ${from} → ${to} (${eventId})`);
  };
  exploder.id = npc.characterId;
  exploder.npc = npc;
  exploder.server = server;
  exploder.hunger = 0;
  exploder.agitation = AGITATION_INITIAL;
  exploder.wanderOrigin = npc.state.position.slice() as Float32Array;
  const initialPatrol = pickPatrolPoint(server, npc.state.position);
  exploder.targetPos = initialPatrol;
  if (initialPatrol) {
    moveToward(npc, initialPatrol, server);
  }
  exploder.lastNoisePos = null;
  exploder.targetCharacterId = null;
  exploder.corpseTargetId = null;
  exploder.isEatingCorpse = false;
  exploder.stateTimer = 0;
  exploder.lastAttackTime = 0;
  exploder.isCoveringEars = false;
  exploder.coverEarsTimer = 0;

  return exploder;
}
