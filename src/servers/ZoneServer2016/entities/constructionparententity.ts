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

import { ConstructionChildEntity } from "./constructionchildentity";
import { LootableConstructionEntity } from "./lootableconstructionentity";
import { ConstructionPermissionIds, Items, StringIds } from "../models/enums";
import { ZoneServer2016 } from "../zoneserver";
import {
  getConstructionSlotId,
  isInsideSquare,
  isInsideCube,
  registerConstructionSlots,
  getRectangleCorners,
  movePoint,
} from "../../../utils/utils";
import { ZoneClient2016 } from "../classes/zoneclient";
import {
  ConstructionPermissions,
  ConstructionSlotPositionMap,
  OccupiedSlotMap,
  SquareBounds,
} from "types/zoneserver";
import {
  foundationExpansionSlotDefinitions,
  foundationRampSlotDefinitions,
  shelterSlotDefinitions,
  wallSlotDefinitions,
} from "../data/constructionslots";

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

export class ConstructionParentEntity extends ConstructionChildEntity {
  permissions: { [characterId: string]: ConstructionPermissions } = {};
  ownerCharacterId: string;
  objectLessTicks: number = 0;
  objectLessMaxTicks: number = 3;
  readonly expansionSlots: ConstructionSlotPositionMap = {};
  occupiedExpansionSlots: { [slot: number]: ConstructionParentEntity } = {};
  readonly rampSlots: ConstructionSlotPositionMap = {};
  occupiedRampSlots: { [slot: number]: ConstructionChildEntity } = {};

