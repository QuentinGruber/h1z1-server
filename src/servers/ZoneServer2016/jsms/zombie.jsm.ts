import StateMachine from "javascript-state-machine";
import type { Npc } from "../entities/npc";
import type { ZoneServer2016 } from "../zoneserver";
import { NavManager } from "../../../utils/recast";
import { getDistance2d } from "../../../utils/utils";

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
  | "spotPlayer"
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
  spotPlayer(): void;
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

function stopMovement(npc: Npc): void {
  if (!npc.navAgent) return;
  npc.navAgent.requestMoveTarget(NavManager.gameToNav(npc.state.position));
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
        stateTimer: 0,
        patrolTimer: 0,
        lastAttackTime: 0,
        investigateTimeout: 8
      };
    },

    transitions: [
      { name: "hearNoise", from: "wander", to: "investigate" },
      { name: "seePlayer", from: ["wander", "investigate"], to: "chase" },
      { name: "smellCorpse", from: "wander", to: "feed" },
      { name: "noiseTimeout", from: "investigate", to: "wander" },
      { name: "reachPlayer", from: "chase", to: "attack" },
      { name: "lostPlayer", from: "chase", to: "wander" },
      { name: "playerBacked", from: "attack", to: "chase" },
      { name: "playerKilled", from: "attack", to: "feed" },
      { name: "doneFeeding",  from: "feed",   to: "wander" },
      { name: "idleTimeout", from: "wander", to: "idle"   },
      { name: "spotPlayer",  from: "idle",   to: "attack" },
      { name: "destroyed",   from: "*",      to: "dead"   }
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
        this.npc.playAnimation("walk");
      },

      onInvestigate(this: ZombieInstance): void {
        this.stateTimer = 0;
        this.targetPos = this.lastNoisePos;
        if (this.targetPos) moveToward(this.npc, this.targetPos, this.server);
      },

      onChase(this: ZombieInstance): void {},

      onAttack(this: ZombieInstance): void {
        stopMovement(this.npc);
        this.lastAttackTime = 2;
        playAnim(this.npc, "bite");
      },

      onIdle(this: ZombieInstance): void {
        this.stateTimer = 0;
        stopMovement(this.npc);
      },

      onFeed(this: ZombieInstance): void {
        stopMovement(this.npc);
        this.stateTimer = 0;
        this.targetCharacterId = null;
        playAnim(this.npc, "eat");
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
        console.log(
          `[${this.id}] ${lifecycle.from} → ${lifecycle.to} (${lifecycle.transition})`
        );
      }
    }
  }) as unknown as ZombieInstance;
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
      zombie.patrolTimer += dt;
      const arrived =
        zombie.targetPos != null &&
        getDistance2d(zombie.npc.state.position, zombie.targetPos) < 3;

      if (zombie.patrolTimer >= 30) {
        zombie.idleTimeout();
      } else if (arrived || zombie.targetPos == null) {
        zombie.patrolTimer = 0;
        const pt = pickPatrolPoint(zombie.npc, zombie.server, zombie.wanderOrigin);
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
        if (getDistance2d(zombie.npc.state.position, character.state.position) < 1) {
          zombie.targetCharacterId = characterId;
          zombie.spotPlayer();
          break;
        }
      }
      break;
    }

    case "investigate":
      break;

    case "chase":
      break;

    case "attack": {
      if (zombie.targetCharacterId && zombie.lastAttackTime > 2) {
        const target = zone._characters[zombie.targetCharacterId];
        if (
          target &&
          target.isAlive &&
          getDistance2d(zombie.npc.state.position, target.state.position) < 1
        ) {
          dealDamage(zombie.npc, zombie.targetCharacterId);
          zombie.lastAttackTime = 0;
        }
      }
      break;
    }

    case "feed":
      zombie.hunger = Math.max(0, zombie.hunger - dt * 15);
      if (zombie.hunger === 0) {
        zombie.doneFeeding();
      }
      break;
  }
}
