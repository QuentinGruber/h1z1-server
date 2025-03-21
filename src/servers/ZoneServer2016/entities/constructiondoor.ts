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

import { DoorEntity } from "./doorentity";
import {
  ConstructionPermissionIds,
  Items,
  ResourceIds,
  ResourceTypes,
  StringIds
} from "../models/enums";
import { ZoneServer2016 } from "../zoneserver";
import { ZoneClient2016 } from "../classes/zoneclient";
import { DamageInfo, OccupiedSlotMap } from "types/zoneserver";
import {
  getConstructionSlotId,
  isPosInRadius,
  movePoint
} from "../../../utils/utils";
import { ConstructionParentEntity } from "./constructionparententity";
import { ConstructionChildEntity } from "./constructionchildentity";
import { CUSTOM_PROFILES_IDS } from "../../../utils/enums";
import { BaseEntity } from "./baseentity";
import { ExplosiveEntity } from "./explosiveentity";
function getDamageRange(definitionId: number): number {
  switch (definitionId) {
    case Items.METAL_GATE:
      return 4.3;
    case Items.DOOR_WOOD:
    case Items.DOOR_METAL:
    case Items.DOOR_BASIC:
      return 2.5;
    default:
      return 2;
  }
}

function getMaxHealth(itemDefinitionId: Items): number {
  switch (itemDefinitionId) {
    case Items.METAL_GATE:
      return 1000000;
    case Items.DOOR_METAL:
      return 500000;
    case Items.DOOR_WOOD:
      return 250000;
    case Items.DOOR_BASIC:
      return 150000;
    default:
      return 1000000;
  }
}

export class ConstructionDoor extends DoorEntity {
  /** CharacterId of the player that owns the door entity */
  ownerCharacterId: string;

  /** Hashed password for the door */
  passwordHash: number = 0;

  /** List of all accessed players on a door entity: demolish permission also grants access */
  grantedAccess: Array<string> = [];

  /** The parent object the door entity is attached to */
  parentObjectCharacterId: string;

  /** ItemDefinitionId of the door */
  readonly itemDefinitionId: number;

  /** Current slot from the parent object the door is attached to */
  readonly slot: string;

  /** Range at which the door entity will receive damage from explosions */
  damageRange: number;

  /** Fixed position the door remains at while it's closed */
  readonly fixedPosition: Float32Array;

  /** Time (milliseconds) the door was placed at */
  placementTime = Date.now();

  /** Used to determine whether the parent object is secured - having the door open makes the parent object unsecured */
  isSecured = true;

  /** Used by DecayManager, determines if the entity will be damaged the next decay tick */
  isDecayProtected: boolean = false;

  constructor(
    characterId: string,
    transientId: number,
    actorModelId: number,
    position: Float32Array,
    rotation: Float32Array,
    server: ZoneServer2016,
    itemDefinitionId: number,
    ownerCharacterId: string,
    parentObjectCharacterId: string,
    slot: string
  ) {
    super(
      characterId,
      transientId,
      actorModelId,
      position,
      rotation,
      server,
      new Float32Array([1, 1, 1, 1]),
      0
    );
    this.ownerCharacterId = ownerCharacterId;
    this.itemDefinitionId = itemDefinitionId;
    this.parentObjectCharacterId = parentObjectCharacterId;
    this.slot = slot;
    this.profileId = CUSTOM_PROFILES_IDS.CONSTRUCTION; /// mark as construction

    this.maxHealth = getMaxHealth(itemDefinitionId);
    this.health = this.maxHealth;

    this.damageRange = getDamageRange(this.itemDefinitionId);
    this.fixedPosition = movePoint(
      this.state.position,
      -this.openAngle,
      this.itemDefinitionId == Items.DOOR_METAL ||
        this.itemDefinitionId == Items.DOOR_WOOD
        ? 0.625
        : 2.5
    );
    const itemDefinition = server.getItemDefinition(this.itemDefinitionId);
    if (itemDefinition) this.nameId = itemDefinition.NAME_ID;
    this.grantedAccess.push(ownerCharacterId);
    this.npcRenderDistance = 350;
    switch (this.itemDefinitionId) {
      case Items.METAL_GATE:
        this.interactionDistance = 5;
    }
  }

  damage(server: ZoneServer2016, damageInfo: DamageInfo) {
    this.health -= damageInfo.damage;
    server.updateResourceToAllWithSpawnedEntity(
      this.characterId,
      (this.health / this.maxHealth) * 1000000,
      ResourceIds.CONSTRUCTION_CONDITION,
      ResourceTypes.CONDITION,
      server._constructionDoors
    );
    if (damageInfo.damage > 0) {
      const timestamp = Date.now();
      const parentFoundation = this.getParentFoundation(server);
      if (parentFoundation) parentFoundation.lastDamagedTimestamp = timestamp;
    }

    if (this.health > 0) return;
    this.destroy(server, 3000);
  }

