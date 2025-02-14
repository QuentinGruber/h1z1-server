// ======================================================================
//
//   GNU GENERAL PUBLIC LICENSE
//   Version 3, 29 June 2007
//   copyright (C) 2020 - 2021 Quentin Gruber
//   copyright (C) 2021 - 2024 H1emu community
//
//   https://github.com/QuentinGruber/h1z1-server
//   https://www.npmjs.com/package/h1z1-server
//
//   Based on https://github.com/psemu/soe-network
// ======================================================================

import { ConstructionChildEntity } from "./constructionchildentity";
import { LootableConstructionEntity } from "./lootableconstructionentity";
import { ConstructionPermissionIds, Items, StringIds } from "../models/enums";
import { ZoneServer2016 } from "../zoneserver";
import {
  getConstructionSlotId,
  registerConstructionSlots,
  getCubeBounds,
  isInsideCube,
  isPosInRadius
} from "../../../utils/utils";
import { ZoneClient2016 } from "../classes/zoneclient";
import {
  ConstructionPermissions,
  ConstructionSlotPositionMap,
  CubeBounds,
  DamageInfo,
  OccupiedSlotMap,
  Point3D,
  SquareBounds
} from "types/zoneserver";
import {
  foundationExpansionSlotDefinitions,
  foundationRampSlotDefinitions,
  shelterSlotDefinitions,
  wallSlotDefinitions
} from "../data/constructionslots";
import { BaseEntity } from "./baseentity";
import { ExplosiveEntity } from "./explosiveentity";

function getDamageRange(definitionId: number): number {
  switch (definitionId) {
    case Items.SHACK:
      return 4.5;
    case Items.SHACK_SMALL:
      return 4;
    case Items.SHACK_BASIC:
      return 3;
    default:
      return 4.5;
  }
}

function getMaxHealth(itemDefinitionId: Items): number {
  switch (itemDefinitionId) {
    case Items.SHACK:
    case Items.SHACK_SMALL:
      return 1000000;
    case Items.SHACK_BASIC:
      return 250000;
    default:
      return 1000000;
  }
}

export class ConstructionParentEntity extends ConstructionChildEntity {
  /** Allowed permissions for players on the ConstructionParentEntity,
   * determines if a player can visit, use containers, build or demolish*/
  permissions: { [characterId: string]: ConstructionPermissions } = {};

  /** CharacterId of the player who placed the ConstructionParentEntity */
  ownerCharacterId: string;

  /** Used by decay manager to determine the amount of ticks a ConstructionParentEntity has spent without any occupied slots */
  ticksWithoutObjects: number = 0;

  /** Data on deck expansions - includes [slot: number] of position (Float32Array) and rotation (Float32Array)  */
  readonly expansionSlots: ConstructionSlotPositionMap = {};

  /** HashMap of occupied expansion slots for a deck foundation (1 per side - 4 total),
   * uses slot (number) for indexing
   */
  occupiedExpansionSlots: { [slot: number]: ConstructionParentEntity } = {};

  /** Data on a ramp - includes: [slot: number] of position (Float32Array) and rotation (Float32Array) */
  readonly rampSlots: ConstructionSlotPositionMap = {};

  /** HashMap of occupied ramp slots for a deck foundation (3 per side - 12 total),
   * uses slot (number) for indexing
   */
  occupiedRampSlots: { [slot: number]: ConstructionChildEntity } = {};

  /** Last time the ConstructionParentEntity was damaged */
  lastDamagedTimestamp: number = 0;

  /** Id of the ConstructionParentEntity - See ServerItemDefinitions.json for more information */
  readonly itemDefinitionId: number;

  /** Index of the parent slot, used by ConstructionChildEntity - also determines CubeBounds  */
  readonly slot: string;

  /** Range that the ConstructionParentEntity will take damage from explosives */
  readonly damageRange: number;

  /** 3d boundaries of the space the ConstructionParentEntity occupies (8 vertice points) */
  declare readonly cubebounds?: CubeBounds;

