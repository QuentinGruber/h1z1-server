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
import {
  ConstructionSlotPositionMap,
  DamageInfo,
  SlottedConstructionEntity,
} from "types/zoneserver";
import {
  getConstructionSlotId,
  isArraySumZero,
  registerConstructionSlots,
} from "../../../utils/utils";
import { ZoneClient2016 } from "./zoneclient";
import { ConstructionParentEntity } from "./constructionparententity";
import { eul2quat } from "h1emu-core";
import {
  ConstructionSlots,
  shelterSlotDefinitions,
  upperWallSlotDefinitions,
  wallSlotDefinitions,
} from "../data/constructionslots";
import { ConstructionDoor } from "./constructiondoor";
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
  // FOR DOORS ON SHELTERS / DOORWAYS / LOOKOUT
  readonly wallSlots: ConstructionSlotPositionMap = {};
  occupiedWallSlots: { [slot: string]: ConstructionDoor } = {};

  // FOR UPPER WALL ON WALLS / DOORWAYS
  readonly upperWallSlots: ConstructionSlotPositionMap = {};
  occupiedUpperWallSlots: { [slot: string]: ConstructionChildEntity } = {};
  
  readonly shelterSlots: ConstructionSlotPositionMap = {};
  occupiedShelterSlots: { [slot: string]: ConstructionDoor } = {};
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

    registerConstructionSlots(this, this.wallSlots, wallSlotDefinitions);
    Object.seal(this.wallSlots);
    registerConstructionSlots(
      this,
      this.upperWallSlots,
      upperWallSlotDefinitions
    );
    Object.seal(this.upperWallSlots);
    registerConstructionSlots(
      this,
      this.shelterSlots,
      shelterSlotDefinitions
    );
    Object.seal(this.shelterSlots);
  }

  getSlotPosition(
    buildingSlot: string,
    slots: ConstructionSlotPositionMap,
    isShelter?: boolean
  ): Float32Array | undefined {
    let slot = getConstructionSlotId(buildingSlot);
    if (slot == 101) slot = 1; // upper wall slot
    if(isShelter) {
      if(this.itemDefinitionId == Items.GROUND_TAMPER) {
        switch (true) {
          case slot >= 11 && slot <= 14:
            slot = slot - 6
            break
          case slot >= 21 && slot <= 24:
            slot = slot - 12
            break
          case slot >= 31 && slot <= 34:
            slot = slot - 18
            break
        }
      }
      else if(this.itemDefinitionId == Items.FOUNDATION) {
        switch (true) {
          case slot >= 11 && slot <= 13:
            slot = slot - 6
            break
          case slot >= 21 && slot <= 23:
            slot = slot - 12
            break
        }
      }
    }
    return slots[slot]?.position || undefined;
  }

  getSlotRotation(
    buildingSlot: string,
    slots: ConstructionSlotPositionMap
  ): Float32Array | undefined {
    let slot = getConstructionSlotId(buildingSlot);
    if (slot == 101) slot = 1; // upper wall slot
    return slots[slot]?.rotation || undefined;
  }

  updateSecuredState(server: ZoneServer2016) {
    // TODO:
    // ONLY NEED SECURED LOGIC FOR SHELTERS
  }

  protected isSlotValid(
    slot: number,
    definitions: ConstructionSlots,
    slotMap: ConstructionSlotPositionMap,
    itemDefinitionId: number
  ) {
    const slots = definitions[this.itemDefinitionId];
    if (!slots || !slots.authorizedItems.includes(itemDefinitionId)) {
      return false;
    }
    return !!slotMap[slot];
  }

  protected setSlot(
    entity: SlottedConstructionEntity,
    occupiedSlots: { [slot: string]: SlottedConstructionEntity }
  ) {
    const slot = entity.getSlotNumber();
    if (!this.isWallSlotValid(slot, entity.itemDefinitionId)) return false;
    occupiedSlots[slot] = entity;
    return true;
  }

  isWallSlotValid(buildingSlot: number | string, itemDefinitionId: number) {
    console.log(buildingSlot);
    let slot = 0;
    if (typeof buildingSlot == "string") {
      slot = getConstructionSlotId(buildingSlot);
    }
    if (slot == 101) {
      // UPPER WALLS
      return this.isSlotValid(
        1,
        upperWallSlotDefinitions,
        this.upperWallSlots,
        itemDefinitionId
      );
    }
    return this.isSlotValid(
      slot,
      wallSlotDefinitions,
      this.wallSlots,
      itemDefinitionId
    );
  }

  setWallSlot(
    server: ZoneServer2016,
    wall: ConstructionChildEntity | ConstructionDoor
  ): boolean {
    if (wall.itemDefinitionId == Items.METAL_WALL_UPPER) {
      return this.setSlot(wall, this.occupiedUpperWallSlots);
    }
    const set = this.setSlot(wall, this.occupiedWallSlots);
    if (set) this.updateSecuredState(server);
    return set;
  }

  isShelterSlotValid(buildingSlot: number | string, itemDefinitionId: number) {
    console.log(buildingSlot);
    let slot = 0;
    if (typeof buildingSlot == "string") {
      slot = getConstructionSlotId(buildingSlot);
    }
    if(this.itemDefinitionId == Items.GROUND_TAMPER) {
      switch (true) {
        case slot >= 11 && slot <= 14:
          slot = slot - 6
          break
        case slot >= 21 && slot <= 24:
          slot = slot - 12
          break
        case slot >= 31 && slot <= 34:
          slot = slot - 18
          break
      }
    }
    else if(this.itemDefinitionId == Items.FOUNDATION) {
      switch (true) {
        case slot >= 11 && slot <= 13:
          slot = slot - 6
          break
        case slot >= 21 && slot <= 23:
          slot = slot - 12
          break
      }
    }
    return this.isSlotValid(
      slot,
      shelterSlotDefinitions,
      this.shelterSlots,
      itemDefinitionId
    );
  }

  setShelterSlot(
    server: ZoneServer2016,
    shelter: ConstructionChildEntity
  ): boolean {
    const set = this.setSlot(shelter, this.occupiedShelterSlots);
    if (set) this.updateSecuredState(server);
    return set;
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
    const parent =
      server._constructionFoundations[this.parentObjectCharacterId] ||
      server._constructionSimple[this.parentObjectCharacterId];
    if (!parent) return;
    if (this.itemDefinitionId == Items.METAL_WALL) {
      parent.changePerimeters(
        server,
        this.buildingSlot,
        new Float32Array([0, 0, 0, 0])
      );
    }
    if (!this.slot || !this.parentObjectCharacterId) return;
    const index = parent.occupiedSlots.indexOf(this.slot);
    parent.occupiedSlots.splice(index, 1);
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

  getSlotNumber() {
    if (!this.buildingSlot) return 0;
    return getConstructionSlotId(this.buildingSlot);
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
