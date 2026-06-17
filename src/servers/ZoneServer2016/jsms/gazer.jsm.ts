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
import { ProjectileEntity } from "../entities/projectileentity";
import type { ZoneClient2016 } from "../classes/zoneclient";
import {
  ZombieLoopingAnim,
  ZombieOneshotAnim,
  ZombieTransitions,
  ZombieEvents,
  type ZombieInstance
} from "./zombie.jsm";

const BASE_SPEED = 1.0;
const MAX_SPEED = 6.0;
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

function listenToSounds(gazer: ZombieInstance, sounds: Sound[]): Sound | null {
  let nearest: Sound | null = null;
  let nearestDist = Infinity;
  for (const sound of sounds) {
    const dist = getDistance2d(gazer.npc.state.position, sound.position);
    if (dist < sound.radius) {
      gazer.agitation = Math.min(100, gazer.agitation + sound.agitation);
      if (dist < nearestDist) {
        nearest = sound;
        nearestDist = dist;
      }
    }
  }
  return nearest;
}

function trySeePlayer(gazer: ZombieInstance): boolean {
  const sz = 50;
  const pos = gazer.npc.state.position;
  const cx = Math.floor(pos[0] / sz);
  const cz = Math.floor(pos[2] / sz);
  for (let dx = -1; dx <= 1; dx++) {
    for (let dz = -1; dz <= 1; dz++) {
      const bucket = gazer.server.aiTargetSpatialMap.get(
        `${cx + dx},${cz + dz}`
      );
      if (!bucket) continue;
      for (const entry of bucket) {
        if (entry.npcId !== NpcIds.SURVIVOR) {
          if (entry.npcId === NpcIds.ZOMBIE || entry.npcId === NpcIds.GAZER)
            continue;
          if (entry.id === gazer.npc.characterId) continue;
        }
        if (getDistance2d(pos, entry.position) < 10) {
          gazer.targetCharacterId = entry.id;
          gazer.event(ZombieEvents.SeePlayer);
          return true;
        }
      }
    }
  }
  return false;
}

function trySmellCorpse(gazer: ZombieInstance): boolean {
  if (gazer.hunger < 60) return false;
  for (const characterId in gazer.server._characters) {
    const character = gazer.server._characters[characterId];
    if (character.isAlive) continue;
    if (
      getDistance2d(gazer.npc.state.position, character.state.position) < 30
    ) {
      gazer.corpseTargetId = characterId;
      gazer.event(ZombieEvents.SmellCorpse);
      return true;
    }
  }
  return false;
}

function getChaseTarget(gazer: ZombieInstance): {
  position: Float32Array;
  isAlive: boolean;
  isVanished: boolean;
  isHidden: boolean;
} | null {
  if (!gazer.targetCharacterId) return null;
  const player = gazer.server._characters[gazer.targetCharacterId];
  if (player)
    return {
      position: player.state.position,
      isAlive: player.isAlive,
      isVanished: !!player.isVanished,
      isHidden: !!player.isHidden
    };
  const npc = gazer.server._npcs[gazer.targetCharacterId];
  if (npc)
    return {
      position: npc.state.position,
      isAlive: npc.isAlive,
      isVanished: false,
      isHidden: false
    };
  return null;
}

function spawnGasCloud(gazer: ZombieInstance): void {
  const targetCharacter =
    gazer.server._characters[gazer.targetCharacterId ?? ""];
  const targetNpc = gazer.server._npcs[gazer.targetCharacterId ?? ""];
  const targetPos =
    targetCharacter?.state.position ?? targetNpc?.state.position;
  if (!targetPos) return;

  const characterId = generateRandomGuid();
  const transientId = gazer.server.getTransientId(characterId);
  const cloud = new ProjectileEntity(
    characterId,
    transientId,
    0,
    targetPos.slice() as Float32Array,
    new Float32Array([0, 0, 0, 0]),
    gazer.server,
    Items.GRENADE_GAS,
    0,
    gazer.npc.characterId
  );
  gazer.server._throwableProjectiles[characterId] = cloud;
  gazer.server
    .getClientsInRange(200, targetPos)
    .forEach((c: ZoneClient2016) => {
      gazer.server.addLightweightNpc(c, cloud);
      c.spawnedEntities.add(cloud);
    });
  // bypass the grenade's 5-second fuse and trigger the gas cloud immediately
  clearTimeout(cloud.triggerTimeout);
  cloud.onTrigger(gazer.server);
}

function tickTimers(gazer: ZombieInstance, dt: number): void {
  gazer.hunger = Math.min(100, gazer.hunger + dt * 2);
  gazer.stateTimer += dt;
  gazer.lastAttackTime += dt;
}