  /** For detecting players / objects underneath a foundation */
  readonly boundsUnder?: CubeBounds;

  constructor(
    characterId: string,
    transientId: number,
    actorModelId: number,
    position: Float32Array,
    rotation: Float32Array,
    server: ZoneServer2016,
    itemDefinitionId: number,
    ownerCharacterId: string,
    ownerName: string,
    parentObjectCharacterId: string,
    BuildingSlot: string | undefined,
    overrideEulerAngle?: number
  ) {
    super(
      characterId,
      transientId,
      actorModelId,
      position,
      rotation,
      server,
      itemDefinitionId,
      parentObjectCharacterId,
      "",
      overrideEulerAngle
    );
    this.maxHealth = getMaxHealth(itemDefinitionId);
    this.health = this.maxHealth;

    this.ownerCharacterId = ownerCharacterId;
    this.useSimpleStruct = true;
    if (itemDefinitionId != Items.FOUNDATION_EXPANSION) {
      const ownerPermission: ConstructionPermissions = {
        characterId: ownerCharacterId,
        characterName: ownerName,
        useContainers: true,
        build: true,
        demolish: true,
        visit: true
      };
      this.permissions[ownerPermission.characterId] = ownerPermission;
    }
    this.itemDefinitionId = itemDefinitionId;
    this.parentObjectCharacterId = parentObjectCharacterId;
    this.slot = BuildingSlot || "";
    this.damageRange = getDamageRange(this.itemDefinitionId);
    switch (this.itemDefinitionId) {
      case Items.GROUND_TAMPER:
        this.cubebounds = this.getCubeBoundsFromWallSlots(
          server,
          [1, 5, 9, 13],
          0,
          10
        );
        this.interactionDistance = 16; // fix tamper interact distance if deck is placed on it
        break;
      case Items.FOUNDATION:
        this.cubebounds = this.getCubeBoundsFromWallSlots(
          server,
          [1, 4, 7, 10],
          -4,
          11
        );
        this.boundsUnder = this.getCubeBoundsFromWallSlots(
          server,
          [1, 4, 7, 10],
          -4,
          2.1
        );

        this.interactionDistance = 10;
        break;
      case Items.FOUNDATION_EXPANSION:
        this.cubebounds = this.getCubeBoundsFromWallSlots(
          server,
          [1, 2, 5, 0],
          -6,
          9
        );
        this.boundsUnder = this.getCubeBoundsFromWallSlots(
          server,
          [1, 2, 5, 0],
          -6,
          -0.1
        );

        this.interactionDistance = 8;
        break;
      case Items.SHACK:
        this.cubebounds = getCubeBounds(
          position,
          4.7,
          5,
          -this.eulerAngle,
          position[1] + 0.7,
          position[1] + 2.8
        );
        this.interactionDistance = 4;
        break;
      case Items.SHACK_SMALL:
        this.cubebounds = getCubeBounds(
          position,
          3.5,
          2.5,
          -this.eulerAngle,
          position[1] + 0.7,
          position[1] + 2.8
        );
        this.interactionDistance = 4;
        break;
      case Items.SHACK_BASIC:
        this.cubebounds = getCubeBounds(
          position,
          1.6,
          1.6,
          -this.eulerAngle,
          position[1],
          position[1] + 1.7
        );
        this.interactionDistance = 4;
        break;
    }
    registerConstructionSlots(this, this.wallSlots, wallSlotDefinitions);
    Object.seal(this.wallSlots);
    registerConstructionSlots(
      this,
      this.expansionSlots,
      foundationExpansionSlotDefinitions
    );
    Object.seal(this.expansionSlots);
    registerConstructionSlots(
      this,
      this.rampSlots,
      foundationRampSlotDefinitions
    );
    Object.seal(this.rampSlots);
    registerConstructionSlots(this, this.shelterSlots, shelterSlotDefinitions);
    Object.seal(this.shelterSlots);

    const itemDefinition = server.getItemDefinition(this.itemDefinitionId);
    if (itemDefinition) this.nameId = itemDefinition.NAME_ID;
  }

