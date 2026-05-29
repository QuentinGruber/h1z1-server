import StateMachine from "javascript-state-machine";
import type { Npc } from "../entities/npc";
import type { ZoneServer2016 } from "../zoneserver";
import type { Sound } from "../../../types/zoneserver";
import { NavManager } from "../../../utils/recast";
const debug = require("debug")("ai");
import { getDistance2d, getDistance } from "../../../utils/utils";

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

export type ZombieState =
  | "idle"
  | "wander"
  | "investigate"
  | "chase"
  | "attack"
  | "feed"
  | "dead";

export type ZombieTransition =
  | "hearNoise"
  | "seePlayer"
  | "smellCorpse"
  | "noiseTimeout"
  | "reachPlayer"
  | "lostPlayer"
  | "playerBacked"
  | "playerKilled"
  | "doneFeeding"
  | "idleTimeout"
  | "destroyed";

export interface ZombieInstance extends StateMachine {
  id: string;
  state: ZombieState;
  hunger: number;
  targetPos: Float32Array | null;
  lastNoisePos: Float32Array | null;
  stateTimer: number;
  patrolTimer: number;
  investigateTimeout: number;
  targetCharacterId: string | null;
  corpseTargetId: string | null;
  isEatingCorpse: boolean;
  lastAttackTime: number;
  wanderOrigin: Float32Array;
  npc: Npc;
  server: ZoneServer2016;
  hearNoise(): void;
  seePlayer(): void;
  smellCorpse(): void;
  noiseTimeout(): void;
  reachPlayer(): void;
  lostPlayer(): void;
  playerBacked(): void;
  playerKilled(): void;
  doneFeeding(): void;
  idleTimeout(): void;
  destroyed(): void;
  goto(state: ZombieState): void;
}

function pickPatrolPoint(
  npc: Npc,
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
  const navTarget = server.navManager.getClosestNavPoint(target);
  npc.navAgent.requestMoveTarget(navTarget);
}

function dealDamage(npc: Npc, targetCharacterId: string): void {
  npc.applyDamage(targetCharacterId);
}

function playAnim(npc: Npc, anim: string): void {
  npc.playAnimation(anim);
}

function setAnim(npc: Npc, anim: string): void {
  npc.setAnimation(anim);
}

function findNearestSound(npc: Npc, sounds: Sound[]): Sound | null {
  let nearest: Sound | null = null;
  let nearestDist = Infinity;
  for (const sound of sounds) {
    const dist = getDistance2d(npc.state.position, sound.position);
    if (dist < sound.radius && dist < nearestDist) {
      nearest = sound;
      nearestDist = dist;
    }
  }
  return nearest;
}

