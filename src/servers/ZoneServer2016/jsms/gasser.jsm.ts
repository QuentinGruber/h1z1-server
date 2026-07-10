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
import { Effects, NpcIds } from "../models/enums";
import { Factions, isHostile } from "./factions";
import {
  ZombieLoopingAnim,
  ZombieOneshotAnim,
  ZombieTransitions,
  ZombieEvents,
  type ZombieInstance
} from "./zombie.jsm";

const BASE_SPEED = 1.0;
const MAX_SPEED = 3.0;
const AGITATION_DECAY_RATE = 1;
const AGITATION_INITIAL = 50;
const INVESTIGATE_TIMEOUT = 120;
const STUMBLE_CHANCE = 0.001;
const OVERRIDE_ACTION_SOUND_PRIORITY = 10;
const GAS_CHARGE_RANGE = 10;
const GAS_CHARGE_PER_CLIENT = 0.2;
const GAS_CHARGE_PER_ZOMBIE = 0.1;
const MELEE_SLASH_RANGE = 2;
const GAS_SPIT_RANGE = 10;
const GAS_CLOUD_RANGE = 10;
const GAS_DAMAGE_PER_TICK = 500;
const GAS_DAMAGE_TICK_MS = 1000;
const GAS_DAMAGE_DURATION_MS = 10000;

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