function enterWander(gazer: ZombieInstance): void {
  gazer.stateTimer = 0;
  gazer.agitation = AGITATION_INITIAL;
  gazer.targetCharacterId = null;
  gazer.npc.lookAtTarget = null;
  gazer.wanderOrigin = gazer.npc.state.position.slice() as Float32Array;
  const pt = pickPatrolPoint(gazer.server, gazer.wanderOrigin);
  if (pt) {
    gazer.targetPos = pt;
    moveToward(gazer.npc, pt, gazer.server);
  }
}

function enterFeed(gazer: ZombieInstance): void {
  gazer.npc.stopMovement();
  gazer.stateTimer = 0;
  gazer.targetCharacterId = null;
  gazer.npc.lookAtTarget = null;
  gazer.isEatingCorpse = false;
}

function applyAgitation(gazer: ZombieInstance) {
  const speed = BASE_SPEED + (gazer.agitation / 100) * (MAX_SPEED - BASE_SPEED);
  gazer.npc.setSpeed(speed);
}

function decayAgitation(gazer: ZombieInstance, dt: number) {
  gazer.agitation = Math.max(0, gazer.agitation - AGITATION_DECAY_RATE * dt);
}

export function createGazer(npc: Npc, server: ZoneServer2016): ZombieInstance {
  const gazer = new JSM(
    {
      [ZombieTransitions.Wander]: (dt: number) => {
        if (gazer.isCoveringEars) {
          gazer.coverEarsTimer += dt;
          if (gazer.coverEarsTimer >= 3) {
            gazer.isCoveringEars = false;
            gazer.npc.playAnimation(ZombieOneshotAnim.CoverEarsDone);
            enterWander(gazer);
          }
          return;
        }

        tickTimers(gazer, dt);
        applyAgitation(gazer);

        if (trySeePlayer(gazer)) return;
        if (trySmellCorpse(gazer)) return;

        const nearestSound = listenToSounds(gazer, gazer.server.sounds);
        if (nearestSound) {
          gazer.lastNoisePos = nearestSound.position;
          gazer.event(ZombieEvents.HearNoise);
          return;
        }

        decayAgitation(gazer, dt);

        if (gazer.agitation === 0) {
          gazer.event(ZombieEvents.IdleTimeout);
          return;
        }

        const arrived =
          gazer.targetPos != null &&
          getDistance2d(gazer.npc.state.position, gazer.targetPos) < 3;

        if (arrived || gazer.targetPos == null) {
          const pt = pickPatrolPoint(gazer.server, gazer.wanderOrigin);
          if (pt) {
            gazer.targetPos = pt;
            moveToward(gazer.npc, pt, gazer.server);
          }
        }
      },

      [ZombieTransitions.Idle]: (dt: number) => {
        tickTimers(gazer, dt);

        if (trySeePlayer(gazer)) return;

        const nearestSound = listenToSounds(gazer, gazer.server.sounds);
        if (nearestSound) {
          gazer.lastNoisePos = nearestSound.position;
          gazer.event(ZombieEvents.HearNoise);
          return;
        }

        trySmellCorpse(gazer);
      },

      [ZombieTransitions.Investigate]: (dt: number) => {
        tickTimers(gazer, dt);
        applyAgitation(gazer);

        if (trySeePlayer(gazer)) return;
        if (trySmellCorpse(gazer)) return;

        if (gazer.stateTimer >= INVESTIGATE_TIMEOUT) {
          gazer.event(ZombieEvents.NoiseTimeout);
          return;
        }

        if (
          gazer.lastNoisePos != null &&
          getDistance2d(gazer.npc.state.position, gazer.lastNoisePos) < 3
        ) {
          gazer.event(ZombieEvents.NoiseTimeout);
          return;
        }

        const nearestSound = listenToSounds(gazer, gazer.server.sounds);
        if (nearestSound) {
          gazer.lastNoisePos = nearestSound.position;
          gazer.stateTimer = 0;
          moveToward(gazer.npc, nearestSound.position, gazer.server);
        }
      },

      [ZombieTransitions.Chase]: (dt: number) => {
        tickTimers(gazer, dt);
        listenToSounds(gazer, gazer.server.sounds);
        applyAgitation(gazer);

        const chaseTarget = getChaseTarget(gazer);
        if (
          !chaseTarget ||
          !chaseTarget.isAlive ||
          chaseTarget.isVanished ||
          chaseTarget.isHidden
        ) {
          gazer.event(ZombieEvents.LostPlayer);
          return;
        }

        gazer.npc.lookAtTarget = chaseTarget.position;
        const chaseDist = getDistance2d(
          gazer.npc.state.position,
          chaseTarget.position
        );
        if (chaseDist > 50) {
          gazer.event(ZombieEvents.LostPlayer);
        } else if (chaseDist < 2) {
          gazer.event(ZombieEvents.ReachPlayer);
        } else {
          if (trySmellCorpse(gazer)) return;
          if (Math.random() < STUMBLE_CHANCE) {
            gazer.event(ZombieEvents.StartStumble);
            return;
          }
          moveToward(gazer.npc, chaseTarget.position, gazer.server);
        }
      },

      [ZombieTransitions.Stumble]: (dt: number) => {
        gazer.stateTimer += dt;
        if (gazer.stateTimer >= 5) {
          gazer.event(ZombieEvents.StumbleTimeout);
        }
      },

      [ZombieTransitions.Attack]: (dt: number) => {
        tickTimers(gazer, dt);
        listenToSounds(gazer, gazer.server.sounds);
        applyAgitation(gazer);

        const attackTarget = getChaseTarget(gazer);
        if (!attackTarget || !attackTarget.isAlive) {
          if (gazer.hunger >= 30) {
            gazer.event(ZombieEvents.PlayerKilled);
          } else {
            gazer.event(ZombieEvents.LostPlayer);
          }
          return;
        }
        if (attackTarget.isVanished || attackTarget.isHidden) {
          gazer.event(ZombieEvents.LostPlayer);
          return;
        }
        gazer.npc.lookAtTarget = attackTarget.position;
        moveToward(gazer.npc, attackTarget.position, gazer.server);
        const attackDist = getDistance(
          gazer.npc.state.position,
          attackTarget.position
        );
        if (attackDist >= 2) {
          gazer.event(ZombieEvents.PlayerBacked);
        } else if (gazer.lastAttackTime > 2) {
          gazer.event(ZombieEvents.StartAttacking);
        }
      },

      [ZombieTransitions.Attacking]: (dt: number) => {
        gazer.hunger = Math.min(100, gazer.hunger + dt * 2);
        gazer.stateTimer += dt * 2;
        gazer.lastAttackTime += dt;
        listenToSounds(gazer, gazer.server.sounds);

        const attackTarget = getChaseTarget(gazer);
        if (attackTarget) {
          gazer.npc.lookAt(attackTarget.position);
        }

        if (gazer.stateTimer >= 2) {
          if (attackTarget) {
            const attackDist = getDistance(
              gazer.npc.state.position,
              attackTarget.position
            );
            if (attackDist <= 2) {
              spawnGasCloud(gazer);
            }
          }
          gazer.event(ZombieEvents.DoneAttacking);
        }
      },

      [ZombieTransitions.Feed]: (dt: number) => {
        gazer.stateTimer += dt;
        gazer.lastAttackTime += dt;
        listenToSounds(gazer, gazer.server.sounds);
        applyAgitation(gazer);

        if (gazer.corpseTargetId) {
          const corpse = gazer.server._characters[gazer.corpseTargetId];
          if (!corpse || corpse.isAlive) {
            gazer.corpseTargetId = null;
            gazer.isEatingCorpse = false;
            gazer.event(ZombieEvents.DoneFeeding);
            return;
          }
          if (!gazer.isEatingCorpse) {
            const dist = getDistance2d(
              gazer.npc.state.position,
              corpse.state.position
            );
            if (dist > 2) {
              gazer.npc.lookAtTarget = corpse.state.position;
              moveToward(gazer.npc, corpse.state.position, gazer.server);
              return;
            }
            gazer.npc.lookAtTarget = null;
            gazer.npc.stopMovement();
          }
        }

        if (!gazer.isEatingCorpse) {
          // wait for the nav agent to fully decelerate before starting the anim
          const vel = gazer.npc.navAgent?.velocity();
          const speed = vel ? Math.sqrt(vel.x * vel.x + vel.z * vel.z) : 0;
          if (speed > 0.0) return;
          gazer.npc.setAnimation(ZombieLoopingAnim.Eating);
          gazer.isEatingCorpse = true;
          gazer.stateTimer = 0;
        }

        gazer.hunger = Math.max(0, gazer.hunger - dt * 15);
        if (gazer.hunger === 0) {
          gazer.npc.playAnimation(ZombieOneshotAnim.EatingDone);
          gazer.corpseTargetId = null;
          gazer.isEatingCorpse = false;
          gazer.event(ZombieEvents.DoneFeeding);
        }
      }
    },
    [
      {
        eventId: ZombieEvents.HearNoise,
        from: [ZombieTransitions.Wander, ZombieTransitions.Idle],
        to: ZombieTransitions.Investigate,
        EnterTransition: () => {
          gazer.stateTimer = 0;
          gazer.targetPos = gazer.lastNoisePos;
          if (gazer.targetPos)
            moveToward(gazer.npc, gazer.targetPos, gazer.server);
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
        EnterTransition: undefined
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
        EnterTransition: () => enterFeed(gazer)
      },
      {
        eventId: ZombieEvents.NoiseTimeout,
        from: [ZombieTransitions.Investigate],
        to: ZombieTransitions.Wander,
        EnterTransition: () => enterWander(gazer)
      },
      {
        eventId: ZombieEvents.ReachPlayer,
        from: [ZombieTransitions.Chase],
        to: ZombieTransitions.Attack,
        EnterTransition: () => {
          gazer.lastAttackTime = 2;
        }
      },
      {
        eventId: ZombieEvents.StartStumble,
        from: [ZombieTransitions.Chase],
        to: ZombieTransitions.Stumble,
        EnterTransition: () => {
          gazer.npc.stopMovement();
          gazer.stateTimer = 0;
          const anims = [
            ZombieOneshotAnim.StumbleA,
            ZombieOneshotAnim.StumbleB,
            ZombieOneshotAnim.StumbleC
          ];
          gazer.npc.playAnimation(
            anims[Math.floor(Math.random() * anims.length)]
          );
        }
      },
      {
        eventId: ZombieEvents.StumbleTimeout,
        from: [ZombieTransitions.Stumble],
        to: ZombieTransitions.Chase,
        EnterTransition: () => {
          gazer.stateTimer = 0;
          const chaseTarget = getChaseTarget(gazer);
          if (chaseTarget) {
            moveToward(gazer.npc, chaseTarget.position, gazer.server);
          }
        }
      },
      {
        eventId: ZombieEvents.StartAttacking,
        from: [ZombieTransitions.Attack],
        to: ZombieTransitions.Attacking,
        EnterTransition: () => {
          gazer.npc.playAnimation(ZombieOneshotAnim.Spit);
          gazer.stateTimer = 0;
          gazer.lastAttackTime = 0;
        }
      },
      {
        eventId: ZombieEvents.DoneAttacking,
        from: [ZombieTransitions.Attacking],
        to: ZombieTransitions.Attack,
        EnterTransition: () => {
          gazer.lastAttackTime = 2;
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
        EnterTransition: () => enterWander(gazer)
      },
      {
        eventId: ZombieEvents.PlayerBacked,
        from: [ZombieTransitions.Attack],
        to: ZombieTransitions.Chase,
        EnterTransition: undefined
      },
      {
        eventId: ZombieEvents.PlayerKilled,
        from: [ZombieTransitions.Attack],
        to: ZombieTransitions.Feed,
        EnterTransition: () => enterFeed(gazer)
      },
      {
        eventId: ZombieEvents.DoneFeeding,
        from: [ZombieTransitions.Feed],
        to: ZombieTransitions.Wander,
        EnterTransition: () => enterWander(gazer)
      },
      {
        eventId: ZombieEvents.IdleTimeout,
        from: [ZombieTransitions.Wander],
        to: ZombieTransitions.Idle,
        EnterTransition: () => {
          gazer.stateTimer = 0;
          gazer.npc.stopMovement();
          gazer.npc.setAnimation(ZombieLoopingAnim.Idle);
        }
      },
      {
        eventId: ZombieEvents.CoverEars,
        from: null,
        to: ZombieTransitions.Wander,
        EnterTransition: () => {
          gazer.npc.stopMovement();
          gazer.npc.playAnimation(ZombieOneshotAnim.CoverEars);
          gazer.isCoveringEars = true;
          gazer.coverEarsTimer = 0;
          gazer.targetCharacterId = null;
          gazer.npc.lookAtTarget = null;
          gazer.wanderOrigin = gazer.npc.state.position.slice() as Float32Array;
        }
      }
    ],
    ZombieTransitions.Wander
  ) as unknown as ZombieInstance;

  gazer.onTransition = (from: string, to: string, eventId: string) => {
    debug(`[${gazer.id}] ${from} → ${to} (${eventId})`);
  };
  gazer.id = npc.characterId;
  gazer.npc = npc;
  gazer.server = server;
  gazer.hunger = 0;
  gazer.agitation = AGITATION_INITIAL;
  gazer.wanderOrigin = npc.state.position.slice() as Float32Array;
  const initialPatrol = pickPatrolPoint(server, npc.state.position);
  gazer.targetPos = initialPatrol;
  if (initialPatrol) {
    moveToward(npc, initialPatrol, server);
  }
  gazer.lastNoisePos = null;
  gazer.targetCharacterId = null;
  gazer.corpseTargetId = null;
  gazer.isEatingCorpse = false;
  gazer.stateTimer = 0;
  gazer.lastAttackTime = 0;
  gazer.isCoveringEars = false;
  gazer.coverEarsTimer = 0;

  return gazer;
}
