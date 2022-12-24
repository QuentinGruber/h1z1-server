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

import { ResourceIds } from "../models/enums";
import { ZoneServer2016 } from "../zoneserver";
import { BaseLootableEntity } from "./baselootableentity";
import { ConstructionChildEntity } from "./constructionchildentity";
import { ConstructionParentEntity } from "./constructionparententity";

export class LootableConstructionEntity extends BaseLootableEntity {
  get health() {
    return this._resources[ResourceIds.CONSTRUCTION_CONDITION]
  }
  set health(health: number) {
    this._resources[ResourceIds.CONSTRUCTION_CONDITION] = health;
  }
  placementTime = Date.now();
  parentObjectCharacterId = "";
  npcRenderDistance = 15;
  loadoutId = 5;
  constructor(
    characterId: string,
    transientId: number,
    actorModelId: number,
    position: Float32Array,
    rotation: Float32Array
  ) {
    super(characterId, transientId, actorModelId, position, rotation);
  }
  getParent(server: ZoneServer2016): ConstructionParentEntity | ConstructionChildEntity {
    return server._constructionFoundations[this.parentObjectCharacterId];
  }

  getPlacementOwner(server: ZoneServer2016): string {
    const parent = this.getParent(server);
    if(!parent) return "";
    if(parent instanceof ConstructionParentEntity) {

      return parent.ownerCharacterId;
    }
    return parent.getPlacementOwner(server);
  }
}