function listenToSounds(gasser: ZombieInstance, sounds: Sound[]): Sound | null {
  let nearest: Sound | null = null;
  let nearestDist = Infinity;
  let bestPriority = Number.NEGATIVE_INFINITY;
  for (const sound of sounds) {
    const dist = getDistance2d(gasser.npc.state.position, sound.position);
    if (dist < sound.radius) {
      gasser.agitation = Math.min(100, gasser.agitation + sound.agitation);
      const priority = sound.priority ?? 0;
      if (
        priority > bestPriority ||
        (priority === bestPriority && dist < nearestDist)
      ) {
        nearest = sound;
        bestPriority = priority;
        nearestDist = dist;
      }
    }
  }
  return nearest;
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

function shouldOverrideAction(sound: Sound | null): boolean {
  if (!sound) return false;
  return (sound.priority ?? 0) >= OVERRIDE_ACTION_SOUND_PRIORITY;
}

function chargeGas(gasser: ZombieInstance): void {
  const origin = gasser.npc.state.position;
  let nearbyClients = 0;
  let nearbyZombies = 0;

  for (const client of Object.values(gasser.server._clients)) {
    const character = client.character;
    if (!character?.isAlive) continue;
    if (getDistance2d(origin, character.state.position) <= GAS_CHARGE_RANGE) {
      nearbyClients++;
    }
  }

  for (const npc of Object.values(gasser.server._npcs)) {
    if (!npc.isAlive || npc.characterId === gasser.npc.characterId) continue;
    if (npc.faction !== Factions.ZOMBIE) continue;
    if (getDistance2d(origin, npc.state.position) <= GAS_CHARGE_RANGE) {
      nearbyZombies++;
    }
  }

  const chargeGain =
    nearbyClients * GAS_CHARGE_PER_CLIENT +
    nearbyZombies * GAS_CHARGE_PER_ZOMBIE;
  gasser.ChargeGas = Math.min(100, gasser.ChargeGas + chargeGain);
}

function trySeePlayer(gasser: ZombieInstance): boolean {
  const sz = 50;
  const pos = gasser.npc.state.position;
  const cx = Math.floor(pos[0] / sz);
  const cz = Math.floor(pos[2] / sz);
  for (let dx = -1; dx <= 1; dx++) {
    for (let dz = -1; dz <= 1; dz++) {
      const bucket = gasser.server.aiTargetSpatialMap.get(
        `${cx + dx},${cz + dz}`
      );
      if (!bucket) continue;
      for (const entry of bucket) {
        if (entry.id === gasser.npc.characterId) continue;
        if (!isHostile(gasser.npc.faction, entry.faction)) continue;
        if (getDistance2d(pos, entry.position) < 10) {
          gasser.targetCharacterId = entry.id;
          gasser.event(ZombieEvents.SeePlayer);
          return true;
        }
      }
    }
  }
  return false;
}

function trySmellCorpse(gasser: ZombieInstance): boolean {
  if (gasser.hunger < 60) return false;
  for (const characterId in gasser.server._characters) {
    const character = gasser.server._characters[characterId];
    if (character.isAlive) continue;
    if (
      getDistance2d(gasser.npc.state.position, character.state.position) < 30
    ) {
      gasser.corpseTargetId = characterId;
      gasser.event(ZombieEvents.SmellCorpse);
      return true;
    }
  }
  return false;
}

function getChaseTarget(gasser: ZombieInstance): {
  position: Float32Array;
  isAlive: boolean;
  isVanished: boolean;
  isHidden: boolean;
} | null {
  if (!gasser.targetCharacterId) return null;
  const player = gasser.server._characters[gasser.targetCharacterId];
  if (player)
    return {
      position: player.state.position,
      isAlive: player.isAlive,
      isVanished: !!player.isVanished,
      isHidden: !!player.isHidden
    };
  const npc = gasser.server._npcs[gasser.targetCharacterId];
  if (npc)
    return {
      position: npc.state.position,
      isAlive: npc.isAlive,
      isVanished: false,
      isHidden: false
    };
  return null;
}

export function spawnGasCloudAt(
  server: ZoneServer2016,
  position: Float32Array,
  ownerCharacterId: string
): void {
  server.sendCompositeEffectToAllInRange(
    100,
    ownerCharacterId,
    position,
    Effects.PFX_Char_Zombie_Gasser_GasCloud
  );

  const ownerNpc = server._npcs[ownerCharacterId];
  if (ownerNpc?.npcId === NpcIds.GASSER) {
    for (const npc of Object.values(server._npcs)) {
      if (!npc.isAlive || npc.characterId === ownerCharacterId) continue;
      if (npc.faction !== Factions.ZOMBIE) continue;
      if (getDistance2d(position, npc.state.position) > GAS_CLOUD_RANGE)
        continue;
      if (npc.effectTags.includes(Effects.PFX_Char_Zombie_Gasser_Ambient))
        continue;
      if (
        Math.floor(Math.random() * 100) + 1 >
        server.worldObjectManager.chanceGasserPropagation
      )
        continue;

      npc.effectTags.push(Effects.PFX_Char_Zombie_Gasser_Ambient);
      server.sendDataToAllWithSpawnedEntity(
        server._npcs,
        npc.characterId,
        "Character.AddEffectTagCompositeEffect",
        {
          characterId: npc.characterId,
          unknownDword1: Effects.PFX_Char_Zombie_Gasser_Ambient,
          effectId: Effects.PFX_Char_Zombie_Gasser_Ambient,
          unknownGuid: ownerCharacterId,
          unknownDword2: 3
        }
      );
    }
  }

  const applyGasDamage = () => {
    for (const character of Object.values(server._characters)) {
      if (!character.isAlive) continue;
      if (server.checkRespirator(character)) continue;
      if (getDistance(character.state.position, position) > GAS_CLOUD_RANGE)
        continue;

      character.damage(server, {
        entity: ownerCharacterId || "Server.GasserGas",
        damage: GAS_DAMAGE_PER_TICK
      });

      server.sendDataToAllWithSpawnedEntity(
        server._characters,
        character.characterId,
        "Character.PlayAnimation",
        {
          characterId: character.characterId,
          animationName: "Action",
          animationType: "ActionType",
          unm4: 0,
          unknownDword1: 0,
          unknownByte1: 0,
          unknownDword2: 0,
          unknownByte1xda: 0,
          unknownDword3: 10
        }
      );
    }
  };

  applyGasDamage();
  const gasDamageInterval = setInterval(applyGasDamage, GAS_DAMAGE_TICK_MS);

  setTimeout(() => {
    clearInterval(gasDamageInterval);
  }, GAS_DAMAGE_DURATION_MS);
}

function spawnGasCloud(gasser: ZombieInstance): void {
  const targetCharacter =
    gasser.server._characters[gasser.targetCharacterId ?? ""];
  const targetNpc = gasser.server._npcs[gasser.targetCharacterId ?? ""];
  const targetPos =
    targetCharacter?.state.position ?? targetNpc?.state.position;
  if (!targetPos) return;

  spawnGasCloudAt(
    gasser.server,
    targetPos.slice() as Float32Array,
    gasser.npc.characterId
  );
}

function tickTimers(gasser: ZombieInstance, dt: number): void {
  gasser.hunger = Math.min(100, gasser.hunger + dt * 2);
  gasser.stateTimer += dt;
  gasser.lastAttackTime += dt;
}

function enterWander(gasser: ZombieInstance): void {
  gasser.stateTimer = 0;
  gasser.agitation = AGITATION_INITIAL;
  gasser.targetCharacterId = null;
  gasser.npc.lookAtTarget = null;
  gasser.wanderOrigin = gasser.npc.state.position.slice() as Float32Array;
  const pt = pickPatrolPoint(gasser.server, gasser.wanderOrigin);
  if (pt) {
    gasser.targetPos = pt;
    moveToward(gasser.npc, pt, gasser.server);
  }
}

function enterFeed(gasser: ZombieInstance): void {
  gasser.npc.stopMovement();
  gasser.stateTimer = 0;
  gasser.targetCharacterId = null;
  gasser.npc.lookAtTarget = null;
  gasser.isEatingCorpse = false;
}

function applyAgitation(gasser: ZombieInstance) {
  const speed =
    BASE_SPEED + (gasser.agitation / 100) * (MAX_SPEED - BASE_SPEED);
  gasser.npc.setSpeed(speed);
}

function decayAgitation(gasser: ZombieInstance, dt: number) {
  gasser.agitation = Math.max(0, gasser.agitation - AGITATION_DECAY_RATE * dt);
}

export function createGasser(npc: Npc, server: ZoneServer2016): ZombieInstance {
  const gasser = new JSM(
    {
      [ZombieTransitions.Wander]: (dt: number) => {
        if (gasser.isCoveringEars) {
          gasser.coverEarsTimer += dt;
          if (gasser.coverEarsTimer >= 3) {
            gasser.isCoveringEars = false;
            gasser.npc.playAnimation(ZombieOneshotAnim.CoverEarsDone);
            enterWander(gasser);
          }
          return;
        }

        tickTimers(gasser, dt);
        applyAgitation(gasser);

        if (trySeePlayer(gasser)) return;
        if (trySmellCorpse(gasser)) return;

        const nearestSound = listenToSounds(gasser, gasser.server.sounds);
        if (nearestSound) {
          gasser.lastNoisePos = nearestSound.position;
          gasser.event(ZombieEvents.HearNoise);
          return;
        }

        decayAgitation(gasser, dt);

        if (gasser.agitation === 0) {
          gasser.event(ZombieEvents.IdleTimeout);
          return;
        }

        const arrived =
          gasser.targetPos != null &&
          getDistance2d(gasser.npc.state.position, gasser.targetPos) < 3;

        if (arrived || gasser.targetPos == null) {
          const pt = pickPatrolPoint(gasser.server, gasser.wanderOrigin);
          if (pt) {
            gasser.targetPos = pt;
            moveToward(gasser.npc, pt, gasser.server);
          }
        }
      },

      [ZombieTransitions.Idle]: (dt: number) => {
        tickTimers(gasser, dt);

        if (trySeePlayer(gasser)) return;

        const nearestSound = listenToSounds(gasser, gasser.server.sounds);
        if (nearestSound) {
          gasser.lastNoisePos = nearestSound.position;
          gasser.event(ZombieEvents.HearNoise);
          return;
        }

        trySmellCorpse(gasser);
      },
      [ZombieTransitions.Investigate]: (dt: number) => {
        tickTimers(gasser, dt);
        applyAgitation(gasser);

        if (trySeePlayer(gasser)) return;
        if (trySmellCorpse(gasser)) return;

        if (gasser.stateTimer >= INVESTIGATE_TIMEOUT) {
          gasser.event(ZombieEvents.NoiseTimeout);
          return;
        }

        if (
          gasser.lastNoisePos != null &&
          getDistance2d(gasser.npc.state.position, gasser.lastNoisePos) < 3
        ) {
          gasser.event(ZombieEvents.NoiseTimeout);
          return;
        }

        const nearestSound = listenToSounds(gasser, gasser.server.sounds);
        if (nearestSound) {
          gasser.lastNoisePos = nearestSound.position;
          if (shouldOverrideAction(nearestSound)) {
            gasser.event(ZombieEvents.HearNoise);
            return;
          }
          gasser.stateTimer = 0;
          moveToward(gasser.npc, nearestSound.position, gasser.server);
        }
      },

      [ZombieTransitions.Chase]: (dt: number) => {
        tickTimers(gasser, dt);
        const nearestSound = listenToSounds(gasser, gasser.server.sounds);
        if (nearestSound && shouldOverrideAction(nearestSound)) {
          gasser.lastNoisePos = nearestSound.position;
          gasser.event(ZombieEvents.HearNoise);
          return;
        }
        applyAgitation(gasser);

        const chaseTarget = getChaseTarget(gasser);
        if (
          !chaseTarget ||
          !chaseTarget.isAlive ||
          chaseTarget.isVanished ||
          chaseTarget.isHidden
        ) {
          gasser.event(ZombieEvents.LostPlayer);
          return;
        }

        chargeGas(gasser);

        gasser.npc.lookAtTarget = chaseTarget.position;
        const chaseDist = getDistance2d(
          gasser.npc.state.position,
          chaseTarget.position
        );
        if (chaseDist > 50) {
          gasser.event(ZombieEvents.LostPlayer);
        } else if (chaseDist <= GAS_SPIT_RANGE) {
          gasser.event(ZombieEvents.ReachPlayer);
        } else {
          if (trySmellCorpse(gasser)) return;
          if (Math.random() < STUMBLE_CHANCE) {
            gasser.event(ZombieEvents.StartStumble);
            return;
          }
          moveToward(gasser.npc, chaseTarget.position, gasser.server);
        }
      },

      [ZombieTransitions.Stumble]: (dt: number) => {
        const nearestSound = listenToSounds(gasser, gasser.server.sounds);
        if (nearestSound && shouldOverrideAction(nearestSound)) {
          gasser.lastNoisePos = nearestSound.position;
          gasser.event(ZombieEvents.HearNoise);
          return;
        }
        gasser.stateTimer += dt;
        if (gasser.stateTimer >= 5) {
          gasser.event(ZombieEvents.StumbleTimeout);
        }
      },

      [ZombieTransitions.Attack]: (dt: number) => {
        tickTimers(gasser, dt);
        const nearestSound = listenToSounds(gasser, gasser.server.sounds);
        if (nearestSound && shouldOverrideAction(nearestSound)) {
          gasser.lastNoisePos = nearestSound.position;
          gasser.event(ZombieEvents.HearNoise);
          return;
        }
        applyAgitation(gasser);

        const attackTarget = getChaseTarget(gasser);
        if (!attackTarget || !attackTarget.isAlive) {
          if (gasser.hunger >= 30) {
            gasser.event(ZombieEvents.PlayerKilled);
          } else {
            gasser.event(ZombieEvents.LostPlayer);
          }
          return;
        }
        if (attackTarget.isVanished || attackTarget.isHidden) {
          gasser.event(ZombieEvents.LostPlayer);
          return;
        }

        chargeGas(gasser);

        gasser.npc.lookAtTarget = attackTarget.position;
        moveToward(gasser.npc, attackTarget.position, gasser.server);
        const attackDist = getDistance(
          gasser.npc.state.position,
          attackTarget.position
        );
        if (attackDist > GAS_SPIT_RANGE) {
          gasser.event(ZombieEvents.PlayerBacked);
        } else if (gasser.lastAttackTime > 2) {
          if (
            attackDist <= MELEE_SLASH_RANGE &&
            gasser.ChargeGas >= 100 &&
            Math.random() < 0.1
          ) {
            gasser.event(ZombieEvents.ReleaseGas);
          } else if (attackDist <= MELEE_SLASH_RANGE) {
            gasser.event(ZombieEvents.StartAttacking);
          }
        }
      },

      [ZombieTransitions.Attacking]: (dt: number) => {
        gasser.hunger = Math.min(100, gasser.hunger + dt * 2);
        gasser.stateTimer += dt * 2;
        gasser.lastAttackTime += dt;
        chargeGas(gasser);
        const nearestSound = listenToSounds(gasser, gasser.server.sounds);
        if (nearestSound && shouldOverrideAction(nearestSound)) {
          gasser.lastNoisePos = nearestSound.position;
          gasser.event(ZombieEvents.HearNoise);
          return;
        }

        const attackTarget = getChaseTarget(gasser);
        if (attackTarget) {
          gasser.npc.lookAt(attackTarget.position);
        }

        if (gasser.stateTimer >= 2) {
          if (attackTarget) {
            if (
              getDistance(gasser.npc.state.position, attackTarget.position) <=
              MELEE_SLASH_RANGE
            ) {
              applyDamageToTarget(gasser);
            }
          }
          gasser.event(ZombieEvents.DoneAttacking);
        }
      },

      [ZombieTransitions.Feed]: (dt: number) => {
        gasser.stateTimer += dt;
        gasser.lastAttackTime += dt;
        const nearestSound = listenToSounds(gasser, gasser.server.sounds);
        if (nearestSound && shouldOverrideAction(nearestSound)) {
          gasser.lastNoisePos = nearestSound.position;
          gasser.event(ZombieEvents.HearNoise);
          return;
        }
        applyAgitation(gasser);

        if (gasser.corpseTargetId) {
          const corpse = gasser.server._characters[gasser.corpseTargetId];
          if (!corpse || corpse.isAlive) {
            gasser.corpseTargetId = null;
            gasser.isEatingCorpse = false;
            gasser.event(ZombieEvents.DoneFeeding);
            return;
          }
          if (!gasser.isEatingCorpse) {
            const dist = getDistance2d(
              gasser.npc.state.position,
              corpse.state.position
            );
            if (dist > 2) {
              gasser.npc.lookAtTarget = corpse.state.position;
              moveToward(gasser.npc, corpse.state.position, gasser.server);
              return;
            }
            gasser.npc.lookAtTarget = null;
            gasser.npc.stopMovement();
          }
        }

        if (!gasser.isEatingCorpse) {
          // wait for the nav agent to fully decelerate before starting the anim
          const vel = gasser.npc.navAgent?.velocity();
          const speed = vel ? Math.sqrt(vel.x * vel.x + vel.z * vel.z) : 0;
          if (speed > 0.0) return;
          gasser.npc.setAnimation(ZombieLoopingAnim.Eating);
          gasser.isEatingCorpse = true;
          gasser.stateTimer = 0;
        }

        gasser.hunger = Math.max(0, gasser.hunger - dt * 15);
        if (gasser.hunger === 0) {
          gasser.npc.playAnimation(ZombieOneshotAnim.EatingDone);
          gasser.corpseTargetId = null;
          gasser.isEatingCorpse = false;
          gasser.event(ZombieEvents.DoneFeeding);
        }
      }
    },
    [
      {
        eventId: ZombieEvents.HearNoise,
        from: [
          ZombieTransitions.Wander,
          ZombieTransitions.Idle,
          ZombieTransitions.Investigate,
          ZombieTransitions.Chase,
          ZombieTransitions.Stumble,
          ZombieTransitions.Attack,
          ZombieTransitions.Attacking,
          ZombieTransitions.Feed
        ],
        to: ZombieTransitions.Investigate,
        EnterTransition: () => {
          gasser.stateTimer = 0;
          gasser.targetCharacterId = null;
          gasser.corpseTargetId = null;
          gasser.isEatingCorpse = false;
          gasser.npc.lookAtTarget = null;
          gasser.targetPos = gasser.lastNoisePos;
          if (gasser.targetPos)
            moveToward(gasser.npc, gasser.targetPos, gasser.server);
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
        EnterTransition: () => enterFeed(gasser)
      },
      {
        eventId: ZombieEvents.NoiseTimeout,
        from: [ZombieTransitions.Investigate],
        to: ZombieTransitions.Wander,
        EnterTransition: () => enterWander(gasser)
      },
      {
        eventId: ZombieEvents.ReachPlayer,
        from: [ZombieTransitions.Chase],
        to: ZombieTransitions.Attack,
        EnterTransition: () => {
          gasser.lastAttackTime = 2;
        }
      },
      {
        eventId: ZombieEvents.StartStumble,
        from: [ZombieTransitions.Chase],
        to: ZombieTransitions.Stumble,
        EnterTransition: () => {
          gasser.npc.stopMovement();
          gasser.stateTimer = 0;
          const anims = [
            ZombieOneshotAnim.StumbleA,
            ZombieOneshotAnim.StumbleB,
            ZombieOneshotAnim.StumbleC
          ];
          gasser.npc.playAnimation(
            anims[Math.floor(Math.random() * anims.length)]
          );
        }
      },
      {
        eventId: ZombieEvents.StumbleTimeout,
        from: [ZombieTransitions.Stumble],
        to: ZombieTransitions.Chase,
        EnterTransition: () => {
          gasser.stateTimer = 0;
          const chaseTarget = getChaseTarget(gasser);
          if (chaseTarget) {
            moveToward(gasser.npc, chaseTarget.position, gasser.server);
          }
        }
      },
      {
        eventId: ZombieEvents.StartAttacking,
        from: [ZombieTransitions.Attack],
        to: ZombieTransitions.Attacking,
        EnterTransition: () => {
          gasser.npc.playAnimation(ZombieOneshotAnim.KnifeSlash);
          gasser.stateTimer = 0;
          gasser.lastAttackTime = 0;
        }
      },
      {
        eventId: ZombieEvents.Spit,
        from: [ZombieTransitions.Attack],
        to: ZombieTransitions.Attacking,
        EnterTransition: () => {
          gasser.npc.playAnimation(ZombieOneshotAnim.Spit);
          gasser.stateTimer = 0;
          gasser.lastAttackTime = 0;
        }
      },
      {
        eventId: ZombieEvents.ReleaseGas,
        from: [ZombieTransitions.Attack],
        to: ZombieTransitions.Attacking,
        EnterTransition: () => {
          gasser.npc.stopMovement();
          gasser.npc.lookAtTarget = null;
          gasser.npc.playAnimation(ZombieOneshotAnim.GasConvulse);
          spawnGasCloud(gasser);
          setTimeout(() => {
            gasser.npc.playAnimation(ZombieOneshotAnim.Stagger_Light); // after gas release, play stagger animation to fix animation beeing stuck in gas convulse animation
          }, 5000);
          gasser.ChargeGas = 0;
          gasser.stateTimer = 0;
          gasser.lastAttackTime = 2;
        }
      },
      {
        eventId: ZombieEvents.DoneAttacking,
        from: [ZombieTransitions.Attacking],
        to: ZombieTransitions.Attack,
        EnterTransition: () => {
          gasser.lastAttackTime = 2;
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
        EnterTransition: () => enterWander(gasser)
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
        EnterTransition: () => enterFeed(gasser)
      },
      {
        eventId: ZombieEvents.DoneFeeding,
        from: [ZombieTransitions.Feed],
        to: ZombieTransitions.Wander,
        EnterTransition: () => enterWander(gasser)
      },
      {
        eventId: ZombieEvents.IdleTimeout,
        from: [ZombieTransitions.Wander],
        to: ZombieTransitions.Idle,
        EnterTransition: () => {
          gasser.stateTimer = 0;
          gasser.npc.stopMovement();
          gasser.npc.setAnimation(ZombieLoopingAnim.Idle);
        }
      },
      {
        eventId: ZombieEvents.CoverEars,
        from: null,
        to: ZombieTransitions.Wander,
        EnterTransition: () => {
          gasser.npc.stopMovement();
          gasser.npc.playAnimation(ZombieOneshotAnim.CoverEars);
          gasser.isCoveringEars = true;
          gasser.coverEarsTimer = 0;
          gasser.targetCharacterId = null;
          gasser.npc.lookAtTarget = null;
          gasser.wanderOrigin =
            gasser.npc.state.position.slice() as Float32Array;
        }
      }
    ],
    ZombieTransitions.Wander
  ) as unknown as ZombieInstance;

  gasser.onTransition = (from: string, to: string, eventId: string) => {
    debug(`[${gasser.id}] ${from} → ${to} (${eventId})`);
    debug(`  Position: ${gasser.npc.state.position.join(", ")}`);
    debug(`  Agitation: ${gasser.agitation}`);
    debug(`  Hunger: ${gasser.hunger}`);
    debug(`  ChargeGas: ${gasser.ChargeGas}`);
  };
  gasser.id = npc.characterId;
  gasser.npc = npc;
  gasser.server = server;
  gasser.hunger = 0;
  gasser.agitation = AGITATION_INITIAL;
  gasser.wanderOrigin = npc.state.position.slice() as Float32Array;
  const initialPatrol = pickPatrolPoint(server, npc.state.position);
  gasser.targetPos = initialPatrol;
  if (initialPatrol) {
    moveToward(npc, initialPatrol, server);
  }
  gasser.lastNoisePos = null;
  gasser.targetCharacterId = null;
  gasser.corpseTargetId = null;
  gasser.isEatingCorpse = false;
  gasser.stateTimer = 0;
  gasser.lastAttackTime = 0;
  gasser.isCoveringEars = false;
  gasser.coverEarsTimer = 0;
  gasser.ChargeGas = 100;

  return gasser;
}
