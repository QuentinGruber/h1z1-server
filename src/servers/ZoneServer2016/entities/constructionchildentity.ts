//   copyright (C) 2021 - 2023 H1emu community
//
//   https://github.com/QuentinGruber/h1z1-server
//   https://www.npmjs.com/package/h1z1-server
//
//   Based on https://github.com/psemu/soe-network
// ======================================================================

function getRenderDistance(itemDefinitionId: number) {
  let range: number = 0;
  switch (itemDefinitionId) {
    case Items.SHACK:
    case Items.SHACK_SMALL:
    case Items.SHACK_BASIC:
    case Items.FOUNDATION:
    case Items.FOUNDATION_EXPANSION:
    case Items.GROUND_TAMPER:
    case Items.METAL_DOORWAY:
    case Items.METAL_WALL:
    case Items.METAL_WALL_UPPER:
    case Items.DOOR_BASIC:
    case Items.DOOR_METAL:
    case Items.DOOR_WOOD:
    case Items.SHELTER:
    case Items.SHELTER_LARGE:
    case Items.SHELTER_UPPER:
    case Items.SHELTER_UPPER_LARGE:
    case Items.METAL_GATE:
    case Items.STRUCTURE_STAIRS:
    case Items.STRUCTURE_STAIRS_UPPER:
      range = 420;
      break;
    case Items.FURNACE:
    case Items.WORKBENCH:
    case Items.WORKBENCH_WEAPON:
    case Items.BEE_BOX:
    case Items.DEW_COLLECTOR:
      range = 420;
      break;
    case Items.STORAGE_BOX:
    case Items.ANIMAL_TRAP:
      range = 20;
      break;
    default:
      range = 420;
      break;
  }
  return range;
}