  getOccupiedSlotMaps(): Array<OccupiedSlotMap> {
    return [
      ...super.getOccupiedSlotMaps(),
      this.occupiedExpansionSlots,
      this.occupiedRampSlots
    ];
  }

  private getSquareBounds(
    slots: [number, number, number, number]
  ): SquareBounds {
    const bounds: SquareBounds = [
      [0, 0],
      [0, 0],
      [0, 0],
      [0, 0]
    ];
    slots.forEach((slot, idx) => {
      const pos = this.getSlotPosition(slot, this.wallSlots);
      if (pos) bounds[idx] = [pos[0], pos[2]];
    });
    return bounds;
  }

  private getExpansionDependentWallPos(server: ZoneServer2016) {
    const parent = this.getParentFoundation(server);
    if (!parent) return;

    return parent.getSlotPosition(
      this.getExpansion4thBoundWall(),
      parent.wallSlots
    );
  }

  private getExpansionSquareBounds(
    server: ZoneServer2016
  ): SquareBounds | undefined {
    // 1, 2, 5, 3RD dependent foundation wall
    const bounds = this.getSquareBounds([1, 2, 5, 0]),
      pos = this.getExpansionDependentWallPos(server);
    if (!pos) return;

    bounds[3] = [pos[0], pos[2]];
    return bounds;
  }

  private getCubeBoundsFromWallSlots(
    server: ZoneServer2016,
    slots: [number, number, number, number],
    lowerYOffset: number,
    upperYOffset: number
  ): CubeBounds | undefined {
    const bounds: CubeBounds = [
        [0, 0, 0],
        [0, 0, 0],
        [0, 0, 0],
        [0, 0, 0],
        [0, 0, 0],
        [0, 0, 0],
        [0, 0, 0],
        [0, 0, 0]
      ],
      lowerY = this.state.position[1] + lowerYOffset,
      upperY = this.state.position[1] + upperYOffset;

    for (let i = 0; i < 4; i++) {
      const adjustedIdx = i >= 4 ? i - 4 : i;
      let pos = this.getSlotPosition(slots[adjustedIdx], this.wallSlots);

      if (slots[adjustedIdx] == 0) {
        // for expansion slot #4
        pos = this.getExpansionDependentWallPos(server);
      }

      if (!pos) return;

      bounds[i] = [pos[0], lowerY, pos[2]];
      bounds[i + 4] = [pos[0], upperY, pos[2]];
    }

    return bounds;
  }

  getAdjustedShelterSlotId(buildingSlot: string) {
    let slot = getConstructionSlotId(buildingSlot);
    if (this.itemDefinitionId == Items.GROUND_TAMPER) {
      switch (true) {
        case slot >= 11 && slot <= 14:
          slot = slot - 6;
          break;
        case slot >= 21 && slot <= 24:
          slot = slot - 12;
          break;
        case slot >= 31 && slot <= 34:
          slot = slot - 18;
          break;
      }
    } else if (this.itemDefinitionId == Items.FOUNDATION) {
      switch (true) {
        case slot >= 11 && slot <= 13:
          slot = slot - 7;
          break;
        case slot >= 21 && slot <= 23:
          slot = slot - 14;
          break;
      }
    }
    return `Structure${slot > 9 ? slot.toString() : `0${slot.toString()}`}`;
  }

  /**
   * [Expansions only] Returns the wall slot on the deck that is required to complete the expansion's square bounds
   */
  getExpansion4thBoundWall(): number {
    switch (this.getSlotNumber()) {
      case 1:
        return 7;
      case 2:
        return 4;
      case 3:
        return 1;
      case 4:
        return 10;
    }
    return 1;
  }

  /**
   * [Deck expansions only] Returns an array containing the parent foundation walls that a given expansion depends on to be secured.
   * @param expansion The expansion to check.
   */
  getDependentWalls(): Array<number> {
    switch (this.getSlotNumber()) {
      case 1:
        return [4, 5, 6];
      case 2:
        return [1, 2, 3];
      case 3:
        return [10, 11, 12];
      case 4:
        return [7, 8, 9];
    }
    return [];
  }