  destroy(server: ZoneServer2016, destructTime = 0): boolean {
    const deleted = server.deleteEntity(
      this.characterId,
      server._constructionDoors,
      242,
      destructTime
    );
    const parent = this.getParent(server);
    if (!parent) return deleted;

    if (parent.freeplaceEntities[this.characterId]) {
      delete parent.freeplaceEntities[this.characterId];
    }

    let slotMap: OccupiedSlotMap | undefined,
      updateSecured = false;
    switch (this.itemDefinitionId) {
      case Items.METAL_GATE:
      case Items.DOOR_BASIC:
      case Items.DOOR_WOOD:
      case Items.DOOR_METAL:
        slotMap = parent.occupiedWallSlots;
        updateSecured = true;
        parent.wallSlotsPlacementTimer[this.getSlotNumber()] =
          Date.now() + 30000;
        break;
    }
    if (slotMap) parent.clearSlot(this.getSlotNumber(), slotMap);
    if (updateSecured) parent.updateSecuredState(server);
    return deleted;
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

  getParent(server: ZoneServer2016): ConstructionChildEntity | undefined {
    return (
      server._constructionSimple[this.parentObjectCharacterId] ||
      server._constructionFoundations[this.parentObjectCharacterId]
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

  getSlotNumber() {
    if (!this.slot) return 0;
    return getConstructionSlotId(this.slot);
  }

  OnPlayerSelect(
    server: ZoneServer2016,
    client: ZoneClient2016,
    isInstant?: boolean
  ) {
    if (this.canUndoPlacement(server, client)) {
      this.destroy(server);
      client.character.lootItem(
        server,
        server.generateItem(this.itemDefinitionId)
      );
      return;
    }

    if (isInstant) {
      if (
        this.passwordHash == 0 ||
        this.grantedAccess.includes(client.character.characterId) ||
        client.character.characterId === this.ownerCharacterId ||
        this.getHasPermission(
          server,
          client.character.characterId,
          ConstructionPermissionIds.CONTAINERS // Container permissions player is able to open constructiondoors
        ) ||
        (client.isAdmin && client.isDebugMode) // debug mode open all doors/gates
      ) {
        if (this.moving) {
          return;
        }
        this.moving = true;
        // eslint-disable-next-line
        const door = this; // for setTimeout callback
        setTimeout(function () {
          door.moving = false;
        }, 1000);
        server.sendDataToAllWithSpawnedEntity(
          server._constructionDoors,
          this.characterId,
          "PlayerUpdatePosition",
          {
            transientId: this.transientId,
            positionUpdate: {
              sequenceTime: 0,
              unknown3_int8: 0,
              position: this.state.position,
              orientation: this.isOpen ? this.closedAngle : this.openAngle
            }
          }
        );
        server.sendDataToAllWithSpawnedEntity(
          server._constructionDoors,
          this.characterId,
          "Command.PlayDialogEffect",
          {
            characterId: this.characterId,
            effectId: this.isOpen ? this.closeSound : this.openSound
          }
        );
        this.isOpen = !this.isOpen;
        this.isSecured = !this.isOpen;
        const parent = this.getParent(server);
        if (parent) {
          parent.updateSecuredState(server);
          // spawn hidden characters immediately after door opens
          const allowedConstruction = [
            Items.SHELTER,
            Items.SHELTER_LARGE,
            Items.SHELTER_UPPER,
            Items.SHELTER_UPPER_LARGE,
            Items.SHACK,
            Items.SHACK_BASIC,
            Items.SHACK_SMALL
          ];
          if (
            this.isOpen &&
            allowedConstruction.includes(parent.itemDefinitionId)
          ) {
            for (const a in server._clients) {
              const client = server._clients[a];
              if (client.character.isHidden == parent.characterId)
                server.constructionManager.constructionPermissionsManager(
                  server,
                  client
                );
            }
          }
        }
        return;
      } else {
        server.sendData(client, "Locks.ShowMenu", {
          characterId: client.character.characterId,
          unknownDword1: 2,
          lockType: 2,
          objectCharacterId: this.characterId
        });
        return;
      }
    } else if (!isInstant) {
      if (
        client.character.characterId === this.ownerCharacterId ||
        this.getHasPermission(
          server,
          client.character.characterId,
          ConstructionPermissionIds.DEMOLISH
        )
      ) {
        server.sendData(client, "Locks.ShowMenu", {
          characterId: client.character.characterId,
          unknownDword1: 2,
          lockType: 1,
          objectCharacterId: this.characterId
        });
        return;
      } else if (!this.grantedAccess.includes(client.character.characterId)) {
        server.sendData(client, "Locks.ShowMenu", {
          characterId: client.character.characterId,
          unknownDword1: 2,
          lockType: 2,
          objectCharacterId: this.characterId
        });
      }
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
    if (
      client.character.characterId === this.ownerCharacterId ||
      this.getHasPermission(
        server,
        client.character.characterId,
        ConstructionPermissionIds.DEMOLISH
      )
    ) {
      server.sendData(client, "Command.InteractionString", {
        guid: this.characterId,
        stringId: StringIds.OPEN_AND_LOCK
      });
    } else if (!this.grantedAccess.includes(client.character.characterId)) {
      server.sendData(client, "Command.InteractionString", {
        guid: this.characterId,
        stringId: StringIds.ENTER_ACCESS_CODE
      });
    } else {
      server.sendData(client, "Command.InteractionString", {
        guid: this.characterId,
        stringId: StringIds.OPEN
      });
    }
  }

  OnProjectileHit() {
    // do nothing for now
  }

  OnMeleeHit(server: ZoneServer2016, damageInfo: DamageInfo) {
    server.constructionManager.OnMeleeHit(server, damageInfo, this);
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
    const itemDefinitionId =
      sourceEntity instanceof ExplosiveEntity
        ? sourceEntity.itemDefinitionId
        : 0;

    if (
      !isPosInRadius(
        this.damageRange,
        this.fixedPosition ? this.fixedPosition : this.state.position,
        sourceEntity.state.position
      )
    ) {
      return;
    }
    if (server.constructionManager.isConstructionInSecuredArea(server, this)) {
      if (useRaycast) {
        if (!client) return;
        server.constructionManager.sendBaseSecuredMessage(server, client);
        return;
      } else {
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
      this.fixedPosition ? this.fixedPosition : this.state.position,
      itemDefinitionId
    );
  }
}