import { BaseLightweightCharacter } from "./baselightweightcharacter";
import { ZoneServer2016 } from "../zoneserver";
import {
  ConstructionPermissionIds,
  Effects,
  Items,
  ResourceIds,
  StringIds
} from "../models/enums";
import {
  ConstructionSlotPositionMap,
  DamageInfo,
  OccupiedSlotMap,
  SlottedConstructionEntity,
  CubeBounds,
  Point3D
} from "types/zoneserver";
import {
  getConstructionSlotId,
  getCubeBounds,
  isInsideCube,
  isPosInRadius,
  movePoint,
  registerConstructionSlots
} from "../../../utils/utils";
import { ZoneClient2016 } from "../classes/zoneclient";
import { ConstructionParentEntity } from "./constructionparententity";
import {
  ConstructionSlots,
  shelterSlotDefinitions,
  upperWallSlotDefinitions,
  wallSlotDefinitions
} from "../data/constructionslots";
import { ConstructionDoor } from "./constructiondoor";
import { LootableConstructionEntity } from "./lootableconstructionentity";
import { BaseEntity } from "./baseentity";
import { ExplosiveEntity } from "./explosiveentity";
function getDamageRange(definitionId: Items): number {
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

function getMaxHealth(itemDefinitionId: Items): number {
  switch (itemDefinitionId) {
    case Items.SHELTER:
    case Items.SHELTER_LARGE:
    case Items.SHELTER_UPPER:
    case Items.SHELTER_UPPER_LARGE:
    case Items.STRUCTURE_STAIRS:
    case Items.STRUCTURE_STAIRS_UPPER:
    case Items.LOOKOUT_TOWER:
    case Items.METAL_WALL:
    case Items.METAL_WALL_UPPER:
    case Items.METAL_DOORWAY:
    case Items.FOUNDATION_RAMP:
    case Items.FOUNDATION_STAIRS:
      return 1000000;
    case Items.WORKBENCH:
    case Items.WORKBENCH_WEAPON:
      return 500000;
    default:
      return 10000;
  }
}

function getInteractionDistance(itemDefinitionId: Items): number {
  switch (itemDefinitionId) {
    case Items.SHELTER_LARGE:
    case Items.SHELTER_UPPER_LARGE:
    case Items.LOOKOUT_TOWER:
    case Items.FOUNDATION_RAMP:
    case Items.FOUNDATION_STAIRS:
      return 6;
    default:
      return 4;
  }
}

export class ConstructionChildEntity extends BaseLightweightCharacter {
  /** Id of the ConstructionChildEntity - See ServerItemDefinitions.json for more information */
  readonly itemDefinitionId: number;

  /** The parent object the ConstructionChildEntity is attached to */
  parentObjectCharacterId: string;

  /** Used for manipulating the X, Y, and Z axes for the ConstructionChildEntity */
  eulerAngle: number;

  /** The sockets the ConstructionChildEntity is occupying */
  readonly slot: string;

  /** Returns true if the ConstructionChildEntity is secured by a door */
  isSecured: boolean;

  /** Range that the ConstructionChildEntity will take damage from explosives */
  readonly damageRange: number;

  /** Static position of the ConstructionChildEntity */
  readonly fixedPosition?: Float32Array;

  /** Time (milliseconds) the ConstructionChildEntity was placed */
  placementTime = Date.now();

  /** 3d boundaries of the space the ConstructionParentEntity occupies (8 vertice points) */
  readonly cubebounds?: CubeBounds;
  readonly boundsOn?: CubeBounds;

  /** Time (milliseconds) the player has to undo placement on the ConstructionChildEntity */
  undoPlacementTime = 600000;
  destroyedEffect: number = Effects.PFX_Death_Barricade01;

  /** Used by DecayManager, determines if the entity will be damaged the next decay tick */
  isDecayProtected: boolean = false;

  /** FOR DOORS ON SHELTERS / DOORWAYS / LOOKOUT */
  readonly wallSlots: ConstructionSlotPositionMap = {};
  occupiedWallSlots: {
    [slot: number]: ConstructionDoor | ConstructionChildEntity;
  } = {};

  /** FOR UPPER WALL ON WALLS / DOORWAYS */
  readonly upperWallSlots: ConstructionSlotPositionMap = {};
  occupiedUpperWallSlots: { [slot: number]: ConstructionChildEntity } = {};
  readonly shelterSlots: ConstructionSlotPositionMap = {};
  occupiedShelterSlots: { [slot: number]: ConstructionChildEntity } = {};

  /** Objects that don't occupy any sockets inside of the ConstructionChildEntity,
   * uses CharacterId (string) for indexing */
  freeplaceEntities: {
    [characterId: string]:
      | ConstructionChildEntity
      | ConstructionDoor
      | LootableConstructionEntity;
  } = {};

  constructor(
    characterId: string,
    transientId: number,
    actorModelId: number,
    position: Float32Array,
    rotation: Float32Array,
    server: ZoneServer2016,
    itemDefinitionId: number,
    parentObjectCharacterId: string,
    slot: string,
    overrideEulerAngle?: number
  ) {
    super(characterId, transientId, actorModelId, position, rotation, server);

    if (overrideEulerAngle) {
      this.state.rotation = rotation;
      this.eulerAngle = overrideEulerAngle;
    } else {
      this.state.rotation = rotation;
      this.eulerAngle = rotation[1];
    }
    this.itemDefinitionId = itemDefinitionId;
    this.parentObjectCharacterId = parentObjectCharacterId;
    this.slot = slot;
    this.profileId = 999; /// mark as construction
    this.damageRange = getDamageRange(this.itemDefinitionId);
    this.isSecured = this.itemDefinitionId == Items.METAL_WALL ? true : false;
    this.npcRenderDistance = getRenderDistance(this.itemDefinitionId);
    this.interactionDistance = getInteractionDistance(this.itemDefinitionId);
    this.useSimpleStruct = true;

    this.maxHealth = getMaxHealth(this.itemDefinitionId);
    this.health = this.maxHealth;

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

    const angle = -this.state.rotation[1];
    switch (itemDefinitionId) {
      case Items.SHELTER_LARGE:
      case Items.SHELTER_UPPER_LARGE:
        const centerPoint = movePoint(
          position,
          angle + (90 * Math.PI) / 180,
          2.5
        );
        this.fixedPosition = centerPoint;

        this.cubebounds = getCubeBounds(
          centerPoint,
          10,
          5,
          angle,
          position[1],
          position[1] + 1.8
        );

        const pos = position[1] + 2.4;
        this.boundsOn = getCubeBounds(
          centerPoint,
          10,
          5,
          angle,
          pos,
          pos + 1.8
        );

        break;
      case Items.SHELTER:
      case Items.SHELTER_UPPER:
        this.cubebounds = getCubeBounds(
          position,
          5,
          5,
          angle,
          position[1],
          position[1] + 1.8
        );

        const p = position[1] + 2.4;
        this.boundsOn = getCubeBounds(position, 5, 5, angle, p, p + 1.8);

        break;
    }

    const itemDefinition = server.getItemDefinition(this.itemDefinitionId);
    if (itemDefinition) this.nameId = itemDefinition.NAME_ID;
  }

  getOccupiedSlotMaps(): Array<OccupiedSlotMap> {
    return [
      this.occupiedWallSlots,
      this.occupiedUpperWallSlots,
      this.occupiedShelterSlots
    ];
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
    slot: string | number,
    slots: ConstructionSlotPositionMap
  ): Float32Array | undefined {
    if (typeof slot == "string") {
      slot = getConstructionSlotId(slot);
    }
    if (slot == 101) slot = 1; // upper wall slot
    return slots[slot]?.rotation || undefined;
  }

  updateSecuredState(server: ZoneServer2016) {
    switch (this.itemDefinitionId) {
      case Items.METAL_DOORWAY: // for parent foundation
        const door = this.occupiedWallSlots[1];
        if (!door || !(door instanceof ConstructionDoor) || door.isOpen) {
          this.isSecured = false;
        } else {
          this.isSecured = true;
        }
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
      case Items.METAL_WALL:
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
    if (itemDefinitionId == Items.METAL_WALL_UPPER) {
      slot = 1;
    }
    const slots = definitions[this.itemDefinitionId];
    if (!slots) {
      return false;
    }
    if (!slots.authorizedItems.includes(itemDefinitionId)) {
      return false;
    }
    if (!slotMap[slot]) {
      return false;
    }
    return true;
  }

  protected setSlot(
    entity: SlottedConstructionEntity,
    definitions: ConstructionSlots,
    slotMap: ConstructionSlotPositionMap,
    occupiedSlots: OccupiedSlotMap
  ) {
    const slot = entity.getSlotNumber();
    if (
      !this.isSlotValid(slot, definitions, slotMap, entity.itemDefinitionId)
    ) {
      return false;
    }
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

  addFreeplaceConstruction(
    entity:
      | ConstructionChildEntity
      | ConstructionDoor
      | LootableConstructionEntity
  ) {
    this.freeplaceEntities[entity.characterId] = entity;
  }

  damage(server: ZoneServer2016, damageInfo: DamageInfo) {
    switch (this.itemDefinitionId) {
      case Items.FOUNDATION_RAMP:
      case Items.FOUNDATION_STAIRS:
        return;
    }

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

  isInside(position: Float32Array) {
    switch (this.itemDefinitionId) {
      case Items.SHELTER:
      case Items.SHELTER_LARGE:
      case Items.SHELTER_UPPER:
      case Items.SHELTER_UPPER_LARGE:
        if (!this.cubebounds) {
          console.error(
            `ERROR: CONSTRUCTION CUBEBOUNDS IS NOT DEFINED FOR ${this.itemDefinitionId} ${this.characterId}`
          );
          return false; // this should never occur
        }
        return isInsideCube(Array.from(position) as Point3D, this.cubebounds);
      default:
        return false;
    }
  }

  isOn(position: Float32Array) {
    switch (this.itemDefinitionId) {
      case Items.SHELTER:
      case Items.SHELTER_LARGE:
      case Items.SHELTER_UPPER:
      case Items.SHELTER_UPPER_LARGE:
        if (!this.boundsOn) {
          console.error(
            `ERROR: CONSTRUCTION boundsOn IS NOT DEFINED FOR ${this.itemDefinitionId} ${this.characterId}`
          );
          return false; // this should never occur
        }
        return isInsideCube(Array.from(position) as Point3D, this.boundsOn);
      default:
        return false;
    }
  }

  destroy(server: ZoneServer2016, destructTime = 0): boolean {
    const deleted = server.deleteEntity(
      this.characterId,
      server._constructionSimple[this.characterId]
        ? server._constructionSimple
        : server._worldSimpleConstruction,
      this.destroyedEffect,
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
      case Items.METAL_WALL:
      case Items.METAL_DOORWAY:
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
        slotMap = parent.occupiedShelterSlots;
        break;
      case Items.FOUNDATION_RAMP:
      case Items.FOUNDATION_STAIRS:
        slotMap = parent.occupiedRampSlots;
        break;
    }
    let freeplace: Array<ConstructionChildEntity | ConstructionDoor> = [];
    this.getOccupiedSlotMaps().forEach((slotMap) => {
      freeplace = [...freeplace, ...Object.values(slotMap)];
    });
    if (slotMap) parent.clearSlot(this.getSlotNumber(), slotMap);
    if (updateSecured) parent.updateSecuredState(server);

    // re-register now disconnected slotted entities as freeplace entities
    const parentFoundation = this.getParentFoundation(server);
    if (parentFoundation) {
      freeplace.forEach((entity) => {
        entity.parentObjectCharacterId = parentFoundation.characterId;
        parentFoundation.freeplaceEntities[entity.characterId] = entity;
      });
      // move free placed entities to parent foundation
      for (const a in this.freeplaceEntities) {
        const freePlacedEntity = this.freeplaceEntities[a];
        freePlacedEntity.parentObjectCharacterId = parentFoundation.characterId;
        parentFoundation.freeplaceEntities[freePlacedEntity.characterId] =
          freePlacedEntity;
      }
    }
    return deleted;
  }

  getParent(server: ZoneServer2016): ConstructionParentEntity | undefined {
    return (
      server._constructionFoundations[this.parentObjectCharacterId] ||
      server._constructionSimple[this.parentObjectCharacterId]
    );
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
      Date.now() < this.placementTime + this.undoPlacementTime &&
      weapon.itemDefinitionId == Items.WEAPON_HAMMER_DEMOLITION
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
    if (
      client.character._resources[ResourceIds.ENDURANCE] <= 3501 &&
      this.itemDefinitionId == Items.SLEEPING_MAT
    ) {
      server.utilizeHudTimer(client, StringIds.RESTING, 20000, 0, () => {
        server.sleep(client);
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
    if (
      client.character._resources[ResourceIds.ENDURANCE] <= 3501 &&
      this.itemDefinitionId == Items.SLEEPING_MAT
    ) {
      server.sendData(client, "Command.InteractionString", {
        guid: this.characterId,
        stringId: StringIds.REST
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
    if (
      this.itemDefinitionId == Items.FOUNDATION_RAMP ||
      this.itemDefinitionId == Items.FOUNDATION_STAIRS
    )
      return;

    const itemDefinitionId =
      sourceEntity instanceof ExplosiveEntity
        ? sourceEntity.itemDefinitionId
        : 0;

    if (
      server._worldSimpleConstruction[this.characterId] &&
      isPosInRadius(4, this.state.position, sourceEntity.state.position)
    ) {
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

    if (
      !isPosInRadius(
        this.damageRange * 1.5,
        this.fixedPosition ? this.fixedPosition : this.state.position,
        sourceEntity.state.position
      )
    ) {
      return;
    }
    if (server.constructionManager.isConstructionInSecuredArea(server, this)) {
      if (useRaycast) {
        let damage = server.baseConstructionDamage;
        switch (this.itemDefinitionId) {
          case Items.SHELTER:
          case Items.SHELTER_LARGE:
          case Items.SHELTER_UPPER:
          case Items.SHELTER_UPPER_LARGE:
            damage *= 30 / 100;
            break;
          default:
            damage = 0;
            break;
        }
        server.constructionManager.checkConstructionDamage(
          server,
          this,
          damage,
          sourceEntity.state.position,
          this.fixedPosition ? this.fixedPosition : this.state.position,
          itemDefinitionId
        );
        if (!client) return;
        server.constructionManager.sendBaseSecuredMessage(server, client, 1);
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
