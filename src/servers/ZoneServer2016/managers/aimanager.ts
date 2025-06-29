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

export class AiManager {
  trapEntities: Set<TrapEntity> = new Set();
  playerEntities: Set<Character2016> = new Set();
  explosiveEntities: Set<ExplosiveEntity> = new Set();
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

  private checkTraps(now: number) {
    this.playerEntities.forEach((player) => {
      this.trapEntities.forEach((trap) => {
        if (trap.lastTrigger + trap.cooldown > now) {
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
  run() {
    const now = Date.now();
    this.checkTraps(now);
    this.checkExplosive();
  }
}
