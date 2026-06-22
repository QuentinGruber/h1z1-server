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

import { ZoneServer2016 } from "../zoneserver";
import { Effects, ModelIds, NpcIds, StringIds } from "../models/enums";
import { ZombieWalker } from "./zombiewalker";
import { createExploder, detonateExploder } from "../jsms/exploder.jsm";
import { DamageInfo } from "types/zoneserver";

export class Exploder extends ZombieWalker {
  constructor(
    characterId: string,
    transientId: number,
    position: Float32Array,
    rotation: Float32Array,
    server: ZoneServer2016,
    spawnerId: number = 0
  ) {
    super(
      characterId,
      transientId,
      ModelIds.ZOMBIE_MALE_WALKER,
      position,
      rotation,
      server,
      spawnerId
    );
    this.npcMeleeDamage = 0;
    this.npcId = NpcIds.EXPLODER;
    this.nameId = StringIds.ZOMBIE_WALKER;
    this.effectTags.push(Effects.PFX_Char_Zombie_Exploder_Ambient);
    // override the walker FSM set by parent constructor
    if (!process.env.DISABLE_AI && server.aiEnabled) {
      this.fsm = createExploder(this, server);
    }
  }

  async damage(server: ZoneServer2016, damageInfo: DamageInfo) {
    const wasAlive = this.isAlive;
    await super.damage(server, damageInfo);
    // detonate when killed
    if (wasAlive && !this.isAlive) {
      this.removeEffectTag(Effects.PFX_Char_Zombie_Exploder_Ambient);
      detonateExploder(server, this, this.characterId);
    }
  }
}