  getDependentWallsExternal(entity: ConstructionParentEntity): Array<number> {
    switch (entity.getSlotNumber()) {
      case 1:
        return [4, 5, 6];
      case 2:
        return [1, 2, 3];
      case 3:
        return [10, 11, 12];
      case 4:
        return [7, 8, 9];
    }
    return [];
  }

  /**
   * [Deck foundations only] Returns the slotId of an expansion on the same side as a given wall.
   * @param expansion The expansion to check.
   */
  getDependentExpansion(slotId: number): number {
    switch (slotId) {
      case 4:
      case 5:
      case 6:
        return 1;
      case 1:
      case 2:
      case 3:
        return 2;
      case 10:
      case 11:
      case 12:
        return 3;
      case 7:
      case 8:
      case 9:
        return 4;
    }
    return 0; // should never get here
  }

  isSideSecure(side: number): boolean {
    if (this.itemDefinitionId != Items.FOUNDATION) return false;
    let secure = true;
    Object.keys(this.wallSlots).forEach((slot) => {
      const wall = this.occupiedWallSlots[Number(slot) + 1];
      if (
        side == this.getDependentExpansion(Number(slot) + 1) &&
        (!wall || !wall.isSecured)
      ) {
        secure = false;
        return;
      }
    });
    return secure;
  }

  /**
   * Tests if all walls slots of this foundation are occupied and secured.
   * @returns boolean
   */
  getWallsSecured(): boolean {
    const wallSlots = Object.values(this.occupiedWallSlots);
    // check if all wall slots are occupied
    if (wallSlots.length != Object.values(this.wallSlots).length) {
      return false;
    }
    // check if any walls are gates / if they're open

    for (const wall of wallSlots) {
      if (!wall.isSecured) {
        return false;
      }
    }
    return true;
  }

