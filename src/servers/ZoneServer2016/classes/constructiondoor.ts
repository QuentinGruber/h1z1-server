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

import { DoorEntity } from "./doorentity";
import { Items, StringIds } from "../models/enums";
import { ZoneServer2016 } from "../zoneserver";
import { ZoneClient2016 } from "./zoneclient";
import { DamageInfo } from "types/zoneserver";
import { movePoint } from "../../../utils/utils";
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
  password: number = 0;
  grantedAccess: any = [];
  health: number = 1000000;
  parentObjectCharacterId: string;
  buildingSlot: string;
  itemDefinitionId: number;
  slot?: string;
  damageRange: number;
  fixedPosition: Float32Array;
  placementTime = Date.now();
  constructor(
    characterId: string,
    transientId: number,
    actorModelId: number,
    position: Float32Array,
    rotation: Float32Array,
    scale: Float32Array,
    itemDefinitionId: number,
    ownerCharacterId: string,
    parentObjectCharacterId: string,
    BuildingSlot: string
  ) {
    super(
      characterId,
      transientId,
      actorModelId,
      position,
      rotation,
      new Float32Array(scale),
      0
    );
    this.ownerCharacterId = ownerCharacterId;
    this.itemDefinitionId = itemDefinitionId;
    this.parentObjectCharacterId = parentObjectCharacterId;
    this.buildingSlot = BuildingSlot.substring(
      BuildingSlot.length,
      BuildingSlot.length - 2
    ).toString();
    this.slot = BuildingSlot;
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
  }
  getPlacementOwner(server: ZoneServer2016): string {
    return this.ownerCharacterId || "";
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
    server.deleteEntity(this.characterId, server._constructionDoors, 242, destructTime);
    const foundation = server._constructionFoundations[
      this.parentObjectCharacterId
    ]
      ? server._constructionFoundations[
        this.parentObjectCharacterId
        ]
      : server._constructionSimple[this.parentObjectCharacterId];
    if (!foundation) return;
    if (
      this.itemDefinitionId == Items.DOOR_METAL ||
      this.itemDefinitionId == Items.DOOR_WOOD ||
      this.itemDefinitionId == Items.METAL_GATE
    ) {
      foundation.changePerimeters(
        server,
        this.buildingSlot,
        new Float32Array([0, 0, 0, 0])
      );
    }
    if (!this.slot || !this.parentObjectCharacterId)
      return;
    const index = foundation.occupiedSlots.indexOf(this.slot);
    foundation.occupiedSlots.splice(index, 1);
  }

  canUndoPlacement(server: ZoneServer2016, client: ZoneClient2016) {
    return client.character.characterId == this.getPlacementOwner(server) &&
    Date.now() < this.placementTime + 120000 && 
    client.character.getEquippedWeapon().itemDefinitionId == Items.WEAPON_HAMMER_DEMOLITION
  }

  OnPlayerSelect(server: ZoneServer2016, client: ZoneClient2016) {
    if(this.canUndoPlacement(server, client)) {
      this.destroy(server);
      client.character.lootItem(server, server.generateItem(this.itemDefinitionId))
      return;
    }

    if (
      this.password != 0 &&
      this.ownerCharacterId != client.character.characterId &&
      !this.grantedAccess.includes(client.character.characterId)
    ) {
      server.sendData(client, "Locks.ShowMenu", {
        characterId: client.character.characterId,
        unknownDword1: 2,
        lockType: 2,
        objectCharacterId: this.characterId,
      });
      return;
    }
    if (
      this.password == 0 &&
      this.ownerCharacterId === client.character.characterId
    ) {
      server.sendData(client, "Locks.ShowMenu", {
        characterId: client.character.characterId,
        unknownDword1: 2,
        lockType: 1,
        objectCharacterId: this.characterId,
      });
      return;
    }
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
    if (server._constructionFoundations[this.parentObjectCharacterId]) {
      this.isOpen
        ? server._constructionFoundations[
            this.parentObjectCharacterId
          ].changePerimeters(
            server,
            this.buildingSlot,
            new Float32Array([0, 0, 0, 0])
          )
        : server._constructionFoundations[
            this.parentObjectCharacterId
          ].changePerimeters(server, this.buildingSlot, this.state.position);
    } else if (server._constructionSimple[this.parentObjectCharacterId]) {
      this.isOpen
        ? server._constructionSimple[
            this.parentObjectCharacterId
          ].changePerimeters(
            server,
            "LoveShackDoor",
            new Float32Array([0, 0, 0, 0])
          )
        : server._constructionSimple[
            this.parentObjectCharacterId
          ].changePerimeters(server, "LoveShackDoor", this.state.position);
    }
  }

  OnInteractionString(server: ZoneServer2016, client: ZoneClient2016) {
    if (this.canUndoPlacement(server, client)) {
      server.undoPlacementInteractionString(this, client);
      return;
    }
    server.sendData(client, "Command.InteractionString", {
      guid: this.characterId,
      stringId: StringIds.OPEN_AND_LOCK,
    });
  }
}
