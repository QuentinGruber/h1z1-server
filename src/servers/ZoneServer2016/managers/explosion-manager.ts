import { scheduler } from "timers/promises";
import { ExplosiveEntity } from "../entities/explosiveentity";
import { ZoneServer2016 } from "../zoneserver";
import { Effects, Items } from "../models/enums";
import { CharacterPlayWorldCompositeEffect } from "types/zone2016packets";

export class ExplosionQueue {
  private id: string;
  private entities: Set<string> = new Set();
  private chainQueue: string[] = [];
  private chainProcessing: boolean = false;

  constructor(id: string) {
    this.id = id;
  }

  addToQueue(entity: ExplosiveEntity, server: ZoneServer2016, queues: ExplosionQueue[]): void {
    this.entities.add(entity.characterId);
    this.chainQueue.push(entity.characterId);
    this.processChain(server, queues);
  }

  isEntityOnQueue(entity: string): boolean {
    return this.entities.has(entity)
  }

  isCurrentIdentifier(id: string): boolean {
    return this.id == id;
  }

  private async processChain(server: ZoneServer2016, queues: ExplosionQueue[]) {
    if (this.chainProcessing) return;
    this.chainProcessing = true;

    try {
      while (this.chainQueue.length > 0) {
        const charId = this.chainQueue.shift()!;

        const ent = server._explosives[charId] as ExplosiveEntity | undefined;
        if (!ent || ent.detonated) {
          await scheduler.wait(300);
          continue;
        }

        if (server._spawnedItems[charId]) {
          try {
            const itemObject = server._spawnedItems[charId];
            server.deleteEntity(charId, server._spawnedItems);
            delete server.worldObjectManager.spawnedLootObjects[itemObject.spawnerId];
          } catch (e) {
          }
        }

        const pos = ent.state.position

        const awaitTime = 100

        if(ent.isIED()) {
          const effectTime = Math.max(1, awaitTime/1000);
          server.sendDataToAllWithSpawnedEntity<CharacterPlayWorldCompositeEffect>(
            server._explosives,
            charId,
            "Character.PlayWorldCompositeEffect",
            {
              characterId: charId,
              effectId: Effects.PFX_Fire_Lighter,
              position: new Float32Array([pos[0], pos[1] + 0.1, pos[2], 1]),
              effectTime
            }
          );

          server.sendDataToAllWithSpawnedEntity<CharacterPlayWorldCompositeEffect>(
            server._explosives,
            charId,
            "Character.PlayWorldCompositeEffect",
            {
              characterId: charId,
              effectId: Effects.EFX_Candle_Flame_01,
              position: new Float32Array([pos[0], pos[1] + 0.1, pos[2], 1]),
              effectTime
            }
          );
        }
        await scheduler.wait(awaitTime);

        try {
          ent.detonate();
        } catch (e) {
        }

      }
    } finally {
      this.chainProcessing = false;
      const index = queues.indexOf(this);
      if (index !== -1) queues.splice(index, 1);
    }
  }

}

export class ExplosionManager {
  private server: ZoneServer2016;
  private queues: ExplosionQueue[] = [];

  constructor(
    server: ZoneServer2016
  ) {
    this.server = server;
  }

  addEntity(currentEntity: ExplosiveEntity, rootEventEntityId?: string) {
    let isOnAnyQueue = this.queues.find(q => q.isEntityOnQueue(currentEntity.characterId));
    if(isOnAnyQueue) return;

    let currentQueue: ExplosionQueue | undefined;
    if(rootEventEntityId) {
      currentQueue = this.queues.find(q => q.isCurrentIdentifier(rootEventEntityId) || this.queues.find(q => q.isEntityOnQueue(rootEventEntityId)))
    }
    if(!currentQueue) {
      currentQueue = new ExplosionQueue(rootEventEntityId || currentEntity.characterId)
      this.queues.push(currentQueue);
    }

    currentQueue?.addToQueue(currentEntity, this.server, this.queues);

  }
}