  updateSecuredState(server: ZoneServer2016) {
    // doesn't work correctly yet -Meme

    /*
    switch(this.itemDefinitionId) {
      case Items.FOUNDATION:
        for (const expansion of Object.values(this.occupiedExpansionSlots)) {
          expansion.updateSecuredState(server);
        }
        
        for(let i = 1; i < 5; i++) {
          const expansion = this.occupiedExpansionSlots[i];
          if(!this.isSideSecure(i) && (!expansion || !expansion.getWallsSecured())) {
            if(expansion) expansion.isSecured = false;
            this.isSecured = false;
            server.sendAlertToAll("NOT SECURE");
            return;
          }
        }
        server.sendAlertToAll("SECURE");
        this.isSecured = true;
        for (const expansion of Object.values(this.occupiedExpansionSlots)) {
          expansion.updateSecuredState(server);
        }
        return;
      case Items.FOUNDATION_EXPANSION:
        const parent =
          server._constructionFoundations[this.parentObjectCharacterId];
        if (parent) {
          if(parent.isSecured && this.getWallsSecured()) {
            this.isSecured = true;
            return;
          }

          for (const slot of this.getDependentWalls()) {
            const wall = parent.occupiedWallSlots[slot];
            if (!wall || !wall.isSecured) {
              this.isSecured = false;
              return;
            }
          }
        }
        else {
          this.isSecured = false;
          return;
        }
        break;
      default:
        if(!this.getWallsSecured()) {
          this.isSecured = false;
          return;
        }
        break;
    }
    this.isSecured = true;
    */

    // update secured state for all attached expansions
    if (this.itemDefinitionId == Items.FOUNDATION_EXPANSION) {
      const parent =
        server._constructionFoundations[this.parentObjectCharacterId];
      if (parent) {
        parent.updateSecuredState(server);
      }
      return;
    }
    if (this.itemDefinitionId == Items.FOUNDATION) {
      for (const a in this.occupiedExpansionSlots) {
        let allowSecured = true;
        const wallSlots = Object.values(
          this.occupiedExpansionSlots[a].occupiedWallSlots
        );
        // check if all wall slots are occupied
        if (
          wallSlots.length !=
          Object.values(this.occupiedExpansionSlots[a].wallSlots).length
        ) {
          allowSecured = false;
        }
        // check if any walls are gates / if they're open
        for (const wall of wallSlots) {
          if (!wall.isSecured) {
            allowSecured = false;
          }
        }
        this.occupiedExpansionSlots[a].isSecured = allowSecured;
      }

      // if it ain't broke, don't fix it.
      let side01 = false;
      let side02 = false;
      let side03 = false;
      let side04 = false;
      if (
        this.occupiedWallSlots["4"] &&
        this.occupiedWallSlots["5"] &&
        this.occupiedWallSlots["6"]
      ) {
        if (
          this.occupiedWallSlots["4"].isSecured &&
          this.occupiedWallSlots["5"].isSecured &&
          this.occupiedWallSlots["6"].isSecured
        ) {
          side01 = true;
        } else if (
          this.occupiedExpansionSlots["1"] &&
          this.occupiedExpansionSlots["1"].isSecured
        )
          side01 = true;
      } else if (
        this.occupiedExpansionSlots["1"] &&
        this.occupiedExpansionSlots["1"].isSecured
      )
        side01 = true;

      if (
        this.occupiedWallSlots["1"] &&
        this.occupiedWallSlots["2"] &&
        this.occupiedWallSlots["3"]
      ) {
        if (
          this.occupiedWallSlots["1"].isSecured &&
          this.occupiedWallSlots["2"].isSecured &&
          this.occupiedWallSlots["3"].isSecured
        ) {
          side02 = true;
        } else if (
          this.occupiedExpansionSlots["2"] &&
          this.occupiedExpansionSlots["2"].isSecured
        )
          side02 = true;
      } else if (
        this.occupiedExpansionSlots["2"] &&
        this.occupiedExpansionSlots["2"].isSecured
      )
        side02 = true;

      if (
        this.occupiedWallSlots["10"] &&
        this.occupiedWallSlots["11"] &&
        this.occupiedWallSlots["12"]
      ) {
        if (
          this.occupiedWallSlots["10"].isSecured &&
          this.occupiedWallSlots["11"].isSecured &&
          this.occupiedWallSlots["12"].isSecured
        ) {
          side03 = true;
        } else if (
          this.occupiedExpansionSlots["3"] &&
          this.occupiedExpansionSlots["3"].isSecured
        )
          side03 = true;
      } else if (
        this.occupiedExpansionSlots["3"] &&
        this.occupiedExpansionSlots["3"].isSecured
      )
        side03 = true;

      if (
        this.occupiedWallSlots["7"] &&
        this.occupiedWallSlots["8"] &&
        this.occupiedWallSlots["9"]
      ) {
        if (
          this.occupiedWallSlots["7"].isSecured &&
          this.occupiedWallSlots["8"].isSecured &&
          this.occupiedWallSlots["9"].isSecured
        ) {
          side04 = true;
        } else if (
          this.occupiedExpansionSlots["4"] &&
          this.occupiedExpansionSlots["4"].isSecured
        )
          side04 = true;
      } else if (
        this.occupiedExpansionSlots["4"] &&
        this.occupiedExpansionSlots["4"].isSecured
      )
        side04 = true;

      if (side01 && side02 && side03 && side04) {
        this.isSecured = true;
      } else this.isSecured = false;
      if (!this.isSecured) {
        if (this.occupiedExpansionSlots["1"]) {
          for (const slot of this.getDependentWallsExternal(
            this.occupiedExpansionSlots["1"]
          )) {
            if (!side02 || !side03 || !side04) {
              const wall = this.occupiedWallSlots[slot];
              if (!wall || !wall.isSecured) {
                this.occupiedExpansionSlots["1"].isSecured = false;
                break;
              }
            }
          }
        }
        if (this.occupiedExpansionSlots["2"]) {
          for (const slot of this.getDependentWallsExternal(
            this.occupiedExpansionSlots["2"]
          )) {
            if (!side01 || !side03 || !side04) {
              const wall = this.occupiedWallSlots[slot];
              if (!wall || !wall.isSecured) {
                this.occupiedExpansionSlots["2"].isSecured = false;
                break;
              }
            }
          }
        }
        if (this.occupiedExpansionSlots["3"]) {
          for (const slot of this.getDependentWallsExternal(
            this.occupiedExpansionSlots["3"]
          )) {
            if (!side02 || !side01 || !side04) {
              const wall = this.occupiedWallSlots[slot];
              if (!wall || !wall.isSecured) {
                this.occupiedExpansionSlots["3"].isSecured = false;
                break;
              }
            }
          }
        }
        if (this.occupiedExpansionSlots["4"]) {
          for (const slot of this.getDependentWallsExternal(
            this.occupiedExpansionSlots["4"]
          )) {
            if (!side02 || !side03 || !side01) {
              const wall = this.occupiedWallSlots[slot];
              if (!wall || !wall.isSecured) {
                this.occupiedExpansionSlots["4"].isSecured = false;
                break;
              }
            }
          }
        }
      }
      return;
    }

    const wallSlots = Object.values(this.occupiedWallSlots);
    // check if all wall slots are occupied
    if (wallSlots.length != Object.values(this.wallSlots).length) {
      this.isSecured = false;
      return;
    }
    // check if any walls are gates / if they're open
    for (const wall of wallSlots) {
      if (!wall.isSecured) {
        this.isSecured = false;
        return;
      }
    }

    /* TODO: for deck foundations ONLY, need to check each side to see if it's secure,
    and if not, check if the expansion is secure (without checking for dependent deck walls)
    */

    // if this is an expansion, check dependent parent foundation walls
    const parent =
      server._constructionFoundations[this.parentObjectCharacterId];
    if (parent) {
      for (const slot of this.getDependentWalls()) {
        const wall = parent.occupiedWallSlots[slot];
        if (!wall || !wall.isSecured) {
          this.isSecured = false;
          return;
        }
      }
    }
    this.isSecured = true;
  }

