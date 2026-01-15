// ======================================================================
//
//   GNU GENERAL PUBLIC LICENSE
//   Version 3, 29 June 2007
//   copyright (C) 2020 - 2021 Quentin Gruber
//   copyright (C) 2021 - 2025 H1emu community
//
//   https://github.com/QuentinGruber/h1z1-server
//   https://www.npmjs.com/package/h1z1-server
//
//   Based on https://github.com/psemu/soe-network
// ======================================================================

import { isPosInRadiusWithY } from "../../../utils/utils";
import { Character2016 } from "../entities/character";
import { ExplosiveEntity } from "../entities/explosiveentity";
import { TrapEntity } from "../entities/trapentity";
import { ZoneServer2016 } from "../zoneserver";

const degradeTrapsCallTime = 1300_000;
const ttlExplosives = 3600_000 * 3;
export class AiManager {
  trapEntities: Set<TrapEntity> = new Set();
  playerEntities: Set<Character2016> = new Set();
  explosiveEntities: Set<ExplosiveEntity> = new Set();
  systemsCallsTime: Map<string, number> = new Map();
  now: number = 0;
  constructor(public server: ZoneServer2016) {}
  addEntity(entity: unknown) {
    switch (true) {
      case entity instanceof TrapEntity: {
        this.trapEntities.add(entity);
        break;
      }
      case entity instanceof Character2016: {
        this.playerEntities.add(entity);
        break;
      }
      case entity instanceof ExplosiveEntity: {
        this.explosiveEntities.add(entity);
        break;
      }
    }
  }
  removeEntity(entity: unknown) {
    switch (true) {
      case entity instanceof TrapEntity: {
        this.trapEntities.delete(entity);
        break;
      }
      case entity instanceof Character2016: {
        this.playerEntities.delete(entity);
        break;
      }
      case entity instanceof ExplosiveEntity: {
        this.explosiveEntities.delete(entity);
        break;
      }
    }
  }
  getEntitiesTotalNumber(): number {
    return (
      this.trapEntities.size +
      this.playerEntities.size +
      this.explosiveEntities.size
    );
  }
  getEntitiesStats(): string {
    return `Players: ${this.playerEntities.size}\nTraps: ${this.trapEntities.size}\nExplosive: ${this.explosiveEntities.size}`;
  }

  private checkTraps() {
    this.playerEntities.forEach((player) => {
      this.trapEntities.forEach((trap) => {
        if (trap.lastTrigger + trap.cooldown > this.now) {
          return;
        }
        const inRadius = isPosInRadiusWithY(
          trap.triggerRadiusX,
          player.state.position,
          trap.state.position,
          trap.triggerRadiusY
        );
        if (player.isAlive && inRadius) {
          trap.detonate(player.characterId);
        }
      });
    });
  }
  private checkExplosive() {
    this.playerEntities.forEach((player) => {
      this.explosiveEntities.forEach((explosive) => {
        const inRadius = isPosInRadiusWithY(
          0.6,
          player.state.position,
          explosive.state.position,
          0.5
        );
        if (player.isAlive && inRadius) {
          explosive.detonate(player.characterId);
        }
      });
    });
  }
  private degradeTraps() {
    this.trapEntities.forEach((trap) => {
      trap.damage(this.server, {
        damage: (trap.maxHealth * degradeTrapsCallTime) / trap.degradationTime,
        entity: "Server.degradeTraps"
      });
    });
  }
  private triggerOldExplosives() {
    this.explosiveEntities.forEach((explosive) => {
      if (explosive.creationTime + ttlExplosives < this.now) {
        explosive.detonate();
      }
    });
  }
  private executeScheduled(fn: () => void) {
    this.systemsCallsTime.set(fn.name, this.now);
    fn.bind(this)();
  }
  private scheduleExecute(fn: () => void, time: number) {
    if (this.systemsCallsTime.has(fn.name)) {
      const lastCall = this.systemsCallsTime.get(fn.name) as number;
      if (lastCall + time < this.now) {
        this.executeScheduled(fn);
      }
    } else {
      this.executeScheduled(fn);
    }
  }
  run() {
    this.now = Date.now();
    this.checkTraps();
    this.checkExplosive();
    this.scheduleExecute(this.degradeTraps, degradeTrapsCallTime);
    this.scheduleExecute(this.triggerOldExplosives, 60_000);
  }
}
