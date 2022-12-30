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

import { ConstructionChildEntity } from "./constructionchildentity";
import { ConstructionPermissionIds, Items, StringIds } from "../models/enums";
import { ZoneServer2016 } from "../zoneserver";
import {
  getConstructionSlotId,
  getOffsetPoint,
  getRectangleCorners,
  isArraySumZero,
  isInside,
  isInsideWithY,
  isPosInRadiusWithY,
  registerConstructionSlots,
} from "../../../utils/utils";
import { ZoneClient2016 } from "./zoneclient";
import { BaseEntity } from "./baseentity";
import { ConstructionPermissions, ConstructionSlotPositionMap } from "types/zoneserver";
import { ConstructionDoor } from "./constructiondoor";
import { foundationExpansionSlotDefinitions, foundationWallSlotDefinitions } from "../data/constructionslots";

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
  perimeters: { [slot: string]: Float32Array };
  itemDefinitionId: number;
  expansions: { [slot: string]: string } = {};
  isSecured: boolean = false;
  isFullySecured: boolean = true;
  parentObjectCharacterId: string;
  occupiedSlots: string[] = [];
  buildingSlot?: string;
  securedPolygons: any[];
  readonly wallSlots: ConstructionSlotPositionMap = {};
  occupiedWallSlots: { [slot: string]: ConstructionChildEntity | ConstructionDoor } = {};
  readonly expansionSlots:  ConstructionSlotPositionMap = {};
  occupiedExpansionSlots: { [slot: string]: ConstructionParentEntity } = {};
  constructor(
    characterId: string,
    transientId: number,
    actorModelId: number,
    position: Float32Array,
    rotation: Float32Array,
    itemDefinitionId: number,
    ownerCharacterId: string,
    ownerName: string,
    parentObjectCharacterId: string,
    BuildingSlot?: string
  ) {
    super(
      characterId,
      transientId,
      actorModelId,
      position,
      rotation,
      itemDefinitionId,
      parentObjectCharacterId
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
    if (BuildingSlot) this.buildingSlot = BuildingSlot;
    this.securedPolygons = [];
    this.perimeters = {};
    this.damageRange = getDamageRange(this.itemDefinitionId);
    switch (this.itemDefinitionId) {
      case Items.GROUND_TAMPER:
        this.perimeters = {
          "01": new Float32Array([0, 0, 0, 0]),
          "02": new Float32Array([0, 0, 0, 0]),
          "03": new Float32Array([0, 0, 0, 0]),
          "04": new Float32Array([0, 0, 0, 0]),
          "05": new Float32Array([0, 0, 0, 0]),
          "06": new Float32Array([0, 0, 0, 0]),
          "07": new Float32Array([0, 0, 0, 0]),
          "08": new Float32Array([0, 0, 0, 0]),
          "09": new Float32Array([0, 0, 0, 0]),
          "10": new Float32Array([0, 0, 0, 0]),
          "11": new Float32Array([0, 0, 0, 0]),
          "12": new Float32Array([0, 0, 0, 0]),
          "13": new Float32Array([0, 0, 0, 0]),
          "14": new Float32Array([0, 0, 0, 0]),
          "15": new Float32Array([0, 0, 0, 0]),
          "16": new Float32Array([0, 0, 0, 0]),
        };
        break;
      case Items.FOUNDATION:
        this.perimeters = {
          "01": new Float32Array([0, 0, 0, 0]),
          "02": new Float32Array([0, 0, 0, 0]),
          "03": new Float32Array([0, 0, 0, 0]),
          "04": new Float32Array([0, 0, 0, 0]),
          "05": new Float32Array([0, 0, 0, 0]),
          "06": new Float32Array([0, 0, 0, 0]),
          "07": new Float32Array([0, 0, 0, 0]),
          "08": new Float32Array([0, 0, 0, 0]),
          "09": new Float32Array([0, 0, 0, 0]),
          "10": new Float32Array([0, 0, 0, 0]),
          "11": new Float32Array([0, 0, 0, 0]),
          "12": new Float32Array([0, 0, 0, 0]),
        };
        break;
      case Items.FOUNDATION_EXPANSION:
        this.perimeters = {
          "01": new Float32Array([0, 0, 0, 0]),
          "02": new Float32Array([0, 0, 0, 0]),
          "03": new Float32Array([0, 0, 0, 0]),
          "04": new Float32Array([0, 0, 0, 0]),
          "05": new Float32Array([0, 0, 0, 0]),
        };
        break;
      case Items.SHACK_SMALL:
        this.perimeters = {
          "01": new Float32Array([0, 0, 0, 0]),
        };
        break;
      case Items.SHACK_BASIC:
        this.perimeters = {
          "01": new Float32Array([0, 0, 0, 0]),
        };
        break;
      case Items.SHACK:
        this.perimeters = {
          "01": new Float32Array([0, 0, 0, 0]),
        };
        break;
      default:
        this.perimeters = {
          "01": new Float32Array([0, 0, 0, 0]),
        };
        break;
    }
    registerConstructionSlots(this, this.wallSlots, foundationWallSlotDefinitions);
    Object.seal(this.wallSlots);
    registerConstructionSlots(this, this.expansionSlots, foundationExpansionSlotDefinitions);
    Object.seal(this.expansionSlots);
  }

  getSlotPosition(buildingSlot: string, slots: ConstructionSlotPositionMap): Float32Array | undefined {
    const slot = getConstructionSlotId(buildingSlot);
    return slots[slot]?.position || undefined;
  }

  getSlotRotation(buildingSlot: string, slots: ConstructionSlotPositionMap): Float32Array | undefined {
    const slot = getConstructionSlotId(buildingSlot);
    return slots[slot]?.rotation || undefined;
  }

  /**
   * Returns an array containing the parent foundation walls that a given expansion depends on to be secured.
   * @param expansion The expansion to check.
  */
  getDependentWalls(): Array<string> {
    switch(this.buildingSlot) {
      case "01":
        return ["04", "05", "06"];
      case "02":
        return ["01", "02", "03"];
      case "03":
        return ["10", "11", "12"];
      case "04":
        return ["07", "08", "09"];
    }
    return [];
  }

  updateSecuredState(server: ZoneServer2016) {
    /*
      TODO: If a deck is open on one side but has an expansion
      with completed walls, that should probably count as both
      the deck and expansion being secure 
      (same for any other expansions)
    */

    // NEED TO CHECK FOR DOORWAYS WITH AN OPEN DOOR


    const wallSlots = Object.values(this.occupiedWallSlots);
    // check if all wall slots are occupied
    if(wallSlots.length != Object.values(this.wallSlots).length) {
      this.isSecured = false;
      return;
    }
    // check if any walls are gates / if they're open
    for(const wall of wallSlots) {
      if(wall instanceof ConstructionDoor && wall.isOpen) {
        this.isSecured = false;
        return;
      }
    }
    
    // if this is an expansion, check dependent parent foundation walls
    const parent = server._constructionFoundations[this.parentObjectCharacterId]
    if(parent) {
      for(const slot of Object.values(this.getDependentWalls())) {
        const wall = this.occupiedWallSlots[Number(slot)];
        if(!wall || (wall instanceof ConstructionDoor && wall.isOpen)) {
          this.isSecured = false;
          return;
        }
      }
    }
    this.isSecured = true;
  }

  isWallSlotValid(buildingSlot: number | string, itemDefinitionId: number) {
    const slots = foundationWallSlotDefinitions[this.itemDefinitionId];
    if(!slots.authorizedItems.includes(itemDefinitionId)) {
      return false;
    }
    
    let slot = 0;
    if(typeof buildingSlot == "string") {
      slot = getConstructionSlotId(buildingSlot);
    }
    return !!this.wallSlots[slot];
  }

  setWallSlot(server: ZoneServer2016, wall: ConstructionChildEntity | ConstructionDoor): boolean {
    const slot = wall.getSlotNumber();
    if(!this.isWallSlotValid(slot, wall.itemDefinitionId)) return false;
    this.occupiedWallSlots[slot] = wall;
    this.updateSecuredState(server);
    return true;
  }

  isExpansionSlotValid(buildingSlot: number | string, itemDefinitionId: number) {
    const slots = foundationExpansionSlotDefinitions[this.itemDefinitionId];
    if(!slots.authorizedItems.includes(itemDefinitionId)) {
      return false;
    }
    
    let slot = 0;
    if(typeof buildingSlot == "string") {
      slot = getConstructionSlotId(buildingSlot);
    }
    return !!this.expansionSlots[slot];
  }

  setExpansionSlot(expansion: ConstructionParentEntity): boolean {
    const slot = expansion.getSlotNumber();
    if(!this.isExpansionSlotValid(slot, expansion.itemDefinitionId)) return false;
    this.occupiedExpansionSlots[slot] = expansion;
    return true;
  }

  

  checkPerimeters(server: ZoneServer2016) {
    const temporaryPolygons = [];
    this.securedPolygons = [];
    let result = true;
    let side01: boolean = false;
    let side02: boolean = false;
    let side03: boolean = false;
    let side04: boolean = false;
    switch (this.itemDefinitionId) {
      case Items.FOUNDATION:
        if (
          this.expansions["01"] &&
          server._constructionFoundations[this.expansions["01"]].isSecured
        ) {
          const expansion =
            server._constructionFoundations[this.expansions["01"]];
          const tempExpansionPolygons: any[] = [];
          tempExpansionPolygons.push([
            expansion.perimeters["01"][0],
            expansion.perimeters["01"][2],
          ]);
          tempExpansionPolygons.push([
            expansion.perimeters["02"][0],
            expansion.perimeters["02"][2],
          ]);
          tempExpansionPolygons.push([
            expansion.perimeters["05"][0],
            expansion.perimeters["05"][2],
          ]);
          if (
            server._constructionFoundations[this.expansions["04"]] &&
            !isArraySumZero(
              server._constructionFoundations[this.expansions["04"]].perimeters[
                "01"
              ]
            )
          ) {
            tempExpansionPolygons.push([
              server._constructionFoundations[this.expansions["04"]].perimeters[
                "01"
              ][0],
              server._constructionFoundations[this.expansions["04"]].perimeters[
                "01"
              ][2],
            ]);
          } else {
            tempExpansionPolygons.push([
              this.perimeters["07"][0],
              this.perimeters["07"][2],
            ]);
          }
          expansion.securedPolygons = tempExpansionPolygons;
          temporaryPolygons.push([
            expansion.perimeters["01"][0],
            expansion.perimeters["01"][2],
          ]);
          side01 = true;
          if (
            !isArraySumZero(this.perimeters["04"]) &&
            !isArraySumZero(this.perimeters["05"]) &&
            !isArraySumZero(this.perimeters["06"])
          ) {
            expansion.isFullySecured = true;
          } else expansion.isFullySecured = false;
        } else {
          if (
            !isArraySumZero(this.perimeters["04"]) &&
            !isArraySumZero(this.perimeters["05"]) &&
            !isArraySumZero(this.perimeters["06"])
          ) {
            temporaryPolygons.push([
              this.perimeters["04"][0],
              this.perimeters["04"][2],
            ]);
            side01 = true;
            if (
              this.expansions["01"] &&
              server._constructionFoundations[this.expansions["01"]]
            )
              server._constructionFoundations[
                this.expansions["01"]
              ].isFullySecured = true;
          } else {
            if (
              this.expansions["01"] &&
              server._constructionFoundations[this.expansions["01"]]
            )
              server._constructionFoundations[
                this.expansions["01"]
              ].isFullySecured = false;
          }
        }
        if (
          this.expansions["02"] &&
          server._constructionFoundations[this.expansions["02"]].isSecured
        ) {
          const expansion =
            server._constructionFoundations[this.expansions["02"]];
          const tempExpansionPolygons: any[] = [];
          tempExpansionPolygons.push([
            expansion.perimeters["01"][0],
            expansion.perimeters["01"][2],
          ]);
          tempExpansionPolygons.push([
            expansion.perimeters["02"][0],
            expansion.perimeters["02"][2],
          ]);
          tempExpansionPolygons.push([
            expansion.perimeters["05"][0],
            expansion.perimeters["05"][2],
          ]);
          if (
            server._constructionFoundations[this.expansions["01"]] &&
            !isArraySumZero(
              server._constructionFoundations[this.expansions["01"]].perimeters[
                "01"
              ]
            )
          ) {
            tempExpansionPolygons.push([
              server._constructionFoundations[this.expansions["01"]].perimeters[
                "01"
              ][0],
              server._constructionFoundations[this.expansions["01"]].perimeters[
                "01"
              ][2],
            ]);
          } else {
            tempExpansionPolygons.push([
              this.perimeters["04"][0],
              this.perimeters["04"][2],
            ]);
          }
          expansion.securedPolygons = tempExpansionPolygons;
          temporaryPolygons.push([
            expansion.perimeters["01"][0],
            expansion.perimeters["01"][2],
          ]);
          side02 = true;
          if (
            !isArraySumZero(this.perimeters["01"]) &&
            !isArraySumZero(this.perimeters["02"]) &&
            !isArraySumZero(this.perimeters["03"])
          ) {
            expansion.isFullySecured = true;
          } else expansion.isFullySecured = false;
        } else {
          if (
            !isArraySumZero(this.perimeters["01"]) &&
            !isArraySumZero(this.perimeters["02"]) &&
            !isArraySumZero(this.perimeters["03"])
          ) {
            temporaryPolygons.push([
              this.perimeters["01"][0],
              this.perimeters["01"][2],
            ]);
            side02 = true;
            if (
              this.expansions["02"] &&
              server._constructionFoundations[this.expansions["02"]]
            )
              server._constructionFoundations[
                this.expansions["02"]
              ].isFullySecured = true;
          } else {
            if (
              this.expansions["02"] &&
              server._constructionFoundations[this.expansions["02"]]
            )
              server._constructionFoundations[
                this.expansions["02"]
              ].isFullySecured = false;
          }
        }
        if (
          this.expansions["03"] &&
          server._constructionFoundations[this.expansions["03"]].isSecured
        ) {
          const expansion =
            server._constructionFoundations[this.expansions["03"]];
          const tempExpansionPolygons: any[] = [];
          tempExpansionPolygons.push([
            expansion.perimeters["01"][0],
            expansion.perimeters["01"][2],
          ]);
          tempExpansionPolygons.push([
            expansion.perimeters["02"][0],
            expansion.perimeters["02"][2],
          ]);
          tempExpansionPolygons.push([
            expansion.perimeters["05"][0],
            expansion.perimeters["05"][2],
          ]);
          if (
            server._constructionFoundations[this.expansions["02"]] &&
            !isArraySumZero(
              server._constructionFoundations[this.expansions["02"]].perimeters[
                "01"
              ]
            )
          ) {
            tempExpansionPolygons.push([
              server._constructionFoundations[this.expansions["02"]].perimeters[
                "01"
              ][0],
              server._constructionFoundations[this.expansions["02"]].perimeters[
                "01"
              ][2],
            ]);
          } else {
            tempExpansionPolygons.push([
              this.perimeters["01"][0],
              this.perimeters["01"][2],
            ]);
          }
          expansion.securedPolygons = tempExpansionPolygons;
          temporaryPolygons.push([
            expansion.perimeters["01"][0],
            expansion.perimeters["01"][2],
          ]);
          side03 = true;
          if (
            !isArraySumZero(this.perimeters["10"]) &&
            !isArraySumZero(this.perimeters["11"]) &&
            !isArraySumZero(this.perimeters["12"])
          ) {
            expansion.isFullySecured = true;
          } else expansion.isFullySecured = false;
        } else {
          if (
            !isArraySumZero(this.perimeters["10"]) &&
            !isArraySumZero(this.perimeters["11"]) &&
            !isArraySumZero(this.perimeters["12"])
          ) {
            temporaryPolygons.push([
              this.perimeters["10"][0],
              this.perimeters["10"][2],
            ]);
            side03 = true;
            if (
              this.expansions["03"] &&
              server._constructionFoundations[this.expansions["03"]]
            )
              server._constructionFoundations[
                this.expansions["03"]
              ].isFullySecured = true;
          } else {
            if (
              this.expansions["03"] &&
              server._constructionFoundations[this.expansions["03"]]
            )
              server._constructionFoundations[
                this.expansions["03"]
              ].isFullySecured = false;
          }
        }
        if (
          this.expansions["04"] &&
          server._constructionFoundations[this.expansions["04"]].isSecured
        ) {
          const expansion =
            server._constructionFoundations[this.expansions["04"]];
          const tempExpansionPolygons: any[] = [];
          tempExpansionPolygons.push([
            expansion.perimeters["01"][0],
            expansion.perimeters["01"][2],
          ]);
          tempExpansionPolygons.push([
            expansion.perimeters["02"][0],
            expansion.perimeters["02"][2],
          ]);
          tempExpansionPolygons.push([
            expansion.perimeters["05"][0],
            expansion.perimeters["05"][2],
          ]);
          if (
            server._constructionFoundations[this.expansions["03"]] &&
            !isArraySumZero(
              server._constructionFoundations[this.expansions["03"]].perimeters[
                "01"
              ]
            )
          ) {
            tempExpansionPolygons.push([
              server._constructionFoundations[this.expansions["03"]].perimeters[
                "01"
              ][0],
              server._constructionFoundations[this.expansions["03"]].perimeters[
                "01"
              ][2],
            ]);
          } else {
            tempExpansionPolygons.push([
              this.perimeters["10"][0],
              this.perimeters["10"][2],
            ]);
          }
          expansion.securedPolygons = tempExpansionPolygons;
          temporaryPolygons.push([
            expansion.perimeters["01"][0],
            expansion.perimeters["01"][2],
          ]);
          side04 = true;
          if (
            !isArraySumZero(this.perimeters["07"]) &&
            !isArraySumZero(this.perimeters["08"]) &&
            !isArraySumZero(this.perimeters["09"])
          ) {
            expansion.isFullySecured = true;
          } else expansion.isFullySecured = false;
        } else {
          if (
            !isArraySumZero(this.perimeters["07"]) &&
            !isArraySumZero(this.perimeters["08"]) &&
            !isArraySumZero(this.perimeters["09"])
          ) {
            temporaryPolygons.push([
              this.perimeters["07"][0],
              this.perimeters["07"][2],
            ]);
            side04 = true;
            if (
              this.expansions["04"] &&
              server._constructionFoundations[this.expansions["04"]]
            )
              server._constructionFoundations[
                this.expansions["04"]
              ].isFullySecured = true;
          } else {
            if (
              this.expansions["04"] &&
              server._constructionFoundations[this.expansions["04"]]
            )
              server._constructionFoundations[
                this.expansions["04"]
              ].isFullySecured = false;
          }
        }
        if (side01 && side02 && side03 && side04) {
          this.isSecured = true;
          this.securedPolygons = temporaryPolygons;
        } else {
          this.isSecured = false;
        }
        break;
      case Items.FOUNDATION_EXPANSION:
        Object.values(this.perimeters).forEach((value: Float32Array) => {
          if (!isArraySumZero(value)) {
            result = false;
          }
        });
        this.isSecured = result;
        if (this.parentObjectCharacterId) {
          server._constructionFoundations[
            this.parentObjectCharacterId
          ].checkPerimeters(server);
        }
        break;
      case Items.GROUND_TAMPER:
        Object.values(this.perimeters).forEach((value: Float32Array) => {
          if (
            !isArraySumZero(value)
          ) {
            result = false;
          }
        });
        if (result) {
          temporaryPolygons.push([
            this.perimeters["13"][0],
            this.perimeters["13"][2],
          ]);
          temporaryPolygons.push([
            this.perimeters["09"][0],
            this.perimeters["09"][2],
          ]);
          temporaryPolygons.push([
            this.perimeters["05"][0],
            this.perimeters["05"][2],
          ]);
          temporaryPolygons.push([
            this.perimeters["01"][0],
            this.perimeters["01"][2],
          ]);
          this.securedPolygons = temporaryPolygons;
        }
        this.isSecured = result;
        break;
      case Items.SHACK:
      case Items.SHACK_SMALL:
      case Items.SHACK_BASIC:
        this.isSecured = isArraySumZero(this.perimeters["01"]) ? false : true;
        if (this.eulerAngle)
          this.securedPolygons = getRectangleCorners(
            this.state.position,
            3.5,
            2.5,
            -this.eulerAngle
          );
        break;
    }
  }
  changePerimeters(
    server: ZoneServer2016,
    slot: string | undefined,
    value: Float32Array
  ) {
    if (!slot) return;
    if (
      this.itemDefinitionId === Items.SHACK ||
      this.itemDefinitionId === Items.SHACK_SMALL ||
      this.itemDefinitionId === Items.SHACK_BASIC
    ) {
      this.perimeters["01"] = value;
      this.checkPerimeters(server);
      return;
    }
    this.perimeters[slot as keyof typeof this.perimeters] = value;
    this.checkPerimeters(server);
  }

  isInside(entity: BaseEntity) {
    switch (this.itemDefinitionId) {
      case Items.FOUNDATION:
      case Items.FOUNDATION_EXPANSION:
      case Items.GROUND_TAMPER:
        return isInside(
          [entity.state.position[0], entity.state.position[2]],
          this.securedPolygons
        );
      case Items.SHACK:
        return isPosInRadiusWithY(
          2.39,
          entity.state.position,
          this.state.position,
          2
        );
      case Items.SHACK_BASIC:
        return isPosInRadiusWithY(
          1,
          entity.state.position,
          this.state.position,
          2
        );
      case Items.SHACK_SMALL:
        return isInsideWithY(
          [entity.state.position[0], entity.state.position[2]],
          this.securedPolygons,
          entity.state.position[1],
          this.state.position[1],
          2.1
        );
      default:
        return false;
    }
  }

  destroy(server: ZoneServer2016, destructTime = 0) {
    server.deleteEntity(
      this.characterId,
      server._constructionFoundations,
      242,
      destructTime
    );
    const foundation =
      server._constructionFoundations[this.parentObjectCharacterId];
    if (!foundation) return;
    if (this.itemDefinitionId == Items.METAL_WALL) {
      foundation.changePerimeters(
        server,
        this.buildingSlot,
        new Float32Array([0, 0, 0, 0])
      );
    }
    if (!this.buildingSlot || !this.parentObjectCharacterId) return;
    delete foundation.expansions[this.buildingSlot];
  }

  // may no longer be needed
  isPerimeterEmpty() {
    for (const perimeter of Object.values(this.perimeters)) {
      if (!isArraySumZero(perimeter)) return false;
    }
    return true;
  }

  isSlotsEmpty() {
    return this.occupiedSlots.length == 0;
  }

  isExpansionSlotsEmpty() {
    return (
      !this.expansions["01"] &&
      !this.expansions["02"] &&
      !this.expansions["03"] &&
      !this.expansions["04"]
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
        Items.WEAPON_HAMMER_DEMOLITION &&
      this.isSlotsEmpty() &&
      this.isExpansionSlotsEmpty()
    );
  }

  getHasPermission(
    server: ZoneServer2016,
    characterId: string,
    permission: ConstructionPermissionIds
  ) {
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

  OnPlayerSelect(server: ZoneServer2016, client: ZoneClient2016) {
    if (this.canUndoPlacement(server, client)) {
      this.destroy(server);
      client.character.lootItem(
        server,
        server.generateItem(this.itemDefinitionId)
      );
      return;
    }

    if (this.ownerCharacterId != client.character.characterId) return;
    server.sendData(
      client,
      "NpcFoundationPermissionsManagerBase.showPermissions",
      {
        characterId: this.characterId,
        characterId2: this.characterId,
        permissions: Object.values(this.permissions),
      }
    );
  }

  OnInteractionString(server: ZoneServer2016, client: ZoneClient2016) {
    if (this.canUndoPlacement(server, client)) {
      server.undoPlacementInteractionString(this, client);
      return;
    }

    if (this.ownerCharacterId != client.character.characterId) return;
    server.sendData(client, "Command.InteractionString", {
      guid: this.characterId,
      stringId: StringIds.PERMISSIONS,
    });
  }
}
