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

import { DoorEntity } from "./doorentity";
import { ConstructionPermissionIds, Items, StringIds } from "../models/enums";
import { ZoneServer2016 } from "../zoneserver";
import { ZoneClient2016 } from "../classes/zoneclient";
import { DamageInfo, OccupiedSlotMap } from "types/zoneserver";
import { getConstructionSlotId, movePoint } from "../../../utils/utils";
import { ConstructionParentEntity } from "./constructionparententity";
import { ConstructionChildEntity } from "./constructionchildentity";
function getDamageRange(definitionId: number): number {
  switch (definitionId) {
    case Items.METAL_GATE:
      return 4.3;
    case Items.DOOR_WOOD:
    case Items.DOOR_METAL:
    case Items.DOOR_BASIC:
      return 1.5;
    default:
      return 1.5;
  }
}

export class ConstructionDoor extends DoorEntity {
  ownerCharacterId: string;
  passwordHash: number = 0;
  grantedAccess: Array<string> = [];
  health: number = 1000000;
  parentObjectCharacterId: string;
  readonly itemDefinitionId: number;
  readonly slot: string;
  damageRange: number;
  readonly fixedPosition: Float32Array;
  placementTime = Date.now();
  isSecured = true;
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
    this.profileId = 999; /// mark as construction
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
    this.npcRenderDistance = 750;
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
      server._constructionDoors,
      242,
      destructTime
    );
    const parent = this.getParent(server);
    if (!parent) return;

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
        break;
    }
    if (slotMap) parent.clearSlot(this.getSlotNumber(), slotMap);
    if (updateSecured) parent.updateSecuredState(server);
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
              orientation: this.isOpen ? this.closedAngle : this.openAngle,
            },
          }
        );
        server.sendDataToAllWithSpawnedEntity(
          server._constructionDoors,
          this.characterId,
          "Command.PlayDialogEffect",
          {
            characterId: this.characterId,
            effectId: this.isOpen ? this.closeSound : this.openSound,
          }
        );
        this.isOpen = !this.isOpen;
        this.isSecured = !this.isOpen;
        const parent = this.getParent(server);
        if (parent) {
          parent.updateSecuredState(server);
          // spawn hidden characters emmediately after door opens
          const allowedConstruction = [
            Items.SHELTER,
            Items.SHELTER_LARGE,
            Items.SHELTER_UPPER,
            Items.SHELTER_UPPER_LARGE,
            Items.SHACK,
            Items.SHACK_BASIC,
            Items.SHACK_SMALL,
          ];
          if (
            this.isOpen &&
            allowedConstruction.includes(parent.itemDefinitionId)
          ) {
            for (const a in server._clients) {
              const client = server._clients[a];
              if (client.character.isHidden == parent.characterId)
                server.constructionManager(client);
            }
          }
        }
        return;
      } else {
        server.sendData(client, "Locks.ShowMenu", {
          characterId: client.character.characterId,
          unknownDword1: 2,
          lockType: 2,
          objectCharacterId: this.characterId,
        });
        return;
      }
    } else if (!isInstant) {
      if (client.character.characterId === this.ownerCharacterId) {
        server.sendData(client, "Locks.ShowMenu", {
          characterId: client.character.characterId,
          unknownDword1: 2,
          lockType: 1,
          objectCharacterId: this.characterId,
        });
        return;
      } else if (!this.grantedAccess.includes(client.character.characterId)) {
        server.sendData(client, "Locks.ShowMenu", {
          characterId: client.character.characterId,
          unknownDword1: 2,
          lockType: 2,
          objectCharacterId: this.characterId,
        });
      }
    }
  }

  OnInteractionString(server: ZoneServer2016, client: ZoneClient2016) {
    if (this.canUndoPlacement(server, client)) {
      server.undoPlacementInteractionString(this, client);
      return;
    }
    if (
      client.character.characterId === this.ownerCharacterId ||
      !this.grantedAccess.includes(client.character.characterId)
    ) {
      server.sendData(client, "Command.InteractionString", {
        guid: this.characterId,
        stringId: StringIds.OPEN_AND_LOCK,
      });
    } else {
      server.sendData(client, "Command.InteractionString", {
        guid: this.characterId,
        stringId: StringIds.OPEN,
      });
    }
  }
}