export function createZombie(npc: Npc, server: ZoneServer2016): ZombieInstance {
  return new StateMachine({
    init: "wander",

    data() {
      return {
        id: npc.characterId,
        npc,
        server,
        hunger: 0,
        wanderOrigin: npc.state.position.slice() as Float32Array,
        targetPos: pickPatrolPoint(npc, server, npc.state.position) as unknown,
        lastNoisePos: null,
        targetCharacterId: null,
        corpseTargetId: null,
        isEatingCorpse: false,
        stateTimer: 0,
        patrolTimer: 0,
        lastAttackTime: 0,
        investigateTimeout: 120
      };
    },

    transitions: [
      { name: "hearNoise", from: ["wander", "idle"], to: "investigate" },
      {
        name: "seePlayer",
        from: ["wander", "investigate", "idle"],
        to: "chase"
      },
      {
        name: "smellCorpse",
        from: ["wander", "idle", "investigate", "chase"],
        to: "feed"
      },
      { name: "noiseTimeout", from: "investigate", to: "wander" },
      { name: "reachPlayer", from: "chase", to: "attack" },
      { name: "lostPlayer", from: "chase", to: "wander" },
      { name: "playerBacked", from: "attack", to: "chase" },
      { name: "playerKilled", from: "attack", to: "feed" },
      { name: "doneFeeding", from: "feed", to: "wander" },
      { name: "idleTimeout", from: "wander", to: "idle" },
      { name: "destroyed", from: "*", to: "dead" }
    ],

    methods: {
      onWander(this: ZombieInstance): void {
        this.stateTimer = 0;
        this.patrolTimer = 0;
        this.targetCharacterId = null;
        this.wanderOrigin = this.npc.state.position.slice() as Float32Array;
        const pt = pickPatrolPoint(this.npc, this.server, this.wanderOrigin);
        if (pt) {
          this.targetPos = pt;
          moveToward(this.npc, pt, this.server);
        }
      },

      onInvestigate(this: ZombieInstance): void {
        this.stateTimer = 0;
        this.targetPos = this.lastNoisePos;
        if (this.targetPos) moveToward(this.npc, this.targetPos, this.server);
      },

      onChase(this: ZombieInstance): void {},

      onAttack(this: ZombieInstance): void {
        this.lastAttackTime = 2;
      },

      onIdle(this: ZombieInstance): void {
        this.stateTimer = 0;
        this.npc.stopMovement();
        setAnim(this.npc, ZombieLoopingAnim.Idle);
      },

      onFeed(this: ZombieInstance): void {
        this.npc.stopMovement();
        this.stateTimer = 0;
        this.targetCharacterId = null;
        this.isEatingCorpse = false;
        // eating animation is delayed until the nav agent fully decelerates
      },

      onDead(this: ZombieInstance): void {},

      // guards
      onBeforeSmellCorpse(this: ZombieInstance): boolean {
        return this.hunger >= 60;
      },

      onBeforePlayerKilled(this: ZombieInstance): boolean {
        return this.hunger >= 30;
      },

      onBeforeDestroyed(this: ZombieInstance): boolean {
        return this.state !== "dead";
      },

      onTransition(
        this: ZombieInstance,
        lifecycle: { from: string; to: string; transition: string }
      ): void {
        debug(
          `[${this.id}] ${lifecycle.from} → ${lifecycle.to} (${lifecycle.transition})`
        );
      }
    }
  }) as unknown as ZombieInstance;
}

function trySmellCorpse(zone: ZoneServer2016, zombie: ZombieInstance): boolean {
  if (zombie.hunger < 60) return false;
  for (const characterId in zone._characters) {
    const character = zone._characters[characterId];
    if (character.isAlive) continue;
    if (
      getDistance2d(zombie.npc.state.position, character.state.position) < 30
    ) {
      zombie.corpseTargetId = characterId;
      zombie.smellCorpse();
      return true;
    }
  }
  return false;
}

