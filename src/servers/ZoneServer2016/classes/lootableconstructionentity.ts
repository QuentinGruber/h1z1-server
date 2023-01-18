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

import {
  ConstructionPermissionIds,
  Items,
  ResourceIds,
  StringIds,
} from "../models/enums";
import { DamageInfo } from "types/zoneserver";
import { ZoneServer2016 } from "../zoneserver";
import { BaseLootableEntity } from "./baselootableentity";
import { ConstructionChildEntity } from "./constructionchildentity";
import { ConstructionParentEntity } from "./constructionparententity";
import { ZoneClient2016 } from "./zoneclient";
import { smeltingEntity } from "./smeltingentity";
import { lootableContainerDefaultLoadouts } from "../data/loadouts";

export class LootableConstructionEntity extends BaseLootableEntity {
  get health() {
    return this._resources[ResourceIds.CONSTRUCTION_CONDITION];
  }
  set health(health: number) {
    this._resources[ResourceIds.CONSTRUCTION_CONDITION] = health;
  }
  placementTime = Date.now();
  parentObjectCharacterId: string;
  npcRenderDistance = 15;
  loadoutId = 5;
  itemDefinitionId: number;
  smeltingEntity?: smeltingEntity;
  constructor(
    characterId: string,
    transientId: number,
    actorModelId: number,
    position: Float32Array,
    rotation: Float32Array,
    server: ZoneServer2016,
    itemDefinitionId: number,
    parentObjectCharacterId: string,
    isSmeltable: boolean
  ) {
    super(characterId, transientId, actorModelId, position, rotation, server);
    this.parentObjectCharacterId = parentObjectCharacterId || "";
    this.itemDefinitionId = itemDefinitionId;
    const itemDefinition = server.getItemDefinition(itemDefinitionId);
    if (itemDefinition) this.nameId = itemDefinition.NAME_ID;
    this.profileId = 999; /// mark as construction
    this.health = 1000000;
    this.defaultLoadout = lootableContainerDefaultLoadouts.storage;
    if (isSmeltable) {
      this.smeltingEntity = new smeltingEntity(this, server);
    }
  }
  damage(server: ZoneServer2016, damageInfo: DamageInfo) {
    // todo: redo this
    this.health -= damageInfo.damage;
  }
  getParent(
    server: ZoneServer2016
  ): ConstructionParentEntity | ConstructionChildEntity | undefined {
    return (
      server._constructionFoundations[this.parentObjectCharacterId] ||
      server._constructionSimple[this.parentObjectCharacterId] ||
      undefined
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

  destroy(server: ZoneServer2016, destructTime = 0) {
    server.deleteEntity(
      this.characterId,
      server._lootableConstruction[this.characterId]
        ? server._lootableConstruction
        : server._worldLootableConstruction,
      242,
      destructTime
    );
    if(!destructTime) {
      server.worldObjectManager.createLootbag(server, this);
      return;
    }
    setTimeout(() => {
      server.worldObjectManager.createLootbag(server, this);
    }, destructTime);
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

  OnPlayerSelect(server: ZoneServer2016, client: ZoneClient2016) {
    if (this.canUndoPlacement(server, client)) {
      this.destroy(server);
      client.character.lootItem(
        server,
        server.generateItem(this.itemDefinitionId)
      );
      return;
    }

    super.OnPlayerSelect(server, client);
  }

  OnInteractionString(server: ZoneServer2016, client: ZoneClient2016) {
    if (this.canUndoPlacement(server, client)) {
      server.undoPlacementInteractionString(this, client);
      return;
    }
    server.sendData(client, "Command.InteractionString", {
      guid: this.characterId,
      stringId: StringIds.OPEN,
    });
  }
  OnFullCharacterDataRequest(server: ZoneServer2016, client: ZoneClient2016) {
    if (this.smeltingEntity && this.smeltingEntity.isBurning) {
      server.sendData(client, "Command.PlayDialogEffect", {
        characterId: this.characterId,
        effectId: this.smeltingEntity.smeltingEffect,
      });
    }
  }
}