  readonly itemDefinitionId: number;
  readonly slot: string;
  readonly damageRange: number;
  readonly bounds?: SquareBounds;

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
    this.health = 1000000;
    this.ownerCharacterId = ownerCharacterId;
    const ownerPermission: ConstructionPermissions = {
      characterId: ownerCharacterId,
      characterName: ownerName,
      useContainers: true,
      build: true,
      demolish: true,
      visit: true,
    };
    this.itemDefinitionId = itemDefinitionId;
    this.permissions[ownerPermission.characterId] = ownerPermission;
    this.parentObjectCharacterId = parentObjectCharacterId;
    this.slot = BuildingSlot || "";
    this.damageRange = getDamageRange(this.itemDefinitionId);
    switch (this.itemDefinitionId) {
      case Items.GROUND_TAMPER:
        this.bounds = this.getSquareBounds([1, 5, 9, 13]);
        this.interactionDistance = 16; // fix temper interact distance if deck is placed on it
        break;
      case Items.FOUNDATION:
        this.bounds = this.getSquareBounds([1, 4, 7, 10]);
        this.interactionDistance = 10;
        break;
      case Items.FOUNDATION_EXPANSION: // 1, 2, 5, 3RD dependent foundation wall
        const bounds = this.getSquareBounds([1, 2, 5, 0]),
          parent = this.getParentFoundation(server);
        if (parent) {
          // get 3rd dependent foundation wall pos
          const dependentWallPos = parent.getSlotPosition(
              this.getDependentWalls()[2],
              parent.wallSlots
            ),
            dependentWallRot = parent.getSlotRotation(
              this.getDependentWalls()[2],
              parent.wallSlots
            );

          if (dependentWallPos && dependentWallRot) {
            const point = movePoint(
              dependentWallPos,
              -dependentWallRot[0] + (270 * Math.PI) / 180,
              5
            );
            bounds[3] = [point[0], point[2]];
            this.bounds = bounds;
          }
        }
        this.interactionDistance = 8;
        break;
      case Items.SHACK:
        this.bounds = getRectangleCorners(position, 4.7, 5, -this.eulerAngle);
        this.interactionDistance = 4;
        break;
      case Items.SHACK_SMALL:
        this.bounds = getRectangleCorners(
          this.state.position,
          3.5,
          2.5,
          -this.eulerAngle
        );
        this.interactionDistance = 4;
        break;
      case Items.SHACK_BASIC:
        this.bounds = getRectangleCorners(position, 1.6, 1.6, -this.eulerAngle);
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
      this.occupiedRampSlots,
    ];
  }

  private getSquareBounds(
    slots: [number, number, number, number]
  ): SquareBounds {
    const bounds: SquareBounds = [
      [0, 0],
      [0, 0],
      [0, 0],
      [0, 0],
    ];
    slots.forEach((slot, idx) => {
      const pos = this.getSlotPosition(slot, this.wallSlots);
      if (pos) bounds[idx] = [pos[0], pos[2]];
    });
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
                return;
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
                return;
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
                return;
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
                return;
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
    if (!this.bounds) {
      console.error(
        `ERROR: CONSTRUCTION BOUNDS IS NOT DEFINED FOR ${this.itemDefinitionId} ${this.characterId}`
      );
      return false; // this should never occur
    }

    switch (this.itemDefinitionId) {
      case Items.FOUNDATION:
      case Items.FOUNDATION_EXPANSION:
      case Items.GROUND_TAMPER:
        return isInsideSquare([position[0], position[2]], this.bounds);
      case Items.SHACK:
        return isInsideCube(
          [position[0], position[2]],
          this.bounds,
          position[1],
          this.state.position[1],
          2.1
        );
      case Items.SHACK_BASIC:
        return isInsideCube(
          [position[0], position[2]],
          this.bounds,
          position[1],
          this.state.position[1],
          1.7
        );
      case Items.SHACK_SMALL:
        return isInsideCube(
          [position[0], position[2]],
          this.bounds,
          position[1],
          this.state.position[1],
          2.1
        );
      default:
        return false;
    }
  }

  isUnder(position: Float32Array) {
    if (!this.bounds) {
      console.error(
        `ERROR: CONSTRUCTION BOUNDS IS NOT DEFINED FOR ${this.itemDefinitionId} ${this.characterId}`
      );
      return false; // this should never occur
    }
    const fixY = this.itemDefinitionId == Items.FOUNDATION ? 1 : 0;
    return isInsideCube(
      [position[0], position[2]],
      this.bounds,
      position[1],
      this.state.position[1] - 50 + fixY,
      49 + fixY
    );
  }

  destroy(server: ZoneServer2016, destructTime = 0) {
    const deleted = server.deleteEntity(
      this.characterId,
      server._constructionFoundations,
      242,
      destructTime
    );
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
    return (
      this.getHasPermission(
        server,
        client.character.characterId,
        ConstructionPermissionIds.BUILD
      ) &&
      Date.now() < this.placementTime + this.undoPlacementTime &&
      client.character.getEquippedWeapon().itemDefinitionId ==
        Items.WEAPON_HAMMER_DEMOLITION &&
      this.isSlotsEmpty()
    );
  }

  getHasPermission(
    server: ZoneServer2016,
    characterId: string,
    permission: ConstructionPermissionIds
  ) {
    if (characterId == this.ownerCharacterId) return true;
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
    if (this.canUndoPlacement(server, client)) {
      this.destroy(server);
      client.character.lootItem(
        server,
        server.generateItem(this.itemDefinitionId)
      );
      return;
    }

    if (
      this.ownerCharacterId != client.character.characterId &&
      (!client.isAdmin || !client.isDebugMode) // allows debug mode
    )
      return;
    server.sendData(
      client,
      "NpcFoundationPermissionsManagerBase.showPermissions",
      {
        characterId: this.characterId,
        characterId2: this.characterId,
        permissions: Object.values(this.permissions).filter(
          (perm: ConstructionPermissions) =>
            perm.characterId != this.ownerCharacterId
        ),
      }
    );
  }

  OnInteractionString(server: ZoneServer2016, client: ZoneClient2016) {
    if (this.canUndoPlacement(server, client)) {
      server.undoPlacementInteractionString(this, client);
      return;
    }

    if (
      this.ownerCharacterId != client.character.characterId &&
      (!client.isAdmin || !client.isDebugMode)
    )
      return; // debug mode give permission interact string
    server.sendData(client, "Command.InteractionString", {
      guid: this.characterId,
      stringId: StringIds.PERMISSIONS_TARGET,
    });
  }
}
