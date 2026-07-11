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
import { createGasser, spawnGasCloudAt } from "../jsms/gasser.jsm";
import { getDistance } from "../../../utils/utils";
import { DamageInfo } from "types/zoneserver";

export class Gasser extends ZombieWalker {
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
    this.npcMeleeDamage = 2500;
    this.npcId = NpcIds.GASSER;
    this.nameId = StringIds.ZOMBIE_WALKER;
    this.effectTags.push(Effects.PFX_Char_Zombie_Gasser_Ambient);
    // override the walker FSM set by parent constructor
    if (!process.env.DISABLE_AI && server.aiEnabled) {
      this.fsm = createGasser(this, server);
    }
  }

  async damage(server: ZoneServer2016, damageInfo: DamageInfo) {
    const wasAlive = this.isAlive;
    await super.damage(server, damageInfo);
    // explode into a gas cloud
    if (
      wasAlive &&
      !this.isAlive &&
      this.effectTags.includes(Effects.PFX_Char_Zombie_Gasser_Ambient)
    ) {
      this.removeEffectTag(Effects.PFX_Char_Zombie_Gasser_Ambient);

      const GASSER_DEATH_EXPLOSION_RANGE = 10;
      const GASSER_DEATH_EXPLOSION_DAMAGE = Math.floor(10000 / 3);

      server.sendCompositeEffectToAllInRange(
        100,
        this.characterId,
        this.state.position,
        Effects.PFX_Char_Zombie_Gasser_ExplosionGasCloud
      );

      for (const character of Object.values(server._characters)) {
        if (!character.isAlive) continue;
        if (
          getDistance(character.state.position, this.state.position) >
          GASSER_DEATH_EXPLOSION_RANGE
        )
          continue;

        // schedule body removal after ragdoll animation completes (~0.1 seconds)
        setTimeout(() => {
          server.deleteEntity(this.characterId, server._npcs);
        }, 100);

        character.damage(server, {
          entity: this.characterId,
          damage: GASSER_DEATH_EXPLOSION_DAMAGE
        });
      }

      spawnGasCloudAt(server, this.state.position, this.characterId);
    }
  }
}