  isExpansionSlotValid(
    buildingSlot: number | string,
    itemDefinitionId: number
  ) {
    let slot = 0;
    if (typeof buildingSlot == "string") {
      slot = getConstructionSlotId(buildingSlot);
    }
    return this.isSlotValid(
      slot,
      foundationExpansionSlotDefinitions,
      this.expansionSlots,
      itemDefinitionId
    );
  }

  setExpansionSlot(expansion: ConstructionParentEntity): boolean {
    return this.setSlot(
      expansion,
      foundationExpansionSlotDefinitions,
      this.expansionSlots,
      this.occupiedExpansionSlots
    );
  }

  isRampSlotValid(buildingSlot: number | string, itemDefinitionId: number) {
    let slot = 0;
    if (typeof buildingSlot == "string") {
      slot = getConstructionSlotId(buildingSlot);
    }
    return this.isSlotValid(
      slot,
      foundationRampSlotDefinitions,
      this.rampSlots,
      itemDefinitionId
    );
  }

  setRampSlot(ramp: ConstructionChildEntity): boolean {
    return this.setSlot(
      ramp,
      foundationRampSlotDefinitions,
      this.rampSlots,
      this.occupiedRampSlots
    );
  }

  isInside(position: Float32Array) {
    switch (this.itemDefinitionId) {
      case Items.FOUNDATION:
      case Items.FOUNDATION_EXPANSION:
      case Items.GROUND_TAMPER:
      case Items.SHACK:
      case Items.SHACK_BASIC:
      case Items.SHACK_SMALL:
        if (!this.cubebounds) {
          console.error(
            `ERROR: CONSTRUCTION CUBE BOUNDS IS NOT DEFINED FOR ${this.itemDefinitionId} ${this.characterId}`
          );
          return false; // this should never occur
        }
        return isInsideCube(Array.from(position) as Point3D, this.cubebounds);
      default:
        return false;
    }
  }

