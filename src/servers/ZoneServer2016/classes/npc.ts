// ======================================================================
//
//   GNU GENERAL PUBLIC LICENSE
//   Version 3, 29 June 2007
//   copyright (C) 2020 - 2021 Quentin Gruber
//   copyright (C) 2021 - 2022 H1emu community
//
//   https://github.com/QuentinGruber/h1z1-server
//   https://www.npmjs.com/package/h1z1-server
//
//   Based on https://github.com/psemu/soe-network
// ======================================================================

import { BaseFullCharacter } from "./basefullcharacter";

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
}
