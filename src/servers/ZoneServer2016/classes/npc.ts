// ======================================================================
//
//   GNU GENERAL PUBLIC LICENSE
//   Version 3, 29 June 2007
//   copyright (C) 2020 - 2021 Quentin Gruber
//   copyright (C) 2021 - 2023 H1emu community
//
//   https://github.com/QuentinGruber/h1z1-server
//   https://www.npmjs.com/package/h1z1-server
//
//   Based on https://github.com/psemu/soe-network
// ======================================================================

import { DamageInfo } from "types/zoneserver";
import { ZoneServer2016 } from "../zoneserver";
import { BaseFullCharacter } from "./basefullcharacter";
import { ZoneClient2016 } from "./zoneclient";

export class Npc extends BaseFullCharacter {
  health: number;
  npcRenderDistance = 80;
  spawnerId: number;
  deathTime: number = 0;
  flags = {
    bit0: 0,
    bit1: 0,
    bit2: 0,
    bit3: 0,
    bit4: 0,
    bit5: 0,
    bit6: 0,
    bit7: 0,
    bit8: 0,
    bit9: 0,
    bit10: 0,
    bit11: 0,
    projectileCollision: 1,
    bit13: 0,
    bit14: 0,
    bit15: 0,
    bit16: 0,
    bit17: 0,
    bit18: 0,
    bit19: 0,
    noCollide: 0,
    knockedOut: 0,
    bit22: 0,
    bit23: 0,
  };
  static isAlive = true;
  public set isAlive(state) {
    this.flags.knockedOut = state ? 0 : 1;
  }
  public get isAlive() {
    return this.flags.knockedOut ? 0 : 1;
  }
  constructor(
    characterId: string,
    transientId: number,
    actorModelId: number,
    position: Float32Array,
    rotation: Float32Array,
    spawnerId: number = 0
  ) {
    super(characterId, transientId, actorModelId, position, rotation);
    this.spawnerId = spawnerId;
    this.health = 10000;
  }

  damage(server: ZoneServer2016, damageInfo: DamageInfo) {
    const client = server.getClientByCharId(damageInfo.entity),
      oldHealth = this.health;
    if ((this.health -= damageInfo.damage) <= 0) {
      this.flags.knockedOut = 1;
      this.deathTime = Date.now();
      if (client) {
        client.character.metrics.zombiesKilled++;
      }
      server.sendDataToAllWithSpawnedEntity(
        server._npcs,
        this.characterId,
        "Character.StartMultiStateDeath",
        {
          characterId: this.characterId,
        }
      );
    }

    if (client) {
      const damageRecord = server.generateDamageRecord(
        this.characterId,
        damageInfo,
        oldHealth
      );
      client.character.addCombatlogEntry(damageRecord);
    }
  }

  OnFullCharacterDataRequest(server: ZoneServer2016, client: ZoneClient2016) {
    server.sendData(client, "LightweightToFullNpc", this.pGetFull(server));

    if (this.onReadyCallback) {
      this.onReadyCallback(client);
      delete this.onReadyCallback;
    }
  }

  OnProjectileHit(server: ZoneServer2016, damageInfo: DamageInfo) {
    const client = server.getClientByCharId(damageInfo.entity);
    if (client && this.isAlive) {
      server.sendHitmarker(
        client,
        damageInfo.hitReport?.hitLocation,
        this.hasHelmet(server),
        this.hasArmor(server)
      );
    }
    switch (damageInfo.hitReport?.hitLocation) {
      case "HEAD":
      case "GLASSES":
      case "NECK":
        damageInfo.damage *= 4;
        break;
      default:
        break;
    }
    this.damage(server, damageInfo);
  }
}