  isUnder(position: Float32Array) {
    switch (this.itemDefinitionId) {
      case Items.FOUNDATION:
      case Items.FOUNDATION_EXPANSION:
        if (!this.boundsUnder) {
          console.error(
            `ERROR: CONSTRUCTION BOUNDS UNDER IS NOT DEFINED FOR ${this.itemDefinitionId} ${this.characterId}`
          );
          return false; // this should never occur
        }
        return isInsideCube(Array.from(position) as Point3D, this.boundsUnder);
      default:
        return false;
    }
  }

  isOn() {
    // prevents isOn not defined messages if deck is checked by mistake
    // only used for ConstructionChildEntity
    return false;
  }

  destroy(server: ZoneServer2016, destructTime = 0): boolean {
    const deleted = server.deleteEntity(
      this.characterId,
      server._constructionFoundations,
      242,
      destructTime
    );

    if (!deleted) return false;

    if (
      this.itemDefinitionId == Items.SHACK ||
      this.itemDefinitionId == Items.SHACK_SMALL ||
      this.itemDefinitionId == Items.SHACK_BASIC
    ) {
      for (const entity of Object.values(this.freeplaceEntities)) {
        if (entity instanceof ConstructionChildEntity) {
          server._worldSimpleConstruction[entity.characterId] = entity;
          delete server._constructionSimple[entity.characterId];
        } else if (entity instanceof LootableConstructionEntity) {
          server._worldLootableConstruction[entity.characterId] = entity;
          delete server._lootableConstruction[entity.characterId];
        }
      }
    }
    const parent =
      server._constructionFoundations[this.parentObjectCharacterId];
    if (!parent) return deleted;
    if (!this.slot || !this.parentObjectCharacterId) return deleted;
    switch (this.itemDefinitionId) {
      case Items.METAL_GATE:
      case Items.DOOR_BASIC:
      case Items.DOOR_WOOD:
      case Items.DOOR_METAL:
      case Items.METAL_WALL:
      case Items.METAL_DOORWAY:
        parent.wallSlotsPlacementTimer[this.getSlotNumber()] =
          Date.now() + 30000;
        break;
      case Items.METAL_WALL_UPPER:
        parent.upperWallSlotsPlacementTimer[this.getSlotNumber()] =
          Date.now() + 30000;
        break;
      case Items.SHELTER:
      case Items.SHELTER_LARGE:
      case Items.SHELTER_UPPER:
      case Items.SHELTER_UPPER_LARGE:
      case Items.STRUCTURE_STAIRS:
      case Items.STRUCTURE_STAIRS_UPPER:
      case Items.LOOKOUT_TOWER:
        parent.shelterSlotsPlacementTimer[this.getSlotNumber()] =
          Date.now() + 30000;
        break;
      case Items.FOUNDATION_RAMP:
      case Items.FOUNDATION_STAIRS:
        break;
    }
    parent.clearSlot(this.getSlotNumber(), parent.occupiedExpansionSlots);
    return deleted;
  }

  isExpansionSlotsEmpty() {
    return Object.values(this.occupiedExpansionSlots).length == 0;
  }

  isSlotsEmpty() {
    return (
      super.isSlotsEmpty() &&
      this.isExpansionSlotsEmpty() &&
      Object.values(this.occupiedRampSlots).length == 0
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
      weapon.itemDefinitionId == Items.WEAPON_HAMMER_DEMOLITION &&
      this.isSlotsEmpty()
    );
  }

