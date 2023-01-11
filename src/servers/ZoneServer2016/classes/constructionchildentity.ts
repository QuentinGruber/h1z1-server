//   copyright (C) 2021 - 2023 H1emu community
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
  OccupiedSlotMap,
  SlottedConstructionEntity,
  SquareBounds,
} from "types/zoneserver";
import {
  getConstructionSlotId,
  getRectangleCorners,
  isInsideCube,
  movePoint,
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
import { LootableConstructionEntity } from "./lootableconstructionentity";
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
  itemDefinitionId: number;
  parentObjectCharacterId: string;
  eulerAngle: number;
  slot: string;
  isSecured = false;
  damageRange: number;
  fixedPosition?: Float32Array;
  placementTime = Date.now();
  bounds?: SquareBounds;

  // FOR DOORS ON SHELTERS / DOORWAYS / LOOKOUT
  readonly wallSlots: ConstructionSlotPositionMap = {};
  occupiedWallSlots: {
    [slot: number]: ConstructionDoor | ConstructionChildEntity;
  } = {};

  // FOR UPPER WALL ON WALLS / DOORWAYS
  readonly upperWallSlots: ConstructionSlotPositionMap = {};
  occupiedUpperWallSlots: { [slot: number]: ConstructionChildEntity } = {};
  readonly shelterSlots: ConstructionSlotPositionMap = {};
  occupiedShelterSlots: {
    [slot: number]: ConstructionDoor | ConstructionChildEntity;
  } = {};

  freeplaceEntities: {[characterId: string]: ConstructionChildEntity | ConstructionDoor | LootableConstructionEntity} = {};

  constructor(
    characterId: string,
    transientId: number,
    actorModelId: number,
    position: Float32Array,
    rotation: Float32Array,
    itemDefinitionId: number,
    parentObjectCharacterId: string,
    slot: string
  ) {
    super(characterId, transientId, actorModelId, position, rotation);
    this.state.rotation = eul2quat(rotation);
    this.eulerAngle = rotation[0];
    this.itemDefinitionId = itemDefinitionId;
    this.parentObjectCharacterId = parentObjectCharacterId;
    this.slot = slot;
    this.profileId = 999; /// mark as construction
    this.damageRange = getDamageRange(this.itemDefinitionId);

    registerConstructionSlots(this, this.wallSlots, wallSlotDefinitions);
    Object.seal(this.wallSlots);
    registerConstructionSlots(
      this,
      this.upperWallSlots,
      upperWallSlotDefinitions
    );
    Object.seal(this.upperWallSlots);
    registerConstructionSlots(this, this.shelterSlots, shelterSlotDefinitions);
    Object.seal(this.shelterSlots);

    const angle = -this.eulerAngle;
    switch (itemDefinitionId) {
      case Items.SHELTER_LARGE:
      case Items.SHELTER_UPPER_LARGE:
        const centerPoint = movePoint(
          position,
          angle + (90 * Math.PI) / 180,
          2.5
        );
        this.fixedPosition = centerPoint;
        this.bounds = getRectangleCorners(centerPoint, 10, 5, angle);
        break;
      case Items.SHELTER:
      case Items.SHELTER_UPPER:
        this.bounds = getRectangleCorners(position, 5, 5, angle);
        break;
    }
  }

  getSlotPosition(
    slot: string | number,
    slots: ConstructionSlotPositionMap
  ): Float32Array | undefined {
    if (typeof slot == "string") {
      slot = getConstructionSlotId(slot);
    }
    if (slot == 101) slot = 1; // upper wall slot
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
    switch (this.itemDefinitionId) {
      case Items.METAL_DOORWAY: // for parent foundation
        const parent = this.getParentFoundation(server);
        if (!parent) return;
        parent.updateSecuredState(server);
        break;
      case Items.SHELTER_LARGE:
      case Items.SHELTER_UPPER_LARGE:
      case Items.SHELTER:
      case Items.SHELTER_UPPER:
        const doorslot = this.occupiedWallSlots[1];
        if (
          !doorslot ||
          !(doorslot instanceof ConstructionDoor) ||
          doorslot.isOpen
        ) {
          this.isSecured = false;
          return;
        }
        this.isSecured = true;
        break;
    }
  }

  isSlotOccupied(slotMap: OccupiedSlotMap, slot: number): boolean {
    return !!slotMap[slot];
  }

  isSlotsEmpty() {
    return (
      Object.values(this.occupiedShelterSlots).length +
        Object.values(this.occupiedUpperWallSlots).length +
        Object.values(this.occupiedWallSlots).length ==
      0
    );
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
    definitions: ConstructionSlots,
    slotMap: ConstructionSlotPositionMap,
    occupiedSlots: OccupiedSlotMap
  ) {
    const slot = entity.getSlotNumber();
    if (!this.isSlotValid(slot, definitions, slotMap, entity.itemDefinitionId))
      return false;
    occupiedSlots[slot] = entity;
    return true;
  }

  clearSlot(slot: number, occupiedSlots: OccupiedSlotMap) {
    delete occupiedSlots[slot];
  }

  isWallSlotValid(buildingSlot: number | string, itemDefinitionId: number) {
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
      return this.setSlot(
        wall,
        upperWallSlotDefinitions,
        this.upperWallSlots,
        this.occupiedUpperWallSlots
      );
    }
    const set = this.setSlot(
      wall,
      wallSlotDefinitions,
      this.wallSlots,
      this.occupiedWallSlots
    );
    if (set) this.updateSecuredState(server);
    return set;
  }

  isShelterSlotValid(buildingSlot: number | string, itemDefinitionId: number) {
    let slot = 0;
    if (typeof buildingSlot == "string") {
      slot = getConstructionSlotId(buildingSlot);
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
    const set = this.setSlot(
      shelter,
      shelterSlotDefinitions,
      this.shelterSlots,
      this.occupiedShelterSlots
    );
    if (set) this.updateSecuredState(server);
    return set;
  }

  addFreeplaceConstruction(entity: ConstructionChildEntity | ConstructionDoor | LootableConstructionEntity) {
    this.freeplaceEntities[entity.characterId] = entity;
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

  isInside(position: Float32Array) {
    if (!this.bounds) {
      console.error(
        `ERROR: CONSTRUCTION BOUNDS IS NOT DEFINED FOR ${this.itemDefinitionId} ${this.characterId}`
      );
      return false; // this should never occur
    }

    switch (this.itemDefinitionId) {
      case Items.SHELTER_LARGE:
      case Items.SHELTER_UPPER_LARGE:
      case Items.SHELTER:
      case Items.SHELTER_UPPER:
        return isInsideCube(
          [position[0], position[2]],
          this.bounds,
          position[1],
          this.state.position[1],
          2
        );
      default:
        return false;
    }
  }

  destroy(server: ZoneServer2016, destructTime = 0) {
    server.deleteEntity(
      this.characterId,
      server._constructionSimple,
      242,
      destructTime
    );
    const parent = this.getParent(server);
    if (!parent) return;

    let slotMap: OccupiedSlotMap | undefined,
      updateSecured = false;
    let freeplace: Array<ConstructionChildEntity | ConstructionDoor> = [];
    switch (this.itemDefinitionId) {
      case Items.METAL_GATE:
      case Items.DOOR_BASIC:
      case Items.DOOR_WOOD:
      case Items.DOOR_METAL:
      case Items.METAL_WALL:
      case Items.METAL_DOORWAY:
        freeplace = [...Object.values(this.occupiedWallSlots)];
        freeplace = [...freeplace, ...Object.values(this.occupiedUpperWallSlots)];
        slotMap = parent.occupiedWallSlots;
        updateSecured = true;
        break;
      case Items.METAL_WALL_UPPER:
        slotMap = parent.occupiedUpperWallSlots;
        break;
      case Items.SHELTER:
      case Items.SHELTER_LARGE:
      case Items.SHELTER_UPPER:
      case Items.SHELTER_UPPER_LARGE:
      case Items.STRUCTURE_STAIRS:
      case Items.STRUCTURE_STAIRS_UPPER:
      case Items.LOOKOUT_TOWER:
        freeplace = [...Object.values(this.occupiedShelterSlots)];
        slotMap = parent.occupiedShelterSlots;
        break;
      case Items.FOUNDATION_RAMP:
      case Items.FOUNDATION_STAIRS:
        slotMap = parent.occupiedRampSlots;
        break;
    }
    if (slotMap) parent.clearSlot(this.getSlotNumber(), slotMap);
    if (updateSecured) parent.updateSecuredState(server);

    // re-register now disconnected slotted entities as freeplace entities
    const parentFoundation = this.getParentFoundation(server);
    if(parentFoundation) {
      freeplace.forEach((entity) => {
        entity.parentObjectCharacterId = parentFoundation.characterId;
        parentFoundation.freeplaceEntities[entity.characterId] = entity;
      })
      parentFoundation.freeplaceEntities = {...parentFoundation.freeplaceEntities, ...this.freeplaceEntities}
    }
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

  getSlotNumber(): number {
    if (!this.slot) return 0;
    return getConstructionSlotId(this.slot);
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
