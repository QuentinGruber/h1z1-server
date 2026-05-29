import StateMachine from "javascript-state-machine";
import type { Npc } from "../entities/npc";
import type { ZoneServer2016 } from "../zoneserver";
import { NavManager } from "../../../utils/recast";
const debug = require("debug")("ai");
import { getDistance2d } from "../../../utils/utils";

export type ScreamingZombieState = "wander" | "dead";

export type ScreamingZombieTransition = "destroyed";

export interface ScreamingZombieInstance extends StateMachine {
  id: string;
  state: ScreamingZombieState;
  targetPos: Float32Array | null;
  patrolTimer: number;
  wanderOrigin: Float32Array;
  npc: Npc;
  server: ZoneServer2016;
  destroyed(): void;
  goto(state: ScreamingZombieState): void;
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

export function createScreamingZombie(
  npc: Npc,
  server: ZoneServer2016
): ScreamingZombieInstance {
  return new StateMachine({
    init: "wander",

    data() {
      return {
        id: npc.characterId,
        npc,
        server,
        wanderOrigin: npc.state.position.slice() as Float32Array,
        targetPos: pickPatrolPoint(npc, server, npc.state.position) as unknown,
        patrolTimer: 0
      };
    },

    transitions: [{ name: "destroyed", from: "*", to: "dead" }],

    methods: {
      onWander(this: ScreamingZombieInstance): void {
        this.patrolTimer = 0;
        this.wanderOrigin = this.npc.state.position.slice() as Float32Array;
        const pt = pickPatrolPoint(this.npc, this.server, this.wanderOrigin);
        if (pt) {
          this.targetPos = pt;
          moveToward(this.npc, pt, this.server);
        }
      },

      onDead(this: ScreamingZombieInstance): void {},

      onBeforeDestroyed(this: ScreamingZombieInstance): boolean {
        return this.state !== "dead";
      },

      onTransition(
        this: ScreamingZombieInstance,
        lifecycle: { from: string; to: string; transition: string }
      ): void {
        debug(
          `[${this.id}] ${lifecycle.from} → ${lifecycle.to} (${lifecycle.transition})`
        );
      }
    }
  }) as unknown as ScreamingZombieInstance;
}

export function tickScreamingZombie(
  zone: ZoneServer2016,
  zombie: ScreamingZombieInstance,
  dt: number
): void {
  if (zombie.state === "dead") return;

  zombie.patrolTimer += dt;
  const arrived =
    zombie.targetPos != null &&
    getDistance2d(zombie.npc.state.position, zombie.targetPos) < 3;

  if (arrived || zombie.targetPos == null) {
    zombie.patrolTimer = 0;
    const pt = pickPatrolPoint(zombie.npc, zombie.server, zombie.wanderOrigin);
    if (pt) {
      zombie.targetPos = pt;
      moveToward(zombie.npc, pt, zombie.server);
    }
  }
}