  getHasPermission(
    server: ZoneServer2016,
    characterId: string,
    permission: ConstructionPermissionIds
  ) {
    if (characterId == this.ownerCharacterId) return true;
    if (!this.permissions[characterId]) return false;

    switch (permission) {
      case ConstructionPermissionIds.BUILD:
        return this.permissions[characterId]?.build;
      case ConstructionPermissionIds.DEMOLISH:
        return this.permissions[characterId]?.demolish;
      case ConstructionPermissionIds.CONTAINERS:
        return this.permissions[characterId]?.useContainers;
      case ConstructionPermissionIds.VISIT:
        return this.permissions[characterId]?.visit;
    }
  }
  /* eslint-disable @typescript-eslint/no-unused-vars */
  OnPlayerSelect(
    server: ZoneServer2016,
    client: ZoneClient2016,
    isInstant?: boolean
    /* eslint-enable @typescript-eslint/no-unused-vars */
  ) {
    if (!this.ownerCharacterId) {
      this.ownerCharacterId = client.character.characterId;
      return;
    }

    if (this.canUndoPlacement(server, client)) {
      this.destroy(server);
      client.character.lootItem(
        server,
        server.generateItem(this.itemDefinitionId)
      );
      return;
    }

    if (
      !this.getHasPermission(
        server,
        client.character.characterId,
        ConstructionPermissionIds.DEMOLISH
      ) && // if the player has permission to build, show the permissions menu
      this.ownerCharacterId != client.character.characterId &&
      (!client.isAdmin || !client.isDebugMode) // allows debug mode
    )
      return;
    server.sendData(
      client,
      "NpcFoundationPermissionsManagerBase.ShowPermissions",
      {
        characterId: this.characterId,
        characterId2: this.characterId,
        permissions: Object.values(this.permissions).filter(
          (perm: ConstructionPermissions) =>
            perm.characterId != this.ownerCharacterId
        )
      }
    );
  }

  OnInteractionString(server: ZoneServer2016, client: ZoneClient2016) {
    if (!this.ownerCharacterId) {
      server.sendData(client, "Command.InteractionString", {
        guid: this.characterId,
        stringId: StringIds.CLAIM_TARGET
      });
      return;
    }

    if (this.canUndoPlacement(server, client)) {
      server.constructionManager.undoPlacementInteractionString(
        server,
        this,
        client
      );
      return;
    }

    if (
      !this.getHasPermission(
        server,
        client.character.characterId,
        ConstructionPermissionIds.DEMOLISH
      ) && // if the player has permission to build, show the permissions menu interaction string
      this.ownerCharacterId != client.character.characterId &&
      (!client.isAdmin || !client.isDebugMode)
    )
      return; // debug mode give permission interact string
    server.sendData(client, "Command.InteractionString", {
      guid: this.characterId,
      stringId: StringIds.PERMISSIONS_TARGET
    });
  }

  damage(server: ZoneServer2016, damageInfo: DamageInfo) {
    switch (this.itemDefinitionId) {
      case Items.FOUNDATION:
      case Items.FOUNDATION_EXPANSION:
      case Items.GROUND_TAMPER:
        return;
    }

    this.health -= damageInfo.damage;
    server.sendDataToAllWithSpawnedEntity(
      server._constructionFoundations,
      this.characterId,
      "Character.UpdateSimpleProxyHealth",
      this.pGetSimpleProxyHealth()
    );
    if (damageInfo.damage > 0) {
      const timestamp = Date.now();
      const parent = this.getParent(server);
      if (parent) parent.lastDamagedTimestamp = timestamp;
      const parentFoundation = this.getParentFoundation(server);
      if (parentFoundation) parentFoundation.lastDamagedTimestamp = timestamp;
    }
    if (this.health > 0) return;
    this.destroy(server, 3000);
  }

  OnExplosiveHit(server: ZoneServer2016, sourceEntity: BaseEntity) {
    if (server.isPvE) {
      return;
    }
    if (
      !isPosInRadius(
        this.damageRange * 1.5,
        this.state.position,
        sourceEntity.state.position
      )
    )
      return;

    const itemDefinitionId =
      sourceEntity instanceof ExplosiveEntity
        ? sourceEntity.itemDefinitionId
        : 0;

    switch (this.itemDefinitionId) {
      case Items.SHACK:
      case Items.SHACK_SMALL:
      case Items.SHACK_BASIC:
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
}
