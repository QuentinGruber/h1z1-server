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

import { BaseLootableEntity } from "./baselootableentity";
import { LoadoutContainer } from "./loadoutcontainer";

export class Lootbag extends BaseLootableEntity {
  creationTime = Date.now();
  canAcceptItems = false;
  constructor(
    characterId: string,
    transientId: number,
    actorModelId: number,
    position: Float32Array,
    rotation: Float32Array,
    container: LoadoutContainer
  ) {
    super(
      characterId,
      transientId,
      actorModelId,
      position,
      rotation,
      container
    );
    this.container.canAcceptItems = false;
  }
}
