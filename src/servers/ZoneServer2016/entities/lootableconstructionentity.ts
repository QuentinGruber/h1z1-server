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
  ConstructionPermissionIds,
  Effects,
  Items,
  ResourceIndicators,
  StringIds
} from "../models/enums";
import { DamageInfo, HudIndicator } from "types/zoneserver";
import { ZoneServer2016 } from "../zoneserver";
import { BaseLootableEntity } from "./baselootableentity";
import { ConstructionChildEntity } from "./constructionchildentity";
import { ConstructionParentEntity } from "./constructionparententity";
import { ZoneClient2016 } from "../classes/zoneclient";
import { SmeltingEntity } from "../classes/smeltingentity";
import { lootableContainerDefaultLoadouts } from "../data/loadouts";
import { CollectingEntity } from "../classes/collectingentity";
import { EXTERNAL_CONTAINER_GUID } from "../../../utils/constants";
import { CharacterPlayWorldCompositeEffect } from "types/zone2016packets";
import { scheduler } from "timers/promises";
import { BaseEntity } from "./baseentity";
import { isPosInRadius } from "../../../utils/utils";
import { ExplosiveEntity } from "./explosiveentity";

function getMaxHealth(itemDefinitionId: Items): number {
  switch (itemDefinitionId) {
    case Items.CAMPFIRE:
    case Items.DEW_COLLECTOR:
      return 100000;
    default:
      return 250000;
  }
}

export class LootableConstructionEntity extends BaseLootableEntity {
  /** Time (milliseconds) when the LootableConstructionEntity was placed */
  placementTime = Date.now();
  /** Parent foundation that the LootableConstructionEntity is on top of */
  parentObjectCharacterId: string;
  loadoutId = 5;

  /** Id of the LootableConstructionId - See ServerItemDefinitions.json for more information */
  itemDefinitionId: number;

  /** Range at which the LootableConstructionEntity will receive damage from explosions */
  damageRange: number = 1.5;

  /** Distance (H1Z1 meters) at which the player can interact with the LootableConstructionEntity */
  interactionDistance = 3;

  /** Determines if the LootableConstructionEntity is a SmeltingEntity or CollectingEntity */
  subEntity?: SmeltingEntity | CollectingEntity;

  /** The guid of the secured shelter the LootableConstructionEntity is inside */
  isHidden: string = "";

  /** Used by DecayManager, determines if the entity will be damaged the next decay tick */
  isDecayProtected: boolean = false;
  isProp: boolean = false;
  constructor(
    characterId: string,
    transientId: number,
    actorModelId: number,
    position: Float32Array,
    rotation: Float32Array,
    server: ZoneServer2016,
    scale: Float32Array,
    itemDefinitionId: number,
    parentObjectCharacterId: string,
    subEntityType: string,
    isProp = false
  ) {
    super(characterId, transientId, actorModelId, position, rotation, server);
    this.parentObjectCharacterId = parentObjectCharacterId || "";
    this.itemDefinitionId = itemDefinitionId;
    const itemDefinition = server.getItemDefinition(itemDefinitionId);
    if (itemDefinition) this.nameId = itemDefinition.NAME_ID;
    this.profileId = 999; /// mark as construction
    this.isProp = isProp;

    this.maxHealth = getMaxHealth(this.itemDefinitionId);
    this.health = this.maxHealth;
    switch (this.itemDefinitionId) {
      case Items.REPAIR_BOX:
        this.defaultLoadout = lootableContainerDefaultLoadouts.repair_box;
        break;
      case Items.HAND_SHOVEL:
        this.defaultLoadout = lootableContainerDefaultLoadouts.stash;
        break;
      default:
        this.defaultLoadout = lootableContainerDefaultLoadouts.storage;
        break;
    }
    if (subEntityType === "SmeltingEntity") {
      this.subEntity = new SmeltingEntity(this, server);
      this.npcRenderDistance = 250;
    } else if (subEntityType === "CollectingEntity") {
      this.subEntity = new CollectingEntity(this, server);
      this.interactionDistance = 5;
      this.npcRenderDistance = 200;
    } else {
      this.npcRenderDistance = 20;
    }

    this.scale = scale;
  }
  damage(server: ZoneServer2016, damageInfo: DamageInfo) {
    const dictionary = server.getEntityDictionary(this.characterId);
    if (!dictionary) {
      return;
    }

    this.health -= damageInfo.damage;
    server.sendDataToAllWithSpawnedEntity(
      dictionary,
      this.characterId,
      "Character.UpdateSimpleProxyHealth",
      this.pGetSimpleProxyHealth()
    );

    if (this.health > 0) return;
    this.destroy(server, 3000);
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
    const weapon = client.character.getEquippedWeapon();
    if (!weapon) return false;
    return (
      this.getHasPermission(
        server,
        client.character.characterId,
        ConstructionPermissionIds.BUILD
      ) &&
      Date.now() < this.placementTime + 120000 &&
      weapon.itemDefinitionId == Items.WEAPON_HAMMER_DEMOLITION
    );
  }

