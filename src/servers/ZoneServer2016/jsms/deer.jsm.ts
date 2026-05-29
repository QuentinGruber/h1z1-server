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

import StateMachine from "javascript-state-machine";
import type { Npc } from "../entities/npc";
import type { ZoneServer2016 } from "../zoneserver";
import { NavManager } from "../../../utils/recast";
const debug = require("debug")("ai");
import { getDistance2d } from "../../../utils/utils";

export type DeerState = "wander" | "flee" | "dead";

export type DeerTransition = "spottedPlayer" | "calmedDown" | "destroyed";

export interface DeerInstance extends StateMachine {
  id: string;
  state: DeerState;
  targetPos: Float32Array | null;
  wanderOrigin: Float32Array;
  patrolTimer: number;
  stateTimer: number;
  threatPos: Float32Array | null;
  npc: Npc;
  server: ZoneServer2016;
  spottedPlayer(): void;
  calmedDown(): void;
  destroyed(): void;
  goto(state: DeerState): void;
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

function pickFleePoint(
  npc: Npc,
  server: ZoneServer2016,
  threatPos: Float32Array
): Float32Array | null {
  const dx = npc.state.position[0] - threatPos[0];
  const dz = npc.state.position[2] - threatPos[2];
  const len = Math.sqrt(dx * dx + dz * dz) || 1;
  const fleeCenter = new Float32Array([
    npc.state.position[0] + (dx / len) * 50,
    npc.state.position[1],
    npc.state.position[2] + (dz / len) * 50,
    0
  ]);
  const navCenter = NavManager.gameToNav(fleeCenter);
  const { success, randomPoint } =
    server.navManager.navMeshQuery.findRandomPointAroundCircle(navCenter, 15);
  return success ? NavManager.navToGame(randomPoint) : fleeCenter;
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

export function createDeer(npc: Npc, server: ZoneServer2016): DeerInstance {
  return new StateMachine({
    init: "wander",

    data() {
      return {
        id: npc.characterId,
        npc,
        server,
        wanderOrigin: npc.state.position.slice() as Float32Array,
        targetPos: pickPatrolPoint(npc, server, npc.state.position) as unknown,
        patrolTimer: 0,
        stateTimer: 0,
        threatPos: null
      };
    },

    transitions: [
      { name: "spottedPlayer", from: "wander", to: "flee" },
      { name: "calmedDown", from: "flee", to: "wander" },
      { name: "destroyed", from: "*", to: "dead" }
    ],

    methods: {
      onWander(this: DeerInstance): void {
        this.patrolTimer = 0;
        this.stateTimer = 0;
        this.threatPos = null;
        this.wanderOrigin = this.npc.state.position.slice() as Float32Array;
        const pt = pickPatrolPoint(this.npc, this.server, this.wanderOrigin);
        if (pt) {
          this.targetPos = pt;
          moveToward(this.npc, pt, this.server);
        }
      },

      onFlee(this: DeerInstance): void {
        this.stateTimer = 0;
        if (this.threatPos) {
          const fleeTarget = pickFleePoint(
            this.npc,
            this.server,
            this.threatPos
          );
          if (fleeTarget) {
            this.targetPos = fleeTarget;
            moveToward(this.npc, fleeTarget, this.server);
          }
        }
      },

      onDead(this: DeerInstance): void {},

      onBeforeDestroyed(this: DeerInstance): boolean {
        return this.state !== "dead";
      },

      onTransition(
        this: DeerInstance,
        lifecycle: { from: string; to: string; transition: string }
      ): void {
        debug(
          `[${this.id}] ${lifecycle.from} → ${lifecycle.to} (${lifecycle.transition})`
        );
      }
    }
  }) as unknown as DeerInstance;
}

export function tickDeer(
  zone: ZoneServer2016,
  deer: DeerInstance,
  dt: number
): void {
  if (deer.state === "dead") return;

  deer.stateTimer += dt;

  switch (deer.state) {
    case "wander": {
      for (const characterId in zone._characters) {
        const character = zone._characters[characterId];
        if (!character.isAlive) continue;
        if (
          getDistance2d(deer.npc.state.position, character.state.position) < 20
        ) {
          deer.threatPos = character.state.position.slice() as Float32Array;
          deer.spottedPlayer();
          break;
        }
      }

      if (deer.state !== "wander") break;

      deer.patrolTimer += dt;
      const arrived =
        deer.targetPos != null &&
        getDistance2d(deer.npc.state.position, deer.targetPos) < 3;

      if (arrived || deer.targetPos == null) {
        deer.patrolTimer = 0;
        const pt = pickPatrolPoint(deer.npc, deer.server, deer.wanderOrigin);
        if (pt) {
          deer.targetPos = pt;
          moveToward(deer.npc, pt, deer.server);
        }
      }
      break;
    }

    case "flee": {
      let playerNear = false;
      for (const characterId in zone._characters) {
        const character = zone._characters[characterId];
        if (!character.isAlive) continue;
        if (
          getDistance2d(deer.npc.state.position, character.state.position) < 35
        ) {
          playerNear = true;
          deer.threatPos = character.state.position.slice() as Float32Array;
          break;
        }
      }

      if (!playerNear || deer.stateTimer >= 8) {
        deer.calmedDown();
        break;
      }

      const arrivedAtFlee =
        deer.targetPos != null &&
        getDistance2d(deer.npc.state.position, deer.targetPos) < 3;
      if (arrivedAtFlee && deer.threatPos) {
        const fleeTarget = pickFleePoint(
          deer.npc,
          deer.server,
          deer.threatPos
        );
        if (fleeTarget) {
          deer.targetPos = fleeTarget;
          moveToward(deer.npc, fleeTarget, deer.server);
        }
      }
      break;
    }
  }
}
