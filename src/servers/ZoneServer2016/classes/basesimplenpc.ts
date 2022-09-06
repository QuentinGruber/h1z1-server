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

import { BaseEntity } from "./baseentity";

function getDamageRange(actorModelId: number) {
    let damageRange: number;
    switch (actorModelId) {
        case 49:
        case 50:
        case 9407:
            damageRange = 5;
            break;
        case 51:
        case 9408:
            damageRange = 4;
            break;
        case 52:
        case 9411:
            damageRange = 8;
        case 9181:
            damageRange = 2;
        default:
            damageRange = 2;
            break;
    }
    return damageRange;
}

export class BaseSimpleNpc extends BaseEntity {
    health = 100000;
    damageRange: number;
  constructor(
    characterId: string,
    transientId: number,
    actorModelId: number,
    position: Float32Array,
    rotation: Float32Array
  ) {
      super(characterId, transientId, actorModelId, position, rotation);
      this.damageRange = getDamageRange(actorModelId);
  }
  pGetSimpleNpc() {
    return {
      characterId: this.characterId,
      transientId: this.transientId,
      position: this.state.position,
      rotation: this.state.rotation,
      modelId: this.actorModelId,
      scale: this.scale,
      showHealth: true,
      health: this.health / 1000,
    };
  }
  pGetSimpleProxyHealth() {
    return {
      characterId: this.characterId,
      health: this.health / 1000,
    };
  }
}
