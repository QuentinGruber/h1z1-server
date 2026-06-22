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
import { ModelIds, NpcIds, StringIds } from "../models/enums";
import { ZombieWalker } from "./zombiewalker";
import { createExploder } from "../jsms/exploder.jsm";

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
    // override the walker FSM set by parent constructor
    if (!process.env.DISABLE_AI && server.aiEnabled) {
      this.fsm = createExploder(this, server);
    }
  }
}
