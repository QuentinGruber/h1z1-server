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

import { BaseLootableEntity } from "./baselootableentity";
import { ZoneServer2016 } from "../zoneserver";
import { lootableContainerDefaultLoadouts } from "../data/loadouts";

export class Lootbag extends BaseLootableEntity {
  creationTime = Date.now();
  canAcceptItems = false;
  loadoutId = 5;
  constructor(
    characterId: string,
    transientId: number,
    actorModelId: number,
    position: Float32Array,
    rotation: Float32Array,
    server: ZoneServer2016
  ) {
    super(characterId, transientId, actorModelId, position, rotation, server);
    const container = this.getContainer();
    if (container) container.canAcceptItems = false;
    this.flags.noCollide = 1;
    this.npcRenderDistance = 50;
    this.defaultLoadout = lootableContainerDefaultLoadouts.lootbag;
    this.equipLoadout(server);
  }

  destroy(server: ZoneServer2016) {
    return server.deleteEntity(this.characterId, server._lootbags);
  }
}
