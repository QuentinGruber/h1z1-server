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

import {
  AddSimpleNpc,
  CharacterUpdateSimpleProxyHealth
} from "types/zone2016packets";
import { ZoneServer2016 } from "../zoneserver";
import { BaseEntity } from "./baseentity";

export abstract class BaseSimpleNpc extends BaseEntity {
  /** Maximum health alloted BaseSimpleNPC */
  maxHealth: number = 100000;

  /** Health initialized by maxHealth to determine the health percentage in pGetSimpleProxyHealth */
  health: number = this.maxHealth;

  constructor(
    characterId: string,
    transientId: number,
    actorModelId: number,
    position: Float32Array,
    rotation: Float32Array,
    server: ZoneServer2016
  ) {
    super(characterId, transientId, actorModelId, position, rotation, server);
  }
  pGetSimpleNpc(): AddSimpleNpc {
    return {
      characterId: this.characterId,
      transientId: this.transientId,
      position: this.state.position,
      rotation: this.state.rotation,
      modelId: this.actorModelId,
      scale: this.scale,
      health: this.pGetSimpleProxyHealth().healthPercentage
    };
  }
  pGetSimpleProxyHealth(): CharacterUpdateSimpleProxyHealth {
    return {
      characterId: this.characterId,
      healthPercentage: (this.health / this.maxHealth) * 100
    };
  }
}