export function tickZombie(
  zone: ZoneServer2016,
  zombie: ZombieInstance,
  dt: number
): void {
  if (zombie.state === "dead") return;

  zombie.hunger = Math.min(100, zombie.hunger + dt * 2);
  zombie.stateTimer += dt;
  zombie.lastAttackTime += dt;

  switch (zombie.state) {
    case "wander": {
      for (const characterId in zone._characters) {
        const character = zone._characters[characterId];
        if (!character.isAlive) continue;
        if (
          getDistance2d(zombie.npc.state.position, character.state.position) <
          10
        ) {
          zombie.targetCharacterId = characterId;
          zombie.seePlayer();
          break;
        }
      }

      if (zombie.state === "wander") {
        const nearestSound = findNearestSound(zombie.npc, zone.sounds);
        if (nearestSound) {
          zombie.lastNoisePos = nearestSound.position;
          zombie.hearNoise();
          break;
        }
      }

      if (zombie.state === "wander") {
        if (trySmellCorpse(zone, zombie)) break;
      }

      zombie.patrolTimer += dt;
      const arrived =
        zombie.targetPos != null &&
        getDistance2d(zombie.npc.state.position, zombie.targetPos) < 3;

      if (zombie.patrolTimer >= 60) {
        zombie.idleTimeout();
      } else if (arrived || zombie.targetPos == null) {
        zombie.patrolTimer = 0;
        const pt = pickPatrolPoint(
          zombie.npc,
          zombie.server,
          zombie.wanderOrigin
        );
        if (pt) {
          zombie.targetPos = pt;
          moveToward(zombie.npc, pt, zombie.server);
        }
      }
      break;
    }

    case "idle": {
      for (const characterId in zone._characters) {
        const character = zone._characters[characterId];
        if (!character.isAlive) continue;
        if (
          getDistance2d(zombie.npc.state.position, character.state.position) <
          10
        ) {
          zombie.targetCharacterId = characterId;
          zombie.seePlayer();
          break;
        }
      }
      if (zombie.state === "idle") {
        const nearestSound = findNearestSound(zombie.npc, zone.sounds);
        if (nearestSound) {
          zombie.lastNoisePos = nearestSound.position;
          zombie.hearNoise();
        }
      }
      if (zombie.state === "idle") trySmellCorpse(zone, zombie);
      break;
    }

    case "investigate": {
      for (const characterId in zone._characters) {
        const character = zone._characters[characterId];
        if (!character.isAlive) continue;
        if (
          getDistance2d(zombie.npc.state.position, character.state.position) <
          10
        ) {
          zombie.targetCharacterId = characterId;
          zombie.seePlayer();
          break;
        }
      }
      if (zombie.state !== "investigate") break;

      if (zombie.stateTimer >= zombie.investigateTimeout) {
        zombie.noiseTimeout();
        break;
      }
      const nearestSound = findNearestSound(zombie.npc, zone.sounds);
      if (nearestSound) {
        zombie.lastNoisePos = nearestSound.position;
        zombie.stateTimer = 0;
        moveToward(zombie.npc, nearestSound.position, zombie.server);
      }
      if (zombie.state === "investigate") trySmellCorpse(zone, zombie);
      break;
    }

    case "chase": {
      const chaseTarget = zombie.targetCharacterId
        ? zone._characters[zombie.targetCharacterId]
        : null;
      if (!chaseTarget || !chaseTarget.isAlive) {
        zombie.lostPlayer();
        break;
      }
      const chaseDist = getDistance2d(
        zombie.npc.state.position,
        chaseTarget.state.position
      );
      if (chaseDist > 50) {
        zombie.lostPlayer();
      } else if (chaseDist < 2) {
        zombie.reachPlayer();
      } else {
        if (trySmellCorpse(zone, zombie)) break;
        moveToward(zombie.npc, chaseTarget.state.position, zombie.server);
      }
      break;
    }

    case "attack": {
      const attackTarget = zombie.targetCharacterId
        ? zone._characters[zombie.targetCharacterId]
        : null;
      if (!attackTarget || !attackTarget.isAlive) {
        zombie.playerKilled();
        if (zombie.state === "attack") zombie.goto("wander");
        break;
      }
      moveToward(zombie.npc, attackTarget.state.position, zombie.server);
      const attackDist = getDistance(
        zombie.npc.state.position,
        attackTarget.state.position
      );
      if (attackDist >= 2) {
        zombie.playerBacked();
      } else if (zombie.lastAttackTime > 2) {
        playAnim(zombie.npc, ZombieOneshotAnim.KnifeSlash);
        dealDamage(zombie.npc, zombie.targetCharacterId!);
        zombie.lastAttackTime = 0;
      }
      break;
    }

    case "feed": {
      if (zombie.corpseTargetId) {
        const corpse = zone._characters[zombie.corpseTargetId];
        if (!corpse || corpse.isAlive) {
          zombie.corpseTargetId = null;
          zombie.isEatingCorpse = false;
          zombie.doneFeeding();
          break;
        }
        if (!zombie.isEatingCorpse) {
          const dist = getDistance2d(
            zombie.npc.state.position,
            corpse.state.position
          );
          if (dist > 2) {
            moveToward(zombie.npc, corpse.state.position, zombie.server);
            break;
          }
          zombie.npc.stopMovement();
        }
      }

      if (!zombie.isEatingCorpse) {
        // wait for the nav agent to fully decelerate before starting the anim
        const vel = zombie.npc.navAgent?.velocity();
        const speed = vel ? Math.sqrt(vel.x * vel.x + vel.z * vel.z) : 0;
        if (speed >= 0.5) break;
        setAnim(zombie.npc, ZombieLoopingAnim.Eating);
        zombie.isEatingCorpse = true;
        zombie.stateTimer = 0;
      }

      // periodically re-send the eating anim in case the client resets it
      if (zombie.stateTimer >= 2) {
        zombie.stateTimer = 0;
        setAnim(zombie.npc, ZombieLoopingAnim.Eating);
      }

      zombie.hunger = Math.max(0, zombie.hunger - dt * 15);
      if (zombie.hunger === 0) {
        zombie.npc.playAnimation(ZombieOneshotAnim.EatingDone);
        zombie.corpseTargetId = null;
        zombie.isEatingCorpse = false;
        zombie.doneFeeding();
      }
      break;
    }
  }
}
