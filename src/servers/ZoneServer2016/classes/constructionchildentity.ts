//   copyright (C) 2021 - 2022 H1emu community
//
//   https://github.com/QuentinGruber/h1z1-server
//   https://www.npmjs.com/package/h1z1-server
//
//   Based on https://github.com/psemu/soe-network
// ======================================================================

import { BaseLightweightCharacter } from "./baselightweightcharacter";
import { ZoneServer2016 } from "../zoneserver";
import { ConstructionPermissionIds, Items } from "../models/enums";
import { DamageInfo } from "types/zoneserver";
import { isArraySumZero } from "../../../utils/utils";
import { ZoneClient2016 } from "./zoneclient";
import { ConstructionParentEntity } from "./constructionparententity";
import { eul2quat } from "h1emu-core";
function getDamageRange(definitionId: number): number {
  switch (definitionId) {
    case Items.METAL_WALL:
    case Items.METAL_WALL_UPPER:
    case Items.SHELTER:
    case Items.SHELTER_UPPER:
      return 4.3;
    case Items.SHELTER_LARGE:
    case Items.SHELTER_UPPER_LARGE:
      return 6.5;
    default:
      return 2;
  }
}

export class ConstructionChildEntity extends BaseLightweightCharacter {
  health: number = 1000000;
  buildingSlot?: string;
  perimeters: { [slot: string]: Float32Array };
  itemDefinitionId: number;
  parentObjectCharacterId: string;
  eulerAngle: number;
  slot?: string;
  occupiedSlots: string[] = [];
  securedPolygons?: any;
  isSecured = false;
  damageRange: number;
  fixedPosition?: Float32Array;
  placementTime = Date.now();
  constructor(
    characterId: string,
    transientId: number,
    actorModelId: number,
    position: Float32Array,
    rotation: Float32Array,
    itemDefinitionId: number,
    parentObjectCharacterId: string,
    slot?: string,
    BuildingSlot?: string
  ) {
    super(characterId, transientId, actorModelId, position, rotation);
    this.state.rotation = eul2quat(rotation);
    this.eulerAngle = rotation[0];
    this.itemDefinitionId = itemDefinitionId;
    if (BuildingSlot) this.buildingSlot = BuildingSlot;
    this.parentObjectCharacterId = parentObjectCharacterId;
    if (slot) this.slot = slot;
    this.profileId = 999; /// mark as construction
    this.perimeters = {
      LoveShackDoor: new Float32Array([0, 0, 0, 0]),
    };
    this.damageRange = getDamageRange(this.itemDefinitionId);
  }

  pGetConstructionHealth() {
    return {
      characterId: this.characterId,
      health: this.health / 10000,
    };
  }
  damage(server: ZoneServer2016, damageInfo: DamageInfo) {
    // todo: redo this
    this.health -= damageInfo.damage;
  }

  destroy(server: ZoneServer2016, destructTime = 0) {
    server.deleteEntity(
      this.characterId,
      server._constructionSimple,
      242,
      destructTime
    );
    const foundation = server._constructionFoundations[
      this.parentObjectCharacterId
    ]
      ? server._constructionFoundations[this.parentObjectCharacterId]
      : server._constructionSimple[this.parentObjectCharacterId];
    if (!foundation) return;
    if (this.itemDefinitionId == Items.METAL_WALL) {
      foundation.changePerimeters(
        server,
        this.buildingSlot,
        new Float32Array([0, 0, 0, 0])
      );
    }
    if (!this.slot || !this.parentObjectCharacterId) return;
    const index = foundation.occupiedSlots.indexOf(this.slot);
    foundation.occupiedSlots.splice(index, 1);
  }

  changePerimeters(
    server: ZoneServer2016,
    slot: string | undefined,
    value: Float32Array
  ) {
    this.perimeters["LoveShackDoor"] = value;
    if (!isArraySumZero(value)) {
      this.isSecured = true;
    } else this.isSecured = false;
  }

  getParent(server: ZoneServer2016): ConstructionParentEntity | undefined {
    return (
      server._constructionFoundations[this.parentObjectCharacterId] ||
      server._constructionSimple[this.parentObjectCharacterId]
    );
  }

  canUndoPlacement(server: ZoneServer2016, client: ZoneClient2016) {
    return (
      this.getHasPermission(
        server,
        client.character.characterId,
        ConstructionPermissionIds.BUILD
      ) &&
      Date.now() < this.placementTime + 120000 &&
      client.character.getEquippedWeapon().itemDefinitionId ==
        Items.WEAPON_HAMMER_DEMOLITION
    );
  }

  getHasPermission(
    server: ZoneServer2016,
    characterId: string,
    permission: ConstructionPermissionIds
  ) {
    return (
      this.getParentFoundation(server)?.getHasPermission(
        server,
        characterId,
        permission
      ) || false
    );
  }

  getParentFoundation(
    server: ZoneServer2016
  ): ConstructionParentEntity | undefined {
    const parent = this.getParent(server);
    if (!parent) return;
    if (server._constructionSimple[parent.characterId]) {
      return server._constructionSimple[parent.characterId].getParentFoundation(
        server
      );
    }
    return server._constructionFoundations[parent.characterId];
  }

  OnPlayerSelect(server: ZoneServer2016, client: ZoneClient2016) {
    if (this.canUndoPlacement(server, client)) {
      this.destroy(server);
      client.character.lootItem(
        server,
        server.generateItem(this.itemDefinitionId)
      );
      return;
    }
  }

  OnInteractionString(server: ZoneServer2016, client: ZoneClient2016) {
    if (this.canUndoPlacement(server, client)) {
      server.undoPlacementInteractionString(this, client);
      return;
    }
  }
}