  destroy(server: ZoneServer2016, destructTime = 0): boolean {
    const deleted = server.deleteEntity(
      this.characterId,
      server._lootableConstruction[this.characterId]
        ? server._lootableConstruction
        : server._worldLootableConstruction,
      242,
      destructTime
    );
    const parent = this.getParent(server);
    if (parent && parent.freeplaceEntities[this.characterId]) {
      delete parent.freeplaceEntities[this.characterId];
    }

    server.worldObjectManager.createLootbag(server, this);
    const container = this.getContainer();
    if (container) {
      container.items = {};
      for (const a in server._characters) {
        const character = server._characters[a];
        if (character.mountedContainer == this) {
          character.dismountContainer(server);
        }
      }
    }
    return deleted;
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
  /* eslint-disable @typescript-eslint/no-unused-vars */
  OnPlayerSelect(
    server: ZoneServer2016,
    client: ZoneClient2016,
    isInstant?: boolean
    /* eslint-enable @typescript-eslint/no-unused-vars */
  ) {
    if (this.canUndoPlacement(server, client)) {
      this.destroy(server);
      client.character.lootItem(
        server,
        server.generateItem(this.itemDefinitionId)
      );
      return;
    }
    if (server.fairPlayManager.useFairPlay) {
      for (const a in server._constructionFoundations) {
        const foundation = server._constructionFoundations[a];
        if (
          foundation.itemDefinitionId != Items.FOUNDATION &&
          foundation.itemDefinitionId != Items.FOUNDATION_EXPANSION
        )
          continue;
        if (foundation.isInside(this.state.position)) {
          let pos = foundation.state.position[1];
          if (
            foundation.parentObjectCharacterId &&
            server._constructionFoundations[foundation.parentObjectCharacterId]
          ) {
            pos =
              server._constructionFoundations[
                foundation.parentObjectCharacterId
              ].state.position[1];
          }
          if (this.state.position[1] - (pos + 2) < 0) {
            server.sendChatText(client, `FairPlay: Glitched storage detected`);
            return;
          }
        }
      }
    }

    super.OnPlayerSelect(server, client);
    if (this.itemDefinitionId == Items.REPAIR_BOX) {
      server.sendData(client, "Character.DailyRepairMaterials", {
        characterId: this.characterId,
        containerId: EXTERNAL_CONTAINER_GUID,
        materials: server.decayManager.dailyRepairMaterials
      });
    }
  }

  OnInteractionString(server: ZoneServer2016, client: ZoneClient2016) {
    if (this.canUndoPlacement(server, client)) {
      server.constructionManager.undoPlacementInteractionString(
        server,
        this,
        client
      );
      return;
    }
    if (this.subEntity) {
      this.subEntity.OnInteractionString(server, client);
      return;
    }
    server.sendData(client, "Command.InteractionString", {
      guid: this.characterId,
      stringId: StringIds.OPEN
    });
  }

  OnFullCharacterDataRequest(server: ZoneServer2016, client: ZoneClient2016) {
    if (this.subEntity) {
      this.subEntity.OnFullCharacterDataRequest(server, client);
    }
  }

  async handleBeeboxSwarm(server: ZoneServer2016, damageInfo: DamageInfo) {
    const client = server.getClientByCharId(damageInfo.entity);
    const dictionary = server.getEntityDictionary(this.characterId);
    if (!client || !dictionary) return;

    server.sendDataToAllWithSpawnedEntity<CharacterPlayWorldCompositeEffect>(
      dictionary,
      this.characterId,
      "Character.PlayWorldCompositeEffect",
      {
        characterId: this.characterId,
        effectId: Effects.PFX_Bee_Swarm_Attack,
        position: client.character.state.position,
        effectTime: 5
      }
    );

    for (let i = 0; i < 12; i++) {
      const dmgInfo: DamageInfo = {
        entity: "",
        damage: 25
      };
      client.character.damage(server, dmgInfo);
      await scheduler.wait(500);
    }

    let hudIndicator: HudIndicator | undefined = undefined;
    hudIndicator = server._hudIndicators[ResourceIndicators.BEES];

    if (!hudIndicator) return;

    if (client.character.hudIndicators[hudIndicator.typeName]) {
      client.character.hudIndicators[hudIndicator.typeName].expirationTime +=
        5000;
    } else {
      client.character.hudIndicators[hudIndicator.typeName] = {
        typeName: hudIndicator.typeName,
        expirationTime: Date.now() + 5000
      };
      server.sendHudIndicators(client);
    }
  }

  OnMeleeHit(server: ZoneServer2016, damageInfo: DamageInfo) {
    if (this.isProp) return;
    if (
      this.itemDefinitionId == Items.BEE_BOX &&
      damageInfo.weapon != Items.WEAPON_HAMMER_DEMOLITION
    ) {
      this.handleBeeboxSwarm(server, damageInfo);
    }

    server.constructionManager.OnMeleeHit(server, damageInfo, this);
  }
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  OnProjectileHit(server: ZoneServer2016, damageInfo: DamageInfo) {
    /* disable projectile damage for raycast
    if (this.isProp) return;
    let freePlaceDmgMultiplier = 1;

    const dictionary = server.getEntityDictionary(this.characterId);
    if (
      dictionary == server._worldLootableConstruction ||
      (server._worldSimpleConstruction && !this.parentObjectCharacterId)
    ) {
      freePlaceDmgMultiplier = 2;
    }
    // 26 308 shots for freeplaced objects, 13 for parented objects

    const damage = damageInfo.damage * (3 * freePlaceDmgMultiplier);
    this.damage(server, { ...damageInfo, damage });
    */
  }

  OnExplosiveHit(
    server: ZoneServer2016,
    sourceEntity: BaseEntity,
    client?: ZoneClient2016,
    useRaycast?: boolean
  ) {
    if (server.isPvE) {
      return;
    }
    if (!isPosInRadius(2, this.state.position, sourceEntity.state.position))
      return;

    const itemDefinitionId =
      sourceEntity instanceof ExplosiveEntity
        ? sourceEntity.itemDefinitionId
        : 0;

    if (server._worldLootableConstruction[this.characterId]) {
      server.constructionManager.checkConstructionDamage(
        server,
        this,
        server.baseConstructionDamage,
        sourceEntity.state.position,
        this.state.position,
        itemDefinitionId
      );
      return;
    }
    if (!useRaycast) {
      const parent = this.getParent(server);
      if (parent && parent.isSecured) {
        if (!client) return;
        server.constructionManager.sendBaseSecuredMessage(server, client);

        return;
      }
    }
    server.constructionManager.checkConstructionDamage(
      server,
      this,
      server.baseConstructionDamage,
      sourceEntity.state.position,
      this.state.position,
      itemDefinitionId
    );
  }
}
